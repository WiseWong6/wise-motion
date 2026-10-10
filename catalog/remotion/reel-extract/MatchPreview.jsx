// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {ActualEffect} from './ActualEffect.jsx';
import DATA from './nested-data.json';

const mountain={...DATA.definitions['book-geometric-illustration'],variant_id:'mountain',variants:undefined};
export const MatchPreview = ({kind,width,height}) => {
 const id={turn:'book-spine-turn',art:'book-geometric-illustration',paper:'book-paper-light'}[kind];
 const definition=kind==='art'?mountain:DATA.definitions[id];
 return <div data-match-preview={kind} style={{width,height}}>
  <ActualEffect definition={definition} time={kind==='art'?0:3350} theme="light" width={width} height={height}/>
 </div>;
};
