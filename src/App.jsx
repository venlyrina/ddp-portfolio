import { useEffect, useRef, useState } from 'react';
import CosmicAtmosphere from './CosmicAtmosphere';
import StellarEvent from './StellarEvent';
import Corridor from './Corridor';
import ProjectDestination from './ProjectDestination';
import {routePath,sitePath} from './PublicPaths';
import {MORPH_DURATION_MS} from './CorridorGeometry';
import {menuInteractive} from './MorphTiming';
import './App.css';

const initial={titleX:31.9,titleY:19.5,titleScale:.7,titleGap:.3,titleLight:1,subtitleX:50,subtitleY:83,subtitleScale:1,subtitleLight:0.43,
titleFont:1,titleWeight:100,titleParallax:12,titleBreath:.05,titleSheen:.28,titleGlint:.2,titleSheenPeriod:8,promptFont:0,promptGap:.27,promptGlitch:1,promptCycle:11,promptAltDuration:2,promptOpacity:1};
const titleFonts=["'Syncopate',sans-serif","'Jost',sans-serif","'Outfit',sans-serif","'Michroma',sans-serif"];
const promptFonts=["'IBM Plex Mono',monospace","'Azeret Mono',monospace","'Space Mono',monospace"];
const phrases=['PRESS TO CONTINUE','CREATED BY DANG DINH PHU','WELCOME TO MY UNIVERSE'];
const glyphs='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_/#';

