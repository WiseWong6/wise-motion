// 知识视频使用的画布交给已有的绘图调用记录器，仅验证结构与控制，不生成像素。
export function installKnowledgeVideoFixture(w, data) {
  function recordCanvas(work) {
    const create = w.document.createElement;
    w.document.createElement = function (tag, ...args) {
      const node = create.call(this, tag, ...args);
      if (String(tag).toLowerCase() === 'canvas') node.dataset.sceneSource = 'original';
      return node;
    };
    const getContext = w.HTMLCanvasElement.prototype.getContext;
    w.HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      // 主画布由模板创建，离屏纹理由上面的 createElement 标记。
      if (type === '2d') this.dataset.sceneSource = 'original';
      return getContext.call(this, type, ...args);
    };
    try { return work(); }
    finally {
      w.document.createElement = create;
      w.HTMLCanvasElement.prototype.getContext = getContext;
    }
  }
  const sources = data.effects.flatMap(effect => [effect.source,...(effect.variants||[]).map(variant => variant.source)])
    .filter(source => source?.path === 'catalog/effects/knowledge-video.js');
  for (const factory of new Set(sources.map(source => source.factory))) {
    const original = w.MotionFactories?.[factory];
    if (!original) continue;
    w.MotionFactories[factory] = Object.assign((...args) => {
      const draw = recordCanvas(() => original(...args));
      return Object.assign((...frameArgs) => recordCanvas(() => draw(...frameArgs)), draw);
    }, original);
  }
}
