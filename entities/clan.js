// GENESIS — entities/clan.js

class Clan{
  constructor(founder1,founder2){
    this.id=_eid++;
    this.name=`Clan ${CLAN_NAMES_N[~~(Math.random()*CLAN_NAMES_N.length)]} ${CLAN_NAMES_ADJ[~~(Math.random()*CLAN_NAMES_ADJ.length)]}`;
    this.leader=founder1;
    this.members=[founder1,founder2];
    this.hasFire=founder1.skills?.feu>.1||founder2.skills?.feu>.1;
    this.territory={x:founder1.x,z:founder1.z,r:40};
    founder1.clan=this;founder2.clan=this;
    this.age=0;
    this.splitThreshold=12+Math.floor(Math.random()*6);  // se sépare au-delà de ce nombre
  }
  addMember(h){
    if(!this.members.includes(h)){this.members.push(h);h.clan=this;}
  }
  tick(dt,all){
    this.age+=dt;
    this.members=this.members.filter(m=>m.alive);
    if(!this.members.length){W.clans=W.clans.filter(c=>c!==this);return;}
    // Élire un nouveau chef si l'actuel est mort
    if(!this.leader?.alive)this.leader=this.members.reduce((b,m)=>((m.skills?.chasse||0)+(m.skills?.feu||0))>((b?.skills?.chasse||0)+(b?.skills?.feu||0))?m:b,null);
    // Partage de connaissances (tous les X secondes)
    if(Math.floor(this.age/30)!==Math.floor((this.age-dt)/30)){
      this._shareKnowledge();
    }
    // Fission du clan si trop grand
    if(this.members.length>=this.splitThreshold&&W.clans.length<8){
      this._split(all);
    }
    // Mettre à jour hasFire
    this.hasFire=this.members.some(m=>m.skills?.feu>.08);
  }
  _shareKnowledge(){
    // Le membre le plus compétent enseigne aux autres
    for(const sk of SK_KEYS){
      const best=this.members.reduce((b,m)=>(m.skills?.[sk]||0)>(b.skills?.[sk]||0)?m:b,this.members[0]);
      if(!best)continue;
      for(const m of this.members){
        if(m!==best){
          const gain=((best.skills?.[sk]||0)-(m.skills?.[sk]||0))*.02;
          if(gain>0)m._learn?.(sk,gain);
        }
      }
    }
  }
  _split(all){
    const half=Math.floor(this.members.length/2);
    const group2=this.members.splice(half);
    if(group2.length<2)return;
    // Nouveau clan qui s'éloigne
    const nc=new Clan(group2[0],group2[1]);
    group2.forEach(m=>{m.clan=nc;});
    W.clans.push(nc);
    // Partir vers un nouveau territoire
    const angle=Math.random()*Math.PI*2;
    const dist=80+Math.random()*120;
    group2.forEach(m=>{
      m.tx=clamp(m.x+Math.cos(angle)*dist,-CFG.W*.44,CFG.W*.44);
      m.tz=clamp(m.z+Math.sin(angle)*dist,-CFG.W*.44,CFG.W*.44);
      m.state='explore';
    });
    log(`👥 Le clan se divise! ${nc.name} part vers de nouveaux territoires.`,'social');
    addChron(`Fission : ${nc.name} fondé`,'🔀');
  }
}
