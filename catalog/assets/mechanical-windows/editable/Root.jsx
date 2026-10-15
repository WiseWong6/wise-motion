import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {MechanicalWindows} from './Film.jsx';
registerRoot(()=> <Composition id="MechanicalWindows" component={MechanicalWindows} width={1920} height={1080} fps={30} durationInFrames={960}/>);
