// GENESIS — core/loop.js

let _last=null, _anim=0, _hudN=0, _ready=false;

function loop(now){
  requestAnimationFrame(loop);
  const realDt=_last?Math.min(now-_last,100):16;
  _last=now; _anim+=realDt/1000;

  if(!W.paused){
    const simDt=tickClock(realDt);
    if(simDt>0){tickEco(simDt,realDt);tickEvents(now);}
  }
  animMeshes(_anim);
  updateVisuals(_anim);
  if(_ready) updateCam(realDt);
  _hudN++; if(_hudN%5===0) updateHUD();
  SC.renderer.render(SC.scene,SC.camera);
}

function sL(p,m){
  document.getElementById('lfill').style.width=p+'%';
  document.getElementById('lmsg').textContent=m;
}
async function nf(){return new Promise(r=>requestAnimationFrame(r));}

async function main(){
  try{
    sL(5,'Three.js…');    if(!window.THREE)throw new Error('Three.js manquant'); await nf();
    sL(12,'Scène…');      initScene();        await nf();
    sL(25,'Terrain…');    buildTerrain(SC.scene); await nf();
    sL(40,'Brouillard…'); initFog(SC.scene);  await nf();
    sL(52,'Végétation…'); buildVeg(SC.scene); await nf();
    sL(62,'Grottes…');    buildCaves(SC.scene); await nf();
    sL(72,'Spawn…');      initEcosystem();

    W.humans.forEach(h=>{buildHumanMesh(h);SC.scene.add(h.mesh);});
    W.animals.forEach(a=>{buildAnimalMesh(a);SC.scene.add(a.mesh);});
    await nf();

    sL(85,'Contrôles…'); initCam(); initRaycaster();

    // ── CAMÉRA : positionnement direct sur Adam, ZÉRO lerp ───────
    const adam=W.humans.find(h=>h.name==='Adam');
    if(adam){
      // Forcer _sx/_sy/_sz = Adam (pas null, pas 0,0,0)
      CAM._sx=adam.x; CAM._sy=adam.y; CAM._sz=adam.z;

      // Calculer position caméra
      const cx=adam.x+Math.sin(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;
      const cy=adam.y+Math.sin(CAM.phi)*CAM.dist+1;
      const cz=adam.z+Math.cos(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;

      // Écrire DIRECTEMENT dans curP et Three.js — aucun lerp
      CAM.curP.x=cx; CAM.curP.y=cy; CAM.curP.z=cz;
      CAM.target=adam;
      CAM.freeF.x=adam.x; CAM.freeF.y=adam.y; CAM.freeF.z=adam.z;
      SC.camera.position.set(cx,cy,cz);
      SC.camera.lookAt(adam.x,adam.y+1.5,adam.z);
      SC.camera.updateMatrixWorld(true);

      // Brouillard
      const eve=W.humans.find(h=>h.name==='Ève');
    }
    await nf();

    sL(100,'Éveil…'); await nf();
    const ld=document.getElementById('loading');
    ld.style.transition='opacity 1.5s'; ld.style.opacity='0';
    setTimeout(()=>ld.style.display='none',1600);

    log('✦ In principio… Adam et Ève s\'éveillent.','discovery');
    log('✦ Ils ont faim. Ils ont soif. Le monde est hostile.','danger');
    log('✦ Tout vient d\'eux. Guidez-les en silence.','discovery');
    addChron('L\'aube du monde','🌅');

    _ready=true;  // débloquer updateCam maintenant seulement
    requestAnimationFrame(loop);

  }catch(err){
    console.error('[Genesis]',err);
    document.getElementById('lmsg').textContent='❌ '+err.message;
  }
}

window.G={
  d:divine,
  cam(mode){
    CAM.mode=mode;
    document.querySelectorAll('.cb').forEach(b=>b.classList.remove('on'));
    const btn=document.getElementById('c-'+mode);if(btn)btn.classList.add('on');
  },
  focus(name){
    const h=W.humans.find(h=>h.name===name&&h.alive);
    if(!h)return;
    // Reset smooth target directement sur le perso — pas de lerp
    CAM._sx=h.x; CAM._sy=h.y; CAM._sz=h.z;
    CAM.curP.x=h.x+Math.sin(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;
    CAM.curP.y=h.y+Math.sin(CAM.phi)*CAM.dist+1;
    CAM.curP.z=h.z+Math.cos(CAM.theta)*Math.cos(CAM.phi)*CAM.dist;
    SC.camera.position.set(CAM.curP.x,CAM.curP.y,CAM.curP.z);
    CAM.target=h; G.cam('follow');
  },
  cycleSpeed(){
    const sp=[1,2,5,10,20];
    W.speed=sp[(sp.indexOf(W.speed)+1)%sp.length]; _spdHUD();
  },
  closeInsp(){
    document.getElementById('insp').style.display='none';
    if(CAM.mode==='insp')G.cam('follow');
  },
  state:W,
};

main();