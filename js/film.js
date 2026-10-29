(() => {
  'use strict';

  const canvas = document.getElementById('film');
  const hero = document.getElementById('hero');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const manifest = window.__HERO_FRAMES__ || { count: 218, prefix: 'f-', pad: 4, ext: '.webp' };
  const COUNT = manifest.count;

  const ready = () => {
    if (window.__filmReadySent) return;
    window.__filmReadySent = true;
    window.dispatchEvent(new Event('heroready'));
  };

  if (!canvas || !hero) {
    ready();
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    document.documentElement.classList.add('no-canvas');
    ready();
    return;
  }

  if (REDUCED) {
    ready();
    return;
  }

  const frames = new Array(COUNT);
  const src = (i) => `assets/hero/${manifest.prefix}${String(i + 1).padStart(manifest.pad, '0')}${manifest.ext}`;

  let current = -1;
  let target = 0;
  let smooth = 0;
  let drawnFirst = false;
  let loadedCount = 0;

  function sizeCanvas() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6, 2600 / Math.max(1, w));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function usable(img) {
    return img && img.complete && img.naturalWidth > 0;
  }

  function focusForFrame(index) {
    if (index <= 30) return 0.55;
    if (index <= 54) return 0.68;
    if (index <= 78) return 0.5;
    if (index <= 102) return 0.52;
    if (index <= 151) return 0.5;
    if (index <= 184) return 0.47;
    return 0.5;
  }

  function drawImage(img, index) {
    if (!usable(img)) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const portrait = canvas.clientWidth / canvas.clientHeight < 0.95;
    let dx = (cw - dw) / 2;
    if (portrait) {
      const focal = focusForFrame(index);
      dx = Math.min(0, Math.max(cw - dw, cw / 2 - focal * iw * scale));
    }
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, (ch - dh) / 2, dw, dh);
  }

  function drawFrame(index) {
    let j = Math.max(0, Math.min(COUNT - 1, index));
    while (j > 0 && !usable(frames[j])) j--;
    if (!usable(frames[j])) {
      for (let k = j + 1; k < COUNT; k++) {
        if (usable(frames[k])) { j = k; break; }
      }
    }
    if (usable(frames[j])) {
      drawImage(frames[j], j);
      current = index;
      if (!drawnFirst) {
        drawnFirst = true;
        canvas.classList.add('is-on');
      }
    }
  }

  function loadFrame(i) {
    return new Promise((resolve) => {
      if (frames[i]) { resolve(frames[i]); return; }
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
        resolve(img);
      };
      img.onerror = () => {
        frames[i] = null;
        resolve(null);
      };
      img.src = src(i);
    });
  }

  async function preload() {
    await loadFrame(0);
    drawFrame(0);

    const gate = Math.min(40, COUNT);
    const firstBatch = [];
    for (let i = 1; i < gate; i++) firstBatch.push(loadFrame(i));
    Promise.all(firstBatch).then(() => ready());

    const safety = setTimeout(ready, 2800);
    Promise.all(firstBatch).then(() => clearTimeout(safety));

    setTimeout(() => {
      if (!drawnFirst) document.documentElement.classList.add('no-canvas');
    }, 3600);

    const order = [];
    for (let i = gate; i < COUNT; i += 4) order.push(i);
    const queued = new Set(order);
    for (let i = gate; i < COUNT; i++) {
      if (!queued.has(i)) { order.push(i); queued.add(i); }
    }

    let cursor = 0;
    const CONCURRENCY = 7;
    const worker = async () => {
      while (cursor < order.length) {
        const i = order[cursor++];
        await loadFrame(i);
        const wanted = Math.round(smooth * (COUNT - 1));
        if (Math.abs(i - wanted) < 4) drawFrame(wanted);
      }
    };
    Array.from({ length: CONCURRENCY }, worker);
  }

  function setTarget(p) {
    target = Math.min(1, Math.max(0, p));
  }

  function tick() {
    smooth += (target - smooth) * 0.14;
    const idx = Math.round(smooth * (COUNT - 1));
    if (idx !== current) drawFrame(idx);
    requestAnimationFrame(tick);
  }

  sizeCanvas();
  preload();

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) { setTarget(self.progress); }
    });
  } else {
    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setTarget(total > 0 ? -rect.top / total : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    sizeCanvas();
    drawFrame(Math.round(smooth * (COUNT - 1)));
  });

  window.__FILM__ = {
    count: COUNT,
    loaded: () => loadedCount,
    progress: () => smooth,
    setProgress: (p) => { setTarget(p); smooth = p; drawFrame(Math.round(p * (COUNT - 1))); }
  };
  window.__HERO__ = window.__FILM__;
})();
