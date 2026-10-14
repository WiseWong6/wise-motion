"""Author one deterministic 28-second product film, then split only at export.

Global frame range [0, 672).  Only 95→96 and 167→168 are intentional cuts.
The complete watch remains assembled and its original mechanical clock runs.
"""
from pathlib import Path
import sys, math, json, argparse, hashlib
sys.dont_write_bytecode=True
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
sys.path.insert(0,str(Path(__file__).resolve().parent))
import product_photography as p
sys.path.insert(0,str(p.PROJECT/'修订版/源码'))
import cinematography as mech

SHOTS=[('reveal',0,96),('edge',96,168),('face',168,264),
       ('journey',264,408),('detail',408,504),('return',504,672)]

def unit(frame,lo,hi):
    return p.smooth((frame-lo)/max(1,hi-lo))

def lerp(a,b,t):return a*(1-t)+b*t

def linear(data):
    action=data.animation_data.action if data.animation_data else None
    if action:
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fc in bag.fcurves:
                        for key in fc.keyframe_points:key.interpolation='LINEAR'

def pose_spec(frame):
    """All vectors use the model's real coordinate system; front is +Z."""
    H=(4.6,2.5,15.05);HT=(0,.58,.04)
    FACE_START=((2.8,1.55,10.9),(.23,-.01,.13),82,9.5)
    FACE_END=((2.34,1.24,10.25),(.16,-.09,.14),82,9)
    # Macro is 30% farther from the real oscillator than the initial test.
    BAL_END=((-2.58,-2.34,5.46),(-1.31,-.88,.18),82,5.6)
    DETAIL_END=((-1.45,-2.41,5.50),(-1.31,-.87,.22),82,5.0)
    def blend(a,b,t):
        return p.mix(a[0],b[0],t),p.mix(a[1],b[1],t),lerp(a[2],b[2],t),lerp(a[3],b[3],t)
    if frame<96:
        return blend(((7.6,2.6,15.1),HT,82,12),(H,HT,82,12),unit(frame,0,95))
    if frame<168:
        # Wider than the first edge test: preserve the actual blue hand axis.
        return blend(((6.55,1.72,7.22),(.75,.16,.15),92,7.4),
                     ((5.94,1.20,7.07),(.60,.01,.15),92,7.4),unit(frame,96,167))
    if frame<264:
        return blend(FACE_START,FACE_END,unit(frame,168,263))
    if frame<408:
        # Finish travel at F359, then let the oscillator breathe for two seconds.
        return blend(FACE_END,BAL_END,unit(frame,264,359))
    if frame<504:
        return blend(BAL_END,DETAIL_END,unit(frame,408,503))
    # Return from the very same macro. Last 2 seconds are settled product time.
    return blend(DETAIL_END,(H,HT,82,12),unit(frame,504,623))

def light_spec(frame):
    # Reflection moves physically across the continuous film. No exposure cuts.
    sweep=math.sin(math.pi*frame/671)
    fade=lerp(.13,1,unit(frame,0,42)) if frame<96 else 1
    # Isolated to detail and return: no implicit change to frames 0–407.
    detail=0. if frame<408 else unit(frame,408,503) if frame<504 else 1-unit(frame,504,623)
    strip_width=lerp(1.5,.9,detail)
    # Narrower reflection with controlled emitted flux avoids a broad white patch.
    strip_energy=530*(strip_width/1.5)**.4
    return {
        'Key / ivory softbox':(( -6+.75*sweep,6,9),690*fade,6,8.7),
        'Right strip / platinum contour':((6-.6*sweep+.8*detail,2+.5*sweep,6),strip_energy,strip_width,9),
        'Top silk / bevel definition':((0,8,0),760*lerp(.5,1,unit(frame,0,42)),5,3.5),
        'Low reflection card':((-1,-2,6),95*fade,5,1.15),
        'Back edge separation':((-4,2,-5),540,3,6),
        'Movement broad fill':((0,1,10),75*fade,5.5,3.85),
        'Case shoulder strip':((7+.3*sweep,2,-2),690,3.2,3.52),
    }

def snapshot(scene,frame):
    cam=scene.camera
    return {'frame':frame,'position':list(cam.location),'rotation':list(cam.rotation_euler),
            'focus':list(cam.data.dof.focus_object.location),'lens':cam.data.lens,
            'fstop':cam.data.dof.aperture_fstop,'shift':[cam.data.shift_x,cam.data.shift_y],
            'exposure':scene.view_settings.exposure,
            'worldStrength':scene.world.node_tree.nodes['Background'].inputs[1].default_value,
            'lights':{o.name:{'position':list(o.location),'energy':o.data.energy,
                         'size':[o.data.size,o.data.size_y]} for o in scene.objects if o.type=='LIGHT'}}

