/**
 * Two-tier encounter engine (quick + deep). Data-driven; rolls shown to player.
 */
(function (global) {
  function cfg() {
    return global.GAME_DATA.encounterConfig;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function rng(state) {
    return state.rng ? state.rng() : Math.random();
  }

  function repOf(state, factionId) {
    if (!factionId) return 0;
    var v = state.reputation[factionId];
    return typeof v === "number" ? v : 0;
  }

  function removeCargoUnits(state, units) {
    if (!units || units < 1) return 0;
    var removed = 0;
    while (removed < units) {
      var ids = Object.keys(state.cargo);
      if (!ids.length) break;
      var id = ids[Math.floor(rng(state) * ids.length)];
      state.cargo[id] -= 1;
      if (state.cargo[id] <= 0) delete state.cargo[id];
      removed++;
    }
    return removed;
  }

  function applyEffects(state, effects) {
    if (!effects) return [];
    var notes = [];
    if (typeof effects.credits === "number" && effects.credits !== 0) {
      state.credits = Math.max(0, state.credits + effects.credits);
      notes.push((effects.credits > 0 ? "+" : "") + effects.credits + " cr");
    }
    if (typeof effects.fuel === "number" && effects.fuel !== 0) {
      state.ship.fuel = clamp(
        state.ship.fuel + effects.fuel,
        0,
        state.ship.fuelCapacity
      );
      notes.push((effects.fuel > 0 ? "+" : "") + effects.fuel + " fuel");
    }
    if (typeof effects.hull === "number" && effects.hull !== 0) {
      state.ship.hull = clamp(state.ship.hull + effects.hull, 1, state.ship.hullMax);
      notes.push((effects.hull > 0 ? "+" : "") + effects.hull + " hull");
    }
    if (effects.rep) {
      var repBits = [];
      Object.keys(effects.rep).forEach(function (fid) {
        var delta = effects.rep[fid];
        var before = repOf(state, fid);
        state.reputation[fid] = clamp(before + delta, -100, 100);
        var name =
          (global.GAME_DATA.factions[fid] && global.GAME_DATA.factions[fid].name) ||
          fid;
        repBits.push(name + " " + (delta > 0 ? "+" : "") + delta);
      });
      if (repBits.length) notes.push("Rep: " + repBits.join(", "));
    }
    if (effects.cargoAdd) {
      Object.keys(effects.cargoAdd).forEach(function (gid) {
        var n = effects.cargoAdd[gid];
        var free = state.ship.cargoCapacity - global.Trading.cargoUsed(state);
        var add = Math.min(n, Math.max(0, free));
        if (add > 0) {
          state.cargo[gid] = (state.cargo[gid] || 0) + add;
          var g = global.Trading.commodityById(gid);
          notes.push("+" + add + " " + (g ? g.name : gid));
        }
      });
    }
    if (effects.cargoRemoveUnits) {
      var r = removeCargoUnits(state, effects.cargoRemoveUnits);
      if (r > 0) notes.push("−" + r + " cargo units");
    }
    if (effects.message) notes.push(effects.message);
    return notes;
  }

  /** Route faction: destination station faction, or region-biased fallback. */
  function routeFaction(state, destId) {
    var node = global.Galaxy.getNode(state.galaxy, destId);
    if (!node) return "compact";
    if (node.type === "station") {
      var st = global.Trading.stationById(destId);
      if (st) return st.factionId;
    }
    var site = global.Trading.scavengeById(destId);
    if (site && site.regionId === "ashline") return "korr";
    if (site && site.regionId === "quiet_verge") return "veil";
    if (site && site.regionId === "redwake") return "veil";
    return "veil";
  }

  /**
   * Encounter chance rises when route-faction rep is low (hostility).
   * Positive standing makes travel quieter.
   */
  function encounterChance(state, destId) {
    var c = cfg();
    var fac = routeFaction(state, destId);
    var rep = repOf(state, fac);
    var chance = c.baseChance;
    if (rep < 0) {
      chance += (-rep / 100) * c.hostilityRepScale;
    } else if (rep > 0) {
      chance -= (rep / 100) * c.friendRepScale;
    }
    return clamp(chance, 0.08, 0.85);
  }

  function allEncounters() {
    var pack = global.GAME_DATA.encounters || {};
    return {
      quick: pack.quick || [],
      deep: pack.deep || [],
    };
  }

  function weightedPick(list, state, routeFac) {
    if (!list.length) return null;
    var total = 0;
    var weights = list.map(function (enc) {
      var w = enc.weight || 1;
      // Prefer encounters matching route faction slightly
      if (enc.faction === routeFac) w *= 1.45;
      // Hostile-tagged events more likely when rep poor
      if (enc.tags && enc.tags.indexOf("hostile") !== -1 && repOf(state, routeFac) < 0) {
        w *= 1.35;
      }
      // Authority more likely in Compact-linked routes when rep is messy
      if (
        enc.tags &&
        enc.tags.indexOf("authority") !== -1 &&
        routeFac === "compact" &&
        repOf(state, "compact") < 5
      ) {
        w *= 1.25;
      }
      total += w;
      return w;
    });
    var roll = rng(state) * total;
    var acc = 0;
    for (var i = 0; i < list.length; i++) {
      acc += weights[i];
      if (roll <= acc) return list[i];
    }
    return list[list.length - 1];
  }

  function pickEncounter(state, destId) {
    var packs = allEncounters();
    var routeFac = routeFaction(state, destId);
    var wantDeep = rng(state) < cfg().deepChance;
    var pool = wantDeep && packs.deep.length ? packs.deep : packs.quick;
    if (!pool.length) pool = packs.quick;
    return weightedPick(pool, state, routeFac);
  }

  /**
   * Roll whether travel triggers an encounter.
   * @returns {object|null} encounter template
   */
  function rollForTravel(state, destId) {
    var chance = encounterChance(state, destId);
    if (rng(state) > chance) return null;
    return pickEncounter(state, destId);
  }

  function rollChance(state, kind, base) {
    var c = cfg();
    var chance = typeof base === "number" ? base : 0.5;
    var hullRatio = state.ship.hull / Math.max(1, state.ship.hullMax);
    if (kind === "combat") {
      chance += state.ship.weaponSlots * 0.12;
      chance += (hullRatio - 0.5) * 0.15;
    } else if (kind === "flee") {
      chance += state.ship.speed * 0.04;
      chance += (hullRatio - 0.4) * 0.08;
    } else if (kind === "talk") {
      // slight boost from average rep (people listen if you're not infamous)
      var avg = 0;
      var n = 0;
      Object.keys(state.reputation).forEach(function (fid) {
        avg += state.reputation[fid];
        n++;
      });
      if (n) chance += (avg / n / 100) * 0.1;
    } else if (kind === "bribe") {
      chance += state.credits > 400 ? 0.08 : 0;
      chance -= state.credits < 80 ? 0.12 : 0;
    }
    return clamp(chance, c.minRoll, c.maxRoll);
  }

  function start(state, template, meta) {
    return {
      id: template.id,
      tier: template.tier,
      title: template.title,
      faction: template.faction,
      template: template,
      nodeId: template.start,
      log: [],
      meta: meta || {},
      resolved: false,
    };
  }

  function currentNode(active) {
    return active.template.nodes[active.nodeId] || null;
  }

  function choicePresentation(state, choice) {
    var out = {
      label: choice.label,
      hint: choice.hint || "",
      roll: choice.roll || null,
      chance: null,
    };
    if (choice.roll) {
      out.chance = rollChance(state, choice.roll, choice.baseChance);
    }
    return out;
  }

  function endEncounter(state, active, closingText, effectNotes) {
    active.resolved = true;
    active.closingText = closingText || "";
    active.effectNotes = effectNotes || [];
    var bits = [];
    if (closingText) bits.push(closingText);
    if (effectNotes && effectNotes.length) {
      bits.push("(" + effectNotes.join("; ") + ")");
    }
    state.lastMessage = bits.join(" ");
    state.activeEncounter = null;
    return { done: true, text: closingText, notes: effectNotes };
  }

  /**
   * Player backs out of the encounter dialogue without picking a story choice.
   * Completing pending travel still happens via finishPendingTravel in the UI.
   * Mild cost: a little fuel burned running quiet (if any left).
   */
  function disengage(state) {
    var active = state.activeEncounter;
    if (!active) return { ok: false, error: "No encounter to leave." };

    var notes = [];
    if (state.ship.fuel > 0) {
      var burn = Math.min(2, state.ship.fuel);
      state.ship.fuel -= burn;
      if (burn > 0) notes.push("−" + burn + " fuel (running quiet)");
    }

    var text =
      "You cut the channel and push past without engaging. " +
      "Whatever wanted your attention falls behind the thrusters — for now.";
    return Object.assign(
      { ok: true },
      endEncounter(state, active, text, notes)
    );
  }

  /**
   * Apply a choice index on the active encounter.
   */
  function choose(state, active, choiceIndex) {
    var node = currentNode(active);
    if (!node || active.resolved) {
      return { ok: false, error: "No active encounter step." };
    }
    var choice = node.choices[choiceIndex];
    if (!choice) return { ok: false, error: "Invalid choice." };

    // Immediate effects on choice (before roll/branch)
    var notes = applyEffects(state, choice.effects);

    if (choice.roll) {
      var chance = rollChance(state, choice.roll, choice.baseChance);
      var success = rng(state) < chance;
      var rollNote =
        (success ? "Success" : "Failure") +
        " (" +
        choice.roll +
        " vs " +
        Math.round(chance * 100) +
        "%)";
      notes.push(rollNote);

      var branchText = success
        ? choice.successText || ""
        : choice.failText || "";
      var branchEffects = success ? choice.successEffects : choice.failEffects;
      notes = notes.concat(applyEffects(state, branchEffects));

      var next = success
        ? choice.successNext != null
          ? choice.successNext
          : choice.next
        : choice.failNext != null
          ? choice.failNext
          : choice.next;

      if (branchText) active.log.push(branchText);

      if (next) {
        active.nodeId = next;
        return {
          ok: true,
          done: false,
          rollSuccess: success,
          chance: chance,
          notes: notes,
          text: branchText,
        };
      }

      // Terminal roll choice
      var terminal =
        branchText ||
        (success ? "It works." : "It goes wrong.") +
          (notes.length ? "\n\n" + notes.join(" · ") : "");
      return Object.assign(
        { ok: true, rollSuccess: success, chance: chance },
        endEncounter(state, active, terminal, notes)
      );
    }

    // Non-roll: text + optional next
    if (choice.text) active.log.push(choice.text);

    if (choice.next) {
      active.nodeId = choice.next;
      return {
        ok: true,
        done: false,
        notes: notes,
        text: choice.text || "",
      };
    }

    // End
    var endText =
      choice.text ||
      (notes.length ? notes.join(" · ") : "The moment passes.");
    return Object.assign({ ok: true }, endEncounter(state, active, endText, notes));
  }

  /**
   * After encounter resolves, finish pending arrival if any.
   */
  function finishPendingTravel(state) {
    if (!state.pendingTravel) return { ok: true, arrived: false };
    var pending = state.pendingTravel;
    state.pendingTravel = null;
    return global.Trading.completeTravel(state, pending.destId, pending.fuelCost, {
      afterEncounter: true,
    });
  }

  global.Encounters = {
    rollForTravel: rollForTravel,
    encounterChance: encounterChance,
    routeFaction: routeFaction,
    start: start,
    choose: choose,
    disengage: disengage,
    currentNode: currentNode,
    choicePresentation: choicePresentation,
    rollChance: rollChance,
    repOf: repOf,
    applyEffects: applyEffects,
    finishPendingTravel: finishPendingTravel,
  };
})(window);
