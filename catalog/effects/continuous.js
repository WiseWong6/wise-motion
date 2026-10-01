/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['seamless-scroll'] = (root, M) => {
    const items = M.cardSet(); const s = M.scene(root, '<div class="scroll-mask"><div class="scroll-track">' + items + items + items + '</div></div>');
    return (t, o) => M.pose(s.one('.scroll-track'), {x: -(t / o.duration % 1) * 496});
  };
  F['curve-path'] = (root, M) => {
    const points = Array.from({length: 121}, (_, i) => { const p = M.curve(i / 120); return `${i ? 'L' : 'M'}${p.x},${p.y}`; }).join(' ');
    const s = M.scene(root, `<svg class="path-guide" viewBox="0 0 640 360"><path d="${points}"/></svg><div class="traveler">›</div>`);
    return (t, o) => { const p = M.ease(t / o.duration, o.ease); const a = M.curve(p), b = M.curve(p + .001); M.pose(s.one('.traveler'), {x: a.x, y: a.y, rotate: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI}); };
  };
  F.orbit = (root, M) => {
    const s = M.scene(root, '<div class="center-shape" style="left:282px;top:166px;width:76px;height:76px"></div>' + M.cardSet(5));
    const cards = s.all('.mini-card'); cards.forEach(c => { c.style.left = '266px'; c.style.top = '125px'; });
    return (t, o) => cards.forEach((c, i) => { const a = (M.ease(t / o.duration, o.ease) + i / 5) * Math.PI * 2; const z = Math.sin(a); M.pose(c, {x: Math.cos(a) * 215, y: z * 26, scale: .68 + (z + 1) * .16, ry: -Math.cos(a) * 16, opacity: .64 + (z + 1) * .18}); c.style.zIndex = String(Math.round((z + 1) * 20)); });
  };
  F.float = (root, M) => {
    const s = M.scene(root, M.tile('留一点轻盈', '缓慢起伏，保持安静'));
    return (t, o) => { const a = M.ease(t / o.duration, o.ease) * Math.PI * 2; M.pose(s.one('.tile'), {y: -Math.sin(a) * 18, rotate: Math.sin(a) * 1.4}); };
  };
})(globalThis.MotionFactories);
