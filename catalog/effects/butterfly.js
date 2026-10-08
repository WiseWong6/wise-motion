/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (global) {
  'use strict';
  const scriptUrl = typeof document === 'undefined' ? null : document.currentScript?.src;
  // 原源码位于 effects 内，打包后的播放器位于目录根部；两者共用目录内的图集。
  const catalogUrl = scriptUrl && new URL(new URL(scriptUrl).pathname.endsWith('/effects/butterfly.js') ? '../' : './', scriptUrl);
  const defaultAtlas = doc => new URL('assets/butterfly/wing-atlas.webp', catalogUrl ||
    (doc.baseURI.includes('/catalog/') ? new URL('./', doc.baseURI) : new URL('catalog/', doc.baseURI))).href;
  const NS = 'http://www.w3.org/2000/svg';
  const setStyle = (node, style) => Object.assign(node.style, style);
  function mount(root, {atlasSrc, alternateSrc, maskSrc, catalogView = false} = {}) {
    const doc = root.ownerDocument;
    const {ATLAS, STAGE, PARTS, BODY, ANTENNAE, butterflyState} = global.WiseButterflyMotion;
    const src = atlasSrc || defaultAtlas(doc), pending = [];
    let destroyed = false;
    function element(tag, style, parent, attributes = {}) {
      const node = doc.createElement(tag); setStyle(node, style);
      for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
      parent?.append(node); return node;
    }
    function image(url, parent, crop) {
      const [x, y] = crop;
      const img = element('img', {position: 'absolute', left: -x + 'px', top: -y + 'px',
        width: ATLAS.width + 'px', height: ATLAS.height + 'px', maxWidth: 'none'}, parent);
      let stop;
      const ready = new Promise((resolve, reject) => {
        const clear = () => {img.removeEventListener('load', loaded); img.removeEventListener('error', failed);};
        const loaded = () => {
          clear();
          const decode = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
          decode.then(resolve, reject);
        };
        const failed = () => {clear(); reject(new Error('蝴蝶图集读取失败：' + url));};
        stop = () => {clear(); resolve();};
        img.addEventListener('load', loaded); img.addEventListener('error', failed);
        img.src = url;
        if (img.complete && img.naturalWidth) loaded();
      });
      pending.push({ready, stop}); return img;
    }
    function texture(part, parent, transform = '', hasAlternate = false) {
      const [, , width, height] = part.crop, [px, py] = part.pivot;
      const node = element('div', {position: 'absolute', left: part.root[0] - px + 'px',
        top: part.root[1] - py + 'px', width: width + 'px', height: height + 'px',
        transformOrigin: `${px}px ${py}px`, transformStyle: 'preserve-3d', transform}, parent,
      {'data-part': part.id || 'body'});
      const cut = element('div', {position: 'absolute', inset: '0', overflow: 'hidden', clipPath: part.clip || ''}, node);
      image(src, cut, part.crop);
      let alternate, reveal;
      if (hasAlternate && alternateSrc) {
        alternate = element('div', {position: 'absolute', inset: '0', opacity: '0',
          maskImage: `url("${maskSrc || src}")`, maskMode: 'alpha', maskSize: `${ATLAS.width}px ${ATLAS.height}px`,
          maskPosition: `${-part.crop[0]}px ${-part.crop[1]}px`, maskRepeat: 'no-repeat'}, cut,
        {'data-wing-variant': 'ai'});
        image(alternateSrc, alternate, part.crop);
        reveal = element('div', {position: 'absolute', inset: '0', display: 'none'}, cut,
          {'data-wing-reveal': 'blue'});
        image(src, reveal, part.crop);
      }
      return {node, cut, alternate, reveal};
    }
    const viewport = element('div', {position: 'absolute', inset: '0', overflow: 'hidden'}, null);
    viewport.className = 'pattern-dom';
    root.replaceChildren(viewport);
    const stage = catalogView ? element('div', {position: 'absolute', width: '1080px', height: '1440px',
      left: '56px', top: '-233.76px', transform: 'scale(.48)', transformOrigin: '0 0'}, viewport) : viewport;
    const position = element('div', {position: 'absolute', width: '0', height: '0',
      perspective: STAGE.perspective + 'px', perspectiveOrigin: '0px 0px', transformStyle: 'preserve-3d'}, stage);
    const bank = element('div', {position: 'absolute', width: '0', height: '0',
      transformOrigin: '0px 0px', transformStyle: 'preserve-3d'}, position);
    const wings = PARTS.map(part => texture(part, bank, '', true));
    const antennae = element('div', {position: 'absolute', width: '0', height: '0',
      transform: 'translateZ(8px)', transformStyle: 'preserve-3d'}, bank, {'data-part': 'antennae'});
    const svg = doc.createElementNS(NS, 'svg');
    for (const [name, value] of Object.entries({width: 390, height: 280, viewBox: '-195 -350 390 280', 'aria-hidden': 'true'})) svg.setAttribute(name, value);
    // Keep the drawing viewport independent of the catalog's small icon SVG rule.
    setStyle(svg, {position: 'absolute', left: '-195px', top: '-350px', width: '390px', height: '280px', overflow: 'visible'});
    antennae.append(svg);
    const paths = ANTENNAE.map(antenna => {
      const path = doc.createElementNS(NS, 'path');
      for (const [name, value] of Object.entries({'data-part': antenna.id, fill: 'none', stroke: '#24211D', 'stroke-width': 3.1, 'stroke-linecap': 'round'})) path.setAttribute(name, value);
      svg.append(path); return path;
    });
    const tips = ANTENNAE.map(antenna => texture({...antenna.club, root: antenna.tip}, antennae));
    texture(BODY, bank, 'translateZ(8px)');
    function draw(seconds, {selection = 1, wingSelections, revealFromRoot = false,
      motionState, background = 'transparent'} = {}) {
      if (destroyed) return;
      const state = motionState ?? butterflyState(seconds);
      viewport.style.backgroundColor = background;
      setStyle(position, {left: state.x + 'px', top: state.y + 'px'});
      bank.style.transform = `rotateZ(${state.bank}deg) scale(${STAGE.scale})`;
      wings.forEach((wing, i) => {
        const pose = state.wings[i];
        wing.node.style.transform = `rotateY(${pose.yaw}deg) rotateZ(${pose.roll}deg)`;
        wing.cut.style.filter = pose.brightness === 1 ? '' : `brightness(${pose.brightness})`;
        const chosen = wingSelections?.[i] ?? selection;
        if (wing.alternate) wing.alternate.style.opacity = String(revealFromRoot ? (chosen < 1 ? 1 : 0) : 1 - chosen);
        if (wing.reveal) {
          const active = revealFromRoot && chosen > 0 && chosen < 1;
          wing.reveal.style.display = active ? 'block' : 'none';
          const part = PARTS[i], [px, py] = part.pivot;
          const radius = chosen * Math.hypot(Math.max(px, part.crop[2] - px), Math.max(py, part.crop[3] - py));
          wing.reveal.style.clipPath = `circle(${radius}px at ${px}px ${py}px)`;
        }
      });
      state.antennae.forEach((antenna, i) => {
        paths[i].setAttribute('d', antenna.path);
        const [px, py] = ANTENNAE[i].club.pivot;
        setStyle(tips[i].node, {left: antenna.end[0] - px + 'px', top: antenna.end[1] - py + 'px',
          transform: `rotateZ(${antenna.tipRotation}deg)`});
      });
    }
    const ready = Promise.all(pending.map(item => item.ready));
    ready.catch(() => {}); draw(0);
    function destroy(preserve = false) {if (destroyed) return; destroyed = true; pending.forEach(item => item.stop()); if (!preserve) viewport.remove();}
    return {draw, ready, destroy};
  }
  function make(root, K, definition) {
    const instance = mount(root, {catalogView: true});
    const draw = (ms, state = {}) => instance.draw((state.elapsed ?? ms) / 1000);
    draw.ready = instance.ready; draw.destroy = preserve => instance.destroy(preserve);
    return draw;
  }
  // 缩略图须等翼图和身体全部解码，再保留静态画面。
  make.requiresPreparation = true;
  global.WiseButterfly = Object.freeze({mount});
  (global.MotionFactories ||= {})['butterfly-illustration'] = make;
})(globalThis);
