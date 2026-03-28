// GENESIS — rendering/species.js — Faune du Paléolithique supérieur (-12000 BP)

const SP = {
  // Proies
  deer:    {name:'Cerf',      col:0xa07040,sz:1.0, hp:80,  spd:7,  pred:['wolf','bear'],food:40, danger:false},
  rabbit:  {name:'Lapin',     col:0xb09878,sz:0.4, hp:8,   spd:8.5,pred:['wolf','eagle','bear'],food:8, danger:false},
  mammoth: {name:'Mammouth',  col:0x5a4030,sz:2.6, hp:400, spd:4.5,pred:[],food:120,danger:true},
  bison:   {name:'Bison',     col:0x6a4a20,sz:1.6, hp:160, spd:7,  pred:['wolf','bear'],food:75, danger:true},
  horse:   {name:'Cheval',    col:0x9a7850,sz:1.2, hp:100, spd:10, pred:['wolf','bear'],food:50, danger:false},
  fish:    {name:'Poisson',   col:0x4090c0,sz:0.3, hp:4,   spd:2.5,pred:['bear'],food:10,danger:false,aquatic:true},
  // Prédateurs
  wolf:    {name:'Loup',      col:0x707880,sz:0.9, hp:90,  spd:9,  pred:[],food:0,danger:true},
  bear:    {name:'Ours des cavernes',col:0x5a3a20,sz:2.0,hp:280,spd:5.5,pred:[],food:0,danger:true,apex:true},
  eagle:   {name:'Aigle',     col:0x7a5828,sz:0.8, hp:18,  spd:18, pred:[],food:0,danger:false,aerial:true},
};