// GENESIS — simulation/ecosystem.js

if (window.__ecosystem_loaded__) {
  throw new Error("ecosystem.js chargé deux fois");
}
window.__ecosystem_loaded__ = true;

const ASPD={deer:7,rabbit:8.5,mammoth:4,bison:7,horse:10,wolf:9,bear:5.5,eagle:18,fish:2.5};
const CLAN_NAMES_N  =['Auroch','Renne','Aigle','Ours','Mammouth','Bison','Loup'];
const CLAN_NAMES_ADJ=['des Étoiles','du Feu','de l\'Aube','du Rocher','des Glaces','du Vent'];
var CAMP={x:0,z:0,established:false,fireLevel:0,fireFuel:0,foodStock:0,waterStock:0,shelterLevel:0,shelterBuilt:false,tools:[],age:0};
var W={humans:[],animals:[],clans:[],season:'spring',day:0,year:0,pop:0,births:0};
var TR={caves:[]};
var SP={ // Species properties
  various:{name:'Divers',danger:false,aquatic:false},
  deer:{name:'Cerf',danger:false,aquatic:false},
  rabbit:{name:'Lapin',danger:false,aquatic:false},
  mammoth:{name:'Mammouth',danger:true,aquatic:false},
  bison:{name:'Bison',danger:false,aquatic:false},
  horse:{name:'Cheval',danger:false,aquatic:false},
  wolf:{name:'Loup',danger:true,aquatic:false},
  bear:{name:'Ours',danger:true,aquatic:false},
  eagle:{name:'Aigle',danger:true,aquatic:false},
  fish:{name:'Poisson',danger:false,aquatic:true},
};


function initEcosystem(){

  function findLand(){
    for(let r=0;r<CFG.W*.45;r+=5){
      for(let a=0;a<Math.PI*2;a+=.2){
        const x=Math.cos(a)*r, z=Math.sin(a)*r;
        const h=getH(x,z), bio=getBio(x,z);
        if(h>6&&h<50&&bio!=='lake'&&bio!=='shore'&&bio!=='peak')
          return{x,z,h};
      }
    }
    return{x:0,z:0,h:8};
  }

  const sp=findLand();
  const sx=sp.x, sz=sp.z, sh=Math.max(5,sp.h);

  // Établir le camp au spawn
  CAMP.x=sx; CAMP.z=sz; CAMP.established=true;
  CAMP.fireLevel=1; CAMP.fireFuel=86400;  // feu
  CAMP.foodStock=0; CAMP.waterStock=10;  // stocks quasi vides → ils doivent chasser/cueillir
  CAMP.shelterLevel=0;
  CAMP.shelterBuilt=false;
  CAMP.tools=[]; CAMP.age=0;

  // ── GROUPE INITIAL : 9 personnes, âges variés ─────────────────────────
  const groupDef=[
    // nom, sexe, âge approximatif, rôle implicite
    ['Adam', 'M', 28],  // chef de groupe adulte
    ['Ève',  'F', 24],  // femme principale
    ['Brak', 'M', 35],  // chasseur expérimenté
    ['Fara', 'F', 30],  // cueilleuse principale
    ['Gal',  'M', 18],  // jeune scout
    ['Hara', 'F', 45],  // ancienne, gardienne du feu
    ['Iru',  'M', 12],  // enfant — fils de Brak
    ['Kael', 'F',  6],  // petite enfant
    ['Lara', 'F', 22],  // jeune femme
  ];

  const members=[];
  groupDef.forEach(([name,sex,approxAge])=>{
    const scatter=(Math.random()-.5)*14;
    const h=new Human(name,sex,sx+scatter,sh,sz+(Math.random()-.5)*14);
    h.age=approxAge+Math.random()*3-1;
    // Compétences selon âge et rôle
    if(approxAge>40){ h.skills.feu=.25+Math.random()*.15; h.skills.langage=.2+Math.random()*.1; }
    if(approxAge>25&&sex==='M'){ h.skills.chasse=.12+Math.random()*.1; h.skills.outil=.08+Math.random()*.06; }
    if(approxAge>20&&sex==='F'){ h.skills.cueillette=.14+Math.random()*.1; h.skills.abri=.06+Math.random()*.06; }
    if(approxAge<16){ h.skills.chasse=0; h.skills.cueillette=.02+Math.random()*.02; }
    h.hunger=70+Math.random()*20;
    h.thirst=65+Math.random()*20;
    h.energy=75+Math.random()*20;
    members.push(h);
    W.humans.push(h);
  });

  // Partenaires
  const adam=members[0], eve=members[1];
  adam.partner=eve; eve.partner=adam;
  eve.pregnant=true; eve.pregTimer=Math.floor(Math.random()*5+4)*30*86400;

  const brak=members[2], fara=members[3];
  brak.partner=fara; fara.partner=brak;

  // Clan unique
  const clan=new Clan(adam,eve);
  members.forEach(m=>{ if(!m.clan) clan.addMember(m); });
  W.clans.push(clan);

  // Spawner animaux proches du camp pour que la chasse commence vite
  const nearAnimals=[
    ['deer',3],['rabbit',6],['bison',1]
  ];
  for(const [type,count] of nearAnimals){
    const sp2=SP[type]; if(!sp2) continue;
    for(let i=0;i<count;i++){
      const a2=Math.random()*Math.PI*2;
      const r2=50+Math.random()*80;
      const ax=sx+Math.cos(a2)*r2, az=sz+Math.sin(a2)*r2;
      const ah=getH(ax,az);
      const na=new Animal(type,ax,ah,az);
      na.hunger=60+Math.random()*30;
      W.animals.push(na);
    }
  }

  W.pop=members.length;
  W.births=members.length;

  // ── FAUNE ────────────────────────────────────────────────────────────────
  for(const[type,count] of Object.entries(CFG.ANIMALS)){
    const sp2=SP[type]; if(!sp2) continue;
    for(let i=0;i<count;i++){
      let pos;
      if(sp2.aquatic){
        pos={x:(Math.random()-.5)*300,y:-.5,z:(Math.random()-.5)*300};
      } else if(sp2.danger){
        let px,pz,tries=0;
        do{ const p=randLand(5,70); px=p.x; pz=p.z; tries++; }
        while(tries<60&&Math.hypot(px-sx,pz-sz)<100);
        pos={x:px,y:getH(px,pz),z:pz};
      } else {
        pos=randLand(3,65);
      }
      const a=new Animal(type,pos.x,pos.y,pos.z);
      a.age=Math.random()*a.life*.5;
      a.hunger=50+Math.random()*40;
      W.animals.push(a);
    }
  }
}

