import {memo,useRef} from 'react';
import ScanTitle from './ScanTitle';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function Marker({anchor,scroll,viewportHeight,scale,editing,onSelect,onMove}){
 const drag=useRef(null);
 const screenY=viewportHeight*.49+anchor.y*scale-scroll;
 const visible=scroll>8&&screenY> -viewportHeight*.5&&
  screenY<viewportHeight*1.45;
 if(!visible)return null;
 const start=e=>{
  if(!editing)return;
  e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId);
  onSelect(anchor.id);
  drag.current={id:e.pointerId,start:e.clientY,y:anchor.y};
 };
 const move=e=>{
  const d=drag.current;if(!d||d.id!==e.pointerId)return;
  onMove(anchor.id,clamp(Math.round(d.y+(e.clientY-d.start)/scale),0,20000));
 };
 const stop=e=>{
  drag.current=null;
  if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 };
 return <section className={'workshop-marker workshop-marker--'+anchor.side}
  data-workshop-marker={anchor.id} aria-label={'Timeline '+anchor.year+' '+anchor.title}
  style={{top:anchor.y,left:'50%',
   width:(anchor.width||360)+(anchor.offset??68),
   '--marker-offset':(anchor.offset??68)+'px',
   '--marker-text-width':(anchor.width||360)+'px'}}
  onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
  <span className="workshop-marker__rule" aria-hidden="true"/>
  <div className="workshop-marker__content">
   <span className="workshop-marker__year">{anchor.year}</span>
   <ScanTitle text={anchor.title} className="workshop-marker__title" duration={5.8}/>
   {anchor.note&&<p className="workshop-marker__note">{anchor.note}</p>}
   {editing&&<span className="workshop-marker__hint">DRAG YEAR / EDIT IN TIMELINE TAB</span>}
  </div>
 </section>;
}
export default memo(function WorkshopMarkers(props){
 return <div className="workshop-markers">
  {props.anchors.map(anchor=><Marker key={anchor.id} anchor={anchor} {...props}/>)}
 </div>;
});
