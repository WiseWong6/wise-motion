/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 自定义下拉框。
   打开时把菜单放到页面浮层，避免被侧栏的滚动区域裁切；关闭时归还原位置。
   键盘行为：Enter/Space 打开，方向键移动，Home/End 跳到首尾，Esc 关闭并把焦点还给触发按钮。
   可选 hoverRoot：鼠标进入根区域时打开菜单；iconOnly：触发器只保留图标，不改成所选文字。 */
(function (global) {
  'use strict';
  const GAP = 5;
  global.MotionDropdown = function (trigger, menu, settings = {}) {
    const root = trigger.parentElement;
    const home = menu.parentElement;
    const iconOnly = !!settings.iconOnly;
    const hoverRoot = settings.hoverRoot || null;
    const anchor = settings.anchor || trigger;
    let options = [], leaveTimer = null, hoverOpened = false;
    const buttons = () => [...menu.querySelectorAll('[role="option"]')].filter(button => !button.disabled);
    const opened = () => !menu.hidden;
    function renderOptions() {
      menu.innerHTML = options.map((option, index) => {
        const selected = option.value === trigger.value;
        return `<button type="button" role="option" tabindex="-1" data-value="${MotionKit.escape(option.value)}" id="${menu.id}-${index}" aria-selected="${selected}"${option.disabled ? ' disabled' : ''}><span>${MotionKit.escape(option.label)}</span><span class="option-check" aria-hidden="true">${selected ? MotionIcons.check : ''}</span></button>`;
      }).join('');
      trigger.removeAttribute('aria-activedescendant');
    }

    function place() {
      const rect = anchor.getBoundingClientRect();
      const edge = 8;
      const viewport = global.visualViewport;
      const top = viewport?.offsetTop || 0;
      const bottom = top + (viewport?.height || global.innerHeight);
      if (!anchor.isConnected || rect.bottom <= top || rect.top >= bottom) { close(); return; }
      const width = Math.min(Math.max(rect.width, trigger.offsetWidth), global.innerWidth - edge * 2);
      menu.style.width = width + 'px';
      menu.style.left = Math.max(edge, Math.min(rect.left, global.innerWidth - width - edge)) + 'px';
      const below = Math.max(0, bottom - rect.bottom - GAP - edge);
      const above = Math.max(0, rect.top - top - GAP - edge);
      const upward = menu.scrollHeight > below && above > below;
      const room = upward ? above : below;
      menu.style.maxHeight = Math.max(1, Math.min(320, room)) + 'px';
      menu.dataset.placement = upward ? 'top' : 'bottom';
      menu.style.top = (upward ? rect.top - GAP - menu.offsetHeight : rect.bottom + GAP) + 'px';
    }

    function close(focus = false) {
      clearTimeout(leaveTimer);
      menu.hidden = true;
      hoverOpened = false;
      if (menu.parentElement !== home) home.append(menu);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      if (focus) trigger.focus();
    }

    function focusOption(index) {
      const list = buttons();
      if (!list.length) {
        trigger.removeAttribute('aria-activedescendant');
        return;
      }
      const active = Math.max(0, Math.min(list.length - 1, index));
      const current = list[active];
      list.forEach(item => {
        item.setAttribute('tabindex', item === current ? '0' : '-1');
        item.toggleAttribute('data-active', item === current);
      });
      current.focus();
      trigger.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView?.({block:'nearest'});
    }

    function open({focus = true} = {}) {
      clearTimeout(leaveTimer);
      if (settings.blocked?.()) { close(); return; }
      settings.beforeOpen?.();
      if (!options.length) return;
      if (opened()) {
        if (focus) {
          hoverOpened = false;
          focusOption(Math.max(0, buttons().findIndex(button => button.dataset.value === trigger.value)));
        }
        return;
      }
      (trigger.closest('dialog') || document.body).append(menu);
      menu.hidden = false;
      hoverOpened = !focus;
      trigger.setAttribute('aria-expanded', 'true');
      place();
      if (focus) {
        focusOption(Math.max(0, buttons().findIndex(button => button.dataset.value === trigger.value)));
      }
    }

    function setValue(value, notify = false) {
      const option = options.find(option => option.value === value);
      if (!option) throw new TypeError('不支持的选项：' + value);
      trigger.value = option.value;
      if (iconOnly) {
        trigger.setAttribute('aria-label', '按运动行为筛选：' + option.label);
        trigger.title = option.label;
      } else {
        trigger.innerHTML = `<span class="select-value">${MotionKit.escape(option.label)}</span>${MotionIcons['chevron-down']}`;
        if (settings.label) trigger.setAttribute('aria-label', settings.label + '：' + option.label);
      }
      buttons().forEach(button => {
        const selected = button.dataset.value === value;
        button.setAttribute('aria-selected', String(selected));
        button.querySelector('.option-check').innerHTML = selected ? MotionIcons.check : '';
      });
      if (notify) trigger.dispatchEvent(new Event('change', {bubbles:true}));
    }

    function setOptions(items, value = items[0]?.value) {
      close();
      options = items;
      renderOptions();
      if (items.length) setValue(value);
      else {
        trigger.value = '';
        if (!iconOnly) trigger.innerHTML = '<span class="select-value">选择' + MotionKit.escape(settings.label || '选项') + '</span>' + MotionIcons['chevron-down'];
      }
    }

    trigger.addEventListener('click', event => {
      event.preventDefault();
      opened() && !hoverOpened ? close() : open({focus:true});
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); open({focus:true});
      } else if (event.key === 'Escape' && opened()) {
        event.preventDefault(); event.stopPropagation();
        close(true);
      }
    });
    trigger.addEventListener('change', () => setValue(trigger.value));

    if (hoverRoot) {
      hoverRoot.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse') open({focus:false});
      });
      hoverRoot.addEventListener('pointerleave', () => {
        if (hoverOpened) leaveTimer = setTimeout(() => close(), 140);
      });
      menu.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
      menu.addEventListener('pointerleave', () => {
        if (hoverOpened) leaveTimer = setTimeout(() => close(), 140);
      });
    }

    menu.addEventListener('click', event => {
      const button = event.target.closest('[role="option"]');
      if (!button || button.disabled) return;
      setValue(button.dataset.value, true);
      close(true);
    });
    menu.addEventListener('keydown', event => {
      if (event.isComposing) return;
      const index = buttons().indexOf(document.activeElement);
      const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
      if (step || event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        focusOption(event.key === 'Home' ? 0 : event.key === 'End' ? buttons().length - 1 : index + step);
      } else if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); close(true);
      } else if (event.key === 'Tab') {
        close(true);
      }
    });

    const outsideRoot = hoverRoot || root;
    const inside = target => outsideRoot.contains(target) || menu.contains(target);
    document.addEventListener('pointerdown', event => { if (opened() && !inside(event.target)) close(); });
    document.addEventListener('focusin', event => { if (opened() && !inside(event.target)) close(); });
    global.addEventListener('resize', () => { if (opened()) place(); });
    global.addEventListener('scroll', event => { if (opened() && !menu.contains(event.target)) place(); }, {capture:true, passive:true});
    global.visualViewport?.addEventListener('resize', () => { if (opened()) place(); });

    return {setOptions, setValue, close, open};
  };

  // 保留原生选择器的值与 change 事件，目录和相关动作弹窗共用同一适配。
  global.MotionSelect = function (select, label = '示例样式') {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = select.id + '-trigger';
    trigger.className = 'select-trigger variant-select';
    trigger.setAttribute('aria-label', label);
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div');
    menu.id = select.id + '-options';
    menu.className = 'select-menu scroll-area';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', label);
    menu.hidden = true;
    trigger.setAttribute('aria-controls', menu.id);
    select.after(trigger, menu);
    select.hidden = true;
    select.tabIndex = -1;
    let stamp = '';
    const picker = global.MotionDropdown(trigger, menu, {label, beforeOpen:() => refresh()});
    function refresh(reset = false) {
      const items = [...select.options].map(option => ({value:option.value, label:option.label, disabled:option.disabled}));
      const next = JSON.stringify(items);
      const value = items.some(option => option.value === select.value) ? select.value : items[0]?.value;
      trigger.disabled = select.disabled || !items.length;
      if (reset || next !== stamp) { stamp = next; picker.setOptions(items, value); }
      else if (items.length && trigger.value !== value) picker.setValue(value);
    }
    trigger.addEventListener('change', event => {
      event.stopPropagation();
      if (select.value === trigger.value) return;
      select.value = trigger.value;
      select.dispatchEvent(new Event('change', {bubbles:true}));
    });
    select.addEventListener('change', () => refresh());
    new MutationObserver(() => refresh(true)).observe(select, {childList:true, subtree:true, attributes:true, attributeFilter:['disabled','label','value']});
    const dialog = select.closest('dialog');
    dialog?.addEventListener('close', () => { if (!dialog.open) picker.close(); });
    refresh();
    return {refresh, close:picker.close, open:picker.open, trigger, menu};
  };
})(globalThis);
