// GENESIS — entities/consciousness.js — Émotions & pensées

// ── CONSCIENCE ÉMERGENTE ──────────────────────────────────────────────
// Le moteur de décision humain est basé sur les états émotionnels
// Chaque individu a une "conscience" = système d'émotions + mémoire + apprentissage

const EMOTIONS={
  TERROR:    {name:'Terreur',   col:'#ff3030', priority:10},
  FEAR:      {name:'Peur',      col:'#ff6040', priority:9},
  PAIN:      {name:'Douleur',   col:'#ff5050', priority:8},
  HUNGER:    {name:'Faim',      col:'#e09040', priority:7},
  THIRST:    {name:'Soif',      col:'#4090e0', priority:7},
  COLD:      {name:'Froid',     col:'#80a0ff', priority:6},
  TIRED:     {name:'Fatigue',   col:'#9080c0', priority:5},
  GRIEF:     {name:'Deuil',     col:'#8080a0', priority:4},
  NEUTRAL:   {name:'Calme',     col:'#a0a080', priority:1},
  CURIOSITY: {name:'Curiosité', col:'#80c890', priority:2},
  SOCIAL:    {name:'Lien',      col:'#e0a0c0', priority:3},
  JOY:       {name:'Joie',      col:'#f0d060', priority:2},
};

const THOUGHTS_BY_STATE={
  find_water:  ['Soif… eau…','Besoin d\'eau','Trouver eau','Gorge sèche…'],
  find_food:   ['Faim… manger','Chercher nourriture','Ventre creux…','Trouver proie'],
  hunt:        ['Proie là…','Silence…','Approcher…','Sauter!'],
  gather:      ['Baies ici','Manger ça','Ramasser'],
  eat:         ['Bon…','Manger enfin','Ahhh…'],
  sleep:       ['Zzz…','Repos…','Fatigué…'],
  seek_fire:   ['Froid… feu','Trouver chaleur','Froid froid froid'],
  partner:     ['Pas seul…','Proche de toi','Ensemble'],
  bond:        ['Toi et moi','Bien avec toi','Pas partir'],
  flee:        ['DANGER!','FUIR!','Courir!','Prédateur!'],
  explore:     ['Qu\'est-ce là?','Explorer','Aller voir','Nouveau endroit'],
  idle:        ['…','Observer','Écouter','Sentir l\'air'],
  teach:       ['Montrer ça','Toi faire comme ça','Apprendre'],
  follow:      ['Suivre groupe','Pas seul','Ensemble sûr'],
};


// ── ENTITÉ HUMAINE (Homo primitif) ────────────────────────────────────