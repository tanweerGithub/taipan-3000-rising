# Taipan 3000: Rising — Game Design Document

**Name: locked.**

## 1. Premise

A modern, lightweight, browser-based reimagining of the space-trader genre (spiritual
successor to the old Flash game *Taipan 3000* — specifically *Taipan 3000: Special
Edition* — not a direct clone). The player is a space trading captain piecing
together their family's lost history while building a trading empire across a
procedurally generated galaxy.

**Reference note:** the original *Taipan 3000: Special Edition* is worth researching
for tonal/essence reference — its core loop (trade, upgrade your ship, visit the
tavern, deal with a money lender, RPG-lite heritage-quest framing) is the direct
inspiration for §2 and §3 below. This project deliberately does **not** reuse its
specific story, character names, art, or exact title — see §9's tone direction for
what this game's own identity should be. Research it for *feel*, not for content to copy.

**Design pillars (do not violate these without discussion):**
1. **Anyone can play.** No account, no install, no reflex-testing required. Open the
   page, play immediately, low cognitive load.
2. **Lightweight.** No framework, no build step, no bundler. Fast load on modest
   hardware. Any heavier feature (see §6) must degrade gracefully, never block play.
3. **Narrative matters.** This isn't just a numbers sim — the heritage-quest story is
   a first-class citizen, not flavor text bolted on.
4. **Interactive where it earns its keep.** Prefer meaningful choices over reflex
   mechanics. Combat and encounters are resolved through decisions, not twitch skill.

---

## 2. Core Loop

1. Player is docked at a station. Sees: local market prices, ship status, credits, debt.
2. Player buys/sells goods, manages fuel, maybe visits the tavern for narrative/rumors,
   maybe visits the moneylender.
3. Player selects next destination on the galaxy map.
4. Travel resolves — random chance of an **encounter** (pirates, distress call, anomaly,
   inspection, narrative beat) presented as a choice-driven scene, not real-time action.
5. Arrive at new station. Loop continues. Occasional milestone-triggered story beats.

No combat mini-game, no timing-based mechanics. All tension comes from resource
management and consequence of choices (fight/flee/bribe/negotiate).

---

## 3. Systems

### 3.1 Galaxy & Travel
- **Procedurally generated** from a seed each new game (station names, positions,
  starting commodity prices, minor encounter pool).
- Fixed number of "regions" per playthrough, each with a handful of stations.
- Galaxy map: simple 2D node graph (SVG or Canvas2D), click a connected station to travel.

### 3.2 Trading
- Commodity list (~6–10 goods to start: e.g. ore, medicine, tech components, luxury
  goods, weapons, contraband). Contraband carries risk (inspections) but higher margin.
- Prices fluctuate per station based on simple supply/demand rules + randomized noise
  each visit. No need for a complex economic simulation — believable, not exhaustive.

### 3.3 Ship & Equipment
- Ship stats: cargo capacity, fuel capacity, hull/shield, weapon slots, speed.
- Buy/sell/upgrade ship at applicable stations.
- Equip weapons/drones — affects outcomes of combat-choice encounters, not
  real-time play.

### 3.4 Tavern (Narrative Hub)
- Flavor dialogue, rumors (hint at good trade routes or danger), side vignettes.
- Where most of the "world feels alive" content lives — see §5 for how this is
  generated without needing a live LLM call.

### 3.5 Moneylender
- Loans available, with interest and consequences for default (adds resource-management
  tension without needing real-time danger).

### 3.6 Encounters (two tiers, inspired by Space Rangers 2's planet-side text events)
- **Quick encounters** (majority of travel events): short scene + 3–4 choices (e.g.
  Fight / Flee / Bribe / Talk), resolves in one step. Keeps routine travel snappy.
- **Deep encounters** (smaller pool, periodic): multi-step branching text narratives —
  e.g. get detained at a station, then 3–4 beats of choices that actually change the
  outcome (talk your way out / bribe / fight your way free / call in a favor), similar
  in spirit to Space Rangers 2's planet-arrest vignettes. Pure text/choice-driven —
  zero rendering cost, all the depth lives in the data.
- Both tiers are just data (situation → choices → consequences trees) — no engine
  complexity, cheap to generate in bulk and review once for quality/tone.
- Outcomes depend on ship stats + some randomness, shown clearly (not hidden dice).

### 3.7 Factions & Species Reputation
- The galaxy has multiple species/factions (count and identities: delegated, see §9).
- Each faction has a reputation value per save (e.g. -100 to +100), starting neutral
  unless the heritage story calls for a starting bias.
