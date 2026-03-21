// GENESIS — world/vegetation.js — Forêts & arbres

// ── VÉGÉTATION ────────────────────────────────────────────────────────
function buildVeg(sc) {
  const d=new THREE.Object3D();
  // Arbres instanciés
  const tGeo=new THREE.CylinderGeometry(.18,.3,2.2,7);
  const tMat=new THREE.MeshLambertMaterial({color:0x5a3010});
  const lGeo=new THREE.SphereGeometry(1.25,7,6);
  const lMat=new THREE.MeshLambertMaterial({color:0x1e4a10});
  const l2Mat=new THREE.MeshLambertMaterial({color:0x2d5e1e});
  const N=800;
  const tIM=new THREE.InstancedMesh(tGeo,tMat,N);
  const lIM=new THREE.InstancedMesh(lGeo,lMat,N);
  const l2IM=new THREE.InstancedMesh(lGeo,l2Mat,N);
  tIM.castShadow=lIM.castShadow=l2IM.castShadow=true;
  let p=0;
  for(let i=0;i<N*6&&p<N;i++){
    const wx=(Math.random()-.5)*CFG.W*.92,wz=(Math.random()-.5)*CFG.W*.92;
    const h=getH(wx,wz),bio=getBio(wx,wz);
    if(h<2||bio==='ocean'||bio==='beach'||bio==='peak')continue;
    const dn=bio==='forest'?1:bio==='hills'?.28:bio==='prairie'?.12:.04;
    if(Math.random()>dn)continue;
    const sc2=.65+Math.random()*1.3+(bio==='forest'?.45:0);
    d.position.set(wx,h+1.1*sc2,wz);d.scale.set(sc2,sc2,sc2);d.rotation.y=Math.random()*Math.PI*2;d.updateMatrix();
    tIM.setMatrixAt(p,d.matrix);
    d.position.set(wx,h+2.5*sc2,wz);d.scale.set(sc2*1.05,sc2*.92,sc2*1.05);d.updateMatrix();
    lIM.setMatrixAt(p,d.matrix);
    d.position.set(wx,h+4.0*sc2,wz);d.scale.set(sc2*.68,sc2*.72,sc2*.68);d.updateMatrix();
    l2IM.setMatrixAt(p++,d.matrix);
  }
  tIM.instanceMatrix.needsUpdate=lIM.instanceMatrix.needsUpdate=l2IM.instanceMatrix.needsUpdate=true;
  sc.add(tIM,lIM,l2IM);

  // Buissons
  const bG=new THREE.SphereGeometry(.52,6,4);
  const bM=new THREE.MeshLambertMaterial({color:0x2a5218});
  const bIM=new THREE.InstancedMesh(bG,bM,1000);bIM.castShadow=true;
  let bp=0;
  for(let i=0;i<1000*4&&bp<1000;i++){
    const wx=(Math.random()-.5)*CFG.W*.9,wz=(Math.random()-.5)*CFG.W*.9;
    const h=getH(wx,wz);
    if(h<2||getBio(wx,wz)==='ocean')continue;
    if(Math.random()>.35)continue;
    const s=.45+Math.random()*.9;
    d.position.set(wx,h+.3*s,wz);d.scale.setScalar(s);d.rotation.y=Math.random()*Math.PI*2;d.updateMatrix();
    bIM.setMatrixAt(bp++,d.matrix);
  }
  bIM.instanceMatrix.needsUpdate=true;sc.add(bIM);

  // Rochers
  const rG=new THREE.DodecahedronGeometry(1,0);
  const rM=new THREE.MeshLambertMaterial({color:0x7a7060});
  const rIM=new THREE.InstancedMesh(rG,rM,400);rIM.castShadow=true;
  let rp=0;
  for(let i=0;i<400*5&&rp<400;i++){
    const wx=(Math.random()-.5)*CFG.W*.9,wz=(Math.random()-.5)*CFG.W*.9;
    const h=getH(wx,wz),bio=getBio(wx,wz);
    if(h<3||bio==='ocean')continue;
    const dn=bio==='mountain'?.45:bio==='hills'?.1:.03;
    if(Math.random()>dn)continue;
    const s=.28+Math.random()*(bio==='mountain'?2:.6);
    d.position.set(wx,h+s*.25,wz);d.scale.set(s,s*.62,s*.88);
    d.rotation.set(Math.random()*.4,Math.random()*Math.PI*2,Math.random()*.3);d.updateMatrix();
    rIM.setMatrixAt(rp++,d.matrix);
  }
  rIM.instanceMatrix.needsUpdate=true;sc.add(rIM);
}

// ── GROTTES ──────────────────────────────────────────────────────────
