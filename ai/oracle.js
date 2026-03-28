// GENESIS — ai/oracle.js
// Commandes en langage naturel → actions sur le groupe
// Interprétation locale par mots-clés (fonctionne partout)
// + appel API Claude si disponible (claude.ai uniquement)

const ORACLE = (() => {
  let _busy = false;

  // ── ACTIONS CONCRÈTES ────────────────────────────────────────────────────
  const ACTIONS = {

    migrer(params){
      const best = TR.caves
        ?.filter(c => c.quality > 0.4)
        .sort((a,b) => b.quality - a.quality)[0];
      if(best){
        CAMP.x=best.x; CAMP.z=best.z;
        CAMP.shelterLevel=Math.max(CAMP.shelterLevel,2);
        best.discovered=true;
        W.humans.filter(h=>h.alive).forEach(h=>{
          h.state='goto_camp'; h._timer=30; h.thought='On déménage vers la grotte!';
        });
        log(`🏔 Le groupe migre vers une grotte (qualité ${(best.quality*100).toFixed(0)}%).`,'discovery');
        addChron('Migration vers une grotte','🏔');
        return `Migration vers une grotte à ${Math.hypot(best.x-CAMP.x,best.z-CAMP.z).toFixed(0)}u.`;
      }
      // Pas de grotte → trouver un bon terrain
      const tgt=randLand(8,50);
      CAMP.x=tgt.x; CAMP.z=tgt.z;
      W.humans.filter(h=>h.alive).forEach(h=>{h.state='goto_camp';h._timer=25;});
      log(`🚶 Le groupe se déplace vers un nouvel endroit.`,'world');
      return 'Déplacement vers un meilleur terrain.';
    },

    chasser(params){
      const alive=[...W.humans,...W.animals].filter(e=>e.alive);
      const hunters=W.humans.filter(h=>h.alive&&h.role==='hunter');
      if(!hunters.length){ return 'Aucun chasseur disponible.'; }
      const prey=alive
        .filter(e=>e.type_==='animal'&&!e.sp?.danger&&e.sp?.food>0)
        .sort((a,b)=>b.sp.food-a.sp.food)[0];
      if(prey){
        hunters.forEach(h=>{ h._target=prey; h.state='hunt'; h._timer=45; h.thought='À la chasse!'; });
        log(`🏹 ${hunters.length} chasseur(s) traquent un ${prey.name}.`,'world');
        return `${hunters.length} chasseurs envoyés vers un ${prey.name}.`;
      }
      return 'Aucune proie à portée — les chasseurs vont explorer.';
    },

    cueillir(params){
      const g=W.humans.filter(h=>h.alive&&(h.role==='gatherer'||h.role==='scout'));
      g.forEach(h=>{ h.state='forage'; h._timer=25; h.thought='Cueillette!'; });
      log(`🌿 ${g.length} personnes cueillent.`,'world');
      return `${g.length} personnes envoyées cueillir.`;
    },

    feu(params){
      const e=W.humans.find(h=>h.alive&&h.role==='elder')||W.humans.find(h=>h.alive);
      if(e){ e.state='tend_fire'; e._timer=20; e.thought='Entretenir le feu!'; }
      CAMP.fireLevel=Math.max(1,CAMP.fireLevel);
      CAMP.fireFuel=Math.max(CAMP.fireFuel,86400*1.5);
      log(`🔥 Le feu est entretenu.`,'world');
      return 'Le feu est ravivé.';
    },

    abri(params){
      CAMP.shelterLevel=Math.min(3,CAMP.shelterLevel+1);
      CAMP.shelterBuilt=true;
      const labels=['','Peaux tendues','Hutte de branches','Grotte aménagée'];
      W.humans.filter(h=>h.alive&&h.age>10).forEach(h=>{ h.state='make_tools'; h._timer=20; h.thought='Construire!'; });
      log(`🏕 Abri construit : ${labels[CAMP.shelterLevel]}.`,'discovery');
      addChron(`Abri : ${labels[CAMP.shelterLevel]}`,'🏕');
      return `Abri amélioré : ${labels[CAMP.shelterLevel]}.`;
    },

    explorer(params){
      const scouts=W.humans.filter(h=>h.alive&&(h.role==='scout'||h.role==='hunter')).slice(0,3);
      scouts.forEach(h=>{ h.state='scout'; h._timer=35; h.thought='Explorer!'; });
      // Révéler grottes proches
      const nearest=TR.caves?.filter(c=>!c.discovered)
        .sort((a,b)=>Math.hypot(a.x-CAMP.x,a.z-CAMP.z)-Math.hypot(b.x-CAMP.x,b.z-CAMP.z))[0];
      if(nearest){ nearest.discovered=true; log(`🏔 Une grotte découverte (qualité ${(nearest.quality*100).toFixed(0)}%)!`,'discovery'); }
      log(`🗺 ${scouts.length} éclaireurs explorent la région.`,'world');
      return `${scouts.length} éclaireurs partis. ${nearest?'Grotte trouvée!':''}`;
    },

    soigner(params){
      const sick=W.humans.filter(h=>h.alive&&h.disease);
      sick.forEach(h=>{ if(h.disease){ h.disease.timer*=.3; h.health=Math.min(100,h.health+20); }});
      const elder=W.humans.find(h=>h.alive&&h.role==='elder');
      if(elder) elder._learn('langage',.04);
      log(`🌿 Soins : ${sick.length} malades traités.`,'world');
      return sick.length ? `${sick.length} malades soignés.` : 'Personne n\'est malade.';
    },

    repos(params){
      W.humans.filter(h=>h.alive).forEach(h=>{ h.state='idle_camp'; h._timer=20; h.thought='Se reposer.'; });
      log(`😴 Tout le groupe se repose au camp.`,'world');
      return 'Le groupe se repose.';
    },

    nourrir(params){
      // Ramener nourriture d'urgence (action divine subtile)
      const types=['deer','rabbit','bison'];
      const t=types[Math.floor(Math.random()*types.length)];
      const a=Math.random()*Math.PI*2, r=30+Math.random()*40;
      const ax=CAMP.x+Math.cos(a)*r, az=CAMP.z+Math.sin(a)*r;
      const na=new Animal(t,ax,getH(ax,az),az);
      W.animals.push(na); buildAnimalMesh(na); SC.scene.add(na.mesh);
      log(`🦌 Un ${SP[t].name} apparaît près du camp.`,'world');
      return `Un ${SP[t].name} signalé près du camp.`;
    },
  };

  // ── INTERPRÉTATION LOCALE PAR MOTS-CLÉS ─────────────────────────────────
  const RULES = [
    {keys:['grotte','cave','abri','migr','déménag','install','vivre','refuge','hiver','froid'],
     acts:['explorer','migrer']},
    {keys:['chas','hunt','gibier','viande','proie','manger','nourrit','faim'],
     acts:['chasser']},
    {keys:['cueill','plante','baie','fruit','végét','herb'],
     acts:['cueillir']},
    {keys:['feu','flamme','chaleur','chaud','braise','bois'],
     acts:['feu']},
    {keys:['construi','bâti','abri','tente','hutte','maison'],
     acts:['abri']},
    {keys:['explor','scout','cherch','découvr','reconnaît','tour','région'],
     acts:['explorer']},
    {keys:['malade','soign','bless','guéri','santé','médecin'],
     acts:['soigner']},
    {keys:['repos','dors','dormir','sleep','fatigue','pause','calme'],
     acts:['repos']},
    {keys:['nourrit','manger','stock','ration','provision','animal','proie','faim'],
     acts:['nourrir','chasser']},
  ];

  function localInterpret(text) {
    const low = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const matched = [];
    for(const rule of RULES){
      if(rule.keys.some(k=>low.includes(k))){
        rule.acts.forEach(a=>{ if(!matched.includes(a)) matched.push(a); });
      }
    }
    return matched.length ? matched : ['explorer']; // défaut : explorer
  }

  // ── APPEL API CLAUDE (si possible) ──────────────────────────────────────
  async function callClaude(text){
    const alive=W.humans.filter(h=>h.alive);
    const prompt=`Groupe de ${alive.length} Homo sapiens, -${W.year} BP. ${W.season}, ${W.temp.toFixed(0)}°C, météo: ${W.weather}.
Camp: nourriture=${Math.round(CAMP.foodStock)}, eau=${Math.round(CAMP.waterStock)}, feu=${CAMP.fireLevel}/3, abri=${CAMP.shelterLevel}/3.
Grottes disponibles: ${TR.caves?.filter(c=>!c.discovered).length||0} inconnues, ${TR.caves?.filter(c=>c.discovered).length||0} connues.
Malades: ${alive.filter(h=>h.disease).length}.

Consigne: "${text}"

Réponds UNIQUEMENT JSON sans markdown:
{"actions":["migrer","chasser","cueillir","feu","abri","explorer","soigner","repos","nourrir"],"message":"1 phrase narrative épique"}
Actions disponibles: migrer, chasser, cueillir, feu, abri, explorer, soigner, repos, nourrir. Maximum 2 actions.`;

    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:200,
        messages:[{role:'user',content:prompt}]
      })
    });
    const data=await res.json();
    const t=data.content?.[0]?.text||'{}';
    return JSON.parse(t.replace(/```json|```/g,'').trim());
  }

  // ── ENTRÉE PRINCIPALE ────────────────────────────────────────────────────
  async function interpret(text){
    if(_busy||!text?.trim()) return;
    _busy=true;
    const input=document.getElementById('oracle-input');
    if(input) input.value='';

    setStatus('⟳ …');
    addLog(`▶ "${text}"`,'cmd');

    let acts, msg;

    // Essayer l'API Claude d'abord
    try {
      const json=await callClaude(text);
      acts=json.actions||[];
      msg=json.message||'';
      addLog(`✦ ${msg}`,'resp');
    } catch(e){
      // CORS ou réseau → interprétation locale
      acts=localInterpret(text);
      addLog(`(interprétation locale)`, 'info');
    }

    // Exécuter les actions
    const results=[];
    for(const act of acts.slice(0,3)){
      if(ACTIONS[act]){
        await new Promise(r=>setTimeout(r,200));
        const r=ACTIONS[act]({});
        if(r) results.push(r);
      }
    }
    if(results.length) addLog(results.join(' · '),'result');
    setStatus('Dis-moi ce que le groupe doit faire…');
    _busy=false;
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  function setStatus(m){
    const e=document.getElementById('oracle-status'); if(e) e.textContent=m;
  }
  function addLog(m, cls=''){
    const el=document.getElementById('oracle-log'); if(!el) return;
    const d=document.createElement('div');
    const col={cmd:'#a0c8e8',resp:'#c8b870',result:'#80c880',info:'#808080'}[cls]||'#c8a860';
    d.style.cssText=`font-size:10px;color:${col};padding:1px 0;line-height:1.4;`;
    d.textContent=m;
    el.insertBefore(d,el.firstChild);
    while(el.children.length>5) el.removeChild(el.lastChild);
  }

  return { interpret, actions:ACTIONS };
})();