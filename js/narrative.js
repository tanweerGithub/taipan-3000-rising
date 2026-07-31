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
    if (!state.pendingEpilogue) state.pendingEpilogue = null;
    if (state.loanCount == null) state.loanCount = 0;
    if (state.uniqueStations == null) state.uniqueStations = {};
  }

  function repOf(state, factionId) {
    var v = state.reputation && state.reputation[factionId];
    return typeof v === "number" ? v : 0;
  }

  function clampRep(n) {
    return Math.max(-100, Math.min(100, n));
  }

  /**
   * LORE resolution shape from this playthrough's political weather.
   * cost_of_light: burned Compact, warm Veil; long_echo: healthier books + hope;
   * quiet_truth: default bittersweet close.
   */
  function heritagePath(state) {
    var compact = repOf(state, "compact");
    var veil = repOf(state, "veil");
    var worth = netWorth(state);
    if (compact <= -18 && veil >= 12) return "cost_of_light";
    if (worth >= 2200 && compact > -25) return "long_echo";
    return "quiet_truth";
  }

  function factionStandingLine(state, factionId) {
    var f = data().factions[factionId];
    if (!f) return null;
    var v = repOf(state, factionId);
    var name = f.name;
    if (v >= 25) {
      return (
        name +
        " still opens a lane for you (" +
        (v > 0 ? "+" : "") +
        v +
        "). Clerks remember a captain who paid debts in more than credits."
      );
    }
    if (v <= -20) {
      return (
        name +
        " keeps your file cold (" +
        v +
        "). Expect longer inspections and shorter patience."
      );
    }
    if (v >= 10) {
      return (
        name +
        " rates you as mostly reliable (" +
        (v > 0 ? "+" : "") +
        v +
        ") — not a friend, not a target."
      );
    }
    if (v <= -5) {
      return (
        name +
        " has not forgiven every Voss-shaped irregularity (" +
        v +
        "). The temperature is professional and low."
      );
    }
    return null; // neutral — omit from log to keep it short
  }

  function companionEpilogueLines(state) {
    var lines = [];
    var defs = (data().companions || {});
    var members = (state.crew && state.crew.members) || {};

    Object.keys(defs).forEach(function (id) {
      var d = defs[id];
      var m = members[id];
      if (!m || !m.recruited) {
        if (id === "ivo") {
          lines.push(
            "Ivo never took a berth. The unfinished songs stay on someone else’s dock — " +
              "a navigator-shaped absence in the jump seat."
          );
        }
        return;
      }
      if (m.left) {
        lines.push(
          d.name +
            " left when trust ran out (last reading " +
            m.trust +
            "). The berth is empty on purpose."
        );
        return;
      }
      var trust = m.trust;
      if (trust >= 40) {
        lines.push(
          d.name +
            " remains aboard with high trust (" +
            (trust > 0 ? "+" : "") +
            trust +
            "). " +
            (d.role || "Crew") +
            " who still chooses this ship when the lanes turn mean."
        );
      } else if (trust < 0) {
        lines.push(
          d.name +
            " is still on the roster, but trust is thin (" +
            trust +
            "). Every talk choice still matters."
        );
      } else {
        lines.push(
          d.name +
            " stays on the Morrowlit with steady trust (" +
            (trust > 0 ? "+" : "") +
            trust +
            "). " +
            (id === "ivo"
              ? "Unfinished songs still get written between hops."
              : "The berth is occupied by choice.")
        );
      }
    });
    return lines;
  }

  /**
   * Build captain's log from save data only (§3.10). No live LLM.
   * @returns {{ title, kicker, path, proofChoice, sections: string[], body: string }}
   */
  function assembleEpilogue(state) {
    ensureNarrativeState(state);
    var pack = data().epilogue || {};
    var path = state.storyFlags.heritagePath || heritagePath(state);
    var proof = state.storyFlags.proofChoice || "bury";
    var sections = [];

    var intro =
      (pack.introByPath && pack.introByPath[path]) ||
      pack.introByPath.quiet_truth ||
      "";
    if (intro) sections.push(intro);

    var proofLine =
      (pack.proofByChoice && pack.proofByChoice[proof]) ||
      "You made a choice about the proof. The lanes moved on.";
    sections.push(proofLine);

    var facOrder = ["compact", "veshari", "korr", "veil"];
    var facLines = [];
    facOrder.forEach(function (fid) {
      var line = factionStandingLine(state, fid);
      if (line) facLines.push(line);
    });
    if (facLines.length) {
      sections.push("Faction weather after the trail:\n" + facLines.join("\n"));
    } else {
      sections.push(
        "Faction weather stays middling — no one loves you enough to write songs, " +
          "no one hates you enough to write warrants. Yet."
      );
    }

    var crewLines = companionEpilogueLines(state);
    if (crewLines.length) {
      sections.push(crewLines.join("\n"));
    }

    if (hasFlag(state, "metRivalMirror") || beatFired(state, "rival_mirror")) {
      sections.push(
        "Jex Morrow’s parallel debt remains a mirror, not a myth. " +
          "Whether rival or almost-ally, you both flew the same unpaid silence."
      );
    } else {
      sections.push(
        "You closed the trail without ever fully meeting Jex’s grief mid-channel. " +
          "Some mirrors stay dark until a later hop."
      );
    }

    var debt = state.debt || 0;
    var worth = netWorth(state);
    sections.push(
      "Books at closing of the heritage file: net worth about " +
        worth +
        " cr" +
        (debt > 0 ? ", still carrying " + debt + " in Quill’s ledgers" : ", debt clear") +
        ". Stations logged: " +
        uniqueStationCount(state) +
        "."
    );

    if (pack.closing) sections.push(pack.closing);

    var body = sections.join("\n\n");
    return {
      title: pack.title || "Captain’s Log",
      kicker: pack.kicker || "Epilogue",
      path: path,
      proofChoice: proof,
      sections: sections,
      body: body,
    };
  }

  /**
   * Capstone choice: set flags, apply light rep/credit effects, queue epilogue.
   */
  function resolveCapstoneChoice(state, choiceId) {
    ensureNarrativeState(state);
    var beat = state.pendingStoryBeat;
    if (!beat || beat.id !== "capstone") {
      return { ok: false, error: "No capstone choice pending." };
    }
    if (hasFlag(state, "heritageResolved")) {
      return { ok: false, error: "Heritage already resolved." };
    }

    var choices = beat.choices || [];
    var choice = null;
    for (var i = 0; i < choices.length; i++) {
      if (choices[i].id === choiceId) {
        choice = choices[i];
        break;
      }
    }
    if (!choice) return { ok: false, error: "Unknown resolution." };

    var path = heritagePath(state);
    setFlag(state, "heritageResolved");
    setFlag(state, "proof_" + choiceId);
    state.storyFlags.proofChoice = choiceId;
    state.storyFlags.heritagePath = path;

    var effects =
      (data().epilogue &&
        data().epilogue.proofEffects &&
        data().epilogue.proofEffects[choiceId]) ||
      {};
    if (effects.rep) {
      Object.keys(effects.rep).forEach(function (fid) {
        var before = repOf(state, fid);
        state.reputation[fid] = clampRep(before + effects.rep[fid]);
      });
    }
    if (typeof effects.credits === "number" && effects.credits !== 0) {
      state.credits = Math.max(0, (state.credits || 0) + effects.credits);
    }

    var log = assembleEpilogue(state);
    state.pendingStoryBeat = null;
    state.pendingEpilogue = log;
    state.lastMessage = "Heritage resolved — " + choice.label + ". Captain’s log ready.";
    return { ok: true, epilogue: log, choice: choice, path: path };
  }

  function clearEpilogue(state) {
    state.pendingEpilogue = null;
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
        choices: beat.choices ? beat.choices.slice() : null,
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
    heritagePath: heritagePath,
    assembleEpilogue: assembleEpilogue,
    resolveCapstoneChoice: resolveCapstoneChoice,
    clearEpilogue: clearEpilogue,
    beatFired: beatFired,
  };
})(window);
