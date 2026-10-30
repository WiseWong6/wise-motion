# Three-dimensional particle reference

This project's `assets/runtime/space3d.js` adapts the Canvas rendering approach
of [nolangz/3D-Chladni](https://github.com/nolangz/3D-Chladni).

- Source: `app/index.html`, commit `74d31fa1abfcb6d0725b557a17b21ea6ce7b0790`.
- Code license: Apache License 2.0, reproduced in `3D-Chladni-Apache-2.0.txt`.
- Techniques adapted: rotation and perspective projection of 3D points,
  depth-dependent point size and lighting, pixel-aligned sharp grains from
  `drawSharpParticle()`, and the sand renderer's ordinary `source-over`
  compositing instead of additive particle bloom.
- Cube modifications: black background with translucent gold-white wires and
  silver-white grains; seeded grains travel along bounded
  curves from scattered positions to thin ellipsoid nodes around semantic
  groups. This is an absolute-time illustration of assembly, not the upstream
  standing-wave force solver. Each 1–3 px grain has an internal white-to-silver
  gradient with transparent edges, without blur, outer halo or star spikes;
  label anchors use the same small gradient grains. Labels and connections share the camera,
  and every frame is evaluated independently for consistent seeking.
- The independent opening/closing background keeps its earlier sparse
  highlight texture; it does not use the cube grain renderer.
- Upstream physical simulation, audio-reactive inputs, presets, images,
  videos, and other media are not included.

The volumes illustrate semantic neighbourhoods; they are not measured model
embeddings or a three-dimensional representation of every original dimension.
