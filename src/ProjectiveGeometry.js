// Exact planar homography from a rectangle to a screen-space quadrilateral.
// Unlike skew/rotation approximations, this maps all four projected corners
// even when the frame has strong perspective convergence.
export const IMAGE_WIDTH=560;
export const IMAGE_HEIGHT=400;

export function homography(quad){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=quad;
 const dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2;
 const sx=x0-x1+x2-x3,sy=y0-y1+y2-y3;
 const determinant=dx1*dy2-dx2*dy1;
 let g=0,h=0;
 if(Math.abs(determinant)>1e-8){
  g=(sx*dy2-dx2*sy)/determinant;
  h=(dx1*sy-sx*dy1)/determinant;
 }
 return {
  a:x1-x0+g*x1,b:x3-x0+h*x3,c:x0,
  d:y1-y0+g*y1,e:y3-y0+h*y3,f:y0,g,h
 };
}
export function projectUV(H,u,v){
 const den=H.g*u+H.h*v+1;
 return [(H.a*u+H.b*v+H.c)/den,(H.d*u+H.e*v+H.f)/den];
}
export function inverseUV(H,x,y){
 const a=H.a-x*H.g,b=H.b-x*H.h,c=x-H.c;
 const d=H.d-y*H.g,e=H.e-y*H.h,f=y-H.f;
 const det=a*e-b*d;
 if(Math.abs(det)<1e-8)return [100,100];
 return [(c*e-b*f)/det,(a*f-c*d)/det];
}
export function projectiveCSS(quad,width=IMAGE_WIDTH,height=IMAGE_HEIGHT){
 const H=homography(quad);
 // CSS matrix3d is column-major. m14/m24 hold the homography's
 // perspective terms, while pixel rectangle coordinates are normalized.
 const matrix=[
  H.a/width,H.d/width,0,H.g/width,
  H.b/height,H.e/height,0,H.h/height,
  0,0,1,0,H.c,H.f,0,1
 ];
 return 'matrix3d('+matrix.map(n=>Number(n.toFixed(9))).join(',')+')';
}
