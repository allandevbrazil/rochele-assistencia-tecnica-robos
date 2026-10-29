(() => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  let lenis = null;

  if (!REDUCED) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -64, duration: 1.5 });
    else {
      const y = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: 'auto' });
    }
  };

  function buildCursor() {
    if (TOUCH || REDUCED) return;
    const cur = $('.cursor');
    const label = $('.cursor-label');
    const qx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
    const qy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
    document.body.classList.add('has-cursor');
    window.addEventListener('mousemove', (e) => { qx(e.clientX); qy(e.clientY); });
    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor="view"], figure, .bento-item');
      const link = e.target.closest('a, button');
      cur.classList.toggle('is-view', !!view);
      cur.classList.toggle('is-link', !view && !!link);
      label.textContent = view ? 'ver' : '';
    });
  }

  function buildNav() {
    const nav = $('.nav');
    const fab = $('.fab-wa');
    const heroEl = $('#hero');
    let lastY = 0;

    const onScroll = (y) => {
      nav.classList.toggle('is-solid', y > 70);
      nav.classList.toggle('is-hidden', y > 520 && y > lastY && !$('.menu-overlay').classList.contains('is-open'));
      fab.classList.toggle('is-on', y > (heroEl ? heroEl.offsetHeight : window.innerHeight * 1.4));
      lastY = y;
    };

    if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

    const btn = $('.menu-btn');
    const overlay = $('.menu-overlay');
    const setMenu = (open) => {
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      overlay.classList.toggle('is-open', open);
      overlay.setAttribute('aria-hidden', String(!open));
      overlay.inert = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      if (open) setTimeout(() => $('.menu-list a', overlay).focus(), 160);
      else btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', () => setMenu(!btn.classList.contains('is-open')));

    $$('a[data-scroll]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || !id.startsWith('#')) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        setMenu(false);
        scrollToTarget(target);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) setMenu(false);
    });
  }

  function buildHero() {
    const hero = $('#hero');
    const intro = $('.ho-intro');
    const overlays = [intro, $('.ho-1'), $('.ho-2'), $('.ho-3'), $('.ho-4'), $('.ho-5'), $('.ho-final')];
    const stateEl = $('#hudState');
    const barEl = $('#hudBar');
    const stepEl = $('#hudStep');
    const labels = ['a rotina', 'a sujeira', 'a falha', 'o diagnóstico', 'por dentro', 'a limpeza', 'pronto'];
    let activeChapter = 0;
    let activeOverlay = 0;

    if (REDUCED) {
      gsap.set(intro, { autoAlpha: 1 });
      return;
    }

    gsap.set(overlays.slice(1), { autoAlpha: 0 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6
      }
    });

    tl.to(intro, { autoAlpha: 0, y: -50, duration: 0.04 }, 0.05)
      .fromTo('.ho-1', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.035 }, 0.14)
      .to('.ho-1', { autoAlpha: 0, y: -55, duration: 0.03 }, 0.23)
      .fromTo('.ho-2', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.035 }, 0.27)
      .to('.ho-2', { autoAlpha: 0, y: -55, duration: 0.03 }, 0.36)
      .fromTo('.ho-3', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.035 }, 0.39)
      .to('.ho-3', { autoAlpha: 0, y: -55, duration: 0.03 }, 0.47)
      .fromTo('.ho-4', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.035 }, 0.5)
      .to('.ho-4', { autoAlpha: 0, y: -55, duration: 0.03 }, 0.68)
      .fromTo('.ho-5', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.035 }, 0.72)
      .to('.ho-5', { autoAlpha: 0, y: -55, duration: 0.03 }, 0.84)
      .fromTo('.ho-final', { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.87)
      .to('.ho-final', { autoAlpha: 0, y: -40, duration: 0.025 }, 0.985);

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) {
        const p = self.progress;
        barEl.style.width = (p * 100).toFixed(1) + '%';

        let chapter = 0;
        if (p >= 0.853) chapter = 6;
        else if (p >= 0.701) chapter = 5;
        else if (p >= 0.475) chapter = 4;
        else if (p >= 0.364) chapter = 3;
        else if (p >= 0.254) chapter = 2;
        else if (p >= 0.143) chapter = 1;

        let overlay = 0;
        if (p >= 0.87) overlay = 6;
        else if (p >= 0.71) overlay = 5;
        else if (p >= 0.49) overlay = 4;
        else if (p >= 0.38) overlay = 3;
        else if (p >= 0.26) overlay = 2;
        else if (p >= 0.13) overlay = 1;

        if (chapter !== activeChapter) {
          activeChapter = chapter;
          stateEl.textContent = labels[chapter];
          stepEl.textContent = String(chapter + 1).padStart(2, '0');
        }
        if (overlay !== activeOverlay) {
          activeOverlay = overlay;
          overlays.forEach((o, i) => o.classList.toggle('is-live', i === activeOverlay));
        }
        gsap.to('.hero-scroll', { autoAlpha: p > 0.03 ? 0 : 1, duration: 0.4, overwrite: true });
      }
    });

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      onLeave: () => hero.classList.add('is-past'),
      onEnterBack: () => hero.classList.remove('is-past')
    });
  }

  function buildIntro() {
    if (REDUCED) return;
    gsap.fromTo('.hero-title .line > span',
      { yPercent: 115, rotate: 2 },
      { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.09, ease: 'power4.out', delay: 0.2 });
    gsap.fromTo('.ho-intro .eyebrow', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', delay: 0.15 });
    gsap.fromTo('.ho-intro .hero-sub', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', delay: 0.75 });
    gsap.fromTo('.ho-intro .hero-actions', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.05, ease: 'power3.out', delay: 0.9 });
    gsap.fromTo('.hero-hud, .hero-scroll', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: 'power2.out', delay: 1.2 });
  }

  function buildReveals() {
    if (REDUCED) return;
    $$('[data-reveal]').forEach((el) => {
      gsap.fromTo(el,
        { y: 42, autoAlpha: 0 },
        {
          y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        });
    });
  }

  function buildParallax() {
    if (REDUCED) return;
    $$('[data-parallax]').forEach((box) => {
      const img = $('img', box);
      if (!img) return;
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  function buildTilt() {
    if (TOUCH || REDUCED) return;
    $$('[data-tilt]').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * 4);
        ry(px * 4);
      });
      card.addEventListener('mouseleave', () => { rx(0); ry(0); });
    });
  }

  function buildSpots() {
    const spots = $$('.hotspot');
    const btns = $$('[data-spot-btn]');
    if (!spots.length) return;

    const setActive = (id) => {
      spots.forEach((s) => s.classList.toggle('is-active', s.dataset.spot === id));
      btns.forEach((b) => {
        const on = b.dataset.spotBtn === id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    };

    btns.forEach((b) => {
      b.addEventListener('click', () => setActive(b.dataset.spotBtn));
      b.addEventListener('mouseenter', () => setActive(b.dataset.spotBtn));
    });
    spots.forEach((s) => {
      s.addEventListener('click', () => setActive(s.dataset.spot));
      s.addEventListener('mouseenter', () => setActive(s.dataset.spot));
    });
  }

  function buildProcess() {
    if (REDUCED) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const track = $('.p-track');
      if (!track) return;
      const dist = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.processo',
          start: 'top top',
          end: () => '+=' + dist(),
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      $$('.p-glyph').forEach((g) => {
        gsap.fromTo(g, { rotate: -18, scale: 0.8 }, {
          rotate: 18, scale: 1.1, ease: 'none',
          scrollTrigger: {
            trigger: g.closest('.p-panel'),
            containerAnimation: tween,
            start: 'left right',
            end: 'right left',
            scrub: true
          }
        });
      });
    });
  }

  function buildFaq() {
    const items = $$('.faq-item');
    items.forEach((item) => {
      const btn = $('.faq-q', item);
      btn.addEventListener('click', () => {
        const open = item.classList.contains('is-open');
        items.forEach((i) => {
          i.classList.remove('is-open');
          $('.faq-q', i).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
        ScrollTrigger.refresh();
      });
    });
  }

  function buildDepo() {
    const slides = $$('.depo');
    if (!slides.length) return;
    const dotsBox = $('.depo-dots');
    let idx = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'depo-dot' + (i === 0 ? ' is-on' : '');
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Avaliação ' + (i + 1));
      d.setAttribute('aria-selected', String(i === 0));
      d.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(d);
    });
    const dots = $$('.depo-dot', dotsBox);

    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
      dots.forEach((d, k) => {
        d.classList.toggle('is-on', k === idx);
        d.setAttribute('aria-selected', String(k === idx));
      });
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!REDUCED) timer = setInterval(() => go(idx + 1), 6500);
    }

    $('#depoPrev').addEventListener('click', () => { go(idx - 1); restart(); });
    $('#depoNext').addEventListener('click', () => { go(idx + 1); restart(); });

    const stage = $('.depo-stage');
    stage.addEventListener('mouseenter', () => timer && clearInterval(timer));
    stage.addEventListener('mouseleave', restart);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (timer) clearInterval(timer); }
      else restart();
    });
    restart();
  }

  function buildCounters() {
    if (REDUCED) return;
    $$('.stat-num').forEach((el) => {
      const sup = $('sup', el);
      const suffix = sup ? sup.outerHTML : '';
      const raw = el.textContent.replace(/[^0-9.]/g, '');
      const target = parseFloat(raw);
      if (Number.isNaN(target)) return;
      const decimals = raw.includes('.') ? 1 : 0;
      gsap.fromTo({ v: 0 }, { v: 0 }, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
        onUpdate() {
          el.innerHTML = (decimals ? this.targets()[0].v.toFixed(1) : Math.round(this.targets()[0].v)) + suffix;
        }
      });
    });
  }

  function boot() {
    buildCursor();
    buildNav();
    buildHero();
    buildReveals();
    buildParallax();
    buildTilt();
    buildSpots();
    buildProcess();
    buildFaq();
    buildDepo();
    buildCounters();

    const pctEl = $('#loadPct');
    const ringEl = $('.loader-ring');
    const RING_LEN = 390;
    const load = { v: 0 };
    gsap.to(load, {
      v: 92,
      duration: 2.1,
      ease: 'power1.out',
      onUpdate() {
        if (pctEl) pctEl.textContent = Math.round(load.v);
        if (ringEl) ringEl.style.strokeDashoffset = String(RING_LEN * (1 - load.v / 100));
      }
    });

    const safety = setTimeout(release, 4200);
    let heroReady = !!window.__filmReadySent;
    let minimumDone = false;

    window.addEventListener('heroready', () => {
      heroReady = true;
      maybeRelease();
    }, { once: true });

    setTimeout(() => { minimumDone = true; maybeRelease(); }, 1600);

    function maybeRelease() {
      if (!heroReady || !minimumDone) return;
      clearTimeout(safety);
      release();
    }

    function release() {
      if (document.body.classList.contains('is-ready')) return;
      document.body.classList.add('is-ready');
      const loader = $('#loader');
      const pct = $('#loadPct');
      if (pct) pct.textContent = '100';
      const ring = $('.loader-ring');
      if (ring) ring.style.strokeDashoffset = '0';
      document.body.classList.remove('is-loading');
      loader.classList.add('is-done');
      if (lenis) lenis.start();
      buildIntro();
      ScrollTrigger.refresh();
      setTimeout(() => ScrollTrigger.refresh(), 800);
    }
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.__PAGE_DEBUG__ = {
    reduced: REDUCED,
    touch: TOUCH,
    refresh: () => ScrollTrigger.refresh(),
    scrollTo: (y, instant = true) => {
      if (lenis) lenis.scrollTo(y, { immediate: instant, force: true });
      else window.scrollTo(0, y);
    },
    scrollToEl: (sel) => {
      const el = $(sel);
      if (el) scrollToTarget(el);
    }
  };
})();
