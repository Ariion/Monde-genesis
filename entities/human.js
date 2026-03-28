// GENESIS — entities/human.js
// Homo sapiens, -12 000 BP
// IA basée sur personnalité, mémoire et besoins psychologiques


if (window.__human_loaded__) {
  throw new Error("human.js chargé deux fois");
}
window.__human_loaded__ = true;


const HNAMES=['Auk','Brak','Cael','Dara','Eron','Fara','Gal','Hara','Iru','Kael',
  'Lara','Mael','Nara','Oran','Pira','Rael','Sela','Tara','Urak','Vera',
  'Wara','Xael','Yara','Zael','Arak','Bela','Cira','Dorn','Eral','Feln',
  'Gora','Heln','Ivar','Jael','Kira','Lorn','Mira','Nael','Oral','Pela'];

const SK_KEYS=['chasse','cueillette','feu','abri','langage','outil'];
const SK_EMO  ={chasse:'🏹',cueillette:'🌿',feu:'🔥',abri:'🏕',langage:'🗣',outil:'🪨'};

function distCamp(e){ return Math.hypot(e.x-CAMP.x, e.z-CAMP.z); }

// ── PERSONNALITÉS POSSIBLES ───────────────────────────────────────────────────
// Chaque trait est un modificateur sur les décisions
const PERSONALITIES = [
  { name:'Courageux',   brave:1.6,  curious:.8,  social:.5,  cautious:.3  },
  { name:'Prudent',     brave:.4,   curious:.5,  social:.7,  cautious:1.8 },
  { name:'Curieux',     brave:.8,   curious:1.8, social:.6,  cautious:.5  },
  { name:'Protecteur',  brave:1.2,  curious:.4,  social:1.5, cautious:.8  },
  { name:'Solitaire',   brave:1.0,  curious:1.0, social:.2,  cautious:.9  },
  { name:'Chaleureux',  brave:.7,   curious:.6,  social:1.8, cautious:.7  },
  { name:'Téméraire',   brave:2.0,  curious:1.2, social:.4,  cautious:.1  },
  { name:'Sage',        brave:.6,   curious:1.4, social:1.1, cautious:1.3 },
];

// ── PENSÉES CONTEXTUELLES ─────────────────────────────────────────────────────
const THOUGHTS = {
  hunt_success:   ['Je suis le meilleur chasseur.','Le groupe ne mourra pas de faim.','Je les ai nourris.'],
  hunt_fail:      ['La proie était trop rapide.','Je dois m\'améliorer.','Demain sera meilleur.'],
  hunt_tracking:  ['Je vois ses traces.','Doucement…','Pas un bruit.','Presque…'],
  forage:         ['Ces baies sont bonnes.','Je connais cet endroit.','Encore un peu…','La terre est généreuse.'],
  fire:           ['Le feu est notre vie.','Sans feu, nous mourons.','Nourrir les flammes.'],
  cold:           ['Je gèle.','Trouver le feu.','Mes enfants ont froid.','Danger…'],
  hungry:         ['Mon ventre crie.','Il faut manger.','Partir chasser.'],
  thirsty:        ['Soif…','L\'eau est loin.','Mes lèvres saignent.'],
  danger:         ['Fuyons!','Vite!','Protéger les enfants!','Courir!'],
  injured:        ['Ma blessure saigne.','Je dois me reposer.','Ça fait mal.'],
  sick:           ['Je me sens mourir.','La fièvre me ronge.','Hara peut m\'aider.'],
  partner:        ['Je pense à toi.','Ensemble nous sommes plus forts.','Je t\'aime.'],
  child_watch:    ['Reste près de moi.','Ne t\'éloigne pas.','Mon enfant…'],
  sleep:          ['Enfin le repos.','Zzz…','Le feu nous garde.'],
  explore:        ['Qu\'y a-t-il là-bas?','Ce rocher est étrange.','Je découvre le monde.'],
  social:         ['Nous sommes une famille.','Ensemble.','Je les protège tous.'],
  build:          ['Ces murs nous abriteront.','Pierre sur pierre.','Construire pour durer.'],
  teach:          ['Écoute, petit.','C\'est ainsi qu\'on fait le feu.','Apprends de moi.'],
  idle_brave:     ['Je surveille l\'horizon.','Rien ne nous menace.','Je suis prêt.'],
  idle_curious:   ['Qu\'est-ce que ce bruit?','Je dois voir par là.','Tout m\'intéresse.'],
  idle_social:    ['Je veux être près d\'eux.','Le groupe est ma force.','Rester ensemble.'],
  idle_elder:     ['J\'ai vu tant d\'hivers.','Les jeunes ne savent pas encore.','Le temps passe.'],
  idle_child:     ['Je veux jouer!','C\'est quoi ça?','Je cours!'],
  grief:          ['Il me manque.','Elle était ma sœur.','Je n\'oublie pas.'],
};

function pickThought(keys) {
  const pool = keys.flatMap(k => THOUGHTS[k]||[]);
  return pool.length ? pool[Math.floor(Math.random()*pool.length)] : '…';
}

// ── MÉMOIRE D'UN INDIVIDU ────────────────────────────────────────────────────
class Memory {
  constructor(){
    this.foodSpots   = [];  // {x,z,quality,lastSeen} — endroits où il a trouvé de la nourriture
    this.waterSpots  = [];  // {x,z,lastSeen}
    this.dangerSpots = [];  // {x,z,threatType,time}
    this.deaths      = [];  // noms des membres du groupe morts qu'il a connus
    this.kills       = 0;   // nombre de proies tuées
    this.winters     = 0;   // hivers survécus — sagesse
  }

  rememberFood(x,z,quality){
    const near=this.foodSpots.find(s=>Math.hypot(s.x-x,s.z-z)<20);
    if(near){ near.quality=(near.quality+quality)/2; near.lastSeen=W.totalSim; }
    else{ this.foodSpots.push({x,z,quality,lastSeen:W.totalSim}); }
    if(this.foodSpots.length>8) this.foodSpots.shift();
  }

  bestFoodSpot(){
    if(!this.foodSpots.length) return null;
    // Préférer les endroits récents et de bonne qualité
    return this.foodSpots
      .filter(s=>W.totalSim-s.lastSeen < 5*86400)  // vu dans les 5 derniers jours
      .sort((a,b)=>b.quality-a.quality)[0] || null;
  }

