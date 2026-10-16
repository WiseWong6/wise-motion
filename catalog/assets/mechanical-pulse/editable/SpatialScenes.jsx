// User-authored scenes adapted to the existing pinned Remotion media API and OFL font.
import React from 'react';
import {AbsoluteFill, Img, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {OffthreadVideo as Video} from 'remotion';
import {getAlignedFormLayout,formOffset} from './form-layout.mjs';
import {pacing} from './timing-v42.mjs';

// Independent scene layers for the 1920 × 1080, 30 fps composition.
// The parent owns Sequences, the 16-frame Detail/Material overlap, and final fade.
const ink = '#080a0a';
const paper = '#eeece3';
const gold = '#bba67b';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const settle = {...clamp, easing: Easing.bezier(.16, 1, .3, 1)};

const Base = ({children, light = false, style = {}}) => <AbsoluteFill style={{
  background: light ? paper : ink,
  color: light ? ink : paper,
  fontFamily: 'Oswald,sans-serif',
  overflow: 'hidden',
  ...style,
}}>{children}</AbsoluteFill>;

const Label = ({children, style = {}}) => <div style={{
  position: 'absolute', fontSize: 21, lineHeight: 1.3, letterSpacing: 2.6, ...style,
}}>{children}</div>;

const Type = ({children, size = 170, style = {}}) => <div style={{
  position: 'absolute', fontSize: size, fontWeight: 500, lineHeight: .94,
  letterSpacing: -size * .047, ...style,
}}>{children}</div>;

const Plate = ({src, style = {}}) => {
  const {fps} = useVideoConfig();
  return <Img src={staticFile(src)} premountFor={fps} style={{
    position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', ...style,
  }}/>;
};

const Watch = ({front = false, width = 870, style = {}}) => {
  const {fps} = useVideoConfig();
  return <Img src={staticFile(front ? 'watch-front.png' : 'watch-angle.png')}
    premountFor={fps} style={{position: 'absolute', width, height: width * 4 / 3,
      objectFit: 'contain', ...style}}/>;
};

// 88 output frames (planned parent F340–427). Source: 1080×1440,
// 24 fps, 168 frames / 7 seconds. Last source time is
// 3.0 + (87 / 30) × 1.35 = 6.915 s; the natural tabletop stays in the image.
export const SpatialDetail = ({paced = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Base>
    <Plate src="chrome-neutral.png" style={{opacity: .27,
      scale: interpolate(frame, [0, paced?47:87], [1.035, 1.01], clamp)}}/>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(8,10,10,.54),rgba(8,10,10,.18) 50%,transparent 75%)'}}/>
    <div style={{position: 'absolute', left: 930, top: 0, width: 990, height: 1080, background: '#050607'}}>
      <Video src={staticFile('return-portrait.mp4')} muted
        trimBefore={(paced?pacing.detail.trim:3) * fps} playbackRate={paced?pacing.detail.rate:1.35} premountFor={fps}
        style={{position: 'absolute', width: '100%', height: '100%',objectFit:'contain'}}/>
    </div>
    <Label style={{left: 96, top: 80}}>THE WHOLE, IN EVERY DETAIL.</Label>
    <Type size={154} style={{left: 88, top: 300,
      translate: `0px ${interpolate(frame, [0, 14], [18, 0], settle)}px`}}>
      EVERY<br/>DETAIL.{!paced&&<><br/>ALIVE.</>}
    </Type>
    <Label style={{left: 98, bottom: 114, color: '#b1b4a9'}}>ONE CONNECTED MOVEMENT.</Label>
  </Base>;
};

// 68 output frames (planned parent F412–479); begin 16 frames before
// SpatialDetail's Sequence ends. Both clocks must remain local to their scenes.
// The entire composition opens from the preceding watch's center. The source
// itself stays contained inside the full-height right panel (810×1080 visible),
// including its real background. The shared split avoids a floating video card.
// Source: 72 frames / 3 seconds. Last displayed source time: 2.93 seconds.
export const SpatialMaterial = ({paced = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Base style={{clipPath: frame < 16
    ? `circle(${interpolate(frame, [0, 16], [0, 1640], settle)}px at 1430px 540px)`
    : 'none'}}>
    <Plate src="glass.png" style={{opacity: .25,
      scale: interpolate(frame, [0, paced?47:67], [1.045, 1.015], clamp)}}/>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(6,7,9,.63),rgba(6,7,9,.33) 48%,rgba(6,7,9,.06) 77%)'}}/>
    <div style={{position: 'absolute', left: 930, top: 0, width: 990, height: 1080,
      background: '#050607', overflow: 'hidden'}}>
      <Video src={staticFile('edge-portrait.mp4')} muted
        trimBefore={(paced?pacing.material.trim:.25) * fps} playbackRate={paced?pacing.material.rate:1.2} premountFor={fps}
        style={{position: 'absolute', width: '100%', height: '100%',objectFit:'contain'}}/>
    </div>
    <Label style={{left: 96, top: 80, color: gold}}>POCKETWATCH / MOTION STUDY</Label>
    <Type size={156} style={{left: 88, top: 290,
      translate: `${interpolate(frame, [4, 20], [-18, 0], settle)}px 0px`}}>
      {paced?<>SHAPED<br/>BY LIGHT.</>:<>LIGHT<br/>SHAPED<br/>BY METAL.</>}
    </Type>
    <div style={{position: 'absolute', left: 96, bottom: 168, width: 630, height: 1,
      background: gold, opacity: .55}}/>
    <Label style={{left: 98, bottom: 112, color: '#b1b4a9'}}>FORM. ENERGY. PRECISION.</Label>
  </Base>;
};

// v4.1 aligns projected case centers and the actual rotated alpha silhouettes.
// Preserve the prior layout as the default so the reviewed v4 stays reproducible.
export const SpatialForm = ({aligned = false, paced = false}) => {
  const frame = useCurrentFrame();
  const layout = getAlignedFormLayout(paced?formOffset(frame):interpolate(frame,[0,12],[48,0],settle));
  return <Base light>
    <Plate src="chrome-neutral.png" style={{left: 1120, width: 800,
      objectPosition: '75% center', opacity: .94,
      ...(paced?{scale:interpolate(frame,[0,pacing.form.duration-1],[1.04,1],clamp)}:{})}}/>
    <Type size={255} style={{left: 75, top: 62,
      opacity: paced?interpolate(frame,[30,40],[1,0],clamp):1,
      translate: `${interpolate(frame, [0, 12], [-28, 0], settle)}px 0px`}}>FORM.</Type>
    {aligned ? layout.map(item => <Watch key={item.id} front={item.src === 'watch-front.png'} width={item.width}
      style={{left: item.left, top: item.top, rotate: `${item.angle}deg`,
        transformOrigin: item.transformOriginPercent.map(value => `${value}%`).join(' ')}}/>) : <>
    <Watch front width={700} style={{left: -20, top: 205,
      rotate: `${interpolate(frame, [0, 39], [-13, -11], clamp)}deg`,
      translate: `0px ${interpolate(frame, [0, 12], [90, 0], settle)}px`}}/>
    <Watch width={720} style={{left: 600, top: 180,
      rotate: `${interpolate(frame, [0, 39], [-2, 0], clamp)}deg`,
      translate: `0px ${interpolate(frame, [3, 15], [90, 0], settle)}px`}}/>
    <Watch front width={700} style={{left: 1200, top: 235,
      rotate: `${interpolate(frame, [0, 39], [13, 11], clamp)}deg`,
      translate: `0px ${interpolate(frame, [6, 18], [90, 0], settle)}px`}}/>
    </>}
    <Label style={{left: 92, bottom: 40, opacity: paced?interpolate(frame,[30,40],[1,0],clamp):1}}>A CLASSIC. RECOMPOSED.</Label>
  </Base>;
};

// 120 frames. Keep the existing final copy and first-beat entrance; the parent
// retains the established music landing point and the overall ending fade.
export const SpatialFinale = ({paced = false}) => {
  const frame = useCurrentFrame();
  const last = paced?pacing.finale.duration-1:119;
  const copyOpacity = paced?interpolate(frame,[12,20],[0,1],clamp):1;
  // A single rectangular reveal carries the three-watch layout into the finale.
  // It finishes before the score cadence, while the previous scene remains beneath.
  return <Base style={{clipPath: paced&&frame<pacing.finale.revealFrames
    ? `inset(0px 0px 0px ${interpolate(frame,[0,pacing.finale.revealFrames],[1920,0],{...clamp,easing:Easing.bezier(.45,0,.2,1)})}px)`
    : 'none'}}>
    <Plate src="chrome-neutral.png" style={{opacity: .72,
      scale: interpolate(frame, [0, last], [1.10, 1.025], clamp)}}/>
    <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(6,7,9,.87) 0%,rgba(6,7,9,.76) 45%,rgba(6,7,9,.17) 76%,rgba(6,7,9,.07) 100%)'}}/>
    <Label style={{left: 92, top: 115, color: gold, opacity: copyOpacity}}>POCKETWATCH / MOTION STUDY</Label>
    <Type size={170} style={{left: 80, top: 360,
      opacity: copyOpacity,
      translate: `0px ${interpolate(frame, paced?[12,20]:[0,10], [28, 0], settle)}px`}}>
      TIME,<br/>IN MOTION.
    </Type>
    <Watch width={870} style={{left: 1010, top: -40,
      rotate: `${interpolate(frame, [0, paced?20:25], [3, -2], settle) + interpolate(frame, [0, last], [0, -1.3], clamp)}deg`,
      translate: `0px ${interpolate(frame, [0, paced?20:25], [35, 0], settle) + interpolate(frame, [0, last], [0, -8], clamp)}px`}}/>
    <div style={{position: 'absolute', left: 92, top: 770, width: 690, height: 1,
      background: gold, opacity: .8*copyOpacity}}/>
    <Label style={{left: 92, top: 813, color: '#b1b4a9', opacity: copyOpacity}}>A LITTLE WORLD. WORKING AS ONE.</Label>
  </Base>;
};