export default function App() {
  const [text,setText]=useState(initial);
  const [scene,setScene]=useState(()=>routePath(window.location.pathname).startsWith('/projects/')?'project-detail':'hero');
  const [projectLanding,setProjectLanding]=useState(()=>window.history.state?.venshalorProject||null);
  const [morphProgress,setMorphProgress]=useState(0);
  const [routeFade,setRouteFade]=useState(null);
  const routeTimers=useRef([]);
  const clearRouteTimers=()=>{routeTimers.current.forEach(clearTimeout);routeTimers.current=[]};
  useEffect(()=>()=>routeTimers.current.forEach(clearTimeout),[]);
  const sceneRef=useRef(scene);
  const morphProgressRef=useRef(0);
  // Projects are destinations, not another game menu. One click, one URL.
  const openEntry=(item,index)=>{
    if(sceneRef.current!=='corridor'&&!(sceneRef.current==='morph'&&menuInteractive(morphProgressRef.current)))return;
    enterProject(item,index);
  };
  const enterProject=(item,index)=>{
    // Enter the selected URL immediately; no secondary Start screen or whiteout.
    // VERLIS and VENGEANCE remain inside the same app to reuse one WebGL
    // background. Other project slots may still point to external URLs.
    const url=(item.href||'').trim();
    if(index!==1&&index!==2&&index!==3&&/^https?:\/\//i.test(url)){
      window.location.assign(url);
      return;
    }
    // Do not push gallery image/base64 arrays into browser history state.
    const isVerlis=index===1;
    const project={title:isVerlis?'VERLIS':index===2?'VENGEANCE':index===3?'MORE DIMENSION':item.title,category:item.category,index};
    // Keep the existing editorial slot mapping: 01 is VERLIS even when
    // the content editor still displays the generic PROJECT ONE label.
    const slug=isVerlis?'verlis':index===2?'vengeance':index===3?'workshop-more-dimension':String(item.title||'project-'+index).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'project-'+index;
    const commit=()=>{
      window.history.pushState({venshalorProject:project},'', sitePath('/projects/'+slug));
      setProjectLanding(project);
      sceneRef.current='project-detail';setScene('project-detail');
    };
    if(sceneRef.current==='corridor'||sceneRef.current==='morph'){
      sceneRef.current='route-transition';
      clearRouteTimers();
      setRouteFade('out');
      // The menu disappears beneath an opaque black veil before destination
      // geometry mounts, so the old three portals cannot flash behind it.
      routeTimers.current.push(setTimeout(()=>{
        commit();
        setRouteFade('in');
        routeTimers.current.push(setTimeout(()=>setRouteFade(null),570));
      },280));
    }else commit();
  };
  const backToCorridor=()=>{
    clearRouteTimers();setRouteFade(null);
    window.history.pushState({},'', sitePath('/'));
    setProjectLanding(null);
    sceneRef.current='corridor';setScene('corridor');
  };
  useEffect(()=>{
    const pop=()=>{
      clearRouteTimers();setRouteFade(null);
      if(routePath(window.location.pathname).startsWith('/projects/')){
       setProjectLanding(window.history.state?.venshalorProject||null);
       sceneRef.current='project-detail';setScene('project-detail');
      }else{
       setProjectLanding(null);
       sceneRef.current='corridor';setScene('corridor');
      }
    };
    window.addEventListener('popstate',pop);
    return()=>window.removeEventListener('popstate',pop);
  },[]);
  useEffect(()=>{
    const enter=e=>{
      if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||sceneRef.current!=='hero')return;
      if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target?.tagName)||e.target?.isContentEditable)return;
      morphProgressRef.current=0;
      sceneRef.current='morph';setScene('morph');
    };
    window.addEventListener('keydown',enter);
    return()=>window.removeEventListener('keydown',enter);
  },[]);
  useEffect(()=>{
    if(scene!=='morph')return;
    let raf=0;
    const start=performance.now();
    const advance=now=>{
      const progress=Math.min(1,(now-start)/MORPH_DURATION_MS);
      morphProgressRef.current=progress;
      setMorphProgress(progress);
      if(progress>=1){sceneRef.current='corridor';setScene('corridor');}
      else raf=requestAnimationFrame(advance);
    };
    raf=requestAnimationFrame(advance);
    return()=>cancelAnimationFrame(raf);
  },[scene]);
  const textRef=useRef(text);
  const [clock,setClock]=useState(0);
  const [cursor,setCursor]=useState({x:0,y:0});
  useEffect(()=>{const started=performance.now();const timer=setInterval(()=>setClock((performance.now()-started)/1000),85);return()=>clearInterval(timer);},[]);
  useEffect(()=>{const move=e=>setCursor(p=>({x:p.x+((e.clientX/window.innerWidth-.5)*2-p.x)*.18,y:p.y+((e.clientY/window.innerHeight-.5)*2-p.y)*.18}));window.addEventListener('pointermove',move,{passive:true});return()=>window.removeEventListener('pointermove',move);},[]);
  useEffect(()=>{
    const tune=e=>{textRef.current=e.detail;setText(p=>({...p,...e.detail}));};
    window.addEventListener('venshalor-text-tune',tune);
    return()=>window.removeEventListener('venshalor-text-tune',tune);
  },[]);
  const drag=(kind)=>e=>{
    if(e.button!==0)return;
    e.preventDefault();
    const target=e.currentTarget, originX=e.clientX, originY=e.clientY;
    const xKey=kind+'X',yKey=kind+'Y';
    const startX=textRef.current[xKey],startY=textRef.current[yKey];
    target.setPointerCapture(e.pointerId);
    const move=ev=>{
      const x=Math.max(0,Math.min(95,startX+(ev.clientX-originX)/window.innerWidth*100));
      const y=Math.max(0,Math.min(95,startY+(ev.clientY-originY)/window.innerHeight*100));
      textRef.current={...textRef.current,[xKey]:x,[yKey]:y};
      setText(p=>({...p,[xKey]:x,[yKey]:y}));
      window.dispatchEvent(new CustomEvent('venshalor-text-drag',{detail:{key:xKey,value:x}}));
      window.dispatchEvent(new CustomEvent('venshalor-text-drag',{detail:{key:yKey,value:y}}));
    };
    const stop=()=>{
      target.removeEventListener('pointermove',move);
      target.removeEventListener('pointerup',stop);
      target.removeEventListener('pointercancel',stop);
    };
    target.addEventListener('pointermove',move);
    target.addEventListener('pointerup',stop);
    target.addEventListener('pointercancel',stop);
  };
  const cycle=Math.max(5,text.promptCycle||11),phase=clock%cycle;
  const alt=Math.floor(clock/cycle)%2+1;
  const held=Math.max(.5,text.promptAltDuration||1.7);
  const switchingIn=phase>cycle-held-1.8&&phase<cycle-held-1.48;
  const switchingOut=phase>cycle-.32;
  const altOn=phase>=cycle-held-1.48&&phase<=cycle-.32;
  const phrase=phrases[altOn||switchingOut?alt:0];
  const glitched=switchingIn||switchingOut;
  const displayed=glitched&&text.promptGlitch>0
    ? phrase.split('').map((ch,i)=>ch===' '?ch:((i*7+Math.floor(clock*29))%11<text.promptGlitch*8?glyphs[(i*13+Math.floor(clock*43))%glyphs.length]:ch)).join('')
    :phrase;
  const reduced=typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <main className={"site scene-"+scene}>
      <CosmicAtmosphere />
      {(scene==="hero"||scene==="morph")&&<div className="cosmic-stage"><StellarEvent morph={scene==='morph'}/></div>}
      {scene!=="project-detail"&&<Corridor visible={scene==="corridor"||scene==="morph"||scene==="route-transition"} progress={scene==="corridor"||scene==="route-transition"?1:morphProgress} onOpenProject={openEntry}/> }
      {scene==="project-detail"&&<ProjectDestination project={projectLanding||{title:decodeURIComponent(window.location.pathname.split("/").pop()||"Project").replace(/-/g," ")}} onBack={backToCorridor}/>}
      {routeFade&&<div className={'project-route-fade project-route-fade--'+routeFade}
       aria-hidden="true"/>}

      {(scene==="hero"||scene==="morph")&&<>
      <h1 className="hero-title" data-text="PORTFOLIO" 
        style={{
          left:text.titleX+'%',top:text.titleY+'%',
          fontSize:'clamp(24px, '+(8*text.titleScale)+'vw, '+(145*text.titleScale)+'px)',
          fontFamily:titleFonts[text.titleFont]||titleFonts[1],fontWeight:text.titleWeight,
          letterSpacing:text.titleGap+'em',opacity:text.titleLight,
          '--sheen':text.titleSheen,'--glint':text.titleGlint,'--breath':text.titleBreath,
          '--sheen-period':text.titleSheenPeriod+'s',
          translate:reduced?'0 0':(cursor.x*text.titleParallax).toFixed(2)+'px '+(cursor.y*text.titleParallax*.65).toFixed(2)+'px'
        }}>PORTFOLIO</h1>
      <p className="hero-subtitle" 
        style={{
          left:text.subtitleX+'%',top:text.subtitleY+'%',
          transform:'translate(-50%,-50%)',
          fontFamily:promptFonts[text.promptFont]||promptFonts[0],
          fontSize:'clamp(9px, '+(.85*text.subtitleScale)+'vw, '+(12*text.subtitleScale)+'px)',
          letterSpacing:text.promptGap+'em',opacity:text.promptOpacity,
          translate:reduced?'0 0':(cursor.x*text.titleParallax*.25).toFixed(2)+'px '+(cursor.y*text.titleParallax*.15).toFixed(2)+'px'
        }} onClick={()=>{if(sceneRef.current==='hero'){morphProgressRef.current=0;sceneRef.current='morph';setScene('morph');}}}>{reduced?'PRESS TO CONTINUE':displayed}</p>
      </>}
    </main>
  );
}
