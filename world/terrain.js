// GENESIS — world/terrain.js — Carte & biomes

// ── TERRAIN ───────────────────────────────────────────────────────────
const TR = {mesh:null, water:null, heights:null, biomes:null, caves:[]};
const BCOL = {
  lowland:0x6a9a4a,
  ocean:0x1a4a8a, beach:0xd4b896,
  prairie:0x4a7a2a, steppe:0x9a8a3a,
  forest:0x1e4a10, hills:0x5a6a3a,
  mountain:0x7a6a55, peak:0xe8e8f0
};

function buildTerrain(sc) {
  const {W:WW,S,H} = CFG, N=S+1;
  const geo = new THREE.PlaneGeometry(WW,WW,S,S);
  geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  TR.heights = new Float32Array(N*N);
  TR.biomes  = new Array(N*N);
  const cols = new Float32Array(N*N*3);
  const tmp  = new THREE.Color();

  for (let i=0;i<N*N;i++) {
    const wx=pos.getX(i), wz=pos.getZ(i);
    const nx=wx/WW*3.2, nz=wz/WW*3.2;
    const dist=Math.sqrt(wx*wx+wz*wz)/(WW*.42);
    const mask=Math.max(0,1-Math.pow(dist,2.2));
    let h=(wfbm(nx,nz)*.6+fbm(nx*2,nz*2,4)*.4)*H*mask;
    h=Math.max(1,h);  // continent plein — pas d'eau
    TR.heights[i]=h; pos.setY(i,h);
    const bio=h<6?'lowland':h<20?((fbm(nx+8,nz+8,3)>.0)?'forest':'prairie'):h<38?'steppe':h<62?'hills':h<90?'mountain':'peak';
    TR.biomes[i]=bio;
    tmp.setHex(BCOL[bio]);
    const j=(Math.random()-.5)*.05;
    cols[i*3]=Math.max(0,tmp.r+j); cols[i*3+1]=Math.max(0,tmp.g+j); cols[i*3+2]=Math.max(0,tmp.b+j);
  }
  geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
  geo.computeVertexNormals();
  TR.mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}));
  TR.mesh.receiveShadow=true; TR.mesh.name='terrain'; sc.add(TR.mesh);

  // Pas d'eau — continent plein
}

function getH(wx,wz){
  if(!TR.heights)return 0;
  const {W:WW,S}=CFG, N=S+1;
  const u=(wx/WW+.5)*S, v=(wz/WW+.5)*S;
  const ix=Math.floor(u), iz=Math.floor(v), fx=u-ix, fz=v-iz;
  const cx=Math.max(0,Math.min(S-1,ix)), cz=Math.max(0,Math.min(S-1,iz));
  const cx1=Math.min(cx+1,S), cz1=Math.min(cz+1,S);
  const h00=TR.heights[cz*N+cx]||0, h10=TR.heights[cz*N+cx1]||0;
  const h01=TR.heights[cz1*N+cx]||0, h11=TR.heights[cz1*N+cx1]||0;
  return lr(lr(h00,h10,fx),lr(h01,h11,fx),fz);
}
function getBio(wx,wz){
  if(!TR.biomes)return'prairie';
  const {W:WW,S}=CFG, N=S+1;
  const ix=Math.floor((wx/WW+.5)*S), iz=Math.floor((wz/WW+.5)*S);
  return TR.biomes[Math.max(0,Math.min(N*N-1,iz*N+ix))]||'prairie';
}
function randLand(minH=2,maxH=80){
  for(let i=0;i<300;i++){
    const x=(Math.random()-.5)*CFG.W*.85,z=(Math.random()-.5)*CFG.W*.85;
    const h=getH(x,z);if(h>=minH&&h<=maxH)return{x,y:h,z};
  }
  return{x:0,y:Math.max(2,getH(0,0)),z:0};
}

// ── BROUILLARD DE GUERRE (Canvas 2D → Texture sur plan 3D) ───────────
