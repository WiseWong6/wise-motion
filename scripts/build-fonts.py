"""补齐目录实际用字；读取本机思源黑体，保留 OFL 并使用独立字体族名。"""
from pathlib import Path
import argparse
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
text = ''.join(p.read_text() for p in (root / 'catalog').rglob('*')
               if p.suffix in {'.js', '.json', '.html', '.css'})
used = {ord(c) for c in text}
chinese = {n for n in used if 0x3400 <= n <= 0x9fff}
sources = {'Light': 'SourceHanSansCN-Light.otf', 'Regular': 'SourceHanSansSC-Regular.otf', 'Bold': 'SourceHanSansSC-Bold.otf'}
for weight, filename in sources.items():
    target = root / 'catalog/fonts' / f'WiseMotionSans-{weight}.woff2'
    if not args.check:
        # 补字时保留已有字符，避免删减旧示例或本机预览使用的字形。
        existing = set()
        if target.exists():
            with TTFont(target) as previous:
                existing = set(previous.getBestCmap())
        font = TTFont(Path.home() / 'Library/Fonts' / filename)
        options = subset.Options()
        options.name_IDs = ['*']
        options.name_legacy = True
        options.name_languages = ['*']
        sub = subset.Subsetter(options=options)
        sub.populate(unicodes=(used | existing) & set(font.getBestCmap()))
        sub.subset(font)
        names = {1: 'Wise Motion Sans', 2: weight, 3: f'WiseMotionSans-{weight}',
                 4: f'Wise Motion Sans {weight}', 6: f'WiseMotionSans-{weight}',
                 16: 'Wise Motion Sans', 17: weight}
        for record in font['name'].names:
            if record.nameID in names:
                record.string = names[record.nameID].encode(record.getEncoding())
        if 'CFF ' in font:
            cff = font['CFF '].cff
            cff.fontNames = [f'WiseMotionSans-{weight}']
            cff.topDictIndex[0].FamilyName = 'Wise Motion Sans'
            cff.topDictIndex[0].FullName = f'Wise Motion Sans {weight}'
        font.flavor = 'woff2'
        font.save(target)
    font = TTFont(target)
    missing = chinese - set(font.getBestCmap())
    if missing:
        raise SystemExit(f'{weight} 缺少字形：' + ''.join(chr(n) for n in sorted(missing)))
    print(f'{weight}：目录全部 {len(chinese)} 个汉字已覆盖；字体包含 {len(font.getBestCmap())} 个字符。')
