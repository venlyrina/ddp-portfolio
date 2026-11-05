// Full-size images and videos live in IndexedDB as Blobs, not localStorage.
// Only stable media IDs are written into timeline metadata.
const DB='more-dimension-media-v1',STORE='uploads';
const open=()=>new Promise((resolve,reject)=>{
 if(typeof indexedDB==='undefined'){reject(Error('IndexedDB unavailable'));return}
 const r=indexedDB.open(DB,1);
 r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};
 r.onerror=()=>reject(r.error||Error('Cannot open media library'));
 r.onsuccess=()=>resolve(r.result);
});
export const mediaKind=file=>file?.type?.startsWith('video/')?'video':
 file?.type?.startsWith('image/')?'image':null;
export async function storeWorkshopMedia(file){
 const kind=mediaKind(file);
 if(!kind)throw Error('Choose an image or video file.');
 // Keep originals rather than downscaling the full-screen preview.
 if(file.size>512*1024*1024)throw Error('Files over 512 MB are not supported in local storage.');
 const db=await open();
 const id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():
  'workshop-'+Date.now()+'-'+Math.random().toString(36).slice(2);
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(file,id);
  tx.oncomplete=()=>{db.close();resolve({mediaId:id,mediaType:kind})};
  tx.onerror=()=>{db.close();reject(tx.error||Error('Local media save failed'))};
 });
}
export async function resolveWorkshopMedia(id){
 if(!id)return null;
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly');
  const req=tx.objectStore(STORE).get(id);
  req.onsuccess=()=>resolve(req.result||null);
  req.onerror=()=>reject(req.error);
  tx.oncomplete=()=>db.close();
 });
}
export const inferMediaKind=url=>/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url||'')?'video':'image';
