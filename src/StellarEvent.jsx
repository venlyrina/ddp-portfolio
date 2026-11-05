import {frameDefaults,MORPH_DURATION_MS} from './CorridorGeometry';
import {grains,ease,countFor,framePixels,flightPoint,vortexPoint} from './DustMorph';
import { useEffect, useRef, useState } from 'react';
import './StellarEvent.css';

/**
 * Three deliberately limited visual elements:
 * 1) a pin-sized, high-intensity stellar core
 * 2) imperfect orbital arcs of individual sharp dust particles
 * 3) one needle-thin radiation impulse through the core
 * No procedural clouds, fBm textures, image assets or large black sphere.
 */
const defaults = {
  "x": 51,
  "y": 53,
  "coreSize": 20.5,
  "coreGlow": 0.2,
  "arcRadius": 269,
  "arcThickness": 174,
  "arcTilt": 0.63,
  "arcRotation": 11,
  "dustCount": 3000,
  "dustBrightness": 3,
  "dustSpeed": 1.35,
  "beamLength": 1097,
  "beamWidth": 1.55,
  "beamAngle": -70,
  "beamBrightness": 3,
  "tipGlint": 3,
  "tipLength": 77,
  "tipPosition": 0.92,
  "tipTravel": 47,
  "metalHue": 1,
  "exclusionRadius": 41,
  "stormCount": 2200,
  "stormRadius": 800,
  "stormWidth": 300,
  "stormLight": 2,
  "stormWave": 75,
  "stormSpeed": 1.5,
  "nebulaLight": 0,
  "nebulaRadius": 100,
  "nebulaFilaments": 16,
  "nebulaChroma": 1,
  "nebulaFlow": 1,
  "parallax": 12,
  "starSize": 1.35,
  "starLight": 2,
  "twinkleLength": 24,
  "foregroundParallax": 3,
  "waveCount": 10,
  "waveSpan": 610,
  "waveHeight": 100,
  "waveDensity": 3000,
  "waveBrightness": 3,
  "ribbonFreedom": 0.56,
  "ribbonSpread": 240,
  "ribbonPitch": 0,
  "ribbonCount": 7,
  "ribbonRadius": 199,
  "ribbonLength": 171,
  "ribbonBend": 0,
  "ribbonWidth": 0.5,
  "ribbonLight": 1.1,
  "ribbonSpeed": 2,
  "ribbonWave": 2.7,
  "dustBaseSize": 0.75,
  "dustBaseLight": 3,
  "dustWhiteClip": 1,
  "titleX": 31.9,
  "titleY": 19.5,
  "titleScale": 0.7,
  "titleGap": 0.3,
  "titleLight": 1,
  "subtitleX": 50,
  "subtitleY": 83,
  "subtitleScale": 1,
  "subtitleLight": 0.43,
  "titleFont": 1,
  "titleWeight": 100,
  "titleParallax": 12,
  "titleBreath": 0.05,
  "titleSheen": 0.28,
  "titleGlint": 0.2,
  "titleSheenPeriod": 8,
  "promptFont": 0,
  "promptGap": 0.27,
  "promptGlitch": 1,
  "promptCycle": 11,
  "promptAltDuration": 2,
  "promptOpacity": 1,
  "accentCount": 90,
  "accentFlashSize": 28,
  "accentDormantAlpha": 0,
  "accentAfterglow": 2,
  "accentChance": 0.7,
  "accentCrossSharpness": 2.7
};

