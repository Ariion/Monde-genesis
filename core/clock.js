// GENESIS — core/clock.js — Temps, météo, saisons

const SEASONS = ['spring','summer','autumn','winter'];
const SIC = {spring:'🌱',summer:'☀',autumn:'🍂',winter:'❄'};
const WIC = {clear:'☀',cloudy:'⛅',rain:'🌧',storm:'⛈',snow:'🌨',blizzard:'🌪'};

// Températures moyennes par saison à -12000 BP (fin de glaciation, Europe)
const STEMP = {spring:8, summer:20, autumn:5, winter:-12};

function tickClock(realMs) {
  const simDt = (realMs/1000) * W.speed * (86400/CFG.DAY_SEC);
  W.totalSim += simDt;
  W.hour += simDt/3600;

  if(W.hour >= 24) {
    W.hour -= 24;
    W.day++;
    CAMP.age++;
    CAMP.fireFuel = Math.max(0, CAMP.fireFuel - 3600*4); // brûle en 4h sans entretien
    if(CAMP.fireFuel <= 0 && CAMP.fireLevel > 0) {
      CAMP.fireLevel = Math.max(0, CAMP.fireLevel-1);
      if(CAMP.fireLevel === 0) log('🔥 Le feu du camp s\'est éteint!','danger');
    }

    // Météo change chaque jour avec probabilité
    if(Math.random() < 0.35) _changeWeather();
  }

  // Neige au sol
  if(W.season==='winter'&&(W.weather==='snow'||W.weather==='blizzard'))
    W.snowDepth = Math.min(1, W.snowDepth + simDt/86400*0.3);
  else if(W.season!=='winter')
    W.snowDepth = Math.max(0, W.snowDepth - simDt/86400*0.1);

  // Saisons — année de 365 jours
  if(W.day >= 365) {
    W.day = 0;
    W.year--;  // compte à rebours BP
    addChron(`An ${W.year} BP`,'📅');
  }
  const si = Math.floor((W.day/365)*4)%4;
  const ns = SEASONS[si];
  if(ns !== W.season) {
    W.season = ns;
    log(`${SIC[ns]} Nouvelle saison : ${_seasonName(ns)}`,'world');
    addChron(`${_seasonName(ns)} — an ${W.year} BP`, SIC[ns]);
    // Transition météo saisonnière
    if(ns==='winter') { W.weather='snow'; W.snowDepth=0.1; }
    if(ns==='spring') { W.weather='rain'; W.snowDepth=0; }
    if(ns==='summer') { W.weather='clear'; }
    if(ns==='autumn') { W.weather='cloudy'; }
  }

  // Température : base saison + heure + météo + vent
  const hourMod = Math.sin((W.hour-6)/24*Math.PI*2)*7;
  const wxMod = {clear:3,cloudy:0,rain:-3,storm:-6,snow:-8,blizzard:-15}[W.weather]||0;
  W.temp = STEMP[W.season] + hourMod + wxMod;

  // Vent
  W.windStr = Math.max(0.05, Math.min(1, W.windStr + (Math.random()-.5)*0.05));
  W.windDir = (W.windDir + (Math.random()-.5)*0.1 + Math.PI*2) % (Math.PI*2);

  // Énergie divine
  W.divEnergy = Math.min(CFG.DIVINE_MAX, W.divEnergy + CFG.DIVINE_REGEN*simDt/60);

  return simDt;
}

function _seasonName(s) {
  return {spring:'Printemps',summer:'Été',autumn:'Automne',winter:'Hiver'}[s]||s;
}

function _changeWeather() {
  // Matrice de transition météo selon saison
  const M = {
    spring: {clear:.4,cloudy:.3,rain:.25,storm:.05},
    summer: {clear:.55,cloudy:.25,rain:.12,storm:.08},
    autumn: {clear:.3,cloudy:.35,rain:.25,storm:.1},
    winter: {snow:.45,blizzard:.15,cloudy:.25,clear:.15},
  };
  const table = M[W.season]||M.spring;
  let r=Math.random(), tot=0;
  for(const [k,v] of Object.entries(table)) {
    tot+=v; if(r<tot){ W.weather=k; break; }
  }
  // Log événements météo significatifs
  if(W.weather==='blizzard') log('🌪 Blizzard! Il faut s\'abriter!','danger');
  if(W.weather==='storm')    log('⛈ Orage violent sur la région.','danger');
  if(W.weather==='snow'&&W.season==='winter') log('🌨 Il neige.','world');
}