def main():
    scene,root,baseline=p.load()
    p.budget(scene,1080,24)
    # New photography does not mutate any product object visibility or materials.
    root.rotation_euler=(0,math.radians(-5),math.radians(-7))
    mech.root=root
    mech.flex=bpy.data.objects['Blued overcoil hairspring']
    assert mech.flex.type=='MESH' and len(mech.flex.data.shape_keys.key_blocks)==34
    world=scene.world.node_tree.nodes['Background']
    world.inputs[0].default_value=(.10,.12,.16,1)
    world.inputs[1].default_value=.095
    cam=scene.camera
    records=[]
    for frame in range(672):
        scene.frame_set(frame)
        pos,target,lens,fstop=pose_spec(frame)
        cam.location=pos;p.aim(cam,target)
        cam.data.lens=lens;cam.data.dof.aperture_fstop=fstop
        cam.data.dof.focus_object.location=target
        cam.data.shift_x=cam.data.shift_y=0
        for obj,props in [(cam,['location','rotation_euler']),
                          (cam.data,['lens','shift_x','shift_y','dof.aperture_fstop']),
                          (cam.data.dof.focus_object,['location'])]:
            for prop in props:obj.keyframe_insert(prop,frame=frame)
        for name,(pos,energy,size,sy) in light_spec(frame).items():
            obj=bpy.data.objects[name];obj.location=pos;p.aim(obj,(0,0,0))
            obj.data.energy=energy;obj.data.size=size;obj.data.size_y=sy
            for prop in ['location','rotation_euler']:obj.keyframe_insert(prop,frame=frame)
            for prop in ['energy','size','size_y']:obj.data.keyframe_insert(prop,frame=frame)
        mech.tick(frame,26+frame/24)
        bpy.context.view_layer.update()
        records.append(snapshot(scene,frame))
    scene.frame_start=0;scene.frame_end=671
    for obj in scene.objects:
        linear(obj)
        if obj.type in {'CAMERA','LIGHT'}:linear(obj.data)
        if obj.type=='MESH' and obj.data.shape_keys:linear(obj.data.shape_keys)
    visibility_diff=[o.name for o in root.children_recursive if o.name in baseline
                     and o.hide_render!=baseline[o.name]['hide']]
    assert not visibility_diff
    # Verify the saved global function rather than independent per-shot copies.
    continuity=[]
    for a,b in [(263,264),(407,408),(503,504),(623,624)]:
        x,y=records[a],records[b]
        delta=max(abs(v-w) for key in ['position','rotation','focus','shift']
                  for v,w in zip(x[key],y[key]))
        optical=max(abs(x[k]-y[k]) for k in ['lens','fstop','exposure','worldStrength'])
        continuity.append({'frames':[a,b],'cameraMaxDelta':delta,'opticalMaxDelta':optical,
                           'mechanicalTimeDelta':1/24,
                           'lightEnergyMaxDelta':max(abs(x['lights'][k]['energy']-y['lights'][k]['energy']) for k in x['lights'])})
        assert delta<1e-6 and optical<1e-6
    scene.frame_set(0)
    bpy.context.preferences.filepaths.save_version=0
    output=p.ROOT/'模型/product-film.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(output))
    p.write_json(p.ROOT/'审核/全局轨迹.json',{'format':{'width':1080,'height':1440,'fps':24,'frames':672},
        'shots':[{'id':s,'start':a,'end':b,'frames':b-a} for s,a,b in SHOTS],
        'intentionalCuts':[[95,96],[167,168]],'continuity':continuity,'trajectory':records})
    p.write_json(p.ROOT/'审核/动画工程检查.json',{'readyForRepresentatives':True,
        'source':str(p.SOURCE),'sourceSHA256':hashlib.sha256(p.SOURCE.read_bytes()).hexdigest(),
        'model':str(output),'objects':len(baseline),'visibilityChanges':visibility_diff,
        'continuity':continuity,'globalFrameClock':'26 + frame / 24',
        'mechanics':'Original fixed shafts, correct upstream ratios and elastic balance hairspring',
        'macroWidening':'30 percent farther than the initial balance reference',
        'color':{'view':'AgX','look':scene.view_settings.look,'exposure':scene.view_settings.exposure}})
    print('GLOBAL_ANIMATION_READY '+str(output),flush=True)

if __name__=='__main__':main()
