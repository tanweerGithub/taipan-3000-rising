/**
 * Crew / companions — GAME_DESIGN §3.9, LORE §9 stretch (Ivo first).
 * Loaded after data.js.
 */
(function (global) {
  var D = global.GAME_DATA;
  if (!D) {
    console.error("crew-data.js requires data.js first");
    return;
  }

  /**
   * Recruitable companions. Trust is personal (not faction rep).
   * reactsTo: "talk" | "principle" | "craft" — used for automatic trust nudges.
   */
  D.companions = {
    ivo: {
      id: "ivo",
      name: "Ivo",
      species: "Veshari",
      role: "Navigator",
      blurb:
        "Soft-spoken Veshari navigator who collects unfinished songs. Prefers words that leave people breathing.",
      recruitStationId: "haven_spindle",
      startTrust: 12,
      trustMin: -100,
      trustMax: 100,
      reactsTo: "talk",
      /** Shown in tavern before recruit. */
      approachLines: [
        "A slender Veshari at the end of the bar tunes a half-song against a chipped glass. " +
          "They look up when your compass chain clicks.\n\n" +
          "“Captain Voss. Halden’s orbit. I chart unfinished routes. Yours sounds… open.”",
      ],
      recruitOffer:
        "“I don’t need a war. I need a ship that chooses talk when guns would be easier. " +
          "Berth me, and I’ll keep your lanes from lying to you.”",
      recruitAccept:
        "Ivo’s hands fold once, like closing a map. “Then we fly. If you become the kind of captain " +
          "who leaves people stranded, I will leave first — quietly.”",
      recruitDecline:
        "“Not now is still a chart.” Ivo returns to the unfinished song. The bar keeps its secrets.",
      alreadyAboard:
        "Ivo sits with a mug they barely touch. “The Morrowlit’s nav stack has a limp. I’ll live.”",
    },
  };

  /**
   * Banter pools by companion + trust tier.
   * Tiers: low (<0), mid (0–39), high (40+).
   */
  D.companionBanter = {
    ivo: {
      low: [
        "Ivo, quiet: “That last choice tasted like smoke. I still have songs that need living throats.”",
        "Ivo doesn’t look at you. “Maps remember who burned them. So do I.”",
        "From the jump seat: “If this is who you are under pressure, say so. I prefer honest storms.”",
      ],
      mid: [
        "Ivo hums a half-melody. “Lane ahead is clean if we don’t invent enemies.”",
        "“Your compass pulls true more often than not,” Ivo says. “Keep that habit.”",
        "Ivo taps the viewport. “Unfinished song for this stretch of dark — I’ll teach you the rest if we survive it.”",
      ],
      high: [
        "Ivo’s voice is almost warm. “I would stake a chart on you choosing the long kindness.”",
        "“When you talk instead of cut, the Morrowlit flies lighter,” Ivo says. “I notice.”",
        "Ivo leaves a scrap of notation on your console: a route name that isn’t on any Compact map. Trust, inked.",
      ],
    },
  };

  /**
   * Post-recruit tavern dialogues — player choices that visibly move trust.
   */
  D.companionTalks = {
    ivo: [
      {
        id: "ivo_songs",
        prompt:
          "Ivo turns a glass, listening to the room. “People leave songs half-done when they’re afraid. " +
          "What do you do when a lane asks you to become a gun?”",
        choices: [
          {
            label: "Talk first. Always.",
            trust: 8,
            reply:
              "Ivo’s eyes soften — not smile, something quieter. “Then I was right to berth here. " +
              "Trust rises on purpose, Captain — not by accident.”",
          },
          {
            label: "Whatever keeps the ship whole.",
            trust: -6,
            reply:
              "A long pause. “Survival is a kind of honesty. Just don’t pretend it’s a virtue when it isn’t.” " +
              "Ivo’s trust cools a few degrees — you can feel it in the silence.",
          },
          {
            label: "Depends who started it.",
            trust: 2,
            reply:
              "“Context is a map,” Ivo allows. “I’ll keep watching which legends you draw.”",
          },
        ],
      },
    ],
  };
})(window);
