import {frozenPortfolio} from './FrozenPortfolioContent';
// Calendar ticks belong to the rapier axis, never to a free-floating portal.
export const WORKSHOP_ANCHORS_KEY='more-dimension-anchors-v1';
export const initialAnchors=frozenPortfolio.workshopAnchors;
export const makeAnchorId=()=>typeof crypto!=='undefined'&&crypto.randomUUID
 ?crypto.randomUUID():'anchor-'+Date.now()+'-'+Math.random().toString(36).slice(2);
export function normalizeAnchors(value){
 const source=Array.isArray(value)?value:initialAnchors;
 return source.slice(0,100).map((item,i)=>({
  id:String(item.id||makeAnchorId()),
  year:String(item.year??'YEAR').slice(0,24),
  title:String(item.title??'MILESTONE').slice(0,140),
  y:Math.max(0,Math.min(20000,Number.isFinite(Number(item.y))?Number(item.y):450+i*430)),
  side:item.side==='left'?'left':'right',
  note:typeof item.note==='string'?item.note.slice(0,10000):'',
  offset:Math.max(0,Math.min(240,Number(item.offset)||68)),
  width:Math.max(180,Math.min(650,Number(item.width)||360))
 }));
}
export function newAnchor(existing){
 return {id:makeAnchorId(),year:'YEAR',title:'NEW MILESTONE',
  y:Math.max(100,...existing.map(x=>x.y))+450,side:existing.length%2?'left':'right',note:'',offset:68,width:360};
}
