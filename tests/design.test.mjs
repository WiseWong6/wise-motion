// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
const css = (await Promise.all(['frame.css','app.css'].map(file => readFile(new URL('../catalog/'+file,import.meta.url),'utf8')))).join('\n');
const luminance = hex => {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
};
const contrast = (a,b) => { const x = luminance(a), y = luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
test('界面样式可解析，四种外观的主要文字与链接均有足够对比', () => {
  const errors = [], console = new VirtualConsole(); console.on('jsdomError',error => errors.push(error.message));
  const dom = new JSDOM('<!doctype html><style></style>',{virtualConsole:console});
  try {
    const style = dom.window.document.querySelector('style'); style.textContent = css;
    assert.deepEqual(errors,[]); assert.ok(style.sheet.cssRules.length > 80);
    const rootRules = [...css.matchAll(/:root\s*\{([^}]+)\}/g)].map(m => Object.fromEntries([...m[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6}|#fff)\s*;/g)].map(x => [x[1],x[2] === '#fff' ? '#ffffff' : x[2]])));
    const [base,dark,more,darkMore] = rootRules;
    for (const palette of [base,{...base,...dark},{...base,...more},{...base,...dark,...more,...darkMore}]) {
      for (const background of ['surface','canvas','soft','hover','selected']) {
        for (const text of ['ink','muted','secondary']) assert.ok(contrast(palette[text],palette[background]) >= 4.5,`${text} 在 ${background} 上对比不足`);
      }
      assert.ok(contrast(palette.accent,palette.surface) >= 4.5,'链接对比不足');
    }
  } finally {dom.window.close();}
});
