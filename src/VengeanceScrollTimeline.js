// One deterministic scroll timeline shared by the editorial and portal camera.
// The second phase cannot start until the last word has fully appeared.
export const TEXT_SCROLL_UNITS=1000;
export const PORTAL_SCROLL_UNITS=1000;
export const GROUP_SCROLL_UNITS=TEXT_SCROLL_UNITS+PORTAL_SCROLL_UNITS;
export function sampleCorridorTimeline(progress,groupCount,portalSpacing){
 const count=Math.max(1,Math.floor(groupCount)||1);
 const p=Math.min(1,Math.max(0,Number(progress)||0));
 const position=p*count*GROUP_SCROLL_UNITS;
 const group=Math.min(count-1,Math.floor(position/GROUP_SCROLL_UNITS));
 const local=Math.max(0,position-group*GROUP_SCROLL_UNITS);
 const textProgress=Math.min(1,local/TEXT_SCROLL_UNITS);
 const portalProgress=Math.min(1,Math.max(0,(local-TEXT_SCROLL_UNITS)/PORTAL_SCROLL_UNITS));
 return {group,textProgress,portalProgress,
  cameraY:(group+portalProgress)*portalSpacing};
}

/* An editorial ID always exists even when it owns zero right-side corridors.
   The short empty-group exit preserves a readable timeline without forcing
   the user to upload media or fabricate three placeholder frames. */
export const EMPTY_TRANSIT_UNITS=140;
export function sampleEditorialTimeline(progress,linkedCounts,portalSpacing){
 const counts=Array.isArray(linkedCounts)&&linkedCounts.length?linkedCounts:[0];
 const units=counts.map(n=>TEXT_SCROLL_UNITS+(n>0?PORTAL_SCROLL_UNITS:EMPTY_TRANSIT_UNITS));
 const total=units.reduce((a,b)=>a+b,0);
 const pos=Math.max(0,Math.min(1,Number(progress)||0))*total;
 let cursor=0,group=counts.length-1;
 for(let i=0;i<units.length;i++){
  if(pos<cursor+units[i]||i===units.length-1){group=i;break}
  cursor+=units[i];
 }
 const local=Math.max(0,pos-cursor);
 const textProgress=Math.min(1,local/TEXT_SCROLL_UNITS);
 const duration=counts[group]>0?PORTAL_SCROLL_UNITS:EMPTY_TRANSIT_UNITS;
 const portalProgress=Math.min(1,Math.max(0,(local-TEXT_SCROLL_UNITS)/duration));
 return {group,textProgress,portalProgress,
  cameraY:(group+portalProgress)*portalSpacing,totalUnits:total};
}
export const editorialScrollUnits=counts=>counts.reduce((sum,n)=>
 sum+TEXT_SCROLL_UNITS+(n>0?PORTAL_SCROLL_UNITS:EMPTY_TRANSIT_UNITS),0);
export function editorialGroupScrollStart(counts,index){
 const before=counts.slice(0,Math.max(0,index));
 const total=editorialScrollUnits(counts);
 return total>0?editorialScrollUnits(before)/total:0;
}

/* After all left text and attached corridors finish, one further wheel
   passage lifts the complete project and unveils the film screening area. */
export const VENGEANCE_OUTRO_UNITS=1750;
export function sampleVengeanceJourney(progress,counts,spacing){
 const editorialUnits=editorialScrollUnits(counts);
 const total=editorialUnits+VENGEANCE_OUTRO_UNITS;
 const position=Math.max(0,Math.min(1,Number(progress)||0))*total;
 const textFraction=editorialUnits>0?Math.min(position,editorialUnits)/editorialUnits:1;
 const editorial=sampleEditorialTimeline(textFraction,counts,spacing);
 const outroProgress=Math.max(0,Math.min(1,(position-editorialUnits)/VENGEANCE_OUTRO_UNITS));
 const liftProgress=outroProgress*outroProgress*(3-2*outroProgress);
 return {...editorial,outroProgress,liftProgress,
  cameraY:editorial.cameraY+liftProgress*spacing*1.25};
}
export function vengeanceGroupScrollStart(counts,index){
 const editorialUnits=editorialScrollUnits(counts);
 return editorialGroupScrollStart(counts,index)*editorialUnits/
  Math.max(1,editorialUnits+VENGEANCE_OUTRO_UNITS);
}
