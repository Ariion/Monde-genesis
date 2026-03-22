// GENESIS — entities/human.js

const HNAMES=['Caïn','Abel','Seth','Noé','Ara','Lila','Maia','Elan','Kael','Tara',
  'Rho','Sela','Oren','Nara','Vael','Isha','Kira','Danu','Amon','Bura',
  'Ceda','Grun','Hara','Jora','Lena','Moru','Nila','Oran','Pira','Saul',
  'Tova','Ulan','Vera','Waro','Xena','Yala','Zara','Belo','Cira','Dorn'];
const SK_KEYS=['chasse','cueillette','feu','abri','langage','outil'];
const SK_EMO ={chasse:'🏹',cueillette:'🌿',feu:'🔥',abri:'🏕',langage:'🗣',outil:'🪨'};

class Human{
  constructor(name,sex,x,y,z,gen=1,pA=null,pB=null){
    this.id=++_eid; this.name=name; this.sex=sex;
    this.type_='human'; this.alive=true;
    this.x=x; this.y=y; this.z=z;
    this.tx=x; this.tz=z; this.rot=0;
    this.gen=gen;
    this.age=(['Adam','Ève'].includes(name))?18:0;

    // Besoins — bons niveaux au départ
    this.health=100; this.hunger=80; this.thirst=80;
    this.warmth=100; this.energy=90;

    // Inventaire
    this.inv={food:0};

    // Compétences [0-1]
    this.skills=pA&&pB
      ? Object.fromEntries(SK_KEYS.map(k=>[k, Math.min(1,((pA.skills[k]||0)+(pB.skills[k]||0))*.38+Math.random()*.04)]))
      : {chasse:.05,cueillette:.06,feu:.02,abri:.02,langage:.02,outil:.02};

    this.iq=pA ? Math.min(100,(pA.iq+(pB?.iq||10))*.4+Math.random()*8) : 8+Math.random()*6;

    // Social
    this.partner=null; this.clan=null; this.children=[];
    this.pregnant=false; this.pregTimer=0; this.repCool=0;

    // IA — TOUT en secondes RÉELLES
    this.state='explore';
    this._timer=0;          // durée état courant (sec réelles)
    this._exploreT=0;       // timer cible exploration (sec réelles)
    this._forageT=0;        // timer cueillette (sec réelles)
    this._target=null;
    this._shelterTarget=null;
    this.attackCd=0;
    this.discoveries=[];
    this.emotion='NEUTRAL';
    this.thought='…';
    this.inDanger=false;
    this.mesh=null;
  }

  // ── TICK ─────────────────────────────────────────────────────────────────
  tick(simDt, realDt, all){
    if(!this.alive) return;
    const rs = realDt/1000; // secondes réelles

    // Vieillissement
    this.age += (simDt/(365*86400)) * (this.age<18 ? 20 : 1);
    if(this.age > 50+this.iq*.25 && Math.random()<.00002*simDt){ this.die('vieillesse'); return; }

    // Timers (secondes réelles)
    this._timer   = Math.max(0, this._timer-rs);
    this.attackCd = Math.max(0, this.attackCd-rs);
    if(this.repCool>0) this.repCool -= simDt; // repCool en secondes simulées

    // Besoins
    this._needs(simDt, rs);
    if(!this.alive) return;

    // Gestation (en secondes simulées)
    if(this.pregnant){
      this.pregTimer -= simDt;
      if(this.pregTimer<=0) this._birth(all);
    }

    // Reproduction spontanée quand en couple
    if(this.partner?.alive && this.sex==='F' && !this.pregnant
       && this.repCool<=0 && this.health>40 && this.hunger>25){
      this.pregnant  = true;
      this.pregTimer = 4*86400;    // 4 jours simulés
      this.repCool   = 30*86400;   // cooldown 30 jours simulés
      log(`🤰 ${this.name} est enceinte.`,'social');
    }

    // IA
    this._ai(rs, all);

    // Mouvement (secondes réelles)
    this._move(rs);

    // Brouillard
    revealFog(this.x, this.z, CFG.FOG_REVEAL_R);

    // Mesh
    if(this.mesh){
      this.y += (getH(this.x,this.z)-this.y)*.15;
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.y = this.rot;
    }
  }