  rememberDanger(x,z,type){
    this.dangerSpots.push({x,z,threatType:type,time:W.totalSim});
    if(this.dangerSpots.length>5) this.dangerSpots.shift();
  }

  isDangerous(x,z){
    return this.dangerSpots.some(s=>
      Math.hypot(s.x-x,s.z-z)<30 && W.totalSim-s.time < 2*86400
    );
  }
}

class Human {
  constructor(name,sex,x,y,z,gen=1,pA=null,pB=null){
    this.id=++_eid; this.name=name; this.sex=sex;
    this.type_='human'; this.alive=true;
    this.x=x; this.y=y; this.z=z;
    this.tx=x; this.tz=z; this.rot=0;
    this.gen=gen;
    this.age=(['Adam','Ève'].includes(name))?22+Math.random()*6:0;

    // Besoins physiques
    this.health=100; this.hunger=85+Math.random()*10;
    this.thirst=80+Math.random()*15;
    this.warmth=85; this.energy=85+Math.random()*10;

    // Besoins psychologiques [0-100]
    // Tombent lentement, influencent les décisions quand ils sont bas
    this.psych = {
      safety:     80+Math.random()*15,  // sécurité — monte près du camp/feu
      belonging:  75+Math.random()*15,  // appartenance — monte avec le groupe
      purpose:    70+Math.random()*20,  // utilité — monte en faisant sa tâche
      curiosity:  60+Math.random()*30,  // curiosité — monte en explorant
    };

    // Personnalité — tirée aléatoirement, influencée par les parents
    const pIdx = pA?
      Math.floor((PERSONALITIES.indexOf(pA.personality)+Math.floor(Math.random()*3)-1+PERSONALITIES.length)%PERSONALITIES.length)
      : Math.floor(Math.random()*PERSONALITIES.length);
    this.personality = PERSONALITIES[pIdx];

    // État physique
    this.injured=false;
    this.disease=null;
    this.pregnant=false; this.pregTimer=0; this.repCool=0;
    this.carrying=null; this.infant=null;
    this.inv={food:0, wood:0};

    // Compétences héritées + variation
    this.skills = pA&&pB
      ? Object.fromEntries(SK_KEYS.map(k=>[k,
          Math.min(1,((pA.skills[k]||0)+(pB.skills[k]||0))*.42+Math.random()*.05)]))
      : {chasse:.04+Math.random()*.04, cueillette:.05+Math.random()*.04,
         feu:.02+Math.random()*.02, abri:.02, langage:.03, outil:.02};

    this.iq = pA ? Math.min(100,(pA.iq+(pB?.iq||12))*.42+Math.random()*5) : 10+Math.random()*8;

    // Social
    this.partner=null; this.clan=null; this.children=[];
    this.grief=0;      // deuil actif [0-100]

    // IA
    this.state='idle'; this._timer=0; this._target=null;
    this._forageT=0; this._taskTimer=0;
    this.attackCd=0; this.discoveries=[];
    this.emotion='NEUTRAL'; this.thought='…';
    this.inDanger=false; this.mesh=null;
    this._waterTarget=null; this._scoutTarget=null;

    // Mémoire individuelle
    this.memory = new Memory();
  }

  get role(){
    if(this.age<8)  return 'child';
    if(this.age<16) return this.sex==='M'?'scout':'gatherer';
    if(this.age>50) return 'elder';
    return this.sex==='M'?'hunter':'gatherer';
  }

  // ── TICK ─────────────────────────────────────────────────────────────────
  tick(simDt,realDt,all){
    if(!this.alive) return;
    const rs=realDt/1000;

    // Vieillissement
    const ageRate = this.age<5?6:this.age<16?2.5:1;
    this.age += (simDt/(365*86400))*ageRate;
    if(this.age>45){
      if(Math.random()<Math.exp((this.age-45)/12)*0.000008*simDt){ this.die('vieillesse'); return; }
    }

    this._timer   = Math.max(0,this._timer-rs);
    this.attackCd = Math.max(0,this.attackCd-rs);
    if(this.repCool>0) this.repCool-=simDt;
    if(this.grief>0)   this.grief=Math.max(0,this.grief-0.002*simDt);

    // Mémoriser les hivers
    if(W.season==='winter'&&W.day===1) this.memory.winters++;

    this._needs(simDt);
    if(!this.alive) return;

    this._tickPsych(simDt,all);
    this._tickDisease(simDt,all);
    if(!this.alive) return;

    if(this.injured&&this.health>75&&Math.random()<0.00005*simDt) this.injured=false;

    if(this.pregnant){
      this.pregTimer-=simDt;
      if(this.pregTimer<=0) this._birth(all);
    }

    if(this.infant){
      this.infant.age+=(simDt/(365*86400))*6;
      this.infant.x=this.x; this.infant.z=this.z;
      if(this.infant.age>=3){
        W.humans.push(this.infant);
        buildHumanMesh(this.infant); SC.scene.add(this.infant.mesh);
        log(`👣 ${this.infant.name} marche seul(e).`,'social');
        this.infant=null; this.carrying=null;
      }
    }

    // Reproduction
    if(this.partner?.alive&&this.sex==='F'&&!this.pregnant
       &&this.repCool<=0&&this.health>55&&this.hunger>40
       &&this.age>=14&&this.age<=42&&distCamp(this)<35){
      this.pregnant=true;
      this.pregTimer=270*86400;
      this.repCool=18*30*86400;
      log(`🤰 ${this.name} attend un enfant.`,'social');
    }

    this._ai(rs,all);
    this._move(rs);

    if(this.mesh){
      this.y+=(getH(this.x,this.z)-this.y)*.15;
      this.mesh.position.set(this.x,this.y,this.z);
      this.mesh.rotation.y=this.rot;
    }
  }

