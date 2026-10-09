import React from 'react';
import {aiScenePose, CONFUSED_FRONT_LAYERS} from './aiBotMotion.mjs';
import {AIBotCelebration, AIBotExpressions} from './AIBotExpressions.jsx';

// Each shot uses one full-body group illustration with its own expressions and gestures.
export const AIBots = ({t, mood = 'confused', asset}) => {
  const p = aiScenePose(t, mood);
  if (mood === 'confused') {
    const originalImage = <img src={asset('ai-bots/confused-clean-base.webp')} style={{display: 'block', width: 1536, height: 1024}} />;
    const expressions = <AIBotExpressions t={t} mood={mood} showSymbols={false} />;
    const original = <>{originalImage}{expressions}</>;
    const backMask = `path(evenodd, "M -120 -240 H 1656 V 1200 H -120 Z ${CONFUSED_FRONT_LAYERS.map(layer => layer.path).join(' ')}")`;
    return <div data-ai-scene={mood} style={{position: 'absolute', left: p.x, top: p.y, width: p.width,
      height: p.height, opacity: p.opacity, isolation: 'isolate', pointerEvents: 'none'}}>
      <div style={{position: 'absolute', width: 1536, height: 1024, transform: `scale(${p.width / 1536})`, transformOrigin: '0 0'}}>
        <div data-ai-depth="back" style={{position: 'absolute', inset: 0, clipPath: backMask}}>
          {/* 后排人物止于鞋底，剔除被放大的前排在原位置留下的细轮廓。 */}
          <div style={{position: 'absolute', inset: 0, clipPath: 'path(evenodd, "M 0 0 H 1536 V 815 H 0 Z M 553 650 H 981 V 815 H 553 Z")'}}>{originalImage}</div>
          {expressions}
        </div>
        {CONFUSED_FRONT_LAYERS.map(layer => <div key={layer.id} data-ai-depth={layer.id}
          style={{position: 'absolute', inset: 0, transform: `translate(${layer.dx}px, ${layer.dy}px) scale(${layer.scale})`, transformOrigin: `${layer.origin[0]}px ${layer.origin[1]}px`}}>
          <div style={{position: 'absolute', inset: 0, clipPath: `path("${layer.path}")`}}>{original}</div>
        </div>)}
        <AIBotExpressions t={t} mood={mood} showFaces={false} />
      </div>
    </div>;
  }
  return <div data-ai-scene={mood} style={{position: 'absolute', left: p.x, top: p.y,
      width: p.width, height: p.height, opacity: p.opacity, isolation: 'isolate', pointerEvents: 'none'}}>
      {mood === 'happy' && <AIBotCelebration t={t} />}
      <img src={asset(`ai-bots/${mood === 'happy' ? 'open-source-clean-base' : 'confused-clean-base'}.webp`)}
        style={{position: 'relative', zIndex: 1, display: 'block', width: '100%', height: '100%', objectFit: 'contain'}} />
      <AIBotExpressions t={t} mood={mood} />
    </div>;
};
