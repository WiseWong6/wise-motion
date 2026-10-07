/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.dandelion=function(S,opt,def){

 with(S.env){
(() => {
  "use strict";
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mod = (v, n) => ((v % n) + n) % n;
  const GRASS_COLORS = ["#236e1c", "#367f20", "#489828", "#64ae32", "#82c33e", "#acdb52"];
  class JourneyGrass {
    constructor({width,height}) {
      this.width=width;this.height=height;this.blades=[];
      this.grassPaths=Array.from({length:GRASS_COLORS.length},()=>[]);

      let seed=2029338688;
      const random=(a,b)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return a+(b-a)*seed/4294967296;};
      for (let i = 0; i < 6900; i++) {
        this.blades.push({
          x: random(-100, width + 100), y: random(0, height + 220),
          length: random(26, 91), lean: random(13, 38), phase: random(0, TAU),
          tone: random(0, 1), fine: i % 4 === 0,
        });
      }
      seed=2774014912;
      this.paper = document.createElement('canvas');
      this.paper.width=width/2;this.paper.height=height/2;
      const c = this.paper.getContext('2d');
      for (let i = 0; i < 33000; i++) {
        c.fillStyle = i % 3 ? "rgba(187,221,68,0.055)" : "rgba(20,93,19,0.08)";
        c.fillRect(random(0, width / 2), random(0, height / 2), random(0.4, 1.5), random(1, 5));
      }
      c.lineWidth = 18;
      for (let i = 0; i < 150; i++) {
        const x = random(-50, width / 2 + 50), y = random(-80, height / 2 + 80);
        c.strokeStyle = i % 2 ? "rgba(161,207,56,0.025)" : "rgba(35,108,20,0.025)";
        c.beginPath();
        c.moveTo(x, y + 85);
        c.bezierCurveTo(x + 13, y + 24, x + 36, y + 8, x + 56, y - 80);
        c.stroke();
      }
    }

    background(ctx, state) {
      const { distance } = state;
      ctx.fillStyle = "#4b9f27";
      ctx.fillRect(0, 0, this.width, this.height);

      const drift = mod(distance, 620);
      for (let i = -2; i < 5; i++) {
        const y = i * 620 + drift - 250;
        ctx.lineWidth = 124;
        ctx.strokeStyle = "rgba(123,190,43,0.10)";
        ctx.beginPath();
        ctx.moveTo(-90, y + 420);
        ctx.bezierCurveTo(200, y - 120, 530, y + 550, this.width + 100, y + 70);
        ctx.stroke();
        ctx.lineWidth = 89;
        ctx.strokeStyle = "rgba(42,116,23,0.11)";
        ctx.beginPath();
        ctx.moveTo(-80, y + 530);
        ctx.bezierCurveTo(270, y + 5, 520, y + 700, this.width + 100, y + 235);
        ctx.stroke();
      }
      const py = mod(distance, this.height);
      ctx.drawImage(this.paper, 0, py, this.width, this.height);
      ctx.drawImage(this.paper, 0, py - this.height, this.width, this.height);
    }

    grass(ctx, state) {
      const { time, distance } = state;
      for (const group of this.grassPaths) group.length = 0;

      for (let i = 0; i < this.blades.length; i++) {
        const b = this.blades[i];
        const y = mod(b.y + distance, this.height + 220) - 100;
        const x = b.x + 9 * Math.sin((b.y - distance * 0.05) * 0.009 + b.phase);
        const stripe = 0.5 + 0.5 * Math.sin(x * 0.010 + b.y * 0.010 + 1.9 * Math.sin(x * 0.005 - b.y * 0.007));
        const tone = Math.floor(clamp((stripe * 0.70 + b.tone * 0.30) * 5.8, 0, 5));
        this.grassPaths[tone].push(i, x, y);
      }
      ctx.lineWidth = 1.15;
      ctx.lineCap = "round";
      for (let tone = 0; tone < this.grassPaths.length; tone++) {
        const group = this.grassPaths[tone];
        ctx.strokeStyle = GRASS_COLORS[tone];
        ctx.beginPath();
        for (let i = 0; i < group.length; i += 3) {
          const b = this.blades[group[i]], x = group[i + 1], y = group[i + 2];
          const wind = Math.sin(time * 2.1 + b.phase + x * 0.005) * 7
            + Math.sin(time * 0.8 - b.y * 0.012) * 5;
          const gust = Math.sin(x * 0.006 + y * 0.008 - time * 1.8) * 19
            + Math.sin(y * 0.004 - time * 0.9) * 11;
          const crosswind = state.gustAt ? state.gustAt(x) * 72 : 0;
          const cover = state.growthCoverAt ? state.growthCoverAt(x, y) : 0;
          const wake = state.wakeAt ? state.wakeAt(x, y) : 0;
          const lean = (b.lean + wind + gust + crosswind + wake) * (1 - cover * 0.55);
          const length = b.length * (1 - cover * 0.72);
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + lean * 0.12, y - length * 0.70,
            x + lean, y - length);
        }
        ctx.stroke();
      }
    }

  }
  window.JourneyGrass=JourneyGrass;
})();

