// GENESIS — ui/camera.js

const CAM = {
  mode: 'follow', target: null,
  theta: 0, phi: 0.82, dist: 50,   // dist=50, phi=0.82 → vue confortable
  freeF: {x:0, y:0, z:0},
  godA: 0,
  drag: false, rBtn: false, lmx: 0, lmy: 0,
  keys: {},
  // curP : position actuelle de la caméra (initialisée dans loop.js)
  curP: {x:0, y:50, z:50},
  // Cibles lissées (initialisées dans loop.js sur Adam)
  _sx: null, _sy: null, _sz: null,
};

function initCam() {
  const cv = SC.renderer.domElement;

  cv.addEventListener('mousedown', e => {
    if (e.button===1) { e.preventDefault(); G.cam('god'); return; }
    CAM.drag=true; CAM.rBtn=(e.button===2);
    CAM.lmx=e.clientX; CAM.lmy=e.clientY;
  });
  document.addEventListener('mouseup', () => CAM.drag=false);
  document.addEventListener('mousemove', e => {
    if (!CAM.drag) return;
    const dx=(e.clientX-CAM.lmx)*.006, dy=(e.clientY-CAM.lmy)*.006;
    CAM.lmx=e.clientX; CAM.lmy=e.clientY;
    if (CAM.rBtn || CAM.mode==='free') {
      CAM.theta += dx;
      CAM.phi = Math.max(.1, Math.min(1.55, CAM.phi+dy));
    }
    if (CAM.mode==='god' || e.shiftKey) {
      const sc2 = CAM.dist*.0015;
      CAM.freeF.x -= Math.cos(CAM.theta)*dx*sc2*CFG.W*.4;
      CAM.freeF.z -= Math.sin(CAM.theta)*dy*sc2*CFG.W*.4;
    }
  });
  cv.addEventListener('wheel', e => {
    CAM.dist = Math.max(8, Math.min(400, CAM.dist + e.deltaY*.06));
  }, {passive:true});
  cv.addEventListener('contextmenu', e => e.preventDefault());

  document.addEventListener('keydown', e => {
    CAM.keys[e.code] = true;
    if (e.code==='Space')            { e.preventDefault(); W.paused=!W.paused; _spdHUD(); }
    if (e.code==='Equal'||e.code==='NumpadAdd')      { W.speed=Math.min(20,W.speed*2); _spdHUD(); }
    if (e.code==='Minus'||e.code==='NumpadSubtract') { W.speed=Math.max(1,Math.floor(W.speed/2)); _spdHUD(); }
    if (e.code==='Digit1') G.cam('follow');
    if (e.code==='Digit2') G.cam('free');
    if (e.code==='Digit3') G.cam('god');
    if (e.code==='Digit4') G.cam('insp');
    if (e.code==='KeyA')   G.focus('Adam');
    if (e.code==='KeyV')   G.focus('Ève');
    if (e.code==='Escape') G.closeInsp();
  });
  document.addEventListener('keyup', e => CAM.keys[e.code]=false);
}

function updateCam(realDt) {
  const cam = SC.camera;

  // Mouvement clavier en mode libre
  if (CAM.mode==='free') {
    const sp = .12*realDt * (CAM.keys['ShiftLeft']?3:1);
    if (CAM.keys['KeyW']) { CAM.freeF.x+=Math.sin(CAM.theta)*sp; CAM.freeF.z+=Math.cos(CAM.theta)*sp; }
    if (CAM.keys['KeyS']) { CAM.freeF.x-=Math.sin(CAM.theta)*sp; CAM.freeF.z-=Math.cos(CAM.theta)*sp; }
    if (CAM.keys['KeyA']) { CAM.freeF.x-=Math.cos(CAM.theta)*sp; CAM.freeF.z+=Math.sin(CAM.theta)*sp; }
    if (CAM.keys['KeyD']) { CAM.freeF.x+=Math.cos(CAM.theta)*sp; CAM.freeF.z-=Math.sin(CAM.theta)*sp; }
  }

  switch (CAM.mode) {

    case 'follow': {
      const t = CAM.target
        || W.humans.find(h=>h.alive&&h.name==='Adam')
        || W.humans.find(h=>h.alive);
      if (!t) { G.cam('god'); break; }

      // Initialiser _sx/_sy/_sz si pas encore fait (ou si null)
      if (CAM._sx===null) { CAM._sx=t.x; CAM._sy=t.y; CAM._sz=t.z; }

      // Lerp très doux sur la cible
      CAM._sx += (t.x - CAM._sx) * .05;
      CAM._sy += (t.y - CAM._sy) * .04;
      CAM._sz += (t.z - CAM._sz) * .05;

      // Position caméra en orbite autour de la cible lissée
      const tx = CAM._sx + Math.sin(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;
      const ty = CAM._sy + Math.sin(CAM.phi)*CAM.dist + 1;
      const tz = CAM._sz + Math.cos(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;

      // Lerp doux sur la position caméra
      CAM.curP.x += (tx - CAM.curP.x) * .06;
      CAM.curP.y += (ty - CAM.curP.y) * .06;
      CAM.curP.z += (tz - CAM.curP.z) * .06;

      // Hauteur minimum : jamais sous le terrain
      const groundH = getH(CAM.curP.x, CAM.curP.z);
      if (CAM.curP.y < groundH + 3) CAM.curP.y = groundH + 3;

      cam.position.set(CAM.curP.x, CAM.curP.y, CAM.curP.z);
      cam.lookAt(CAM._sx, CAM._sy + 1.5, CAM._sz);
      break;
    }

    case 'free': {
      const tx = CAM.freeF.x + Math.sin(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;
      const ty = CAM.freeF.y + Math.sin(CAM.phi)*CAM.dist + 5;
      const tz = CAM.freeF.z + Math.cos(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;
      cam.position.lerp(new THREE.Vector3(tx, Math.max(5,ty), tz), .08);
      cam.lookAt(CAM.freeF.x, CAM.freeF.y, CAM.freeF.z);
      break;
    }

    case 'god': {
      CAM.godA += .00008*realDt;
      const r = Math.min(CAM.dist*1.8, 280);
      const gx = Math.sin(CAM.godA)*r + CAM.freeF.x;
      const gz = Math.cos(CAM.godA)*r + CAM.freeF.z;
      const gy = 160 + Math.sin(CAM.godA*.4)*20;
      cam.position.lerp(new THREE.Vector3(gx, gy, gz), .018);
      cam.lookAt(CAM.freeF.x, 0, CAM.freeF.z);
      // Suivre les humains en douceur
      const alive = W.humans.filter(h=>h.alive);
      if (alive.length) {
        const cx = alive.reduce((s,h)=>s+h.x,0)/alive.length;
        const cz = alive.reduce((s,h)=>s+h.z,0)/alive.length;
        CAM.freeF.x += (cx-CAM.freeF.x)*.005;
        CAM.freeF.z += (cz-CAM.freeF.z)*.005;
      }
      break;
    }

    case 'insp': {
      if (!CAM.target) { G.cam('follow'); break; }
      const t = CAM.target;
      const d = Math.max(4, CAM.dist*.18);
      const tx = t.x + Math.sin(CAM.theta)*Math.cos(CAM.phi)*d;
      const ty = t.y + Math.sin(CAM.phi)*d + 1.5;
      const tz = t.z + Math.cos(CAM.theta)*Math.cos(CAM.phi)*d;
      cam.position.lerp(new THREE.Vector3(tx, ty, tz), .1);
      cam.lookAt(t.x, t.y+1, t.z);
      showInsp(t);
      break;
    }
  }
}