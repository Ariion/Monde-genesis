// GENESIS — entities/evolution.js

// ── ÉVOLUTION DE L'ESPÈCE ─────────────────────────────────────────────
function getSpeciesStage(gen){
  const stages=CFG.SPECIES_STAGES;
  let stage=0;
  for(let i=0;i<stages.length;i++){if(gen>=stages[i].gen)stage=i;}
  return stage;
}

function _checkEvolution(){
  const gen=W.gen;
  const stages=CFG.SPECIES_STAGES;
  const newStage=getSpeciesStage(gen);
  if(newStage>W.speciesStage){
    W.speciesStage=newStage;
    const st=stages[newStage];
    log(`🧬 Évolution! L'humanité devient : ${st.name}!`,'discovery');
    addChron(`Évolution : ${st.name}`,`🧬`);
    // Augmenter IQ de tous les humains vivants
    W.humans.filter(h=>h.alive).forEach(h=>{h.iq=Math.min(100,h.iq+8+Math.random()*5);});
  }
}
