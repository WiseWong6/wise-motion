// User-authored scenes adapted to the existing pinned Remotion media API and OFL font.
import React from 'react';
import {AbsoluteFill,Img,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate,Easing} from 'remotion';
import {OffthreadVideo as Video,Html5Audio as Audio} from 'remotion';
import {windowState} from './windows-v3.mjs';
import {windowState as revisedWindowState} from './windows-v3.mjs';
import {windowState as referenceWindowState} from './windows-v3.mjs';

const ink='#080a0a',paper='#eeece3',gold='#bba67b';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
const enter=(f,a,b,x,y)=>interpolate(f,[a,b],[x,y],{...clamp,easing:Easing.bezier(.16,1,.3,1)});
const Fonts=()=> <style>{`@font-face{font-family:Oswald;src:url('${staticFile('catalog/fonts/Oswald-Bold.woff2')}');font-weight:100 900;}*{box-sizing:border-box}`}</style>;
const Base=({children,light=false,style={}})=><AbsoluteFill style={{background:light?paper:ink,color:light?ink:paper,overflow:'hidden',...style}}>{children}</AbsoluteFill>;
const Label=({children,style={}})=><div style={{position:'absolute',fontSize:21,lineHeight:1.3,letterSpacing:2.6,...style}}>{children}</div>;
const Type=({children,size=180,style={}})=><div style={{position:'absolute',fontSize:size,fontWeight:500,lineHeight:.94,letterSpacing:-size*.047,...style}}>{children}</div>;
const Picture=({src,style={}})=><Img src={staticFile(src)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',...style}}/>;
const Watch=({front=false,width=900,style={}})=><Picture src={front?'watch-front.png':'watch-angle.png'} style={{width,height:width*4/3,objectFit:'contain',...style}}/>;
const Footage=({src,rate=1,trim=0,objectFit='cover',style={}})=>{
  const {fps}=useVideoConfig();
  return <Video src={staticFile(src)} muted trimBefore={trim*fps} playbackRate={rate} premountFor={fps} objectFit={objectFit} style={{position:'absolute',width:'100%',height:'100%',objectFit,...style}}/>;
};

const Opening=()=>{
  const f=useCurrentFrame(),light=f<20;
  return <Base light={light}>
    <Label style={{left:90,top:65}}>POCKETWATCH / MOTION STUDY</Label>
    <Type size={350} style={{left:78,top:320,translate:`${enter(f,0,12,-65,0)}px 0px`}}>TIME.</Type>
    <Watch front width={880} style={{left:1020,top:-55,translate:`0px ${enter(f,0,18,120,0)}px`,rotate:`${enter(f,0,18,-8,-2)}deg`}}/>
    <Label style={{left:94,bottom:83}}>FORM. ENERGY. PRECISION.</Label>
    <div style={{position:'absolute',left:94,right:94,bottom:142,height:2,background:'currentColor'}}/>
  </Base>;
};

const Board=()=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  const drawing=(f>=8&&f<16)||(f>=28&&f<36);
  return <Base>
    <Sequence from={0} durationInFrames={40} premountFor={fps}><Footage src="board-clean.mp4" rate={.75}/></Sequence>
    <Sequence from={40} durationInFrames={60} premountFor={fps}><Footage src="board-clean.mp4" trim={1} rate={2.5}/></Sequence>
    {drawing&&<Picture src="blueprint.png" style={{filter:'brightness(.85) contrast(1.6)'}}/>}
    {!drawing&&<Label style={{left:80,top:62}}>FROM AN IDEA. TO EVERY PART.</Label>}
  </Base>;
};

const One=({revised=false,referenceRevision=false})=>{
  const f=useCurrentFrame();
  return <Base light>
    <AbsoluteFill style={{opacity:revised?enter(f,referenceRevision?18:24,referenceRevision?24:30,1,0):1}}>
      <Label style={{left:90,top:65}}>EVERY PART HAS A PURPOSE.</Label>
      <Type size={285} style={{left:77,top:300}}>ONE.</Type>
      <Type size={123} style={{left:88,top:596}}>MOVEMENT.</Type>
      <Label style={{left:94,bottom:80}}>FORM, BROUGHT TO LIFE.</Label>
    </AbsoluteFill>
    <Watch front width={900} style={{left:780,top:-110}}/>
  </Base>;
};

