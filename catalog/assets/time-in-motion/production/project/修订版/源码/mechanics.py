"""One source of truth for tooth geometry, assembly and kinematic checks.

The involute formulas are independently implemented from the cited equations.
Units are studio units (one unit = 10 mm), not a manufacturing specification.
"""
import math

TAU = math.tau
ALPHA = math.radians(20)
AXES = {'barrel':(-.83,1.04), 'center':(0.,0.),
        'third':(1.24,.34), 'fourth':(1.19,-.72), 'escape':(.37,-1.49)}
# Each wheel and its pinion share one rigid staff. Different stages have
# different modules and heights; this is a compound train, not five coplanar discs.
STAGES = [('barrel','center',80,40,-.100),
          ('center','third',120,20,-.040),
          ('third','fourth',200,20,.040),
          ('fourth','escape',200,20,.120)]
RATIOS = {'barrel':.5, 'center':-1., 'third':6., 'fourth':-60., 'escape':600.}
BEAT_HZ = 5.
ESCAPE_TEETH = 15
FACE_WIDTH = .028
BACKLASH = .045  # fraction of module, circular tooth thickness reduction

def smooth(u):
    u=max(0.,min(1.,u));return u*u*u*(10+u*(-15+6*u))

def stage_data(stage):
    a,b,n1,n2,z=stage
    distance=math.dist(AXES[a],AXES[b]);module=2*distance/(n1+n2)
    r1,r2=module*n1/2,module*n2/2
    contact=(math.sqrt((r1+module)**2-(r1*math.cos(ALPHA))**2)
             +math.sqrt((r2+module)**2-(r2*math.cos(ALPHA))**2)
             -distance*math.sin(ALPHA))/(math.pi*module*math.cos(ALPHA))
    return dict(a=a,b=b,n1=n1,n2=n2,z=z,module=module,
                r1=r1,r2=r2,distance=distance,contact_ratio=contact)

def inv(r,rb):
    t=math.sqrt(max(0.,(r/rb)**2-1));return t-math.atan(t)

def outline(n,module,phase=0):
    """Counterclockwise closed contour with sampled true involute flanks."""
    rp=n*module/2;rb=rp*math.cos(ALPHA);ra=rp+module;rf=rp-1.25*module
    half=math.pi/(2*n)-BACKLASH/n
    invp=inv(rp,rb);points=[]
    for k in range(n):
        center=phase+k*TAU/n
        start=max(rf,rb)
        halfbase=half+invp-inv(start,rb)
        def add(r,a):
            pt=(r*math.cos(a),r*math.sin(a))
            if not points or math.dist(points[-1],pt)>1e-12:points.append(pt)
        add(rf,center-math.pi/n)
        add(rf,center-halfbase)
        for j in range(13):
            r=start+(ra-start)*j/12;add(r,center-half-invp+inv(r,rb))
        tip=half+invp-inv(ra,rb)
        for j in range(1,5):add(ra,center-tip+2*tip*j/4)
        for j in range(11,-1,-1):
            r=start+(ra-start)*j/12;add(r,center+half+invp-inv(r,rb))
        add(rf,center+halfbase)
    return points

def phases():
    # Tooth centre on driving wheel points at driven shaft. At the opposing
    # direction the driven pinion presents a tooth gap, independently per stage.
    result={}
    for i,s in enumerate(STAGES):
        d=stage_data(s);a,b=d['a'],d['b']
        ang=math.atan2(AXES[b][1]-AXES[a][1],AXES[b][0]-AXES[a][0])
        result[(i,'wheel')]=ang
        result[(i,'pinion')]=ang+math.pi-math.pi/d['n2']
    return result

def state(t):
    # Two releases per balance oscillation, half a tooth per beat. Upstream
    # rotations are derived from this single clock, including the locked dwell.
    q=t*BEAT_HZ;k=math.floor(q);frac=q-k
    advance=k+smooth((frac-.36)/.28)
    escape=advance*math.pi/ESCAPE_TEETH
    center=escape/600.
    return {'angles':{key:center*v for key,v in RATIOS.items()},
            'balance':math.radians(145)*math.cos(TAU*2.5*t),
            'fork':math.radians(7)*(2*smooth((frac-.32)/.36)-1)*((-1)**k),
            'minute':-center,'hour':-center/12.,'seconds':-center*60.,
            'release':frac}

def camera_path(t):
    """Continuous 15.5–30 s shot, including assembly and closing portrait."""
    def blend(a,b,u):return tuple(x+(y-x)*u for x,y in zip(a,b))
    if t<1.5:
        u=smooth(t/1.5);pos=blend((7.,3.8,29.),(8.,3.7,28.),u)
        target=blend((-.3,.65,.1),(-.15,.65,.25),u)
    elif t<5.5:
        u=smooth((t-1.5)/4);pos=blend((8.,3.7,28.),(23.,5.,18.),u)
        target=blend((-.15,.65,.25),(.55,.70,1.65),u)
    elif t<8.0:
        u=smooth((t-5.5)/2.5);pos=blend((23.,5.,18.),(8.,3.6,29.),u)
        target=blend((.55,.70,1.65),(-.45,.65,.1),u)
    else:
        u=smooth((t-8.)/6.5);pos=blend((8.,3.6,29.),(4.8,2.8,28.),u)
        target=blend((-.45,.65,.1),(-1.80,.65,.1),u)
    return pos,target

def layer_offsets(t):
    names=['train','winding','oscillator','bridges','chapter','hands']
    travel=[.65,1.2,1.9,2.65,3.6,4.1]
    out={}
    for i,(name,d) in enumerate(zip(names,travel)):
        opening=smooth((t-1.5-i*.06)/2.0)
        closing=smooth((t-5.5-i*.06)/1.65)
        out[name]=d*opening*(1-closing)
    return out
