# Drawing extracted from the user-supplied r.py; branding changed to WISE.
# SPDX-License-Identifier: Apache-2.0
import numpy as np, subprocess, math, wave
W,H,FPS,T=320,180,30,20
P=np.array([(26,28,44),(93,39,93),(177,62,83),(239,125,87),(255,205,117),(167,240,112),(56,183,100),(37,113,121),(41,54,111),(59,93,201),(65,166,246),(115,239,247),(244,244,244),(148,176,194),(86,108,134),(51,60,87)],np.uint8)
F={'A':"01110 10001 10001 11111 10001 10001 10001",'B':"11110 10001 11110 10001 10001 10001 11110",'E':"11111 10000 11110 10000 10000 10000 11111",
'G':"01111 10000 10000 10111 10001 10001 01111",'H':"10001 10001 11111 10001 10001 10001 10001",'I':"11111 00100 00100 00100 00100 00100 11111",
'M':"10001 11011 10101 10101 10001 10001 10001",'N':"10001 11001 10101 10011 10001 10001 10001",'O':"01110 10001 10001 10001 10001 10001 01110",
'R':"11110 10001 10001 11110 10100 10010 10001",'S':"01111 10000 01110 00001 00001 10001 01110",'T':"11111 00100 00100 00100 00100 00100 00100",
'W':"10001 10001 10001 10101 10101 11011 10001",'Y':"10001 10001 01010 00100 00100 00100 00100",'Q':"01110 10001 10001 10001 10101 10010 01101",
'U':"10001 10001 10001 10001 10001 10001 01110",'C':"01111 10000 10000 10000 10000 10000 01111",'P':"11110 10001 10001 11110 10000 10000 10000",
'D':"11110 10001 10001 10001 10001 10001 11110",'+':"00000 00100 00100 11111 00100 00100 00000",'V':"10001 10001 10001 10001 10001 01010 00100",'X':"10001 10001 01010 00100 01010 10001 10001",'D':"11110 10001 10001 10001 10001 10001 11110",'+':"00000 00100 00100 11111 00100 00100 00000",'L':"10000 10000 10000 10000 10000 10000 11111",'!':"00100 00100 00100 00100 00100 00000 00100",' ':"00000 "*6+"00000"}
def pts(s,sc=1):
    o=[]
    for i,ch in enumerate(s):
        for y,row in enumerate(F[ch].split()):
            for x,c in enumerate(row):
                if c=='1':
                    for a in range(sc):
                        for b in range(sc): o.append((i*6*sc+x*sc+a,y*sc+b))
    return o
def text(img,s,cx,cy,sc,col,shadow=True):
    w=len(s)*6*sc-sc
    for x,y in pts(s,sc):
        X,Y=int(cx-w/2+x),int(cy-3.5*sc+y)
        if shadow and 0<=X+1<W and 0<=Y+1<H: img[Y+1,X+1]=1
        if 0<=X<W and 0<=Y<H: img[Y,X]=col
def rect(img,x,y,w,h,c):
    x0,y0=max(0,int(x)),max(0,int(y));x1,y1=min(W,int(x+w)),min(H,int(y+h))
    if x1>x0 and y1>y0: img[y0:y1,x0:x1]=c
def circ(img,cx,cy,rx,ry,c):
    yy,xx=np.ogrid[:H,:W]; img[((xx-cx)/max(rx,.5))**2+((yy-cy)/max(ry,.5))**2<=1]=c
eo=lambda t:1-(1-min(max(t,0),1))**3
eob=lambda t:(lambda t:1+2.7*(t-1)**3+1.7*(t-1)**2)(min(max(t,0),1))
def stars(img,t):
    rng=np.random.default_rng(1)
    for i in range(60):
        x,y=rng.integers(0,W),rng.integers(0,H)
        if (i+int(t*6))%7: img[y,x]=15 if i%3 else 14
def robot(img,x,y,t,sq=1.0,c=10):
    w,h=24*(2-sq),22*sq; by=y-h
    rect(img,x-w/2,by,w,h,c); rect(img,x-w/2+3,by+4,w-6,8,0)
    blink=(t*1.3)%3<0.1
    for e in(-1,1): rect(img,x+e*5-2,by+6+(2 if blink else 0),3,1 if blink else 4,11)
    rect(img,x-1,by-5,2,5,13); rect(img,x-2,by-8,4,3,3 if int(t*4)%2 else 4)
    rect(img,x-w/2-4,by+h*.4+math.sin(t*8)*2,4,3,c); rect(img,x+w/2,by+h*.4-math.sin(t*8)*2,4,3,c)
