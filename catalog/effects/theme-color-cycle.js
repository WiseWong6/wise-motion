/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(F){
  'use strict';
  const colors=[
    {name:'珊瑚橘',hex:'#FF7A59'},{name:'鸢尾紫',hex:'#7463D8'},
    {name:'雾霭蓝',hex:'#6E91B8'},{name:'苔藓绿',hex:'#7E8C54'},
    {name:'玫瑰棕',hex:'#A56D76'},{name:'香槟金',hex:'#C5A96C'}
  ];
  F['theme-color-cycle']=(root,K)=>{
    const text=(value,x,y,role='caption',extra='')=>`<text x="${x}" y="${y}" dominant-baseline="hanging" font-size="${K.textSize(role,.6)}" font-weight="${role==='title'?700:300}" fill="var(--ink)" ${extra}>${value}</text>`;
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><g transform="translate(50 54) scale(.6)">'+
      text('主题换色',0,0,'title')+text('自定义主色 · 示例',900,12,'caption','text-anchor="end"')+
      '<g data-accent><rect x="0" y="85" width="108" height="162"/>'+[66,112].map((h,i)=>`<rect x="${581+i*109}" y="${221-h}" width="53" height="${h}"/>`).join('')+'</g>'+
      '<rect x="799" y="135" width="53" height="86" fill="var(--faint)"/>'+
      '<path d="M572 233h308M0 280h900" fill="none" stroke="var(--path)" stroke-width=".7"/>'+
      text('相同主题，自由换色',146,88)+text('',146,127.4,'title','data-part="name"')+
      `<text data-part="hex" x="146" y="181.8" dominant-baseline="hanging" font-size="${K.textSize('caption',.6)}" font-weight="700" fill="var(--muted)" letter-spacing="1.3"/>`+
      colors.map((color,i)=>`<g data-option="${i}"><rect data-active-mark x="${i*153}" y="312" width="135" height="3" fill="var(--ink)"/>`+
        `<rect x="${i*153}" y="327" width="135" height="28" fill="${color.hex}"/>`+
        text(color.name,i*153,365)+'</g>').join('')+'</g></svg>';
    const accent=root.querySelector('[data-accent]'),name=root.querySelector('[data-part="name"]'),hex=root.querySelector('[data-part="hex"]');
    const options=[...root.querySelectorAll('[data-option]')];
    let active=-1;
    return ms=>{
      // 沿用原作每 0.20 秒切换一次的色表：改变颜色和标签，几何始终不动。
      const index=Math.max(0,Math.min(colors.length-1,Math.floor((ms/1000-.32+1e-7)/.20)));
      if(index===active)return;
      const color=colors[index];accent.setAttribute('fill',color.hex);name.textContent=color.name;hex.textContent=color.hex;
      options.forEach((option,i)=>{
        option.dataset.active=String(i===index);
        option.querySelector('[data-active-mark]').setAttribute('opacity',i===index?'1':'0');
      });
      active=index;
    };
  };
})(globalThis.MotionFactories);