  // ── BESOINS ──────────────────────────────────────────────────────────────
  _needs(simDt, rs){
    const sl = this.state==='sleep' ? .15 : 1;
    this.hunger = Math.max(0, this.hunger - CFG.HUNGER_RATE*simDt*sl);
    this.thirst = Math.max(0, this.thirst - CFG.THIRST_RATE*simDt*sl);
    this.energy = this.state==='sleep'
      ? Math.min(100, this.energy + .12*simDt)
      : Math.max(0,   this.energy - CFG.ENERGY_RATE*simDt);

    const cold = W.temp < 10;
    const warm = this.clan?.hasFire
      || W.humans.some(h=>h!==this&&h.alive&&(h.skills.feu||0)>.1&&d2(this,h)<15);
    if(cold&&!warm) this.warmth = Math.max(0, this.warmth - CFG.WARMTH_RATE*simDt);
    else            this.warmth = Math.min(100, this.warmth + .03*simDt);

    // Dégâts (en simDt)
    if(this.hunger<=0) this.health = Math.max(0, this.health - .0012*simDt);
    if(this.thirst<=0) this.health = Math.max(0, this.health - .0022*simDt);
    if(this.warmth<=0) this.health = Math.max(0, this.health - .0018*simDt);
    if(this.health<=0){ this.die('survie'); return; }

    // Regen
    if(this.hunger>35&&this.thirst>35&&this.warmth>25)
      this.health = Math.min(100, this.health + .003*simDt);

    // Émotion
    if(this.inDanger)              this.emotion='FEAR';
    else if(this.hunger<CFG.CRIT)  this.emotion='HUNGER';
    else if(this.thirst<CFG.CRIT)  this.emotion='THIRST';
    else if(this.warmth<CFG.CRIT)  this.emotion='COLD';
    else if(this.energy<10)        this.emotion='TIRED';
    else if(this.partner)          this.emotion='SOCIAL';
    else                           this.emotion='NEUTRAL';
  }

  // ── IA ───────────────────────────────────────────────────────────────────
  _ai(rs, all){
    // Danger → fuir
    const threat = all.find(e=>e.alive&&e.type_!=='human'&&e.sp?.danger&&d2(this,e)<25);
    if(threat){
      this.inDanger=true;
      if(this.state!=='flee'){
        const dx=this.x-threat.x, dz=this.z-threat.z, dd=Math.hypot(dx,dz)||1;
        this.tx=clamp(this.x+dx/dd*90,-CFG.W*.44,CFG.W*.44);
        this.tz=clamp(this.z+dz/dd*90,-CFG.W*.44,CFG.W*.44);
        this.state='flee'; this._timer=5;
      }
      return;
    }
    this.inDanger=false;
    if(this.state==='flee'&&this._timer>0) return;

    // Timer actif → continuer l'action
    if(this._timer>0){
      this._doState(rs, all);
      return;
    }

    // Choisir un nouvel état
    this._choose(all);
    this._doState(rs, all);
  }

  _choose(all){
    // ─ Urgences vitales ─
    if(this.thirst<CFG.CRIT){  this._go('drink',8);    return; }
    if(this.hunger<CFG.CRIT){  this._go(this.inv.food>0?'eat':'forage',10); return; }
    if(this.energy<8){         this._go('sleep',20);   return; }
    if(this.warmth<CFG.CRIT&&W.temp<10){ this._go('shelter',15); return; }

    // ─ Modérés ─
    if(this.thirst<CFG.WARN){  this._go('drink',6);    return; }
    if(this.inv.food>0&&this.hunger<85){ this._go('eat',3); return; }
    if(this.hunger<CFG.WARN){  this._go('forage',8);   return; }
    if(isNight()&&this.energy<50){ this._go('sleep',10); return; }

    // ─ Nuit → abri ─
    if(isNight()){
      const cave=_nearestCave(this.x,this.z,200);
      if(cave){ this._shelterTarget=cave; this._go('shelter',15); return; }
    }

    // ─ Chasse si faim ─
    if(this.hunger<72){
      const prey=all.find(e=>e.alive&&e.type_==='animal'&&!e.sp?.danger&&(e.sp?.food||0)>0&&d2(this,e)<80);
      if(prey){ this._target=prey; this._go('hunt',20); return; }
    }

    // ─ Partenaire ─
    if(!this.partner&&this.age>=14&&this.repCool<=0&&!this.pregnant&&this.energy>40){
      const p=all.find(e=>e.type_==='human'&&e.alive&&e.sex!==this.sex&&!e.partner&&e.age>=14&&d2(this,e)<200);
      if(p){ this._target=p; this._go('seek_partner',15); return; }
    }

    // ─ Cueillette modérée ─
    if(this.hunger<80){ this._go('forage',6); return; }

    // ─ Explorer ─
    this._go('explore',5);
  }

  _go(s,dur){
    this.state=s; this._timer=dur;
    const pool=THOUGHTS_BY_STATE[s]||THOUGHTS_BY_STATE.idle;
    this.thought=pool[Math.floor(Math.random()*pool.length)];
  }

