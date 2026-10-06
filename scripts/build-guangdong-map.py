#!/usr/bin/env python3
"""从随包开放地图数据生成内嵌轮廓；--check 只检查，不写入。"""
import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "vendor/guangdong-map/guangdong-cities.geojson"
TARGET = ROOT / "catalog/effects/data-motion.js"
BEGIN = "  // BEGIN GUANGDONG_MAP_DATA\n"
END = "  // END GUANGDONG_MAP_DATA\n"
CITIES = "广州 韶关 深圳 珠海 汕头 佛山 江门 湛江 茂名 肇庆 惠州 梅州 汕尾 河源 阳江 清远 东莞 中山 潮州 揭阳 云浮".split()


def project(point):
    lon, lat = point
    if not (math.isfinite(lon) and math.isfinite(lat) and 109 < lon < 118 and 20 < lat < 26):
        raise ValueError("广东地图坐标超出范围")
    return lon, math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


def generate():
    data = json.loads(DATA.read_text())
    features = data["features"]
    if [f["properties"]["name"] for f in features] != [name + "市" for name in CITIES]:
        raise ValueError("广东地图应按既定顺序包含全部 21 市")
    rings = []
    for feature in features:
        if feature["geometry"]["type"] != "MultiPolygon":
            raise ValueError("广东地图必须由多边形构成")
        city = []
        for polygon in feature["geometry"]["coordinates"]:
            for ring in polygon:
                if len(ring) < 4 or ring[0] != ring[-1]:
                    raise ValueError("广东地图边界未闭合")
                city.append([project(point) for point in ring])
        rings.append(city)
    points = [point for city in rings for ring in city for point in ring]
    xmin, xmax = min(p[0] for p in points), max(p[0] for p in points)
    ymin, ymax = min(p[1] for p in points), max(p[1] for p in points)
    scale = min(442.5 / (xmax - xmin), 415.2272 / (ymax - ymin))

    def coordinate(point):
        x, y = point
        return f"{450 + (x - (xmin + xmax) / 2) * scale:.4f} {300.9 - (y - (ymin + ymax) / 2) * scale:.4f}"

    rows = []
    for feature, city in zip(features, rings):
        path = "".join("M" + "L".join(coordinate(point) for point in ring[:-1]) + "Z" for ring in city)
        rows.append(json.dumps({**feature["properties"], "path": path}, ensure_ascii=False, separators=(",", ":")))
    return BEGIN + "  const regions=[\n    " + ",\n    ".join(rows) + "\n  ];\n" + END


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    source = TARGET.read_text()
    start, end = source.index(BEGIN), source.index(END) + len(END)
    expected = source[:start] + generate() + source[end:]
    if args.check:
        if expected != source:
            raise SystemExit("广东地图内嵌轮廓与随包数据不一致，请重新生成")
        print("广东 21 市地图数据与内嵌轮廓一致")
    else:
        TARGET.write_text(expected)
        print("已生成广东 21 市地图轮廓")