const Structure=({revised=false})=> <Base>
  <AbsoluteFill style={{translate:'270px 0px',maskImage:'linear-gradient(to right, transparent 0px, black 260px)'}}><Footage src="assembly.mp4" rate={3.6}/></AbsoluteFill>
  {!revised&&<Type size={150} style={{left:88,top:360}}>EVERY<br/>PART.</Type>}
  {!revised&&<Label style={{left:92,bottom:80,color:gold}}>ONE CONNECTED MOVEMENT.</Label>}
</Base>;

const Craft=({revised=false})=> <Base><Footage src="screw.mp4" rate={2}/>{!revised&&<Label style={{left:80,top:62}}>CRAFTED. DOWN TO THE LAST TURN.</Label>}</Base>;

const Energy=()=> <Base light>
  <Type size={260} style={{left:78,top:375}}>ENERGY.</Type>
  <Label style={{left:92,top:75}}>STORED. CONNECTED. ALIVE.</Label>
  <Watch width={500} style={{left:1390,top:145}}/>
</Base>;

const Macro=({src,rate,offset:[x,y],label,labelTop=62,showLabel=true})=>{
  const {width,height}=useVideoConfig();
  // Keep the source covering the canvas after reframing, with a small bleed.
  const scale=Math.max(1.12,1+2*Math.abs(x)/width,1+2*Math.abs(y)/height)+.005;
  return <Base>
    <AbsoluteFill style={{scale,translate:`${x}px ${y}px`}}><Footage src={src} rate={rate}/></AbsoluteFill>
    {showLabel&&<Label style={{left:80,top:labelTop,textShadow:'0 1px 8px #000'}}>{label}</Label>}
  </Base>;
};

const Detail=()=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  const sf=Math.min(664,504+Math.floor((3.8+f/fps*.95)*24));
  return <Base light>
    <Type size={180} style={{left:80,top:330}}>EVERY<br/>DETAIL.</Type>
    <Label style={{left:92,top:74}}>THE WHOLE, IN EVERY DETAIL.</Label>
    <Label style={{left:92,bottom:90}}>ALIVE.</Label>
    <div style={{position:'absolute',left:1030,top:0,width:810,height:1080,maskImage:`url("${staticFile(`return-alpha/F${String(sf).padStart(4,'0')}.png`)}")`,maskSize:'100% 100%',maskRepeat:'no-repeat'}}>
      <Footage src="return-portrait.mp4" trim={3.8} rate={.95} objectFit="contain"/>
    </div>
  </Base>;
};

const Material=()=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{clipPath:f<16?`circle(${interpolate(f,[0,5,16],[0,320,2200],clamp)}px at 1430px 540px)`:'none'}}>
    <Footage src="edge-portrait.mp4" rate={1.45}/>
    <Label style={{left:80,top:62,color:paper,opacity:enter(f,15,19,0,1)}}>LIGHT, SHAPED BY METAL.</Label>
  </AbsoluteFill>;
};

const Form=()=>{
  const f=useCurrentFrame();
  return <Base light>
    <Type size={255} style={{left:75,top:62}}>FORM.</Type>
    <Watch front width={670} style={{left:15,top:210,rotate:'-9deg',translate:`0px ${enter(f,0,12,80,0)}px`}}/>
    <Watch width={670} style={{left:625,top:210,translate:`0px ${enter(f,3,15,80,0)}px`}}/>
    <Watch front width={670} style={{left:1235,top:210,rotate:'9deg',translate:`0px ${enter(f,6,18,80,0)}px`}}/>
    <Label style={{right:92,top:90}}>A CLASSIC. RECOMPOSED.</Label>
  </Base>;
};

const Finale=()=>{
  const f=useCurrentFrame();
  return <Base>
    <Label style={{left:92,top:115,color:gold}}>POCKETWATCH / MOTION STUDY</Label>
    <Type size={170} style={{left:80,top:360,translate:`0px ${enter(f,0,10,28,0)}px`}}>TIME,<br/>IN MOTION.</Type>
    <Watch width={870} style={{left:1010,top:-40,rotate:`${enter(f,0,25,3,-2)}deg`,translate:`0px ${enter(f,0,25,35,0)}px`}}/>
    <div style={{position:'absolute',left:92,top:770,width:690,height:1,background:gold}}/>
    <Label style={{left:92,top:813,color:'#b1b4a9'}}>A LITTLE WORLD. WORKING AS ONE.</Label>
  </Base>;
};

