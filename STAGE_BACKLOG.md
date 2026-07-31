# Stage backlog — incomplete items through Stage 9

Inventory of deferred polish and review debt from each stage.  
**Stage 10 GLB** is owner-blocked (see `TODO.md`) and is **out of scope** here.

Legend: `done` · `skip` (wontfix / owner / open-ended design)

| Stage | Item | Status |
|-------|------|--------|
| 2 | Dual screen visibility (`is-active` + `hidden`) | **done** — screens use `hidden` only; nav keeps `is-active` |
| 2 | Nav: any `[data-screen]` control | **done** |
| 2 | Mobile market table overflow | **done** — table-scroll + min-width |
| 2 | `prefers-reduced-motion` on screen fade | **done** |
| 2 | Panel-title spacing selectors | **done** — `.panel > * + .panel-title` |
| 3–4 | No stage-specific deferred list in TODO | **skip** — DoD met at ship time |
| 5 | Rep / price knob alignment | **done** — `buyDiscountAtMax: 0.2` matches `minMult: 0.8` |
| 5 | Split global click handler | **skip** — over-architecture vs CLAUDE.md simplicity |
| 5 | Encounter label vs effects (sample) | **done** — Last Light “fair trade” label/hint fixed |
| 6 | Tavern message wiped by re-render | **done** |
| 6 | Scavenge extract → milestone check | **done** — `onEconomyChange` + UI overlay |
| 6 | Lender closed: hide Terms aside | **done** — `#lender-aside` |
| 6 | Lender copy / unused knobs | **done** — honest interest copy; removed dead `firstLoanBonus` / `profitableTrades` |
| 6 | Hard-coded Haven subtitles | **done** — `dockLabel` from data |
| 7 | VERSIONS.md Jex default line | **done** |
| 7 | STAGE7_PASS1 historical banner | **done** |
| 7 | Downscale runtime icon PNGs | **done** — 128×128 (~11–32KB each); source JPGs kept |
| 8 | Double trust stack (react + effects.trust) | **done** — auto-react skips when trust is authored |
| 8 | Infinite tavern talk trust farm | **done** — `talksDone` gates talks |
| 8 | “Not now” / recruit dialogue re-render wipe | **done** — met state + lastTalkReply for hire speech |
| 9 | Capstone epilogue DoD | **skip** — already complete (verified Stage 9) |
| 10 | GLB volumetric mesh | **skip** — waiting on owner (`TODO.md`) |

## Standing design notes (not checkbox bugs)

- **Content richness** (GAME_DESIGN §8): ongoing standard for pools/encounters — visit-phase tavern + encounter volume already shipped; expand when adding content stages.
- **Locations in time**: visit count / turns-since already drive tavern phase pools.

## Completed in this backlog pass

Code/docs: `js/main.js`, `css/style.css`, `index.html`, `js/data.js`, `js/trading.js`, `js/encounters` path via crew, `js/crew.js`, `js/narrative.js`, `js/encounter-data.js`, `assets/characters/VERSIONS.md`, `assets/STAGE7_PASS1.md`, `assets/icons/*.png`.