const sliders = [
  ['x', 'CENTER X %', 10, 95, 1], ['y', 'CENTER Y %', 10, 90, 1],
  ['coreSize', 'CORE SIZE PX', 1, 40, .5],
  ['coreGlow', 'CORE GLOW', 0, 3, .05],
  ['arcRadius', 'ARC RADIUS PX', 20, 850, 1],
  ['arcThickness', 'ARC WIDTH PX', 5, 330, 1],
  ['arcTilt', 'ARC TILT', .12, 1, .01],
  ['arcRotation', 'ARC ANGLE °', -180, 180, 1],
  ['dustCount', 'DUST PARTICLES', 0, 7000, 100],
  ['dustBrightness', 'DUST LIGHT', 0, 3, .05],
  ['dustSpeed', 'ORBIT SPEED', 0, 1.5, .01],
  ['dustBaseSize', 'DUST SIZE', .15, 1.8, .01],
  ['dustBaseLight', 'DUST BASE LIGHT', .2, 3, .05],
  ['dustWhiteClip', 'DUST WHITEN', 0, 1, .05],
  ['accentCount','ACCENT DUST COUNT',0,250,5],['accentFlashSize','CRYSTAL FLASH SIZE',2,35,1],['accentDormantAlpha','IDLE ACCENT OPACITY',0,.3,.01],['accentAfterglow','ROUND AFTERGLOW S',.1,2,.05],['accentChance','ACCENT FLASH RATE',.2,3,.1],['accentCrossSharpness','CROSS SHARPNESS',.5,4,.1],
  ['beamLength', 'BEAM LENGTH PX', 40, 1600, 1],

  ['beamAngle', 'BEAM ANGLE °', -180, 180, 1],
  ['beamBrightness', 'BEAM LIGHT', 0, 3, .05],
  ['beamWidth', 'RAPIER WIDTH PX', .2, 5, .05],
  ['ribbonCount', 'ENERGY ARC COUNT', 0, 8, 1],
  ['ribbonRadius', 'ARC DISTANCE PX', 20, 850, 1],
  ['ribbonLength', 'ARC SPAN DEG', 20, 320, 1],
  ['ribbonBend', 'ARC WAVE PX', 0, 150, 1],
  ['ribbonWave', 'ARC UNDULATIONS', .2, 8, .1],
  ['ribbonWidth', 'ARC STROKE PX', .2, 6, .1],
  ['ribbonLight', 'ARC BRIGHTNESS', 0, 3, .05],
  ['ribbonSpeed', 'ARC FLOW SPEED', 0, 2, .01],
  ['ribbonFreedom','ARC FREEDOM',0,1,.01],['ribbonSpread','ARC DEPTH PX',0,240,1],['ribbonPitch','ARC 3D TILT',0,2,.05],
  ['exclusionRadius','CORE CLEARANCE PX',20,200,1],
  ['stormCount','STORM DUST',0,2200,50],['stormRadius','STORM RADIUS PX',60,800,1],['stormWidth','STORM SPREAD PX',10,300,1],
  ['stormLight','STORM LIGHT',0,2,.05],['stormWave','STORM WAVE PX',0,75,1],['stormSpeed','STORM SPEED',0,1.5,.01],
  ['nebulaLight','NEBULA LIGHT',0,1,.01],['nebulaRadius','NEBULA RADIUS',100,850,1],
  ['nebulaFilaments','FILAMENT COUNT',0,16,1],['nebulaChroma','IRIDESCENCE',0,1,.01],['nebulaFlow','NEBULA FLOW',0,1,.01],
  ['foregroundParallax','SCENE PARALLAX',0,5,.1],
  ['waveCount','DUST WAVES',0,10,1],['waveSpan','WAVE SPAN PX',100,1000,10],['waveHeight','WAVE HEIGHT PX',10,350,5],['waveDensity','WAVE GRAINS',0,3000,100],['waveBrightness','WAVE LIGHT',0,3,.05],
  ['parallax','STAR PARALLAX',0,12,.1],['starSize','STAR SIZE',.25,2,.05],['starLight','STAR LIGHT',.2,3,.05],['twinkleLength','CRYSTAL SPIKE PX',2,24,1],
  ['titleFont','FONT 0 SYNC / 1 JOST / 2 OUTFIT / 3 MICHROMA',0,3,1],
  ['titleWeight','TITLE WEIGHT',100,400,100],['titleParallax','TITLE PARALLAX PX',0,40,1],['titleBreath','TITLE BREATH',0,.18,.01],['titleSheen','METALLIC SHEEN',0,1,.05],['titleSheenPeriod','SHEEN PERIOD S',3,18,.5],['titleGlint','CRYSTAL GLINT',0,1,.05],
  ['promptFont','PROMPT FONT 0 PLEX / 1 AZERET / 2 SPACE',0,2,1],['promptGap','PROMPT TRACKING EM',0,.55,.01],['promptGlitch','PROMPT GLITCH',0,1,.05],['promptCycle','PROMPT CYCLE S',5,25,.5],['promptAltDuration','ALT PHRASE S',.5,4,.1],['promptOpacity','PROMPT OPACITY',0,1,.05],
  ['titleX','TITLE X %',0,90,.1],['titleY','TITLE Y %',0,95,.1],['titleScale','TITLE SCALE',.3,2,.05],['titleGap','TITLE TRACKING EM',-.05,.3,.005],['titleLight','TITLE OPACITY',0,1,.05],
  ['subtitleX','SUBTITLE X %',0,90,.1],['subtitleY','SUBTITLE Y %',0,95,.1],['subtitleScale','SUBTITLE SCALE',.3,3,.05],['subtitleLight','SUBTITLE OPACITY',0,1,.05],
  ['tipGlint','TIP SPECULAR',0,3,.05],['tipLength','TIP LENGTH PX',2,90,1],['tipPosition','TIP BASE POSITION',.6,1,.01],['tipTravel','SPECULAR ROTATION °',-180,180,1],['metalHue','METAL TINT',0,1,.05],
];
function seedRandom(n) {
  const s = Math.sin(n * 127.1 + 17.7) * 43758.5453;
  return s - Math.floor(s);
}
const particles = Array.from({ length: 12000 }, (_, i) => ({
  seed: seedRandom(i + .1), theta: seedRandom(i + .5) * Math.PI * 2,
  lane: seedRandom(i + .9), size: seedRandom(i + 1.3), phase: seedRandom(i + 1.7) * 6.283,
  flash: seedRandom(i + 2.1), spread: seedRandom(i + 2.4)
}));
const TAU = Math.PI * 2;

