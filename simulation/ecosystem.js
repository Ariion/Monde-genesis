// GENESIS — simulation/ecosystem.js

const ASPD={deer:7,rabbit:8.5,mammoth:4.5,bison:7,wolf:9,bear:6,sabre:11,eagle:18,fish:2.5};
const CLAN_NAMES_N  =['Loups','Cerfs','Aigles','Ours','Serpents','Faucons','Bisons','Lions'];
const CLAN_NAMES_ADJ=['des Étoiles','du Feu','de l\'Aube','du Rocher','des Eaux','du Vent','de la Lune'];

// ── INIT ──────────────────────────────────────────────────────────────────
function initEcosystem(){

  // Trouver un point de spawn terrestre — évite lac, shore, pic
  function findLand(){
    for(let r=0; r<CFG.W*.45; r+=5){
      for(let a=0; a<Math.PI*2; a+=.2){
        const x=Math.cos(a)*r, z=Math.sin(a)*r;
        const h=getH(x,z), bio=getBio(x,z);
        if(h>6 && h<55 && bio!=='lake' && bio!=='shore' && bio!=='peak')
          return {x,z,h};
      }
    }
    return {x:0, z:0, h:8};
  }

  const sp = findLand();
  const startH = Math.max(4, sp.h);
  const spawnX = sp.x, spawnZ = sp.z;  // garder pour distancer les prédateurs

  const adam = new Human('Adam','M', spawnX,     startH, spawnZ);
  const eve  = new Human('Ève', 'F', spawnX+5,   startH, spawnZ+3);
  adam.inv={food:22}; eve.inv={food:18};
  adam.partner=eve;   eve.partner=adam;
  eve.pregnant=true;  eve.pregTimer=4*86400;  // 4 jours simulés
  const firstClan=new Clan(adam,eve); W.clans.push(firstClan);
  adam.iq=8; eve.iq=9;
  adam.skills={chasse:.06,cueillette:.06,feu:.01,abri:.01,langage:.02,outil:.01};
  eve.skills ={chasse:.03,cueillette:.08,feu:.01,abri:.01,langage:.02,outil:.01};
  W.humans.push(adam,eve);

  // Animaux
  for(const [type,count] of Object.entries(CFG.ANIMALS)){
    const sp2=SP[type]; if(!sp2) continue;
    for(let i=0;i<count;i++){
      let pos;
      if(sp2.aquatic){
        // Poissons : n'importe où (le lac ou les bords)
        pos={x:(Math.random()-.5)*320, y:-.5, z:(Math.random()-.5)*320};
      } else if(sp2.danger){
        // Prédateurs : au moins 90u du spawn humain
        let tries=0, px, pz;
        do {
          const p=randLand(5,75);
          px=p.x; pz=p.z; tries++;
        } while(tries<80 && Math.hypot(px-spawnX, pz-spawnZ)<90);
        pos={x:px, y:getH(px,pz), z:pz};
      } else {
        pos=randLand(3,70);
      }
      const a=new Animal(type, pos.x, pos.y, pos.z);
      a.age=Math.random()*a.life*.4;
      a.hunger=50+Math.random()*45;
      W.animals.push(a);
    }
  }
  W.pop=2;
}

// ── TICK ──────────────────────────────────────────────────────────────────
function tickEco(simDt, _realDt){
  const all=[...W.humans,...W.animals].filter(e=>e.alive);

  for(const a of [...W.animals].filter(x=>x.alive)){
    a.sp._spd=ASPD[a.type]||5;
    a.tick(simDt,all);
  }
  for(const h of [...W.humans].filter(x=>x.alive))
    h.tick(simDt,_realDt,all);
  for(const c of [...W.clans])
    c.tick(simDt,all);

  // Nettoyage morts
  W.animals=W.animals.filter(a=>{
    if(!a.alive&&a.mesh){SC.scene.remove(a.mesh);a.mesh=null;}
    return a.alive;
  });
  W.humans.filter(h=>!h.alive&&h.mesh).forEach(h=>{SC.scene.remove(h.mesh);h.mesh=null;});
  W.clans=W.clans.filter(c=>c.members.length>0);

  // Meshes nouveaux-nés
  W.animals.filter(a=>a.alive&&!a.mesh).forEach(a=>{buildAnimalMesh(a);SC.scene.add(a.mesh);});
  W.humans.filter(h=>h.alive&&!h.mesh).forEach(h=>{buildHumanMesh(h);SC.scene.add(h.mesh);});

  // Respawn faune
  if(W.animals.length<CFG.MAX_ANIMALS && Math.random()<.008*simDt){
    const types=Object.keys(CFG.ANIMALS);
    const t=types[Math.floor(Math.random()*types.length)];
    const sp2=SP[t]; if(!sp2) return;
    const pos=sp2.aquatic
      ?{x:(Math.random()-.5)*320,y:-.5,z:(Math.random()-.5)*320}
      :randLand(4,70);
    const na=new Animal(t,pos.x,pos.y,pos.z);
    W.animals.push(na); buildAnimalMesh(na); SC.scene.add(na.mesh);
  }
}