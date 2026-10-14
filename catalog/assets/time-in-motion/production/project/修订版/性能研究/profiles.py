"""Reusable Cycles budgets. Profiles change rendering, never cameras or motion."""
PROFILES={
    'safe':dict(samples=48,min_samples=0,threshold=.035,quality='HIGH',scale=100),
    'quality':dict(samples=48,min_samples=8,threshold=.035,quality='HIGH',scale=100),
    'balanced':dict(samples=24,min_samples=8,threshold=.05,quality='HIGH',scale=100),
    'fast':dict(samples=16,min_samples=8,threshold=.05,quality='BALANCED',scale=100),
    'preview':dict(samples=16,min_samples=4,threshold=.08,quality='BALANCED',scale=25),
}

def apply(scene,name):
    import bpy
    p=PROFILES[name]
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL';prefs.get_devices()
    devices=[d for d in prefs.devices if d.type=='METAL']
    if not devices:raise RuntimeError('No Metal GPU; refusing silent CPU fallback')
    for d in prefs.devices:d.use=d.type=='METAL'
    scene.render.engine='CYCLES';scene.cycles.device='GPU'
    scene.cycles.samples=p['samples'];scene.cycles.use_adaptive_sampling=True
    scene.cycles.adaptive_min_samples=p['min_samples'];scene.cycles.adaptive_threshold=p['threshold']
    scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE'
    scene.cycles.denoising_use_gpu=True;scene.cycles.denoising_quality=p['quality']
    scene.cycles.denoising_prefilter='ACCURATE';scene.cycles.denoising_input_passes='RGB_ALBEDO_NORMAL'
    scene.cycles.seed=41;scene.cycles.use_animated_seed=False
    scene.render.resolution_percentage=p['scale'];scene.render.use_persistent_data=True
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
    scene.render.image_settings.color_depth='8';scene.render.image_settings.compression=12
    return p