- **Reputation is a consequence layer, not a new input system** — it's adjusted by
  outcomes of encounters (§3.6) and quests/side objectives the player completes, not
  by any separate mechanic.
- Reputation feeds back into existing systems:
  - Trade prices at that faction's stations (better rep = better deals)
  - Encounter hostility odds on that faction's routes
  - Dialogue tone in tavern/NPC text (species-aware, not just character-aware)
- Implementation: a `reputation` object in save data, keyed by faction id. No
  simulation — just numbers that choices adjust and other systems read.

### 3.8 Scavenging / Non-Habitable Sites
- Certain galaxy nodes are tagged as **scavenge sites** rather than trade stations —
  no market; instead a finite resource pool (salvage/scrap/rare materials).
- Visiting extracts up to available cargo space; the site's remaining pool decreases
  and **persists in save data**, keyed per-site (so the seed-generated galaxy is
  stable and "coming back later" means something real).
- Optional: slow regeneration over turns, so sites aren't permanently one-shot —
  gives a reason to revisit rather than a pure loot-once mechanic.
- Extraction can carry encounter risk (§3.6) — unstable environment, rival
  scavengers — rather than being a risk-free resource tap.
- Implementation: purely data — a resource-pool number per site, decremented/
  incremented over time. No real-time simulation required.

### 3.9 Crew / Companions (optional enrichment — build if core loop feels solid)
- 1–3 recruitable companions, each with a personality, a trust/loyalty value, and
  occasional unprompted banter during travel (reuses the pre-generated variation-pool
  approach from §5 — no live LLM needed).
- Personal, not factional — this is the individual-relationship counterpart to §3.7's
  faction reputation (§3.7). A companion can react to specific player choices, offer a small
  personal side-quest, and in principle leave the crew if consistently betrayed.
- Implementation: same pattern as reputation — a trust value per companion in save
  data, adjusted by choices, read by dialogue/banter selection. No new architecture.

### 3.10 Reflective Epilogue (optional enrichment)
- On completing the heritage story, generate a short "captain's log" style epilogue
  that reflects the player's *specific* playthrough — faction standings, which
  companions are still aboard, how the central mystery resolved.
- Implementation: conditional text assembled from existing save data (reputation
  values, companion trust, story flags) — no new state needed, just a closing screen
  that reads back what already happened.

### 3.11 Heritage Story (fixed narrative anchors)
- **Do not proceduralize this.** The procedural galaxy handles routine content; the
  story is hand-written and triggers on **milestones**, not coordinates — e.g. "net
  worth crosses X," "Nth station visited," "first contraband run," "first ship
  upgrade." This keeps the story coherent and well-crafted on every playthrough while
  the world around it still feels different each time.
- Story beats reveal the protagonist's family history and give the game a throughline
  and an ending state, not just an endless sim.

---

## 4. Art Direction

### 4.1 Style anchor — DECIDED

Lesson from testing: the `imagine` skill can produce either a **flat/bold-outline
illustration style** or a **richer painterly/comic style** depending on prompt
wording, and these do NOT visually match each other by default.

**Decision: the richer painterly/comic style (from the character tests) is the
PRIMARY style.** It carries far more mood, atmosphere, and emotional weight, which
matters for a heritage-story-driven game. Use it for:
- Character portraits and character scenes
- Ships (hangar screen, hero moments)
- Narrative/story illustrations
- Station/environment backdrops

**Prompt template for hero/narrative assets:**
```
[SUBJECT], detailed illustrated style, moody atmospheric lighting, limited color
palette (deep purple/navy, teal, orange accents), painterly shading, worn/lived-in
textures, [transparent background / scene background], no text, no words, no labels,
no logos, no writing anywhere
```

**Exception — UI/icon tier stays simple.** Small UI elements (currency icon, cargo
icon, map markers, inventory icons) need to read at a glance at small sizes — full
painterly detail turns to mush at 24-32px. For these, prompt explicitly for
simplicity:
```
[SUBJECT] icon, simple flat shapes, minimal detail, bold silhouette, same color
palette, transparent background, designed to be legible at small size, no text
```

Repeat the negative-text instruction multiple times/ways — single mentions get ignored.

### 4.2 Consistency workflow
For any recurring character: generate a reference sheet first (multiple angles), then
reference that description consistently in every subsequent scene prompt rather than
re-describing from memory each time. Confirmed working well in testing.

---

## 5. "Living World" Without a Live LLM Dependency

Per design pillar #2 (lightweight, no backend dependency for core play), dynamism is
achieved WITHOUT calling an LLM at runtime:

