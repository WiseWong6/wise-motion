// Copied from 月亮穿梭/butterfly-time-slices/src/butterfly.js.
// Only the browser-global wrapper has changed; all source geometry is preserved.

  /**
   * Shared, texture-free butterfly geometry for Three.js r180.
   * Wings are the RIGHT half only: mirror x, then rotate about local Y to flap.
   * Membrane, veins and outline share z=0; use polygonOffset on the membrane.
   * bodyGeometry and antennaGeometry describe the complete, central body.
   */
export function createButterflyGeometry(T) {
    if (!T || !T.ShapeGeometry || !T.BufferGeometry) {
      throw new TypeError('createButterflyGeometry requires the THREE namespace.');
    }

    // An indexed merge keeps all shared assets compact, without another module.
    function mergeGeometries(parts) {
      const merged = new T.BufferGeometry();
      const names = Object.keys(parts[0].attributes);
      const totalVertices = parts.reduce((n, g) => n + g.attributes.position.count, 0);
      let vertexOffset = 0;
      const indices = [];
      const arrays = {};
      for (const name of names) {
        arrays[name] = new Float32Array(totalVertices * parts[0].attributes[name].itemSize);
      }
      for (const part of parts) {
        for (const name of names) {
          const attribute = part.attributes[name];
          if (!attribute || attribute.itemSize !== parts[0].attributes[name].itemSize) {
            throw new Error('Butterfly geometry attribute mismatch: ' + name);
          }
          arrays[name].set(attribute.array, vertexOffset * attribute.itemSize);
        }
        if (part.index) {
          for (let i = 0; i < part.index.count; i++) indices.push(part.index.getX(i) + vertexOffset);
        } else {
          for (let i = 0; i < part.attributes.position.count; i++) indices.push(i + vertexOffset);
        }
        vertexOffset += part.attributes.position.count;
      }
      for (const name of names) {
        merged.setAttribute(name, new T.BufferAttribute(arrays[name], parts[0].attributes[name].itemSize));
      }
      merged.setIndex(indices);
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      for (const part of parts) part.dispose();
      return merged;
    }

    function forewingShape() {
      const s = new T.Shape();
      s.moveTo(0, 0.085);
      s.bezierCurveTo(0.15, 0.33, 0.58, 0.73, 1.095, 0.855);
      s.bezierCurveTo(1.235, 0.892, 1.355, 0.891, 1.34, 0.805);
      s.bezierCurveTo(1.32, 0.697, 1.075, 0.538, 0.979, 0.384);
      s.bezierCurveTo(0.897, 0.174, 0.591, 0.09, 0.294, -0.018);
      s.bezierCurveTo(0.147, -0.071, 0.03, -0.038, 0, 0.035);
      s.closePath();
      return s;
    }

    function hindwingShape() {
      const s = new T.Shape();
      s.moveTo(0.008, 0.049);
      s.bezierCurveTo(0.161, 0.074, 0.478, 0.071, 0.604, -0.111);
      s.bezierCurveTo(0.746, -0.293, 0.692, -0.573, 0.552, -0.798);
      s.bezierCurveTo(0.475, -0.93, 0.387, -0.942, 0.301, -0.831);
      s.bezierCurveTo(0.138, -0.633, 0.078, -0.336, 0.008, -0.102);
      s.bezierCurveTo(-0.002, -0.053, 0, 0.005, 0.008, 0.049);
      s.closePath();
      return s;
    }

    const foreShape = forewingShape();
    const hindShape = hindwingShape();
    const wingGeometry = mergeGeometries([
      new T.ShapeGeometry(foreShape, 96),
      new T.ShapeGeometry(hindShape, 96)
    ]);
    const positions = wingGeometry.attributes.position;
    const uv = new Float32Array(positions.count * 2);
    const colors = new Float32Array(positions.count * 3);
    const rootColor = new T.Color('#fffde8');
    const lemonColor = new T.Color('#fff2a8');
    const tipColor = new T.Color('#fffbdc');
    const color = new T.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      uv[i * 2] = x / 1.35;
      uv[i * 2 + 1] = (y + 0.95) / 1.85;
      const distance = Math.min(1, Math.hypot(x, y * 0.63) / 1.36);
      color.copy(rootColor).lerp(lemonColor, Math.min(1, distance * 2.9));
      color.lerp(tipColor, Math.max(0, (distance - 0.62) / 0.38));
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    wingGeometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
    wingGeometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    wingGeometry.name = 'Butterfly/right-fore-and-hind-membranes';
    wingGeometry.userData.colorSpace = 'linear-srgb';
    wingGeometry.userData.uv = 'u=x/1.35, v=(y+0.95)/1.85';

    function lineGeometry(segments, name) {
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(segments, 3));
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      geometry.name = name;
      return geometry;
    }

    function addCurve(target, p0, p1, p2, p3, count) {
      const curve = new T.CubicBezierCurve3(
        new T.Vector3(p0[0], p0[1], 0), new T.Vector3(p1[0], p1[1], 0),
        new T.Vector3(p2[0], p2[1], 0), new T.Vector3(p3[0], p3[1], 0)
      );
      const points = curve.getPoints(count || 20);
      for (let i = 1; i < points.length; i++) {
        target.push(points[i - 1].x, points[i - 1].y, 0, points[i].x, points[i].y, 0);
      }
    }

    const veins = [];
    // A few continuous ribs, with thinner-looking short forks, read through glow.
    // Every endpoint stays just inside the membrane so it cannot produce spurs.
    const foreVeins = [
      [[0.035, 0.106], [0.25, 0.304], [0.72, 0.63], [1.267, 0.827]],
      [[0.049, 0.112], [0.267, 0.248], [0.626, 0.334], [0.976, 0.437]],
      [[0.059, 0.088], [0.264, 0.138], [0.631, 0.165], [0.842, 0.234]],
      [[0.063, 0.066], [0.152, 0.019], [0.34, 0.024], [0.567, 0.091]],
      [[0.275, 0.312], [0.359, 0.419], [0.479, 0.509], [0.647, 0.622]],
      [[0.501, 0.46], [0.614, 0.562], [0.806, 0.692], [0.93, 0.759]],
      [[0.711, 0.589], [0.845, 0.633], [1.054, 0.659], [1.166, 0.692]],
      [[0.481, 0.302], [0.598, 0.386], [0.765, 0.453], [0.988, 0.539]],
      [[0.611, 0.343], [0.66, 0.333], [0.78, 0.315], [0.899, 0.313]],
      [[0.289, 0.152], [0.359, 0.126], [0.434, 0.114], [0.504, 0.086]]
    ];
    const hindVeins = [
      [[0.045, -0.002], [0.231, -0.083], [0.528, -0.132], [0.626, -0.243]],
      [[0.047, -0.018], [0.294, -0.147], [0.494, -0.363], [0.614, -0.598]],
      [[0.044, -0.031], [0.17, -0.18], [0.408, -0.426], [0.477, -0.854]],
      [[0.04, -0.053], [0.104, -0.282], [0.252, -0.571], [0.332, -0.808]],
      [[0.274, -0.207], [0.386, -0.241], [0.505, -0.26], [0.659, -0.349]],
      [[0.333, -0.343], [0.429, -0.355], [0.556, -0.396], [0.624, -0.466]],
      [[0.351, -0.433], [0.433, -0.478], [0.515, -0.607], [0.532, -0.741]],
      [[0.149, -0.299], [0.2, -0.326], [0.259, -0.379], [0.347, -0.425]]
    ];
    for (const c of foreVeins.concat(hindVeins)) addCurve(veins, c[0], c[1], c[2], c[3], 20);
    const veinGeometry = lineGeometry(veins, 'Butterfly/right-wing-veins');

    const edges = [];
    for (const shape of [foreShape, hindShape]) {
      const points = shape.getSpacedPoints(144);
      for (let i = 1; i < points.length; i++) {
        edges.push(points[i - 1].x, points[i - 1].y, 0, points[i].x, points[i].y, 0);
      }
    }
    const edgeGeometry = lineGeometry(edges, 'Butterfly/right-wing-fine-outline');

    function ellipsoid(x, y, z, sx, sy, sz, widthSegments, heightSegments) {
      const g = new T.SphereGeometry(1, widthSegments || 10, heightSegments || 8);
      g.scale(sx, sy, sz);
      g.translate(x, y, z);
      return g;
    }
    const bodyGeometry = mergeGeometries([
      ellipsoid(0, -0.176, 0.012, 0.03, 0.222, 0.032, 10, 10),
      ellipsoid(0, 0.073, 0.018, 0.047, 0.137, 0.044),
      ellipsoid(0, 0.228, 0.022, 0.053, 0.058, 0.047)
    ]);
    bodyGeometry.name = 'Butterfly/complete-body';

    const antennae = [];
    for (const sign of [-1, 1]) {
      addCurve(antennae,
        [sign * 0.021, 0.263], [sign * 0.055, 0.361],
        [sign * 0.154, 0.433], [sign * 0.205, 0.463], 28);
      addCurve(antennae,
        [sign * 0.205, 0.463], [sign * 0.236, 0.481],
        [sign * 0.245, 0.472], [sign * 0.236, 0.456], 10);
    }
    const antennaGeometry = lineGeometry(antennae, 'Butterfly/complete-antennae');

    return {
      wingGeometry,
      veinGeometry,
      edgeGeometry,
      bodyGeometry,
      antennaGeometry,
      dimensions: { width: 2.7, height: 1.8 }
    };
}

