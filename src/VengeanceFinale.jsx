import {useEffect,useState} from 'react';
import useWorkshopMedia from './useWorkshopMedia';
import {DEFAULT_FINALE_TITLE} from './VengeanceFinaleStore';

export default function VengeanceFinale({finale,progress}){
 const [playing,setPlaying]=useState(false);
 const nearEnd=progress>.001;
 const video=useWorkshopMedia(nearEnd?finale.videoId:'',nearEnd?finale.videoUrl:'');
 const thumbnail=useWorkshopMedia(nearEnd?finale.thumbnailId:'',nearEnd?finale.thumbnailUrl:'');
 useEffect(()=>{setPlaying(false)},[finale.videoId,finale.videoUrl]);
 const visible=progress>.001;
 return <section className={'vng-finale'+(visible?' is-visible':'')}
  style={{opacity:playing?1:Math.max(0,Math.min(1,(progress-.08)*2.65)),
   transform:'translateY('+((1-progress)*75).toFixed(1)+'px)'}}
  aria-label="VENGEANCE film footage finale" aria-hidden={!visible}>
  <div className="vng-finale__content">
   <div className="vng-finale__screen">
    {playing&&video?
     <video className="vng-finale__video" src={video} autoPlay controls playsInline
      onEnded={()=>setPlaying(false)} onError={()=>setPlaying(false)}/>:
     <button type="button" className="vng-finale__preview"
      tabIndex={visible?0:-1} aria-label={video?'Play unfinished VENGEANCE film':'VENGEANCE film unavailable'}
      onClick={()=>{if(video)setPlaying(true)}}>
      {thumbnail?<div className="vng-finale__thumbnail">
       <img className="vng-finale__thumbnail-image" src={thumbnail}
        alt="Unfinished VENGEANCE film thumbnail" draggable="false"/>
      </div>:<span className="vng-finale__placeholder">FILM FOOTAGE / AWAITING THUMBNAIL</span>}
      <span className="vng-finale__play" aria-hidden="true">{video?'PLAY FILM':'FILM COMING SOON'} <span>↗</span></span>
     </button>}
   </div>
   <h2 className="vng-finale__caption">{finale.title||DEFAULT_FINALE_TITLE}</h2>
  </div>
 </section>;
}