(() => {
  const TAU=Math.PI*2;
  const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
  const mod=(x,n)=>((x%n)+n)%n;
  class JourneyAir {
    constructor(){
      this.flecks=Array.from({length:240},(_,i)=>({phase:mod(i*0.618034,1),side:Math.sin(i*2.39996),size:0.8+mod(i*0.73,1.5)}));
      this.trailCache=null;
      this.followers=Array.from({length:21},(_,i)=>({kind:i<5?0:i<10?1:i<15?2:4,
        phase:i*2.39996,side:i%2?1:-1,lateral:85+mod(i*43.17,145),
        behind:35+mod(i*73.7,235),lag:0.32+mod(i*0.173,0.62),size:10+mod(i*2.37,6)}));

      const forest=this.followers.filter(f=>f.kind===2);
      this.followers=this.followers.filter(f=>f.kind!==2);
      this.followers.push(...forest.map(f=>Object.assign({},f,{kind:3})),
        ...forest.slice(0,4).map(f=>Object.assign({},f,{size:(10.2+mod(f.phase*0.73,2.4))*0.8})));
      this.skyEventCache=null;
      this.soil=Array.from({length:150},(_,i)=>({x:mod(i*557.731,920)-10,
        y:mod(i*331.793,2200),phase:i*2.39996,length:10+mod(i*7.31,20)}));
    }
    weights(t,x,y,journey){
      const weights=[1,0,0,0,0];
      for(const [i,start] of [9.4,14.4,18.8,23.8].entries()){
        const amount=smooth(y-100,y+100,journey.transitionEdge(t,start,x));
        for(let j=0;j<=i;j++)weights[j]*=1-amount;
        weights[i+1]=amount;
      }
      return weights;
    }
    trail(s,journey) {
      if(this.trailCache&&this.trailCache.time===s.time&&this.trailCache.courseAt===s.courseAt)return this.trailCache;
      const t=s.time,span=Math.min(1.65,Math.max(0,t-4.25));
      const distance=journey.distance(t),nodes=[];
      for(let i=0;i<=24;i++){
        const age=span*i/24,at=t-age,body=journey.subjectPose(at,s.courseAt);
        nodes.push({age,x:body.x,y:body.y+38+distance-journey.distance(at)});
      }
      let monotone=true;
      for(let i=0;i<nodes.length;i++){
        const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)];
        const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
        nodes[i].tx=(b.x-a.x)/length;nodes[i].ty=(b.y-a.y)/length;
        nodes[i].nx=nodes[i].ty;nodes[i].ny=-nodes[i].tx;
        nodes[i].width=22+Math.sqrt(nodes[i].age)*138;
        nodes[i].weights=this.weights(t,nodes[i].x,nodes[i].y,journey);
        if(i&&nodes[i].y<nodes[i-1].y)monotone=false;
      }
      this.trailCache={time:t,courseAt:s.courseAt,nodes,span,monotone,
        visible:smooth(4.25,5.55,t)*(1-smooth(26.5,27.55,t))};
      return this.trailCache;
    }
    influence(trail,x,y) {
      const nodes=trail.nodes;
      if(!trail.visible||trail.span<0.05)return {strength:0,dx:0,dy:-1,side:0,age:0};
      let first=0,last=nodes.length-2;
      if(trail.monotone){
        let lo=0,hi=nodes.length-1;
        while(hi-lo>1){const mid=(lo+hi)>>1;if(nodes[mid].y<y)lo=mid;else hi=mid;}
        first=Math.max(0,lo-1);last=Math.min(nodes.length-2,lo+1);
      }
      let result={distance:Infinity,strength:0,dx:0,dy:-1,side:0,age:0};
      for(let i=first;i<=last;i++){
        const a=nodes[i],b=nodes[i+1],dx=b.x-a.x,dy=b.y-a.y;
        const u=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
        const px=a.x+dx*u,py=a.y+dy*u,distance=Math.hypot(x-px,y-py);
        if(distance>=result.distance)continue;
        const age=a.age+(b.age-a.age)*u,width=75+age*70;
        result={distance,age,dx:-a.tx,dy:-a.ty,side:Math.sign((x-px)*a.nx+(y-py)*a.ny),
          strength:Math.exp(-((distance/width)**2))*(1-smooth(0.12,1.55,age))*trail.visible};
      }
      return result;
    }
    sample(trail,u,lateral=0) {
      const index=Math.max(0,Math.min(23.999,u*24)),i=Math.floor(index),f=index-i;
      const a=trail.nodes[i],b=trail.nodes[i+1];
      const width=a.width+(b.width-a.width)*f,nx=a.nx+(b.nx-a.nx)*f,ny=a.ny+(b.ny-a.ny)*f;
      return {x:a.x+(b.x-a.x)*f+nx*lateral*width,y:a.y+(b.y-a.y)*f+ny*lateral*width,
        weights:a.weights.map((v,k)=>v+(b.weights[k]-v)*f),age:a.age+(b.age-a.age)*f};
    }
    wakeShade(ctx,trail) {
      const colors=['5,62,57','91,77,46','40,69,58','121,171,184','25,85,35'];
      const density=[0.17,0.1,0.13,0.16,0.12];

      for(let i=1;i<24;i++){
        const u=i/24,p=this.sample(trail,u),node=trail.nodes[i];
        const fade=trail.visible*smooth(0,0.16,u)*(1-smooth(0.42,1,u));
        const next=trail.nodes[i+1],length=Math.max(25,Math.hypot(next.x-node.x,next.y-node.y)*1.65);
        for(let kind=0;kind<5;kind++){
          if(p.weights[kind]<0.01)continue;
          const offset=kind===1||kind===2?17:0;
          const width=node.width*(0.86+Math.sin(u*9)*0.1);
          ctx.save();ctx.globalAlpha=p.weights[kind]*fade*density[kind];
          ctx.translate(p.x+offset,p.y+offset*0.6);ctx.rotate(Math.atan2(node.ny,node.nx));ctx.scale(width,length);
          const shade=ctx.createRadialGradient(-0.12,-0.1,0,0,0,1);
          shade.addColorStop(0,`rgba(${colors[kind]},1)`);shade.addColorStop(0.42,`rgba(${colors[kind]},0.8)`);
          shade.addColorStop(0.78,`rgba(${colors[kind]},0.25)`);shade.addColorStop(1,`rgba(${colors[kind]},0)`);
          ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();
        }
      }
    }
    entryShadowTrail(s,journey,trail){
      const t=s.time;
      if(t<=2.28||t>=5.55)return trail;

      const span=Math.min(1.65,t-2.28),join=smooth(4.25,5.55,t);
      const body=journey.subjectPose(t,s.courseAt),scale=Math.max(0.3,Math.min(1,body.radius/36))*(0.8+0.2*join);
      const offset=10+28*smooth(2.28,4.75,t),distance=journey.distance(t);
      const nodes=trail.nodes.map((old,i)=>{
        const age=span*i/24,at=t-age,p=journey.subjectPose(at,s.courseAt);
        const x=p.x,y=p.y+offset+distance-journey.distance(at);
        return Object.assign({},old,{x:x+(old.x-x)*join,y:y+(old.y-y)*join,
          width:(22+Math.sqrt(age)*138)*scale*(1-join)+old.width*join});
      });
      for(let i=0;i<nodes.length;i++){
        const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)];
        const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
        nodes[i].nx=(b.y-a.y)/length;nodes[i].ny=-(b.x-a.x)/length;
      }
      return Object.assign({},trail,{nodes,visible:smooth(2.28,2.43,t)*(0.35+0.65*smooth(0.05,1.3,span))*(0.28+0.72*smooth(3.6,5.55,t))});
    }
    airflow(ctx,s,journey){
      const trail=this.trail(s,journey),shadeTrail=this.entryShadowTrail(s,journey,trail);
      if(!trail.visible&&!shadeTrail.visible)return;
      const edges=['#d9f4e6','#f3dda7','#d9e2c3','#f4f8f3','#d9eaa0'];
      const grains=['#f5fff0','#fff0c5','#ebedd4','#f5f9f4','#eff3bb'];
      ctx.save();ctx.lineCap='round';
      this.wakeShade(ctx,shadeTrail);
      if(!trail.visible){ctx.restore();return;}

      for(let kind=0;kind<5;kind++)for(const side of [-1,1])for(let lane=0;lane<5;lane++){
        for(let segment=0;segment<10;segment++){
          const u=mod(segment*0.103+lane*0.037-s.time*0.08,0.96),span=0.045+lane*0.003;
          const lateral=side*(0.62+lane*0.075+Math.sin(u*8+lane)*0.025);
          const a=this.sample(trail,u,lateral),b=this.sample(trail,Math.min(1,u+span*0.5),lateral),c=this.sample(trail,Math.min(1,u+span),lateral);
          if(a.weights[kind]<0.01)continue;
          const sky=kind===3?1-journey.clouds.coverageAt(s.time,a.x,a.y)*0.85:1;
          const alpha=sky*a.weights[kind]*trail.visible*smooth(0,0.09,u)*(1-smooth(0.45,1,u))*([0.39,0.28,0.21,0.32,0.26][kind]+lane*0.018);
          if(alpha<0.008)continue;
          ctx.globalAlpha=alpha;ctx.strokeStyle=edges[kind];ctx.lineWidth=kind===3?2:kind===0?1.15:0.95;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(b.x,b.y,c.x,c.y);ctx.stroke();
        }
      }

      for(let i=0;i<this.flecks.length;i++){
        const f=this.flecks[i],u=mod(f.phase+s.time*0.36,1);
        const p=this.sample(trail,u,f.side*(0.3+u*0.62));
        const fade=trail.visible*smooth(0,0.12,u)*(1-smooth(0.5,1,u));
        for(let kind=0;kind<5;kind++){
          if(p.weights[kind]<0.01||(kind===3&&i%3!==0))continue;
          const sky=kind===3?1-journey.clouds.coverageAt(s.time,p.x,p.y)*0.85:1;
          const alpha=sky*p.weights[kind]*fade*[0.88,0.76,0.58,0.55,0.7][kind]*(i%5===0?0.65:1);if(alpha<0.008)continue;
          ctx.globalAlpha=alpha;ctx.fillStyle=grains[kind];ctx.strokeStyle=grains[kind];ctx.lineWidth=kind===3?1.1:0.85;
          if(kind===3){const q=this.sample(trail,Math.min(1,u+0.035),f.side*(0.3+u*0.62));ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
          else {ctx.beginPath();ctx.ellipse(p.x,p.y,f.size*(kind===1?1.8:1),f.size*(kind===4?0.48:0.7),i*2.4+s.time*0.15,0,TAU);ctx.fill();}
        }
      }
      ctx.restore();
    }
    wheatUnderlay(ctx,s,journey){
      const trail=this.trail(s,journey);if(!trail.visible)return;
      const distance=journey.distance(s.time)-journey.distance(9.4);
      ctx.save();ctx.lineCap='round';
      for(const patch of this.soil){
        const y=mod(patch.y+distance+200,2200)-200;
        if(y<0||y>1200)continue;
        const wake=this.influence(trail,patch.x,y);if(wake.strength<0.035)continue;
        ctx.globalAlpha=wake.strength*0.43;ctx.strokeStyle='#776242';ctx.lineWidth=2.4;
        const lean=Math.sin(patch.phase)*5,length=patch.length;
        ctx.beginPath();ctx.moveTo(patch.x,y);
        ctx.quadraticCurveTo(patch.x+lean,y-length*0.5,patch.x+lean*0.7,y-length);ctx.stroke();
        ctx.globalAlpha=wake.strength*0.56;ctx.fillStyle='#ddc799';ctx.beginPath();
        ctx.ellipse(patch.x+6,y-length*0.45,2.1,1.2,patch.phase,0,TAU);ctx.fill();
      }ctx.restore();
    }
    baseFollowerPose(f,s,journey){
      const body=journey.subjectPose(s.time-f.lag,s.courseAt);
      const orbit=s.time*1.25+f.phase;
      const pose={x:body.x+f.side*f.lateral+Math.sin(orbit)*23,
        y:body.y+f.behind+Math.cos(orbit*0.83)*25,
        angle:Math.sin(orbit)*0.26+f.side*0.13};
      if(f.kind===1){

        const sweep=s.time*1.65+f.phase;
        pose.x+=Math.sin(sweep)*42;
        pose.y+=Math.cos(sweep*0.73)*17;
        pose.angle+=Math.cos(sweep)*0.48;
      }else if(f.kind===2){
        const glide=s.time*0.82+f.phase;
        pose.x+=Math.sin(glide)*32;
        pose.y+=Math.cos(glide*0.7)*24;
        pose.angle=Math.sin(glide)*0.32+f.side*0.16;
      }
      return pose;
    }
    skyEvents(journey,courseAt){
      if(this.skyEventCache&&this.skyEventCache.journey===journey&&this.skyEventCache.courseAt===courseAt)return this.skyEventCache.events;
      const candidates=[];
      for(const follower of this.followers.filter(f=>f.kind===3)){
        for(let step=0;step<=125;step++){
          const at=19.6+step*0.02,pose=this.baseFollowerPose(follower,{time:at,courseAt},journey),body=journey.subjectPose(at,courseAt);
          const dx=pose.x-body.x,dy=pose.y-body.y;
          if(this.weights(at,pose.x,pose.y,journey)[3]<0.88||Math.hypot(dx,dy)>185)continue;
          candidates.push({follower,at,side:Math.sign(dx)||follower.side});break;
        }
      }
      const events=[];
      for(const event of candidates.sort((a,b)=>a.at-b.at)){
        if(events.every(other=>Math.abs(other.at-event.at)>0.7))events.push(event);
        if(events.length===2)break;
      }
      this.skyEventCache={journey,courseAt,events};return events;
    }
    followerPose(f,s,journey){
      const pose=this.baseFollowerPose(f,s,journey);
      if(f.kind!==3||s.time<19.6||s.time>23.4)return pose;
      const event=this.skyEvents(journey,s.courseAt).find(e=>e.follower===f);
      if(!event)return pose;
      const age=s.time-event.at;
      const dodge=smooth(0,0.32,age)*(1-smooth(0.65,1.25,age));
      pose.x+=event.side*dodge*115;pose.y-=dodge*72;
      pose.angle+=event.side*dodge*0.6;
      return pose;
    }
    animal(ctx,kind,size,t,phase){
      if(kind===0){
        ctx.strokeStyle='#e2edc8';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(0,size*1.5);ctx.stroke();
        ctx.fillStyle='rgba(220,245,228,0.77)';
        for(const side of [-1,1])for(const pair of [-1,1]){
          const beat=0.45+0.55*Math.abs(Math.sin(t*23+phase));
          ctx.beginPath();ctx.ellipse(side*size*0.67*beat,pair*size*0.3,size*0.82*beat,size*0.21,side*pair*0.24,0,TAU);ctx.fill();
        }
        ctx.fillStyle='#f0a06f';ctx.beginPath();ctx.arc(0,-size*0.45,2.4,0,TAU);ctx.fill();
      }else if(kind===1){
        const wing=Math.sin(t*10.5+phase),span=size*(1.35+wing*0.15);
        ctx.fillStyle='#334665';ctx.beginPath();
        for(const side of [-1,1]){
          ctx.moveTo(0,-size*0.14);
          ctx.quadraticCurveTo(side*size*0.58,-size*0.52,side*span,size*(-0.2+wing*0.32));
          ctx.quadraticCurveTo(side*size*0.58,size*0.14,side*size*0.15,size*0.19);ctx.closePath();
        }
        ctx.fill();ctx.beginPath();ctx.ellipse(0,0,size*0.15,size*0.46,0,0,TAU);ctx.fill();
        ctx.beginPath();ctx.moveTo(-size*0.11,size*0.28);ctx.lineTo(-size*0.35,size*0.95);
        ctx.lineTo(0,size*0.56);ctx.lineTo(size*0.35,size*0.95);ctx.lineTo(size*0.11,size*0.28);ctx.closePath();ctx.fill();
        ctx.fillStyle='#ae7965';ctx.beginPath();ctx.ellipse(0,-size*0.21,size*0.095,size*0.14,0,0,TAU);ctx.fill();
      }else if(kind===2){

        ctx.strokeStyle='#30342a';ctx.lineWidth=size*0.07;ctx.lineCap='round';
        for(const side of [-1,1])for(let leg=0;leg<3;leg++){
          const y=size*(-0.22+leg*0.28);
          ctx.beginPath();ctx.moveTo(side*size*0.24,y);
          ctx.lineTo(side*size*0.48,y+size*0.05);ctx.lineTo(side*size*0.59,y+size*0.17);ctx.stroke();
        }

        const beat=0.55+0.45*Math.abs(Math.sin(t*24+phase));
        for(const side of [-1,1]){
          ctx.save();ctx.globalAlpha*=0.27+beat*0.12;
          ctx.translate(side*size*0.12,-size*0.35);ctx.rotate(-side*(0.63+beat*0.12));ctx.scale(beat,1);
          ctx.fillStyle='#eff0d7';ctx.beginPath();ctx.moveTo(0,0);
          ctx.bezierCurveTo(side*size*0.24,size*0.1,side*size*0.34,size*0.6,side*size*0.1,size*1.06);
          ctx.bezierCurveTo(-side*size*0.19,size*0.99,-side*size*0.17,size*0.33,0,0);ctx.fill();ctx.restore();
        }
        ctx.fillStyle='#2a3027';ctx.beginPath();ctx.ellipse(0,size*0.07,size*0.29,size*0.56,0,0,TAU);ctx.fill();

        for(const side of [-1,1]){
          ctx.save();ctx.translate(0,-size*0.43);ctx.rotate(-side*0.12);
          ctx.fillStyle=side<0?'#df4d36':'#ca3b2a';ctx.strokeStyle='#78382b';ctx.lineWidth=size*0.055;
          ctx.beginPath();ctx.moveTo(0,0);
          ctx.bezierCurveTo(side*size*0.4,-size*0.07,side*size*0.68,size*0.18,side*size*0.65,size*0.56);
          ctx.bezierCurveTo(side*size*0.62,size*0.93,side*size*0.34,size*1.16,side*size*0.04,size*1.08);
          ctx.quadraticCurveTo(side*size*0.015,size*0.57,0,0);ctx.closePath();ctx.fill();ctx.stroke();
          ctx.fillStyle='#272d26';
          for(const [x,y,r] of [[0.23,0.2,0.125],[0.43,0.54,0.15],[0.27,0.87,0.14]]){
            ctx.beginPath();ctx.arc(side*size*x,size*y,size*r,0,TAU);ctx.fill();
          }
          ctx.fillStyle='rgba(255,205,145,0.43)';ctx.beginPath();
          ctx.ellipse(side*size*0.38,size*0.13,size*0.14,size*0.052,side*0.58,0,TAU);ctx.fill();ctx.restore();
        }
        ctx.fillStyle='#df4d36';ctx.beginPath();ctx.ellipse(0,-size*0.4,size*0.22,size*0.16,0,0,TAU);ctx.fill();
        ctx.fillStyle='#272d26';ctx.beginPath();ctx.arc(0,-size*0.38,size*0.13,0,TAU);ctx.fill();

        ctx.fillStyle='#262d26';ctx.beginPath();ctx.ellipse(0,-size*0.61,size*0.31,size*0.19,0,0,TAU);ctx.fill();
        ctx.beginPath();ctx.ellipse(0,-size*0.77,size*0.16,size*0.14,0,0,TAU);ctx.fill();
        ctx.fillStyle='#e6e4bf';
        for(const side of [-1,1]){
          ctx.beginPath();ctx.ellipse(side*size*0.21,-size*0.63,size*0.065,size*0.08,side*0.5,0,TAU);ctx.fill();
          ctx.strokeStyle='#30342a';ctx.lineWidth=size*0.065;ctx.beginPath();ctx.moveTo(side*size*0.085,-size*0.85);
          ctx.quadraticCurveTo(side*size*0.15,-size*0.96,side*size*0.22,-size*0.96);ctx.stroke();
        }
      }else if(kind===3){
        const wing=Math.sin(t*8.7+phase);
        ctx.strokeStyle='#365772';ctx.lineWidth=2.1;ctx.beginPath();ctx.moveTo(-size*1.4,wing*size*0.48);ctx.quadraticCurveTo(-size*0.6,-size*0.55,0,0);ctx.quadraticCurveTo(size*0.6,-size*0.55,size*1.4,wing*size*0.48);ctx.moveTo(0,-3);ctx.lineTo(0,size*0.75);ctx.stroke();
      }else{
        const spread=0.18+0.82*Math.abs(Math.sin(t*8+phase));
        ctx.fillStyle='#e9b37e';
        for(const side of [-1,1]){ctx.save();ctx.scale(side*spread,1);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(size*0.8,-size*1.15,size*1.6,-size*0.8,size*0.9,0);ctx.bezierCurveTo(size*1.5,size*0.9,size*0.25,size*0.85,0,0);ctx.fill();ctx.restore();}
        ctx.strokeStyle='#806344';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-size*0.35);ctx.lineTo(0,size*0.6);ctx.stroke();
      }
    }
    companions(ctx,s,journey){
      const t=s.time,appear=smooth(4.1,5,t)*(1-smooth(26.7,27.7,t));
      if(appear<=0)return;
      for(const follower of this.followers){
        const pose=this.followerPose(follower,s,journey);
        const weights=this.weights(t,pose.x,pose.y,journey);
        const alpha=weights[follower.kind]*appear;
        if(alpha<0.01)continue;
        ctx.save();ctx.globalAlpha=alpha;ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);
        this.animal(ctx,follower.kind,follower.size,t,follower.phase);ctx.restore();
      }
    }
  }
  window.JourneyAir=JourneyAir;
})();

