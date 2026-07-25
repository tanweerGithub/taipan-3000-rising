# TODO

Track deferred polish and known debt so it does not get lost between stages.
Fix when convenient — none of these block the current stage definition of done.

## Standing product note — content richness

See **GAME_DESIGN.md §8 — Standing note (content depth & replayability)**.

When building encounters, dialogue, NPCs, tavern text, or any narrative pool: aim
for *Taipan 3000 SE* / *Space Rangers 2*-class depth of experience — enough variety
that a full playthrough does not feel like a short loop, and finishing the story
feels earned. Do not stop at “minimum DoD lines” for content systems.

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
