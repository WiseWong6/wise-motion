import React from 'react';

import {aiScenePose} from './aiBotMotion.mjs';
import {AIBotCelebration, AIBotExpressions} from './AIBotExpressions.jsx';

// Each shot uses one full-body group illustration with its own expressions and gestures.
export const AIBots = ({t, mood = 'confused', asset}) => {
  const p = aiScenePose(t, mood);
  return <div data-ai-scene={mood} style={{position: 'absolute', left: p.x, top: p.y,
      width: p.width, height: p.height, opacity: p.opacity, isolation: 'isolate', pointerEvents: 'none'}}>
      {mood === 'happy' && <AIBotCelebration t={t} />}
      <img src={asset(`ai-bots/${mood === 'happy' ? 'open-source-clean-base' : 'confused-clean-base'}.webp`)}
        style={{position: 'relative', zIndex: 1, display: 'block', width: '100%', height: '100%', objectFit: 'contain'}} />
      <AIBotExpressions t={t} mood={mood} />
    </div>;
};
