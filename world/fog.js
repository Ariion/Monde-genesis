// GENESIS — world/fog.js — Brouillard de guerre

// ── BROUILLARD DE GUERRE ─────────────────────────────────────────────────
// Approche : overlay 2D CSS par-dessus le canvas WebGL
// Beaucoup plus fiable qu'un plan 3D (pas de problème caméra/orientation)

let _fogCanvas=null, _fogCtx=null, _fogOverlay=null;
const FOG_SIZE=512;

function initFog(sc){
  // Créer un canvas HTML par-dessus le canvas 3D
  _fogCanvas=document.createElement('canvas');
  _fogCanvas.width=FOG_SIZE; _fogCanvas.height=FOG_SIZE;
  _fogCanvas.id='fog-overlay';
  _fogCanvas.style.cssText=`
    position:fixed;inset:0;width:100%;height:100%;
    pointer-events:none;z-index:10;
    image-rendering:pixelated;
  `;
  document.body.appendChild(_fogCanvas);
  _fogCtx=_fogCanvas.getContext('2d');

  // Tout noir au départ
  _fogCtx.fillStyle='rgba(5,4,8,1)';
  _fogCtx.fillRect(0,0,FOG_SIZE,FOG_SIZE);
  _fogOverlay=_fogCanvas;
}

function revealFog(wx,wz,radius){
  if(!_fogCtx)return;
  // Monde [-W/2..W/2] → canvas [0..FOG_SIZE]
  const cx=((wx/CFG.W)+0.5)*FOG_SIZE;
  const cz=((wz/CFG.W)+0.5)*FOG_SIZE;
  const r=(radius/CFG.W)*FOG_SIZE;

  const grd=_fogCtx.createRadialGradient(cx,cz,0,cx,cz,r);
  grd.addColorStop(0,   'rgba(0,0,0,1)');
  grd.addColorStop(0.65,'rgba(0,0,0,0.9)');
  grd.addColorStop(1,   'rgba(0,0,0,0)');
  _fogCtx.globalCompositeOperation='destination-out';
  _fogCtx.fillStyle=grd;
  _fogCtx.beginPath();
  _fogCtx.arc(cx,cz,r,0,Math.PI*2);
  _fogCtx.fill();
  _fogCtx.globalCompositeOperation='source-over';
}

// Synchroniser la vue 3D → canvas 2D
// Appelé depuis updateVisuals()
function updateFogOverlay(){
  if(!_fogCanvas||!SC.camera||!SC.renderer)return;
  // Le canvas 2D couvre tout l'écran mais représente le monde
  // On n'a pas besoin de le transformer — il est en overlay fixe
  // La révélation se fait en coordonnées monde normalisées → ok
}
