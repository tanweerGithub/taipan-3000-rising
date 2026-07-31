/**
 * Crew / companions — trust, recruit, banter (GAME_DESIGN §3.9).
 * Same pattern as reputation: values in save state, pools in data.
 */
(function (global) {
  function data() {
    return global.GAME_DATA;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function rng(state) {
    return state.rng ? state.rng() : Math.random();
  }

  function pick(arr, state) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(rng(state) * arr.length)];
  }

  function ensureCrewState(state) {
    if (!state.crew) state.crew = {};
    if (!state.crew.members) state.crew.members = {};
    if (state.crew.lastBanterTurn == null) state.crew.lastBanterTurn = -999;
    if (!state.crew.pendingBanter) state.crew.pendingBanter = null;
    if (!state.crew.lastTrustNote) state.crew.lastTrustNote = null;
    if (!state.crew.lastTalkReply) state.crew.lastTalkReply = null;

    var defs = (data() && data().companions) || {};
    Object.keys(defs).forEach(function (id) {
      if (!state.crew.members[id]) {
        state.crew.members[id] = {
          recruited: false,
          met: false,
          trust: 0,
          left: false,
        };
      }
    });
    return state.crew;
  }

  function def(id) {
    return (data().companions && data().companions[id]) || null;
  }

  function member(state, id) {
    ensureCrewState(state);
    return state.crew.members[id] || null;
  }

  function isAboard(state, id) {
    var m = member(state, id);
    return !!(m && m.recruited && !m.left);
  }

  function aboardList(state) {
    ensureCrewState(state);
    var out = [];
    Object.keys(state.crew.members).forEach(function (id) {
      if (isAboard(state, id)) {
        var d = def(id);
        if (d) {
          out.push({
            id: id,
            name: d.name,
            role: d.role,
            species: d.species,
            trust: state.crew.members[id].trust,
            reactsTo: d.reactsTo,
            blurb: d.blurb,
          });
        }
      }
    });
    return out;
  }

  function trustOf(state, id) {
    var m = member(state, id);
    return m ? m.trust : 0;
  }

  /**
   * Adjust trust for a companion. Only applies if aboard (or allowPreRecruit).
   * @returns {{ ok:boolean, before:number, after:number, delta:number, changed:boolean, name?:string }}
   */
  function adjustTrust(state, id, delta, opts) {
    opts = opts || {};
    ensureCrewState(state);
    var d = def(id);
    var m = member(state, id);
    if (!d || !m) return { ok: false, before: 0, after: 0, delta: 0, changed: false };
    if (!opts.allowPreRecruit && !(m.recruited && !m.left)) {
      return { ok: false, before: m.trust, after: m.trust, delta: 0, changed: false };
    }
    if (!delta) {
      return { ok: true, before: m.trust, after: m.trust, delta: 0, changed: false, name: d.name };
    }
    var lo = d.trustMin != null ? d.trustMin : -100;
    var hi = d.trustMax != null ? d.trustMax : 100;
    var before = m.trust;
    m.trust = clamp(before + delta, lo, hi);
    var changed = m.trust !== before;
    if (changed) {
      state.crew.lastTrustNote = {
        id: id,
        name: d.name,
        delta: m.trust - before,
        trust: m.trust,
        turn: state.turn,
      };
    }
    // Soft leave threshold
    if (m.recruited && !m.left && m.trust <= -40) {
      m.left = true;
      state.crew.lastTrustNote = {
        id: id,
        name: d.name,
        delta: m.trust - before,
        trust: m.trust,
        turn: state.turn,
        left: true,
      };
    }
    return {
      ok: true,
      before: before,
      after: m.trust,
      delta: m.trust - before,
      changed: changed,
      name: d.name,
      left: !!m.left,
    };
  }

  function markMet(state, id) {
    var m = member(state, id);
    if (m) m.met = true;
  }

  function canRecruit(state, id) {
    var d = def(id);
    var m = member(state, id);
    if (!d || !m || m.recruited || m.left) return false;
    if (d.recruitStationId && state.locationId !== d.recruitStationId) return false;
    return true;
  }

  function recruit(state, id) {
    ensureCrewState(state);
    var d = def(id);
    var m = member(state, id);
    if (!d || !m) return { ok: false, error: "Unknown companion." };
    if (m.recruited && !m.left) return { ok: false, error: d.name + " is already aboard." };
    if (m.left) return { ok: false, error: d.name + " already walked. That door stays closed." };
    if (d.recruitStationId && state.locationId !== d.recruitStationId) {
      return { ok: false, error: d.name + " isn’t on this dock." };
    }
    m.met = true;
    m.recruited = true;
    m.left = false;
    m.trust = d.startTrust != null ? d.startTrust : 10;
    state.crew.lastTrustNote = {
      id: id,
      name: d.name,
      delta: m.trust,
      trust: m.trust,
      turn: state.turn,
      recruited: true,
    };
    state.lastMessage =
      d.name +
      " joins the Morrowlit. Trust: " +
      m.trust +
      ".";
    return { ok: true, companion: d, trust: m.trust, text: d.recruitAccept };
  }

  function trustTier(trust) {
    if (trust < 0) return "low";
    if (trust >= 40) return "high";
    return "mid";
  }

  /**
   * Unprompted banter after travel when someone is aboard.
   * At most once per turn; ~45% chance.
   */
  function maybeTravelBanter(state) {
    ensureCrewState(state);
    var list = aboardList(state);
    if (!list.length) return null;
    if (state.crew.lastBanterTurn === state.turn) return null;
    if (rng(state) > 0.45) return null;

    var c = pick(list, state);
    if (!c) return null;
    var pools = (data().companionBanter && data().companionBanter[c.id]) || {};
    var tier = trustTier(c.trust);
    var line = pick(pools[tier] || pools.mid || [], state);
    if (!line) return null;

    state.crew.lastBanterTurn = state.turn;
    var entry = {
      companionId: c.id,
      name: c.name,
      trust: c.trust,
      tier: tier,
      text: line,
      turn: state.turn,
    };
    state.crew.pendingBanter = entry;
    return entry;
  }

  function clearBanter(state) {
    if (state.crew) state.crew.pendingBanter = null;
  }

  /**
   * React to an encounter choice when companions are aboard.
   * Talk-preferring crew likes talk/comply; dislikes pure fight/hard refuse.
   * @returns {string[]} note strings for the encounter log
   */
  function reactToEncounterChoice(state, choice) {
    var notes = [];
    var list = aboardList(state);
    if (!list.length || !choice) return notes;

    var roll = choice.roll || "";
    var label = String(choice.label || "").toLowerCase();
    var talkish =
      roll === "talk" ||
      /talk|favor|comply|words|parley|negotiate/.test(label);
    var fightish =
      roll === "combat" ||
      /^fight\b/.test(label) ||
      /hard refuse|open fire|guns/.test(label);

    list.forEach(function (c) {
      var delta = 0;
      if (c.reactsTo === "talk") {
        if (talkish) delta = 4;
        else if (fightish) delta = -5;
        else if (roll === "flee") delta = 1;
      }
      if (!delta) return;
      var r = adjustTrust(state, c.id, delta);
      if (r.changed) {
        notes.push(
          c.name +
            " trust " +
            (r.delta > 0 ? "+" : "") +
            r.delta +
            " (now " +
            r.after +
            ")" +
            (r.left ? " — leaves the crew" : "")
        );
      }
    });
    return notes;
  }

  /**
   * Apply explicit effects.trust map (like effects.rep).
   */
  function applyTrustEffects(state, trustMap) {
    var notes = [];
    if (!trustMap) return notes;
    Object.keys(trustMap).forEach(function (id) {
      var delta = trustMap[id];
      var r = adjustTrust(state, id, delta);
      if (r.ok && r.changed) {
        notes.push(
          (r.name || id) +
            " trust " +
            (r.delta > 0 ? "+" : "") +
            r.delta +
            " (now " +
            r.after +
            ")"
        );
      }
    });
    return notes;
  }

  function getTalk(state, companionId) {
    var talks = (data().companionTalks && data().companionTalks[companionId]) || [];
    if (!talks.length) return null;
    // First talk for MVP; later can cycle / gate by flags
    return talks[0];
  }

  function resolveTalkChoice(state, companionId, choiceIndex) {
    if (!isAboard(state, companionId)) {
      return { ok: false, error: "They aren’t on the crew." };
    }
    var talk = getTalk(state, companionId);
    if (!talk) return { ok: false, error: "Nothing more to say right now." };
    var choice = talk.choices[choiceIndex];
    if (!choice) return { ok: false, error: "Invalid reply." };

    var r = adjustTrust(state, companionId, choice.trust || 0);
    var d = def(companionId);
    state.crew.lastTalkReply = {
      companionId: companionId,
      text: choice.reply,
      trust: r.after,
      delta: r.delta,
    };
    state.lastMessage =
      (d ? d.name : companionId) +
      " trust " +
      (r.delta > 0 ? "+" : "") +
      r.delta +
      " → " +
      r.after +
      ".";
    return {
      ok: true,
      reply: choice.reply,
      trust: r.after,
      delta: r.delta,
      name: r.name,
    };
  }

  function approachText(state, id) {
    var d = def(id);
    if (!d) return "";
    var lines = d.approachLines || [];
    return lines[0] || d.blurb || "";
  }

  global.Crew = {
    ensureCrewState: ensureCrewState,
    def: def,
    member: member,
    isAboard: isAboard,
    aboardList: aboardList,
    trustOf: trustOf,
    trustTier: trustTier,
    adjustTrust: adjustTrust,
    markMet: markMet,
    canRecruit: canRecruit,
    recruit: recruit,
    maybeTravelBanter: maybeTravelBanter,
    clearBanter: clearBanter,
    reactToEncounterChoice: reactToEncounterChoice,
    applyTrustEffects: applyTrustEffects,
    getTalk: getTalk,
    resolveTalkChoice: resolveTalkChoice,
    approachText: approachText,
  };
})(window);
