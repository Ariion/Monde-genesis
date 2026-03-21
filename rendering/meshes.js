// GENESIS — rendering/meshes.js
// Personnages avec vrai squelette Three.js (SkinnedMesh + Bones)
// Animation procédurale : marche, course, idle, sommeil, cueillette, chasse

// ── MATÉRIAUX ────────────────────────────────────────────────────────────
function mL(c)  { return new THREE.MeshLambertMaterial({color:c, skinning:true}); }
function mLs(c) { return new THREE.MeshLambertMaterial({color:c}); }

// ── ASSIGNER TOUS LES VERTICES À UN BONE ─────────────────────────────────
function bonify(geo, idx) {
  const n = geo.attributes.position.count;
  const si = new Uint16Array(n*4);
  const sw = new Float32Array(n*4);
  for(let i=0;i<n;i++){
    si[i*4]=idx; sw[i*4]=1.0;
    si[i*4+1]=0; sw[i*4+1]=0;
    si[i*4+2]=0; sw[i*4+2]=0;
    si[i*4+3]=0; sw[i*4+3]=0;
  }
  geo.setAttribute('skinIndex',  new THREE.BufferAttribute(si,4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw,4));
  return geo;
}

// ── SKINNED MESH FACTORIES ────────────────────────────────────────────────
function skM(geo, mat, skel, bIdx, px=0, py=0, pz=0, sx=1, sy=1, sz=1) {
  bonify(geo, bIdx);
  const m = new THREE.SkinnedMesh(geo, mat);
  m.castShadow = true;
  m.position.set(px, py, pz);
  m.scale.set(sx, sy, sz);
  m.bind(skel);
  return m;
}
function skCyl(rt,rb,h,seg,mat,skel,bIdx,px,py,pz){
  return skM(new THREE.CylinderGeometry(rt,rb,h,seg),mat,skel,bIdx,px,py,pz);
}
function skSph(r,ws,hs,mat,skel,bIdx,px,py,pz,sx=1,sy=1,sz=1){
  return skM(new THREE.SphereGeometry(r,ws,hs),mat,skel,bIdx,px,py,pz,sx,sy,sz);
}
function skBox(bx,by,bz,mat,skel,bIdx,px,py,pz){
  return skM(new THREE.BoxGeometry(bx,by,bz),mat,skel,bIdx,px,py,pz);
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTRUCTION DU PERSONNAGE SQUELETTIQUE
// ════════════════════════════════════════════════════════════════════════════
function buildHumanMesh(h) {
  const isMale  = h.sex === 'M';
  const stg     = getSpeciesStage(h.gen||1);
  const evolved = stg >= 2;

  // ── PALETTE ──────────────────────────────────────────────────────────────
  const SKIN  = evolved ? (isMale?0xc49070:0xd4a882) : (isMale?0x8a5a32:0x9a6a42);
  const CLOTH = evolved ? (isMale?0x3a2410:0x6a3820) : 0x261406;
  const HAIR  = isMale  ? 0x180c04 : 0x2e1406;
  const EYE_C = evolved ? 0x2a5028 : 0x1e2e18;
  const LIP_C = evolved ? 0xa05040 : 0x883828;
  const DARK  = Math.max(0, CLOTH - 0x0a0804);
  const SNOSE = Math.max(0, SKIN  - 0x0a0808);

  const mSkin  = mL(SKIN);
  const mCloth = mL(CLOTH);
  const mHair  = mL(HAIR);
  const mEye   = mL(0x0a0808);
  const mWhite = mL(0xddd8cc);
  const mIris  = mL(EYE_C);
  const mLip   = mL(LIP_C);
  const mDark  = mL(DARK);
  const mNose  = mL(SNOSE);

  // ── DIMENSIONS ───────────────────────────────────────────────────────────
  const footH   = 0.08;
  const shinH   = 0.50;
  const thighH  = 0.48;
  const hipH    = 0.18;
  const spineH  = 0.26;
  const chestH  = 0.22;
  const neckH   = 0.13;
  const upArmH  = 0.38;
  const foreArmH= 0.34;
  const hR      = 0.21; // rayon tête

  // Positions Y absolues (au repos, debout)
  const yFoot  = 0;
  const yShins = footH;
  const yThigh = footH + shinH;
  const yHip   = yThigh + thighH;
  const ySpine = yHip + hipH;
  const yChest = ySpine + spineH;
  const yNeck  = yChest + chestH;
  const yHead  = yNeck + neckH + 0.02 + hR * 0.52;
  const armY   = yChest + chestH * 0.80;
  const elbowY = armY - upArmH;
  const handY  = elbowY - foreArmH;

  // ── SQUELETTE (bones) ─────────────────────────────────────────────────────
  // Chaque bone est positionné RELATIVEMENT à son parent
  const bn = {};
  function B(name, x=0, y=0, z=0) {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    return (bn[name] = b);
  }

  // Hiérarchie
  const root   = B('root');
  const hips   = B('hips',    0, yHip,   0);
  const spine  = B('spine',   0, hipH,   0);
  const chest  = B('chest',   0, spineH, 0);
  const neck   = B('neck',    0, chestH, 0);
  const head   = B('head',    0, neckH+0.02, 0);

  // Bras gauche (L = left)
  const armL   = B('armL',  -0.22, 0, 0);
  const foreL  = B('foreL',  0, -upArmH, 0);
  const handL  = B('handL',  0, -foreArmH, 0);

  // Bras droit (R = right)
  const armR   = B('armR',   0.22, 0, 0);
  const foreR  = B('foreR',  0, -upArmH, 0);
  const handR  = B('handR',  0, -foreArmH, 0);

  // Jambe gauche
  const thighL = B('thighL', -0.10, 0, 0);
  const shinL  = B('shinL',   0, -thighH, 0);
  const footL  = B('footL',   0, -shinH, 0);

  // Jambe droite
  const thighR = B('thighR',  0.10, 0, 0);
  const shinR  = B('shinR',   0, -thighH, 0);
  const footR  = B('footR',   0, -shinH, 0);

  // Arbre hiérarchique
  root.add(hips);
  hips.add(spine);
  spine.add(chest);
  chest.add(neck);
  neck.add(head);
  chest.add(armL); armL.add(foreL); foreL.add(handL);
  chest.add(armR); armR.add(foreR); foreR.add(handR);
  hips.add(thighL); thighL.add(shinL); shinL.add(footL);
  hips.add(thighR); thighR.add(shinR); shinR.add(footR);

  // Posture par défaut — primates légèrement courbés
  if (!evolved) {
    spine.rotation.x = 0.14;
    chest.rotation.x = 0.10;
    armL.rotation.z  =  0.22;
    armR.rotation.z  = -0.22;
  }

  const boneList = [
    root, hips, spine, chest, neck, head,
    armL, foreL, handL,
    armR, foreR, handR,
    thighL, shinL, footL,
    thighR, shinR, footR,
  ];
  const BI = {};
  boneList.forEach((b, i) => { BI[b.name] = i; });
  const skel = new THREE.Skeleton(boneList);

  // ── GROUPE PRINCIPAL ──────────────────────────────────────────────────────
  const g = new THREE.Group();
  g.add(root);

  // ── PIEDS ─────────────────────────────────────────────────────────────────
  g.add(skBox(0.17, footH, 0.26, mDark, skel, BI.footL, -0.10, footH/2,  0.04));
  g.add(skBox(0.17, footH, 0.26, mDark, skel, BI.footR,  0.10, footH/2,  0.04));

  // ── TIBIAS ────────────────────────────────────────────────────────────────
  g.add(skCyl(0.068, 0.078, shinH,  8, mCloth, skel, BI.shinL, -0.10, yShins+shinH/2,  0));
  g.add(skCyl(0.068, 0.078, shinH,  8, mCloth, skel, BI.shinR,  0.10, yShins+shinH/2,  0));

  // ── CUISSES ───────────────────────────────────────────────────────────────
  g.add(skCyl(0.088, 0.074, thighH, 8, mCloth, skel, BI.thighL,-0.10, yThigh+thighH/2, 0));
  g.add(skCyl(0.088, 0.074, thighH, 8, mCloth, skel, BI.thighR, 0.10, yThigh+thighH/2, 0));

  // ── BASSIN ────────────────────────────────────────────────────────────────
  g.add(skCyl(0.17, 0.15, hipH,    8, mCloth, skel, BI.hips,    0, yHip+hipH/2,     0));

  // ── ABDOMEN ───────────────────────────────────────────────────────────────
  g.add(skCyl(0.13, 0.16, spineH,  8, mSkin,  skel, BI.spine,   0, ySpine+spineH/2, 0));

  // ── TORSE ─────────────────────────────────────────────────────────────────
  g.add(skCyl(0.16, 0.14, chestH,  8, mCloth, skel, BI.chest,   0, yChest+chestH/2, 0));

  // Sphères épaules
  g.add(skSph(0.095, 8, 6, mCloth, skel, BI.armL, -0.22, armY, 0));
  g.add(skSph(0.095, 8, 6, mCloth, skel, BI.armR,  0.22, armY, 0));

  // ── HAUT DES BRAS ─────────────────────────────────────────────────────────
  g.add(skCyl(0.070, 0.060, upArmH,   7, mSkin, skel, BI.armL, -0.22, armY-upArmH/2,  0));
  g.add(skCyl(0.070, 0.060, upArmH,   7, mSkin, skel, BI.armR,  0.22, armY-upArmH/2,  0));

  // Coudes
  g.add(skSph(0.058, 6, 5, mSkin, skel, BI.foreL, -0.22, elbowY, 0));
  g.add(skSph(0.058, 6, 5, mSkin, skel, BI.foreR,  0.22, elbowY, 0));

  // ── AVANT-BRAS ────────────────────────────────────────────────────────────
  g.add(skCyl(0.055, 0.046, foreArmH, 7, mSkin, skel, BI.foreL, -0.22, elbowY-foreArmH/2, 0));
  g.add(skCyl(0.055, 0.046, foreArmH, 7, mSkin, skel, BI.foreR,  0.22, elbowY-foreArmH/2, 0));

  // ── MAINS ─────────────────────────────────────────────────────────────────
  g.add(skSph(0.064, 7, 6, mSkin, skel, BI.handL, -0.22, handY, 0));
  g.add(skSph(0.064, 7, 6, mSkin, skel, BI.handR,  0.22, handY, 0));
  // 4 doigts par main
  for (let i = 0; i < 4; i++) {
    const ox = (i - 1.5) * 0.026;
    g.add(skCyl(0.014, 0.010, 0.085, 5, mSkin, skel, BI.handL, -0.22+ox, handY-0.072, 0.032));
    g.add(skCyl(0.014, 0.010, 0.085, 5, mSkin, skel, BI.handR,  0.22+ox, handY-0.072, 0.032));
  }

  // ── COU ───────────────────────────────────────────────────────────────────
  g.add(skCyl(0.074, 0.084, neckH, 7, mSkin, skel, BI.neck, 0, yNeck+neckH/2, 0));

  // ── CRÂNE ─────────────────────────────────────────────────────────────────
  g.add(skSph(hR, 14, 12, mSkin, skel, BI.head,
    0, yHead, 0,
    1.0, evolved ? 1.0 : 0.88, evolved ? 1.0 : 0.94
  ));

  // Mâchoire / menton
  g.add(skSph(hR*0.74, 10, 8, mSkin, skel, BI.head,
    0, yHead - hR*0.42, hR*0.08,
    0.92, 0.68, 0.90
  ));

  // Arcade sourcilière (primate primitif uniquement)
  if (!evolved) {
    g.add(skBox(hR*1.65, 0.052, 0.096, mSkin, skel, BI.head,
      0, yHead + hR*0.22, hR*0.84));
  }

  // ── VISAGE ────────────────────────────────────────────────────────────────
  const eZ = hR * 0.83;
  const eY = yHead + hR * 0.12;

  [-1, 1].forEach(s => {
    const ex = s * hR * 0.41;

    // Blanc de l'œil (aplati)
    g.add(skSph(0.048, 8, 6, mWhite, skel, BI.head, ex, eY, eZ, 1.12, 0.84, 0.56));

    // Iris
    g.add(skSph(0.034, 7, 5, mIris, skel, BI.head, ex, eY, eZ + 0.018));

    // Pupille
    g.add(skSph(0.018, 6, 4, mEye,  skel, BI.head, ex, eY, eZ + 0.036));

    // Paupière supérieure
    g.add(skBox(0.092, 0.024, 0.030, mSkin, skel, BI.head, ex, eY + 0.034, eZ + 0.014));

    // Sourcil (plus épais et plus bas pour les primitifs)
    g.add(skBox(0.090, evolved?0.018:0.026, 0.024, mHair, skel, BI.head,
      ex, eY + (evolved ? 0.076 : 0.068), eZ + 0.008));
  });

  // Nez
  g.add(skSph(0.030, 6, 5, mNose, skel, BI.head, 0, eY - hR*0.20, eZ*0.92));
  g.add(skSph(0.020, 5, 4, mNose, skel, BI.head, -0.032, eY - hR*0.30, eZ*0.86));
  g.add(skSph(0.020, 5, 4, mNose, skel, BI.head,  0.032, eY - hR*0.30, eZ*0.86));

  // Bouche
  const mY = eY - hR*0.50;
  g.add(skBox(0.12, 0.032, 0.034, mLip, skel, BI.head, 0, mY + 0.018, eZ*0.79));
  g.add(skBox(0.11, 0.040, 0.042, mLip, skel, BI.head, 0, mY - 0.016, eZ*0.77));

  // Oreilles
  [-1, 1].forEach(s => {
    g.add(skSph(0.056, 6, 5, mSkin, skel, BI.head,
      s * hR * 0.96, yHead + hR * 0.06, 0,
      0.42, 0.96, 0.54
    ));
  });

  // ── CHEVEUX ───────────────────────────────────────────────────────────────
  if (isMale) {
    // Courts — calotte
    g.add(skSph(hR + 0.014, 12, 8, mHair, skel, BI.head,
      0, yHead + 0.014, 0,
      1.0, evolved ? 0.52 : 0.50, evolved ? 0.97 : 0.93
    ));
  } else {
    // Longs — calotte + mèches
    g.add(skSph(hR + 0.016, 12, 8, mHair, skel, BI.head,
      0, yHead + 0.010, 0,
      1.02, evolved ? 0.58 : 0.54, evolved ? 0.99 : 0.96
    ));
    // Mèches latérales et arrière
    g.add(skCyl(0.044, 0.024, 0.38, 6, mHair, skel, BI.head, -hR*0.94, yHead - hR*0.26, 0));
    g.add(skCyl(0.044, 0.024, 0.38, 6, mHair, skel, BI.head,  hR*0.94, yHead - hR*0.26, 0));
    g.add(skCyl(0.050, 0.026, 0.48, 6, mHair, skel, BI.head,  0, yHead - hR*0.32, -hR*0.48));
  }

  // ── OMBRE SOL ─────────────────────────────────────────────────────────────
  const sh = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 10),
    new THREE.MeshBasicMaterial({color:0, transparent:true, opacity:0.18})
  );
  sh.rotation.x = -Math.PI/2;
  sh.position.y = 0.014;
  g.add(sh);

  // ── NAMETAG ───────────────────────────────────────────────────────────────
  if (['Adam','Ève'].includes(h.name)) {
    const tag = makeTag(h.name, isMale ? '#88ccff' : '#ffaadd');
    tag.position.y = yHead + hR + 0.52;
    tag.name = 'tag';
    g.add(tag);
  }

  // ── BINDING FINAL ─────────────────────────────────────────────────────────
  g.userData = { eid: h.id, type: 'human', bones: bn, skeleton: skel };
  g.traverse(o => { if (o !== g) o.userData.eid = h.id; });
  h.mesh  = g;
  h.bones = bn;
  g.position.set(h.x, h.y, h.z);
  return g;
}