// Special accent grains are dormant until a brief crystalline flash, then a
// round afterglow. Draw directly into the existing canvas; no extra renderer.
function AccentTwinkle(ctx,p,x,y,t,v){
 const period=(7+v.seed*8)/Math.max(.2,p.accentChance);
 const elapsed=(t+v.phase*period/6.283)%period;
 const flashTime=.14;
 const after=Math.max(.1,p.accentAfterglow);
 if(elapsed>=flashTime+after){
   if(p.accentDormantAlpha>0){ctx.fillStyle='rgba(255,255,255,'+p.accentDormantAlpha+')';ctx.fillRect(x,y,.4,.4);}
   return;
 }
 const size=p.accentFlashSize;
 ctx.save();ctx.globalCompositeOperation='screen';
 if(elapsed<flashTime){
   const power=Math.sin(Math.PI*elapsed/flashTime);
   const length=size*(.4+.6*power);
   const width=Math.max(.15,.8/p.accentCrossSharpness);
   ctx.strokeStyle='rgba(255,255,255,'+Math.min(1,power)+')';
   ctx.lineWidth=width;
   ctx.beginPath();ctx.moveTo(x-length,y);ctx.lineTo(x+length,y);
   ctx.moveTo(x,y-length*.48);ctx.lineTo(x,y+length*.48);ctx.stroke();
 }else{
   const k=1-(elapsed-flashTime)/after;
   ctx.fillStyle='rgba(255,255,255,'+Math.max(0,k*.94).toFixed(3)+')';
   ctx.beginPath();ctx.arc(x,y,Math.max(.25,p.dustBaseSize*(.65+.65*k)),0,TAU);ctx.fill();
 }
 ctx.restore();
}