rng=np.random.default_rng(7)
logo=pts("WISE",3); lw=len("WISE")*18-3
logo=[(x-lw/2+W/2,y-10.5+80) for x,y in logo]; lstart=[(rng.uniform(0,W),rng.uniform(-60,H+60)) for _ in logo]; ldel=rng.uniform(0,1.2,len(logo))
conf=[(rng.uniform(-3,3),rng.uniform(-5,-1.5),rng.integers(2,12)) for _ in range(250)]
BASE_RATE=1.5
def make_city():
    layers=[]
    for L,(sp,c,hh,seed) in enumerate([(8,1,90,3),(20,15,60,4),(45,0,35,5)]):
        rng=np.random.default_rng(seed); xs=0; buildings=[]
        while xs<W+60:
            bw=int(rng.integers(14,30)); bh=int(rng.integers(hh//2,hh)); windows=[]
            for wy in range(H-bh+4,H-4,6):
                for wx in range(3,bw-3,5):
                    if rng.random()<.4: windows.append([wx,wy])
            buildings.append(dict(x=xs,width=bw,height=bh,windows=windows))
            xs+=bw+int(rng.integers(2,10))
        layers.append(dict(speed=sp,color=c,windowColor=4 if L else 3,span=xs,buildings=buildings))
    return layers
CITY=make_city()
def city(img,u):
    for layer in CITY:
        shift=math.floor((u*layer['speed'])%layer['span'])
        for b in layer['buildings']:
            for wrap in [-layer['span'],0,layer['span']]:
                x=b['x']-shift-30+wrap
                if x+b['width']<=0 or x>=W: continue
                rect(img,x,H-b['height'],b['width'],b['height'],layer['color'])
                for wx,wy in b['windows']: rect(img,x+wx,wy,2,2,layer['windowColor'])
def source_frame(f):
    t=f/FPS; img=np.zeros((H,W),np.uint8)
    if t<4:
        stars(img,t)
        for (tx,ty),(sx,sy),d in zip(logo,lstart,ldel):
            k=eo((t-d)/1.8); x=sx+(tx-sx)*k; y=sy+(ty-sy)*k
            c=4 if k>=1 else [9,10,11][int(d*10)%3]
            if 0<=x<W and 0<=y<H: img[int(y),int(x)]=c
        if t>3: text(img,"MOTION DESIGNER",W/2,120,1,11 if int(t*10)%2 else 12,False)
        if t>3.6: img[:]=np.where(np.random.default_rng(f).random((H,W))<(t-3.6)*2.5,0,img)
    elif t<10:
        u=t-4; img[:]=15; rect(img,0,140,W,40,14)
        hop=abs(math.sin(u*math.pi*1.2)); x=40+u*16; sq=1-0.35*max(0,0.3-hop)/0.3+0.15*hop
        robot(img,x,140-hop*30,u,sq)
        cols=[2,3,4,5,10]
        for i in range(5):
            k=eob((u-0.8-i*0.8)/0.7)
            if k>0:
                cx=150+i*34; s=k*12
                if i%2: circ(img,cx,80,s,s*(1+0.3*math.sin(u*10)*(1-k)),cols[i])
                else: rect(img,cx-s,80-s,2*s,2*s,cols[i])
                rect(img,cx-1,95,2,2+int(6*math.sin(u*6+i)**2),12)
        text(img,"SQUASH + STRETCH",W/2,20,1,12)
    elif t<18:
        u=t-10; img[:]=8
        city(img,u)
        circ(img,260,30,14,14,4)
        bt=(u*1.1)%1; hy=4*bt*(1-bt); y=130-hy*90; sq=1.0 if bt>0.06 and bt<0.94 else 0.6
        bx=40+((u*35)%120)
        for g in range(1,5):
            pb=((u-g*0.04)*1.1)%1; circ(img,40+(((u-g*.04)*35)%120),130-4*pb*(1-pb)*90,2,2,9)
        circ(img,bx,y,8/sq**.5,8*sq,3)
        m=(math.sin(u*2)+1)/2; mx=245
        yy,xx=np.ogrid[:H,:W]
        d=(1-m)*np.sqrt((xx-mx)**2+(yy-95)**2)+m*np.maximum(abs(xx-mx),abs(yy-95))*1.1
        img[d<16]=5 if m<.5 else 11
        text(img,"EASING CURVES" if u<4 else "PARALLAX + MORPH",W/2,14,1,12)
    elif t<25:
        u=t-18; words=["EASING","TIMING","RHYTHM","SPACING","APPEAL","OVERLAP","POLISH!"]
        i=min(int(u),6); v=u-i; bg=[2,9,6,1,7,3,8][i]; img[:]=bg
        for k in range(0,W+H,16):
            o=int(k+u*60)%(W+H); 
            for s in range(4): rect(img,o-s*0- (0),0,0,0,0)
        for s in range(8):
            yv=int((s*23+u*120)%H); img[yv,:]=(bg+1)%16 if bg!=0 else 15
        sc=int(1+eob(v/0.35)*4); x=W/2+(1-eo(v/0.3))*-200+(eo((v-0.8)/0.2))*300
        text(img,words[i],x,H/2,max(sc,1),12)
        text(img,words[(i+1)%7],W/2-(u*80)%400+200,150,1,4,False)
    else:
        u=t-25; img[:]=0; stars(img,t)
        robot(img,W/2,150,u,1+0.15*math.sin(u*10),10)
        for (vx,vy,c) in conf:
            x=W/2+vx*u*40; y=60+vy*u*40+60*u*u
            if 0<=x<W-1 and 0<=y<H-1 and u>0.2: img[int(y):int(y)+2,int(x):int(x)+(1+int(u*8)%2)]=c
        text(img,"MOTION BY",W/2,40,2+0*1,4 if int(u*6)%2 else 12)
        s=eob(u/0.6)*3; text(img,"WISE",W/2,80,max(1,int(s)) if u<0.6 else 3,11)
        if u>4.5: img[:]=np.where(np.random.default_rng(f).random((H,W))<(u-4.5)*2,0,img)
    return P[img].repeat(4,0).repeat(4,1)

# The native speed is 1.5 times the original drawing clock.
def frame(f):
    return source_frame(min(899,max(0,math.floor(f*BASE_RATE+1e-9))))