(() => {
  'use strict';
  const TAU=Math.PI*2;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const mod=(n,d)=>((n%d)+d)%d;
  const smooth=(a,b,n)=>{const u=clamp((n-a)/(b-a));return u*u*(3-2*u);};
  const mix=(a,b,u)=>a+(b-a)*u;
  class JourneyClouds {
    constructor() {
      this.backgroundColor='#79abb8';
      this.period=2700;
      this.frame=null;
      let seed=462719;
      const random=(a,b)=>{seed=seed*16807%2147483647;return a+(b-a)*seed/2147483647;};
      this.layers=[
        {speed:82,opacity:0.43,width:[255,405],height:[90,150],positions:[[100,130],[740,620],[370,1130],[830,1680],[-80,2220]]},
        {speed:156,opacity:0.92,width:[520,690],height:[225,310],positions:[[175,110],[765,780],[260,1480],[845,2170]]},
        {speed:254,opacity:0.97,width:[735,850],height:[335,415],positions:[[25,720],[950,2010]]},
      ].map((layer,depth)=>Object.assign({},layer,{clouds:layer.positions.map(([x,y],index)=>{
        const width=random(...layer.width),height=random(...layer.height),phase=random(0,TAU);
        const masses=[];

        for(let i=0;i<5;i++)masses.push({x:width*random(-0.29,0.07),y:height*random(-0.22,0.22),
          rx:width*random(0.18,0.29),ry:height*random(0.33,0.59),weight:random(0.58,0.92)});
        for(let i=0;i<4;i++)masses.push({x:width*[0.05,0.16,0.27,0.35][i],y:height*Math.sin(phase+i*0.85)*0.11,
          rx:width*random(0.105,0.155),ry:height*(0.4+Math.sin(phase+i*1.7)*0.06),weight:0.8});
        const cloud={x:x+random(-40,40),y:y+random(-55,55),width,height,masses,phase,
          angle:random(-0.29,0.12),drift:random(5,11),noiseX:random(0,500),noiseY:random(0,500)};
        return cloud;
      })}));
      this.fibers=Array.from({length:1650},(_,i)=>({x:mod(i*557.731,1060)-80,y:mod(i*331.793,1500),
        length:11+mod(i*7.37,30),phase:i*2.39996,tone:i%3}));
    }
    async prepare() {

      for(const layer of this.layers)for(const cloud of layer.clouds){
        await new Promise(resolve=>window.setTimeout(resolve,0));
        this.makeCloud(cloud);
      }
    }
    noise(x,y) {
      const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy;
      const hash=(a,b)=>{let n=Math.imul(a,374761393)+Math.imul(b,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
      const sx=u*u*(3-2*u),sy=v*v*(3-2*v);
      return mix(mix(hash(ix,iy),hash(ix+1,iy),sx),mix(hash(ix,iy+1),hash(ix+1,iy+1),sx),sy);
    }
    makeCloud(cloud) {

      const step=2.5,canvas=document.createElement('canvas');
      canvas.width=Math.ceil((cloud.width*1.65+30)/step);canvas.height=Math.ceil((cloud.height*1.9+30)/step);
      const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(canvas.width,canvas.height),data=pixels.data;
      const mask=new Uint8Array(canvas.width*canvas.height);
      for(let py=0;py<canvas.height;py++)for(let px=0;px<canvas.width;px++){
        const x=(px-canvas.width/2)*step,y=(py-canvas.height/2)*step;
        let density=0,gx=0,gy=0;
        for(const m of cloud.masses){
          const dx=x-m.x,dy=y-m.y,q=(dx/m.rx)**2+(dy/m.ry)**2;
          if(q>4)continue;
          const value=Math.exp(-2*q)*m.weight;density+=value;
          gx+=-4*dx/(m.rx*m.rx)*value;gy+=-4*dy/(m.ry*m.ry)*value;
        }
        if(density<0.14)continue;
        const nx=x*0.016+cloud.noiseX,ny=y*0.019+cloud.noiseY;
        const edge=(this.noise(nx,ny)-0.5)*0.055+(this.noise(nx*2.7+8,ny*2.7-3)-0.5)*0.012;
        const alpha=smooth(0.26,0.38,density+edge);if(alpha<=0)continue;
        const sx=gx*30,sy=gy*30;
        const light=(0.82+sx*0.46+sy*0.62)/Math.sqrt(1+sx*sx+sy*sy);
        const volume=smooth(0.2,0.89,light),highlight=smooth(0.8,1.05,light)*0.5;
        const shadow=[162,191,195],body=[224,235,226],top=[251,250,234];
        const index=(py*canvas.width+px)*4,grain=(this.noise(nx*4.3,ny*4.3)-0.5)*2.2;
        for(let c=0;c<3;c++)data[index+c]=mix(mix(shadow[c],body[c],volume),top[c],highlight)+grain;
        data[index+3]=mask[py*canvas.width+px]=Math.round(alpha*255);
      }
      ctx.putImageData(pixels,0,0);
      cloud.sprite=canvas;cloud.mask=mask;cloud.step=step;
      cloud.drawWidth=canvas.width*step;cloud.drawHeight=canvas.height*step;
    }
    cloudPose(cloud,layer,depth,time) {
      return {x:cloud.x+time*cloud.drift+Math.sin(time*0.16+cloud.phase)*(3+depth*2),
        y:mod(cloud.y+time*layer.speed+420,this.period)-420,
        angle:cloud.angle+Math.sin(time*0.11+cloud.phase)*0.008};
    }
    layout(time) {
      if(this.frame&&this.frame.time===time)return this.frame;
      const local=Math.max(0,time-18.8),clouds=[];
      this.layers.forEach((layer,depth)=>{for(const cloud of layer.clouds){
        const pose=this.cloudPose(cloud,layer,depth,local),cos=Math.cos(pose.angle),sin=Math.sin(pose.angle);

        const rx=(Math.abs(cos)*cloud.drawWidth+Math.abs(sin)*cloud.drawHeight)/2;
        const ry=(Math.abs(sin)*cloud.drawWidth+Math.abs(cos)*cloud.drawHeight)/2;
        if(pose.y+ry<-5||pose.y-ry>1205||pose.x+rx<-5||pose.x-rx>905)continue;
        clouds.push({cloud,pose,cos,sin,opacity:layer.opacity,depth});
      }});
      this.frame={time,clouds};return this.frame;
    }
    coverageAt(time,x,y) {
      let alpha=0;
      for(const item of this.layout(time).clouds){
        const {cloud,pose,cos,sin,opacity}=item,dx=x-pose.x,dy=y-pose.y;
        const px=Math.floor((dx*cos+dy*sin)/cloud.step+cloud.sprite.width/2);
        const py=Math.floor((-dx*sin+dy*cos)/cloud.step+cloud.sprite.height/2);
        if(px<0||py<0||px>=cloud.sprite.width||py>=cloud.sprite.height)continue;
        const a=cloud.mask[py*cloud.sprite.width+px]/255*opacity;alpha+=a*(1-alpha);
      }
      return alpha;
    }
    draw(ctx,state,journey) {
      const time=Math.max(0,state.time-18.8),trail=journey?journey.air.trail(state,journey):null;
      ctx.save();ctx.fillStyle=this.backgroundColor;ctx.fillRect(0,0,900,1200);ctx.lineCap='round';

      for(let tone=0;tone<3;tone++){
        ctx.strokeStyle=['#a9c9cd','#5f94a5','#d2e2dc'][tone];ctx.globalAlpha=[0.26,0.18,0.17][tone];ctx.lineWidth=tone===2?0.75:0.65;ctx.beginPath();
        for(let i=tone;i<this.fibers.length;i+=3){
          const fiber=this.fibers[i],y=mod(fiber.y+time*224,1500)-150;
          const x=fiber.x+Math.sin(y*0.004-time*0.32)*24;
          const wake=trail?journey.air.influence(trail,x,y):{strength:0,side:0};
          const angle=0.16+Math.sin(x*0.004+y*0.003-time*0.25)*0.34+wake.side*wake.strength*0.78;
          const length=fiber.length*(1+wake.strength*0.45);
          ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.sin(angle)*length*0.3,y+length*0.48,x+Math.sin(angle+0.12)*length,y+Math.cos(angle)*length);
        }ctx.stroke();
      }
      for(const {cloud,pose,opacity} of this.layout(state.time).clouds){
        ctx.save();ctx.globalAlpha=opacity;ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);
        ctx.drawImage(cloud.sprite,-cloud.drawWidth/2,-cloud.drawHeight/2,cloud.drawWidth,cloud.drawHeight);ctx.restore();
      }
      ctx.restore();
    }
  }
  window.JourneyClouds=JourneyClouds;
})();

(() => {
  const TAU=Math.PI*2;
  const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
  const angleBetween=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  class JourneyWater {
    constructor(){
      let seed=14893;
      const random=(a,b)=>{seed=seed*16807%2147483647;return a+(b-a)*seed/2147483647;};

      this.schools=[
        {x:570,y:40,count:4},{x:465,y:-835,count:3},
        {x:650,y:-1505,count:5},{x:305,y:-2350,count:4},
      ].map((school,id)=>Object.assign({},school,{id,phase:random(0,TAU),angle:random(-2.15,-0.9)}));
      this.fish=[];
      for(const school of this.schools)for(let i=0;i<school.count;i++){
        this.fish.push({id:this.fish.length,schoolId:school.id,
          x:random(-52,52),y:random(-63,63),size:random(18,34),
          phase:random(0,TAU),delay:random(0,0.11),spread:random(-0.8,0.8),
          speed:random(0.8,1.2),tone:i%3});
      }
      this.eventCache=null;
    }
    schoolPose(school,t,journey){
      return {x:school.x+Math.sin(t*0.35+school.phase)*22,
        y:school.y+Math.sin(t*0.28+school.phase)*15+journey.distance(t)-journey.distance(4.75)};
    }
    restingPose(fish,t,journey){
      const school=this.schools[fish.schoolId],p=this.schoolPose(school,t,journey);
      return {x:p.x+fish.x+Math.sin(t*0.66+fish.phase)*7,
        y:p.y+fish.y+Math.cos(t*0.53+fish.phase)*5,
        angle:school.angle+Math.sin(t*0.48+fish.phase)*0.16};
    }
    events(courseAt,journey){
      if(this.eventCache&&this.eventCache.courseAt===courseAt&&this.eventCache.journey===journey)return this.eventCache.events;
      const events=[];

      for(const school of this.schools){
        for(let step=0;step<=515;step++){
          const at=4.75+step*0.01,p=this.schoolPose(school,at,journey);
          const body=journey.subjectPose(at,courseAt),dx=p.x-body.x,dy=p.y-body.y;
          const distance=Math.hypot(dx,dy);
          if(distance>162||dy< -72||dy>110||p.y<180||p.y>850)continue;
          events.push({schoolId:school.id,at,x:p.x,y:p.y,
            nx:dx/(distance||1),ny:dy/(distance||1)});break;
        }
      }
      events.sort((a,b)=>a.at-b.at);
      this.eventCache={courseAt,journey,events};return events;
    }
    fishPose(fish,t,journey,events){
      const event=events.find(item=>item.schoolId===fish.schoolId);
      const age=event?t-event.at-fish.delay:-1;
      if(!event||age<0)return Object.assign({},this.restingPose(fish,t,journey),{age,escape:0});
      const at=event.at+fish.delay,rest=this.restingPose(fish,at,journey);
      const run=Math.max(0,age-0.14),escape=smooth(0.1,0.48,age);

      const direction=Math.atan2(event.ny,event.nx)+fish.spread;
      const distance=(220*(1-Math.exp(-run*run*1.6))+run*6*(1-Math.exp(-run*3)))*fish.speed;
      const bend=Math.sin(run*4+fish.phase)*11*smooth(0,0.4,run);
      return {x:rest.x+Math.cos(direction)*distance-Math.sin(direction)*bend,
        y:rest.y+journey.distance(t)-journey.distance(at)+Math.sin(direction)*distance+Math.cos(direction)*bend,
        angle:rest.angle+angleBetween(rest.angle,direction)*escape,age,escape};
    }
    tailPhase(fish,t,age){
      const u=Math.max(0,Math.min(1,(age-0.1)/0.38));

      const acceleration=0.38*(u*u*u-u*u*u*u*0.5)+Math.max(0,age-0.48);
      return t*5.5+fish.phase+acceleration*10;
    }
    fishShape(ctx,fish,p,t,clarity){
      const size=fish.size,beat=Math.sin(this.tailPhase(fish,t,p.age));
      const tail=beat*size*(0.075+p.escape*0.05);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);

      ctx.globalAlpha*=0.42+clarity*0.4;
      ctx.fillStyle=['#07534e','#0a5750','#075d54'][fish.tone];
      ctx.beginPath();ctx.moveTo(size*0.56,0);
      ctx.bezierCurveTo(size*0.29,-size*0.2,-size*0.12,-size*0.24,-size*0.48,tail*0.36);
      ctx.bezierCurveTo(-size*0.15,size*0.23,size*0.32,size*0.2,size*0.56,0);ctx.fill();
      ctx.beginPath();ctx.moveTo(-size*0.4,tail*0.36);
      ctx.quadraticCurveTo(-size*0.67,tail-size*0.2,-size*0.8,tail-size*0.2);
      ctx.quadraticCurveTo(-size*0.69,tail,-size*0.8,tail+size*0.2);
      ctx.quadraticCurveTo(-size*0.62,tail+size*0.19,-size*0.4,tail*0.36);ctx.fill();
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(size*0.12,side*size*0.09);
        ctx.quadraticCurveTo(-size*0.03,side*size*0.31,-size*0.16,side*size*0.28);
        ctx.lineTo(-size*0.06,side*size*0.09);ctx.fill();
      }
      ctx.globalAlpha*=0.24+clarity*0.74;
      ctx.fillStyle=['#bcbe91','#a8b9a0','#d0c595'][fish.tone];
      ctx.beginPath();ctx.moveTo(size*0.4,-size*0.025);
      ctx.bezierCurveTo(size*0.12,-size*0.105,-size*0.18,-size*0.1,-size*0.4,tail*0.3);
      ctx.bezierCurveTo(-size*0.06,size*0.06,size*0.21,size*0.065,size*0.4,-size*0.025);ctx.fill();
      ctx.fillStyle='#16463f';ctx.beginPath();ctx.arc(size*0.32,-size*0.035,Math.max(0.7,size*0.025),0,TAU);ctx.fill();
      ctx.restore();
    }
    disturbance(ctx,event,t,journey,visibility){
      const age=t-event.at;if(age<0.13||age>1.35)return;
      const x=event.x,y=event.y+journey.distance(t)-journey.distance(event.at);
      const fade=(1-smooth(0.32,1.35,age))*visibility;
      ctx.save();ctx.lineCap='round';ctx.strokeStyle='#78b69b';ctx.lineWidth=0.85;

      for(let i=0;i<3;i++){
        const radius=13+age*52+i*9,angle=Math.atan2(event.ny,event.nx)+i*0.21;
        ctx.globalAlpha=fade*(0.22-i*0.04);
        ctx.beginPath();ctx.ellipse(x,y,radius,radius*0.65,angle,0.3+i*0.6,1.5+i*0.6);ctx.stroke();
        ctx.beginPath();ctx.ellipse(x,y,radius*0.86,radius*0.48,angle,3.3+i*0.4,4.2+i*0.4);ctx.stroke();
      }
      ctx.restore();
    }
    draw(ctx,s,journey){
      const visibility=smooth(4.75,5.18,s.time);if(!visibility||s.time>12)return;
      const events=this.events(s.courseAt,journey),trail=journey.air.trail(s,journey);
      ctx.save();ctx.globalAlpha*=visibility;
      for(const fish of this.fish){
        const p=this.fishPose(fish,s.time,journey,events);
        if(p.x< -80||p.x>980||p.y< -80||p.y>1280)continue;
        const wake=journey.air.influence(trail,p.x,p.y);
        this.fishShape(ctx,fish,p,s.time,wake.strength);
      }
      ctx.restore();
      for(const event of events)this.disturbance(ctx,event,s.time,journey,visibility);
    }
  }
  window.JourneyWater=JourneyWater;
})();

