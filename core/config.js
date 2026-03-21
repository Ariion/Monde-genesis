// GENESIS — core/config.js — Tous les paramètres

// ── CONFIG ────────────────────────────────────────────────────────────
const CFG = {
  // Monde
  W: 350,
  S: 120,
  H: 70,

  // Temps : 1 JOUR simulé = DAY_SEC secondes RÉELLES (à ×1)
  // simDt/frame = (16ms/1000) * speed * (86400/DAY_SEC)
  // À speed=3, DAY_SEC=90 : simDt ≈ 46s/frame
  DAY_SEC: 90,

  // Besoins — perte par SECONDE SIMULÉE
  // Cible : faim vide en 3 jours simulés = 3*86400 = 259200s sim
  // → rate = 100 / 259200 = 0.000386
  HUNGER_RATE: 0.00035,   // vide en ~3 jours simulés (~4.5min réelles à ×3)
  THIRST_RATE: 0.00055,   // vide en ~2 jours simulés (~3min réelles à ×3)
  ENERGY_RATE: 0.00020,   // vide en ~5.8 jours simulés
  WARMTH_RATE: 0.00030,   // perte/s simulée si froid

  // Seuils de danger
  CRIT: 15,   // en dessous = urgence
  WARN: 35,   // en dessous = préoccupé

  // Vision & exploration
  VISION_RANGE: 55,      // m — rayon de vision d'un primate
  FOG_REVEAL_R: 70,      // m — rayon de révélation du brouillard

  // Animaux
  ANIMALS: {
    deer:8, rabbit:20, mammoth:3, bison:6,
    wolf:4, bear:2, sabre:2, eagle:5, fish:18
  },
  MAX_ANIMALS: 140,

  // Conscience / Émotions
  EMOTIONS: ['terreur','peur','faim','soif','froid','calme','curiosité','attachement','joie','deuil'],

  // Progression espèce (paliers de conscience)
  SPECIES_STAGES: [
    {name:'Primate primitif',  gen:1,  iq:0},
    {name:'Homo habilis',      gen:3,  iq:15},
    {name:'Homo erectus',      gen:8,  iq:35},
    {name:'Néandertalien',     gen:15, iq:60},
    {name:'Homo sapiens',      gen:25, iq:85},
  ],

  // Divine
  DIVINE_MAX: 100,
  DIVINE_REGEN: 0.3,   // par minute simulée
  DIVINE_COSTS: {weather:10,prey:5,danger:8,heal:20,vision:15,fruit:10,warm:12},

  // Événements
  EVT_COOLDOWN: 60,    // secondes RÉELLES minimum
};
