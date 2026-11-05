import {homography,projectUV,projectiveCSS} from './ProjectiveGeometry';
// Free UV layout on the same perspective plane as its parent corridor.
// UV values beyond [0,1] are intentional: a photograph can overhang,
// undershoot, or sit anywhere without the frame limiting its geometry.
export function corridorMediaQuad(quad,{
  offsetX=0,offsetY=0,width=460,height=310,planeWidth=460,planeHeight=310
}={}){
 // A true homography remains on the same perspective plane even when
 // free media extends beyond the frame (UV outside 0..1).
 const H=homography(quad);
 const interpolate=(u,v)=>projectUV(H,u,v);
 const centerX=.5+(Number(offsetX)||0)/planeWidth;
 const centerY=.5+(Number(offsetY)||0)/planeHeight;
 const sx=(Number(width)||460)/planeWidth;
 const sy=(Number(height)||310)/planeHeight;
 return [
  interpolate(centerX-sx/2,centerY-sy/2),
  interpolate(centerX+sx/2,centerY-sy/2),
  interpolate(centerX+sx/2,centerY+sy/2),
  interpolate(centerX-sx/2,centerY+sy/2)
 ];
}
// Compatibility alias for older image placements. No enforced inset.
export const corridorInsetQuad=corridorMediaQuad;

// Rectangular placements are likewise unconstrained. The caller chooses
// image dimensions and offsets, never the frame's dust border.
export function corridorMediaRect(quad,{width,height,offsetX=0,offsetY=0}={}){
 const xs=quad.map(p=>p[0]),ys=quad.map(p=>p[1]);
 const left=Math.min(...xs),top=Math.min(...ys);
 return {left:left+(Number(offsetX)||0),
  top:top+(Number(offsetY)||0),
  width:Number(width)||Math.max(...xs)-left,
  height:Number(height)||Math.max(...ys)-top};
}

// The media is a free-standing plane. Frame geometry only supplies its center
// and rotation; it NEVER determines its width, height, crop or UV boundaries.
// A 3D rotation gives honest foreshortening without mapping the photograph
// into the frame's arbitrary trapezoid.
export function freeMediaStyle(frameQuad,media={},frame={}){
 const center=frameQuad.reduce((acc,point)=>[
  acc[0]+point[0]/frameQuad.length,
  acc[1]+point[1]/frameQuad.length
 ],[0,0]);
 const number=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
 const width=Math.max(1,number(media.width,460));
 const height=Math.max(1,number(media.height,310));
 const yaw=number(frame.yaw,0)+number(media.yaw,0);
 const pitch=number(frame.pitch,0)+number(media.pitch,0);
 return {
  left:center[0]+number(media.x,0),
  top:center[1]+number(media.y,0),
  width,height,
  transform:'translate(-50%,-50%) perspective(1200px) rotateY('+yaw+'deg) rotateX('+pitch+'deg)'
 };
}


// Scale media with the *projected corridor size*, not the raw viewport.
// Use one uniform scalar for X, Y, width and height: changing the corridor
// size cannot stretch the photograph. User-authored media dimensions and
// offsets still determine whether it overlaps or leaves a gap.
export function scaledCorridorMediaStyle(frameQuad,media={},frame={}){
 const xs=frameQuad.map(point=>point[0]),ys=frameQuad.map(point=>point[1]);
 const projectedWidth=Math.max(0,Math.max(...xs)-Math.min(...xs));
 const projectedHeight=Math.max(0,Math.max(...ys)-Math.min(...ys));
 // Base image dimensions match the default VENGEANCE artifact settings.
 const sceneScale=Math.min(projectedWidth/460,projectedHeight/310);
 const number=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
 const scaled={
  ...media,
  width:number(media.width,460)*sceneScale,
  height:number(media.height,310)*sceneScale,
  x:number(media.x,0)*sceneScale,
  y:number(media.y,0)*sceneScale
 };
 return freeMediaStyle(frameQuad,scaled,frame);
}

// Project the image as a genuinely coplanar, independently sized rectangle.
// Offsets and sizes are authored in the corridor's local design units; they
// are NOT clamped or fitted to the dust frame, and may extend past its edges.
export function projectedFreeMediaStyle(frameQuad,media={},plane={}){
 const number=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
 const width=Math.max(1,number(media.width,460));
 const height=Math.max(1,number(media.height,310));
 const quad=corridorMediaQuad(frameQuad,{
  offsetX:number(media.x,0),offsetY:number(media.y,0),
  width,height,
  planeWidth:Math.max(1,number(plane.width,460)),
  planeHeight:Math.max(1,number(plane.height,310))
 });
 return {left:0,top:0,width,height,transform:projectiveCSS(quad,width,height)};
}
