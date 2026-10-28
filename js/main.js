(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var unhide = function () { root.classList.remove('js-anim'); };

  /* header state + mobile call bar (no scroll listeners) */
  var hdr = document.getElementById('hdr');
  var mbar = document.getElementById('mbar');
  var sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:140px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(function (e) {
    var top = e[0].isIntersecting;
    hdr.classList.toggle('is-solid', !top);
    if (mbar) mbar.classList.toggle('show', !top);
  }).observe(sentinel);

  /* mobile menu */
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.setAttribute('aria-hidden', !open);
  }
  burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* reveal + gloss */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.rv, .gloss').forEach(function (el) {
    if (el.closest('.hero')) return;
    io.observe(el);
  });

  /* drag strips: mouse drag, native swipe on touch */
  document.querySelectorAll('[data-drag]').forEach(function (s) {
    var down = false, moved = false, sx = 0, sl = 0;
    s.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = s.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; s.classList.add('dragging'); }
      if (moved) { s.scrollLeft = sl - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      setTimeout(function () { s.classList.remove('dragging'); }, 0);
    });
    s.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });
  function stripOf(id) { var w = document.getElementById(id); return w && w.querySelector('[data-drag]'); }
  document.querySelectorAll('[data-prev],[data-next]').forEach(function (b) {
    b.addEventListener('click', function () {
      var s = stripOf(b.getAttribute('data-prev') || b.getAttribute('data-next'));
      if (!s) return;
      var dir = b.hasAttribute('data-next') ? 1 : -1;
      s.scrollBy({ left: dir * Math.max(280, s.clientWidth * 0.7), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* year */
  document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* contact: today + open status in Edmonton time */
  var hours = document.getElementById('hours');
  if (hours) {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Edmonton', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
      var wd = parts.find(function (p) { return p.type === 'weekday'; }).value;
      var hr = parseInt(parts.find(function (p) { return p.type === 'hour'; }).value, 10) % 24;
      var idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd.slice(0, 3));
      var li = hours.querySelector('[data-day="' + idx + '"]');
      if (li) li.classList.add('today');
      var st = document.getElementById('status');
      var open = hr >= 9 && hr < 20;
      st.classList.toggle('open', open);
      st.querySelector('span').textContent = open ? 'Open now, until 8 pm' : 'Closed now, opens 9 am';
    } catch (e) {}
  }

  /* gallery filter + lightbox */
  var gal = document.getElementById('gal');
  if (gal) {
    var items = Array.prototype.slice.call(gal.querySelectorAll('button'));
    document.querySelectorAll('[data-filter]').forEach(function (f) {
      f.addEventListener('click', function () {
        document.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('on', x === f); });
        var c = f.getAttribute('data-filter');
        items.forEach(function (it) { it.classList.toggle('hide', c !== 'all' && it.getAttribute('data-cat') !== c); });
      });
    });
    var lb = document.getElementById('lb'), lbi = lb.querySelector('img'), cur = 0, last = null;
    function vis() { return items.filter(function (i) { return !i.classList.contains('hide'); }); }
    function show(i) {
      var v = vis(); cur = (i + v.length) % v.length;
      var img = v[cur].querySelector('img');
      lbi.src = v[cur].getAttribute('data-full'); lbi.alt = img.alt;
    }
    function openLb(btn) { last = btn; show(vis().indexOf(btn)); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb__x').focus(); }
    function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (last) last.focus(); }
    items.forEach(function (b) { b.addEventListener('click', function () { openLb(b); }); });
    lb.querySelector('.lb__x').addEventListener('click', closeLb);
    lb.querySelector('.lb__p').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb__n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); });
  }

  /* ---------- GSAP: first screen + signature moments ---------- */
  var heroGloss = document.querySelectorAll('.hero .gloss');
  function glossHero() { heroGloss.forEach(function (g) { g.classList.add('in'); }); }

  if (!window.gsap || reduce) { unhide(); glossHero(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var hero = document.querySelector('.hero');
  var phero = document.querySelector('.phero');
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (hero) {
    gsap.set('.hero h1 .ln > span', { y: 0, yPercent: 125 });
    gsap.set('.hero__tag, .hero__lead, .hero__cta, .rating', { opacity: 0, y: 18 });
    gsap.set('.hero .sun i', { scaleX: 0 });
    gsap.set('.hero__main', { opacity: 0, y: 40, scale: .97 });
    gsap.set('.hero__sub', { opacity: 0, x: -30 });
    gsap.set('.hero__quote', { opacity: 0, y: 16 });
    unhide();
    tl.to('.hero .sun i', { scaleX: 1, duration: .9, stagger: { each: .07, from: 'end' }, ease: 'power4.out' }, 0)
      .to('.hero__main', { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power4.out', onComplete: glossHero }, .15)
      .to('.hero__tag', { opacity: 1, y: 0, duration: .7 }, .1)
      .to('.hero h1 .ln > span', { yPercent: 0, duration: 1.05, stagger: .1 }, .15)
      .to('.hero__lead, .hero__cta, .rating', { opacity: 1, y: 0, duration: .8, stagger: .08 }, .55)
      .to('.hero__sub', { opacity: 1, x: 0, duration: .9 }, .6)
      .to('.hero__quote', { opacity: 1, y: 0, duration: .8 }, .8);
  } else if (phero) {
    gsap.set('.phero h1 .ln > span', { y: 0, yPercent: 125 });
    gsap.set('.phero .kicker, .phero .lead, .phero .btns', { opacity: 0, y: 16 });
    gsap.set('.phero .sun i', { scaleX: 0 });
    unhide();
    tl.to('.phero .kicker', { opacity: 1, y: 0, duration: .6 }, 0)
      .to('.phero h1 .ln > span', { yPercent: 0, duration: 1, stagger: .1 }, .05)
      .to('.phero .lead, .phero .btns', { opacity: 1, y: 0, duration: .8, stagger: .08 }, .4)
      .to('.phero .sun i', { scaleX: 1, duration: .9, stagger: { each: .06, from: 'end' }, ease: 'power4.out' }, 0);
  } else { unhide(); }
  setTimeout(unhide, 3000);

  var mm = gsap.matchMedia();
  mm.add({ all: 'all', wide: '(min-width: 900px)' }, function (ctx) {
    var wide = ctx.conditions.wide;
    /* hero depth on scroll */
    if (hero && wide) {
      gsap.to('.hero__main', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__sub', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero .sun', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    /* the car drives along the route */
    var car = document.getElementById('routeCar');
    if (car && wide) {
      var track = car.parentNode;
      gsap.fromTo(car, { x: 0 }, { x: function () { return track.clientWidth - car.getBoundingClientRect().width; }, ease: 'none',
        scrollTrigger: { trigger: '#route', start: 'top 80%', end: 'bottom 45%', scrub: .6, invalidateOnRefresh: true } });
    }
    /* receipts slide in like tickets being handed over */
    gsap.utils.toArray('.rcpt').forEach(function (r, i) {
      if (i > 5) return;
      gsap.from(r, { y: 50, opacity: 0, rotate: i % 2 ? 2 : -2, duration: .8, delay: i * .07, ease: 'power3.out', scrollTrigger: { trigger: r.closest('.strip'), start: 'top 85%', once: true } });
    });
    /* score counter */
    gsap.utils.toArray('.score b').forEach(function (b) {
      var o = { v: 0 };
      var tw = gsap.to(o, { v: 5, duration: 1.2, ease: 'power2.out', paused: true, onUpdate: function () { b.textContent = o.v.toFixed(1); } });
      ScrollTrigger.create({ trigger: b, start: 'top 92%', once: true, onEnter: function () { if (b.getBoundingClientRect().top < innerHeight * 0.6) return; tw.play(); } });
    });
  });
})();
