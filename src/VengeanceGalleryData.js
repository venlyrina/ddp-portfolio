// A compact editorial model. No fabricated film assets: upload or paste image URLs.
export const STORAGE_KEY='vengeance-corridor-builder-v1';
export const defaultFrame={x:0,y:0,z:-80,yaw:-4,pitch:0,width:640,height:500,parallaxX:8,parallaxY:6};
export const sampleCorridors=[
 {id:'vng-origin',title:'THE IDEA',subtitle:'01 / VENGEANCE',body:`I wanted to create something that could render my perception about **BADASS.**

But rendering it in reality is too expensive. I can't just build a brutalist megastructure, put a colossal Moon above a runway arena, or walk into the street and direct everyone to watch me. And apparently, fighting worthy rivals with superpowers isn't on the school curriculum.

Yeah. Very restricted. But I refuse to spend my life saying, "I can't do that."`,
  artifacts:[{id:'artifact-intro',title:'THE IDEA',image:'',x:0,y:0,z:0,yaw:-7,pitch:0,width:490,height:320,parallaxX:14,parallaxY:9,fit:'contain'}]},
 {id:'vng-universe',title:'MY OWN UNIVERSE',subtitle:'02 / NO PERMISSION REQUIRED',body:`I don't need permission, validation, or even someone else's understanding to start. So I built my own universe in a virtual environment.

No landlord telling me I can't build a skyscraper. No engineer asking where the structural supports are. No one dismissing the entire thing as "unrealistic." Because here, I am the reality.`,
  artifacts:[{id:'artifact-world',title:'THE UNIVERSE',image:'',x:0,y:0,z:0,yaw:9,pitch:0,width:490,height:330,parallaxX:16,parallaxY:11,fit:'contain'}]},
 {id:'vng-creation',title:'BUILD ANYTHING',subtitle:'03 / FIVE COMMANDS',body:`Need a katana? Model it.

Need avant-garde fashion? Design it.

Need a ridiculous motorcycle? Build it.

Need to show off my jawline while doing a backflip? Direct it.

Need somewhere cinematic to fight? Create the entire arena.`,
  artifacts:[{id:'artifact-making',title:'MADE IN BLENDER',image:'',x:0,y:0,z:0,yaw:-8,pitch:0,width:490,height:330,parallaxX:18,parallaxY:10,fit:'contain'}]},
 {id:'vng-imagination',title:'NO LIMITATIONS',subtitle:'04 / THE WORLD IS MINE',body:`**The only limitation is my imagination. No gravity, no physics, no irreversible consequence.**

Blender gave me something I couldn't get in real life: the ability to control an entire world with my own hands. But I didn't want a collection of disconnected renders. I wanted the architecture, the characters, the movement, and the violence to coexist inside one experience.`,
  artifacts:[{id:'artifact-imagination',title:'THE WORLD',image:'',x:0,y:0,z:0,yaw:5,pitch:0,width:490,height:325,parallaxX:14,parallaxY:10,fit:'contain'}]},
 {id:'vng-film',title:'VENGEANCE',subtitle:'05 / THE FILM',body:`**So in the end, it’s a film.**

*An unfinished science-fiction action (or posing) film. Created April 20, 2026.*`,
  artifacts:[{id:'artifact-film',title:'THE FILM',image:'',x:0,y:0,z:0,yaw:0,pitch:0,width:490,height:345,parallaxX:12,parallaxY:8,fit:'contain'}]}
];
// Every corridor frame is independently editable, separate from its images.
sampleCorridors.forEach((corridor,i)=>{
 corridor.frame={...defaultFrame,yaw:i%2===0?-4:4};
});
export const makeId=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export const createArtifact=()=>({id:makeId(),title:'NEW ARTIFACT',image:'',x:0,y:0,z:0,yaw:0,pitch:0,width:460,height:310,parallaxX:14,parallaxY:9,fit:'contain'});
export const createCorridor=()=>({id:makeId(),title:'NEW CORRIDOR',subtitle:'VENGEANCE / ARTIFACT',body:'Write your description here.',frame:{...defaultFrame},artifacts:[createArtifact()]});
export const normalizeCorridors=value=>Array.isArray(value)?
 value.filter(c=>c&&typeof c==='object').slice(0,60).map(c=>({
  ...createCorridor(),...c,id:String(c.id||makeId()),title:String(c.title||'UNTITLED'),
  subtitle:String(c.subtitle||''),body:String(c.body||''),
  frame:{...defaultFrame,...(c.frame||{})},
  artifacts:Array.isArray(c.artifacts)?c.artifacts.slice(0,80).map(a=>({...createArtifact(),...a,id:String(a.id||makeId())})):[],
 })):sampleCorridors;
export const defaultManifesto=()=>sampleCorridors.map(c=>c.body).join('\n\n');
export const MANIFESTO_STORAGE_KEY='vengeance-editorial-manifesto-v1';
const DB='vengeance-corridor-gallery';
const STORE='documents';
export function readSavedCorridors(){
 return new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){resolve(null);return}
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
  request.onerror=()=>resolve(null);
  request.onsuccess=()=>{
   const db=request.result;
   const tx=db.transaction(STORE,'readonly');
   const get=tx.objectStore(STORE).get(STORAGE_KEY);
   get.onsuccess=()=>{resolve(get.result||null);db.close()};
   get.onerror=()=>{resolve(null);db.close()};
  };
 });
}
export function saveCorridors(value){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return}
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{
   const db=request.result;
   const tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).put(value,STORAGE_KEY);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(tx.error)};
  };
 });
}

export function readSavedManifesto(){
 return new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){resolve(null);return}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>resolve(null);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(STORE,'readonly');
   const get=tx.objectStore(STORE).get(MANIFESTO_STORAGE_KEY);
   get.onsuccess=()=>{resolve(typeof get.result==='string'?get.result:null);db.close()};
   get.onerror=()=>{resolve(null);db.close()};
  };
 });
}
export function saveManifesto(value){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).put(value,MANIFESTO_STORAGE_KEY);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(tx.error)};
  };
 });
}

/* One independent editorial frame for each triplet of right-hand portals. */
export const corridorGroupCount=corridors=>Math.max(1,Math.ceil(corridors.length/3));
export const defaultGroupText=(corridors,index)=>corridors.slice(index*3,index*3+3)
 .map(c=>String(c.body||'')).filter(Boolean).join('\n\n');
export const GROUP_TEXT_KEY='vengeance-editorial-groups-v1';
export function readSavedGroupTexts(){
 return new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){resolve(null);return}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>resolve(null);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(STORE,'readonly');
   const get=tx.objectStore(STORE).get(GROUP_TEXT_KEY);
   get.onsuccess=()=>{resolve(Array.isArray(get.result)?get.result:null);db.close()};
   get.onerror=()=>{resolve(null);db.close()};
  };
 });
}
export function saveGroupTexts(value){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).put(value,GROUP_TEXT_KEY);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(tx.error)};
  };
 });
}
