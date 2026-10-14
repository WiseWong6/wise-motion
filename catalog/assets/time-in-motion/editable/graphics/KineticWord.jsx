import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CLAMP, finite, slotPhases, timing} from './motion.mjs';

const VECTORS = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]};

/** Direction is the direction of travel, for both entry and exit. */
export function KineticWord({
  word,
  start = 0,
  duration,
  enterFrames,
  exitFrames,
  direction = 'up',
  split = 'letters',
  stagger = 1.5,
  fontSize = 156,
  fontFamily = 'Arial, Helvetica, sans-serif',
  fontWeight = 600,
  letterSpacing = '-0.055em',
  color = '#F1EEE7',
  travel = 1.12,
  frame: frameOverride,
  style,
}) {
  const currentFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = timing(frameOverride ?? currentFrame, start, duration ?? 4 * fps,
    enterFrames ?? 0.85 * fps, exitFrames ?? 0);
  if (typeof word !== 'string') throw new Error('KineticWord requires a string word');
  if (!VECTORS[direction]) throw new Error(`Unknown KineticWord direction: ${direction}`);
  if (!['letters', 'words', 'word', 'none', 'halves'].includes(split)) throw new Error(`Unknown KineticWord split: ${split}`);
  finite('fontSize', fontSize, 1);
  finite('travel', travel, 0);
  const [vx, vy] = VECTORS[direction];
  const textStyle = {fontFamily, fontSize, fontWeight, letterSpacing, color,
    lineHeight: 0.94, fontKerning: 'normal', whiteSpace: 'pre', margin: 0};
  const tokens = split === 'letters' ? Array.from(word)
    : split === 'words' ? word.match(/\S+\s*|\s+/gu) ?? [''] : [word];

  const movingStyle = (index, count) => {
    const rank = direction === 'left' ? count - index - 1 : index;
    const p = slotPhases(t, rank, Math.max(0, count - 1), stagger);
    const distance = interpolate(p.enter, [0, 1], [-100 * travel, 0], CLAMP)
      + interpolate(p.exit, [0, 1], [0, 100 * travel], CLAMP);
    return {display: 'block', translate: `${vx * distance}% ${vy * distance}%`};
  };

  if (split === 'halves') {
    return <div role="img" aria-label={word} style={{display: 'block', width: 'max-content', position: 'relative',
      ...textStyle, ...style, visibility: t.active ? 'visible' : 'hidden'}}>
      <span style={{visibility: 'hidden'}}>{word}</span>
      {[0, 1].map((half) => <span key={half} aria-hidden="true" style={{position: 'absolute', inset: 0,
        overflow: 'hidden', clipPath: half === 0 ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)'}}>
        <span style={movingStyle(half, 2)}>{word}</span>
      </span>)}
    </div>;
  }

  return <div role="img" aria-label={word} style={{display: 'flex', width: 'max-content', alignItems: 'baseline',
    ...textStyle, ...style, visibility: t.active ? 'visible' : 'hidden'}}>
    {tokens.map((token, index) => <span key={index} aria-hidden="true" style={{display: 'inline-block',
      overflow: 'hidden', paddingBlock: '0.06em', marginBlock: '-0.06em'}}>
      <span style={movingStyle(index, tokens.length)}>{token}</span>
    </span>)}
  </div>;
}
