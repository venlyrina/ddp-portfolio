import {frameDefaults,frameCorners,projectPoint,projectedFrame,projectedMediaYaw} from './CorridorGeometry';

const middle=points=>points.reduce((acc,v)=>acc.map((n,i)=>n+v[i]/points.length),[0,0,0]);
const bounds=points=>{
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return {width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
};
const SOURCE_BASE=Array.from({length:3},(_,i)=>bounds(projectedFrame(i+1,frameDefaults)));
export function workshopMediaYaw(event,index){
 const template=1+index%3;
 const params={...frameDefaults,frames:frameDefaults.frames.map(f=>({...f}))};
 params.frames[template]={...params.frames[template],yaw:Number(event.yaw)||0};
 return projectedMediaYaw(template,params);
}
export function workshopFrameQuad(event,index,image=false){
 const template=1+index%3;
 const params={...frameDefaults,frames:frameDefaults.frames.map(f=>({...f}))};
 const base=params.frames[template];
 // Physical world-space dimensions, yaw and depth from original architecture.
 params.frames[template]={...base,
  width:base.width*(event.width||270)/270,
  height:base.height*(event.height||160)/160,
  yaw:(event.yaw||0),z:base.z+(event.z||0)/62
 };
 const original=frameCorners(template,params);
 const center=middle(original);
 const pitch=(event.pitch||0)*Math.PI/180,co=Math.cos(pitch),si=Math.sin(pitch);
 const world=original.map(v=>{
  const a=image ? 0.89 : 1;
  const y=(v[1]-center[1])*a,z=(v[2]-center[2])*a;
  return [center[0]+(v[0]-center[0])*a,
   center[1]+y*co-z*si,
   center[2]+y*si+z*co-(image ? 0.55 : 0)];
 });
 const pixels=world.map(p=>projectPoint(p,params));
 const midX=pixels.reduce((v,p)=>v+p[0]/4,0),midY=pixels.reduce((v,p)=>v+p[1]/4,0);
 // Fixed source-to-local camera calibration. It does NOT normalize each edited
 // quadrilateral, so yaw, z, physical width, height and pitch retain effect.
 const source=SOURCE_BASE[index%3];
 const factor=.94*Math.min(265/Math.max(1,source.width),158/Math.max(1,source.height));
 return pixels.map(([x,y])=>[
  (event.width||270)/2+(x-midX)*factor,
  (event.height||160)/2+(y-midY)*factor
 ]);
}
export function workshopQuadBounds(quad){
 const xs=quad.map(q=>q[0]),ys=quad.map(q=>q[1]);
 return {minX:Math.min(...xs),maxX:Math.max(...xs),
  minY:Math.min(...ys),maxY:Math.max(...ys)};
}
