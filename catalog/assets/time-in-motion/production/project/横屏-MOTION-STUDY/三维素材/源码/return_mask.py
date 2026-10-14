"""Fast camera-matched alpha only. Original scene and beauty are never saved."""
from pathlib import Path
import argparse,bpy,hashlib,json,sys,time
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[3]
BASE=Path(__file__).resolve().parents[1]
SPECS={
    'return':('3比4产品展示版/三维/模型/product-film.blend',(1080,1440),588,664,0),
    'opening':('修订版/4K双版本/模型/横屏/opening.blend',(1920,1080),1,84,1),
}

def main():
    p=argparse.ArgumentParser();p.add_argument('--frames',required=True)
    p.add_argument('--clip',choices=SPECS,default='return')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
    model_rel,size,minimum,maximum,offset=SPECS[args.clip]
    MODEL=ROOT/model_rel;OUT=BASE/(args.clip+'-alpha')
    frames=list(range(*map(int,args.frames.split(':')))) if ':' in args.frames else list(map(int,args.frames.split(',')))
    if not frames or min(frames)<minimum or max(frames)>maximum:raise ValueError('Frames outside approved source segment')
    OUT.mkdir(parents=True,exist_ok=True)
    digest=hashlib.sha256(MODEL.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(MODEL));s=bpy.context.scene
    root=bpy.data.objects['TIME / fully modelled skeleton pocket watch']
    original_parts={o.name:o.hide_render for o in root.children_recursive}
    outside=[o for o in s.objects if o.type in {'MESH','CURVE','FONT'} and o not in root.children_recursive]
    assert [o.name for o in outside]==['Seamless charcoal studio']
    outside[0].hide_render=True
    s.render.engine='BLENDER_WORKBENCH'
    s.render.film_transparent=True
    s.render.resolution_x=size[0];s.render.resolution_y=size[1];s.render.resolution_percentage=100
    s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA'
    s.render.image_settings.color_depth='8';s.render.image_settings.compression=30
    s.render.dither_intensity=0;s.render.use_motion_blur=False
    shading=s.display.shading
    shading.light='FLAT';shading.color_type='SINGLE';shading.single_color=(1,1,1)
    for name in ['show_shadows','show_cavity','show_object_outline','show_specular_highlight','show_xray']:
        if hasattr(shading,name):setattr(shading,name,False)
    aa=[x.identifier for x in s.display.bl_rna.properties['render_aa'].enum_items]
    s.display.render_aa='8' if '8' in aa else 'FXAA'
    s.view_settings.view_transform='Standard';s.view_settings.look='None';s.view_settings.exposure=0;s.view_settings.gamma=1
    report_path=OUT/'mask-render.json'
    report=json.loads(report_path.read_text()) if report_path.exists() else {'source':str(MODEL),'sourceSHA256':digest,'engine':'BLENDER_WORKBENCH','format':list(size),'naming':'F%04d.png; global product-film frame' if args.clip=='return' else 'F%04d.png; local video frame = Blender scene frame - 1','frames':[]}
    assert report['sourceSHA256']==digest
    report['antialiasing']=s.display.render_aa
    report['hiddenOutsideProduct']=[o.name for o in outside]
    report['cameraGeometryPreserved']=True
    for frame in frames:
        path=OUT/f'F{frame-offset:04d}.png'
        if path.exists() and any(x['frame']==frame for x in report['frames']):continue
        s.frame_set(frame);bpy.context.view_layer.update()
        assert all(o.hide_render==original_parts[o.name] for o in root.children_recursive)
        camera={'position':list(s.camera.location),'rotation':list(s.camera.rotation_euler),'lens':s.camera.data.lens,'sensorFit':s.camera.data.sensor_fit,'sensorWidth':s.camera.data.sensor_width,'shift':[s.camera.data.shift_x,s.camera.data.shift_y],'focus':list(s.camera.data.dof.focus_object.location),'fstop':s.camera.data.dof.aperture_fstop}
        s.render.filepath=str(path);started=time.monotonic()
        bpy.ops.render.render(write_still=True);seconds=time.monotonic()-started
        item={'frame':frame,'filenameFrame':frame-offset,'path':str(path),'seconds':seconds,'camera':camera,'bytes':path.stat().st_size}
        report['frames']=[x for x in report['frames'] if x['frame']!=frame]+[item]
        report['frames'].sort(key=lambda x:x['frame'])
        report['renderSeconds']=sum(x['seconds'] for x in report['frames'])
        report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2))
        print('MASK_FRAME '+json.dumps(item,ensure_ascii=False),flush=True)
    assert hashlib.sha256(MODEL.read_bytes()).hexdigest()==digest
    print('MASKS_COMPLETE '+str(len(report['frames'])),flush=True)

if __name__=='__main__':main()
