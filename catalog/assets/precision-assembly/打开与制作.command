#!/bin/bash
# macOS Finder 双击入口。所有项目路径从本文件的位置计算。
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$PROJECT_DIR"
BLEND_FILE="$PROJECT_DIR/分秒之间.blend"
LOCK_DIR="$PROJECT_DIR/检查/.制作入口锁"
OWNS_LOCK=0

finish() {
  result=$?
  if [ "$OWNS_LOCK" -eq 1 ]; then
    rm -f -- "$LOCK_DIR/pid"
    rmdir -- "$LOCK_DIR" 2>/dev/null || true
  fi
  if [ "$result" -ne 0 ]; then
    printf '\n制作未完成，已有工程与画面会保留。请查看上方错误。\n'
  fi
  if [ -t 0 ]; then read -r -p '按回车关闭此窗口。' _finish || true; fi
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
fail() { printf '\n%s\n' "$*" >&2; exit 1; }

if [ -x '/Applications/Blender.app/Contents/MacOS/Blender' ]; then
  BLENDER_BIN='/Applications/Blender.app/Contents/MacOS/Blender'
elif command -v blender >/dev/null 2>&1; then
  BLENDER_BIN="$(command -v blender)"
else
  fail '未找到 Blender。请先将 Blender 放入“应用程序”文件夹，再双击本入口。不会自动安装。'
fi

printf '\n分秒之间 · 打开与制作\n\n'
printf '  1  打开已保存的 Blender 工程\n'
printf '  2  按源码重建工程（旧工程和旧帧会保留）\n'
printf '  3  继续渲染，并合成视频与审核页\n'
printf '  0  退出\n\n'
read -r -p '请选择 [0–3]：' choice
case "$choice" in
  0|'') exit 0 ;;
  1)
    [ -f "$BLEND_FILE" ] || fail '工程文件缺失。请先选择“重建工程”。'
    if [ "$BLENDER_BIN" = '/Applications/Blender.app/Contents/MacOS/Blender' ]; then
      open -a '/Applications/Blender.app' "$BLEND_FILE"
    else
      "$BLENDER_BIN" "$BLEND_FILE" >/dev/null 2>&1 &
    fi
    printf '\n已交给 Blender 打开。\n'
    exit 0 ;;
  2|3) ;;
  *) fail '没有执行任何制作操作；请输入 0、1、2 或 3。' ;;
esac

command -v python3 >/dev/null 2>&1 || fail '未找到 python3，请先安装后重试。'
PYTHON_BIN="$(command -v python3)"
# 此处也识别已从终端启动的 produce.py / Blender 渲染；不停止任何进程。
"$PYTHON_BIN" - "$PROJECT_DIR" <<'PY'
import os, subprocess, sys
from pathlib import Path
root=Path(sys.argv[1]).resolve()
processes=subprocess.check_output(['ps','-axo','pid=,command='],text=True)
found=[]
for row in processes.splitlines():
    fields=row.strip().split(None,1)
    if len(fields)!=2:continue
    pid,command=fields
    if int(pid)==os.getpid():continue
    work_script=any(name in command for name in ['produce.py','render.py','build.py','compose.py'])
    if not work_script:continue
    belongs=str(root) in command
    # 相对路径启动的脚本，再检查其实际工作目录。
    if not belongs:
        try:
            result=subprocess.run(['/usr/sbin/lsof','-a','-p',pid,'-d','cwd','-Fn'],capture_output=True,text=True,timeout=3)
            for line in result.stdout.splitlines():
                if line.startswith('n'):
                    try:belongs=Path(line[1:]).resolve().is_relative_to(root)
                    except (ValueError,AttributeError):belongs=str(Path(line[1:]).resolve()).startswith(str(root)+'/') or Path(line[1:]).resolve()==root
        except (OSError,subprocess.TimeoutExpired):pass
    if belongs:found.append(pid)
if found:
    print('本项目已有制作进程正在运行（进程 '+', '.join(found)+'）。请等待完成后再使用入口；本次没有启动第二次制作。',file=sys.stderr)
    raise SystemExit(1)
PY