  // ── BESOINS PHYSIQUES ────────────────────────────────────────────────────
  _needs(simDt){
    const sl=this.state==='sleep'?.08:1;
    const cm=this.age<8?.5:1;

    this.hunger=Math.max(0,this.hunger-CFG.HUNGER_RATE*simDt*sl*cm);
    this.thirst=Math.max(0,this.thirst-CFG.THIRST_RATE*simDt*sl*cm);
    this.energy=this.state==='sleep'
      ?Math.min(100,this.energy+.06*simDt)
      :Math.max(0,this.energy-CFG.ENERGY_RATE*simDt);

    const nearFire  = CAMP.established&&distCamp(this)<22&&CAMP.fireLevel>=1;
    const inShelter = CAMP.shelterLevel>=1&&distCamp(this)<18;
    const bodyHeat  = W.humans.filter(h=>h!==this&&h.alive&&d2(this,h)<6).length>=2;
    const cold=W.temp<5, freezing=W.temp<-5, blizzard=W.weather==='blizzard';

    if(blizzard&&!inShelter&&!nearFire)
      this.warmth=Math.max(0,this.warmth-CFG.WARMTH_RATE*3*simDt);
    else if(freezing&&!nearFire&&!inShelter&&!bodyHeat)
      this.warmth=Math.max(0,this.warmth-CFG.WARMTH_RATE*1.5*simDt);
    else if(cold&&!nearFire&&!bodyHeat)
      this.warmth=Math.max(0,this.warmth-CFG.WARMTH_RATE*.4*simDt);
    else
      this.warmth=Math.min(100,this.warmth+.06*simDt);

    if(this.hunger<=0) this.health=Math.max(0,this.health-.0010*simDt);
    if(this.thirst<=0) this.health=Math.max(0,this.health-.0018*simDt);
    if(this.warmth<=0) this.health=Math.max(0,this.health-.0012*simDt);
    if(this.health<=0){ this.die('survie'); return; }

    if(this.hunger>45&&this.thirst>45&&this.warmth>35&&!this.disease)
      this.health=Math.min(100,this.health+.0015*simDt);

    // Émotion physique dominante
    if(this.inDanger)              this.emotion='TERROR';
    else if(this.health<30)        this.emotion='PAIN';
    else if(this.thirst<CFG.CRIT)  this.emotion='THIRST';
    else if(this.hunger<CFG.CRIT)  this.emotion='HUNGER';
    else if(this.warmth<CFG.CRIT)  this.emotion='COLD';
    else if(this.disease)          this.emotion='PAIN';
    else if(this.grief>50)         this.emotion='GRIEF';
    else if(this.energy<15)        this.emotion='TIRED';
    else if(this.partner)          this.emotion='SOCIAL';
    else                           this.emotion='NEUTRAL';
  }

  // ── BESOINS PSYCHOLOGIQUES ───────────────────────────────────────────────
  _tickPsych(simDt,all){
    const p=this.psych;
    const dt=simDt/86400;  // en jours simulés

    // Sécurité
    const atCamp=distCamp(this)<25;
    const safe=atCamp||(CAMP.fireLevel>=1&&distCamp(this)<30);
    p.safety=Math.max(0,Math.min(100,
      p.safety + (safe?+8:-4)*dt + (this.inDanger?-20:0)*dt
    ));

    // Appartenance — être avec le groupe
    const nearGroup=W.humans.filter(h=>h!==this&&h.alive&&d2(this,h)<20).length;
    p.belonging=Math.max(0,Math.min(100,
      p.belonging + (nearGroup>2?+6:nearGroup>0?+2:-5)*dt
    ));

    // Utilité — faire sa tâche
    const working=['hunt','forage','tend_fire','make_tools','teach','build_shelter','fetch_water'].includes(this.state);
    p.purpose=Math.max(0,Math.min(100,
      p.purpose + (working?+8:-3)*dt
    ));

    // Curiosité — explorer de nouveaux endroits
    const p2=this.personality;
    p.curiosity=Math.max(0,Math.min(100,
      p.curiosity + (['scout','explore_cave'].includes(this.state)?+10:-2)*dt*p2.curious
    ));
  }

  // ── MALADIES ─────────────────────────────────────────────────────────────
  _tickDisease(simDt,all){
    if(!this.disease&&Math.random()<CFG.DISEASE_CHANCE*simDt){
      const wxR=W.season==='winter'?2.5:W.weather==='rain'?1.4:1;
      if(Math.random()<wxR*.4){
        const DISEASES=[
          {name:'Grippe',     severity:.25,timer:5*86400,contagious:true},
          {name:'Dysenterie', severity:.42,timer:4*86400,contagious:false},
          {name:'Infection',  severity:.55,timer:7*86400,contagious:false},
          {name:'Pneumonie',  severity:.68,timer:10*86400,contagious:false},
          {name:'Fièvre',     severity:.32,timer:3*86400,contagious:true},
        ];
        this.disease=Object.assign({},DISEASES[Math.floor(Math.random()*DISEASES.length)]);
        log(`🤒 ${this.name} tombe malade (${this.disease.name}).`,'danger');
      }
    }
    if(this.disease){
      this.disease.timer-=simDt;
      this.health=Math.max(0,this.health-this.disease.severity*.0006*simDt);
      if(this.disease.contagious&&Math.random()<.008*simDt/86400){
        const near=all.filter(e=>e.type_==='human'&&e!==this&&e.alive&&!e.disease&&d2(this,e)<8);
        if(near.length){
          const v=near[Math.floor(Math.random()*near.length)];
          if(Math.random()<CFG.DISEASE_SPREAD){
            v.disease=Object.assign({},this.disease); v.disease.timer*=1.3;
            log(`🤒 ${v.name} contaminé par ${this.name}.`,'danger');
          }
        }
      }
      if(this.disease.timer<=0){
        const healer=all.find(e=>e.type_==='human'&&e.alive&&e.role==='elder'&&d2(this,e)<25);
        if(Math.random()<0.62+(healer?(healer.skills.langage||0)*.25:0)){
          log(`✅ ${this.name} guérit.`,'world');
          this.disease=null; this.health=Math.min(100,this.health+12);
          this.psych.purpose=Math.min(100,this.psych.purpose+20);
        } else {
          this.die(this.disease.name);
        }
      }
    }
  }

  // ── IA PRINCIPALE ────────────────────────────────────────────────────────
  _ai(rs,all){
    // Prédateur proche → fuir (sauf chasseurs courageux)
    const threat=all.find(e=>e.alive&&e.type_!=='human'&&e.sp?.danger&&d2(this,e)<35);
    const braveMod=this.personality.brave;
    if(threat&&(this.role!=='hunter'||braveMod<1.2)){
      this.inDanger=true;
      if(this.state!=='flee'){
        this.tx=CAMP.x+(Math.random()-.5)*8; this.tz=CAMP.z+(Math.random()-.5)*8;
        this.state='flee'; this._timer=10;
        this.thought=pickThought(['danger']);
        this.memory.rememberDanger(threat.x,threat.z,threat.name);
        if(Math.random()<.25) log(`⚠ ${this.name} fuit un ${threat.name}!`,'danger');
      }
      return;
    }
    if(!threat) this.inDanger=false;
    if(this.state==='flee'&&this._timer>0) return;

    if(this._timer>0){ this._doState(rs,all); return; }

    this._decide(all);
    this._doState(rs,all);
  }

