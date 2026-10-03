import * as THREE from 'three';
import {ballAt} from './motion';

const POINT_COUNT=160,DUST_COUNT=8,TRAIL_NOTE_SPAN=1.6;
const FOOT_OFFSET_Y=.13,STRAND_WIDTH=.22;
const clamp01=value=>Math.min(1,Math.max(0,value));
const smooth=value=>{const v=clamp01(value);return v*v*(3-2*v);};

// Retain one complete preceding interval plus its fading tail. Musical distance,
// rather than a half-second timeout, keeps the strand present on slow notes too.
export function trailSampleTime(gs,t,progress){
 let i=0;while(i<gs.length-2&&gs[i+1].time<=t)i++;
 const firstDuration=gs[1].time-gs[0].time,last=gs.at(-1),lastIndex=gs.length-1;
 const finishDuration=Math.max(.35,...last.notes.map(n=>n.duration))+1.2;
 const head=t>last.time?lastIndex+(t-last.time)/finishDuration:i+(t-gs[i].time)/(gs[i+1].time-gs[i].time);
 const tail=Math.min(head,Math.max(-.4/firstDuration,head-TRAIL_NOTE_SPAN));
 const position=tail+(head-tail)*clamp01(progress);
 if(position<0)return gs[0].time+position*firstDuration;
 if(position>=lastIndex)return last.time+(position-lastIndex)*finishDuration;
 const k=Math.floor(position),fraction=position-k;
 return gs[k].time+(gs[k+1].time-gs[k].time)*fraction;
}
export const trailStartTime=(gs,t)=>trailSampleTime(gs,t,0);

// A single luminous strand follows the actor's exact sampled jump history.
// Its bright center and broad falloff share the same centerline: no separated
// ribbons, blurred pitch coordinates, or shortcut from an old note to the head.
const ribbonVertex=`
attribute vec3 pathTangent;
attribute float ribbonSide;
attribute float ribbonWidth;
attribute float lifeWeight;
varying float edgeCoordinate;
varying float trailWeight;
void main(){
 vec4 viewPosition=modelViewMatrix*vec4(position,1.);
 vec3 direction=mat3(modelViewMatrix)*pathTangent;
 vec2 across=vec2(-direction.y,direction.x);
 float size=length(across);
 across=size>.00001?across/size:vec2(0.,1.);
 viewPosition.xy+=across*ribbonSide*ribbonWidth;
 edgeCoordinate=ribbonSide;trailWeight=lifeWeight;
 gl_Position=projectionMatrix*viewPosition;
}`;
const ribbonFragment=`
uniform vec3 tint;
uniform float overallAlpha;
varying float edgeCoordinate;
varying float trailWeight;
void main(){
 float e2=edgeCoordinate*edgeCoordinate;
 float core=exp(-e2*55.);
 float body=exp(-e2*13.);
 float haze=exp(-e2*3.5)*(1.-smoothstep(.72,1.,abs(edgeCoordinate)));
 vec3 radiance=vec3(1.)*core*.64+mix(tint,vec3(1.),.16)*body*.40+tint*haze*.025;
 float opacity=trailWeight*overallAlpha;
 if(opacity<.001)discard;
 gl_FragColor=vec4(radiance,opacity);
 #include <colorspace_fragment>
}`;

