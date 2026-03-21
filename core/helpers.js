// GENESIS — core/helpers.js — Fonctions utilitaires

// ── HELPERS ──────────────────────────────────────────────────────────
function d2(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function _nearestCave(x,z,md){if(!TR.caves?.length)return null;let b=null,bd=md;TR.caves.forEach(cv=>{const d=Math.hypot(cv.x-x,cv.z-z);if(d<bd){bd=d;b=cv;}});return b;}
function near(e,t){return Math.hypot(e.x-e.tx,e.z-e.tz)<t;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

// ── BOUCLE PRINCIPALE ────────────────────────────────────────────────
let _last=null,_anim=0,_hudN=0;