(() => {
  const TAU=Math.PI*2;
  const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
  const mod=(a,b)=>((a%b)+b)%b;
  class JourneyEncounters {
    constructor() {
      let seed=61327;
      const random=(a,b)=>{seed=seed*16807%2147483647;return a+(b-a)*seed/2147483647;};
      this.rabbits=Array.from({length:14},(_,id)=>({id,x:random(180,700),y:random(0,2200),
        size:random(15,18),phase:random(0,TAU)}));
      this.cache=null;
    }
    treePose(tree,t,journey) {
      const base=tree.band*600,d=journey.distance(t)-journey.distance(14.4);
      const ridge=mod(base+d+600,3000)-600,shift=ridge-base,y=tree.y+shift;
      const g=smooth(460,810,y)*smooth(14.4,15,t),height=24+g*tree.adultHeight;
      const lean=tree.lean*g+Math.sin(t*1.6+tree.phase)*(2+g*2);
      return {x:tree.x+lean,y:y-height,baseY:y,ridge,shift,g,height,lean,crown:8+g*tree.width};
    }
    events(courseAt,journey) {
      if(this.cache&&this.cache.courseAt===courseAt&&this.cache.journey===journey)return this.cache.events;
      const candidates=[];
      for(const rabbit of this.rabbits){
        for(let step=0;step<=250;step++){
          const at=9.4+step*0.02,p=journey.groundPosition(rabbit,at,9.4,2200),body=journey.subjectPose(at,courseAt);
          if(Math.hypot(p.x-body.x,p.y-body.y)>145||p.y>body.y+15||p.y<100)continue;
          if(p.y>journey.transitionEdge(at,9.4,p.x)-80)continue;
          candidates.push({type:'rabbit',rabbit,at,x:p.x,y:p.y,side:p.x<body.x?-1:1});break;
        }
      }
      for(const tree of journey.trees){
        for(let step=0;step<=190;step++){
          const at=15+step*0.02,p=this.treePose(tree,at,journey),body=journey.subjectPose(at,courseAt);
          if(p.g<0.18||Math.hypot(p.x-body.x,p.y-body.y)>135||p.y>body.y+25)continue;
          if(p.y>journey.transitionEdge(at,14.4,p.x)-80)continue;
          candidates.push({type:'squirrel',tree,at,x:p.x,y:p.y,side:p.x<body.x?-1:1});break;
        }
      }
      const events=[];
      for(const event of candidates.sort((a,b)=>a.at-b.at)){
        const siblings=events.filter(other=>other.type===event.type);
        if(siblings.length<2&&siblings.every(other=>Math.abs(event.at-other.at)>1.35))events.push(event);
      }
      this.cache={courseAt,journey,events};return events;
    }
    rabbitPose(event,t,journey) {
      const age=t-event.at,u=Math.max(0,Math.min(1,age/1.25));
      const run=u*u*(2-u),bound=Math.max(0,Math.sin(Math.max(0,age)*18))*smooth(0,0.15,age);
      return {age,x:event.x+event.side*run*290,
        surfaceY:event.y+journey.distance(t)-journey.distance(event.at)-run*42,
        lift:bound*13,stretch:1+bound*0.17,run};
    }
    rabbit(ctx,rabbit,side,age,stretch) {
      const size=rabbit.size,alert=smooth(-0.16,0.03,age),stride=Math.sin(Math.max(0,age)*18)*smooth(0,0.15,age);
      ctx.scale(side,1);ctx.fillStyle='#d4b991';ctx.strokeStyle='#715c43';ctx.lineWidth=0.7;
      ctx.beginPath();ctx.ellipse(-size*0.1,-size*0.43,size*0.88*stretch,size*0.45/stretch,-0.06,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle='#b89873';
      for(const [x,reach] of [[-0.51,-1],[0.44,1]]){
        ctx.beginPath();ctx.ellipse(size*x+stride*reach*3,-2,size*0.31,size*0.12,-0.2*reach,0,TAU);ctx.fill();
      }
      ctx.fillStyle='#decaac';ctx.beginPath();ctx.ellipse(-size*0.91,-size*0.4,size*0.2,size*0.2,0,0,TAU);ctx.fill();
      ctx.fillStyle='#c4a17c';ctx.beginPath();ctx.ellipse(size*0.68,-size*0.61,size*0.38,size*0.34,-0.16,0,TAU);ctx.fill();
      for(let i=0;i<2;i++){
        const x=size*(0.55+i*0.2),y=-size*0.91;
        ctx.save();ctx.translate(x,y);ctx.rotate(-0.6+alert*0.36-i*0.15-stride*0.1);
        ctx.fillStyle='#c5a47e';ctx.beginPath();ctx.ellipse(0,-size*0.34,size*0.11,size*0.46,0,0,TAU);ctx.fill();
        ctx.strokeStyle='#e6ceb0';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-size*0.61);ctx.stroke();ctx.restore();
      }
      ctx.fillStyle='#473e32';ctx.beginPath();ctx.arc(size*0.85,-size*0.71,1.1,0,TAU);ctx.fill();
    }
    drawWheat(ctx,s,journey) {
      if(s.time<9.4||s.time>16.9)return;
      for(const event of this.events(s.courseAt,journey)){
        if(event.type!=='rabbit')continue;
        const p=this.rabbitPose(event,s.time,journey);
        if(p.surfaceY<-55||p.surfaceY>1270||p.x<-65||p.x>965)continue;
        ctx.save();ctx.fillStyle='rgba(91,75,42,0.28)';
        ctx.beginPath();ctx.ellipse(p.x+3,p.surfaceY+3,event.rabbit.size*0.98,event.rabbit.size*0.28,0,0,TAU);ctx.fill();
        ctx.translate(p.x,p.surfaceY-p.lift);this.rabbit(ctx,event.rabbit,event.side,p.age,p.stretch);ctx.restore();
        if(p.age<0||p.age>0.95)continue;
        const floor=event.y+journey.distance(s.time)-journey.distance(event.at);
        ctx.save();ctx.lineWidth=1.2;
        for(let i=0;i<9;i++){
          const age=p.age-i*0.023;if(age<0)continue;
          const x=event.x-event.side*age*(18+i*5),y=floor+age*age*28-Math.sin(Math.min(1,age/0.85)*Math.PI)*(8+i*1.4);
          ctx.globalAlpha=(1-smooth(0.18,0.75,age))*0.58;ctx.strokeStyle=i%2?'#e4d29a':'#887448';
          ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(i*2.4+age)*3,y-2);ctx.stroke();
        }ctx.restore();
      }
    }
    forestResponse(tree,t,journey,courseAt) {
      const event=this.events(courseAt,journey).find(event=>event.type==='squirrel'&&event.tree===tree);
      const age=event?t-event.at:-1;
      return {dx:age<0||age>1.3?0:7*Math.sin(age*18)*Math.exp(-age*3.4)*smooth(0,0.065,age)};
    }
    behindRidge(x,y,ridge,t,journey) {
      const d=journey.distance(t)-journey.distance(14.4);
      for(let band=0;band<5;band++){
        const base=band*600,current=mod(base+d+600,3000)-600;
        if(current<=ridge||current>1420)continue;
        if(y>journey.ridgeY(x,band)+current-base)return true;
      }
      return false;
    }
    squirrel(ctx,side,phase,t) {
      ctx.scale(side,1);ctx.lineCap='round';ctx.lineWidth=6;ctx.strokeStyle='#8d6647';
      ctx.beginPath();ctx.moveTo(-1,3);ctx.bezierCurveTo(-9,7,-11,-8,-6,-7);ctx.stroke();
      ctx.strokeStyle='#d6af79';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-2,3);ctx.bezierCurveTo(-8,4,-8,-7,-6,-7);ctx.stroke();
      ctx.fillStyle='#b78353';ctx.beginPath();ctx.ellipse(2,-1,4.1,7,-0.2,0,TAU);ctx.fill();
      ctx.fillStyle='#dfc08b';ctx.beginPath();ctx.ellipse(4,-1,1.9,4.7,-0.2,0,TAU);ctx.fill();
      ctx.fillStyle='#b78353';ctx.beginPath();ctx.ellipse(4,-8,4,3.6,-0.25,0,TAU);ctx.fill();
      ctx.beginPath();ctx.ellipse(3,-11,1.4,2.5,0.1,0,TAU);ctx.fill();
      ctx.fillStyle='#473f30';ctx.beginPath();ctx.arc(5.7,-9,0.8,0,TAU);ctx.fill();
      ctx.strokeStyle='#9e774d';ctx.lineWidth=1.5;
      for(const y of [1,-4]){ctx.beginPath();ctx.moveTo(3,y);ctx.lineTo(7,y+1+Math.sin(t*3+phase)*0.2);ctx.stroke();}
    }
    drawForest(ctx,s,journey) {
      if(s.time<14.4||s.time>21.2)return;
      for(const event of this.events(s.courseAt,journey)){
        if(event.type!=='squirrel')continue;
        const p=this.treePose(event.tree,s.time,journey),age=s.time-event.at;
        const response=this.forestResponse(event.tree,s.time,journey,s.courseAt);p.x+=response.dx;p.lean+=response.dx;
        if(p.baseY<-70||p.baseY>1460)continue;

        if(age<0.76){
          const retreat=smooth(0.09,0.72,age),trunkX=event.tree.x+p.lean*0.56;
          const x=trunkX+event.side*(7.3-retreat*20),y=p.baseY-p.height*(0.52+retreat*0.22);
          if(!this.behindRidge(x,y,p.ridge,s.time,journey)){
            ctx.save();ctx.beginPath();
            ctx.rect(event.side>0?trunkX+1:trunkX-400,p.baseY-p.height-40,399,p.height+80);ctx.clip();
            ctx.translate(x,y);const size=0.7+Math.min(0.3,p.g*0.7);ctx.scale(size,size);
            this.squirrel(ctx,event.side,event.tree.phase,s.time);ctx.restore();
          }
        }
        if(age<0||age>1.55)continue;
        const source=this.treePose(event.tree,event.at,journey);
        for(let i=0;i<7;i++){
          const a=age-i*0.025;if(a<0)continue;
          const x=source.x+Math.sin(i*2.4)*source.crown*0.72+event.side*a*(17+i*3)+Math.sin(a*5+i)*a*9;
          const y=source.y+Math.cos(i*2.4)*source.crown*0.45+journey.distance(s.time)-journey.distance(event.at)+a*36+a*a*23;
          if(this.behindRidge(x,y,p.ridge,s.time,journey))continue;
          ctx.save();ctx.globalAlpha=1-smooth(0.9,1.45,a);ctx.translate(x,y);ctx.rotate(i*2.4+a*(i%2?2.8:-2.3));
          ctx.scale(0.35+Math.abs(Math.cos(a*5+i))*0.65,1);ctx.fillStyle=['#c3c789','#9fae6a','#dbcc94'][i%3];
          ctx.beginPath();ctx.ellipse(0,0,2.4+i%3*0.35,4+i%2,0.4,0,TAU);ctx.fill();ctx.restore();
        }
      }
    }
  }
  window.JourneyEncounters=JourneyEncounters;
})();

