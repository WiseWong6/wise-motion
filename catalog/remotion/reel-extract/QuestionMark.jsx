import React from 'react';
import {C} from './colors.js';

// 大问号和人物气泡共用同一条圆头曲线及圆点。
export const QuestionMark = ({color = C.accent, outline = true}) => <>
  {outline && <><path d="M -18 -27 C -18 -54 22 -57 30 -35 C 37 -17 16 -13 9 -3 Q 4 2 4 13"
    fill="none" stroke="#FFF9EE" strokeWidth={23} strokeLinecap="round" />
    <circle cx={4} cy={38} r={11.5} fill="#FFF9EE" /></>}
  <path d="M -18 -27 C -18 -54 22 -57 30 -35 C 37 -17 16 -13 9 -3 Q 4 2 4 13"
    fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" />
  <circle cx={4} cy={38} r={8} fill={color} />
</>;
