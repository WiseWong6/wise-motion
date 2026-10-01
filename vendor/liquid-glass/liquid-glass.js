/*!
 * liquid-glass.js — Apple-style liquid glass refraction for any element.
 *
 * Usage:
 *   <script src="liquid-glass.js"></script>
 *   const glass = liquidGlass(document.querySelector('.my-card'), { scale: -112 });
 *
 * The module owns the SVG filter, displacement map, backdrop-filter wiring,
 * resize handling, and the frosted-blur fallback for browsers that can't do
 * SVG-filtered backdrops (Safari, Firefox). Visual dressing (tint, inner
 * highlight, glare, shadows) stays in your CSS — see GLASS.md for the recipe.
 *
 * Technique per https://aave.com/design/building-glass-for-the-web and
 * https://github.com/rizroze/liquid-glass
 *
 * Copyright (c) 2026 Deepika Rao. MIT License, see LICENSE.
 * Wise Motion adaptation: guard missing browser APIs, clean up failed setup
 * and remove the shared SVG host when its last instance is destroyed.
 */
(function (global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  let uid = 0;
  let svgDefs = null;

  // Chromium can apply SVG filters via backdrop-filter; Safari and Firefox
  // silently no-op, so they get the frosted fallback instead.
  const supported = (() => {
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    if (isSafari || isFirefox) return false;
    if (!global.CSS || !CSS.supports("backdrop-filter", "url(#lg)") ||
        typeof ResizeObserver === "undefined") return false;
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 4;
      c.getContext("2d").getImageData(0, 0, 1, 1);
      return true;
    } catch (_) {
      return false;
    }
  })();

  function removeFilter(filter) {
    filter.remove();
    if (svgDefs && !svgDefs.childNodes.length) {
      svgDefs.parentNode.remove();
      svgDefs = null;
    }
  }

  function ensureDefs() {
    if (svgDefs) return svgDefs;
    const svg = document.createElementNS(SVG_NS, "svg");
    // width/height 0 keeps it renderable (display:none would break feImage)
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svgDefs = document.createElementNS(SVG_NS, "defs");
    svg.appendChild(svgDefs);
    document.body.appendChild(svg);
    return svgDefs;
  }

  // Displacement map, gradient-difference method: a red left->right ramp
  // encodes X displacement, a blue top->bottom ramp encodes Y ("difference"
  // keeps both since the channels are disjoint). A blurred, inset 50%-gray
  // rounded rect neutralizes the interior, confining the refraction bulge to
  // an edge band whose curvature is set by the blur radius.
  function makeMap(w, h, radius, border, mapBlur) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const gx = ctx.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, "rgb(0,0,0)");
    gx.addColorStop(1, "rgb(255,0,0)");
    ctx.fillStyle = gx;
    ctx.fillRect(0, 0, w, h);

    const gy = ctx.createLinearGradient(0, 0, 0, h);
    gy.addColorStop(0, "rgb(0,0,0)");
    gy.addColorStop(1, "rgb(0,0,255)");
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = gy;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "source-over";
    const inset = border * Math.min(w, h);
    ctx.filter = "blur(" + mapBlur + "px)";
    ctx.fillStyle = "rgba(128,128,128,0.93)";
    ctx.beginPath();
    ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2,
                  Math.max(radius - inset, 2));
    ctx.fill();
    ctx.filter = "none";
    return canvas.toDataURL();
  }

  // Three displacement passes at staggered scales (R strongest), channels
  // isolated with feColorMatrix and recombined with screen blends — the
  // faint prism fringe at the rim.
  function buildFilter(id, scales) {
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");
    // Load-bearing: filters default to linearRGB, which re-maps the map's
    // neutral gray 128 to ~0.216 and injects a constant phantom displacement.
    filter.setAttribute("color-interpolation-filters", "sRGB");

    const feImage = document.createElementNS(SVG_NS, "feImage");
    feImage.setAttribute("x", "0");
    feImage.setAttribute("y", "0");
    feImage.setAttribute("result", "map");
    feImage.setAttribute("preserveAspectRatio", "none");
    filter.appendChild(feImage);

    const keep = [
      "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
      "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
      "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
    ];
    const channels = [];
    for (let i = 0; i < 3; i++) {
      const disp = document.createElementNS(SVG_NS, "feDisplacementMap");
      disp.setAttribute("in", "SourceGraphic");
      disp.setAttribute("in2", "map");
      disp.setAttribute("scale", scales[i]);
      disp.setAttribute("xChannelSelector", "R");
      disp.setAttribute("yChannelSelector", "B");
      disp.setAttribute("result", "d" + i);
      filter.appendChild(disp);

      const cm = document.createElementNS(SVG_NS, "feColorMatrix");
      cm.setAttribute("in", "d" + i);
      cm.setAttribute("type", "matrix");
      cm.setAttribute("values", keep[i]);
      cm.setAttribute("result", "c" + i);
      filter.appendChild(cm);
      channels.push("c" + i);
    }

    const blend1 = document.createElementNS(SVG_NS, "feBlend");
    blend1.setAttribute("in", channels[0]);
    blend1.setAttribute("in2", channels[1]);
    blend1.setAttribute("mode", "screen");
    blend1.setAttribute("result", "c01");
    filter.appendChild(blend1);

    const blend2 = document.createElementNS(SVG_NS, "feBlend");
    blend2.setAttribute("in", "c01");
    blend2.setAttribute("in2", channels[2]);
    blend2.setAttribute("mode", "screen");
    filter.appendChild(blend2);

    ensureDefs().appendChild(filter);
    return { filter, feImage };
  }

  function resolveRadius(el, w, h, override) {
    if (override != null) return override;
    const raw = getComputedStyle(el).borderTopLeftRadius || "0px";
    const v = parseFloat(raw) || 0;
    return raw.trim().endsWith("%") ? (v / 100) * Math.min(w, h) : v;
  }

  /**
   * Apply liquid glass to an element.
   *
   * @param {Element} el
   * @param {Object} [opts]
   * @param {number} [opts.scale=-112]     Displacement strength (negative = magnifying bulge).
   * @param {number} [opts.chroma=6]       Per-channel scale stagger; 0 disables the prism fringe.
   * @param {number} [opts.border=0.07]    Neutral inset as a fraction of the smaller side.
   * @param {number} [opts.mapBlur=12]     Edge-curvature softness (px) of the map's gray inset.
   * @param {number} [opts.blur=3]         Backdrop blur (px) behind the glass interior.
   * @param {number} [opts.saturate=1.5]   Backdrop saturation boost.
   * @param {number} [opts.radius]         Corner radius override (px); default reads border-radius.
   * @param {number} [opts.fallbackBlur=16] Frosted blur (px) where refraction is unsupported.
   * @returns {{supported: boolean, refresh: Function, destroy: Function}}
   */
  function liquidGlass(el, opts) {
    const o = Object.assign(
      { scale: -112, chroma: 6, border: 0.07, mapBlur: 12,
        blur: 3, saturate: 1.5, radius: null, fallbackBlur: 16 },
      opts
    );

    if (!supported) {
      const frosted = "blur(" + o.fallbackBlur + "px) saturate(" + o.saturate + ")";
      el.style.backdropFilter = frosted;
      el.style.webkitBackdropFilter = frosted;
      el.classList.add("lg-fallback");
      return { supported: false, refresh: function () {}, destroy: function () {
        el.style.backdropFilter = "";
        el.style.webkitBackdropFilter = "";
        el.classList.remove("lg-fallback");
      } };
    }

    const id = "lg-filter-" + (++uid);
    const scales = [o.scale, o.scale + o.chroma, o.scale + 2 * o.chroma];
    const parts = buildFilter(id, scales);

    function refresh() {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const radius = resolveRadius(el, w, h, o.radius);
      parts.feImage.setAttribute("href", makeMap(w, h, radius, o.border, o.mapBlur));
      parts.feImage.setAttribute("width", w);
      parts.feImage.setAttribute("height", h);
    }

    try {
      refresh();
    } catch (error) {
      removeFilter(parts.filter);
      throw error;
    }
    el.style.backdropFilter =
      "url(#" + id + ") blur(" + o.blur + "px) saturate(" + o.saturate + ")";

    let timer = null;
    const ro = new ResizeObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(refresh, 120);
    });
    ro.observe(el);

    return {
      supported: true,
      refresh: refresh,
      destroy: function () {
        ro.disconnect();
        clearTimeout(timer);
        removeFilter(parts.filter);
        el.style.backdropFilter = "";
      },
    };
  }

  global.liquidGlass = liquidGlass;
})(window);
