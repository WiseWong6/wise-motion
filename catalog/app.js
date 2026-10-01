/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function () {
  'use strict';
  const data = {...MotionRegistry, categories:[...MotionRegistry.categories,...MotionHistory.categories], effects:[...MotionRegistry.effects,...MotionHistory.recipes]}, $ = id => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const labels = {prompt:'提示词', code:'代码'};
  const categoryName = id => data.categories.find(x => x.id === id)?.name || '';

  /* 内联图标参考 Lucide 1.8.0，部分继承 Feather；路径分别保留 ISC / MIT 来源，完整声明见 vendor/lucide/LICENSE。
     Copyright (c) 2026 Lucide Icons and Contributors; Copyright (c) 2013-present Cole Bemis.
     调整外层尺寸与笔画，侧栏展开 / 收起箭头为本地适配。vendor 里的 Heroicons 保持原样。 */
  const EXTRA = {
    'bars-3':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>',
    'magnifying-glass':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
    'rectangle-stack':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>',
    'expand':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>',
    'arrow-path':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    'play':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>',
    'pause':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>',
    'chevron-right':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    'chevron-down':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    'check':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    'minus':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    'plus':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    'clipboard-document':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    'theme-sun':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    'theme-moon':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>',
    'theme-monitor':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>'
  };
  EXTRA.close = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  EXTRA['panel-collapse'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 15l-3-3 3-3"/></svg>';
  EXTRA['panel-expand'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m4-12 3 3-3 3"/></svg>';
  MotionIcons['chevron-down'] = EXTRA['chevron-down'];
  MotionIcons.check = EXTRA.check;
  const icon = name => EXTRA[name] || MotionIcons[name] || '';
  const mark = name => `<span data-icon="${name}">${icon(name)}</span>`;

  let kind = 'action', category = 'all', domain = 'all', tab = 'prompt', selected = null, controller = null;
  let debounce = null, resumeAfterVisible = false, lastPlayback = null, lastPaused = null;
  let navigationIds = [];
  const collapsed = new Set();
  const icons = {
    'fade-rise':'arrow-up', 'mask-reveal':'viewfinder-circle', 'scale-in':'arrows-pointing-out', 'stagger-in':'queue-list',
    'seamless-scroll':'arrows-right-left', 'curve-path':'arrow-trending-up', 'orbit':'arrow-path', 'float':'arrows-up-down',
    'count-up':'hashtag', 'type-reveal':'cursor-arrow-rays', 'highlight':'pencil-square', 'focus-zoom':'magnifying-glass-plus',
    'shape-morph':'sparkles', 'card-flip':'arrow-uturn-left', 'layout-reorder':'squares-2x2', 'layer-expand':'square-3-stack-3d',
    'wipe':'rectangle-stack', 'shared-object':'document-duplicate', 'zoom-transition':'magnifying-glass', 'parallax':'photo',
    'follow':'arrow-right', 'detach':'sun', 'ripple':'radio', 'group-stagger':'bars-3-bottom-left',
    'dual-scroll':'arrows-right-left', 'subtitle-focus':'chat-bubble-bottom-center-text', 'arc-cards':'film',
    'title-content':'document-text', 'interface-feedback':'cursor-arrow-ripple', 'environment-chain':'share'
  };

  document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });

  // 复制成功后图标弹簧换成对勾，稍后弹回。刚度与阻尼对齐参考里的 spring。
  document.querySelectorAll('.copy-btn').forEach(button => {
    const [copyIcon, checkIcon] = button.querySelectorAll('.copy-morph-icon');
    const nodes = [
      {el: copyIcon, scale: 1, opacity: 1, vScale: 0, vOpacity: 0, goalScale: 1, goalOpacity: 1},
      {el: checkIcon, scale: .5, opacity: 0, vScale: 0, vOpacity: 0, goalScale: .5, goalOpacity: 0}
    ];
    let raf = 0, last = 0, resetTimer = 0;
    function paint() {
      for (const node of nodes) {
        node.el.style.transform = `scale(${node.scale})`;
        node.el.style.opacity = String(node.opacity);
      }
    }
    function tick(now) {
      const dt = Math.min(.034, (now - last) / 1000 || .016);
      last = now;
      let moving = false;
      for (const node of nodes) {
        for (const [value, goal, vel] of [['scale', 'goalScale', 'vScale'], ['opacity', 'goalOpacity', 'vOpacity']]) {
          const error = node[goal] - node[value];
          node[vel] += (600 * error - 25 * node[vel]) * dt;
          node[value] += node[vel] * dt;
          if (Math.abs(error) > .012 || Math.abs(node[vel]) > .04) moving = true;
        }
      }
      paint();
      if (moving) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        for (const node of nodes) { node.scale = node.goalScale; node.opacity = node.goalOpacity; node.vScale = node.vOpacity = 0; }
        paint();
      }
    }
    function showCheck(on) {
      nodes[0].goalScale = on ? .5 : 1;
      nodes[0].goalOpacity = on ? 0 : 1;
      nodes[1].goalScale = on ? 1 : .5;
      nodes[1].goalOpacity = on ? 1 : 0;
      if (reducedMotion.matches) {
        cancelAnimationFrame(raf);
        raf = 0;
        for (const node of nodes) { node.scale = node.goalScale; node.opacity = node.goalOpacity; node.vScale = node.vOpacity = 0; }
        paint();
        return;
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }
    button.showCopied = () => {
      showCheck(true);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => showCheck(false), 1400);
    };
    button.resetCopyIcon = () => {
      clearTimeout(resetTimer);
      showCheck(false);
    };
    paint();
  });
  const searchControl = document.querySelector('.search-control');
  const categories = MotionDropdown($('category-filter'), $('category-options'), {
    iconOnly: true,
    hoverRoot: searchControl,
    anchor: searchControl.querySelector('.search')
  });
  const easing = MotionDropdown($('ease'), $('ease-options'));

  function renderCategories() {
    const cats = [{id:'all', name:{action:'全部动作',composition:'全部组合',recipe:'全部历史配方'}[kind]}, ...data.categories.filter(x => data.effects.some(e=>e.kind===kind&&e.category===x.id))];
    categories.setOptions(cats.map(c => ({value:c.id,label:c.name})), category);
    document.querySelectorAll('[data-kind]').forEach(button => {
      const active = button.dataset.kind === kind;
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('.pill-count').textContent=data.effects.filter(e=>e.kind===button.dataset.kind).length;
    });
  }

  function card(effect) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'effect-item';
    button.dataset.effect = effect.id;
    button.setAttribute('aria-current', String(selected?.id === effect.id));
    button.innerHTML = `<span class="thumb" aria-hidden="true"></span><span class="effect-name">${MotionKit.escape(effect.name)}</span>`;
    MotionThumbs.attach(button.querySelector('.thumb'), effect);
    return button;
  }

  function renderList() {
    const query = $('search').value.trim(), matches = query ? MotionMatch.rank(data, query) : [];
    const candidates = query ? matches.map(m => m.effect) : data.effects;
    const effects = candidates.filter(e => e.kind === kind && (category === 'all' || e.category === category) && (domain==='all'||(e.domains||[e.domain||'animation']).includes(domain)));
    $('empty').hidden = !!effects.length;
    $('match-note').hidden = !query || !matches.length;
    if (query && matches.length) {
      const match = matches.find(m => m.effect.id === effects[0]?.id) || matches[0];
      $('match-note').textContent = effects.length ? `匹配依据：${match.matched.join('、')}。` : `匹配到「${match.effect.name}」，请切到${match.effect.kind === 'action' ? '单个动作' : '组合片段'}的全部分类。`;
    }
    const list = $('effects-list');
    const focusedId = list.contains(document.activeElement) ? document.activeElement.dataset.effect : null;
    list.querySelectorAll('.thumb').forEach(host => MotionThumbs.release(host));
    list.replaceChildren();
    const groups = query ? [{id:'matches', name:'匹配结果'}] : data.categories;
    for (const group of groups) {
      const items = query ? effects : effects.filter(e => e.category === group.id);
      if (!items.length) continue;
      const open = !collapsed.has(group.id);
      const section = document.createElement('section');
      section.className = 'effect-group';
      section.innerHTML =
        `<button class="group-head" data-group="${group.id}" aria-expanded="${open}">${mark('chevron-right')}<span class="group-name">${MotionKit.escape(group.name)}</span><span class="pill-count">${items.length}</span></button>`;
      const grid = document.createElement('div');
      grid.className = 'effect-grid';
      for (const effect of items) grid.append(card(effect));
      section.append(grid);
      list.append(section);
    }
    // 和用户看到的分组、搜索排序一致；收起分组不改变浏览顺序。
    navigationIds = [...list.querySelectorAll('.effect-item')].map(button => button.dataset.effect);
    syncNavigation();
    if (focusedId) list.querySelector(`[data-effect="${focusedId}"]`)?.focus();
  }

  function adjacentEffect(direction) {
    if (!navigationIds.length) return null;
    const index = navigationIds.indexOf(selected?.id);
    const next = index < 0 ? (direction > 0 ? 0 : navigationIds.length - 1)
      : (index + direction + navigationIds.length) % navigationIds.length;
    return navigationIds[next] === selected?.id ? null : navigationIds[next];
  }

  function syncNavigation() {
    for (const [id, direction, label, key] of [['previous-effect',-1,'上一个动效','←'], ['next-effect',1,'下一个动效','→']]) {
      const target = adjacentEffect(direction), button = $(id);
      const name = data.effects.find(effect => effect.id === target)?.name;
      button.disabled = !target;
      button.setAttribute('aria-label', name ? `${label}：${name}` : label);
      button.title = `${name ? `${label}：${name}` : label}（${key}）`;
    }
  }

  function syncSelection() {
    // 切换预览只更新选中状态，不拆掉目录和已绘制的缩略图。
    $('effects-list').querySelectorAll('.effect-item').forEach(button => {
      button.setAttribute('aria-current', String(button.dataset.effect === selected?.id));
    });
    syncNavigation();
  }

  function navigateEffect(direction) {
    // 输入后立即点击也使用最新结果，不等待搜索的短延迟。
    if (debounce !== null) { clearTimeout(debounce); debounce = null; renderList(); }
    const id = adjacentEffect(direction);
    if (!id) return false;
    const focusInList = $('effects-list').contains(document.activeElement);
    const effect = data.effects.find(effect => effect.id === id);
    const group = $('search').value.trim() ? 'matches' : effect.category;
    collapsed.delete(group);
    $('effects-list').querySelector(`[data-group="${group}"]`)?.setAttribute('aria-expanded', 'true');
    selectEffect(id);
    const card = $('effects-list').querySelector(`.effect-item[data-effect="${id}"]`);
    if (!$('directory-panel').hidden) card?.scrollIntoView?.({block:'nearest'});
    if (focusInList) card?.focus({preventScroll:true});
    return true;
  }

  $('previous-effect').addEventListener('click', () => navigateEffect(-1));
  $('next-effect').addEventListener('click', () => navigateEffect(1));

  function settings() { return {speed:controller?.speed || 1, ease:$('ease').value,caseId:selected?.selected_entry?.id}; }

  function updateOutputs() {
    if (!selected || !controller) return;
    const values = settings();
    $('prompt').textContent = MotionExport.prompt(selected, values, data);
    $('code').textContent = MotionExport.code(selected, values);
    document.querySelectorAll('.copy-status').forEach(element => { element.textContent = ''; });
  }

  /* HIG: 轨道从最小值填到滑块。jsdom 下没有布局也不影响，这里只写 CSS 变量。 */
  function fillTrack(input) {
    const min = Number(input.min || 0), max = Number(input.max || 100);
    const ratio = (Number(input.value) - min) / (max - min);
    input.style.setProperty('--fill', (Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) * 100 : 0) + '%');
  }

  function syncPlayer(state) {
    $('scrub').value = state.time / state.duration * 1000;
    fillTrack($('scrub'));
    const elapsed = state.time / 1000;
    const remaining = Math.max(0, state.duration - state.time) / 1000;
    $('time').textContent = `已播放 ${elapsed.toFixed(1)} 秒，剩余 ${remaining.toFixed(1)} 秒`;
    $('time-current').textContent = elapsed.toFixed(1);
    $('time-total').textContent = remaining.toFixed(1);
    if (lastPaused !== state.paused) {
      const playing = !state.paused;
      $('toggle-play').innerHTML = icon(playing ? 'pause' : 'play');
      const label = playing ? '暂停当前动效' : '播放当前动效';
      $('toggle-play').setAttribute('aria-label', label);
      $('toggle-play').title = playing ? '暂停' : '播放';
      lastPaused = state.paused;
    }
    $('scrub').setAttribute('aria-valuetext', `${elapsed.toFixed(1)} 秒，剩余 ${remaining.toFixed(1)} 秒`);
  }

  function renderFacts(effect) {
    const speed = Number($('speed').value);
    const seconds = (effect.duration_ms / 1000 / speed).toFixed(2);
    const rows = [
      ['用途', effect.purpose],
      ['对象', effect.objects],
      ['节奏', `${seconds} 秒完成一次${effect.loop ? '，循环播放' : ''}`],
      ['类比', effect.analogy],
      ['分类', categoryName(effect.category)]
    ];
    $('ins-facts').innerHTML = rows
      .filter(([, value]) => value)
      .map(([key, value]) => `<div class="fact"><dt>${MotionKit.escape(key)}</dt><dd>${MotionKit.escape(value)}</dd></div>`)
      .join('');
  }

  function sourceLink(name, url) {
    const label = MotionKit.escape(name);
    try {
      const target = new URL(url, document.baseURI);
      if (!['https:', 'http:', 'file:'].includes(target.protocol)) return label;
      return `<a href="${MotionKit.escape(target.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    } catch (_) { return label; }
  }

  function renderSource(effect) {
    const source = effect.source;
    const upstream = source.upstream;
    const lines = [];
    if (effect.kind==='recipe') {
      lines.push(`原作：${MotionKit.escape(effect.original_sources.join('、'))}。${MotionKit.escape(effect.review.label)}。`);
      lines.push('原代码与素材保留各自许可，本轮只引用本机原作。');
    } else if (source.origin === 'adapted' && upstream?.name && upstream?.url && upstream?.license && upstream?.license_url) {
      lines.push(`AI 改编自 ${sourceLink(upstream.name, upstream.url)} 的代码，遵循 ${sourceLink(upstream.license, upstream.license_url)} 许可。`);
    } else if (source.origin === 'original') {
      const reference = source.reference;
      if (reference?.name && reference?.url) {
        lines.push(`效果参考 ${sourceLink(reference.name, reference.url)}。`);
      }
    } else {
      lines.push('代码来源与协议待核实。');
    }
    $('preview-source').innerHTML = lines.map(line => `<p class="source-line">${line}</p>`).join('');
    $('preview-source').closest('.preview-source').hidden = lines.length === 0;
  }

  /* HIG：滑块配一个数值框和加减号，方便精确取值。
   数值框、拖动、加减号三处共用同一份状态，改哪边都会同步。 */
  const speedInput = $('speed');
  const formatSpeed = value => String(+Number(value).toFixed(4));
  function paintSpeed(value, syncText = true) {
    const min = Number(speedInput.min), max = Number(speedInput.max), step = Number(speedInput.step);
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    const snapped = Math.min(max, Math.max(min, Math.round((n - min) / step) * step + min));
    const exact = +snapped.toFixed(4);
    speedInput.value = String(exact);
    fillTrack(speedInput);
    if (syncText) $('speed-value').value = formatSpeed(exact);
    speedInput.setAttribute('aria-valuetext', formatSpeed(exact) + ' 播放速度');
    $('speed-down').disabled = exact <= min;
    $('speed-up').disabled = exact >= max;
  }
  function applySpeed(value, syncText = true) {
    paintSpeed(value, syncText);
    controller?.setSpeed(Number(speedInput.value));
    if (selected) renderFacts(selected);
    updateOutputs();
  }

  function selectEffect(id, preserved = null, caseId = null) {
    let effect = data.effects.find(e => e.id === id);
    if (!effect) return;
    if(effect.kind==='recipe'){
      const entry=effect.entries.find(e=>e.id===(caseId||preserved?.caseId))||effect.entries[0];
      const duration=Math.round(entry.preview.duration*1000);
      effect={...effect,selected_entry:entry,duration_ms:duration,preview_ms:Math.round(duration*(typeof entry.preview.poster==='number'?entry.preview.poster:.65))};
    }
    categories.close();
    easing.close();
    controller?.destroy();
    selected = effect;
    resumeAfterVisible = false;
    $('preview-title').textContent = effect.name;
    $('preview-summary').textContent = effect.summary;
    renderSource(effect);
    $('selection-status').textContent = `当前动效：${effect.name}。${effect.summary}`;
    $('preview').setAttribute('aria-label', effect.name);
    paintSpeed(preserved?.speed || 1);
    easing.setOptions((effect.parameters.ease?.options || [effect.default_ease]).map(value => ({value, label:MotionMatch.easeLabels[value]})), preserved?.ease || effect.default_ease);
    $('ease-label').hidden = !effect.parameters.ease;
    $('fixed-ease').hidden = !!effect.parameters.ease;
    $('fixed-ease').textContent=effect.tempo_note;
    const related = effect.kind==='recipe' ? effect.actions : effect.actions.length ? effect.actions : data.effects.filter(e => e.kind!=='recipe'&&e.actions.includes(effect.id)).map(e => e.id);
    $('related').innerHTML = related.length
      ? `<p class="field-label" style="margin-top:18px">${effect.kind==='recipe' ? '提炼的组成动作' : effect.actions.length ? '所用动作' : '使用这个动作的组合'}</p><div class="related-chips">${related.map(rid => `<button class="btn" data-related="${rid}">${MotionKit.escape(data.effects.find(e => e.id === rid).name)}</button>`).join('')}</div>`
      : '';
    const historyRelated=effect.kind==='recipe'?effect.related_history.filter(rid=>data.effects.some(e=>e.id===rid)):[];
    if(historyRelated.length)$('related').innerHTML+=`<p class="field-label" style="margin-top:18px">关联原作配方</p><div class="related-chips">${historyRelated.map(rid=>`<button class="btn" data-related="${rid}">${MotionKit.escape(data.effects.find(e=>e.id===rid).name)}</button>`).join('')}</div>`;
    renderHistoryDetails(effect);
    renderFacts(effect);
    controller = effect.kind==='recipe' ? MotionHistoryRuntime.create($('preview'),effect,{onUpdate:syncPlayer,caseId:effect.selected_entry.id}) : MotionRuntime.create($('preview'), effect, {onUpdate:syncPlayer});
    controller.setSpeed(Number($('speed').value));
    controller.setEase($('ease').value);
    if (preserved) {
      controller.seek(preserved.time);
      if (!preserved.paused && !reducedMotion.matches) controller.play();
    } else if (reducedMotion.matches) {
      controller.seek(effect.preview_ms);
    } else {
      controller.play();
    }
    syncPlayer({time:controller.currentTime, duration:effect.duration_ms, paused:controller.paused});
    updateOutputs();
    renderFacts(effect);
    syncSelection();
  }

  function renderHistoryDetails(effect){
    const host=$('history-details');host.hidden=effect.kind!=='recipe';
    if(host.hidden){host.replaceChildren();return;}
    const entry=effect.selected_entry, esc=MotionKit.escape;
    host.innerHTML=`<label>原作案例<select id="history-case" class="history-case">${effect.entries.map(e=>`<option value="${esc(e.id)}"${e.id===entry.id?' selected':''}>${esc(e.name)}</option>`).join('')}</select></label>`+
      `<p><strong>必须保留：</strong>${esc(effect.retain)}</p><p><strong>原作节奏：</strong>${esc(effect.source_clock)}</p>`+
      (effect.actions.length?`<p>${esc(effect.review.reuse_contract.case_boundary)}</p>`:'')+
      (effect.review.document_contract?`<p><strong>文稿交接：</strong>${esc(Object.values(effect.review.document_contract).join('；'))}</p>`:'')+
      `<details><summary>迁用条件、原参数与本案例源码</summary><p><strong>主控制量：</strong>${esc(effect.review.reuse_contract.primary_control)}</p><p><strong>迁用输入：</strong>${esc(effect.review.reuse_contract.input)}</p><p><strong>稳定关系：</strong>${esc(effect.review.reuse_contract.invariant)}</p><p>${esc(effect.source_parameters)}</p>${entry.code.map(ref=>`<p>${sourceLink('打开源码',ref.file)}：${esc(ref.anchors.map(a=>a.symbol+'（第 '+a.line+' 行）').join('、'))}</p>`).join('')}</details>`+
      (entry.preview.file?`<p>${sourceLink('打开原作画面',entry.preview.file)}</p>`:'')+
      (entry.context_note?`<p>${esc(entry.context_note)}</p>`:'')+
      (effect.review.correction?`<p>${esc(effect.review.correction)}</p>`:'');
    $('history-case').addEventListener('change',event=>selectEffect(effect.id,{speed:Number($('speed').value),ease:'linear',time:0,paused:true},event.target.value));
  }

  function setTab(next, focus = false) {
    tab = next;
    document.querySelectorAll('[data-tab]').forEach(button => {
      const active = button.dataset.tab === next;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      $('panel-' + button.dataset.tab).hidden = !active;
      if (active && focus) button.focus();
    });
    document.querySelectorAll('.copy-btn').forEach(button => button.resetCopyIcon?.());
    document.querySelectorAll('.copy-status').forEach(element => { element.textContent = ''; });
  }

  function setSection(name, open) {
    const head = document.querySelector(`.ins-head[data-section="${name}"]`);
    if (!head) return;
    head.setAttribute('aria-expanded', String(open));
    $(head.getAttribute('aria-controls')).hidden = !open;
  }

  async function copyOutput(copiedTab) {
    const button = $('copy-' + copiedTab), text = $(copiedTab).textContent, status = $('copy-status-' + copiedTab);
    let ok = false;
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch (_) { /* 本地文件使用复制回退。 */ }
    if (!ok) {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('aria-label', '待复制的' + labels[copiedTab]);
      field.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;';
      document.body.append(field);
      field.focus();
      field.select();
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      field.remove();
      button.focus();
    }
    if (ok) {
      status.textContent = '';
      button.showCopied?.();
    } else {
      setTab(copiedTab);
      const range = document.createRange();
      range.selectNodeContents($(copiedTab));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = '已选中文字，请按系统复制快捷键';
    }
  }

  /* 与 CSS 的 1119px 断点一致。桌面记住收起状态，窄屏默认先看预览。 */
  const directoryMedia = window.matchMedia('(max-width:1119px)');
  let desktopDirectoryOpen = true, directoryFocus = null;
  function setDirectory(expanded, {focus = false} = {}) {
    const modal = directoryMedia.matches && expanded;
    if (modal && $('directory-panel').hidden) directoryFocus = document.activeElement;
    categories.close();
    $('directory-panel').hidden = !expanded;
    document.querySelector('.workbench').classList.toggle('no-directory', !expanded);
    document.body.classList.toggle('directory-open', modal);
    $('directory-backdrop').hidden = !modal;
    document.querySelectorAll('.sidebar-header,.stage,.inspector').forEach(element => { element.inert = modal; });
    if (modal) {
      $('directory-panel').setAttribute('role', 'dialog');
      $('directory-panel').setAttribute('aria-modal', 'true');
    } else {
      $('directory-panel').removeAttribute('role');
      $('directory-panel').removeAttribute('aria-modal');
    }
    $('toggle-directory').setAttribute('aria-expanded', String(expanded));
    $('toggle-directory').innerHTML = icon(expanded ? 'panel-collapse' : 'panel-expand');
    const label = expanded ? '收起动效目录' : '展开动效目录';
    $('toggle-directory').setAttribute('aria-label', label);
    $('toggle-directory').title = label;
    MotionRuntime.fit($('preview'));
    MotionThumbs.resize();
    if (modal && focus) $('search').focus({preventScroll:true});
    else if (!expanded && focus) (directoryFocus?.isConnected ? directoryFocus : $('toggle-directory')).focus({preventScroll:true});
  }
  $('toggle-directory').addEventListener('click', () => {
    const expanded = $('directory-panel').hidden;
    if (!directoryMedia.matches) desktopDirectoryOpen = expanded;
    setDirectory(expanded, {focus:true});
  });
  $('close-directory').addEventListener('click', () => setDirectory(false, {focus:true}));
  $('directory-backdrop').addEventListener('click', () => setDirectory(false, {focus:true}));
  directoryMedia.addEventListener('change', () => setDirectory(directoryMedia.matches ? false : desktopDirectoryOpen));

  $('effects-list').addEventListener('click', event => {
    const group = event.target.closest('[data-group]');
    if (group) {
      const open = group.getAttribute('aria-expanded') !== 'true';
      group.setAttribute('aria-expanded', String(open));
      if (open) collapsed.delete(group.dataset.group); else collapsed.add(group.dataset.group);
      return;
    }
    const button = event.target.closest('[data-effect]');
    if (button) {
      selectEffect(button.dataset.effect);
      if (directoryMedia.matches) setDirectory(false, {focus:true});
    }
  });

  $('effects-list').addEventListener('keydown', event => {
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    const buttons = [...$('effects-list').querySelectorAll('[data-effect]')];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.min(buttons.length - 1, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)));
    event.preventDefault();
    buttons[next].focus();
  });

  function updateMotionPreference() {
    $('motion-setting').hidden = !reducedMotion.matches;
    $('motion-setting').textContent = '已遵循系统的“减少动态效果”设置。点击播放可查看当前动作。';
    if (reducedMotion.matches) { controller?.pause(); resumeAfterVisible = false; }
  }

  reducedMotion.addEventListener?.('change', updateMotionPreference);

  document.querySelector('.kind-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-kind]');
    if (!button) return;
    kind = button.dataset.kind;
    category = 'all';
    renderCategories();
    renderList();
  });
  document.querySelector('.domain-tabs').addEventListener('click',event=>{
    const button=event.target.closest('[data-domain]');if(!button)return;domain=button.dataset.domain;
    document.querySelectorAll('[data-domain]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderList();
  });

  document.querySelectorAll('.ins-head').forEach(head => head.addEventListener('click', () => {
    setSection(head.dataset.section, head.getAttribute('aria-expanded') !== 'true');
  }));

  $('category-filter').addEventListener('change', () => { category = $('category-filter').value; renderList(); });
  $('related').addEventListener('click', event => {
    const button = event.target.closest('[data-related]');
    if (!button) return;
    kind = data.effects.find(e => e.id === button.dataset.related).kind;
    domain='all';document.querySelectorAll('[data-domain]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.domain==='all')));
    category = 'all';
    $('search').value = '';
    clearTimeout(debounce);
    debounce = null;
    renderCategories();
    renderList();
    selectEffect(button.dataset.related);
    $('preview-title').focus();
  });
  $('search').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { debounce = null; renderList(); }, 120);
  });
  $('clear-search').addEventListener('click', () => {
    clearTimeout(debounce);
    debounce = null;
    $('search').value = '';
    category = 'all';
    renderCategories();
    renderList();
  });
  $('toggle-play').addEventListener('click', () => { if (controller?.paused) controller.play(); else controller?.pause(); });
  $('restart').addEventListener('click', () => controller?.restart());
  const stage = document.querySelector('.stage');
  const playbar = document.querySelector('.playbar');
  let pointerInStage = false;
  function showPlaybar(visible) {
    playbar.classList.toggle('is-away', !visible);
  }
  stage.addEventListener('pointerenter', () => { pointerInStage = true; showPlaybar(true); });
  stage.addEventListener('pointerleave', () => {
    pointerInStage = false;
    if (!playbar.contains(document.activeElement)) showPlaybar(false);
  });
  playbar.addEventListener('focusin', () => showPlaybar(true));
  playbar.addEventListener('focusout', () => { if (!pointerInStage) showPlaybar(false); });
  setTimeout(() => {
    if (!pointerInStage && !playbar.contains(document.activeElement)) showPlaybar(false);
  }, 2400);
  $('scrub').addEventListener('input', () => {
    if (!controller || !selected) return;
    const target = Number($('scrub').value) / 1000 * selected.duration_ms;
    controller.pause();
    controller.seek(target);
    fillTrack($('scrub'));
  });
  speedInput.addEventListener('input', () => applySpeed(speedInput.value));
  $('speed-value').addEventListener('input', () => {
    // 输入过程中先不重排文字，只在能解析成数字时给出实时反馈；空串不当作 0。
    const raw = $('speed-value').value.trim();
    if (raw !== '' && Number.isFinite(Number(raw))) applySpeed(Number(raw), false);
  });
  const commitSpeed = () => applySpeed($('speed-value').value);
  $('speed-value').addEventListener('change', commitSpeed);
  $('speed-value').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); commitSpeed(); $('speed-value').blur(); }
    else if (event.key === 'Escape') { $('speed-value').value = formatSpeed(speedInput.value); }
  });
  $('speed-down').addEventListener('click', () => applySpeed(Number(speedInput.value) - Number(speedInput.step)));
  $('speed-up').addEventListener('click', () => applySpeed(Number(speedInput.value) + Number(speedInput.step)));
  $('ease').addEventListener('change', () => { controller?.setEase($('ease').value); updateOutputs(); });

  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('preview').requestFullscreen();
    } catch (_) {
      // 浏览器拒绝全屏时保持当前视图，不打断操作。
    }
  });

  const tabs = document.querySelector('.output-tabs');
  tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-tab]');
    if (button) setTab(button.dataset.tab);
  });
  tabs.addEventListener('keydown', event => {
    const names = ['prompt','code'], index = names.indexOf(tab);
    const next = event.key === 'ArrowRight' || event.key === 'ArrowLeft' ? names[(index + 1) % 2] : event.key === 'Home' ? names[0] : event.key === 'End' ? names[1] : null;
    if (next) { event.preventDefault(); setTab(next, true); }
  });

  document.querySelector('.inspector-content').addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (button) copyOutput(button.dataset.copy);
  });

  document.addEventListener('keydown', event => {
    if (['ArrowLeft','ArrowRight'].includes(event.key) && !event.defaultPrevented && !event.isComposing &&
      !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey &&
      !event.target.closest('input,textarea,select,pre,[contenteditable]:not([contenteditable="false"]),[role="tablist"],[role="listbox"],[role="menu"]') &&
      $('category-filter').getAttribute('aria-expanded') !== 'true' && $('ease').getAttribute('aria-expanded') !== 'true' &&
      !(directoryMedia.matches && !$('directory-panel').hidden)) {
      if (navigateEffect(event.key === 'ArrowRight' ? 1 : -1)) event.preventDefault();
    }
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !['INPUT','TEXTAREA','SELECT','PRE'].includes(event.target.tagName) && !event.target.isContentEditable) {
      event.preventDefault();
      if ($('directory-panel').hidden) $('toggle-directory').click();
      $('search').focus();
    }
    if (!directoryMedia.matches || $('directory-panel').hidden) return;
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault(); setDirectory(false, {focus:true});
    } else if (event.key === 'Tab') {
      const items = [...$('directory-panel').querySelectorAll('button,input,[tabindex]')]
        .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { resumeAfterVisible = !!controller && !controller.paused; controller?.pause(); }
    else if (resumeAfterVisible) { controller?.play(); resumeAfterVisible = false; }
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(debounce);
    if (controller) lastPlayback = {...settings(), time:controller.currentTime, paused:controller.paused};
    resumeAfterVisible = false;
    MotionRuntime.disposeAll();
    MotionHistoryRuntime.disposeAll();
  });
  window.addEventListener('pageshow', () => {
    if (selected && controller?.destroyed) selectEffect(selected.id, lastPlayback || {...settings(), time:controller.currentTime, paused:true});
  });

  /* 外观：跟随系统、浅色、深色。图标样式对齐个人网站侧栏的太阳按钮。 */
  const THEME_KEY = 'wise-motion-theme';
  const THEME_CYCLE = ['system', 'light', 'dark'];
  const THEME_LABEL = {system:'跟随系统', light:'浅色', dark:'深色'};
  const THEME_ICON = {system:'theme-monitor', light:'theme-sun', dark:'theme-moon'};
  function readTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (THEME_CYCLE.includes(saved)) return saved;
    } catch (_) { /* 无法读取时保持跟随系统。 */ }
    return 'system';
  }
  function applyTheme(mode, persist) {
    if (mode === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = mode;
    const button = $('theme-toggle');
    if (button) {
      button.innerHTML = icon(THEME_ICON[mode]);
      const label = `外观：${THEME_LABEL[mode]}`;
      button.setAttribute('aria-label', label);
      button.title = THEME_LABEL[mode];
    }
    if (persist) {
      try { localStorage.setItem(THEME_KEY, mode); } catch (_) { /* 隐私模式写不进时，本次会话仍然生效。 */ }
    }
  }
  applyTheme(readTheme(), false);
  $('theme-toggle').addEventListener('click', () => {
    const current = readTheme();
    applyTheme(THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length], true);
  });

  // 选中底共用一块，按弹簧滑到新页签。颜色来自样式里的芯片色，不另取强调色。
  function bindSlidingPill(root) {
    const pill = document.createElement('span');
    pill.className = 'tab-pill';
    pill.setAttribute('aria-hidden', 'true');
    root.prepend(pill);
    const state = {x:0, y:0, w:0, h:0};
    const velocity = {x:0, y:0, w:0, h:0};
    let goal = null, ready = false, raf = 0, last = 0;
    const keys = ['x', 'y', 'w', 'h'];
    function measure() {
      const button = root.querySelector(':scope > button[aria-pressed="true"], :scope > button[aria-selected="true"]');
      if (!button) return null;
      const host = root.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      return {x: box.left - host.left, y: box.top - host.top, w: box.width, h: box.height};
    }
    function paint() {
      pill.style.width = state.w + 'px';
      pill.style.height = state.h + 'px';
      pill.style.transform = `translate3d(${state.x}px,${state.y}px,0)`;
    }
    function tick(now) {
      const dt = Math.min(0.034, (now - last) / 1000 || 0.016);
      last = now;
      let moving = false;
      for (const key of keys) {
        const error = goal[key] - state[key];
        velocity[key] += (680 * error - 30 * velocity[key]) * dt;
        state[key] += velocity[key] * dt;
        if (Math.abs(error) > 0.35 || Math.abs(velocity[key]) > 12) moving = true;
      }
      paint();
      if (moving) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        Object.assign(state, goal);
        for (const key of keys) velocity[key] = 0;
        paint();
      }
    }
    function sync(animate) {
      const next = measure();
      if (!next) return;
      goal = next;
      if (!ready || !animate || reducedMotion.matches) {
        cancelAnimationFrame(raf);
        raf = 0;
        Object.assign(state, next);
        for (const key of keys) velocity[key] = 0;
        ready = true;
        paint();
        return;
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }
    const observer = new MutationObserver(() => sync(true));
    root.querySelectorAll(':scope > button').forEach(button => observer.observe(button, {attributes:true, attributeFilter:['aria-pressed', 'aria-selected']}));
    new ResizeObserver(() => sync(false)).observe(root);
    reducedMotion.addEventListener?.('change', () => sync(false));
    sync(false);
  }
  bindSlidingPill(document.querySelector('.kind-tabs'));
  bindSlidingPill(document.querySelector('.domain-tabs'));
  bindSlidingPill(document.querySelector('.output-tabs'));

  setDirectory(!directoryMedia.matches);
  renderCategories();
  renderList();
  selectEffect('fade-rise');
  updateMotionPreference();
})();
