import {useEffect,useState} from 'react';
import {frameDefaults} from './CorridorGeometry';
import LivingFrames from './LivingFrames';
import ProjectPortals from './ProjectPortals';
import GalleryRenderBoundary from './GalleryRenderBoundary';
import {loadGallery,readGalleryFromDB} from './GalleryContentStore';
import './Corridor.css';

export default function Corridor({visible=false,progress=1,onOpenProject}){
 const [mouse,setMouse]=useState({x:0,y:0});
 const [tune,setTune]=useState(frameDefaults);
 const [activeFrame,setActiveFrame]=useState(0);
 const [hoverFrame,setHoverFrame]=useState(null);
 const [gallery,setGallery]=useState(loadGallery);
 const [editing,setEditing]=useState(false);
 const [previewFrame,setPreviewFrame]=useState(0);
 const [saveStatus,setSaveStatus]=useState('LOADING CONTENT');
 const [storageReady,setStorageReady]=useState(false);
 const updateFrame=(key,value)=>setTune(p=>({...p,frames:p.frames.map((f,i)=>i===activeFrame?{...f,[key]:Number(value)}:f)}));
 useEffect(()=>{window.dispatchEvent(new CustomEvent('venshalor-corridor-tune',{detail:tune}));},[tune]);
 useEffect(()=>{
  let alive=true;
  readGalleryFromDB().then(saved=>{
   if(!alive)return;
   if(saved)setGallery(saved);
   setStorageReady(true);
  }).catch(()=>{if(alive)setStorageReady(true)});
  return()=>{alive=false};
 },[]);

 useEffect(()=>{
  // Track camera position even during the hero. When Continue begins, the
  // destination frames already match the cursor and never snap from (0,0).
  const move=e=>setMouse({x:(e.clientX/window.innerWidth-.5)*2,y:(e.clientY/window.innerHeight-.5)*2});
  window.addEventListener('pointermove',move,{passive:true});
  return()=>window.removeEventListener('pointermove',move);
 },[]);
 return <section className={'corridor '+(visible?'corridor--visible':'')} aria-label="Interwoven light maze"
  style={{'--ambient-haze-opacity':tune.ambientHazeOpacity??.22,
   '--ambient-haze-blur':(tune.ambientHazeBlur??50)+'px',
   '--ambient-noise-opacity':tune.ambientNoiseOpacity??.11}}>
  <LivingFrames visible={visible} progress={progress} params={tune} mouse={mouse} activeFrame={hoverFrame}/>
  <GalleryRenderBoundary>
   <ProjectPortals visible={visible} progress={progress} params={tune} mouse={mouse}
    activeFrame={hoverFrame} onActiveChange={setHoverFrame}
    editing={false} content={gallery} onOpenProject={onOpenProject}/>
  </GalleryRenderBoundary>


 </section>;
}
