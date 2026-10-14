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


