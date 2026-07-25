/**
 * Heritage milestones, tavern, moneylender, per-location visit memory.
 */
(function (global) {
  function data() {
    return global.GAME_DATA;
  }

  function rng(state) {
    return state.rng ? state.rng() : Math.random();
  }

  function pick(arr, state) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(rng(state) * arr.length)];
  }

  function ensureNarrativeState(state) {
    if (!state.storyFlags) state.storyFlags = {};
    if (!state.storyFired) state.storyFired = {};
    if (!state.locationMemory) state.locationMemory = {};
    if (!state.rumorHeard) state.rumorHeard = {};
    if (!state.pendingStoryBeat) state.pendingStoryBeat = null;
    if (state.loanCount == null) state.loanCount = 0;
    if (state.uniqueStations == null) state.uniqueStations = {};
    if (state.profitableTrades == null) state.profitableTrades = 0;
  }

  /** Cargo valued at commodity base prices (simple net-worth proxy). */
  function cargoValue(state) {
    var total = 0;
    var list = data().commodities || [];
    Object.keys(state.cargo || {}).forEach(function (gid) {
      var qty = state.cargo[gid] || 0;
      var base = 10;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === gid) {
          base = list[i].basePrice;
          break;
        }
      }
      total += qty * base;
    });
    return total;
  }

  function netWorth(state) {
    return (state.credits || 0) + cargoValue(state) - (state.debt || 0);
  }

  function uniqueStationCount(state) {
    return Object.keys(state.uniqueStations || {}).length;
  }

  /**
   * Record a docking/site visit. Call on arrival (and game start at home dock).
   */
  function noteVisit(state, locationId) {
    ensureNarrativeState(state);
    if (!locationId) return null;

    var mem = state.locationMemory[locationId];
    if (!mem) {
      mem = { visits: 0, lastTurn: -999, lastRumorId: null };
      state.locationMemory[locationId] = mem;
    }

    var turnsSince =
      mem.visits === 0 ? 999 : Math.max(0, state.turn - mem.lastTurn);
    mem.visits += 1;
    mem.lastTurn = state.turn;
    mem.turnsSince = turnsSince;

    var node = global.Galaxy && state.galaxy
      ? global.Galaxy.getNode(state.galaxy, locationId)
      : null;
    if (node && node.type === "station") {
      state.uniqueStations[locationId] = true;
    }

    return mem;
  }

  function visitPhase(mem) {
    if (!mem || mem.visits <= 1) return "first";
    if (mem.turnsSince != null && mem.turnsSince <= 2) return "return_soon";
    return "return_later";
  }

  function setFlag(state, flag) {
    ensureNarrativeState(state);
    state.storyFlags[flag] = true;
  }

  function hasFlag(state, flag) {
    return !!(state.storyFlags && state.storyFlags[flag]);
  }

  function beatFired(state, id) {
    return !!(state.storyFired && state.storyFired[id]);
  }

  function triggerMet(state, beat) {
    var t = beat.trigger || {};
    if (t.type === "uniqueStations") {
      return uniqueStationCount(state) >= (t.count || 1);
    }
    if (t.type === "netWorth") {
      return netWorth(state) >= (t.amount || 0);
    }
    if (t.type === "flag") {
      return hasFlag(state, t.flag);
    }
    if (t.type === "allPrior") {
      var ids = t.ids || [];
      for (var i = 0; i < ids.length; i++) {
        if (!beatFired(state, ids[i])) return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Check milestones; queue at most one beat for the UI to show.
   * @returns {object|null} newly fired beat
   */
  function checkMilestones(state) {
    ensureNarrativeState(state);
    if (state.pendingStoryBeat) return null;

    var beats = (data().storyBeats || []).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });

    for (var i = 0; i < beats.length; i++) {
      var beat = beats[i];
      if (beatFired(state, beat.id)) continue;
      if (!triggerMet(state, beat)) continue;

      state.storyFired[beat.id] = true;
      state.pendingStoryBeat = {
        id: beat.id,
        title: beat.title,
        body: beat.body,
      };
      state.lastMessage = "Story: " + beat.title;
      return state.pendingStoryBeat;
    }
    return null;
  }

  function clearStoryBeat(state) {
    state.pendingStoryBeat = null;
  }

  function accrueInterest(state) {
    var cfg = data().moneylender;
    if (!cfg || !state.debt || state.debt <= 0) return 0;
    var rate = cfg.interestPerTravel != null ? cfg.interestPerTravel : 0.04;
    var add = Math.max(1, Math.ceil(state.debt * rate));
    state.debt += add;
    return add;
  }

  function canUseMoneylender(state) {
    var cfg = data().moneylender;
    return !!(cfg && state.locationId === cfg.stationId);
  }

  function canUseTavern(state) {
    var map = data().tavernStations || {};
    return !!map[state.locationId];
  }

  function borrow(state, amount) {
    ensureNarrativeState(state);
    var cfg = data().moneylender;
    if (!canUseMoneylender(state)) {
      return { ok: false, error: "No moneylender at this dock." };
    }
    amount = Math.floor(Number(amount));
    if (!isFinite(amount) || amount < cfg.minLoan) {
      return { ok: false, error: "Minimum loan is " + cfg.minLoan + " cr." };
    }
    if (amount > cfg.maxLoan) {
      return { ok: false, error: "Quill caps new loans at " + cfg.maxLoan + " cr." };
    }
    if (state.debt + amount > cfg.maxLoan * 2) {
      return { ok: false, error: "She will not stack your debt that high." };
    }

    state.credits += amount;
    state.debt += amount;
    state.loanCount += 1;
    if (state.loanCount === 1) setFlag(state, "tookLoan");

    var line =
      state.loanCount === 1
        ? pick(data().moneylenderLines.greet_first, state)
        : "“Motion secured. Do not confuse softness with forgetfulness.”";

    state.lastMessage =
      "Borrowed " + amount + " cr. Debt now " + state.debt + ". " + (line || "");
    checkMilestones(state);
    return { ok: true, amount: amount, debt: state.debt, line: line };
  }

  function repay(state, amount) {
    ensureNarrativeState(state);
    if (!canUseMoneylender(state)) {
      return { ok: false, error: "No moneylender at this dock." };
    }
    if (state.debt <= 0) {
      return { ok: false, error: "You owe nothing. Quill almost looks disappointed." };
    }
    amount = Math.floor(Number(amount));
    if (!isFinite(amount) || amount < 1) {
      return { ok: false, error: "Enter a repayment amount." };
    }
    if (amount > state.credits) {
      return { ok: false, error: "Not enough credits (have " + state.credits + ")." };
    }
    if (amount > state.debt) amount = state.debt;

    state.credits -= amount;
    state.debt -= amount;
    state.lastMessage =
      "Repaid " + amount + " cr. Debt remaining: " + state.debt + ".";
    return { ok: true, amount: amount, debt: state.debt };
  }

  function tavernContext(state) {
    ensureNarrativeState(state);
    var loc = state.locationId;
    var mem = state.locationMemory[loc];
    if (!mem) {
      mem = { visits: 1, turnsSince: 999, lastTurn: state.turn };
      state.locationMemory[loc] = mem;
    }
    var phase = visitPhase(mem);
    var indebted = (state.debt || 0) > 0;
    var tc = data().tavernContent || {};
    var stationMeta = (data().tavernStations || {})[loc] || {
      name: "Dockside Bar",
      keeper: "Bartender",
    };

    // Stable flavor for this visit (don't re-roll greeting/atmosphere on every rumor click)
    var cacheKey =
      phase +
      "|" +
      (indebted ? "d" : "c") +
      "|" +
      mem.visits +
      "|" +
      mem.lastTurn;
    if (mem.tavernCache && mem.tavernCache.key === cacheKey) {
      return mem.tavernCache.ctx;
    }

    var greetPool = tc.keeperGreetings || {};
    var greet =
      indebted && greetPool.indebted
        ? pick(greetPool.indebted, state)
        : pick(greetPool[phase] || greetPool.first, state);

    var atmoPool = tc.atmospheres || {};
    var atmo =
      state.turn >= 12 && atmoPool.late_turn && rng(state) < 0.35
        ? pick(atmoPool.late_turn, state)
        : pick(atmoPool[phase] || atmoPool.first, state);

    var facesPool = tc.faces || {};
    var faces = (facesPool[phase] || facesPool.first || []).slice();

    var ctx = {
      stationMeta: stationMeta,
      phase: phase,
      visits: mem.visits,
      turnsSince: mem.turnsSince,
      greeting: greet || "“Sit.”",
      atmosphere: atmo || "The room hums.",
      faces: faces,
      indebted: indebted,
    };
    mem.tavernCache = { key: cacheKey, ctx: ctx };
    return ctx;
  }

  function askRumor(state) {
    ensureNarrativeState(state);
    if (!canUseTavern(state)) {
      return { ok: false, error: "No tavern open to you here." };
    }
    var rumors = (data().tavernContent && data().tavernContent.rumors) || [];
    if (!rumors.length) return { ok: false, error: "The room has gone quiet." };

    var mem = state.locationMemory[state.locationId] || {};
    var phase = visitPhase(mem);

    // Prefer unheard; on return visits, deprioritize last rumor at this dock
    var pool = rumors.filter(function (r) {
      if (mem.lastRumorId && r.id === mem.lastRumorId && mem.visits > 1) {
        return rng(state) < 0.25;
      }
      if (state.rumorHeard[r.id] && phase !== "first") {
        return rng(state) < 0.35; // stale sometimes returns
      }
      return true;
    });
    if (!pool.length) pool = rumors;

    var rumor = pick(pool, state);
    var heardBefore = !!state.rumorHeard[rumor.id];
    state.rumorHeard[rumor.id] = true;
    if (mem) mem.lastRumorId = rumor.id;

    var staleNote =
      heardBefore && mem.visits > 2 && rng(state) < 0.3
        ? " (Pax shrugs: “That one’s getting old — but old bones still point.”)"
        : "";

    state.lastMessage = "Rumor: " + rumor.text + staleNote;
    return { ok: true, rumor: rumor, text: rumor.text + staleNote };
  }

  function listenIn(state) {
    ensureNarrativeState(state);
    if (!canUseTavern(state)) {
      return { ok: false, error: "No tavern open to you here." };
    }
    var lines = (data().tavernContent && data().tavernContent.listenIns) || [];
    var line = pick(lines, state) || "The music swallows the rest.";
    state.lastMessage = line;
    return { ok: true, text: line };
  }

  function onTravelComplete(state) {
    ensureNarrativeState(state);
    var interest = accrueInterest(state);
    noteVisit(state, state.locationId);
    if (interest > 0) {
      state.lastMessage =
        (state.lastMessage ? state.lastMessage + "\n\n" : "") +
        "Interest accrued: +" +
        interest +
        " cr debt (now " +
        state.debt +
        ").";
    }
    checkMilestones(state);
  }

  function onEconomyChange(state) {
    ensureNarrativeState(state);
    checkMilestones(state);
  }

  /**
   * Heritage hook for rival/Jex beat — only detention- or Jex-shaped scenes,
   * not every deep encounter.
   */
  var RIVAL_MIRROR_ENCOUNTER_IDS = {
    compact_detention: true,
    jex_morrow_passby: true,
  };

  function markEncounterStoryHooks(state, encounterId) {
    ensureNarrativeState(state);
    if (!encounterId || !RIVAL_MIRROR_ENCOUNTER_IDS[encounterId]) return;
    setFlag(state, "metRivalMirror");
    checkMilestones(state);
  }

  /** @deprecated use markEncounterStoryHooks — kept name for older call sites */
  function markDeepEncounter(state, encounterId) {
    markEncounterStoryHooks(state, encounterId);
  }

  global.Narrative = {
    ensureNarrativeState: ensureNarrativeState,
    noteVisit: noteVisit,
    visitPhase: visitPhase,
    netWorth: netWorth,
    uniqueStationCount: uniqueStationCount,
    checkMilestones: checkMilestones,
    clearStoryBeat: clearStoryBeat,
    setFlag: setFlag,
    hasFlag: hasFlag,
    canUseMoneylender: canUseMoneylender,
    canUseTavern: canUseTavern,
    borrow: borrow,
    repay: repay,
    tavernContext: tavernContext,
    askRumor: askRumor,
    listenIn: listenIn,
    onTravelComplete: onTravelComplete,
    onEconomyChange: onEconomyChange,
    markDeepEncounter: markDeepEncounter,
    markEncounterStoryHooks: markEncounterStoryHooks,
    accrueInterest: accrueInterest,
  };
})(window);
