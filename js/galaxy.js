/**
 * Seeded procedural galaxy: station + scavenge nodes, positions, edges.
 */
(function (global) {
  /** Mulberry32 — small deterministic PRNG from a 32-bit seed. */
  function makeRng(seed) {
    var a = seed >>> 0;
    if (a === 0) a = 0x9e3779b9;
    return function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function normalizeSeed(seed) {
    if (seed == null || seed === "") {
      return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
    }
    if (typeof seed === "number" && isFinite(seed)) {
      return seed >>> 0 || 1;
    }
    return hashString(String(seed)) || 1;
  }

  function stationTemplate(id) {
    var list = global.GAME_DATA.stations;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function scavengeTemplate(id) {
    var list = global.GAME_DATA.scavengeSites;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function edgeKey(a, b) {
    return a < b ? a + "|" + b : b + "|" + a;
  }

  /**
   * Build a connected graph of all LORE stations + scavenge sites.
   * Layout: region columns with seeded jitter; connectivity seeded.
   */
  function generate(seedInput) {
    var DATA = global.GAME_DATA;
    var cfg = DATA.galaxy;
    var seed = normalizeSeed(seedInput);
    var rng = makeRng(seed);

    var regionOrder = cfg.regionOrder;
    var colCount = regionOrder.length;
    var usableW = cfg.mapWidth - cfg.paddingX * 2;
    var usableH = cfg.mapHeight - cfg.paddingY * 2;
    var colW = usableW / Math.max(1, colCount - 1);

    // Group station templates by region
    var byRegion = {};
    regionOrder.forEach(function (rid) {
      byRegion[rid] = [];
    });
    DATA.stations.forEach(function (s) {
      if (!byRegion[s.regionId]) byRegion[s.regionId] = [];
      byRegion[s.regionId].push(s);
    });

    var nodes = [];
    var nodeById = {};

    function placeInColumn(regionId, index, count, type, template) {
      var col = regionOrder.indexOf(regionId);
      if (col < 0) col = 0;
      var baseX = cfg.paddingX + col * colW;
      var slotH = usableH / Math.max(1, count + 1);
      var baseY = cfg.paddingY + slotH * (index + 1);
      var jx = (rng() - 0.5) * colW * 0.35;
      var jy = (rng() - 0.5) * slotH * 0.45;
      var node = {
        id: template.id,
        type: type,
        name: template.name,
        regionId: regionId,
        x: Math.round(Math.max(24, Math.min(cfg.mapWidth - 24, baseX + jx))),
        y: Math.round(Math.max(24, Math.min(cfg.mapHeight - 24, baseY + jy))),
      };
      nodes.push(node);
      nodeById[node.id] = node;
      return node;
    }

    regionOrder.forEach(function (rid) {
      var list = byRegion[rid] || [];
      // Stable order with light seed shuffle for layout variety
      var order = list.slice();
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }
      order.forEach(function (s, idx) {
        placeInColumn(rid, idx, order.length, "station", s);
      });
    });

    // Scavenge sites: place in their region column with extra vertical offset
    DATA.scavengeSites.forEach(function (site, idx) {
      var rid = site.regionId || regionOrder[Math.min(idx + 1, regionOrder.length - 1)];
      var peers = (byRegion[rid] || []).length + 1;
      placeInColumn(rid, peers - 0.3 + rng() * 0.2, peers + 1, "scavenge", site);
      // Pull slightly toward inter-region gap
      var n = nodeById[site.id];
      if (n) {
        n.x = Math.round(Math.max(24, Math.min(cfg.mapWidth - 24, n.x + (rng() - 0.5) * 28)));
        n.y = Math.round(Math.max(24, Math.min(cfg.mapHeight - 24, n.y + (rng() - 0.5) * 36)));
      }
    });

    // Edges
    var edges = [];
    var edgeSet = {};

    function addEdge(a, b) {
      if (!a || !b || a === b) return;
      var k = edgeKey(a, b);
      if (edgeSet[k]) return;
      edgeSet[k] = true;
      edges.push({ a: a, b: b });
    }

    // Intra-region: nearest-neighbor chain + optional extras
    regionOrder.forEach(function (rid) {
      var group = nodes.filter(function (n) {
        return n.regionId === rid;
      });
      if (group.length < 2) return;

      // Sort by y for a backbone, then connect sequential
      group.sort(function (p, q) {
        return p.y - q.y;
      });
      for (var i = 0; i < group.length - 1; i++) {
        addEdge(group[i].id, group[i + 1].id);
      }
      // Seeded extra edges to nearest unused neighbor
      var extras = cfg.extraIntraEdges || 0;
      for (var e = 0; e < extras; e++) {
        var from = group[Math.floor(rng() * group.length)];
        var best = null;
        var bestD = Infinity;
        group.forEach(function (other) {
          if (other.id === from.id) return;
          if (edgeSet[edgeKey(from.id, other.id)]) return;
          var d = dist(from, other);
          if (d < bestD) {
            bestD = d;
            best = other;
          }
        });
        if (best) addEdge(from.id, best.id);
      }
    });

    // Bridges between adjacent region columns
    for (var c = 0; c < regionOrder.length - 1; c++) {
      var left = nodes.filter(function (n) {
        return n.regionId === regionOrder[c];
      });
      var right = nodes.filter(function (n) {
        return n.regionId === regionOrder[c + 1];
      });
      if (!left.length || !right.length) continue;

      var pairs = [];
      left.forEach(function (L) {
        right.forEach(function (R) {
          pairs.push({ a: L.id, b: R.id, d: dist(L, R) });
        });
      });
      pairs.sort(function (p, q) {
        return p.d - q.d;
      });

      var bridges = cfg.bridgesPerRegionPair || 1;
      var used = 0;
      for (var p = 0; p < pairs.length && used < bridges; p++) {
        // slight seed skip so bridge choice varies
        if (p > 0 && rng() < 0.25) continue;
        addEdge(pairs[p].a, pairs[p].b);
        used++;
      }
      // guarantee at least one bridge
      if (used === 0 && pairs.length) addEdge(pairs[0].a, pairs[0].b);
    }

    // Ensure full connectivity (union nearest components if needed)
    function components() {
      var seen = {};
      var comps = [];
      nodes.forEach(function (n) {
        if (seen[n.id]) return;
        var stack = [n.id];
        var comp = [];
        seen[n.id] = true;
        while (stack.length) {
          var id = stack.pop();
          comp.push(id);
          edges.forEach(function (ed) {
            var other = ed.a === id ? ed.b : ed.b === id ? ed.a : null;
            if (other && !seen[other]) {
              seen[other] = true;
              stack.push(other);
            }
          });
        }
        comps.push(comp);
      });
      return comps;
    }

    var comps = components();
    while (comps.length > 1) {
      var bestPair = null;
      var bestD = Infinity;
      for (var i = 0; i < comps[0].length; i++) {
        for (var j = 1; j < comps.length; j++) {
          for (var k = 0; k < comps[j].length; k++) {
            var A = nodeById[comps[0][i]];
            var B = nodeById[comps[j][k]];
            var d = dist(A, B);
            if (d < bestD) {
              bestD = d;
              bestPair = { a: A.id, b: B.id, compJ: j };
            }
          }
        }
      }
      if (!bestPair) break;
      addEdge(bestPair.a, bestPair.b);
      comps = components();
    }

    // Adjacency map
    var adj = {};
    nodes.forEach(function (n) {
      adj[n.id] = [];
    });
    edges.forEach(function (ed) {
      adj[ed.a].push(ed.b);
      adj[ed.b].push(ed.a);
    });

    return {
      seed: seed,
      width: cfg.mapWidth,
      height: cfg.mapHeight,
      nodes: nodes,
      edges: edges,
      adj: adj,
    };
  }

  function getNode(galaxy, id) {
    for (var i = 0; i < galaxy.nodes.length; i++) {
      if (galaxy.nodes[i].id === id) return galaxy.nodes[i];
    }
    return null;
  }

  function isConnected(galaxy, fromId, toId) {
    var list = galaxy.adj[fromId] || [];
    return list.indexOf(toId) !== -1;
  }

  function fuelCost(galaxy, fromId, toId) {
    var cfg = global.GAME_DATA.galaxy;
    var a = getNode(galaxy, fromId);
    var b = getNode(galaxy, toId);
    if (!a || !b) return Infinity;
    var d = dist(a, b);
    return Math.max(cfg.minFuelCost, Math.round(d * cfg.fuelPerUnit));
  }

  function neighbors(galaxy, id) {
    return (galaxy.adj[id] || []).slice();
  }

  global.Galaxy = {
    generate: generate,
    makeRng: makeRng,
    normalizeSeed: normalizeSeed,
    getNode: getNode,
    isConnected: isConnected,
    fuelCost: fuelCost,
    neighbors: neighbors,
    stationTemplate: stationTemplate,
    scavengeTemplate: scavengeTemplate,
  };
})(window);
