/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (global) {
  'use strict';
  const terms = [
    [/滚动|滚屏|走马灯/, ['seamless-scroll', 'dual-scroll'], '连续滚动'],
    [/两排|双排|上下两行|上下两排/, ['dual-scroll'], '两排同时运动'],
    [/反向|相反方向/, ['dual-scroll'], '方向相反'],
    [/持续|一直|不停|循环|无缝/, ['seamless-scroll', 'dual-scroll', 'curve-path', 'orbit', 'float', 'parallax', 'follow', 'arc-cards', 'environment-chain'], '持续运动'],
    [/依次|逐项|逐个|一个接一个|按顺序/, ['stagger-in', 'type-reveal', 'title-content'], '保留先后顺序'],
    [/标题.*内容|先.*标题|主张.*内容/, ['title-content'], '标题先于内容'],
    [/弧面|弧形.*卡片|卡片.*弧/, ['arc-cards'], '卡片沿弧面展示'],
    [/环绕|绕着|绕中心/, ['orbit', 'arc-cards'], '围绕中心运动'],
    [/字幕|讲述|讲解.*文字/, ['subtitle-focus'], '文字引导注意'],
    [/环境|连锁|经过.*反应|带动.*周围/, ['environment-chain'], '主体引发环境变化'],
    [/接触|水面|涟漪/, ['ripple', 'environment-chain'], '接触后回应'],
    [/跟随|跟着|拖尾/, ['follow', 'environment-chain'], '保留跟随关系'],
    [/自然|轻柔|轻轻|柔和/, ['fade-rise', 'float', 'follow'], '平缓进入或轻微往返'],
    [/翻转|翻面|背面/, ['card-flip'], '展示卡片背面'],
    [/数字|计数|增长/, ['count-up'], '数字逐步变化'],
    [/变形|圆.*方/, ['shape-morph'], '同一图形改变轮廓'],
    [/操作|点击|处理.*结果|反馈/, ['interface-feedback'], '操作、处理和结果依次发生'],
    [/切换|转场/, ['wipe', 'shared-object', 'zoom-transition'], '连接两个画面']
  ];
  const exclusions = [
    [/轮播|逐张切换|逐张轮换|一张一张切换/, e => e.behaviors.includes('discrete'), '逐张切换'],
    [/翻转|翻面/, e => e.behaviors.includes('flip'), '卡片翻面'],
    [/旋转|绕轴|转动/, e => e.behaviors.includes('rotation3d') || e.id === 'shape-morph', '旋转'],
    [/弹跳|回弹/, e => e.behaviors.includes('bounce'), '明显回弹'],
    [/持续|循环|一直/, e => e.loop, '循环播放'],
    [/停顿|停住|暂停/, e => !e.loop || !e.behaviors.includes('continuous'), '停顿或停住'],
    [/依次|错峰|逐项/, e => e.behaviors.includes('stagger') || e.behaviors.includes('sequence'), '先后错开'],
    [/变色|颜色/, e => e.behaviors.includes('color'), '颜色变化'],
    [/放大|缩放/, e => e.behaviors.includes('scale'), '大小变化'],
    [/上下|起伏/, e => e.id === 'float', '上下起伏'],
    [/环境|涟漪/, e => e.behaviors.includes('react'), '环境回应']
  ];
  function parse(query) {
    const denied = [];
    // 否定只作用于当前短句，不能把后面的正向需求一起删掉。
    const text = String(query).replace(/而是|但是|但要|改成/g, '，');
    const positive = text.replace(/(?:不要|不想要?|不需要|不能|避免|别|不做|无需|不(?=轮播|翻|旋|弹|回弹|暂停|停顿|停住|循环|持续|依次|错峰|逐|变色|放大|缩放|上下|起伏))([^，,。；;！!？?\n]+)/g, (whole, clause) => {
      denied.push(clause.trim()); return '';
    });
    return {positive, denied};
  }
  function rank(registry, query, options = {}) {
    const {positive, denied} = parse(query);
    const explicit = options.exclude || [];
    const prohibited = exclusions.filter(([pattern]) => denied.some(x => pattern.test(x)));
    const isScroll = /滚动|滚屏|走马灯/.test(positive);
    const isDual = /两排|双排|上下两行|上下两排|反向|相反方向/.test(positive);
    const isChain = /环境|连锁|经过.*反应|带动.*周围/.test(positive);
    const scrollTarget=/刹停|减速.*停/.test(positive)?'scroll-brake':/轮播|停留/.test(positive)?'dwell-carousel':/纵向|终端|续接/.test(positive)?'vertical-feed':null;
    return registry.effects.flatMap(e => {
      if (explicit.includes(e.id) || prohibited.some(([, test]) => test(e))) return [];
      // “持续滚动”和“主体引起环境反应”是结构要求，不能用相似视觉代替。
      const exact=positive.includes(e.name)||positive.trim()===e.history_id;
      const patterns=e.kind==='recipe'?e.actions:[e.id];
      if (!exact && isScroll && !patterns.some(id=>(scrollTarget?[scrollTarget]:['seamless-scroll','dual-scroll']).includes(id))) return [];
      if (!exact && isScroll && isDual && !patterns.includes('dual-scroll')) return [];
      if (!exact && isChain && !patterns.includes('environment-chain')) return [];
      let score = 0; const matched = [];
      if (positive.includes(e.name)) { score += 20; matched.push(e.name); }
      for (const word of e.aliases) if (positive.includes(word)) { score += 3; matched.push(word); }
      for (const [pattern, ids, label] of terms) if (pattern.test(positive) && patterns.some(id=>ids.includes(id))) { score += 5; matched.push(label); }
      if(scrollTarget&&patterns.includes(scrollTarget)){score+=15;matched.push('保留滚动与停留的具体关系');}
      if (!score) return [];
      if (!isDual && e.id === 'seamless-scroll' && isScroll) score += 3;
      if (/卡片/.test(positive) && e.id === 'fade-rise' && /自然|轻轻/.test(positive)) score += 4;
      return [{effect: e, score, matched: [...new Set(matched)], excluded: prohibited.map(x => x[2]), reason: e.recommendation}];
    }).sort((a, b) => b.score - a.score || a.effect.id.localeCompare(b.effect.id));
  }
  const easeLabels = {linear: '匀速', outCubic: '末尾减速', inOutCubic: '平缓加速、减速', inOutSine: '平缓加速、减速', spring: '轻微回弹'};
  function describe(effect, settings = {}, registry = null) {
    if(effect.kind==='recipe')return describeHistory(effect,settings,registry);
    const speed = settings.speed ?? 1;
    const easing = effect.parameters.ease ? (settings.ease || effect.default_ease) : effect.default_ease;
    const actions = registry ? effect.actions.map(id => registry.effects.find(x => x.id === id).name) : effect.actions;
    return [
      `动效说明：${effect.name}`,
      `目的：${effect.purpose}`,
      `对象：${effect.objects}`,
      '动作阶段：', ...effect.phases.map((p, i) => `${i + 1}. ${p}`),
      `节奏：${(effect.duration_ms / 1000 / speed).toFixed(2)} 秒${effect.loop ? '一个周期，持续循环' : '完成一次'}；${speed} 倍速度；${easeLabels[easing]}。${effect.tempo_note}`,
      `触发与联动：${effect.trigger}`,
      `现实类比：${effect.analogy}`,
      `需要保留：${effect.retain}`,
      `明确排除：${effect.avoid}`,
      `对应参考：本地目录「${effect.name}」${actions.length ? '；所用动作：' + actions.join('、') : ''}`,
      `源码：${effect.source.path} 中的 ${effect.source.factory}`,
      `来源与许可：自编示例，AGPLv3；Anime.js 4.5.0，MIT。`,
      `关键假设：${effect.assumptions}`
    ].join('\n');
  }
  function describeHistory(effect,settings,registry){
    const entry=effect.entries.find(e=>e.id===settings.caseId)||effect.selected_entry||effect.entries[0],speed=settings.speed??1;
    const names=effect.actions.map(id=>registry?.effects.find(e=>e.id===id)?.name||id);
    return [
      `动效说明：${effect.name}`,`目的：${effect.purpose}`,`对象与保留关系：${effect.retain}`,
      '动作阶段：',...effect.phases.map((p,i)=>`${i+1}. ${p}`),
      `节奏：预览 ${(entry.preview.duration/speed).toFixed(2)} 秒完成一次；${speed} 倍观看速度，原作的加减速关系保持。`,
      `原作时钟：${effect.source_clock}`,`原作调整项：${effect.source_parameters}`,`触发与联动：${effect.trigger}`,
      `主控制量：${effect.review.reuse_contract.primary_control}`,`迁用输入：${effect.review.reuse_contract.input}`,
      `稳定关系：${effect.review.reuse_contract.invariant}`,`案例边界：${effect.review.reuse_contract.case_boundary}`,
      `需要保留：${effect.retain}`,`明确排除：${effect.avoid}`,
      effect.review.document_contract?'文稿交接：'+Object.values(effect.review.document_contract).join('；'):'',
      `抽象结论：${effect.review.label}。${effect.review.review}`,names.length?'标准组成动作：'+names.join('、'):'专用条件：'+effect.review.dependencies.join('、'),
      `对应案例：${entry.name}`,...entry.cases.map(c=>`原片范围：${c.title}，${c.start}–${c.end} 秒。${c.note}`),
      effect.review.correction?'描述校正：'+effect.review.correction:'',
      `源码：${entry.code.map(ref=>ref.file+'；入口：'+ref.anchors.map(a=>a.symbol).join('、')).join('\n')}`,
      `来源与许可：${effect.source.license}`,`关键假设：${effect.assumptions}`
    ].filter(Boolean).join('\n');
  }
  const api = {rank, parse, describe, easeLabels};
  global.MotionMatch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