  // ── DÉCISION — cœur de l'IA ──────────────────────────────────────────────
  // Chaque décision est pondérée par la personnalité et les besoins psychologiques
  _decide(all){
    const p    = this.personality;
    const psyc = this.psych;
    const atCamp = distCamp(this)<22;

    // ── URGENCES PHYSIQUES (non négociables) ─────────────────────────────
    if(this.thirst<CFG.CRIT){
      this.thought=pickThought(['thirsty']);
      CAMP.waterStock>0&&atCamp ? this._go('drink_camp',8) : this._go('drink',12);
      return;
    }
    if(this.hunger<CFG.CRIT){
      this.thought=pickThought(['hungry']);
      if(CAMP.foodStock>0&&atCamp){ this._go('eat_camp',8); return; }
      if(this.inv.food>0)          { this._go('eat',5);     return; }
      if(this.role!=='child')      { this._go('hunt',35);   return; }
    }
    if(this.energy<10){ this.thought=pickThought(['sleep']); this._go('sleep',20); return; }

    // Malade/blessé → repos au camp
    if(this.disease){
      this.thought=pickThought(['sick']);
      if(!atCamp){ this._go('goto_camp',8); return; }
      this._go('rest',12); return;
    }
    if(this.injured&&this.health<55){
      this.thought=pickThought(['injured']);
      if(!atCamp){ this._go('goto_camp',8); return; }
      this._go('rest',14); return;
    }

    // ── NUIT / MAUVAIS TEMPS ─────────────────────────────────────────────
    if(isNight()||W.weather==='blizzard'||W.weather==='storm'){
      if(!atCamp){ this._go('goto_camp',8); this.thought=pickThought(['cold']); return; }
      if(this.energy<60){ this._go('sleep',18); this.thought=pickThought(['sleep']); return; }
      this._go('tend_fire',10); this.thought=pickThought(['fire']); return;
    }

    // Trop loin → rentrer
    if(distCamp(this)>95){ this._go('goto_camp',10); this.thought='Rentrer…'; return; }

    // Déposer inventaire au camp
    if(atCamp){
      if(this.inv.food>0){ CAMP.foodStock+=this.inv.food; this.inv.food=0; this.carrying=null; }
      if(this.inv.wood>0){ CAMP.fireFuel+=this.inv.wood*7200; this.inv.wood=0; this.carrying=null; }
    }

    // Besoins modérés
    if(this.thirst<CFG.WARN){
      CAMP.waterStock>0&&atCamp ? this._go('drink_camp',6) : this._go('drink',10);
      this.thought='Boire…'; return;
    }
    if(this.hunger<CFG.WARN){
      if(CAMP.foodStock>0&&atCamp){ this._go('eat_camp',6); this.thought='Manger…'; return; }
      if(this.inv.food>0)         { this._go('eat',4);      this.thought='Manger…'; return; }
    }

    // ── LOGIQUE DE PERSONNALITÉ + RÔLE ───────────────────────────────────
    // On calcule un score pour chaque action possible
    // La personnalité amplifie ou diminue ces scores

    const scores={};
    const alive=W.humans.filter(h=>h.alive);
    const needFood=CAMP.foodStock<alive.length*3;
    const needWater=CAMP.waterStock<alive.length*2;
    const needFire=CAMP.fireLevel<2||CAMP.fireFuel<3600;

    // ENFANT
    if(this.role==='child'){
      this._go('play',10);
      this.thought=pickThought(['idle_child']); return;
    }

    // ANCIEN
    if(this.role==='elder'){
      if(needFire)     { scores.tend_fire=80; }
      // Soigner si malades proches
      const sick=alive.filter(h=>h.disease&&d2(this,h)<30);
      if(sick.length)  { scores.heal=70+sick.length*10; }
      scores.teach=50;
      scores.make_tools=35;
      scores.idle_camp=20;
      const best=this._bestScore(scores);
      this._go(best.act, best.act==='tend_fire'?12:best.act==='heal'?15:12);
      this.thought=pickThought(best.act==='tend_fire'?['fire']:best.act==='heal'?['social']:['teach','idle_elder']);
      return;
    }

    // CHASSEUR
    if(this.role==='hunter'){
      const prey=this._findPrey(all, 80+this.personality.brave*80);
      if(prey){
        // Score de chasse amplifié par le courage et la faim du groupe
        scores.hunt=(needFood?80:50)*p.brave + this.skills.chasse*30;
        // Eviter les zones dangereuses mémorisées (si prudent)
        if(this.memory.isDangerous(prey.x,prey.z)) scores.hunt*=(1-p.cautious*.3);
      }
      if(needFire) scores.gather_wood=40;
      scores.patrol=20*p.brave;
      // Curieux → explorer
      if(p.curious>1.2&&psyc.curiosity<40) scores.scout=30*p.curious;
      // Protecteur → rester si quelqu'un est malade/blessé
      if(p.social>1.2&&alive.some(h=>h.disease||h.injured)) scores.idle_camp=25*p.social;

      const best=this._bestScore(scores);
      if(best.act==='hunt'){
        this._target=prey;
        // Coordonner avec autres chasseurs
        alive.filter(h=>h!==this&&h.role==='hunter'&&d2(this,h)<30&&h._timer<3)
          .forEach(h=>{ h._target=prey; h.state='hunt'; h._timer=40; });
        this._go('hunt',40);
        this.thought=pickThought(['hunt_tracking']);
      } else if(best.act==='gather_wood'){
        this._go('gather_wood',10); this.thought='Ramasser du bois…';
      } else if(best.act==='scout'){
        this._go('scout',15); this.thought=pickThought(['explore']);
      } else {
        this._go('patrol',8); this.thought=pickThought(['idle_brave']);
      }
      return;
    }

    // CUEILLEUSE
    if(this.role==='gatherer'){
      if(needWater) scores.fetch_water=80;
      if(needFood||this.hunger<75) scores.forage=60*(1+this.skills.cueillette);
      if(!CAMP.shelterBuilt) scores.build_shelter=35;
      scores.make_tools=20;
      scores.idle_camp=15*p.social;
      // Curieuse → explore localement
      if(p.curious>1.2&&psyc.curiosity<35) scores.forage*=1.3;

      const best=this._bestScore(scores);
      this._go(best.act, best.act==='fetch_water'?15:best.act==='forage'?18:best.act==='build_shelter'?20:10);
      this.thought=pickThought(
        best.act==='fetch_water'?['thirsty']:
        best.act==='forage'?['forage']:
        best.act==='build_shelter'?['build']:['social','idle_social']
      );
      return;
    }

    // SCOUT
    if(this.role==='scout'){
      // Chercher grotte si pas d'abri
      if(!CAMP.shelterBuilt){
        const cave=TR.caves?.filter(c=>!c.discovered)
          .sort((a,b)=>Math.hypot(a.x-CAMP.x,a.z-CAMP.z)-Math.hypot(b.x-CAMP.x,b.z-CAMP.z))[0];
        if(cave){ this._target=cave; this._go('explore_cave',25); this.thought=pickThought(['explore']); return; }
      }
      scores.scout=50*p.curious;
      // Chercher partenaire
      if(!this.partner&&this.age>=16&&this.repCool<=0){
        const mate=alive.find(e=>e!==this&&e.alive&&e.sex!==this.sex&&!e.partner&&e.age>=16&&d2(this,e)<150);
        if(mate){ scores.seek_partner=60*p.social; this._target=mate; }
      }
      scores.forage=30; scores.patrol=20;

      const best=this._bestScore(scores);
      if(best.act==='seek_partner'){ this._go('seek_partner',20); this.thought=pickThought(['partner']); }
      else if(best.act==='scout')  { this._go('scout',15); this.thought=pickThought(['explore']); }
      else { this._go('forage',10); this.thought=pickThought(['forage']); }
      return;
    }

    // Chercher partenaire (tous rôles)
    if(!this.partner&&this.age>=16&&this.repCool<=0&&!this.pregnant&&this.energy>50){
      const mate=alive.find(e=>e!==this&&e.alive&&e.sex!==this.sex
        &&!e.partner&&e.age>=16&&e.age<=45&&d2(this,e)<150);
      if(mate&&Math.random()<p.social*.3){
        this._target=mate; this._go('seek_partner',20);
        this.thought=pickThought(['partner']); return;
      }
    }

    this._go('idle_camp',8);
    this.thought=pickThought(
      this.role==='elder'?['idle_elder']:
      p.brave>1.4?['idle_brave']:
      p.curious>1.4?['idle_curious']:['idle_social']
    );
  }

