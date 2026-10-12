/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 提取自介绍视频 KLine：保留逐字讲述时间、指数减速、行距及英文裁切余量。 */
(function (global) {
  'use strict';
  const clamp = v => Math.min(1, Math.max(0, v));
  const cubicOut = x => 1 - Math.pow(1 - x, 3);
  const expoOut = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
  const prog = (t, a, b, ease) => ease(clamp((t - a) / Math.max(1e-6, b - a)));
  const defaults = Object.freeze({
    rows: Object.freeze(["AI simply doesn't know ", 'what you want.']),
    // 原片第六句的字符时间减去句首时间；不均分单词，不改变词内推进。
    times: Object.freeze([0.0,0.20000000000000284,0.40000000000000213,0.40000000000000213,0.46666666666666856,0.533333333333335,0.6000000000000014,0.6666666666666679,0.7333333333333343,0.8000000000000007,0.8000000000000007,0.8571428571428577,0.9142857142857146,0.9714285714285715,1.0285714285714285,1.0857142857142854,1.1428571428571423,1.1999999999999993,1.1999999999999993,1.3000000000000007,1.3999999999999986,1.5,1.6000000000000014,1.6000000000000014,1.6600000000000001,1.7199999999999989,1.7800000000000011,1.8399999999999999,1.8399999999999999,1.8666666666666671,1.8933333333333344,1.9200000000000017,1.9200000000000017,2.0,2.080000000000002,2.16,2.240000000000002]),
    sourceOrigin: 23.27695833333333,
    start: 0.15, lead: 0.03, duration: 0.42, size: 80,
    lineHeight: 1.22, rowGap: 0.2, growUp: true,
    x: 72, y: 190, width: 936, highlight: 'what you want',
    color: '#F2F1EC', accent: '#3DAD80'
  });
  function stateAt(seconds, caption = defaults) {
    if (!Number.isFinite(seconds)) throw new TypeError('字幕时间必须是有限数字');
    const rows = caption.rows, full = rows.join(''), chars = Array.from(full);
    if (caption.times.length !== chars.length || caption.times.some(t => !Number.isFinite(t))) throw new TypeError('每个字符必须有有效的讲述时间');
    const {size, lineHeight: lh, rowGap, duration: dur, lead, start} = caption;
    // 保留原绝对时钟的运算顺序，避免指数减速终点因小数舍入差一帧。
    const origin = caption.sourceOrigin || 0, t = origin + seconds - start;
    const pitch = size * (lh + rowGap), bleed = size * 0.22;
    let count = 0, expansion = 0;
    const rowStates = rows.map((row, index) => {
      if (index > 0 && caption.growUp) {
        const cue = origin + caption.times[count] - lead;
        expansion += pitch * prog(t, cue, cue + Math.min(dur, 0.36), cubicOut);
      }
      const result = {text: row, height: size * lh + bleed,
        marginBottom: index < rows.length - 1 ? size * rowGap - bleed : 0,
        characters: Array.from(row).map(ch => {
          const index = count++, cue = origin + caption.times[index] - lead;
          const p = prog(t, cue, cue + dur, expoOut);
          return {index, text: ch === ' ' ? '\u2002' : ch, y: (1 - p) * 105};
        })};
      return result;
    });
    const mark = caption.highlight ? full.indexOf(caption.highlight) : -1;
    const markStart = mark < 0 ? -1 : Array.from(full.slice(0, mark)).length;
    const markEnd = markStart + Array.from(caption.highlight || '').length;
    for (const row of rowStates) for (const ch of row.characters) ch.highlight = markStart >= 0 && ch.index >= markStart && ch.index < markEnd;
    return {visible: t >= origin + caption.times[0] - lead - 0.05,
      top: caption.y + (caption.growUp ? (rows.length - 1) * pitch - expansion : 0),
      height: caption.growUp ? size * lh + bleed + expansion : undefined,
      rows: rowStates};
  }
  function mount(root, caption = defaults) {
    const doc = root.ownerDocument, outer = doc.createElement('div');
    const light = doc.documentElement.dataset.theme === 'light';
    const color = light ? '#222226' : caption.color, accent = light ? '#217756' : caption.accent;
    Object.assign(outer.style, {position: 'absolute', left: caption.x + 'px', width: caption.width + 'px',
      textAlign: 'left', font: caption.size + 'px/' + caption.lineHeight + ' "Oswald", sans-serif',
      fontWeight: '700', color, letterSpacing: '0px', overflow: caption.growUp ? 'hidden' : 'visible'});
    outer.dataset.part = 'speech-caption';
    let index = 0;
    const rows = caption.rows.map(row => {
      const node = doc.createElement('div');
      Object.assign(node.style, {display: 'block', whiteSpace: 'pre', overflow: 'hidden', lineHeight: caption.size * caption.lineHeight + 'px'});
      const characters = Array.from(row).map(ch => {
        const clip = doc.createElement('span'), glyph = doc.createElement('span');
        clip.dataset.captionChar = String(index++);
        Object.assign(clip.style, {display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.22em'});
        glyph.style.display = 'inline-block'; glyph.textContent = ch === ' ' ? '\u2002' : ch;
        clip.append(glyph); node.append(clip); return glyph;
      });
      outer.append(node); return {node, characters};
    });
    const board = doc.createElement('div');
    Object.assign(board.style, {position: 'absolute', width: '1080px', height: '607.5px', transformOrigin: '0 0', transform: 'scale(' + 640 / 1080 + ')'});
    board.append(outer); root.replaceChildren(board);
    let destroyed = false;
    const set = (node, key, value) => {value = String(value); if (node.style[key] !== value) node.style[key] = value;};
    const draw = ms => {
      if (destroyed) return;
      const state = stateAt(ms / 1000, caption);
      set(outer, 'visibility', state.visible ? 'visible' : 'hidden'); set(outer, 'top', state.top + 'px');
      if (state.height !== undefined) set(outer, 'height', state.height + 'px');
      state.rows.forEach((row, i) => {
        set(rows[i].node, 'height', row.height + 'px'); set(rows[i].node, 'marginBottom', row.marginBottom + 'px');
        row.characters.forEach((ch, j) => {
          const glyph = rows[i].characters[j];
          set(glyph, 'transform', 'translateY(' + ch.y + '%)'); set(glyph, 'color', ch.highlight ? accent : '');
        });
      });
    };
    draw.destroy = () => {destroyed = true;};
    draw(0); return draw;
  }
  global.WiseSpeechCaption = Object.freeze({defaults, stateAt, mount});
})(globalThis);
