// GENESIS — world/terrain.js
// CONTINENT PUR — aucun masque île, aucune eau, minimum garanti

const TR = {mesh:null, heights:null, biomes:null, caves:[]};
const BCOL = {
  lowland:  0x6a9a4a,
  prairie:  0x4a7a2a,
  steppe:   0x9a8a3a,
  forest:   0x1e4a10,
  hills:    0x5a6a3a,
  mountain: 0x7a6a55,
  peak:     0xe8e8f0,
  lake:     0x2a6aaa,
  shore:    0xc8b87a,
};

function buildTerrain(sc) {
  const WW=CFG.W, S=CFG.S, H=CFG.H, N=S+1;
  const geo=new THREE.PlaneGeometry(WW,WW,S,S);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  TR.heights=new Float32Array(N*N);
  TR.biomes =new Array(N*N);
  const cols=new Float32Array(N*N*3);
  const tmp=new THREE.Color();

  for(let i=0;i<N*N;i++){
    const wx=pos.getX(i), wz=pos.getZ(i);
    const nx=wx/WW*3.5,   nz=wz/WW*3.5;

    // ── HAUTEUR DE BASE : bruit pur, pas de masque île ────────────
    let h=(wfbm(nx,nz)*.65+fbm(nx*2,nz*2,4)*.35)*H;

    // MINIMUM ABSOLU : jamais en dessous de 3 — continent garanti
    h=Math.max(3,h);

    // ── LAC CENTRAL VOLONTAIRE (pas d'eau = aplatir à 0.8) ────────
    // Décalé de 8% en x et 6% en z pour ne pas gêner le spawn
    const lx=wx-WW*0.08, lz=wz+WW*0.06;
    const lR=WW*0.12;
    const ld=Math.sqrt(lx*lx/(lR*lR*1.4)+lz*lz/(lR*lR));
    if(ld<1.0){
      h=lr(h, 1.5, Math.pow(Math.max(0,1-ld), 0.5));
    }

    TR.heights[i]=h;
    pos.setY(i,h);

    // ── BIOME ──────────────────────────────────────────────────────
    let bio;
    if     (ld<0.85)  bio='lake';
    else if(ld<1.05)  bio='shore';
    else if(h<7)      bio='lowland';
    else if(h<22)     bio=(fbm(nx+8,nz+8,3)>0)?'forest':'prairie';
    else if(h<30)     bio='steppe';
    else if(h<50)     bio='hills';
    else if(h<68)     bio='mountain';
    else              bio='peak';
    TR.biomes[i]=bio;

    tmp.setHex(BCOL[bio]||0x4a7a2a);
    const j=(Math.random()-.5)*.06;
    cols[i*3  ]=Math.max(0,tmp.r+j);
    cols[i*3+1]=Math.max(0,tmp.g+j);
    cols[i*3+2]=Math.max(0,tmp.b+j);
  }

  geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
  geo.computeVertexNormals();
  TR.mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}));
  TR.mesh.receiveShadow=true;
  TR.mesh.name='terrain';
  sc.add(TR.mesh);

  // Vérification debug : compter les cellules à h<2
  let waterCount=0;
  for(let i=0;i<TR.heights.length;i++) if(TR.heights[i]<1) waterCount++;
  console.log(`[Terrain] ${TR.heights.length} cellules, ${waterCount} sous h=2`);
}

function getH(wx,wz){
  if(!TR.heights)return 3;
  const {W:WW,S}=CFG, N=S+1;
  const u=(wx/WW+.5)*S, v=(wz/WW+.5)*S;
  const ix=Math.floor(u), iz=Math.floor(v);
  const fx=u-ix, fz=v-iz;
  const cx=Math.max(0,Math.min(S-1,ix)),   cz=Math.max(0,Math.min(S-1,iz));
  const cx1=Math.min(cx+1,S),              cz1=Math.min(cz+1,S);
  const h00=TR.heights[cz *N+cx ]||3;
  const h10=TR.heights[cz *N+cx1]||3;
  const h01=TR.heights[cz1*N+cx ]||3;
  const h11=TR.heights[cz1*N+cx1]||3;
  return lr(lr(h00,h10,fx),lr(h01,h11,fx),fz);
}

function getBio(wx,wz){
  if(!TR.biomes)return'prairie';
  const {W:WW,S}=CFG, N=S+1;
  const ix=Math.floor((wx/WW+.5)*S);
  const iz=Math.floor((wz/WW+.5)*S);
  return TR.biomes[Math.max(0,Math.min(N*N-1,iz*N+ix))]||'prairie';
}

function randLand(minH=4,maxH=75){
  for(let i=0;i<500;i++){
    const x=(Math.random()-.5)*CFG.W*.85;
    const z=(Math.random()-.5)*CFG.W*.85;
    const h=getH(x,z), bio=getBio(x,z);
    if(h>=minH&&h<=maxH&&bio!=='lake'&&bio!=='shore')
      return{x,y:h,z};
  }
  // Fallback garanti : cherche n'importe quelle terre
  for(let i=0;i<1000;i++){
    const x=(Math.random()-.5)*CFG.W*.85;
    const z=(Math.random()-.5)*CFG.W*.85;
    const h=getH(x,z);
    if(h>=3) return{x,y:h,z};
  }
  return{x:0,y:8,z:0};
}