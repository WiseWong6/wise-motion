import React from 'react';
import {AbsoluteFill,Sequence,CanvasImage,staticFile,useCurrentFrame,useVideoConfig,interpolate,Easing} from 'remotion';
import {Video,Audio} from '@remotion/media';
import config from '../movie.config.json';
import {DialRings,KineticWord as MotionWord} from '../图形/index.jsx';

export const C={paper:'#e9e6de',ink:'#101114',accent:'#c2a974',gold:'#d4ba83'};
const KineticWord=({style,split='word',...props})=><MotionWord {...props} split={split} enterFrames={14} exitFrames={0} fontFamily='HN,Helvetica,Arial,sans-serif' fontWeight={500} style={{display:'flex',width:'max-content',lineHeight:.98,...style}}/>;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
const ease=Easing.bezier(.22,1,.36,1);
const ramp=(f,a,b,x,y)=>interpolate(f,[a,b],[x,y],{...clamp,easing:ease});
const linear=(f,a,b,x,y)=>interpolate(f,[a,b],[x,y],clamp);
export const Fonts=()=> <style>{`@font-face{font-family:HN;src:url('${staticFile('HelveticaNeue-Medium.woff2')}');font-weight:500;}@font-face{font-family:HN;src:url('${staticFile('HelveticaNeue-Regular.woff2')}');font-weight:400;}*{box-sizing:border-box}`}</style>;
const Base=({children,bg=C.ink,style={}})=><AbsoluteFill style={{background:bg,color:C.paper,fontFamily:'HN,Helvetica,Arial,sans-serif',overflow:'hidden',...style}}>{children}</AbsoluteFill>;
const Plate=({src,style={}})=><CanvasImage src={staticFile(src)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',...style}}/>;
const Watch=({angle=false,width=950,style={}})=><CanvasImage src={staticFile(angle?'watch-angle.png':'watch-front.png')} style={{position:'absolute',width,height:width*4/3,objectFit:'contain',...style}}/>;
const Film=({src,rate=1,trim=0,style={}})=>{const{fps}=useVideoConfig();const{objectFit='cover',objectPosition='50% 50%',...visualStyle}=style;return <Video src={staticFile(src)} muted objectFit={objectFit} objectPosition={objectPosition} trimBefore={trim} playbackRate={rate} premountFor={fps} style={{position:'absolute',width:'100%',height:'100%',...visualStyle}}/>};
// Masks use the source camera and geometry; keep the source frame mapping shared with playback.
const MaskedFilm=({src,rate=1,trim=0,maskFolder,maskOffset=0,lastFrame=95,style={}})=>{const f=useCurrentFrame();const sourceFrame=maskOffset+trim+Math.floor(Math.max(0,Math.min(lastFrame,f))*rate);const mask=staticFile(`${maskFolder}/F${String(sourceFrame).padStart(4,'0')}.png`);return <>
 <CanvasImage src={mask} style={{position:'absolute',width:1,height:1,opacity:0}}/>
 <div style={{position:'absolute',inset:0,...style,maskImage:`url("${mask}")`,maskSize:'100% 100%',maskRepeat:'no-repeat',maskMode:'alpha'}}><Film src={src} trim={trim} rate={rate}/></div>
 </>};
const Label=({children,style={}})=><div style={{position:'absolute',fontSize:22,fontWeight:400,letterSpacing:3,lineHeight:1.3,...style}}>{children}</div>;
const Type=({children,size=170,style={}})=><div style={{position:'absolute',fontSize:size,lineHeight:.91,letterSpacing:-size*.055,fontWeight:500,...style}}>{children}</div>;
const Hairline=({style={}})=><div style={{position:'absolute',height:1,background:'currentColor',opacity:.5,...style}}/>;

export const Prologue=()=>{const f=useCurrentFrame();const flip=f>=24; const growth=ramp(f,0,11,.04,1);
return <Base bg={flip?C.ink:C.paper} style={{color:flip?C.paper:C.ink}}>
 <Label style={{left:96,top:68}}>MECHANICAL / 01</Label><Label style={{right:96,top:68}}>A MOTION STUDY</Label>
 <div style={{position:'absolute',left:120,top:285,width:1000,height:510,overflow:'hidden'}}>
  <Type size={385} style={{left:0,top:0,letterSpacing:-23,transform:`translateY(${ramp(f,0,10,80,0)}px)`}}>TIME</Type>
 </div>
 <div style={{position:'absolute',left:1200,top:260,width:480,height:480,borderRadius:'50%',background:C.accent,transform:`scale(${growth})`,opacity:flip?0:1}}/>
 <div style={{position:'absolute',left:1200,top:260,width:480,height:480,borderRadius:'50%',border:`2px solid ${C.paper}`,transform:`scale(${1+ramp(f,24,43,0,1.7)})`,opacity:flip?1:0}}/>
 {f>=12&&<Watch width={820} style={{left:1060,top:-12,transform:`translateY(${ramp(f,12,25,105,0)}px) rotate(${ramp(f,12,47,-12,-5)}deg)`,opacity:ramp(f,12,18,0,1)}}/>}
 <Hairline style={{left:96,right:96,bottom:125}}/><Label style={{left:96,bottom:74}}>FORM. ENERGY. PRECISION.</Label>
 <Label style={{right:96,bottom:74}}>TIME, IN MOTION</Label>
 </Base>};

export const Reveal=()=>{const f=useCurrentFrame();return <Base bg='#050607'>
 <MaskedFilm src="opening.mp4" rate={.875} maskFolder="opening-alpha" style={{transform:`scale(${ramp(f,48,84,.84,1)})`}}/>
 <div style={{position:'absolute',left:90,top:215,opacity:1-ramp(f,35,51,0,1)}}>
  <KineticWord word="BEYOND" start={2} duration={92} direction="up" split="word" fontSize={126} color={C.paper}/>
  <KineticWord word="THE HOUR." start={7} duration={87} direction="up" split="word" fontSize={126} color={C.paper} style={{marginTop:4}}/>
 </div>
 <Label style={{left:96,bottom:84,opacity:1-ramp(f,44,58,0,1)}}>AN EXERCISE IN PRECISION</Label>
 <div style={{position:'absolute',right:96,bottom:88,width:80,height:4,background:C.accent,transform:`scaleX(${ramp(f,0,24,0,1)})`,transformOrigin:'right'}}/>
 </Base>};

export const Form=()=>{const f=useCurrentFrame();return <Base bg={C.paper} style={{color:C.ink}}>
 <Plate src="chrome-neutral.png" style={{left:1120,width:800,objectPosition:'75% center',opacity:.95}}/>
 <Type size={315} style={{left:74,top:57,transform:`translateX(${ramp(f,0,15,-140,0)}px)`}}>FORM</Type>
 <div style={{position:'absolute',left:74,top:400,width:705,height:2,background:C.ink}}/>
 <Label style={{left:86,bottom:80}}>A CLASSIC. RECOMPOSED.</Label>
 {[0,1,2].map((i)=><Watch key={i} angle={i===1} width={740} style={{left:70+i*545,top:90+i*22,transform:`translateY(${ramp(f,i*4,20+i*4,700,0)}px) rotate(${-18+i*18+linear(f,0,47,-3,3)}deg)`}}/>)}
 </Base>};

export const Blueprint=()=>{const f=useCurrentFrame();const onPaper=[8,9,18,19,72,73].includes(f);return <Base>
 <Film src="board-assembly.mp4"/>
 <Label style={{left:96,top:68,fontSize:20,letterSpacing:2,color:onPaper?C.ink:C.paper}}>FROM AN IDEA. TO EVERY PART.</Label>
 </Base>};

export const Hero=()=> <Base bg={C.paper} style={{color:C.ink}}>
 <div style={{position:'absolute',left:960,top:0,width:960,height:1080,background:'#050607'}}><Film src="reveal-portrait.mp4" trim={36} style={{objectFit:'contain'}}/></div>
 <Label style={{left:96,top:80}}>EVERY PART HAS A PURPOSE.</Label>
 <Type size={143} style={{left:86,top:302}}>ONE.<br/>COMPLETE.<br/>MOVEMENT.</Type>
 <Hairline style={{left:98,width:580,bottom:178}}/>
 <Label style={{left:98,bottom:112}}>FORM, BROUGHT TO LIFE.</Label>
 </Base>;

export const Shell=()=>{const f=useCurrentFrame();return <Base>
 <Plate src="glass.png" style={{filter:'brightness(.56)',transform:`scale(${linear(f,0,47,1.14,1.04)})`}}/>
 <div style={{position:'absolute',left:80,top:145,width:730,height:790,overflow:'hidden',transform:`translateX(${ramp(f,0,13,-880,0)}px)`}}><Film src="edge-portrait.mp4" trim={12} style={{objectPosition:'50% 48%'}}/></div>
 <Type size={168} style={{left:910,top:254}}>BOLD<br/>BY<br/>DESIGN.</Type>
 <Label style={{left:910,bottom:98}}>LIGHT, SHAPED BY METAL.</Label>
 </Base>};

export const Craft=()=> <Base>
 <Film src="screw.mp4"/>
 <div style={{position:'absolute',left:0,top:0,right:0,height:200,background:'linear-gradient(180deg,rgba(0,0,0,.56),transparent)'}}/>
 <Label style={{left:96,top:78}}>CRAFTED. DOWN TO THE LAST TURN.</Label>
 </Base>;

export const Structure=()=>{const f=useCurrentFrame();return <Base bg='#050607'>
 <Film src="assembly.mp4" trim={36} rate={1.7} style={{maskImage:'linear-gradient(0deg,transparent,#000 3%,#000 97%,transparent),linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)',maskComposite:'intersect',transform:`translateX(230px) scale(${linear(f,0,95,.87,.89)})`}}/>
 <div style={{position:'absolute',left:0,top:0,width:750,height:'100%',background:'linear-gradient(90deg,#08090b 10%,rgba(8,9,11,.88) 52%,rgba(8,9,11,0) 100%)'}}/>
 <Label style={{left:96,top:85}}>THE ARCHITECTURE OF TIME</Label>
 <div style={{position:'absolute',left:90,top:286}}>
  <KineticWord word="EVERY" start={0} duration={96} fontSize={154} color={C.paper}/>
  <KineticWord word="PART." start={6} duration={90} fontSize={154} color={C.paper}/>
 </div>
 <div style={{position:'absolute',left:98,bottom:187,width:330,height:2,background:C.gold,transform:`scaleX(${ramp(f,14,40,0,1)})`,transformOrigin:'left'}}/>
 <Label style={{left:98,bottom:116,opacity:ramp(f,16,31,0,1)}}>ONE CONNECTED MOVEMENT.</Label>
 </Base>};

const MacroChapter=({src,rate=1,label})=><Base>
 <Film src={src} rate={rate}/>
 <div style={{position:'absolute',left:0,top:0,right:0,height:190,background:'linear-gradient(180deg,rgba(0,0,0,.58),transparent)'}}/>
 <Label style={{left:96,top:78,textShadow:'0 2px 12px rgba(0,0,0,.4)'}}>{label}</Label>
 </Base>;
export const Mechanism=()=>{const{fps}=useVideoConfig();return <Base>
 <Sequence from={0} durationInFrames={48} premountFor={fps}><MacroChapter src="barrel.mp4" rate={.625} label="01 / STORED ENERGY"/></Sequence>
 <Sequence from={48} durationInFrames={48} premountFor={fps}><MacroChapter src="train.mp4" label="02 / PERFECTLY CONNECTED"/></Sequence>
 <Sequence from={96} durationInFrames={48} premountFor={fps}><MacroChapter src="balance.mp4" label="03 / RHYTHM, MADE VISIBLE"/></Sequence>
 </Base>};

export const Contrast=()=>{const f=useCurrentFrame();const shift=ramp(f,48,67,0,1);return <Base bg='#050607'>
 <Plate src="glass.png" style={{width:1000,filter:'brightness(.38)',maskImage:'linear-gradient(90deg,#000 65%,transparent 100%)',transform:`scale(${linear(f,0,95,1.04,1.09)})`}}/>
 <div style={{position:'absolute',left:0,top:0,width:870,height:'100%',background:C.paper,transform:`translateX(${-shift*870}px)`}}/>
 <div style={{position:'absolute',left:100,top:300,transform:`translateX(${-shift*950}px)`}}>
 <KineticWord word="MADE" start={0} duration={96} fontSize={150} color={C.ink}/>
 <KineticWord word="TO MOVE." start={6} duration={90} fontSize={150} color={C.ink}/>
 </div>
 <Label style={{left:104,top:106,opacity:1-shift,color:C.ink}}>MECHANICS × EXPRESSION</Label>
 <div style={{position:'absolute',left:114,top:710,width:190,height:190,opacity:1-shift}}><DialRings size={190} tone="white" colors={{main:C.ink,accent:C.accent,quiet:C.ink}} start={12} duration={84} beatFrames={[0,12,24,36]} exitFrames={0} rotationSpeed={18}/></div>
 <Type size={205} style={{left:104,top:376,color:C.paper,opacity:shift,transform:`translateX(${(1-shift)*90}px)`,letterSpacing:-14}}>MOVE.</Type>
 <MaskedFilm src="return-portrait.mp4" trim={100} rate={.6} maskFolder="return-alpha" maskOffset={504} style={{inset:undefined,left:1030+shift*30,top:100,width:660,height:880}}/>
 <Label style={{left:112,bottom:142,color:C.paper,opacity:shift}}>PRECISION HAS A PULSE.</Label>
 </Base>};

export const Journey=()=> <Base>
 <Plate src="chrome-neutral.png" style={{opacity:.25,filter:'brightness(.65)'}}/>
 <div style={{position:'absolute',left:930,top:0,width:990,height:1080,background:'#050607'}}><Film src="return-portrait.mp4" trim={72} style={{objectFit:'contain'}}/></div>
 <Label style={{left:96,top:80}}>THE WHOLE, IN EVERY DETAIL.</Label>
 <Type size={153} style={{left:88,top:300}}>EVERY<br/>DETAIL.<br/>ALIVE.</Type>
 <Label style={{left:98,bottom:114}}>ONE CONNECTED MOVEMENT.</Label>
 </Base>;

export const Crescendo=()=>{const f=useCurrentFrame();const{fps}=useVideoConfig();return <Base>
 <Sequence from={0} durationInFrames={24} premountFor={fps}><Film src="components.mp4" trim={18}/><Label style={{left:96,top:80}}>IN PERFECT ALIGNMENT.</Label></Sequence>
 <Sequence from={24} durationInFrames={24} premountFor={fps}>
  <Plate src="gold.png" style={{transform:'scale(1.15)'}}/><Type size={390} style={{left:85,top:300,color:C.ink}}>IN</Type>
  <div style={{position:'absolute',left:1210,top:54,width:546,height:972,overflow:'hidden'}}><Film src="lock-portrait.mp4" trim={24} style={{objectFit:'contain'}}/></div>
 </Sequence>
 <Sequence from={48} durationInFrames={24} premountFor={fps}><Base><Plate src="glass.png" style={{filter:'brightness(.4)',transform:'scale(1.16)'}}/><Type size={215} style={{left:105,top:367,transform:`translateX(${ramp(f,48,57,180,0)}px)`}}>MOTION</Type><Watch width={760} style={{left:1120,top:55,transform:`rotate(${linear(f,48,71,-9,3)}deg)`}}/></Base></Sequence>
 <Sequence from={72} durationInFrames={24} premountFor={fps}><Film src="opening.mp4" trim={60}/></Sequence>
 </Base>};

export const Finale=()=>{const f=useCurrentFrame();const settle=ramp(f,0,42,0,1);return <Base>
 <Plate src="chrome-neutral.png" style={{transform:`scale(${1.12-settle*.12})`,objectPosition:'center'}}/>
 <div style={{position:'absolute',left:0,top:0,width:1120,height:'100%',background:'linear-gradient(90deg,rgba(6,7,9,.76) 0%,rgba(6,7,9,.76) 70%,rgba(6,7,9,0) 100%)'}}/>
 <div style={{position:'absolute',left:92,top:287}}>
  <KineticWord word="TIME," start={12} duration={84} fontSize={150} color={C.paper}/>
  <KineticWord word="IN MOTION." start={20} duration={76} fontSize={150} color={C.paper} style={{marginTop:12}}/>
 </div>
 <Watch width={780} style={{left:1025,top:20,transform:`translateY(${(1-settle)*65}px) rotate(${8-settle*12}deg)`}}/>
 <Label style={{left:99,top:96}}>POCKETWATCH / MOTION STUDY</Label>
 <Hairline style={{left:99,width:620,bottom:180,opacity:settle*.5}}/>
 <Label style={{left:99,bottom:119,opacity:ramp(f,29,45,0,1)}}>A LITTLE WORLD. IN PERFECT MOTION.</Label>
 </Base>};

export const SCENE_COMPONENTS={Prologue,Reveal,Blueprint,Hero,Shell,Structure,Craft,Contrast,Mechanism,Journey,Form,Crescendo,Finale};
export const TimeInMotion=({withAudio=true})=>{const{fps}=useVideoConfig();return <Base><Fonts/>
 {config.scenes.map(({id,from,durationInFrames})=>{const Scene=SCENE_COMPONENTS[id];return <Sequence key={id} from={from} durationInFrames={durationInFrames} premountFor={fps} name={id}><Scene/></Sequence>})}
 {withAudio&&<Audio src={staticFile(config.audio)} premountFor={fps}/>}
 </Base>};
