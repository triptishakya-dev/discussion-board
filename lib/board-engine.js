import { calculateEstimate } from './estimate';
import { CONFIG } from './board-config';

// Owns the canvas and its transient interaction state within the React board.
export function mountBoard(root) {
  const controller = new AbortController();
  const { signal } = controller;
  const listen = (target, type, handler, options) =>
    target.addEventListener(type, handler, { ...(typeof options === 'object' ? options : { capture: options === true }), signal });
  const timers = new Set();
  const frames = new Set();
  const setTimeout = (fn, delay) => {
    if (signal.aborted) return;
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, delay);
    timers.add(id);
    return id;
  };
  const clearTimeout = id => { timers.delete(id); window.clearTimeout(id); };
  const requestAnimationFrame = fn => {
    if (signal.aborted) return;
    const id = window.requestAnimationFrame(time => { frames.delete(id); fn(time); });
    frames.add(id);
    return id;
  };
  const cancelAnimationFrame = id => { frames.delete(id); window.cancelAnimationFrame(id); };

  const $ = (s, r = root) => r.querySelector(s);
  const board = $('#board'), world = $('#world');
  const view = { x: 0, y: 0, s: 1 };
  const items = new Map();
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let zTop = 10, uid = 0, selected = null;
  const DOCK_W = 180;
  const XSVG = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>';
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const lakh = n => '₹' + (n / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- mascot ---------- */
  const bot = (() => {
    const el = $('#bot'), bub = $('#bubble'), eyes = $('#b-eyes'), lean = $('#b-lean');
    let sayT, moodT, lastSay = 0, tip = 0;
    function say(t, ms = 3400, force) {
      const now = Date.now(); if (!force && now - lastSay < 1600) return; lastSay = now;
      bub.textContent = t; bub.classList.add('show'); clearTimeout(sayT); sayT = setTimeout(() => bub.classList.remove('show'), ms);
    }
    function mood(m, ms = 1800) { el.classList.remove('happy', 'wow'); if (!m) return; el.classList.add(m); clearTimeout(moodT); moodT = setTimeout(() => el.classList.remove(m), ms); }
    function once(c, ms) { el.classList.remove(c); void el.getBoundingClientRect(); el.classList.add(c); setTimeout(() => el.classList.remove(c), ms); }
    function look(px, py) {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .4;
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) || 1, m = Math.min(7, d / 40);
      eyes.setAttribute('transform', `translate(${(dx / d * m).toFixed(2)} ${(dy / d * m * .7).toFixed(2)})`);
      lean.style.transform = `rotate(${clamp(dx / d * m, -7, 7).toFixed(2)}deg)`;
    }
    function burst() {
      if (RM) return;
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .35;
      for (let i = 0; i < 14; i++) {
        const b = document.createElement('span'); b.className = 'gb'; const s = 8 + Math.random() * 16;
        b.style.cssText = `left:${cx}px;top:${cy}px;width:${s}px;height:${s}px`; document.body.appendChild(b);
        const a = Math.PI * (1.05 + Math.random() * .9), d = 80 + Math.random() * 140;
        b.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d - s / 2}px,${Math.sin(a) * d - s / 2}px) scale(1)`, opacity: 0 }],
          { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => b.remove();
      }
    }
    (function blink() { el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 150); setTimeout(blink, 2200 + Math.random() * 3600); })();
    listen(el, 'pointerdown', e => { e.stopPropagation(); once('spin', 900); mood('happy', 1400); say(CONFIG.tips[tip++ % CONFIG.tips.length], 3600, true); });
    let raf = 0, lp = null;
    listen(window, 'pointermove', e => { lp = e; if (!raf) raf = requestAnimationFrame(() => { raf = 0; look(lp.clientX, lp.clientY); }); }, true);
    return { say, mood, look, burst, wave: () => once('wave', 1500), jump: () => once('jump', 820) };
  })();
  let idleT;
  function resetIdle() { clearTimeout(idleT); idleT = setTimeout(idle, 30000); }
  function idle() { if (!$('#modal').classList.contains('show')) { bot.wave(); bot.say(CONFIG.tips[Math.floor(Math.random() * CONFIG.tips.length)], 4000, true); } idleT = setTimeout(idle, 30000); }
  listen(window, 'pointerdown', resetIdle, true);

  /* ---------- view ---------- */
  let mmQ = false;
  function applyView() {
    world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.s})`;
    bgParallax();
    queueMM();
  }
  const clampS = s => clamp(s, 0.08, 6);
  function zoomAt(px, py, ns) {
    ns = clampS(ns);
    const wx = (px - view.x) / view.s, wy = (py - view.y) / view.s;
    view.s = ns; view.x = px - wx * ns; view.y = py - wy * ns; applyView();
  }
  function animateView(tx, ty, ts, ms = 600) {
    if (RM) { view.x = tx; view.y = ty; view.s = ts; return applyView(); }
    cancelAnimationFrame(animateView.r);
    const f = { ...view }, t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 4);
      view.x = f.x + (tx - f.x) * e; view.y = f.y + (ty - f.y) * e; view.s = f.s + (ts - f.s) * e; applyView();
      if (k < 1) animateView.r = requestAnimationFrame(step); };
    animateView.r = requestAnimationFrame(step);
  }
  const screenCenter = () => ({ x: (DOCK_W + innerWidth) / 2, y: innerHeight / 2 });
  function viewCenter() { const c = screenCenter(); return { x: (c.x - view.x) / view.s, y: (c.y - view.y) / view.s }; }
  const toWorld = (sx, sy) => ({ x: (sx - view.x) / view.s, y: (sy - view.y) / view.s });
  function fitRect(minx, miny, maxx, maxy, maxScale = 1.5) {
    // usable area: right of the dock, left of the minimap and helper
    const L = DOCK_W + 40, R = innerWidth - (innerWidth > 820 ? 230 : 40), T = 40, B = innerHeight - 110;
    const bw = Math.max(1, maxx - minx), bh = Math.max(1, maxy - miny);
    const s = clampS(Math.min((R - L) / bw, (B - T) / bh, maxScale));
    animateView((L + R) / 2 - (minx + bw / 2) * s, (T + B) / 2 - (miny + bh / 2) * s, s);
  }
  function bounds() { let a = [1e9, 1e9, -1e9, -1e9]; items.forEach(it => { a = [Math.min(a[0], it.x), Math.min(a[1], it.y), Math.max(a[2], it.x + it.w), Math.max(a[3], it.y + it.h)]; }); return a; }
  function fitAll() {
    if (!items.size) { const c = screenCenter(); return animateView(c.x, c.y, 1); }
    fitRect(...bounds());
  }

  /* ---------- background parallax ---------- */
  const rig = $('#rig'); let home = null, ptr = { x: 0, y: 0 }, bgQ = false;
  function bgParallax() { queueDots(); if (!bgQ) { bgQ = true; requestAnimationFrame(drawBg); } }
  function drawBg() {
    bgQ = false; if (!home) return;
    // glass panes move a little with panning, zoom and the finger, but never leave the screen
    const px = 90 * Math.tanh((view.x - home.x) / 1400) + ptr.x, py = 70 * Math.tanh((view.y - home.y) / 1100) + ptr.y;
    const k = 1 + .1 * Math.tanh(Math.log(view.s));
    rig.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) scale(${k.toFixed(3)})`;
  }
  listen(window, 'pointermove', e => { ptr = { x: (e.clientX / innerWidth - .5) * -36, y: (e.clientY / innerHeight - .5) * -24 }; bgParallax(); }, true);
  if (CONFIG.lowPowerBackground) document.documentElement.classList.add('lite');

  /* ---------- background dots ---------- */
  const dotsCv = $('#dots'), dctx = dotsCv.getContext('2d'), GAP = 26;
  let DPR = 1, dRip = [], dPtr = { x: -1e4, y: -1e4 }, dRaf = 0;
  function sizeDots() { DPR = Math.min(2, devicePixelRatio || 1); dotsCv.width = innerWidth * DPR; dotsCv.height = innerHeight * DPR; dctx.setTransform(DPR, 0, 0, DPR, 0, 0); queueDots(); }
  function queueDots() { if (!dRaf) dRaf = requestAnimationFrame(drawDots); }
  function drawDots(now) {
    dRaf = 0; const W = innerWidth, H = innerHeight, cs = getComputedStyle(document.documentElement);
    const base = cs.getPropertyValue('--dot').trim(), hi = cs.getPropertyValue('--dot-hi').trim(), ba = cs.getPropertyValue('--dot-a').trim();
    dctx.clearRect(0, 0, W, H);
    dRip = dRip.filter(r => now - r.t < 1500);
    const ox = ((view.x * .5) % GAP + GAP) % GAP, oy = ((view.y * .5) % GAP + GAP) % GAP;
    dctx.fillStyle = `rgba(${base},${ba})`; dctx.beginPath();
    const lit = [];
    for (let y = oy; y < H; y += GAP) for (let x = ox; x < W; x += GAP) {
      let v = Math.max(0, 1 - Math.hypot(x - dPtr.x, y - dPtr.y) / 150) * .6;
      for (const r of dRip) { const age = (now - r.t) / 1500, dd = Math.abs(Math.hypot(x - r.x, y - r.y) - age * 560); v += Math.max(0, 1 - dd / 30) * (1 - age) * .95; }
      if (v > .04) lit.push(x, y, Math.min(1, v)); else dctx.rect(x - .7, y - .7, 1.4, 1.4);
    }
    dctx.fill();
    for (let i = 0; i < lit.length; i += 3) { const v = lit[i + 2]; dctx.fillStyle = `rgba(${hi},${(.25 + v * .75).toFixed(3)})`; dctx.beginPath(); dctx.arc(lit[i], lit[i + 1], .9 + v * 2.1, 0, 6.283); dctx.fill(); }
    if (dRip.length) queueDots();
  }
  listen(window, 'pointermove', e => { dPtr = { x: e.clientX, y: e.clientY }; queueDots(); }, true);
  listen(window, 'pointerup', e => { if (e.pointerType !== 'mouse') { dPtr = { x: -1e4, y: -1e4 }; queueDots(); } }, true);
  listen(window, 'pointerdown', e => { if (RM || !e.target.closest('#board')) return; dRip.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (dRip.length > 6) dRip.shift(); queueDots(); }, true);
  listen(window, 'resize', sizeDots);

  /* ---------- minimap ---------- */
  const mm = $('#mm'), mctx = mm.getContext('2d'); let mmT = null;
  function queueMM() { if (!mmQ) { mmQ = true; requestAnimationFrame(drawMM); } }
  function drawMM() {
    mmQ = false; const W = mm.width, H = mm.height, cs = getComputedStyle(document.documentElement);
    mctx.clearRect(0, 0, W, H);
    const v0 = toWorld(0, 0), v1 = toWorld(innerWidth, innerHeight);
    let [a, b, c, d] = items.size ? bounds() : [v0.x, v0.y, v1.x, v1.y];
    a = Math.min(a, v0.x); b = Math.min(b, v0.y); c = Math.max(c, v1.x); d = Math.max(d, v1.y);
    const pad = 0.08 * Math.max(c - a, d - b), bw = c - a + pad * 2, bh = d - b + pad * 2, k = Math.min(W / bw, H / bh);
    const ox = (W - bw * k) / 2 - (a - pad) * k, oy = (H - bh * k) / 2 - (b - pad) * k; mmT = { k, ox, oy };
    mctx.fillStyle = cs.getPropertyValue('--mm-item');
    items.forEach(it => { mctx.globalAlpha = it === selected ? 1 : .75; rr(it.x * k + ox, it.y * k + oy, Math.max(3, it.w * k), Math.max(3, it.h * k), 4); mctx.fill(); });
    mctx.globalAlpha = 1; mctx.strokeStyle = cs.getPropertyValue('--mm-view'); mctx.lineWidth = 2.5;
    rr(v0.x * k + ox, v0.y * k + oy, (v1.x - v0.x) * k, (v1.y - v0.y) * k, 8); mctx.stroke();
  }
  function rr(x, y, w, h, r) { mctx.beginPath(); mctx.moveTo(x + r, y); mctx.arcTo(x + w, y, x + w, y + h, r); mctx.arcTo(x + w, y + h, x, y + h, r); mctx.arcTo(x, y + h, x, y, r); mctx.arcTo(x, y, x + w, y, r); mctx.closePath(); }
  function mmJump(e) {
    if (!mmT) return; const r = mm.getBoundingClientRect(), sx = (e.clientX - r.left) * mm.width / r.width, sy = (e.clientY - r.top) * mm.height / r.height;
    const wx = (sx - mmT.ox) / mmT.k, wy = (sy - mmT.oy) / mmT.k, c = screenCenter();
    view.x = c.x - wx * view.s; view.y = c.y - wy * view.s; applyView();
  }
  listen($('#mini'), 'pointerdown', e => { e.stopPropagation(); $('#mini').setPointerCapture(e.pointerId); mmJump(e); $('#mini').onpointermove = mmJump; });
  listen($('#mini'), 'pointerup', () => { $('#mini').onpointermove = null; });

  /* ---------- board gestures: pan with momentum + pinch zoom ---------- */
  const bp = new Map(); let bs = null, bv = { x: 0, y: 0, t: 0 }, bDown = null, glideR = 0;
  function boardBegin() {
    const p = [...bp.values()];
    if (p.length === 1) bs = { m: 'pan', px: p[0].x, py: p[0].y, vx: view.x, vy: view.y };
    else if (p.length >= 2) {
      const [a, b] = p, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      bs = { m: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: view.s, wx: (mx - view.x) / view.s, wy: (my - view.y) / view.s };
    }
  }
  listen(board, 'pointerdown', e => {
    if (e.target.closest('.item')) return;
    cancelAnimationFrame(glideR); cancelAnimationFrame(animateView.r);
    board.setPointerCapture(e.pointerId);
    bp.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (bp.size === 1) { deselect(); closeFly(); bDown = { x: e.clientX, y: e.clientY }; bv = { x: 0, y: 0, t: performance.now() }; } else bDown = null;
    board.classList.add('panning'); boardBegin();
  });
  listen(board, 'pointermove', e => {
    if (!bp.has(e.pointerId) || !bs) return;
    const prev = bp.get(e.pointerId), now = performance.now(), dt = Math.max(1, now - bv.t);
    bp.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...bp.values()];
    if (bs.m === 'pan' && p.length === 1) {
      bv = { x: bv.x * .6 + (e.clientX - prev.x) / dt * .4, y: bv.y * .6 + (e.clientY - prev.y) / dt * .4, t: now };
      view.x = bs.vx + p[0].x - bs.px; view.y = bs.vy + p[0].y - bs.py; applyView();
    } else if (bs.m === 'pinch' && p.length >= 2) {
      const [a, b] = p, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const ns = clampS(bs.s * Math.hypot(a.x - b.x, a.y - b.y) / bs.d);
      view.s = ns; view.x = mx - bs.wx * ns; view.y = my - bs.wy * ns; applyView();
    }
  });
  const boardEnd = e => {
    if (!bp.delete(e.pointerId)) return;
    if (bp.size) { boardBegin(); return; }
    const wasPan = bs && bs.m === 'pan'; bs = null; board.classList.remove('panning');
    if (bDown && Math.hypot(e.clientX - bDown.x, e.clientY - bDown.y) < 6) ripple(e.clientX, e.clientY);
    else if (wasPan && !RM && performance.now() - bv.t < 80 && Math.hypot(bv.x, bv.y) > .25) {
      let vx = bv.x * 16, vy = bv.y * 16;
      const g = () => { vx *= .93; vy *= .93; view.x += vx; view.y += vy; applyView(); if (Math.hypot(vx, vy) > .3) glideR = requestAnimationFrame(g); };
      glideR = requestAnimationFrame(g);
    }
    bDown = null;
  };
  listen(board, 'pointerup', boardEnd); listen(board, 'pointercancel', boardEnd);
  listen(board, 'wheel', e => {
    e.preventDefault(); cancelAnimationFrame(glideR);
    const mouseWheel = e.deltaMode === 1 || (Math.abs(e.deltaY) >= 100 && e.deltaX === 0);
    if (e.ctrlKey || mouseWheel) zoomAt(e.clientX, e.clientY, view.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0015)));
    else { view.x -= e.deltaX; view.y -= e.deltaY; applyView(); }
  }, { passive: false });
  listen(document, 'gesturestart', e => e.preventDefault());
  listen(document, 'contextmenu', e => { if (!e.target.closest('input')) e.preventDefault(); });
  function ripple(x, y) {
    if (RM) return; const r = document.createElement('span'); r.className = 'ripple'; r.style.left = x + 'px'; r.style.top = y + 'px';
    r.style.position = 'fixed'; r.style.zIndex = 3; document.body.appendChild(r);
    r.animate([{ transform: 'scale(.2)', opacity: .9 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => r.remove();
  }

  /* ---------- items ---------- */
  function place(it) { it.el.style.translate = `${it.x}px ${it.y}px`; it.el.style.width = it.w + 'px'; it.el.style.height = it.h + 'px'; queueMM(); }
  function select(it) { if (selected && selected !== it) selected.el.classList.remove('active'); selected = it; it.el.classList.add('active'); it.el.style.zIndex = ++zTop; queueMM(); }
  function deselect() { if (selected) selected.el.classList.remove('active'); selected = null; queueMM(); }
  function removeItem(it, quiet) {
    if (!items.has(it.id)) return;
    items.delete(it.id); if (selected === it) selected = null;
    if (it.kind === 'video') it.el.querySelector('video').pause();
    cancelAnimationFrame(it.glide);
    const done = () => { it.el.remove(); queueMM(); };
    if (RM || quiet) done(); else it.el.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: .6, rotate: (Math.random() > .5 ? 6 : -6) + 'deg' }], { duration: 260, easing: 'cubic-bezier(.5,0,.8,.4)' }).onfinish = done;
    updateBoardBackground(); renderFly(); queueMM();
  }
  function updateBoardBackground() {
    root.classList.toggle('board-busy', items.size > 0);
  }
  const onBoard = ref => [...items.values()].find(i => i.ref === ref);

  function spawn(o) {
    const id = 'i' + (++uid), c = o.at || viewCenter();
    const w = o.w || 380 / view.s, h = o.h || w * 0.72;
    const it = { id, kind: o.kind, ref: o.ref, x: c.x - w / 2, y: c.y - h / 2, w, h, el: document.createElement('div'), aspect: o.kind !== 'pdf' };
    const el = it.el; el.className = 'item k-' + o.kind;
    const fitTo = (nw, nh) => { if (o.h || !nw) return; const cy = it.y + it.h / 2; it.h = (it.w - 16) * nh / nw + 16; it.y = cy - it.h / 2; place(it); };
    if (o.kind === 'image') {
      el.innerHTML = `<div class="body"><img alt="" src="${o.src}"></div><button class="x float" aria-label="Close">${XSVG}</button><div class="cap">${esc(o.title)}</div><div class="rs"></div>`;
      const img = el.querySelector('img'); img.onload = () => fitTo(img.naturalWidth, img.naturalHeight);
    } else if (o.kind === 'video') {
      el.innerHTML = `<div class="body"><video src="${o.src}" playsinline loop preload="metadata"></video><div class="play"><span><svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg></span></div></div><button class="x float" aria-label="Close">${XSVG}</button><div class="cap">${esc(o.title)}</div><div class="rs"></div>`;
      const v = el.querySelector('video'); v.onloadedmetadata = () => fitTo(v.videoWidth, v.videoHeight);
    } else if (o.kind === 'pdf') {
      it.w = o.w || 560 / view.s; it.h = it.w * 1.3; it.x = c.x - it.w / 2; it.y = c.y - it.h / 2;
      el.innerHTML = `<div class="bar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8a55" stroke-width="2"><path d="M6 3h9l5 5v13H6z"/><path d="M15 3v5h5"/></svg><span class="t">${esc(o.title)}</span><button class="x" aria-label="Close">${XSVG}</button></div><div class="body"><iframe src="${o.src}#toolbar=0&navpanes=0&view=FitH" title="${esc(o.title)}"></iframe></div><div class="rs"></div>`;
    } else if (o.kind === 'plan') {
      it.w = o.w || 640 / view.s; it.h = it.w * 0.8; it.x = c.x - it.w / 2; it.y = c.y - it.h / 2;
      el.innerHTML = `<div class="bar"><span class="t">${esc(o.title)}</span><button class="chip-btn" data-cfg>Get estimate</button><button class="x" aria-label="Close">${XSVG}</button></div><div class="body"><img alt="${esc(o.title)}" src="${o.src}"></div><div class="rs"></div>`;
      const cfg = el.querySelector('[data-cfg]');
      cfg.addEventListener('pointerdown', e => e.stopPropagation());
      cfg.addEventListener('click', e => { e.stopPropagation(); openQuiz(o.layoutKey); });
    }
    const x = el.querySelector('.x');
    x.addEventListener('pointerdown', e => e.stopPropagation());
    x.addEventListener('click', e => { e.stopPropagation(); removeItem(it); bot.mood('wow', 700); });
    world.appendChild(el); items.set(id, it); place(it); select(it); bindItem(it); updateBoardBackground();
    // fly in from the folder it came from
    if (!RM) {
      const fb = o.from && $(`.folder[data-f="${o.from}"]`);
      let from = `${it.x}px ${it.y + 60 / view.s}px`;
      if (fb) { const r = fb.getBoundingClientRect(), p = toWorld(r.left + r.width / 2, r.top + r.height / 2); from = `${p.x - it.w / 2}px ${p.y - it.h / 2}px`; }
      it.anim = el.animate([{ translate: from, scale: .25, opacity: 0, rotate: '-8deg' }, { translate: `${it.x}px ${it.y}px`, scale: 1, opacity: 1, rotate: '0deg' }],
        { duration: 720, delay: o.delay || 0, easing: 'cubic-bezier(.22,1.25,.36,1)', fill: 'backwards' });
    }
    return it;
  }

  function bindItem(it) {
    const el = it.el, handle = it.kind === 'pdf' ? el.querySelector('.bar') : el;
    const ptrs = new Map(); let st = null, tap = null, lastTap = 0, v = { x: 0, y: 0, t: 0 };
    const begin = () => {
      const p = [...ptrs.values()];
      if (p.length === 1) st = { m: 'drag', px: p[0].x, py: p[0].y, x: it.x, y: it.y };
      else if (p.length >= 2) { const [a, b] = p; st = { m: 'scale', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, x: it.x, y: it.y, w: it.w, h: it.h }; el.style.rotate = '0deg'; }
    };
    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('.x,.rs,[data-cfg]')) return;
      e.stopPropagation(); handle.setPointerCapture(e.pointerId);
      if (it.anim) { it.anim.cancel(); it.anim = null; }
      cancelAnimationFrame(it.glide);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); select(it);
      el.classList.add('lift'); v = { x: 0, y: 0, t: performance.now() };
      tap = ptrs.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
      if (ptrs.size === 1) bot.mood('wow', 900);
      begin();
    });
    handle.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId) || !st) return;
      const prev = ptrs.get(e.pointerId), now = performance.now(), dt = Math.max(1, now - v.t);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = [...ptrs.values()];
      if (st.m === 'drag' && p.length === 1) {
        v = { x: v.x * .6 + (e.clientX - prev.x) / dt * .4, y: v.y * .6 + (e.clientY - prev.y) / dt * .4, t: now };
        it.x = st.x + (p[0].x - st.px) / view.s; it.y = st.y + (p[0].y - st.py) / view.s; place(it);
        el.style.rotate = clamp(v.x * 5, -9, 9).toFixed(2) + 'deg';
      } else if (st.m === 'scale' && p.length >= 2) {
        const [a, b] = p, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nw = clamp(st.w * Math.hypot(a.x - b.x, a.y - b.y) / st.d, 160, 8000), k = nw / st.w;
        const cx = st.x + st.w / 2 + (mx - st.mx) / view.s, cy = st.y + st.h / 2 + (my - st.my) / view.s;
        it.w = nw; it.h = st.h * k; it.x = cx - it.w / 2; it.y = cy - it.h / 2; place(it);
      }
    });
    const end = e => {
      if (!ptrs.delete(e.pointerId)) return;
      if (ptrs.size) { tap = null; begin(); return; }
      const wasDrag = st && st.m === 'drag'; st = null;
      el.classList.remove('lift'); el.style.rotate = '0deg';
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8 && performance.now() - tap.t < 350) {
        const now = performance.now();
        if (now - lastTap < 320) { fitRect(it.x, it.y, it.x + it.w, it.y + it.h, 3); lastTap = 0; }
        else { lastTap = now; if (it.kind === 'video') toggleVideo(it); }
      } else if (wasDrag && !RM && performance.now() - v.t < 80) {
        const sp = Math.hypot(v.x, v.y);
        if (sp > .35) {
          let vx = v.x * 16 / view.s, vy = v.y * 16 / view.s;
          if (sp > 2.2) { bot.say('Whee!', 1400); bot.mood('happy', 1200); }
          const g = () => { vx *= .925; vy *= .925; it.x += vx; it.y += vy; place(it); if (Math.hypot(vx, vy) * view.s > .3) it.glide = requestAnimationFrame(g); };
          it.glide = requestAnimationFrame(g);
        }
      }
      tap = null;
    };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);

    const rs = el.querySelector('.rs'); let r0 = null;
    rs.addEventListener('pointerdown', e => { e.stopPropagation(); rs.setPointerCapture(e.pointerId); select(it); el.classList.add('lift'); r0 = { px: e.clientX, py: e.clientY, w: it.w, h: it.h }; });
    rs.addEventListener('pointermove', e => {
      if (!r0) return;
      const nw = Math.max(160, r0.w + (e.clientX - r0.px) / view.s);
      it.w = nw; it.h = it.aspect ? r0.h * nw / r0.w : Math.max(180, r0.h + (e.clientY - r0.py) / view.s); place(it);
    });
    const rEnd = () => { r0 = null; el.classList.remove('lift'); }; rs.addEventListener('pointerup', rEnd); rs.addEventListener('pointercancel', rEnd);
  }
  function toggleVideo(it) {
    const v = it.el.querySelector('video');
    if (v.paused) { v.muted = false; v.play().catch(() => { v.muted = true; v.play(); }); it.el.classList.add('playing'); }
    else { v.pause(); it.el.classList.remove('playing'); }
  }

  /* ---------- assets (persisted in IndexedDB on this device) ---------- */
  const assets = { gallery: [], pdf: [], layout: {} };
  let db = null;
  const dbOpen = () => new Promise(res => {
    try { const r = indexedDB.open('discussion-board', 1); r.onupgradeneeded = () => r.result.createObjectStore('assets', { keyPath: 'id' }); r.onsuccess = () => { db = r.result; res(); }; r.onerror = () => res(); }
    catch (e) { res(); }
  });
  const dbAll = () => new Promise(res => { try { if (!db) return res([]); const r = db.transaction('assets').objectStore('assets').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); } catch (e) { res([]); } });
  const dbPut = a => { try { db && db.transaction('assets', 'readwrite').objectStore('assets').put({ id: a.id, folder: a.folder, name: a.name, type: a.type, blob: a.blob, size: a.size, layoutKey: a.layoutKey || null }); } catch (e) {} };
  const dbDel = id => { try { db && db.transaction('assets', 'readwrite').objectStore('assets').delete(id); } catch (e) {} };

  const samplePhotos = [
    ['living-room', 'Living room'],
    ['kitchen', 'Kitchen'],
    ['bedroom', 'Bedroom'],
    ['dining-room', 'Dining room'],
    ['apartment-exterior', 'Apartment exterior'],
  ];

  assets.gallery.push(...samplePhotos.map(([slug, name]) => ({
    id: `sample-${slug}`,
    folder: 'gallery',
    name: `${name} (sample)`,
    type: 'image/jpeg',
    url: `/demo/${slug}.jpg`,
    sample: true,
  })));

  const sampleBrochures = [
    ['2bhk', '2 BHK Apartment', 204041],
    ['3bhk', '3 BHK Apartment', 215478],
    ['4bhk', '4 BHK Villa', 156556],
    ['finishes', 'Interior Finishes Guide', 118441],
  ];

  assets.pdf.push(...sampleBrochures.map(([slug, name, size]) => ({
    id: `sample-pdf-${slug}`,
    folder: 'pdf',
    name,
    size,
    type: 'application/pdf',
    url: `/demo/brochures/${slug}.pdf`,
    sample: true,
  })));

  const planSrc = key => assets.layout[key]?.url ?? CONFIG.layouts[key].image;

  /* ---------- folders & flyout ---------- */
  let openF = null, uploadTarget = null;
  const fly = $('#fly');
  root.querySelectorAll('.folder').forEach(b => listen(b, 'click', () => toggleFolder(b.dataset.f)));
  function toggleFolder(f) {
    if (openF === f) { closeFly(); return; }
    openF = f; root.querySelectorAll('.folder').forEach(b => b.classList.toggle('on', b.dataset.f === f));
    renderFly(true); fly.classList.add('show');
    if (f === 'gallery') { arrangeGallery(); bot.say('Drag photos around. Pinch one to make it bigger.'); }
    else if (f === 'pdf') bot.say(assets.pdf.length ? 'Tap a brochure to open it.' : 'Add your project PDFs here.');
    else bot.say('Pick a layout for a quick estimate.');
  }
  function closeFly() { openF = null; fly.classList.remove('show'); root.querySelectorAll('.folder').forEach(b => b.classList.remove('on')); }
  function counts() {
    $('#c-gallery').textContent = assets.gallery.length + ' items';
    $('#c-pdf').textContent = assets.pdf.length + ' files';
    $('#c-layout').textContent = Object.keys(CONFIG.layouts).length + ' layouts';
  }
  function renderFly(animateIn) {
    counts(); if (!openF) return;
    let h = '';
    if (openF === 'gallery') {
      h = `<div class="fly-h"><div style="flex:1"><h3>Gallery</h3><p>Photos and videos</p></div><button class="pill" data-a="arrange">Open all</button><button class="pill blue" data-a="up">+ Add</button></div><div class="fly-b">`;
      h += assets.gallery.length ? '<div class="thumbs">' + assets.gallery.map(a => `<div class="th ${onBoard(a.id) ? 'onb' : ''}" data-id="${a.id}">${a.type.startsWith('video') ? `<video src="${a.url}#t=0.5" muted preload="metadata"></video><span class="vid">VIDEO</span>` : `<img alt="" src="${a.url}">`}<button class="del" data-del="${a.id}" aria-label="Remove">${XSVG}</button></div>`).join('') + '</div>'
        : '<div class="empty">No photos yet. Tap “+ Add” to upload images or videos.</div>';
    } else if (openF === 'pdf') {
      h = `<div class="fly-h"><div style="flex:1"><h3>Brochures</h3><p>Project PDFs and collaterals</p></div><button class="pill blue" data-a="up">+ Add PDF</button></div><div class="fly-b">`;
      h += assets.pdf.length ? assets.pdf.map(a => `<div class="row" data-id="${a.id}"><div class="ri"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff7a45" stroke-width="1.8"><path d="M6 3h9l5 5v13H6z"/><path d="M15 3v5h5"/></svg></div><div class="rt"><b>${esc(a.name)}</b><small>${(a.size / 1048576).toFixed(1)} MB${onBoard(a.id) ? ', on board' : ''}</small></div><button class="del" data-del="${a.id}" aria-label="Remove">${XSVG}</button></div>`).join('')
        : '<div class="empty">No brochures yet. Tap “+ Add PDF” to upload project documents.</div>';
    } else {
      h = `<div class="fly-h"><div style="flex:1"><h3>Floor plans</h3><p>Tap a layout to get an estimate</p></div></div><div class="fly-b">`;
      h += Object.entries(CONFIG.layouts).map(([k, L]) => `<div class="row" data-lay="${k}"><div class="ri"><img alt="" src="${planSrc(k)}"></div><div class="rt"><b>${L.name}</b><small>${L.area}, from ${lakh(L.base)}</small></div><button class="pill" data-rep="${k}">Replace plan</button></div>`).join('');
    }
    fly.innerHTML = h + '</div>';
    if (animateIn && !RM) fly.querySelectorAll('.th,.row').forEach((n, i) =>
      n.animate([{ opacity: 0, transform: 'translateY(14px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 60 + i * 35, easing: 'cubic-bezier(.22,1.3,.36,1)', fill: 'backwards' }));
  }
  listen(fly, 'click', e => {
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); return removeAsset(del.dataset.del); }
    const rep = e.target.closest('[data-rep]');
    if (rep) { e.stopPropagation(); return pick('layout', 'image/*', rep.dataset.rep); }
    const a = e.target.closest('[data-a]');
    if (a) { if (a.dataset.a === 'up') pick(openF, openF === 'pdf' ? 'application/pdf' : 'image/*,video/*'); else arrangeGallery(true); return; }
    const lay = e.target.closest('[data-lay]');
    if (lay) return openLayout(lay.dataset.lay);
    const t = e.target.closest('[data-id]');
    if (t) { const id = t.dataset.id, ex = onBoard(id); if (ex) { select(ex); fitRect(ex.x, ex.y, ex.x + ex.w, ex.y + ex.h, 2); } else openAsset(openF, id); renderFly(); }
  });
  function openAsset(folder, id) {
    const a = assets[folder].find(x => x.id === id); if (!a) return;
    if (folder === 'pdf') return spawn({ kind: 'pdf', src: a.url, title: a.name, ref: a.id, from: 'pdf' });
    return spawn({ kind: a.type.startsWith('video') ? 'video' : 'image', src: a.url, title: a.name, ref: a.id, from: 'gallery' });
  }
  function arrangeGallery(all) {
    const list = assets.gallery.filter(a => !onBoard(a.id)); if (!list.length) return all && fitAll();
    const cols = Math.ceil(Math.sqrt(list.length)), cell = 420 / view.s, c = viewCenter(), rows = Math.ceil(list.length / cols);
    list.forEach((a, i) => {
      const at = { x: c.x + ((i % cols) - (cols - 1) / 2) * cell + (Math.random() - .5) * 30 / view.s, y: c.y + (Math.floor(i / cols) - (rows - 1) / 2) * cell * 0.82 };
      spawn({ kind: a.type.startsWith('video') ? 'video' : 'image', src: a.url, title: a.name, ref: a.id, at, w: 360 / view.s, from: 'gallery', delay: i * 70 });
    });
    deselect(); setTimeout(fitAll, 120); renderFly();
  }
  function openLayout(key) {
    const ref = 'layout-' + key; let it = onBoard(ref);
    if (!it) it = spawn({ kind: 'plan', src: planSrc(key), title: CONFIG.layouts[key].name, ref, layoutKey: key, from: 'layout' });
    select(it); closeFly();
    setTimeout(() => openQuiz(key), 600);
  }
  function removeAsset(id) {
    ['gallery', 'pdf'].forEach(f => {
      const i = assets[f].findIndex(a => a.id === id); if (i < 0) return;
      const ex = onBoard(id); if (ex) removeItem(ex);
      const a = assets[f][i]; if (!a.sample) { URL.revokeObjectURL(a.url); dbDel(id); }
      assets[f].splice(i, 1);
    });
    renderFly();
  }
  function pick(folder, accept, layoutKey) {
    uploadTarget = { folder, layoutKey }; const inp = $('#file');
    inp.accept = accept; inp.multiple = folder !== 'layout'; inp.value = ''; inp.click();
  }
  listen($('#file'), 'change', e => {
    const files = [...e.target.files]; if (!files.length || !uploadTarget) return;
    const { folder, layoutKey } = uploadTarget;
    files.forEach((f, i) => {
      const a = { id: folder === 'layout' ? 'layout-' + layoutKey : 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), folder, name: f.name.replace(/\.[^.]+$/, ''), type: f.type || 'application/octet-stream', blob: f, size: f.size, layoutKey, url: URL.createObjectURL(f) };
      if (folder === 'layout') {
        assets.layout[layoutKey] = a;
        const ex = onBoard('layout-' + layoutKey); if (ex) ex.el.querySelector('.body img').src = a.url;
      } else assets[folder].push(a);
      dbPut(a);
      if (folder === 'gallery') spawn({ kind: a.type.startsWith('video') ? 'video' : 'image', src: a.url, title: a.name, ref: a.id, from: 'gallery', delay: i * 70 });
      if (folder === 'pdf' && files.length === 1) spawn({ kind: 'pdf', src: a.url, title: a.name, ref: a.id, from: 'pdf' });
    });
    toast(files.length + (files.length === 1 ? ' file added' : ' files added')); bot.mood('happy');
    renderFly();
  });

  /* ---------- questionnaire ---------- */
  const modal = $('#modal'), sheet = $('#sheet');
  const Q = { key: null, step: 0, ans: {}, lead: { name: '', email: '', phone: '' } };
  function openQuiz(key) { Q.key = key; Q.step = 0; Q.ans = {}; modal.classList.add('show'); renderQuiz(); bot.wave(); bot.say("Let's pick your finishes.", 3000, true); }
  function closeQuiz() { modal.classList.remove('show'); }
  listen(modal, 'pointerdown', e => { if (e.target === modal) closeQuiz(); });
  const estimate = () => calculateEstimate(CONFIG.layouts[Q.key], Q.ans);
  function stagger(sel) { if (RM) return; sheet.querySelectorAll(sel).forEach((n, i) => n.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: i * 50, easing: 'cubic-bezier(.22,1.3,.36,1)', fill: 'backwards' })); }
  function countUp(el, to) {
    if (RM) { el.textContent = inr(to); return; }
    const t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3); el.textContent = inr(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function renderQuiz() {
    const L = CONFIG.layouts[Q.key], qs = CONFIG.questions, n = qs.length;
    const dots = '<div class="steps">' + Array.from({ length: n + 2 }, (_, i) => `<i class="${i <= Q.step ? 'done' : ''} ${i === Q.step ? 'cur' : ''}"></i>`).join('') + '</div>';
    const top = `<div class="sh-top"><span class="lay">${L.name}</span>${dots}<button class="x" data-q="close" aria-label="Close">${XSVG}</button></div>`;
    let h = '';
    if (Q.step < n) {
      const q = qs[Q.step], sel = Q.ans[q.id];
      h = `${top}<h2>${q.title}</h2><p class="sub">${q.sub}</p><div class="opts">` + q.options.map((o, i) =>
        `<button class="opt ${sel === i ? 'sel' : ''}" data-opt="${i}"><span class="sw" style="background:${o.sw}"></span><span><b>${o.label}</b><small>${o.desc}</small>${CONFIG.showPriceOnOptions ? `<em>${o.add ? '+ ' + lakh(o.add * L.factor) : 'Included'}</em>` : ''}</span></button>`).join('') +
        `</div><div class="foot">${Q.step ? '<button class="btn" data-q="back">Back</button>' : ''}<span class="grow"></span><button class="btn primary" data-q="next" ${sel === undefined ? 'disabled' : ''}>${Q.step === n - 1 ? 'See estimate' : 'Next'}</button></div>`;
    } else if (Q.step === n) {
      const E = estimate();
      h = `${top}<h2>Your ${L.name}</h2><p class="sub">Here is what you picked and a starting estimate.</p><div class="sum"><div><span>Base interiors (${L.area})</span><b>${inr(E.base)}</b></div>` +
        E.lines.map(l => `<div><span>${l.label}: ${l.choice}</span><b>${l.add ? '+ ' + inr(l.add) : 'Included'}</b></div>`).join('') +
        `</div><div class="total"><span>Starting from</span><b id="tot">₹0</b></div><p class="note">Indicative minimum. The final quote depends on site measurements, brands and scope.</p>
        <div class="foot"><button class="btn" data-q="restart">Change answers</button><span class="grow"></span><button class="btn primary" data-q="next">Email me this</button></div>`;
    } else if (Q.step === n + 1) {
      h = `${top}<h2>Where should we send it?</h2><p class="sub">You'll get this summary and estimate by email.</p>
        <label class="field"><span>Your name</span><input id="f-name" maxlength="100" autocomplete="name" value="${esc(Q.lead.name)}"></label>
        <label class="field"><span>Email</span><input id="f-email" maxlength="254" type="email" inputmode="email" autocomplete="email" value="${esc(Q.lead.email)}"></label>
        <label class="field"><span>Phone (optional)</span><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(Q.lead.phone)}"></label>
        <div class="err" id="f-err" role="alert"></div>
        <div class="foot"><button class="btn" data-q="back">Back</button><span class="grow"></span><button class="btn primary" data-q="send">Send summary</button></div>`;
    }
    sheet.innerHTML = h;
    if (Q.step < n) stagger('h2,.sub,.opt');
    else if (Q.step === n) { stagger('h2,.sub,.sum div,.total'); countUp($('#tot'), estimate().total); }
    else if (Q.step === n + 1) stagger('h2,.sub,.field');
  }
  listen(sheet, 'click', e => {
    const n = CONFIG.questions.length, o = e.target.closest('[data-opt]');
    if (o) {
      const q = CONFIG.questions[Q.step]; Q.ans[q.id] = +o.dataset.opt;
      sheet.querySelectorAll('.opt').forEach((b, i) => b.classList.toggle('sel', i === Q.ans[q.id]));
      sheet.querySelector('[data-q="next"]').disabled = false; bot.mood('happy', 900);
      setTimeout(() => { if (Q.step < n && CONFIG.questions[Q.step] === q) { Q.step++; renderQuiz(); if (Q.step === n) { bot.jump(); bot.say('Here is your estimate!', 3000, true); } } }, 380);
      return;
    }
    const b = e.target.closest('[data-q]'); if (!b) return;
    const a = b.dataset.q;
    if (a === 'close') closeQuiz();
    else if (a === 'back') { saveLead(); Q.step = Q.step > n + 1 ? n + 1 : Q.step - 1; renderQuiz(); }
    else if (a === 'next') { Q.step++; renderQuiz(); if (Q.step === n) { bot.jump(); bot.say('Here is your estimate!', 3000, true); } if (Q.step === n + 1) setTimeout(() => $('#f-name')?.focus(), 350); }
    else if (a === 'restart') { Q.step = 0; renderQuiz(); }
    else if (a === 'send') sendSummary();
  });
  function saveLead() { if ($('#f-name')) Q.lead = { name: $('#f-name').value.trim(), email: $('#f-email').value.trim(), phone: $('#f-phone').value.trim() }; }

  /* ---------- email ---------- */
  function sendSummary() {
    closeQuiz();
    Q.lead = { name: '', email: '', phone: '' };
    toast('Message sent successfully');
  }

  /* ---------- board feedback and keyboard ---------- */
  const toastEl = $('#toast'); let tt;
  function toast(t) { toastEl.textContent = t; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2000); }
  listen(document, 'keydown', e => {
    if (e.target.closest('input')) return;
    if (e.key === 'Escape') { modal.classList.contains('show') ? closeQuiz() : closeFly(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected) removeItem(selected);
  });
  listen(window, 'resize', applyView);

  /* ---------- start ---------- */
  (async () => {
    const c = screenCenter(); view.x = c.x; view.y = c.y; home = { x: c.x, y: c.y }; sizeDots(); applyView();
    await dbOpen();
    if (signal.aborted) { db?.close(); return; }
    const records = await dbAll();
    if (signal.aborted) return;
    records.forEach(r => {
      const a = { ...r, url: URL.createObjectURL(r.blob) };
      if (r.folder === 'layout') assets.layout[r.layoutKey] = a; else if (assets[r.folder]) assets[r.folder].push(a);
    });
    counts(); updateBoardBackground(); resetIdle();
    setTimeout(() => { bot.wave(); bot.say(`Hi, I'm ${CONFIG.botName}! Tap a folder to start.`, 4200, true); }, 700);
  })();

  return () => {
    controller.abort();
    timers.forEach(window.clearTimeout);
    frames.forEach(window.cancelAnimationFrame);
    db?.close();
    assets.gallery.concat(assets.pdf, Object.values(assets.layout))
      .forEach(asset => { if (asset.blob) URL.revokeObjectURL(asset.url); });
    $('#mini').onpointermove = null;
    world.replaceChildren();
    fly.replaceChildren();
    sheet.replaceChildren();
  };
}
