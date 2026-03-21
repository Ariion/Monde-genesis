// GENESIS — rendering/species.js — Espèces animales

// ── ESPÈCES ANIMALES ─────────────────────────────────────────────────
const SP={
  deer:    {name:'Cerf',     col:0xa07040,sz:1.05,hp:75, spd:7,  pred:['wolf','sabre','bear'],food:38,danger:false},
  rabbit:  {name:'Lapin',    col:0xb09070,sz:.42, hp:10, spd:8,  pred:['wolf','eagle','bear'],food:10,danger:false},
  mammoth: {name:'Mammouth', col:0x5a4030,sz:2.5, hp:360,spd:5,  pred:['sabre'],              food:110,danger:true},
  bison:   {name:'Bison',    col:0x6a4a20,sz:1.5, hp:150,spd:7,  pred:['wolf','sabre','bear'],food:70,danger:true},
  wolf:    {name:'Loup',     col:0x707070,sz:.95, hp:95, spd:9,  pred:['sabre'],              food:0, danger:true},
  bear:    {name:'Ours',     col:0x5a3a20,sz:1.7, hp:230,spd:6,  pred:[],                     food:0, danger:true},
  sabre:   {name:'Smilodon', col:0xa07040,sz:1.05,hp:180,spd:11, pred:[],                     food:0, danger:true,apex:true},
  eagle:   {name:'Aigle',    col:0x8a6030,sz:.85, hp:20, spd:18, pred:[],                     food:0, danger:false,aerial:true},
  fish:    {name:'Poisson',  col:0x4090c0,sz:.3,  hp:4,  spd:2.5,pred:['eagle','bear'],        food:7, danger:false,aquatic:true},
};

// ── MESHES ────────────────────────────────────────────────────────────
function mL(c){return new THREE.MeshLambertMaterial({color:c});}
