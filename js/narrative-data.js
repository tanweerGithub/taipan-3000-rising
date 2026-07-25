/**
 * Heritage beats, tavern texture, visit-time flavor — LORE tone.
 * Loaded after data.js.
 */
(function (global) {
  var D = global.GAME_DATA;
  if (!D) {
    console.error("narrative-data.js requires data.js first");
    return;
  }

  /**
   * Milestone-triggered heritage story (coordinate-agnostic).
   * order: lower fires first when multiple become true same tick.
   */
  D.storyBeats = [
    {
      id: "ash",
      order: 10,
      title: "Ash on the Receipt",
      trigger: { type: "uniqueStations", count: 3 },
      body:
        "A dockhand at your third proper stop squints at the Voss name on your forms " +
        "and laughs once, without cruelty.\n\n“Halden? That one came through after the " +
        "insurers already closed the file. Had a pharm crate that didn’t smell like pharm. " +
        "Told me not to write the date wrong if I liked breathing.”\n\n" +
        "Your sealed ledger page feels heavier. Someone remembers your parent " +
        "after the official ending.",
    },
    {
      id: "ledger",
      order: 20,
      title: "The Ledger Opens a Crack",
      trigger: { type: "flag", flag: "tookLoan" },
      body:
        "Debt has a way of clarifying ink. With Quill’s numbers cooling in your account, " +
        "you lay Halden’s sealed page under better light.\n\nA second hand wrote beneath " +
        "the official cargo line — faint, hurried: not only pharm. Witness canisters. " +
        "Memory-proof. Do not dock where Helix smiles.\n\n" +
        "The family mystery stops being only absence. It becomes cargo you were never meant to name.",
    },
    {
      id: "name",
      order: 30,
      title: "A Name with Polished Teeth",
      trigger: { type: "netWorth", amount: 1800 },
      body:
        "Credits stack high enough that clerks stop treating you like weather. " +
        "In the same week, three different mouths say the same firm like a prayer and a threat:\n\n" +
        "Helix Transit.\n\n" +
        "Public face of clean manifests and quiet payouts. External to the Compact’s proud uniform — " +
        "and somehow always nearby when old oxygen stories need to stay sealed. " +
        "Your net worth just bought you a better class of enemy.",
    },
    {
      id: "rival_mirror",
      order: 40,
      title: "Jex’s Parallel Debt",
      /** Only after Compact detention (deep) or Jex Morrow pass-by — not any deep encounter. */
      trigger: { type: "flag", flag: "metRivalMirror" },
      body:
        "After a detention that felt personal, a copper-haired silhouette finds you on a side channel. " +
        "Jex Morrow doesn’t mock this time.\n\n“My sibling flew Helix contract work the year the " +
        "Pale Wake got renamed ‘systems failure.’ Don’t look wounded, Voss — we’re flying the same " +
        "unpaid debt. Yours has a prettier name. Mine has a quieter grave.”\n\n" +
        "Rivalry sharpens into something almost like alliance. Almost.",
    },
    {
      id: "pale_wake",
      order: 50,
      title: "What the Canisters Held",
      trigger: { type: "allPrior", ids: ["ash", "ledger", "name"] },
      body:
        "Fragments finally lock. The memory-proof canisters weren’t salvage — they were testimony. " +
        "Survivors of a habitat that lost atmosphere while Helix paperwork claimed routine failure. " +
        "Falsified safety reports. Families paid quiet money to stop asking.\n\n" +
        "Halden tried to move the truth somewhere it couldn’t be bought. " +
        "That is why the official story preferred raiders.",
    },
    {
      id: "capstone",
      order: 60,
      title: "Where the Trail Ends",
      trigger: { type: "allPrior", ids: ["pale_wake", "rival_mirror"] },
      body:
        "You find the last fold of the map — not a triumph, not pure tragedy. " +
        "Halden’s trail ends in a choice you can still almost hear: get the proof out, " +
        "or keep a child from inheriting a war with a corporation that never blinks.\n\n" +
        "There is a last message meant for you. There is also silence where a living voice might have been. " +
        "What you do with Helix’s name — release, bury, sell leverage — is yours now.\n\n" +
        "The lanes stay open. The empire of small freights continues. The story has a spine, and an ending that lets you keep flying.",
    },
  ];

  /** Pax / ambient lines keyed by visit phase. */
  D.tavernContent = {
    keeperGreetings: {
      first: [
        "“You look like your parent before a long run. Sit. Money hears better when you’re not shaking.”",
        "“First time through my door with that compass? Sit down before the coffee notices you’re nervous.”",
      ],
      return_soon: [
        "“Back already? Either the lanes loved you or they spat you out polite.”",
        "“You left a cup-ring on my counter last time. I kept it. Superstition’s free.”",
      ],
      return_later: [
        "“Been a few hops. Your face learned a new weather. Sit — tell me which dock taught it.”",
        "“I almost retired your stool. Then I remembered Voss captains never stay gone cleanly.”",
      ],
      indebted: [
        "“Quill’s numbers walk in before you do. Don’t apologize. Just drink something that isn’t pride.”",
        "“Debt sits on the shoulders wrong. I can’t fix interest. I can fix the silence around it.”",
      ],
    },

    atmospheres: {
      first: [
        "Warm light, recycled coffee, bulkhead music you feel more than hear. The room is learning your silhouette.",
        "Off-shift hands argue softly about Ghost Silk like it’s weather, not crime.",
      ],
      return_soon: [
        "Same booth stains. Different song on the relay. Someone swept; the dust came back on purpose.",
        "The bar remembers your order before you do. That should comfort you more than it does.",
      ],
      return_later: [
        "A stool that was always occupied is empty. Nobody explains. Nobody needs to.",
        "The lights dim earlier than last visit — dock policy or mood, hard to tell.",
      ],
      late_turn: [
        "Late-cycle quiet. Even the liars lower their voices. The Marches feel thinner after midnight.",
        "A maintenance drone hums past the window like a tired thought.",
      ],
    },

    faces: {
      first: [
        "Dock hands off-shift, still wearing glove marks.",
        "A Veshari courier nursing cold tea, plumage half-flat.",
        "Empty stool with Jex Morrow’s name on a rumor (not present).",
      ],
      return_soon: [
        "The same courier, different tea, same careful eyes.",
        "A Korr apprentice asleep upright against a crate.",
        "Two Freehold runners arguing about a claim buoy in Ashline.",
      ],
      return_later: [
        "New faces in old jackets — the room turned over while you flew.",
        "A Compact clerk off-duty, trying to look like they don’t audit people for fun.",
        "Someone leaves when you enter. Coincidence, you tell yourself.",
      ],
    },

    /**
     * Rumors: weight + tags. staleAfterVisits: if player heard this id before and visits advanced, prefer others.
     */
    rumors: [
      {
        id: "r_halden_date",
        text:
          "A clerk swears Halden Voss’s last stamp is wrong by two days — post-loss, pre-quiet. “Don’t quote me. Quote the ink.”",
      },
      {
        id: "r_helix_smiles",
        text:
          "Helix Transit buys drinks for widows and NDAs for dockhands. Polite as a scalpel.",
      },
      {
        id: "r_ghost_silk_redwake",
        text:
          "Ghost Silk is cheap in Blacktide this cycle and expensive wherever Compact smiles. Surprise.",
      },
      {
        id: "r_pharm_verge",
        text:
          "Last Light is paying stupid prices for pharm stock. Frontier lungs don’t care about your margins.",
      },
      {
        id: "r_korr_debt",
        text:
          "Keel Yard’s still carrying old Voss yard marks. Forge-Mother Yrtak forgets nothing that can be weighed.",
      },
      {
        id: "r_jex_ahead",
        text:
          "Jex Morrow was here yesterday asking about Pale Harbor’s quiet side. Left a tip too large to be friendly.",
      },
      {
        id: "r_pale_wake_name",
        text:
          "Someone whispers “Pale Wake” and gets shushed like they said a real god’s name in a cheap bar.",
      },
      {
        id: "r_veshari_song",
        text:
          "A bulkhead musician’s been singing about ships that don’t come home. Pax tips them in silence.",
      },
      {
        id: "r_ore_ashline",
        text:
          "Ashline ore’s flooding Forgewell. Buy low there, sell anywhere people still build things.",
      },
      {
        id: "r_inspection_heat",
        text:
          "Compact inspections are meaner on Voss registry pings. Helix-adjacent flags make clerks itch.",
      },
      {
        id: "r_scavenge_bone",
        text:
          "The Bone Arc’s been stripped once already this week. Go late and you’ll fight over scraps — or stories.",
      },
      {
        id: "r_quill_kind",
        text:
          "Madame Quill’s first loan is soft if your ledger used to mean something. Second loan is weather with teeth.",
      },
      {
        id: "r_stale_route",
        text:
          "Last month’s hot Silkglass route died. Glassmarket’s full of pretty goods nobody needs until they do.",
      },
      {
        id: "r_return_empty",
        text:
          "A freighter came back with empty holds and full eyes. Wouldn’t say the name of the firm that paid them to forget.",
      },
    ],

    listenIns: [
      "Someone at the end of the bar is arguing about Ghost Silk rates in Redwake. Someone else is pretending not to listen.",
      "Two voices under the music: “…canisters don’t ship themselves…” then laughter too loud to be real.",
      "A Veshari says your parent’s compass used to point at trouble on purpose. You can’t tell if it’s a compliment.",
      "Pax wipes the same spot twice. When you look, the wood is already clean. Ritual, not dirt.",
      "A Freehold runner toasts “no ledger without a face,” and half the room drinks like they mean it.",
      "You overhear a Compact off-duty: “Helix doesn’t break laws. They rent them.”",
    ],
  };

  D.moneylenderLines = {
    greet_first: [
      "“I don’t break people, Captain Voss. I keep them in motion. Motion is how interest lives.”",
      "“Halden’s ledger was tidy. That buys you a first kindness — not a forever.”",
    ],
    greet_return: [
      "“Back. Good. Dead clients don’t pay, and late ones only slightly better.”",
      "“Your standing with me is a weather report. Shall we read it?”",
    ],
    greet_debt: [
      "“Your debt has a pulse. Feed it, or it learns to bite.”",
      "“Interest isn’t anger. It’s math with a soft voice.”",
    ],
  };
})(window);
