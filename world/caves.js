// GENESIS — world/caves.js — Grottes & abris

// ── PLACEMENT DES GROTTES ─────────────────────────────────────────────
function _placeCaves(){
  TR.caves=[];
  const maxTries=300, target=12;
  let tries=0;
  while(TR.caves.length<target && tries<maxTries){
    tries++;
    const x=(Math.random()-.5)*CFG.W*.82;
    const z=(Math.random()-.5)*CFG.W*.82;
    const h=getH(x,z), bio=getBio(x,z);
    // Grottes dans les collines et montagnes
    if(h<25||h>85) continue;
    if(bio!=='hills'&&bio!=='mountain'&&bio!=='steppe') continue;
    // Pas trop proches entre elles
    if(TR.caves.some(cv=>Math.hypot(cv.x-x,cv.z-z)<50)) continue;
    TR.caves.push({x,y:h,z,occupants:[],mesh:null});
  }
  console.log('[Caves]',TR.caves.length,'grottes placées');
}

// ── MESHES GROTTES ────────────────────────────────────────────────────
function buildCaves(sc) {
  _placeCaves();
  if(!TR.caves.length) return;
  if(!TR.caves.length)return;
  TR.caves.forEach(cave=>{
    const g=new THREE.Group();
    const aM=new THREE.MeshLambertMaterial({color:0x4a4035});
    const dM=new THREE.MeshLambertMaterial({color:0x1a1510});
    [[-3.5,1.5,0,5],[3.5,1.2,0,4.5],[0,5,0.5,3.8]].forEach(([x,y,z,r])=>{
      const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),aM);
      rk.position.set(x,y,z);rk.castShadow=true;g.add(rk);
    });
    const hole=new THREE.Mesh(new THREE.CircleGeometry(2.5,8),dM);
    hole.rotation.y=Math.PI;hole.position.set(0,1.8,-.1);g.add(hole);
    g.position.set(cave.x,cave.y,cave.z);
    g.rotation.y=Math.random()*Math.PI*2;
    g.userData={isCave:true,caveId:TR.caves.indexOf(cave)};
    cave.mesh=g;sc.add(g);
  });
  console.log('[Genesis]',TR.caves.length,'grottes');
}

// ── SCÈNE THREE.JS ────────────────────────────────────────────────────