// Continuous material hand-off: visible stellar grains swirl first, sweep
// around their assigned frame, then slowly settle onto its actual four edges.
// No corridor opacity crossfade, no central sink, no pre-rendered frame light.
// The same tiny grains stay in the vortex until their individual release
// times, fly along a curved magnetic tangent, then leave this layer only AFTER
// the destination field has claimed them. Nothing hard-cuts into a SVG frame.
// Fine helices make the morph read as a spatial vortex: alternating
// upper and lower strands slip around one axis, with expanding spiral arms.
// They are unfilled, tapered, and belong to the existing 2D particle canvas.
function CrystallizeDust(ctx,p,cx,cy,t,progress,w,h,geometry,mx=0,my=0){
 const targetCount=countFor(geometry);
 const baseCount=Math.max(2300,Math.min(4000,p.dustCount));
 const visible=baseCount+(targetCount-baseCount)*ease(progress/.24);
 const edges=framePixels(geometry,w,h,mx,my);
 ctx.save();
 ctx.globalCompositeOperation='screen';
 for(let i=0;i<Math.ceil(visible);i++){
  const g=grains[i];
  if(!g)break;
  const arrival=g.release+g.duration;
  if(progress>=arrival)continue; // deposited particles are drawn by Corridor
  const [px,py]=progress<g.release
   ?vortexPoint(g,progress,cx,cy,geometry.flowCurl)
   :flightPoint(g,progress,cx,cy,edges,geometry);
  const born=i<baseCount?1:ease((visible-i)/Math.max(1,targetCount*.055));
  const flash=(progress>g.release&&progress<arrival)?1.22:1;
  const alpha=Math.min(1,born*(.24+.67*g.sparkle)*flash);
  const size=(.34+.7*g.size)*(1+.15*Math.sin(g.twinkle+progress*12));
  ctx.fillStyle='rgba(245,250,255,'+alpha.toFixed(3)+')';
  ctx.fillRect(px,py,size,size);
 }
 ctx.restore();
}

function DustArc(ctx, p, x, y, t, pixelRatio) {
  if (!p.dustCount || !p.dustBrightness) return;
  const rot = p.arcRotation * Math.PI / 180;
  const co = Math.cos(rot), si = Math.sin(rot);
  const arc = p.arcRadius, thickness = p.arcThickness;
  for (let i = 0; i < p.dustCount; i++) {
    const v = particles[i];
    const theta = v.theta + t * p.dustSpeed * (.14 + .4 * v.size) * (v.lane > .43 ? 1 : .66);
    // Distinct broken arcs; empty angular sectors are intentional.
    const region = Math.cos(theta * 2.1 + .55) * .32 + Math.sin(theta * 5.0 - .9) * .16;
    const irregular = Math.sin(theta * 3.4 + v.phase) * .085;
    const select = region + irregular + v.spread * .2;
    if (select < -.20 && v.flash < .9) continue;
    // Dust occupies several overlapping elliptical arcs with variable radial spread.
    const band = (v.lane - .5) * thickness * (v.flash > .94 ? 2.5 : 1.15);
    const radius = arc + band + 12 * Math.sin(theta * 2.8 + v.phase) + 7 * Math.sin(theta * 7.2 + v.seed);
    const dx = Math.cos(theta) * radius;
    const dy = Math.sin(theta) * radius * p.arcTilt;
    const px = x + dx * co - dy * si;
    const py = y + dx * si + dy * co;
    const inward = 1 - Math.min(1, Math.abs(band) / Math.max(1, thickness * 1.3));
    const special=v.flash>1-Math.min(.2,p.accentCount/Math.max(1,p.dustCount));
    if(special){AccentTwinkle(ctx,p,px,py,t,v);continue;}
    const sparkle=0;
    const alpha = Math.min(.93, (.13 + v.size * .5) * (.4 + inward * .6) *
      Math.max(.12, Math.min(1, (select + .34) * 1.7)) * p.dustBrightness * (.88 + sparkle * 2.8));
    const dot = (.45 + v.size * .8) * p.dustBaseSize;
    const dustTone = Math.round(236 + 19 * p.dustWhiteClip);
    ctx.fillStyle = 'rgba(' + dustTone + ',' + dustTone + ',255,' + Math.min(1, alpha * p.dustBaseLight).toFixed(3) + ')';
    ctx.beginPath();
    if (Math.hypot(px - x, py - y) < p.exclusionRadius) continue;
    ctx.arc(px, py, dot, 0, TAU);
    ctx.fill();
  }
}



