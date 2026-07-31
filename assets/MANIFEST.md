# Asset manifest — Stage 7 complete

## Characters
| Path | Use |
|---|---|
| `characters/rin-voss-reference.jpg` | Hangar / story default (v6 FINAL identity) |
| `characters/pax-renn-portrait.jpg` | Tavern |
| `characters/sera-quill-portrait.jpg` | Moneylender |
| `characters/jex-morrow-portrait.jpg` | Default rival (v1 charming) |
| `characters/jex-morrow-portrait-v2-heavier.jpg` | Heritage / wound context |
| `characters/liss-glassmarket-portrait.jpg` | Veshari broker (non-human) |
| `characters/yrtak-forge-mother-portrait.jpg` | Korr shipwright (non-human) |
| `characters/brann-hale-portrait.jpg` | Compact dock officer |

## Ships
| Path | Use |
|---|---|
| `ships/morrowlit-hero.jpg` | Hangar |
| `ships/rival-freighter.jpg` | Hangar / lanes (Jex energy) |

## Environments
### Regional fallbacks
| Path | Use |
|---|---|
| `environments/region-lantern-reach.jpg` | Fallback: Lantern Reach |
| `environments/region-ashline.jpg` | Fallback: Ashline |
| `environments/region-quiet-verge.jpg` | Fallback: Quiet Verge |
| `environments/region-redwake.jpg` | Fallback: Redwake |
| `environments/scavenge-site.jpg` | Fallback: scavenge sites |

### Per-location unique backdrops (wired via `STATION_ART` in `main.js`)
| Path | Location |
|---|---|
| `environments/stations/haven_spindle.jpg` | Haven Spindle |
| `environments/stations/glassmarket.jpg` | Glassmarket |
| `environments/stations/twin_dock.jpg` | Twin Dock |
| `environments/stations/forgewell.jpg` | Forgewell |
| `environments/stations/cinder_port.jpg` | Cinder Port |
| `environments/stations/keel_yard.jpg` | Keel Yard |
| `environments/stations/last_light.jpg` | Last Light |
| `environments/stations/driftgarden.jpg` | Driftgarden |
| `environments/stations/pale_harbor.jpg` | Pale Harbor |
| `environments/stations/cutlass_node.jpg` | Cutlass Node |
| `environments/stations/blacktide.jpg` | Blacktide |
| `environments/stations/needlepoint.jpg` | Needlepoint |
| `environments/stations/bone_arc.jpg` | Bone Arc (scavenge) |
| `environments/stations/silent_lattice.jpg` | Silent Lattice (scavenge) |
| `environments/stations/hullgrave.jpg` | Hullgrave (scavenge) |

All 15 are unique files (not region copies). `locationArtUrl()` prefers station art, then scavenge/region fallbacks.

## UI / commodity icons (transparent RGBA PNG)
HUD: `credits.png`, `debt.png`, `fuel.png`, `hull.png`, `cargo.png`  
Nav / screens: `map-node.png`, `tavern.png`, `ledger.png`, `scavenge.png`  
Goods: `good-ore.png`, `good-pharm.png`, `good-circuits.png`, `good-luxury.png`, `good-arms.png`, `good-seeds.png`, `good-coolant.png`, `good-ghost_silk.png`

Source JPGs remain beside them under `assets/icons/` for re-export; **runtime uses `.png` only** (`index.html` + `GOOD_ICONS` / `UI_ICONS` in `main.js`).

Wired into: HUD, station market rows, hold list, galaxy list, destination panel, scavenge panel, tavern, lender, hangar, heritage story portrait, station dock backdrop.
