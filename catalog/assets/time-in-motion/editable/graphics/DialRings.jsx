import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {CLAMP, clamp01, finite, phase, timing} from './motion.mjs';

export const DIAL_PALETTES = {
  white: {main: '#F1EEE7', accent: '#D4D9E1', quiet: '#A0A9B6'},
  gold: {main: '#D4B57A', accent: '#EFE8DB', quiet: '#8E816A'},
  blue: {main: '#7EACDD', accent: '#E4EDF5', quiet: '#5B7797'},
};

function point(radius, angle) {
  const radians = angle * Math.PI / 180;
  return [500 + Math.cos(radians) * radius, 500 + Math.sin(radians) * radius];
}

function arc(radius, start, span) {
  const [x1, y1] = point(radius, start);
  const [x2, y2] = point(radius, start + span);
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${span > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Sparse clock geometry. Every time value is a frame in the parent Sequence. */
export function DialRings({
  size = 720,
  tone = 'gold',
  colors = {},
  start = 0,
  duration,
  enterFrames,
  exitFrames,
  beatFrames,
  rotation = -18,
  rotationSpeed = 7,
  tickCount = 48,
  strokeWidth = 2,
  frame: frameOverride,
  style,
}) {
  const currentFrame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frame = frameOverride ?? currentFrame;
  const t = timing(frame, start, duration ?? 4 * fps, enterFrames ?? 0.85 * fps, exitFrames ?? 0);
  if (!DIAL_PALETTES[tone]) throw new Error(`Unknown DialRings tone: ${tone}`);
  finite('size', size, 1);
  finite('rotation', rotation);
  finite('rotationSpeed', rotationSpeed);
  finite('strokeWidth', strokeWidth, 0.1);
  if (!Number.isInteger(tickCount) || tickCount < 12 || tickCount > 72 || tickCount % 12 !== 0) {
    throw new Error('tickCount must be a multiple of 12 between 12 and 72');
  }
  const beats = beatFrames ?? [0.9 * fps, 2.2 * fps];
  if (!Array.isArray(beats) || beats.some((beat) => !Number.isFinite(beat))) {
    throw new Error('beatFrames must be an array of finite local frame offsets');
  }
  const palette = {...DIAL_PALETTES[tone], ...colors};
  const opening = phase(t.local, 0, t.enter);
  const closing = t.exit === 0 ? 0 : phase(t.local, t.exitStart, t.end);
  const pulse = beats.reduce((value, beat) => Math.max(value,
    interpolate(t.local - beat, [0, 0.075 * fps, 0.42 * fps], [0, 1, 0], CLAMP)), 0);
  const angle = rotation + Math.max(0, Math.min(t.end, t.local)) / fps * rotationSpeed;
  const majorEvery = tickCount / 12;

  return (
    <div aria-hidden="true" style={{position: 'relative', width: size, height: size, pointerEvents: 'none', ...style}}>
      <svg viewBox="0 0 1000 1000" width="100%" height="100%" fill="none" style={{
        display: 'block', overflow: 'visible',
        opacity: t.active ? opening * (1 - closing) : 0,
        scale: interpolate(opening, [0, 1], [0.97, 1], CLAMP) + pulse * 0.007,
      }}>
        <circle cx="500" cy="500" r="388" stroke={palette.quiet} strokeWidth={strokeWidth * 0.65} opacity="0.26" />
        <g transform={`rotate(${angle} 500 500)`}>
          {Array.from({length: tickCount}, (_, index) => {
            const major = index % majorEvery === 0;
            const [x1, y1] = point(major ? 438 : 451, -90 + index * 360 / tickCount);
            const [x2, y2] = point(466, -90 + index * 360 / tickCount);
            return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={major ? palette.main : palette.quiet}
              strokeWidth={major ? strokeWidth * 1.3 : strokeWidth * 0.7}
              opacity={clamp01((opening * (tickCount + 5) - index) / 5) * (major ? 0.88 : 0.3)} />;
          })}
          <path d={arc(418, 205, 214)} pathLength="1" stroke={palette.main}
            strokeWidth={strokeWidth * (1.25 + pulse * 0.25)} strokeLinecap="round"
            strokeDasharray="1" strokeDashoffset={1 - phase(t.local, t.enter * 0.18, t.enter)} />
        </g>
        <g transform={`rotate(${-angle * 0.52} 500 500)`}>
          <path d={arc(351, -70, 92)} pathLength="1" stroke={palette.accent}
            strokeWidth={strokeWidth * 0.95} strokeLinecap="round" opacity={0.62 + pulse * 0.2}
            strokeDasharray="1" strokeDashoffset={1 - phase(t.local, t.enter * 0.4, t.enter)} />
          <circle cx={point(351, 22)[0]} cy={point(351, 22)[1]} r="3.2"
            fill={palette.accent} opacity={phase(t.local, t.enter * 0.82, t.enter)} />
        </g>
      </svg>
    </div>
  );
}
