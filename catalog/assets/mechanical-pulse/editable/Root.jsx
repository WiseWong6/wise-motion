import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {MechanicalPulseSpatial} from './FilmV4.jsx';
registerRoot(()=> <Composition id="MechanicalPulse" component={MechanicalPulseSpatial} defaultProps={{alignedForm:true,paced:true,withAudio:false}} width={1920} height={1080} fps={30} durationInFrames={540}/>);
