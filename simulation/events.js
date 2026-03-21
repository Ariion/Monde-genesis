// GENESIS — simulation/events.js

function tickEvents(nowReal){
  if(nowReal-_lastEvtReal<CFG.EVT_COOLDOWN*1000)return;
  if(Math.random()>.08)return;
  _lastEvtReal=nowReal;

  const alive=W.humans.filter(h=>h.alive);
  if(!alive.length)return;
  const r=Math.random();

  if(r<.20){
    // Migration animale
    const types=Object.keys(SP).filter(k=>!SP[k].aquatic);
    const t=types[Math.floor(Math.random()*types.length)];
    for(let i=0;i<6;i++){const p=randLand(4,75);const a=new Animal(t,p.x,p.y,p.z);W.animals.push(a);buildAnimalMesh(a);SC.scene.add(a.mesh);}
    log(`🦬 Migration de ${SP[t].name}s!`,'world');
    addChron(`Migration de ${SP[t].name}s`,'🦬');
  } else if(r<.36&&W.year>3){
    // Découverte fortuite
    const h=alive[Math.floor(Math.random()*alive.length)];
    const sk=SK_KEYS[Math.floor(Math.random()*SK_KEYS.length)];
    h._learn(sk,.12);
    log(`💡 ${h.name} découvre quelque chose de nouveau (${SK_EMO[sk]})!`,'discovery');
    addChron(`${h.name} découvre ${sk}`,'💡');
  } else if(r<.48){
    // Vague de froid
    if(W.season==='winter'){
      W.temp=Math.min(W.temp,-15);
      alive.forEach(h=>h.warmth=Math.max(0,h.warmth-25));
      log(`❄ Vague de froid intense!`,'danger');
    }
  }
}
