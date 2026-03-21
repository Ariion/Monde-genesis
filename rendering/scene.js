// GENESIS — rendering/scene.js — Scène Three.js

// ── SCÈNE THREE.JS ────────────────────────────────────────────────────
const SC={scene:null,camera:null,renderer:null,sun:null,ambient:null,sky:null};

function initScene(){
  const cv=document.getElementById('c');
  SC.renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
  SC.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  SC.renderer.setSize(innerWidth,innerHeight,false);
  SC.renderer.shadowMap.enabled=true;
  SC.renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  SC.scene=new THREE.Scene();
  SC.scene.fog=new THREE.FogExp2(0x8cb4d0,.0015);

  SC.camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.5,4500);
  SC.camera.position.set(0,40,60);
  SC.camera.lookAt(0,5,0);

  SC.ambient=new THREE.AmbientLight(0x404060,.5);SC.scene.add(SC.ambient);
  SC.sun=new THREE.DirectionalLight(0xfff5d0,1.4);
  SC.sun.position.set(180,380,180);SC.sun.castShadow=true;
  SC.sun.shadow.mapSize.set(1024,1024);
  SC.sun.shadow.camera.near=1;SC.sun.shadow.camera.far=2000;
  SC.sun.shadow.camera.left=SC.sun.shadow.camera.bottom=-550;
  SC.sun.shadow.camera.right=SC.sun.shadow.camera.top=550;
  SC.sun.shadow.bias=-.0005;SC.scene.add(SC.sun);
  const moon=new THREE.DirectionalLight(0x4060a0,.14);moon.position.set(-180,280,-180);SC.scene.add(moon);
  SC.scene.add(new THREE.HemisphereLight(0x6090c0,0x3a6020,.5));

  // Ciel shader
  SC.sky=new THREE.Mesh(
    new THREE.SphereGeometry(3600,32,16),
    new THREE.ShaderMaterial({
      uniforms:{top:{value:new THREE.Color(0x4080d0)},bot:{value:new THREE.Color(0x80b8e0)}},
      vertexShader:`varying vec3 vW;void main(){vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform vec3 top,bot;varying vec3 vW;void main(){float h=pow(max(normalize(vW).y,0.),.5);gl_FragColor=vec4(mix(bot,top,h),1.);}`,
      side:THREE.BackSide,depthWrite:false
    }));
  SC.scene.add(SC.sky);

  // Soleil/lune visuels
  const ss=new THREE.Mesh(new THREE.SphereGeometry(14,10,10),new THREE.MeshBasicMaterial({color:0xfffacc}));
  ss.name='sunSph';SC.scene.add(ss);
  const ms=new THREE.Mesh(new THREE.SphereGeometry(8,10,10),new THREE.MeshBasicMaterial({color:0xd0d8e8}));
  ms.name='moonSph';SC.scene.add(ms);

  // Pluie
  const rv=new Float32Array(3000*3);
  for(let i=0;i<rv.length;i+=3){rv[i]=(Math.random()-.5)*280;rv[i+1]=Math.random()*85;rv[i+2]=(Math.random()-.5)*280;}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rv,3));
  const rp=new THREE.Points(rg,new THREE.PointsMaterial({color:0x8ab4d0,size:.2,transparent:true,opacity:.5}));
  rp.name='rain';rp.visible=false;SC.scene.add(rp);
  SC._rv=rv;

  window.addEventListener('resize',()=>{
    SC.camera.aspect=innerWidth/innerHeight;SC.camera.updateProjectionMatrix();
    SC.renderer.setSize(innerWidth,innerHeight,false);
  });
}

// ── HORLOGE & VISUEL ─────────────────────────────────────────────────