(() => {
  const TAU = Math.PI * 2;
  const smooth = (a,b,t) => { const u=Math.max(0,Math.min(1,(t-a)/(b-a))); return u*u*(3-2*u); };
  const mod=(a,b)=>((a%b)+b)%b;
  const OPENING_BURST=1.65;
  const CHAPTERS=Object.freeze([
    Object.freeze({at:0,seek:6,label:'步步生莲'}),
    Object.freeze({at:9.4,seek:12,label:'丰收在望'}),
    Object.freeze({at:14.4,seek:17,label:'向上生长'}),
    Object.freeze({at:18.8,seek:22,label:'云海乘风'}),
    Object.freeze({at:23.8,seek:26.8,label:'新的希望'}),
  ]);
  class DandelionJourney {
    static get chapters() { return CHAPTERS; }
    chapter(t) { return [...CHAPTERS].reverse().find(chapter=>t>=chapter.at)||CHAPTERS[0]; }
    constructor() {
      this.air=new window.JourneyAir();
      this.clouds=new window.JourneyClouds();
      this.water=new window.JourneyWater();
      this.encounters=new window.JourneyEncounters();

      this.threads=Array.from({length:5600},(_,i)=>({
        x:mod(i*557.731,1100)-100, y:mod(i*331.793,1480),
        phase:i*2.39996, length:12+mod(i*7.37,36), tone:i%5,
      }));
      this.openingMotes=Array.from({length:760},(_,i)=>({
        x:mod(i*557.731,1120)-110,y:mod(i*331.793,1480)-140,
        phase:i*2.39996,radius:0.65+mod(i*1.73,1.05),tone:i%3,
      }));
      let seed=76139;
      const random=(a,b)=>{seed=seed*16807%2147483647;return a+(b-a)*seed/2147483647;};

      this.leaves=[];
      for(let attempt=0;this.leaves.length<18&&attempt<500;attempt++){
        const leaf={x:random(45,855),y:random(0,2600),r:random(28,61),phase:random(0,TAU)};
        if(this.leaves.some(other=>Math.hypot(leaf.x-other.x,Math.min(Math.abs(leaf.y-other.y),2600-Math.abs(leaf.y-other.y)))<leaf.r+other.r+26))continue;
        leaf.flower=[1,6,12,16].includes(this.leaves.length);
        this.leaves.push(leaf);
      }
      this.pondEvents=null;

      this.wheat=Array.from({length:480},()=>({x:random(18,882),y:random(0,2200),
        height:random(46,105),ear:random(14,26),phase:random(0,TAU),tone:Math.floor(random(0,3))}));
      this.slopeGrass=Array.from({length:1800},()=>({x:random(-30,930),y:random(0,2200),
        length:random(8,25),phase:random(0,TAU),tone:Math.floor(random(0,3))}));
      this.mountains=Array.from({length:5},(_,i)=>({phase:i*1.73,peak:random(270,650)}));
      this.rocks=Array.from({length:90},(_,i)=>({band:i%5,x:random(-20,920),offset:random(100,470),r:random(3,14),phase:random(0,TAU)}));
      this.trees=[];
      for(let attempt=0;this.trees.length<23&&attempt<500;attempt++){
        const tree={x:random(50,850),y:random(0,2600),size:random(0.75,1.2),phase:random(0,TAU)};
        if(this.trees.some(other=>Math.hypot(tree.x-other.x,Math.min(Math.abs(tree.y-other.y),2600-Math.abs(tree.y-other.y)))<155))continue;
        this.trees.push(tree);
      }
      this.trees.forEach((tree,i)=>{
        tree.band=i%5;tree.y=this.ridgeY(tree.x,tree.band)+random(140,370);
        tree.form=i%2;tree.adultHeight=random(85,245);tree.width=random(28,82);
        tree.stretch=random(0.75,1.55);tree.lean=random(-28,28);tree.tone=i%3;
        tree.lobes=Array.from({length:Math.floor(random(6,13))},()=>({
          x:random(-0.7,0.7),y:random(-0.6,0.5),r:random(0.32,0.56)}));
      });
      this.openingSeeds=Array.from({length:96},(_,i)=>{
        const angle=i*2.39996,r=112*Math.sqrt((i+0.5)/96);
        return {id:i,angle,x:Math.cos(angle)*r,y:Math.sin(angle)*r,radius:7+2*r/112};
      });
      this.heroSeed=this.openingSeeds.reduce((best,seed)=>
        Math.hypot(seed.x-78,seed.y+65)<Math.hypot(best.x-78,best.y+65)?seed:best);

      this.filaments=Array.from({length:137},(_,i)=>({id:i,angle:-Math.PI+i*Math.PI/136,dropAt:Infinity}));
      this.drifters=Array.from({length:44},(_,i)=>{
        const slot=(i*29)%this.filaments.length,born=4.65+i*0.485;
        this.filaments[slot].dropAt=born;
        return {slot,born,size:5.8+mod(i*1.73,4.2),side:i%2?1:-1,phase:i*2.39996};
      });
      this.sowing=[];
      for(const filament of this.filaments.filter(f=>!Number.isFinite(f.dropAt))){

        const a=random(0,TAU),r=Math.sqrt(random(0,1));
        const x=720+Math.cos(a)*145*r,y=1000+Math.sin(a)*140*r;
        const delay=random(0,0.18),reach=Math.hypot(x-710,y-875);
        const flight=0.85+reach/520+random(0,0.16);
        this.sowing.push({slot:filament.id,x,y,angle:Math.atan2(y-875,x-710),
          size:random(4.5,7),delay,born:27.65+delay,flight,
          wake:0.12+random(0,0.25),growDuration:random(0.8,1.15),phase:random(0,TAU)});
      }

      this.patches=[{x:720,y:1000,rx:170,ry:175,delay:0},
        {x:415,y:1070,rx:195,ry:145,delay:0.12},{x:165,y:840,rx:160,ry:210,delay:0.6},
        {x:490,y:690,rx:180,ry:180,delay:0.4},{x:780,y:425,rx:140,ry:220,delay:0.85},
        {x:370,y:330,rx:185,ry:175,delay:1.18},{x:120,y:100,rx:155,ry:155,delay:1.65}];
      const plant=(x,y,born,duration,local)=>{
        const rank=random(0,1),size=rank<0.27?random(0.5,0.75):rank<0.9?random(0.85,1.3):random(1.5,1.85);
        return {x,y,born,duration,local,size,phase:random(0,TAU),height:random(23,55)*size,
          leaves:Math.floor(random(3,6)),bloom:random(0,1)<0.63,
          radius:rank<0.27?random(6,9):rank<0.9?random(10,16):random(18,23),
          color:Math.floor(random(0,4)),petals:random(0,1)<0.7?5:6,
          flowerAt:born+duration+random(0.02,0.14),flowerDuration:random(0.42,0.62)};
      };
      this.colony=this.sowing.map(seed=>plant(seed.x,seed.y,seed.born+seed.flight+seed.wake,seed.growDuration,true));
      for(let i=0;i<32;i++){
        const a=random(0,TAU),r=Math.sqrt(random(0,1));
        const x=720+Math.cos(a)*165*r,y=1000+Math.sin(a)*155*r;
        const arrival=this.sowing.reduce((first,seed)=>Math.min(first,
          seed.born+seed.flight+seed.wake+Math.hypot(seed.x-x,seed.y-y)/190),Infinity);
        this.colony.push(plant(x,y,arrival+random(0.02,0.16),random(0.7,1),true));
      }
      this.localGrowthComplete=Math.max(...this.colony.map(p=>p.born+p.duration));
      for(let attempt=0;this.colony.length<620&&attempt<18000;attempt++){
        const x=random(15,885),y=random(45,1185);
        if(Math.hypot((x-720)/175,(y-1000)/175)<1)continue;
        const patch=this.nearestPatch(x,y);
        if(random(0,1)>0.13+0.87*Math.exp(-patch.distance*1.7))continue;
        if(this.colony.some(p=>Math.hypot(p.x-x,p.y-y)<19))continue;
        const reach=Math.max(0,Math.hypot(x-720,y-1000)-175);
        const arrival=this.localGrowthComplete+0.16+reach/490+patch.patch.delay*0.23;
        this.colony.push(plant(x,y,arrival+random(0.02,0.22),random(0.65,0.92),false));
      }
      this.colony.sort((a,b)=>a.y-b.y);

    }
    nearestPatch(x,y) {
      let best={patch:this.patches[0],distance:Infinity};
      for(const patch of this.patches){
        const distance=((x-patch.x)/patch.rx)**2+((y-patch.y)/patch.ry)**2;
        if(distance<best.distance)best={patch,distance};
      }
      return best;
    }
    growthCover(t,x,y) {
      if(t<28.5)return 0;
      const {patch,distance}=this.nearestPatch(x,y);
      const local=patch===this.patches[0];
      const born=local?29:this.localGrowthComplete+0.16+Math.max(0,Math.hypot(x-720,y-1000)-175)/490+patch.delay*0.23;
      return smooth(born,born+0.9,t)*Math.exp(-distance*1.4);
    }
    shedCount(t) { return this.drifters.reduce((n,seed)=>n+smooth(seed.born,seed.born+0.12,t),0); }
    tuftRadius(t) { return 42-this.shedCount(t)*0.22; }
    filamentShape(f,thinning) {
      const rank=mod(f.id*0.618034,1);

      return {angle:f.angle,length:1-thinning*(0.025+rank*0.13),
        tip:1-thinning*(0.3+rank*0.5),weight:1-thinning*rank*0.16};
    }
    filamentState(t) {
      const thinning=this.shedCount(t)/this.drifters.length;
      return this.filaments.map(f=>{
        const final=this.sowing.find(seed=>seed.slot===f.id);
        const born=final?final.born:f.dropAt;
        return Object.assign({},this.filamentShape(f,thinning),{opacity:1-smooth(born,born+0.12,t)});
      });
    }
    gustAt(t,x) {
      const front=710+(t-27.65)*1000;
      return Math.exp(-(((x-front)/205)**2))*smooth(26.6,27,t)*(1-smooth(28.1,28.6,t));
    }
    openingGrowth(seed,t) {
      const rank=Math.hypot(seed.x,seed.y)/112;
      return smooth(0.62+rank*0.18,0.92+rank*0.5,t);
    }
    openingEvent(t) {
      const age=Math.max(0,t-OPENING_BURST);
      return {age,
        cx:450+Math.sin(Math.min(t,OPENING_BURST)*1.3)*7,cy:530+this.distance(t)*0.72,
        color:smooth(OPENING_BURST,OPENING_BURST+0.24,t),
        settle:smooth(2.08,3.15,t),
        release:smooth(OPENING_BURST,OPENING_BURST+0.18,t),
        radius:355*smooth(0,0.62,age)+Math.max(0,age-0.62)*78,
        recoil:28*Math.sin(Math.max(0,age-0.48)*13)*Math.exp(-Math.max(0,age-0.48)*3.1)*smooth(0.48,0.58,age),
        field:smooth(0.03,0.5,t)*(1-smooth(2.65,4.65,t)),
        water:smooth(2.65,4.65,t),
        motes:smooth(0.02,0.32,t)*(1-smooth(2.25,3.75,t)),
        leaves:smooth(2.75,3.65,t),
      };
    }
    openingDisplacement(x,y,event) {
      const rx=x-event.cx,ry=y-event.cy,r=Math.max(1,Math.hypot(rx,ry));
      const nx=rx/r,ny=ry/r,angle=Math.atan2(ry,rx);
      const roughness=1+0.026*Math.sin(angle*7+event.age*2.1)+0.018*Math.sin(angle*13-event.age*1.7);
      const cleared=Math.max(0,(event.radius+event.recoil)*roughness);

      const outward=Math.hypot(r,cleared)-r;
      const edge=Math.hypot(r,cleared)-cleared;
      const jet=Math.exp(-((edge/145)**2))*event.release;
      return {x:x+nx*outward,y:y+ny*outward,nx,ny,jet};
    }
    openingAir(ctx,s,event) {
      const t=s.time,d=this.distance(t);
      ctx.save();ctx.lineCap='round';
      for(let tone=0;tone<5;tone++){
        ctx.strokeStyle=['#b2bca6','#d0dac5','#e0e9d5','#f2f1d9','#8ba897'][tone];
        ctx.globalAlpha=[0.13,0.22,0.28,0.43,0.12][tone]*event.field;
        ctx.lineWidth=tone===3?1.05:0.7;ctx.beginPath();
        for(let i=tone;i<this.threads.length;i+=5){
          const f=this.threads[i],y=mod(f.y+d,1480)-140;
          const x=f.x+37*Math.sin(y*0.004-t*0.7)+18*Math.sin(f.phase+t*0.6);
          const p=this.openingDisplacement(x,y,event);
          const winding=-0.9+0.65*Math.sin(y*0.004+0.7*Math.sin(x*0.005))+0.5*Math.sin(x*0.004-y*0.002+t*0.3);
          const vx=Math.sin(winding)*(1-p.jet)+p.nx*p.jet*1.65;
          const vy=Math.cos(winding)*(1-p.jet)+p.ny*p.jet*1.65;
          const length=f.length*(0.48+smooth(0.1,1.45,t)*0.68)*(1+p.jet*1.55);
          const bend=Math.sin(f.phase+t*0.65)*2.2;
          ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(p.x+vx*length*0.45+bend,p.y+vy*length*0.45,p.x+vx*length,p.y+vy*length);
        }ctx.stroke();
      }

      for(let tone=0;tone<3;tone++){
        ctx.fillStyle=['#f4efd3','#d9e5d2','#b2c7b6'][tone];
        ctx.globalAlpha=[0.72,0.48,0.32][tone]*event.motes;ctx.beginPath();
        for(let i=tone;i<this.openingMotes.length;i+=3){
          const f=this.openingMotes[i];
          const x=f.x+18*Math.sin(t*0.4+f.phase)-t*9;
          const y=mod(f.y+140+t*12+d,1480)-140;
          const p=this.openingDisplacement(x,y,event);
          const angle=Math.atan2(p.ny,p.nx),r=f.radius;
          ctx.moveTo(p.x+Math.cos(angle)*r*(1+p.jet*2.1),p.y+Math.sin(angle)*r*(1+p.jet*2.1));
          ctx.ellipse(p.x,p.y,r*(1+p.jet*2.1),r,angle,0,TAU);
        }ctx.fill();
      }
      ctx.restore();
    }
    openingPose(seed,t) {
      const burst=smooth(OPENING_BURST,2.6,t),growth=this.openingGrowth(seed,t);
      const drift=Math.max(0,t-2.3);

      const release=seed.id===this.heroSeed.id?burst:
        1-Math.exp(-Math.max(0,t-OPENING_BURST)*5.2)*(1-smooth(OPENING_BURST,2.6,t));
      const reach=seed.id===this.heroSeed.id?1:1.55;
      const travel=release*(44+mod(seed.id*31,95))*reach+76*(1-Math.exp(-drift*0.8))*smooth(2.3,2.65,t);
      return {x:450+Math.sin(Math.min(t,1.65)*1.3)*7+seed.x*growth+Math.cos(seed.angle)*travel+burst*45,
        y:530+seed.y*growth+Math.sin(seed.angle)*travel,
        radius:seed.radius*growth,angle:seed.angle+Math.PI/2+burst*Math.sin(seed.id)*0.7};
    }
    entryProgress(t) { return smooth(2.35,4.75,t); }
    entryPose(t,courseAt) {
      const start=2.28,end=4.75,span=end-start;
      const source=this.openingPose(this.heroSeed,start),target=this.flightPose(end,courseAt);
      const turn=TAU*Math.round((source.angle-target.angle)/TAU);
      if(t<=start)return this.openingPose(this.heroSeed,t);
      if(t>=end){const pose=this.flightPose(t,courseAt);return Object.assign({},pose,{angle:pose.angle+turn});}
      const sourceBefore=this.openingPose(this.heroSeed,start-0.002),sourceAfter=this.openingPose(this.heroSeed,start+0.002);
      const targetBefore=this.flightPose(end-0.002,courseAt),targetAfter=this.flightPose(end+0.002,courseAt);
      const u=(t-start)/span,u2=u*u,u3=u2*u;

      const join=(key,offset=0)=>
        (2*u3-3*u2+1)*source[key]+(u3-2*u2+u)*span*(sourceAfter[key]-sourceBefore[key])/0.004
        +(-2*u3+3*u2)*(target[key]+offset)+(u3-u2)*span*(targetAfter[key]-targetBefore[key])/0.004;
      return {x:join('x'),y:join('y'),angle:join('angle',turn)};
    }
    subjectPose(t,courseAt) {
      const source=this.openingPose(this.heroSeed,t),pose=this.entryPose(t,courseAt);
      const follow=this.entryProgress(t),settle=smooth(26.1,27.15,t),strength=this.gustAt(t,710);
      const restingAngle=settle>0?this.entryPose(26.1,courseAt).angle:pose.angle;
      return {x:pose.x*(1-settle)+710*settle+strength*30,
        y:pose.y*(1-settle)+875*settle-strength*10,
        radius:source.radius+(this.tuftRadius(t)-source.radius)*follow,
        angle:pose.angle+(restingAngle-pose.angle)*settle-strength*0.16};
    }
    gust(ctx,t) {
      if(t<26.8||t>28.55)return;
      const front=710+(t-27.65)*1000;
      ctx.save();ctx.strokeStyle='#e1eabb';ctx.lineWidth=1.1;
      ctx.globalAlpha=0.35*smooth(26.8,27.1,t)*(1-smooth(28,28.55,t));ctx.beginPath();
      for(let i=0;i<17;i++){
        const x=front+Math.sin(i*2.4)*90,y=130+i*58;
        ctx.moveTo(x-145,y+22);ctx.bezierCurveTo(x-70,y+18,x-35,y-14,x+15,y-20);
      }ctx.stroke();ctx.restore();
    }
    flightPose(t,courseAt) {
      const x=courseAt(t)+Math.sin(t*1.12)*32+Math.sin(t*2.07+0.6)*12;
      const y=470+Math.sin(t*0.86)*27+Math.sin(t*1.83)*13;
      const vx=(courseAt(t+0.04)-courseAt(t-0.04))/0.08+Math.cos(t*1.12)*35.84+Math.cos(t*2.07+0.6)*24.84;
      const gust=Math.sin(t*0.66-0.8)*0.9+Math.sin(t*1.73+0.6)*0.3;

      const roll=TAU*smooth(7.2,9.1,t)-Math.PI*0.45*Math.sin(Math.PI*smooth(16.1,18.2,t));
      return {x,y,angle:-0.15+Math.atan2(vx,125)*0.85+gust+roll};
    }
    name(t) { return this.chapter(t).label; }
    distance(t) {

      const integral=(v)=>{const u=Math.max(0,Math.min(1,v));return u*u*u-u*u*u*u/2;};
      const ramp=2.6*integral((t-2.2)/2.6)+Math.max(0,t-4.8);
      const brake=3.5*integral((t-25)/3.5)+Math.max(0,t-28.5);
      return (ramp-brake)*620;
    }
    flow(ctx,s,color,inks) {
      const t=s.time,d=this.distance(t),trail=this.air.trail(s,this);
      const opening=t<4.75?this.openingEvent(t):null;
      if(opening){
        const dark=[3,4,5],peak=[4,145,126],water=[7,121,106];
        ctx.fillStyle=`rgb(${dark.map((value,i)=>Math.round(value+((peak[i]+(water[i]-peak[i])*opening.settle)-value)*opening.color)).join(',')})`;
      }else ctx.fillStyle=color;
      ctx.fillRect(0,0,900,1200);
      ctx.lineCap='round';
      ctx.save();ctx.globalAlpha*=opening?opening.water:1;
      if(!opening||opening.water>0){
        for(let tone=0;tone<5;tone++){
          ctx.strokeStyle=inks[tone];ctx.lineWidth=tone===3?1.2:0.75;ctx.beginPath();
          for(let i=tone;i<this.threads.length;i+=5){
            const f=this.threads[i];
            const y=mod(f.y+d,1480)-140;
            let x=f.x+37*Math.sin(y*0.004-t*0.7)+18*Math.sin(f.phase+t*0.6);
            const wave=Math.sin(x*0.006+y*0.004-t*0.85)+0.55*Math.sin(y*0.009-x*0.003+t*0.55);
            const wake=this.air.influence(trail,x,y);

            x+=wake.side*wake.strength*22;
            const angle=wave*0.8+wake.strength*(wake.side*0.9-wake.dx*0.5);
            const len=f.length*(0.8+0.45*Math.sin(x*0.005+y*0.002)**2)*(1-wake.strength*0.2);
            ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.sin(angle)*len*0.55,y+Math.cos(angle)*len*0.4,x+Math.sin(angle+0.12)*len,y+Math.cos(angle)*len);
          }ctx.stroke();
        }
      }
      ctx.restore();
      if(opening&&(opening.field>0||opening.motes>0))this.openingAir(ctx,s,opening);
    }
    floret(ctx,x,y,r,angle,alpha=1,filaments=null,stemAlpha=1) {
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);
      ctx.globalAlpha=alpha*stemAlpha;ctx.strokeStyle='#fffde9';ctx.lineWidth=0.85;ctx.beginPath();
      ctx.moveTo(0,0);ctx.quadraticCurveTo(r*0.2,r,0,r*2.1);ctx.stroke();
      const hairs=filaments?filaments.length:(r>20?37:11);
      for(let j=0;j<hairs;j++){
        const opacity=filaments?filaments[j].opacity:1;
        if(opacity<=0)continue;
        ctx.globalAlpha=alpha*opacity;
        const a=filaments?filaments[j].angle:-Math.PI+j*Math.PI/(hairs-1);
        const strand=filaments&&filaments[j],length=r*(strand&&strand.length!=null?strand.length:1),tip=strand&&strand.tip!=null?strand.tip:1;
        const dx=Math.cos(a)*length,dy=Math.sin(a)*length;
        ctx.lineWidth=0.85*(strand&&strand.weight!=null?strand.weight:1);
        ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(dx*0.5,dy*0.7,dx,dy);
        ctx.moveTo(dx-2*tip,dy-2*tip);ctx.lineTo(dx+2*tip,dy+tip);ctx.stroke();
      }
      ctx.globalAlpha=alpha*stemAlpha;ctx.fillStyle='#dec39a';ctx.beginPath();ctx.ellipse(0,r*2.15,1.9,r*0.26,0,0,TAU);ctx.fill();ctx.restore();
    }
    lotus(ctx,x,y,r,growth,phase) {
      ctx.save();ctx.translate(x,y);ctx.rotate(phase*0.1);
      ctx.fillStyle='#064d44';ctx.beginPath();ctx.ellipse(5,10,r*1.08,r*0.82,0,0,TAU);ctx.fill();
      ctx.fillStyle='#66b94d';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,0.16,TAU-0.21);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#b1d87a';ctx.lineWidth=0.7;ctx.beginPath();
      for(let j=1;j<12;j++){const a=j*TAU/12;ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a+0.2)*r*0.55,Math.sin(a+0.2)*r*0.55,Math.cos(a)*r*0.92,Math.sin(a)*r*0.92);}ctx.stroke();
      if(growth>0){
        ctx.translate(-r*0.25,-r*0.1);
        for(let ring=0;ring<2;ring++)for(let j=0;j<8;j++) {
          ctx.save();ctx.rotate(j*TAU/8+ring*0.4);ctx.fillStyle=ring?'#fff0d8':'#f6aeb5';
          const length=(ring?22:36)*growth;
          ctx.beginPath();ctx.moveTo(0,5);ctx.bezierCurveTo(-14*growth,-length*0.4,-9*growth,-length*0.8,0,-length);ctx.bezierCurveTo(9*growth,-length*0.8,14*growth,-length*0.4,0,5);ctx.fill();ctx.restore();
        }
        ctx.fillStyle='#f4cc55';ctx.beginPath();ctx.arc(0,0,5*growth,0,TAU);ctx.fill();
      }ctx.restore();
    }
    leafPosition(leaf,t) {
      return {x:leaf.x+Math.sin(t+leaf.phase)*8,
        y:mod(leaf.y+this.distance(t)-this.distance(3.5),2600)-180};
    }
    pond(ctx,s) {
      this.flow(ctx,s,'#07796a',['#148f79','#249b80','#39a88b','#65b99c','#086958']);
      this.water.draw(ctx,s,this);
      const leaves=s.time<3.65?this.openingEvent(s.time).leaves:1;
      if(leaves===0)return;
      ctx.save();ctx.globalAlpha*=leaves;
      for(const leaf of this.leaves) {
        const {x,y}=this.leafPosition(leaf,s.time);

        if(y+leaf.r+50<0||y-leaf.r-50>1200)continue;
        const growth=smooth(470,710,y)*smooth(4,5,s.time);
        ctx.strokeStyle='rgba(182,239,177,0.23)';ctx.lineWidth=1;
        for(let ring=0;ring<1;ring++){
          ctx.beginPath();ctx.ellipse(x,y+8,leaf.r+12+growth*13,(leaf.r+12+growth*13)*0.78,Math.sin(leaf.phase)*0.15,0,TAU);ctx.stroke();
        }
        this.lotus(ctx,x,y,leaf.r,leaf.flower?growth:0,leaf.phase);
      }
      ctx.restore();
      this.pondAnimals(ctx,s);
    }
    frogEvents(courseAt) {
      if(this.pondEvents&&this.pondEvents.courseAt===courseAt)return this.pondEvents.events;
      const candidates=[];

      for(const leaf of this.leaves){
        if(leaf.flower)continue;
        for(let step=0;step<=290;step++){
          const at=3.8+step*0.02,p=this.leafPosition(leaf,at),body=this.subjectPose(at,courseAt);
          const dx=p.x-body.x,dy=p.y-body.y,distance=Math.hypot(dx,dy);
          if(distance>175||dy>25||p.y<100)continue;
          const length=leaf.r+65,normal=distance||1;
          candidates.push({leaf,at,x:p.x,y:p.y,dx:dx/normal*length,dy:dy/normal*length,
            duration:0.46,size:13+leaf.r*0.04});break;
        }
      }
      const events=[];
      for(const event of candidates.sort((a,b)=>a.at-b.at)){
        if(events.every(other=>Math.abs(event.at-other.at)>1.05))events.push(event);
        if(events.length===3)break;
      }
      this.pondEvents={courseAt,events};return events;
    }
    frogPose(event,t) {
      const age=t-event.at,drift=this.distance(t)-this.distance(event.at);
      const u=Math.max(0,Math.min(1,age/event.duration)),lift=Math.sin(u*Math.PI)*64;
      const resting=this.leafPosition(event.leaf,t);
      return {age,u,x:age<0?resting.x:event.x+event.dx*u,
        y:age<0?resting.y:event.y+drift+event.dy*u-lift,
        surfaceY:event.y+drift+event.dy*u,landX:event.x+event.dx,
        landY:event.y+drift+event.dy,angle:Math.atan2(event.dy,event.dx)+Math.PI/2};
    }
    frog(ctx,size,stretch,t,phase) {
      const breath=1+Math.sin(t*1.6+phase)*0.035;
      ctx.scale(breath*(1-stretch*0.22),1+stretch*0.45);
      ctx.strokeStyle='#406c35';ctx.lineWidth=size*0.23;ctx.lineCap='round';
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(side*size*0.45,size*0.4);
        ctx.lineTo(side*size*(0.95-stretch*0.22),size*(0.45+stretch*0.65));
        ctx.lineTo(side*size*0.53,size*(0.9+stretch*0.52));ctx.stroke();
        ctx.beginPath();ctx.moveTo(side*size*0.38,-size*0.3);
        ctx.lineTo(side*size*0.82,-size*0.06);ctx.lineTo(side*size*0.94,-size*0.38);ctx.stroke();
      }
      ctx.fillStyle='#86b64d';ctx.beginPath();ctx.ellipse(0,0,size*0.58,size*0.83,0,0,TAU);ctx.fill();
      ctx.fillStyle='#bed779';ctx.beginPath();ctx.ellipse(-size*0.12,-size*0.1,size*0.2,size*0.6,-0.15,0,TAU);ctx.fill();
      for(const side of [-1,1]){
        ctx.fillStyle='#a4c566';ctx.beginPath();ctx.arc(side*size*0.4,-size*0.59,size*0.23,0,TAU);ctx.fill();
        ctx.fillStyle='#254d31';ctx.beginPath();ctx.arc(side*size*0.4,-size*0.65,size*0.1,0,TAU);ctx.fill();
        ctx.fillStyle='#edebba';ctx.beginPath();ctx.arc(side*size*0.4+1,-size*0.69,size*0.035,0,TAU);ctx.fill();
      }
    }
    pondAnimals(ctx,s) {
      const visibility=s.time<3.65?this.openingEvent(s.time).leaves:1;
      for(const event of this.frogEvents(s.courseAt)){
        const p=this.frogPose(event,s.time),after=p.age-event.duration;
        if(p.y<-90||p.landY>1370||after>1.2)continue;
        if(after<0){

          const crouch=smooth(-0.13,0,p.age)*(1-smooth(0,0.08,p.age));
          if(p.age>=0){ctx.save();ctx.globalAlpha=0.2*(1-p.u)*visibility;ctx.fillStyle='#044d45';
            ctx.beginPath();ctx.ellipse(p.x+5,p.surfaceY+8,event.size*0.8,event.size*0.42,0,0,TAU);ctx.fill();ctx.restore();}
          ctx.save();ctx.globalAlpha=(1-smooth(0.86,1,p.u))*visibility;ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(1+crouch*0.15,1-crouch*0.2);
          this.frog(ctx,event.size,Math.sin(p.u*Math.PI),s.time,event.leaf.phase);ctx.restore();
        }else{
          ctx.save();ctx.strokeStyle='#a7d6ad';ctx.fillStyle='#c8e1bd';ctx.lineWidth=1.25;
          for(let ring=0;ring<3;ring++){
            const age=after-ring*0.11;if(age<0)continue;
            const radius=5+age*49;ctx.globalAlpha=(1-smooth(0.08,0.9,age))*0.52*visibility;
            ctx.beginPath();ctx.ellipse(p.landX,p.landY,radius,radius*0.61,0,0,TAU);ctx.stroke();
          }
          for(let i=0;i<7&&after<0.4;i++){
            const a=i*2.39996,reach=10+after*53;
            ctx.globalAlpha=(1-smooth(0.08,0.4,after))*0.75*visibility;
            ctx.beginPath();ctx.ellipse(p.landX+Math.cos(a)*reach,p.landY+Math.sin(a)*reach*0.58-Math.sin(after/0.4*Math.PI)*18,1.1,2.4,a,0,TAU);ctx.fill();
          }ctx.restore();
        }
      }
    }
    groundPosition(item,t,start,period) {
      return {x:item.x,y:mod(item.y+this.distance(t)-this.distance(start)+200,period)-200};
    }
    sprout(ctx,x,y,g,size,phase) {
      if(g<=0)return;
      const height=(28+size*10)*g,sway=Math.sin(phase)*3*g;
      ctx.strokeStyle='#c5dc86';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-3,y-height*0.6,x+sway,y-height);ctx.stroke();
      ctx.fillStyle='#b8d977';
      for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(x+side*9*size*g+sway*0.5,y-height*0.65,12*size*g,4.2*size*g,side*0.48,0,TAU);ctx.fill();}
    }
    flowerHead(ctx,r,phase,petals,color,open) {
      if(open<=0)return;
      const colors=['#f2ce42','#f7de6c','#e7bd32','#f3e59e'];
      ctx.save();ctx.rotate(phase);ctx.scale(1,0.68+0.25*Math.abs(Math.sin(phase)));
      ctx.fillStyle=colors[color];
      for(let i=0;i<petals;i++){
        const a=i*TAU/petals+Math.sin(phase+i)*0.08;
        const length=r*open*(0.88+Math.sin(i*2.3+phase)*0.12);
        ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,0);
        ctx.bezierCurveTo(length*0.25,-length*0.25,length*0.84,-length*0.28,length,0);
        ctx.bezierCurveTo(length*0.76,length*0.27,length*0.2,length*0.22,0,0);ctx.fill();ctx.restore();
      }
      ctx.fillStyle='#b99438';ctx.beginPath();ctx.ellipse(0,0,Math.max(1,r*0.095)*open,Math.max(1,r*0.095)*open,0,0,TAU);ctx.fill();ctx.restore();
    }
    wheatBend(stalk,x,y,t,trail) {

      const idle=4+Math.sin(stalk.x*0.006+stalk.y*0.008-t*0.38)*2+Math.sin(stalk.phase+t*0.23)*0.8;
      const wake=this.air.influence(trail,x,y),response=wake.strength*(1+Math.sin(wake.age*3)*0.08);
      return {idle,response,lean:idle+response*(wake.dx*70+wake.side*9),
        height:stalk.height*(1-response*0.12)-wake.dy*response*21};
    }
    wheatStalk(ctx,stalk,x,y,t,trail) {
      const bend=this.wheatBend(stalk,x,y,t,trail),lean=bend.lean,h=bend.height;
      ctx.strokeStyle=['#d4c17b','#ddcd91','#a99554'][stalk.tone];ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+lean*0.25,y-h*0.62,x+lean,y-h);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+lean*0.18,y-h*0.45);ctx.quadraticCurveTo(x-16,y-h*0.52,x-18,y-h*0.69);ctx.stroke();
      ctx.save();ctx.translate(x+lean,y-h);ctx.rotate(lean/h*0.45);
      ctx.fillStyle=['#eadca4','#e1ce8b','#d6be75'][stalk.tone];ctx.strokeStyle='#ebdc9d';ctx.lineWidth=0.65;
      for(let i=0;i<6;i++){
        const side=i%2?1:-1,by=-i*stalk.ear/6,w=2.9-i*0.16;
        ctx.beginPath();ctx.ellipse(side*2.1,by,w,stalk.ear*0.18,side*0.45,0,TAU);ctx.fill();
        ctx.beginPath();ctx.moveTo(side*3,by-1);ctx.lineTo(side*(6-i*0.35),by-stalk.ear*0.55);ctx.stroke();
      }ctx.restore();
    }
    wheatField(ctx,s) {
      const d=this.distance(s.time)-this.distance(9.4),trail=this.air.trail(s,this);
      ctx.fillStyle='#b6a96d';ctx.fillRect(0,0,900,1200);

      for(let band=0;band<5;band++){
        const y=mod(band*520+d+180,2600)-400;
        ctx.fillStyle=band%2?'#beaf73':'#ac9f64';ctx.beginPath();ctx.moveTo(-30,y+80);
        ctx.bezierCurveTo(210,y-85,620,y+195,930,y+15);ctx.lineTo(930,y+245);
        ctx.bezierCurveTo(610,y+375,245,y+95,-30,y+325);ctx.closePath();ctx.fill();
      }
      for(let tone=0;tone<3;tone++){
        ctx.strokeStyle=['#a39457','#c8b77a','#d8c78d'][tone];ctx.lineWidth=0.8;ctx.beginPath();
        for(const grass of this.slopeGrass){
          if(grass.tone!==tone)continue;
          const y=mod(grass.y+d+60,2200)-60;if(y<-30||y>1230)continue;
          const wake=this.air.influence(trail,grass.x,y);
          const bend=2+Math.sin(grass.x*0.005+grass.y*0.009-s.time*0.32+grass.phase)*1.8
            +wake.strength*(wake.dx*24+wake.side*5);
          const length=grass.length-wake.dy*wake.strength*7;
          ctx.moveTo(grass.x,y);ctx.quadraticCurveTo(grass.x+bend*0.4,y-length*0.6,grass.x+bend,y-length);
        }ctx.stroke();
      }
      const stalks=this.wheat.map(stalk=>Object.assign({stalk},this.groundPosition(stalk,s.time,9.4,2200)))
        .filter(p=>p.y>-25&&p.y<1350).sort((a,b)=>a.y-b.y);
      this.air.wheatUnderlay(ctx,s,this);
      this.encounters.drawWheat(ctx,s,this);
      for(const {stalk,x,y} of stalks)this.wheatStalk(ctx,stalk,x,y,s.time,trail);
    }
    growingTree(ctx,tree,x,y,g,t,response=0) {
      const height=24+g*tree.adultHeight,crown=8+g*tree.width;
      const lean=tree.lean*g+Math.sin(t*1.6+tree.phase)*(2+g*2)+response;
      const palettes=[['#416f3b','#57853f','#789e4b'],['#4f783c','#749449','#98ae5c'],['#3e7150','#54865b','#82a66b']];
      const palette=palettes[tree.tone];
      ctx.fillStyle='rgba(34,74,32,0.18)';ctx.beginPath();ctx.ellipse(x+height*0.15,y+7,crown*0.8,crown*0.27,-0.25,0,TAU);ctx.fill();
      ctx.strokeStyle='#706644';ctx.lineWidth=1.5+g*(tree.width*0.065);ctx.lineCap='round';ctx.beginPath();
      ctx.moveTo(x,y);ctx.bezierCurveTo(x-lean*0.18,y-height*0.3,x+lean*0.72,y-height*0.75,x+lean,y-height);ctx.stroke();
        const stretch=tree.form===1?tree.stretch*1.35:tree.stretch*0.8;
        for(let i=0;i<tree.lobes.length;i++){
          const l=tree.lobes[i],cx=x+lean+l.x*crown,cy=y-height+l.y*crown*stretch;
          ctx.strokeStyle='#747449';ctx.lineWidth=1+g*1.5;ctx.beginPath();ctx.moveTo(x+lean*0.6,y-height*0.65);ctx.lineTo(cx,cy);ctx.stroke();
        }
        for(let i=0;i<tree.lobes.length;i++){
          const l=tree.lobes[i],r=crown*l.r;
          ctx.fillStyle=palette[i%3];ctx.beginPath();ctx.ellipse(x+lean+l.x*crown,y-height+l.y*crown*stretch,r,r*stretch,tree.lean*0.005,0,TAU);ctx.fill();
        }
    }
    ridgeY(x,band) {
      const m=this.mountains[mod(band,5)];

      return band*600+(x-450)*0.17-150*Math.exp(-(((x-m.peak)/160)**2))
        +28*Math.sin(x*0.014+m.phase)+18*Math.sin(x*0.033+m.phase);
    }
    mountain(ctx,band,shift) {
      const points=[];
      for(let x=-100;x<=1000;x+=20)points.push({x,y:this.ridgeY(x,band)+shift});
      const base=band*600+shift;
      ctx.fillStyle=['#87916c','#8f956e','#858c67','#8b916b','#8c936c'][band];
      ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(1000,base+760);ctx.lineTo(-100,base+760);ctx.closePath();ctx.fill();

      const peak=this.mountains[band].peak,py=this.ridgeY(peak,band)+shift;
      ctx.fillStyle='#667b60';ctx.beginPath();ctx.moveTo(peak,py);
      for(const p of points)if(p.x>peak)ctx.lineTo(p.x,p.y);
      ctx.lineTo(1000,base+680);ctx.lineTo(peak+145,base+490);ctx.lineTo(peak+52,base+190);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(191,183,132,0.34)';ctx.beginPath();ctx.moveTo(peak,py);ctx.lineTo(peak-165,base+240);ctx.lineTo(peak-360,base+370);ctx.lineTo(peak-120,base+135);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(206,201,150,0.51)';ctx.lineWidth=2;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y+1):ctx.moveTo(p.x,p.y+1));ctx.stroke();
      for(let j=0;j<7;j++){
        const x=-30+j*155,ry=this.ridgeY(x,band)+shift;
        ctx.strokeStyle=j%2?'rgba(58,84,57,0.22)':'rgba(184,187,133,0.30)';ctx.lineWidth=j%2?12:3;
        ctx.beginPath();ctx.moveTo(x,ry+24);ctx.bezierCurveTo(x+20,ry+125,x-70,base+260,x-105,base+410);ctx.stroke();
      }
      for(const rock of this.rocks){
        if(rock.band!==band)continue;
        const x=rock.x,y=this.ridgeY(x,band)+shift+rock.offset,r=rock.r;
        ctx.fillStyle='#69755c';ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x-r*0.45,y-r*0.8);ctx.lineTo(x+r*0.35,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x+r*0.4,y+r*0.4);ctx.closePath();ctx.fill();
        ctx.fillStyle='#a8aa83';ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x-r*0.45,y-r*0.8);ctx.lineTo(x+r*0.35,y-r);ctx.lineTo(x,y-r*0.05);ctx.closePath();ctx.fill();
      }
    }
    woodland(ctx,s) {
      const d=this.distance(s.time)-this.distance(14.4);
      ctx.fillStyle='#76876c';ctx.fillRect(0,0,900,1200);
      const ridges=[];
      for(let band=0;band<5;band++){
        const base=band*600;
        const y=mod(base+d+600,3000)-600;
        if(y>1420)continue;
        ridges.push({band,y,shift:y-base});
      }
      ridges.sort((a,b)=>a.y-b.y);
      for(const ridge of ridges){
        this.mountain(ctx,ridge.band,ridge.shift);
        const trees=this.trees.filter(tree=>tree.band===ridge.band).sort((a,b)=>a.y-b.y);
        for(const tree of trees){
          const y=tree.y+ridge.shift;
          if(y<-80||y>1470)continue;
          const response=this.encounters.forestResponse(tree,s.time,this,s.courseAt);
          this.growingTree(ctx,tree,tree.x,y,smooth(460,810,y)*smooth(14.4,15,s.time),s.time,response.dx);
        }
      }
      this.encounters.drawForest(ctx,s,this);
    }
    field(ctx,s,grass) {
      const trail=this.air.trail(s,this);
      const ground=Object.assign({},s,{distance:this.distance(s.time),time:16+(s.time-23.5)*0.7,
        gustAt:x=>this.gustAt(s.time,x),growthCoverAt:(x,y)=>this.growthCover(s.time,x,y),
        wakeAt:(x,y)=>{const wake=this.air.influence(trail,x,y);return wake.strength*(wake.dx*45+wake.side*12);}});
      grass.background(ctx,ground);grass.grass(ctx,ground);
    }
    main(ctx,s) {
      const t=s.time,burst=this.openingEvent(t).release;
      const cx=450+Math.sin(Math.min(t,1.65)*1.3)*7,cy=530;
      if(t<4.8){
        ctx.save();ctx.globalAlpha=smooth(0.1,0.55,t)*(1-smooth(1.05,1.52,t));ctx.strokeStyle='#e8edc2';ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(cx-15,cy+330);ctx.quadraticCurveTo(cx+20,cy+330-smooth(0.1,0.62,t)*200,cx,cy+330*(1-smooth(0.1,0.62,t)));ctx.stroke();ctx.restore();
        for(const seed of this.openingSeeds){
          const pose=this.openingPose(seed,t);
          const opacity=this.openingGrowth(seed,t)*(0.55+0.45*Math.hypot(seed.x,seed.y)/112)*(1-smooth(2.85,4.65,t));
          ctx.save();ctx.globalAlpha=opacity*(1-burst)*0.42;ctx.strokeStyle='#eef4d9';ctx.lineWidth=0.45;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(pose.x,pose.y);ctx.stroke();ctx.restore();

          if(seed.id!==this.heroSeed.id)this.floret(ctx,pose.x,pose.y,pose.radius,pose.angle,opacity*0.85);
        }
      }
      const pose=this.subjectPose(t,s.courseAt),unfold=this.entryProgress(t);

      const strands=this.filamentState(t).map((f,i)=>Object.assign({},f,{opacity:f.opacity*(i%13===0?1:unfold)}));
      const sourceOpacity=(0.55+0.45*Math.hypot(this.heroSeed.x,this.heroSeed.y)/112)*0.85;

      this.floret(ctx,pose.x,pose.y,pose.radius,pose.angle,(sourceOpacity+(1-sourceOpacity)*unfold)*this.openingGrowth(this.heroSeed,t)*(1-smooth(28.3,29.1,t)),strands);
      if(t>=27.65)this.ending(ctx,t,s.courseAt);
    }
    releasePose(seed,courseAt) {
      const body=this.subjectPose(seed.born,courseAt);
      const shape=this.filamentShape(this.filaments[seed.slot],this.shedCount(seed.born)/this.drifters.length);
      const angle=shape.angle,radius=body.radius*shape.length;
      const lx=Math.cos(angle)*radius,ly=Math.sin(angle)*radius;
      return {x:body.x+lx*Math.cos(body.angle)-ly*Math.sin(body.angle),
        y:body.y+lx*Math.sin(body.angle)+ly*Math.cos(body.angle),angle:body.angle};
    }
    driftingPose(seed,t,courseAt) {
      const age=t-seed.born;
      if(age<0||age>3.3)return null;
      const origin=this.releasePose(seed,courseAt),{x,y,angle}=origin;
      return {x:x+seed.side*age*19+Math.sin(age*1.7+seed.phase)*age*9,
        y:y+(this.distance(t)-this.distance(seed.born))*0.52+age*age*16,
        angle:angle+seed.side*age*0.95+Math.sin(age*2+seed.phase)*0.55,
        alpha:smooth(0,0.14,age)*(1-smooth(2.25,3.3,age)),radius:seed.size*(1-age*0.075)};
    }
    drifting(ctx,s) {
      for(const seed of this.drifters){
        const pose=this.driftingPose(seed,s.time,s.courseAt);
        if(!pose||pose.y>1250)continue;
        this.floret(ctx,pose.x,pose.y,pose.radius,pose.angle,pose.alpha*0.85);
      }
    }
    sowingPose(seed,t,courseAt) {
      const age=Math.max(0,t-seed.born);
      const origin=this.releasePose(seed,courseAt);
      const u=Math.max(0,Math.min(1,age/seed.flight));
      const progress=1-(1-u)**3,land=smooth(0.2,1,u);
      const r=seed.size*(1-land*0.2);
      const curl=Math.sin(Math.PI*u)*Math.sin(seed.phase)*65;
      const germinate=seed.born+seed.flight+seed.wake;
      const growth=smooth(germinate,germinate+seed.growDuration,t);
      return {x:origin.x+(seed.x-origin.x)*progress+Math.cos(seed.angle+Math.PI/2)*curl,
        y:origin.y+(seed.y-r*2.15-origin.y)*progress+Math.sin(seed.angle+Math.PI/2)*curl,
        radius:r,angle:(seed.angle-Math.PI/2+Math.sin(age*2+seed.phase)*0.65)*(1-land),
        alpha:smooth(0,0.07,age)*(1-smooth(0.08,0.55,growth)),land,growth};
    }
    colonyPlant(ctx,plant,g,t,openOverride=null) {
      const {x,y,size,phase}=plant;
      const stem=smooth(0.15,1,g),height=plant.height*stem;
      const lean=Math.sin(t*1.1+phase)*height*0.07+Math.sin(phase)*height*0.1;
      ctx.strokeStyle='#779947';ctx.lineWidth=0.9+size*0.4;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-lean*0.1,y-height*0.5,x+lean,y-height);ctx.stroke();

      for(let i=0;i<plant.leaves;i++){
        const leaf=smooth(i*0.08,0.48+i*0.08,g),side=i%2?1:-1;
        const length=(10+Math.sin(phase+i)*3)*size*leaf;
        const by=y-height*(0.18+i*0.13),bx=x+lean*(0.18+i*0.1);
        ctx.fillStyle=['#91b65c','#abc574','#739e4c'][i%3];
        ctx.beginPath();ctx.moveTo(bx,by);
        ctx.bezierCurveTo(bx+side*length*0.42,by-length*0.48,bx+side*length*0.93,by-length*0.5,bx+side*length,by-length*0.42);
        ctx.bezierCurveTo(bx+side*length*0.75,by+length*0.1,bx+side*length*0.25,by+length*0.14,bx,by);ctx.fill();
      }
      if(plant.bloom){
        const open=openOverride===null?smooth(plant.flowerAt,plant.flowerAt+plant.flowerDuration,t):openOverride;
        if(open>0){ctx.save();ctx.translate(x+lean,y-height);this.flowerHead(ctx,plant.radius,phase+Math.sin(t*0.8+phase)*0.08,plant.petals,plant.color,open);ctx.restore();}
      }
    }
    ending(ctx,t,courseAt) {
      for(const plant of this.colony){
        const growth=smooth(plant.born,plant.born+plant.duration,t);
        if(growth>0)this.colonyPlant(ctx,plant,growth,t);
      }

      for(const seed of this.sowing){
        const pose=this.sowingPose(seed,t,courseAt);
        if(pose.alpha>0)this.floret(ctx,pose.x,pose.y,pose.radius,pose.angle,pose.alpha);
      }
    }

    transitionEdge(t,start,x) {
      return this.distance(t)-this.distance(start)-180
        +Math.sin(x*0.005+start)*38+Math.sin(x*0.016+start*0.4)*14;
    }
    boundaryPath(ctx,t,start,offset=0) {
      ctx.beginPath();ctx.moveTo(-5,-10);ctx.lineTo(905,-10);
      for(let x=905;x>=-5;x-=10)ctx.lineTo(x,this.transitionEdge(t,start,x)+offset);
      ctx.closePath();
    }
    shore(ctx,t,start,from,to) {

      for(let band=8;band>=1;band--){
        const u=1-band/9;
        ctx.fillStyle=`rgb(${from.map((value,i)=>Math.round(value+(to[i]-value)*u)).join(',')})`;
        this.boundaryPath(ctx,t,start,band*12);ctx.fill();
      }
    }
    terrain(ctx,s,grass) {
      const t=s.time;
      if(t<4.75){

        this.pond(ctx,s);
      }else{
        const stages=[()=>this.pond(ctx,s),()=>this.wheatField(ctx,s),()=>this.woodland(ctx,s),()=>this.clouds.draw(ctx,s,this),()=>this.field(ctx,s,grass)];
        const transitions=[9.4,14.4,18.8,23.8];
        const colors=[[7,121,106],[182,169,109],[118,135,108],[121,171,184],[75,159,39]];
        let active=0;
        while(active<transitions.length&&this.distance(t)-this.distance(transitions[active])-232>1200)active++;
        stages[active]();
        if(active<transitions.length&&t>=transitions[active]){
          const start=transitions[active];
          this.shore(ctx,t,start,colors[active],colors[active+1]);
          ctx.save();this.boundaryPath(ctx,t,start);ctx.clip();stages[active+1]();ctx.restore();
        }
      }

    }
    draw(ctx,s,grass,part) {
      const show=id=>!part||part===id;
      const t=s.time;
      if(show('terrain'))this.terrain(ctx,s,grass);
      if(show('companions')){this.air.airflow(ctx,s,this);this.gust(ctx,t);this.air.companions(ctx,s,this);}
      if(show('dandelion')){this.drifting(ctx,s);this.main(ctx,s);ctx.fillStyle=`rgba(3,4,5,${smooth(36.2,37,t)})`;ctx.fillRect(0,0,900,1200);}
    }

  }
  window.DandelionJourney=DandelionJourney;
})();

