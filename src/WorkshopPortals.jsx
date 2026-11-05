import {memo,useEffect,useMemo,useRef,useState} from 'react';
import {frameDefaults} from './CorridorGeometry';
import {grains,settledPoint} from './DustMorph';
import {corridorDustStyle} from './CorridorDustStyle';
import {projectedFreeMediaStyle} from './CorridorMediaLayout';
import {workshopFrameQuad,workshopQuadBounds,workshopMediaYaw} from './WorkshopProjection';
import useWorkshopMedia from './useWorkshopMedia';
import ScanTitle from './ScanTitle';

const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
const grainsByFrame=Array.from({length:4},(_,frame)=>grains.filter((g,i)=>g.frame===frame&&i%4===0));
function Portal({event,index,scroll,viewportHeight,scale,editing,onEdit,onMove,onOpenMedia}){
 const canvas=useRef(null),element=useRef(null),drag=useRef(null);
 const isText=event.contentType==='text';
 const autoHeight=isText&&!event.manualTextHeight;
 const autoWidth=isText&&!event.manualTextWidth;
 const portalWidth=autoWidth?Math.max(460,event.width):event.width;
 const [naturalHeight,setNaturalHeight]=useState(event.height);
 const portalHeight=autoHeight?Math.max(event.height,naturalHeight):event.height;
 const layoutEvent={...event,width:portalWidth,height:portalHeight};
 const frame=useMemo(()=>workshopFrameQuad(layoutEvent,index),
  [portalWidth,portalHeight,event.z,event.yaw,event.pitch,index]);
 const screenY=viewportHeight*.49+event.y*scale-scroll;
 const visible=scroll>20&&screenY> -viewportHeight*.7-portalHeight*scale&&
  screenY<viewportHeight*1.7;
 const mediaUrl=useWorkshopMedia(visible?event.mediaId:'',visible?(event.mediaUrl||event.image):'');
 useEffect(()=>{
  if(!autoHeight||!visible)return;
  const host=element.current;
  if(!host)return;
  const measure=()=>setNaturalHeight(previous=>{
   const next=Math.ceil(host.scrollHeight);
   return Math.abs(previous-next)<2?previous:next;
  });
  measure();
  if(typeof ResizeObserver==='undefined')return;
  const observer=new ResizeObserver(measure);
  observer.observe(host);
  return()=>observer.disconnect();
 },[autoHeight,portalWidth,event.description,event.title,event.subtitle,visible]);

 const kind=event.contentType==='video'?'video':event.contentType==='image'?'image':'text';
 useEffect(()=>{
  const host=element.current;
  if(!host)return;
  const onPointer=e=>{
   const mx=(e.clientX/window.innerWidth-.5)*2,my=(e.clientY/window.innerHeight-.5)*2;
   host.style.setProperty('--portal-mx',(mx*(event.parallaxX||0)).toFixed(2)+'px');
   host.style.setProperty('--portal-my',(my*(event.parallaxY||0)).toFixed(2)+'px');
  };
  window.addEventListener('pointermove',onPointer,{passive:true});
  return()=>window.removeEventListener('pointermove',onPointer);
 },[visible,event.parallaxX,event.parallaxY]);
 useEffect(()=>{
  if(!visible)return;
  const el=canvas.current;if(!el)return;
  const dpr=Math.min(window.devicePixelRatio||1,1.4);
  const iw=Math.round(portalWidth*dpr),ih=Math.round(portalHeight*dpr);
  if(el.width!==iw)el.width=iw;if(el.height!==ih)el.height=ih;
  let ctx;try{ctx=el.getContext('2d')}catch{return}
  if(!ctx)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,portalWidth,portalHeight);
  const quads=[frame,frame,frame,frame];
  const grainsForTemplate=grainsByFrame[1+index%3];
  for(const grain of grainsForTemplate){
   const [x,y]=settledPoint(grain,0,quads,frameDefaults);
   const dust=corridorDustStyle(grain,1+index%3);
   ctx.fillStyle='rgba(255,255,255,'+dust.alpha.toFixed(3)+')';
   ctx.fillRect(x,y,dust.size,dust.size);
  }
 },[visible,frame,portalWidth,portalHeight,index]);
 const start=e=>{
  if(!editing)return;
  e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId);
  onEdit(event.id);
  drag.current={id:e.pointerId,cx:e.clientX,cy:e.clientY,x:event.x,y:event.y};
 };
 const move=e=>{
  const d=drag.current;
  if(!d||d.id!==e.pointerId)return;
  onMove(event.id,{x:Math.round(clip(d.x+(e.clientX-d.cx)/scale,-650,650)),
   y:Math.round(clip(d.y+(e.clientY-d.cy)/scale,0,20000))});
 };
 const stop=e=>{
  drag.current=null;
  if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 };
 if(!visible)return null; // No offscreen DOM, media playback or sweep loops.
 const mediaStyle=projectedFreeMediaStyle(frame,{
  x:event.mediaX??0,y:event.mediaY??0,
  width:event.mediaWidth??270,height:event.mediaHeight??160
 },{width:event.width,height:event.height});
 const b=workshopQuadBounds(frame);
 return <article ref={element} className={'workshop-portal is-visible'+(isText?' workshop-portal--text':'')+(autoHeight?' workshop-portal--text-auto-height':'')}
  data-workshop-event={event.id}
  style={{left:'calc(50% + '+event.x+'px)',top:event.y,
   width:portalWidth,...(autoHeight?{minHeight:event.height}:{height:event.height})}}
  onPointerDown={start} onPointerMove={move}
  onPointerUp={stop} onPointerCancel={stop}>
  <canvas className="workshop-portal__dust" ref={canvas} aria-hidden="true"/>
  {kind!=='text'&&mediaUrl&&<button type="button"
   className="workshop-portal__media-button"
   aria-label={'Expand '+(event.title||'corridor')+' media'}
   onClick={()=>{if(editing)onEdit(event.id);else onOpenMedia({event})}}>
   <span className="workshop-portal__projected-image"
    style={mediaStyle}>
    {kind==='video'?
     <video src={mediaUrl} muted playsInline preload="metadata"/>:
     <img src={mediaUrl} alt={event.title} draggable="false"
      style={{objectFit:'contain'}}/>}
   </span><span className="workshop-portal__expand-hint">VIEW {kind==='video'?'VIDEO':'IMAGE'} +</span>
  </button>}
  {(kind==='text'||!mediaUrl)&&<div className="workshop-portal__copy"
   style={isText?undefined:{left:b.minX+20,width:Math.max(120,b.maxX-b.minX-40)}}>
   <p className="workshop-portal__description">{event.description}</p>
  </div>}
  <div className="workshop-portal__footer">
   <ScanTitle text={event.title} duration={frameDefaults.titleSweepSpeed} offset={index*1.5}/>
   <small>{event.subtitle}</small>
  </div>
  {editing&&<span className="workshop-portal__drag-hint">DRAG TO MOVE / EDIT IN PANEL</span>}
 </article>;
}
export default memo(function WorkshopPortals(props){
 return <>{props.events.map((event,index)=><Portal key={event.id}
  event={event} index={index} {...props}/>)}</>;
});