// ── NAMETAG ───────────────────────────────────────────────────────────────
function makeTag(n, col) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const cx = cv.getContext('2d');
  cx.font = 'bold 22px Georgia,serif';
  cx.fillStyle = col;
  cx.textAlign = 'center';
  cx.shadowColor = 'rgba(0,0,0,.95)';
  cx.shadowBlur = 8;
  cx.fillText(n, 128, 42);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.55),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(cv),
      transparent: true, depthWrite: false,
      side: THREE.DoubleSide
    })
  );
}

// ── MESH ANIMAL ──────────────────────────────────────────────────────────
function buildAnimalMesh(a) {
  const sp = a.sp, sc = sp.sz||1, g = new THREE.Group();
  const mat  = mLs(sp.col||0x808060);
  const dark = mLs(Math.max(0, (sp.col||0x808060) - 0x1e1e1e));

  if (sp.aerial) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.24*sc, 8, 6), mat);
    b.castShadow = true; g.add(b);
    [-1,1].forEach(s => {
      const w = new THREE.Mesh(new THREE.ConeGeometry(0.22*sc, 0.5*sc, 5), mat);
      w.rotation.z = s * 1.3;
      w.position.set(s * 0.3*sc, 0.05, 0);
      g.add(w);
    });
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.12*sc, 6, 5), mat);
    hd.position.set(0, 0.1*sc, 0.25*sc); g.add(hd);

  } else if (sp.aquatic) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06*sc, 0.04*sc, 0.38*sc, 8), mat);
    b.rotation.z = Math.PI/2; g.add(b);
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.08*sc, 0.14*sc, 6), dark);
    t.rotation.z = -Math.PI/2; t.position.x = -0.22*sc; g.add(t);

  } else {
    const bh = sp.sz>1 ? 0.55*sc : 0.42*sc;
    const bw = sp.sz>1 ? 0.28*sc : 0.18*sc;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bw*1.8, bh*0.7, bw*2.8), mat);
    body.position.y = bh*0.5; body.castShadow = true; g.add(body);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(bw*1.2, bh*0.65, bw*1.2), mat);
    hd.position.set(0, bh*0.82, bw*1.3); hd.castShadow = true; g.add(hd);
    const lH = bh*0.6, lR = bw*0.22;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(lR, lR*0.8, lH, 6), dark);
      l.position.set(sx*bw*0.55, lH/2, sz*bw*0.85);
      l.castShadow = true; g.add(l);
    });
    // Cornes herbivores
    if (sp.food > 15 && !sp.apex) {
      [-1,1].forEach(s => {
        const e = new THREE.Mesh(new THREE.ConeGeometry(bw*0.2, bw*0.5, 5), mat);
        e.position.set(s*bw*0.4, bh, bw*0.8);
        e.rotation.z = s*0.2; g.add(e);
      });
    }
    // Crâne gros prédateurs
    if (sp.apex && sc > 1) {
      const mn = new THREE.Mesh(new THREE.SphereGeometry(bw*0.7, 8, 6), dark);
      mn.position.set(0, bh*0.85, bw*1.1);
      mn.scale.set(1, 0.8, 0.7); g.add(mn);
    }
  }

  // Ombre sol
  const sh = new THREE.Mesh(
    new THREE.CircleGeometry(0.3*sc, 8),
    new THREE.MeshBasicMaterial({color:0, transparent:true, opacity:0.18})
  );
  sh.rotation.x = -Math.PI/2; sh.position.y = 0.01; g.add(sh);

  g.userData = {eid: a.id, type:'animal'};
  g.traverse(o => { if(o !== g) o.userData.eid = a.id; });
  a.mesh = g;
  g.position.set(a.x, a.y, a.z);
  return g;
}

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION PROCÉDURALE
// Pilotée par l'état IA de chaque entité — pas de clips pré-baked
// ════════════════════════════════════════════════════════════════════════════
function animMeshes(at) {
  const all = [...W.humans, ...W.animals].filter(e => e.alive && e.mesh);
  for (const e of all) {
    const m = e.mesh; if (!m) continue;
    const tag = m.getObjectByName('tag');
    if (tag) tag.lookAt(SC.camera.position);
    if (e.type_ === 'human') _animHuman(e, m, at);
    else                      _animAnimal(e, m, at);
  }
}

