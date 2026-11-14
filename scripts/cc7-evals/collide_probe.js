/* Injected before the game loads. Records every piece of text on screen each
   frame — canvas fillText and the DOM overlays — and reports overlaps. */
(() => {
  const P = CanvasRenderingContext2D.prototype;
  const ft = P.fillText, fr = P.fillRect;
  let texts = [];
  window.__scene = 'boot';
  window.__find = {};          // key -> finding
  window.__frames = 0;

  P.fillText = function(s, x, y){
    s = String(s);
    if (s.trim()){
      const m = this.measureText(s), tr = this.getTransform();
      let l = x - m.actualBoundingBoxLeft, r = x + m.actualBoundingBoxRight;
      const t = y - m.actualBoundingBoxAscent, b = y + m.actualBoundingBoxDescent;
      texts.push({ s, x0: l * tr.a + tr.e, x1: r * tr.a + tr.e, y0: t * tr.d + tr.f, y1: b * tr.d + tr.f,
                   a: this.globalAlpha, dim: false });
    }
    return ft.apply(this, arguments);
  };
  P.fillRect = function(x, y, w, h){
    if (w >= 600 && h >= 300){
      const fs = String(this.fillStyle);
      const mm = fs.match(/rgba\([^)]*,\s*([\d.]+)\)/);
      const alpha = (mm ? parseFloat(mm[1]) : 1) * this.globalAlpha;
      if (alpha >= 0.99) texts = [];                       // background wipe
      else if (alpha >= 0.5) texts.forEach(t => { t.dim = true; });   // card dims what is under it
    }
    return fr.apply(this, arguments);
  };

  const norm = s => s.replace(/\d+/g, '#').replace(/[♥]+/g, '♥').trim().slice(0, 60);
  function add(kind, a, b, ov){
    const key = window.__scene + ' | ' + kind + ' | ' + norm(a.s) + ' <> ' + (b ? norm(b.s) : '');
    const f = window.__find[key];
    const area = ov ? Math.round(ov.w * ov.h) : 0;
    if (!f) window.__find[key] = { scene: window.__scene, kind, a: a.s.slice(0, 70), b: b ? b.s.slice(0, 70) : '', area, n: 1, vw: innerWidth };
    else { f.n++; f.area = Math.max(f.area, area); }
  }

  function check(){
    const cv = document.getElementById('c'); if (!cv) return;
    const cr = cv.getBoundingClientRect();
    const k = cv.clientWidth / 640, ox = cr.left + cv.clientLeft, oy = cr.top + cv.clientTop;
    const items = [];
    for (const t of texts){
      if (t.a < 0.25) continue;
      if (t.x0 < -1 || t.x1 > 641 || t.y0 < -1 || t.y1 > 385) add('clipped-by-canvas-edge', { s: t.s }, null, null);
      items.push({ s: t.s, src: t.dim ? 'canvas-dim' : 'canvas', l: ox + t.x0 * k, r: ox + t.x1 * k, t: oy + t.y0 * k, b: oy + t.y1 * k });
    }
    const dom = (el, label) => {
      if (!el || !el.textContent.trim()) return;
      let op = 1; for (let e = el; e && e.id !== 'frame'; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
      if (op < 0.3) return;
      const r = el.getBoundingClientRect(); if (r.width < 1) return;
      const it = { s: label + ': ' + el.textContent.trim(), src: 'dom', l: r.left, r: r.right, t: r.top, b: r.bottom };
      // captions may sit in the strip reserved under the picture on narrow phones
      const room = parseFloat(getComputedStyle(document.getElementById('frame')).marginBottom) || 0;
      if (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + room + 1) add('overflows-its-space', it, null, null);
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) add('text-cut-off', it, null, null);
      items.push(it);
    };
    const ctl = (el, label) => {
      if (!el) return; const r = el.getBoundingClientRect();
      if (r.width < 1 || getComputedStyle(el).display === 'none') return;
      items.push({ s: 'CONTROL: ' + label, src: 'control', l: r.left, r: r.right, t: r.top, b: r.bottom });
    };
    ctl(document.getElementById('voiceBtn'), 'voices button'); ctl(document.getElementById('sfxBtn'), 'sound button');
    if (getComputedStyle(document.getElementById('pad')).display !== 'none')
      document.querySelectorAll('#pad .btn').forEach(b => ctl(b, 'pad ' + (b.dataset.k || '')));
    dom(document.querySelector('#hud .tag'), 'HUD');
    dom(document.getElementById('petals'), 'HUD-right');
    dom(document.getElementById('toast'), 'TOAST');
    dom(document.querySelector('#sub .who'), 'CAPTION-name');
    dom(document.querySelector('#sub .said'), 'CAPTION');

    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++){
      const a = items[i], b = items[j];
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (w <= 1.5 || h <= 1.5) continue;
      if (a.src === 'dom' && b.src === 'dom' && a.s.startsWith('CAPTION') && b.s.startsWith('CAPTION')) continue;
      if (a.s === b.s && a.src === b.src) continue;
      if (a.src === 'control' && b.src === 'control') continue;
      const dimmed = a.src === 'canvas-dim' || b.src === 'canvas-dim';
      if (a.src === 'canvas-dim' && b.src === 'canvas-dim') continue;
      const ctrl = a.src === 'control' || b.src === 'control';
      const kind = ctrl ? 'text under a button' : (dimmed ? 'over-dimmed-text' : (a.src === b.src ? a.src + ' x ' + a.src : 'overlay x canvas'));
      add(kind, a, b, { w, h });
    }
  }

  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(ts => {
    texts = [];
    cb(ts);
    window.__frames++;
    if (!window.__pause) try { check(); } catch(e){ window.__probeErr = String(e); }
  });
})();
