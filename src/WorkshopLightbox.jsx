import {useEffect} from 'react';
import useWorkshopMedia from './useWorkshopMedia';
export default function WorkshopLightbox({event,onClose}){
 const src=useWorkshopMedia(event?.mediaId,event?.mediaUrl||event?.image);
 useEffect(()=>{
  const onKey=e=>{if(e.key==='Escape')onClose()};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[onClose]);
 if(!event)return null;
 const video=event.contentType==='video';
 return <div className="workshop-lightbox" role="presentation"
  onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="workshop-lightbox__stage" role="dialog" aria-modal="true"
   aria-label={event.title+' enlarged media'}>
   <header><span>{event.title}</span>
    <button type="button" autoFocus onClick={onClose} aria-label="Close enlarged media">CLOSE ×</button>
   </header>
   {src?video?<video key={src} src={src} controls autoPlay playsInline preload="metadata"/>:
    <img src={src} alt={event.title}/>:<p>MEDIA UNAVAILABLE IN THIS BROWSER</p>}
  </section>
 </div>;
}
