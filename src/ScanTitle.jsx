import {memo,useEffect,useRef} from 'react';
import './ScanTitle.css';

// One moving light source per entire title, independent of word/letter count.
// Directly update only the lightweight white overlays: no React render loop,
// no duplicated CSS animations, and no reflow while parallax is moving.
const ScanTitle=memo(function ScanTitle({text,className='',duration=5.8,intensity=1,offset=0}) {
 const root=useRef(null);
 useEffect(()=>{
  const host=root.current;
  if(!host)return;
  const glyphs=Array.from(host.querySelectorAll('.project-portal__glyph'));
  const lights=glyphs.map(el=>el.querySelector('.project-portal__glint'));
  let widths=[],total=1,raf=0,last=0,disposed=false;
  const measure=()=>{
   widths=glyphs.map(el=>el.offsetLeft+el.offsetWidth*.5);
   total=Math.max(1,host.scrollWidth);
  };
  measure();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
  observer?.observe(host);
  if(document.fonts?.ready)document.fonts.ready.then(()=>{if(!disposed)measure()});
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
  const period=Math.max(2,Number(duration)||5.8);
  const power=Math.max(0,Math.min(1,Number(intensity)||0));
  // 72% of each cycle is one uninterrupted left-to-right pass;
  // remaining 28% is stillness before the NEXT pass.
  const draw=now=>{
   if(disposed)return;
   raf=requestAnimationFrame(draw);
   if(now-last<1000/45)return;
   last=now;
   const phase=((now/1000+offset)%period)/period;
   const active=!reduced&&phase<.72&&power>0;
   const radius=Math.max(9,Math.min(29,total*.1));
   const center=active?(-radius*2+(total+radius*4)*(phase/.72)):0;
   for(let i=0;i<lights.length;i++){
    const dx=widths[i]-center;
    const glow=active?Math.exp(-.5*(dx/radius)**2)*power:0;
    lights[i].style.opacity=glow.toFixed(3);
   }
  };
  raf=requestAnimationFrame(draw);
  return()=>{disposed=true;cancelAnimationFrame(raf);observer?.disconnect()};
 },[text,duration,intensity,offset]);
 return <span ref={root} className={'project-portal__scan '+className} aria-label={text}>
  {Array.from(text).map((glyph,i)=><span aria-hidden="true" key={i}
    className="project-portal__glyph">{glyph===' '?'\u00a0':glyph}
    <span className="project-portal__glint" aria-hidden="true">{glyph===' '?'\u00a0':glyph}</span>
   </span>)}
 </span>;
});


export default ScanTitle;
