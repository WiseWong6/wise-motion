/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F.wipe = (root, M) => {
    const s = M.scene(root, '<div class="panel"><strong>这一刻。</strong><small>原画面</small></div><div class="panel alt"><strong>下一刻。</strong><small>新画面</small></div>');
    return (t, o) => { const p = M.span(t, 700, 2500, o.ease); s.one('.panel.alt').style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0 round 24px)`; };
  };
  F['shared-object'] = (root, M) => {
    const s = M.scene(root, '<div class="panel"><small class="old-label">内容列表</small><small class="new-label">内容详情</small></div>' + M.tile('这个想法', '跨过画面，保持连续'));
    const channels = name => { const hex = getComputedStyle(root).getPropertyValue(name).trim().replace('#', ''); const n = Number.parseInt(hex, 16); if (!Number.isFinite(n) || hex.length < 6) return name === '--panel' ? [232, 238, 251] : [220, 231, 251]; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    return (t, o) => { const p = M.span(t, 900, 3000, o.ease); const from = channels('--panel'), to = channels('--panel-alt'); M.pose(s.one('.tile'), {x: -115 * (1 - p), y: 23 * (1 - p), scale: .55 + .45 * p}); s.one('.old-label').style.opacity = String(1 - M.clamp(p)); s.one('.new-label').style.opacity = String(M.clamp(p)); s.one('.panel').style.background = `rgb(${M.mix(from[0], to[0], p)},${M.mix(from[1], to[1], p)},${M.mix(from[2], to[2], p)})`; };
  };
  F['zoom-transition'] = (root, M) => {
    const s = M.scene(root, '<div class="zoom-board"><div class="zoom-target">进入想法</div></div><div class="headline" style="font-size:38px;top:164px">看见更深一层。</div>');
    return (t, o) => { const p = M.span(t, 800, 2700, o.ease); M.pose(s.one('.zoom-board'), {scale: 1 + p * 3.6, opacity: 1 - M.span(t, 2300, 3000)}); M.pose(s.one('.headline'), {opacity: M.span(t, 2700, 3500, o.ease)}); };
  };
  F.parallax = (root, M) => {
    const s = M.scene(root, '<div class="landscape"><div class="sun"></div><div class="hill far"></div><div class="hill mid"></div><div class="hill near"></div></div>');
    return (t, o) => { const p = Math.sin(M.ease(t / o.duration, o.ease) * Math.PI * 2); ['.sun','.far','.mid','.near'].forEach((key, i) => M.pose(s.one(key), {x: p * [8, 24, 55, 100][i]})); };
  };
})(globalThis.MotionFactories);