const COURSE = [[0, 454], [0.5, 476], [1.5, 495], [2.1, 484], [3, 487], [3.5, 497], [4, 512], [4.5, 533], [5, 555], [5.5, 563], [6, 559], [7, 521],
    [8, 451], [9.5, 347], [11.5, 326], [13.5, 463], [15.5, 524], [17.5, 481], [18.5, 428], [19.5, 438], [21.5, 454], [24, 487], [28.8, 470]];
  function course(t) {
    if (t <= 0) return COURSE[0][1];
    if (t >= COURSE[COURSE.length-1][0]) return COURSE[COURSE.length-1][1];
    const i = COURSE.findIndex(([at]) => at >= t);
    const [start, a] = COURSE[i - 1], [end, b] = COURSE[i];
    const previous = COURSE[Math.max(0, i - 2)], next = COURSE[Math.min(COURSE.length - 1, i + 1)];
    const span = end - start, u = (t - start) / span;
    const slopeA = (b - previous[1]) / (end - previous[0]);
    const slopeB = (next[1] - a) / (next[0] - start);
    return (2 * u ** 3 - 3 * u * u + 1) * a + (u ** 3 - 2 * u * u + u) * slopeA * span
      + (-2 * u ** 3 + 3 * u * u) * b + (u ** 3 - u * u) * slopeB * span;
  }

 const journey=new window.DandelionJourney(),grass=new window.JourneyGrass({width:900,height:1200});
 const ready=(async()=>{if(['full','terrain','interaction'].includes(opt.mode)||opt.chapter==='cloud')for(const layer of journey.clouds.layers)for(const cloud of layer.clouds){journey.clouds.makeCloud(cloud);await Promise.resolve();}})();
 return {ready,draw(t,mode,part){const c=S.ctx,s={time:t,courseAt:course};
  if(mode==='full'){journey.draw(c,s,grass,part==='art'?null:part);return;}
  if(mode==='interaction'){journey.draw(c,s,grass);return;}
  if(mode==='terrain'){journey.terrain(c,s,grass);return;}
  if(mode==='unfold'){
    const time=2.35+Math.min(2.4,Math.max(0,t-.15)),state={time,courseAt:course};
    const pose=journey.subjectPose(time,course),unfold=journey.entryProgress(time);
    const strands=journey.filamentState(time).map((f,i)=>({...f,opacity:f.opacity*(i%13===0?1:unfold)}));
    const sourceOpacity=(.55+.45*Math.hypot(journey.heroSeed.x,journey.heroSeed.y)/112)*.85;
    // 荷塘与主体共用同一取景；保留独立动作原来的中心、大小和展开时序。
    c.save();c.translate(320,158);c.scale(1.05,1.05);c.translate(-pose.x,-pose.y);
    journey.terrain(c,state,grass);
    journey.floret(c,pose.x,pose.y,pose.radius,pose.angle,(sourceOpacity+(1-sourceOpacity)*unfold)*journey.openingGrowth(journey.heroSeed,time),strands);
    c.restore();return;
  }
  if(mode==='followers'){journey.air.companions(c,s,journey);return;}
  if(mode==='water-life'){journey.water.draw(c,s,journey);return;}
  if(mode==='wheat-life'){journey.encounters.drawWheat(c,s,journey);return;}
  if(mode==='forest-life'){journey.encounters.drawForest(c,s,journey);return;}
  if(mode==='landscape'){const p=opt.chapter||'pond';if(p==='cloud')journey.clouds.draw(c,s,journey);else if(p==='grass')journey.field(c,s,grass);else journey[{pond:'pond',wheat:'wheatField',forest:'woodland'}[p]](c,s);return;}
  c.save();c.translate(450,620);c.scale(5,5);
  if(mode==='lotus')journey.lotus(c,0,0,32,opt.leafOnly?0:1,t);
  if(mode==='animal'){const a=opt.animal||'fish';if(a==='fish')journey.water.fishShape(c,journey.water.fish[0],{x:0,y:0,angle:0,age:0,escape:0},t,1);if(a==='frog')journey.frog(c,28,0,t,0);if(a==='rabbit')journey.encounters.rabbit(c,journey.encounters.rabbits[0],1,t,1);if(a==='squirrel')journey.encounters.squirrel(c,1,0,t);}
  if(mode==='insect')journey.air.animal(c,opt.animal||0,13,t,0);
  if(mode==='squirrel')journey.encounters.squirrel(c,1,0,t);
  if(mode==='flower'){const p={...journey.colony.find(p=>p.bloom),x:0,y:0};journey.colonyPlant(c,p,1,t,1);}
  c.restore();
 },inspect:t=>({subject:journey.subjectPose(t,course),distance:journey.distance(t),chapter:journey.chapter(t).label})};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("filament-unfold-turn",{"family":"dandelion","mode":"unfold","start":0,"width":640,"height":360});
