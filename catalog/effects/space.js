/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['flat-to-volume'] = (root, M) => {
    // 初态所有点的高度为零；转向水平时，图案沿自身法线连续长出高度。
    // 顶面、内壁、外壁使用同一透视投影，背面剔除后按距离绘制可见面。
    const objects=[{id:'ring',x:0,y:0,r:58,inner:40,height:60,steps:48},
      ...[[-92,-70],[92,-70],[-92,70],[92,70]].map(([x,y],i)=>({id:'dot-'+i,x,y,r:11,height:42,steps:24}))];
    const circle=(object,r,z=0)=>Array.from({length:object.steps},(_,i)=>{
      const a=i/object.steps*Math.PI*2;
      return [object.x+r*Math.cos(a),object.y+r*Math.sin(a),z];
    });
    const ring=objects[0],ground=[{id:'surface',loops:[[[-148,-112,0],[148,-112,0],[148,112,0],[-148,112,0]]],closed:true,fill:'var(--card)',stroke:'var(--card-ink)',width:.55}];
    const line=(id,points)=>ground.push({id,loops:[points],stroke:'var(--card-muted)',width:.3,opacity:.22});
    for(let i=-3;i<=3;i++)line('column-'+i,[[i*37,-112,0],[i*37,112,0]]);
    for(let i=-3;i<=3;i++)line('row-'+i,[[-148,i*28,0],[148,i*28,0]]);
    for(const object of objects)ground.push({id:object.id+'-base',loops:[circle(object,object.r),...(object.inner?[circle(object,object.inner)]:[])],closed:true,fill:'var(--card-ink)'});
    const faces=[];
    const face=(id,points,normal,object,shade,stroke=shade,width=.25)=>{
      const center=points.reduce((sum,point)=>sum.map((n,i)=>n+point[i]/points.length),[0,0,0]);
      faces.push({id,loops:[points],closed:true,normal,center,object,fill:shade,stroke,width,index:faces.length});
    };
    for(const object of objects){
      const base=circle(object,object.r),top=circle(object,object.r,object.height);
      const innerBase=object.inner?circle(object,object.inner):null,innerTop=object.inner?circle(object,object.inner,object.height):null;
      for(let i=0;i<object.steps;i++){
        const next=(i+1)%object.steps,a=(i+.5)/object.steps*Math.PI*2,nx=Math.cos(a),ny=Math.sin(a);
        const gray=Math.round(130-35*nx-20*ny),shade=`color-mix(in srgb,var(--ink) ${gray/255*100}%,var(--card))`;
        face(object.id+'-outer-'+i,[base[i],base[next],top[next],top[i]],[nx,ny,0],object,shade);
        if(object.inner){
          const innerGray=Math.round(83+18*nx+10*ny),innerShade=`color-mix(in srgb,var(--ink) ${innerGray/255*100}%,var(--card))`;
          face(object.id+'-inner-'+i,[innerBase[next],innerBase[i],innerTop[i],innerTop[next]],[-nx,-ny,0],object,innerShade);
          face(object.id+'-top-'+i,[top[i],top[next],innerTop[next],innerTop[i]],[0,0,1],object,'var(--plane-3)');
        }
      }
      if(!object.inner)face(object.id,top,[0,0,1],object,'var(--plane-3)','var(--card-ink)',.45);
    }
    const rim={id:'ring',loops:[circle(ring,ring.r,ring.height),circle(ring,ring.inner,ring.height)],closed:true,stroke:'var(--card-ink)',width:.45};
    const markup=shape=>`<path data-part="${shape.id}" fill="${shape.fill||'none'}" fill-rule="evenodd" stroke="${shape.stroke||'none'}" stroke-width="${shape.width||0}" opacity="${shape.opacity??1}" stroke-linejoin="round"/>`;
    root.innerHTML='<svg class="pattern-svg" viewBox="0 0 640 360" width="640" height="360" aria-hidden="true"><g data-layer="ground">'+ground.map(markup).join('')+'</g><g data-layer="volume">'+faces.map(markup).join('')+'</g><g data-layer="rim">'+markup(rim)+'</g></svg>';
    const layer=root.querySelector('[data-layer="volume"]');
    for(const shape of [...ground,...faces,rim])shape.node=root.querySelector(`[data-part="${shape.id}"]`);
    return (t,o)=>{
      const p=M.span(t,600,3200,o.ease),growth=M.span(t,1150,2850,o.ease);
      const angle=p*Math.PI*65/180,distance=510,sin=Math.sin(angle),cos=Math.cos(angle);
      const project=([x,y,z])=>{
        const h=z*growth,depth=y*sin+h*cos,scale=distance/(distance-depth);
        return [320+x*scale,180+(y*cos-h*sin)*scale,depth];
      };
      const draw=shape=>{
        const d=shape.loops.map(points=>points.map((point,i)=>{
          const [x,y]=project(point);
          return (i?'L':'M')+x.toFixed(3)+' '+y.toFixed(3);
        }).join('')+(shape.closed?'Z':'')).join('');
        shape.node.setAttribute('d',d);
      };
      ground.forEach(draw);draw(rim);
      for(const shape of faces){
        draw(shape);
        const [x,y,z]=shape.center,[nx,ny,nz]=shape.normal;
        const visible=nx*(-x)+ny*(distance*sin-y)+nz*(distance*cos-z*growth)>0;
        shape.node.setAttribute('visibility',visible&&(nz!==0||growth>0)?'visible':'hidden');
        shape.depth=project(shape.center)[2];
      }
      const sorted=[...faces].sort((a,b)=>a.depth-b.depth||a.index-b.index);
      sorted.forEach((shape,i)=>{if(layer.children[i]!==shape.node)layer.insertBefore(shape.node,layer.children[i]||null);});
    };
  };
  F['shape-morph'] = (root, M) => {
    const s = M.scene(root, '<div class="center-shape"></div>');
    return (t, o) => { const half = t < o.duration / 2 ? t / (o.duration / 2) : (o.duration - t) / (o.duration / 2); const p = M.ease(half, o.ease); const shape = s.one('.center-shape'); shape.style.borderRadius = `${50 - p * 36}%`; M.pose(shape, {rotate: p * 90, scale: 1 + p * .1}); };
  };
  F['card-flip'] = (root, M) => {
    const s = M.scene(root, '<div class="flip-card"><div class="flip-face">✦<small>一个想法</small></div><div class="flip-face flip-back">✓<small>另一面信息</small></div></div>');
    return (t, o) => M.pose(s.one('.flip-card'), {ry: M.span(t, 600, 2200, o.ease) * 180});
  };
  F['layout-reorder'] = (root, M) => {
    const s = M.scene(root, Array.from({length: 4}, (_, i) => `<div class="layout-card"><b>${i + 1}</b>同一个内容</div>`).join('')); const cards = s.all('.layout-card');
    return (t, o) => { const p = M.span(t, 800, 2900, o.ease); cards.forEach((c, i) => { c.style.left = `${M.mix(160, 144 + i % 2 * 182, p)}px`; c.style.top = `${M.mix(70 + i * 59, 92 + Math.floor(i / 2) * 112, p)}px`; c.style.width = `${M.mix(320, 168, p)}px`; c.style.height = `${M.mix(47, 98, p)}px`; }); };
  };
  F['column-to-row'] = (root, M) => {
    root.innerHTML = '<svg class="pattern-svg" viewBox="0 0 640 360" width="640" height="360" aria-hidden="true">' +
      Array.from({length: 3}, (_, i) => `<circle data-point="${i}" r="9" fill="var(--ink)"/>`).join('') + '</svg>';
    const points = [...root.querySelectorAll('circle')];
    return (t, o) => {
      const progress = M.span(t, 850, 1700, o.ease);
      const scale = M.mix(1.15, 1, progress);
      points.forEach((point, i) => {
        // 原作对每项的位移和比例同时归位；缩放原点在左侧，不含旋转。
        point.setAttribute('cx', 196 + 12 * scale + i * 92 * progress);
        point.setAttribute('cy', M.mix(184 + i * 60, 104, progress));
        point.setAttribute('r', 12 * scale);
      });
    };
  };
  F['layer-expand'] = (root, M) => {
    const s = M.scene(root, Array.from({length: 4}, (_, i) => `<div class="plane" style="background:var(--plane-${i})">${['内容','结构','样式','基础'][i]}</div>`).join('')); const layers = s.all('.plane');
    return (t, o) => layers.forEach((c, i) => { const p = M.span(t, 700 + i * 120, 2800 + i * 120, o.ease); c.style.transform = `translateY(${(i - 1.5) * M.mix(10, 48, p)}px) rotateX(52deg) rotateZ(-25deg)`; c.style.zIndex = String(4 - i); });
  };
  F['paper-tilt'] = (root, M) => {
    // 原纸层镜头：三层共同倾斜、缩小，沿深度错开，短暂停留后恢复平面。
    const ratio = .25, halfWidth = 900 * ratio / 2, halfHeight = 1042 * ratio / 2;
    const corners = [[-halfWidth,-halfHeight],[halfWidth,-halfHeight],[halfWidth,halfHeight],[-halfWidth,halfHeight]];
    const layers = [{x:30,y:28,z:-72,fill:'var(--plane-0)'},{x:18,y:16,z:-32,fill:'var(--plane-2)'},{x:-10,y:-8,z:42,fill:'var(--card)'}];
    const marks = [
      {points:[[-78,-85],[-42,-85]],width:1.1},
      {points:[[-78,-65],[58,-65]]},
      {points:[[-65,-35],[-65,91]],muted:true},
      ...[-27,23,73].flatMap(y => [
        {points:Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return [-65+Math.cos(a)*4,y+Math.sin(a)*4];}),closed:true},
        {points:[[-61,y],[-40,y]],muted:true},
        {points:[[-40,y-16],[74,y-16],[74,y+16],[-40,y+16]],closed:true},
        {points:[[-29,y-4],[42,y-4]],muted:true},
        {points:[[-29,y+6],[20,y+6]],muted:true}
      ])
    ];
    root.innerHTML = '<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">' +
      layers.map((layer,i)=>`<path data-sheet="${i}" fill="${layer.fill}" stroke="var(--card-muted)" stroke-width=".45" stroke-linejoin="round"/>`).join('') +
      marks.map((mark,i)=>`<path data-mark="${i}" fill="none" stroke="var(--${mark.muted?'card-muted':'card-ink'})" stroke-width="${mark.width||.55}" stroke-linecap="round" stroke-linejoin="round"/>`).join('') + '</svg>';
    const sheets = [...root.querySelectorAll('[data-sheet]')], paths = [...root.querySelectorAll('[data-mark]')];
    const set = (el,key,value) => { const v=String(value); if(el.getAttribute(key)!==v)el.setAttribute(key,v); };
    let previous;
    return t => {
      const q=M.span(t,100,800,'inOutCubic')-M.span(t,1050,1800,'inOutCubic');
      if(previous===q)return;previous=q;
      const scale=M.mix(1,.90,q),rx=8*q*Math.PI/180,ry=-5*q*Math.PI/180;
      const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),distance=1700*ratio;
      const project=([x,y],layer)=>{
        // 先做纸层偏移，再围绕同一中心缩放和旋转，最后统一做近大远小投影。
        const px=(x+layer.x*q*ratio)*scale,py=(y+layer.y*q*ratio)*scale,pz=layer.z*q*ratio;
        const yy=py*cx-pz*sx,zz=py*sx+pz*cx;
        const xx=px*cy+zz*sy,depth=-px*sy+zz*cy,factor=distance/(distance-depth);
        return [320+xx*factor,180+(yy-10*q*ratio)*factor];
      };
      const path=(points,layer,closed)=>points.map((point,i)=>{const [x,y]=project(point,layer);return (i?'L':'M')+x.toFixed(3)+' '+y.toFixed(3);}).join('')+(closed?'Z':'');
      layers.forEach((layer,i)=>{set(sheets[i],'d',path(corners,layer,true));set(sheets[i],'opacity',i===2?1:q);});
      marks.forEach((mark,i)=>set(paths[i],'d',path(mark.points,layers[2],mark.closed)));
    };
  };
})(globalThis.MotionFactories);