1. **Pre-generated variation pools.** Write (or generate offline, then curate) many
   variants of tavern dialogue, rumors, encounter flavor text, station lore. Ship as
   static data. Game randomly selects/combines at runtime — no API call, no latency,
   works offline.
2. **Templated procedural text.** Mad-libs style generation from the data model
   (e.g. `"{npc_name} eyes your cargo hold and mutters something about {rumor_topic}."`)
   for genuinely dynamic-feeling but fully client-side, deterministic-testable text.
3. **Phase 2 (not in initial scope):** an optional "bring your own API key" mode for
   live LLM roleplay, layered on top of the static game, never a dependency for the
   base experience.

---

## 6. Technical Architecture

- **No framework, no build step.** Plain HTML/CSS/JS. Open `index.html`, it runs.
- **Data-driven design.** All goods, ports, ship types, story flags, dialogue pools
  live in a `data.js` (or similar) — balancing/tuning should mean editing data, not code.
- **Rendering:** DOM for UI/menus (accessible, responsive by default), Canvas2D/SVG for
  the galaxy map and any lightweight atmospheric effects (starfield, parallax).
- **Saves:** `localStorage`. No accounts, no backend required for core play.
- **Optional 3D flourish:** e.g. a rotating 3D ship model on the hangar/upgrade screen
  only. Must be:
  - Lazy-loaded (Three.js only fetched if that screen is opened)
  - Feature-detected (checks WebGL support first)
  - Fully optional — falls back silently to the static 2D ship art with zero loss of
    functionality if unsupported or the device is weak.
- **Images:** raster PNGs from the `imagine` pipeline (~150–250KB each based on
  testing, web-reasonable). Keep an eye on total asset payload as the library grows;
  compress/resize if needed later.

---

## 7. Suggested File Structure

```
/taipan-3000-rising
  index.html
  /css
    style.css
  /js
    main.js
    data.js          (goods, ports, ships, dialogue pools, story flags)
    galaxy.js         (procedural generation, map rendering)
    trading.js
    encounters.js
    narrative.js       (milestone-triggered story beats)
    save.js            (localStorage load/save)
    ship3d.js          (optional, lazy-loaded Three.js flourish)
  /assets
    /ships
    /characters
    /icons
    /environments
  GAME_DESIGN.md        (this file)
  CLAUDE.md              (Karpathy behavioral guidelines)
```

---

## 8. Build Process Notes (for Grok)

- The authoritative, staged build order — with checkpoints and definitions of done —
  lives in `BUILD_SEQUENCE.md`. Follow that file for execution order; this document
  is the "what," that one is the "how and when."
- Follow `CLAUDE.md` guidelines throughout: ask before assuming on ambiguous points,
  don't over-engineer, don't silently modify code/comments outside scope.

---

## 9. Creative Delegation Brief

The designer (you) is providing tone/premise direction only. Everything below this
line — commodity list, station/region names and count, protagonist name and
backstory, NPC names and personalities, dialogue, encounter text, difficulty
numbers — is delegated to Grok's creative judgment. Use the tone direction below as
the north star for every piece of generated content so the output has a consistent
identity rather than reading as generic sci-fi filler.

**Tone/premise direction:**
> The protagonist is chasing the truth about a family member who vanished on a trade
> run years ago. Tone: bittersweet, a little weathered, hopeful underneath. NPCs
> should feel like real people with their own agendas, not quest-dispensers. The
> galaxy should feel lived-in and a little dangerous at the edges. Writing should be
> emotionally engaging and relatable, not just functional flavor text.

**Working freely within this tone, Grok should decide and document (in `data.js` or
a companion `LORE.md`):**
- Protagonist name, appearance notes (for portrait consistency), and the specific
  shape of the heritage mystery
- Commodity list and starting economy balance
- Region/station count and names for the first playable version
- Recurring NPCs (moneylender, tavern keeper, rivals, etc.) — names, personalities,
  brief backstory hooks
- Species/factions (§3.7): how many, their names, personalities/cultural flavor, and
  any starting reputation biases tied to the heritage story
- Scavenge site flavor (§3.8): what's found there, any site-specific hazard themes
- Crew companions (§3.10, if built): names, personalities, personal side-quest hooks
- The pool of quick-encounter and deep-encounter (§3.6) text content
- Difficulty/pacing numbers (debt interest, combat risk, encounter frequency)

If something is genuinely ambiguous or high-stakes (e.g. "should the game have an
ending, or run indefinitely?"), Grok should surface it as a question rather than
silently guess — per the CLAUDE.md behavioral guidelines already in this project.
