/* ===========================================================
   HOLLYWOOD CLINIC — main.js
   Scroll reveal, mobile menu, before/after slider, etc.
   =========================================================== */

(function () {
  'use strict';

  // ============ Scroll Reveal ============
  const fadeEls = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach((el) => io.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('visible'));
  }

  // ============ Mobile Menu ============
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        menuBtn.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ============ Treatments Submenu (desktop dropdown + mobile accordion) ============
  // Desktop: click button to toggle dropdown; close on outside click or Escape.
  document.querySelectorAll('.nav-submenu-wrapper').forEach((wrap) => {
    const btn = wrap.querySelector('.nav-submenu-toggle');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Close when a submenu item is clicked
    wrap.querySelectorAll('.nav-submenu a').forEach((a) => {
      a.addEventListener('click', () => {
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  });
  // Outside click closes any open desktop submenu
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-submenu-wrapper.open').forEach((w) => {
      if (!w.contains(e.target)) {
        w.classList.remove('open');
        const tBtn = w.querySelector('.nav-submenu-toggle');
        if (tBtn) tBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-submenu-wrapper.open').forEach((w) => {
        w.classList.remove('open');
        const tBtn = w.querySelector('.nav-submenu-toggle');
        if (tBtn) tBtn.setAttribute('aria-expanded', 'false');
      });
    }
  });
  // Mobile accordion submenu
  document.querySelectorAll('.mobile-submenu-wrapper').forEach((wrap) => {
    const btn = wrap.querySelector('.mobile-submenu-arrow');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // ============ 2nd-level submenu (Body Shaping / Skin Rejuvenation) ============
  // Desktop: nested side-flyout — clicking a sub-sub toggle opens the nested panel.
  // Only one nested panel within the same parent submenu can be open at a time.
  document.querySelectorAll('.nav-subsubmenu-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't trigger the outside-click closer for the parent submenu
      const wrap = btn.parentElement; // .nav-subsubmenu-wrapper
      const wasOpen = wrap.classList.contains('open');
      // Close all sibling nested panels first
      const parentMenu = wrap.parentElement;
      if (parentMenu) {
        parentMenu.querySelectorAll('.nav-subsubmenu-wrapper.open').forEach((w) => {
          if (w !== wrap) {
            w.classList.remove('open');
            const tBtn = w.querySelector('.nav-subsubmenu-toggle');
            if (tBtn) tBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
      // Toggle this one
      if (wasOpen) {
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        wrap.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Mobile: nested accordion — clicking a sub-sub toggle expands the nested items.
  document.querySelectorAll('.mobile-subsubmenu-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.parentElement; // .mobile-subsubmenu-wrapper
      const isOpen = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // ============ Active Nav State ============
  // Normalise both sides: cleanUrls means the address bar shows /booking, while
  // data-nav may still say booking.html. Strip the extension, the /ar prefix and
  // any surrounding slashes so either form matches.
  const normNav = (v) => (v || '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/^ar(\/|$)/, '')
    .replace(/\.html$/, '') || 'index';
  const path = normNav(window.location.pathname);
  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (normNav(link.getAttribute('data-nav')) === path) {
      link.classList.add('active');
    }
  });

  // ============ Footer Collapsible Columns (mobile only) ============
  // Quick Links + Contact Us headings tap-to-expand on mobile (≤767px).
  // The CSS uses `pointer-events: none` on desktop, so this handler is harmless there.
  document.querySelectorAll('.footer-col-collapsible .footer-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const col = btn.parentElement;
      const isOpen = col.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // ============ Before / After Slider ============
  document.querySelectorAll('.ba-slider').forEach((slider) => {
    const before = slider.querySelector('.ba-before');
    const handle = slider.querySelector('.ba-handle');
    if (!before || !handle) return;

    const isRTL = document.body.getAttribute('dir') === 'rtl';
    let dragging = false;

    function setPosition(pct) {
      pct = Math.max(5, Math.min(95, pct));
      handle.style.left = pct + '%';
      if (isRTL) {
        before.style.clipPath = `inset(0 0 0 ${pct}%)`;
      } else {
        before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      }
    }

    function moveFromEvent(clientX) {
      const rect = slider.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setPosition(pct);
    }

    slider.addEventListener('mousedown', (e) => {
      dragging = true;
      moveFromEvent(e.clientX);
      e.preventDefault();
    });
    slider.addEventListener('touchstart', (e) => {
      dragging = true;
      moveFromEvent(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => { if (dragging) moveFromEvent(e.clientX); });
    window.addEventListener('touchmove', (e) => { if (dragging) moveFromEvent(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('touchend', () => { dragging = false; });

    // Animate on first scroll-in
    const sliderIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !slider.dataset.animated) {
          slider.dataset.animated = 'true';
          let start = performance.now();
          const dur = 1800;
          function tick(now) {
            const t = Math.min((now - start) / dur, 1);
            // ease in-out then settle around 30%
            const eased = t < 0.5
              ? 50 + (25 - 50) * (t * 2)
              : 25 + (75 - 25) * ((t - 0.5) * 2);
            const final = t < 1 ? eased : 35;
            setPosition(final);
            if (t < 1) requestAnimationFrame(tick);
          }
          setTimeout(() => requestAnimationFrame(tick), 300);
          sliderIO.unobserve(slider);
        }
      });
    }, { threshold: 0.4 });
    sliderIO.observe(slider);
  });

  // ====== Before/After tiles (home) → TAP opens the full gallery ======
  // Document-level delegation so it survives i18n re-injecting the page body.
  // A quick tap navigates; a drag-to-reveal (>8px move) does not.
  (function () {
    var sx = 0, sy = 0, tracking = false, far = false, active = null;
    function homeTile(t) {
      var s = (t && t.closest) ? t.closest('.ba-slider') : null;
      return (s && s.closest('#before-after')) ? s : null;
    }
    function down(x, y, t) { active = homeTile(t); tracking = !!active; far = false; sx = x; sy = y; }
    function move(x, y) { if (tracking && Math.abs(x - sx) + Math.abs(y - sy) > 8) far = true; }
    function up() { if (tracking && active && !far) window.location.href = 'results'; tracking = false; active = null; }
    document.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY, e.target); }, true);
    document.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); }, true);
    document.addEventListener('mouseup', up, true);
    document.addEventListener('touchstart', function (e) { var t = e.touches[0]; down(t.clientX, t.clientY, e.target); }, { capture: true, passive: true });
    document.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { capture: true, passive: true });
    document.addEventListener('touchend', up, true);
  })();

  // ============ Navbar shadow on scroll ============
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 20) {
        nav.style.boxShadow = '0 4px 20px -8px rgba(11,29,58,0.1)';
      } else {
        nav.style.boxShadow = '';
      }
      lastY = y;
    }, { passive: true });
  }
})();