function isNight() { return W.hour<6 || W.hour>20; }
function isDawn()  { return W.hour>=5 && W.hour<7; }
function isDusk()  { return W.hour>=18 && W.hour<21; }

function sunI() {
  const h=W.hour;
  if(h<6||h>20) return 0.02;
  if(h<8) return (h-6)/2*.8;
  if(h>18) return (20-h)/2*.8;
  return 0.8 + Math.sin((h-8)/10*Math.PI)*0.2;
}

function updateVisuals(at) {
  const si = sunI();
  const sc = skyC();
  if(SC.sky?.material?.uniforms) {
    SC.sky.material.uniforms.top.value.setHex(sc[0]);
    SC.sky.material.uniforms.bot.value.setHex(sc[1]);
  }
  const sa = ((W.hour/24)*Math.PI*2)-Math.PI/2;
  const ss = SC.scene.getObjectByName('sunSph');
  const ms = SC.scene.getObjectByName('moonSph');
  if(ss){ss.position.set(Math.cos(sa)*1000,Math.sin(sa)*1000,0);ss.visible=!isNight();}
  if(ms){ms.position.set(-Math.cos(sa)*800,Math.sin(sa+Math.PI)*.65*800,0);ms.visible=isNight();}

  const wm={clear:1,cloudy:0.7,rain:0.5,storm:0.3,snow:0.6,blizzard:0.2}[W.weather]||1;
  if(SC.sun){ SC.sun.intensity=si*1.4*wm; const sa2=((W.hour-6)/12)*Math.PI; SC.sun.position.set(Math.cos(sa2)*360,Math.abs(Math.sin(sa2))*460+20,180); }
  if(SC.ambient) SC.ambient.intensity=0.12+si*0.44;

  const fd={clear:.0010,cloudy:.0016,rain:.0028,storm:.005,snow:.0022,blizzard:.008}[W.weather]||.0012;
  SC.scene.fog.density=fd;
  SC.scene.fog.color.setHex(sc[1]);
  SC.renderer.setClearColor(SC.scene.fog.color);

  // Pluie/neige visuelle
  const rn=SC.scene.getObjectByName('rain');
  if(rn) {
    const ir=W.weather==='rain'||W.weather==='storm'||W.weather==='snow'||W.weather==='blizzard';
    rn.visible=ir;
    if(ir&&SC._rv) {
      const p=SC._rv, cam=SC.camera.position;
      const isSnow=W.weather==='snow'||W.weather==='blizzard';
      const fall=isSnow?0.3:0.9+(W.weather==='storm'?0.9:0);
      const windX=Math.sin(W.windDir)*W.windStr*(isSnow?0.4:0.1);
      for(let i=1;i<p.length;i+=3) {
        p[i]-=fall; p[i-1]+=windX;
        if(p[i]<0){p[i]=85;p[i-1]=cam.x+(Math.random()-.5)*280;p[i+1]=cam.z+(Math.random()-.5)*280;}
      }
      // Couleur : blanc pour neige, bleu pour pluie
      rn.material.color.setHex(isSnow?0xddddff:0x8ab4d0);
      rn.geometry.attributes.position.needsUpdate=true;
    }
  }

  // Brume hivernale
  if(W.season==='winter') SC.scene.fog.density *= 1.3;
}

function skyC() {
  const h=W.hour, w=W.weather;
  if(w==='blizzard') return[0x303040,0x404050];
  if(w==='storm')    return[0x1a1a2e,0x2a2a3e];
  if(w==='snow')     return[0x8090a8,0xb0bcc8];
  if(w==='rain')     return[0x4a5a6a,0x6a7a8a];
  if(h<5||h>21)      return[0x020210,0x080618];
  if(h<7)            return[0x1a1060,0xe07040];
  if(h<9)            return[0x4070c0,0xf09060];
  if(h>19)           return[0x2040a0,0xf06030];
  if(W.season==='winter') return[0x5070a0,0x90a8c0];
  if(W.season==='autumn') return[0x5060a0,0x9888a0];
  return[0x4080d0,0x80b8e0];
}