"""Sculpted pocket-watch case, enamel chapter, blued hands and crown.
All visible surfaces are modeled geometry. Watch XY plane, face towards +Z.
"""
import bpy
import math
from mathutils import Vector

TAU = math.tau


def _empty(name, parent=None):
    ob = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def _mesh(name, verts, faces, material, parent, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.parent = parent
    if material:
        me.materials.append(material)
    for poly in me.polygons:
        poly.use_smooth = smooth
    return ob


def _lathe(name, profile, material, parent, segments=320, center=(0,0,0), flutes=0, flute_depth=0):
    # Cross-section is ordered around the full enclosed wall, including inner lip.
    verts=[]
    faces=[]
    for r,z in profile:
        for j in range(segments):
            a=TAU*j/segments
            f=1 + flute_depth * math.cos(flutes*a) if flutes else 1
            verts.append((center[0]+r*f*math.cos(a),center[1]+r*f*math.sin(a),center[2]+z))
    rows=len(profile)
    for i in range(rows):
        ni=(i+1)%rows
        for j in range(segments):
            nj=(j+1)%segments
            faces.append((i*segments+j, i*segments+nj, ni*segments+nj, ni*segments+j))
    return _mesh(name,verts,faces,material,parent)


def _rounded_ring(name, ri, ro, z, height, material, parent, bevel=.012, center=(0,0), segments=320):
    b=min(bevel,height*.49,(ro-ri)*.49)
    # Arc samples on the four corners maintain continuous reflected light bands.
    profile=[]
    for cr,cz,start in [(ro-b,z+height-b,0),(ri+b,z+height-b,90),(ri+b,z+b,180),(ro-b,z+b,270)]:
        for k in range(7):
            a=math.radians(start+90*k/6)
            profile.append((cr+b*math.cos(a),cz+b*math.sin(a)))
    return _lathe(name,profile,material,parent,segments,(center[0],center[1],0))


def _torus(name, radius, tube, z, mat, parent, center=(0,0), segments=320, minor=12):
    profile=[(radius+tube*math.cos(TAU*k/minor),z+tube*math.sin(TAU*k/minor)) for k in range(minor)]
    return _lathe(name,profile,mat,parent,segments,(center[0],center[1],0))


def _curve(name, points, thickness, mat, parent, cyclic=False, resolution=3):
    cu=bpy.data.curves.new(name,'CURVE')
    cu.dimensions='3D'
    cu.resolution_u=resolution
    cu.bevel_depth=thickness
    cu.bevel_resolution=3
    sp=cu.splines.new('POLY')
    sp.points.add(len(points)-1)
    for p,co in zip(sp.points,points): p.co=(*co,1)
    sp.use_cyclic_u=cyclic
    ob=bpy.data.objects.new(name,cu)
    bpy.context.collection.objects.link(ob)
    ob.parent=parent
    cu.materials.append(mat)
    return ob


def _boxes(name, specifications, mat, parent):
    verts=[];faces=[]
    for cx,cy,cz,wx,wy,h,angle in specifications:
        start=len(verts)
        ca,sa=math.cos(angle),math.sin(angle)
        for dz in [-h/2,h/2]:
            for dx,dy in [(-wx/2,-wy/2),(wx/2,-wy/2),(wx/2,wy/2),(-wx/2,wy/2)]:
                verts.append((cx+dx*ca-dy*sa,cy+dx*sa+dy*ca,cz+dz))
        faces.extend(tuple(start+j for j in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    return _mesh(name,verts,faces,mat,parent,False)


def _text(name, value, size, position, angle, mat, parent, font):
    cu=bpy.data.curves.new(name,'FONT')
    cu.body=value
    cu.size=size
    cu.align_x='CENTER';cu.align_y='CENTER'
    cu.extrude=.0008
    cu.bevel_depth=.00035
    cu.bevel_resolution=2
    cu.resolution_u=10
    if font:cu.font=font
    ob=bpy.data.objects.new(name,cu)
    bpy.context.collection.objects.link(ob)
    ob.parent=parent
    ob.location=position
    ob.rotation_euler[2]=angle
    cu.materials.append(mat)
    return ob


def _sphere(name, loc, radius, scale, mat, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=20,radius=radius,location=loc)
    ob=bpy.context.object;ob.name=name;ob.parent=parent
    ob.scale=scale
    ob.data.materials.append(mat)
    for p in ob.data.polygons:p.use_smooth=True
    return ob


def _lance(name, length, width, angle, z, mat, polish, parent):
    """Open-work leaf hand with a raised polished central facet."""
    # Two surfaces and a gently beveled edge. Opening is a real cutout, not paint.
    outer=[(0,-.30),(width*.53,-.23),(width*.48,.18),(width*.76,length*.44),(width*.47,length*.78),(0,length),(-width*.47,length*.78),(-width*.76,length*.44),(-width*.48,.18),(-width*.53,-.23)]
    inner=[(0,length*.29),(-width*.22,length*.48),(0,length*.82),(width*.22,length*.48)]
    cu=bpy.data.curves.new(name,'CURVE')
    cu.dimensions='2D';cu.fill_mode='BOTH'
    cu.resolution_u=8;cu.extrude=.012;cu.bevel_depth=.007;cu.bevel_resolution=4
    # Blender resolves opposite winding as a hole.
    for loop in [outer,inner]:
        sp=cu.splines.new('POLY');sp.points.add(len(loop)-1)
        for p,(x,y) in zip(sp.points,loop):p.co=(x,y,0,1)
        sp.use_cyclic_u=True
    cu.materials.append(mat)
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob)
    ob.parent=parent;ob.location.z=z;ob.rotation_euler.z=angle
    # A narrow steel edge gives the blued, separately tempered hand a crisp glint.
    ca,sa=math.cos(angle),math.sin(angle)
    edge=[]
    for x,y in [outer[2],outer[3],outer[4],outer[5]]:
        edge.append((x*ca-y*sa,x*sa+y*ca,z+.010))
    _curve(name+' · polished edge',edge,.0028,polish,parent)
    return ob


def build_case(root, materials):
    m=materials
    groups={k:_empty('CASEWORK · '+k,root) for k in ['case','chapter','hands','glass','crown','bow']}
    case=groups['case']; chapter=groups['chapter'];hands=groups['hands'];crown=groups['crown'];bow=groups['bow']
    # Plump lenticular case, a smooth continuous surface rather than stacked wire rings.
    shell=[(2.495,-.49),(2.55,-.552),(2.66,-.595),(2.78,-.587),(2.88,-.54),(2.948,-.45),(2.984,-.335),(2.992,-.22),(2.98,-.08),(2.958,.075),(2.925,.208),(2.883,.301),(2.831,.351),(2.795,.338),(2.802,.276),(2.827,.17),(2.842,.045),(2.847,-.105),(2.823,-.29),(2.774,-.392),(2.675,-.444),(2.55,-.45)]
    _lathe('Platinum · vaulted case body',shell,m['polished'],case,384)
    _rounded_ring('Platinum · raised rear seam',2.727,2.904,-.526,.066,m['silver'],case,.02)
    _torus('Case · dark rear gasket',2.918,.009,-.431,m['dark'],case)
    _torus('Case · warm hairline rear accent',2.943,.007,-.386,m['gold'],case)
    # Fine reeded middle band has 240 cuts, all one closed mesh.
    reedprof=[(2.969,-.256),(2.987,-.249),(2.99,-.235),(2.977,-.044),(2.968,-.033),(2.956,-.044),(2.969,-.24)]
    _lathe('Case · 240 fine milled flutes',reedprof,m['silver'],case,1440,flutes=240,flute_depth=.00095)
    _torus('Case · front separation shadow',2.907,.010,.257,m['dark'],case)
    # Front bezel has a deep, broad convex polish with a narrow reverse chamfer.
    bezel=[(2.793,.336),(2.865,.343),(2.915,.377),(2.935,.425),(2.922,.478),(2.89,.521),(2.85,.548),(2.814,.551),(2.792,.531),(2.784,.493),(2.79,.452)]
    _lathe('Bezel · wide rolled mirror shoulder',bezel,m['polished'],case,384)
    _torus('Bezel · warm reflected inner wire',2.814,.010,.541,m['gold'],case)
    _torus('Bezel · crisp inner separation',2.788,.006,.483,m['dark'],case)
    _torus('Bezel · exterior razor highlight',2.92,.007,.42,m['silver'],case)
    # Inside edge around the movement carries a finished vertical wall.
    _rounded_ring('Rehaut · polished inner wall',2.453,2.5,.318,.12,m['polished'],case,.008)
    _torus('Rehaut · deep black inner line',2.456,.009,.414,m['dark'],case)
    # Cream fired enamel, with actual rounded edge and metal seat below it.
    _rounded_ring('Dial · gold enamel seat',2.473,2.823,.424,.08,m['gold'],chapter,.008)
    _rounded_ring('Dial · fired ivory enamel',2.483,2.809,.443,.066,m['enamel'],chapter,.007)
    _torus('Dial · polished inward bevel',2.483,.008,.499,m['polished'],chapter)
    _torus('Dial · outer enamel gold rim',2.811,.005,.503,m['gold'],chapter)
    # Railroad minutes: circles/ticks sit only 1/1000 of a unit above enamel.
    railz=.5108
    for r in [2.727,2.782]:_torus('Chapter · railway '+str(r),r,.0027,railz,m['ink'],chapter,minor=8)
    ticks=[]
    for i in range(60):
        a=TAU*i/60
        r=2.7545
        ticks.append((r*math.sin(a),r*math.cos(a),railz,.009 if i%5==0 else .0038,.055,.0017,-a))
    _boxes('Chapter · 60 precise minute indices',ticks,m['ink'],chapter)
    font=None
    for p in ['/System/Library/Fonts/Supplemental/Times New Roman.ttf','/System/Library/Fonts/Supplemental/Georgia.ttf']:
        try:font=bpy.data.fonts.load(p);break
        except RuntimeError:pass
    numerals=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI']
    for i,value in enumerate(numerals):
        a=TAU*i/12
        _text('Enamel · '+value,value,.266,(2.592*math.sin(a),2.600*math.cos(a),.5115),-a,m['ink'],chapter,font)
    # Open-work subsidiary seconds at six: retains a view into the mechanism.
    sc=(0,-1.735)
    _rounded_ring('Seconds · polished bezel',.335,.479,.445,.07,m['polished'],chapter,.014,sc,192)
    _rounded_ring('Seconds · enamel chapter',.351,.459,.508,.022,m['enamel'],chapter,.004,sc,192)
    for r in [.356,.455]:_torus('Seconds · engraved circle '+str(r),r,.0016,.5315,m['ink'],chapter,sc,192,8)
    st=[]
    for i in range(60):
        a=TAU*i/60;lr=.022 if i%5==0 else .010;rr=.448-lr/2
        st.append((sc[0]+rr*math.sin(a),sc[1]+rr*math.cos(a),.5325,.004 if i%5==0 else .002,lr,.0015,-a))
    _boxes('Seconds · 60 fine ticks',st,m['ink'],chapter)
    for i in range(6):
        a=TAU*i/6
        _text('Seconds numeral '+str(i*10),str(i*10),.066,(sc[0]+.393*math.sin(a),sc[1]+.393*math.cos(a),.5328),-a,m['ink'],chapter,font)
    _torus('Seconds · gold inner bevel',.349,.0035,.524,m['gold'],chapter,sc,192,8)
    # Tempered steel hands; correct 10:10 proportions and handedness.
    hour=_lance('Hour · pierced blue leaf',1.69,.103,math.radians(55),.56,m['blue'],m['silver'],hands)
    minute=_lance('Minute · pierced blue leaf',2.405,.071,math.radians(-60),.60,m['blue'],m['silver'],hands)
    # Blue hand collets are rounded and physically layered, with gold pivot.
    _rounded_ring('Hand · hour collet',.04,.146,.542,.042,m['blue'],hands,.012)
    _rounded_ring('Hand · minute collet',.028,.121,.598,.036,m['blue'],hands,.012)
    _torus('Hand · gold pivot edging',.071,.008,.643,m['gold'],hands,segments=96)
    _sphere('Hand · polished blue cabochon',(0,0,.649),.067,(1,1,.44),m['blue'],hands)
    _sphere('Hand · pivot steel bright end',(0,0,.675),.025,(1,1,.50),m['polished'],hands)
    # Subsidiary steel hand.
    sa=math.radians(-18)
    sp=[(sc[0]-.009*math.cos(sa)+y*math.sin(sa),sc[1]+.009*math.sin(sa)+y*math.cos(sa),.559) for y in [-.075,.345]]
    _curve('Seconds · fine blued needle',sp,.008,m['blue'],hands)
    _torus('Seconds · open counterweight',.034,.009,.559,m['blue'],hands,(sc[0]-.085*math.sin(sa),sc[1]-.085*math.cos(sa)),64,10)
    _sphere('Seconds · polished pin',(sc[0],sc[1],.568),.026,(1,1,.45),m['polished'],hands)
    # Stem, stem collar and an onion-shaped winding crown. Axis is watch +Y.
    def ylathe(name,profile,mat,seg=144,flutes=0,depth=0):
        ob=_lathe(name,profile,mat,crown,seg,flutes=flutes,flute_depth=depth)
        ob.rotation_euler.x=-math.pi/2
        ob.location.z=-.09
        return ob
    ylathe('Crown · stem',[(.075,2.89),(.075,3.22),(.066,3.24),(.045,3.22),(.045,2.89)],m['polished'])
    ylathe('Crown · sculpted collar',[(.125,3.04),(.153,3.07),(.157,3.11),(.145,3.15),(.107,3.18),(.101,3.27),(.082,3.28),(.083,3.04)],m['polished'])
    ylathe('Crown · collar gold hairline',[(.147,3.12),(.149,3.131),(.144,3.14),(.138,3.132)],m['gold'])
    onion=[(.082,3.205),(.107,3.237),(.157,3.271),(.212,3.325),(.241,3.391),(.245,3.448),(.224,3.51),(.181,3.562),(.123,3.597),(.063,3.614),(.018,3.617),(.018,3.583),(.045,3.56),(.066,3.48),(.067,3.3)]
    ylathe('Crown · 32 deeply fluted onion',onion,m['polished'],512,32,.067)
    ylathe('Crown · underside cut',[(.124,3.237),(.128,3.246),(.128,3.254),(.12,3.256)],m['dark'])
    # Elliptical articulated pendant; thick curved metal catches broad light.
    bowpts=[]
    for j in range(241):
        a=TAU*j/240
        bowpts.append((.51*math.cos(a),3.885+.525*math.sin(a),-.11+.038*math.cos(2*a)))
    _curve('Bow · oval polished pendant',bowpts,.058,m['polished'],bow,True)
    # Fine chamfer along the inner sweep.
    innerpts=[(.492*math.cos(TAU*j/240),3.885+.507*math.sin(TAU*j/240),-.056+.038*math.cos(2*TAU*j/240)) for j in range(241)]
    _curve('Bow · fine face chamfer',innerpts,.006,m['silver'],bow,True)
    for sign in [-1,1]:
        pos=(sign*.365,3.475,-.10)
        _sphere('Bow · articulated polished lug',pos,.118,(.83,1.18,.78),m['polished'],bow)
        _sphere('Bow · screw recess',(pos[0],pos[1],pos[2]+.079),.048,(1,1,.22),m['dark'],bow)
        _sphere('Bow · blue hinge screw',(pos[0],pos[1],pos[2]+.088),.037,(1,1,.26),m['blue'],bow)
        _curve('Bow · screw slot',[(pos[0]-.022,pos[1]-.009,pos[2]+.100),(pos[0]+.022,pos[1]+.009,pos[2]+.100)],.0025,m['dark'],bow)
    # Optional crystal isolated from the mechanism. Hidden by default: parent may
    # enable it after balancing physically transmitted studio reflections.
    gl=_rounded_ring('Crystal · thin sapphire rim',2.773,2.792,.703,.020,m['glass'],groups['glass'],.008)
    groups['glass'].hide_render=True
    gl.hide_render=True
    groups['hands']['hour_hand']=hour.name
    groups['hands']['minute_hand']=minute.name
    groups['case']['construction']='Lathed lenticular platinum, rolled bezel, milled reeding'
    return groups
