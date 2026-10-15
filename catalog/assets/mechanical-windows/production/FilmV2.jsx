import React from 'react';
import {AbsoluteFill,CanvasImage,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Video,Audio} from '@remotion/media';
import {windowState,tween,key} from './windows-v2.mjs';
import {DRAWING_FLASHES} from './timing-v2.mjs';

const ink='#080a0a',paper='#eeeee5',gold='#bba67b';
const Fonts=()=> <style>{`@font-face{font-family:HN;src:url('${staticFile('HelveticaNeue-Medium.woff2')}');font-weight:500;}@font-face{font-family:HN;src:url('${staticFile('HelveticaNeue-Regular.woff2')}');font-weight:400;}*{box-sizing:border-box}`}</style>;
const Picture=({src,style={}})=><CanvasImage src={staticFile(src)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',...style}}/>;
const Footage=({src,rate=1,trim=0,style={},objectFit='cover'})=>{const{fps}=useVideoConfig();return <Video src={staticFile(src)} muted playbackRate={rate} trimBefore={trim*fps} premountFor={fps} objectFit={objectFit} style={{position:'absolute',width:'100%',height:'100%',...style}}/>;};
const Small=({children,style={}})=><div style={{position:'absolute',fontSize:22,fontWeight:400,lineHeight:1.35,letterSpacing:3.2,...style}}>{children}</div>;
const Head=({children,style={},size=136})=><div style={{position:'absolute',fontSize:size,fontWeight:500,lineHeight:.97,letterSpacing:-size*.045,...style}}>{children}</div>;

const ObjectLeft=()=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  const sf=Math.min(83,Math.floor(f/fps*.9*24));
  return <AbsoluteFill style={{background:ink}}>
    <AbsoluteFill style={{translate:'-520px 0px',maskImage:`url("${staticFile(`opening-alpha/F${String(sf).padStart(4,'0')}.png`)}")`,maskSize:'100% 100%',maskRepeat:'no-repeat'}}>
      <Footage src="opening.mp4" rate={.9}/>
    </AbsoluteFill>
  </AbsoluteFill>;
};

const Board=()=>{
  const local=useCurrentFrame();
  const drawing=DRAWING_FLASHES.some(([a,b])=>local+80>=a&&local+80<b);
  return <AbsoluteFill>
    <Footage src="board-clean.mp4" rate={.75}/>
    {drawing&&<Picture src="blueprint.png" style={{filter:'brightness(.85) contrast(1.6)'}}/>}
  </AbsoluteFill>;
};
const Barrel=()=> <AbsoluteFill style={{scale:1.12,translate:'-65px -85px'}}><Footage src="barrel.mp4" rate={.9}/></AbsoluteFill>;
const Train=()=> <AbsoluteFill style={{scale:1.12,translate:'150px -146px'}}><Footage src="train.mp4" rate={.98}/></AbsoluteFill>;
const Balance=()=> <AbsoluteFill style={{scale:1.12,translate:'43px 73px'}}><Footage src="balance.mp4" rate={1.06}/></AbsoluteFill>;
const Whole=()=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  const sf=Math.min(664,504+Math.floor((3.8+f/fps*.95)*24));
  return <AbsoluteFill style={{background:ink}}>
    <div style={{position:'absolute',left:555,top:0,width:810,height:1080,maskImage:`url("${staticFile(`return-alpha/F${String(sf).padStart(4,'0')}.png`)}")`,maskSize:'100% 100%',maskRepeat:'no-repeat'}}>
      <Footage src="return-portrait.mp4" trim={3.8} rate={.95} objectFit="contain"/>
    </div>
  </AbsoluteFill>;
};
const FinalObject=()=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{background:'radial-gradient(ellipse at 72% 45%,#20241e 0%,#080a0a 70%)'}}>
    <Picture src="watch-angle.png" style={{inset:undefined,left:1000,top:-18,width:830,height:1107,objectFit:'contain',translate:`0px ${tween(f,0,65,18,0)}px`,rotate:`${tween(f,0,65,2,-1)}deg`}}/>
  </AbsoluteFill>;
};
const MaterialPreEntry=()=>{
  const f=useCurrentFrame();
  // Genuine early entrance: the next shot plays in a right-side window while
  // the complete watch is still playing behind it. One continuous media clock.
  return <AbsoluteFill style={{clipPath:f<12?`circle(${tween(f,0,12,0,1900)}px at 1430px 540px)`:'none'}}>
    <Footage src="edge-portrait.mp4" rate={.97}/>
  </AbsoluteFill>;
};

// The aperture is outside every picture Sequence. A cut cannot restart it.
const Aperture=({frame,children,unmasked=false})=>{
  const state=windowState(frame);
  return <>
    <svg width="0" height="0" style={{position:'absolute'}}><defs><clipPath id="continuous-aperture-v2" clipPathUnits="userSpaceOnUse">
      {state.shapes.map((s,i)=>s.type==='circle'?<circle key={i} cx={s.cx} cy={s.cy} r={s.r}/>:<rect key={i} x={s.cx-s.width/2} y={s.cy-s.height/2} width={s.width} height={s.height} transform={`rotate(${s.angle} ${s.cx} ${s.cy})`}/>)}
    </clipPath></defs></svg>
    <AbsoluteFill style={{clipPath:unmasked?'none':'url(#continuous-aperture-v2)',overflow:'hidden'}}>{children}</AbsoluteFill>
  </>;
};

