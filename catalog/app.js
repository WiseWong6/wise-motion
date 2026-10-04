/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function () {
  'use strict';
  const data = {...MotionRegistry, categories:[...MotionRegistry.categories], effects:[...MotionRegistry.effects]}, $ = id => document.getElementById(id);
  let historyReady = false, historyLoad = null, kindToken = 0;
  function adoptHistory() {
    if (historyReady || !globalThis.MotionHistory) return;
    data.categories.push(...MotionHistory.categories);
    data.effects.push(...MotionHistory.recipes);
    data.redirects={...(data.redirects||{}),...(MotionHistory.redirects||{})};
    historyReady = true;
  }
  adoptHistory();
  function loadHistory() {
    if (historyReady) return Promise.resolve();
    historyLoad ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'history-data.js';
      script.onload = () => { adoptHistory(); resolve(); };
      script.onerror = () => { historyLoad = null; reject(new Error('历史配方无法加载')); };
      document.head.append(script);
    });
    return historyLoad;
  }
  const labels = {title:'动效名称', prompt:'提示词', code:'代码'};
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

  const KIND_KEY = 'wise-motion-kind:' + location.href;
  function readKind() {
    try {
      const saved = sessionStorage.getItem(KIND_KEY);
      if (['action','composition','illustration'].includes(saved)) return saved;
    } catch (_) { /* 无法读取时使用默认页签。 */ }
    return null;
  }
  function rememberKind() {
    try { sessionStorage.setItem(KIND_KEY, kind); } catch (_) { /* 存储受限时仍可正常切换。 */ }
  }
  const rememberedKind = readKind();
  let kind = rememberedKind || 'action', category = 'all', tab = 'prompt', selected = null, controller = null;
  let debounce = null, resumeAfterVisible = false, lastPlayback = null, lastPaused = null;
  let navigationIds = [];
  const relatedPreview=MotionRelated.create({icon,getMain:()=>controller});
  const collapsed = new Set();
  const icons = {
    'fade-rise':'arrow-up', 'scale-in':'arrows-pointing-out', 'stagger-in':'queue-list',
    'seamless-scroll':'arrows-right-left', 'curve-path':'arrow-trending-up', 'orbit':'arrow-path', 'float':'arrows-up-down',
    'count-up':'hashtag', 'type-reveal':'cursor-arrow-rays', 'focus-zoom':'magnifying-glass-plus',
    'shape-morph':'sparkles', 'card-flip':'arrow-uturn-left', 'layout-reorder':'squares-2x2', 'layer-expand':'square-3-stack-3d',
    'wipe':'rectangle-stack', 'shared-object':'document-duplicate', 'zoom-transition':'magnifying-glass', 'parallax':'photo',
    'follow':'arrow-right', 'detach':'sun', 'group-stagger':'bars-3-bottom-left',
    'dual-scroll':'arrows-right-left', 'subtitle-focus':'chat-bubble-bottom-center-text',
    'title-content':'document-text', 'interface-feedback':'cursor-arrow-ripple'
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
      if (nodes.every(node => node.scale === node.goalScale && node.opacity === node.goalOpacity && node.vScale === 0 && node.vOpacity === 0)) return;
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
    anchor: searchControl.querySelector('.search'),
    blocked: () => $('search').value.trim() !== ''
  });
  const easing = MotionDropdown($('ease'), $('ease-options'));

  function renderCategories() {
    const cats = [{id:'all', name:{action:'全部动作',illustration:'全部插画',composition:'全部组合',recipe:'全部历史配方'}[kind]}, ...data.categories.filter(x => data.effects.some(e=>e.kind===kind&&e.category===x.id))];
    categories.setOptions(cats.map(c => ({value:c.id,label:c.name})), category);
    document.querySelectorAll('[data-kind]').forEach(button => {
      const active = button.dataset.kind === kind;
      button.setAttribute('aria-pressed', String(active));
      if (button.dataset.kind === 'recipe' && !historyReady) return;
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
    $('search-clear').hidden = !$('search').value;
    const query = $('search').value.trim();
    const pool = query ? data.effects.filter(e => e.kind === kind) : null;
    const matches = pool ? MotionMatch.rank({effects: pool}, query) : [];
    const candidates = query ? matches.map(m => m.effect) : data.effects;
    const effects = candidates.filter(e => e.kind === kind && (category === 'all' || e.category === category));
    $('empty').hidden = !!effects.length;
    const list = $('effects-list');
    list.hidden = !effects.length;
    const focusedId = list.contains(document.activeElement) ? document.activeElement.dataset.effect : null;
    const retained = new Map([...list.querySelectorAll('.effect-item')].map(button => [button.dataset.effect, button]));
    const wanted = new Set(effects.map(effect => effect.id));
    for (const [id, button] of retained) {
      if (!wanted.has(id)) { MotionThumbs.release(button.querySelector('.thumb')); retained.delete(id); }
    }
    list.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const group of data.categories) {
      const items = effects.filter(e => e.category === group.id);
      if (!items.length) continue;
      const open = !collapsed.has(group.id);
      const section = document.createElement('section');
      section.className = 'effect-group';
      section.innerHTML =
        `<button class="group-head" data-group="${group.id}" title="${MotionKit.escape(group.description||group.name)}" aria-expanded="${open}">${mark('chevron-right')}<span class="group-name">${MotionKit.escape(group.name)}</span><span class="pill-count">${items.length}</span></button>`;
      const grid = document.createElement('div');
      grid.className = 'effect-grid';
      for (const effect of items) grid.append(retained.get(effect.id) || card(effect));
      section.append(grid);
      fragment.append(section);
    }
    list.append(fragment);
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
    const group = effect.category;
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

  function settings() { return {speed:controller?.speed || 1, ease:$('ease').value,caseId:selected?.selected_entry?.id,variantId:selected?.variant_id,compositionView:MotionComposition.view,
    ...(selected?.id==='dither-lab-book' ? {bookMode:controller?.mode,bookSettings:controller?.paperSettings,bookIndex:controller?.pageIndex} : {})}; }

  function updateOutputs() {
    if (!selected || !controller) return;
    const values = settings();
    $('prompt').textContent = MotionExport.prompt(selected, values, data);
    $('code').textContent = MotionExport.remotionCode(selected, values);
    document.querySelectorAll('.copy-status').forEach(element => { element.textContent = ''; });
  }

  /* HIG: 轨道从最小值填到滑块。jsdom 下没有布局也不影响，这里只写 CSS 变量。 */
  function fillTrack(input) {
    const min = Number(input.min || 0), max = Number(input.max || 100);
    const ratio = (Number(input.value) - min) / (max - min);
    input.style.setProperty('--fill', (Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) * 100 : 0) + '%');
  }

  function syncPlayer(state) {
    const previewMode=state.previewMode || controller?.previewMode, note=$('preview-mode');
    if(note.hidden===!!previewMode)note.hidden=!previewMode;
    if(previewMode){
      const label=state.error ? '预览准备失败：'+state.error.message : state.preparing ? '正在准备预览…' : previewMode==='video' ? '本机视频预览；组合拆解使用绘制代码。' : '绘制代码预览。';
      if(note.textContent!==label)note.textContent=label;
    }
    MotionComposition.sync(state.time);
    $('scrub').value = state.time / state.duration * 1000;
    fillTrack($('scrub'));
    const elapsed = state.time / 1000;
    const remaining = Math.max(0, state.duration - state.time) / 1000;
    const elapsedText = elapsed.toFixed(1), remainingText = remaining.toFixed(1);
    const timeText = `已播放 ${elapsedText} 秒，剩余 ${remainingText} 秒`;
    if ($('time').textContent !== timeText) {
      $('time').textContent = timeText;
      $('time-current').textContent = elapsedText;
      $('time-total').textContent = remainingText;
      $('scrub').setAttribute('aria-valuetext', `${elapsedText} 秒，剩余 ${remainingText} 秒`);
    }
    if (lastPaused !== state.paused) {
      const playing = !state.paused;
      $('toggle-play').innerHTML = icon(playing ? 'pause' : 'play');
      const label = playing ? '暂停当前动效' : '播放当前动效';
      $('toggle-play').setAttribute('aria-label', label);
      $('toggle-play').title = playing ? '暂停' : '播放';
      lastPaused = state.paused;
    }
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
  function stepSpeed(delta) {
    speedInput.classList.add('is-growing');
    void speedInput.offsetWidth;
    applySpeed(Number(speedInput.value) + delta);
  }

  function selectEffect(id, preserved = null, caseId = null, variantId = null) {
    let effect = data.effects.find(e => e.id === id);
    if (!effect) return;
    relatedPreview.close({resume:false,focus:false});
    if(effect.kind==='recipe'){
      const entry=effect.entries.find(e=>e.id===(caseId||preserved?.caseId))||effect.entries[0];
      const duration=Math.round(entry.preview.duration*1000);
      effect={...effect,...entry.definition,selected_entry:entry,duration_ms:duration,preview_ms:Math.round(duration*(typeof entry.preview.poster==='number'?entry.preview.poster:.65))};
    }
    effect = MotionKit.resolveVariant(effect,variantId||preserved?.variantId);
    categories.close();
    easing.close();
    controller?.destroy();
    selected = effect;
    resumeAfterVisible = false;
    $('copy-title').resetCopyIcon?.();
    $('preview-title').textContent = effect.name;
    $('preview-summary').textContent = effect.summary;
    $('effect-variant-field').hidden = !effect.variants?.length;
    $('effect-variant').innerHTML = (effect.variants||[]).map(item=>`<option value="${MotionKit.escape(item.id)}">${MotionKit.escape(item.label)}</option>`).join('');
    $('effect-variant').value = effect.variant_id || '';
    renderSource(effect);
    $('selection-status').textContent = `当前动效：${effect.name}。${effect.summary}`;
    $('preview').setAttribute('aria-label', effect.name);
    paintSpeed(preserved?.speed || 1);
    easing.setOptions((effect.parameters.ease?.options || [effect.default_ease]).map(value => ({value, label:MotionMatch.easeLabels[value]})), preserved?.ease || effect.default_ease);
    $('ease-label').hidden = !effect.parameters.ease;
    const related = effect.kind==='recipe' ? effect.actions : effect.actions.length ? effect.actions : data.effects.filter(e => e.kind==='composition'&&e.actions.includes(effect.id)).map(e => e.id);
    $('related').innerHTML = related.length
      ? `<p class="field-label" style="margin-top:18px">${effect.kind==='recipe' ? '提炼的组成动作' : effect.actions.length ? '相关动作' : '使用这个动作的组合'}</p><div class="related-chips">${related.map(rid => `<button type="button" class="btn" aria-haspopup="dialog" data-related="${rid}">${MotionKit.escape(data.effects.find(e => e.id === rid).name)}</button>`).join('')}</div>`
      : '';
    const historyRelated=effect.kind==='recipe'?effect.related_history.filter(rid=>data.effects.some(e=>e.id===rid)):[];
    if(historyRelated.length)$('related').innerHTML+=`<p class="field-label" style="margin-top:18px">关联原作配方</p><div class="related-chips">${historyRelated.map(rid=>`<button type="button" class="btn" aria-haspopup="dialog" data-related="${rid}">${MotionKit.escape(data.effects.find(e=>e.id===rid).name)}</button>`).join('')}</div>`;
    renderHistoryDetails(effect);
    renderFacts(effect);
    controller = effect.id==='dither-lab-book'
      ? WiseDitherWorkbench.create($('preview'),effect,{onUpdate:syncPlayer,onSettingsChange:updateOutputs,
        mode:preserved?.bookMode,paperSettings:preserved?.bookSettings,pageIndex:preserved?.bookIndex})
      : effect.kind==='recipe' ? MotionHistoryRuntime.create($('preview'),effect,{onUpdate:syncPlayer,caseId:effect.selected_entry.id}) : (globalThis.MotionLocalPreview||MotionRuntime).create($('preview'), effect, {onUpdate:syncPlayer});
    controller.setSpeed(Number($('speed').value));
    controller.setEase($('ease').value);
    MotionComposition.select(effect,controller,preserved?.compositionView);
    if (preserved) {
      controller.seek(preserved.time);
      if (!preserved.paused) controller.play();
    } else {
      controller.play();
    }
    syncPlayer({time:controller.currentTime, duration:effect.duration_ms, paused:controller.paused});
    updateOutputs();
    renderFacts(effect);
    syncSelection();
  }

  $('effect-variant').addEventListener('change',event=>{
    if(selected?.variants)selectEffect(selected.id,{...settings(),time:0,paused:false},null,event.target.value);
  });

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
    $('history-case').addEventListener('change',event=>selectEffect(effect.id,{speed:Number($('speed').value),ease:'linear',time:0,paused:false},event.target.value));
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
    const content = $(copiedTab === 'title' ? 'preview-title' : copiedTab);
    const button = $('copy-' + copiedTab), text = content.textContent, status = $('copy-status-' + copiedTab);
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
      if (copiedTab !== 'title') setTab(copiedTab);
      const range = document.createRange();
      range.selectNodeContents(content);
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
    const shell = document.querySelector('.sidebar-shell');
    const glideSidebar = !directoryMedia.matches && typeof shell.animate === 'function';
    const sidebarFrom = glideSidebar ? shell.getBoundingClientRect().width : 0;
    if (glideSidebar) shell.getAnimations().forEach(animation => animation.cancel());
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
    directoryExpanded = expanded;
    syncDirectoryIcon();
    const label = expanded ? '收起动效目录' : '展开动效目录';
    $('toggle-directory').setAttribute('aria-label', label);
    $('toggle-directory').title = label;
    if (glideSidebar) {
      const sidebarTo = shell.getBoundingClientRect().width;
      if (Math.abs(sidebarFrom - sidebarTo) > 1) {
        shell.animate(
          [{width: sidebarFrom + 'px'}, {width: sidebarTo + 'px'}],
          {duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)'}
        );
      }
    }
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

  function showKind(next) {
    kind = next;
    rememberKind();
    category = 'all';
    const token = ++kindToken;
    document.querySelectorAll('[data-kind]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kind === kind)));
    const paint = () => { if (token !== kindToken) return; renderCategories(); renderList(); };
    if (kind === 'recipe' && !historyReady) loadHistory().then(paint).catch(() => { if (token === kindToken) renderList(); });
    else paint();
  }
  document.querySelector('.kind-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-kind]');
    if (!button) return;
    showKind(button.dataset.kind);
  });

  document.querySelectorAll('.ins-head').forEach(head => head.addEventListener('click', () => {
    setSection(head.dataset.section, head.getAttribute('aria-expanded') !== 'true');
  }));

  $('category-filter').addEventListener('change', () => { category = $('category-filter').value; renderList(); });
  $('related').addEventListener('click', event => {
    const button = event.target.closest('[data-related]');
    if (!button) return;
    const effect=data.effects.find(e=>e.id===button.dataset.related);
    if(effect)relatedPreview.open(MotionKit.resolveVariant(effect,selected?.action_variants?.[effect.id]),button);
  });
  function clearSearch() {
    clearTimeout(debounce);
    debounce = null;
    $('search').value = '';
    category = 'all';
    renderCategories();
    renderList();
  }
  $('search').addEventListener('input', () => {
    $('search-clear').hidden = !$('search').value;
    if ($('search').value.trim()) {
      categories.close();
      category = 'all';
      categories.setValue('all');
    }
    clearTimeout(debounce);
    debounce = setTimeout(() => { debounce = null; renderList(); }, 120);
  });
  $('search').addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
    if (!$('search').value && category === 'all' && $('category-filter').getAttribute('aria-expanded') !== 'true') return;
    event.preventDefault();
    clearSearch();
  });
  ['search-clear','clear-search'].forEach(id => $(id).addEventListener('click', () => {
    clearSearch();
    $('search').focus();
  }));
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
  speedInput.addEventListener('pointerdown', () => speedInput.classList.remove('is-growing'));
  speedInput.addEventListener('input', () => applySpeed(speedInput.value));
  $('speed-value').addEventListener('input', () => {
    // 输入过程中先不重排文字，只在能解析成数字时给出实时反馈；空串不当作 0。
    const raw = $('speed-value').value.trim();
    if (raw !== '' && Number.isFinite(Number(raw))) applySpeed(Number(raw), false);
  });
  const commitSpeed = () => { speedInput.classList.remove('is-growing'); applySpeed($('speed-value').value); };
  $('speed-value').addEventListener('change', commitSpeed);
  $('speed-value').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); commitSpeed(); $('speed-value').blur(); }
    else if (event.key === 'Escape') { $('speed-value').value = formatSpeed(speedInput.value); }
  });
  $('speed-down').addEventListener('click', () => stepSpeed(-Number(speedInput.step)));
  $('speed-up').addEventListener('click', () => stepSpeed(Number(speedInput.step)));
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

  document.querySelector('.inspector').addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (button) copyOutput(button.dataset.copy);
  });

  document.addEventListener('keydown', event => {
    if(relatedPreview.active)return;
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
    relatedPreview.close({resume:false,focus:false});
    clearTimeout(debounce);
    if (controller) lastPlayback = {...settings(), time:controller.currentTime, paused:controller.paused};
    resumeAfterVisible = false;
    controller?.destroy();
    MotionRuntime.disposeAll();
    MotionHistoryRuntime.disposeAll();
  });
  window.addEventListener('pageshow', () => {
    if (selected && controller?.destroyed) selectEffect(selected.id, lastPlayback || {...settings(), time:controller.currentTime, paused:true});
  });

  /* 外观只有白天和黑夜，默认黑夜。悬停时当前图标弹簧换成另一个。 */
  const THEME_KEY = 'wise-motion-theme';
  const THEME_LABEL = {light:'浅色', dark:'深色'};
  let themeMode = 'dark', themeHovered = false, themeReady = false, themeRaf = 0, themeLast = 0;
  let directoryExpanded = true, directoryHovered = false, directoryReady = false, directoryRaf = 0, directoryLast = 0;
  const directoryNodes = [];
  function paintDirectoryIcons() {
    for (const node of directoryNodes) {
      node.el.style.transform = `scale(${node.scale})`;
      node.el.style.opacity = String(node.opacity);
    }
  }
  function tickDirectory(now) {
    const dt = Math.min(.034, (now - directoryLast) / 1000 || .016);
    directoryLast = now;
    let moving = false;
    for (const node of directoryNodes) {
      for (const [value, goal, vel] of [['scale', 'goalScale', 'vScale'], ['opacity', 'goalOpacity', 'vOpacity']]) {
        const error = node[goal] - node[value];
        node[vel] += (600 * error - 25 * node[vel]) * dt;
        node[value] += node[vel] * dt;
        if (Math.abs(error) > .012 || Math.abs(node[vel]) > .04) moving = true;
      }
    }
    paintDirectoryIcons();
    if (moving) directoryRaf = requestAnimationFrame(tickDirectory);
    else {
      directoryRaf = 0;
      for (const node of directoryNodes) { node.scale = node.goalScale; node.opacity = node.goalOpacity; node.vScale = node.vOpacity = 0; }
      paintDirectoryIcons();
    }
  }
  function syncDirectoryIcon() {
    if (!directoryNodes.length) return;
    const showExpand = directoryExpanded ? directoryHovered : !directoryHovered;
    const goals = [!showExpand, showExpand];
    directoryNodes.forEach((node, index) => {
      node.goalScale = goals[index] ? 1 : .5;
      node.goalOpacity = goals[index] ? 1 : 0;
    });
    if (!directoryReady) {
      cancelAnimationFrame(directoryRaf);
      directoryRaf = 0;
      for (const node of directoryNodes) { node.scale = node.goalScale; node.opacity = node.goalOpacity; node.vScale = node.vOpacity = 0; }
      directoryReady = true;
      paintDirectoryIcons();
      return;
    }
    if (!directoryRaf) { directoryLast = performance.now(); directoryRaf = requestAnimationFrame(tickDirectory); }
  }
  const themeNodes = [];
  function readTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) { /* 读不到时用黑夜。 */ }
    return 'dark';
  }
  function paintThemeIcons() {
    for (const node of themeNodes) {
      node.el.style.transform = `scale(${node.scale})`;
      node.el.style.opacity = String(node.opacity);
    }
  }
  function tickTheme(now) {
    const dt = Math.min(.034, (now - themeLast) / 1000 || .016);
    themeLast = now;
    let moving = false;
    for (const node of themeNodes) {
      for (const [value, goal, vel] of [['scale', 'goalScale', 'vScale'], ['opacity', 'goalOpacity', 'vOpacity']]) {
        const error = node[goal] - node[value];
        node[vel] += (600 * error - 25 * node[vel]) * dt;
        node[value] += node[vel] * dt;
        if (Math.abs(error) > .012 || Math.abs(node[vel]) > .04) moving = true;
      }
    }
    paintThemeIcons();
    if (moving) themeRaf = requestAnimationFrame(tickTheme);
    else {
      themeRaf = 0;
      for (const node of themeNodes) { node.scale = node.goalScale; node.opacity = node.goalOpacity; node.vScale = node.vOpacity = 0; }
      paintThemeIcons();
    }
  }
  function syncThemeIcon() {
    const showSun = themeMode === 'dark' ? themeHovered : !themeHovered;
    const goals = [!showSun, showSun];
    themeNodes.forEach((node, index) => {
      node.goalScale = goals[index] ? 1 : .5;
      node.goalOpacity = goals[index] ? 1 : 0;
    });
    if (!themeReady) {
      cancelAnimationFrame(themeRaf);
      themeRaf = 0;
      for (const node of themeNodes) { node.scale = node.goalScale; node.opacity = node.goalOpacity; node.vScale = node.vOpacity = 0; }
      themeReady = true;
      paintThemeIcons();
      return;
    }
    if (!themeRaf) { themeLast = performance.now(); themeRaf = requestAnimationFrame(tickTheme); }
  }
  function applyTheme(mode, persist) {
    themeMode = mode;
    document.documentElement.dataset.theme = mode;
    const button = $('theme-toggle');
    if (button) {
      const label = `外观：${THEME_LABEL[mode]}`;
      button.setAttribute('aria-label', label);
      button.title = THEME_LABEL[mode];
    }
    if (themeNodes.length) syncThemeIcon();
    if (persist) {
      try { localStorage.setItem(THEME_KEY, mode); } catch (_) { /* 隐私模式写不进时，本次会话仍然生效。 */ }
    }
  }
  $('theme-toggle').querySelectorAll('.icon-morph-glyph').forEach(element => {
    themeNodes.push({el: element, scale: .5, opacity: 0, vScale: 0, vOpacity: 0, goalScale: .5, goalOpacity: 0});
  });
  applyTheme(readTheme(), false);
  const themeButton = $('theme-toggle');
  themeButton.addEventListener('mouseenter', () => { themeHovered = true; syncThemeIcon(); });
  themeButton.addEventListener('mouseleave', () => { themeHovered = false; syncThemeIcon(); });
  themeButton.addEventListener('pointerenter', () => { themeHovered = true; syncThemeIcon(); });
  themeButton.addEventListener('pointerleave', () => { themeHovered = false; syncThemeIcon(); });
  themeButton.addEventListener('click', () => {
    applyTheme(themeMode === 'dark' ? 'light' : 'dark', true);
  });
  $('toggle-directory').querySelectorAll('.icon-morph-glyph').forEach(element => {
    directoryNodes.push({el: element, scale: .5, opacity: 0, vScale: 0, vOpacity: 0, goalScale: .5, goalOpacity: 0});
  });
  const directoryButton = $('toggle-directory');
  directoryButton.addEventListener('mouseenter', () => { directoryHovered = true; syncDirectoryIcon(); });
  directoryButton.addEventListener('mouseleave', () => { directoryHovered = false; syncDirectoryIcon(); });
  directoryButton.addEventListener('pointerenter', () => { directoryHovered = true; syncDirectoryIcon(); });
  directoryButton.addEventListener('pointerleave', () => { directoryHovered = false; syncDirectoryIcon(); });

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
        velocity[key] += (200 * error - 28 * velocity[key]) * dt;
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
      if (!ready || !animate) {
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
    sync(false);
  }
  bindSlidingPill(document.querySelector('.kind-tabs'));
  bindSlidingPill(document.querySelector('.output-tabs'));

  setDirectory(!directoryMedia.matches);
  renderCategories();
  renderList();
  const requestedId=location.hash.slice(1);
  const requestedEffect=()=>data.redirects?.[requestedId]||requestedId;
  function selectInitial(){
    if (selected) return;
    const requested = data.effects.find(effect=>effect.id===requestedEffect());
    // 新链接按动效所在页签打开；同一页面刷新和加载期间的手动切换优先。
    if (!rememberedKind && kindToken === 0 && requested) kind = requested.kind;
    const effect=(requested?.kind===kind ? requested : null)||data.effects.find(effect=>effect.kind===kind)||data.effects.find(effect=>effect.id==='fade-rise');
    renderCategories();renderList();rememberKind();
    const caseId=effect.entries?.find(entry=>entry.source_rule_id===requestedId.replace(/^history-/,''))?.id;
    selectEffect(effect.id,null,caseId,data.variant_redirects?.[requestedId]);
  }
  if ((kind === 'recipe' && !historyReady) || (requestedEffect() && !data.effects.some(effect => effect.id === requestedEffect()))) {
    loadHistory().then(selectInitial).catch(selectInitial);
  } else selectInitial();
})();
