// Shared settled-grain material for HOME, VENGEANCE and WORKSHOP.
// The geometry and all artist controls come from the same CorridorGeometry
// defaults. Projects may change where an individual frame sits, but not
// invent a separate baseline brightness, size, or twinkle model.
import {frameDefaults} from './CorridorGeometry';

export function corridorDustStyle(grain,frameIndex,{params=frameDefaults,time=0,hover=false}={}){
 const q=params;
 const f=q.frames[frameIndex]||q.frames[1];
 const shimmer=1+(q.edgeTwinkle??1)*Math.sin(
  time*(q.edgeTwinkleRate??5)*(1+grain.offset*.45)+grain.twinkle
 );
 const corner=(grain.position<.07||grain.position>.93)?1.25:1;
 const brightness=(q.edgeOpacity??.8)*(q.edgeBrightness??.5)*
  q.light*f.light*(.13+.47*grain.sparkle)*shimmer*corner*
  (hover?(q.hoverFrameLight??3):1);
 const alpha=Math.max(0,Math.min(1,brightness));
 const size=Math.max(.25,(q.edgeDustSize??.7)*(.28+.7*grain.size)*f.stroke);
 return {alpha,size};
}
