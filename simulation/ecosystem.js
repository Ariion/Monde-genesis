// GENESIS — simulation/ecosystem.js — Écosystème & tick

// ── INIT ÉCOSYSTÈME ───────────────────────────────────────────────────
function initEcosystem(){
  // Trouver un point de spawn TERRESTRE près du centre
  function findCenterLand(){
    // Spirale depuis (0,0) → premier point avec de la terre
    for(let r=0;r<CFG.W*.45;r+=6){
      for(let a=0;a<Math.PI*2;a+=.25){
        const x=Math.cos(a)*r, z=Math.sin(a)*r;
        const h=getH(x,z);
        if(h>4&&h<75) return{x,z,h};
      }
    }
    return{x:0,z:0,h:5};
  }
  const sp=findCenterLand();
  const startH=Math.max(4,sp.h);
  const adam=new Human('Adam','M',sp.x,    startH,sp.z);
  const eve =new Human('Ève', 'F',sp.x+5,  startH,sp.z+3);
  adam.inv={food:22};eve.inv={food:18};
  adam.partner=eve;eve.partner=adam;
  eve.pregnant=true;eve.pregTimer=6*86400;
  const firstClan=new Clan(adam,eve);W.clans.push(firstClan);
  // IQ très bas — primates primitifs
  adam.iq=8;eve.iq=9;
  adam.skills={chasse:.06,cueillette:.06,feu:.01,abri:.01,langage:.02,outil:.01};
  eve.skills= {chasse:.03,cueillette:.08,feu:.01,abri:.01,langage:.02,outil:.01};
  W.humans.push(adam,eve);

  // Animaux dans des zones appropriées
  const ASPD2={deer:7,rabbit:8.5,mammoth:4.5,bison:7,wolf:9,bear:6,sabre:11,eagle:18,fish:2.5};
  Object.assign(window,{CFG_ANIM_SPEED:ASPD2});

  for(const[t,count]of Object.entries(CFG.ANIMALS)){
    const sp=SP[t];if(!sp)continue;
    for(let i=0;i<count;i++){
      const pos=sp.aquatic?{x:(Math.random()-.5)*350,y:-.5,z:(Math.random()-.5)*350}:randLand(3,80);
      const a=new Animal(t,pos.x,pos.y,pos.z);
      a.age=Math.random()*a.life*.4;a.hunger=50+Math.random()*45;
      W.animals.push(a);
    }
  }
  W.pop=2;
}

// Remplacer CFG.ANIM_SPEED par une constante accessible
const ASPD={deer:7,rabbit:8.5,mammoth:4.5,bison:7,wolf:9,bear:6,sabre:11,eagle:18,fish:2.5};
const CLAN_NAMES_N  =['Loups','Cerfs','Aigles','Ours','Serpents','Faucons','Bisons','Lions'];
const CLAN_NAMES_ADJ=['des Étoiles','du Feu','de l\'Aube','du Rocher','des Eaux','du Vent','de la Lune'];

// ── TICK ÉCOSYSTÈME ───────────────────────────────────────────────────
function tickEco(simDt,_realDt){
  const all=[...W.humans,...W.animals].filter(e=>e.alive);

  // Animaux
  for(const a of [...W.animals].filter(x=>x.alive)){
    // Patch speed
    a.sp._spd=ASPD[a.type]||5;
    a.tick(simDt,all);
  }

  // Humains
  for(const h of [...W.humans].filter(x=>x.alive))h.tick(simDt,_realDt,all);

  // Clans
  for(const c of [...W.clans])c.tick(simDt,all);

  // Nettoyage
  W.animals=W.animals.filter(a=>{
    if(!a.alive&&a.mesh){SC.scene.remove(a.mesh);a.mesh=null;}
    return a.alive;
  });
  W.humans.filter(h=>!h.alive&&h.mesh).forEach(h=>{SC.scene.remove(h.mesh);h.mesh=null;});
  W.clans=W.clans.filter(c=>c.members.length>0);

  // Sync meshes pour nouveau-nés
  W.animals.filter(a=>a.alive&&!a.mesh).forEach(a=>{buildAnimalMesh(a);SC.scene.add(a.mesh);});
  W.humans.filter(h=>h.alive&&!h.mesh).forEach(h=>{buildHumanMesh(h);SC.scene.add(h.mesh);});

  // Respawn animaux
  if(W.animals.length<CFG.MAX_ANIMALS&&Math.random()<.008*simDt){
    const types=Object.keys(CFG.ANIMALS);
    const t=types[Math.floor(Math.random()*types.length)];
    const sp2=SP[t];if(!sp2)return;
    const pos=sp2.aquatic?{x:(Math.random()-.5)*320,y:-.5,z:(Math.random()-.5)*320}:randLand(4,75);
    const na=new Animal(t,pos.x,pos.y,pos.z);
    W.animals.push(na);buildAnimalMesh(na);SC.scene.add(na.mesh);
  }
}

// ── ÉVÉNEMENTS MONDE ─────────────────────────────────────────────────
