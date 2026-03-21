// GENESIS — world/noise.js — Bruit de Perlin

// ── BRUIT PERLIN ──────────────────────────────────────────────────────
const PERM = (() => {
  const p=Array.from({length:256},(_,i)=>i);
  let s=42;
  for(let i=255;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=s%(i+1);[p[i],p[j]]=[p[j],p[i]];}
  return new Uint8Array([...p,...p]);
})();
function fd(t){return t*t*t*(t*(t*6-15)+10);}
function lr(a,b,t){return a+t*(b-a);}
function gd(h,x,y){switch(h&3){case 0:return x+y;case 1:return-x+y;case 2:return x-y;default:return-x-y;}}
function pn(x,y){
  const X=Math.floor(x)&255,Y=Math.floor(y)&255;
  x-=Math.floor(x);y-=Math.floor(y);
  const u=fd(x),v=fd(y),a=PERM[X]+Y,b=PERM[X+1]+Y;
  return lr(lr(gd(PERM[a],x,y),gd(PERM[b],x-1,y),u),lr(gd(PERM[a+1],x,y-1),gd(PERM[b+1],x-1,y-1),u),v);
}
function fbm(x,y,o=6){let v=0,a=.5,f=1,m=0;for(let i=0;i<o;i++){v+=pn(x*f,y*f)*a;m+=a;a*=.5;f*=2.1;}return v/m;}
function wfbm(x,y){const qx=fbm(x,y),qy=fbm(x+5.2,y+1.3);return fbm(x+4*qx,y+4*qy);}

// ── ÉTAT MONDE ────────────────────────────────────────────────────────
