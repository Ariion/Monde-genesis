// GENESIS — entities/animal.js — Classe Animal

// ── ENTITÉ ANIMALE ────────────────────────────────────────────────────
let _eid=1;
class Animal{
  constructor(t,x,y,z){
    this.id=_eid++;this.type=t;this.sp=SP[t];
    if(!this.sp)throw new Error('Bad species: '+t);
    this.name=this.sp.name;this.alive=true;
    this.x=x;this.y=y;this.z=z;this.tx=x;this.tz=z;
    this.rot=Math.random()*Math.PI*2;
    this.hp=this.sp.hp;this.hunger=55+Math.random()*40;
    this.age=0;this.sex=Math.random()<.5?'M':'F';
    this.pregnant=false;this.gestT=0;
    this.state='wander';this.stT=2+Math.random()*5;
    this.attackCd=0;this.mesh=null;
    this.life=365*86400*.35+Math.random()*365*86400*.4;
  }
  tick(dt,all){
    this.age+=dt;this.stT=Math.max(0,this.stT-dt);this.attackCd=Math.max(0,this.attackCd-dt);
    if(this.age>this.life&&Math.random()<.0002*dt){this.die('vieillesse');return;}
    this.hunger=Math.max(0,this.hunger-.003*dt);
    if(this.hunger<=0){this.hp-=.04*dt;if(this.hp<=0){this.die('famine');return;}}
    if(this.pregnant){this.gestT-=dt;if(this.gestT<=0)this._birth();}
    this._ai(dt,all);this._move(dt);
    if(this.mesh){
      this.y=this.sp.aquatic?Math.min(getH(this.x,this.z),.4):this.sp.aerial?this.y:getH(this.x,this.z);
      this.mesh.position.set(this.x,this.y+.05,this.z);this.mesh.rotation.y=this.rot;
    }
  }
  _ai(dt,all){
    const sp=this.sp;
    if(!sp.apex){
      const thr=all.find(e=>e.alive&&e!==this&&(sp.pred.includes(e.type)||(e.type_==='human'&&!sp.aquatic))&&d2(this,e)<(sp.sz||1)*22+8);
      if(thr){this._flee(thr);return;}
    }
    if((sp.apex||sp.col===0x707070||sp.col===0x5a3a20)&&this.hunger<52&&this.stT<=0){
      const prey=all.find(e=>e.alive&&e!==this&&e.type_!=='human'&&!SP[e.type]?.apex&&d2(this,e)<42&&(SP[e.type]?.food||0)>0);
      if(prey){
        this.tx=prey.x;this.tz=prey.z;this.state='hunt';
        if(d2(this,prey)<3&&this.attackCd<=0){prey.takeDmg(10+Math.random()*7,this);this.attackCd=1.5;if(!prey.alive)this.hunger=Math.min(100,this.hunger+(prey.sp.food||20));}
        return;
      }
    }
    if(this.sex==='F'&&!this.pregnant&&this.hunger>52&&Math.random()<.00002*dt){
      const mate=all.find(e=>e.alive&&e.type===this.type&&e.sex==='M'&&d2(this,e)<20);
      if(mate){this.pregnant=true;this.gestT={deer:230,rabbit:30,mammoth:600,bison:270,wolf:63,bear:210,sabre:100,eagle:45,fish:18}[this.type]*86400*.08||3000;}
    }
    if(this.stT<=0||near(this,5)){
      const r=15+Math.random()*45,a=Math.random()*Math.PI*2;
      this.tx=clamp(this.x+Math.cos(a)*r,-CFG.W*.45,CFG.W*.45);
      this.tz=clamp(this.z+Math.sin(a)*r,-CFG.W*.45,CFG.W*.45);
      this.stT=3+Math.random()*7;this.state='wander';
    }
  }
  _birth(){
    this.pregnant=false;
    const b=new Animal(this.type,this.x+2,this.y,this.z+2);
    b.age=0;b.hunger=90;W.animals.push(b);buildAnimalMesh(b);SC.scene.add(b.mesh);W.births++;
  }
  _flee(e){const dx=this.x-e.x,dz=this.z-e.z,dd=Math.hypot(dx,dz)||1;this.tx=this.x+dx/dd*80;this.tz=this.z+dz/dd*80;this.state='flee';this.stT=4;}
  _move(simDt){
    const realSec=simDt/(Math.max(1,W.speed)*(86400/CFG.DAY_SEC));
    const sp2=ASPD[this.type]||4, mul=this.state==='flee'?1.6:1;
    const dx=this.tx-this.x,dz=this.tz-this.z,dd=Math.hypot(dx,dz);
    if(dd>0.2){const step=sp2*mul*realSec;this.x+=dx/dd*Math.min(step,dd);this.z+=dz/dd*Math.min(step,dd);this.rot=Math.atan2(dx,dz);}
    this.x=clamp(this.x,-CFG.W*.44,CFG.W*.44);this.z=clamp(this.z,-CFG.W*.44,CFG.W*.44);
  }
  takeDmg(a,s){this.hp-=a;if(this.hp<=0)this.die('tué');else if(s)this._flee(s);}
  die(c){this.alive=false;W.deaths++;log(`💀 ${this.name} mort (${c}).`,'world');}
}
const ANSPD={deer:7,rabbit:8.5,mammoth:4.5,bison:7,wolf:9,bear:6,sabre:11,eagle:18,fish:2.5};

// ── CONSCIENCE ÉMERGENTE ──────────────────────────────────────────────