  // Choisit l'action avec le meilleur score
  _bestScore(scores){
    let best={act:'idle_camp',score:-1};
    for(const [act,score] of Object.entries(scores)){
      if(score>best.score){ best={act,score}; }
    }
    return best;
  }

  _go(s,dur){ this.state=s; this._timer=dur; }

  _findPrey(all,radius){
    return all
      .filter(e=>e.alive&&e.type_==='animal'&&!e.sp?.danger&&(e.sp?.food||0)>0&&d2(this,e)<radius)
      .sort((a,b)=>(b.sp.food/Math.max(1,d2(this,b)))-(a.sp.food/Math.max(1,d2(this,a))))[0]||null;
  }

  _doState(rs,all){
    switch(this.state){
      case 'drink':         this._drink(rs);         break;
      case 'drink_camp':    this._drinkCamp();        break;
      case 'eat':           this._eat();              break;
      case 'eat_camp':      this._eatCamp();          break;
      case 'forage':        this._forage(rs);         break;
      case 'hunt':          this._hunt(rs,all);       break;
      case 'sleep':         this._sleep();            break;
      case 'rest':          this._rest();             break;
      case 'goto_camp':     this._gotoCamp();         break;
      case 'idle_camp':     this._idleCamp(rs,all);   break;
      case 'tend_fire':     this._tendFire(rs);       break;
      case 'make_tools':    this._makeTools(rs);      break;
      case 'teach':         this._teach(rs,all);      break;
      case 'seek_partner':  this._seekPartner(all);   break;
      case 'patrol':        this._patrol();           break;
      case 'scout':         this._scout(rs);          break;
      case 'explore_cave':  this._exploreCave(rs);    break;
      case 'gather_wood':   this._gatherWood(rs);     break;
      case 'fetch_water':   this._fetchWater(rs);     break;
      case 'play':          this._play();             break;
      case 'build_shelter': this._buildShelter(rs);   break;
      case 'heal':          this._heal(rs,all);       break;
      case 'flee':          this._gotoCamp();         break;
    }
  }

  // ── ACTIONS ──────────────────────────────────────────────────────────────

  _drink(rs){
    if(!this._waterTarget){
      // Chercher d'abord en mémoire
      const mem=this.memory.bestFoodSpot(); // non — chercher eau
      const wc=TR.caves?.find(c=>c.hasWater&&Math.hypot(c.x-this.x,c.z-this.z)<150);
      if(wc){ this._waterTarget={x:wc.x,z:wc.z}; }
      else{
        let bx=this.x,bz=this.z,bh=getH(this.x,this.z);
        for(let a=0;a<Math.PI*2;a+=.35){
          const nx=this.x+Math.cos(a)*80,nz=this.z+Math.sin(a)*80,nh=getH(nx,nz);
          if(nh<bh){bh=nh;bx=nx;bz=nz;}
        }
        this._waterTarget={x:bx,z:bz};
      }
    }
    if(getH(this.x,this.z)<6||d2(this,this._waterTarget)<6){
      this.thirst=Math.min(100,this.thirst+60*rs);
      if(this.thirst>93){this._timer=0;this._waterTarget=null;}
    } else {
      this.tx=this._waterTarget.x; this.tz=this._waterTarget.z;
    }
  }

  _drinkCamp(){
    if(distCamp(this)>10){this.tx=CAMP.x;this.tz=CAMP.z;return;}
    if(CAMP.waterStock>0){
      const d=Math.min(CAMP.waterStock,10);
      CAMP.waterStock-=d; this.thirst=Math.min(100,this.thirst+d*8);
    }
    if(this.thirst>93||CAMP.waterStock<=0) this._timer=0;
  }

  _eat(){
    if(this.inv.food>0){
      const e=Math.min(this.inv.food,8);
      this.inv.food-=e; this.hunger=Math.min(100,this.hunger+e*8);
    }
    if(this.hunger>93||this.inv.food<=0) this._timer=0;
  }

