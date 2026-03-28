// GENESIS — rendering/meshes.js
// Pixel art : humains et animaux en boîtes colorées simples

function mL(c)  { return new THREE.MeshLambertMaterial({color:c}); }
function mLs(c) { return new THREE.MeshLambertMaterial({color:c}); }
function box(w,h,d,mat) { return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); }

// ── HUMAIN PIXEL ART ─────────────────────────────────────────────────────────
function buildHumanMesh(h) {
  const isMale = h.sex==='M';
  const g = new THREE.Group();

  // Couleurs selon sexe
  const skinC  = isMale ? 0xc49070 : 0xd4a882;
  const clothC = isMale ? 0x3a5a8a : 0x8a3a5a;  // bleu homme, rose femme
  const hairC  = isMale ? 0x2a1a08 : 0x6a2a08;

  const mSkin  = mL(skinC);
  const mCloth = mL(clothC);
  const mHair  = mL(hairC);
  const mDark  = mL(Math.max(0,clothC-0x101010));

  // Corps (torse)
  const torso = box(0.5, 0.55, 0.28, mCloth);
  torso.position.y = 0.9;
  torso.castShadow = true;
  g.add(torso);

  // Tête
  const head = box(0.42, 0.42, 0.38, mSkin);
  head.position.y = 1.52;
  head.castShadow = true;
  g.add(head);

  // Cheveux (calotte)
  const hair = box(0.44, 0.16, 0.40, mHair);
  hair.position.y = 1.76;
  g.add(hair);
  if (!isMale) {
    // Mèches latérales
    const ml = box(0.10, 0.28, 0.34, mHair);
    ml.position.set(-0.24, 1.54, 0); g.add(ml);
    const mr = box(0.10, 0.28, 0.34, mHair);
    mr.position.set( 0.24, 1.54, 0); g.add(mr);
  }

  // Jambes
  const legL = box(0.20, 0.50, 0.22, mDark);
  legL.position.set(-0.14, 0.40, 0);
  legL.castShadow = true; g.add(legL);
  const legR = box(0.20, 0.50, 0.22, mDark);
  legR.position.set( 0.14, 0.40, 0);
  legR.castShadow = true; g.add(legR);

  // Pieds
  const footL = box(0.20, 0.10, 0.30, mL(0x2a1a08));
  footL.position.set(-0.14, 0.10, 0.05); g.add(footL);
  const footR = box(0.20, 0.10, 0.30, mL(0x2a1a08));
  footR.position.set( 0.14, 0.10, 0.05); g.add(footR);

  // Bras
  const armL = box(0.18, 0.46, 0.20, mSkin);
  armL.position.set(-0.36, 0.88, 0);
  armL.castShadow = true; g.add(armL);
  const armR = box(0.18, 0.46, 0.20, mSkin);
  armR.position.set( 0.36, 0.88, 0);
  armR.castShadow = true; g.add(armR);

  // Yeux (petits cubes noirs)
  const eyeL = box(0.07, 0.07, 0.04, mL(0x111111));
  eyeL.position.set(-0.11, 1.54, 0.19); g.add(eyeL);
  const eyeR = box(0.07, 0.07, 0.04, mL(0x111111));
  eyeR.position.set( 0.11, 1.54, 0.19); g.add(eyeR);

  // Ombre sol
  const sh = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 8),
    new THREE.MeshBasicMaterial({color:0, transparent:true, opacity:0.22})
  );
  sh.rotation.x = -Math.PI/2; sh.position.y = 0.01; g.add(sh);

  // Nametag Adam/Ève
  if (['Adam','Ève'].includes(h.name)) {
    const tag = _makeTag(h.name, isMale ? '#88ccff' : '#ffaadd');
    tag.position.y = 2.1;
    tag.name = 'tag';
    g.add(tag);
  }

  // Stocker les refs pour animation
  g.userData = {eid:h.id, type:'human'};
  g.traverse(o=>{ if(o!==g) o.userData.eid=h.id; });
  h.mesh  = g;
  h.bones = {torso, head, armL, armR, legL, legR}; // pseudo-bones pour anim
  g.position.set(h.x, h.y, h.z);
  return g;
}

