/**
 * Static game content from LORE.md. Balance lives here; systems read it.
 * No runtime mutation of this object.
 */
window.GAME_DATA = {
  protagonist: {
    name: "Rin Voss",
    shipName: "Morrowlit",
  },

  factions: {
    compact: { id: "compact", name: "The Compact", startRep: -10 },
    veshari: { id: "veshari", name: "Veshari Confluence", startRep: 0 },
    korr: { id: "korr", name: "Korr Forgeholds", startRep: 5 },
    veil: { id: "veil", name: "Veil Freeholds", startRep: 10 },
  },

  regions: {
    lantern_reach: { id: "lantern_reach", name: "Lantern Reach" },
    ashline: { id: "ashline", name: "Ashline Corridor" },
    quiet_verge: { id: "quiet_verge", name: "The Quiet Verge" },
    redwake: { id: "redwake", name: "Redwake Expanse" },
  },

  /**
   * basePrice: home-region average target (cr).
   * legal: true | "restricted" | false (contraband).
   */
  commodities: [
    { id: "ore", name: "Bulk Ore", basePrice: 12, legal: true },
    { id: "pharm", name: "Pharm Stock", basePrice: 40, legal: true },
    { id: "circuits", name: "Circuit Weave", basePrice: 55, legal: true },
    { id: "luxury", name: "Silkglass", basePrice: 90, legal: true },
    { id: "arms", name: "Armaments", basePrice: 70, legal: "restricted" },
    { id: "seeds", name: "Lumen Seeds", basePrice: 28, legal: true },
    { id: "coolant", name: "Deep Coolant", basePrice: 22, legal: true },
    { id: "ghost_silk", name: "Ghost Silk", basePrice: 120, legal: false },
  ],

  /**
   * priceMods: multiplier vs basePrice per good (omit = 1).
   * Low mod = cheap to buy here; high = expensive / good sell market.
   */
  stations: [
    {
      id: "haven_spindle",
      name: "Haven Spindle",
      regionId: "lantern_reach",
      factionId: "compact",
      flavor: "Haven Spindle never sleeps — it just dims the lights and raises the docking fees.",
      priceMods: {
        ore: 1.05,
        pharm: 0.9,
        circuits: 0.95,
        luxury: 1.0,
        arms: 1.05,
        seeds: 1.0,
        coolant: 1.0,
        ghost_silk: 1.25,
      },
    },
    {
      id: "glassmarket",
      name: "Glassmarket",
      regionId: "lantern_reach",
      factionId: "veshari",
      flavor: "Warm light, layered fabrics, and rates that improve if you tell a good story.",
      priceMods: {
        luxury: 0.8,
        circuits: 0.95,
        pharm: 1.0,
        ore: 1.1,
        arms: 1.1,
        seeds: 0.95,
        coolant: 1.05,
        ghost_silk: 1.15,
      },
    },
    {
      id: "twin_dock",
      name: "Twin Dock",
      regionId: "lantern_reach",
      factionId: "compact",
      flavor: "A fuel-cheap connector dock — modest shelves, honest spreads.",
      priceMods: {
        ore: 1.0,
        pharm: 1.0,
        circuits: 1.0,
        luxury: 1.05,
        arms: 1.05,
        seeds: 1.0,
        coolant: 0.95,
        ghost_silk: 1.2,
      },
    },
    {
      id: "forgewell",
      name: "Forgewell",
      regionId: "ashline",
      factionId: "korr",
      flavor: "Heat, clang, and ore piled higher than sentiment.",
      priceMods: {
        ore: 0.7,
        coolant: 0.85,
        arms: 0.9,
        circuits: 1.15,
        pharm: 1.25,
        luxury: 1.3,
        seeds: 1.15,
        ghost_silk: 1.2,
      },
    },
    {
      id: "cinder_port",
      name: "Cinder Port",
      regionId: "ashline",
      factionId: "korr",
      flavor: "Ship parts and armaments — a rough tavern next door.",
      priceMods: {
        ore: 0.75,
        arms: 0.85,
        coolant: 0.9,
        circuits: 1.1,
        pharm: 1.2,
        luxury: 1.25,
        seeds: 1.1,
        ghost_silk: 1.15,
      },
    },
    {
      id: "keel_yard",
      name: "Keel Yard",
      regionId: "ashline",
      factionId: "korr",
      flavor: "Treaty dock for hull work. Fuel costs more; honesty is free.",
      priceMods: {
        ore: 0.8,
        arms: 0.95,
        circuits: 1.05,
        coolant: 0.9,
        pharm: 1.15,
        luxury: 1.2,
        seeds: 1.1,
        ghost_silk: 1.2,
      },
    },
    {
      id: "last_light",
      name: "Last Light",
      regionId: "quiet_verge",
      factionId: "veil",
      flavor: "Frontier dock where pharm stock sells like hope.",
      priceMods: {
        pharm: 1.35,
        seeds: 1.1,
        ore: 1.15,
        circuits: 1.1,
        luxury: 1.15,
        arms: 1.05,
        coolant: 1.1,
        ghost_silk: 1.05,
      },
    },
    {
      id: "driftgarden",
      name: "Driftgarden",
      regionId: "quiet_verge",
      factionId: "veshari",
      flavor: "Lumen seeds and soft hospitality at the edge of the charts.",
      priceMods: {
        seeds: 0.75,
        pharm: 1.2,
        luxury: 0.95,
        ore: 1.15,
        circuits: 1.05,
        arms: 1.1,
        coolant: 1.05,
        ghost_silk: 1.1,
      },
    },
    {
      id: "pale_harbor",
      name: "Pale Harbor",
      regionId: "quiet_verge",
      factionId: "compact",
      flavor: "Subdued, watchful markets. The name hangs heavier than the cargo.",
      priceMods: {
        pharm: 1.2,
        circuits: 1.05,
        luxury: 1.1,
        ore: 1.1,
        arms: 1.1,
        seeds: 1.05,
        coolant: 1.05,
        ghost_silk: 1.25,
      },
    },
    {
      id: "cutlass_node",
      name: "Cutlass Node",
      regionId: "redwake",
      factionId: "veil",
      flavor: "Weapons and ghost silk traffic. Inspections like the weather.",
      priceMods: {
        arms: 0.9,
        ghost_silk: 0.85,
        ore: 1.1,
        pharm: 1.15,
        circuits: 1.1,
        luxury: 1.05,
        seeds: 1.1,
        coolant: 1.05,
      },
    },
    {
      id: "blacktide",
      name: "Blacktide",
      regionId: "redwake",
      factionId: "veil",
      flavor: "Best contraband margins — worst respectable optics.",
      priceMods: {
        ghost_silk: 0.75,
        arms: 0.95,
        luxury: 1.0,
        ore: 1.15,
        pharm: 1.2,
        circuits: 1.15,
        seeds: 1.15,
        coolant: 1.1,
      },
    },
    {
      id: "needlepoint",
      name: "Needlepoint",
      regionId: "redwake",
      factionId: "veil",
      flavor: "Thin markets, sharp people. A good place to dump heat.",
      priceMods: {
        ghost_silk: 0.9,
        arms: 1.0,
        ore: 1.05,
        pharm: 1.15,
        circuits: 1.1,
        luxury: 1.1,
        seeds: 1.1,
        coolant: 1.05,
      },
    },
  ],

  scavengeSites: [
    {
      id: "bone_arc",
      name: "The Bone Arc",
      theme: "Old convoy graveyard",
      flavor: "Hulls stacked like ribs. Claim-jumpers leave scorch marks on the good wrecks.",
      regionId: "ashline",
      poolMax: 28,
      regenPerTurn: 1,
      loot: [
        { goodId: "ore", weight: 4 },
        { goodId: "circuits", weight: 2 },
        { goodId: "coolant", weight: 1 },
      ],
    },
    {
      id: "silent_lattice",
      name: "Silent Lattice",
      theme: "Abandoned research web",
      flavor: "Dead antennae still point at something. Your scanners tick without asking.",
      regionId: "quiet_verge",
      poolMax: 22,
      regenPerTurn: 1,
      loot: [
        { goodId: "circuits", weight: 4 },
        { goodId: "pharm", weight: 1 },
        { goodId: "coolant", weight: 2 },
      ],
    },
    {
      id: "hullgrave",
      name: "Hullgrave",
      theme: "Half-crushed freighter cluster",
      flavor: "Mixed holds and bad oxygen. Sometimes the canisters are not empty.",
      regionId: "redwake",
      poolMax: 24,
      regenPerTurn: 1,
      loot: [
        { goodId: "ore", weight: 2 },
        { goodId: "luxury", weight: 1 },
        { goodId: "ghost_silk", weight: 1 },
        { goodId: "arms", weight: 1 },
      ],
    },
  ],

  /** Starting economy / ship (tunable). */
  start: {
    stationId: "haven_spindle",
    credits: 1000,
    debt: 0,
    cargo: {},
    ship: {
      name: "Morrowlit",
      cargoCapacity: 50,
      fuelCapacity: 100,
      fuel: 100,
      hull: 80,
      hullMax: 100,
      weaponSlots: 1,
      speed: 3,
    },
  },

  /** Market pricing knobs. */
  market: {
    /** Buy price sits above mid; sell below (same-station spread). */
    buySpread: 1.06,
    sellSpread: 0.94,
    /** Random noise range applied per visit (inclusive-ish). */
    noiseMin: 0.9,
    noiseMax: 1.1,
    /** Supply starts here; buy lowers stock (prices rise), sell raises stock. */
    baseSupply: 40,
    supplyStep: 1,
    minPrice: 1,
  },

  /** Galaxy layout + travel knobs. */
  galaxy: {
    mapWidth: 720,
    mapHeight: 400,
    /** Region columns left→right (LORE order). */
    regionOrder: ["lantern_reach", "ashline", "quiet_verge", "redwake"],
    paddingX: 56,
    paddingY: 48,
    /** Fuel burned = max(minFuelCost, round(distance * fuelPerUnit)). */
    fuelPerUnit: 0.045,
    minFuelCost: 4,
    /** Extra edges inside a region beyond a spanning tree (seeded). */
    extraIntraEdges: 1,
    /** Bridges between adjacent region columns. */
    bridgesPerRegionPair: 2,
  },
};
