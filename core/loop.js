// GENESIS — core/loop.js

// ── BOUCLE PRINCIPALE ─────────────────────────────────────────────────────
let _last=null, _anim=0, _hudN=0;

function loop(now) {
  requestAnimationFrame(loop);
  const realDt = _last ? Math.min(now-_last, 100) : 16;
  _last = now;
  _anim += realDt/1000;

  if (!W.paused) {
    const simDt = tickClock(realDt);
    if (simDt>0) { tickEco(simDt, realDt); tickEvents(now); }
  }
  animMeshes(_anim);
  updateVisuals(_anim);
  updateCam(realDt);
  _hudN++;
  if (_hudN%5===0) updateHUD();
  SC.renderer.render(SC.scene, SC.camera);
}

// ── INIT ──────────────────────────────────────────────────────────────────
function sL(p,m) {
  document.getElementById('lfill').style.width=p+'%';
  document.getElementById('lmsg').textContent=m;
}
async function nf() { return new Promise(r=>requestAnimationFrame(r)); }

async function main() {
  try {
    sL(5,  'Initialisation Three.js…');
    if (!window.THREE) throw new Error('Three.js non chargé!');
    await nf();

    sL(12, 'Construction de la scène…');  initScene();      await nf();
    sL(25, 'Génération du terrain…');     buildTerrain(SC.scene); await nf();
    sL(40, 'Brouillard de guerre…');      initFog(SC.scene);await nf();
    sL(52, 'Végétation…');               buildVeg(SC.scene); await nf();
    sL(62, 'Grottes…');                  buildCaves(SC.scene); await nf();
    sL(72, 'Adam et Ève s\'éveillent…'); initEcosystem();

    W.humans.forEach(h => { buildHumanMesh(h); SC.scene.add(h.mesh); });
    W.animals.forEach(a => { buildAnimalMesh(a); SC.scene.add(a.mesh); });
    await nf();

    sL(85, 'Contrôles…'); initCam(); initRaycaster();

    // ── CENTRER CAMÉRA SUR ADAM (position réelle, SANS lerp) ─────────────
    const adam = W.humans.find(h=>h.name==='Adam');
    if (adam) {
      // Forcer la caméra DIRECTEMENT sur Adam — pas de lerp, pas de glissement
      const cx = adam.x + Math.sin(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;
      const cy = adam.y + Math.sin(CAM.phi)*CAM.dist + 1;
      const cz = adam.z + Math.cos(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;

      // Initialiser TOUTES les valeurs de suivi directement sur Adam
      CAM.target  = adam;
      CAM._sx     = adam.x;   // cible lissée = Adam exact
      CAM._sy     = adam.y;
      CAM._sz     = adam.z;
      CAM.curP.x  = cx;       // position caméra = déjà calculée
      CAM.curP.y  = cy;
      CAM.curP.z  = cz;
      CAM.freeF.x = adam.x;
      CAM.freeF.y = adam.y;
      CAM.freeF.z = adam.z;

      // Forcer la position Three.js immédiatement (pas de lerp au 1er frame)
      SC.camera.position.set(cx, cy, cz);
      SC.camera.lookAt(adam.x, adam.y+1.5, adam.z);
      SC.camera.updateMatrixWorld();

      // Révéler brouillard autour d'eux
      revealFog(adam.x, adam.z, CFG.FOG_REVEAL_R);
      const eve = W.humans.find(h=>h.name==='Ève');
      if (eve) revealFog(eve.x, eve.z, CFG.FOG_REVEAL_R*.7);
    }
    await nf();

    sL(100, 'Le monde s\'éveille…'); await nf();

    // Masquer l'écran de chargement
    const ld = document.getElementById('loading');
    ld.style.transition = 'opacity 1.5s';
    ld.style.opacity = '0';
    setTimeout(()=>{ ld.style.display='none'; }, 1600);

    log('✦ In principio… Adam et Ève s\'éveillent.','discovery');
    log('✦ Ils ont faim. Ils ont soif. Le monde est hostile.','danger');
    log('✦ Tout vient d\'eux. Guidez-les en silence.','discovery');
    addChron('L\'aube du monde','🌅');

    requestAnimationFrame(loop);

  } catch(err) {
    console.error('[Genesis]', err);
    document.getElementById('lmsg').textContent = '❌ ' + err.message;
  }
}

// ── API PUBLIQUE ──────────────────────────────────────────────────────────
window.G = {
  d: divine,
  cam(mode) {
    CAM.mode = mode;
    document.querySelectorAll('.cb').forEach(b=>b.classList.remove('on'));
    const btn = document.getElementById('c-'+mode);
    if (btn) btn.classList.add('on');
  },
  focus(name) {
    const h = W.humans.find(h=>h.name===name&&h.alive);
    if (!h) return;
    CAM.target=h; CAM.theta=0; CAM.phi=.65;
    // Reset smooth target directement sur le perso
    CAM._sx=h.x; CAM._sy=h.y; CAM._sz=h.z;
    G.cam('follow');
  },
  cycleSpeed() {
    const sp=[1,2,5,10,20];
    W.speed = sp[(sp.indexOf(W.speed)+1)%sp.length];
    _spdHUD();
  },
  closeInsp() {
    document.getElementById('insp').style.display='none';
    if (CAM.mode==='insp') G.cam('follow');
  },
  state: W,
};

main();