/**
 * Core game state: trading, travel, scavenge extraction.
 */
(function (global) {
  var DATA = null;

  function ensureData() {
    if (!DATA) DATA = global.GAME_DATA;
    return DATA;
  }

  function commodityById(id) {
    ensureData();
    var list = DATA.commodities;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function stationById(id) {
    ensureData();
    var list = DATA.stations;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function scavengeById(id) {
    ensureData();
    var list = DATA.scavengeSites;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function regionById(id) {
    ensureData();
    return DATA.regions[id] || null;
  }

  function currentNode(state) {
    return global.Galaxy.getNode(state.galaxy, state.locationId);
  }

  function isAtStation(state) {
    var n = currentNode(state);
    return !!(n && n.type === "station");
  }

  function isAtScavenge(state) {
    var n = currentNode(state);
    return !!(n && n.type === "scavenge");
  }

  function locationLabel(state) {
    var n = currentNode(state);
    return n ? n.name : state.locationId;
  }

  function randNoise(state) {
    var m = DATA.market;
    var r = state.rng ? state.rng() : Math.random();
    return m.noiseMin + r * (m.noiseMax - m.noiseMin);
  }

  function rollVisitNoise(state) {
    state.priceNoise = {};
    DATA.commodities.forEach(function (c) {
      state.priceNoise[c.id] = randNoise(state);
    });
  }

  function ensureSupply(state, stationId) {
    if (!state.supply[stationId]) {
      state.supply[stationId] = {};
      DATA.commodities.forEach(function (c) {
        state.supply[stationId][c.id] = DATA.market.baseSupply;
      });
    }
  }

  function cargoUsed(state) {
    var total = 0;
    Object.keys(state.cargo).forEach(function (id) {
      total += state.cargo[id] || 0;
    });
    return total;
  }

  function cargoQty(state, goodId) {
    return state.cargo[goodId] || 0;
  }

  function freeCargo(state) {
    return state.ship.cargoCapacity - cargoUsed(state);
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  /** Station-faction standing → buy/sell multipliers (better rep = better deals). */
  function reputationPriceMods(state, factionId) {
    var eco = DATA.reputationEconomy || {};
    var rep = 0;
    if (factionId && state.reputation && typeof state.reputation[factionId] === "number") {
      rep = state.reputation[factionId];
    }
    var t = clamp(rep, -100, 100) / 100;
    var buyDiscount = eco.buyDiscountAtMax != null ? eco.buyDiscountAtMax : 0.14;
    var sellBonus = eco.sellBonusAtMax != null ? eco.sellBonusAtMax : 0.1;
    var buyMult = 1 - t * buyDiscount;
    var sellMult = 1 + t * sellBonus;
    var minM = eco.minMult != null ? eco.minMult : 0.86;
    var maxM = eco.maxMult != null ? eco.maxMult : 1.16;
    return {
      rep: rep,
      buyMult: clamp(buyMult, minM, maxM),
      sellMult: clamp(sellMult, minM, maxM),
    };
  }

  function pricesFor(state, goodId) {
    var good = commodityById(goodId);
    var station = stationById(state.locationId);
    var m = DATA.market;
    if (!good || !station) return { buy: 0, sell: 0, mid: 0, rep: 0 };

    ensureSupply(state, state.locationId);
    var mod = station.priceMods[goodId] != null ? station.priceMods[goodId] : 1;
    var noise = state.priceNoise[goodId] != null ? state.priceNoise[goodId] : 1;
    var stock = state.supply[state.locationId][goodId];
    var supplyFactor = 1 + (m.baseSupply - stock) * 0.012;
    var mid = Math.round(good.basePrice * mod * noise * supplyFactor);
    mid = Math.max(m.minPrice, mid);
    var rmod = reputationPriceMods(state, station.factionId);
    var buy = Math.max(
      m.minPrice,
      Math.round(mid * m.buySpread * rmod.buyMult)
    );
    var sell = Math.max(
      m.minPrice,
      Math.round(mid * m.sellSpread * rmod.sellMult)
    );
    if (sell > buy) sell = buy;
    return {
      buy: buy,
      sell: sell,
      mid: mid,
      rep: rmod.rep,
      buyMult: rmod.buyMult,
      sellMult: rmod.sellMult,
      factionId: station.factionId,
    };
  }

  function initScavengePools(state) {
    state.scavengePools = {};
    DATA.scavengeSites.forEach(function (site) {
      state.scavengePools[site.id] = {
        remaining: site.poolMax,
        max: site.poolMax,
      };
    });
  }

  /** Slow regen for every scavenge site (called on each travel hop). */
  function regenerateScavengePools(state) {
    DATA.scavengeSites.forEach(function (site) {
      var pool = state.scavengePools[site.id];
      if (!pool) return;
      var regen = site.regenPerTurn || 0;
      if (regen > 0 && pool.remaining < pool.max) {
        pool.remaining = Math.min(pool.max, pool.remaining + regen);
      }
    });
  }

  function pickLootGood(site, rng) {
    var total = 0;
    site.loot.forEach(function (L) {
      total += L.weight;
    });
    var roll = (rng ? rng() : Math.random()) * total;
    var acc = 0;
    for (var i = 0; i < site.loot.length; i++) {
      acc += site.loot[i].weight;
      if (roll <= acc) return site.loot[i].goodId;
    }
    return site.loot[site.loot.length - 1].goodId;
  }

  /**
   * @param {number|string} [seed]
   */
  function createState(seed) {
    DATA = global.GAME_DATA;
    var start = DATA.start;
    var galaxy = global.Galaxy.generate(seed);
    var rng = global.Galaxy.makeRng(galaxy.seed ^ 0xa5a5a5a5);

    var state = {
      seed: galaxy.seed,
      galaxy: galaxy,
      rng: rng,
      locationId: start.stationId,
      selectedDestId: null,
      credits: start.credits,
      debt: start.debt,
      cargo: {},
      ship: {
        name: start.ship.name,
        cargoCapacity: start.ship.cargoCapacity,
        fuelCapacity: start.ship.fuelCapacity,
        fuel: start.ship.fuel,
        hull: start.ship.hull,
        hullMax: start.ship.hullMax,
        weaponSlots: start.ship.weaponSlots,
        speed: start.ship.speed,
      },
      supply: {},
      priceNoise: {},
      lastMessage: "",
      reputation: {},
      turn: 0,
      scavengePools: {},
      activeEncounter: null,
      pendingTravel: null,
    };

    Object.keys(DATA.factions).forEach(function (fid) {
      state.reputation[fid] = DATA.factions[fid].startRep;
    });

    Object.keys(start.cargo || {}).forEach(function (id) {
      state.cargo[id] = start.cargo[id];
    });

    initScavengePools(state);

    if (!global.Galaxy.getNode(galaxy, state.locationId)) {
      // Fallback: first station node if start missing from graph
      var firstStation = galaxy.nodes.find
        ? galaxy.nodes.find(function (n) {
            return n.type === "station";
          })
        : null;
      if (!firstStation) {
        for (var i = 0; i < galaxy.nodes.length; i++) {
          if (galaxy.nodes[i].type === "station") {
            firstStation = galaxy.nodes[i];
            break;
          }
        }
      }
      if (firstStation) state.locationId = firstStation.id;
    }

    if (isAtStation(state)) {
      ensureSupply(state, state.locationId);
      rollVisitNoise(state);
    }

    state.lastMessage =
      "Galaxy seed " + state.seed + ". Docked at " + locationLabel(state) + ".";
    return state;
  }

  /**
   * Start a new galaxy with a different seed (keeps credits/cargo optional reset).
   * Full new game for layout testing.
   */
  function newGalaxy(seed) {
    return createState(seed);
  }

  function buy(state, goodId, qty) {
    ensureData();
    qty = Math.floor(Number(qty));
    if (!isFinite(qty) || qty < 1) return { ok: false, error: "Invalid quantity." };
    if (!isAtStation(state)) {
      return { ok: false, error: "No market at this site." };
    }

    var good = commodityById(goodId);
    if (!good) return { ok: false, error: "Unknown good." };

    var used = cargoUsed(state);
    if (used + qty > state.ship.cargoCapacity) {
      return {
        ok: false,
        error: "Hold full — free space: " + (state.ship.cargoCapacity - used) + ".",
      };
    }

    var price = pricesFor(state, goodId).buy;
    var total = price * qty;
    if (state.credits < total) {
      return { ok: false, error: "Not enough credits (need " + total + " cr)." };
    }

    state.credits -= total;
    state.cargo[goodId] = cargoQty(state, goodId) + qty;
    ensureSupply(state, state.locationId);
    state.supply[state.locationId][goodId] = Math.max(
      0,
      state.supply[state.locationId][goodId] - qty * DATA.market.supplyStep
    );
    state.lastMessage =
      "Bought " + qty + "× " + good.name + " for " + total + " cr (" + price + " each).";
    return { ok: true };
  }

  function sell(state, goodId, qty) {
    ensureData();
    qty = Math.floor(Number(qty));
    if (!isFinite(qty) || qty < 1) return { ok: false, error: "Invalid quantity." };
    if (!isAtStation(state)) {
      return { ok: false, error: "No market at this site." };
    }

    var good = commodityById(goodId);
    if (!good) return { ok: false, error: "Unknown good." };

    var have = cargoQty(state, goodId);
    if (have < qty) {
      return { ok: false, error: "Only " + have + "× " + good.name + " in hold." };
    }

    var price = pricesFor(state, goodId).sell;
    var total = price * qty;
    state.credits += total;
    state.cargo[goodId] = have - qty;
    if (state.cargo[goodId] === 0) delete state.cargo[goodId];

    ensureSupply(state, state.locationId);
    state.supply[state.locationId][goodId] += qty * DATA.market.supplyStep;
    state.lastMessage =
      "Sold " + qty + "× " + good.name + " for " + total + " cr (" + price + " each).";
    return { ok: true };
  }

  /**
   * Finalize arrival after fuel already committed (and optional en-route encounter).
   */
  function completeTravel(state, destId, fuelCost, opts) {
    ensureData();
    opts = opts || {};
    var dest = global.Galaxy.getNode(state.galaxy, destId);
    if (!dest) return { ok: false, error: "Unknown destination." };

    state.locationId = destId;
    state.selectedDestId = null;
    state.turn += 1;
    regenerateScavengePools(state);

    var arrival;
    if (dest.type === "station") {
      ensureSupply(state, destId);
      rollVisitNoise(state);
      arrival =
        "Arrived at " +
        dest.name +
        " (−" +
        fuelCost +
        " fuel). Market noise refreshed.";
    } else {
      var pool = state.scavengePools[destId];
      var left = pool ? pool.remaining : 0;
      arrival =
        "Arrived at " +
        dest.name +
        " (−" +
        fuelCost +
        " fuel). Salvage pool: " +
        left +
        ".";
    }

    // Keep encounter resolution readable — do not erase it with arrival alone.
    if (opts.afterEncounter && state.lastEncounterSummary) {
      state.lastMessage = state.lastEncounterSummary + "\n\n" + arrival;
    } else {
      state.lastMessage = arrival;
    }
    return { ok: true, fuelCost: fuelCost, arrived: true, encounter: false };
  }

  /**
   * Travel to a connected node. May interrupt with an en-route encounter.
   */
  function travel(state, destId) {
    ensureData();
    if (state.activeEncounter) {
      return { ok: false, error: "Resolve the current encounter first." };
    }
    if (destId === state.locationId) {
      return { ok: false, error: "Already here." };
    }
    if (!global.Galaxy.isConnected(state.galaxy, state.locationId, destId)) {
      return { ok: false, error: "No lane to that destination." };
    }

    var cost = global.Galaxy.fuelCost(state.galaxy, state.locationId, destId);
    if (state.ship.fuel < cost) {
      return {
        ok: false,
        error: "Not enough fuel (need " + cost + ", have " + state.ship.fuel + ").",
      };
    }

    var dest = global.Galaxy.getNode(state.galaxy, destId);
    if (!dest) return { ok: false, error: "Unknown destination." };

    // Commit fuel at departure; arrival may wait on encounter resolution
    state.ship.fuel -= cost;
    state.selectedDestId = null;

    if (global.Encounters) {
      var template = global.Encounters.rollForTravel(state, destId);
      if (template) {
        state.pendingTravel = { destId: destId, fuelCost: cost };
        state.activeEncounter = global.Encounters.start(state, template, {
          destId: destId,
          fuelCost: cost,
          routeFaction: global.Encounters.routeFaction(state, destId),
        });
        state.lastMessage = "En route — " + template.title + ".";
        return {
          ok: true,
          fuelCost: cost,
          encounter: true,
          arrived: false,
        };
      }
    }

    return completeTravel(state, destId, cost, {});
  }

  /**
   * Extract salvage up to free cargo space and remaining pool.
   * Pool state persists per site; regen happens on travel turns.
   */
  function extractScavenge(state) {
    ensureData();
    if (!isAtScavenge(state)) {
      return { ok: false, error: "Not at a scavenge site." };
    }

    var site = scavengeById(state.locationId);
    var pool = state.scavengePools[state.locationId];
    if (!site || !pool) return { ok: false, error: "Unknown scavenge site." };

    if (pool.remaining <= 0) {
      return {
        ok: false,
        error: "Pool depleted — wait for slow regeneration, or try another site.",
      };
    }

    var space = freeCargo(state);
    if (space <= 0) {
      return { ok: false, error: "Hold full — free space: 0." };
    }

    var take = Math.min(space, pool.remaining);
    var gained = {};
    for (var i = 0; i < take; i++) {
      var gid = pickLootGood(site, state.rng);
      gained[gid] = (gained[gid] || 0) + 1;
      state.cargo[gid] = cargoQty(state, gid) + 1;
    }
    pool.remaining -= take;

    var parts = Object.keys(gained).map(function (gid) {
      var g = commodityById(gid);
      return gained[gid] + "× " + (g ? g.name : gid);
    });

    state.lastMessage =
      "Extracted " +
      take +
      " salvage (" +
      parts.join(", ") +
      "). Pool left: " +
      pool.remaining +
      "/" +
      pool.max +
      ".";
    return { ok: true, taken: take, gained: gained };
  }

  function scavengePoolInfo(state, siteId) {
    var id = siteId || state.locationId;
    var pool = state.scavengePools[id];
    var site = scavengeById(id);
    if (!pool || !site) return null;
    return {
      remaining: pool.remaining,
      max: pool.max,
      name: site.name,
      theme: site.theme,
      flavor: site.flavor,
      regenPerTurn: site.regenPerTurn || 0,
    };
  }

  global.Trading = {
    createState: createState,
    newGalaxy: newGalaxy,
    buy: buy,
    sell: sell,
    travel: travel,
    completeTravel: completeTravel,
    extractScavenge: extractScavenge,
    pricesFor: pricesFor,
    reputationPriceMods: reputationPriceMods,
    cargoUsed: cargoUsed,
    cargoQty: cargoQty,
    freeCargo: freeCargo,
    commodityById: commodityById,
    stationById: stationById,
    scavengeById: scavengeById,
    regionById: regionById,
    rollVisitNoise: rollVisitNoise,
    currentNode: currentNode,
    isAtStation: isAtStation,
    isAtScavenge: isAtScavenge,
    locationLabel: locationLabel,
    scavengePoolInfo: scavengePoolInfo,
  };
})(window);