function WaveDust(ctx,p,x,y,t){
 if(!p.waveCount||!p.waveDensity||!p.waveBrightness)return;
 ctx.save();ctx.globalCompositeOperation='screen';
 // Spatially separate non-concentric filaments. Dust follows wavy, warped,
 // open magnetic sheets instead of being assigned to an orbital ring.
 const n=Math.round(p.waveDensity);
 for(let i=0;i<n;i++){
  const v=particles[(i*7+419)%particles.length];
  const lane=Math.floor(v.seed*p.waveCount);
  const u=v.lane*2-1, width=p.waveSpan;
  const phase=lane*2.4;
  const skew=(lane%2?1:-1);
  const xx=u*width*.5;
  const envelope=Math.pow(Math.sin(Math.PI*v.lane),.8);
  const yy=skew*(100+lane*24)
    +p.waveHeight*envelope*(.68*Math.sin(u*3.7+phase+t*p.stormSpeed*.32)
    +.32*Math.sin(u*9.1-phase*.7-t*p.stormSpeed*.18))
    +(v.spread-.5)*p.stormWidth*.36;
  const rot=p.arcRotation*Math.PI/180+Math.sin(lane*2.6)*.67;
  const co=Math.cos(rot),si=Math.sin(rot);
  const px=x+xx*co-yy*si,py=y+xx*si+yy*co;
  if(Math.hypot(px-x,py-y)<p.exclusionRadius+20)continue;
  const alpha=Math.min(.97,p.waveBrightness*p.dustBaseLight*(.18+.53*v.size)*envelope);
  const special=v.flash>1-Math.min(.2,p.accentCount/Math.max(1,p.waveDensity));
  if(special){AccentTwinkle(ctx,p,px,py,t,v);continue;}
  const side=(.38+v.size*.48)*p.dustBaseSize;
  const white=Math.round(235+20*p.dustWhiteClip);
  ctx.fillStyle='rgba('+white+','+white+',255,'+alpha.toFixed(3)+')';
  ctx.fillRect(px,py,side,side);
 }
 ctx.restore();
}

function EnergyRibbons(ctx, p, x, y, t) {
  if (!p.ribbonCount || !p.ribbonLight) return;
  const rot = p.arcRotation * Math.PI / 180;
  const co = Math.cos(rot), si = Math.sin(rot);
  const span = p.ribbonLength * Math.PI / 180;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (let j = 0; j < p.ribbonCount; j++) {
    const phase = j * 2.399963 + .45;
    const center = phase + t * p.ribbonSpeed * (j % 2 ? -.09 : .12);
    const radius = p.ribbonRadius * (.82 + .085 * j) + p.ribbonSpread * Math.sin(2.1*j) * p.ribbonFreedom;
    const localTilt = Math.max(.08, p.arcTilt + p.ribbonFreedom * p.ribbonPitch * Math.sin(j*3.7)*.38);
    const localRotation = rot + p.ribbonFreedom * Math.sin(j*1.71) * 1.6;
    const localCo = Math.cos(localRotation), localSi = Math.sin(localRotation);
    // Multiple filaments produce an organic ribbon, without any filled opaque area.
    for (let strand = 0; strand < 3; strand++) {
      const steps = 84;
      let previous = null;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const taper = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 1.65);
        const theta = center + (u - .5) * span;
        const wave = Math.sin(u * Math.PI * p.ribbonWave * 2 + phase + t * p.ribbonSpeed * 1.7);
        const wave2 = Math.sin(u * 11.5 + phase * 2.3 - t * p.ribbonSpeed);
        const offset = p.ribbonBend * taper * (.72 * wave + .28 * wave2);
        const r = radius + offset + (strand - 1) * (2.2 + p.ribbonWidth);
        const vx = Math.cos(theta) * r, vy = Math.sin(theta) * r * localTilt;
        const current = [x + vx * localCo - vy * localSi, y + vx * localSi + vy * localCo];
        if (Math.hypot(current[0]-x,current[1]-y) < p.exclusionRadius) {previous=null;continue;}
        if (previous) {
          // Per-segment fade ensures both tips disappear without blunt cutoffs.
          const localLight = Math.min(.9, p.ribbonLight * (strand === 1 ? .51 : .16) * taper);
          if (localLight > .002) {
            ctx.strokeStyle = 'rgba(235,235,235,' + localLight.toFixed(3) + ')';
            ctx.lineWidth = Math.max(.2, p.ribbonWidth * (strand === 1 ? 1 : .65));
            ctx.beginPath();
            ctx.moveTo(previous[0], previous[1]);
            ctx.lineTo(current[0], current[1]);
            ctx.stroke();
          }
        }
        previous = current;
      }
    }
  }
  ctx.restore();
}

