// GENESIS — core/state.js — État global du monde

// ── ÉTAT MONDE ────────────────────────────────────────────────────────
const W = {
  hour:6, day:0, year:0, season:'spring',
  weather:'clear', temp:18,
  humans:[], animals:[], clans:[],
  divEnergy:60,
  paused:false, speed:1,
  totalSim:0,   // secondes simulées totales
  pop:2, gen:1, births:2, deaths:0,
  speciesStage:0,  // palier d'évolution actuel
};

// ── TERRAIN ───────────────────────────────────────────────────────────
