import {useEffect,useRef} from 'react';
import {projectedImagePlane} from './CorridorGeometry';
import {projectUV,homography,IMAGE_WIDTH,IMAGE_HEIGHT} from './ProjectiveGeometry';
import {ghostUV,ghostShimmer,ghostPeriod} from './PerPanelGhostMotion';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Three independent ghosts live on the 3 project image planes.
// Neither their position nor their image cycling depends on another frame.
export default function GhostScanner({svgRef,params,mouse,activeFrame,editing,visible,progress,onVisit}){
 const orbs=useRef([]);
 const latest=useRef(null);
 latest.current={params,mouse,activeFrame,editing,visible,progress,onVisit};
 useEffect(()=>{
  const svg=svgRef.current;
  if(!svg)return;
  let raf=0,last=0,disposed=false;
  const start=performance.now();
  const lastTurns=[0,0,0,0];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick=now=>{
   if(disposed)return;
   raf=requestAnimationFrame(tick);
   if(now-last<1000/35)return;
   last=now;
   const {params:q,mouse:m,activeFrame:hover,editing:edit,visible:shown,progress:p,onVisit:visit}=latest.current;
   const elapsed=(now-start)/1000;
   const enabled=!!q.idleScanEnabled&&shown&&p>=.96;
   for(let i=1;i<=3;i++){
    const orb=orbs.current[i];
    const target=svg.parentElement?.querySelector('[data-ghost-frame="'+i+'"]');
    if(!orb)continue;
    if(!enabled){orb.style.opacity='0';if(target)target.style.setProperty('--ghost-strength','0');continue}
    const t=reduced?0:elapsed;
    const [u,v]=ghostUV(i,t,q.idleScanSpeed,q.ghostRoamSpread);
    const plane=projectedImagePlane(i,q,m.x,m.y);
    const H=homography(plane);
    const [x,y]=projectUV(H,u,v);
    const width=Math.hypot(plane[1][0]-plane[0][0],plane[1][1]-plane[0][1]);
    // Ghost Size scales BOTH the localized image reveal and its SVG aura.
    // Avoid the old hard 112px cap that made the radius slider seem inert.
    const baseRadius=clamp((q.idleScanRadius??180)*IMAGE_WIDTH/Math.max(50,width)*.38,36,112);
    const localRadius=clamp(baseRadius*(q.ghostSize??1.7),9,IMAGE_WIDTH*.6);
    // The same patch is always present; never switch an entire frame on/off.
    const pulse=.9+.1*Math.sin(t*.59+i*1.35);
    const hovered=hover===i;
    const strength=pulse*(hovered?.42:edit?.75:1);
    const globalOpacity=clamp(q.idleScanOpacity??.32,0,.7);
    const aura=globalOpacity*(hovered?.5:1)*(.84+.16*Math.sin(t*.43+i));
    const [dx,dy]=ghostShimmer(i,t,q.ghostShimmerAmp??1,q.ghostShimmerSpeed??.85);
    orb.setAttribute('cx',x.toFixed(2));
    orb.setAttribute('cy',y.toFixed(2));
    orb.setAttribute('rx',Math.max(4,localRadius*width/IMAGE_WIDTH).toFixed(2));
    orb.setAttribute('ry',Math.max(3,localRadius*width/IMAGE_WIDTH*.8).toFixed(2));
    orb.style.opacity=aura.toFixed(3);
    if(target){
     target.style.setProperty('--ghost-x',(u*IMAGE_WIDTH).toFixed(2)+'px');
     target.style.setProperty('--ghost-y',(v*IMAGE_HEIGHT).toFixed(2)+'px');
     target.style.setProperty('--ghost-radius',localRadius.toFixed(1)+'px');
     target.style.setProperty('--ghost-strength',strength.toFixed(3));
     target.style.setProperty('--ghost-shimmer-x',dx.toFixed(3)+'px');
     target.style.setProperty('--ghost-shimmer-y',dy.toFixed(3)+'px');
     target.style.setProperty('--ghost-breath',String(1+(q.ghostBreath??.12)*pulse));
     target.style.setProperty('--ghost-blur',String(q.ghostBlur??.9)+'px');
     target.style.setProperty('--ghost-opacity',String(q.ghostOpacity??.9));
     target.style.setProperty('--ghost-crossfade',String(q.ghostCrossfade??4)+'s');
    }
    // Per-frame image rotation uses its own period; no shared queue.
    const turn=Math.floor(t/ghostPeriod(i,q.idleScanSpeed));
    if(turn>lastTurns[i]&&!edit&&hover===null&&!reduced)visit(i);
    lastTurns[i]=turn;
   }
  };
  raf=requestAnimationFrame(tick);
  return()=>{disposed=true;cancelAnimationFrame(raf)};
 },[svgRef]);
 return <g className="ghost-scanner-orb" pointerEvents="none" aria-hidden="true">
  <defs>
   <radialGradient id="venshalor-liquid-ghost">
    <stop offset="0%" stopColor="#e2e2e2" stopOpacity=".22"/>
    <stop offset="35%" stopColor="#d1d1d1" stopOpacity=".09"/>
    <stop offset="76%" stopColor="#bcbcbc" stopOpacity=".012"/>
    <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
   </radialGradient>
   {[1,2,3].map(i=><clipPath id={'venshalor-ghost-clip-'+i} key={i}
      clipPathUnits="userSpaceOnUse">
      <polygon points={projectedImagePlane(i,params,mouse.x,mouse.y).map(p=>p.join(',')).join(' ')}/>
     </clipPath>)}
  </defs>
  {[1,2,3].map(i=><ellipse key={i} ref={node=>{orbs.current[i]=node}}
   cx="640" cy="360" rx="25" ry="22" opacity="0"
   fill="url(#venshalor-liquid-ghost)" clipPath={'url(#venshalor-ghost-clip-'+i+')'}/>)}
 </g>;
}
