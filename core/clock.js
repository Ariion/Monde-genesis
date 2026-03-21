// GENESIS — core/clock.js — Horloge & météo

// ── HORLOGE & VISUEL ─────────────────────────────────────────────────
const SEASONS=['spring','summer','autumn','winter'];
const SIC={spring:'🌸',summer:'☀️',autumn:'🍂',winter:'❄️'};
const WIC={clear:'☀️',cloudy:'⛅',rain:'🌧️',storm:'⛈️'};
const STEMP={spring:14,summer:26,autumn:10,winter:-6};

function tickClock(realMs) {
  const simDt=(realMs/1000)*W.speed*(86400/CFG.DAY_SEC);
  W.totalSim+=simDt;
  W.hour+=simDt/3600;
  if(W.hour>=24){
    W.hour-=24;W.day++;
    if(Math.random()<.28)_wx();
  }
  if(W.day>=365){W.day=0;W.year++;addChron(`L'An ${W.year+1}`,'🎆');}
  const si=Math.floor((W.day/365)*4)%4;
  const ns=SEASONS[si];
  if(ns!==W.season){W.season=ns;log(`${SIC[ns]} ${ns}`,'world');addChron(`Saison : ${ns}`,SIC[ns]);}
  W.temp=STEMP[W.season]+Math.sin((W.hour-6)/24*Math.PI*2)*7+({clear:2,cloudy:0,rain:-4,storm:-8}[W.weather]||0);
  W.divEnergy=Math.min(CFG.DIVINE_MAX,W.divEnergy+CFG.DIVINE_REGEN*simDt/60);
  return simDt;
}

function _wx(){
  const T={clear:{clear:.62,cloudy:.26,rain:.10,storm:.02},cloudy:{clear:.28,cloudy:.34,rain:.26,storm:.12},rain:{clear:.18,cloudy:.26,rain:.36,storm:.20},storm:{clear:.16,cloudy:.22,rain:.36,storm:.26}};
  let r=Math.random(),tot=0;
  for(const[k,v]of Object.entries(T[W.weather]||T.clear)){tot+=v;if(r<tot){W.weather=k;break;}}
}

function isNight(){return W.hour<6||W.hour>20;}
function sunI(){const h=W.hour;if(h<6||h>20)return.02;if(h<8)return(h-6)/2*.8;if(h>18)return(20-h)/2*.8;return.8+Math.sin((h-8)/10*Math.PI)*.2;}

function updateVisuals(at){
  const si=sunI();
  const sc=skyC();
  if(SC.sky?.material?.uniforms){SC.sky.material.uniforms.top.value.setHex(sc[0]);SC.sky.material.uniforms.bot.value.setHex(sc[1]);}
  const sa=((W.hour/24)*Math.PI*2)-Math.PI/2;
  const ss=SC.scene.getObjectByName('sunSph'),ms=SC.scene.getObjectByName('moonSph');
  if(ss){ss.position.set(Math.cos(sa)*1000,Math.sin(sa)*1000,0);ss.visible=!isNight();}
  if(ms){ms.position.set(-Math.cos(sa)*800,Math.sin(sa+Math.PI)*.65*800,0);ms.visible=isNight();}
  const wm=W.weather==='storm'?.18:W.weather==='rain'?.44:1;
  if(SC.sun){SC.sun.intensity=si*1.4*wm;const sa2=((W.hour-6)/12)*Math.PI;SC.sun.position.set(Math.cos(sa2)*360,Math.abs(Math.sin(sa2))*460+20,180);}
  if(SC.ambient)SC.ambient.intensity=.12+si*.44;
  const fd={clear:.0012,cloudy:.0018,rain:.0026,storm:.004}[W.weather]||.0012;
  SC.scene.fog.density=fd;SC.scene.fog.color.setHex(sc[1]);SC.renderer.setClearColor(SC.scene.fog.color);
  if(TR.water){TR.water.material.opacity=.68+Math.sin(at*.4)*.06;TR.water.position.y=.25+Math.sin(at*.28)*.1;}
  const rn=SC.scene.getObjectByName('rain');
  if(rn){
    const ir=W.weather==='rain'||W.weather==='storm';rn.visible=ir;
    if(ir&&SC._rv){
      const p=SC._rv,cam=SC.camera.position,fall=.9+(W.weather==='storm'?.9:0);
      for(let i=1;i<p.length;i+=3){p[i]-=fall;if(p[i]<0){p[i]=85;p[i-1]=cam.x+(Math.random()-.5)*280;p[i+1]=cam.z+(Math.random()-.5)*280;}}
      rn.geometry.attributes.position.needsUpdate=true;
    }
  }
}

function skyC(){
  const h=W.hour,w=W.weather;
  if(w==='storm')return[0x1a1a2e,0x2a2a3e];if(w==='rain')return[0x4a5a6a,0x6a7a8a];
  if(h<5||h>21)return[0x020210,0x0a0820];if(h<7)return[0x1a1060,0xe07040];
  if(h<9)return[0x4070c0,0xf09060];if(h>19)return[0x2040a0,0xf06030];
  if(W.season==='winter')return[0x6080b0,0xa0b8c8];return[0x4080d0,0x80b8e0];
}

// ── ESPÈCES ANIMALES ─────────────────────────────────────────────────
