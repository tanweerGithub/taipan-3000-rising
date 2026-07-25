/**
 * Taipan 3000: Rising — shell nav + Stage 3 trading UI.
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

    if (id === "station") renderStation();
    if (id === "ship") renderShip();
    if (id === "galaxy") renderGalaxyList();
  }

  function el(id) {
    return document.getElementById(id);
  }

  function renderHud() {
    var station = Trading.stationById(state.stationId);
    var used = Trading.cargoUsed(state);
    var cap = state.ship.cargoCapacity;

    el("hud-location").textContent = "Docked: " + station.name;
    el("hud-credits").textContent = String(state.credits);
    el("hud-debt").textContent = String(state.debt);
    el("hud-fuel").textContent = state.ship.fuel + " / " + state.ship.fuelCapacity;
    el("hud-hull").textContent = state.ship.hull + " / " + state.ship.hullMax;
    el("hud-cargo").textContent = used + " / " + cap;
  }

  function renderStation() {
    var station = Trading.stationById(state.stationId);
    var region = Trading.regionById(station.regionId);
    var faction = window.GAME_DATA.factions[station.factionId];

    el("station-heading").textContent = station.name + " — Market";
    el("station-sub").textContent =
      (region ? region.name : "") +
      (faction ? " · " + faction.name : "") +
      " — buy and sell at local prices.";

    var flavor = el("station-flavor");
    if (flavor) flavor.textContent = "“" + station.flavor + "”";

    var tbody = el("market-body");
    tbody.innerHTML = "";

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

    var used = Trading.cargoUsed(state);
    el("hold-summary").textContent =
      "Capacity: " + used + " / " + state.ship.cargoCapacity;

    var holdList = el("hold-list");
    holdList.innerHTML = "";
    var ids = Object.keys(state.cargo);
    if (ids.length === 0) {
      var empty = document.createElement("li");
      empty.innerHTML = 'Hold empty <span class="muted">(buy goods at the market)</span>';
      holdList.appendChild(empty);
    } else {
      ids.forEach(function (id) {
        var g = Trading.commodityById(id);
        var li = document.createElement("li");
        li.textContent = (g ? g.name : id) + " × " + state.cargo[id];
        holdList.appendChild(li);
      });
    }

    var msg = el("market-message");
    if (msg) {
      msg.textContent = state.lastMessage || "";
      msg.hidden = !state.lastMessage;
    }

    renderHud();
  }

  function renderShip() {
    el("ship-stat-cargo").textContent = String(state.ship.cargoCapacity);
    el("ship-stat-fuel").textContent = String(state.ship.fuelCapacity);
    el("ship-stat-hull").textContent = state.ship.hull + " / " + state.ship.hullMax;
    el("ship-stat-weapons").textContent = state.ship.weaponSlots + " slots";
    el("ship-stat-speed").textContent = String(state.ship.speed);
    renderHud();
  }

  function renderGalaxyList() {
    var list = el("galaxy-region-list");
    if (!list) return;
    list.innerHTML = "";
    window.GAME_DATA.stations.forEach(function (s) {
      var region = Trading.regionById(s.regionId);
      var li = document.createElement("li");
      var here = s.id === state.stationId ? " ← you are here" : "";
      li.textContent =
        s.name +
        " (" +
        (region ? region.name : "?") +
        ")" +
        here;
      list.appendChild(li);
    });
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
    renderStation();
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-trade]")) {
      handleTradeClick(event);
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

  function init() {
    if (!window.GAME_DATA || !window.Trading) {
      console.error("Missing GAME_DATA or Trading modules.");
      return;
    }
    state = Trading.createState();
    showScreen("station");
    renderHud();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
