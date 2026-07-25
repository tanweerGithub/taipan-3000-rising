/**
 * Taipan 3000: Rising — UI: nav, trading, galaxy map, scavenge.
 */
(function () {
  var SCREEN_IDS = ["station", "galaxy", "tavern", "ship"];
  var state = null;

  function showScreen(id) {
    if (SCREEN_IDS.indexOf(id) === -1) return;

    SCREEN_IDS.forEach(function (name) {
      var section = document.getElementById("screen-" + name);
      var navBtn = document.querySelector('.nav-btn[data-screen="' + name + '"]');
      var active = name === id;

      if (section) {
        section.classList.toggle("is-active", active);
        if (active) {
          section.removeAttribute("hidden");
        } else {
          section.setAttribute("hidden", "");
        }
      }

      if (navBtn) {
        navBtn.classList.toggle("is-active", active);
        if (active) {
          navBtn.setAttribute("aria-current", "page");
        } else {
          navBtn.removeAttribute("aria-current");
        }
      }
    });

    if (id === "station") renderDock();
    if (id === "ship") renderShip();
    if (id === "galaxy") renderGalaxy();
  }

  function el(id) {
    return document.getElementById(id);
  }

  function renderHud() {
    var used = Trading.cargoUsed(state);
    var cap = state.ship.cargoCapacity;
    var node = Trading.currentNode(state);
    var prefix = node && node.type === "scavenge" ? "On site: " : "Docked: ";

    el("hud-location").textContent = prefix + Trading.locationLabel(state);
    el("hud-credits").textContent = String(state.credits);
    el("hud-debt").textContent = String(state.debt);
    el("hud-fuel").textContent = state.ship.fuel + " / " + state.ship.fuelCapacity;
    el("hud-hull").textContent = state.ship.hull + " / " + state.ship.hullMax;
    el("hud-cargo").textContent = used + " / " + cap;
    renderRepStrip();
    renderEncounterOverlay();
  }

  function renderRepStrip() {
    var strip = el("rep-strip");
    if (!strip) return;
    strip.innerHTML = "";
    Object.keys(window.GAME_DATA.factions).forEach(function (fid) {
      var f = window.GAME_DATA.factions[fid];
      var v = state.reputation[fid] != null ? state.reputation[fid] : 0;
      var span = document.createElement("span");
      span.className = "rep-chip" + (v < 0 ? " is-bad" : v > 0 ? " is-good" : "");
      span.title = f.name + " standing";
      span.textContent = f.name.replace(/^The /, "") + " " + (v > 0 ? "+" : "") + v;
      strip.appendChild(span);
    });
  }

  function renderHoldAside() {
    var used = Trading.cargoUsed(state);
    el("hold-summary").textContent =
      "Capacity: " + used + " / " + state.ship.cargoCapacity;

    var holdList = el("hold-list");
    holdList.innerHTML = "";
    var ids = Object.keys(state.cargo);
    if (ids.length === 0) {
      var empty = document.createElement("li");
      empty.innerHTML = 'Hold empty <span class="muted">(buy or scavenge)</span>';
      holdList.appendChild(empty);
    } else {
      ids.forEach(function (id) {
        var g = Trading.commodityById(id);
        var li = document.createElement("li");
        li.textContent = (g ? g.name : id) + " × " + state.cargo[id];
        holdList.appendChild(li);
      });
    }
  }

  function setMarketMessage(text) {
    var msg = el("market-message");
    if (!msg) return;
    msg.textContent = text || "";
    msg.hidden = !text;
  }

  function renderDock() {
    var marketPanel = el("panel-market");
    var scavengePanel = el("panel-scavenge");

    if (Trading.isAtScavenge(state)) {
      marketPanel.hidden = true;
      scavengePanel.hidden = false;
      renderScavengeDock();
    } else {
      marketPanel.hidden = false;
      scavengePanel.hidden = true;
      renderMarketDock();
    }
    renderHoldAside();
    setMarketMessage(state.lastMessage);
    renderHud();
  }

  function renderMarketDock() {
    var station = Trading.stationById(state.locationId);
    if (!station) return;

    var region = Trading.regionById(station.regionId);
    var faction = window.GAME_DATA.factions[station.factionId];

    var rmod = Trading.reputationPriceMods(state, station.factionId);
    var repLabel =
      (rmod.rep > 0 ? "+" : "") +
      rmod.rep +
      " standing · buy ×" +
      rmod.buyMult.toFixed(2) +
      " / sell ×" +
      rmod.sellMult.toFixed(2);

    el("station-heading").textContent = station.name + " — Market";
    el("station-sub").textContent =
      (region ? region.name : "") +
      (faction ? " · " + faction.name : "") +
      " — " +
      repLabel;

    var flavor = el("station-flavor");
    if (flavor) flavor.textContent = "“" + station.flavor + "”";

    var tbody = el("market-body");
    tbody.innerHTML = "";
    var used = Trading.cargoUsed(state);

    window.GAME_DATA.commodities.forEach(function (good) {
      var prices = Trading.pricesFor(state, good.id);
      var held = Trading.cargoQty(state, good.id);
      var tr = document.createElement("tr");

      var nameCell = document.createElement("td");
      nameCell.textContent = good.name + " ";
      if (good.legal === false) {
        var tag = document.createElement("span");
        tag.className = "tag tag-warn";
        tag.textContent = "contraband";
        nameCell.appendChild(tag);
      } else if (good.legal === "restricted") {
        var tagR = document.createElement("span");
        tagR.className = "tag tag-muted";
        tagR.textContent = "restricted";
        nameCell.appendChild(tagR);
      }

      var buyTd = document.createElement("td");
      buyTd.className = "num";
      buyTd.textContent = prices.buy;

      var sellTd = document.createElement("td");
      sellTd.className = "num";
      sellTd.textContent = prices.sell;

      var heldTd = document.createElement("td");
      heldTd.className = "num";
      heldTd.textContent = String(held);

      var actionTd = document.createElement("td");
      actionTd.className = "actions";

      var buyBtn = document.createElement("button");
      buyBtn.type = "button";
      buyBtn.className = "btn btn-small";
      buyBtn.textContent = "Buy 1";
      buyBtn.setAttribute("data-trade", "buy");
      buyBtn.setAttribute("data-good", good.id);
      if (state.credits < prices.buy || used >= state.ship.cargoCapacity) {
        buyBtn.disabled = true;
      }

      var sellBtn = document.createElement("button");
      sellBtn.type = "button";
      sellBtn.className = "btn btn-small btn-ghost";
      sellBtn.textContent = "Sell 1";
      sellBtn.setAttribute("data-trade", "sell");
      sellBtn.setAttribute("data-good", good.id);
      if (held < 1) sellBtn.disabled = true;

      actionTd.appendChild(buyBtn);
      actionTd.appendChild(document.createTextNode(" "));
      actionTd.appendChild(sellBtn);

      tr.appendChild(nameCell);
      tr.appendChild(buyTd);
      tr.appendChild(sellTd);
      tr.appendChild(heldTd);
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });
  }

  function renderScavengeDock() {
    var info = Trading.scavengePoolInfo(state);
    if (!info) return;

    el("station-heading").textContent = info.name + " — Scavenge Site";
    el("station-sub").textContent =
      info.theme + " · no market — extract salvage into free cargo space.";

    var flavor = el("station-flavor");
    if (flavor) flavor.textContent = "“" + (info.flavor || info.theme) + "”";

    el("scavenge-pool").textContent = info.remaining + " / " + info.max;
    el("scavenge-regen").textContent =
      "+" + info.regenPerTurn + " pool per travel turn (while below max)";

    var extractBtn = el("btn-extract");
    if (extractBtn) {
      extractBtn.disabled = info.remaining <= 0 || Trading.freeCargo(state) <= 0;
    }
  }

  function renderShip() {
    el("ship-stat-cargo").textContent = String(state.ship.cargoCapacity);
    el("ship-stat-fuel").textContent = String(state.ship.fuelCapacity);
    el("ship-stat-hull").textContent = state.ship.hull + " / " + state.ship.hullMax;
    el("ship-stat-weapons").textContent = state.ship.weaponSlots + " slots";
    el("ship-stat-speed").textContent = String(state.ship.speed);
    renderHud();
  }

  function svgEl(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  function renderGalaxy() {
    var g = state.galaxy;
    el("galaxy-seed").textContent = String(state.seed);
    el("galaxy-sub").textContent =
      "Click a connected node to select it, then Travel — or double-click / use Travel. Seed " +
      state.seed +
      ".";

    var svg = el("galaxy-svg");
    svg.setAttribute("viewBox", "0 0 " + g.width + " " + g.height);
    svg.innerHTML = "";

    // Edges
    g.edges.forEach(function (ed) {
      var a = Galaxy.getNode(g, ed.a);
      var b = Galaxy.getNode(g, ed.b);
      if (!a || !b) return;
      var connectedToHere =
        (ed.a === state.locationId || ed.b === state.locationId);
      var line = svgEl("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        class: "map-edge" + (connectedToHere ? " is-lane" : ""),
      });
      svg.appendChild(line);
    });

    // Nodes
    g.nodes.forEach(function (n) {
      var isHere = n.id === state.locationId;
      var isSel = n.id === state.selectedDestId;
      var canReach = Galaxy.isConnected(g, state.locationId, n.id);
      var group = svgEl("g", {
        class:
          "map-node" +
          (isHere ? " is-current" : "") +
          (isSel ? " is-selected" : "") +
          (n.type === "scavenge" ? " is-scavenge" : "") +
          (canReach ? " is-reachable" : ""),
        "data-node-id": n.id,
        role: "button",
        tabindex: "0",
        "aria-label": n.name + (n.type === "scavenge" ? " (scavenge)" : " (station)"),
      });

      var r = isHere ? 14 : n.type === "scavenge" ? 10 : 12;
      group.appendChild(
        svgEl("circle", {
          cx: n.x,
          cy: n.y,
          r: String(r),
        })
      );

      if (n.type === "scavenge") {
        // diamond hint via second small circle stroke handled in CSS
        group.appendChild(
          svgEl("circle", {
            cx: n.x,
            cy: n.y,
            r: String(r - 4),
            class: "map-node-inner",
          })
        );
      }

      var label = svgEl("text", {
        x: n.x,
        y: n.y + r + 14,
        "text-anchor": "middle",
      });
      label.textContent = n.name;
      group.appendChild(label);

      svg.appendChild(group);
    });

    renderDestinationPanel();
    renderGalaxyList();
    renderHud();
  }

  function renderDestinationPanel() {
    var box = el("dest-details");
    var travelBtn = el("btn-travel");
    var destId = state.selectedDestId;

    if (!destId || destId === state.locationId) {
      box.innerHTML =
        "<p>Select a <strong>connected</strong> station or scavenge site on the map.</p>" +
        '<p class="muted">You are at ' +
        Trading.locationLabel(state) +
        ".</p>";
      travelBtn.disabled = true;
      return;
    }

    var node = Galaxy.getNode(state.galaxy, destId);
    if (!node) {
      box.textContent = "Unknown destination.";
      travelBtn.disabled = true;
      return;
    }

    var linked = Galaxy.isConnected(state.galaxy, state.locationId, destId);
    var cost = Galaxy.fuelCost(state.galaxy, state.locationId, destId);
    var region = Trading.regionById(node.regionId);
    var typeLabel = node.type === "scavenge" ? "Scavenge site" : "Trade station";

    var html =
      "<p><strong>" +
      node.name +
      "</strong></p>" +
      "<p class=\"muted\">" +
      typeLabel +
      (region ? " · " + region.name : "") +
      "</p>";

    if (!linked) {
      html += '<p class="warn-text">No direct lane from your current position.</p>';
      travelBtn.disabled = true;
    } else {
      html +=
        "<p>Fuel cost: <span class=\"num-inline\">" +
        cost +
        "</span> · You have " +
        state.ship.fuel +
        "</p>";
      if (node.type === "scavenge") {
        var pool = state.scavengePools[node.id];
        if (pool) {
          html +=
            "<p>Salvage pool: " + pool.remaining + " / " + pool.max + "</p>";
        }
      }
      if (state.ship.fuel < cost) {
        html += '<p class="warn-text">Not enough fuel for this hop.</p>';
        travelBtn.disabled = true;
      } else {
        travelBtn.disabled = false;
      }
    }

    box.innerHTML = html;
  }

  function renderGalaxyList() {
    var list = el("galaxy-region-list");
    if (!list) return;
    list.innerHTML = "";
    state.galaxy.nodes.forEach(function (n) {
      var region = Trading.regionById(n.regionId);
      var li = document.createElement("li");
      var here = n.id === state.locationId ? " ← you are here" : "";
      var kind = n.type === "scavenge" ? " [scavenge]" : "";
      li.textContent =
        n.name +
        kind +
        " (" +
        (region ? region.name : "?") +
        ")" +
        here;
      list.appendChild(li);
    });
  }

  function selectDestination(nodeId) {
    if (!nodeId || nodeId === state.locationId) {
      state.selectedDestId = null;
    } else {
      state.selectedDestId = nodeId;
    }
    renderGalaxy();
  }

  function doTravel() {
    if (!state.selectedDestId) return;
    if (state.activeEncounter) return;
    var result = Trading.travel(state, state.selectedDestId);
    if (!result.ok) {
      state.lastMessage = result.error || "Travel failed.";
      renderGalaxy();
      setMarketMessage(state.lastMessage);
      return;
    }
    if (result.encounter) {
      renderHud();
      renderEncounterOverlay();
      return;
    }
    renderGalaxy();
    renderHud();
  }

  function renderEncounterOverlay() {
    var overlay = el("encounter-overlay");
    if (!overlay) return;

    var active = state.activeEncounter;
    var resolution = state.pendingEncounterResult;

    if (!active && !resolution) {
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      return;
    }

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");

    var disengageBtn = el("btn-encounter-disengage");
    var oddsEl = el("encounter-odds");
    var choicesEl = el("encounter-choices");
    var logEl = el("encounter-log");
    var hintEl = document.querySelector(".encounter-dismiss-hint");

    // Closing beat: show outcome before travel arrival replaces the scene
    if (resolution && !active) {
      if (disengageBtn) disengageBtn.hidden = true;
      if (hintEl) hintEl.hidden = true;
      el("encounter-kicker").textContent = "Encounter resolved";
      el("encounter-title").textContent = resolution.title || "Outcome";
      el("encounter-text").textContent = resolution.summary || resolution.text || "";
      logEl.hidden = true;
      logEl.innerHTML = "";
      oddsEl.textContent =
        "Read the outcome, then continue to finish the hop and return to the map.";
      choicesEl.innerHTML = "";
      var cont = document.createElement("button");
      cont.type = "button";
      cont.className = "btn";
      cont.id = "btn-encounter-continue";
      cont.textContent = "Continue to destination";
      choicesEl.appendChild(cont);
      return;
    }

    if (disengageBtn) disengageBtn.hidden = false;
    if (hintEl) hintEl.hidden = false;

    var node = Encounters.currentNode(active);
    el("encounter-kicker").textContent =
      (active.tier === "deep" ? "Deep encounter" : "Quick encounter") +
      (active.faction && window.GAME_DATA.factions[active.faction]
        ? " · " + window.GAME_DATA.factions[active.faction].name
        : "");
    el("encounter-title").textContent = active.title;
    el("encounter-text").textContent = node ? node.text : "";

    if (active.log && active.log.length) {
      logEl.hidden = false;
      logEl.innerHTML = active.log
        .map(function (line) {
          return "<p>" + escapeHtml(line) + "</p>";
        })
        .join("");
    } else {
      logEl.hidden = true;
      logEl.innerHTML = "";
    }

    oddsEl.textContent =
      "Rolls show clear odds. Ship weapons, speed, hull, and standing nudge the dice. " +
      "Greyed options cost more than you can pay right now.";

    choicesEl.innerHTML = "";
    if (!node) return;

    node.choices.forEach(function (choice, idx) {
      var pres = Encounters.choicePresentation(state, choice);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn encounter-choice";
      btn.setAttribute("data-encounter-choice", String(idx));
      if (pres.disabled) {
        btn.disabled = true;
        btn.title = pres.unaffordableReason || "Cannot afford this option";
      }

      var label = document.createElement("span");
      label.className = "encounter-choice-label";
      label.textContent = pres.label;
      btn.appendChild(label);

      if (pres.chance != null) {
        var ch = document.createElement("span");
        ch.className = "encounter-choice-odds";
        ch.textContent = " ~" + Math.round(pres.chance * 100) + "%";
        btn.appendChild(ch);
      }
      if (pres.disabled && pres.unaffordableReason) {
        var need = document.createElement("span");
        need.className = "encounter-choice-hint";
        need.textContent = pres.unaffordableReason;
        btn.appendChild(need);
      } else if (pres.hint) {
        var hint = document.createElement("span");
        hint.className = "encounter-choice-hint";
        hint.textContent = pres.hint;
        btn.appendChild(hint);
      }
      choicesEl.appendChild(btn);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function finishEncounterArrival() {
    if (state.pendingTravel) {
      Encounters.finishPendingTravel(state);
    }
    state.pendingEncounterResult = null;
    renderEncounterOverlay();
    renderHud();
    var screen = document.querySelector(".screen.is-active");
    if (screen && screen.id === "screen-galaxy") renderGalaxy();
    else if (screen && screen.id === "screen-station") renderDock();
    else {
      showScreen("galaxy");
    }
    setMarketMessage(state.lastMessage);
  }

  /** Show outcome in the panel first; arrival runs when the player continues. */
  function showEncounterResolution(result, title) {
    state.pendingEncounterResult = {
      title: title || "Outcome",
      summary: result.summary || result.text || state.lastEncounterSummary || "",
      text: result.text || "",
    };
    renderEncounterOverlay();
    renderHud();
  }

  function handleEncounterChoice(idx) {
    if (!state.activeEncounter) return;
    var title = state.activeEncounter.title;
    var result = Encounters.choose(state, state.activeEncounter, idx);
    if (!result.ok) {
      state.lastMessage = result.error || "Choice failed.";
      // Keep them in the encounter; flash the error in odds line via re-render + message
      renderEncounterOverlay();
      var oddsEl = el("encounter-odds");
      if (oddsEl) oddsEl.textContent = result.error || "Choice failed.";
      return;
    }

    if (result.done) {
      showEncounterResolution(result, title);
      return;
    }

    // Continue deep branch
    renderEncounterOverlay();
    renderHud();
  }

  function handleEncounterDisengage() {
    if (!state.activeEncounter) return;
    var title = state.activeEncounter.title;
    var result = Encounters.disengage(state);
    if (!result.ok) {
      state.lastMessage = result.error || "Could not leave encounter.";
      return;
    }
    showEncounterResolution(result, title);
  }

  function handleTradeClick(event) {
    var btn = event.target.closest("[data-trade]");
    if (!btn || btn.disabled) return;

    var action = btn.getAttribute("data-trade");
    var goodId = btn.getAttribute("data-good");
    var result =
      action === "buy"
        ? Trading.buy(state, goodId, 1)
        : Trading.sell(state, goodId, 1);

    if (!result.ok) {
      state.lastMessage = result.error || "Trade failed.";
    }
    renderDock();
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("#btn-encounter-continue")) {
      finishEncounterArrival();
      return;
    }

    var encChoice = event.target.closest("[data-encounter-choice]");
    if (encChoice) {
      if (encChoice.disabled) return;
      handleEncounterChoice(parseInt(encChoice.getAttribute("data-encounter-choice"), 10));
      return;
    }

    if (event.target.closest("#btn-encounter-disengage")) {
      handleEncounterDisengage();
      return;
    }

    if (state && (state.activeEncounter || state.pendingEncounterResult)) {
      // Block background UI while an encounter (or its outcome beat) is open
      if (!event.target.closest("#encounter-overlay")) {
        event.preventDefault();
        return;
      }
    }

    if (event.target.closest("[data-trade]")) {
      handleTradeClick(event);
      return;
    }

    var extract = event.target.closest("#btn-extract");
    if (extract && !extract.disabled) {
      var er = Trading.extractScavenge(state);
      if (!er.ok) state.lastMessage = er.error || "Extraction failed.";
      renderDock();
      return;
    }

    var travelBtn = event.target.closest("#btn-travel");
    if (travelBtn && !travelBtn.disabled) {
      doTravel();
      return;
    }

    var reseed = event.target.closest("#btn-reseed");
    if (reseed) {
      var nextSeed = (state.seed + 1 + Math.floor(Math.random() * 1000)) >>> 0;
      state = Trading.createState(nextSeed || 1);
      showScreen("galaxy");
      return;
    }

    var mapNode = event.target.closest(".map-node");
    if (mapNode) {
      var nid = mapNode.getAttribute("data-node-id");
      // Double-click travel if connected
      if (event.detail >= 2 && nid && nid !== state.locationId) {
        state.selectedDestId = nid;
        doTravel();
      } else {
        selectDestination(nid);
      }
      return;
    }

    var trigger = event.target.closest("[data-screen]");
    if (!trigger || trigger.disabled) return;

    var id = trigger.getAttribute("data-screen");
    if (!id) return;

    if (trigger.matches("button.nav-btn, button.text-link, button.btn-ghost[data-screen]")) {
      event.preventDefault();
      showScreen(id);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (!state) return;
    if (event.key === "Escape") {
      if (state.pendingEncounterResult) {
        event.preventDefault();
        finishEncounterArrival();
        return;
      }
      if (state.activeEncounter) {
        event.preventDefault();
        handleEncounterDisengage();
      }
    }
    if (
      event.key === "Enter" &&
      state.pendingEncounterResult &&
      !state.activeEncounter
    ) {
      event.preventDefault();
      finishEncounterArrival();
    }
  });

  function init() {
    if (!window.GAME_DATA || !window.Trading || !window.Galaxy || !window.Encounters) {
      console.error("Missing GAME_DATA, Trading, Galaxy, or Encounters modules.");
      return;
    }
    if (!window.GAME_DATA.encounters) {
      console.error("Missing encounter content (encounter-data.js).");
      return;
    }
    // Random seed each load; tests can call Trading.createState(fixed)
    state = Trading.createState();
    showScreen("station");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