const Aperture=({frame,children,unmasked,revised,referenceRevision,getState})=>{
  const state=(getState??(referenceRevision?referenceWindowState:revised?revisedWindowState:windowState))(frame);
  return <>
    <svg width="0" height="0" style={{position:'absolute'}}><defs><clipPath id="aperture-v3" clipPathUnits="userSpaceOnUse">
      {state.shapes.map((s,i)=>s.type==='circle'?<circle key={i} cx={s.cx} cy={s.cy} r={s.r}/>:<rect key={i} x={s.cx-s.width/2} y={s.cy-s.height/2} width={s.width} height={s.height} transform={`rotate(${s.angle} ${s.cx} ${s.cy})`}/>)}
    </clipPath></defs></svg>
    <AbsoluteFill style={{clipPath:unmasked?'none':'url(#aperture-v3)',overflow:'hidden'}}>{children}</AbsoluteFill>
  </>;
};

// Shared primitives keep the verified drawing/tool timing identical across edits.
export {Fonts,Base,Label,Type,Footage,Opening,Board,Structure,Craft,Aperture};

export const MechanicalPulse=({withAudio=false,unmasked=false,revised:previousRevision=false,referenceRevision=false})=>{
  const revised=previousRevision||referenceRevision;
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  return <Base style={{fontFamily:'Oswald,sans-serif'}}><Fonts/>
    <Aperture frame={f} unmasked={unmasked} revised={revised} referenceRevision={referenceRevision}>
      <Sequence from={0} durationInFrames={40} premountFor={fps} name="TIME / black-white impulse"><Opening/></Sequence>
      <Sequence from={40} durationInFrames={100} premountFor={fps} name="Full drawing flashes / fast assembly"><Board/></Sequence>
      <Sequence from={140} durationInFrames={40} premountFor={fps} name="ONE MOVEMENT / paper"><One revised={revised} referenceRevision={referenceRevision}/></Sequence>
      <Sequence from={180} durationInFrames={40} premountFor={fps} name="Compact cross into structure"><Structure revised={revised}/></Sequence>
      <Sequence from={220} durationInFrames={60} premountFor={fps} name="Full tool action"><Craft revised={revised}/></Sequence>
      {!revised&&<Sequence from={280} durationInFrames={20} premountFor={fps} name="ENERGY / paper"><Energy/></Sequence>}
      <Sequence from={revised?280:300} durationInFrames={revised?40:30} premountFor={fps} name="Stored"><Macro src="barrel.mp4" rate={revised ? .9375 : 1.25} offset={[-65,-85]} label="01 / STORED ENERGY" labelTop={revised?155:62} showLabel={!referenceRevision}/></Sequence>
      <Sequence from={revised?320:330} durationInFrames={revised?40:30} premountFor={fps} name="Connected"><Macro src="train.mp4" rate={revised?1.5:2} offset={[150,-146]} label="02 / PERFECTLY CONNECTED" labelTop={revised?155:62} showLabel={!referenceRevision}/></Sequence>
      <Sequence from={360} durationInFrames={40} premountFor={fps} name="Alive"><Macro src="balance.mp4" rate={1.6875} offset={[-103,100]} label="03 / RHYTHM, MADE VISIBLE" labelTop={revised?155:62} showLabel={!referenceRevision}/></Sequence>
      <Sequence from={400} durationInFrames={48} premountFor={fps} name="Every detail / next-shot underlay"><Detail/></Sequence>
      <Sequence from={432} durationInFrames={48} premountFor={fps} name="Material pre-entry"><Material/></Sequence>
      <Sequence from={480} durationInFrames={40} premountFor={fps} name="FORM / three portraits"><Form/></Sequence>
      <Sequence from={520} durationInFrames={120} premountFor={fps} name="Time in motion / final chord"><Finale/></Sequence>
    </Aperture>
    {revised&&f>=180&&f<280&&<Label style={{left:80,top:62,textShadow:'0 1px 8px #000'}}>{f<220?'EVERY PART. ONE PURPOSE.':'CRAFTED. DOWN TO THE LAST TURN.'}</Label>}
    {referenceRevision&&f>=280&&f<400&&<Label style={{left:80,top:62,textShadow:'0 1px 8px #000'}}>STORED. CONNECTED. ALIVE.</Label>}
    {withAudio&&<Audio src={staticFile('score-v3.wav')} premountFor={fps}/>}
    <AbsoluteFill style={{background:ink,opacity:interpolate(f,[631,639],[0,1],clamp),pointerEvents:'none'}}/>
  </Base>;
};
