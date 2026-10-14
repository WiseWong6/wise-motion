"""Parametric haute-horlogerie movement for a 60 mm visual pocketwatch.
The movement is real geometry. +Z is the dial side, +Y is twelve o'clock.
Run build_movement(root, materials) from Blender Python.
"""
import bpy
import math
from mathutils import Vector

TAU = math.tau


def _empty(name, parent):
    ob = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(ob)
    ob.parent = parent
    return ob


def _mesh(name, vertices, faces, material, parent, bevel=0, smooth=False):
    mesh = bpy.data.meshes.new(name + ' Geometry')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.parent = parent
    if material:
        mesh.materials.append(material)
    for poly in mesh.polygons:
        poly.use_smooth = smooth
    if bevel:
        mod = ob.modifiers.new('Hand-polished edge radius', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = 'ANGLE'
        mod.angle_limit = 0.18
        mod.harden_normals = True
        normal = ob.modifiers.new('Planar polished normals', 'WEIGHTED_NORMAL')
        normal.keep_sharp = True
        normal.weight = 50
    return ob


def _poly(name, points, z, depth, material, parent, bevel=.009):
    n = len(points)
    vertices = [(x, y, z-depth*.5) for x,y in points]
    vertices += [(x, y, z+depth*.5) for x,y in points]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2*n))]
    faces += [(i, (i+1)%n, (i+1)%n+n, i+n) for i in range(n)]
    return _mesh(name, vertices, faces, material, parent, bevel)


def _ring(name, xy, inner, outer, z, depth, material, parent, bevel=.005, segments=128):
    x,y=xy
    vertices=[]
    for zz,rr in ((z-depth/2,inner),(z-depth/2,outer),(z+depth/2,inner),(z+depth/2,outer)):
        vertices.extend((x+rr*math.cos(i*TAU/segments),y+rr*math.sin(i*TAU/segments),zz) for i in range(segments))
    faces=[]
    for i in range(segments):
        j=(i+1)%segments
        faces.extend([(i,j,j+segments,i+segments),(i+2*segments,i+3*segments,j+3*segments,j+2*segments),
                      (i,i+2*segments,j+2*segments,j),(i+segments,j+segments,j+3*segments,i+3*segments)])
    return _mesh(name,vertices,faces,material,parent,bevel,True)


def _disc(name, xy, radius, z, depth, material, parent, bevel=.004, segments=64):
    points=[(xy[0]+radius*math.cos(i*TAU/segments),xy[1]+radius*math.sin(i*TAU/segments)) for i in range(segments)]
    ob=_poly(name,points,z,depth,material,parent,bevel)
    for f in ob.data.polygons:
        f.use_smooth = len(f.vertices)==4
    return ob


def _torus(name, xy, radius, tube, z, material, parent, segments=96, minor=8):
    vertices=[];faces=[]
    for i in range(segments):
        a=i*TAU/segments
        for j in range(minor):
            b=j*TAU/minor
            r=radius+tube*math.cos(b)
            vertices.append((xy[0]+r*math.cos(a),xy[1]+r*math.sin(a),z+tube*math.sin(b)))
    for i in range(segments):
        for j in range(minor):
            faces.append((i*minor+j,((i+1)%segments)*minor+j,((i+1)%segments)*minor+(j+1)%minor,i*minor+(j+1)%minor))
    return _mesh(name,vertices,faces,material,parent,0,True)


def _curves(name, paths, thickness, material, parent, resolution=2):
    curve=bpy.data.curves.new(name+' Paths','CURVE')
    curve.dimensions='3D';curve.resolution_u=1
    curve.bevel_depth=thickness;curve.bevel_resolution=resolution
    for points in paths:
        spl=curve.splines.new('POLY')
        spl.points.add(len(points)-1)
        for co,pt in zip(spl.points,points):
            co.co=(*pt,1)
    ob=bpy.data.objects.new(name,curve)
    bpy.context.collection.objects.link(ob)
    ob.parent=parent
    curve.materials.append(material)
    return ob


def _catmull(points, steps=12):
    """Interpolating planar curve, including its endpoints."""
    result=[]
    p=[points[0]]+list(points)+[points[-1]]
    for k in range(1,len(p)-2):
        a,b,c,d=[Vector(v) for v in p[k-1:k+3]]
        for i in range(steps):
            t=i/steps
            result.append(tuple(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)))
    result.append(tuple(points[-1]))
    return result


