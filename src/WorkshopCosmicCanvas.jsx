import {useEffect,useRef} from 'react';
import './WorkshopPage.css';

const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const rand=n=>{const x=Math.sin(n*127.13+17.23)*43758.5453;return x-Math.floor(x)};
const vertex4=i=>[i&1?1:-1,i&2?1:-1,i&4?1:-1,i&8?1:-1];
const hyperEdges=Array.from({length:16},(_,i)=>
 Array.from({length:4},(_,j)=>i^(1<<j)).filter(j=>j>i).map(j=>[i,j])).flat();
const shardStar=[
 [0,-1],[.2,-.32],[.67,-.57],[.4,-.12],[1,.07],
 [.37,.25],[.55,.75],[.09,.42],[-.08,1],[-.24,.36],
 [-.88,.62],[-.45,.13],[-1,-.09],[-.38,-.22],
 [-.59,-.76],[-.12,-.39]
];
// Independent immutable direction and velocity for each streak; no parallax.
const meteorSeeds=Array.from({length:13},(_,i)=>{
 const angle=.47+rand(i+18)*.40;
 const vx=Math.cos(angle),vy=Math.sin(angle);
 const entryAtTop=rand(i+70)>.45;
 const startX=entryAtTop?(rand(i+90)*1.55-.48):-.34;
 const startY=entryAtTop?-.34:(rand(i+47)*1.55-.48);
 return {seed:i,startX,startY,vx,vy,speed:.29+rand(i+3)*.26,
  delay:rand(i+12)*8,len:42+rand(i+33)*125};
});
function project4(point,theta,phi,depth){
 let [x,y,z,w]=point;
 const a=theta,b=phi,c=theta*.63;
 let xx=x*Math.cos(a)-w*Math.sin(a),ww=x*Math.sin(a)+w*Math.cos(a);
 let yy=y*Math.cos(b)-z*Math.sin(b),zz=y*Math.sin(b)+z*Math.cos(b);
 const xy=xx*Math.cos(c)-yy*Math.sin(c);
 const py=xx*Math.sin(c)+yy*Math.cos(c);
 const perspective=2.8/(3.6-ww*.45-zz*.18);
 return [xy*perspective*depth,py*perspective*depth,ww];
}
export default function WorkshopCosmicCanvas({scrollRef}){
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current;
  if(!canvas)return;
  let raf=0,w=0,h=0,dpr=1,last=0,start=performance.now();
  const schedule=typeof requestAnimationFrame==='function'?requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()),33);
  const cancel=typeof cancelAnimationFrame==='function'?cancelAnimationFrame:clearTimeout;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
  const resize=()=>{
   const rect=canvas.getBoundingClientRect();
   w=Math.max(1,rect.width);h=Math.max(1,rect.height);
   dpr=Math.min(window.devicePixelRatio||1,1.5);
   canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  };
  resize();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
  observer?.observe(canvas);
  const draw=now=>{
   raf=schedule(draw);
   if(now-last<(reduced?1000:1000/33))return;
   last=now;
   let ctx;
   try{ctx=canvas.getContext('2d')}catch{return}
   if(!ctx)return;
   ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.clearRect(0,0,w,h);
   const t=(now-start)/1000,scroll=scrollRef.current||0;
   const cx=w*.5,cy=h*.49,scale=Math.min(w,h)/710;
   const latticeAlpha=clamp((t-.65)/1.35)*clamp(1-scroll/210);
   const coreAlpha=clamp((t-1.25)/.8);
   // Each meteor follows exactly its own direction vector from outside one
   // boundary to outside the opposite boundary. The trail uses the SAME vector.
   const travelSize=Math.hypot(w,h)*1.95;
   for(const star of meteorSeeds){
    const period=travelSize/(Math.min(w,h)*star.speed)+1.5;
    const phase=((t+star.delay)%period)/period;
    const distance=phase*travelSize;
    const x=star.startX*w+star.vx*distance;
    const y=star.startY*h+star.vy*distance;
    const sx=x-star.vx*star.len,sy=y-star.vy*star.len;
    const grad=ctx.createLinearGradient(sx,sy,x,y);
    grad.addColorStop(0,'rgba(255,255,255,0)');
    grad.addColorStop(.75,'rgba(255,255,255,.14)');
    grad.addColorStop(1,'rgba(255,255,255,.84)');
    ctx.strokeStyle=grad;
    ctx.lineWidth=.45+rand(star.seed+1)*.7;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(x,y);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.fillRect(x-.5,y-.5,1,1);
   }
   if(latticeAlpha>.003){
    ctx.save();ctx.globalAlpha=latticeAlpha;
    // Keep every projected vertex within the canvas, even with 4D rotation.
    const radius=Math.min(150,Math.min(w,h)*.18);
    for(let shell=0;shell<5;shell++){
     const theta=(reduced?.35:t*.09)*(shell%2?-1:1)+shell*.38;
     const phi=(reduced?.65:t*.055)+shell*.81;
     const r=radius*(.38+shell*.185);
     const points=Array.from({length:16},(_,i)=>{
      const [x,y,z]=project4(vertex4(i),theta,phi,r);
      return [cx+x,cy+y,z];
     });
     for(const [a,b] of hyperEdges){
      const p=points[a],q=points[b];
      const glint=.16+.18*(Math.sin(t*1.25+shell+zFactor(p,q))*.5+.5);
      ctx.strokeStyle='rgba(255,255,255,'+clamp(glint,0,.7)+')';
      ctx.lineWidth=shell%2?.45:.7;
      ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();
      // A displaced second refraction of selected struts, no blocky solid cube.
      if((a+b+shell)%5===0){
       ctx.strokeStyle='rgba(255,255,255,.08)';
       ctx.beginPath();ctx.moveTo(p[0]+6,p[1]-4);ctx.lineTo(q[0]+6,q[1]-4);ctx.stroke();
      }
     }
    }
    ctx.restore();
   }
   // The core arrives after the meteor shower and the folding lattice.
   ctx.save();ctx.globalAlpha=coreAlpha;
   // Crystalline twinkle: asymmetric jagged star polygons, never a circle.
   const pulse=reduced?1:1+.14*Math.sin(t*3.2)+.07*Math.sin(t*8.8);
   const coreR=(8+Math.min(w,h)*.004)*pulse;
   ctx.save();ctx.translate(cx,cy);ctx.rotate(reduced?0:t*.035);
   for(let layer=5;layer>=0;layer--){
    const r=coreR*(1+layer*.3);
    ctx.beginPath();
    shardStar.forEach(([x,y],i)=>{const p=[x*r,y*r];
     if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);
    });ctx.closePath();
    ctx.fillStyle='rgba(255,255,255,'+(.022+(5-layer)*.025)+')';
    ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,'+(.10+(5-layer)*.12)+')';
    ctx.lineWidth=.5;ctx.stroke();
   }
   ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=.7;
   for(let k=0;k<8;k++){
    const a=k*TAU/8,tan=(k%2?.6:1)*coreR;
    ctx.beginPath();ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(a)*tan*1.5,Math.sin(a)*tan*1.5);ctx.stroke();
   }
   ctx.restore();
   // No circular glow disk: faceted white facets define the source.
   ctx.restore();
  };
  function zFactor(p,q){return (p[2]+q[2])*.2}
  raf=schedule(draw);
  return()=>{cancel(raf);observer?.disconnect()};
 },[scrollRef]);
 return <canvas className="workshop-cosmic-canvas" ref={ref} aria-hidden="true"/>;
}