  _doState(rs, all){
    switch(this.state){
      case 'drink':        this._drink(rs);       break;
      case 'eat':          this._eat();            break;
      case 'forage':       this._forage(rs);       break;
      case 'hunt':         this._hunt(rs,all);     break;
      case 'sleep':        this._sleep();          break;
      case 'shelter':      this._shelter(rs);      break;
      case 'seek_partner': this._partner(all);     break;
      case 'explore':      this._explore(rs);      break;
    }
  }

  // ── ACTIONS (toutes en secondes RÉELLES) ─────────────────────────────────

  _drink(rs){
    const h=getH(this.x,this.z), bio=getBio(this.x,this.z);
    if(h<8||bio==='river'||bio==='lowland'){
      this.thirst=Math.min(100,this.thirst+45*rs);
      if(this.thirst>88) this._timer=0;
    } else {
      // Descendre la pente vers l'eau
      let bx=this.x,bz=this.z,bh=h;
      for(let a=0;a<Math.PI*2;a+=.5){
        const nx=this.x+Math.cos(a)*30, nz=this.z+Math.sin(a)*30;
        const nh=getH(nx,nz);
        if(nh<bh){ bh=nh; bx=nx; bz=nz; }
      }
      this.tx=bx; this.tz=bz;
    }
  }

  _eat(){
    if(this.inv.food>0&&this.hunger<99){
      const e=Math.min(this.inv.food,8);
      this.inv.food-=e;
      this.hunger=Math.min(100,this.hunger+e*6);
      this.thirst=Math.min(100,this.thirst+e*1.5);
    }
    if(this.hunger>93||(this.inv.food||0)<=0) this._timer=0;
  }

  _forage(rs){
    // BUG FIX : timer en secondes RÉELLES (pas simulées!)
    // 12s réelles pour cueillir = le perso marche vers une zone et cueille
    const bio=getBio(this.x,this.z);
    const fertile=bio==='forest'||bio==='prairie'||bio==='steppe'||bio==='lowland';

    if(fertile){
      this._forageT+=rs;
      if(this._forageT>12){    // 12 secondes RÉELLES pour cueillir
        this._forageT=0;
        const food=2+Math.floor(this.skills.cueillette*8)+Math.floor(Math.random()*4);
        this.inv.food=(this.inv.food||0)+food;
        this._learn('cueillette',.005);
        this._timer=0;         // aller manger
      }
      // Faire des allers-retours dans la zone fertile
      if(this._forageT%3<rs){  // changer de micro-cible toutes les 3s
        this.tx=this.x+(Math.random()-.5)*8;
        this.tz=this.z+(Math.random()-.5)*8;
        this.tx=clamp(this.tx,-CFG.W*.44,CFG.W*.44);
        this.tz=clamp(this.tz,-CFG.W*.44,CFG.W*.44);
      }
    } else {
      // Marcher vers une zone fertile
      const tgt=randLand(3,60);
      this.tx=tgt.x; this.tz=tgt.z;
    }
  }

  _hunt(rs, all){
    const prey=this._target?.alive ? this._target
      : all.find(e=>e.alive&&e.type_==='animal'&&!e.sp?.danger&&(e.sp?.food||0)>0&&d2(this,e)<100);
    if(!prey){ this._target=null; this._timer=0; return; }
    this._target=prey;
    this.tx=prey.x; this.tz=prey.z;
    if(d2(this,prey)<3.5&&this.attackCd<=0){
      const dmg=10+this.skills.chasse*20+Math.random()*8;
      prey.takeDmg(dmg,this);
      this.attackCd=1.5;
      this._learn('chasse',.006);
      if(!prey.alive){
        this.inv.food=(this.inv.food||0)+(prey.sp.food||20);
        this._target=null; this._timer=0;
        log(`🏹 ${this.name} chasse un ${prey.name}!`,'world');
        addChron(`${this.name} chasse un ${prey.name}`,'🏹');
      }
    }
  }

  _sleep(){
    this.tx=this.x; this.tz=this.z;
    if(this.energy>92) this._timer=0;
  }

  _shelter(rs){
    const cave=this._shelterTarget||_nearestCave(this.x,this.z,300);
    if(!cave){ this._timer=0; return; }
    this._shelterTarget=cave;
    this.tx=cave.x; this.tz=cave.z;
    if(d2(this,cave)<10){
      this.warmth=Math.min(100,this.warmth+30*rs);
      this.energy=Math.min(100,this.energy+8*rs);
      if(!this.discoveries.includes('abri')){
        this.discoveries.push('abri');
        this._learn('abri',.05);
        log(`🏔 ${this.name} trouve un abri!`,'discovery');
        addChron(`${this.name} découvre la grotte`,'🏔');
      }
      if(!isNight()&&this.warmth>70) this._timer=0;
    }
  }

