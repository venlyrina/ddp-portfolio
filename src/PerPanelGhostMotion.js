// Smooth independent trajectories. Each frame has its own position and
// unsynchronized period: none waits for another frame to receive light.
const TAU=Math.PI*2;
const phases=[0,1.91,3.47];
const speedFactors=[.92,1.08,.84];
const fract=x=>x-Math.floor(x);
export function ghostPeriod(frame,speed=5.2){
 const base=Math.max(1.6,Math.min(20,Number(speed)||5.2));
 return base*3.3/speedFactors[frame-1];
}
export function ghostUV(frame,elapsedSeconds,speed=5.2,spread=1.25){
 const index=Math.max(1,Math.min(3,frame))-1;
 const t=elapsedSeconds/ghostPeriod(index+1,speed)*TAU;
 const phase=phases[index];
 const roam=Math.max(.25,Math.min(1.6,Number(spread)||1.25));
 // Two incommensurate smooth oscillators yield a slow organic water drift.
 // Coordinates stay inside the thumbnail, including the soft edge feather.
 const u=.5+roam*(.19*Math.sin(t+phase)+.045*Math.sin(t*.47+phase*1.6));
 const v=.5+roam*(.17*Math.cos(t*.79+phase)+.036*Math.cos(t*.43+phase*1.3));
 return [Math.max(.13,Math.min(.87,u)),Math.max(.15,Math.min(.85,v))];
}
export function ghostShimmer(frame,elapsedSeconds,amount=1,speed=1){
 const index=Math.max(1,Math.min(3,frame))-1;
 const t=elapsedSeconds*Math.max(.05,speed)+phases[index];
 const amp=Math.max(0,Math.min(3,amount));
 // Subpixel liquid refraction; never jitter/random or grain.
 return [amp*(.85*Math.sin(t*.83)+.32*Math.sin(t*1.41)),
  amp*(.65*Math.cos(t*.71)+.25*Math.cos(t*1.23))];
}
