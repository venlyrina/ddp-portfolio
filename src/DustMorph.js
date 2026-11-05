import {projectedFrame} from './CorridorGeometry';

// One deterministic material pool drives the magnetic storm, flight and
// finished architecture. No SVG stroke or independent fade-in layer.
const rand=n=>{const v=Math.sin(n*127.1+17.7)*43758.5453;return v-Math.floor(v)};
export const grains=Array.from({length:12000},(_,i)=>({
  angle:rand(i+.12)*Math.PI*2,
  radius:rand(i+.38),
  offset:rand(i+.59),
  sparkle:rand(i+.81),
  spread:rand(i+1.13),
  frame:Math.floor(rand(i+1.41)*4),
  edge:Math.floor(rand(i+1.79)*4),
  position:(i*.61803398875+rand(i+2.07)*.18)%1,
  release:.29+Math.pow(rand(i+2.43),.86)*.41,
  duration:.12+rand(i+2.81)*.16,
  size:rand(i+3.07),
  twinkle:rand(i+3.43)*Math.PI*2
}));
export const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const countFor=p=>Math.min(grains.length,Math.max(2500,Math.round(p.morphParticleCount??10000)));

// Match the old SVG xMidYMid slice geometry exactly, also in canvas.
export const framePixels=(p,w,h,mx=0,my=0)=>{
  const scale=Math.max(w/1280,h/720),ox=(w-1280*scale)/2,oy=(h-720*scale)/2;
  return Array.from({length:4},(_,i)=>projectedFrame(i,p,mx,my)
    .map(([x,y])=>[ox+x*scale,oy+y*scale]));
};
export function edgePoint(g,frames){
 const quad=frames[g.frame],a=quad[g.edge],b=quad[(g.edge+1)%4];
 return [a[0]+(b[0]-a[0])*g.position,a[1]+(b[1]-a[1])*g.position,
   (b[0]-a[0]),(b[1]-a[1])];
}
// A genuine multilayer funnel rather than a rigid elliptical turntable.
// Three spiral arms have different angular depth; upper and lower streams
// counter-flow along the funnel while particles corkscrew into the center.
export function vortexPoint(g,progress,cx,cy,curl=3){
 const p=clamp(progress);
 const arm=Math.floor(g.angle/(Math.PI*2/3));
 const within=g.angle-arm*Math.PI*2/3;
 const layer=g.spread>.5?1:-1;
 const turn=(2.9+curl*.48)*Math.PI*2*p;
 const theta=arm*Math.PI*2/3+within*.84+turn*layer*.18+turn;
 const coil=(theta-arm*Math.PI*2/3)/(Math.PI*2);
 const spiral=36+Math.pow(Math.max(.04,g.radius),.76)*405;
 const shrink=1-.49*ease(p/.68);
 const radius=(spiral+19*Math.sin(coil*2.8+g.twinkle))*
  shrink*(.92+.15*Math.sin(within*1.9+coil*1.5));
 const depth=layer*(25+g.offset*77)*(1-.48*ease(p/.7));
 const pitch=layer*18*Math.sin(turn*.6+within*2.3+g.twinkle);
 return [cx+Math.cos(theta)*radius,
  cy+Math.sin(theta)*radius*.49+depth+pitch];
}
export function flightPoint(g,progress,cx,cy,edges,p){
 const release=g.release;
 if(progress<release)return vortexPoint(g,progress,cx,cy,p.flowCurl);
 const u=ease((progress-release)/g.duration);
 const [sx,sy]=vortexPoint(g,release,cx,cy,p.flowCurl);
 const [tx,ty,dx,dy]=edgePoint(g,edges);
 const distance=Math.max(1,Math.hypot(tx-sx,ty-sy));
 const tangent=[-Math.sin(g.angle),Math.cos(g.angle)];
 const bend=(p.flowSpread??230)*(.35+.65*g.spread);
 const c1x=sx+tangent[0]*bend,c1y=sy+tangent[1]*bend*.72;
 const length=Math.max(1,Math.hypot(dx,dy));
 const slide=(1-u)*(.5-g.offset)*45;
 const c2x=tx+(dx/length)*slide+tangent[0]*distance*.14;
 const c2y=ty+(dy/length)*slide+tangent[1]*distance*.14;
 const v=1-u;
 return [v*v*v*sx+3*v*v*u*c1x+3*v*u*u*c2x+u*u*u*tx,
         v*v*v*sy+3*v*v*u*c1y+3*v*u*u*c2y+u*u*u*ty];
}
export function settledPoint(g,t,edges,p){
 const [x,y,dx,dy]=edgePoint(g,edges),length=Math.max(1,Math.hypot(dx,dy));
 const nx=-dy/length,ny=dx/length;
 const jitter=(p.edgeJitter??0)*Math.sin(t*(p.edgeTwinkleRate??5)+g.twinkle*2);
 const spread=(g.spread-.5)*(p.edgeSpread??0);
 return [x+nx*(spread+jitter),y+ny*(spread+jitter)];
}