export function createTrail(color){
 const tint=new THREE.Color(color),mesh=new THREE.Group();mesh.name='continuous-luminous-trail';
 const positions=new Float32Array(POINT_COUNT*6),tangents=new Float32Array(POINT_COUNT*6);
 const sides=new Float32Array(POINT_COUNT*2),widths=new Float32Array(POINT_COUNT*2),weights=new Float32Array(POINT_COUNT*2);
 const centers=new Float32Array(POINT_COUNT*3),indices=new Uint16Array((POINT_COUNT-1)*6);
 for(let j=0;j<POINT_COUNT;j++){
  sides[j*2]=-1;sides[j*2+1]=1;
  if(j<POINT_COUNT-1){const a=j*2;indices.set([a,a+1,a+2,a+1,a+3,a+2],j*6);}
 }
 const geometry=new THREE.BufferGeometry();
 for(const [name,array,size]of [['position',positions,3],['pathTangent',tangents,3],['ribbonSide',sides,1],['ribbonWidth',widths,1],['lifeWeight',weights,1]])geometry.setAttribute(name,new THREE.BufferAttribute(array,size).setUsage(THREE.DynamicDrawUsage));
 geometry.setIndex(new THREE.BufferAttribute(indices,1));
 const material=new THREE.ShaderMaterial({
  uniforms:{tint:{value:tint},overallAlpha:{value:0}},
  vertexShader:ribbonVertex,fragmentShader:ribbonFragment,
  transparent:true,depthWrite:false,depthTest:false,
  blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false
 });
 const ribbon=new THREE.Mesh(geometry,material);ribbon.frustumCulled=false;ribbon.renderOrder=3;mesh.add(ribbon);
 const dustPositions=new Float32Array(DUST_COUNT*3),dustSizes=new Float32Array(DUST_COUNT),dustWeights=new Float32Array(DUST_COUNT);
 const dustGeometry=new THREE.BufferGeometry();
 dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3).setUsage(THREE.DynamicDrawUsage));
 dustGeometry.setAttribute('dustSize',new THREE.BufferAttribute(dustSizes,1));
 dustGeometry.setAttribute('dustWeight',new THREE.BufferAttribute(dustWeights,1).setUsage(THREE.DynamicDrawUsage));
 for(let j=0;j<DUST_COUNT;j++)dustSizes[j]=.05+.04*(.5+.5*Math.sin(j*17.37));
 const dustMaterial=new THREE.ShaderMaterial({
  uniforms:{tint:{value:tint},overallAlpha:{value:0},viewportHeight:{value:1440}},
  vertexShader:`attribute float dustSize;attribute float dustWeight;uniform float viewportHeight;varying float sparkleWeight;
   void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(dustSize*viewportHeight*projectionMatrix[1][1]/max(1.,-p.z),1.,12.);sparkleWeight=dustWeight;}`,
  fragmentShader:`uniform vec3 tint;uniform float overallAlpha;varying float sparkleWeight;
   void main(){vec2 p=(gl_PointCoord-.5)*2.;float r2=dot(p,p);if(r2>1.)discard;float glow=exp(-r2*5.8)*(1.-smoothstep(.65,1.,r2));gl_FragColor=vec4(mix(tint,vec3(1.),.65),glow*sparkleWeight*overallAlpha);
   #include <colorspace_fragment>
   }`,
  transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,toneMapped:false
 });
 const dust=new THREE.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;dust.renderOrder=4;mesh.add(dust);
 const drawingSize=new THREE.Vector2();
 dust.onBeforeRender=renderer=>{renderer.getDrawingBufferSize(drawingSize);dustMaterial.uniforms.viewportHeight.value=drawingSize.y;};

 function update(gs,t,alpha,sampler=ballAt){
  const sceneAlpha=clamp01(alpha);mesh.visible=sceneAlpha>.001;
  material.uniforms.overallAlpha.value=sceneAlpha;dustMaterial.uniforms.overallAlpha.value=sceneAlpha;
  for(let j=0;j<POINT_COUNT;j++){
   const progress=j/(POINT_COUNT-1);
   const p=sampler(gs,trailSampleTime(gs,t,progress)),offset=j*3;
   centers[offset]=p.x;centers[offset+1]=p.y+FOOT_OFFSET_Y;centers[offset+2]=p.z;
   const taper=smooth(progress/.18),width=STRAND_WIDTH*(.42+.58*Math.sqrt(progress));
   const weight=taper*(.72+.28*Math.sqrt(progress))*p.alpha;
   widths[j*2]=widths[j*2+1]=width;weights[j*2]=weights[j*2+1]=weight;
  }
  for(let j=0;j<POINT_COUNT;j++){
   const source=j*3;let before=Math.max(0,j-1),after=Math.min(POINT_COUNT-1,j+1);
   // Landing holds produce duplicate samples. Find the nearest actual motion
   // on either side so the wide strand cannot twist into an arbitrary spike.
   const distance=k=>Math.hypot(centers[k*3]-centers[source],centers[k*3+1]-centers[source+1],centers[k*3+2]-centers[source+2]);
   while(before>0&&distance(before)<1e-6)before--;
   while(after<POINT_COUNT-1&&distance(after)<1e-6)after++;
   let tx=centers[after*3]-centers[before*3],ty=centers[after*3+1]-centers[before*3+1],tz=centers[after*3+2]-centers[before*3+2];
   if(tx*tx+ty*ty+tz*tz<1e-12){tx=1;ty=0;tz=0;}
   for(let side=0;side<2;side++){
    const target=(j*2+side)*3;
    positions.set(centers.subarray(source,source+3),target);tangents.set([tx,ty,tz],target);
   }
  }
  for(const name of ['position','pathTangent','ribbonWidth','lifeWeight'])geometry.attributes[name].needsUpdate=true;
  for(let j=0;j<DUST_COUNT;j++){
   const seed=j/DUST_COUNT,cycle=t*1.8+seed,age=((cycle%1)+1)%1;
   const p=sampler(gs,trailSampleTime(gs,t,1-age*.92)),angle=j*2.399963+Math.floor(cycle)*.731,offset=j*3;
   dustPositions[offset]=p.x;dustPositions[offset+1]=p.y+FOOT_OFFSET_Y+age*.16;
   dustPositions[offset+2]=p.z+Math.cos(angle)*age*.12;
   dustWeights[j]=smooth(age/.12)*Math.pow(1-age,1.9)*p.alpha*.30;
  }
  dustGeometry.attributes.position.needsUpdate=true;dustGeometry.attributes.dustWeight.needsUpdate=true;
 }
 return{mesh,update,dispose(){geometry.dispose();material.dispose();dustGeometry.dispose();dustMaterial.dispose();}};
}
