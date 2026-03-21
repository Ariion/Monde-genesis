// GENESIS — ui/raycaster.js — Sélection entités

// ── RAYCASTER ────────────────────────────────────────────────────────
function initRaycaster(){
  const cv=SC.renderer.domElement,rc=new THREE.Raycaster(),mouse=new THREE.Vector2(),tip=document.getElementById('tip');
  let tipT=null;
  function getEnt(x,y){
    const r=cv.getBoundingClientRect();mouse.x=((x-r.left)/r.width)*2-1;mouse.y=-((y-r.top)/r.height)*2+1;
    rc.setFromCamera(mouse,SC.camera);
    const hits=rc.intersectObjects(SC.scene.children,true);
    for(const h of hits){let o=h.object;while(o&&!o.userData?.eid)o=o.parent;if(o?.userData?.eid){const e=[...W.humans,...W.animals].find(x=>x.id===o.userData.eid&&x.alive);if(e)return e;}}
    return null;
  }
  cv.addEventListener('click',e=>{if(e.button!==0)return;const ent=getEnt(e.clientX,e.clientY);if(ent){CAM.target=ent;G.cam('insp');}});
  cv.addEventListener('mousemove',e=>{
    clearTimeout(tipT);
    const ent=getEnt(e.clientX,e.clientY);
    if(ent){
      tip.style.display='block';tip.style.left=(e.clientX+16)+'px';tip.style.top=(e.clientY-8)+'px';
      const stg=ent.type_==='human'?CFG.SPECIES_STAGES[getSpeciesStage(ent.gen||1)]?.name:'';
      tip.innerHTML=ent.type_==='human'
        ?`<b style="color:#c89050">${ent.name}</b> (${ent.sex==='M'?'♂':'♀'})<br>
          ${ent.age.toFixed(1)} ans · Gén.${ent.gen}<br>
          <i style="color:#888">${stg}</i><br>
          ❤ ${ent.health.toFixed(0)}% · 🍖 ${ent.hunger.toFixed(0)}%<br>
          Émotion : <span style="color:${EMOTIONS[ent.emotion]?.col||'#888'}">${EMOTIONS[ent.emotion]?.name||'?'}</span><br>
          <i style="color:#888">"${ent.thought}"</i><br>
          <small style="color:#506070">Clic → Inspecter</small>`
        :`<b style="color:#c8b880">${ent.name}</b> ${ent.sex==='M'?'♂':'♀'}<br>❤ ${(ent.hp/ent.sp.hp*100).toFixed(0)}%<br><small style="color:#506070">Clic → Inspecter</small>`;
      tipT=setTimeout(()=>tip.style.display='none',3000);return;
    }
    tip.style.display='none';
  });
}

// ── HUD ──────────────────────────────────────────────────────────────
const CHRON_LIST=[];
