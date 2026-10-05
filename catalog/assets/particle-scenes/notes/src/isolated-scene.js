import * as THREE from 'three';
import data from '../assets/score-data.json';
import svg from '../assets/score-clean.svg';
import {variantAt,groups,clamp,cameraPose} from './motion';
import {createButterfly,loadButterflyAssets} from './butterfly';
import {createOrb} from './orb';
import {createNoteGlow} from './note-glow';
import {createTrail} from './trail';
export {data};
export const variants=['butterfly','orb'];
const colors=[0xc9a0ff,0xffcf72];
function radialTexture(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.18,'rgba(255,255,255,.35)');g.addColorStop(.5,'rgba(255,255,255,.09)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
export async function createScene(canvas,width=data.videoWidth,height=data.videoHeight,initialVariant='butterfly',mode='voices'){
 let variant=variants.includes(initialVariant)?initialVariant:'butterfly',currentTime=0;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(width,height,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{throw new Error('谱面绘制失败：'+gl.getShaderInfoLog(fragment));};
 const scene=new THREE.Scene();scene.background=new THREE.Color('#25212b');const camera=new THREE.PerspectiveCamera(42,width/height,2,600);
 const paperMargin=28,c=document.createElement('canvas');c.width=Math.min(8192,renderer.capabilities.maxTextureSize);c.height=Math.round(c.width*(data.height+paperMargin*2)/data.width);const ctx=c.getContext('2d');ctx.fillStyle='#a7a1a0';ctx.fillRect(0,0,c.width,c.height);
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
 // 辅助谱复用当前古老旋律的小节，只印在纸上，不参与播放和光圈定位。
 const engraving=new DOMParser().parseFromString(svg,'image/svg+xml');
 const units=data.width/Number(engraving.documentElement.getAttribute('viewBox').split(/\s+/)[2]);
 const pageOffset=Number(engraving.querySelector('.page-margin').getAttribute('transform').match(/[-\d.]+/)[0]);
 const measures=[...engraving.querySelectorAll('g.measure')].map(measure=>{
  const [left,,right]=measure.querySelector('g.staff > path').getAttribute('d').match(/[-\d.]+/g).map(Number);
  return {left:(left+pageOffset)*units,right:(right+pageOffset)*units};
 });
 // 裁掉第一小节的谱号、拍号和标签；按小节线拼接，避免空隙和重复的开头符号。
 const from=measures[1].left,to=measures.at(-1).right,span=to-from;
 const px=c.width/data.width,py=c.height/(data.height+paperMargin*2);
 for(const row of [{z:32,start:2,image}]){
  const offset=measures[row.start].left-from;
  ctx.save();ctx.globalAlpha=.82;
  for(let x=-offset;x<data.width;x+=span){
   const left=Math.max(0,x),right=Math.min(data.width,x+span);if(right<=left)continue;
   ctx.drawImage(row.image,(from+left-x)/data.width*row.image.naturalWidth,0,(right-left)/data.width*row.image.naturalWidth,row.image.naturalHeight,
    left*px,(paperMargin+row.z)*py,(right-left)*px,data.height*py);
  }
  ctx.restore();
 }
 // 主谱保持世界坐标 z=0..height，纸张加高也不移动任何实际音符。
 ctx.drawImage(image,0,paperMargin*py,c.width,data.height*py);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const lightPos=[new THREE.Vector3(),new THREE.Vector3()];
 const paperMat=new THREE.ShaderMaterial({uniforms:{score:{value:texture},p0:{value:lightPos[0]},p1:{value:lightPos[1]},a0:{value:0},a1:{value:0},lightSpread:{value:95},lightGain:{value:1}},vertexShader:`varying vec3 wp;varying vec2 vUv;void main(){vUv=uv;wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,fragmentShader:`uniform sampler2D score;uniform vec3 p0;uniform vec3 p1;uniform float a0;uniform float a1;uniform float lightSpread;uniform float lightGain;varying vec3 wp;varying vec2 vUv;
float hashPaper(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float paperNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashPaper(i),hashPaper(i+vec2(1.,0.)),f.x),mix(hashPaper(i+vec2(0.,1.)),hashPaper(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 vec3 col=texture2D(score,vUv).rgb;
 float p=exp(-dot(wp.xz-p0.xz,wp.xz-p0.xz)/lightSpread)*a0;
 float q=exp(-dot(wp.xz-p1.xz,wp.xz-p1.xz)/lightSpread)*a1;
 // Continuous world-anchored fibers, not per-pixel white noise that crawls.
 float fibers=paperNoise(wp.xz*vec2(5.,1.7))-.5;
 float broad=paperNoise(wp.xz*.16)-.5;
 float ink=dot(col,vec3(.2126,.7152,.0722));
 col*=.48+fibers*.018+broad*.032;
 vec3 reflected=vec3(.050,.025,.085)*p+vec3(.087,.048,.017)*q;
 col+=reflected*lightGain*(.08+.92*ink);
 gl_FragColor=vec4(col,1.);
#include <colorspace_fragment>
}`});
 const paper=new THREE.Mesh(new THREE.PlaneGeometry(data.width,data.height+paperMargin*2),paperMat);paper.rotation.x=-Math.PI/2;paper.position.set(data.width/2,0,data.height/2);scene.add(paper);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(1200,1000),new THREE.MeshBasicMaterial({color:'#302d31',depthTest:false,depthWrite:false}));ground.renderOrder=-10;ground.rotation.x=-Math.PI/2;ground.position.set(data.width/2,-.06,data.height/2);scene.add(ground);
 scene.add(new THREE.HemisphereLight(0xe6dcff,0x66513e,.9));const key=new THREE.DirectionalLight(0xfff3df,1.4);key.position.set(-30,100,90);scene.add(key);
 const butterflyAssets=await loadButterflyAssets();
 const glow=radialTexture(),noteGlows=Object.fromEntries(Object.entries(data.noteheadGlyphs).map(([id,glyph])=>[id,createNoteGlow(glyph)])),allGroups=[groups(data,1),groups(data,2)],voices=[];
 const samplers=Object.fromEntries(variants.map(name=>[name,(gs,time)=>variantAt(gs,time,name)]));
 for(let i=0;i<2;i++){
  const actors={butterfly:createButterfly(colors[i],butterflyAssets,i),orb:createOrb(colors[i],glow)};
  for(const actor of Object.values(actors)){actor.root.visible=false;scene.add(actor.root);}
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:colors[i],transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.set(7,7,1);scene.add(halo);
  const trail=createTrail(colors[i]);scene.add(trail.mesh);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshBasicMaterial({map:glow,color:0x191222,transparent:true,opacity:.45,depthWrite:false,depthTest:false}));shadow.renderOrder=1;shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  voices.push({actors,halo,trail,shadow});
 }
 const rings=data.events.map(e=>{
  const noteGlow=noteGlows[e.glyph];
  const ringColor=new THREE.Color(colors[e.staff-1]).lerp(new THREE.Color('white'),.35);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(e.headWidth*noteGlow.widthRatio,e.headHeight*noteGlow.heightRatio),new THREE.MeshBasicMaterial({map:noteGlow.texture,color:ringColor,transparent:true,blending:THREE.AdditiveBlending,toneMapped:false,depthWrite:false,depthTest:false,side:THREE.DoubleSide}));mesh.renderOrder=2;mesh.rotation.x=-Math.PI/2;mesh.position.set(e.x,.025,e.z);scene.add(mesh);return{mesh,e};
 });
 const vignette=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,vertexShader:`varying vec2 uv2;void main(){uv2=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`varying vec2 uv2;void main(){float r=length((uv2-.5)*vec2(.85,1.));gl_FragColor=vec4(.015,0.,.03,smoothstep(.2,.72,r)*.36);}`}));vignette.frustumCulled=false;vignette.renderOrder=100;scene.add(vignette);
 function render(t){
  currentTime=t;
  const sample=samplers[variant],isOrb=variant==='orb';
  paperMat.uniforms.lightSpread.value=isOrb?125:95;paperMat.uniforms.lightGain.value=isOrb?1.35:1;
  const pose=cameraPose(data,t);camera.position.set(...pose.position);camera.up.set(0,1,0);camera.lookAt(...pose.target);camera.rotateZ(pose.roll);camera.updateMatrixWorld();
  for(let i=0;i<2;i++){
   const p=sample(allGroups[i],t),next=sample(allGroups[i],t+.02),o=voices[i];
   for(const [name,actor]of Object.entries(o.actors)){
    if(name!==variant){actor.root.visible=false;continue;}
    actor.root.position.set(p.x,p.y,p.z);actor.animate(t,p.alpha,clamp((p.x-next.x)*.10,-.30,.30),camera,p);
   }
   o.halo.visible=!isOrb;o.halo.position.set(p.x,p.y+.18,p.z);o.halo.material.opacity=p.alpha*(p.grounded?.18:.07);lightPos[i].set(p.x,0,p.z);paperMat.uniforms['a'+i].value=p.alpha;
   o.trail.update(allGroups[i],t,p.alpha,sample);o.shadow.visible=!isOrb;
   const spread=1+p.y*.16;
   o.shadow.position.set(p.x+p.y*.26,.022,p.z+p.y*.18);
   o.shadow.rotation.z=0;
   o.shadow.material.opacity=p.alpha*.48/(1+p.y*.85);
   o.shadow.scale.set((variant==='butterfly'?.62:1)*spread,(variant==='butterfly'?.62:1)*spread,1);
  }
  for(const {mesh,e}of rings){const age=t-e.time;mesh.visible=age>=0&&age<.85;mesh.material.opacity=age<0?0:Math.exp(-Math.max(0,age-.08)*2.5)*clamp((.85-age)/.15);}
  // 仅筛选原场景的绘制层；原路径、轮廓、材质和节拍保持不变。
  const single=mode==='asset-butterfly'||mode==='asset-orb'||mode==='wings';
  for(let i=0;i<voices.length;i++){
   const o=voices[i],keepVoice=mode==='voices'||mode==='camera'||i===0;
   for(const [name,actor]of Object.entries(o.actors))if(name===variant)actor.root.visible=keepVoice&&actor.root.visible&&mode!=='trail'&&mode!=='glow'&&mode!=='camera';
   o.trail.mesh.visible=keepVoice&&['flight','hop','trail','voices'].includes(mode);
   const body=keepVoice&&!single&&['flight','hop','voices'].includes(mode);
   o.halo.visible=o.halo.visible&&body;o.shadow.visible=o.shadow.visible&&body;
   if(!body)paperMat.uniforms['a'+i].value=0;
   if(single){for(const [name,actor]of Object.entries(o.actors))if(name===variant&&i===0){actor.root.position.set(0,0,0);actor.animate(mode==='wings'?t:1,1,0,camera,{heading:0});actor.root.visible=true;}}
  }
  for(const {mesh}of rings)mesh.visible=mesh.visible&&['flight','hop','glow','voices'].includes(mode);
  if(single){paper.visible=false;ground.visible=false;vignette.visible=false;scene.background=new THREE.Color('#25212b');camera.position.set(0,8,14);camera.lookAt(0,0,0);camera.updateMatrixWorld();}

  renderer.render(scene,camera);
 }
 render(0);
 return{render,setVariant(name){if(!variants.includes(name))throw new Error('未知造型');variant=name;render(currentTime);},get variant(){return variant;},resize(w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){
  const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();glow.dispose();Object.values(noteGlows).forEach(glow=>glow.texture.dispose());renderer.dispose();renderer.forceContextLoss();
 }};
}
