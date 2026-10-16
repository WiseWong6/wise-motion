// Alpha extents include each pixel footprint after scale/rotation around the case-body anchor.
// Measured from the original PNGs; see verification/v4.1/form-layout-measurement.json.
export const formItems = [
  {
    "id": "left",
    "src": "watch-front.png",
    "sourceSize": [
      1800,
      2400
    ],
    "width": 700,
    "angle": -11,
    "anchorSource": [
      923.5110279969489,
      1310.6218279235932
    ],
    "transformOriginPercent": [
      51.30616822205272,
      54.60924283014972
    ],
    "alphaExtents": {
      "minX": -233.26061330163924,
      "minY": -357.4983831234796,
      "maxX": 233.61585734886276,
      "maxY": 240.02119563232188
    }
  },
  {
    "id": "middle",
    "src": "watch-angle.png",
    "sourceSize": [
      1800,
      2400
    ],
    "width": 720,
    "angle": 0,
    "anchorSource": [
      941.0588769120457,
      1309.1656072317098
    ],
    "transformOriginPercent": [
      52.281048717335864,
      54.54856696798791
    ],
    "alphaExtents": {
      "minX": -212.02355076481825,
      "minY": -366.46624289268397,
      "maxX": 213.17644923518174,
      "maxY": 247.53375710731606
    }
  },
  {
    "id": "right",
    "src": "watch-front.png",
    "sourceSize": [
      1800,
      2400
    ],
    "width": 700,
    "angle": 11,
    "anchorSource": [
      923.5110279969489,
      1310.6218279235932
    ],
    "transformOriginPercent": [
      51.30616822205272,
      54.60924283014972
    ],
    "alphaExtents": {
      "minX": -230.10453343360882,
      "minY": -344.1541164926891,
      "maxX": 230.86695520427944,
      "maxY": 240.6239133996984
    }
  }
];

export function getAlignedFormLayout(offsetY = 0) {
  const canvasWidth = 1920, margin = 96, centerY = 710 + offsetY;
  const widths = formItems.map(({alphaExtents: b}) => b.maxX - b.minX);
  const gap = (canvasWidth - 2 * margin - widths.reduce((a, b) => a + b, 0)) / (formItems.length - 1);
  let visibleLeft = margin;
  return formItems.map((item, i) => {
    const {alphaExtents: b, anchorSource, sourceSize, width} = item;
    const scale = width / sourceSize[0];
    const centerX = visibleLeft - b.minX;
    const result = {...item, gap, centerX, centerY,
      left: centerX - anchorSource[0] * scale,
      top: centerY - anchorSource[1] * scale,
      bounds: {left: visibleLeft, right: visibleLeft + widths[i], top: centerY + b.minY, bottom: centerY + b.maxY},
    };
    visibleLeft += widths[i] + gap;
    return result;
  });
}
