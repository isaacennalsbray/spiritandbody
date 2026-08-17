export const EQUIPMENT = {
  // ── Staffs — grant a typed move ────────────────────────────────────────────
  basic_staff:     { id:'basic_staff',     slot:'staff',  name:'Basic Staff',     attackBonus:0,  defenseBonus:0,  speedBonus:0,  moveId:'staff_bolt',    shopPrice: null  },
  fire_staff:      { id:'fire_staff',      slot:'staff',  name:'Fire Staff',      attackBonus:2,  defenseBonus:0,  speedBonus:0,  moveId:'fire_bolt',     shopPrice: null  },
  ice_staff:       { id:'ice_staff',       slot:'staff',  name:'Ice Staff',       attackBonus:0,  defenseBonus:2,  speedBonus:0,  moveId:'ice_bolt',      shopPrice: null  },
  lightning_staff: { id:'lightning_staff', slot:'staff',  name:'Lightning Staff', attackBonus:3,  defenseBonus:0,  speedBonus:0,  moveId:'lightning_bolt',shopPrice: null  },
  water_staff:     { id:'water_staff',     slot:'staff',  name:'Water Staff',     attackBonus:1,  defenseBonus:1,  speedBonus:0,  moveId:'water_bolt',    shopPrice: 220   },
  nature_staff:    { id:'nature_staff',    slot:'staff',  name:'Nature Staff',    attackBonus:1,  defenseBonus:0,  speedBonus:1,  moveId:'plant_bolt',    shopPrice: 220   },

  // ── Hats — attack bonus ─────────────────────────────────────────────────────
  basic_hat:       { id:'basic_hat',       slot:'hat',    name:'Basic Hat',       attackBonus:2,  defenseBonus:0,  speedBonus:0,  moveId:null,            shopPrice: 60    },
  battle_helm:     { id:'battle_helm',     slot:'hat',    name:'Battle Helm',     attackBonus:5,  defenseBonus:0,  speedBonus:0,  moveId:null,            shopPrice: null  },
  scholars_cap:    { id:'scholars_cap',    slot:'hat',    name:"Scholar's Cap",   attackBonus:3,  defenseBonus:0,  speedBonus:2,  moveId:null,            shopPrice: null  },
  war_crown:       { id:'war_crown',       slot:'hat',    name:'War Crown',       attackBonus:4,  defenseBonus:1,  speedBonus:0,  moveId:null,            shopPrice: 280   },

  // ── Robes — defense bonus ────────────────────────────────────────────────────
  basic_robe:      { id:'basic_robe',      slot:'robe',   name:'Basic Robe',      attackBonus:0,  defenseBonus:2,  speedBonus:0,  moveId:null,            shopPrice: 60    },
  heavy_robe:      { id:'heavy_robe',      slot:'robe',   name:'Heavy Robe',      attackBonus:0,  defenseBonus:6,  speedBonus:-1, moveId:null,            shopPrice: null  },
  silk_robe:       { id:'silk_robe',       slot:'robe',   name:'Silk Robe',       attackBonus:0,  defenseBonus:3,  speedBonus:2,  moveId:null,            shopPrice: null  },
  traveler_cloak:  { id:'traveler_cloak',  slot:'robe',   name:'Traveler Cloak',  attackBonus:0,  defenseBonus:4,  speedBonus:1,  moveId:null,            shopPrice: 240   },

  // ── Boots — speed bonus ──────────────────────────────────────────────────────
  basic_boots:     { id:'basic_boots',     slot:'boots',  name:'Basic Boots',     attackBonus:0,  defenseBonus:0,  speedBonus:2,  moveId:null,            shopPrice: 60    },
  swift_boots:     { id:'swift_boots',     slot:'boots',  name:'Swift Boots',     attackBonus:0,  defenseBonus:0,  speedBonus:5,  moveId:null,            shopPrice: null  },
  heavy_boots:     { id:'heavy_boots',     slot:'boots',  name:'Heavy Boots',     attackBonus:0,  defenseBonus:2,  speedBonus:0,  moveId:null,            shopPrice: null  },
  winged_boots:    { id:'winged_boots',    slot:'boots',  name:'Winged Boots',    attackBonus:0,  defenseBonus:0,  speedBonus:4,  moveId:null,            shopPrice: 200   },

  // ── Relics — grant a typed move ─────────────────────────────────────────────
  basic_relic:     { id:'basic_relic',     slot:'relic',  name:'Basic Relic',     attackBonus:0,  defenseBonus:0,  speedBonus:0,  moveId:'relic_blast',   shopPrice: 100   },
  nature_relic:    { id:'nature_relic',    slot:'relic',  name:'Nature Relic',    attackBonus:0,  defenseBonus:1,  speedBonus:1,  moveId:'plant_bolt',    shopPrice: null  },
  storm_relic:     { id:'storm_relic',     slot:'relic',  name:'Storm Relic',     attackBonus:1,  defenseBonus:0,  speedBonus:1,  moveId:'lightning_bolt',shopPrice: 260   },
};

// Items the shop sells (those with a shopPrice)
export const SHOP_ITEMS = Object.values(EQUIPMENT).filter(e => e.shopPrice !== null);
