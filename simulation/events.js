// GENESIS — simulation/events.js — Événements aléatoires du Paléolithique

var _lastEvtReal=0;

function tickEvents(nowReal){
  if(nowReal-_lastEvtReal < CFG.EVT_COOLDOWN*1000) return;
  if(Math.random()>.06) return;
  _lastEvtReal=nowReal;

  const alive=W.humans.filter(h=>h.alive);
  if(!alive.length) return;
  const r=Math.random();

  if(r<.12){
    // Migration animale saisonnière
    if(W.season==='autumn'||W.season==='spring'){
      const types=['deer','bison','horse','mammoth'].filter(t=>SP[t]&&!SP[t].danger);
      const t=types[Math.floor(Math.random()*types.length)];
      const count=4+Math.floor(Math.random()*8);
      const angle=Math.random()*Math.PI*2, baseX=Math.cos(angle)*120, baseZ=Math.sin(angle)*120;
      for(let i=0;i<count;i++){
        const pos=randLand(4,65);
        const a=new Animal(t,baseX+(Math.random()-.5)*40,pos.y,baseZ+(Math.random()-.5)*40);
        W.animals.push(a); buildAnimalMesh(a); SC.scene.add(a.mesh);
      }
      log(`🦬 Un troupeau de ${SP[t].name}s migre vers le sud!`,'world');
      addChron(`Migration de ${SP[t].name}s`,'🦬');
    }

  } else if(r<.22){
    // Découverte fortuite d'un individu
    const h=alive[Math.floor(Math.random()*alive.length)];
    const discoveries=[
      {sk:'feu',    msg:`${h.name} comprend comment conserver les braises.`,log:true},
      {sk:'outil',  msg:`${h.name} taille un éclat particulièrement tranchant.`,log:true},
      {sk:'abri',   msg:`${h.name} trouve une façon de mieux tendre les peaux.`,log:false},
      {sk:'chasse', msg:`${h.name} observe comment les prédateurs traquent.`,log:true},
      {sk:'langage',msg:`${h.name} invente un nouveau son pour un objet.`,log:false},
    ];
    const d=discoveries[Math.floor(Math.random()*discoveries.length)];
    h._learn(d.sk,.15);
    if(d.log) log(`💡 ${d.msg}`,'discovery');
    addChron(d.msg.slice(0,40),'💡');

  } else if(r<.32){
    // Événement météo extrême
    if(W.season==='winter'&&Math.random()<.4){
      W.weather='blizzard';
      alive.forEach(h=>{ if(distCamp&&distCamp(h)>30) h.warmth=Math.max(0,h.warmth-30); });
      log(`❄ Blizzard! Le groupe doit s'abriter!`,'danger');
    } else if(W.season==='summer'&&Math.random()<.3){
      W.weather='storm';
      log(`⛈ Orage violent. Les chasseurs rentrent.`,'danger');
    }

  } else if(r<.42){
    // Rencontre avec autre groupe (pas encore implémenté comme entités)
    if(W.year<11990&&Math.random()<.3){
      const outcomes=[
        ()=>{ alive.forEach(h=>h._learn('langage',.05)); log(`👥 Rencontre avec un autre groupe. Échange de techniques.`,'social'); },
        ()=>{ const h=alive[Math.floor(Math.random()*alive.length)]; h.health=Math.max(0,h.health-25); h.injured=true; log(`⚔ Conflit avec un groupe inconnu! ${h.name} est blessé.`,'danger'); },
        ()=>{ CAMP.foodStock+=40; log(`🤝 Échange avec un groupe voisin. Nourriture obtenue.`,'world'); },
      ];
      outcomes[Math.floor(Math.random()*outcomes.length)]();
    }

  } else if(r<.52){
    // Prédateur s'approche du camp
    const predTypes=['wolf','bear'];
    const t=predTypes[Math.floor(Math.random()*predTypes.length)];
    if(SP[t]){
      const pos={x:CAMP.x+(Math.random()-.5)*60,y:getH(CAMP.x,CAMP.z),z:CAMP.z+(Math.random()-.5)*60};
      const pred=new Animal(t,pos.x,pos.y,pos.z);
      pred.hp*=1.2; // prédateur plus robuste
      W.animals.push(pred); buildAnimalMesh(pred); SC.scene.add(pred.mesh);
      log(`⚠ Un ${SP[t].name} s'approche du camp!`,'danger');
    }

  } else if(r<.60){
    // Vieille guérisseuse découvre plante médicinale
    const elder=alive.find(h=>h.role==='elder');
    if(elder){
      elder._learn('langage',.08);
      alive.filter(h=>h.disease).forEach(h=>{
        h.disease.timer=Math.min(h.disease.timer,86400);
        h.health=Math.min(100,h.health+10);
      });
      log(`🌿 ${elder.name} prépare des remèdes avec des herbes.`,'discovery');
    }

  } else if(r<.68){
    // Feu de forêt (été)
    if(W.season==='summer'&&W.weather==='clear'){
      log(`🔥 Un feu de forêt est visible à l'horizon. Le groupe surveille.`,'danger');
      // Repousse le gibier temporairement
      W.animals.filter(a=>a.alive&&!a.sp?.danger).forEach(a=>{
        a.tx=a.x+(Math.random()-.5)*100; a.tz=a.z+(Math.random()-.5)*100;
        a.state='flee'; a.stT=15;
      });
    }

  } else if(r<.75){
    // Bonne chasse collective
    const hunters=alive.filter(h=>h.role==='hunter');
    if(hunters.length>=2){
      const bonus=hunters.length*15;
      CAMP.foodStock+=bonus;
      hunters.forEach(h=>h._learn('chasse',.02));
      log(`🏹 Chasse collective réussie! +${bonus} nourriture au camp.`,'world');
      addChron(`Grande chasse! +${bonus} nourriture`,'🏹');
    }
  }
}