/*!
 * IMAGO butterfly: scroll-driven 3D origami animation.
 *
 * Reads the supplied artwork (/IMAGO_butterfly.svg) and rebuilds it as folding 3D facets on a
 * <canvas>: the wings fold and open, the camera turns and pushes in, and a key light sweeps the
 * facets, all driven by scroll position. A built-in copy of the final artwork geometry is used if
 * the SVG cannot be fetched. Decorative only: keep the canvas aria-hidden.
 *
 * Same markup and data-attributes as before:
 *   <section data-butterfly-track> ... sticky stage ...
 *     <canvas data-butterfly data-artwork="/IMAGO_butterfly.svg" data-offset="92"
 *             data-background="#265ae3" data-deep="#0c329d" data-zoom="3" data-mobile-zoom="3">
 *
 * Options (data-attribute or ImagoButterfly.mount(canvas, {...})):
 *   artwork, cycles 2.5, fold 78, yaw 30, zoom 3, mobileZoom 3, shadow 0.4,
 *   background #265ae3, deep #0c329d, shadowColor #06195a, offset 92, idle true, track
 */
(function (root) {
  'use strict';

  var DEFAULTS = {
    artwork: '/IMAGO_butterfly.svg',
    cycles: 2.5,
    fold: 78,
    yaw: 30,
    zoom: 3,
    mobileZoom: 3,
    shadow: 0.4,
    background: '#265ae3',
    deep: '#0c329d',
    shadowColor: '#06195a',
    offset: 92,
    idle: true
  };
  var RAD = Math.PI / 180;
  var SPAN = 458;                       // model width in units (keeps the tuned camera maths)
  var L_BASE = [-0.45, 0.6, 0.66];

  // ---- Built-in copy of the final artwork (viewBox 122.73 x 111.93) -------------------------
  // tone: 1 = bright (#265ae3), 0 = deep (#0c329d)
  var FALLBACK = {
    w: 122.73, h: 111.93, light: '#265ae3', deep: '#0c329d',
    polys: [
      { t: 0, p: [[58.42,89.9],[29.69,111.93],[54.13,45.72]] },
      { t: 0, p: [[21.02,62.01],[32.32,71.73],[54.13,45.72],[14.72,56.76]] },
      { t: 0, p: [[64.31,89.38],[93.04,111.41],[68.61,45.2]] },
      { t: 0, p: [[101.71,61.48],[90.41,71.2],[68.6,45.19],[108.01,56.22]] },
      { t: 0, p: [[61.3,88.09],[65.83,37.52],[56.79,37.52]] },
      { t: 1, p: [[0,0.53],[53.6,37.66],[54.13,45.72],[14.72,56.76]] },
      { t: 1, p: [[15.29,91.82],[29.7,111.93],[54.14,45.72]] },
      { t: 1, p: [[122.73,0],[69.13,37.13],[68.61,45.2],[108.02,56.23]] },
      { t: 1, p: [[107.44,91.29],[93.03,111.4],[68.6,45.19]] },
      { t: 1, p: [[56.79,37.53],[65.83,37.53],[61.22,32.49]] }
    ]
  };

  // ---- Minimal SVG reader (M/L/H/V/Z, absolute + relative) ----------------------------------
  function parsePath(d) {
    var tok = d.match(/[MmLlHhVvZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
    var polys = [], cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = '', i = 0;
    var num = function () { return parseFloat(tok[i++]); };
    var isCmd = function (s) { return /^[MmLlHhVvZz]$/.test(s); };
    function close() {
      if (cur && cur.length > 2) {
        var a = cur[0], b = cur[cur.length - 1];
        if (Math.abs(a[0] - b[0]) < 0.05 && Math.abs(a[1] - b[1]) < 0.05) cur.pop();
        polys.push(cur);
      }
      cur = null;
    }
    while (i < tok.length) {
      if (isCmd(tok[i])) cmd = tok[i++];
      switch (cmd) {
        case 'M': case 'm':
          close();
          x = (cmd === 'm' ? x : 0) + num(); y = (cmd === 'm' ? y : 0) + num();
          sx = x; sy = y; cur = [[x, y]]; cmd = cmd === 'm' ? 'l' : 'L'; break;
        case 'L': case 'l':
          x = (cmd === 'l' ? x : 0) + num(); y = (cmd === 'l' ? y : 0) + num();
          if (cur) cur.push([x, y]); break;
        case 'H': case 'h': x = (cmd === 'h' ? x : 0) + num(); if (cur) cur.push([x, y]); break;
        case 'V': case 'v': y = (cmd === 'v' ? y : 0) + num(); if (cur) cur.push([x, y]); break;
        case 'Z': case 'z': close(); x = sx; y = sy; cmd = ''; break;
        default: i++;
      }
    }
    close();
    return polys;
  }

  function lum(hex) {
    var h = hex.replace('#', '');
    return 0.2126 * parseInt(h.substr(0, 2), 16) + 0.7152 * parseInt(h.substr(2, 2), 16) + 0.0722 * parseInt(h.substr(4, 2), 16);
  }

  function parseArtwork(text) {
    var vb = /viewBox="([^"]+)"/.exec(text);
    if (!vb) return null;
    var v = vb[1].trim().split(/[\s,]+/).map(parseFloat);
    var classFill = {}, m, re = /\.([\w-]+)\s*\{[^}]*?fill:\s*(#[0-9a-fA-F]{6})/g;
    while ((m = re.exec(text))) classFill[m[1]] = m[2].toLowerCase();
    var paths = [], pre = /<path\b[^>]*>/g, pm;
    while ((pm = pre.exec(text))) {
      var tag = pm[0];
      var dm = /\sd="([^"]+)"/.exec(tag);
      if (!dm) continue;
      var cm = /class="([^"]+)"/.exec(tag), fm = /fill="(#[0-9a-fA-F]{6})"/.exec(tag);
      var fill = (cm && classFill[cm[1].split(/\s+/)[0]]) || (fm && fm[1].toLowerCase());
      if (!fill) continue;
      paths.push({ fill: fill, polys: parsePath(dm[1]) });
    }
    if (!paths.length) return null;
    var fills = paths.map(function (p) { return p.fill; }).sort(function (a, b) { return lum(b) - lum(a); });
    var light = fills[0], deep = fills[fills.length - 1], polys = [];
    paths.forEach(function (p) {
      p.polys.forEach(function (pl) { polys.push({ t: p.fill === deep && deep !== light ? 0 : 1, p: pl }); });
    });
    if (polys.length < 3) return null;
    return { w: v[2] - v[0], h: v[3] - v[1], x0: v[0], y0: v[1], light: light, deep: deep, polys: polys };
  }

  // ---- Turn artwork polygons into foldable facets -------------------------------------------
  function buildFacets(art) {
    var k = SPAN / art.w, cx = (art.x0 || 0) + art.w / 2, cy = (art.y0 || 0) + art.h / 2;
    var wing = [], body = [], hingeSrc = Infinity;
    art.polys.forEach(function (f) {
      var mx = f.p.reduce(function (s, q) { return s + q[0]; }, 0) / f.p.length;
      var my = f.p.reduce(function (s, q) { return s + q[1]; }, 0) / f.p.length;
      var off = Math.abs(mx - cx);
      var upper = (my - (art.y0 || 0)) / art.h < 0.6;
      var pts = f.p.map(function (q) { return [(q[0] - cx) * k, -(q[1] - cy) * k, 0]; });
      if (off > art.w * 0.08) {
        wing.push({ pts: pts, tone: f.t, g: upper ? 0 : 1, side: mx < cx ? -1 : 1 });
        if (upper) f.p.forEach(function (q) { hingeSrc = Math.min(hingeSrc, Math.abs(q[0] - cx)); });
      } else {
        body.push({ pts: pts, tone: f.t, g: -1, side: 0 });
      }
    });
    if (!isFinite(hingeSrc)) hingeSrc = art.w * 0.06;
    return { facets: wing.concat(body), hinge: hingeSrc * k, ratio: art.w / art.h };
  }

  // ---- Colour helpers -----------------------------------------------------------------------
  function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function lerp3(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
  function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function flap(x) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * x); }

  function mount(canvas, userOptions) {
    var o = Object.assign({}, DEFAULTS, userOptions || {});
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create the butterfly canvas context.');

    var track = o.track
      ? (typeof o.track === 'string' ? document.querySelector(o.track) : o.track)
      : canvas.closest('[data-butterfly-track]');
    var reduced = root.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var model = null;               // { facets, hinge, ratio, light, deep }
    var W = 0, H = 0, progress = 0, progS = 0, override = null;
    var raf = 0, visible = false, lastY = root.scrollY, vel = 0, t0 = performance.now();
    var SHADOW = hex(o.shadowColor);

    function setModel(art) {
      model = buildFacets(art);
      model.light = hex(art.light || o.background);
      model.deepC = hex(art.deep || o.deep);
      resize(); update(); draw(performance.now()); start();
    }
    function load() {
      var url = o.artwork;
      if (!url || !root.fetch) { setModel(FALLBACK); return; }
      root.fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (text) { setModel(parseArtwork(text) || FALLBACK); })
        .catch(function () {
          console.warn('butterfly-loop: using built-in artwork (could not read ' + url + ').');
          setModel(FALLBACK);
        });
    }

    function resize() {
      var dpr = Math.min(root.devicePixelRatio || 1, 2);
      var b = canvas.getBoundingClientRect();
      W = Math.max(1, b.width); H = Math.max(1, b.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced && model) draw(performance.now());
    }
    function update() {
      if (!track) return;
      var b = track.getBoundingClientRect();
      var travel = Math.max(1, track.offsetHeight - H);
      progress = Math.max(0, Math.min(1, (o.offset - b.top) / travel));
      if (reduced && model) draw(performance.now());
    }

    function draw(now) {
      if (!model || (!visible && !reduced)) return;
      var t = (now - t0) / 1000;
      var target = override !== null ? override : (reduced ? 0.3 : progress);
      progS += (target - progS) * (reduced ? 1 : 0.09);
      vel += ((root.scrollY - lastY) - vel) * 0.15; lastY = root.scrollY;
      var energy = Math.min(1, Math.abs(vel) / 40);
      var idleOn = o.idle && !reduced;
      var idle = idleOn ? Math.sin(t * 2 * Math.PI / 8) : 0;

      var fold = o.fold * RAD, sp = progS * o.cycles;
      var phiU = fold * flap(sp) + idle * 6 * RAD + energy * 4 * RAD * Math.sin(t * 9);
      var phiL = fold * 0.92 * flap(sp - 0.09) + (idleOn ? Math.sin(t * 2 * Math.PI / 8 - 0.7) * 6 * RAD : 0);
      var phi = [Math.max(-0.08, phiU), Math.max(-0.08, phiL)];

      var yaw = o.yaw * RAD * Math.sin(progS * Math.PI * 2 * 0.9 + 0.4) + idle * 3 * RAD;
      var pitch = (22 + 10 * Math.sin(progS * Math.PI * 2 * 0.6)) * RAD + idle * 2 * RAD;
      var roll = 9 * RAD * Math.sin(progS * Math.PI * 2 * 1.2 + 1.0);
      var zoom = W < 700 ? o.mobileZoom : o.zoom;
      var spanH = SPAN / model.ratio;
      var fit = Math.min(W / SPAN, H / spanH);                  // artwork fitted, then enlarged by zoom
      var scale = fit * zoom * (1 + 0.15 * progS);
      var cx = W * (0.5 + 0.10 * Math.sin(progS * Math.PI * 2 * 0.8 + 0.8));
      var cy = H * (0.5 + 0.06 * Math.sin(progS * Math.PI * 2 * 1.1)) + (idleOn ? Math.sin(t * 2 * Math.PI / 8 + 1.2) * H * 0.012 : 0);
      var Dm = 650;

      var la = progS * Math.PI * 2 * 0.7;
      var Lr = [L_BASE[0] + 0.5 * Math.sin(la), L_BASE[1] + 0.25 * Math.cos(la), L_BASE[2]];
      var lm = Math.hypot(Lr[0], Lr[1], Lr[2]);
      var Lv = Lr.map(function (v) { return v / lm; });
      var flatLit = Lv[2];

      // panel background (same blue-to-navy radial as the page CSS)
      var bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.78);
      bg.addColorStop(0, o.background); bg.addColorStop(0.48, o.background); bg.addColorStop(1, o.deep);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), spn = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
      function xf(p) {
        var x = p[0], y = p[1], z = p[2], x1, y1, z1;
        x1 = x * cyw + z * syw; z1 = -x * syw + z * cyw; x = x1; z = z1;
        y1 = y * cp - z * spn; z1 = y * spn + z * cp; y = y1; z = z1;
        x1 = x * cr - y * sr; y1 = x * sr + y * cr; x = x1; y = y1;
        return [x, y, z];
      }

      var out = [], HING = model.hinge;
      model.facets.forEach(function (f) {
        var hd = [];
        var pts = f.pts.map(function (p) {
          var x = p[0], y = p[1], z = p[2], dd = 0;
          if (f.g >= 0) {
            var a = phi[f.g], d = Math.abs(x) - HING;
            dd = Math.max(0, d);
            z = -dd * Math.sin(a);
            x = f.side * (d > 0 ? HING + dd * Math.cos(a) : Math.abs(x));
          }
          hd.push(dd);
          return xf([x, y, z]);
        });
        var A = pts[0], B = pts[1], C = pts[2];
        var n = [(B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]),
                 (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]),
                 (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])];
        var m = Math.hypot(n[0], n[1], n[2]) || 1;
        n = n.map(function (v) { return v / m; });
        if (n[2] < 0) n = n.map(function (v) { return -v; });
        var lit = n[0] * Lv[0] + n[1] * Lv[1] + n[2] * Lv[2];
        var tone = f.tone + (lit - flatLit) * 2.1 * o.shadow * 0.7;
        var depth = pts.reduce(function (s, p) { return s + p[2]; }, 0) / pts.length;
        out.push({ pts: pts, tone: tone, depth: depth, hd: hd, g: f.g });
      });
      out.sort(function (p, q) { return q.depth - p.depth; });

      var LIGHT = model.light, DEEPC = model.deepC;
      var HILITE = lerp3(LIGHT, [255, 255, 255], 0.14);
      function shade(tn) {
        if (tn < 0) return lerp3(DEEPC, SHADOW, Math.min(1, -tn));
        if (tn <= 1) return lerp3(DEEPC, LIGHT, tn);
        return lerp3(LIGHT, HILITE, Math.min(1, (tn - 1) * 2));
      }
      function proj(p) { var s = scale * Dm / Math.max(80, Dm - p[2]); return [cx + p[0] * s, cy - p[1] * s]; }

      ctx.lineJoin = 'round';
      out.forEach(function (f) {
        var P2 = f.pts.map(proj);
        var fog = Math.min(1, Math.max(0, (-f.depth + 40) / 260)) * 0.55;
        var base = shade(f.tone), col = rgb(lerp3(base, SHADOW, fog));
        ctx.beginPath();
        P2.forEach(function (q, i) {
          if (i) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
        });
        ctx.closePath();
        if (f.g >= 0) {
          var imin = 0, imax = 0;
          f.hd.forEach(function (d, i) { if (d < f.hd[imin]) imin = i; if (d > f.hd[imax]) imax = i; });
          var gr = ctx.createLinearGradient(P2[imin][0], P2[imin][1], P2[imax][0], P2[imax][1]);
          var amt = Math.min(1, Math.abs(phi[f.g]) / Math.max(0.01, o.fold * RAD));
          var dark = lerp3(base, SHADOW, Math.min(0.85, 0.25 + 0.6 * amt * o.shadow * 0.55 + fog));
          gr.addColorStop(0, rgb(dark)); gr.addColorStop(0.55, col); gr.addColorStop(1, col);
          ctx.fillStyle = gr;
        } else { ctx.fillStyle = col; }
        ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.stroke();
      });
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(190,210,255,0.10)';
      out.forEach(function (f) {
        ctx.beginPath();
        f.pts.map(proj).forEach(function (q, i) {
          if (i) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
        });
        ctx.closePath(); ctx.stroke();
      });

      if (!reduced) raf = root.requestAnimationFrame(draw);
    }

    function start() { if (reduced || !visible || raf) return; raf = root.requestAnimationFrame(draw); }
    function stop() { if (raf) root.cancelAnimationFrame(raf); raf = 0; }

    var ro = new ResizeObserver(resize); ro.observe(canvas);
    var io = new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) { update(); if (reduced) draw(performance.now()); else start(); } else stop();
    });
    io.observe(canvas);
    root.addEventListener('scroll', update, { passive: true });
    load();

    return {
      setProgress: function (p) { override = p; progS = p; if (reduced) draw(performance.now()); },
      destroy: function () { stop(); ro.disconnect(); io.disconnect(); root.removeEventListener('scroll', update); }
    };
  }

  function autoMount() {
    var numeric = { cycles: 1, fold: 1, yaw: 1, zoom: 1, mobileZoom: 1, shadow: 1, offset: 1 };
    document.querySelectorAll('canvas[data-butterfly]').forEach(function (canvas) {
      var opts = {};
      Object.keys(DEFAULTS).concat(['track']).forEach(function (key) {
        var attr = 'data-' + key.replace(/[A-Z]/g, function (l) { return '-' + l.toLowerCase(); });
        var v = canvas.getAttribute(attr);
        if (v === null) return;
        opts[key] = numeric[key] ? parseFloat(v) : v === 'true' ? true : v === 'false' ? false : v;
      });
      canvas.__butterfly = mount(canvas, opts);
    });
  }

  root.ImagoButterfly = { mount: mount, defaults: DEFAULTS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})(window);