  _partner(all){
    const p=this._target;
    if(!p?.alive||p.partner){ this._target=null; this._timer=0; return; }
    this.tx=p.x; this.tz=p.z;
    if(d2(this,p)<6){
      this.partner=p; p.partner=this;
      this._learn('langage',.01);
      log(`💑 ${this.name} et ${p.name} s'unissent!`,'social');
      addChron(`${this.name} et ${p.name} s'unissent`,'💑');
      this._timer=0; this._target=null;
      if(!this.clan&&!p.clan){
        const cl=new Clan(this,p); W.clans.push(cl);
        log(`👥 Le clan "${cl.name}" est fondé!`,'social');
        addChron(`Clan fondé : ${cl.name}`,'👥');
      } else if(this.clan&&!p.clan) this.clan.addMember(p);
        else if(p.clan&&!this.clan) p.clan.addMember(this);
    }
  }

  _explore(rs){
    this._exploreT-=rs;
    const near=Math.hypot(this.tx-this.x, this.tz-this.z)<3;
    if(near||this._exploreT<=0){
      const r=15+Math.random()*45, a=Math.random()*Math.PI*2;
      this.tx=clamp(this.x+Math.cos(a)*r,-CFG.W*.44,CFG.W*.44);
      this.tz=clamp(this.z+Math.sin(a)*r,-CFG.W*.44,CFG.W*.44);
      this._exploreT=3+Math.random()*7;
    }
  }

  // ── MOUVEMENT ────────────────────────────────────────────────────────────
  _move(rs){
    const spd=this.state==='flee'?7:this.state==='hunt'?4.5:3.5;
    const fac=this.energy<10?.4:1;
    const dx=this.tx-this.x, dz=this.tz-this.z, dd=Math.hypot(dx,dz);
    if(dd>0.2){
      const step=Math.min(spd*fac*rs, dd);
      this.x+=dx/dd*step;
      this.z+=dz/dd*step;
      this.rot=Math.atan2(dx,dz);
    }
    this.x=clamp(this.x,-CFG.W*.44,CFG.W*.44);
    this.z=clamp(this.z,-CFG.W*.44,CFG.W*.44);
  }

  _moveTo(x,z){ this.tx=x; this.tz=z; }
  _learn(sk,v){ this.skills[sk]=Math.min(1,(this.skills[sk]||0)+v*(1+this.iq/100)); }

  // ── NAISSANCE ────────────────────────────────────────────────────────────
  _birth(all){
    this.pregnant=false;
    const used=new Set(W.humans.map(h=>h.name));
    const nm=HNAMES.find(n=>!used.has(n))||('Enfant'+W.births);
    const sx=Math.random()<.5?'M':'F';
    const baby=new Human(nm, sx,
      this.x+(Math.random()-.5)*4, this.y, this.z+(Math.random()-.5)*4,
      this.gen+1, this, this.partner);
    baby.hunger=85; baby.thirst=85; baby.health=100;
    W.humans.push(baby); W.births++; W.pop++;
    W.gen=Math.max(W.gen,baby.gen);
    _checkEvolution();
    if(this.clan) this.clan.addMember(baby);
    buildHumanMesh(baby); SC.scene.add(baby.mesh);
    log(`👶 ${this.name} donne naissance à ${nm}!`,'social');
    addChron(`Naissance de ${nm} (gén.${baby.gen})`,'👶');
  }

  takeDmg(a,src){
    this.health=Math.max(0,this.health-a);
    if(this.health<=0){ this.die('combat'); return; }
    if(src){
      const dx=this.x-src.x, dz=this.z-src.z, dd=Math.hypot(dx,dz)||1;
      this.tx=clamp(this.x+dx/dd*60,-CFG.W*.44,CFG.W*.44);
      this.tz=clamp(this.z+dz/dd*60,-CFG.W*.44,CFG.W*.44);
      this.state='flee'; this._timer=5;
    }
  }

  die(cause){
    this.alive=false; W.deaths++; W.pop=Math.max(0,W.pop-1);
    if(this.partner) this.partner.partner=null;
    if(this.clan) this.clan.members=this.clan.members.filter(m=>m!==this);
    log(`💀 ${this.name} (${cause}) à ${this.age.toFixed(1)} ans`,'danger');
    addChron(`${this.name} meurt (${cause})`,'💀');
  }
}