import React, {useId} from 'react';
import {SURFACE, glassPalette, glassStyle} from './surfaces.js';

export const GlassSvgDefs = ({id, selected = false}) => <defs>
  <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
    {glassPalette(selected).map((color, i) => <stop key={i} offset={[0, .28, .60, 1][i]} stopColor={color} />)}
  </linearGradient>
  <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="rgba(255,255,255,.12)" />
    <stop offset=".55" stopColor="rgba(34,35,43,.58)" />
    <stop offset="1" stopColor="rgba(225,232,255,.06)" />
  </linearGradient>
</defs>;

export const GlassFrame = ({as: Tag = 'div', t = 0, small = false, selected = false, squareTop = false, edgeProgress = 1, edgeOpacity = 1, style, children, ...props}) => {
  const id = `glass-${useId().replace(/:/g, '')}`;
  const radius = style?.borderRadius ?? (small ? SURFACE.radius.small : SURFACE.radius.frame);
  const halfLine = SURFACE.line.frame / 2;
  const edgeW = style?.width - SURFACE.line.frame, edgeH = style?.height - SURFACE.line.frame;
  const edgeR = radius - halfLine;
  const squareTopPath = squareTop && Number.isFinite(edgeW) && Number.isFinite(edgeH)
    ? `M 0 0 H ${edgeW} V ${edgeH - edgeR} A ${edgeR} ${edgeR} 0 0 1 ${edgeW - edgeR} ${edgeH} H ${edgeR} A ${edgeR} ${edgeR} 0 0 1 0 ${edgeH - edgeR} Z`
    : null;
  return <Tag {...props} data-glass-frame={small ? 'small' : 'frame'} data-glass-selected={selected || undefined}
    style={{position: 'relative', overflow: 'hidden', ...glassStyle({t, small, selected}), ...style,
      ...(squareTop ? {borderTopLeftRadius: 0, borderTopRightRadius: 0} : {})}}>
    {children}
    <svg data-glass-edge="" aria-hidden="true" width="100%" height="100%"
      style={{position: 'absolute', left: halfLine, top: halfLine, width: `calc(100% - ${SURFACE.line.frame}px)`,
        height: `calc(100% - ${SURFACE.line.frame}px)`, overflow: 'visible', pointerEvents: 'none', zIndex: 50, opacity: edgeOpacity}}>
      <GlassSvgDefs id={id} selected={selected} />
      {/* 沿真实框线的短亮段，局部柔光不盖住框内文字和素材。 */}
      {!small && edgeProgress >= .99 && <>
        {[7, 1.4].map((width, i) => {
          const edgeProps = {fill: 'none', stroke: selected ? '#A6E8CA' : '#D2E3DC', strokeWidth: width,
            pathLength: 1, strokeDasharray: '.075 .925', strokeDashoffset: -(t * .018 % 1),
            opacity: i === 0 ? (selected ? .24 : .1) : (selected ? .85 : .46),
            style: i === 0 ? {filter: 'blur(3px)'} : undefined};
          return squareTopPath ? <path key={i} d={squareTopPath} {...edgeProps} />
            : <rect key={i} width="100%" height="100%" rx={edgeR} {...edgeProps} />;
        })}
      </>}
      {squareTopPath ? <path d={squareTopPath} fill="none" stroke={`url(#${id}-edge)`}
        strokeWidth={SURFACE.line.frame} pathLength="1" strokeDasharray={`${Math.max(0, Math.min(1, edgeProgress))} 1`} />
        : <rect width="100%" height="100%" rx={edgeR} fill="none" stroke={`url(#${id}-edge)`}
          strokeWidth={SURFACE.line.frame} pathLength="1" strokeDasharray={`${Math.max(0, Math.min(1, edgeProgress))} 1`} />}
    </svg>
  </Tag>;
};
