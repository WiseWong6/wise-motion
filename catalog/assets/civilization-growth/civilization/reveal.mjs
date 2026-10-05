import {smooth,rand} from '../math.mjs';
import {PLATE} from './ink-parts.mjs';
// 每一区按真实器物的位置单独显影；空隙归到邻近器物，不另做整幅淡入。
export const CIVILIZATION_ZONES=[
 ['取火',[0,0,283,460],.06,.68],
 ['花一',[285,13,94,112],.75,1.05],['花二',[379,13,95,112],.77,1.07],['花三',[285,125,94,104],.79,1.09],['花四',[379,125,95,104],.81,1.11],
 ['种子与谷物',[283,250,128,363],.20,.79],['陶器剖面',[213,425,174,201],.30,.94],['犁',[0,530,335,182],.37,1.01],
 ['萌发',[0,707,333,143],.24,.92],['种子剖面',[0,840,409,101],.39,1.04],['制陶',[421,412,185,191],.43,1.05],
 ['纺线与编织',[405,251,247,155],.46,1.08],['织机',[476,0,447,391],.48,1.13],['水磨',[843,0,337,280],.82,1.49],
 ['竹简',[653,386,138,184],.53,1.15],['书籍',[797,430,101,147],.61,1.21],['活字版',[894,418,136,143],.61,1.23],
 ['展开书页',[740,535,280,109],.61,1.25],['罗盘',[621,544,137,95],.67,1.24],['印刷',[1019,350,229,293],.66,1.32],
 ['齿轮图解',[809,336,281,104],.81,1.46],['镜片',[964,261,268,94],.98,1.56],['传动机械',[342,641,464,190],.86,1.54],
 ['摆锤',[808,640,63,187],.88,1.58],['蒸汽机',[869,628,395,151],.93,1.62],['桥梁与地图',[854,786,476,154],1.03,1.73],
 ['观星仪',[1190,0,250,299],1.05,1.73],['卫星',[1440,0,176,219],1.15,1.87],['日晷',[1182,291,203,136],1.03,1.71],
 ['望远镜',[1250,267,334,368],1.08,1.80],['火箭',[1584,0,88,475],1.25,1.98],['太空舱',[1489,443,183,250],1.15,1.88],
 ['航船',[1248,644,342,287],1.10,1.82],['星图',[1400,205,198,227],1.14,1.85],['底部图解',[409,830,444,111],.97,1.69]
].map(([label,box,start,end],id)=>({id,label,box,start,end}));
export const REVEAL_END=Math.max(...CIVILIZATION_ZONES.map(z=>z.end));
export function zoneAt(x,y){
 // 四花的边界锁定，旧花准确交接到这一小组，不提前显出额外四朵。
 if(x>=285&&x<474&&y>=13&&y<229)return CIVILIZATION_ZONES[1+(x>=379?1:0)+(y>=125?2:0)];
 let best=null,score=Infinity;
 for(const z of CIVILIZATION_ZONES){if(z.id>=1&&z.id<=4)continue;const [xx,yy,w,h]=z.box,s=((x-xx-w/2)/(w*.5))**2+((y-yy-h/2)/(h*.5))**2;if(s<score){score=s;best=z;}}
 return best;
}
export const REVEAL_CELLS=[];
for(let y=0;y<PLATE.height;y+=10)for(let x=0;x<PLATE.width;x+=10){const w=Math.min(10,PLATE.width-x),h=Math.min(10,PLATE.height-y),z=zoneAt(x+w/2,y+h/2);REVEAL_CELLS.push({x,y,w,h,zone:z.id,rank:.015+rand(x*7+y*31+201)*.97});}
export function zoneProgress(t,z){return smooth(t,z.start,z.end);}
export function applyReveal(ctx,t){
 if(t>=REVEAL_END)return;
 const ps=CIVILIZATION_ZONES.map(z=>zoneProgress(t,z));ctx.beginPath();for(const c of REVEAL_CELLS)if(ps[c.zone]>=c.rank)ctx.rect(c.x,c.y,c.w+.04,c.h+.04);ctx.clip();
}
