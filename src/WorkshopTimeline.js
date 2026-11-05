import {frozenPortfolio} from './FrozenPortfolioContent';
// Everything in the Workshop scene is positioned relative to the crystal core.
// This model is intentionally independent of viewport pixels.
export const WORKSHOP_STORAGE_KEY='more-dimension-timeline-v1';
export const TIMELINE_STEP=380;
export const defaultEvents=frozenPortfolio.workshopEvents;
export const makeWorkshopId=()=>typeof crypto!=='undefined'&&crypto.randomUUID
 ?crypto.randomUUID():'workshop-'+Date.now()+'-'+Math.random().toString(36).slice(2);
export function normalizeEvent(item,index=0){
 const d=defaultEvents[index%defaultEvents.length],raw=item||{};
 const number=(v,f,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(v))?Number(v):f));
 const side=raw.side==='right'?'right':'left';
 const x=number(raw.x,side==='left'?-245:245,-650,650);
 return {id:String(raw.id||makeWorkshopId()),year:String(raw.year??d.year).slice(0,20),
  title:String(raw.title??d.title).slice(0,130),subtitle:String(raw.subtitle??d.subtitle).slice(0,160),
  side,x,y:number(raw.y,480+index*TIMELINE_STEP,0,20000),
  width:number(raw.width,270,140,620),height:number(raw.height,160,90,420),
  manualTextWidth:raw.manualTextWidth===true,
  manualTextHeight:raw.manualTextHeight===true,
  branchY:number(raw.branchY,raw.y??480+index*TIMELINE_STEP,120,20000),
  description:String(raw.description??d.description).slice(0,5000),
  contentType:raw.contentType==='video'?'video':raw.contentType==='image'?'image':'text',
  image:typeof raw.image==='string'?raw.image:'',
  yaw:number(raw.yaw,d.yaw||0,-75,75),
  pitch:number(raw.pitch,0,-45,45),z:number(raw.z,0,-280,280),
  parallaxX:number(raw.parallaxX,0,0,24),parallaxY:number(raw.parallaxY,0,0,24),
  mediaId:typeof raw.mediaId==='string'?raw.mediaId:'',
  mediaType:raw.mediaType==='video'?'video':'image',
  mediaUrl:typeof raw.mediaUrl==='string'?raw.mediaUrl:'',
  mediaX:Number.isFinite(Number(raw.mediaX))?Number(raw.mediaX):0,
  mediaY:Number.isFinite(Number(raw.mediaY))?Number(raw.mediaY):0,
  mediaWidth:Number.isFinite(Number(raw.mediaWidth))?Number(raw.mediaWidth):270,
  mediaHeight:Number.isFinite(Number(raw.mediaHeight))?Number(raw.mediaHeight):160,
  imageFit:raw.imageFit==='cover'?'cover':'contain'};
}
export function normalizeWorkshopEvents(value){
 return Array.isArray(value)
  ?value.slice(0,80).map((item,i)=>normalizeEvent(item,i))
  :defaultEvents.map((item,i)=>normalizeEvent(item,i));
}
// Convert the current viewport center into timeline/world coordinates.
// The scene is rendered at coreY, then translated by scroll and scaled.
export function workshopViewportSpawn(scroll,viewportHeight,scale){
 const safeScale=Math.max(.01,Number(scale)||1);
 const coreY=viewportHeight*.49;
 // New text portals are top-anchored, so offset half their initial height
 // to put the actual corridor (rather than its top) at viewport center.
 const initialHeight=160;
 return {
  x:0,
  y:Math.max(0,Math.min(20000,Math.round(
   (scroll+viewportHeight*.5-coreY)/safeScale-initialHeight/2
  )))
 };
}
export function newWorkshopEvent(events,position){
 const last=Math.max(100,...events.map(e=>Math.max(e.y,e.branchY)));
 const i=events.length,side=i%2===0?'left':'right';
 const y=position?position.y:last+TIMELINE_STEP;
 const x=position?position.x:(side==='left'?-250:250);
 return normalizeEvent({id:makeWorkshopId(),year:'YEAR',title:'NEW DIMENSION',
  subtitle:'WORKSHOP / NEW EVENT',side:position?(x<0?'left':'right'):side,x,
  y,branchY:y,width:280,height:160,contentType:'text',image:'',yaw:0,pitch:0,z:0,parallaxX:0,parallaxY:0,mediaId:'',mediaType:'image',mediaUrl:'',imageFit:'contain',description:'Edit this timeline entry.'},i);
}
export function estimatedTextHeight(event){
 if(event.contentType!=='text'||event.manualTextHeight)return event.height;
 const width=event.manualTextWidth?event.width:Math.max(460,event.width);
 const charsPerLine=Math.max(18,Math.floor((width-60)/7));
 const lines=String(event.description||'').split(/\r?\n/).reduce((sum,line)=>
  sum+Math.max(1,Math.ceil(line.length/charsPerLine)),0);
 return Math.max(event.height,lines*20+150);
}
export function timelineExtent(events){return Math.max(1500,...events.map(e=>
 Math.max(e.y+estimatedTextHeight(e)+320,e.branchY+460)))}
export function timelineWorldY(worldY,scroll,coreY){return coreY+worldY-scroll}
export function eventIsVisible(event,scroll,viewportHeight,coreY){
 const y=timelineWorldY(event.y,scroll,coreY);
 return scroll>24&&y>-280&&y<viewportHeight+260;
}