  _eatCamp(){
    if(distCamp(this)>10){this.tx=CAMP.x;this.tz=CAMP.z;return;}
    if(CAMP.foodStock>0){
      const e=Math.min(CAMP.foodStock,7);
      CAMP.foodStock-=e; this.hunger=Math.min(100,this.hunger+e*7);
    }
    if(this.hunger>93||CAMP.foodStock<=0) this._timer=0;
  }

  _forage(rs){
    const maxDist=55;
    if(distCamp(this)>maxDist){
      const a=Math.random()*Math.PI*2;
      this.tx=CAMP.x+Math.cos(a)*30; this.tz=CAMP.z+Math.sin(a)*30; return;
    }
    const bio=getBio(this.x,this.z);
    const fertile=bio==='forest'||bio==='prairie'||bio==='steppe'||bio==='lowland';
    const seaMod={spring:1.3,summer:1.6,autumn:.9,winter:.12}[W.season]||1;
    if(fertile){
      this._forageT+=rs;
      if(this._forageT>8){
        this._forageT=0;
        const food=Math.floor((3+this.skills.cueillette*8)*seaMod+Math.random()*3);
        if(food>0){
          this.inv.food=(this.inv.food||0)+food;
          this.carrying='food';
          this.memory.rememberFood(this.x,this.z,food/10);
          this._learn('cueillette',.003);
          this.psych.purpose=Math.min(100,this.psych.purpose+10);
          this._timer=0;
        }
      }
      if(this._forageT&&this._forageT%2.5<rs){
        this.tx=this.x+(Math.random()-.5)*8; this.tz=this.z+(Math.random()-.5)*8;
      }
    } else {
      // Aller vers zone fertile mémorisée ou aléatoire
      const mem=this.memory.bestFoodSpot();
      if(mem){ this.tx=mem.x; this.tz=mem.z; }
      else{
        const a=Math.random()*Math.PI*2, r=15+Math.random()*30;
        this.tx=clamp(CAMP.x+Math.cos(a)*r,-CFG.W*.44,CFG.W*.44);
        this.tz=clamp(CAMP.z+Math.sin(a)*r,-CFG.W*.44,CFG.W*.44);
      }
    }
  }

  _hunt(rs,all){
    if(!this._target?.alive){
      this._target=this._findPrey(all,200);
      if(!this._target){ this._timer=0; return; }
    }
    const prey=this._target;
    this.tx=prey.x; this.tz=prey.z;

    if(d2(this,prey)<4&&this.attackCd<=0){
      const allies=W.humans.filter(h=>h!==this&&h.alive&&h.role==='hunter'&&d2(this,h)<12&&h.state==='hunt').length;
      const dmg=(15+this.skills.chasse*30+allies*10)*(this.injured?.5:1);
      prey.takeDmg(dmg,this);
      this.attackCd=1.5;
      this._learn('chasse',.007);
      if(prey.sp.danger&&Math.random()<.10){
        this.injured=true; this.health=Math.max(0,this.health-18);
        log(`🩸 ${this.name} blessé par le ${prey.name}!`,'danger');
      }
      if(!prey.alive){
        const food=prey.sp.food||25;
        this.inv.food=(this.inv.food||0)+food;
        this.carrying='food';
        this.memory.kills++;
        this.memory.rememberFood(prey.x,prey.z,food/8);
        this.psych.purpose=Math.min(100,this.psych.purpose+25);
        this._target=null; this._timer=0;
        this._go('goto_camp',15);
        this.thought=pickThought(['hunt_success']);
        log(`🏹 ${this.name} tue un ${prey.name}! +${food} nourr.`,'world');
        if(this.memory.kills===1) addChron(`${this.name} — première chasse`,'🏹');
      }
    }
  }

  _sleep(){
    if(distCamp(this)>14){
      this.tx=CAMP.x+(Math.random()-.5)*6; this.tz=CAMP.z+(Math.random()-.5)*6;
    } else {
      this.tx=this.x; this.tz=this.z;
    }
    if(this.energy>93) this._timer=0;
  }

  _rest(){
    this.tx=CAMP.x+(Math.random()-.5)*8; this.tz=CAMP.z+(Math.random()-.5)*8;
    if(distCamp(this)<10) this._timer=0;
  }

  _gotoCamp(){
    if(distCamp(this)<10){ this._timer=0; return; }
    this.tx=CAMP.x+(Math.random()-.5)*6; this.tz=CAMP.z+(Math.random()-.5)*6;
  }

  _idleCamp(rs,all){
    // Rester près du camp avec déplacements naturels
    if(distCamp(this)>18){
      this.tx=CAMP.x+(Math.random()-.5)*8; this.tz=CAMP.z+(Math.random()-.5)*8;
    } else if(d2(this,{x:this.tx,z:this.tz})<2||Math.random()<.006){
      const a=Math.random()*Math.PI*2, r=3+Math.random()*12;
      this.tx=CAMP.x+Math.cos(a)*r; this.tz=CAMP.z+Math.sin(a)*r;
    }

    // Interactions sociales — partage de connaissances
    if(Math.random()<.0015*rs){
      const near=all.filter(e=>e.type_==='human'&&e!==this&&e.alive&&d2(this,e)<12);
      if(near.length){
        const other=near[Math.floor(Math.random()*near.length)];
        const sk=SK_KEYS[Math.floor(Math.random()*SK_KEYS.length)];
        if((this.skills[sk]||0)>(other.skills[sk]||0)){
          other._learn(sk,.001); this._learn('langage',.0005);
        }
        // Partager appartenance
        this.psych.belonging=Math.min(100,this.psych.belonging+5);
        other.psych.belonging=Math.min(100,other.psych.belonging+5);
      }
    }
  }

  _tendFire(rs){
    if(distCamp(this)>10){this.tx=CAMP.x;this.tz=CAMP.z;return;}
    this._taskTimer=(this._taskTimer||0)+rs;
    if(this._taskTimer>4){
      this._taskTimer=0;
      const wood=Math.min(this.inv.wood||0,2);
      this.inv.wood=(this.inv.wood||0)-wood;
      CAMP.fireFuel=Math.min(86400*2,CAMP.fireFuel+wood*7200+3600);
      CAMP.fireLevel=CAMP.fireFuel>7200?2:CAMP.fireFuel>1800?1:0;
      if(CAMP.fireLevel===0&&CAMP.fireFuel>0){
        CAMP.fireLevel=1;
        this._learn('feu',.012);
        log(`🔥 ${this.name} rallume le feu!`,'discovery');
      } else if(CAMP.fireLevel>0){
        this._learn('feu',.003);
      }
      this._timer=0;
    }
  }

