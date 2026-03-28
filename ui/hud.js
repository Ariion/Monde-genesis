// GENESIS — ui/hud.js

const CHRON_LIST=[];
function addChron(txt,ico='📜'){
  if(CHRON_LIST.length&&CHRON_LIST[0].txt===txt) return;
  CHRON_LIST.unshift({txt,ico,yr:W.year});
  if(CHRON_LIST.length>40) CHRON_LIST.pop();
  const el=document.getElementById('chron-list');
  if(!el) return;
  el.innerHTML=CHRON_LIST.slice(0,12).map(c=>
    `<div class="ce"><span class="cy">-${c.yr} BP</span><br>${c.ico} ${c.txt}</div>`
  ).join('');
}

const LOGS_LIST=[];
function log(msg,type='world'){
  LOGS_LIST.unshift({msg,type});
  if(LOGS_LIST.length>50) LOGS_LIST.pop();
  const el=document.getElementById('log');
  if(!el) return;
  const COL={world:'#88c8a0',social:'#c8a0d8',discovery:'#f8d860',danger:'#f07060'};
  el.innerHTML=LOGS_LIST.slice(0,8).map(l=>
    `<div class="ll" style="color:${COL[l.type]||'#b8a880'};border-color:${COL[l.type]||'#b8a880'}">${l.msg}</div>`
  ).join('');
}

