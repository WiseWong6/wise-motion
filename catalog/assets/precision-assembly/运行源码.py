"""Run the real scene without depending on the original project directory.
Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
"""
import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def blender_binary():
    found = shutil.which('blender')
    app = Path('/Applications/Blender.app/Contents/MacOS/Blender')
    if app.is_file():
        return str(app)
    if found:
        return found
    raise SystemExit('未找到 Blender；请准备 Blender 4.5 LTS 后再运行。')

def run_scene(script, saved=True, extra=()):
    cmd = [blender_binary(), '--background']
    if saved:
        cmd.append(str(ROOT / '分秒之间.blend'))
    cmd += ['--python-exit-code', '1', '-t', '8', '--python', str(ROOT / '源码' / script)]
    if extra:
        cmd += ['--', *extra]
    subprocess.run(cmd, cwd=ROOT, check=True)

def main():
    parser = argparse.ArgumentParser(description='真实三维源码入口；检查不渲染画面。')
    parser.add_argument('mode', choices=['check', 'rebuild', 'render'])
    parser.add_argument('--part', choices=['full', 'assembly'], default='full')
    args = parser.parse_args()
    for name in ['检查', '成片']:
        (ROOT / name).mkdir(exist_ok=True)
    if args.mode == 'check':
        run_scene('check_scene.py')
        movie = ROOT / '成片' / '分秒之间.mp4'
        result = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams',
                             '-show_format', '-of', 'json', str(movie)], text=True))
        video = next(s for s in result['streams'] if s['codec_type'] == 'video')
        assert [video['width'], video['height']] == [1920, 1080]
        assert video['r_frame_rate'] == '24/1' and int(video['nb_frames']) == 528
        assert abs(float(result['format']['duration']) - 22) < .05
        print('SOURCE_CHECK_PASSED：真实模型、回装、镜头、打包材质与528帧成片均已核对。')
    elif args.mode == 'rebuild':
        stamp = datetime.now().strftime('%Y%m%d-%H%M%S-%f')
        backup = ROOT / '备份' / stamp
        existing = [ROOT / '分秒之间.blend', ROOT / '帧序列']
        for item in existing:
            if item.exists():
                backup.mkdir(parents=True, exist_ok=True)
                shutil.move(str(item), str(backup / item.name))
        run_scene('build.py', saved=False)
        run_scene('check_scene.py')
        print('真实模型和动画已从源码重建；已有工程及帧保存在备份目录，成片保留。')
    else:
        # Explicit rendering only. The default catalog workflow always reuses the approved film.
        if (ROOT / '帧序列').exists() and any((ROOT / '帧序列').glob('frame_*.png')):
            raise SystemExit('已有渲染帧；请使用双击入口继续制作，或先保留旧帧再重新渲染，避免混入修改前的画面。')
        start, end = (241, 432) if args.part == 'assembly' else (1, 528)
        run_scene('render.py', extra=['--start', str(start), '--end', str(end),
                                     '--samples', '48', '--threshold', '0.05'])
        if args.part == 'full':
            subprocess.run([sys.executable, str(ROOT / '源码' / 'compose.py')], check=True)
        else:
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y', '-framerate',
                            '24', '-start_number', '241', '-i', str(ROOT / '帧序列' / 'frame_%04d.png'),
                            '-frames:v', '192', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p',
                            '-an', str(ROOT / '成片' / '分层拆解与回装.mp4')], check=True)
        print('渲染完成。修改工程后请勿复用旧帧；可用双击入口保护旧帧并完整重渲染。')

if __name__ == '__main__':
    main()
