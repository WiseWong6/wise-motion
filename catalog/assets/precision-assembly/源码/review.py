"""生成无服务器依赖的成片审核页，不启动浏览器。"""
from pathlib import Path
import html
import json

ROOT=Path(__file__).resolve().parents[1]


def build():
    # Use local relative references so the entire directory can be moved intact.
    stills=[('整表','成片/整表.png'),('机芯','成片/机芯.png'),('分层','成片/分层.png')]
    cards='\n'.join(f'<a class="still" href="{html.escape(path)}" target="_blank" rel="noopener"><img src="{html.escape(path)}" alt="{html.escape(label)}高清渲染" loading="lazy"><span>{html.escape(label)}<b aria-hidden="true">↗</b></span></a>' for label,path in stills)
    doc='''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>分秒之间 · 机械怀表</title>
<style>
:root{color-scheme:dark;--bg:#11110f;--panel:#191917;--fg:#eae7de;--muted:#929188;--line:#36362f;--accent:#d7c5a3}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC",sans-serif;-webkit-font-smoothing:antialiased}main{max-width:1680px;margin:auto;padding:52px 48px 42px}header{display:flex;align-items:end;justify-content:space-between;margin-bottom:25px;gap:20px}h1{font-family:"Songti SC","Noto Serif CJK SC",serif;font-weight:400;font-size:30px;letter-spacing:.12em;margin:0}header p{color:var(--muted);font-size:12px;letter-spacing:.1em;margin:0 0 5px}.screen{position:relative;background:#070706;box-shadow:0 18px 70px #0005}video{display:block;width:100%;aspect-ratio:16/9;max-height:84vh;background:#080807;object-fit:contain}video:focus-visible{outline:2px solid var(--accent);outline-offset:5px}.caption{display:flex;justify-content:space-between;gap:20px;font-size:12px;color:var(--muted);margin:15px 0 46px}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.still{display:block;text-decoration:none;color:var(--fg);border-bottom:1px solid var(--line)}.still img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--panel);transition:filter .2s}.still:hover img{filter:brightness(1.09)}.still span{display:flex;justify-content:space-between;padding:13px 0 15px;font-size:13px;color:#c3c0b6}.still b{font-size:15px;font-weight:400;color:var(--muted)}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:39px}.actions a,.actions button{appearance:none;display:inline-flex;align-items:center;justify-content:center;min-height:43px;padding:9px 19px;border:1px solid #48473f;border-radius:3px;background:transparent;color:#d6d2c8;text-decoration:none;font:inherit;font-size:12px;letter-spacing:.04em;cursor:pointer}.actions .primary{background:#d2c2a5;border-color:#d2c2a5;color:#1b1915}.actions a:hover,.actions button:hover{border-color:#bcaf95}.actions a:focus-visible,.actions button:focus-visible,.still:focus-visible{outline:2px solid var(--accent);outline-offset:5px}footer{font-size:11px;color:#77776e;margin-top:34px;letter-spacing:.025em}#status{font-size:12px;color:var(--muted);margin:12px 0 0;min-height:20px}@media(max-width:700px){main{padding:27px 17px 30px}header{align-items:start}h1{font-size:24px}header p{font-size:10px;max-width:90px;text-align:right}.caption{margin-bottom:30px;font-size:10px}.gallery{grid-template-columns:1fr;gap:26px}.actions{gap:8px}.actions a,.actions button{padding:9px 13px}.still span{font-size:12px}.screen{margin-inline:-17px}}
</style>
</head>
<body>
<main>
<header><h1>分秒之间</h1><p>机械怀表 · 22 秒</p></header>
<section class="screen" aria-label="发布短片"><video id="film" controls playsinline preload="metadata" poster="成片/整表.png"><source src="成片/分秒之间.mp4" type="video/mp4">当前预览不支持视频，请使用下方按钮打开成片。</video></section>
<div class="caption"><span>细节、运转、展开与合拢。</span><span>打开下方图像可查看原始尺寸</span></div>
<section class="gallery" aria-label="高清画面">__CARDS__</section>
<nav class="actions" aria-label="作品文件"><button class="primary" type="button" id="play">播放成片</button><a href="分秒之间.blend" download>Blender 工程</a><a href="制作说明.md" target="_blank" rel="noopener">制作说明</a><a href="使用说明.md" target="_blank" rel="noopener">运行方法</a></nav>
<p id="status" aria-live="polite"></p>
<footer>Blender 三维制作 · 原创声音</footer>
</main>
<script>
const film=document.getElementById('film');
const status=document.getElementById('status');
document.getElementById('play').addEventListener('click',()=>{
  if(film.ended)film.currentTime=0;
  film.scrollIntoView({behavior:'smooth',block:'center'});
  const playback=film.play();
  if(playback&&playback.catch)playback.catch(()=>{status.textContent='请点击视频画面中的播放按钮，或直接打开成片文件。';});
});
film.addEventListener('playing',()=>{status.textContent='';});
film.addEventListener('error',()=>{status.innerHTML='视频暂时无法载入。<a href="成片/分秒之间.mp4">直接打开成片</a>';});
</script>
</body>
</html>
'''.replace('__CARDS__',cards)
    out=ROOT/'审核.html'
    out.write_text(doc,encoding='utf-8')
    print(json.dumps({'审核页':str(out),'服务器依赖':False,'视频':str(ROOT/'成片'/'分秒之间.mp4')},ensure_ascii=False,indent=2))


if __name__=='__main__':
    build()
