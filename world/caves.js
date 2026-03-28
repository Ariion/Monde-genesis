// GENESIS — world/caves.js — Grottes du Paléolithique

function _placeCaves() {
  TR.caves = [];
  const target = 8, maxTries = 500;
  let tries = 0;
  while(TR.caves.length < target && tries < maxTries) {
    tries++;
    const x = (Math.random()-.5)*CFG.W*.80;
    const z = (Math.random()-.5)*CFG.W*.80;
    const h = getH(x,z), bio = getBio(x,z);
    if(h < 12 || h > 72) continue;
    // grottes dans toute zone avec un peu de relief
    if(bio === 'lake' || bio === 'shore' || bio === 'peak') continue;
    if(TR.caves.some(cv=>Math.hypot(cv.x-x,cv.z-z)<40)) continue;
    TR.caves.push({
      x, y:h, z,
      capacity: 8 + Math.floor(Math.random()*8),  // 8-16 personnes
      quality: Math.random(),                        // 0-1, confort/sécurité
      discovered: false,
      occupants: [],
      hasWater: Math.random()<0.3,                  // source d'eau dans la grotte
      facing: Math.random()*Math.PI*2,              // orientation de l'entrée
    });
  }
  console.log('[Caves]', TR.caves.length, 'grottes placées');
}

function buildCaves(sc) {
  _placeCaves();
  if(!TR.caves.length) return;

  TR.caves.forEach(cave => {
    const g = new THREE.Group();
    const rockMat = new THREE.MeshLambertMaterial({color:0x5a5048});
    const darkMat = new THREE.MeshLambertMaterial({color:0x1a1410});
    const shadowMat = new THREE.MeshLambertMaterial({color:0x0a0808});

    // ── MASSIF ROCHEUX ───────────────────────────────────────────────────
    // Rocher de base large
    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(5.5,1), rockMat);
    base.scale.set(1.4,0.9,1.2);
    base.position.y = 1.5;
    base.castShadow = true; base.receiveShadow = true;
    g.add(base);

    // Rochers superposés pour donner de la hauteur
    const mid = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2,1), rockMat);
    mid.scale.set(1.1,1.0,0.95);
    mid.position.set(0.8,4.5,-0.5);
    mid.castShadow = true;
    g.add(mid);

    const top = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8,1),
      new THREE.MeshLambertMaterial({color:0x4a4038}));
    top.position.set(-0.3,7.5,0.4);
    top.castShadow = true;
    g.add(top);

    // Rochers latéraux
    [[-4,1.5,1,3.2,1],[ 4.5,1.2,-0.5,2.8,0.9],[-2.5,3.5,2,2.2,1.1]].forEach(([rx,ry,rz,rr,rs])=>{
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rr,1), rockMat);
      r.position.set(rx,ry,rz); r.scale.setScalar(rs);
      r.rotation.set(Math.random()*.5,Math.random()*Math.PI,Math.random()*.3);
      r.castShadow=true; g.add(r);
    });

    // ── ENTRÉE DE LA GROTTE ──────────────────────────────────────────────
    // Arche sombre représentant l'ouverture
    const archGeo = new THREE.TorusGeometry(2.0, 0.7, 6, 12, Math.PI);
    const arch = new THREE.Mesh(archGeo, darkMat);
    arch.rotation.x = -Math.PI/2;
    arch.position.set(0, 2.2, 3.8);
    g.add(arch);

    // Fond noir de la caverne
    const hole = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 10),
      new THREE.MeshBasicMaterial({color:0x000000, side:THREE.DoubleSide})
    );
    hole.rotation.y = Math.PI;
    hole.position.set(0, 2.0, 3.6);
    g.add(hole);

    // Sol devant (terre battue)
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 10),
      new THREE.MeshLambertMaterial({color:0x6a5840})
    );
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0.05;
    floor.receiveShadow = true;
    g.add(floor);

    // Stalactites symboliques au-dessus de l'entrée
    [[-0.8,3.5,3.2],[ 0.2,3.8,3.5],[ 0.9,3.2,3.1]].forEach(([sx,sy,sz])=>{
      const st = new THREE.Mesh(new THREE.ConeGeometry(0.15,0.7,5), darkMat);
      st.position.set(sx,sy,sz); st.rotation.x=Math.PI; g.add(st);
    });

    // ── MARQUES DE QUALITÉ ───────────────────────────────────────────────
    // Grotte avec eau : petit filet représentatif
    if(cave.hasWater) {
      const waterMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.6,8),
        new THREE.MeshBasicMaterial({color:0x3060a0,transparent:true,opacity:0.8})
      );
      waterMesh.rotation.x=-Math.PI/2;
      waterMesh.position.set(-2.5,0.08,1.5);
      g.add(waterMesh);
    }

    // ── PLACEMENT ────────────────────────────────────────────────────────
    g.position.set(cave.x, cave.y, cave.z);
    g.rotation.y = cave.facing;

    // Ombre au sol
    const sh = new THREE.Mesh(
      new THREE.CircleGeometry(5.5,10),
      new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:0.25})
    );
    sh.rotation.x=-Math.PI/2; sh.position.y=0.02; g.add(sh);

    g.userData = {isCave:true, caveId:TR.caves.indexOf(cave)};
    cave.mesh = g;
    sc.add(g);
  });
  console.log('[Genesis]', TR.caves.length, 'grottes construites');
}