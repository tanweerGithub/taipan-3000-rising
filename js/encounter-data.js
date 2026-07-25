/**
 * Encounter content pools — LORE tone (bittersweet, weathered, hopeful).
 * Volume aims past bare DoD so a full playthrough doesn't feel like a short loop.
 * Loaded after data.js; attaches to GAME_DATA.
 */
(function (global) {
  var D = global.GAME_DATA;
  if (!D) {
    console.error("encounter-data.js requires data.js first");
    return;
  }

  /**
   * Encounter schema:
   *  id, tier ("quick"|"deep"), weight, faction (primary), tags[]
   *  title, start: "nodeId"
   *  nodes: {
   *    id: {
   *      text,
   *      choices: [{
   *        label,
   *        hint?,                 // shown under label
   *        roll?: "combat"|"flee"|"talk"|"bribe",
   *        baseChance?: number,   // with roll
   *        next?: string|null,    // null/omit + no roll = end after effects
   *        successNext?, failNext?,
   *        successText?, failText?,
   *        effects?,              // applied if no roll / always before branch
   *        successEffects?, failEffects?
   *      }]
   *    }
   *  }
   *
   * Effects: { credits, fuel, hull, rep: {faction: delta}, cargoAdd: {id:n},
   *            cargoRemoveUnits, message }
   */

  D.encounters = {
    quick: [
      {
        id: "redwake_cutters",
        tier: "quick",
        weight: 12,
        faction: "veil",
        tags: ["hostile", "travel", "pirates"],
        title: "Redwake Cutters",
        start: "start",
        nodes: {
          start: {
            text:
              "Three lean silhouettes match your heading in the Redwake dark. " +
              "A voice scrapes across open channel — amused, not hungry yet.\n\n" +
              "“Voss freighter, that paint job is a story. Dock your pride and open a hold, " +
              "or we write a shorter ending.”",
            choices: [
              {
                label: "Fight",
                hint: "Weapons and hull decide this",
                roll: "combat",
                baseChance: 0.42,
                successText:
                  "Your guns find a thruster. They break off trailing sparks and curses. " +
                  "Your hands shake until the compass on its cord stops swinging.",
                failText:
                  "A round kisses your hull plating. Alarms bark. They take a bite of cargo " +
                  "and leave you breathing — barely a kindness.",
                successEffects: { hull: -4, credits: 40, rep: { veil: -6 } },
                failEffects: { hull: -14, cargoRemoveUnits: 4, rep: { veil: -3 } },
              },
              {
                label: "Flee",
                hint: "Speed and luck",
                roll: "flee",
                baseChance: 0.5,
                successText:
                  "You dump heat and cut a ugly vector through debris. Their lock tones die. " +
                  "Silence feels like a room you can stand in again.",
                failText:
                  "They anticipated the burn. A grapple-line kisses your dorsal plate; " +
                  "they take what they can reach and vanish.",
                successEffects: { fuel: -6, rep: { veil: 1 } },
                failEffects: { fuel: -4, hull: -6, cargoRemoveUnits: 3 },
              },
              {
                label: "Bribe them off",
                hint: "Pay for a longer life",
                effects: { credits: -90, rep: { veil: 3 } },
                text:
                  "You transfer a ugly number. The channel softens.\n\n" +
                  "“Smart captain. Tell Madame Quill the Freeholds still collect interest differently.” " +
                  "They peel away like weather that chose someone else.",
              },
              {
                label: "Talk — offer a future favor",
                hint: "Words as collateral",
                roll: "talk",
                baseChance: 0.48,
                successText:
                  "You name a dock, a debt, a truth: you remember who leaves crews stranded. " +
                  "A pause. Then: “Fine. You’re marked as useful, not meat.”",
                failText:
                  "They laugh without humor. “Poetry doesn’t fill tanks.” They take cargo anyway, " +
                  "but leave your hull mostly honest.",
                successEffects: { rep: { veil: 8 }, credits: -15 },
                failEffects: { cargoRemoveUnits: 2, rep: { veil: -2 } },
              },
            ],
          },
        },
      },
      {
        id: "compact_inspection",
        tier: "quick",
        weight: 11,
        faction: "compact",
        tags: ["authority", "travel", "inspection"],
        title: "Compact Lane Inspection",
        start: "start",
        nodes: {
          start: {
            text:
              "A Compact cutter paints you with polite targeting. Dock Officer protocol, " +
              "full stop.\n\n“Registry check, Captain Voss. Holds open. Contraband declarations " +
              "now save everyone embarrassment later.”",
            choices: [
              {
                label: "Comply fully",
                effects: { rep: { compact: 6 }, credits: -10 },
                text:
                  "They find nothing worth a fine — or choose not to. A clerk stamps your lane " +
                  "pass like it hurts him to be fair. “Stay boring, Captain.”",
              },
              {
                label: "Talk your way lighter",
                roll: "talk",
                baseChance: 0.5,
                successText:
                  "You keep your voice level, your ledger cleaner than your past. " +
                  "They wave you on with a warning that almost sounds like respect.",
                failText:
                  "They dislike clever mouths. A ‘processing fee’ appears. Your name stays " +
                  "slightly colder in their files.",
                successEffects: { rep: { compact: 4 } },
                failEffects: { credits: -55, rep: { compact: -4 } },
              },
              {
                label: "Bribe the junior officer",
                effects: { credits: -70, rep: { compact: -8, veil: 2 } },
                text:
                  "Credits change hands under a maintenance panel. The scan becomes ‘routine noise.’ " +
                  "You leave lighter, dirtier, and very aware Compact memory is long.",
              },
              {
                label: "Hard refuse",
                effects: { rep: { compact: -12 }, hull: -3 },
                text:
                  "You lock holds and quote lane law until their patience snaps. They tag you " +
                  "uncooperative and give you a shove with a warning laser — symbolic, almost.",
              },
            ],
          },
        },
      },
      {
        id: "distress_pale_wake_echo",
        tier: "quick",
        weight: 10,
        faction: "veshari",
        tags: ["distress", "story", "travel"],
        title: "Distress Beacon — Thin Signal",
        start: "start",
        nodes: {
          start: {
            text:
              "A beacon ticks like a tired heart. Veshari cadence under the static — someone " +
              "trying to sound calmer than they are.\n\n“Anyone with spare air and a conscience. " +
              "We were told this lane was quiet. It isn’t.”",
            choices: [
              {
                label: "Divert and help",
                effects: {
                  fuel: -8,
                  credits: -25,
                  rep: { veshari: 10, compact: 2 },
                  cargoAdd: { pharm: 1 },
                },
                text:
                  "You burn fuel you don’t really have. They live. An elder presses a half-used " +
                  "pharm crate into your hold and a story into your ear: ships that vanish on " +
                  "‘routine’ runs still get whispered about. Your compass feels heavier.",
              },
              {
                label: "Mark the beacon for Compact patrol",
                effects: { rep: { compact: 5, veshari: -4 } },
                text:
                  "You do the ‘correct’ thing. Correct is not always kind. The channel goes quiet " +
                  "in a way that will visit you at 0300 ship-time.",
              },
              {
                label: "Ignore — you can’t save everyone",
                effects: { rep: { veshari: -6 } },
                text:
                  "You keep heading. The beacon falls behind like a star that chose not to be one. " +
                  "The ship feels larger and emptier at once.",
              },
              {
                label: "Talk them through a patch-fix remotely",
                roll: "talk",
                baseChance: 0.55,
                successText:
                  "Your voice becomes a checklist. Their engineer laughs once, sharp with relief. " +
                  "They limp toward Driftgarden. Someone will buy you tea who doesn’t know your name yet.",
                failText:
                  "Static wins. You never learn if the silence is success or an ending. " +
                  "You log the coordinates anyway.",
                successEffects: { rep: { veshari: 7 }, fuel: -2 },
                failEffects: { rep: { veshari: -2 } },
              },
            ],
          },
        },
      },
      {
        id: "korr_tug_dispute",
        tier: "quick",
        weight: 9,
        faction: "korr",
        tags: ["industrial", "travel"],
        title: "Korr Tug and a Claim Marker",
        start: "start",
        nodes: {
          start: {
            text:
              "A Korr tug straddles a claim buoy like a boulder that learned thrusters. " +
              "The pilot’s voice is gravel in a drum.\n\n“Lane’s closed for extraction. " +
              "You want through, you help move mass — or you pay the toll of inconvenience.”",
            choices: [
              {
                label: "Help haul (honest work)",
                effects: { fuel: -5, credits: 35, rep: { korr: 8 } },
                text:
                  "You put the Morrowlit’s tired engines to use. The Korr doesn’t thank you with " +
                  "words — they transfer credits and a nod that means more. “Voss paid docks on time. " +
                  "Some of us remember.”",
              },
              {
                label: "Pay the toll",
                effects: { credits: -45, rep: { korr: 2 } },
                text: "Clean. Impersonal. The buoy drifts aside. Business continues.",
              },
              {
                label: "Challenge the claim",
                roll: "talk",
                baseChance: 0.4,
                successText:
                  "You cite overlapping rights carefully. The Korr grumbles, checks a slate, " +
                  "and yields a half-lane. Respect, earned ugly.",
                failText:
                  "They are unimpressed by cleverness. A warning shot scorches paint. " +
                  "You take the long way with a colder reputation.",
                successEffects: { rep: { korr: 5 } },
                failEffects: { hull: -5, rep: { korr: -6 } },
              },
              {
                label: "Force the lane",
                roll: "combat",
                baseChance: 0.35,
                successText: "They back off rather than escalate. You pass. Nobody feels proud.",
                failText: "Industrial magnets and stubbornness win. Your hull learns a new dent.",
                successEffects: { rep: { korr: -8 } },
                failEffects: { hull: -12, rep: { korr: -10 } },
              },
            ],
          },
        },
      },
      {
        id: "veshari_rumor_merchant",
        tier: "quick",
        weight: 10,
        faction: "veshari",
        tags: ["social", "travel", "rumor"],
        title: "A Veshari with Tea and Teeth",
        start: "start",
        nodes: {
          start: {
            text:
              "A slim courier ship matches velocity as if by accident. Neck plumage iridesces, " +
              "then flattens — honesty or performance, you can’t tell.\n\n“Captain Voss. Buy a story " +
              "about vanished runs? Or sell me one. I pay better for truths that hurt.”",
            choices: [
              {
                label: "Buy the rumor",
                effects: { credits: -40, rep: { veshari: 4 } },
                text:
                  "She speaks of Helix Transit clerks who refile ‘lost’ manifests after midnight. " +
                  "No proof — only a direction of weather. Your sealed ledger page feels warmer.",
              },
              {
                label: "Share a careful half-truth",
                roll: "talk",
                baseChance: 0.55,
                successText:
                  "You give her weather, not coordinates. She pays in lane tips and a smile " +
                  "that might be real. “Come to Glassmarket. Liss charges by the sip.”",
                failText:
                  "She hears the shape of what you hide. “Interesting.” No payment — only a " +
                  "new interest in your heading.",
                successEffects: { credits: 30, rep: { veshari: 6 } },
                failEffects: { rep: { veshari: 1, compact: -2 } },
              },
              {
                label: "Decline politely",
                effects: { rep: { veshari: 1 } },
                text: "She salutes with a cup you can’t see. “Another lane, another life.”",
              },
              {
                label: "Warn her off Helix gossip",
                effects: { rep: { compact: 3, veshari: -3 } },
                text:
                  "You sound like every frightened clerk. She tilts her head. “Ah. You’ve already " +
                  "met the quiet kind of power.” She peels away, disappointed in a gentle way.",
              },
            ],
          },
        },
      },
      {
        id: "ghost_silk_runners",
        tier: "quick",
        weight: 9,
        faction: "veil",
        tags: ["contraband", "travel"],
        title: "Ghost Silk on the Side Channel",
        start: "start",
        nodes: {
          start: {
            text:
              "A Freehold runner pings you with a silk-code handshake. Beautiful and illegal " +
              "in the same breath.\n\n“Bulk discount if you buffer a crate through Compact light. " +
              "Or buy clean and pretend you’re virtuous.”",
            choices: [
              {
                label: "Buy a small lot",
                effects: {
                  credits: -110,
                  cargoAdd: { ghost_silk: 2 },
                  rep: { veil: 5, compact: -3 },
                },
                text:
                  "The fabric feels like cold water and bad decisions. Your hold is more interesting " +
                  "and more fragile.",
              },
              {
                label: "Refuse — not today",
                effects: { rep: { compact: 2 } },
                text: "They shrug. The galaxy has other fools. You keep your ledger boring.",
              },
              {
                label: "Report them to Compact",
                effects: { rep: { compact: 8, veil: -10 }, credits: 25 },
                text:
                  "A bounty crumb lands in your account. Somewhere, a Freehold captain adds your " +
                  "name to a less friendly list.",
              },
              {
                label: "Haggle hard",
                roll: "talk",
                baseChance: 0.5,
                successText: "They curse, then laugh. Better rate. Respect among thieves-adjacent.",
                failText: "They take offense and jack the price. Or you walk. Either way, pride bruises.",
                successEffects: {
                  credits: -85,
                  cargoAdd: { ghost_silk: 2 },
                  rep: { veil: 7 },
                },
                failEffects: { rep: { veil: -2 } },
              },
            ],
          },
        },
      },
      {
        id: "anomaly_static_choir",
        tier: "quick",
        weight: 8,
        faction: "compact",
        tags: ["anomaly", "travel"],
        title: "Static Choir",
        start: "start",
        nodes: {
          start: {
            text:
              "Instruments sing a chord that isn’t in any manual. Stars smear. For a second you " +
              "hear a freighter hail in a voice like Halden’s — then it’s only interference.\n\n" +
              "Something wants a decision: push through, turn aside, or listen longer.",
            choices: [
              {
                label: "Push through",
                roll: "flee",
                baseChance: 0.55,
                successText: "The smear breaks. Sweat cools. You pretend your hands are steady.",
                failText: "Systems brown out. Fuel dumps into a correction burn. Reality reasserts, rude.",
                successEffects: { fuel: -3 },
                failEffects: { fuel: -12, hull: -4 },
              },
              {
                label: "Listen (record the chord)",
                effects: { rep: { veshari: 3 }, credits: 15 },
                text:
                  "You capture a fragment. A Veshari archivist will pay for strange songs. " +
                  "You also sleep worse for a week.",
              },
              {
                label: "Turn aside",
                effects: { fuel: -5 },
                text: "Cowardice and wisdom share a face out here. You take the long arc.",
              },
              {
                label: "Broadcast a greeting",
                effects: { rep: { compact: -2, veil: 2 } },
                text:
                  "Nothing answers in words. Something answers in pressure on the hull — a pat, " +
                  "almost fond. You file it under ‘do not discuss in Compact bars.’",
              },
            ],
          },
        },
      },
      {
        id: "jex_morrow_passby",
        tier: "quick",
        weight: 8,
        faction: "veil",
        tags: ["rival", "travel", "character"],
        title: "Jex Morrow on Parallel Course",
        start: "start",
        nodes: {
          start: {
            text:
              "Copper hair on the holo, jacket too fine for honest freight. Jex Morrow smiles " +
              "like a knife that learned manners.\n\n“Don’t look wounded, Voss. We’re both flying " +
              "the same unpaid debt. Yours just has a prettier name. Race you to the next rumor?”",
            choices: [
              {
                label: "Race (pride)",
                roll: "flee",
                baseChance: 0.48,
                successText:
                  "You beat them by a whisper. Jex laughs over channel. “Fine. Drinks on me if " +
                  "we both live long enough to be sentimental.”",
                failText:
                  "They take the lane line. “Better luck, heirloom compass.” Your pride needs a patch kit.",
                successEffects: { fuel: -8, credits: 20, rep: { veil: 3 } },
                failEffects: { fuel: -8, rep: { veil: 1 } },
              },
              {
                label: "Share a scrap of trail",
                effects: { rep: { veil: 4, compact: -1 } },
                text:
                  "You trade a careful breadcrumb. Jex’s eyes sharpen. “Helix still smiling in public. " +
                  "Good. I hate lonely wars.”",
              },
              {
                label: "Needle them back",
                effects: { rep: { veil: -2 } },
                text:
                  "You land a verbal cut. They tip an imaginary hat. “Keep the edge. Soft captains " +
                  "don’t finish stories.”",
              },
              {
                label: "Ignore and fly on",
                effects: {},
                text: "Sometimes the rivalry can wait. Jex doesn’t chase. Yet.",
              },
            ],
          },
        },
      },
      {
        id: "fuel_leech_drifter",
        tier: "quick",
        weight: 8,
        faction: "veil",
        tags: ["travel", "scam"],
        title: "Friendly Drifter, Hungry Hose",
        start: "start",
        nodes: {
          start: {
            text:
              "A patched shuttle waves a white-band hail. “Spare tank? Kids aboard. Honest.” " +
              "Your instruments suggest a second power signature tucked under their belly.",
            choices: [
              {
                label: "Give fuel freely",
                effects: { fuel: -10, rep: { veil: 6, veshari: 2 } },
                text:
                  "Maybe there are kids. Maybe not. You sleep like someone who can still choose kindness.",
              },
              {
                label: "Offer help, watch the hose",
                roll: "talk",
                baseChance: 0.55,
                successText:
                  "You catch the leech-pump. They bolt. You keep your fuel and a story Pax will hate.",
                failText:
                  "They’re faster. A gulp of your tank becomes theirs. At least nobody shot.",
                successEffects: { rep: { veil: 2 } },
                failEffects: { fuel: -14, rep: { veil: -1 } },
              },
              {
                label: "Refuse and arm weapons",
                effects: { rep: { veil: -3 } },
                text: "They vanish into clutter. Your guns cool. The galaxy stays complicated.",
              },
              {
                label: "Report the scam signature",
                effects: { rep: { compact: 4, veil: -4 }, credits: 15 },
                text: "Compact pays a small finder’s fee. Freehold captains will hear about your diligence.",
              },
            ],
          },
        },
      },
      {
        id: "ashline_ore_convoy",
        tier: "quick",
        weight: 8,
        faction: "korr",
        tags: ["trade", "travel"],
        title: "Ashline Ore Convoy",
        start: "start",
        nodes: {
          start: {
            text:
              "A Korr convoy crawls like a mountain range with engines. Their lead offers a " +
              "contract: escort through a noisy sector for ore and goodwill.",
            choices: [
              {
                label: "Accept escort duty",
                roll: "combat",
                baseChance: 0.55,
                successText:
                  "Raiders test the line once and leave. Ore transfers. The convoy master grunts approval.",
                failText:
                  "You hold, but the hull takes the lesson. Payment is less; respect is complicated.",
                successEffects: {
                  credits: 60,
                  cargoAdd: { ore: 5 },
                  rep: { korr: 7 },
                  hull: -3,
                },
                failEffects: { hull: -10, credits: 20, rep: { korr: 3 } },
              },
              {
                label: "Decline — solo lane",
                effects: {},
                text: "They understand solitude. The convoy becomes a constellation behind you.",
              },
              {
                label: "Buy cheap ore from the tail barge",
                effects: { credits: -40, cargoAdd: { ore: 6 }, rep: { korr: 2 } },
                text: "Honest bulk. Your hold smells like industry and futures.",
              },
              {
                label: "Warn them of Freehold cutters",
                effects: { rep: { korr: 5, veil: -3 } },
                text: "They adjust formation. You make a friend and an absence of friends elsewhere.",
              },
            ],
          },
        },
      },
      {
        id: "quiet_verge_medics",
        tier: "quick",
        weight: 9,
        faction: "veil",
        tags: ["frontier", "travel"],
        title: "Last Light Medics",
        start: "start",
        nodes: {
          start: {
            text:
              "A frontier clinic-ship limps with more patients than beds. A tired voice: " +
              "“Pharm stock, coolant, anything. We can pay in gratitude and bad coffee.”",
            choices: [
              {
                label: "Donate pharm if you have it",
                // effects resolved dynamically if no pharm — engine handles cargoAdd only;
                // use credits path as fallback via two choices - keep simple: always allow donate credits or cargo
                effects: { rep: { veil: 8, veshari: 3 }, credits: -30 },
                text:
                  "Whether from hold or purse, help lands. A child sleeps without shaking. " +
                  "Someone says your parent once did the same on this run.",
              },
              {
                label: "Sell at fair frontier rates",
                effects: { credits: 50, rep: { veil: 4 }, cargoAdd: { seeds: 1 } },
                text:
                  "You don’t gouge. They don’t forget. A bag of lumen seeds is pressed into your hands — hope as currency.",
              },
              {
                label: "Sell hard (profit)",
                effects: { credits: 90, rep: { veil: -6 } },
                text: "Credits climb. Eyes cool. You leave richer and smaller.",
              },
              {
                label: "Can’t help — empty holds",
                effects: { rep: { veil: -1 } },
                text: "Truth is sometimes just scarcity. They nod. The lane continues.",
              },
            ],
          },
        },
      },
      {
        id: "helix_soft_approach",
        tier: "quick",
        weight: 7,
        faction: "compact",
        tags: ["story", "helix", "travel"],
        title: "A Polite Helix Channel",
        start: "start",
        nodes: {
          start: {
            text:
              "Encrypted polish. A voice like customer care for empires.\n\n“Captain Voss — " +
              "Helix Transit well-being outreach. We’ve noticed irregular curiosity around old " +
              "loss claims. We can smooth finances if you smooth questions.”",
            choices: [
              {
                label: "Take the quiet money",
                effects: { credits: 150, rep: { compact: -5, veil: -3 } },
                text:
                  "The transfer is clean enough to feel dirty. Somewhere, a file about Halden " +
                  "gets another polite stamp.",
              },
              {
                label: "Refuse on principle",
                effects: { rep: { compact: -4, veshari: 3, veil: 3 } },
                text:
                  "You keep your questions. They keep your name. The channel closes like a smile.",
              },
              {
                label: "Fish for information",
                roll: "talk",
                baseChance: 0.4,
                successText:
                  "You pry a slip: ‘Pale Wake’ is a restricted internal phrase. The agent recovers " +
                  "fast. Too fast.",
                failText:
                  "They note your fishing. A future inspection just got more personal.",
                successEffects: { rep: { compact: -6 } },
                failEffects: { rep: { compact: -8 } },
              },
              {
                label: "Record and ignore",
                effects: { rep: { compact: -1 } },
                text: "You log the call. Proof is a mosaic; this is one tile.",
              },
            ],
          },
        },
      },
      {
        id: "dockside_musician",
        tier: "quick",
        weight: 7,
        faction: "veshari",
        tags: ["slice", "travel"],
        title: "Bulkhead Musician",
        start: "start",
        nodes: {
          start: {
            text:
              "Between lanes, a Veshari busker’s signal rides a maintenance relay — illegal, " +
              "harmless, lovely. The song is about ships that don’t come home, without saying so.",
            choices: [
              {
                label: "Tip generously",
                effects: { credits: -20, rep: { veshari: 5 } },
                text: "The next verse brightens. You are, briefly, part of someone else’s hope.",
              },
              {
                label: "Request the old Voss work-song",
                effects: { rep: { veshari: 3 } },
                text:
                  "They know a fragment. Your throat tightens. Memory is a freighter with bad seals.",
              },
              {
                label: "Report the illegal relay",
                effects: { rep: { compact: 3, veshari: -5 } },
                text: "The song dies mid-note. Order is restored. Something kinder isn’t.",
              },
              {
                label: "Listen in silence",
                effects: {},
                text: "You don’t pay. You don’t spoil it. Some things you just carry.",
              },
            ],
          },
        },
      },
      {
        id: "rival_scavenger",
        tier: "quick",
        weight: 8,
        faction: "veil",
        tags: ["scavenge", "travel"],
        title: "Claim Jumpers Ahead",
        start: "start",
        nodes: {
          start: {
            text:
              "Wreck-light blooms. Another scavenger ship is already stripping a carcass on your " +
              "vector. Hard faces. Mag-clamps. The universe’s least romantic dinner table.",
            choices: [
              {
                label: "Negotiate a split",
                roll: "talk",
                baseChance: 0.5,
                successText: "Half a hold of scrap and no new holes. Civilization, of a kind.",
                failText: "Talk fails. Shots don’t. You leave with less pride and less plating.",
                successEffects: { cargoAdd: { ore: 3, circuits: 1 }, rep: { veil: 3 } },
                failEffects: { hull: -8, rep: { veil: -2 } },
              },
              {
                label: "Back off",
                effects: { rep: { veil: 1 } },
                text: "You live to scavenge another day. They watch until you’re a rumor of thrust.",
              },
              {
                label: "Contest the claim",
                roll: "combat",
                baseChance: 0.45,
                successText: "They cut lines and run. The wreck is yours, and so is the bad blood.",
                failText: "You are the one who runs. Hull smoking. Lesson expensive.",
                successEffects: {
                  cargoAdd: { circuits: 3, coolant: 2 },
                  rep: { veil: -5 },
                  hull: -5,
                },
                failEffects: { hull: -12, rep: { veil: -3 } },
              },
              {
                label: "Tip them a safer wreck coordinate",
                effects: { rep: { veil: 6 }, credits: -5 },
                text: "Generosity as strategy. They owe you a lane story later.",
              },
            ],
          },
        },
      },
    ],

    deep: [
      {
        id: "compact_detention",
        tier: "deep",
        weight: 14,
        faction: "compact",
        tags: ["authority", "deep", "inspection"],
        title: "Detained at the Light",
        start: "arrival",
        nodes: {
          arrival: {
            text:
              "They don’t shoot. They simply own the lane.\n\nA Compact security skiff boxes " +
              "the Morrowlit with bureaucratic grace. Mag-locks kiss your hull. On the dock of a " +
              "transit node that doesn’t even have a name on tourist charts, Dock Officer Brann Hale " +
              "waits with a slate and an exhaustion that looks permanent.\n\n“Captain Rin Voss. " +
              "Hold inspection became a detention when your registry pinged… old Helix-adjacent flags. " +
              "You’re not under arrest. You’re under explanation.”",
            choices: [
              {
                label: "Stay calm — ask what the flags say",
                next: "ask_flags",
              },
              {
                label: "Demand a lawyer / Compact rights",
                next: "rights",
                effects: { rep: { compact: -2 } },
              },
              {
                label: "Offer a ‘processing courtesy’ (bribe)",
                next: "bribe_attempt",
                effects: { credits: -60 },
              },
              {
                label: "Look for a way to bolt",
                next: "bolt_check",
              },
            ],
          },
          ask_flags: {
            text:
              "Hale’s mouth twists. Not cruel — tired.\n\n“Your parent’s last run sits in a " +
              "folder people pretend is closed. Curiosity from a Voss ship makes clerks nervous. " +
              "Nervous clerks make my shift longer.”\n\nBehind him, a junior officer watches your " +
              "hands. The air smells like recycled courage.",
            choices: [
              {
                label: "Tell the truth: you’re piecing family history",
                next: "truth",
              },
              {
                label: "Lie — pure trade, nothing personal",
                roll: "talk",
                baseChance: 0.45,
                successNext: "lie_works",
                failNext: "lie_fails",
                successText: "Hale buys enough of it to relax a fraction.",
                failText: "Hale has heard better lies from better pirates.",
              },
              {
                label: "Ask who benefits from the folder staying closed",
                next: "who_benefits",
                effects: { rep: { compact: -3 } },
              },
            ],
          },
          rights: {
            text:
              "You recite Compact lane rights like a prayer with teeth. Hale endures it.\n\n" +
              "“You can have rights. You can also have a forty-hour hold while rights travel " +
              "upstairs. Or we can be people for ten minutes.”",
            choices: [
              {
                label: "Softening — try being people",
                next: "truth",
                effects: { rep: { compact: 2 } },
              },
              {
                label: "Double down on procedure",
                next: "hard_procedure",
              },
              {
                label: "Bribe now that the mood is worse",
                next: "bribe_attempt",
                effects: { credits: -80 },
              },
            ],
          },
          bribe_attempt: {
            text:
              "You slide the offer into conversation like contraband under a coat. Hale’s eyes " +
              "flick to the junior officer, then back.",
            choices: [
              {
                label: "Commit to the bribe",
                roll: "bribe",
                baseChance: 0.5,
                successNext: "bribe_ok",
                failNext: "bribe_bad",
                successText: "The slate’s error log grows a convenient glitch.",
                failText: "The junior hears. Everything becomes louder.",
                successEffects: { credits: -40, rep: { compact: -10 } },
                failEffects: { credits: -40, rep: { compact: -16 }, hull: -2 },
              },
              {
                label: "Withdraw — bad idea",
                next: "ask_flags",
                effects: { rep: { compact: 1 } },
              },
            ],
          },
          bolt_check: {
            text:
              "You measure mag-lock strength, thruster angle, the junior’s trigger discipline. " +
              "Fleeing is possible. Living well after fleeing is a different math.",
            choices: [
              {
                label: "Attempt breakout",
                roll: "flee",
                baseChance: 0.35,
                successNext: "bolt_success",
                failNext: "bolt_fail",
                successText: "Locks shear. You run like a rumor.",
                failText: "They expected a runner. Pain follows.",
                successEffects: { fuel: -12, hull: -8, rep: { compact: -18 } },
                failEffects: { hull: -16, credits: -50, rep: { compact: -14 } },
              },
              {
                label: "Abort — stay and talk",
                next: "ask_flags",
              },
            ],
          },
          truth: {
            text:
              "You say Halden’s name like a dock fee you still owe.\n\nHale is quiet long enough " +
              "for the life support to sound loud. “I can’t open that folder. I can pretend your " +
              "holds are cleaner than they are, if you stop looking like a threat to people with " +
              "titles.”\n\nIt’s not friendship. It’s a weather report.",
            choices: [
              {
                label: "Accept the deal — keep hunting quieter",
                effects: { rep: { compact: 8, veshari: 2 }, credits: -20 },
                text:
                  "You’re released with a warning that sounds almost like care. Market clerks " +
                  "in Compact space will remember a Voss who didn’t spit in their paperwork.",
              },
              {
                label: "Push for one name: who sealed the folder?",
                next: "who_benefits",
              },
              {
                label: "Refuse any leash",
                effects: { rep: { compact: -10 }, hull: -3 },
                text:
                  "They let you go because jails cost money. Your standing drops like a tool " +
                  "off a catwalk. Future Compact prices will notice.",
              },
            ],
          },
          lie_works: {
            text:
              "Hale signs something dismissive. “Fine. Be a boring trader.”\n\nYou are free, " +
              "and slightly ashamed of how easy the mask was.",
            choices: [
              {
                label: "Leave before the mask slips",
                effects: { rep: { compact: 3 } },
                text: "Dock clamps release. The lane opens. Your story stays yours for now.",
              },
            ],
          },
          lie_fails: {
            text:
              "“Don’t insult us both,” Hale says. The junior steps closer. Options narrow.",
            choices: [
              {
                label: "Tell the truth now",
                next: "truth",
                effects: { rep: { compact: -3 } },
              },
              {
                label: "Offer a larger bribe",
                next: "bribe_attempt",
                effects: { credits: -30 },
              },
              {
                label: "Submit to full fine and lecture",
                effects: { credits: -100, rep: { compact: -6 } },
                text:
                  "You pay. You nod. You leave smaller. Compact space will charge you for breathing " +
                  "a little longer.",
              },
            ],
          },
          who_benefits: {
            text:
              "Hale’s face does something almost like fear — not of you.\n\n“Helix Transit " +
              "doesn’t like old oxygen stories. That’s all you get. If you’re smart, that’s all " +
              "you want.”\n\nThe name sits in the air between you: corporate, polished, external " +
              "to the Compact’s proud uniform — and somehow always nearby.",
            choices: [
              {
                label: "Thank him and leave carefully",
                effects: { rep: { compact: 5, veil: 2 } },
                text:
                  "You gain a thread of the Pale Wake without making Hale a martyr. " +
                  "Outside, prices in Compact docks feel a shade less hostile.",
              },
              {
                label: "Ask him to risk more",
                effects: { rep: { compact: -8 } },
                text:
                  "He shuts down. You’re escorted out with a black mark. Some doors open only once.",
              },
            ],
          },
          hard_procedure: {
            text:
              "Hours blur into forms. Your fuel sits idle. Eventually they release you with " +
              "a fine for ‘attitude’ — a real line item.",
            choices: [
              {
                label: "Endure and go",
                effects: { credits: -70, fuel: -5, rep: { compact: -7 } },
                text: "You leave procedurally pure and spiritually dented.",
              },
            ],
          },
          bribe_ok: {
            text:
              "Hale doesn’t smile. He just stops seeing you. The junior finds a reason to check " +
              "a different freighter.",
            choices: [
              {
                label: "Slip back to the lane",
                effects: { rep: { compact: -4, veil: 3 } },
                text:
                  "Freedom, purchased. Compact standing suffers; Freehold captains might buy you a drink.",
              },
            ],
          },
          bribe_bad: {
            text:
              "Now it’s a real incident. Mag-locks tighten. Hale’s disappointment is almost " +
              "worse than anger.",
            choices: [
              {
                label: "Submit",
                effects: { credits: -120, rep: { compact: -12 }, hull: -4 },
                text: "Fines. A hull slap. A lesson about who you try to buy.",
              },
              {
                label: "Last-ditch bolt",
                roll: "flee",
                baseChance: 0.25,
                successText: "Ugly escape. Ugly reputation.",
                failText: "They drag you back. Everything costs more.",
                successEffects: { fuel: -15, hull: -12, rep: { compact: -20 } },
                failEffects: { credits: -150, hull: -18, rep: { compact: -18 } },
              },
            ],
          },
          bolt_success: {
            text: "Stars smear into freedom. Alerts will follow like dogs.",
            choices: [
              {
                label: "Run dark toward Freehold space",
                effects: { rep: { compact: -5, veil: 6 } },
                text: "Veil docks will hear you chose motion over manners. Compact clerks will not forget.",
              },
            ],
          },
          bolt_fail: {
            text: "The skiff’s magnets teach physics. You wake to restraints and a bill.",
            choices: [
              {
                label: "Pay and apologize",
                effects: { credits: -130, rep: { compact: -10 }, hull: -10 },
                text: "You re-enter the lane poorer, sorer, and correctly afraid of paperwork.",
              },
            ],
          },
        },
      },
      {
        id: "veil_favor_chain",
        tier: "deep",
        weight: 11,
        faction: "veil",
        tags: ["deep", "favor", "social"],
        title: "A Favor with Teeth",
        start: "barter",
        nodes: {
          barter: {
            text:
              "A Freehold fixer boards under guest-right with two cups of terrible coffee. " +
              "“Captain Voss. Your name still opens a few outer airlocks. I need a crate moved " +
              "past a Compact sniff without it becoming a war. Pay is credits, standing, and " +
              "a rumor about vanished freighters — the good kind of rumor.”",
            choices: [
              {
                label: "Accept the job",
                next: "job_accept",
                effects: { rep: { veil: 4 } },
              },
              {
                label: "Refuse cleanly",
                effects: { rep: { veil: -2, compact: 2 } },
                text: "They leave without spite. The rumor stays unbought. Your life stays simpler — for now.",
              },
              {
                label: "Demand the rumor first",
                roll: "talk",
                baseChance: 0.5,
                successNext: "rumor_first_ok",
                failNext: "rumor_first_fail",
                successText: "They reluctantly front the rumor before the job.",
                failText: "No rumor without work — they make that clear.",
              },
            ],
          },
          job_accept: {
            text:
              "The crate is small and heavy with implication. Your hold feels like it grew a secret.",
            choices: [
              {
                label: "Run quiet and legal-looking",
                roll: "talk",
                baseChance: 0.55,
                successNext: "job_success",
                failNext: "job_flagged",
                successText: "Inspectors see a boring freighter. Miracle.",
                failText: "Someone gets curious.",
              },
              {
                label: "Run dark through clutter",
                roll: "flee",
                baseChance: 0.5,
                successNext: "job_success",
                failNext: "job_chase",
              },
              {
                label: "Dump the crate — too hot",
                effects: { rep: { veil: -12, compact: 4 } },
                text:
                  "You jettison obligation. Freehold memory turns sharp. Compact might even thank you someday.",
              },
            ],
          },
          rumor_first_ok: {
            text:
              "They sigh and pay in story: Halden’s last filed plan had a second stop never " +
              "entered into public ledgers — near Pale Harbor’s quiet side.",
            choices: [
              {
                label: "Now take the job",
                next: "job_accept",
                effects: { rep: { veil: 2 } },
              },
              {
                label: "Walk with the rumor only",
                effects: { rep: { veil: -6 }, credits: -10 },
                text: "You leave with a thread of truth and a burned bridge. Worth it? Ask your future self.",
              },
            ],
          },
          rumor_first_fail: {
            text: "“Rumor after work,” they say, smiling without warmth. “We’re not charities.”",
            choices: [
              {
                label: "Take the job anyway",
                next: "job_accept",
              },
              {
                label: "Walk away",
                effects: { rep: { veil: -4 } },
                text: "No crate. No rumor. Only the sense you blinked.",
              },
            ],
          },
          job_success: {
            text:
              "The crate vanishes into Freehold hands. Credits land. Standing rises. " +
              "The promised rumor arrives like a second sunrise: Helix paid quiet money " +
              "after the Pale Wake — not to families, to silence.",
            choices: [
              {
                label: "Accept pay and the weight of it",
                effects: {
                  credits: 120,
                  rep: { veil: 12, compact: -4 },
                  cargoAdd: { luxury: 1 },
                },
                text:
                  "You are richer in money and enemies. The compass turns in place, as if considering you.",
              },
            ],
          },
          job_flagged: {
            text: "A Compact ping sticks to your registry like tar.",
            choices: [
              {
                label: "Finish delivery anyway",
                roll: "flee",
                baseChance: 0.45,
                successNext: "job_success",
                failNext: "job_caught",
                successEffects: { hull: -5, rep: { compact: -6 } },
                failEffects: { credits: -40 },
              },
              {
                label: "Abandon job",
                effects: { rep: { veil: -10, compact: -4 } },
                text: "You please no one. The crate becomes someone else’s catastrophe.",
              },
            ],
          },
          job_chase: {
            text: "Cutters on your tail. The crate hums like guilt.",
            choices: [
              {
                label: "Jettison crate to escape",
                effects: { rep: { veil: -14 }, fuel: -6 },
                text: "You live. A Freehold fixer will not toast your name.",
              },
              {
                label: "Fight through",
                roll: "combat",
                baseChance: 0.4,
                successNext: "job_success",
                failNext: "job_caught",
                successEffects: { hull: -10, rep: { compact: -8 } },
                failEffects: { hull: -14 },
              },
            ],
          },
          job_caught: {
            text: "Mag-locks. Questions. The crate becomes evidence with your fingerprints.",
            choices: [
              {
                label: "Cooperate and cut losses",
                effects: { credits: -90, rep: { compact: -8, veil: -8 }, hull: -4 },
                text: "Fines. Cold standing on both sides. A lesson in jobs with teeth.",
              },
            ],
          },
        },
      },
      {
        id: "korr_forge_debt",
        tier: "deep",
        weight: 10,
        faction: "korr",
        tags: ["deep", "industrial", "character"],
        title: "Anvil Hours",
        start: "yard",
        nodes: {
          yard: {
            text:
              "Keel Yard heat. Forge-Mother Yrtak inspects the Morrowlit like a doctor who " +
              "expects bad news.\n\n“Your ship is a story of patches. Patches are honest. " +
              "Unpaid yard debts from the Voss name are also honest — and overdue.”",
            choices: [
              {
                label: "Pay what you can now",
                next: "pay_partial",
                effects: { credits: -80 },
              },
              {
                label: "Offer labor in the yard",
                next: "labor",
              },
              {
                label: "Dispute the debt",
                next: "dispute",
                roll: "talk",
                baseChance: 0.4,
                successNext: "dispute_win",
                failNext: "dispute_lose",
              },
              {
                label: "Walk away from Korr goodwill",
                effects: { rep: { korr: -12 } },
                text:
                  "Yrtak watches you leave without raising her voice. That is worse than shouting. " +
                  "Ashline prices will remember.",
              },
            ],
          },
          pay_partial: {
            text:
              "She weighs the transfer. “Not full. But motion toward full. Motion is respect.”",
            choices: [
              {
                label: "Ask for a hull patch on credit",
                effects: { hull: 8, credits: -20, rep: { korr: 6 } },
                text:
                  "They weld while you wait. The Morrowlit stands a little prouder. So do you.",
              },
              {
                label: "Leave it at partial payment",
                effects: { rep: { korr: 8 } },
                text: "Standing improves. The debt remains a scar, not a war.",
              },
            ],
          },
          labor: {
            text:
              "They put you on a mag-line hauling plate. Your hands blister. A Korr apprentice " +
              "shares water without smiling.",
            choices: [
              {
                label: "Finish the shift properly",
                effects: { hull: 5, rep: { korr: 12 }, fuel: -3 },
                text:
                  "Yrtak stamps your ledger. “Voss can still mean reliability. Do not waste my stamp.”",
              },
              {
                label: "Cut out early",
                effects: { rep: { korr: -6 } },
                text: "You save hours and lose a century of industrial memory.",
              },
            ],
          },
          dispute_win: {
            text:
              "Your figures hold. Yrtak rechecks, then grunts. “Error was ours. Rare. Do not brag.”",
            choices: [
              {
                label: "Accept the correction quietly",
                effects: { credits: 40, rep: { korr: 10 } },
                text: "A refund. A nod. Ashline markets will treat you less like a tourist.",
              },
            ],
          },
          dispute_lose: {
            text: "Your figures do not hold. The debt is real. So is her patience ending.",
            choices: [
              {
                label: "Apologize and pay",
                next: "pay_partial",
                effects: { rep: { korr: 2 } },
              },
              {
                label: "Leave angry",
                effects: { rep: { korr: -10 } },
                text: "Pride is a poor currency in a forge.",
              },
            ],
          },
        },
      },
    ],
  };
})(window);
