// Warm static photographs before they enter the scroll viewport.
// Only images: never download large full-resolution videos on page entry.
// Keep a bounded decoded-image cache to avoid repeat downloads when scrubbing.
const warmed=new Map();
const MAX_IMAGES=36;
export function warmPublicImages(urls){
 if(typeof Image==='undefined')return;
 const queue=[...new Set((urls||[]).filter(url=>typeof url==='string'&&url&&!url.startsWith('blob:')&&!url.startsWith('data:')&&!warmed.has(url)))];
 let cursor=0,active=0;
 const advance=()=>{
  while(active<2&&cursor<queue.length){
   const url=queue[cursor++];
   if(warmed.has(url))continue;
   active++;
   const img=new Image();
   img.decoding='async';
   img.fetchPriority='low';
   warmed.set(url,img);
   if(warmed.size>MAX_IMAGES)warmed.delete(warmed.keys().next().value);
   const done=()=>{
    img.onload=null;img.onerror=null;
    active--;
    advance();
   };
   img.onload=()=>{if(typeof img.decode==='function')img.decode().catch(()=>{}).finally(done);else done()};
   img.onerror=()=>{warmed.delete(url);done()};
   img.src=url;
  }
 };
 advance();
}