function _animHuman(h, m, at) {
  const b = h.bones; if (!b) return;

  // Paramètres d'animation selon l'état
  const t   = at + (h.id||0) * 1.37;
  const stg = getSpeciesStage(h.gen||1);
  const mv  = !['sleep','idle','eat','in_shelter'].includes(h.state);
  const run = h.state === 'flee' || h.state === 'hunt';
  const spd = run ? 3.2 : mv ? 1.9 : 0;
  const amp = run ? 0.80 : mv ? 0.52 : 0;
  const sw  = Math.sin(t * spd); // onde principale du cycle de marche

  // Bob vertical au rythme des pas
  m.position.y = h.y + (mv ? Math.abs(sw) * 0.055 : 0);

  // ── BASSIN ────────────────────────────────────────────────────────────
  if (b.hips) {
    b.hips.rotation.z = mv ? sw * 0.07 : 0;
    b.hips.rotation.y = mv ? sw * 0.05 : 0;
  }

  // ── COLONNE / TORSE ───────────────────────────────────────────────────
  const baseSpine = stg < 2 ? 0.14 : 0;
  if (b.spine) { b.spine.rotation.x = baseSpine; b.spine.rotation.y = mv ? -sw * 0.09 : 0; }
  if (b.chest) { b.chest.rotation.x = stg<2?0.10:0; b.chest.rotation.y = mv ? -sw*0.07:0; }

  // ── JAMBES ────────────────────────────────────────────────────────────
  // Phase : jambe gauche en avant quand jambe droite en arrière
  if (b.thighL && b.thighR) {
    b.thighL.rotation.x =  sw * amp;
    b.thighR.rotation.x = -sw * amp;

    // Flexion genou : seulement sur la jambe qui revient en arrière
    if (b.shinL) b.shinL.rotation.x = mv ? Math.max(0,  sw) * amp * 0.62 : 0;
    if (b.shinR) b.shinR.rotation.x = mv ? Math.max(0, -sw) * amp * 0.62 : 0;

    // Angle du pied (pointer les orteils vers l'avant au départ du pas)
    if (b.footL) b.footL.rotation.x = mv ? -sw * 0.22 : 0;
    if (b.footR) b.footR.rotation.x = mv ?  sw * 0.22 : 0;
  }

  // ── BRAS ──────────────────────────────────────────────────────────────
  // Balancent en OPPOSITION aux jambes (naturel pour un bipède)
  const baseZL = stg < 2 ?  0.24 :  0.12;
  const baseZR = stg < 2 ? -0.24 : -0.12;

  if (b.armL && b.armR) {
    b.armL.rotation.x = -sw * amp * 0.72;
    b.armR.rotation.x =  sw * amp * 0.72;
    b.armL.rotation.z = baseZL;
    b.armR.rotation.z = baseZR;

    // Flexion coude naturelle pendant la marche
    if (b.foreL) b.foreL.rotation.x = mv ? 0.16 + Math.abs(sw) * 0.20 : 0.04;
    if (b.foreR) b.foreR.rotation.x = mv ? 0.16 + Math.abs(sw) * 0.20 : 0.04;

    // ── POSES SPÉCIALES PAR ÉTAT ──────────────────────────────────────
    if (h.state === 'forage') {
      // Penché, bras en bas qui cherchent
      b.armL.rotation.x = -0.85 + Math.sin(t * 1.4) * 0.28;
      b.armR.rotation.x = -0.65 + Math.sin(t * 1.4 + 1.0) * 0.28;
      if (b.foreL) b.foreL.rotation.x = 0.80 + Math.sin(t * 1.4) * 0.18;
      if (b.foreR) b.foreR.rotation.x = 0.60 + Math.sin(t * 1.4 + 1.0) * 0.18;
    }
    if (h.state === 'hunt') {
      // Bras droit levé avec lance imaginaire
      b.armR.rotation.x = -0.75;
      b.armR.rotation.z = -0.15;
      if (b.foreR) b.foreR.rotation.x = 0.38;
    }
    if (h.state === 'drink') {
      // Les deux bras vers la bouche
      b.armL.rotation.x = b.armR.rotation.x = -0.55;
      b.armL.rotation.z = -0.18;
      b.armR.rotation.z =  0.18;
      if (b.foreL) b.foreL.rotation.x = 1.15;
      if (b.foreR) b.foreR.rotation.x = 1.15;
    }
    if (h.state === 'sleep') {
      // Bras relâchés le long du corps
      b.armL.rotation.x = 0; b.armL.rotation.z =  0.30;
      b.armR.rotation.x = 0; b.armR.rotation.z = -0.30;
      if (b.foreL) b.foreL.rotation.x = 0;
      if (b.foreR) b.foreR.rotation.x = 0;
    }
  }

  // ── TÊTE ──────────────────────────────────────────────────────────────
  if (b.head) {
    if (h.state === 'sleep') {
      b.head.rotation.x =  0.85;
      b.head.rotation.z =  0.28;
    } else if (['eat','drink','forage'].includes(h.state)) {
      b.head.rotation.x =  0.42;
      b.head.rotation.y =  0;
    } else if (mv) {
      b.head.rotation.x = Math.sin(t * spd * 0.5) * 0.05;
      b.head.rotation.y = 0;
    } else {
      // Au repos : tête qui regarde autour lentement
      b.head.rotation.x = 0;
      b.head.rotation.y = Math.sin(t * 0.26) * 0.20;
    }
  }

  // Cou suit partiellement la tête
  if (b.neck && b.head) {
    b.neck.rotation.x = b.head.rotation.x * 0.32;
    b.neck.rotation.y = b.head.rotation.y * 0.32;
  }

  // ── POSTURE GLOBALE ───────────────────────────────────────────────────
  // Couché si dort, debout sinon
  m.rotation.x = h.state === 'sleep' ? Math.PI / 2 : 0;
}

function _animAnimal(a, m, at) {
  const t  = at + (a.id||0) * 0.9;
  const mv = ['wander','flee','hunt','chase'].includes(a.state);
  m.position.y = a.y + (mv ? Math.abs(Math.sin(t * 2.4)) * 0.04 : 0);
}