mkdir -p "$PROJECT_DIR/检查" "$PROJECT_DIR/成片"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  [ -f "$LOCK_DIR/pid" ] || fail '另一个入口可能正在初始化，请稍后重试。若上次异常关闭，请先检查“检查/.制作入口锁”。'
  old_pid="$(cat "$LOCK_DIR/pid")"
  if [[ "$old_pid" =~ ^[0-9]+$ ]] && kill -0 "$old_pid" 2>/dev/null; then
    fail "另一个制作入口正在运行（进程 $old_pid），本次没有重复启动。"
  fi
  # 只移除本入口留下的过期锁；若目录含未知文件则安全停止。
  rm -f -- "$LOCK_DIR/pid"
  rmdir -- "$LOCK_DIR" 2>/dev/null || fail '制作锁目录中存在未知文件，请先检查“检查/.制作入口锁”。'
  mkdir "$LOCK_DIR" || fail '另一个入口刚刚开始运行，请稍后再试。'
fi
printf '%s\n' "$$" > "$LOCK_DIR/pid"
OWNS_LOCK=1
RUN_ID="$(date '+%Y%m%d-%H%M%S')-$$"
BACKUP_DIR="$PROJECT_DIR/备份/$RUN_ID"

archive_frames() {
  if [ -d "$PROJECT_DIR/帧序列" ]; then
    mkdir -p "$BACKUP_DIR"
    mv -- "$PROJECT_DIR/帧序列" "$BACKUP_DIR/帧序列"
    printf '旧画面已保留到：%s\n' "$BACKUP_DIR/帧序列"
  fi
  if [ -f "$PROJECT_DIR/检查/帧缓存.json" ]; then
    mkdir -p "$BACKUP_DIR"
    mv -- "$PROJECT_DIR/检查/帧缓存.json" "$BACKUP_DIR/帧缓存.json"
  fi
}

if [ "$choice" = 2 ]; then
  [ -f "$PROJECT_DIR/源码/build.py" ] || fail '缺少 源码/build.py，请保持整个项目目录完整。'
  printf '\n将按源码重建工程；已有成片保留，之后选择 3 才会更新视频。\n'
  if [ -f "$BLEND_FILE" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -p -- "$BLEND_FILE" "$BACKUP_DIR/分秒之间.blend"
    printf '旧工程已备份到：%s\n' "$BACKUP_DIR/分秒之间.blend"
  fi
  archive_frames
  "$BLENDER_BIN" -b --python-exit-code 1 --python "$PROJECT_DIR/源码/build.py" 2>&1 | tee "$PROJECT_DIR/检查/入口重建-$RUN_ID.log"
  printf '\n工程重建完成。可先选择 1 查看，再选择 3 制作视频。\n'
  exit 0
fi

[ -f "$BLEND_FILE" ] || fail '缺少 分秒之间.blend，请先选择 2 重建工程。'
for program in ffmpeg ffprobe; do
  command -v "$program" >/dev/null 2>&1 || fail "未找到 $program，请先安装 FFmpeg 后重试。不会自动安装。"
done
for source in render.py compose.py review.py; do
  [ -f "$PROJECT_DIR/源码/$source" ] || fail "缺少 源码/$source，请保持整个项目目录完整。"
done
[ -f "$PROJECT_DIR/成片/分秒之间-声轨.wav" ] || fail '缺少随项目交付的声轨 成片/分秒之间-声轨.wav。请恢复此文件后重试；入口不会自动安装声音生成依赖。'
BLENDER_VERSION="$("$BLENDER_BIN" --version)"
BLENDER_VERSION="${BLENDER_VERSION%%$'\n'*}"
export PROJECT_DIR BLENDER_VERSION

# 正常继续仅复用同一保存工程、同一渲染程序和同一质量设置产生的缓存。
cache_state="$("$PYTHON_BIN" - <<'PY'
import hashlib,json,os
from pathlib import Path
r=Path(os.environ['PROJECT_DIR'])
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
sig={'blend':sha(r/'分秒之间.blend'),'renderer':sha(r/'源码/render.py'),'blender':os.environ['BLENDER_VERSION'],'samples':48,'threshold':.05,'scale':100,'frames':528,'fps':24}
p=r/'检查/帧缓存.json'
has_frames=(r/'帧序列').exists() and any((r/'帧序列').glob('frame_*.png'))
if not has_frames:print('empty')
elif not p.exists():print('unknown')
else:
    try:print('same' if json.loads(p.read_text()).get('signature')==sig else 'changed')
    except (ValueError,OSError):print('unknown')
PY
)"
case "$cache_state" in
  unknown)
    printf '\n已有画面尚未关联工程记录，无法自动判断它们是否来自当前工程。\n'
    printf '  1  确认工程及渲染设置没有改过，继续已有画面\n'
    printf '  2  另存旧画面，完整重新渲染\n'
    printf '  0  退出，先检查工程\n'
    read -r -p '请选择 [0–2]：' cache_choice
    case "$cache_choice" in
      1) ;;
      2) archive_frames ;;
      *) printf '没有开始渲染。\n'; exit 0 ;;
    esac ;;
  changed)
    printf '\n工程、渲染程序或质量设置与缓存记录不一致，将另存旧画面后重新渲染。\n'
    archive_frames ;;
  empty|same) ;;
  *) fail '无法判断帧缓存状态，未开始渲染。' ;;
