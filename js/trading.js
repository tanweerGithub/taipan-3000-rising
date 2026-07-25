/**
 * Core trading loop: prices, buy/sell, credits + cargo.
 * No travel / encounters.
 */
(function (global) {
  var DATA = null;

  function commodityById(id) {
    var list = DATA.commodities;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function stationById(id) {
    var list = DATA.stations;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function regionById(id) {
    return DATA.regions[id] || null;
  }

  function randNoise() {
    var m = DATA.market;
    return m.noiseMin + Math.random() * (m.noiseMax - m.noiseMin);
  }

  /** Roll per-good noise for a station visit (call on dock / game start). */
  function rollVisitNoise(state) {
    state.priceNoise = {};
    DATA.commodities.forEach(function (c) {
      state.priceNoise[c.id] = randNoise();
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

  /**
   * Mid price = base * station mod * visit noise * supply factor.
   * Buy/sell apply fixed spread around mid.
   */
  function pricesFor(state, goodId) {
    var good = commodityById(goodId);
    var station = stationById(state.stationId);
    var m = DATA.market;
    if (!good || !station) return { buy: 0, sell: 0, mid: 0 };

    ensureSupply(state, state.stationId);
    var mod = station.priceMods[goodId] != null ? station.priceMods[goodId] : 1;
    var noise = state.priceNoise[goodId] != null ? state.priceNoise[goodId] : 1;
    var stock = state.supply[state.stationId][goodId];
    // stock > base → cheaper; stock < base → dearer
    var supplyFactor = 1 + (m.baseSupply - stock) * 0.012;
    var mid = Math.round(good.basePrice * mod * noise * supplyFactor);
    mid = Math.max(m.minPrice, mid);
    var buy = Math.max(m.minPrice, Math.round(mid * m.buySpread));
    var sell = Math.max(m.minPrice, Math.round(mid * m.sellSpread));
    if (sell > buy) sell = buy;
    return { buy: buy, sell: sell, mid: mid };
  }

  function createState() {
    DATA = global.GAME_DATA;
    var start = DATA.start;
    var state = {
      stationId: start.stationId,
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
    };

    Object.keys(DATA.factions).forEach(function (fid) {
      state.reputation[fid] = DATA.factions[fid].startRep;
    });

    Object.keys(start.cargo || {}).forEach(function (id) {
      state.cargo[id] = start.cargo[id];
    });

    ensureSupply(state, state.stationId);
    rollVisitNoise(state);
    state.lastMessage = "Market open at " + stationById(state.stationId).name + ".";
    return state;
  }

  /**
   * @returns {{ ok: boolean, error?: string }}
   */
  function buy(state, goodId, qty) {
    qty = qty || 1;
    if (qty < 1) return { ok: false, error: "Invalid quantity." };

    var good = commodityById(goodId);
    if (!good) return { ok: false, error: "Unknown good." };

    var used = cargoUsed(state);
    if (used + qty > state.ship.cargoCapacity) {
      return { ok: false, error: "Hold full — free space: " + (state.ship.cargoCapacity - used) + "." };
    }

    var price = pricesFor(state, goodId).buy;
    var total = price * qty;
    if (state.credits < total) {
      return { ok: false, error: "Not enough credits (need " + total + " cr)." };
    }

    state.credits -= total;
    state.cargo[goodId] = cargoQty(state, goodId) + qty;
    ensureSupply(state, state.stationId);
    state.supply[state.stationId][goodId] = Math.max(
      0,
      state.supply[state.stationId][goodId] - qty * DATA.market.supplyStep
    );
    state.lastMessage =
      "Bought " + qty + "× " + good.name + " for " + total + " cr (" + price + " each).";
    return { ok: true };
  }

  /**
   * @returns {{ ok: boolean, error?: string }}
   */
  function sell(state, goodId, qty) {
    qty = qty || 1;
    if (qty < 1) return { ok: false, error: "Invalid quantity." };

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

    ensureSupply(state, state.stationId);
    state.supply[state.stationId][goodId] += qty * DATA.market.supplyStep;
    state.lastMessage =
      "Sold " + qty + "× " + good.name + " for " + total + " cr (" + price + " each).";
    return { ok: true };
  }

  global.Trading = {
    createState: createState,
    buy: buy,
    sell: sell,
    pricesFor: pricesFor,
    cargoUsed: cargoUsed,
    cargoQty: cargoQty,
    commodityById: commodityById,
    stationById: stationById,
    regionById: regionById,
    rollVisitNoise: rollVisitNoise,
  };
})(window);