def _ribbon(points,widths,steps=12):
    """Variable-width sculpted bridge with truly round end lobes."""
    samples=_catmull([(p[0],p[1],w) for p,w in zip(points,widths)],steps)
    side_a=[];side_b=[]
    for i,(x,y,w) in enumerate(samples):
        prev=samples[max(0,i-1)];nxt=samples[min(len(samples)-1,i+1)]
        dx=nxt[0]-prev[0];dy=nxt[1]-prev[1];ll=math.hypot(dx,dy)
        nx=-dy/ll;ny=dx/ll
        side_a.append((x+nx*w*.5,y+ny*w*.5))
        side_b.append((x-nx*w*.5,y-ny*w*.5))
    # Round caps join the two sides without abrupt corners.
    x,y,w=samples[-1];d=math.atan2(samples[-1][1]-samples[-2][1],samples[-1][0]-samples[-2][0])
    cap_end=[(x+w*.5*math.cos(d+math.pi/2-i*math.pi/12),y+w*.5*math.sin(d+math.pi/2-i*math.pi/12)) for i in range(1,12)]
    x,y,w=samples[0];d=math.atan2(samples[1][1]-samples[0][1],samples[1][0]-samples[0][0])
    cap_start=[(x+w*.5*math.cos(d-math.pi/2-i*math.pi/12),y+w*.5*math.sin(d-math.pi/2-i*math.pi/12)) for i in range(1,12)]
    # Reverse to counter-clockwise, important for beveled rim normals.
    return list(reversed(side_a+cap_end+list(reversed(side_b))+cap_start))


def _gear(name, xy, radius, teeth, z, parent, mats, speed=0.12, spokes=6, phase=0, thickness=.068):
    pivot=_empty(name,parent);pivot.location=(xy[0],xy[1],z)
    pivot['spin_rate']=speed;pivot['tooth_count']=teeth;pivot['pitch_radius']=radius
    verts=[];faces=[]
    # Fine tooth shoulders, root relief, narrow tip. Rim is hollow.
    toothdepth=min(.040,radius*.09)
    contour=[]
    for i in range(teeth):
        for fraction,rad in ((0,radius-toothdepth),(.18,radius-toothdepth),(.31,radius+.004),(.43,radius+.012),(.57,radius+.012),(.69,radius+.004),(.82,radius-toothdepth)):
            a=(i+fraction)*TAU/teeth+phase
            contour.append((rad*math.cos(a),rad*math.sin(a)))
    n=len(contour);ri=radius*.80
    for zz in (-thickness/2,thickness/2):
        verts.extend((x,y,zz) for x,y in contour)
        verts.extend((ri*math.cos(math.atan2(y,x)),ri*math.sin(math.atan2(y,x)),zz) for x,y in contour)
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,j+2*n,i+2*n),(i+n,i+3*n,j+3*n,j+n),
                      (i,i+n,j+n,j),(i+2*n,j+2*n,j+3*n,i+3*n)])
    # All spokes in the same mesh to keep object count low.
    for k in range(spokes):
        a=k*TAU/spokes+phase
        ca,sa=math.cos(a),math.sin(a)
        p=[(radius*.10,-radius*.052),(radius*.80,-radius*.041),(radius*.83,radius*.020),(radius*.13,radius*.044)]
        p=[(u*ca-v*sa,u*sa+v*ca) for u,v in p]
        offset=len(verts)
        verts.extend((x,y,zz) for zz in (-thickness*.34,thickness*.34) for x,y in p)
        faces.extend([tuple(offset+j for j in (3,2,1,0)),tuple(offset+j for j in (4,5,6,7))])
        faces.extend((offset+i,offset+(i+1)%4,offset+(i+1)%4+4,offset+i+4) for i in range(4))
    _mesh(name+' Cut brass wheel',verts,faces,mats['gold'],pivot,min(.0045,radius*.007))
    _ring(name+' Faced inner rim',(0,0),ri-.006,ri+.012,thickness*.54,.016,mats['polished'],pivot,.002,96)
    _disc(name+' Hub',(0,0),radius*.145,.00,thickness*1.5,mats['gold'],pivot,.006)
    _disc(name+' Staff',(0,0),radius*.044,.085,.21,mats['polished'],pivot,.002,32)
    _ring(name+' Hub recess',(0,0),radius*.07,radius*.12,thickness*.86,.01,mats['dark'],pivot,.001,40)
    # Visible steel pinion, cut as nine narrow axial flutes.
    pinion_paths=[]
    for k in range(10):
        a=k*TAU/10
        r=radius*.087
        pinion_bottom, pinion_top = (.036,.138) if z < -.045 else (-.105,-.04)
        pinion_paths.append([(r*math.cos(a),r*math.sin(a),pinion_bottom),(r*math.cos(a),r*math.sin(a),pinion_top)])
    _curves(name+' Hardened pinion',pinion_paths,radius*.016,mats['silver'],pivot,1)
    return pivot


