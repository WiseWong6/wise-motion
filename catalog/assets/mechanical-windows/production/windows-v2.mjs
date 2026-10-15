// Original continuous aperture choreography. No reference-project code is used.
// Coordinates stay in composition pixels. The same state survives picture cuts.
export const clamp = n => Math.max(0,Math.min(1,n));
export const smooth = n => {const p=clamp(n);return p*p*(3-2*p);};
export const tween = (f,a,b,x,y) => x+(y-x)*smooth((f-a)/(b-a));
export function key(f,points){
  if(f<=points[0][0])return points[0][1];
  for(let i=1;i<points.length;i++)if(f<=points[i][0])return tween(f,points[i-1][0],points[i][0],points[i-1][1],points[i][1]);
  return points.at(-1)[1];
}
const circle=(cx,cy,r)=>({type:'circle',cx,cy,r:Math.max(0,r)});
const rect=(cx,cy,width,height,angle=0)=>({type:'rect',cx,cy,width:Math.max(0,width),height:Math.max(0,height),angle});
const FULL=[rect(960,540,1924,1084)];

export function windowState(f){
  if(f<80){
    const opening=key(f,[[0,150],[18,285],[45,350],[60,500],[76,1720]]);
    return {phrase:'dial-introduction',shapes:[circle(430,530,opening)]};
  }
  // The entire drawing / board sequence remains full-frame by editorial choice.
  if(f>=320&&f<460){
    // A standard Greek cross: equal arm lengths and one shared stroke width.
    // The complete cross rotates along the screwdriver axis across the cut.
    const cx=key(f,[[320,960],[358,960],[398,1190],[460,1190]]);
    const cy=key(f,[[320,540],[358,540],[398,450],[460,450]]);
    const angle=key(f,[[320,0],[358,0],[411,-28],[438,-28],[460,0]]);
    const h=key(f,[[320,1084],[344,590],[358,590],[388,450],[422,440],[436,460],[460,2400]]);
    return {phrase:'structure-to-axis',shapes:[rect(cx,cy,2800,h,angle),rect(cx,cy,h,2800,angle)]};
  }
  if(f>=548&&f<720){
    // One quiet architectural window. Four edges move through three shots;
    // no merged circles, decorative lobes or overlapping diagonal bands.
    const width=key(f,[[548,1924],[575,1280],[600,1360],[636,1460],[660,1580],[692,1660],[720,1924]]);
    const height=key(f,[[548,1084],[575,680],[600,700],[636,720],[660,740],[692,800],[720,1084]]);
    const cy=key(f,[[548,540],[575,560],[620,555],[660,540],[720,540]]);
    return {phrase:'connected-mechanism',shapes:[rect(960,cy,width,height)]};
  }
  if(f>=788&&f<910){
    const middle=key(f,[[788,2300],[810,400],[842,420],[880,520],[910,2300]]);
    const left=key(f,[[788,0],[800,110],[825,230],[852,310],[880,390],[910,1100]]);
    const right=key(f,[[788,0],[806,100],[838,240],[858,330],[880,430],[910,1100]]);
    return {phrase:'three-column-shutter',shapes:[rect(970,540,middle,2400),rect(510,540,left,2400),rect(1430,540,right,2400)]};
  }
  return {phrase:'full',shapes:FULL};
}

export function contains(shape,x,y){
  if(shape.type==='circle')return Math.hypot(x-shape.cx,y-shape.cy)<=shape.r;
  const r=-shape.angle*Math.PI/180,dx=x-shape.cx,dy=y-shape.cy;
  return Math.abs(dx*Math.cos(r)-dy*Math.sin(r))<=shape.width/2&&Math.abs(dx*Math.sin(r)+dy*Math.cos(r))<=shape.height/2;
}
