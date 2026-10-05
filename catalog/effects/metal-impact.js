/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(global){
'use strict';
const W=1066,H=600,DURATION=5.3;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ease=(a,b,x)=>{const q=clamp((x-a)/(b-a));return q*q*(3-2*q);};
const sources={
vertex: `attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`,
fragment: `precision highp float;
varying vec2 uv;uniform vec2 resolution;uniform float time;uniform float phase;
float sat(float x){return clamp(x,0.,1.);}
float e(float a,float b,float x){float q=sat((x-a)/(b-a));return q*q*(3.-2.*q);}
float sm(float a,float b,float k){float h=sat(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1.-h);}
vec2 un(vec2 a,vec2 b,float k){float h=sat(.5+.5*(b.x-a.x)/k);return vec2(mix(b.x,a.x,h)-k*h*(1.-h),mix(b.y,a.y,h));}

  // Inflated strokes and through-holes are geometry, including in the reflection.
  float softEll(vec3 p,vec3 r){
    float k0=length(p/r),k1=length(p/(r*r));
    if(k0<.00001)return -min(r.x,min(r.y,r.z));
    return k0*(k0-1.)/max(k1,.00001);
  }
  float stroke(vec3 p,vec2 a,vec2 b,float r){
    vec2 v=b-a;float h=clamp(dot(p.xy-a,v)/dot(v,v),0.,1.);
    return length(vec3(p.xy-a-v*h,p.z*.63))-r;
  }
  float glyph(vec3 q,int letter){
    // A true circular tube: the outside and the opening share one round contour.
    if(letter==1||letter==4)return length(vec2(length(q.xy)-.425,q.z*.65))-.130;
    if(letter==3)return stroke(q,vec2(0.,-.425),vec2(0.,.425),.132);
    if(letter==2){
      float top=stroke(q,vec2(-.275,.425),vec2(.275,.425),.125);
      float stem=stroke(q,vec2(0.,-.425),vec2(0.,.425),.125);
      return sm(top,stem,.045);
    }
    float halfWidth=letter==0?.315:.265;
    float d=stroke(q,vec2(-halfWidth,-.425),vec2(-halfWidth,.425),.125);
    d=sm(d,stroke(q,vec2(halfWidth,-.425),vec2(halfWidth,.425),.125),.025);
    if(letter==0){
      d=sm(d,stroke(q,vec2(-halfWidth,.425),vec2(0.,-.055),.118),.030);
      return sm(d,stroke(q,vec2(0.,-.055),vec2(halfWidth,.425),.118),.030);
    }
    return sm(d,stroke(q,vec2(-halfWidth,.425),vec2(halfWidth,-.425),.122),.030);
  }
  float letterX(int i){
    if(i==0)return -2.34;if(i==1)return -1.22;if(i==2)return -.16;
    if(i==3)return .50;if(i==4)return 1.31;return 2.385;
  }
  // One parent sphere fractures into six equal-volume spheres at the same contact point.
  // The catalogue's impact-to-rebound relationship drives the vertical movement.
  const float BALL_RADIUS=.305;
  const float PARENT_RADIUS=.55422178; // BALL_RADIUS * cube-root(6)
  const float GRAVITY=62.03703704;
  const float IMPACT=1.30;
  const float RELEASE=1.35;
  const float SETTLED=2.74;
  const float DROP_HEIGHT=4.02;
  // Position, speed and acceleration meet at rest at both ends of each motion.
  float motionEase(float q){q=sat(q);return clamp(q*q*q*(q*(q*6.-15.)+10.),0.,1.);}
  float contactAt(){return sqrt(2.*DROP_HEIGHT/GRAVITY);}
  float splitAmount(){return e(contactAt(),contactAt()+.075,phase);}
  float reboundSpeed(){return sqrt(2.*GRAVITY*(.33-(-1.25+PARENT_RADIUS)));}
  float contactScale(){return 1.-.020*exp(-pow((phase-contactAt())/.018,2.));}
  vec3 parentCenter(){
    float fall=min(phase,contactAt()),ground=-1.25+PARENT_RADIUS;
    float y=ground+DROP_HEIGHT-.5*GRAVITY*fall*fall;
    if(phase>=contactAt()){
      float speed=reboundSpeed(),age=min(phase-contactAt(),speed/GRAVITY);
      y=ground+speed*age-.5*GRAVITY*age*age;
    }
    return vec3(0.,y-PARENT_RADIUS*(1.-contactScale()),0.);
  }
  // Six fixed, asymmetric launch directions: the same take remains seek-safe.
  vec3 launchSpread(int i){
    if(i==0)return vec3(-4.60,.35,.90);
    if(i==1)return vec3(-3.00,1.80,-1.15);
    if(i==2)return vec3(-1.00,2.35,.70);
    if(i==3)return vec3(.80,.85,-1.35);
    if(i==4)return vec3(3.10,.30,1.10);
    return vec3(4.45,1.40,-.60);
  }
  vec3 impactCenter(){return vec3(0.,.33,0.);}
  vec3 flightCenter(int i){
    if(phase>=IMPACT)return impactCenter();
    float age=max(0.,phase-contactAt()),apexTime=reboundSpeed()/GRAVITY;
    float outward=motionEase(age/(apexTime*.68));
    float spread=motionEase((age-.05)/.13);
    float separation=(float(i)-2.5)*.91;
    vec3 launch=launchSpread(i),center=parentCenter();
    center.x=separation*outward+(launch.x-separation)*spread;
    center.y+=launch.y*spread;
    center.z=launch.z*spread;
    // One continuous, curved return from each scattered position to the centre.
    // No shared line, intermediate stop or second horizontal charge.
    float q=sat((phase-.54)/(IMPACT-.54)),tail=1.-q;
    float arc=64.*q*q*q*tail*tail*tail;
    vec3 bend=vec3(sign(launch.x)*launch.y*.08,abs(launch.x)*.06,-launch.z*.10);
    return mix(center,impactCenter(),motionEase(q))+bend*arc;
  }
  float coreMaterial(vec3 p){return clamp(p.x/BALL_RADIUS,-1.,1.)*1.5;}
  vec3 metalBallCenter(int i){return flightCenter(i);}

  vec2 metalBallsMap(vec3 p){
    if(phase>=IMPACT)return vec2(length(p-impactCenter())-BALL_RADIUS,coreMaterial(p));
    float split=splitAmount();
    float vertical=contactScale(),radial=inversesqrt(vertical);
    vec3 axes=vec3(radial,vertical,radial);
    vec2 parent=vec2(softEll(p-parentCenter(),PARENT_RADIUS*axes),-1.5);
    if(split<=0.)return parent;
    vec2 beads=vec2(20.,0.);
    for(int i=0;i<6;i++){
      float material=mix(float(i)*.6-1.5,coreMaterial(p),motionEase((phase-(IMPACT-.04))/.04));
      vec2 bead=vec2(softEll(p-metalBallCenter(i),BALL_RADIUS*axes),material);
      if(bead.x<beads.x)beads=bead;
    }
    return split<1.?mix(parent,beads,split):beads;
  }
  vec2 wordmark(vec3 p){
    vec3 q=p-vec3(0.,.52,0.);
    vec2 letters=vec2(20.,0.);
    for(int i=0;i<6;i++)
      letters=un(letters,vec2(glyph(q-vec3(letterX(i),0.,0.),i),float(i)*.6-1.5),.015);
    return letters;
  }
  vec2 map(vec3 p){
    if(phase<=RELEASE)return metalBallsMap(p);
    if(phase>=SETTLED)return wordmark(p);
    vec2 result=vec2(20.,0.);
    // Only the compact impact core remains while particles scatter from this same centre.
    float remain=1.-motionEase((phase-RELEASE)/.095);
    if(remain>.001)result=vec2(length(p-impactCenter())-BALL_RADIUS*remain,coreMaterial(p));
    // Grow solid metal while incoming particles are absorbed, before they form a dotted word.
    float fuse=motionEase((phase-2.26)/.48);
    if(fuse>0.){
      vec2 letters=wordmark(p);letters.x+=.14*(1.-fuse);
      if(letters.x<result.x)result=letters;
    }
    return result;
  }

  vec3 normal(vec3 p){
    vec2 h=vec2(.0012,0.);
    return normalize(vec3(map(p+h.xyy).x-map(p-h.xyy).x,map(p+h.yxy).x-map(p-h.yxy).x,map(p+h.yyx).x-map(p-h.yyx).x));
  }
  vec3 metalColor(float material){
    float k=clamp((material+1.5)/.6,0.,5.);
    // Rich coloured plating: the coating carries the hue, reflection cards carry the brightness.
    vec3 a=vec3(1.,.58,.035),b=vec3(1.,.22,.045),c=vec3(1.,.045,.39);
    vec3 d=vec3(.50,.055,1.),f=vec3(.025,.36,1.),g=vec3(.025,.96,.40);
    if(k<1.)return mix(a,b,k);if(k<2.)return mix(b,c,k-1.);
    if(k<3.)return mix(c,d,k-2.);if(k<4.)return mix(d,f,k-3.);return mix(f,g,k-4.);
  }
  vec3 floorColor(vec3 p){
    vec3 base=mix(vec3(.025,.030,.040),vec3(.060,.064,.072),e(-4.,7.,p.z));
    float wide=1.3+4.8*e(RELEASE,SETTLED,phase);
    float bodyShadow=exp(-p.x*p.x/wide-(p.z-.1)*(p.z-.1)*.72);
    vec3 mergedFloor=base*(1.-.32*bodyShadow);
    if(phase<SETTLED){
      vec3 parent=parentCenter();
      float altitude=max(0.,parent.y+1.25-PARENT_RADIUS);
      float width=.33+.11*altitude;
      vec2 delta=p.xz-parent.xz;
      float parentShadow=exp(-dot(delta,delta)/(width*width))/(1.+altitude*1.4);
      float fragments=0.,split=splitAmount();
      if(split>0.){
        for(int i=0;i<6;i++){
          vec3 center=metalBallCenter(i);
          float height=max(0.,center.y+1.25-BALL_RADIUS),spread=.21+.11*height;
          vec2 offset=p.xz-center.xz;
          fragments+=exp(-dot(offset,offset)/(spread*spread))/(1.+height*1.4);
        }
      }
      base*=1.-.55*mix(parentShadow,sat(fragments),split);
      // One contact flash belongs to the original impact, before the six pieces leave the floor.
      float pulse=exp(-pow((phase-contactAt())/.032,2.));
      base+=vec3(.24,.26,.30)*pulse*exp(-dot(p.xz,p.xz)/.085);
      return mix(base,mergedFloor,e(RELEASE,SETTLED,phase));
    }
    return mergedFloor;
  }
  vec3 room(vec3 ro,vec3 rd){
    float backT=rd.z<-.0001?(-5.-ro.z)/rd.z:1000.;
    float floorT=rd.y<-.0001?(-1.25-ro.y)/rd.y:1000.;
    if(floorT>0.&&floorT<backT)return floorColor(ro+rd*floorT);
    vec3 p=ro+rd*min(max(backT,0.),40.);
    float cool=exp(-pow((p.x-2.)*.25,2.)-pow((p.y-.4)*.36,2.));
    float warm=exp(-pow((p.x+3.8)*.30,2.)-pow((p.y-.8)*.40,2.));
    return vec3(.022,.026,.037)+vec3(.022,.036,.060)*cool+vec3(.050,.030,.021)*warm;
  }
  // Dark flags between large light cards produce the characteristic bright/dark metal bands.
  vec3 metalEnvironment(vec3 r,vec3 p){
    float sweep=e(3.18,4.36,phase);
    float keyX=mix(-.52,.20,sweep);
    float key=(1.-e(.22,.27,abs(r.x-keyX)))*(1.-e(.28,.33,abs(r.y-.51)));
    float strip=(1.-e(.065,.095,abs(r.x-.70)))*e(-.35,.02,r.y);
    float cardY=-.17+.052*sin(r.x*4.8+p.x*.12);
    float card=1.-e(.055,.105,abs(r.y-cardY));
    float blackFlag=exp(-pow((r.y-.095)/.085,2.));
    float top=exp(-pow((r.y-.91)/.145,2.));
    float edge=(1.-e(.085,.120,abs(r.x+.82)))*e(-.38,.14,r.y);
    vec3 env=mix(vec3(.065,.072,.085),vec3(.48,.50,.55),e(-.6,.9,r.y));
    env*=1.-.90*blackFlag;
    // Bright neutral studio cards, separated by dark flags, read as polished electroplate.
    env+=vec3(4.8,4.65,4.45)*key+vec3(3.2,3.35,3.6)*strip;
    env+=vec3(2.35,2.45,2.65)*card+vec3(1.15,1.22,1.35)*top+vec3(2.25,2.02,1.75)*edge;
    return env;
  }
  vec2 sceneInterval(vec3 ro,vec3 rd){
    vec3 extent=phase<SETTLED?vec3(5.2,2.65,2.8):vec3(2.95,1.59,.95);
    vec3 center=phase<SETTLED?vec3(0.,1.30,0.):vec3(0.,.27,0.);
    vec3 direction=vec3(rd.x<0.?-1.:1.,rd.y<0.?-1.:1.,rd.z<0.?-1.:1.)*max(abs(rd),vec3(.000001));
    vec3 a=(center-extent-ro)/direction,b=(center+extent-ro)/direction;
    vec3 nearPoint=min(a,b),farPoint=max(a,b);
    return vec2(max(0.,max(nearPoint.x,max(nearPoint.y,nearPoint.z))),
      min(20.,min(farPoint.x,min(farPoint.y,farPoint.z))));
  }
  float surfaceHit(vec3 ro,vec3 rd){
    vec2 interval=sceneInterval(ro,rd);
    if(interval.y<interval.x)return -1.;
    float travel=interval.x,previous=travel;
    for(int i=0;i<1024;i++){
      float distance=map(ro+rd*travel).x;
      if(distance<.00004){
        if(distance<0.){
          float lo=previous,hi=travel;
          for(int j=0;j<8;j++){float middle=(lo+hi)*.5;if(map(ro+rd*middle).x<0.)hi=middle;else lo=middle;}
          return (lo+hi)*.5;
        }
        return travel;
      }
      previous=travel;travel+=max(.000025,distance*.75);
      if(travel>interval.y)return -1.;
    }
    return -1.;
  }
  vec4 metalTrace(vec3 ro,vec3 rd,out float depth){
    depth=surfaceHit(ro,rd);if(depth<0.)return vec4(0.);
    vec3 p=ro+rd*depth,n=normal(p),tint=metalColor(map(p).y);
    float facing=max(dot(n,-rd),0.);
    // Grazing reflections retain the coating hue instead of drawing a neutral-white outline.
    vec3 conductor=tint+(vec3(1.)-tint)*(.10*pow(1.-facing,5.));
    vec3 r=reflect(rd,n);
    // Tight symmetric reflections keep the plated surface crisp without noisy single rays.
    float roughness=.018+.012*pow(1.-facing,2.);
    vec3 dx=vec3(roughness,0.,0.),dy=dx.yxy,dz=dx.yyx;
    vec3 reflection=metalEnvironment(r,p)*.40;
    reflection+=metalEnvironment(normalize(r+dx),p)*.10;
    reflection+=metalEnvironment(normalize(r-dx),p)*.10;
    reflection+=metalEnvironment(normalize(r+dy),p)*.10;
    reflection+=metalEnvironment(normalize(r-dy),p)*.10;
    reflection+=metalEnvironment(normalize(r+dz),p)*.10;
    reflection+=metalEnvironment(normalize(r-dz),p)*.10;
    vec3 shade=reflection*conductor+tint*.055;
    // A thin neutral glint sits on the strongest lamp reflection, not across the whole coating.
    float faceGlint=e(.12,.42,facing);
    float lampGlint=e(3.6,5.4,max(reflection.r,max(reflection.g,reflection.b)))*faceGlint;
    shade+=vec3(.72,.75,.80)*lampGlint;
    vec3 light=normalize(vec3(-3.,5.,4.));
    float spec=pow(max(dot(reflect(-light,n),-rd),0.),48.);
    shade+=conductor*spec*.065;
    float sweep=e(3.10,4.36,phase),beamX=mix(-3.15,3.15,sweep);
    float beamCoordinate=p.x+.24*(p.y-.52)-beamX;
    float beam=exp(-pow(beamCoordinate/.15,2.));
    float beamCore=exp(-pow(beamCoordinate/.042,2.));
    float halo=exp(-pow(beamCoordinate/.43,2.));
    float shine=sin(sweep*3.14159265)*(.28+.72*facing);
    shade+=conductor*(beam*1.20+halo*.18)*shine;
    shade+=vec3(1.30,1.38,1.48)*beamCore*.72*shine*faceGlint;
    // A continuous highlight shoulder avoids flat, clipped-white slivers at the metal rim.
    shade=vec3(1.)-exp(-max(shade,0.)*1.12);
    return vec4(shade,1.);
  }
  void main(){
    vec2 q=(gl_FragCoord.xy/resolution-.5)*vec2(7.1,4.);
    float framing=e(.395,.56,phase),wide=mix(1.50,1.,framing);
    q*=wide;
    // Hold the camera steady once the six pieces are airborne: world y=.33 is screen centre.
    float camera=mix(2.62,1.45,framing),cameraZ=mix(10.,7.,framing);
    float impactAge=max(0.,phase-IMPACT),hit=motionEase(impactAge/.025);
    float kick=.040*sin(impactAge*40.)*exp(-impactAge*18.)*hit;
    q.y+=kick;
    vec3 ro=vec3(q.x*framing,camera+q.y*framing,cameraZ);
    vec3 rd=normalize(vec3(q.x*(1.-framing),q.y*(1.-framing)-.16*cameraZ,-cameraZ));
    float floorT=(-1.25-ro.y)/rd.y,objectT;
    vec4 object=metalTrace(ro,rd,objectT);
    vec3 result=room(ro,rd);
    float openingFocus=1.-e(.47,.58,phase),focusZ=-.55*(1.-sat(phase/.36));
    float blur=openingFocus;
    if(object.a>0.&&(floorT<0.||objectT<floorT)){
      result=object.rgb;
      float z=(ro+rd*objectT).z;
      blur=sat((abs(z-focusZ)-.46)/2.1)*openingFocus;
    }
    else if(floorT>0.){
      vec3 floorPoint=ro+rd*floorT;float reflectionDepth;
      vec4 reflection=metalTrace(floorPoint+vec3(0.,.012,0.),reflect(rd,vec3(0.,1.,0.)),reflectionDepth);
      float fade=exp(-length(floorPoint.xz)*.19);
      result=mix(result,reflection.rgb,.26*reflection.a*fade);
      blur=sat((abs(floorPoint.z-focusZ)-.80)/3.0)*openingFocus;
    }
    float vignette=1.-.13*dot(uv-.5,uv-.5);
    // Alpha carries a circle-of-confusion amount to the final depth-aware smoothing pass.
    gl_FragColor=vec4(pow(clamp(result*vignette,0.,1.),vec3(.92)),blur);
  }
  `,
post: `precision highp float;
  varying vec2 uv;uniform sampler2D scene;uniform vec2 sourceResolution;
  void main(){
    vec2 pixel=1./sourceResolution;
    vec4 center=texture2D(scene,uv);
    // Exact 2:1 reduction averages four independently traced surface samples per display pixel.
    // Unlike contrast-only smoothing, this also integrates the bright metal rim and hole contours.
    // A positive tent filter spans one source pixel; no sharpening or bright ringing.
    vec3 smoothColor=center.rgb*.50;
    smoothColor+=texture2D(scene,uv+vec2(pixel.x,0.)).rgb*.125;
    smoothColor+=texture2D(scene,uv-vec2(pixel.x,0.)).rgb*.125;
    smoothColor+=texture2D(scene,uv+vec2(0.,pixel.y)).rgb*.125;
    smoothColor+=texture2D(scene,uv-vec2(0.,pixel.y)).rgb*.125;
    // Opening-only depth blur: keep the focused falling drop and final letter edges crisp.
    if(center.a>.02){
      float radius=center.a*9.,weight=2.;vec3 total=smoothColor*2.;
      for(int i=0;i<12;i++){
        float angle=float(i)*.52359878;
        vec2 offset=vec2(cos(angle),sin(angle))*radius*pixel;
        vec4 sampleColor=texture2D(scene,uv+offset);
        float sampleWeight=.08+.92*smoothstep(center.a-.32,center.a+.08,sampleColor.a);
        total+=sampleColor.rgb*sampleWeight;weight+=sampleWeight;
      }
      smoothColor=mix(smoothColor,total/weight,smoothstep(.02,.28,center.a));
    }
    gl_FragColor=vec4(smoothColor,1.);
  }
  `
};

// Fixed samples inherit a metal colour and land inside the same analytic letter geometry.
const particleSmooth=q=>{q=clamp(q);return q*q*q*(q*(q*6-15)+10);};
const particleHash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const letterCenters=[-2.34,-1.22,-.16,.50,1.31,2.385];
function glyphDistance(x,y,z,letter){
 const smooth=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k);return b+(a-b)*h-k*h*(1-h);};
 const stroke=(ax,ay,bx,by,r)=>{const vx=bx-ax,vy=by-ay,h=clamp(((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy));return Math.hypot(x-ax-vx*h,y-ay-vy*h,z*.63)-r;};
 if(letter===1||letter===4)return Math.hypot(Math.hypot(x,y)-.425,z*.65)-.130;
 if(letter===3)return stroke(0,-.425,0,.425,.132);
 if(letter===2)return smooth(stroke(-.275,.425,.275,.425,.125),stroke(0,-.425,0,.425,.125),.045);
 const w=letter===0?.315:.265;
 let d=smooth(stroke(-w,-.425,-w,.425,.125),stroke(w,-.425,w,.425,.125),.025);
 if(letter===0){d=smooth(d,stroke(-w,.425,0,-.055,.118),.030);return smooth(d,stroke(0,-.055,w,.425,.118),.030);}
 return smooth(d,stroke(-w,.425,w,-.425,.122),.030);
}
const metalParticles=(()=>{
 const list=[];
 for(let letter=0;letter<6;letter++)for(let yi=0;yi<=18;yi++)for(let xi=0;xi<=18;xi++){
  const seed=letter*1000+yi*19+xi+1;
  const x=(xi-9)*.06+(particleHash(seed)-.5)*.012,y=(yi-9)*.06+(particleHash(seed+9)-.5)*.012;
  if(glyphDistance(x,y,0,letter)>-.022)continue;
  let lo=0,hi=.26;for(let k=0;k<18;k++){const z=(lo+hi)/2;if(glyphDistance(x,y,z,letter)>0)hi=z;else lo=z;}
  const a=particleHash(seed+17)*Math.PI*2,b=particleHash(seed+27)*1.5-.75,r=.22+.06*particleHash(seed+31);
  const start=[Math.cos(a)*Math.sqrt(1-b*b)*r,.33+Math.sin(a)*Math.sqrt(1-b*b)*r,Math.abs(b)*r];
  // All six colours scatter radially from one impact core, with no left/right rebound groups.
  const reach=particleHash(seed+113)<.24?1.1+1.2*particleHash(seed+127):5.0+3.5*particleHash(seed+127);
  const burst=[start[0]+Math.cos(a)*reach,start[1]+Math.sin(a)*reach*.80,start[2]+(particleHash(seed+73)-.5)*1.8];
  list.push({letter,start,burst,target:[letterCenters[letter]+x,.52+y,lo-.019],radius:.024+.012*particleHash(seed+81),delay:.120*particleHash(seed+93),bend:(particleHash(seed+101)-.5)*.55});
 }
 return Object.freeze(list.map(p=>Object.freeze(p)));
})();
function particleFrame(time,part){
 if(part==='drop'||part==='sweep'||time<=1.35||time>=2.74)return new Float32Array(0);
 const burst=particleSmooth((time-1.35)/.35),appear=particleSmooth((time-1.35)/.028);
 const frame=metalParticles.map(p=>{
  const gather=particleSmooth((time-1.70-p.delay)/.98),arc=gather>0&&gather<1?Math.sin(Math.PI*gather):0;
  // Each arriving bead is absorbed before reaching rest; there is no complete particle-word hold.
  const absorb=ease(.86,.985,gather),shrink=1-.90*absorb;
  const pos=p.start.map((v,k)=>(v+(p.burst[k]-v)*burst)*(1-gather)+p.target[k]*gather);
  pos[1]+=.28*arc;pos[2]+=p.bend*arc;
  return [...pos,p.radius*(1+.65*burst*(1-gather))*shrink,p.letter*.6-1.5,appear*(1-absorb)];
 });
 frame.sort((a,b)=>a[2]-b[2]);return new Float32Array(frame.flat());
}
const particleVertex=`attribute vec4 aParticle;attribute vec2 aStyle;
uniform vec2 resolution;uniform float phase;
varying vec3 pointWorld;varying float pointMaterial;varying float pointAlpha;
float ease5(float q){q=clamp(q,0.,1.);return q*q*q*(q*(q*6.-15.)+10.);}
void main(){float age=max(0.,phase-1.30),kick=.040*sin(age*40.)*exp(-age*18.)*ease5(age/.025);
vec2 screen=vec2(aParticle.x/3.55,(aParticle.y-.33-.16*aParticle.z-kick)/2.);
gl_Position=vec4(screen,0.,1.);gl_PointSize=max(1.,aParticle.w*resolution.y*.5);
pointWorld=aParticle.xyz;pointMaterial=aStyle.x;pointAlpha=aStyle.y;}`;
const particleFragment=`precision highp float;uniform float phase;
varying vec3 pointWorld;varying float pointMaterial;varying float pointAlpha;
float sat(float x){return clamp(x,0.,1.);}float e(float a,float b,float x){float q=sat((x-a)/(b-a));return q*q*(3.-2.*q);}
`+sources.fragment.slice(sources.fragment.indexOf('  vec3 metalColor('),sources.fragment.indexOf('  vec3 floorColor('))+
 sources.fragment.slice(sources.fragment.indexOf('  vec3 metalEnvironment('),sources.fragment.indexOf('  vec2 sceneInterval('))+`
void main(){vec2 disc=vec2(gl_PointCoord.x,1.-gl_PointCoord.y)*2.-1.;float rr=dot(disc,disc);if(rr>=1.)discard;
vec3 n=normalize(vec3(disc.x,disc.y*.987+sqrt(1.-rr)*.158,-disc.y*.158+sqrt(1.-rr)*.987));
vec3 rd=normalize(vec3(0.,-.16,-1.)),p=pointWorld,tint=metalColor(pointMaterial);
`+sources.fragment.slice(sources.fragment.indexOf('    float facing='),sources.fragment.indexOf('    return vec4(shade,1.);'))+`
vec3 color=pow(shade,vec3(.92));float coverage=1.-smoothstep(.78,1.,rr);
gl_FragColor=vec4(color,pointAlpha*coverage);}`;

