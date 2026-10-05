"""导出原字体的网页格式；保留原名、完整字符、字体数据和 OFL 许可。"""
from pathlib import Path
import argparse
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import compress

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
text = ''.join(p.read_text() for p in (root / 'catalog').rglob('*')
               if p.suffix in {'.js', '.json', '.html', '.css'})
chinese = {ord(c) for c in text if 0x3400 <= ord(c) <= 0x9fff}
sources = [
    ('SourceHanSansCN-Light.otf', 'SourceHanSansSC-Light'),
    ('SourceHanSansSC-Regular.otf', 'SourceHanSansSC-Regular'),
    ('SourceHanSansSC-Bold.otf', 'SourceHanSansSC-Bold'),
    ('LXGWWenKai-Regular.ttf', 'LXGWWenKai-Regular'),
]
for filename, original_name in sources:
    target = root / 'catalog/fonts' / f'{original_name}.woff2'
    if not args.check:
        # 只压缩完整原字体，不裁剪字符、不重命名，也不改写字形或排版数据。
        compress(Path.home() / 'Library/Fonts' / filename, target, transform_tables=[])
    with TTFont(target) as font:
        if font['name'].getDebugName(6) != original_name:
            raise SystemExit(f'{target.name} 未保留原字体名称')
        missing = chinese - set(font.getBestCmap())
        if missing:
            raise SystemExit(f'{target.name} 缺少字形：' + ''.join(chr(n) for n in sorted(missing)))
        print(f'{target.name}：保留原字体名称，目录全部 {len(chinese)} 个汉字已覆盖；'
              f'字体包含 {len(font.getBestCmap())} 个字符。')
