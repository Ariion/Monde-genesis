// GENESIS — ui/hud.js — Interface & HUD

// ── HUD ──────────────────────────────────────────────────────────────
const CHRON_LIST=[];
function addChron(txt,ico='📜'){
  if(CHRON_LIST.length&&CHRON_LIST[0].txt===txt)return;
  CHRON_LIST.unshift({txt,ico,yr:W.year+1});
  if(CHRON_LIST.length>30)CHRON_LIST.pop();
  const el=document.getElementById('chron-list');
  if(!el)return;
  el.innerHTML=CHRON_LIST.slice(0,10).map(c=>`<div class="ce"><span class="cy">An ${c.yr}</span><br>${c.ico} ${c.txt}</div>`).join('');
}

const LOGS_LIST=[];
function log(msg,type='world'){
  LOGS_LIST.unshift({msg,type});if(LOGS_LIST.length>35)LOGS_LIST.pop();
  const el=document.getElementById('log');
  const COL={world:'#88c8a0',social:'#c8a0d8',discovery:'#f8d860',danger:'#f07060'};
  el.innerHTML=LOGS_LIST.slice(0,7).map(l=>`<div class="ll" style="color:${COL[l.type]||'#b8a880'};border-color:${COL[l.type]||'#b8a880'}">${l.msg}</div>`).join('');
}

function bar(id,v,def){
  const el=document.getElementById(id);if(!el)return;
  const pct=Math.max(0,Math.min(100,isFinite(v)?v:0));
  el.style.width=pct+'%';el.style.background=pct<CFG.CRIT?'#e03030':pct<CFG.WARN?'#e09030':def;
}
function sv(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}

function _spdHUD(){sv('h-spd',W.paused?'⏸ Pause':`▶ ×${W.speed}`);}

function showInsp(ent){
  if(!ent?.alive){document.getElementById('insp').style.display='none';return;}
  document.getElementById('insp').style.display='block';
  const stg=ent.type_==='human'?CFG.SPECIES_STAGES[getSpeciesStage(ent.gen||1)]?.name:'';
  document.getElementById('it').textContent=ent.type_==='human'
    ?`${ent.name} (${ent.sex==='M'?'♂':'♀'})`:`${ent.name} ${ent.sex==='M'?'♂':'♀'}`;
  if(ent.type_==='human'){
    const emoCol=EMOTIONS[ent.emotion]?.col||'#888';
    document.getElementById('ib').innerHTML=`
      <i style="color:#888;font-size:10px">${stg}</i><br>
      ❤ Santé: ${ent.health.toFixed(0)}% · 🍖 ${ent.hunger.toFixed(0)}%<br>
      💧 Soif: ${ent.thirst.toFixed(0)}% · 🌡 Chaleur: ${ent.warmth.toFixed(0)}%<br>
      ⚡ Énergie: ${ent.energy.toFixed(0)}% · 📅 Âge: ${ent.age.toFixed(1)} ans<br>
      🧬 Gén: ${ent.gen} · IQ: ${ent.iq?.toFixed(0)||'?'}<br>
      Émotion: <span style="color:${emoCol}">${EMOTIONS[ent.emotion]?.name||'?'}</span><br>
      Pensée: <i>"${ent.thought}"</i><br><br>
      <b style="color:#c89050">Compétences</b><br>
      ${SK_KEYS.map(k=>`${SK_EMO[k]} ${((ent.skills?.[k]||0)*100).toFixed(0)}%`).join(' · ')}<br><br>
      ${ent.partner?`💑 Partenaire: ${ent.partner.name}<br>`:''}
      ${ent.clan?`👥 Clan: ${ent.clan.name}<br>`:''}
      ${ent.discoveries?.length?`✨ Découvertes: ${ent.discoveries.join(', ')}`:''}
    `;
  } else {
    document.getElementById('ib').innerHTML=`
      ❤ PV: ${Math.floor(ent.hp)}/${ent.sp.hp}<br>
      🍖 Faim: ${ent.hunger.toFixed(0)}%<br>
      État: ${ent.state}${ent.pregnant?' · 🤰':''}
    `;
  }
}

function updateHUD(){
  const hh=Math.floor(W.hour),mm=Math.floor((W.hour%1)*60);
  const tod=W.hour<6?'🌙':W.hour<8?'🌅':W.hour<18?'☀':W.hour<21?'🌆':'🌙';
  sv('h-time',`${tod} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
  sv('h-wx',WIC[W.weather]||'☀️');
  sv('h-date',`${SIC[W.season]||''} Jour ${W.day+1} · An ${W.year+1} · ${W.season}`);
  sv('h-pop',`👥 ${W.humans.filter(h=>h.alive).length}`);
  _spdHUD();

  sv('s-pop',W.humans.filter(h=>h.alive).length);
  sv('s-gen',W.gen);sv('s-bir',W.births);sv('s-dea',W.deaths);
  sv('s-cla',W.clans.length);sv('s-ani',W.animals.length);
  sv('s-tmp',W.temp.toFixed(0)+'°C');

  const de=Math.max(0,Math.min(100,isFinite(W.divEnergy)?W.divEnergy:0));
  const ef=document.getElementById('efill');if(ef)ef.style.width=de+'%';
  sv('eval',Math.floor(de));

  // Panels Adam & Ève
  const adam=W.humans.find(h=>h.name==='Adam');
  const eve =W.humans.find(h=>h.name==='Ève');
  if(adam)_panel('a',adam);
  if(eve) _panel('e',eve);
}

function _panel(id,h){
  sv(`${id}-age`,h.age.toFixed(1)+' ans');
  bar(`${id}-hunger`,h.hunger,'#e8a840');
  bar(`${id}-thirst`,h.thirst,'#60b0e0');
  bar(`${id}-health`,h.health,'#60c870');
  bar(`${id}-warmth`,h.warmth,'#f06030');
  bar(`${id}-energy`,h.energy,'#a060e0');
  // Émotion
  const emo=EMOTIONS[h.emotion];
  const emoEl=document.getElementById(`${id}-emo`);
  if(emoEl){emoEl.textContent=emo?`${emo.name}…`:'—';emoEl.style.color=emo?.col||'#888';}
  // Compétences
  const sklEl=document.getElementById(`${id}-skl`);
  if(sklEl)sklEl.textContent=SK_KEYS.map(k=>`${SK_EMO[k]}${((h.skills?.[k]||0)*100).toFixed(0)}%`).join(' ');
  // Pensée
  const thtEl=document.getElementById(`${id}-tht`);
  if(thtEl){thtEl.textContent=`"${h.thought}"`;thtEl.style.color=emo?.col||'rgba(200,180,130,.6)';}
}

// ── HELPERS ──────────────────────────────────────────────────────────
function d2(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function _nearestCave(x,z,md){if(!TR.caves?.length)return null;let b=null,bd=md;TR.caves.forEach(cv=>{const d=Math.hypot(cv.x-x,cv.z-z);if(d<bd){bd=d;b=cv;}});return b;}
function near(e,t){return Math.hypot(e.x-e.tx,e.z-e.tz)<t;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

// ── BOUCLE PRINCIPALE ────────────────────────────────────────────────
