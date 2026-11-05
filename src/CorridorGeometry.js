// Shared geometry for four gravity-aligned portal frames and dust crystallization.
// Yaw rotates the frames in the floor plan, without rolling them about gravity.
// Shared clock for App, particle flow, and the edge lock-in.
export const MORPH_DURATION_MS=6400;
// Locked from the user's approved four-frame tuning export.
export const individualFrameDefaults=[
 {x:-3.1,y:0,z:0,yaw:0,width:1,height:1,light:1,stroke:1},
 {x:-.1,y:.4,z:0,yaw:0,width:1.2,height:.9,light:1,stroke:1},
 {x:-2.2,y:-3.4,z:0,yaw:0,width:1.95,height:1,light:2,stroke:1},
 {x:-6.7,y:4.2,z:0,yaw:-21,width:1.35,height:1,light:1,stroke:1}
];
export const frameDefaults={
 depth:4.4,yaw:36,spread:1.4,stagger:3.2,size:5.2,
 eyeX:-4.4,eyeYaw:-.12,eyeY:-.1,parallax:5,light:2,
 flowCurl:3,flowSpread:230,flowStagger:.5,
 morphParticleCount:10000,
 edgeDustSize:.7,edgeBrightness:.5,edgeOpacity:.8,
 edgeSpread:0,edgeJitter:0,edgeTwinkle:1,edgeTwinkleRate:5,
 energyArcCount:4,energyArcLength:.65,energyArcLight:.26,
 energyArcWidth:.6,energyArcCurvature:4.5,energyArcSpeed:.65,
 titleSweepSpeed:2.2,titleSweepOpacity:1,hoverFrameLight:3,hoverArcBoost:8,
 idleScanEnabled:1,idleScanSpeed:1.6,idleScanRadius:185,idleScanOpacity:.7,
 ambientHazeOpacity:0,ambientHazeBlur:0,ambientNoiseOpacity:0,
 idleThumbOpacity:.5,idleThumbBlur:2.5,ghostRevealBoost:2,idleRevealOpacity:.76,hoverThumbOpacity:1,
 ghostSize:1.7,ghostOpacity:.9,ghostBlur:.9,ghostBreath:.12,ghostShimmerAmp:1,ghostShimmerSpeed:.85,ghostCrossfade:4,ghostCycleOnPass:1,
 imagePlaneInset:.11,imagePlaneLift:.65,ghostHoverIntensity:1,ghostRoamSpread:1.25,
 frames:individualFrameDefaults.map(frame=>({...frame}))
};
export function effectiveFrameYaw(i,p=frameDefaults){
 const f=p.frames?.[i]??individualFrameDefaults[i];
 return (i%2?1:-1)*p.yaw+f.yaw;
}

// World projection uses +Z away from the camera; CSS perspective uses +Z
// toward the viewer. Account for eye yaw and reverse the media plane's yaw.
export function projectedMediaYaw(i,p=frameDefaults){
 return -(effectiveFrameYaw(i,p)-p.eyeYaw*180/Math.PI);
}
export function frameCorners(i,p=frameDefaults){
 const f=p.frames?.[i]??individualFrameDefaults[i];
 const depth=3+i*p.depth+f.z;
 const cx=(i-1.5)*p.spread+(i%2?.6:-.6)*p.stagger+f.x;
 const angle=effectiveFrameYaw(i,p)*Math.PI/180;
 const width=p.size*f.width, height=p.size*f.height;
 return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[
  cx+u*width*.5*Math.cos(angle),
  v*height*.5+p.eyeY+f.y,
  depth-u*width*.5*Math.sin(angle)
 ]);
}
export function projectPoint([x,y,z],p=frameDefaults,mx=0,my=0){
 const xx=x-p.eyeX-mx*p.parallax*.3,zz=z+4;
 const yaw=p.eyeYaw;
 const rx=xx*Math.cos(yaw)-zz*Math.sin(yaw);
 const rz=xx*Math.sin(yaw)+zz*Math.cos(yaw);
 const k=640/Math.max(1,rz);
 return [640+rx*k,360+(y-my*p.parallax*.2)*k];
}
export function projectedFrame(i,p=frameDefaults,mx=0,my=0){
 return frameCorners(i,p).map(point=>projectPoint(point,p,mx,my));
}

// The thumbnail is a physical plane parallel to the frame, inset within
// all four world-space edges then advanced toward the camera. Projecting
// independently keeps its trapezoid correct through yaw/depth/parallax.
export function projectedImagePlane(i,p=frameDefaults,mx=0,my=0){
 const world=frameCorners(i,p);
 const center=world.reduce((v,point)=>v.map((n,k)=>n+point[k]/4),[0,0,0]);
 const inset=Math.max(0,Math.min(.3,p.imagePlaneInset??.11));
 const lift=Math.max(0,Math.min(2.5,p.imagePlaneLift??.55));
 return world.map(v=>projectPoint([
  center[0]+(v[0]-center[0])*(1-inset),
  center[1]+(v[1]-center[1])*(1-inset),
  center[2]+(v[2]-center[2])*(1-inset)-lift
 ],p,mx,my));
}
