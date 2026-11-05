import {useEffect,useState} from 'react';
import {resolveWorkshopMedia} from './WorkshopMedia';
import {publishedWorkshopMedia} from './PublishedWorkshopMedia';
export default function useWorkshopMedia(mediaId,externalUrl){
 const [resolved,setResolved]=useState(null);
 useEffect(()=>{
  let alive=true,objectUrl='';
  setResolved(null);
  if(mediaId){
   resolveWorkshopMedia(mediaId).then(blob=>{
    if(!alive||!blob)return;
    objectUrl=URL.createObjectURL(blob);
    setResolved(objectUrl);
   }).catch(()=>{if(alive)setResolved(null)});
  }
  return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[mediaId]);
 return resolved||externalUrl||publishedWorkshopMedia(mediaId)||null;
}