WiseSceneRuntime.register("landscape-boundary-carry",{"family": "dandelion", "mode": "terrain", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("passage-animal-response",{"family": "dandelion", "mode": "interaction", "start": 3, "width": 900, "height": 1200, "variants": {"journey": {"family": "dandelion", "mode": "interaction", "start": 3, "width": 900, "height": 1200}, "fish": {"family": "dandelion", "mode": "interaction", "start": 4.75, "width": 900, "height": 1200}, "rabbit": {"family": "dandelion", "mode": "interaction", "start": 10, "width": 900, "height": 1200}, "squirrel": {"family": "dandelion", "mode": "interaction", "start": 15, "width": 900, "height": 1200}}});
WiseSceneRuntime.register("journey-landscape-illustration",{"family": "dandelion", "mode": "landscape", "start": 5, "width": 900, "height": 1200, "chapter": "pond", "variants": {"pond": {"family": "dandelion", "mode": "landscape", "start": 5, "width": 900, "height": 1200, "chapter": "pond"}, "wheat": {"family": "dandelion", "mode": "landscape", "start": 12, "width": 900, "height": 1200, "chapter": "wheat"}, "forest": {"family": "dandelion", "mode": "landscape", "start": 16, "width": 900, "height": 1200, "chapter": "forest"}, "cloud": {"family": "dandelion", "mode": "landscape", "start": 22, "width": 900, "height": 1200, "chapter": "cloud"}, "grass": {"family": "dandelion", "mode": "landscape", "start": 29, "width": 900, "height": 1200, "chapter": "grass"}}});
WiseSceneRuntime.register("journey-lotus-illustration",{"family": "dandelion", "mode": "lotus", "start": 0, "width": 900, "height": 1200, "leafOnly": false, "variants": {"flower": {"family": "dandelion", "mode": "lotus", "start": 0, "width": 900, "height": 1200, "leafOnly": false}, "leaf": {"family": "dandelion", "mode": "lotus", "start": 0, "width": 900, "height": 1200, "leafOnly": true}}});
WiseSceneRuntime.register("journey-pond-animal-illustration",{"family": "dandelion", "mode": "animal", "start": 0, "width": 900, "height": 1200, "animal": "fish", "variants": {"fish": {"family": "dandelion", "mode": "animal", "start": 0, "width": 900, "height": 1200, "animal": "fish"}, "frog": {"family": "dandelion", "mode": "animal", "start": 0, "width": 900, "height": 1200, "animal": "frog"}, "rabbit": {"family": "dandelion", "mode": "animal", "start": 0, "width": 900, "height": 1200, "animal": "rabbit"}, "squirrel": {"family": "dandelion", "mode": "animal", "start": 0, "width": 900, "height": 1200, "animal": "squirrel"}}});
WiseSceneRuntime.register("journey-air-animal-illustration",{"family": "dandelion", "mode": "insect", "start": 0, "width": 900, "height": 1200, "animal": 0, "variants": {"0": {"family": "dandelion", "mode": "insect", "start": 0, "width": 900, "height": 1200, "animal": 0}, "1": {"family": "dandelion", "mode": "insect", "start": 0, "width": 900, "height": 1200, "animal": 1}, "2": {"family": "dandelion", "mode": "insect", "start": 0, "width": 900, "height": 1200, "animal": 2}, "3": {"family": "dandelion", "mode": "insect", "start": 0, "width": 900, "height": 1200, "animal": 3}}});
WiseSceneRuntime.register("journey-flower-illustration",{"family": "dandelion", "mode": "flower", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("dandelion-wind-journey",{"family": "dandelion", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "terrain", "name": "五段地景与沿途动物", "start": 0, "end": 37000, "time": "0—37秒", "detail": "荷塘、麦田、山林、云海和草地沿起伏岸线承接；鱼、青蛙、兔子与松鼠在同一位置回应，草地里长出植株。", "actions": ["landscape-boundary-carry", "passage-animal-response", "journey-landscape-illustration", "journey-lotus-illustration", "journey-pond-animal-illustration", "journey-flower-illustration", "settle-grow-spread"]}, {"id": "companions", "name": "风线与伴飞动物", "start": 0, "end": 27000, "time": "0—27秒", "detail": "风线穿过，蜻蜓、飞鸟、瓢虫和蝴蝶沿主体走过的路线伴飞。", "actions": ["passage-animal-response", "journey-air-animal-illustration"]}, {"id": "dandelion", "name": "球簇释放、飘散与落定", "start": 0, "end": 37000, "time": "0—37秒", "detail": "球簇径向释放，冠毛展开，细丝散去，种子落定；片尾逐渐暗下。", "actions": ["dandelion-radial-release", "filament-unfold-turn", "filament-shed-drift", "settle-grow-spread"]}], "layers": ["terrain", "companions", "dandelion"]});
