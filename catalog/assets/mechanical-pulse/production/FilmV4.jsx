import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig,interpolate,staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {Fonts,Base,Label,Type,Footage,Opening,Board,Structure,Craft,Aperture} from './FilmV3.jsx';
import {SpatialDetail,SpatialMaterial,SpatialForm,SpatialFinale} from './SpatialScenes.jsx';
import {windowState} from './windows-v4.mjs';
import {pacing} from './timing-v42.mjs';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};

const WholeMovement=()=>{
  const f=useCurrentFrame();
  return <Base light>
    <AbsoluteFill style={{left:800,background:'#050607'}}/>
    <div style={{position:'absolute',left:825,top:0,width:810,height:1080}}>
      <Footage src="reveal-portrait.mp4" trim={1.5} rate={1.8} objectFit="contain"/>
    </div>
    <AbsoluteFill style={{opacity:interpolate(f,[17,24],[1,0],clamp)}}>
      <Label style={{left:90,top:75}}>EVERY PART HAS A PURPOSE.</Label>
      <Type size={126} style={{left:80,top:305}}>ONE.<br/>COMPLETE.<br/>MOVEMENT.</Type>
      <div style={{position:'absolute',left:92,bottom:179,width:570,height:1,background:'#080a0a'}}/>
      <Label style={{left:92,bottom:112}}>FORM, BROUGHT TO LIFE.</Label>
    </AbsoluteFill>
  </Base>;
};

const FullMacro=({src,rate})=><Base>
  <Footage src={src} rate={rate}/>
  <div style={{position:'absolute',left:0,top:0,right:0,height:190,background:'linear-gradient(180deg,rgba(0,0,0,.58),transparent)'}}/>
</Base>;

// Main cuts use the score's 20-frame beat. Material pre-entry begins 8 frames
// before F420, so its 16-frame opening straddles the beat rather than stopping on it.
export const MechanicalPulseSpatial=({withAudio=true,unmasked=false,alignedForm=false,paced=false})=>{
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  return <Base style={{fontFamily:'HN,Helvetica,Arial,sans-serif'}}><Fonts/>
    <Aperture frame={f} unmasked={unmasked} getState={windowState}>
      <Sequence from={0} durationInFrames={40} premountFor={fps} name="TIME"><Opening/></Sequence>
      <Sequence from={40} durationInFrames={100} premountFor={fps} name="Complete drawing flashes"><Board/></Sequence>
      <Sequence from={140} durationInFrames={40} premountFor={fps} name="Whole movement / real space"><WholeMovement/></Sequence>
      <Sequence from={180} durationInFrames={40} premountFor={fps} name="Rotated cross / assembly"><Structure revised/></Sequence>
      <Sequence from={220} durationInFrames={60} premountFor={fps} name="Diagonal entry / complete tool action"><Craft revised/></Sequence>
      <Sequence from={280} durationInFrames={20} premountFor={fps} name="Stored / one beat"><FullMacro src="barrel.mp4" rate={1.875}/></Sequence>
      <Sequence from={300} durationInFrames={20} premountFor={fps} name="Connected / one beat"><FullMacro src="train.mp4" rate={3}/></Sequence>
      <Sequence from={320} durationInFrames={20} premountFor={fps} name="Alive / one beat"><FullMacro src="balance.mp4" rate={3.375}/></Sequence>
      <Sequence from={340} durationInFrames={paced?pacing.detail.duration:88} premountFor={fps} name="Every detail / real shadows"><SpatialDetail paced={paced}/></Sequence>
      <Sequence from={paced?pacing.material.from:412} durationInFrames={paced?pacing.material.duration:68} premountFor={fps} name="Material pre-entry / portrait layout"><SpatialMaterial paced={paced}/></Sequence>
      <Sequence from={paced?pacing.form.from:480} durationInFrames={paced?pacing.form.duration:40} premountFor={fps} name="FORM / three portraits"><SpatialForm aligned={alignedForm||paced} paced={paced}/></Sequence>
      <Sequence from={paced?pacing.finale.from:520} durationInFrames={paced?pacing.finale.duration:120} premountFor={fps} name="Time in motion / final chord"><SpatialFinale paced={paced}/></Sequence>
    </Aperture>
    {f>=180&&f<280&&<Label style={{left:80,top:62,textShadow:'0 1px 8px #000'}}>{f<220?'EVERY PART. ONE PURPOSE.':'CRAFTED. DOWN TO THE LAST TURN.'}</Label>}
    {f>=280&&f<340&&<Label style={{left:80,top:62,textShadow:'0 1px 8px #000'}}>STORED. CONNECTED. ALIVE.</Label>}
    {withAudio&&<Audio src={staticFile(paced?pacing.score:'score-v3.wav')} premountFor={fps}/>}
    <AbsoluteFill style={{background:'#080a0a',opacity:interpolate(f,paced?[pacing.fadeFrom,pacing.frames-1]:[631,639],[0,1],clamp),pointerEvents:'none'}}/>
  </Base>;
};
