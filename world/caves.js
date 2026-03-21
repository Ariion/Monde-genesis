// GENESIS — world/caves.js — Grottes & abris

// ── GROTTES ──────────────────────────────────────────────────────────
function buildCaves(sc) {
  if(!TR.caves?.length){TR.caves=[];_placeCaves(CFG.S+1,CFG.W);}
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
const SC={scene:null,camera:null,renderer:null,sun:null,ambient:null,sky:null};