  _makeTools(rs){
    if(distCamp(this)>15){this.tx=CAMP.x;this.tz=CAMP.z;return;}
    this._taskTimer=(this._taskTimer||0)+rs;
    if(this._taskTimer>18){
      this._taskTimer=0; this._timer=0;
      this._learn('outil',.010);
      CAMP.tools.push({type:'knife',quality:this.skills.outil,maker:this.name});
      log(`🪨 ${this.name} fabrique un outil.`,'discovery');
    }
  }

  _teach(rs,all){
    if(distCamp(this)>12){this.tx=CAMP.x;this.tz=CAMP.z;return;}
    const students=all.filter(e=>e.type_==='human'&&e.alive&&e.age<20&&d2(this,e)<15);
    students.forEach(s=>{
      SK_KEYS.forEach(k=>{ if((this.skills[k]||0)>(s.skills[k]||0)) s._learn(k,.0008); });
      s.psych.belonging=Math.min(100,s.psych.belonging+3);
    });
    this._taskTimer=(this._taskTimer||0)+rs;
    this.thought=students.length?`Enseigner à ${students[0].name}…`:pickThought(['idle_elder']);
    if(this._taskTimer>12){this._taskTimer=0;this._timer=0;}
  }

  _seekPartner(all){
    const p=this._target;
    if(!p?.alive||p.partner){this._target=null;this._timer=0;return;}
    this.tx=p.x; this.tz=p.z;
    if(d2(this,p)<5){
      this.partner=p; p.partner=this;
      this._learn('langage',.008); p._learn('langage',.008);
      this.psych.belonging=Math.min(100,this.psych.belonging+30);
      p.psych.belonging=Math.min(100,p.psych.belonging+30);
      log(`💑 ${this.name} et ${p.name} s'unissent.`,'social');
      addChron(`${this.name} & ${p.name}s'unissent`,'💑');
      this._timer=0; this._target=null;
      if(!this.clan&&!p.clan){
        const cl=new Clan(this,p); W.clans.push(cl);
      } else if(this.clan&&!p.clan) this.clan.addMember(p);
        else if(p.clan&&!this.clan) p.clan.addMember(this);
    }
  }

  _patrol(){
    const a=Math.random()*Math.PI*2, r=20+Math.random()*35;
    this.tx=clamp(CAMP.x+Math.cos(a)*r,-CFG.W*.44,CFG.W*.44);
    this.tz=clamp(CAMP.z+Math.sin(a)*r,-CFG.W*.44,CFG.W*.44);
  }

  _scout(rs){
    if(!this._scoutTarget||Math.hypot(this.tx-this.x,this.tz-this.z)<4){
      // Scout curieux → aller vers endroit inconnu
      const a=(W.totalSim*.0001+this.id)%(Math.PI*2); // direction évolutive
      const r=40+Math.random()*70;
      this._scoutTarget={
        x:clamp(CAMP.x+Math.cos(a)*r,-CFG.W*.44,CFG.W*.44),
        z:clamp(CAMP.z+Math.sin(a)*r,-CFG.W*.44,CFG.W*.44),
      };
    }
    this.tx=this._scoutTarget.x; this.tz=this._scoutTarget.z;
    if(this._timer<=0) this._scoutTarget=null;
    this.psych.curiosity=Math.min(100,this.psych.curiosity+0.01);
  }

  _exploreCave(rs){
    const cave=this._target;
    if(!cave){this._timer=0;return;}
    this.tx=cave.x; this.tz=cave.z;
    if(Math.hypot(this.x-cave.x,this.z-cave.z)<8&&!cave.discovered){
      cave.discovered=true;
      const q=cave.quality;
      const desc=q>0.7?'excellente':q>0.4?'bonne':'médiocre';
      this.psych.curiosity=Math.min(100,this.psych.curiosity+30);
      this._learn('abri',.04);
      log(`🏔 ${this.name} découvre une grotte (${desc})!`,'discovery');
      addChron(`${this.name} découvre une grotte`,'🏔');
      if(q>0.6){
        CAMP.x=cave.x; CAMP.z=cave.z;
        CAMP.shelterLevel=Math.max(CAMP.shelterLevel,2);
        CAMP.shelterBuilt=true;
        W.humans.filter(h=>h.alive).forEach(h=>{h.state='goto_camp';h._timer=20;});
        log(`🏕 Le groupe migre vers la grotte!`,'discovery');
        addChron('Migration vers la grotte','🚶');
      }
      this._timer=0;
    }
  }

  _gatherWood(rs){
    const bio=getBio(this.x,this.z);
    if(bio==='forest'||bio==='hills'||bio==='steppe'){
      this._taskTimer=(this._taskTimer||0)+rs;
      if(this._taskTimer>5){ this._taskTimer=0; this.inv.wood=(this.inv.wood||0)+3; this.carrying='wood'; this._timer=0; }
    } else {
      const a=Math.random()*Math.PI*2, r=10+Math.random()*25;
      this.tx=clamp(CAMP.x+Math.cos(a)*r,-CFG.W*.44,CFG.W*.44);
      this.tz=clamp(CAMP.z+Math.sin(a)*r,-CFG.W*.44,CFG.W*.44);
    }
  }

  _fetchWater(rs){
    if(!this._waterTarget){
      const wc=TR.caves?.find(c=>c.hasWater&&Math.hypot(c.x-this.x,c.z-this.z)<120);
      if(wc){this._waterTarget={x:wc.x,z:wc.z};}
      else{
        let bx=this.x,bz=this.z,bh=getH(this.x,this.z);
        for(let a=0;a<Math.PI*2;a+=.35){
          const nx=this.x+Math.cos(a)*70,nz=this.z+Math.sin(a)*70,nh=getH(nx,nz);
          if(nh<bh){bh=nh;bx=nx;bz=nz;}
        }
        this._waterTarget={x:bx,z:bz};
      }
    }
    if(d2(this,this._waterTarget)<8){
      this._taskTimer=(this._taskTimer||0)+rs;
      if(this._taskTimer>4){
        this._taskTimer=0;
        CAMP.waterStock=Math.min(200,CAMP.waterStock+25);
        this._waterTarget=null; this._timer=0;
        this.psych.purpose=Math.min(100,this.psych.purpose+8);
      }
    } else {
      this.tx=this._waterTarget.x; this.tz=this._waterTarget.z;
    }
  }