def _screw(name, xy, z, radius, parent, mats, rotation=0):
    """A real recessed straight slot, formed by two circular caps."""
    p=_empty(name,parent);p.location=(xy[0],xy[1],z);p.rotation_euler.z=rotation
    _disc(name+' Countersink',(0,0),radius*1.20,-.006,.019,mats['polished'],p,.004,40)
    _disc(name+' Slot cavity',(0,0),radius*.96,.012,.023,mats['dark'],p,.003,40)
    gap=radius*.12
    # Each cap is a circular segment terminated at the straight slot wall.
    ang=math.asin(gap/radius)
    for side in (1,-1):
        pts=[]
        for i in range(33):
            a=ang+(math.pi-2*ang)*i/32
            pts.append((radius*math.cos(a),side*radius*math.sin(a)))
        if side<0:pts.reverse()
        _poly(name+' Blue head '+str(side),pts,.030,.025,mats['blue'],p,.0025)
    return p


def _jewel(name,xy,z,parent,mats,radius=.060,fasteners=True):
    _ring(name+' Polished gold chaton',xy,radius*.63,radius*1.6,z,.032,mats['gold'],parent,.006,64)
    _ring(name+' Ruby cabochon',xy,radius*.24,radius,z+.017,.027,mats['ruby'],parent,.007,64)
    _disc(name+' Ruby oil well',xy,radius*.31,z+.010,.013,mats['dark'],parent,.002,40)
    _disc(name+' Mirror pivot',xy,radius*.15,z+.019,.014,mats['polished'],parent,.002,32)
    if fasteners:
        for a in (.38, .38+math.pi):
            _screw(name+' Chaton bolt', (xy[0]+radius*1.30*math.cos(a),xy[1]+radius*1.30*math.sin(a)),z+.019,radius*.21,parent,mats,a)


def _bridge(name,points,widths,z,parent,mats,engrave=False):
    outer=_ribbon(points,[w+.048 for w in widths])
    _poly(name+' Mirror anglage',outer,z-.016,.107,mats['polished'],parent,.018)
    inner=_ribbon(points,widths)
    _poly(name+' Geneva-stripe face',inner,z+.023,.063,mats['bridge'],parent,.012)
    # Fine double engraved border follows the actual centerline and side contours.
    outline=inner+[inner[0]]
    _curves(name+' Cut gold perimeter',[[(x,y,z+.058) for x,y in outline]],.0043,mats['gold'],parent,2)
    if engrave:
        # Symmetrical botanical scrollwork cut across the broad balance cock.
        paths=[]
        centerline=_catmull(points,8)
        for k in range(2,len(centerline)-2,2):
            x,y=centerline[k];xp,yp=centerline[k+1];xm,ym=centerline[k-1]
            a=math.atan2(yp-ym,xp-xm)
            width=widths[min(len(widths)-1,int(k/8))]*.22
            for sign in (-1,1):
                path=[]
                for i in range(40):
                    t=i/39;theta=t*TAU*1.05
                    r=width*(1-t*.86)
                    u=r*math.cos(theta);v=sign*r*math.sin(theta)
                    path.append((x+math.cos(a)*u-math.sin(a)*v,y+math.sin(a)*u+math.cos(a)*v,z+.0548))
                paths.append(path)
        _curves(name+' Hand-engraved acanthus',paths,.0015,mats['brass'],parent,2)
    return outer


