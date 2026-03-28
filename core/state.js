// GENESIS — core/state.js

const W = {
  // Temps — -12000 BP
  hour: 6, day: 0, year: 12000,  // year = années BP (compte à rebours)
  season: 'spring', weather: 'clear', temp: 12,
  snowDepth: 0,       // 0-1, neige au sol

  // Entités
  humans: [], animals: [], clans: [],

  // Stats
  divEnergy: 60,
  paused: false, speed: 1,
  totalSim: 0,
  pop: 0, gen: 1, births: 0, deaths: 0,
  speciesStage: 0,

  // Météo étendue
  windDir: 0,         // radians
  windStr: 0.3,       // 0-1
  humidity: 0.5,

  // Événements globaux actifs
  activeEvents: [],   // {type, timer, intensity}
};

// Camp de base — singleton global
const CAMP = {
  x: 0, z: 0,
  established: false,
  fireLevel: 0,        // 0=rien 1=braises 2=feu 3=grand feu
  fireFuel: 0,         // secondes simulées de combustible restant
  foodStock: 0,
  waterStock: 0,       // gourdes/outres
  shelterLevel: 0,     // 0=rien 1=peaux tendues 2=hutte de branches 3=grotte
  shelterX: 0, shelterZ: 0,  // position de l'abri (peut être une grotte)
  tools: [],           // outils fabriqués
  age: 0,              // jours depuis fondation
};