const Typography=()=>{
  const f=useCurrentFrame();
  const opening=key(f,[[0,0],[12,0],[25,1],[61,1],[77,0]]);
  const board=key(f,[[0,0],[121,0],[134,1],[265,1],[280,0]]);
  const craft=key(f,[[0,0],[340,0],[352,1],[515,1],[540,0]]);
  const mechanism=key(f,[[0,0],[565,0],[580,1],[682,1],[710,0]]);
  const whole=key(f,[[0,0],[752,0],[763,1],[781,1],[795,0]]);
  const finale=key(f,[[0,0],[885,0],[902,1],[960,1]]);
  return <AbsoluteFill style={{color:paper,pointerEvents:'none'}}>
    <AbsoluteFill style={{opacity:opening}}>
      <Small style={{left:1020,top:198,color:gold,fontSize:20}}>POCKETWATCH / MOTION STUDY</Small>
      <Head size={128} style={{left:1010,top:345}}>A WORLD<br/>WITHIN.</Head>
      <div style={{position:'absolute',left:1020,top:680,width:tween(f,18,48,0,470),height:1,background:gold}}/>
      <Small style={{left:1020,top:713,fontSize:19,letterSpacing:2,color:'#a5a69e'}}>FORM. ENERGY. PRECISION.</Small>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:board}}>
      <Small style={{left:80,top:62}}>FROM AN IDEA. TO EVERY PART.</Small>
      <Small style={{right:80,bottom:59,color:gold,fontSize:19}}>01 / FORM INTO MATTER</Small>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:craft}}>
      <Small style={{left:80,top:62}}>{f<400?'EVERY PART. ONE PURPOSE.':'CRAFTED, DOWN TO THE LAST TURN.'}</Small>
      <Small style={{right:80,bottom:59,color:gold,fontSize:19}}>02 / THE ARCHITECTURE OF TIME</Small>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:mechanism}}>
      <Small style={{left:80,top:62}}>STORED. CONNECTED. ALIVE.</Small>
      <Small style={{right:80,bottom:59,color:gold,fontSize:19}}>03 / ENERGY IN MOTION</Small>
    </AbsoluteFill>
    <Small style={{left:80,top:62,opacity:whole}}>ONE CONNECTED MOVEMENT.</Small>
    <AbsoluteFill style={{opacity:finale,translate:`0px ${tween(f,885,908,20,0)}px`}}>
      <Small style={{left:92,top:238,fontSize:20,color:gold}}>POCKETWATCH / MOTION STUDY</Small>
      <Head size={150} style={{left:84,top:365}}>TIME,<br/>IN MOTION.</Head>
      <div style={{position:'absolute',left:94,top:736,width:580,height:1,background:gold}}/>
      <Small style={{left:94,top:775,fontSize:20,letterSpacing:2,color:'#a5a69e'}}>A LITTLE WORLD. WORKING AS ONE.</Small>
    </AbsoluteFill>
  </AbsoluteFill>;
};

export const MechanicalWindows=({withAudio=true,unmasked=false})=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  return <AbsoluteFill style={{background:ink,fontFamily:'HN,Helvetica,Arial,sans-serif',overflow:'hidden'}}>
    <Fonts/>
    <Aperture frame={f} unmasked={unmasked}>
      <Sequence name="01 · Dial aperture" from={0} durationInFrames={80} premountFor={fps}><ObjectLeft/></Sequence>
      <Sequence name="02 · Registered drawing flashes / assembly" from={80} durationInFrames={240} premountFor={fps}><Board/></Sequence>
      <Sequence name="03 · Open structure" from={320} durationInFrames={80} premountFor={fps}><Footage src="assembly.mp4" rate={1.8}/></Sequence>
      <Sequence name="04 · Full fastening action" from={400} durationInFrames={160} premountFor={fps}><Footage src="screw.mp4" rate={.75}/></Sequence>
      <Sequence name="05 · Barrel" from={560} durationInFrames={40} premountFor={fps}><Barrel/></Sequence>
      <Sequence name="06 · Gear engagement" from={600} durationInFrames={60} premountFor={fps}><Train/></Sequence>
      <Sequence name="07 · Balance" from={660} durationInFrames={60} premountFor={fps}><Balance/></Sequence>
      <Sequence name="08 · Complete movement" from={720} durationInFrames={80} premountFor={fps}><Whole/></Sequence>
      <Sequence name="09 · Material enters before the cut" from={788} durationInFrames={92} premountFor={fps}><MaterialPreEntry/></Sequence>
      <Sequence name="10 · Time in motion" from={880} durationInFrames={80} premountFor={fps}><FinalObject/></Sequence>
    </Aperture>
    <Typography/>
    {withAudio&&<Audio src={staticFile('score-v2.wav')} premountFor={fps}/>}
    <AbsoluteFill style={{background:ink,opacity:1-tween(f,0,5,0,1),pointerEvents:'none'}}/>
    <AbsoluteFill style={{background:ink,opacity:tween(f,947,959,0,1),pointerEvents:'none'}}/>
  </AbsoluteFill>;
};