  _play(){
    if(distCamp(this)>22){this.tx=CAMP.x+(Math.random()-.5)*8;this.tz=CAMP.z+(Math.random()-.5)*8;return;}
    if(Math.random()<.02){
      this.tx=CAMP.x+(Math.random()-.5)*16; this.tz=CAMP.z+(Math.random()-.5)*16;
    }
    // Apprentissage passif
    if(Math.random()<.0008){ this._learn(SK_KEYS[Math.floor(Math.random()*SK_KEYS.length)],.0008); }
    this.psych.curiosity=Math.min(100,this.psych.curiosity+.005);
  }

  _buildShelter(rs){
    if(distCamp(this)>15){this.tx=CAMP.x;this.tz=CAMP.z;return;}
    this._taskTimer=(this._taskTimer||0)+rs;
    if(this._taskTimer>25){
      this._taskTimer=0; this._timer=0;
      CAMP.shelterLevel=Math.min(2,CAMP.shelterLevel+1);
      CAMP.shelterBuilt=true;
      this._learn('abri',.06);
      const labels=['','Peaux tendues','Hutte de branches'];
      log(`🏕 ${this.name} construit : ${labels[CAMP.shelterLevel]}.`,'discovery');
      addChron(`Abri : ${labels[CAMP.shelterLevel]}`,'🏕');
      this.psych.purpose=Math.min(100,this.psych.purpose+20);
    }
  }

  _heal(rs,all){
    if(distCamp(this)>12){this.tx=CAMP.x;this.tz=CAMP.z;return;}
    const sick=all.filter(e=>e.type_==='human'&&e.alive&&e.disease&&d2(this,e)<20);
    sick.forEach(s=>{
      s.disease.timer=Math.min(s.disease.timer,s.disease.timer*.85);
      s.health=Math.min(100,s.health+.02*rs);
    });
    this._taskTimer=(this._taskTimer||0)+rs;
    this.thought=sick.length?`Soigner ${sick[0].name}…`:pickThought(['idle_elder']);
    if(this._taskTimer>10){this._taskTimer=0;this._timer=0;}
  }

  // ── MOUVEMENT ────────────────────────────────────────────────────────────
  _move(rs){
    let spd=this.state==='flee'?7:this.state==='hunt'?5:this.role==='child'?2.2:3.5;
    if(this.injured)  spd*=.5;
    if(this.disease)  spd*=.7;
    if(this.carrying) spd*=.85;
    if(this.age>50)   spd*=.7;
    if(W.snowDepth>0.2) spd*=(1-W.snowDepth*.5);
    const fac=this.energy<10?.3:1;
    const dx=this.tx-this.x, dz=this.tz-this.z, dd=Math.hypot(dx,dz);
    if(dd>0.2){
      const step=Math.min(spd*fac*rs,dd);
      this.x+=dx/dd*step; this.z+=dz/dd*step;
      this.rot=Math.atan2(dx,dz);
    }
    this.x=clamp(this.x,-CFG.W*.44,CFG.W*.44);
    this.z=clamp(this.z,-CFG.W*.44,CFG.W*.44);
  }

  _learn(sk,v){ this.skills[sk]=Math.min(1,(this.skills[sk]||0)+v*(1+this.iq/100)); }

  // ── NAISSANCE ────────────────────────────────────────────────────────────
  _birth(all){
    this.pregnant=false;
    const used=new Set(W.humans.map(h=>h.name).concat(W.humans.map(h=>h.infant?.name).filter(Boolean)));
    const nm=HNAMES.find(n=>!used.has(n))||('Enfant'+(W.births+1));
    const sx=Math.random()<.5?'M':'F';
    const baby=new Human(nm,sx,this.x,this.y,this.z,this.gen+1,this,this.partner);
    baby.age=0; baby.hunger=95; baby.thirst=95; baby.health=100;

    if(Math.random()<CFG.INFANT_MORTALITY){
      W.deaths++;
      W.humans.filter(h=>h.alive&&h.name!==this.name).forEach(h=>{
        h.grief=Math.min(100,h.grief+20); h.psych.belonging=Math.max(0,h.psych.belonging-10);
      });
      log(`💔 Le bébé de ${this.name} n'a pas survécu.`,'danger');
      addChron('Perte d\'un enfant','💔');
      return;
    }

    this.infant=baby; this.carrying='infant';
    this.children.push(baby);
    W.births++; W.pop++;
    W.gen=Math.max(W.gen,baby.gen);
    _checkEvolution();
    if(this.clan) this.clan.addMember(baby);
    // Joie dans le groupe
    W.humans.filter(h=>h.alive).forEach(h=>{ h.psych.belonging=Math.min(100,h.psych.belonging+8); });
    log(`👶 ${this.name} donne naissance à ${nm}.`,'social');
    addChron(`Naissance de ${nm} (gén.${baby.gen})`,'👶');
  }

  takeDmg(a,src){
    this.health=Math.max(0,this.health-a);
    if(this.health<=0){ this.die('combat'); return; }
    this.tx=CAMP.x; this.tz=CAMP.z;
    this.state='flee'; this._timer=10;
    if(a>15) this.injured=true;
  }

  die(cause){
    this.alive=false; W.deaths++; W.pop=Math.max(0,W.pop-1);
    if(this.partner){
      this.partner.partner=null;
      this.partner.grief=Math.min(100,this.partner.grief+70);
      this.partner.psych.belonging=Math.max(0,this.partner.psych.belonging-40);
    }
    // Deuil dans le groupe
    W.humans.filter(h=>h.alive&&h.clan===this.clan).forEach(h=>{
      h.grief=Math.min(100,h.grief+15);
      h.memory.deaths.push(this.name);
    });
    if(this.clan) this.clan.members=this.clan.members.filter(m=>m!==this);
    if(this.infant){
      const foster=W.humans.find(h=>h.alive&&h.sex==='F'&&h.age>=16&&!h.infant&&!h.pregnant);
      if(foster){ foster.infant=this.infant; foster.carrying='infant'; log(`🤲 ${foster.name} adopte ${this.infant.name}.`,'social'); }
      else { W.deaths++; log(`💔 ${this.infant?.name} n'a pas survécu.`,'danger'); }
    }
    const emotStr=cause==='vieillesse'?'world':'danger';
    log(`💀 ${this.name} (${cause}, ${this.age.toFixed(0)} ans)`,emotStr);
    addChron(`${this.name} meurt (${cause})`,'💀');
  }
}