import './index.css';
import {durationInFrames as rasenganDuration} from './rasengan/timing';
import {HillRasengan} from './rasengan/Film';
import platformOutros from './rasengan/platform-outros.json';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Composition, Sequence, staticFile, useCurrentFrame, useDelayRender, interpolate} from 'remotion';
import {Audio} from '@remotion/media';
import {TransitionSeries} from '@remotion/transitions';
import type {InkData} from './visuals/InkVolume';
import {CaptionLayer} from './visuals/CaptionLayer';
import {Opening} from './scenes/Opening';
import {History} from './scenes/History';
import {BubbleScene} from './scenes/BubbleScene';
import {TrackScene} from './scenes/TrackScene';
import {SectionScene} from './scenes/SectionScene';
import {SphereScene} from './scenes/SphereScene';
import {RevealScene} from './scenes/RevealScene';
import {InkScene} from './scenes/InkScene';
import {CompareScene} from './scenes/CompareScene';
import {OceanScene} from './scenes/OceanScene';

const WaterInkJellyfish: React.FC = () => {
  const frame=useCurrentFrame();
  const {delayRender,continueRender,cancelRender}=useDelayRender();
  const [handle]=useState(()=>delayRender('加载已验证的墨滴模拟数据'));
  const [data,setData]=useState<InkData|null>(null);
  useEffect(()=>{
    let active=true;
    Promise.all([
      fetch(staticFile('data/ink-simulation.json')).then((r)=>{if(!r.ok)throw new Error('无法加载墨滴数据');return r.json() as Promise<InkData>;}),
      document.fonts.ready,
    ]).then(([value])=>{
      if(!active)return;
      if(value.frames.length!==181)throw new Error('墨滴数据帧数不完整');
      setData(value);continueRender(handle);
    }).catch(cancelRender);
    return ()=>{active=false;};
  },[handle,continueRender,cancelRender]);
  if(!data)return null;
  return <AbsoluteFill style={{background:'#06151e'}}>
    <Audio src={staticFile('audio/水墨微光.m4a')} volume={1}/>
    <AbsoluteFill style={{opacity:interpolate(frame,[0,8,5520,5579],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={240} name="水墨水母"><Opening data={data}/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={510} name="希尔的理想流动"><History/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={510} name="杯中的气泡"><BubbleScene/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={540} name="跟住一条轨迹"><TrackScene/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={570} name="铺开内部剖面"><SectionScene/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={720} name="三维希尔球涡"><SphereScene/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={480} name="用墨水显影"><RevealScene data={data}/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={630} name="真实墨滴的回卷"><InkScene data={data}/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={630} name="从气泡回到墨滴"><CompareScene data={data}/></TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={750} name="会消散的水族馆"><OceanScene data={data}/></TransitionSeries.Sequence>
      </TransitionSeries>
      <CaptionLayer/>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// Confirmed opening transition preview: the 2-20s window with narration.
const OpeningBFlatten: React.FC = () => (
  <Sequence from={60} durationInFrames={540} layout="none">
    <HillRasengan platform="douyin" music={false}/>
  </Sequence>);

export const RemotionRoot: React.FC = () => <><Composition id="OpeningB-Flatten" component={OpeningBFlatten} durationInFrames={540} fps={30} width={1080} height={1920} defaultProps={{}}/><Composition id="HillRasengan" component={HillRasengan} durationInFrames={rasenganDuration+platformOutros.douyin.durationInFrames} fps={30} width={1080} height={1920} defaultProps={{platform:'douyin' as const,music:true}}/>{(['douyin','channels','xiaohongshu'] as const).map(platform=><Composition key={platform} id={{douyin:'HillRasenganDouyin',channels:'HillRasenganChannels',xiaohongshu:'HillRasenganXiaohongshu'}[platform]} component={HillRasengan} durationInFrames={rasenganDuration+platformOutros[platform].durationInFrames} fps={30} width={1080} height={1920} defaultProps={{platform,music:true}}/>)}<Composition id="WaterInkJellyfish" component={WaterInkJellyfish} durationInFrames={5580} fps={30} width={1080} height={1920} defaultProps={{}}/></>;
