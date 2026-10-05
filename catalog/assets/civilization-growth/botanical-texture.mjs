// 纹理只提供版画细节，位移由当前帧确定；所有纹理裁切保持源图不变。
export function textureTriangle(ctx,image,source,uv,p){
 const [u0,v0]=uv[0],[u1,v1]=uv[1],[u2,v2]=uv[2],[x0,y0]=p[0],[x1,y1]=p[1],[x2,y2]=p[2],det=(u1-u0)*(v2-v0)-(u2-u0)*(v1-v0);if(Math.abs(det)<1e-12)return;
 const a=((x1-x0)*(v2-v0)-(x2-x0)*(v1-v0))/det,c=((x2-x0)*(u1-u0)-(x1-x0)*(u2-u0))/det,b=((y1-y0)*(v2-v0)-(y2-y0)*(v1-v0))/det,d=((y2-y0)*(u1-u0)-(y1-y0)*(u2-u0))/det;
 const cx=(x0+x1+x2)/3,cy=(y0+y1+y2)/3;
 ctx.save();ctx.beginPath();p.forEach(([x,y],i)=>{const dx=x-cx,dy=y-cy,l=Math.hypot(dx,dy)||1,xx=x+dx/l*.12,yy=y+dy/l*.12;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,x0-a*u0-c*v0,y0-b*u0-d*v0);ctx.drawImage(image,...source,0,0,1,1);ctx.restore();
}
export function drawGridTexture(ctx,image,source,point,cols=4,rows=8){
 const points=Array.from({length:(cols+1)*(rows+1)},(_,i)=>point((i%(cols+1))/cols,Math.floor(i/(cols+1))/rows));
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*(cols+1)+x,uv=[[x/cols,y/rows],[(x+1)/cols,y/rows],[(x+1)/cols,(y+1)/rows],[x/cols,(y+1)/rows]],ps=[points[i],points[i+1],points[i+cols+2],points[i+cols+1]];textureTriangle(ctx,image,source,[uv[0],uv[1],uv[2]],[ps[0],ps[1],ps[2]]);textureTriangle(ctx,image,source,[uv[0],uv[2],uv[3]],[ps[0],ps[2],ps[3]]);}
}
export function drawPolarTexture(ctx,image,source,point,{cx=.5,cy=.5,sectors=24,rings=4,only=null}={}){
 const edge=a=>Math.min((Math.cos(a)>=0?1-cx:cx)/Math.max(1e-8,Math.abs(Math.cos(a))),(Math.sin(a)>=0?1-cy:cy)/Math.max(1e-8,Math.abs(Math.sin(a))));
 const uv=(a,r)=>[cx+Math.cos(a)*edge(a)*r,cy+Math.sin(a)*edge(a)*r];
 for(let k=0;k<sectors;k++){if(only&&!only(k))continue;const a=k/sectors*Math.PI*2,b=(k+1)/sectors*Math.PI*2;
  for(let j=0;j<rings;j++){const us=[uv(a,j/rings),uv(b,j/rings),uv(b,(j+1)/rings),uv(a,(j+1)/rings)],ps=us.map(v=>point(v[0],v[1],k));if(j>0)textureTriangle(ctx,image,source,[us[0],us[1],us[2]],[ps[0],ps[1],ps[2]]);textureTriangle(ctx,image,source,[us[0],us[2],us[3]],[ps[0],ps[2],ps[3]]);}
 }
}
