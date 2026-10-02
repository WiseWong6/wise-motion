/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F.follow = (root, M) => {
    const s = M.scene(root, '<div class="traveler">›</div>' + Array.from({length: 3}, () => '<div class="orb" style="left:-14px;top:-14px"></div>').join('')); const leader = s.one('.traveler'), followers = s.all('.orb');
    return (t, o) => { const p = M.ease(t / o.duration, o.ease); const a = M.curve(p); M.pose(leader, {x: a.x, y: a.y}); followers.forEach((c, i) => { const b = M.curve(p - (i + 1) * .055); M.pose(c, {x: b.x, y: b.y, scale: .78 - i * .13, opacity: .7 - i * .15}); }); };
  };
  F.detach = (root, M) => {
    const s = M.scene(root, '<div class="seed-body"></div>' + Array.from({length: 8}, () => '<div class="seed"></div>').join('')); const seeds = s.all('.seed');
    return (t, o) => seeds.forEach((c, i) => { const a = i / 8 * Math.PI * 2, p = M.span(t, 900 + i * 130, 3300 + i * 130, o.ease); const radius = 42 + p * (92 + i * 4); M.pose(c, {x: 314 + Math.cos(a) * radius + p * 64, y: 174 + Math.sin(a) * radius - p * 18, scale: 1 - p * .35, opacity: 1 - M.clamp(p)}); });
  };
  F['group-stagger'] = (root, M) => {
    const s = M.scene(root, '<div class="dot-grid">' + Array.from({length: 35}, () => '<div class="grid-dot"></div>').join('') + '</div>'); const dots = s.all('.grid-dot');
    return (t, o) => dots.forEach((c, i) => { const distance = Math.hypot(i % 7 - 3, Math.floor(i / 7) - 2); const start = 500 + distance * 300; const q = M.clamp((t - start) / 1000); const p = Math.sin(M.ease(q, o.ease) * Math.PI); M.pose(c, {y: -p * 15, scale: 1 + p * .55, opacity: .5 + p * .5}); });
  };
})(globalThis.MotionFactories);
