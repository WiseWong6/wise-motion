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
    let options = [], active = 0, leaveTimer = null, hoverOpened = false;
    const buttons = () => [...menu.querySelectorAll('[role="option"]')];
    const opened = () => !menu.hidden;

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
      if (!list.length) return;
      active = Math.max(0, Math.min(list.length - 1, index));
      const current = list[active];
      list.forEach(item => item.setAttribute('tabindex', item === current ? '0' : '-1'));
      current.focus();
      trigger.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView?.({block:'nearest'});
    }

    function open({focus = true} = {}) {
      clearTimeout(leaveTimer);
      if (settings.blocked?.()) { close(); return; }
      if (!options.length) return;
      if (opened()) {
        if (focus) { hoverOpened = false; focusOption(Math.max(0, options.findIndex(option => option.value === trigger.value))); }
        return;
      }
      document.body.append(menu);
      menu.hidden = false;
      hoverOpened = !focus;
      trigger.setAttribute('aria-expanded', 'true');
      place();
      if (focus) focusOption(Math.max(0, options.findIndex(option => option.value === trigger.value)));
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
      menu.innerHTML = items.map((option, index) =>
        `<button type="button" role="option" tabindex="-1" data-value="${MotionKit.escape(option.value)}" id="${menu.id}-${index}" aria-selected="false"><span>${MotionKit.escape(option.label)}</span><span class="option-check" aria-hidden="true"></span></button>`
      ).join('');
      if (items.length) setValue(value);
    }

    trigger.addEventListener('click', event => {
      event.preventDefault();
      opened() && !hoverOpened ? close() : open({focus:true});
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); open({focus:true});
      } else if (event.key === 'Escape' && opened()) {
        event.preventDefault(); close(true);
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
      if (!button) return;
      setValue(button.dataset.value, true);
      close(true);
    });
    menu.addEventListener('keydown', event => {
      const index = buttons().indexOf(document.activeElement);
      const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
      if (event.key === 'Home' || event.key === 'End' || step) {
        event.preventDefault();
        focusOption(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : index + step);
      } else if (event.key === 'Escape') {
        event.preventDefault(); close(true);
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
})(globalThis);
