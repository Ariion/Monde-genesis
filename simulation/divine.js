// GENESIS — simulation/divine.js

function divine(a){
  const cost=CFG.DIVINE_COSTS[a]||10;
  if(W.divEnergy<cost){log('✦ Influence divine insuffisante.','danger');return;}
  W.divEnergy=Math.max(0,W.divEnergy-cost);
  const alive=W.humans.filter(h=>h.alive);

  switch(a){
    case'weather':{const ws=['clear','cloudy','rain'];W.weather=ws[(ws.indexOf(W.weather)+1)%ws.length];log(`🌤 Météo modifiée.`,'world');break;}
    case'prey':{
      const types=['deer','rabbit','bison'].filter(k=>!SP[k].danger);
      const t=types[Math.floor(Math.random()*types.length)];
      const c=alive[0]||{x:0,z:0};
      const ap=new Animal(t,c.x+10,getH(c.x+10,c.z+10),c.z+10);
      W.animals.push(ap);buildAnimalMesh(ap);SC.scene.add(ap.mesh);
      log(`🦌 Une ${SP[t].name} apparaît près des humains.`,'world');break;}
    case'danger':{
      W.animals.filter(a2=>a2.sp?.danger).forEach(d=>{d.tx=d.x+(Math.random()-.5)*200;d.tz=d.z+(Math.random()-.5)*200;d.state='flee';d.stT=15;});
      log(`🛡 Les prédateurs s'éloignent.`,'world');break;}
    case'heal':{
      alive.forEach(h=>{h.health=Math.min(100,h.health+45);h.hunger=Math.min(100,h.hunger+30);h.thirst=Math.min(100,h.thirst+30);h.warmth=Math.min(100,h.warmth+35);h.energy=Math.min(100,h.energy+30);});
      log(`💚 Vos enfants sont restaurés.`,'world');break;}
    case'vision':{
      if(!alive.length)return;
      const h=alive[Math.floor(Math.random()*alive.length)];
      const sk=SK_KEYS[Math.floor(Math.random()*SK_KEYS.length)];
      h._learn(sk,.20);
      log(`💫 ${h.name} reçoit une vision (${SK_EMO[sk]} amélioré).`,'discovery');
      addChron(`${h.name} reçoit une vision`,'💫');break;}
    case'fruit':{
      alive.forEach(h=>{if(!h.inv)h.inv={};h.inv.food=(h.inv.food||0)+25;});
      log(`🍇 Nourriture abondante apparaît.`,'world');break;}
    case'warm':{
      alive.forEach(h=>h.warmth=Math.min(100,h.warmth+50));
      if(alive.some(h=>!h.discoveries.includes('feu'))){
        const h=alive.find(h=>!h.discoveries.includes('feu'));
        if(h){h.skills.feu=Math.min(1,h.skills.feu+.2);h.discoveries.push('feu');
          log(`🔥 ${h.name} comprend le feu!`,'discovery');
          addChron(`${h.name} découvre le feu`,'🔥');}
      }
      log(`🔥 Chaleur divine enveloppe vos enfants.`,'world');break;}
  }
}
