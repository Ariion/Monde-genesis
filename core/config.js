// GENESIS — core/config.js
// Paléolithique supérieur — 12 000 BP

const CFG = {
  // Monde
  W: 350, S: 120, H: 70,

  // Temps : 1 jour simulé = DAY_SEC secondes réelles à ×1
  // On veut voir une journée complète en ~3 minutes réelles à ×1
  DAY_SEC: 180,   // 3 minutes réelles = 1 jour simulé

  // Besoins par SECONDE SIMULÉE
  // Faim vide en 2 jours (un humain du paléo mange 2x/jour)
  HUNGER_RATE: 0.00058,  // vide en ~1.9 jours simulés
  THIRST_RATE: 0.00085,  // vide en ~1.4 jours simulés (eau critique)
  ENERGY_RATE: 0.00015,  // vide en ~7.7 jours (endurance primitive)
  WARMTH_RATE: 0.00045,  // froid dangereux rapidement

  CRIT: 15,
  WARN: 35,

  // Groupe initial — bande de 8-10
  GROUP_SIZE: 9,

  // Vision
  VISION_RANGE: 60,
  FOG_REVEAL_R: 55,

  // Animaux de l'époque (pas de smilodon à -12000 BP en Europe, mais on garde pour gameplay)
  ANIMALS: {
    deer: 12, rabbit: 25, mammoth: 4, bison: 8,
    wolf: 5, bear: 3, horse: 10, fish: 20,
  },
  MAX_ANIMALS: 160,

  // Maladies
  DISEASE_CHANCE: 0.00004,   // par seconde simulée par individu
  DISEASE_SPREAD: 0.15,      // chance de contagion si < 8u
  INFANT_MORTALITY: 0.22,    // 22% de mortalité infantile (historiquement juste)

  // Progression
  SPECIES_STAGES: [
    {name:'Homo sapiens archaïque', gen:1,  iq:0},
    {name:'Chasseur-cueilleur',     gen:3,  iq:20},
    {name:'Artisan primitif',       gen:8,  iq:40},
    {name:'Homo sapiens moderne',   gen:15, iq:70},
  ],

  // Divine
  DIVINE_MAX: 100,
  DIVINE_REGEN: 0.2,
  DIVINE_COSTS: {weather:10,prey:5,danger:8,heal:25,vision:15,fruit:12,warm:15},

  EVT_COOLDOWN: 45,
};