def build_movement(root, materials):
    """Return actual pivots and disassembly layers; caller owns animation."""
    mats=materials
    base=_empty('01 / Frosted mainplate',root)
    lower=_empty('02 / Going train and barrel',root)
    upper=_empty('03 / Winding train',root)
    oscillator=_empty('04 / Balance and escapement',root)
    bridges=_empty('05 / Sculpted and engraved bridges',root)
    # Dark bronze recess, ringed polished perimeter: the gaps have visible depth.
    _disc('Movement mainplate',(0,0),2.43,-.235,.115,mats['brass'],base,.018,192)
    _disc('Shadowed recessed floor',(0,0),2.31,-.165,.025,mats['dark'],base,.005,192)
    _ring('Frosted peripheral plate',(0,0),2.15,2.405,-.124,.068,mats['bridge'],base,.016,192)
    _torus('Mainplate turned bead',(0,0),2.386,.017,-.081,mats['polished'],base,192)
    _torus('Mainplate inner bead',(0,0),2.180,.010,-.082,mats['gold'],base,192)
    # Tangent arcs on the recessed plate suggest overlapping circular graining.
    paths=[]
    for row in range(-8,9):
        for col in range(-8,9):
            x=col*.255+(row%2)*.128;y=row*.221
            if x*x+y*y>2.20**2:continue
            for rr in (.100,.119):
                paths.append([(x+rr*math.cos(t*TAU/30),y+rr*math.sin(t*TAU/30),-.145) for t in range(31)])
    _curves('Fine circular mainplate graining',paths,.0016,mats['brass'],base,1)
    # Radiating peripheral structural webs, with dark apertures between them.
    for a in (0.18,.75,1.42,2.17,2.88,3.55,4.32,5.14,5.65):
        ca,sa=math.cos(a),math.sin(a)
        pp=[(ca*1.69-sa*.095,sa*1.69+ca*.095),(ca*2.25-sa*.11,sa*2.25+ca*.11),
            (ca*2.25+sa*.11,sa*2.25-ca*.11),(ca*1.69+sa*.095,sa*1.69-ca*.095)]
        _poly('Pierced mainplate web',pp,-.12,.065,mats['bridge'],base,.018)
    # Two recessed machined supports break up broad floor areas without ornament.
    for name,points,widths in [
        ('Western lower bearing support',[(-2.07,.10),(-1.73,.04),(-1.39,.04)],[.15,.22,.32]),
        ('Southern lower bearing support',[(-1.18,-2.06),(-.93,-1.95),(-.60,-1.91)],[.14,.26,.16])]:
        _poly(name,_ribbon(points,widths),-.080,.053,mats['brass'],base,.011)
    for i,xy in enumerate([(-1.39,.04),(-.93,-1.95)]):
        _ring('Recessed bearing counterbore '+str(i),xy,.062,.139,-.045,.031,mats['brass'],base,.005,72)
        _ring('Counterbore polished bevel '+str(i),xy,.125,.144,-.031,.009,mats['polished'],base,.002,72)
        _disc('Counterbore dark recess '+str(i),xy,.061,-.076,.009,mats['dark'],base,.002,48)
        _disc('Recessed steel lower pivot '+str(i),xy,.015,-.068,.019,mats['polished'],base,.002,32)
    # Fine blued retention screws remain legible on the perimeter.
    for k,a in enumerate((.18,.70,1.27,1.86,2.47,3.02,3.62,4.16,4.80,5.37,5.88)):
        _screw('Mainplate screw '+str(k),(2.295*math.cos(a),2.295*math.sin(a)),-.066,.050,base,mats,a+.6)
    wheels=[]
    # A dense stepped train. Adjacent wheels use different vertical levels.
    specs=[
      ('Great barrel',(-.83,1.04),.815,92,-.016,lower,.025,8,.08),
      ('Center wheel',(0,0),.655,76,-.106,lower,-.060,6,.0),
      ('Third wheel',(1.24,.34),.476,56,.035,lower,.083,6,(math.atan2(-1.06,-.05)-math.pi/56)%(TAU/56)),
      ('Fourth wheel',(1.19,-.72),.581,66,.035,lower,-.083*56/66,7,(math.atan2(-1.06,-.05)+math.pi)%(TAU/66)),
      ('Escape train',(.37,-1.49),.426,48,.042,lower,.170,6,.15),
      ('Seconds transfer',(-.34,-1.88),.352,42,.087,lower,-.22,6,.02),
      ('Minute transfer',(-.59,-.14),.410,48,.205,lower,-.105,5,.1),
      ('West winding idler',(-1.89,.41),.334,40,.102,upper,-.12,6,.0),
      ('Ratchet wheel',(.47,1.58),.576,62,.105,upper,.035,8,.1),
      ('Crown transmission',(1.49,1.27),.459,52,.074,upper,-.047,7,.13),
      ('Winding intermediate',(-.39,2.00),.321,38,.165,upper,-.066,6,.15),
      ('South intermediate',(.66,-2.05),.259,32,-.073,lower,.175,5,.12),
      ('East intermediate',(1.92,-.29),.303,36,-.076,lower,.14,5,.05),
      ('Setting wheel',(1.90,.71),.255,30,.155,upper,.07,5,.08),
      ('North reverser',(.54,2.18),.189,24,-.010,upper,-.073,5,.10),
    ]
    for name,xy,r,teeth,z,layer,rate,sp,phase in specs:
        wheels.append(_gear(name,xy,r,teeth,z,layer,mats,rate,sp,phase))
    # Barrel's recessed spring pocket, integral with its rotating wheel.
    barrel=wheels[0]
    _ring('Barrel raised drum',(0,0),.63,.738,.052,.096,mats['brass'],barrel,.014,128)
    _disc('Barrel dark spring recess',(0,0),.635,.040,.011,mats['dark'],barrel,.003,128)
    spring=[]
    for i in range(680):
        t=i/679;angle=t*TAU*8.5;r=.113+t*.499
        spring.append((r*math.cos(angle),r*math.sin(angle),.071))
    _curves('Tempered mainspring',[spring],.008,mats['silver'],barrel,2)
    _ring('Barrel polished lip',(0,0),.698,.735,.108,.019,mats['gold'],barrel,.004,128)
    # The spring is glimpsed through one machined crescent, not displayed as a full coil.
    _ring('Barrel stepped outer shoulder',(0,0),.647,.733,.110,.034,mats['gold'],barrel,.006,144)
    _ring('Barrel turned inner shoulder',(0,0),.158,.193,.111,.032,mats['polished'],barrel,.004,96)
    start,end=math.radians(-28),math.radians(250)
    cover=[]
    for i in range(129):
        a=start+(end-start)*i/128;cover.append((.662*math.cos(a),.662*math.sin(a)))
    for i in range(129):
        a=end-(end-start)*i/128;cover.append((.181*math.cos(a),.181*math.sin(a)))
    _poly('Barrel crescent-window cover',cover,.111,.032,mats['brass'],barrel,.005)
    turning=[]
    for k in range(17):
        rr=.205+k*.026
        turning.append([(rr*math.cos(a),rr*math.sin(a),.1274) for a in [start+.013+(end-start-.026)*j/220 for j in range(221)]])
    _curves('Barrel fine concentric turning',turning,.00115,mats['gold'],barrel,1)
    window_lips=[]
    for a in (start,end):
        window_lips.append([(rr*math.cos(a),rr*math.sin(a),.129) for rr in [.185+j*.475/45 for j in range(46)]])
    _curves('Barrel polished window chamfers',window_lips,.004,mats['polished'],barrel,2)
    for k,a in enumerate((.10,1.20,2.55,3.88,5.30)):
        _screw('Barrel cover fixing '+str(k),(.697*math.cos(a),.697*math.sin(a)),.134,.027,barrel,mats,a+.5)
    _screw('Barrel arbor cap',(0,0),.140,.065,barrel,mats,.26)
    # Fine ratchet face engraving and inner annular steps.
    ratchet=wheels[8]
    _ring('Ratchet sunburst face',(0,0),.19,.49,.062,.036,mats['bridge'],ratchet,.010,96)
    rays=[]
    for i in range(64):
        a=i*TAU/64;rays.append([(.27*math.cos(a),.27*math.sin(a),.084),(.475*math.cos(a+.065),.475*math.sin(a+.065),.084)])
    _curves('Circular ratchet engraving',rays,.0020,mats['brass'],ratchet,1)
    _screw('Ratchet arbor bolt',(0,0),.105,.072,ratchet,mats,1.0)
    # Stationary winding click with a visible curved tempered-steel spring.
    _poly('Winding click',[(-.28,1.56),(-.18,1.60),(-.06,1.74),(-.10,1.81),(-.24,1.77),(-.35,1.66)],.183,.055,mats['silver'],upper,.012)
    _screw('Click pivot',(-.27,1.65),.223,.043,upper,mats,.8)
    p=_catmull([(-.31,1.68),(-.57,1.69),(-.74,1.81),(-.80,2.06),(-.71,2.15)],20)
    _curves('Click curved spring',[[(x,y,.217) for x,y in p]],.012,mats['blue'],upper,3)
    # Full balance assembly. Polished rim, inertia screws and tightly coiled hairspring.
    bal=_empty('Balance oscillation pivot',oscillator);bal.location=(-1.29,-1.05,.074)
    bal['oscillation_hz']=2.5;bal['amplitude_radians']=.52
    _ring('Balance gold rim',(0,0),.715,.785,-.01,.085,mats['gold'],bal,.009,144)
    _torus('Balance mirror rim',(0,0),.751,.014,.038,mats['polished'],bal,144)
    _disc('Balance collet',(0,0),.112,.07,.20,mats['gold'],bal,.008)
    for i in range(3):
        a=i*TAU/3+.32;ca,sa=math.cos(a),math.sin(a)
        pp=[(.075*ca-.026*sa,.075*sa+.026*ca),(.743*ca-.024*sa,.743*sa+.024*ca),
            (.743*ca+.024*sa,.743*sa-.024*ca),(.075*ca+.026*sa,.075*sa-.026*ca)]
        _poly('Balance three-arm cross',pp,-.004,.046,mats['gold'],bal,.010)
    # Four golden timing weights plus eight small radial adjustment screws.
    for i in range(12):
        a=i*TAU/12+.15
        _disc('Balance timing weight',(.743*math.cos(a),.743*math.sin(a)),.032 if i%3 else .040,.065,.045,mats['gold'],bal,.003,24)
    hairspring=[]
    for i in range(900):
        t=i/899;a=TAU*10.6*t;r=.115+.521*t
        hairspring.append((r*math.cos(a),r*math.sin(a),.121+.005*t))
    _curves('Blued overcoil hairspring',[hairspring],.0028,mats['blue'],bal,2)
    # A separately raised final overcoil reads as a manufactured spring.
    overcoil=[(.635*math.cos(a),.635*math.sin(a),.136+(a-1.8)*.009) for a in [1.8+i*.9/70 for i in range(71)]]
    _curves('Breguet raised overcoil',[overcoil],.003,mats['silver'],bal,2)
    _jewel('Balance endstone',(0,0),.167,bal,mats,.065,False)
    # Pallet fork and shock jewels near the escape wheel, below the bridge.
    pp=[(-.75,-1.61),(-.50,-1.32),(-.23,-1.30),(-.16,-1.41),(-.21,-1.51),(-.29,-1.49),(-.32,-1.40),(-.48,-1.43),(-.69,-1.69)]
    _poly('Anchor pallet fork',pp,.17,.045,mats['silver'],oscillator,.008)
    for xy in [(-.25,-1.34),(-.23,-1.47)]:
        _poly('Rectangular pallet ruby',[(xy[0]-.039,xy[1]-.020),(xy[0]+.039,xy[1]-.020),(xy[0]+.039,xy[1]+.020),(xy[0]-.039,xy[1]+.020)],.202,.025,mats['ruby'],oscillator,.004)
    # Thick sculptural bridges with narrow polished bevels and stripe-finished faces.
    _bridge('Great barrel bridge',[(-1.94,1.26),(-1.57,1.58),(-1.02,1.65),(-.91,1.25),(-.83,1.04)], [.28,.42,.43,.35,.26],.303,bridges,mats)
    _bridge('Winding bridge',[(.34,2.09),(.66,1.97),(1.10,1.77),(1.49,1.27)], [.25,.31,.34,.30],.285,bridges,mats)
    _bridge('East train bridge',[(1.78,1.19),(1.66,.78),(1.24,.34),(1.51,-.12),(1.90,-.45)], [.27,.37,.40,.37,.26],.305,bridges,mats)
    _bridge('Sculpted center bridge',[(0,0),(.52,-.08),(.73,-.46),(1.19,-.72),(1.38,-1.11),(.94,-1.75)], [.24,.37,.46,.39,.41,.26],.317,bridges,mats)
    _bridge('Escape-wheel bridge',[(.37,-1.49),(.40,-1.79),(.15,-2.14)], [.26,.34,.26],.283,bridges,mats)
    _bridge('Hand-engraved balance cock',[(-2.12,-.21),(-1.94,-.38),(-1.69,-.77),(-1.29,-1.05)], [.33,.42,.33,.27],.320,bridges,mats,True)
    _bridge('Pallet bridge',[(-.56,-1.55),(-.35,-1.72),(-.16,-1.97)], [.19,.24,.18],.258,bridges,mats)
    # Jewels sit at the wheel staffs, with real ruby apertures and screw-set chatons.
    for name,xy,z,r in [
        ('Center wheel bearing',(0,0),.391,.072),
        ('Great barrel bearing',(-.83,1.04),.377,.081),
        ('Winding arbor bearing',(1.49,1.27),.359,.060),
        ('Third wheel bearing',(1.24,.34),.379,.069),
        ('Fourth wheel bearing',(1.19,-.72),.391,.069),
        ('Escape wheel bearing',(.37,-1.49),.357,.061),
        ('Balance cock ruby',(-1.29,-1.05),.394,.080),
        ('Pallet bearing',(-.56,-1.55),.332,.048),
    ]:
        _jewel(name,xy,z,bridges,mats,r)
        matched=next((w for w in wheels if abs(w.location.x-xy[0])<.001 and abs(w.location.y-xy[1])<.001),None)
        shaft_bottom=matched.location.z-.02 if matched else (.055 if 'Balance' in name else .13)
        shaft_top=z+.020
        shaft_parent=matched.parent if matched else oscillator
        _disc(name+' Continuous wheel staff',xy,r*.22,(shaft_bottom+shaft_top)/2,shaft_top-shaft_bottom,mats['polished'],shaft_parent,.002,32)
    fasteners=[(-1.94,1.26,.376),(-1.41,1.62,.376),(-.93,1.58,.376),(.34,2.09,.358),(.87,1.89,.358),
               (1.78,1.19,.378),(1.69,.83,.378),(1.90,-.45,.378),(.72,-.43,.390),(1.34,-1.09,.390),(.94,-1.75,.390),
               (.15,-2.14,.356),(-2.12,-.21,.393),(-1.95,-.45,.393),(-.16,-1.97,.331)]
    for i,(x,y,z) in enumerate(fasteners):
        _screw('Bridge fixing '+str(i),(x,y),z,.066 if i%3 else .072,bridges,mats,i*.63+.25)
    # Delicate swan-neck adjuster: curved steel spring with an actual adjustment screw.
    p=_catmull([(-1.51,-.94),(-1.62,-.68),(-1.43,-.53),(-1.14,-.61),(-1.05,-.85),(-1.15,-.98)],15)
    _curves('Swan-neck fine regulator',[[(x,y,.434) for x,y in p]],.014,mats['polished'],bridges,3)
    for label,pp,ww in [('Stem',[(-1.15,-.80),(-1.08,-.62),(-1.035,-.52)],[.030,.028,.022]),
                         ('Left fork',[(-1.15,-.80),(-1.31,-.86),(-1.44,-.98)],[.025,.022,.018]),
                         ('Right fork',[(-1.15,-.80),(-1.11,-.91),(-1.12,-1.01)],[.025,.022,.018])]:
        _poly('Regulator narrow '+label,_ribbon(pp,ww,10),.437,.018,mats['blue'],bridges,.003)
    _screw('Regulator screw',(-1.13,-.56),.451,.042,bridges,mats,.5)
    # Minute polished bridges and rail-like springs fill genuine keyless-work corners.
    p=_catmull([(1.78,1.42),(1.99,1.17),(2.10,.90),(2.05,.59)],15)
    _curves('Keyless steel spring',[[(x,y,.249) for x,y in p]],.018,mats['silver'],upper,3)
    _screw('Keyless spring attachment',(1.82,1.40),.262,.045,upper,mats,.2)
    # Two fine concentric milled channels at the outer edge bind the whole caliber.
    _torus('Caliber perimeter bright cut',(0,0),2.429,.009,-.085,mats['gold'],base,192)
    _torus('Caliber perimeter shadow channel',(0,0),2.412,.005,-.073,mats['dark'],base,192)
    return {'wheels':wheels,'balance':bal,'assembly':[base,lower,upper,oscillator,bridges],
            'layers':{'base':base,'train':lower,'winding':upper,'oscillator':oscillator,'bridges':bridges},
            'bounds_radius':2.46,'front_z':.485}
