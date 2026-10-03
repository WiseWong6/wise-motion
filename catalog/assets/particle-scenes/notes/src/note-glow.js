import * as THREE from 'three';

// Trace the score's actual notehead glyph. The stem never participates in this mask.
export function createNoteGlow(glyph){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d'),[x,y,w,h]=glyph.bounds;
 const pad=55,width=w+pad*2,height=h+pad*2;
 const sx=canvas.width/width,sy=canvas.height/height;
 const path=new Path2D(glyph.path);
 ctx.setTransform(sx,0,0,-sy,(-x+pad)*sx,(-y+pad)*sy);
 ctx.strokeStyle='white';ctx.lineJoin='round';ctx.lineCap='round';
 ctx.shadowColor='white';ctx.shadowBlur=16;ctx.lineWidth=31;ctx.globalAlpha=.72;ctx.stroke(path);
 ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.lineWidth=15;ctx.stroke(path);
 // Keep the printed black center fully visible, illuminate only its outer boundary.
 ctx.globalCompositeOperation='destination-out';ctx.fill(path);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 return{texture,widthRatio:width/w,heightRatio:height/h};
}
