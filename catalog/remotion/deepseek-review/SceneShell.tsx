// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {FONT, LAYOUT, PAD} from './theme';
export const SceneShell = ({scheme, children}) => <div style={{position:'absolute',inset:0,backgroundColor:scheme.bg,color:scheme.fg,fontFamily:FONT.display,overflow:'hidden'}}><div style={{position:'absolute',inset:0,left:PAD,width:LAYOUT.width}}>{children}</div></div>;
