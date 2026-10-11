"""Assemble native 24 fps Cycles frames and the original 22-second soundtrack."""
import subprocess, json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
frames=ROOT/'帧序列'
missing=[i for i in range(1,529) if not (frames/f'frame_{i:04d}.png').exists()]
if missing:raise SystemExit('缺少画面：'+str(missing[:20]))
out=ROOT/'成片'/'分秒之间.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-y',
    '-framerate','24','-start_number','1','-i',str(frames/'frame_%04d.png'),
    '-i',str(ROOT/'成片'/'分秒之间-声轨.wav'),
    '-vf','fade=t=in:st=0:d=0.25,fade=t=out:st=21.65:d=0.35',
    '-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','256k','-ar','48000','-t','22','-movflags','+faststart',str(out)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(out)]))
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert video['width']==1920 and video['height']==1080
assert video['r_frame_rate']=='24/1' and int(video['nb_read_frames'])==528
assert abs(float(probe['format']['duration'])-22)<.05
assert audio['channels']==2 and audio['sample_rate']=='48000'
subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True)
(ROOT/'检查'/'video.json').write_text(json.dumps({'path':str(out),'duration':probe['format']['duration'],'size_bytes':out.stat().st_size,'dimensions':[1920,1080],'frame_count':int(video['nb_read_frames']),'frame_rate':video['r_frame_rate'],'audio_rate':audio['sample_rate'],'full_decode_passed':True,'source':'Native Blender Cycles sequence; no frame interpolation'},ensure_ascii=False,indent=2))
print('VIDEO_READY',out)