esac

# 过往中断可能留下损坏 PNG；逐个检查尺寸、块校验和与文件尾，坏帧另存后补渲染。
"$PYTHON_BIN" - "$RUN_ID" <<'PY'
import hashlib,json,os,struct,sys,zlib
from pathlib import Path
r=Path(os.environ['PROJECT_DIR']);frames=r/'帧序列';frames.mkdir(exist_ok=True)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def valid(p):
    try:
        with p.open('rb') as f:
            if f.read(8)!=b'\x89PNG\r\n\x1a\n':return False
            first=True;image_data=False
            while True:
                header=f.read(8)
                if len(header)!=8:return False
                n,kind=struct.unpack('>I4s',header)
                if n>100_000_000:return False
                block=f.read(n);checksum=f.read(4)
                if len(block)!=n or len(checksum)!=4:return False
                if zlib.crc32(kind+block)&0xffffffff!=struct.unpack('>I',checksum)[0]:return False
                if first:
                    if kind!=b'IHDR' or n!=13 or struct.unpack('>II',block[:8])!=(1920,1080):return False
                    first=False
                image_data=image_data or kind==b'IDAT'
                if kind==b'IEND':return image_data and n==0 and not f.read(1)
    except (OSError,ValueError,struct.error):return False
bad=[];good=0
for p in sorted(frames.glob('frame_*.png')):
    try:number=int(p.stem.split('_')[-1])
    except ValueError:continue
    if not 1<=number<=528:continue
    if valid(p):good+=1
    else:
        dest=r/'备份'/sys.argv[1]/'损坏画面';dest.mkdir(parents=True,exist_ok=True)
        p.rename(dest/p.name);bad.append(p.name)
sig={'blend':sha(r/'分秒之间.blend'),'renderer':sha(r/'源码/render.py'),'blender':os.environ['BLENDER_VERSION'],'samples':48,'threshold':.05,'scale':100,'frames':528,'fps':24}
(r/'检查/帧缓存.json').write_text(json.dumps({'signature':sig,'valid_before_render':good,'invalid_archived':bad},ensure_ascii=False,indent=2)+'\n')
print(f'可复用 {good} / 528 帧；将补齐其余画面。')
if bad:print(f'发现 {len(bad)} 张损坏画面，已另存，稍后重新渲染。')
PY

printf '\n开始制作。渲染较久，可按 Control+C 停止，下次继续。\n'
printf '过程中请不要保存改动到当前工程。\n'
{
  printf '\n正在补齐动画画面……\n'
  "$BLENDER_BIN" -b "$BLEND_FILE" --python-exit-code 1 -t 8 --python "$PROJECT_DIR/源码/render.py" -- --samples 48 --threshold 0.05
  printf '\n正在渲染三张高清画面……\n'
  "$BLENDER_BIN" -b "$BLEND_FILE" --python-exit-code 1 -t 8 --python "$PROJECT_DIR/源码/render.py" -- --stills --samples 96 --threshold 0.025 --scale 200
  printf '\n正在合成并核对视频……\n'
  "$PYTHON_BIN" "$PROJECT_DIR/源码/compose.py"
  "$PYTHON_BIN" "$PROJECT_DIR/源码/review.py"
} 2>&1 | tee "$PROJECT_DIR/检查/入口制作-$RUN_ID.log"
printf '\n已完成：%s\n' "$PROJECT_DIR/成片/分秒之间.mp4"
printf '双击“审核.html”即可查看；不需要启动服务器。\n'