// Each mode draws its own geometry; the complete composition shares the same functions.
function fragmentFor(part){
 let source=sources.fragment.replace('uniform float phase;','uniform float phase;uniform float showBody;uniform float showSweep;');
 source=source.replace('  vec2 map(vec3 p){','  vec2 map(vec3 p){\n    if(showBody<.5)return vec2(20.,0.);'+(part==='drop'?'\n    return metalBallsMap(p);':part==='sweep'?'\n    return wordmark(p);':''));
 source=source.replace('    float wide=1.3','    if(showBody<.5)return base;\n    float wide=1.3');
 source=source.replace('float sweep=e(3.18,4.36,phase);','float sweep=e(3.18,4.36,phase)*showSweep;');
 source=source.replace('float sweep=e(3.10,4.36,phase),','float sweep=e(3.10,4.36,phase)*showSweep,');
 return source;
}
function phaseAt(ms,part){
 const seconds=Math.max(0,ms)/1000;
 if(part==='drop')return Math.min(.54,seconds);
 if(part==='collision')return Math.min(3.02,.54+seconds);
 if(part==='sweep')return Math.min(DURATION,3.10+seconds);
 return Math.min(DURATION,seconds);
}
function createPainter(canvas,part,poster){
 const document=canvas.ownerDocument,c=canvas.getContext('2d'),surface=document.createElement('canvas');
 surface.width=canvas.width;surface.height=canvas.height;
 const renderWidth=canvas.width*2,renderHeight=canvas.height*2;
 const gl=surface.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl)return null;
 let program,postProgram,particleProgram,particleBuffer,buffer,colorTexture,framebuffer,uniforms,dead=false;
 const fragment=fragmentFor(part),postSource=sources.post;
  function shader(type, source) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(sh); gl.deleteShader(sh); throw Error(message);
    }
    return sh;
  }
  function initGL() {
    if (!gl) throw Error('浏览器需要支持 WebGL');
    let vs, fs, postFs;
    function link(target, fragmentShader) {
      gl.attachShader(target, vs); gl.attachShader(target, fragmentShader);
      gl.bindAttribLocation(target, 0, 'a'); gl.linkProgram(target);
      if (!gl.getProgramParameter(target, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(target));
    }
    try {
      vs = shader(gl.VERTEX_SHADER, sources.vertex); fs = shader(gl.FRAGMENT_SHADER, fragment);
      postFs = shader(gl.FRAGMENT_SHADER, postSource);
      program = gl.createProgram(); link(program, fs);
      postProgram = gl.createProgram(); link(postProgram, postFs);
    } finally {
      if (vs) gl.deleteShader(vs); if (fs) gl.deleteShader(fs);
      if (postFs) gl.deleteShader(postFs);
    }
    if(part!=='drop'&&part!=='sweep'){
      let pvs,pfs;
      try{pvs=shader(gl.VERTEX_SHADER,particleVertex);pfs=shader(gl.FRAGMENT_SHADER,particleFragment);
        particleProgram=gl.createProgram();gl.attachShader(particleProgram,pvs);gl.attachShader(particleProgram,pfs);
        gl.bindAttribLocation(particleProgram,0,'aParticle');gl.bindAttribLocation(particleProgram,1,'aStyle');gl.linkProgram(particleProgram);
        if(!gl.getProgramParameter(particleProgram,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(particleProgram));
        particleBuffer=gl.createBuffer();
      }finally{if(pvs)gl.deleteShader(pvs);if(pfs)gl.deleteShader(pfs);}
    }
    gl.useProgram(program); buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    uniforms = { time: gl.getUniformLocation(program, 'time'), phase: gl.getUniformLocation(program, 'phase') };
    gl.uniform2f(gl.getUniformLocation(program, 'resolution'), renderWidth, renderHeight);
    colorTexture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, renderWidth, renderHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    framebuffer = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw Error('高精度画面缓冲不可用');
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(postProgram); gl.uniform1i(gl.getUniformLocation(postProgram, 'scene'), 0);
    gl.uniform2f(gl.getUniformLocation(postProgram, 'sourceResolution'), renderWidth, renderHeight);
  }

 function trackedText(text,y,size,tracking,color){
  c.font=`700 ${size}px Oswald`;c.textAlign='left';c.fillStyle=color;
  const chars=[...text],widths=chars.map(ch=>c.measureText(ch).width);
  let x=(W-widths.reduce((a,b)=>a+b,0)-(chars.length-1)*tracking)/2;
  chars.forEach((ch,i)=>{c.fillText(ch,x,y);x+=widths[i]+tracking;});
 }
 function render(time,channels={}){
  if(dead)return;
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.disableVertexAttribArray(1);
  gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,renderWidth,renderHeight);gl.useProgram(program);
  gl.uniform1f(uniforms.time,0);gl.uniform1f(uniforms.phase,time);
  gl.uniform1f(gl.getUniformLocation(program,'showBody'),channels.body===false?0:1);
  gl.uniform1f(gl.getUniformLocation(program,'showSweep'),channels.sweep===false?0:1);
  gl.drawArrays(gl.TRIANGLES,0,6);
  const particles=channels.body===false?null:particleFrame(time,part);
  if(particleProgram&&particles?.length){
    gl.useProgram(particleProgram);gl.uniform2f(gl.getUniformLocation(particleProgram,'resolution'),renderWidth,renderHeight);gl.uniform1f(gl.getUniformLocation(particleProgram,'phase'),time);
    gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);gl.bufferData(gl.ARRAY_BUFFER,particles,gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,24,16);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);gl.drawArrays(gl.POINTS,0,particles.length/6);gl.disable(gl.BLEND);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.disableVertexAttribArray(1);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,surface.width,surface.height);gl.useProgram(postProgram);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,colorTexture);gl.drawArrays(gl.TRIANGLES,0,6);
  c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.globalAlpha=1;c.filter='none';c.drawImage(surface,0,0,W,H);
  const label=channels.caption===false||part?0:ease(3.02,3.22,time);
  if(label>0){c.save();c.globalAlpha=label;trackedText('WISE MOTION',530,23,4,'#ece9ef');trackedText('MAKE IDEAS MOVE',556,12,3,'#aaa7b5');c.restore();}
 }
 function destroy(){
  if(dead)return;dead=true;
  if(!gl.isContextLost()){
   if(particleBuffer)gl.deleteBuffer(particleBuffer);if(particleProgram)gl.deleteProgram(particleProgram);
   if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(postProgram)gl.deleteProgram(postProgram);
   if(colorTexture)gl.deleteTexture(colorTexture);if(framebuffer)gl.deleteFramebuffer(framebuffer);
  }
  gl.getExtension('WEBGL_lose_context')?.loseContext();surface.width=surface.height=1;
 }
 try{initGL();}catch(error){destroy();throw error;}
 return {render,destroy,surface};
}
const parts=[{id:'metal-drop-split',key:'drop'},{id:'horizontal-metal-type',key:'collision'},{id:'polished-metal-sweep',key:'sweep'}];
function make(root,K,definition,part){
 const doc=root.ownerDocument,canvas=doc.createElement('canvas');
 canvas.width=definition.poster_only?640:W;canvas.height=definition.poster_only?360:H;
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'640px',height:'360px'});
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label',definition.name||'金属弹开汇聚成字');
 root.dataset.art='original';root.style.background='#090a10';root.replaceChildren(canvas);
 const markers=new Map();
 if(!part)for(const key of ['body','sweep','caption']){const node=doc.createElement('span');node.hidden=true;node.dataset.layer=key;root.append(node);markers.set(key,node);}
 let dead=false,painter=null,previous=0;
 function channels(){return Object.fromEntries([...markers].map(([key,node])=>[key,!node.hasAttribute('data-composition-hidden')]));}
 function render(ms){
  if(dead)return;if(!Number.isFinite(ms))throw new TypeError('时间必须是有限数字');
  previous=Math.max(0,Math.min(definition.duration_ms,ms));const time=phaseAt(previous,part);
  canvas.dataset.sourceTime=String(time);canvas.dataset.part=part||'composition';painter?.render(time,channels());
 }
 const observer=!part&&doc.defaultView?.MutationObserver?new doc.defaultView.MutationObserver(()=>render(previous)):null;
 observer?.observe(root,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
 render.ready=Promise.resolve().then(async()=>{
  if(dead)return;
  if(doc.fonts?.load){const loaded=await doc.fonts.load('700 23px Oswald','WISE MOTION MAKE IDEAS MOVE');if(dead)return;if(!loaded.length)throw Error('Oswald Bold 字体未载入');}
  if(dead)return;painter=createPainter(canvas,part,definition.poster_only);
  if(!painter){const note=doc.createElement('span');note.setAttribute('role','status');note.textContent='当前环境无法显示金属画面，请启用浏览器图形加速。';Object.assign(note.style,{position:'absolute',inset:'0',display:'grid',placeItems:'center',color:'#ece9ef',fontSize:'16px'});root.append(note);}
  render(previous);
 });
 render.frameRate=60;
 render.destroy=(preserve=false)=>{if(dead)return;dead=true;observer?.disconnect();painter?.destroy();painter=null;markers.forEach(node=>node.remove());markers.clear();if(!preserve){canvas.width=canvas.height=1;root.replaceChildren();}};
 render(0);return render;
}
const factories=global.MotionFactories=global.MotionFactories||{};
for(const part of parts){factories[part.id]=(root,K,definition)=>make(root,K,definition,part.key);factories[part.id].requiresPreparation=true;}
factories['metal-impact-type-sequence']=(root,K,definition)=>make(root,K,definition);
factories['metal-impact-type-sequence'].requiresPreparation=true;
factories['metal-impact-type-sequence'].breakdown=[
 {id:'body',name:'金属主体与地面响应',actions:['metal-drop-split','horizontal-metal-type'],start:0,end:5300,time:'0–5.3秒',detail:'单球落地后分成六颗，沿高低、左右、前后不同的固定方向大幅散开，从各自弹开的位置沿不同弧线连续回收，用0.76秒直接汇向同一个中心，短促压聚后从中心向四周散射，主体不再反弹；多数金属粒子冲出画面四周，少量留在画面内延续动势；同一批粒子沿弧线回收时直接融入长出的金属字面，2.74秒完成实体字形，不出现完整粒子字再换材质。'},
 {id:'sweep',name:'宽灯板与字面扫光',actions:['polished-metal-sweep'],start:3100,end:5300,time:'3.10–5.3秒',detail:'鲜艳彩色电镀字面保留浓郁底色，明亮灯板与深色反射形成清晰对比；斜向彩色亮带带着窄白光由左向右扫过固定字形，保持光滑边缘。'},
 {id:'caption',name:'品牌尾句',actions:[],start:3020,end:5300,time:'3.02–5.3秒',detail:'Oswald Bold 两行英文 WISE MOTION 与 MAKE IDEAS MOVE 渐入并保持。'}
];
global.WiseMetalImpact={sources,fragmentFor,phaseAt,parts,particles:metalParticles,particleFrame,glyphDistance,particleVertex,particleFragment};
})(globalThis);
