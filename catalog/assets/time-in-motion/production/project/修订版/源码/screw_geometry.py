"""Reusable real screw, helical thread, bore, tool and macro photography.
Extracted from the preserved baseline; called with the revised scene.
"""
from pathlib import Path
import math,bpy
from mathutils import Vector,Matrix
from geometry import _empty,_mesh,_poly,_ring,_disc,_curves
ROOT=Path(__file__).resolve().parents[1]
TAU=math.tau

def aim(ob, target):
    forward = (Vector(target)-ob.location).normalized()
    right = forward.cross(Vector((0,1,0))).normalized()
    up = right.cross(forward).normalized()
    ob.rotation_euler = Matrix((right,up,-forward)).transposed().to_euler()


def mat(name, color, rough=.45, metal=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color,1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    return m

def area(name, pos, energy, size, color, target, ratio=1):
    data = bpy.data.lights.new(name,'AREA')
    data.energy = energy
    data.shape = 'RECTANGLE'
    data.size = size
    data.size_y = size*ratio
    data.color = color
    ob = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(ob)
    ob.location = pos
    aim(ob,target)
    return ob

def camera(s, name, pos, target, lens=75, fstop=None, ortho=None):
    data = bpy.data.cameras.new(name)
    data.sensor_width = 36
    data.lens = lens
    data.clip_start = .008
    data.clip_end = 300
    if ortho:
        data.type = 'ORTHO'
        data.ortho_scale = ortho
    ob = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(ob)
    ob.location = pos
    aim(ob,target)
    if fstop:
        focus = _empty(name+' focus',None)
        focus.location = target
        data.dof.use_dof = True
        data.dof.focus_object = focus
        data.dof.aperture_fstop = fstop
    s.camera = ob
    return ob

def linear_keys(ob):
    if not ob.animation_data or not ob.animation_data.action:
        return
    for curve in ob.animation_data.action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = 'LINEAR'

def key(ob, frame, location=None, rotation=None):
    if location is not None:
        ob.location = location
        ob.keyframe_insert('location',frame=frame)
    if rotation is not None:
        ob.rotation_euler = rotation
        ob.keyframe_insert('rotation_euler',frame=frame)

def smooth(u):
    u = max(0,min(1,u))
    return u*u*(3-2*u)

def neutral_root():
    bpy.data.objects['TIME / fully modelled skeleton pocket watch'].rotation_euler = (0,0,0)
    bpy.data.objects['CASEWORK · glass'].hide_render = True
    for ob in bpy.data.objects['CASEWORK · glass'].children_recursive:
        ob.hide_render = True

def wood(s):
    """实体工作台和程序木纹，没有把照片贴在模型后面。"""
    bpy.data.objects['Seamless charcoal studio'].hide_render = True
    walnut = mat('Watchmaker walnut bench',(.055,.023,.009),.36)
    nodes = walnut.node_tree.nodes
    links = walnut.node_tree.links
    tex = nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 3.4
    tex.inputs['Detail'].default_value = 3
    coord = nodes.new('ShaderNodeTexCoord')
    mapping = nodes.new('ShaderNodeVectorMath')
    mapping.operation = 'MULTIPLY'
    mapping.inputs[1].default_value = (.30,30,8)
    links.new(coord.outputs['Generated'],mapping.inputs[0])
    links.new(mapping.outputs[0],tex.inputs['Vector'])
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position=.12
    ramp.color_ramp.elements[0].color=(.022,.008,.003,1)
    ramp.color_ramp.elements[1].position=.88
    ramp.color_ramp.elements[1].color=(.14,.066,.022,1)
    links.new(tex.outputs['Fac'],ramp.inputs[0])
    links.new(ramp.outputs['Color'],nodes['Principled BSDF'].inputs['Base Color'])
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value=.12
    bump.inputs['Distance'].default_value=.022
    links.new(tex.outputs['Fac'],bump.inputs['Height'])
    links.new(bump.outputs[0],nodes['Principled BSDF'].inputs['Normal'])
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,-.82))
    table = bpy.context.object
    table.name = 'Solid walnut bench'
    table.scale = (18,14,.60)
    table.data.materials.append(walnut)
    # 制表托架：侧面的深色实体托环只在景深边缘出现。
    _ring('Machined movement holder',(0,0),2.86,3.15,-.43,.32,
          mat('Dark holder anodised steel',(.032,.028,.024),.31,.8),None,.035,192)
    bg = s.world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (.12,.10,.08,1)
    bg.inputs[1].default_value = .20
    for ob in s.objects:
        if ob.type=='LIGHT':
            ob.hide_render = True
    area('Bench broad softbox',(-3,4,6),530,4.0,(1,.91,.76),(1.4,.8,.2),.8)
    area('Screw edge strip',(4,1,5),420,2.2,(.85,.93,1),(1.65,.83,.4),.16)
    area('Bench warm backlight',(1,6,2.6),300,3,(1,.75,.43),(1.3,.7,.2),.25)
    s.view_settings.exposure = -.10