/* ═══════════════════════════════════════════════════════════
   TESTIMONIAL SLIDESHOW — one at a time, auto-advancing
   ═══════════════════════════════════════════════════════════ */
(function () {
  function initSlideshow(root) {
    var track  = root.querySelector('[data-testimonial-track]');
    var prev   = root.querySelector('[data-testimonial-prev]');
    var next   = root.querySelector('[data-testimonial-next]');
    var dotsEl = root.querySelector('[data-testimonial-dots]');
    if (!track) return;

    var cards = Array.prototype.slice.call(track.children);
    if (cards.length <= 1) {
      if (prev) prev.style.display = 'none';
      if (next) next.style.display = 'none';
      if (dotsEl) dotsEl.style.display = 'none';
      return;
    }

    var index = 0;
    var autoplayMs = parseInt(root.getAttribute('data-autoplay-ms'), 10) || 6000;
    var timer = null;
    var isHover = false;

    // Build dots
    if (dotsEl) {
      dotsEl.innerHTML = '';
      cards.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonial-dot';
        dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
        dot.setAttribute('role', 'tab');
        dot.addEventListener('click', function () { goTo(i, true); });
        dotsEl.appendChild(dot);
      });
    }

    function isRTL() { return document.body.getAttribute('dir') === 'rtl'; }

    function applyTransform() {
      var pct = index * 100;
      track.style.transform = 'translateX(' + (isRTL() ? '' : '-') + pct + '%)';
    }

    function updateDots() {
      if (!dotsEl) return;
      var ds = dotsEl.querySelectorAll('.testimonial-dot');
      for (var i = 0; i < ds.length; i++) {
        if (i === index) ds[i].setAttribute('aria-current', 'true');
        else ds[i].removeAttribute('aria-current');
      }
    }

    function goTo(i, userTriggered) {
      index = (i + cards.length) % cards.length;
      applyTransform();
      updateDots();
      if (userTriggered) restartAutoplay();
    }

    function nextSlide() { goTo(index + 1); }
    function prevSlide() { goTo(index - 1); }

    function startAutoplay() {
      stopAutoplay();
      if (autoplayMs > 0) {
        timer = setInterval(function () {
          if (!isHover && !document.hidden) nextSlide();
        }, autoplayMs);
      }
    }
    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (prev) prev.addEventListener('click', function () { prevSlide(); restartAutoplay(); });
    if (next) next.addEventListener('click', function () { nextSlide(); restartAutoplay(); });

    root.addEventListener('mouseenter', function () { isHover = true; });
    root.addEventListener('mouseleave', function () { isHover = false; });
    root.addEventListener('focusin', function () { isHover = true; });
    root.addEventListener('focusout', function () { isHover = false; });

    // Keyboard support
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { isRTL() ? nextSlide() : prevSlide(); restartAutoplay(); }
      if (e.key === 'ArrowRight') { isRTL() ? prevSlide() : nextSlide(); restartAutoplay(); }
    });

    // Touch swipe support (mobile)
    var startX = 0, deltaX = 0, swiping = false;
    track.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      deltaX = 0;
      swiping = true;
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      if (!swiping || e.touches.length !== 1) return;
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });
    track.addEventListener('touchend', function () {
      if (!swiping) return;
      swiping = false;
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) { isRTL() ? prevSlide() : nextSlide(); }
        else            { isRTL() ? nextSlide() : prevSlide(); }
        restartAutoplay();
      }
    });

    // Re-apply transform when language switches (RTL flips direction)
    var langObserver = new MutationObserver(function () { applyTransform(); });
    langObserver.observe(document.body, { attributes: true, attributeFilter: ['dir'] });

    // Init
    applyTransform();
    updateDots();
    startAutoplay();
  }

  function initAll() {
    var roots = document.querySelectorAll('[data-testimonial-slideshow]');
    Array.prototype.forEach.call(roots, initSlideshow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  /* ═══════════════════════════════════════════════════════════════
     ANIMATION SYSTEM — 6 JS-driven enhancements
     ═══════════════════════════════════════════════════════════════ */

  // Respect user's motion preference — bail out entirely if reduced
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isTouch() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  /* ─── #1 Hero stagger reveal — applied to page-hero sections only ─── */
  /* (The home .hero already uses manual .fade-up d1/d2/d3 chains.) */
  function initHeroStagger() {
    if (prefersReduced) return;
    var heroes = document.querySelectorAll('.page-hero');
    heroes.forEach(function (hero) {
      var inner = hero.querySelector('.container') || hero;
      // Skip if any child already has fade-up (avoid double-animation)
      if (inner.querySelector(':scope > .fade-up')) return;
      inner.classList.add('anim-hero-stagger');
      requestAnimationFrame(function () {
        inner.classList.add('played');
      });
    });
  }

  /* ─── #2 Gold line draw-in — animate .lux-line when in view ─── */
  function initLuxLines() {
    if (prefersReduced) {
      document.querySelectorAll('.lux-line').forEach(function (l) { l.classList.add('drawn'); });
      return;
    }
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.lux-line').forEach(function (l) { l.classList.add('drawn'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('drawn');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.lux-line').forEach(function (l) { io.observe(l); });
  }

  /* ─── #3 Number count-up — any element with [data-count-to] ─── */
  function initCountUp() {
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-count-to')) || 0;
        var suffix = el.getAttribute('data-count-suffix') || '';
        var fmt = el.getAttribute('data-count-format') || (target >= 10000 ? 'k' : 'comma');
        el.textContent = formatCount(target, fmt) + suffix;
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  function formatCount(n, fmt) {
    n = Math.round(n);
    if (fmt === 'k') {
      // 100000 → "100K", 1500 → "1.5K"
      if (n >= 1000) {
        var k = n / 1000;
        return (k >= 100 ? Math.round(k) : (Math.round(k * 10) / 10)) + 'K';
      }
      return n.toString();
    }
    if (n >= 1000) return n.toLocaleString();
    return n.toString();
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count-to')) || 0;
    var suffix = el.getAttribute('data-count-suffix') || '';
    var fmt = el.getAttribute('data-count-format') || (target >= 10000 ? 'k' : 'comma');
    var duration = parseInt(el.getAttribute('data-count-duration'), 10) || 2400;
    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var current = target * eased;
      el.textContent = formatCount(current, fmt) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = formatCount(target, fmt) + suffix;
    }
    requestAnimationFrame(tick);
  }

  /* ─── #6 Service-card stagger — auto-stagger fade-up inside grids ─── */
  function initStaggerGrids() {
    var grids = document.querySelectorAll('.grid');
    grids.forEach(function (grid) {
      var cards = grid.querySelectorAll(':scope > .fade-up');
      if (cards.length < 3) return; // not worth staggering
      cards.forEach(function (card, i) {
        // Only add stagger class if no manual delay class is present
        if (!/\bd[1-6]\b/.test(card.className)) {
          card.classList.add('stagger-' + Math.min(i + 1, 8));
        }
      });
    });
  }

  /* ─── #7 Parallax on hero background (animates background-position) ─── */
  function initHeroParallax() {
    if (prefersReduced) return;
    var hero = document.querySelector('.hero');
    if (!hero) return;
    // Reduce parallax strength on mobile (less motion sickness risk)
    var isMobile = window.innerWidth < 768;
    var strength = isMobile ? 0.15 : 0.3;
    // Horizontal focal point: center the model on mobile, centered image on desktop
    var posX = isMobile ? '70%' : 'center';
    var ticking = false;
    function update() {
      var rect = hero.getBoundingClientRect();
      // Only update when hero is visible-ish
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        ticking = false;
        return;
      }
      var offset = -rect.top * strength;
      hero.style.backgroundPosition = posX + ' calc(50% + ' + offset + 'px)';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ─── #18 Before/After auto-demo on first view ─── */
  function initBeforeAfterAutoDemo() {
    if (prefersReduced) return;
    if (!('IntersectionObserver' in window)) return;
    var sliders = document.querySelectorAll('.ba-slider');
    if (!sliders.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var slider = entry.target;
        // Skip if already auto-demoed or being interacted with
        if (slider.classList.contains('auto-demo') || slider.classList.contains('demo-done')) return;
        if (slider.dataset.userInteracted === '1') return;
        slider.classList.add('auto-demo');
        // After animation completes, mark done & remove class so user interaction takes over
        setTimeout(function () {
          slider.classList.remove('auto-demo');
          slider.classList.add('demo-done');
        }, 2300);
        io.unobserve(slider);
      });
    }, { threshold: 0.6 });
    sliders.forEach(function (s) {
      // If user touches the slider, mark it so auto-demo won't fire
      ['mousedown', 'touchstart'].forEach(function (ev) {
        s.addEventListener(ev, function () { s.dataset.userInteracted = '1'; }, { once: true, passive: true });
      });
      io.observe(s);
    });
  }

  /* ─── #19 Cursor-follow glow on hero (desktop, no-touch only) ─── */
  function initCursorGlow() {
    if (prefersReduced) return;
    if (isTouch()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var heroes = document.querySelectorAll('.hero');
    heroes.forEach(function (hero) {
      // Only add to the home page hero, not other section heroes
      if (!hero.classList.contains('hero')) return;
      var glow = document.createElement('div');
      glow.className = 'hero-cursor-glow';
      // Ensure hero is positioned
      var computed = window.getComputedStyle(hero);
      if (computed.position === 'static') hero.style.position = 'relative';
      hero.appendChild(glow);
      hero.addEventListener('mousemove', function (e) {
        var rect = hero.getBoundingClientRect();
        glow.style.left = (e.clientX - rect.left) + 'px';
        glow.style.top  = (e.clientY - rect.top)  + 'px';
      });
    });
  }

  /* ─── #20 Scroll progress bar ─── */
  function initScrollProgress() {
    if (prefersReduced) return;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('div');
    fill.className = 'scroll-progress-fill';
    bar.appendChild(fill);
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (window.pageYOffset / docHeight) * 100 : 0;
      fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ─── #16 Smooth scroll polish — offset for sticky navbar ─── */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var navbar = document.querySelector('.navbar');
      var offset = navbar ? navbar.offsetHeight + 12 : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     PHASE 2 ANIMATION PACK — 5 new JS-driven effects
     (#3 Gold shine and #4 Image zoom are pure CSS, no JS needed)
     ═══════════════════════════════════════════════════════════ */

  // Helper: detect hover-capable devices (skip card tilt / magnetic on touch)
  function isHoverDevice() {
    return window.matchMedia && window.matchMedia('(hover: hover)').matches;
  }

  /* ─── #1 Magnetic CTA buttons ─────────────────────────────
     Buttons subtly attract toward the cursor on hover.
     Applied automatically to .btn-navy, .btn-gold, .btn-primary,
     and any element with [data-magnetic]. */
  function initMagneticButtons() {
    if (prefersReduced || !isHoverDevice()) return;
    var btns = document.querySelectorAll(
      '.btn-navy, .btn-gold, .btn-primary, [data-magnetic]'
    );
    btns.forEach(function (btn) {
      btn.classList.add('btn-magnetic');
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        // 0.25 = subtle pull strength; raise for more dramatic
        btn.style.transform = 'translate(' + (x * 0.25) + 'px, ' + (y * 0.25) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ─── #2 3D card tilt on hover ────────────────────────────
     Cards tilt in 3D toward the cursor. Applied automatically
     to .card and .sub-card. Skips touch devices entirely. */
  function initCardTilt() {
    if (prefersReduced || !isHoverDevice()) return;
    var cards = document.querySelectorAll('.card, .sub-card');
    cards.forEach(function (card) {
      card.classList.add('card-tilt');
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        // Max ±5deg — subtle, premium feel (not gimmicky)
        var tiltX = ((y - cy) / cy) * -5;
        var tiltY = ((x - cx) / cx) * 5;
        card.style.transform =
          'perspective(1200px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ─── #5 Letter-by-letter heading reveal ──────────────────
     Opt-in only via [data-letter-reveal] attribute. Splits text
     into per-letter spans and reveals on scroll with a stagger.
     NOT applied to the hero h1 (would conflict with i18n spans). */
  function initLetterReveal() {
    var targets = document.querySelectorAll('[data-letter-reveal]');
    if (!targets.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('letter-reveal', 'played'); });
      return;
    }

    targets.forEach(function (el) {
      // Don't double-process if user re-runs init
      if (el.querySelector('.letter')) return;
      el.classList.add('letter-reveal');
      var text = el.textContent;
      var html = text.split(' ').map(function (word) {
        var letters = word.split('').map(function (ch) {
          return '<span class="letter">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
        }).join('');
        return '<span class="word">' + letters + '</span>';
      }).join(' ');
      el.innerHTML = html;
      // Stagger each letter by 25ms
      el.querySelectorAll('.letter').forEach(function (l, i) {
        l.style.transitionDelay = (i * 0.025) + 's';
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('played');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ─── Hero title letter-by-letter reveal ──────────────────────
     Runs after i18n sets the text, and again on language switch.
     English (LTR): each letter slides up in sequence.
     Arabic (RTL): shown plain — Arabic letters are cursive/joined,
     so splitting them per-letter would break the shaping. */
  function initHeroTitleReveal() {
    var h1 = document.querySelector('.hero h1');
    if (!h1) return;
    var parts = h1.querySelectorAll('[data-i18n]');
    if (!parts.length) return;

    function showPlain() {
      Array.prototype.forEach.call(parts, function (el) {
        el.classList.remove('letter-reveal', 'played');
      });
    }

    function wrap(el, startIndex) {
      var idx = startIndex;
      var html = el.textContent.split(' ').map(function (word) {
        var letters = word.split('').map(function (ch) {
          var span = '<span class="letter" style="transition-delay:' + (idx * 0.045) + 's">' + ch + '</span>';
          idx++;
          return span;
        }).join('');
        return '<span class="word">' + letters + '</span>';
      }).join(' ');
      el.classList.add('letter-reveal');
      el.innerHTML = html;
      return idx;
    }

    function run() {
      var lang = document.documentElement.getAttribute('lang') || 'en';
      if (prefersReduced || lang === 'ar') { showPlain(); return; }
      var idx = 0;
      Array.prototype.forEach.call(parts, function (el) {
        if (!el.querySelector('.letter')) idx = wrap(el, idx);
        else idx += el.querySelectorAll('.letter').length;
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          Array.prototype.forEach.call(parts, function (el) { el.classList.add('played'); });
        });
      });
    }

    document.addEventListener('i18n:applied', run);
    run();
  }

  /* ─── Hero CTA buttons: staggered fade/slide-in after the heading ───
     Uses inline styles, then clears them once settled so the button
     hover lift and magnetic-cursor transforms keep working. */
  function initHeroButtonsReveal() {
    var cta = document.querySelector('.hero .hero-cta');
    if (!cta) return;
    var btns = Array.prototype.slice.call(cta.querySelectorAll('.btn'));
    if (!btns.length || prefersReduced) return;
    btns.forEach(function (b) {
      b.style.opacity = '0';
      b.style.transform = 'translateY(18px)';
      b.style.transition = 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.2,0.7,0.2,1)';
    });
    btns.forEach(function (b, i) {
      var delay = 700 + i * 150;
      setTimeout(function () {
        b.style.opacity = '1';
        b.style.transform = 'translateY(0)';
      }, delay);
      setTimeout(function () {
        b.style.transition = '';
        b.style.transform = '';
      }, delay + 550);
    });
  }

  /* ─── #6 Hero gold particles ──────────────────────────────
     Spawn ~22 small gold particles drifting up through the hero
     background. Desktop only. Z-index keeps them behind text. */
  function initHeroParticles() {
    if (prefersReduced) return;
    if (window.innerWidth < 768) return;
    var hero = document.querySelector('.hero');
    if (!hero) return;
    // Ensure container can host absolutely positioned particles
    var cs = window.getComputedStyle(hero);
    if (cs.position === 'static') hero.style.position = 'relative';
    if (cs.overflow !== 'hidden') hero.style.overflow = 'hidden';

    var N = 22;
    for (var i = 0; i < N; i++) {
      var p = document.createElement('div');
      p.className = 'hero-particle';
      var size = 2 + Math.random() * 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.bottom = '-20px';
      p.style.animationDuration = (8 + Math.random() * 6) + 's';
      p.style.animationDelay = (Math.random() * 8) + 's';
      hero.appendChild(p);
    }
  }

  /* ─── #8 Image scroll parallax on treatment heroes ────────
     The hero image on each treatment page shifts vertically as
     the user scrolls. Scale 1.05 prevents edge gaps. Mobile gets
     a much lighter version. */
  function initImageParallax() {
    if (prefersReduced) return;
    var imgs = document.querySelectorAll('.treatment-hero-image img');
    if (!imgs.length) return;
    // Tag them so the CSS class applies (uses will-change for GPU)
    imgs.forEach(function (img) { img.classList.add('parallax-img'); });

    var isMobile = window.innerWidth < 768;
    var strength = isMobile ? 0.05 : 0.12;
    var ticking = false;

    function update() {
      imgs.forEach(function (img) {
        var rect = img.getBoundingClientRect();
        // Skip images that are far off-screen
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        var middle = window.innerHeight / 2;
        var offset = (rect.top + rect.height / 2 - middle) * -strength;
        img.style.transform = 'translateY(' + offset.toFixed(1) + 'px) scale(1.05)';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ─── Bootstrapping — run after DOM is ready ─── */
  function initAnimations() {
    initLuxLines();
    initCountUp();
    initStaggerGrids();
    initHeroParallax();
    initBeforeAfterAutoDemo();
    initCursorGlow();
    initScrollProgress();
    initSmoothScroll();
    // Phase 2 — new animation pack
    initMagneticButtons();
    initCardTilt();
    initLetterReveal();
    initHeroTitleReveal();
    initHeroButtonsReveal();
    initHeroParticles();
    initImageParallax();
    // Hero stagger runs slightly delayed so layout / fonts are settled
    setTimeout(initHeroStagger, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }

})();

/* ─── Reviews rows: continuous one-direction marquee (RTL-aware) + finger drag ─── */
(function () {
  function isRTL() {
    var d = (document.documentElement.getAttribute('dir') || document.body.getAttribute('dir') || '').toLowerCase();
    return d === 'rtl';
  }
  // English (LTR): right-to-left  → scrollLeft increases → +1
  // Arabic  (RTL): left-to-right → scrollLeft decreases → -1
  function dirSign() { return isRTL() ? -1 : 1; }

  function initReviews() {
    var rows = document.querySelectorAll('.reviews-rows .reviews-row');
    if (!rows.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    rows.forEach(function (row, i) {
      var SPEED = i % 2 === 0 ? 64 : 54;       // slightly different speeds so rows don't lock together
      var paused = false, resumeT = null, last = null;
      var dragging = false, startX = 0, startScroll = 0, moved = false;

      function step() {
        var first = row.firstElementChild;
        if (!first) return 0;
        var gap = parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap || '0') || 0;
        return first.getBoundingClientRect().width + gap;
      }
      function recycle() {
        var s = step(); if (s <= 0) return;
        var g = 0;
        while (row.scrollLeft >= 2 * s && g++ < 30) { row.appendChild(row.firstElementChild); row.scrollLeft -= s; }
        g = 0;
        while (row.scrollLeft < s && g++ < 30) { row.insertBefore(row.lastElementChild, row.firstElementChild); row.scrollLeft += s; }
      }
      function place() { var s = step(); if (s > 0 && (row.scrollLeft < s || row.scrollLeft >= 2 * s)) row.scrollLeft = Math.round(s * 1.5); }
      requestAnimationFrame(place);
      window.addEventListener('load', place);

      function pause() { paused = true; if (resumeT) { clearTimeout(resumeT); resumeT = null; } }
      function resumeSoon(ms) { if (resumeT) clearTimeout(resumeT); resumeT = setTimeout(function () { paused = false; }, ms || 1400); }

      function frame(t) {
        if (last == null) last = t;
        var dt = (t - last) / 1000; last = t;
        if (dt > 0.1) dt = 0.1;
        if (!paused && !dragging && !reduce) row.scrollLeft += dirSign() * SPEED * dt;
        recycle();
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      row.addEventListener('wheel', function () { pause(); resumeSoon(); }, { passive: true });
      row.addEventListener('touchstart', function () { pause(); }, { passive: true });
      row.addEventListener('touchend', function () { resumeSoon(); }, { passive: true });
      row.addEventListener('touchcancel', function () { resumeSoon(); }, { passive: true });

      row.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch') { pause(); return; }
        dragging = true; moved = false; startX = e.clientX; startScroll = row.scrollLeft;
        row.classList.add('grabbing');
        try { row.setPointerCapture(e.pointerId); } catch (_) {}
        pause();
      });
      row.addEventListener('pointermove', function (e) {
        if (!dragging || e.pointerType === 'touch') return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 3) moved = true;
        row.scrollLeft = startScroll - dx; recycle();
      });
      function endP(e) {
        if (e && e.pointerType === 'touch') { resumeSoon(); return; }
        if (!dragging) return;
        dragging = false; row.classList.remove('grabbing'); resumeSoon();
      }
      row.addEventListener('pointerup', endP);
      row.addEventListener('pointercancel', endP);
      row.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviews);
  } else {
    initReviews();
  }
})();

/* ─── One-card carousel stepping for Treatments (#services) & Services (#all-services) ───
   Native scroll-snap only controls where a fling LANDS, not how far one gesture travels.
   This makes a single wheel flick or swipe advance exactly ONE card, and adds prev/next
   arrows. Scoped to the two home-page card rows; RTL-aware. Degrades to native scroll. */
(function () {
  function initCardCarousels() {
    var rows = document.querySelectorAll('#services .scroll-row, #all-services .scroll-row');
    rows.forEach(function (row) {
      if (row.dataset.carousel === 'on') return;
      row.dataset.carousel = 'on';

      var cards = Array.prototype.filter.call(row.children, function (c) {
        return c.nodeType === 1;
      });
      if (cards.length < 2) return;

      // ----- Wrap the row so arrows can sit alongside it -----
      var wrap = document.createElement('div');
      wrap.className = 'hc-carousel';
      row.parentNode.insertBefore(wrap, row);
      wrap.appendChild(row);

      function makeArrow(dir, labelEn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'hc-car-arrow hc-car-' + dir;
        b.setAttribute('aria-label', labelEn);
        // chevron points the way it moves (mirrors automatically under [dir=rtl] via CSS)
        b.innerHTML = (dir === 'prev')
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
        return b;
      }
      var prevBtn = makeArrow('prev', 'Previous');
      var nextBtn = makeArrow('next', 'Next');
      wrap.appendChild(prevBtn);
      wrap.appendChild(nextBtn);

      function isRTL() {
        return getComputedStyle(row).direction === 'rtl';
      }

      // Index of the card currently aligned to the inline-start edge of the row
      function currentIndex() {
        var rtl = isRTL();
        var r = row.getBoundingClientRect();
        var startEdge = rtl ? r.right : r.left;
        var best = 0, bestDist = Infinity;
        cards.forEach(function (card, i) {
          var cr = card.getBoundingClientRect();
          var cardStart = rtl ? cr.right : cr.left;
          var d = Math.abs(cardStart - startEdge);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        return best;
      }

      function stepWidth() {
        // distance between consecutive card starts (covers width + gap)
        if (cards.length < 2) return cards[0].offsetWidth;
        return Math.abs(cards[1].offsetLeft - cards[0].offsetLeft) || cards[0].offsetWidth;
      }

      // ----- Smooth, eased one-card movement (RTL-safe) -----
      var animating = false;
      function alignDelta(i) {
        // how much to scroll so card i sits at the inline-start edge (works in LTR & RTL)
        var rtl = isRTL();
        var rr = row.getBoundingClientRect();
        var cr = cards[i].getBoundingClientRect();
        return rtl ? (cr.right - rr.right) : (cr.left - rr.left);
      }
      function easeInOutCubic(p) {
        // smootherstep (quintic): zero velocity AND acceleration at both ends → silkiest glide
        return p * p * p * (p * (p * 6 - 15) + 10);
      }
      function animateTo(i) {
        i = Math.max(0, Math.min(cards.length - 1, i));
        var start = row.scrollLeft;
        var dist = alignDelta(i);
        if (Math.abs(dist) < 1) { refresh(); return; }
        var dur = 900, t0 = null;          // long, silky glide for a single card
        animating = true;
        function frame(now) {
          if (t0 === null) t0 = now;
          var p = Math.min(1, (now - t0) / dur);
          row.scrollLeft = start + dist * easeInOutCubic(p);
          if (p < 1) { requestAnimationFrame(frame); }
          else { animating = false; refresh(); }
        }
        requestAnimationFrame(frame);
      }
      function goTo(i) { animateTo(i); }
      function goNext() { goTo(currentIndex() + 1); }
      function goPrev() { goTo(currentIndex() - 1); }

      prevBtn.addEventListener('click', goPrev);
      nextBtn.addEventListener('click', goNext);

      // ----- Arrow enabled/disabled state -----
      function refresh() {
        var maxScroll = row.scrollWidth - row.clientWidth - 2;
        var overflowing = maxScroll > 4;
        wrap.classList.toggle('hc-has-overflow', overflowing);
        // scrollLeft is negative in RTL on some engines; use absolute value
        var sl = Math.abs(row.scrollLeft);
        var atStart = sl <= 2;
        var atEnd = sl >= maxScroll;
        prevBtn.disabled = !overflowing || atStart;
        nextBtn.disabled = !overflowing || atEnd;
      }
      row.addEventListener('scroll', function () {
        window.requestAnimationFrame(refresh);
      }, { passive: true });
      window.addEventListener('resize', refresh);
      refresh();

      // ----- Wheel: horizontal intent advances ONE card (vertical wheel = page scroll) -----
      var wheelLock = false;
      row.addEventListener('wheel', function (e) {
        var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
        if (!horizontal) return;            // let the page scroll vertically
        e.preventDefault();
        if (wheelLock) return;
        var delta = e.deltaX || e.deltaY;
        (delta > 0) ? goNext() : goPrev();
        wheelLock = true;
        setTimeout(function () { wheelLock = false; }, 450);
      }, { passive: false });

      // ----- Touch: fully NATIVE -----
      // No JS touch handling on purpose. The browser scrolls both axes natively
      // (vertical page scroll is never blocked), and CSS scroll-snap-stop:always
      // limits a horizontal flick to exactly one card. This is what keeps
      // up/down scrolling over the cards perfectly smooth.

    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardCarousels);
  } else {
    initCardCarousels();
  }
})();

/* ─── "Book Your Visit" CTA — one-time entrance reveal ───
   Adds .hh-anim (pre-state) then .hh-in (plays) when the section
   scrolls into view. Skipped entirely under reduced-motion or no IO,
   so the section stays fully visible without JS. */
(function () {
  var sec = document.querySelector('section.hh');
  if (!sec) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  sec.classList.add('hh-anim');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('hh-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });
  io.observe(sec);
})();


/* ════════════════════════════════════════════════════════════════════
   Eased ("buttery") page scrolling via Lenis — desktop wheel only.
   Touch devices keep native momentum. Falls back to native + CSS
   smooth scroll if the library can't load. Anchor links scroll with
   the 90px nav offset so sections land just below the header.
   ════════════════════════════════════════════════════════════════════ */
(function initSmoothScroll(){
  if (window.__lenisInit) return; window.__lenisInit = true;
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js';
  s.onload = function(){
    if (!window.Lenis) return;
    var lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    window.__lenis = lenis;
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // Same-page hash links → smooth scroll with nav offset.
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href]'); if(!a) return;
      var href = a.getAttribute('href') || '';
      var hi = href.indexOf('#'); if (hi === -1) return;
      var path = href.slice(0, hi), id = href.slice(hi + 1); if(!id) return;
      var here = location.pathname.split('/').pop();
      var samePage = (href.charAt(0) === '#') || path === '' || path === here || path === './' + here;
      if(!samePage) return;
      var target = document.getElementById(id); if(!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -90 });
      if (history.pushState) history.pushState(null, '', '#' + id);
    });

    // Arriving on a page with a #hash → ease to it once laid out.
    if (location.hash.length > 1){
      var t = document.getElementById(location.hash.slice(1));
      if (t) setTimeout(function(){ lenis.scrollTo(t, { offset: -90, immediate: false }); }, 350);
    }
  };
  s.onerror = function(){ /* keep native + CSS smooth fallback */ };
  document.head.appendChild(s);
})();
