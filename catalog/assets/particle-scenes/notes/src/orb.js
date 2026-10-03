import * as THREE from 'three';

// Reference frames 74 / 128 / 174: a white light nucleus surrounded by a broad
// violet or gold atmosphere. There is no opaque, shaded marble underneath it.
export function createOrb(color,glow){
 const root=new THREE.Group();root.name='luminous-note-orb';
 const material=new THREE.ShaderMaterial({
  uniforms:{tint:{value:new THREE.Color(color)},overallAlpha:{value:0},contact:{value:0}},
  vertexShader:`
   varying vec2 lightPoint;
   void main(){
    lightPoint=uv*2.-1.;
    vec4 center=modelViewMatrix*vec4(0.,.34,0.,1.);
    center.xy+=position.xy;
    gl_Position=projectionMatrix*center;
   }`,
  fragmentShader:`
   uniform vec3 tint;uniform float overallAlpha;uniform float contact;
   varying vec2 lightPoint;
   void main(){
    float r2=dot(lightPoint,lightPoint);
    if(r2>1.)discard;
    float core=exp(-r2*185.);
    float bloom=exp(-r2*30.);
    float mist=exp(-r2*4.8)*(1.-smoothstep(.65,1.,r2));
    vec3 radiance=vec3(1.)*core*1.42+mix(tint,vec3(1.),.34)*bloom*.38+tint*mist*.105;
    radiance*=1.+contact*.14;
    gl_FragColor=vec4(radiance,overallAlpha);
    #include <colorspace_fragment>
   }`,
  transparent:true,depthWrite:false,depthTest:false,
  blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false
 });
 const geometry=new THREE.PlaneGeometry(6.8,6.8),light=new THREE.Mesh(geometry,material);
 light.frustumCulled=false;light.renderOrder=7;root.add(light);
 return{root,animate(t,alpha,bank,camera,state){
  root.visible=alpha>.001;material.uniforms.overallAlpha.value=alpha;
  material.uniforms.contact.value=state?.grounded?1:0;
 },dispose(){geometry.dispose();material.dispose();}};
}
