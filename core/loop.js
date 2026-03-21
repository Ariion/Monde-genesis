// GENESIS — core/loop.js

// ── BOUCLE PRINCIPALE ────────────────────────────────────────────────
let _last=null,_anim=0,_hudN=0;

function loop(now){
  requestAnimationFrame(loop);
  const realDt=_last?Math.min(now-_last,100):16;_last=now;_anim+=realDt/1000;

  if(!W.paused){
    const simDt=tickClock(realDt);
    if(simDt>0){tickEco(simDt,realDt);tickEvents(now);}
  }
  animMeshes(_anim);updateVisuals(_anim);updateCam(realDt);
  _hudN++;if(_hudN%5===0)updateHUD();
  SC.renderer.render(SC.scene,SC.camera);
}

// ── INIT ─────────────────────────────────────────────────────────────
function sL(p,m){document.getElementById('lfill').style.width=p+'%';document.getElementById('lmsg').textContent=m;}
async function nf(){return new Promise(r=>requestAnimationFrame(r));}

async function main(){
  try{
    sL(5,'Initialisation Three.js…');if(!window.THREE)throw new Error('Three.js non chargé!');await nf();
    sL(12,'Construction de la scène…');initScene();await nf();
    sL(25,'Génération du terrain…');buildTerrain(SC.scene);await nf();
    sL(40,'Brouillard de guerre…');initFog(SC.scene);await nf();
    sL(52,'Végétation…');buildVeg(SC.scene);await nf();
    sL(68,'Adam et Ève s\'éveillent…');initEcosystem();
    W.humans.forEach(h=>{buildHumanMesh(h);SC.scene.add(h.mesh);});
    W.animals.forEach(a=>{buildAnimalMesh(a);SC.scene.add(a.mesh);});
    await nf();
    sL(82,'Initialisation des contrôles…');initCam();initRaycaster();
    // Cibler Adam et centrer caméra sur lui (sa position réelle)
    const adamH=W.humans.find(h=>h.name==='Adam');
    CAM.target=adamH;
    if(adamH){
      CAM.freeF.x=adamH.x; CAM.freeF.z=adamH.z;
      // Positionner la caméra directement sur Adam
      SC.camera.position.set(adamH.x, adamH.y+60, adamH.z+80);
      SC.camera.lookAt(adamH.x, adamH.y+2, adamH.z);
      CAM.curP.x=adamH.x; CAM.curP.y=adamH.y+60; CAM.curP.z=adamH.z+80;
      // Révéler le brouillard là où ils sont vraiment
      revealFog(adamH.x, adamH.z, CFG.FOG_REVEAL_R*.6);
    }
    await nf();
    sL(100,'Le monde s\'éveille…');await nf();
    const ld=document.getElementById('loading');
    ld.style.transition='opacity 1.6s';ld.style.opacity='0';
    setTimeout(()=>ld.style.display='none',1700);
    log('✦ In principio… Adam et Ève s\'éveillent.','discovery');
    log('✦ Ils ont faim. Ils ont froid. Le monde est hostile.','danger');
    log('✦ Tout vient d\'eux. Guidez-les en silence.','discovery');
    addChron('Adam et Ève s\'éveillent dans l\'obscurité','🌅');
    requestAnimationFrame(loop);
  }catch(err){
    console.error('[Genesis]',err);
    document.getElementById('lmsg').textContent='❌ '+err.message;
  }
}

// ── API ──────────────────────────────────────────────────────────────
window.G={
  d:divine,
  cam(mode){
    CAM.mode=mode;
    document.querySelectorAll('.cb').forEach(b=>b.classList.remove('on'));
    const btn=document.getElementById('c-'+mode);if(btn)btn.classList.add('on');
  },
  focus(name){
    const h=W.humans.find(h=>h.name===name&&h.alive);
    if(!h)return;CAM.target=h;CAM.theta=0;CAM.phi=.72;G.cam('follow');
  },
  cycleSpeed(){
    const sp=[1,2,5,10,20];W.speed=sp[(sp.indexOf(W.speed)+1)%sp.length];_spdHUD();
  },
  closeInsp(){
    document.getElementById('insp').style.display='none';
    if(CAM.mode==='insp')G.cam('follow');
  },
  state:W,
};

main();
