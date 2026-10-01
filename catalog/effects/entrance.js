/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['fade-rise'] = (root, M) => {
    const s = M.scene(root, M.tile());
    return (t, o) => { const p = M.span(t, 150, 1350, o.ease); M.pose(s.one('.tile'), {y: 48 * (1 - p), opacity: p}); };
  };
  F['mask-reveal'] = (root, M) => {
    const s = M.scene(root, '<div class="reveal-clip"><div class="headline">让好想法，<br><span class="muted">被看见。</span></div></div>');
    return (t, o) => { const p = M.span(t, 200, 1900, o.ease); s.one('.reveal-clip').style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`; };
  };
  F['scale-in'] = (root, M) => {
    const s = M.scene(root, M.tile('值得注意', '一次登场，一次落定'));
    return (t, o) => { const p = M.span(t, 150, 1300, o.ease); const bounce = Math.sin(M.clamp((t - 150) / 1150) * Math.PI) * .08; M.pose(s.one('.tile'), {scale: .66 + .34 * p + bounce, opacity: M.span(t, 100, 600)}); };
  };
  F['stagger-in'] = (root, M) => {
    const s = M.scene(root, M.cardSet());
    const cards = s.all('.mini-card'); cards.forEach((c, i) => { c.style.left = `${80 + i * 124}px`; c.style.top = '111px'; });
    return (t, o) => cards.forEach((c, i) => { const p = M.span(t, 200 + i * 300, 1100 + i * 300, o.ease); M.pose(c, {y: 44 * (1 - p), opacity: p}); });
  };
})(globalThis.MotionFactories);
