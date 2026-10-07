// Pixel-only harness: no browser rendering or visual acceptance.
import vm from 'node:vm';
export function puppetHarness(source, samplePixels) {
 const marker=source.indexOf('else root.ViewPuppet = api;');
 const start=source.lastIndexOf('(function (root, factory)',marker);
 const tail='return Object.freeze({ draw, localPoint, footPoints, views });\n});';
 const end=source.indexOf(tail,marker)+tail.length;
 if(start<0||end<tail.length)throw Error('Missing puppet source');
 const uploads=[],draws=[];
 function canvas(){
  const node={width:0,height:0};let imageDraw;
  const ctx={canvas:node,globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},moveTo(){},lineTo(){},closePath(){},clip(){},
   drawImage(...args){imageDraw=args;draws.push(args.slice(1));},
   getImageData(x,y,width,height){return {data:samplePixels(width,height,imageDraw)};},
   createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},
   putImageData(buffer){uploads.push(buffer);}
  };node.getContext=()=>ctx;return node;
 }
 const context=vm.createContext({module:{exports:{}},document:{createElement:canvas},Math,Number,Object,Array,Uint8ClampedArray,Uint8Array,WeakMap});
 vm.runInContext(source.slice(start,end),context);
 return {puppet:context.module.exports,ctx:canvas().getContext('2d'),uploads,draws};
}
export function samplePixels(width,height){
 const pixels=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const at=(y*width+x)*4,inside=y>height*.2&&y<height*.94&&x>width*.15&&x<width*.84;
  pixels[at]=y<height*.65?100+(x%100):245;
  pixels[at+1]=240;pixels[at+2]=235;
  pixels[at+3]=inside?((x+y)%23===0?140:255):((x*13+y*7)%48);
 }
 return pixels;
}
