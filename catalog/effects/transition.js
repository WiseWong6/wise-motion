/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['rapid-cut'] = (root, M) => {
    // 原录屏的加速帧表：首张停留 17 帧，后面每 4–5 帧硬切；只取换图节奏。
    const cuts = [0, 17, 22, 27, 32, 37, 42, 47, 52, 56];
    const shapes = [
      [30, 52, 74, 96].map(r => `<circle cx="216" cy="122" r="${r}"/>`).join(''),
      [0, 1, 2, 3].map(i => `<rect x="${80 + i * 68}" y="${62 + i % 2 * 30}" width="46" height="90" rx="23"/>`).join(''),
      [0, 1, 2, 3, 4].map(i => `<path d="M${70 + i * 64} 58l-38 64 38 64"/>`).join(''),
      Array.from({length:48}, (_, i) => `<circle cx="${97 + i % 8 * 34}" cy="${57 + Math.floor(i / 8) * 29}" r="4" fill="currentColor" stroke="none"/>`).join(''),
      '<path d="M112 190L216 54 320 190Z"/><circle cx="216" cy="143" r="29"/>',
      Array.from({length:24}, (_, i) => { const a = i * Math.PI / 12; return `<path d="M${216 + Math.cos(a) * 35} ${122 + Math.sin(a) * 35}L${216 + Math.cos(a) * 98} ${122 + Math.sin(a) * 98}"/>`; }).join(''),
      '<path d="M202 45h28v63h63v28h-63v63h-28v-63h-63v-28h63Z"/>',
      Array.from({length:12}, (_, i) => `<rect x="${94 + i % 4 * 62}" y="${52 + Math.floor(i / 4) * 50}" width="56" height="40"/>`).join(''),
      [184, 256, 136].map((w, i) => `<rect x="${216 - w / 2}" y="${62 + i * 48}" width="${w}" height="25" rx="12.5"/>`).join(''),
      '<circle cx="216" cy="122" r="86"/><circle cx="216" cy="122" r="57"/><path d="M173 122h86M216 79v86"/>'
    ];
    root.innerHTML = '<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><g transform="translate(104 58)">' + shapes.map((shape, i) => {
      return `<g data-shot="${i}" display="${i ? 'none' : 'inline'}" style="color:var(--card-ink)"><rect width="432" height="244" rx="10" fill="var(--card)" stroke="var(--muted)" stroke-opacity=".18" stroke-width=".65"/><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">${shape}</g></g>`;
    }).join('') + '</g></svg>';
    const shots = [...root.querySelectorAll('[data-shot]')];
    let active = 0;
    return t => {
      const time = M.clamp(t, 0, 3000);
      let next = cuts.length - 1;
      while (cuts[next] * 1000 / 30 > time) next--;
      if (active === next) return;
      shots[active].setAttribute('display', 'none');
      shots[next].setAttribute('display', 'inline');
      active = next;
    };
  };
  F.wipe = (root, M) => {
    const s = M.scene(root, '<div class="panel"><strong>这一刻。</strong><small>原画面</small></div><div class="panel alt"><strong>下一刻。</strong><small>新画面</small></div>');
    return (t, o) => { const p = M.span(t, 700, 2500, o.ease); s.one('.panel.alt').style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0 round 24px)`; };
  };
  F['shared-object'] = (root, M) => {
    const s = M.scene(root, '<div class="panel shared-panel"><small class="old-label">内容列表</small><small class="new-label">内容详情</small></div>' + M.tile('这个想法', '跨过画面，保持连续'));
    // 保留主题变量，暂停画面和未挂入页面的缩略图也能随外观切换。
    return (t, o) => {
      const p = M.span(t, 900, 3000, o.ease), color = M.clamp(p);
      M.pose(s.one('.tile'), {x: -115 * (1 - p), y: 23 * (1 - p), scale: .55 + .45 * p});
      s.one('.old-label').style.opacity = String(1 - color);
      s.one('.new-label').style.opacity = String(color);
      s.one('.panel').style.setProperty('--object-progress', `${color * 100}%`);
    };
  };
  F['scene-carry'] = (root, M) => {
    // 简化原三列九格：按列上色后，同一组格子一起下移、等比放大。
    const colors=['var(--blue)','var(--teal)','var(--accent)'];
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><g data-part="grid" transform="translate(320 80) scale(.6)">'+colors.map((color,col)=>{
      const cells=Array.from({length:3},(_,row)=>{const x=(col-1)*68-28,y=(row-1)*68-28;
        return `<rect x="${x}" y="${y}" width="56" height="56" vector-effect="non-scaling-stroke"/>`;
      }).join('');
      return `<g fill="var(--panel)" stroke="var(--muted)" stroke-opacity=".45" stroke-width=".55">${cells}</g><g data-part="column${col}" fill="${color}" stroke="var(--ink)" stroke-width=".55" opacity="0">${cells}</g>`;
    }).join('')+'</g></svg>';
    const grid=root.querySelector('[data-part="grid"]'),columns=colors.map((_,i)=>root.querySelector(`[data-part="column${i}"]`));
    const set=(el,key,value)=>{const v=String(value);if(el.getAttribute(key)!==v)el.setAttribute(key,v);};
    return (t,o)=>{
      columns.forEach((col,i)=>set(col,'opacity',M.span(t,120+i*224,320+i*224,'outCubic')));
      const p=M.span(t,900,1750,o.ease);
      set(grid,'transform',`translate(320 ${M.mix(80,190,p)}) scale(${M.mix(.6,1.22,p)})`);
    };
  };
  F['zoom-transition'] = (root, M) => {
    const s = M.scene(root, '<div class="zoom-board"><div class="zoom-target">进入想法</div></div><div class="headline" style="top:164px">看见更深一层。</div>');
    return (t, o) => { const p = M.span(t, 800, 2700, o.ease); M.pose(s.one('.zoom-board'), {scale: 1 + p * 3.6, opacity: 1 - M.span(t, 2300, 3000)}); M.pose(s.one('.headline'), {opacity: M.span(t, 2700, 3500, o.ease)}); };
  };
})(globalThis.MotionFactories);
