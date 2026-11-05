import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import ScanTitle from './ScanTitle';
import {menuInteractive,menuTitleConvergence} from './MorphTiming';
import {projectedFrame} from './CorridorGeometry';
import GhostScanner from './GhostScanner';
import ProjectivePreview from './ProjectivePreview';
import './ProjectPortals.css';

export default function ProjectPortals({visible,progress,params,mouse,activeFrame,onActiveChange,onOpenProject,content,editing=false}){
 const projectContent=content.items;
 const aboutDraft=content.description;
 const svgRef=useRef(null);
 const [imageCycles,setImageCycles]=useState(()=>Array.from({length:4},()=>({index:0,previous:-1,revision:0})));
 const onScannerVisit=useCallback(index=>{
  if(!params.ghostCycleOnPass)return;
  const images=content.items[index]?.images||[];
  if(images.length<2)return;
  setImageCycles(previous=>previous.map((entry,i)=>i===index?{
   index:(entry.index+1)%images.length,previous:entry.index%images.length,
   revision:entry.revision+1
  }:entry));
 },[content.items,params.ghostCycleOnPass]);
 // Measure typography once against neutral geometry, then translate its
 // whole rigid block by the live projected frame displacement.
 const polygons=useMemo(()=>projectContent.map((item,i)=>{
  const points=projectedFrame(i,params,0,0);
  const xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);
  return {item,i,points,box:{
   x:Math.min(...xs),y:Math.min(...ys),
   width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)
  }};
 }),[params,projectContent]);
 if(!visible)return null;
 const ready=menuInteractive(progress);
 const labelOpacity=menuTitleConvergence(progress);
 return <>
  <ProjectivePreview items={projectContent} params={params} mouse={mouse}
    progress={progress} activeFrame={activeFrame} imageCycles={imageCycles}/>
  <svg ref={svgRef} className="project-portals" viewBox="0 0 1280 720"
  preserveAspectRatio="xMidYMid slice" aria-label="Portfolio editorial note and three projects"
  style={{'--portal-sweep-duration':(params.titleSweepSpeed??2.2)+'s',
   '--portal-sweep-opacity':params.titleSweepOpacity??1}}>
  {polygons.map(({item,i,points,box})=>{
   const about=item.kind==='about';
   const active=activeFrame===i;
   const gutter=about?.09:.12;
   const x=box.x+box.width*gutter,y=box.y+box.height*(about?.09:.12);
   const width=box.width*(1-2*gutter),height=box.height*(about?.82:.75);
   const compact=!about&&width<260;
   const tiny=!about&&width<175;
   // Move the entire fixed-size text region alongside its dust frame.
   // Never recompute foreignObject bounds or font breakpoints from parallax.
   const moved=projectedFrame(i,params,mouse.x,mouse.y);
   const dx=moved.reduce((sum,v,j)=>sum+v[0]-points[j][0],0)/4;
   const dy=moved.reduce((sum,v,j)=>sum+v[1]-points[j][1],0)/4;
   return <g key={i} transform={`translate(${dx} ${dy})`} className={'project-portal '+(about?'project-portal--editorial ':'')+(active?'project-portal--active ':'')+(tiny?'project-portal--tiny':compact?'project-portal--compact':'')}>
    <foreignObject x={x} y={y} width={Math.max(1,width)} height={Math.max(1,height)}
      pointerEvents="none">
     <div xmlns="http://www.w3.org/1999/xhtml"
      className={'project-portal__content '+(ready?'project-portal__content--ready':'')}
      style={{opacity:labelOpacity}}>
      {about?
       <article className="project-portal__editorial" aria-label="About this portfolio">
        <div className="project-portal__eyebrow">{item.category}</div>
        <ScanTitle text={item.title} className="project-portal__editorial-title" duration={params.titleSweepSpeed} intensity={params.titleSweepOpacity} offset={0}/>
        <p className="project-portal__statement">{aboutDraft}</p>
       </article>
      :
       <>
        <header className="project-portal__header">
         <span className="project-portal__index">{item.index}</span>
         <span className="project-portal__meta">{item.category}</span>
        </header>
        <footer className="project-portal__footer">
         <ScanTitle text={item.title} duration={params.titleSweepSpeed} intensity={params.titleSweepOpacity} offset={i*1.7}/>
         <span className="project-portal__hint">ENTER PROJECT</span>
        </footer>
       </>
      }
     </div>
    </foreignObject>
    {!about&&<polygon points={points.map(p=>p.join(',')).join(' ')}
     className="project-portal__hit" style={{pointerEvents:editing?'none':undefined}} role="button" tabIndex={ready?0:-1}
     aria-label={item.title+' / enter project stage'}
     onPointerEnter={()=>{if(ready)onActiveChange(i)}}
     onPointerLeave={()=>onActiveChange(null)}
     onFocus={()=>{if(ready)onActiveChange(i)}}
     onBlur={()=>onActiveChange(null)}
     onClick={()=>{if(ready&&!editing)onOpenProject?.(item,i)}}
     onKeyDown={e=>{if(ready&&!editing&&(e.key==='Enter'||e.key===' ')){
      e.preventDefault();onOpenProject?.(item,i);
     }}}/>}
   </g>;
  })}
  <GhostScanner svgRef={svgRef} params={params} mouse={mouse}
   activeFrame={activeFrame} editing={editing} visible={visible}
   progress={progress} onVisit={onScannerVisit}/>
 </svg>
 </>;
}
