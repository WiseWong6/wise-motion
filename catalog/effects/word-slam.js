/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(F){
  'use strict';
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  // 字宽来自包内 Oswald Bold；反白块与实际字宽一致，无需播放时读取布局。
  const words=['CUT','SCRATCH','BLEED','LAYER','DISTORT','EXPOSE','REPEAT','OBSESS'];
  const widths=[1.596,3.846,2.511,2.534,3.477,3.08,3.061,3.163];
  const items=words.map((word,i)=>({word,em:widths[i],size:150+hash(i*9.1)*110,
    x:200+hash(i*3.1)*820,y:330+hash(i*5.7)*460,
    oldX:260+hash(i*3.1)*900,oldY:300+hash(i*5.7)*500,oldSize:90+hash(i)*80}));
  F['word-slam']=(root,M,definition)=>{
    const custom=Boolean(definition?.content),chosen=M.slot(definition,'words',words),family=custom?M.textFont(chosen.join('')):'Oswald';
    const setup=()=>{
    const displayItems=custom?chosen.map((word,i)=>{
      const source=items[i],em=M.measureText(root,word,100,family)/100;
      const size=Math.min(source.size,(1848-source.x-40)/1.2/Math.max(em,.1));
      const oldSize=Math.min(source.oldSize,(1848-source.oldX-40)/Math.max(em,.1));
      if(Math.min(size,oldSize)<32)throw new Error('撞入文字过宽，请缩短 words');
      return {...source,word,em,size,oldSize};
    }):items;
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true">'+
      `<g data-part="shake" font-family="${family},sans-serif" font-weight="700">`+
      displayItems.map((v,i)=>`<text data-ghost="${i}" x="${v.oldX}" y="${v.oldY}" font-size="${v.oldSize}" fill="var(--ink)" opacity=".1" visibility="hidden">${M.escape(v.word)}</text>`).join('')+
      '<g data-part="current"><rect data-part="block" x="-20" fill="var(--ink)" visibility="hidden"/>'+
      '<text data-part="red" y="4" fill="var(--cycle-red)" opacity=".75"/>'+
      '<text data-part="offset" x="10" y="-6" fill="var(--ink)" opacity=".3"/>'+
      '<text data-part="word" y="0"/></g></g></svg>';
    const parts=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
    const ghosts=[...root.querySelectorAll('[data-ghost]')];
    const set=(node,key,value)=>{if(node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));};
    const attr=(id,values)=>{for(const [key,value]of Object.entries(values))set(parts.get(id),key,value);};
    let lastWord=-1;
    return ms=>{
      // 原作词序从场景 0.25 秒开始；提取八词，停住末词，不接后面的年代标题。
      const t=.25+Math.max(0,Math.min(ms,3950))/1000,frame=Math.floor(t*24);
      const i=Math.min(displayItems.length-1,Math.floor((t-.25)/.5)),v=displayItems[i],inverse=i%3===2;
      const r=k=>hash(frame*13.37+k*7.1);
      attr('shake',{transform:`translate(${(r(1)-.5)*6} ${(r(2)-.5)*8+(r(3)<.04?36:0)})`});
      attr('current',{'data-word-index':i,transform:`translate(${v.x} ${v.y}) scale(${.85+hash(i*2.2+frame)*.35} 1)`});
      if(i!==lastWord){
        lastWord=i;
        for(const id of ['red','offset','word'])parts.get(id).textContent=v.word;
        attr('current',{'font-size':v.size});
        attr('block',{y:-v.size*.85,width:v.em*v.size+40,height:v.size*1.05,visibility:inverse?'visible':'hidden'});
        for(const id of ['red','offset'])attr(id,{visibility:inverse?'hidden':'visible'});
        attr('word',{fill:inverse?'var(--stage)':'var(--ink)'});
        ghosts.forEach((node,j)=>set(node,'visibility',j>=Math.max(0,i-3)&&j<i?'visible':'hidden'));
      }
      attr('red',{x:-8+(r(5)-.5)*10});
      attr('word',{x:inverse?(r(4)-.5)*8:(r(6)-.5)*6});
    };
    };
    return custom?M.textReady(root,[{family,text:chosen.join('')}],setup):setup();
  };
})(globalThis.MotionFactories);
