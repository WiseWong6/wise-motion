export const W=640,H=360,FPS=60,ATLAS_END=15.054,DURATION=18.60;
export const BOUNDS=[0,2.5,3.55,4.433,5.20,7.80,9.30,11.70,ATLAS_END,DURATION];
export const NAMES=['草书化火','双火','三火墨点','四火结构','横排闪变','植物闪变','花卉闪变','收起成群像','聚成字标'];
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const mix=(a,b,p)=>a+(b-a)*p;
export const smooth=(t,a=0,b=1)=>{const q=clamp((t-a)/(b-a));return q*q*(3-2*q);};
export const out=(t,a=0,b=1)=>1-(1-clamp((t-a)/(b-a)))**3;
export const rand=i=>{const n=Math.sin(i*127.1+39.73)*43758.5453;return n-Math.floor(n);};
export const TAU=Math.PI*2;
export function sample(table,t){if(t<=table[0][0])return table[0].slice(1);for(let i=1;i<table.length;i++){if(t<=table[i][0]){const a=table[i-1],b=table[i];return a.slice(1).map((v,k)=>mix(v,b[k+1],(t-a[0])/(b[0]-a[0])));}}return table.at(-1).slice(1);}
export function locate(t){const time=clamp(Number.isFinite(t)?t:0,0,DURATION);let i=0;while(i<NAMES.length-1&&time>=BOUNDS[i+1])i++;return {i,time,local:time-BOUNDS[i]};}
export const GLYPH={x:174,y:25,size:292};
export function strokeFor(x,y){if(y>928)return 4;if(x>564&&x<725)return 3;if(y>643)return 2;if(x<530&&y<640&&y<1100-x*.83)return 0;return 1;}
