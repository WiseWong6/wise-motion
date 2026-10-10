(function (global) {
'use strict';
// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// Four actual hinge rotations; the printed artwork stays fixed on each wing.
const DURATION = 6;
const ATLAS = {width: 1536, height: 1024};
const STAGE = {width: 1080, height: 1440, x: 550, y: 862, scale: 0.60, perspective: 1800};
const PARTS = [
  {id: 'left-hind', side: -1, hind: true, crop: [100, 530, 510, 470], pivot: [473, 35], root: [-16, 23], delay: 0.052},
  {id: 'right-hind', side: 1, hind: true, crop: [936, 530, 510, 470], pivot: [28, 36], root: [16, 23], delay: 0.07},
  {id: 'left-fore', side: -1, hind: false, crop: [0, 0, 640, 522], pivot: [620, 501], root: [-18, 0], delay: 0,
    clip: 'polygon(0px 0px,600px 0px,600px 430px,638px 522px,0px 522px)'},
  {id: 'right-fore', side: 1, hind: false, crop: [896, 0, 640, 522], pivot: [17, 500], root: [18, 0], delay: 0.018,
    clip: 'polygon(40px 0px,640px 0px,640px 522px,0px 522px,40px 430px)'},
];
// Only the head and body: the two original static antennae are no longer shown.
const BODY = {crop: [725, 334, 90, 341], pivot: [45, 88], root: [0, 0]};
const ANTENNAE = [
  {id: 'left-antenna', side: -1, phase: 0, root: [-14, -87],
    controls: [[-36, -156], [-49, -224]], tip: [-114, -293],
    club: {id: 'left-antenna-tip', crop: [610, 90, 52, 40], pivot: [46, 39]}},
  {id: 'right-antenna', side: 1, phase: 0.27, root: [11, -87],
    controls: [[33, -156], [45, -224]], tip: [110, -293],
    club: {id: 'right-antenna-tip', crop: [876, 90, 52, 40], pivot: [4, 39]}},
];

const mod = (v, n) => ((v % n) + n) % n;
const smooth = p => p * p * p * (p * (p * 6 - 15) + 10);
const radians = degrees => degrees * Math.PI / 180;

function closedAt(seconds, delay = 0) {
  const phase = mod((seconds - delay) * 2, 1);
  // A quick lift, then a longer opening; both turnarounds have zero velocity.
  return phase < 0.36 ? smooth(phase / 0.36) : 1 - smooth((phase - 0.36) / 0.64);
}

function antennaState(antenna, seconds) {
  const t = mod(seconds, DURATION);
  const {side, phase, root, controls, tip} = antenna;
  const slow = 8 * Math.sin(2 * Math.PI * t / 3 + phase);
  // The upper bend follows the flap; the soft tip responds 0.05 seconds later.
  const bend = 4 * Math.sin(4 * Math.PI * (t - 0.035) + phase);
  const tipBend = 6 * Math.sin(4 * Math.PI * (t - 0.085) + phase);
  const c1 = controls[0]; // A fixed first control also keeps the root tangent fixed.
  const c2 = [controls[1][0] + side * (0.35 * slow + 0.45 * bend),
    controls[1][1] + 0.8 * Math.sin(4 * Math.PI * (t - 0.04) + phase)];
  const end = [tip[0] + side * (slow + tipBend),
    tip[1] + 2 * Math.sin(4 * Math.PI * (t - 0.11) + phase)];
  const tangent = Math.atan2(end[1] - c2[1], end[0] - c2[0]);
  const restTangent = Math.atan2(tip[1] - controls[1][1], tip[0] - controls[1][0]);
  return {id: antenna.id, root, c1, c2, end,
    tipRotation: (tangent - restTangent) * 180 / Math.PI,
    path: `M ${root.join(' ')} C ${c1.join(' ')} ${c2.join(' ')} ${end.join(' ')}`};
}

function butterflyState(seconds) {
  const t = mod(seconds, DURATION);
  return {
    x: STAGE.x + 3 * Math.sin(2 * Math.PI * t / 6),
    y: STAGE.y + 5 * Math.sin(2 * Math.PI * t / 2),
    bank: -12 + 2.2 * Math.sin(2 * Math.PI * t / 6),
    antennae: ANTENNAE.map(antenna => antennaState(antenna, t)),
    wings: PARTS.map(part => {
      const closed = closedAt(t, part.delay);
      const angle = (part.hind ? 10 : 8) + (part.hind ? 52 : 62) * closed;
      return {id: part.id, closed, angle, yaw: -part.side * angle,
        // Small changes within the wing plane also rotate about the wing root.
        roll: part.side * (part.hind ? 1.1 : 0.7) * closed,
        brightness: 1 - 0.105 * closed};
    }),
  };
}

// The same geometry as the CSS transforms, for boundary and hinge checks.
function localWingPoint(part, wing, point) {
  const dx = point[0] - part.pivot[0], dy = point[1] - part.pivot[1];
  const zAngle = radians(wing.roll), yaw = radians(wing.yaw);
  const x0 = dx * Math.cos(zAngle) - dy * Math.sin(zAngle);
  const y0 = dx * Math.sin(zAngle) + dy * Math.cos(zAngle);
  return {x: part.root[0] + x0 * Math.cos(yaw), y: part.root[1] + y0, z: -x0 * Math.sin(yaw)};
}

function screenPoint(local, state) {
  const angle = radians(state.bank), scale = STAGE.scale;
  const x = scale * (local.x * Math.cos(angle) - local.y * Math.sin(angle));
  const y = scale * (local.x * Math.sin(angle) + local.y * Math.cos(angle));
  const z = scale * local.z, perspective = STAGE.perspective / (STAGE.perspective - z);
  return {x: state.x + x * perspective, y: state.y + y * perspective, z};
}

global.WiseButterflyMotion = Object.freeze({DURATION, ATLAS, STAGE, PARTS, BODY, ANTENNAE, closedAt, antennaState, butterflyState, localWingPoint, screenPoint});
})(globalThis);
