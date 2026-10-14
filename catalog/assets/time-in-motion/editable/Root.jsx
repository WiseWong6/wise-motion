import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {TimeInMotion} from './Film.jsx';
import config from './movie.config.json';
registerRoot(()=> <Composition id="TimeInMotion" component={TimeInMotion} width={1920} height={1080} fps={24} durationInFrames={1056}/>);