function StellarCore(ctx, p, x, y, t) {
  const r = p.coreSize;
  if (r <= 0) return;
  const breathing = 1 + .04 * Math.sin(t * 1.35);
  const halo = Math.max(4, r * (7 + p.coreGlow * 4));
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, halo);
  gradient.addColorStop(0, 'rgba(255,255,255,' + Math.min(1,p.coreGlow) + ')');
  gradient.addColorStop(.08, 'rgba(255,255,255,' + Math.min(.8,p.coreGlow * .65) + ')');
  gradient.addColorStop(.25, 'rgba(190,190,190,' + Math.min(.19,p.coreGlow * .15) + ')');
  gradient.addColorStop(1, 'rgba(160,160,160,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();ctx.arc(x,y,halo,0,TAU);ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();ctx.arc(x,y,Math.max(.45,r * .5 * breathing),0,TAU);ctx.fill();
}


function MagneticStorm(ctx,p,x,y,t) {
  if (!p.stormCount || !p.stormLight) return;
  ctx.save(); ctx.globalCompositeOperation='screen';
  for(let i=0;i<p.stormCount;i++){
    const v=particles[(i*3+53)%particles.length];
    const angle=v.theta+t*p.stormSpeed*(.08+v.size*.16);
    const radial=p.stormRadius+(v.lane-.5)*p.stormWidth*2;
    const wave=Math.sin(angle*5.2+t*p.stormSpeed*1.7+v.phase)*p.stormWave;
    const r=radial+wave;
    const dx=Math.cos(angle)*r,dy=Math.sin(angle)*r*(.57+.23*v.spread);
    const co=Math.cos(p.arcRotation*Math.PI/180),si=Math.sin(p.arcRotation*Math.PI/180);
    const px=x+dx*co-dy*si,py=y+dx*si+dy*co;
    if(Math.hypot(px-x,py-y)<p.exclusionRadius)continue;
    const twinkle=.8+.2*Math.sin(t*1.3+v.phase);
    const alpha=p.stormLight*(.045+v.size*.17)*twinkle;
    ctx.fillStyle='rgba(226,232,238,'+Math.min(.35,alpha).toFixed(3)+')';
    ctx.fillRect(px,py,.4+v.size*.65,.4+v.size*.65);
  }
  ctx.restore();
}
function NebulaWisps(ctx,p,x,y,t){
 if(!p.nebulaLight||!p.nebulaFilaments)return;
 ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
 // Fine precipitating filaments; no overlapping circular haze stamps.
 for(let j=0;j<p.nebulaFilaments;j++){
  const phase=j*2.39996,axis=phase+.17*Math.sin(t*p.nebulaFlow+j);
  const origin=p.nebulaRadius*(.65+.27*Math.sin(j*1.75));
  const len=80+(j%4)*65;
  for(let strand=0;strand<4;strand++){
   let prev=null;
   for(let k=0;k<=70;k++){
    const u=k/70,taper=Math.pow(Math.sin(Math.PI*u),2);
    const theta=axis+(u-.5)*1.3+Math.sin(u*8+phase+t*p.nebulaFlow)*.15;
    const rad=origin+(u-.5)*len+strand*2.7+Math.sin(u*17+phase+t*p.nebulaFlow)*p.stormWave*.7;
    const px=x+Math.cos(theta)*rad,py=y+Math.sin(theta)*rad*(.62+.1*Math.sin(j));
    const dist=Math.hypot(px-x,py-y);
    if(dist<p.exclusionRadius+20){prev=null;continue;}
    if(prev){
     const v=p.nebulaChroma;
     const red=Math.round(211+v*24*Math.sin(j*1.7)),green=Math.round(214-v*25),blue=Math.round(223+v*25);
     const alpha=Math.min(.25,p.nebulaLight*taper*(strand===1?.23:.065));
     ctx.strokeStyle='rgba('+red+','+green+','+blue+','+alpha.toFixed(3)+')';
     ctx.lineWidth=strand===1?.75:.44;
     ctx.beginPath();ctx.moveTo(...prev);ctx.lineTo(px,py);ctx.stroke();
    }
    prev=[px,py];
   }
  }
 }
 ctx.restore();
}
function ImpulseBeam(ctx,p,x,y,t,attenuation=1){
  if(!p.beamBrightness||!p.beamLength)return;
  const a=p.beamAngle*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);
  const bx=x-dx*p.beamLength/2,by=y-dy*p.beamLength/2;
  const ex=x+dx*p.beamLength/2,ey=y+dy*p.beamLength/2;
  const fade=ctx.createLinearGradient(bx,by,ex,ey);
  fade.addColorStop(0,'rgba(255,255,255,0)');
  fade.addColorStop(.5,'rgba(242,247,255,.9)');
  fade.addColorStop(1,'rgba(255,255,255,0)');
  ctx.save();ctx.globalCompositeOperation='screen';
  ctx.strokeStyle=fade;ctx.globalAlpha=Math.min(1,p.beamBrightness*.78)*attenuation;
  ctx.lineWidth=Math.max(.2,p.beamWidth);ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(ex,ey);ctx.stroke();
  if(p.tipGlint>0){
    const z=Math.min(.99,Math.max(.5,p.tipPosition));
    const px=bx+(ex-bx)*z,py=by+(ey-by)*z;
    const rot=p.tipTravel*Math.PI/180;
    const c=Math.cos(rot),sn=Math.sin(rot);
    const vx=dx*c-dy*sn,vy=dx*sn+dy*c;
    const len=p.tipLength;
    ctx.globalAlpha=Math.min(1,p.tipGlint)*attenuation;
    for(const [ax,ay,length] of [[vx,vy,len],[-vy,vx,len*.38]]){
      if(![px,py,ax,ay,length].every(Number.isFinite))continue;
      const g=ctx.createLinearGradient(px-ax*length,py-ay*length,px+ax*length,py+ay*length);
      g.addColorStop(0,'rgba(235,241,249,0)');
      g.addColorStop(.5,'rgba(255,255,255,1)');
      g.addColorStop(1,'rgba(235,241,249,0)');
      ctx.strokeStyle=g;ctx.lineWidth=.7;
      ctx.beginPath();ctx.moveTo(px-ax*length,py-ay*length);
      ctx.lineTo(px+ax*length,py+ay*length);ctx.stroke();
    }
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,.45,0,TAU);ctx.fill();
  }
  ctx.restore();
}

