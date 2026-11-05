import {useEffect,useRef} from 'react';
import {grains,clamp,countFor,framePixels,settledPoint} from './DustMorph';
import {silhouetteConvergence} from './MorphTiming';

// Only particulate material is visible. The four frame polygons are hidden
// geometry used to place the grains and to bend sparse magnetic filaments.
export default function LivingFrames({visible,progress,params,mouse,activeFrame=null}){
 const canvas=useRef(null);
 const live=useRef({progress,params,mouse,activeFrame});
 live.current={progress,params,mouse,activeFrame};
 useEffect(()=>{
  if(!visible)return;
  const el=canvas.current;
  const ctx=el.getContext('2d',{alpha:true});
  if(!ctx)return;
  let raf=0,last=0,w=0,h=0,dpr=1;
  let lastHovered=null;
  const arcMomentum=[0,0,0,0],arcPhase=[0,1.3,2.7,4.5];
  let disposed=false;
  const resize=()=>{
   dpr=Math.min(window.devicePixelRatio||1,1.5);
   w=Math.max(1,el.clientWidth);h=Math.max(1,el.clientHeight);
   el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);
  };
  const observer=new ResizeObserver(resize);
  observer.observe(el);
  resize();
  const paint=now=>{
   if(disposed)return;
   raf=requestAnimationFrame(paint);
   if(now-last<1000/45)return;
   const {progress:p,params:q,mouse:m,activeFrame:focused}=live.current;
   const dt=Math.min(.06,(now-last)/1000||.022);
   last=now;
   if(focused!==lastHovered){if(focused!==null)arcMomentum[focused]=q.hoverArcBoost??8;lastHovered=focused}
   for(let k=0;k<4;k++){arcMomentum[k]*=Math.exp(-dt*1.8);arcPhase[k]+=dt*(q.energyArcSpeed??.65)*(1+arcMomentum[k])}
   ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.clearRect(0,0,w,h);
   const seconds=now/1000;
   const frames=framePixels(q,w,h,m.x,m.y);
   const count=countFor(q);
   ctx.globalCompositeOperation='screen';
   const edgeBrightness=q.edgeBrightness??.5;
   const edgeOpacity=q.edgeOpacity??.8;
   const twinkleStrength=q.edgeTwinkle??1;
   // Give the visitor an early, precise silhouette, using the *same* dust
   // frame geometry as the finished corridor. These guide particles fade as
   // the vortex material actually settles, so no rigid line pops in.
   const guide=silhouetteConvergence(p);
   if(guide>0&&p<.93){
    const guideFade=guide*(1-clamp((p-.65)/.28));
    for(let i=0;i<2000;i+=2){
     const g=grains[i];
     const [x,y]=settledPoint(g,seconds,frames,q);
     const alpha=clamp(guideFade*(.15+.3*g.sparkle)*q.edgeBrightness,0,.65);
     ctx.fillStyle='rgba(255,255,255,'+alpha.toFixed(3)+')';
     ctx.fillRect(x,y,.4+.35*g.size,.4+.35*g.size);
    }
   }
   for(let i=0;i<count;i++){
    const g=grains[i];
    if(p<g.release+g.duration)continue;
    const [x,y]=settledPoint(g,seconds,frames,q);
    const settings=q.frames[g.frame];
    const shimmer=1+twinkleStrength*Math.sin(seconds*(q.edgeTwinkleRate??5)*(1+g.offset*.45)+g.twinkle);
    const nearCorner=(g.position<.07||g.position>.93)?1.25:1;
    const arrived=p-(g.release+g.duration);
    const arrivalSpark=Math.exp(-Math.pow((arrived-.026)/.021,2));
    const hoverLight=focused===g.frame?(q.hoverFrameLight??3):1;
    const alpha=clamp(edgeOpacity*edgeBrightness*q.light*settings.light
      *(.13+.47*g.sparkle)*shimmer*nearCorner*(1+arrivalSpark*.6)*hoverLight,0,1);
    const size=(q.edgeDustSize??.7)*(.28+.7*g.size)*settings.stroke;
    ctx.fillStyle='rgba(242,249,255,'+alpha.toFixed(3)+')';
    ctx.fillRect(x,y,Math.max(.25,size),Math.max(.25,size));
    if(g.sparkle>.998&&Math.sin(seconds*1.7+g.twinkle)>.91){
      ctx.strokeStyle='rgba(248,253,255,'+(alpha*.8).toFixed(3)+')';
      ctx.lineWidth=.45;ctx.beginPath();
      ctx.moveTo(x-2.8,y);ctx.lineTo(x+2.8,y);
      ctx.moveTo(x,y-2.3);ctx.lineTo(x,y+2.3);
      ctx.stroke();
    }
   }
   // Reuses the stellar hero's EnergyRibbons field: three airy strands,
   // two interfering sine waves, tapered ends and organic displacement.
   // Each frame has an independently easing magnetic impulse on hover.
   const energy=Math.max(0,q.energyArcLight??.26);
   const arcs=Math.max(0,Math.round(q.energyArcCount??4));
   if(energy&&arcs&&p>.57){
    ctx.save();ctx.lineCap='round';ctx.globalAlpha=clamp((p-.57)/.35);
    for(let frame=0;frame<4;frame++){
     const quad=frames[frame],boost=frame===focused?1.9:1;
     const phase=arcPhase[frame];
     for(let a=0;a<arcs;a++){
      const seed=frame*2.399963+a*1.17+.45;
      const active=.5+.5*Math.sin(phase*.67+seed*2.1);
      if(active<.13)continue;
      const edge=(frame+a*3)%4,v0=quad[edge],v1=quad[(edge+1)%4];
      const vx=v1[0]-v0[0],vy=v1[1]-v0[1];
      const length=Math.max(1,Math.hypot(vx,vy)),nx=-vy/length,ny=vx/length;
      const span=clamp(q.energyArcLength??.65,.03,.65);
      const travel=(phase*.075+seed*.087)%1;
      const origin=travel*(1-span);
      const bend=(q.energyArcCurvature??4.5);
      for(let strand=0;strand<3;strand++){
       let previous=null;
       const steps=30;
       for(let j=0;j<=steps;j++){
        const u=j/steps;
        const taper=Math.pow(Math.max(0,Math.sin(Math.PI*u)),1.65);
        const along=origin+span*u;
        const wave=Math.sin(u*Math.PI*3.8+seed+phase*1.7);
        const wave2=Math.sin(u*11.5+seed*2.3-phase);
        const offset=bend*taper*(.72*wave+.28*wave2)+(strand-1)*.9;
        const point=[v0[0]+vx*along+nx*offset,v0[1]+vy*along+ny*offset];
        if(previous){
         const strength=clamp(energy*q.light*q.frames[frame].light*active*
           (strand===1?.51:.16)*taper*boost,0,.85);
         if(strength>.002){
          ctx.beginPath();ctx.moveTo(previous[0],previous[1]);ctx.lineTo(point[0],point[1]);
          ctx.lineWidth=Math.max(.2,(q.energyArcWidth??.6)*(strand===1?1:.65));
          ctx.strokeStyle='rgba(232,241,250,'+strength.toFixed(3)+')';
          ctx.stroke();
         }
        }
        previous=point;
       }
      }
     }
    }
    ctx.restore();
   }
   ctx.globalCompositeOperation='source-over';
  };
  raf=requestAnimationFrame(paint);
  return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect()};
 },[visible]);
 return <canvas ref={canvas} className="corridor-dust-canvas" aria-hidden="true"/>;
}
