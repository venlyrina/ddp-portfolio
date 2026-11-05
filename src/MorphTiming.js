// One shared formation clock for silhouette, first clickable labels, and
// photographic material. The photo cannot appear before its dust architecture.
export const MORPH_SILHOUETTE_START=.11;
export const MORPH_TITLE_START=.24;
export const MORPH_INTERACTIVE_AT=.36;
export const MORPH_IMAGE_START=.43;
export const MORPH_IMAGE_COMPLETE=.84;
const clamp=x=>Math.min(1,Math.max(0,Number(x)||0));
export const smoothstep=x=>{const v=clamp(x);return v*v*(3-2*v)};
export const silhouetteConvergence=progress=>
 smoothstep((progress-MORPH_SILHOUETTE_START)/.27);
export const menuTitleConvergence=progress=>
 smoothstep((progress-MORPH_TITLE_START)/.20);
export const mediaConvergence=progress=>
 smoothstep((progress-MORPH_IMAGE_START)/(MORPH_IMAGE_COMPLETE-MORPH_IMAGE_START));
export const menuInteractive=progress=>progress>=MORPH_INTERACTIVE_AT;
