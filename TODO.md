# TODO

Track deferred polish and known debt so it does not get lost between stages.
Fix when convenient — none of these block the current stage definition of done.

## Standing product note — content richness

See **GAME_DESIGN.md §8 — Standing note (content depth & replayability)**.

When building encounters, dialogue, NPCs, tavern text, or any narrative pool: aim
for *Taipan 3000 SE* / *Space Rangers 2*-class depth of experience — enough variety
that a full playthrough does not feel like a short loop, and finishing the story
feels earned. Do not stop at “minimum DoD lines” for content systems.

## Standing product note — locations in time

See **GAME_DESIGN.md §8 — locations exist in time**.

Per-location visit memory (visit count, turns since last visit) should drive tavern
flavor, rumors, and NPC texture so returning to a dock feels different from the first
landing — without a full calendar sim.

## Stage 2 shell — deferred polish (code review)

- [ ] **Dual visibility model** (`js/main.js`, `css/style.css`)  
  Screens use both `is-active` and the `hidden` attribute, with CSS `display: none !important` to keep them in sync. Prefer one source of truth (e.g. `hidden` only for sections; `is-active` only on nav).

- [ ] **Class-coupled nav filtering** (`js/main.js`)  
  Click handler only treats `nav-btn` / `text-link` / `btn-ghost[data-screen]` as navigation. Any future control with `data-screen` but a different class will silently fail. Prefer any non-disabled `[data-screen]` control.

- [ ] **Mobile market table overflow** (`index.html` market table, `css/style.css`)  
  Four-column price table can crush or force horizontal page scroll on very narrow viewports. Wrap in `overflow-x: auto` when polishing layout.

### Related nits (also deferred)

- [ ] `prefers-reduced-motion` guard on screen fade animation  
- [ ] Brittle `.panel-title` adjacent-sibling spacing selectors → prefer `.panel > * + .panel-title` or gap

## Stage 5 — deferred tech debt (code review)

- [ ] **Rep / price knob alignment** (`js/data.js` `reputationEconomy`)  
  `buyDiscountAtMax` implies a stronger discount than `minMult` allows; advertised max swing is clamped. Align numbers so knobs match observed prices.

- [ ] **Growing global click handler** (`js/main.js`)  
  One document-level click listener now routes trade, map, travel, encounters, disengage, continue, reseed, and screen nav. Split into smaller handlers or a tiny dispatcher when the next system lands.

- [ ] **Content/effect mismatches elsewhere**  
  Some encounter labels still imply cargo sales without removing stock (e.g. “Sell at fair frontier rates” grants seeds + credits). Audit labels vs `effects` when expanding the pool.

## Design note — hull soft floor (intentional, not a bug)

Hull damage clamps to a **minimum of 1**. That is the accessible **no permanent failure** rule from earlier (no dead ship / hard game-over from combat). Damage *does* apply; it just never finishes the ship. If combat ever needs higher stakes, use other levers (cargo loss, rep, forced repairs) rather than hull 0 unless design revisits soft-fail.

## Stage 6 — deferred tech debt (code review)

- [ ] **#3 Tavern panel message wiped** (`js/main.js`)  
  `handleTavernAction` sets `#tavern-message` then `renderTavern()` clears it. Murmur still shows text; pick one feedback channel.

- [ ] **#4 Scavenge doesn’t re-check net-worth milestones** (`js/trading.js` extract)  
  Salvage can push net worth over the Name beat threshold, but `onEconomyChange` only runs on buy/sell/loan/travel. Call it after successful extract (and surface story overlay from UI).

- [ ] **#5 Lender closed UI leaves Terms aside visible** (`js/main.js` `renderLender`)  
  Mirror tavern: hide the aside when moneylender isn’t available at this dock.

- [ ] **#8 Lender copy / unused knobs** (`js/data.js`, Terms list)  
  “Terms worsen” oversells flat per-hop interest; `firstLoanBonus` and `profitableTrades` are unused. Align copy or implement; remove dead fields (simplicity).

- [ ] **#9 Hard-coded Haven subtitles** (`js/main.js` tavern/lender)  
  Fine while Haven-only; use station/meta names from data when a second tavern/lender dock is added.
