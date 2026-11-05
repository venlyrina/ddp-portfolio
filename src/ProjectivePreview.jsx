import {useEffect,useRef,useState} from 'react';
import {projectedImagePlane} from './CorridorGeometry';
import {mediaConvergence} from './MorphTiming';
import {IMAGE_WIDTH,IMAGE_HEIGHT,projectiveCSS} from './ProjectiveGeometry';
import './ProjectivePreview.css';

// Deliberately render into a normal HTML overlay, NOT into an SVG foreignObject.
// Chromium/Brave can lose the entire SVG layer when combining matrix3d,
// masked photos, filters and animated SVG content in one foreignObject.
export default function ProjectivePreview({items,params,mouse,activeFrame,imageCycles,progress=1}){
 const root=useRef(null);
 const [size,setSize]=useState({width:1280,height:720});
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const observer=new ResizeObserver(entries=>{
   const rect=entries[0]?.contentRect;
   if(rect&&rect.width>0&&rect.height>0){
    setSize(prev=>prev.width===rect.width&&prev.height===rect.height?
     prev:{width:rect.width,height:rect.height});
   }
  });
  observer.observe(el);
  return()=>observer.disconnect();
 },[]);
 const scale=Math.max(size.width/1280,size.height/720);
 const ox=(size.width-1280*scale)/2,oy=(size.height-720*scale)/2;
 const converged=mediaConvergence(progress);
 return <div className="project-image-surface" ref={root} aria-hidden="true">
  <div className="project-image-world" style={{
   transform:'translate('+ox+'px,'+oy+'px) scale('+scale+')'
  }}>
   {items.map((item,i)=>{
    if(!i||item.kind==='about')return null;
    const images=item.images?.length?item.images:
     (item.thumbnail?[{id:'legacy',src:item.thumbnail}]:[]);
    // Do not create 3D/compositing surfaces for empty project slots.
    if(!images.length)return null;
    const cycle=imageCycles[i]||{index:0,previous:-1,revision:0};
    const current=images[cycle.index%images.length];
    const previous=cycle.revision&&cycle.previous>=0?
     images[cycle.previous%images.length]:null;
    const plane=projectedImagePlane(i,params,mouse.x,mouse.y);
    const transform=projectiveCSS(plane);
    if(!plane.every(point=>point.every(Number.isFinite))||transform.includes('NaN'))return null;
    return <div key={i}
     className={'project-portal__preview project-image-plane '+(activeFrame===i?'is-visible':'')}
     data-ghost-frame={i}
     style={{width:IMAGE_WIDTH,height:IMAGE_HEIGHT,transform,
      opacity:converged,
      '--idle-thumb-opacity':params.idleThumbOpacity??.5,
      '--idle-thumb-blur':(params.idleThumbBlur??2.5)+'px',
      '--ghost-reveal-boost':params.ghostRevealBoost??2,
      '--idle-reveal-opacity':params.idleRevealOpacity??.76,
      '--hover-thumb-opacity':params.hoverThumbOpacity??1}}>
     <div className="project-portal__ambient-image-layer">
      {previous&&previous.id!==current.id&&
       <img key={'ambient-old-'+cycle.revision}
        className="project-portal__ghost-image project-portal__ghost-image--previous"
        src={previous.src} alt="" draggable="false"/>}
      <img key={'ambient-new-'+current.id+'-'+cycle.revision}
       className="project-portal__ghost-image project-portal__ghost-image--current"
       src={current.src} alt="" draggable="false"/>
     </div>
     <div className="project-portal__ghost-layer">
      {previous&&previous.id!==current.id&&
       <img key={'ghost-old-'+cycle.revision}
        className="project-portal__ghost-image project-portal__ghost-image--previous"
        src={previous.src} alt="" draggable="false"/>}
      <img key={'ghost-new-'+current.id+'-'+cycle.revision}
       className="project-portal__ghost-image project-portal__ghost-image--current"
       src={current.src} alt="" draggable="false"/>
     </div>
     <div className="project-portal__focus-layer">
      {previous&&previous.id!==current.id&&
       <img key={'focus-old-'+cycle.revision}
        className="project-portal__focus-image project-portal__focus-image--previous"
        src={previous.src} alt="" draggable="false"/>}
      <img key={'focus-new-'+current.id+'-'+cycle.revision}
       className="project-portal__focus-image project-portal__focus-image--current"
       src={current.src} alt="" draggable="false"/>
     </div>
    </div>;
   })}
  </div>
 </div>;
}