// ── ANIMAL PIXEL ART ─────────────────────────────────────────────────────────
function buildAnimalMesh(a) {
  const sp=a.sp, sc=sp.sz||1, g=new THREE.Group();
  const mat  = mLs(sp.col||0x808060);
  const dark = mLs(Math.max(0,(sp.col||0x808060)-0x1e1e1e));

  if (sp.aerial) {
    // Oiseau : corps rond + ailes
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3*sc,0.2*sc,0.4*sc), mat);
    b.castShadow=true; g.add(b);
    [-1,1].forEach(s=>{
      const w=box(0.4*sc,0.06*sc,0.22*sc,mat);
      w.position.set(s*0.32*sc,0.02,0); g.add(w);
    });
    const hd=box(0.18*sc,0.18*sc,0.18*sc,mat);
    hd.position.set(0,0.12*sc,0.24*sc); g.add(hd);

  } else if (sp.aquatic) {
    // Poisson : corps allongé
    const b=box(0.36*sc,0.12*sc,0.12*sc,mat);
    g.add(b);
    const t=box(0.12*sc,0.14*sc,0.08*sc,dark);
    t.position.x=-0.24*sc; g.add(t);

  } else {
    // Quadrupède : corps + tête + 4 pattes
    const bw=0.22*sc, bh=0.30*sc, bl=0.50*sc;
    const body=box(bw*1.6, bh, bl, mat);
    body.position.y=bh*0.8; body.castShadow=true; g.add(body);

    const hw=bw*1.1, hh=bh*0.9;
    const hd=box(hw,hh,hw,mat);
    hd.position.set(0,bh*1.35,bl*0.48); hd.castShadow=true; g.add(hd);

    const lH=bh*0.75, lW=bw*0.35;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      const l=box(lW,lH,lW,dark);
      l.position.set(sx*bw*0.56,lH/2,sz*bl*0.36);
      l.castShadow=true; g.add(l);
    });

    // Mammoth : défenses
    if(a.type==='mammoth'){
      [-1,1].forEach(s=>{
        const t=box(bw*0.12,bw*0.12,bw*0.8,mL(0xe8e0c0));
        t.position.set(s*bw*0.35,bh*1.1,bl*0.72);
        t.rotation.x=-0.3; g.add(t);
      });
    }
    // Prédateurs : crocs
    if(sp.apex){
      [-1,1].forEach(s=>{
        const t=box(bw*0.10,bw*0.35,bw*0.10,mL(0xf0ede0));
        t.position.set(s*bw*0.22,bh*1.0,bl*0.62); g.add(t);
      });
    }
  }

  // Ombre sol
  const sh=new THREE.Mesh(
    new THREE.CircleGeometry(0.28*sc,8),
    new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.18})
  );
  sh.rotation.x=-Math.PI/2; sh.position.y=0.01; g.add(sh);

  g.userData={eid:a.id,type:'animal'};
  g.traverse(o=>{ if(o!==g) o.userData.eid=a.id; });
  a.mesh=g;
  g.position.set(a.x,a.y,a.z);
  return g;
}

// ── NAMETAG ──────────────────────────────────────────────────────────────────
function _makeTag(n, col) {
  const cv=document.createElement('canvas');
  cv.width=200; cv.height=48;
  const cx=cv.getContext('2d');
  cx.font='bold 18px monospace';
  cx.fillStyle=col;
  cx.textAlign='center';
  cx.shadowColor='rgba(0,0,0,.9)';
  cx.shadowBlur=6;
  cx.fillText(n,100,32);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.8,0.44),
    new THREE.MeshBasicMaterial({
      map:new THREE.CanvasTexture(cv),
      transparent:true, depthWrite:false, side:THREE.DoubleSide
    })
  );
}

// ── ANIMATION ────────────────────────────────────────────────────────────────
function animMeshes(at) {
  const all=[...W.humans,...W.animals].filter(e=>e.alive&&e.mesh);
  for(const e of all){
    const m=e.mesh; if(!m) continue;
    const tag=m.getObjectByName('tag');
    if(tag) tag.lookAt(SC.camera.position);
    if(e.type_==='human') _animHuman(e,m,at);
    else                   _animAnimal(e,m,at);
  }
}

function _animHuman(h,m,at){
  const b=h.bones; if(!b) return;
  const t=at+(h.id||0)*1.3;
  const mv=!['sleep','idle','eat'].includes(h.state);
  const run=h.state==='flee'||h.state==='hunt';
  const spd=run?3.2:mv?1.9:0;
  const amp=run?0.28:mv?0.18:0;
  const sw=Math.sin(t*spd);

  // Bob vertical
  m.position.y=h.y+(mv?Math.abs(sw)*0.04:0);

  // Balancement jambes
  if(b.legL) b.legL.rotation.x= sw*amp;
  if(b.legR) b.legR.rotation.x=-sw*amp;

  // Balancement bras opposé
  if(b.armL) b.armL.rotation.x=-sw*amp*0.8;
  if(b.armR) b.armR.rotation.x= sw*amp*0.8;

  // Couché si dort
  m.rotation.x=h.state==='sleep'?Math.PI/2:0;

  // Inclinaison tête selon action
  if(b.head){
    if(['forage','drink','eat'].includes(h.state)) b.head.rotation.x=0.3;
    else if(h.state==='sleep') b.head.rotation.x=0;
    else b.head.rotation.x=Math.sin(t*0.3)*0.06;
  }
}

function _animAnimal(a,m,at){
  const t=at+(a.id||0)*0.9;
  const mv=['wander','flee','hunt'].includes(a.state);
  m.position.y=a.y+(mv?Math.abs(Math.sin(t*2.4))*0.04:0);
}