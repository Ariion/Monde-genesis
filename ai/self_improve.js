// GENESIS — ai/self_improve.js — Auto-amélioration IA

// ═══════════════════════════════════════════════════════════════════
// GENESIS AUTO-IMPROVEMENT SYSTEM
// Surveille les métriques, détecte les bugs, appelle l'API Claude,
// applique les patches directement en mémoire.
// ═══════════════════════════════════════════════════════════════════
const AI = (() => {
  // ── ÉTAT ──────────────────────────────────────────────────────────
  const STATE = {
    minimized: false,
    running: false,
    checkInterval: null,
    history: [],          // log des actions IA
    snapshots: [],        // métriques historiques
    lastCheck: Date.now(),
    totalFixes: 0,
    patchHistory: [],     // patches appliqués (pour rollback)
  };

  // ── MÉTRIQUES ─────────────────────────────────────────────────────
  function getMetrics() {
    const alive     = W.humans.filter(h=>h.alive);
    const now       = Date.now();
    const elapsed   = (now - STATE.lastCheck)/60000; // minutes
    const newDeaths = W.deaths - (STATE.snapshots[STATE.snapshots.length-1]?.deaths||W.deaths);
    const dpm       = elapsed > 0 ? (newDeaths/elapsed).toFixed(1) : '0';
    const avgHealth = alive.length
      ? (alive.reduce((s,h)=>s+h.health,0)/alive.length).toFixed(0)
      : 0;
    const avgHunger = alive.length
      ? (alive.reduce((s,h)=>s+h.hunger,0)/alive.length).toFixed(0)
      : 100;
    const moving    = alive.filter(h=>!['idle','sleep','eat'].includes(h.state)).length;
    const pregnant  = alive.filter(h=>h.pregnant).length;
    const hasClan   = W.clans.length > 0;

    return {
      alive:      alive.length,
      births:     W.births,
      deaths:     W.deaths,
      dpm:        parseFloat(dpm),
      avgHealth:  parseFloat(avgHealth),
      avgHunger:  parseFloat(avgHunger),
      moving,
      pregnant,
      hasClan,
      speed:      W.speed,
      day:        W.day,
      year:       W.year,
    };
  }

  // ── DÉTECTION D'ANOMALIES ─────────────────────────────────────────
  function detectAnomalies(m) {
    const issues = [];

    if (m.alive === 0)
      issues.push({ severity:'critical', msg:'Extinction totale — Adam et Ève sont morts', code:'EXTINCTION' });
    if (m.alive < 2 && W.births <= 2)
      issues.push({ severity:'critical', msg:'Population critique sans reproduction', code:'NO_REPRO' });
    if (m.dpm > 2 && m.alive > 0)
      issues.push({ severity:'high', msg:`Taux de mort élevé: ${m.dpm}/min`, code:'HIGH_DEATH_RATE' });
    if (m.avgHealth < 30 && m.alive > 0)
      issues.push({ severity:'high', msg:`Santé moyenne critique: ${m.avgHealth}%`, code:'LOW_HEALTH' });
    if (m.avgHunger < 20 && m.alive > 0)
      issues.push({ severity:'high', msg:`Famine généralisée: ${m.avgHunger}%`, code:'FAMINE' });
    if (m.moving === 0 && m.alive > 0 && !W.paused)
      issues.push({ severity:'high', msg:'Tous les humains sont immobiles (bug IA?)', code:'FROZEN' });
    if (m.births <= 2 && m.day > 30 && m.alive >= 2)
      issues.push({ severity:'medium', msg:`Pas de naissance après ${m.day} jours`, code:'NO_BIRTHS' });
    if (W.animals.length < 5)
      issues.push({ severity:'medium', msg:`Faune appauvrie: ${W.animals.length} animaux`, code:'FEW_ANIMALS' });

    // Vérifier NaN dans positions
    const nanHuman = W.humans.find(h=>h.alive&&(isNaN(h.x)||isNaN(h.z)||isNaN(h.y)));
    if (nanHuman)
      issues.push({ severity:'critical', msg:`NaN détecté dans position de ${nanHuman.name}`, code:'NAN_POS' });

    return issues;
  }

  // ── EXTRAIRE LE CODE SOURCE PERTINENT ─────────────────────────────
  function extractRelevantCode(issueCode) {
    // Récupérer le code source des fonctions problématiques
    const sources = {};

    try {
      // Méthodes clés de Human
      sources.human_needs    = Human.prototype._needs?.toString()   || 'non trouvé';
      sources.human_ai       = Human.prototype._ai?.toString()      || 'non trouvé';
      sources.human_move     = Human.prototype._move?.toString()    || 'non trouvé';
      sources.human_choose   = Human.prototype._chooseState?.toString() || 'non trouvé';
      sources.human_forage   = Human.prototype._doForage?.toString() || 'non trouvé';
      sources.tickEco        = tickEco?.toString()                  || 'non trouvé';
      sources.CFG_extract    = `HUNGER_RATE:${CFG.HUNGER_RATE}, THIRST_RATE:${CFG.THIRST_RATE}, DAY_SEC:${CFG.DAY_SEC}, speed:${W.speed}`;
    } catch(e) {
      sources.error = e.message;
    }

    // Sélectionner selon l'issue
    if (issueCode === 'FROZEN') return { human_ai: sources.human_ai, human_move: sources.human_move, human_choose: sources.human_choose };
    if (issueCode === 'FAMINE' || issueCode === 'HIGH_DEATH_RATE') return { human_needs: sources.human_needs, CFG: sources.CFG_extract };
    if (issueCode === 'NO_REPRO' || issueCode === 'NO_BIRTHS') return { human_choose: sources.human_choose, human_forage: sources.human_forage };
    if (issueCode === 'NAN_POS') return { human_move: sources.human_move, tickEco: sources.tickEco };
    return sources;
  }

  // ── APPEL API CLAUDE ──────────────────────────────────────────────
  async function callClaude(issues, metrics) {
    const topIssue = issues[0];
    const relevantCode = extractRelevantCode(topIssue.code);

    const prompt = `Tu es un expert en JavaScript qui corrige le moteur de simulation GENESIS.

PROBLÈME DÉTECTÉ: ${topIssue.msg} (code: ${topIssue.code})

MÉTRIQUES ACTUELLES:
- Humains vivants: ${metrics.alive}
- Santé moyenne: ${metrics.avgHealth}%
- Faim moyenne: ${metrics.avgHunger}%
- Taux mort/min: ${metrics.dpm}
- En mouvement: ${metrics.moving}/${metrics.alive}
- Naissances: ${metrics.births}
- Jour simulé: ${metrics.day}, An: ${metrics.year}
- CFG: ${JSON.stringify({HUNGER_RATE:CFG.HUNGER_RATE,THIRST_RATE:CFG.THIRST_RATE,DAY_SEC:CFG.DAY_SEC,speed:W.speed})}

CODE SOURCE PROBLÉMATIQUE:\n${Object.entries(relevantCode).map(([k,v])=>'// === '+k+' ===\n'+v).join('\n---\n')}\n\nAUTRES PROBLÈMES: ${issues.slice(1).map(i=>i.msg).join(', ')||'aucun'}

Ta mission: générer UN patch JavaScript minimal qui corrige le problème principal.

RÉPONDS UNIQUEMENT avec un objet JSON de ce format EXACT (pas de markdown, pas d'explication):
{
  "diagnosis": "explication courte du bug en 1 phrase",
  "patch_type": "function_replace" | "cfg_adjust" | "emergency_heal",
  "patches": [
    {
      "target": "nom de la fonction ou propriété à modifier",
      "old_snippet": "extrait EXACT du code à remplacer (5-15 lignes max)",
      "new_snippet": "nouveau code corrigé",
      "reason": "pourquoi ce changement"
    }
  ]
}

RÈGLES ABSOLUES:
- Ne propose QUE des changements sûrs et testables
- old_snippet doit être EXACTEMENT dans le code source fourni
- Préfère ajuster CFG plutôt que réécrire des fonctions entières
- Pour emergency_heal: propose du code JS direct à eval() sans patches
- Maximum 3 patches par réponse`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error(`API ${response.status}: ${response.statusText}`);
    const data = await response.json();
    const text = data.content[0]?.text || '';

    // Parser le JSON — extraire même si entouré de markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse non parseable: ' + text.slice(0,100));
    return JSON.parse(jsonMatch[0]);
  }

  // ── APPLIQUER UN PATCH ────────────────────────────────────────────
  function applyPatch(patch) {
    if (patch.patch_type === 'emergency_heal') {
      // Code direct à exécuter
      aiLog(`⚡ Soin d'urgence: ${patch.patches[0]?.reason||''}`, 'fix');
      const alive = W.humans.filter(h=>h.alive);
      alive.forEach(h=>{
        h.health=Math.min(100,h.health+40);
        h.hunger=Math.min(100,h.hunger+35);
        h.thirst=Math.min(100,h.thirst+35);
        h.warmth=Math.min(100,h.warmth+30);
        h.energy=Math.min(100,h.energy+30);
        if(h.state==='flee')h.state='explore';
      });
      // Respawn animaux si nécessaire
      if(W.animals.length<20){
        const types=Object.keys(SP).filter(k=>!SP[k].danger&&!SP[k].aquatic);
        for(let i=0;i<8;i++){
          const t=types[Math.floor(Math.random()*types.length)];
          const pos=randLand(3,70);
          const a=new Animal(t,pos.x,pos.y,pos.z);
          W.animals.push(a);buildAnimalMesh(a);SC.scene.add(a.mesh);
        }
      }
      return { success:true, applied:1 };
    }

    if (patch.patch_type === 'cfg_adjust') {
      let applied = 0;
      for (const p of patch.patches) {
        try {
          // Sécurité: seulement des clés numériques de CFG
          if (p.target && p.target.startsWith('CFG.')) {
            const key = p.target.replace('CFG.','');
            const val = parseFloat(p.new_snippet);
            if (!isNaN(val) && CFG.hasOwnProperty(key) && typeof CFG[key]==='number') {
              const old = CFG[key];
              CFG[key] = val;
              aiLog(`⚙ CFG.${key}: ${old} → ${val}`, 'fix');
              applied++;
            }
          }
        } catch(e) { aiLog(`✗ Patch CFG échoué: ${e.message}`, 'err'); }
      }
      return { success: applied > 0, applied };
    }

    if (patch.patch_type === 'function_replace') {
      let applied = 0;
      for (const p of patch.patches) {
        try {
          // Sauvegarde avant patch
          STATE.patchHistory.push({
            target: p.target, old: p.old_snippet,
            timestamp: Date.now()
          });

          // Chercher la fonction dans le prototype Human
          const targets = [Human.prototype, window];
          let patched = false;

          for (const obj of targets) {
            const fn = obj[p.target];
            if (typeof fn !== 'function') continue;
            const src = fn.toString();
            if (!src.includes(p.old_snippet.trim().slice(0,30))) continue;

            const newSrc = src.replace(p.old_snippet, p.new_snippet);
            try {
              // Reconstruire la fonction avec eval sécurisé
              const newFn = new Function('return ' + newSrc)();
              obj[p.target] = newFn;
              aiLog(`✓ Patché: ${p.target} — ${p.reason}`, 'fix');
              applied++;
              patched = true;
            } catch(evalErr) {
              aiLog(`✗ Eval échoué pour ${p.target}: ${evalErr.message}`, 'err');
            }
            break;
          }
          if (!patched) aiLog(`⚠ Cible non trouvée: ${p.target}`, 'warn');
        } catch(e) {
          aiLog(`✗ Patch échoué: ${e.message}`, 'err');
        }
      }
      return { success: applied > 0, applied };
    }

    return { success:false, applied:0 };
  }

  // ── BOUCLE PRINCIPALE ─────────────────────────────────────────────
  async function analyze() {
    if (STATE.running) return;
    STATE.running = true;

    const trigger = document.getElementById('ai-trigger');
    const thinking = document.getElementById('ai-thinking');
    if (trigger) trigger.disabled = true;
    if (thinking) thinking.style.display = 'block';
    setStatus('Claude analyse la simulation…');

    try {
      const m = getMetrics();
      STATE.snapshots.push({ ...m, timestamp: Date.now() });
      if (STATE.snapshots.length > 20) STATE.snapshots.shift();
      STATE.lastCheck = Date.now();

      updateMetricsUI(m);

      const issues = detectAnomalies(m);
      if (issues.length === 0) {
        setStatus(`✓ Simulation saine — ${m.alive} vivants, ${m.births} naissances`);
        aiLog(`✓ Aucune anomalie. Santé: ${m.avgHealth}%, Faim: ${m.avgHunger}%`, 'fix');
        return;
      }

      // Log des issues
      issues.forEach(i => aiLog(`${i.severity==='critical'?'🔴':i.severity==='high'?'🟠':'🟡'} ${i.msg}`, 'warn'));
      setStatus(`Problème détecté: ${issues[0].msg}`);

      // Appel Claude
      aiLog('🧬 Envoi à Claude pour analyse…', 'entry');
      const result = await callClaude(issues, m);

      aiLog(`💡 Diagnostic: ${result.diagnosis}`, 'fix');
      setStatus(`Patch en cours: ${result.diagnosis}`);

      // Appliquer
      const { success, applied } = applyPatch(result);
      if (success) {
        STATE.totalFixes++;
        aiLog(`✅ ${applied} patch(es) appliqué(s) — correction #${STATE.totalFixes}`, 'fix');
        setStatus(`✅ Corrigé: ${result.diagnosis}`);
      } else {
        // Fallback: soin d'urgence si tout échoue
        if (issues.some(i=>i.severity==='critical')) {
          aiLog('🚨 Patch échoué, soin urgence', 'warn');
          const alive = W.humans.filter(h=>h.alive);
          alive.forEach(h=>{h.health=80;h.hunger=70;h.thirst=70;h.warmth=90;h.energy=75;});
          setStatus('🚨 Soin urgence appliqué');
        } else {
          setStatus('⚠ Patch non applicable — surveillance continue');
        }
      }

    } catch(err) {
      aiLog(`✗ Erreur: ${err.message}`, 'err');
      setStatus(`⚠ Erreur API: ${err.message.slice(0,50)}`);
      console.error('[AI]', err);
    } finally {
      STATE.running = false;
      if (trigger) trigger.disabled = false;
      if (thinking) thinking.style.display = 'none';
    }
  }

  // ── AUTO-SURVEILLANCE ─────────────────────────────────────────────
  function startWatching() {
    // Check toutes les 30 secondes réelles
    STATE.checkInterval = setInterval(() => {
      if (STATE.running) return;
      const m = getMetrics();
      updateMetricsUI(m);

      // Auto-trigger si situation critique
      const issues = detectAnomalies(m);
      const critical = issues.filter(i=>i.severity==='critical');
      if (critical.length > 0 && !STATE.running) {
        aiLog(`🚨 Situation critique détectée: ${critical[0].msg}`, 'err');
        aiLog('🤖 Déclenchement automatique analyse…', 'warn');
        analyze();
      }
    }, 30000);

    // Check léger toutes les 5s pour les métriques
    setInterval(() => {
      if (!STATE.running) updateMetricsUI(getMetrics());
    }, 5000);
  }

  // ── UI HELPERS ────────────────────────────────────────────────────
  function setStatus(msg) {
    const el = document.getElementById('ai-status');
    if (el) el.textContent = msg;
  }

  function aiLog(msg, cls='entry') {
    STATE.history.unshift({ msg, cls, t: Date.now() });
    if (STATE.history.length > 30) STATE.history.pop();
    const el = document.getElementById('ai-log');
    if (!el) return;
    el.innerHTML = STATE.history.slice(0,12).map(e=>
      `<div class="entry ${e.cls}">${e.msg}</div>`
    ).join('');
  }

  function updateMetricsUI(m) {
    const sv = (id,v,cls='') => {
      const e = document.getElementById(id);
      if (e) { e.textContent = v; e.className = `val ${cls}`; }
    };
    sv('aim-alive',  m.alive,   m.alive===0?'bad':m.alive<2?'warn':'ok');
    sv('aim-births', m.births,  m.births<=2&&m.day>20?'warn':'ok');
    sv('aim-dpm',    m.dpm+'/m',m.dpm>2?'bad':m.dpm>0.5?'warn':'ok');
    sv('aim-health', m.avgHealth+'%', m.avgHealth<30?'bad':m.avgHealth<60?'warn':'ok');
  }

  // ── API PUBLIQUE ──────────────────────────────────────────────────
  return {
    runNow() { analyze(); },
    toggle() {
      const panel = document.getElementById('ai-panel');
      STATE.minimized = !STATE.minimized;
      panel.classList.toggle('minimized', STATE.minimized);
    },
    start() {
      aiLog('🌍 GENESIS Auto-Amélioration démarrée', 'fix');
      setStatus('Surveillance active — vérifie toutes les 30s');
      startWatching();
    },
    getHistory() { return STATE.history; },
    getPatchHistory() { return STATE.patchHistory; },
  };
})();

// Démarrer après chargement
setTimeout(()=>AI.start(), 3000);
