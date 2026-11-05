const DB='vengeance-corridor-gallery',STORE='documents';
export const FINALE_KEY='vengeance-final-film-v1';
export const DEFAULT_FINALE_TITLE='Unfinished Film, but High Intensy Footages are Existed';
export const defaultFinale={title:DEFAULT_FINALE_TITLE,videoId:'',thumbnailId:'',videoUrl:'',thumbnailUrl:''};
export function normalizeFinale(value){
 const v=value&&typeof value==='object'?value:{};
 return {title:typeof v.title==='string'?v.title.slice(0,220):DEFAULT_FINALE_TITLE,
 videoId:typeof v.videoId==='string'?v.videoId:'',
 thumbnailId:typeof v.thumbnailId==='string'?v.thumbnailId:'',
 videoUrl:typeof v.videoUrl==='string'?v.videoUrl:'',
 thumbnailUrl:typeof v.thumbnailUrl==='string'?v.thumbnailUrl:''};
}
const open=()=>new Promise((resolve,reject)=>{
 const req=indexedDB.open(DB,1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
 req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result);
});
export async function readFinale(){
 try{const db=await open();return await new Promise(resolve=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(FINALE_KEY);
  req.onsuccess=()=>resolve(normalizeFinale(req.result));
  req.onerror=()=>resolve({...defaultFinale});
  tx.oncomplete=()=>db.close();
 })}catch{return {...defaultFinale}}
}
export async function saveFinale(value){
 const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(normalizeFinale(value),FINALE_KEY);
  tx.oncomplete=()=>{db.close();resolve()};
  tx.onerror=()=>{db.close();reject(tx.error)};
 });
}
