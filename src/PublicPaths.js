// Honor GitHub Pages' repository prefix while preserving Codespaces root URLs.
export const siteBase=(import.meta.env.BASE_URL||'/').replace(/\/?$/, '/');
export const sitePath=path=>siteBase+String(path||'').replace(/^\//,'');
export const routePath=pathname=>{
 const prefix=siteBase.slice(0,-1);
 return prefix&&pathname.startsWith(prefix+'/')?pathname.slice(prefix.length):pathname===prefix?'/':pathname;
};
