import {useEffect,useMemo,useRef,useState} from 'react';
import WorkshopCosmicCanvas from './WorkshopCosmicCanvas';
import WorkshopPortals from './WorkshopPortals';
import WorkshopMarkers from './WorkshopMarkers';
import WorkshopLightbox from './WorkshopLightbox';
import {publishedWorkshopMedia} from './PublishedWorkshopMedia';
import {warmPublicImages} from './PublicMediaPreload';
import {WORKSHOP_ANCHORS_KEY,initialAnchors,normalizeAnchors,newAnchor} from './WorkshopAnchors';
import {
 WORKSHOP_STORAGE_KEY,defaultEvents,normalizeWorkshopEvents,newWorkshopEvent,
 timelineExtent,workshopViewportSpawn
} from './WorkshopTimeline';
import './WorkshopPage.css';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const initialAnchorData=()=>{
 try{return normalizeAnchors(JSON.parse(window.localStorage.getItem(WORKSHOP_ANCHORS_KEY)))}
 catch{return normalizeAnchors(initialAnchors)}
};
const initialEvents=()=>{
 try{return normalizeWorkshopEvents(JSON.parse(window.localStorage.getItem(WORKSHOP_STORAGE_KEY)))}
 catch{return normalizeWorkshopEvents(defaultEvents)}
};
// The rapier's centerline stays x=0 for all y. Energy arcs are only filigree.
const radiantPath=height=>'M 0 0 L 0 '+height;
const arcPath=(height,phase)=>Array.from({length:Math.ceil(height/30)+1},(_,i)=>{
 const y=i*30;
 const x=(3.3*Math.sin(y*.012+phase)+1.8*Math.sin(y*.027-phase));
 return (i?'L ':'M ')+x.toFixed(2)+' '+y;
}).join(' ');
export default function WorkshopPage(){
 const [events,setEvents]=useState(initialEvents);
 // Images arrive before their scroll cards are mounted, so scrubbing stays smooth.
 useEffect(()=>{
  warmPublicImages(events.filter(event=>event.contentType==='image').map(event=>
   event.mediaUrl||event.image||publishedWorkshopMedia(event.mediaId)));
 },[events]);
 const [anchors,setAnchors]=useState(initialAnchorData);
 const [selectedAnchor,setSelectedAnchor]=useState(anchors[0]?.id);
 const [scroll,setScroll]=useState(0);
 const [viewport,setViewport]=useState({width:1280,height:720});
 const [editing,setEditing]=useState(false);
 const [selected,setSelected]=useState(events[0]?.id);
 const [lightbox,setLightbox]=useState(null);
 const [introReady,setIntroReady]=useState(false);
 const scrollRef=useRef(0),scroller=useRef(null),raf=useRef(0),root=useRef(null);
 useEffect(()=>{
  const timer=setTimeout(()=>setIntroReady(true),2850);
  return()=>clearTimeout(timer);
 },[]);

 useEffect(()=>{
  const target=root.current;
  if(!target)return;
  const measure=()=>setViewport(previous=>{
   const width=target.clientWidth||1280,height=target.clientHeight||720;
   return previous.width===width&&previous.height===height?previous:{width,height};
  });
  measure();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
  observer?.observe(target);
  if(!observer)window.addEventListener('resize',measure);
  return()=>{observer?.disconnect();window.removeEventListener('resize',measure)};
 },[]);
 useEffect(()=>()=>{if(typeof cancelAnimationFrame==='function')cancelAnimationFrame(raf.current);else clearTimeout(raf.current)},[]);
 useEffect(()=>{
  const host=root.current;
  if(!host)return;
  const forward=e=>{
   if(e.ctrlKey||e.metaKey)return;
   const target=e.target;
   if(target?.closest?.('.workshop-scroll, .workshop-editor, .workshop-lightbox'))return;
   const gallery=scroller.current;
   if(!gallery)return;
   e.preventDefault();
   gallery.scrollTop+=e.deltaY;
  };
  host.addEventListener('wheel',forward,{passive:false});
  return()=>host.removeEventListener('wheel',forward);
 },[]);
 const onScroll=e=>{
  const next=e.currentTarget.scrollTop;
  scrollRef.current=next;
  if(!raf.current){
   const schedule=typeof requestAnimationFrame==='function'?requestAnimationFrame:fn=>setTimeout(fn,16);
   raf.current=schedule(()=>{raf.current=0;setScroll(scrollRef.current)});
  }
 };
 const moveEvent=(id,position)=>setEvents(current=>current.map(item=>item.id===id?{
  ...item,...position,side:position.x<0?'left':'right'
 }:item));
 const extent=Math.max(timelineExtent(events),...anchors.map(item=>item.y+350),1500),height=viewport.height;
 const path=useMemo(()=>radiantPath(extent),[extent]);
 const arcA=useMemo(()=>arcPath(extent,0),[extent]);
 const arcB=useMemo(()=>arcPath(extent,2.1),[extent]);
 const timelineOn=scroll>8;
 // Origin of the world is the fixed star at the center of the viewport.
 const coreY=height*.49;
 const worldScale=clamp(viewport.width/1200,.48,1);
 const jumpTo=y=>{
  const top=Math.max(0,coreY+y*worldScale-viewport.height*.32);
  if(scroller.current)scroller.current.scrollTop=top;
  scrollRef.current=top;setScroll(top);
 };
 const moveAnchor=(id,y)=>setAnchors(items=>items.map(a=>a.id===id?{...a,y}:a));
 const addCorridorHere=()=>{
  // Read the live scroll position, not a possibly delayed RAF snapshot.
  // Do not jump to the end of the timeline when a corridor is created.
  const currentScroll=scroller.current?.scrollTop??scrollRef.current;
  const minimumSpawnScroll=Math.max(25,Math.ceil(80*worldScale-height*.01));
  const spawnScroll=Math.max(minimumSpawnScroll,currentScroll);
  const position=workshopViewportSpawn(spawnScroll,height,worldScale);
  const item=newWorkshopEvent(events,position);
  setEvents(items=>[...items,item]);
  setSelected(item.id);
  // At the first frame, reveal the timeline with only a minimal scroll.
  if(currentScroll<minimumSpawnScroll){
   if(scroller.current)scroller.current.scrollTop=spawnScroll;
   scrollRef.current=spawnScroll;
   setScroll(spawnScroll);
  }
 };
 return <div className="workshop-page" ref={root} aria-label="More Dimension workshop">
  <WorkshopCosmicCanvas scrollRef={scrollRef}/>
  <div className={'workshop-intro'+(introReady?' is-ready':'')+(timelineOn?' is-scrolled':'')}>
   <h1 data-text="MORE DIMENSION">MORE DIMENSION</h1>
   <span>SCROLL</span><i aria-hidden="true"/>
  </div>
  <div className={'workshop-timeline'+(timelineOn?' is-awake':'')} aria-hidden={!timelineOn}>
   <div className="workshop-world" style={{
    top:coreY+'px',transform:'translate3d(0,'+(-scroll)+'px,0) scale('+worldScale+')',
    transformOrigin:'50% 0'
   }}>
    <svg className="workshop-axis" width="100%" height={extent}
     viewBox={-viewport.width/(2*worldScale)+' 0 '+viewport.width/worldScale+' '+extent}
     preserveAspectRatio="none" aria-hidden="true">
     <defs>
      <linearGradient id="workshop-ribbon"><stop offset="0" stopColor="#fff" stopOpacity=".03"/>
       <stop offset=".38" stopColor="#fff" stopOpacity=".95"/>
       <stop offset=".72" stopColor="#fff" stopOpacity=".24"/>
       <stop offset="1" stopColor="#fff" stopOpacity=".08"/></linearGradient>

     </defs>
     <path d={path} fill="none" stroke="#fff" strokeOpacity=".95"
      strokeWidth=".65" strokeLinecap="square"/>
     <path d={path} fill="none" stroke="#fff" strokeOpacity=".3"
      strokeWidth=".28" strokeDasharray="1 13"/>
     <path d={arcA} fill="none" stroke="#fff" strokeOpacity=".15" strokeWidth=".35"/>
     <path d={arcB} fill="none" stroke="#fff" strokeOpacity=".09" strokeWidth=".3"/>
    </svg>
    <WorkshopMarkers anchors={anchors} scroll={scroll} viewportHeight={height}
     scale={worldScale} editing={false} onSelect={setSelectedAnchor} onMove={moveAnchor}/>
    <WorkshopPortals events={events} scroll={scroll} viewportHeight={height}
     scale={worldScale} editing={false} onEdit={setSelected} onMove={moveEvent}
     onOpenMedia={({event})=>setLightbox(event)}/>

   </div>
  </div>
  <div className="workshop-scroll" ref={scroller} onScroll={onScroll}
   aria-label="Scroll the More Dimension timeline">
   <div style={{height:Math.max(height+1400,extent+height*.5)+'px'}}/>
  </div>
  {lightbox&&<WorkshopLightbox event={lightbox} onClose={()=>setLightbox(null)}/>}
 </div>;
}