function tickEco(simDt,realDt){
  const all=[...W.humans,...W.animals].filter(e=>e.alive);

  for(const a of [...W.animals].filter(x=>x.alive)){
    a.sp._spd=ASPD[a.type]||5;
    a.tick(simDt,all);
  }
  for(const h of [...W.humans].filter(x=>x.alive))
    h.tick(simDt,realDt,all);
  for(const c of [...W.clans])
    c.tick(simDt,all);

  // Nettoyage
  W.animals=W.animals.filter(a=>{
    if(!a.alive&&a.mesh){SC.scene.remove(a.mesh);a.mesh=null;}
    return a.alive;
  });
  W.humans.filter(h=>!h.alive&&h.mesh).forEach(h=>{SC.scene.remove(h.mesh);h.mesh=null;});
  W.clans=W.clans.filter(c=>c.members.length>0);

  // Meshes nouveaux-nés
  W.animals.filter(a=>a.alive&&!a.mesh).forEach(a=>{buildAnimalMesh(a);SC.scene.add(a.mesh);});
  W.humans.filter(h=>h.alive&&!h.mesh&&!W.humans.some(p=>p.infant===h))
    .forEach(h=>{buildHumanMesh(h);SC.scene.add(h.mesh);});

  // Respawn faune (migration saisonnière)
  const maxA=CFG.MAX_ANIMALS*(W.season==='winter'?.5:1);
  if(W.animals.length<maxA&&Math.random()<.006*simDt){
    const types=Object.keys(CFG.ANIMALS).filter(t=>!SP[t]?.danger);
    const t=types[Math.floor(Math.random()*types.length)];
    const sp2=SP[t]; if(!sp2) return;
    const pos=sp2.aquatic?{x:(Math.random()-.5)*300,y:-.5,z:(Math.random()-.5)*300}:randLand(4,65);
    const na=new Animal(t,pos.x,pos.y,pos.z);
    W.animals.push(na); buildAnimalMesh(na); SC.scene.add(na.mesh);
  }
}