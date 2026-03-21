// GENESIS — world/terrain.js

const TR = {mesh:null, heights:null, biomes:null, caves:[]};
const BCOL = {
  lake:    0x2a6aaa,
  shore:   0xd4c896,
  lowland: 0x6a9a4a,
  prairie: 0x4a7a2a,
  steppe:  0x9a8a3a,
  forest:  0x1e4a10,
  hills:   0x5a6a3a,
  mountain:0x7a6a55,
  peak:    0xe8e8f0,
};

function buildTerrain(sc) {
  const {W:WW, S, H} = CFG;
  const N = S + 1;
  const geo = new THREE.PlaneGeometry(WW, WW, S, S);
  geo.rotateX(-Math.PI/2);
  const pos  = geo.attributes.position;
  TR.heights = new Float32Array(N*N);
  TR.biomes  = new Array(N*N);
  const cols = new Float32Array(N*N*3);
  const tmp  = new THREE.Color();

  for (let i = 0; i < N*N; i++) {
    const wx = pos.getX(i), wz = pos.getZ(i);
    const nx = wx/WW*3.5,   nz = wz/WW*3.5;

    // Terrain de base : bruit + légère bosse au centre
    let h = (wfbm(nx, nz)*.65 + fbm(nx*2, nz*2, 4)*.35) * H;

    // Garantir h >= 2 partout (continent plein, pas d'océan)
    h = Math.max(2, h);

    // ── LAC CENTRAL ───────────────────────────────────────────────
    // Un lac ovale légèrement décalé du centre (pour que le spawn
    // soit toujours sur terre)
    const lx = wx - WW*0.08,  lz = wz + WW*0.06;  // centre lac décalé
    const lakeR = WW * 0.12;                        // rayon ~42 unités
    const lakeDist = Math.sqrt(lx*lx/(lakeR*lakeR*1.4) + lz*lz/(lakeR*lakeR));
    if (lakeDist < 1.0) {
      // Dans le lac : aplatir à h=0.5 (zone d'eau)
      const blend = Math.max(0, 1 - lakeDist);
      h = lr(h, 0.5, Math.pow(blend, 0.6));
    }

    TR.heights[i] = h;
    pos.setY(i, h);

    // ── BIOME ────────────────────────────────────────────────────
    let bio;
    if (lakeDist < 0.88)       bio = 'lake';
    else if (lakeDist < 1.05)  bio = 'shore';
    else if (h < 6)            bio = 'lowland';
    else if (h < 20)           bio = (fbm(nx+8,nz+8,3) > 0) ? 'forest' : 'prairie';
    else if (h < 38)           bio = 'steppe';
    else if (h < 62)           bio = 'hills';
    else if (h < 85)           bio = 'mountain';
    else                       bio = 'peak';
    TR.biomes[i] = bio;

    tmp.setHex(BCOL[bio] || 0x4a7a2a);
    const j = (Math.random()-.5) * .05;
    cols[i*3]   = Math.max(0, tmp.r+j);
    cols[i*3+1] = Math.max(0, tmp.g+j);
    cols[i*3+2] = Math.max(0, tmp.b+j);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  TR.mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({vertexColors:true}));
  TR.mesh.receiveShadow = true;
  TR.mesh.name = 'terrain';
  sc.add(TR.mesh);
}

// ── HELPERS TERRAIN ──────────────────────────────────────────────────────
function getH(wx, wz) {
  if (!TR.heights) return 0;
  const {W:WW, S} = CFG, N = S+1;
  const u = (wx/WW+.5)*S, v = (wz/WW+.5)*S;
  const ix = Math.floor(u), iz = Math.floor(v);
  const fx = u-ix, fz = v-iz;
  const cx  = Math.max(0, Math.min(S-1, ix));
  const cz  = Math.max(0, Math.min(S-1, iz));
  const cx1 = Math.min(cx+1, S);
  const cz1 = Math.min(cz+1, S);
  const h00 = TR.heights[cz*N+cx]   || 0;
  const h10 = TR.heights[cz*N+cx1]  || 0;
  const h01 = TR.heights[cz1*N+cx]  || 0;
  const h11 = TR.heights[cz1*N+cx1] || 0;
  return lr(lr(h00,h10,fx), lr(h01,h11,fx), fz);
}

function getBio(wx, wz) {
  if (!TR.biomes) return 'prairie';
  const {W:WW, S} = CFG, N = S+1;
  const ix = Math.floor((wx/WW+.5)*S);
  const iz = Math.floor((wz/WW+.5)*S);
  return TR.biomes[Math.max(0, Math.min(N*N-1, iz*N+ix))] || 'prairie';
}

// Trouver un point sur terre (pas dans le lac, pas sur pic)
function randLand(minH=4, maxH=75) {
  for (let i=0; i<400; i++) {
    const x = (Math.random()-.5)*CFG.W*.85;
    const z = (Math.random()-.5)*CFG.W*.85;
    const h = getH(x, z);
    const bio = getBio(x, z);
    if (h>=minH && h<=maxH && bio!=='lake' && bio!=='shore')
      return {x, y:h, z};
  }
  return {x:0, y:Math.max(4,getH(0,0)), z:0};
  }