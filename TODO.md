# TODO

Track deferred polish and known debt so it does not get lost between stages.

**Backlog sweep (Stages 1–9 deferred items):** see `STAGE_BACKLOG.md` — completed in a dedicated pass. Items below are what remains open.

## Stage 10 hangar — true 3D mesh (owner will supply)

**Status:** Waiting on owner upload. Do not invent a procedural mesh as a substitute.

- **Owner action:** Create a **`.glb`** of the freighter **Morrowlit** (match `assets/ships/morrowlit-hero.jpg` / LORE look) and drop it in-repo, e.g.  
  `assets/ships/morrowlit.glb`
- **When uploaded:** Wire `js/ship3d.js` to **lazy-load** that GLB via Three.js `GLTFLoader` (still feature-detect WebGL; still silent fallback to static 2D art / current textured-card flourish).
- **Do not regress:** Optional only — no changes to core gameplay modules; Three.js stays hangar-only and lazy.
- **Current interim:** Hangar uses cutout texture `assets/ships/morrowlit-3d.png` as a lit, gently rocking card in WebGL — not a volumetric mesh.

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

## Optional later (not stage debt)

- [ ] Split the document-level click handler in `main.js` if it grows again (skipped in backlog: simplicity).
- [ ] Second tavern/moneylender docks beyond Haven (data already supports `tavernStations` / `moneylender.stationId`).
- [ ] Additional crew (Tam, Nyx) — LORE stretch; Ivo is Stage 8 complete.
- [ ] `localStorage` save/load (`save.js` in design structure) if a stage asks for it.

## Design note — hull soft floor (intentional, not a bug)

Hull damage clamps to a **minimum of 1**. That is the accessible **no permanent failure** rule (no dead ship / hard game-over from combat). Damage *does* apply; it just never finishes the ship.
