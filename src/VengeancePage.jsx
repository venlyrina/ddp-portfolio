import {memo,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import VengeanceProjectedCorridor,{EXTRA_PORTAL_SPACING} from './VengeanceProjectedCorridor';
import ScanTitle from './ScanTitle';
import {sampleVengeanceJourney,editorialScrollUnits,vengeanceGroupScrollStart,VENGEANCE_OUTRO_UNITS} from './VengeanceScrollTimeline';
import VengeanceFinale from './VengeanceFinale';
import {frozenPortfolio} from './FrozenPortfolioContent';
import {sitePath} from './PublicPaths';
import {warmPublicImages} from './PublicMediaPreload';
import {defaultFinale,readFinale,saveFinale} from './VengeanceFinaleStore';
import {createEditorial,migrateEditorials,normalizeEditorials,reconcileCorridors,
 editorialSlots,countEditorialMedia,readSavedEditorials,saveEditorials} from './VengeanceEditorials';
import GalleryRenderBoundary from './GalleryRenderBoundary';

import {
 sampleCorridors,createCorridor,createArtifact,normalizeCorridors,
 readSavedCorridors,saveCorridors,readSavedManifesto,
 defaultGroupText,readSavedGroupTexts
} from './VengeanceGalleryData';
import './VengeancePage.css';

const clamp=value=>Math.max(0,Math.min(1,value));
const nextFrame=callback=>typeof requestAnimationFrame==='function'
 ? requestAnimationFrame(callback):setTimeout(callback,16);
const cancelFrame=id=>typeof cancelAnimationFrame==='function'
 ? cancelAnimationFrame(id):clearTimeout(id);
const geometryKeys=new Set(['x','y','z','yaw','pitch','width','height','parallaxX','parallaxY']);
// Each group has two distinct scroll phases: words first, portals afterward.

// Use the same readable text as the earlier ChatGPT-style reveal. Parse only
// **emphasis** and paragraph breaks; no markup editor or heavy animation lib.
const RevealCopy=memo(function RevealCopy({body,rootRef}){
 const blocks=String(body||'').split(/\n\s*\n/);
 return <div className="vng-projected-copy" ref={rootRef}>
  {blocks.map((block,blockIndex)=>{
   const heading=block.startsWith('# ');
   const source=heading?block.slice(2):block;
   const pieces=source.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
   const Tag=heading?'h2':'p';
   return <Tag key={blockIndex} className={heading?'vng-story__body-title':''} aria-label={source}>
    {pieces.map((piece,pieceIndex)=>{
     const bold=piece.startsWith('**')&&piece.endsWith('**');
     const italic=!bold&&piece.startsWith('*')&&piece.endsWith('*');
     const text=(bold?piece.slice(2,-2):italic?piece.slice(1,-1):piece);
     // Keep whitespace in the natural flow; one opacity/blur unit per word,
     // so the text materializes like a streamed message without reflow.
     const words=text.split(/(\s+)/).map((part,i)=>
      /\s+/.test(part)?part:<span key={i} className="vng-reveal-word"
       aria-hidden="true">{part}</span>);
     return bold?<strong key={pieceIndex}>{words}</strong>:
      italic?<em key={pieceIndex}>{words}</em>:
      <span key={pieceIndex}>{words}</span>;
    })}
   </Tag>;
  })}
 </div>;
});
export function frameTransform(artifact,mx=0,my=0){
 const x=(Number(artifact.x)||0)+mx*(Number(artifact.parallaxX)||0);
 const y=(Number(artifact.y)||0)+my*(Number(artifact.parallaxY)||0);
 const z=Number(artifact.z)||0;
 const yaw=(Number(artifact.yaw)||0)+mx*2.2;
 const pitch=(Number(artifact.pitch)||0)-my*1.7;
 return 'translate(-50%,-50%) translate3d('+x.toFixed(2)+'px,'+
  y.toFixed(2)+'px,'+z.toFixed(2)+'px) rotateY('+yaw.toFixed(2)+
  'deg) rotateX('+pitch.toFixed(2)+'deg)';
}
// A static version of the main corridor's particulate edge material.
// The particle positions are deterministic and never shimmer or jitter.
function DustFrame({seed=''}) {
 const canvasRef=useRef(null);
 useEffect(()=>{
  const canvas=canvasRef.current;
  if(!canvas)return;
  let observer;
  const draw=()=>{
   const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
   const dpr=Math.min(2,window.devicePixelRatio||1);
   canvas.width=Math.round(width*dpr);
   canvas.height=Math.round(height*dpr);
   let ctx;try{ctx=canvas.getContext('2d')}catch{return}
   if(!ctx)return;
   ctx.scale(dpr,dpr);
   let state=([...seed].reduce((a,c)=>((a*33+c.charCodeAt(0))>>>0),5381))||1;
   const rnd=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296};
   const count=Math.min(2800,Math.ceil((width+height)*1.2));
   for(let i=0;i<count;i++){
    const side=Math.floor(rnd()*4),u=rnd(),scatter=(rnd()-.5)*3.8;
    const x=side===0?u*width:side===1?width+scatter:side===2?u*width:scatter;
    const y=side===0?scatter:side===1?u*height:side===2?height+scatter:u*height;
    const opacity=(.09+rnd()*.42)*(rnd()<.08?1.3:1);
    const size=.35+rnd()*.78;
    ctx.fillStyle='rgba(226,241,255,'+Math.min(.86,opacity).toFixed(3)+')';
    ctx.fillRect(x,y,size,size);
   }
  };
  draw();
  if(typeof ResizeObserver!=='undefined'){
   observer=new ResizeObserver(draw);observer.observe(canvas);
  }else window.addEventListener('resize',draw);
  return()=>{observer?.disconnect();window.removeEventListener('resize',draw)};
 },[seed]);
 return <canvas ref={canvasRef} className="vng-dust-frame" aria-hidden="true"/>;
}
function Artifact({artifact}){
 const [broken,setBroken]=useState(false);
 const img=artifact.image||'';
 useEffect(()=>setBroken(false),[img]);
 return <div className="vng-artifact" data-vng-artifact={artifact.id}
  style={{
   width:'min(100%,'+Math.max(160,Number(artifact.width)||460)+'px)',
   height:Math.max(130,Number(artifact.height)||310)+'px',
   transform:frameTransform(artifact)
  }}>
  <div className="vng-artifact__edge" aria-hidden="true"/>
  {img&&!broken?<img className="vng-artifact__image" src={img}
    alt={artifact.title||'VENGEANCE artifact'}
    style={{objectFit:'contain'}} loading="lazy" onError={()=>setBroken(true)}/>:
   <div className="vng-artifact__empty" aria-label="Artifact awaits image upload"/>}
 </div>;
}
function GalleryCorridor({corridor,index,active}){
 return <section className={'vng-gallery-row'+(active?' is-active':'')}
  data-vng-corridor={corridor.id} aria-label={corridor.title+' gallery corridor'}>
  <div className="vng-gallery-row__stage">
   <div className="vng-gallery-row__architectural-frame" data-vng-frame={corridor.id}
   aria-hidden="true" style={{width:'min(94%,'+(Number(corridor.frame?.width)||640)+'px)',
    height:Math.max(130,Number(corridor.frame?.height)||500)+'px',
    transform:frameTransform(corridor.frame||{})}}><DustFrame seed={corridor.id}/></div>
   <div className="vng-gallery-row__artifacts">
    {corridor.artifacts.map((artifact,i)=><Artifact key={artifact.id} artifact={artifact} ordinal={i}/>)}

   </div>
   <span className="vng-gallery-row__title">{corridor.title}</span>
  </div>
 </section>;
}
export default function VengeancePage(){
 const [corridors,setCorridors]=useState([]);
 const [editorials,setEditorials]=useState(()=>sampleCorridors.map(c=>({id:'text-'+c.id,text:c.body})));
 const [activeGroup,setActiveGroup]=useState(0);
 const [ready,setReady]=useState(false);
 const [saveStatus,setSaveStatus]=useState('LOADING');
 const [editing,setEditing]=useState(false);
 const [portalMouse,setPortalMouse]=useState({x:0,y:0});
 const [cameraY,setCameraY]=useState(0);
 const [wordRevealProgress,setWordRevealProgress]=useState(0);
 const [outroProgress,setOutroProgress]=useState(0);
 const [finale,setFinale]=useState({...defaultFinale});
 const [finaleEditor,setFinaleEditor]=useState(false);
 const [activeIndex,setActiveIndex]=useState(0);
 const rootRef=useRef(null),galleryRef=useRef(null),copyRef=useRef(null);
 const corridorsRef=useRef(corridors),editorialsRef=useRef(editorials),scrollRef=useRef({index:0,progress:0});
 const pointerRef=useRef({x:0,y:0}),frameRef=useRef(0),pendingJumpRef=useRef(null);
 corridorsRef.current=corridors;
 editorialsRef.current=editorials;
 useEffect(()=>{
  warmPublicImages(frozenPortfolio.vengeanceCorridors.flatMap(c=>
   (c.artifacts||[]).map(a=>a.image).filter(Boolean)));
 },[]);
 useEffect(()=>{
  warmPublicImages(corridors.flatMap(c=>(c.artifacts||[]).map(a=>a.image).filter(Boolean)));
 },[corridors]);
 useEffect(()=>{
  let mounted=true;
  Promise.all([readSavedCorridors(),readSavedManifesto(),readSavedGroupTexts(),readSavedEditorials(),readFinale()])
   .then(([saved,manifesto,oldGroups,storedEditorials,storedFinale])=>{
    if(!mounted)return;
    const restored=normalizeCorridors(saved!==null?saved:frozenPortfolio.vengeanceCorridors);
    let entries,linked;
    if(storedEditorials||frozenPortfolio.vengeanceEditorials){
     entries=normalizeEditorials(storedEditorials||frozenPortfolio.vengeanceEditorials);
     linked=reconcileCorridors(restored,entries);
    }else if(saved!==null||oldGroups?.length||manifesto!==null){
     const legacyBase=saved!==null?restored:sampleCorridors;
     const legacy=typeof manifesto==='string'&&manifesto!==legacyBase.map(c=>c.body).join('\\n\\n')
      ?manifesto:null;
     const migration=migrateEditorials(legacyBase,oldGroups,legacy);
     entries=migration.editorials;linked=saved!==null?migration.corridors:[];
    }else{
     // A new project starts with editable text IDs, not fabricated right images.
     entries=sampleCorridors.map(c=>({id:'text-'+c.id,text:c.body}));
     linked=[];
    }
    setCorridors(linked);setEditorials(entries);
    const savedFilm=storedFinale?.videoId||storedFinale?.thumbnailId||storedFinale?.videoUrl||storedFinale?.thumbnailUrl;
    setFinale(savedFilm?storedFinale:{...frozenPortfolio.vengeanceFinale,
     videoUrl:sitePath('/assets/media/combat.mp4'),thumbnailUrl:sitePath('/assets/media/key.png')});
    setReady(true);setSaveStatus('READY / LOCAL');
   }).catch(()=>{if(mounted){
     setCorridors(normalizeCorridors(frozenPortfolio.vengeanceCorridors));
     setEditorials(normalizeEditorials(frozenPortfolio.vengeanceEditorials));
     setFinale({...frozenPortfolio.vengeanceFinale,
      videoUrl:sitePath('/assets/media/combat.mp4'),thumbnailUrl:sitePath('/assets/media/key.png')});
     setReady(true);setSaveStatus('READY / FROZEN SOURCE');
    }});

  return()=>{mounted=false};
 },[]);
 const updateFinale=useCallback(patch=>setFinale(prev=>({...prev,...patch})),[]);
 useEffect(()=>setActiveGroup(index=>Math.min(index,Math.max(0,editorials.length-1))),[editorials.length]);
 const changeGroupText=useCallback((index,value)=>setEditorials(old=>
  old.map((entry,i)=>i===index?{...entry,text:value}:entry)),[]);
 const addEditorial=useCallback(()=>{
  const entry=createEditorial('');
  pendingJumpRef.current=editorialsRef.current.length;
  setEditorials(old=>[...old,entry]);
  setActiveGroup(editorialsRef.current.length);
 },[]);
 useEffect(()=>{
  const index=pendingJumpRef.current;
  if(index===null||!ready)return;
  pendingJumpRef.current=null;
  const counts=countEditorialMedia(editorials,corridorsRef.current);
  const start=vengeanceGroupScrollStart(counts,index);
  const gallery=galleryRef.current;
  if(gallery){
   gallery.scrollTop=start*Math.max(0,gallery.scrollHeight-gallery.clientHeight);
  }
 },[editorials.length,ready]);
 const removeEditorial=useCallback(index=>{
  if(editorialsRef.current.length<2)return;
  const removed=editorialsRef.current[index];
  const fallback=editorialsRef.current[index===0?1:index-1];
  setCorridors(old=>old.map(c=>c.editorialId===removed.id?{...c,editorialId:fallback.id}:c));
  setEditorials(old=>old.filter(e=>e.id!==removed.id));
  setActiveGroup(Math.max(0,index-1));
 },[]);
 const updateCorridor=useCallback((id,key,value)=>{
  setCorridors(old=>old.map(item=>item.id===id?{...item,[key]:value}:item));
 },[]);
 const updateCorridorFrame=useCallback((id,key,value)=>{
  setCorridors(old=>old.map(c=>c.id===id?{...c,frame:{...c.frame,[key]:Number(value)}}:c));
 },[]);
 const addCorridor=useCallback(()=>{
  const added={...createCorridor(),editorialId:editorialsRef.current[activeGroup]?.id||editorialsRef.current[0].id};
  setCorridors(old=>[...old,added]);
  return added.id;
 },[activeGroup]);
 const removeCorridor=useCallback(id=>setCorridors(old=>old.filter(c=>c.id!==id)),[]);
 const addArtifact=useCallback(corridorId=>setCorridors(old=>old.map(c=>{
  if(c.id!==corridorId)return c;
  const count=c.artifacts.length;
  const artifact={...createArtifact(),
   // Give newly-added frames distinct positions before manual tuning.
   x:count%2===0?-160:160,
   y:count%2===0?-110:110,
   z:Math.min(count*22,220),
   width:Math.min(380,460),height:260
  };
  return {...c,artifacts:[...c.artifacts,artifact]};
 })),[]);
 const removeArtifact=useCallback((corridorId,artifactId)=>setCorridors(old=>old.map(c=>
  c.id===corridorId?{...c,artifacts:c.artifacts.filter(a=>a.id!==artifactId)}:c)),[]);
 const updateArtifact=useCallback((corridorId,artifactId,key,value)=>{
  setCorridors(old=>old.map(c=>c.id===corridorId?{...c,artifacts:c.artifacts.map(a=>
   a.id===artifactId?{...a,[key]:geometryKeys.has(key)?Number(value):value}:a)}:c));
 },[]);
 const paintFrames=useCallback(()=>{
  frameRef.current=0;
  const {x,y}=pointerRef.current;
  const map=new Map();
  for(const c of corridorsRef.current)for(const a of c.artifacts)map.set(a.id,a);
  rootRef.current?.querySelectorAll('[data-vng-artifact]').forEach(node=>{
   const artifact=map.get(node.dataset.vngArtifact);
   if(artifact)node.style.transform=frameTransform(artifact,x,y);
  });
  const frames=new Map(corridorsRef.current.map(c=>[c.id,c.frame]));
  rootRef.current?.querySelectorAll('[data-vng-frame]').forEach(node=>{
   const geometry=frames.get(node.dataset.vngFrame);
   if(geometry)node.style.transform=frameTransform(geometry,x,y);
  });
 },[]);
 const move=useCallback(event=>{
  const rect=rootRef.current?.getBoundingClientRect();
  if(!rect?.width||!rect?.height)return;
  pointerRef.current={
   x:clamp((event.clientX-rect.left)/rect.width)*2-1,
   y:clamp((event.clientY-rect.top)/rect.height)*2-1
  };
  if(!frameRef.current)frameRef.current=nextFrame(()=>{
   paintFrames();setPortalMouse({...pointerRef.current});
  });
 },[paintFrames]);
 useEffect(()=>()=>cancelFrame(frameRef.current),[]);
 useEffect(()=>{paintFrames()},[corridors,paintFrames]);
 // Read the vertical gallery as the only scroll timeline. The left editorial
 // panel stays fixed while each selected corridor's copy resolves left-to-right.
 const revealStory=useCallback(()=>{
  const gallery=galleryRef.current,body=copyRef.current;
  if(!gallery||!body)return;
  const progress=clamp(gallery.scrollTop/Math.max(1,gallery.scrollHeight-gallery.clientHeight));
  const timeline=sampleVengeanceJourney(progress,countEditorialMedia(editorialsRef.current,corridorsRef.current),EXTRA_PORTAL_SPACING);
  const {group:nextGroup,textProgress,cameraY:nextCamera,outroProgress:outro}=timeline;
  setOutroProgress(previous=>previous===outro?previous:outro);
  // Stay locked while words appear; start travelling only after the last word.
  setCameraY(previous=>previous===nextCamera?previous:nextCamera);
  setActiveGroup(previous=>previous===nextGroup?previous:nextGroup);
  // Synchronize the linked portal gate with this exact editorial's first word.
  const firstWordStarted=textProgress>0&&Boolean(editorialsRef.current[nextGroup]?.text?.trim());
  const revealForPortals=firstWordStarted?textProgress:0;
  setWordRevealProgress(previous=>previous===revealForPortals?previous:revealForPortals);
  const words=body.querySelectorAll('.vng-reveal-word');
  const cursor=textProgress*words.length;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  words.forEach((node,i)=>{
   const amount=clamp(cursor-i);
   node.style.opacity=amount.toFixed(3);
   node.style.filter=reduced||amount>=1?'none':'blur('+(3*(1-amount)).toFixed(2)+'px)';
  });
  body.scrollTop=textProgress*Math.max(0,body.scrollHeight-body.clientHeight);
  const linked=corridorsRef.current.findIndex(c=>c.editorialId===editorialsRef.current[nextGroup]?.id);
  setActiveIndex(previous=>previous===Math.max(0,linked)?previous:Math.max(0,linked));
 },[]);
 useEffect(()=>{
  const gallery=galleryRef.current;
  if(!gallery)return;
  let raf=0;
  const update=()=>{if(!raf)raf=nextFrame(()=>{raf=0;revealStory()})};
  gallery.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  update();
  return()=>{
   gallery.removeEventListener('scroll',update);
   window.removeEventListener('resize',update);
   cancelFrame(raf);
  };
 },[revealStory,corridors,editorials,ready]);
 useEffect(()=>{if(ready)revealStory()},[corridors,activeGroup,editorials,revealStory,ready]);
 // Scrolling over the fixed editorial surface should navigate the same
 // vertical portal collection, not trap the wheel inside the text panel.
 useEffect(()=>{
  const root=rootRef.current,gallery=galleryRef.current;
  if(!root||!gallery)return;
  const redirect=event=>{
   if(event.target.closest('.vng-gallery,.vng-editor'))return;
   if(event.ctrlKey||event.metaKey)return;
   event.preventDefault();
   gallery.scrollTop+=event.deltaY;
  };
  root.addEventListener('wheel',redirect,{passive:false});
  return()=>root.removeEventListener('wheel',redirect);
 },[ready]);
 const goToGroup=useCallback(index=>{
  const gallery=galleryRef.current;
  if(!gallery)return;
  const counts=countEditorialMedia(editorialsRef.current,corridorsRef.current);
  const progress=vengeanceGroupScrollStart(counts,index);
  gallery.scrollTo({top:progress*Math.max(0,gallery.scrollHeight-gallery.clientHeight),
   behavior:'smooth'});
 },[]);
 const selectCorridor=useCallback(index=>{
  const id=corridorsRef.current[index]?.editorialId;
  goToGroup(Math.max(0,editorialsRef.current.findIndex(e=>e.id===id)));
 },[goToGroup]);
 const fullStory=editorials[activeGroup]?.text??'';
 const projectedCorridors=useMemo(()=>editorialSlots(editorials,corridors),[editorials,corridors]);
 const linkedCounts=useMemo(()=>countEditorialMedia(editorials,corridors),[editorials,corridors]);
 // Avoid first-paint sample corridors flashing before IndexedDB restores the
 // user's actual portals. The route fade covers this black loading surface.
 if(!ready)return <div className="vng-layout vng-layout--loading" aria-label="Loading VENGEANCE corridor"/>;
 return <div className={'vng-layout'+(editing?' is-editing':'')} ref={rootRef} onPointerMove={move}>
  <GalleryRenderBoundary>
   <VengeanceProjectedCorridor corridors={projectedCorridors} mouse={portalMouse} scrollY={cameraY} activeGroup={activeGroup} editing={editing} wordRevealProgress={wordRevealProgress} outroProgress={outroProgress}
    title={<div className="vng-editorial-heading">
     <div className="vng-editorial-heading__title">VENGEANCE FILM PROJECT</div>
     <div className="vng-editorial-heading__affiliation" aria-label="Film project affiliation">
      <ScanTitle text="Start Date: 20/04/2026 - Unfinished"
       className="vng-editorial-heading__meta" duration={5.8} intensity={1} offset={0}/>
      <ScanTitle text="Contribution: Director, Actor, Model, Screenwriter, Art Director, CG Generalist"
       className="vng-editorial-heading__meta vng-editorial-heading__contribution"
       duration={5.8} intensity={1} offset={1.1}/>
     </div>
    </div>}
    body={<RevealCopy key={activeGroup} rootRef={copyRef} body={fullStory}/>}/>
  </GalleryRenderBoundary>
  <div className="vng-gallery" ref={galleryRef} aria-label="Scrollable VENGEANCE artifact gallery">
   <div style={{height:'calc(100% + '+editorialScrollUnits(linkedCounts)+'px + '+VENGEANCE_OUTRO_UNITS+'px)'}}/>
  </div>
  <div className={'vng-scroll-hint'+(wordRevealProgress>0||cameraY>0||outroProgress>0||editing?' is-dismissed':'')}
   aria-hidden="true"><span>SCROLL</span><i/></div>
  <VengeanceFinale finale={finale} progress={outroProgress}/>
 </div>;
}