def cut_hole(name, x, y, radius):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius,depth=.55,
                                     location=(x,y,.31))
    cutter = bpy.context.object
    cutter.name = name+' cutter'
    for suffix in [' Mirror anglage',' Geneva-stripe face']:
        ob = bpy.data.objects['East train bridge'+suffix]
        mod = ob.modifiers.new('Actual drilled screw bore','BOOLEAN')
        mod.operation = 'DIFFERENCE'
        mod.solver = 'EXACT'
        mod.object = cutter
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

def screw(s):
    neutral_root()
    wood(s)
    original = bpy.data.objects['Bridge fixing 6']
    xy = (1.69,.83)
    steel = bpy.data.materials['Mirror polished steel']
    dark = bpy.data.materials['Recessed anthracite steel']
    blue = bpy.data.materials['Heat-blued steel']
    for c in original.children:
        if c.name.endswith('Countersink'):
            c.hide_render = True
    cut_hole('Bridge fixing 6',*xy,.036)
    _ring('Fixed screw counterbore',xy,.037,.080,.357,.024,steel,None,.003,96)
    _ring('Dark threaded bore',xy,.031,.036,.312,.084,dark,None,.001,64)
    # 将螺帽与垫圈分开；原来的两片蓝钢螺帽已经具有真实的一字槽。
    original.parent = None
    original.location = (*xy,.342)
    original.rotation_euler.z = 0
    # 极近距离摄影另做高密度圆弧，避免螺帽外沿显出多边形分段。
    for c in original.children:
        if 'Blue head' in c.name:c.hide_render=True
    gap=.066*.12
    angle=math.asin(gap/.066)
    for side in (1,-1):
        points=[]
        for i in range(129):
            a=angle+(math.pi-2*angle)*i/128
            points.append((.066*math.cos(a),side*.066*math.sin(a)))
        if side<0:points.reverse()
        cap=_poly('Macro finished blue head '+str(side),points,.030,.025,
                  blue,original,.0025)
        for face in cap.data.polygons:
            face.use_smooth=len(face.vertices)==4
    _disc('Fixing screw solid shank',(0,0),.027,-.069,.166,steel,original,.002,64)
    # 真实三角牙螺纹：轴向进给与旋转严格使用同一螺距。
    pitch = .018
    turns = 7.5
    vertices=[]
    faces=[]
    steps=900
    for i in range(steps+1):
        a=TAU*turns*i/steps
        z=-.140+pitch*turns*i/steps
        for r,dz in ((.027,-.005),(.034,0),(.027,.005)):
            vertices.append((r*math.cos(a),r*math.sin(a),z+dz))
    for i in range(steps):
        for j in range(3):
            faces.append((i*3+j,(i+1)*3+j,(i+1)*3+(j+1)%3,i*3+(j+1)%3))
    _mesh('Cut helical screw thread',vertices,faces,steel,original,.0007,True)
    driver = _empty('Slotted watchmaker screwdriver',None)
    blade=[(-.055,-.005),(.055,-.005),(.055,.005),(-.055,.005)]
    _poly('Polished screwdriver blade',blade,.0585,.075,steel,driver,.0014)
    bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=.024,radius2=.034,
                                  depth=.095,location=(0,0,.1435))
    neck=bpy.context.object
    neck.name='Ground screwdriver shoulder'
    neck.parent=driver
    neck.data.materials.append(steel)
    for face in neck.data.polygons:face.use_smooth=True
    _disc('Screwdriver polished stem',(0,0),.033,.465,.55,steel,driver,.003,64)
    # 逐帧耦合；前段落位，七圈旋入，最后刀具离开。
    for frame in range(1,97):
        if frame<=12:
            z=.342+7*pitch+.145*(1-smooth((frame-1)/11))
            theta=0
        elif frame<=78:
            u=smooth((frame-12)/66)
            z=.342+7*pitch*(1-u)
            theta=-7*TAU*u
        else:
            z=.342
            theta=-7*TAU
        key(original,frame,(*xy,z),(0,0,theta))
        lift=.37*smooth((frame-80)/16)
        key(driver,frame,(*xy,z+lift),(0,0,theta))
    linear_keys(original)
    linear_keys(driver)
    # 略侧的微距能同时读出槽口、螺纹和桥板倒角。
    cam=camera(s,'Screw installation macro',(2.42,1.26,1.57),
               (1.57,.75,.38),82,3.2)
    focus=cam.data.dof.focus_object
    for frame in range(1,97):
        s.frame_set(frame)
        u=(frame-1)/95
        cam.location=(2.42-.055*u,1.26-.02*u,1.57-.045*u)
        aim(cam,(1.57+.025*u,.75,.39))
        cam.keyframe_insert('location',frame=frame)
        cam.keyframe_insert('rotation_euler',frame=frame)
        focus.location=(*xy,original.location.z+.030)
        focus.keyframe_insert('location',frame=frame)
    linear_keys(cam)
    linear_keys(focus)
    s.frame_end=96
    return {'rotationTurns':7,'threadPitch':pitch,'advance':7*pitch,
            'holeCutThroughBridge':True,'movingObjects':[original.name,driver.name]}

