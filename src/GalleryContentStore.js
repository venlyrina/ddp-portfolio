import {projectContent,aboutDraft} from './ProjectContent';
import {frozenPortfolio} from './FrozenPortfolioContent';

export const CONTENT_STORAGE_KEY='venshalor-gallery-content-v1';
const DATABASE='venshalor-media-v1';
const MAX_IMAGES=16;
const validImage=value=>typeof value==='string' && /^(https?:\/\/|\/assets\/media\/|data:image\/(png|jpeg|webp|avif);base64,)/i.test(value);
const imageId=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
export const makeImage=src=>({id:imageId(),src});
export const initialGallery=()=>frozenPortfolio.gallery||({
 items:projectContent.map(item=>({...item,images:item.kind==='link'&&validImage(item.thumbnail)?[makeImage(item.thumbnail)]:[]})),
 description:aboutDraft
});
export function normalizeGallery(value){
 const fallback=initialGallery();
 if(!value||!Array.isArray(value.items)||value.items.length!==4)return fallback;
 return {
  items:fallback.items.map((base,i)=>{
   const incoming=value.items[i]||{};
   const raw=Array.isArray(incoming.images)?incoming.images:
    (validImage(incoming.thumbnail)?[incoming.thumbnail]:[]);
   const images=i?raw.slice(0,MAX_IMAGES).map(entry=>{
    const src=typeof entry==='string'?entry:entry?.src;
    if(!validImage(src))return null;
    return {id:typeof entry?.id==='string'&&entry.id.length<100?entry.id:imageId(),src};
   }).filter(Boolean):[];
   return {...base,
    title:typeof incoming.title==='string'&&!(i===3&&incoming.title==='PROJECT THREE')
     ?incoming.title.slice(0,100):base.title,
    category:typeof incoming.category==='string'&&!(i===3&&incoming.category==='SELECTED WORK')
     ?incoming.category.slice(0,100):base.category,
    ...(i?{href:typeof incoming.href==='string'?incoming.href.slice(0,2048):base.href,
     images,thumbnail:images[0]?.src||''}:{images:[]})
   };
  }),
  description:typeof value.description==='string'?value.description.slice(0,12000):fallback.description
 };
}
export function loadGallery(){
 try{
  const cached=window.localStorage.getItem(CONTENT_STORAGE_KEY);
  return cached?normalizeGallery(JSON.parse(cached)):initialGallery();
 }catch{return initialGallery()}
}
const openDatabase=()=>new Promise((resolve,reject)=>{
 if(!('indexedDB' in window)){reject(Error('IndexedDB not available'));return}
 const request=window.indexedDB.open(DATABASE,1);
 request.onupgradeneeded=()=>request.result.createObjectStore('content');
 request.onerror=()=>reject(request.error);
 request.onsuccess=()=>resolve(request.result);
});
export async function readGalleryFromDB(){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('content','readonly');
  const get=tx.objectStore('content').get('gallery');
  get.onsuccess=()=>resolve(get.result?normalizeGallery(get.result):null);
  get.onerror=()=>reject(get.error);
  tx.oncomplete=()=>db.close();
 });
}
export async function saveGalleryToDB(value){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('content','readwrite');
  tx.objectStore('content').put(normalizeGallery(value),'gallery');
  tx.oncomplete=()=>{db.close();resolve()};
  tx.onerror=()=>{db.close();reject(tx.error)};
  tx.onabort=()=>{db.close();reject(tx.error)};
 });
}
export function downloadGallery(data){
 const blob=new Blob([JSON.stringify(normalizeGallery(data),null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download='venshalor-gallery-content.json';anchor.click();
 window.setTimeout(()=>URL.revokeObjectURL(url),2000);
}
// Local WebP copies are compact enough for previews; IndexedDB (not
// localStorage) stores image data and allows multiple photos per project.
export function compressThumbnail(file){
 return new Promise((resolve,reject)=>{
  if(!file.type.startsWith('image/')){reject(Error('Choose an image file'));return}
  const reader=new FileReader();
  reader.onerror=()=>reject(Error('Cannot read image'));
  reader.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(Error('Cannot decode image'));
   img.onload=()=>{
    const scale=Math.min(1,1100/Math.max(img.width,img.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.width*scale));
    canvas.height=Math.max(1,Math.round(img.height*scale));
    const ctx=canvas.getContext('2d');
    if(!ctx){reject(Error('Canvas unavailable'));return}
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    resolve(canvas.toDataURL('image/webp',.74));
   };
   img.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}
