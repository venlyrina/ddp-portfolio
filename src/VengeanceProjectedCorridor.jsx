import {useEffect,useMemo,useRef,useState} from 'react';
import {frameDefaults,projectedFrame,projectedMediaYaw} from './CorridorGeometry';
import {grains,settledPoint} from './DustMorph';
import {corridorDustStyle} from './CorridorDustStyle';
import {projectedFreeMediaStyle} from './CorridorMediaLayout';

// Exactly the portfolio's world-space geometry, projection, edge grains,
// camera eye position and matrix3d image mapping. Only the number of portal
// instances and their vertical camera offset differ from the original scene.
const TEMPLATES=[1,2,3];
export const EXTRA_PORTAL_SPACING=900;
// Reuse deterministic edge grains, but draw a balanced subset on the project route.
// Rendering 12k particles on every mouse/scroll event was unnecessarily costly.
const grainPools=Array.from({length:4},(_,frame)=>grains.filter((g,i)=>g.frame===frame&&i%3===0));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const textBox=quad=>{
 const xs=quad.map(p=>p[0]),ys=quad.map(p=>p[1]);
 return {x:Math.min(...xs),y:Math.min(...ys),
  width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
};
const shift=(quad,dy)=>quad.map(([x,y])=>[x,y+dy]);
const center=quad=>quad.reduce(([x,y],p)=>[x+p[0]/4,y+p[1]/4],[0,0]);
function portalGeometry(corridor,index,mouse,scrollY){
 const slot=corridor._slotIndex??index;
 const group=corridor._groupIndex??Math.floor(index/3);
 const template=TEMPLATES[slot%TEMPLATES.length];
 const f=corridor.frame||{};
 const params={
  ...frameDefaults,frames:frameDefaults.frames.map(frame=>({...frame})),
 };
 const original=params.frames[template];
 params.frames[template]={
  ...original,
  x:original.x+(Number(f.x)||0)/85,
  y:original.y+(Number(f.y)||0)/85,
  z:original.z+((Number(f.z)||0)+80)/105,
  yaw:original.yaw+(Number(f.yaw)||0),
  width:original.width*clamp((Number(f.width)||640)/640,.32,2.6),
  height:original.height*clamp((Number(f.height)||500)/500,.32,2.6),
 };
 const xMouse=mouse.x*clamp((Number(f.parallaxX)||0)/14,0,3);
 const yMouse=mouse.y*clamp((Number(f.parallaxY)||0)/14,0,3);
 const base=projectedFrame(template,params,xMouse,yMouse);
 // Every triplet reuses the same three home-corridor projection slots.
 // Entire groups, not individual cards, sit further down the scroll world.
 const dy=group*EXTRA_PORTAL_SPACING+Math.floor(slot/3)*225-scrollY;
 return {template,quad:shift(base,dy),mediaYaw:projectedMediaYaw(template,params)};
}
function drawDust(ctx,quad,particles,scale,ox,oy,opacity=1){
 // DustMorph.settledPoint expects a frames[grain.frame] array, not a
 // single quad. Reusing its original grain pool with one quad caused
 // edgePoint() to access undefined and crash the entire React route.
 const frameQuads=[quad,quad,quad,quad];
 ctx.save();ctx.setTransform(scale,0,0,scale,ox,oy);
 for(const grain of particles){
  const [x,y]=settledPoint(grain,0,frameQuads,frameDefaults);
  const dust=corridorDustStyle(grain,grain.frame);
  ctx.fillStyle='rgba(255,255,255,'+clamp(opacity*dust.alpha,0,1).toFixed(3)+')';
  ctx.fillRect(x,y,dust.size,dust.size);
 }
 ctx.restore();
}
function ProjectedImage({artifact,corridor,quad,mediaYaw}){
 const source=artifact.image;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[source]);
 if(!source||failed)return null;
 // Uniformly scale with projected corridor size, without squeezing source pixels.
 const style=projectedFreeMediaStyle(quad,artifact,{width:Number(corridor.frame?.width)||640,height:Number(corridor.frame?.height)||500});
 return <div className="vng-projected-image" style={style}>
  <img src={source} alt={artifact.title||corridor.title}
   draggable="false" onError={()=>setFailed(true)} style={{objectFit:'contain'}}/>
 </div>;
}
export default function VengeanceProjectedCorridor({corridors,mouse,scrollY,body,title,activeGroup=0,wordRevealProgress=0,outroProgress=0,editing=false}){
 const root=useRef(null),canvas=useRef(null);
 const [viewport,setViewport]=useState({width:1280,height:720});
 // Never pre-spawn a future editorial's media. Its portals inherit
 // visibility from the first word of the left text with the same ID.
 // Edit mode previews the selected text's attached corridors regardless
 // of word reveal state. Scrubbing the editor must never make the media vanish.
 const shownCorridors=useMemo(()=>corridors.filter(c=>editing
  ? c._groupIndex===activeGroup
  : c._groupIndex<activeGroup ||
   (c._groupIndex===activeGroup&&wordRevealProgress>0)),
  [corridors,activeGroup,editing,wordRevealProgress>0]);
 const geometry=useMemo(()=>shownCorridors.map(corridor=>
  portalGeometry(corridor,corridors.indexOf(corridor),mouse,
   editing?activeGroup*EXTRA_PORTAL_SPACING:scrollY)),
  [shownCorridors,corridors,mouse,scrollY,editing,activeGroup]);
 const editorialQuad=useMemo(()=>projectedFrame(0,frameDefaults,mouse.x,mouse.y),
  [mouse.x,mouse.y]);
 // Measure text on neutral geometry and move its entire block with the frame.
 // This is precisely the original ProjectPortals parallax strategy.
 const editorialBase=useMemo(()=>projectedFrame(0,frameDefaults,0,0),[]);
 const editorial=textBox(editorialBase);
 const editorialMotion=center(editorialQuad).map((value,i)=>value-center(editorialBase)[i]);
 useEffect(()=>{
  const host=root.current;if(!host)return;
  const measure=()=>setViewport(previous=>{
   const width=host.clientWidth||1280,height=host.clientHeight||720;
   return previous.width===width&&previous.height===height?previous:{width,height};
  });
  measure();
  if(typeof ResizeObserver!=='undefined'){
   const observer=new ResizeObserver(measure);observer.observe(host);
   return()=>observer.disconnect();
  }
  window.addEventListener('resize',measure);
  return()=>window.removeEventListener('resize',measure);
 },[]);
 const scale=Math.max(viewport.width/1280,viewport.height/720);
 const ox=(viewport.width-1280*scale)/2,oy=(viewport.height-720*scale)/2;
 useEffect(()=>{
  const host=root.current,el=canvas.current;
  if(!host||!el)return;
  const paint=()=>{
   const w=host.clientWidth,h=host.clientHeight;
   if(w<=0||h<=0)return;
   const dpr=Math.min(window.devicePixelRatio||1,1.5);
   const pixelW=Math.round(w*dpr),pixelH=Math.round(h*dpr);
   if(el.width!==pixelW)el.width=pixelW;
   if(el.height!==pixelH)el.height=pixelH;
   let ctx;
   try{ctx=el.getContext('2d')}catch{return}
   if(!ctx)return;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
   const scale=Math.max(w/1280,h/720);
   const ox=(w-1280*scale)/2,oy=(h-720*scale)/2;
   ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
   const scaleDpr=scale*dpr;
   // Left editorial has no dust frame: only the right portal group draws edges.
   for(let i=0;i<geometry.length;i++){
    const quad=geometry[i].quad;
    const screenY=quad.map(point=>point[1]);
    if(Math.max(...screenY)<-60||Math.min(...screenY)>720+60)continue;
    const particles=grainPools[geometry[i].template];
    drawDust(ctx,quad,particles,scaleDpr,ox*dpr,oy*dpr,.95);
   }
   ctx.restore();
  };
  // Viewport measurement is already handled by the component's dedicated
  // ResizeObserver. Re-observing the canvas here painted every scroll twice.
  paint();
 },[geometry,viewport.width,viewport.height]);
 return <div className="vng-projected-stage" ref={root}>
  <canvas ref={canvas} className="vng-projected-stage__dust" aria-hidden="true"/>
  <div className="vng-projected-stage__world" style={{transform:`translate(${ox}px,${oy}px) scale(${scale})`}}>
   <div className="vng-projected-stage__editorial" style={{
    left:editorial.x+editorial.width*.09,top:editorial.y+editorial.height*.09,
    width:editorial.width*.82,height:editorial.height*.82,
    transform:'translate('+editorialMotion[0].toFixed(2)+'px,'+
     editorialMotion[1].toFixed(2)+'px) translateY('+(-720*outroProgress).toFixed(2)+'px)',
    opacity:Math.max(0,1-outroProgress*2)
   }}>
    {title}
    <div key={activeGroup} className="vng-projected-stage__editorial-group">
     {body}
    </div>
   </div>
   {/* VENGEANCE is a pure image gallery. No per-corridor or per-artifact
       captions render over the photographs. */}
   {shownCorridors.map((corridor,index)=><div
    className="vng-projected-portal vng-projected-portal--word-linked"
    key={corridor.id} data-vng-corridor={corridor.id}>
    {corridor.artifacts.map(artifact=><ProjectedImage key={artifact.id}
     corridor={corridor} artifact={artifact} quad={geometry[index].quad}
     mediaYaw={geometry[index].mediaYaw}/>)}
   </div>)}
  </div>
 </div>;
}
