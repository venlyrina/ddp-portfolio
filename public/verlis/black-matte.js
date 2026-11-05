// Border-connected black matte removal for image uploads.
// Preserve enclosed black strokes/labels by flood-filling only dark pixels
// reachable from the image perimeter. This is not semantic segmentation.
const blackCandidate=(r,g,b)=> {
 const high=Math.max(r,g,b),low=Math.min(r,g,b);
 return high<=76 && high-low<=43;
};
export async function removeBlackBackground(blob){
 if(!blob?.type?.startsWith('image/'))return blob;
 let bitmap;
 try{bitmap=await createImageBitmap(blob)}catch{return blob}
 try{
  const scale=Math.min(1,3000/Math.max(bitmap.width,bitmap.height));
  const w=Math.max(1,Math.round(bitmap.width*scale));
  const h=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return blob;
  ctx.drawImage(bitmap,0,0,w,h);
  const img=ctx.getImageData(0,0,w,h),d=img.data,total=w*h;
  const candidate=new Uint8Array(total),visited=new Uint8Array(total);
  const queue=new Int32Array(total);
  for(let i=0;i<total;i++){
   const k=i*4;
   candidate[i]=d[k+3]>0&&blackCandidate(d[k],d[k+1],d[k+2])?1:0;
  }
  let head=0,tail=0;
  const enqueue=i=>{if(candidate[i]&&!visited[i]){visited[i]=1;queue[tail++]=i}};
  for(let x=0;x<w;x++){enqueue(x);enqueue((h-1)*w+x)}
  for(let y=0;y<h;y++){enqueue(y*w);enqueue(y*w+w-1)}
  if(!tail)return blob;
  // Regions over 90% dark may be intentional black artwork. Keep those
  // untouched unless their boundary actually connects to a transparent field.
  while(head<tail){
   const i=queue[head++],x=i%w,y=(i-x)/w;
   if(x)enqueue(i-1);if(x<w-1)enqueue(i+1);
   if(y)enqueue(i-w);if(y<h-1)enqueue(i+w);
  }
  if(tail<Math.max(12,total*.015))return blob;
  for(let i=0;i<total;i++){
   if(!visited[i])continue;
   const k=i*4,lum=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];
   const alpha=Math.max(0,Math.min(1,(lum-15)/59));
   d[k+3]=Math.round(d[k+3]*alpha);
  }
  ctx.putImageData(img,0,0);
  return await new Promise(resolve=>canvas.toBlob(result=>resolve(result||blob),'image/png'));
 }catch(error){
  console.warn('Black matte extraction skipped:',error);
  return blob;
 }finally{bitmap.close?.()}
}
