/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
// 浏览器、分镜检查与 Remotion 共用；不修改登记定义或调用者传入的内容。
(function (global) {
  'use strict';
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.prototype.toString.call(value) === '[object Object]'
    && (Object.getPrototypeOf(value) === null || Object.getPrototypeOf(value)?.constructor?.name === 'Object');
  const count = value => Array.from(value).length;
  function validateContent(effect, content) {
    if (content === undefined) return;
    const fail = message => { throw new TypeError(`${effect.name || effect.id}：${message}`); };
    if (!plain(content)) fail('content 必须是内容对象');
    const slots = new Map((effect.content_slots || []).map(slot => [slot.id, slot]));
    const text = (value, slot, label) => {
      if (typeof value !== 'string') fail(`${label} 必须是文字`);
      if (/[\r\n\u0000-\u001f\u007f]/.test(value)) fail(`${label} 必须是单行文字，不能包含控制字符`);
      if (!slot.allow_empty && !value.trim()) fail(`${label} 不能为空`);
      if (count(value) > slot.max_chars) fail(`${label} 最多 ${slot.max_chars} 字`);
      if (slot.charset === 'particle' && /[^\x20-\x7e\u3400-\u9fff，。！？、：；（）《》]/.test(value)) fail(`${label} 支持常用汉字、拉丁字母、数字及中英文标点，不支持表情或其他字符集`);
      if (slot.charset === 'latin' && /[^\x20-\x7e]/.test(value)) fail(`${label} 只支持拉丁字母、数字和常用英文符号`);
      if (slot.options && !slot.options.includes(value)) fail(`${label} 可选：${slot.options.join('、')}`);
    };
    for (const key of Reflect.ownKeys(content)) {
      if (typeof key !== 'string' || !slots.has(key)) fail(`没有名为 ${String(key)} 的内容槽`);
      const slot = slots.get(key), value = content[key], label = slot.label || key;
      if (slot.type === 'text') text(value, slot, label);
      else if (slot.type === 'number') {
        if (!Number.isFinite(value) || value < slot.min || value > slot.max || (slot.integer && !Number.isInteger(value))) fail(`${label} 必须是 ${slot.min} 至 ${slot.max} 的${slot.integer ? '整数' : '有限数字'}`);
      } else if (slot.type === 'records') {
        if (!Array.isArray(value) || value.length < slot.min_items || value.length > slot.max_items) fail(`${label} 需要 ${slot.min_items} 至 ${slot.max_items} 项`);
        for (const [i, record] of value.entries()) {
          if (!plain(record) || Reflect.ownKeys(record).some(key => !own(slot.fields, key)) || Object.keys(slot.fields).some(key => !own(record, key))) fail(`${label}第 ${i+1} 项必须包含且仅包含 ${Object.keys(slot.fields).join('、')}`);
          validateContent({id: effect.id, name: `${label}第 ${i+1} 项`, content_slots: Object.entries(slot.fields).map(([id, field]) => ({id,...field}))}, record);
        }
      } else if (slot.type === 'text-list' || slot.type === 'code-lines') {
        if (!Array.isArray(value) || value.length < slot.min_items || value.length > slot.max_items) fail(`${label} 需要 ${slot.min_items} 至 ${slot.max_items} 项`);
        for (let i = 0; i < value.length; i++) {
          const line = value[i];
          if (slot.type === 'text-list') text(line, slot, `${label}第 ${i + 1} 项`);
          else {
            if (!Array.isArray(line) || !line.length || line.length > 30) fail(`${label}第 ${i + 1} 行需要文字与色调对`);
            for (const token of line) {
              if (!Array.isArray(token) || token.length !== 2 || !['ink', 'muted', 'teal'].includes(token[1])) fail(`${label}色调只支持 ink、muted、teal`);
              text(token[0], {...slot, allow_empty: true}, label);
            }
            text(line.map(token => token[0]).join(''), slot, `${label}第 ${i + 1} 行`);
          }
        }
      } else fail(`不支持的内容槽类型 ${slot.type}`);
    }
    if (effect.id === 'count-up' && (content.format ?? 'integer') === 'integer' && (content.decimals ?? 0) !== 0) fail('整数格式不能设置小数位；请选择 decimal、thousands 或 compact');
    if (effect.id === 'terminal-code' && effect.variant_id === 'command-log' && content.lines && count(content.lines[0]) > 20) fail('首行命令最多 20 字，才能在下一条日志出现前完成输入');
  }
  function withContent(effect, content = effect.content) {
    validateContent(effect, content);
    const result = {...effect};
    delete result.content;
    if (content === undefined) return result;
    const values = {};
    for (const slot of effect.content_slots || []) {
      if (own(content, slot.id) && JSON.stringify(content[slot.id]) !== JSON.stringify(slot.default)) values[slot.id] = JSON.parse(JSON.stringify(content[slot.id]));
    }
    if (Object.keys(values).length) result.content = values;
    return result;
  }
  const readSlot = (definition, id, fallback) => definition?.content && own(definition.content, id) ? definition.content[id] : fallback;
  const api = {validateContent, withContent, readSlot};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.MotionContent = api;
})(globalThis);