function bar(id,v,def){
  const el=document.getElementById(id); if(!el) return;
  const pct=Math.max(0,Math.min(100,isFinite(v)?v:0));
  el.style.width=pct+'%';
  el.style.background=pct<CFG.CRIT?'#e03030':pct<CFG.WARN?'#e09030':def;
}
function sv(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function _spdHUD(){sv('h-spd',W.paused?'⏸ Pause':`▶ ×${W.speed}`);}

function showInsp(ent){
  if(!ent?.alive){document.getElementById('insp').style.display='none';return;}
  document.getElementById('insp').style.display='block';
  const stg=ent.type_==='human'?CFG.SPECIES_STAGES[getSpeciesStage(ent.gen||1)]?.name:'';
  document.getElementById('it').textContent=ent.type_==='human'
    ?`${ent.name} (${ent.sex==='M'?'♂':'♀'}, ${ent.age.toFixed(0)} ans)`
    :`${ent.name}`;
  if(ent.type_==='human'){
    const emoCol=EMOTIONS[ent.emotion]?.col||'#888';
    const diseaseStr=ent.disease?`<br>🤒 <span style="color:#f07060">${ent.disease.name}</span>`:'';
    const injuredStr=ent.injured?`<br>🩸 <span style="color:#f07060">Blessé</span>`:'';
    const pregnantStr=ent.pregnant?`<br>🤰 Enceinte (${Math.round((1-ent.pregTimer/(9*30*86400))*100)}%)`:'';
    const infantStr=ent.infant?`<br>👶 Porte ${ent.infant.name}`:'';
    document.getElementById('ib').innerHTML=`
      <i style="color:#888;font-size:10px">${stg} · ${ent.role}</i><br>
      ❤ ${ent.health.toFixed(0)}% · 🍖 ${ent.hunger.toFixed(0)}%<br>
      💧 ${ent.thirst.toFixed(0)}% · 🌡 ${ent.warmth.toFixed(0)}%<br>
      ⚡ ${ent.energy.toFixed(0)}% · État: <i>${ent.state}</i>
      ${diseaseStr}${injuredStr}${pregnantStr}${infantStr}<br>
      Émotion: <span style="color:${emoCol}">${EMOTIONS[ent.emotion]?.name||ent.emotion}</span><br>
      <i style="color:#888">"${ent.thought}"</i><br><br>
      <b style="color:#c89050">Compétences</b><br>
      ${SK_KEYS.map(k=>`${SK_EMO[k]}${((ent.skills?.[k]||0)*100).toFixed(0)}%`).join(' · ')}<br><br>
      ${ent.partner?`💑 ${ent.partner.name}<br>`:''}
      ${ent.clan?`👥 ${ent.clan.name}<br>`:''}
      ${ent.discoveries?.length?`✨ ${ent.discoveries.join(', ')}`:''}
    `;
  } else {
    const pct=Math.round(ent.hp/ent.sp.hp*100);
    document.getElementById('ib').innerHTML=`
      ❤ PV: ${Math.floor(ent.hp)}/${ent.sp.hp} (${pct}%)<br>
      🍖 Faim: ${ent.hunger.toFixed(0)}%<br>
      État: ${ent.state}${ent.pregnant?' · 🤰':''}
    `;
  }
}

function updateHUD(){
  const hh=Math.floor(W.hour),mm=Math.floor((W.hour%1)*60);
  const tod=W.hour<6?'🌙':W.hour<7?'🌅':W.hour<18?'☀':W.hour<21?'🌆':'🌙';
  sv('h-time',`${tod} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
  sv('h-wx',WIC[W.weather]||'☀');

  const seasonName={spring:'Printemps',summer:'Été',autumn:'Automne',winter:'Hiver'}[W.season]||W.season;
  const tempStr=`${W.temp.toFixed(0)}°C`;
  const snowStr=W.snowDepth>0.1?` · ❄ ${Math.round(W.snowDepth*100)}cm`:'';
  sv('h-date',`${SIC[W.season]} Jour ${W.day+1} · -${W.year} BP · ${seasonName}${snowStr}`);
  sv('h-pop',`👥 ${W.humans.filter(h=>h.alive).length}`);
  sv('h-temp',`${tempStr}`);
  _spdHUD();

  // Stats monde
  sv('s-pop',W.humans.filter(h=>h.alive).length);
  sv('s-gen',W.gen);
  sv('s-bir',W.births);
  sv('s-dea',W.deaths);
  sv('s-cla',W.clans.length);
  sv('s-ani',W.animals.length);
  sv('s-tmp',tempStr);

  // Camp
  const fireIco=['⬛','🔥','🔥🔥','🔥🔥🔥'][CAMP.fireLevel]||'⬛';
  sv('s-fire',fireIco);
  sv('s-food',Math.round(CAMP.foodStock));
  sv('s-water',Math.round(CAMP.waterStock));
  sv('s-shelter',['Aucun','Peaux','Branches','Grotte'][CAMP.shelterLevel]||'Aucun');

  // Énergie divine
  const de=Math.max(0,Math.min(100,W.divEnergy));
  const ef=document.getElementById('efill'); if(ef) ef.style.width=de+'%';
  sv('eval',Math.floor(de));

  // Panneaux Adam & Ève
  const adam=W.humans.find(h=>h.name==='Adam'&&h.alive);
  const eve =W.humans.find(h=>h.name==='Ève'&&h.alive);
  if(adam) _panel('a',adam);
  if(eve)  _panel('e',eve);
}

function _panel(id,h){
  sv(`${id}-age`,`${h.age.toFixed(0)} ans`);
  bar(`${id}-hunger`,h.hunger,'#e8a840');
  bar(`${id}-thirst`,h.thirst,'#60b0e0');
  bar(`${id}-health`,h.health,'#60c870');
  bar(`${id}-warmth`,h.warmth,'#f06030');
  bar(`${id}-energy`,h.energy,'#a060e0');
  const emo=EMOTIONS[h.emotion];
  const emoEl=document.getElementById(`${id}-emo`);
  if(emoEl){emoEl.textContent=emo?`${emo.name}`:h.emotion;emoEl.style.color=emo?.col||'#888';}
  const sklEl=document.getElementById(`${id}-skl`);
  if(sklEl) sklEl.textContent=SK_KEYS.map(k=>`${SK_EMO[k]}${((h.skills?.[k]||0)*100).toFixed(0)}%`).join(' ');
  const thtEl=document.getElementById(`${id}-tht`);
  const diseaseEl=document.getElementById(`${id}-status`);
  if(diseaseEl){
    let status='';
    if(h.disease) status+=`🤒 ${h.disease.name} `;
    if(h.injured) status+='🩸 Blessé ';
    if(h.pregnant) status+='🤰 ';
    if(h.infant) status+='👶 ';
    diseaseEl.textContent=status;
  }
  if(thtEl){thtEl.textContent=`"${h.thought}"`;thtEl.style.color=emo?.col||'rgba(200,180,130,.6)';}
}