export default function StellarEvent({morph=false}) {
  const canvas = useRef(null);
  const morphFlag=useRef(false);
  const morphStarted=useRef(null);
  const frameTune=useRef(frameDefaults);
  useEffect(()=>{const fn=e=>{frameTune.current=e.detail};window.addEventListener('venshalor-corridor-tune',fn);return()=>window.removeEventListener('venshalor-corridor-tune',fn)},[]);
  useEffect(()=>{morphFlag.current=morph;if(morph)morphStarted.current=performance.now();},[morph]);
  const [values,setValues] = useState(defaults);
  const [expanded,setExpanded] = useState(false);
  const [paused,setPaused] = useState(false);
  const [renderError,setRenderError]=useState(null);
  useEffect(()=>{const onError=e=>setRenderError(e.detail);window.addEventListener('venshalor-effect-error',onError);return()=>window.removeEventListener('venshalor-effect-error',onError);},[]);
  const settings = useRef(values);
  const isPaused = useRef(paused);
  useEffect(()=>{settings.current=values;
    window.dispatchEvent(new CustomEvent('venshalor-starfield-tune',{detail:{parallax:values.parallax,starSize:values.starSize,starLight:values.starLight,twinkleLength:values.twinkleLength}}));
    window.dispatchEvent(new CustomEvent('venshalor-text-tune',{detail:values}));
  },[values]);
  useEffect(()=>{isPaused.current=paused;},[paused]);

  useEffect(()=>{
    const el=canvas.current;
    const ctx=el.getContext('2d',{alpha:true});
    let raf=0, w=1,h=1,dpr=1,disposed=false, elapsed=0, prev=0, lastDraw=0;
    const failedEffects=new Set();
    const pointer={x:0,y:0},motion={x:0,y:0};
    const move=e=>{pointer.x=(e.clientX/window.innerWidth-.5)*2;pointer.y=(e.clientY/window.innerHeight-.5)*2;};
    window.addEventListener('pointermove',move,{passive:true});
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function resize(){
      dpr=Math.min(window.devicePixelRatio||1,1.5);
      w=Math.max(1,el.clientWidth);h=Math.max(1,el.clientHeight);
      el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function drawIsolated(name, fn) {
      if (failedEffects.has(name)) return;
      ctx.save();
      try { fn(); }
      catch (err) {
        failedEffects.add(name);
        console.error('[VENSHALOR] Effect failed: ' + name, err);
        window.dispatchEvent(new CustomEvent('venshalor-effect-error', { detail: {
          effect: name, message: String(err?.message || err)
        }}));
      } finally { ctx.restore(); }
    }
    function frame(time){
      if(disposed)return;
      // Schedule first. A canvas drawing exception must never stop the event loop.
      raf=requestAnimationFrame(frame);
      if(!prev)prev=time;
      if(!isPaused.current&&!reduced)elapsed+=Math.min(.05,(time-prev)/1000);
      prev=time;
      if(time-lastDraw<1000/50)return;
      lastDraw=time;
      const p=settings.current;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,w,h);
      motion.x+=(pointer.x-motion.x)*.045;
      motion.y+=(pointer.y-motion.y)*.045;
      const x=w*p.x/100+motion.x*p.foregroundParallax*22;
      const y=h*p.y/100+motion.y*p.foregroundParallax*14;
      const progress=morphStarted.current===null?0:Math.max(0,Math.min(1,(time-morphStarted.current)/MORPH_DURATION_MS));
      if(!morphFlag.current){
        drawIsolated('Nebula',()=>NebulaWisps(ctx,p,x,y,elapsed));
        drawIsolated('Magnetic storm',()=>MagneticStorm(ctx,p,x,y,elapsed));
        drawIsolated('Dust arc',()=>DustArc(ctx,p,x,y,elapsed));
        drawIsolated('Dust waves',()=>WaveDust(ctx,p,x,y,elapsed));
        drawIsolated('Energy ribbons',()=>EnergyRibbons(ctx,p,x,y,elapsed));
        drawIsolated('Rapier',()=>ImpulseBeam(ctx,p,x,y,elapsed));
        drawIsolated('Core',()=>StellarCore(ctx,p,x,y,elapsed));
      }else{
        // The original stellar structure decays smoothly while extra material
        // appears and accelerates into a visible magnetic storm around its core.
        const dustFade=1-ease(progress/.33);
        // The rapier previously reset ctx.globalAlpha internally, defeating
        // the outer fade. Attenuate both its needle and glint explicitly.
        const radiationFade=1-ease((progress-.025)/.76);
        if(dustFade>0){
          ctx.globalAlpha=dustFade;
          drawIsolated('Storm decay',()=>MagneticStorm(ctx,p,x,y,elapsed));
          drawIsolated('Arc decay',()=>DustArc(ctx,p,x,y,elapsed));
          drawIsolated('Wave decay',()=>WaveDust(ctx,p,x,y,elapsed));
          drawIsolated('Ribbon decay',()=>EnergyRibbons(ctx,p,x,y,elapsed));
        }
        if(radiationFade>0){
          ctx.globalAlpha=radiationFade;
          drawIsolated('Rapier decay',()=>ImpulseBeam(ctx,p,x,y,elapsed,radiationFade));
          drawIsolated('Stellar core decay',()=>StellarCore(ctx,p,x,y,elapsed));
        }
        ctx.globalAlpha=1;
        drawIsolated('Frame crystallization',()=>CrystallizeDust(ctx,p,x,y,elapsed,progress,w,h,frameTune.current,pointer.x,pointer.y));
      }
    }
    const ob=new ResizeObserver(resize);
    ob.observe(el);
    resize();raf=requestAnimationFrame(frame);
    return()=>{disposed=true;cancelAnimationFrame(raf);ob.disconnect();window.removeEventListener('pointermove',move);};
  },[]);
  const update=(key,val)=>setValues(p=>({...p,[key]:Number(val)}));
  return <div className="stellar-event">
    <canvas ref={canvas} className="stellar-event__canvas" aria-hidden="true"/>
  </div>;
}
