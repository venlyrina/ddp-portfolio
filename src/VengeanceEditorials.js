import {makeId,defaultGroupText} from './VengeanceGalleryData';
export const EDITORIAL_STORAGE_KEY='vengeance-editorials-by-id-v1';
const DB='vengeance-corridor-gallery',STORE='documents';
export const createEditorial=(text='')=>({id:'text-'+makeId(),text});
export function migrateEditorials(corridors,legacyGroups,legacyManifesto){
 const count=Math.max(1,Math.ceil(corridors.length/3),legacyGroups?.length||0);
 const editorials=Array.from({length:count},(_,index)=>({
  id:'legacy-text-'+(index+1),
  text:typeof legacyGroups?.[index]==='string'?legacyGroups[index]:
   index===0&&typeof legacyManifesto==='string'?legacyManifesto:defaultGroupText(corridors,index)
 }));
 return {editorials,corridors:corridors.map((c,index)=>({
  ...c,editorialId:editorials[Math.floor(index/3)]?.id||editorials[0].id
 }))};
}
export function normalizeEditorials(value){
 if(!Array.isArray(value)||!value.length)return [createEditorial()];
 return value.slice(0,80).map(item=>({
  id:String(item.id||('text-'+makeId())),
  text:typeof item.text==='string'?item.text.slice(0,120000):''
 }));
}
export function reconcileCorridors(corridors,editorials){
 const available=new Set(editorials.map(e=>e.id));
 return corridors.map((corridor,i)=>({
  ...corridor,editorialId:available.has(corridor.editorialId)?
   corridor.editorialId:editorials[Math.min(Math.floor(i/3),editorials.length-1)].id
 }));
}
export function editorialSlots(editorials,corridors){
 return editorials.flatMap((editorial,groupIndex)=>
  corridors.filter(c=>c.editorialId===editorial.id)
   .map((corridor,slotIndex)=>({...corridor,_groupIndex:groupIndex,_slotIndex:slotIndex})));
}
export function countEditorialMedia(editorials,corridors){
 return editorials.map(e=>corridors.filter(c=>c.editorialId===e.id).length);
}
export function readSavedEditorials(){
 return new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){resolve(null);return}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>resolve(null);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(STORE,'readonly');
   const r=tx.objectStore(STORE).get(EDITORIAL_STORAGE_KEY);
   r.onsuccess=()=>{resolve(Array.isArray(r.result)?r.result:null);db.close()};
   r.onerror=()=>{resolve(null);db.close()};
  };
 });
}
export function saveEditorials(editorials){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(Error('IndexedDB unavailable'));return}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).put(editorials,EDITORIAL_STORAGE_KEY);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(tx.error)};
  };
 });
}
