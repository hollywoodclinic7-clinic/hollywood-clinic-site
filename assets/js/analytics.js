/* ═══════════════════════════════════════════════════════════════════════
   HOLLYWOOD CLINIC — ANALYTICS & CONVERSION TRACKING
   Google Tag Manager + Google Analytics 4 + Google Ads
   ───────────────────────────────────────────────────────────────────────
   ONE FILE controls all tracking on all 51 pages.
   You only ever edit the CONFIG block below. Nothing else.

   HOW IT DECIDES WHAT TO LOAD
     • GTM_ID filled  ->  loads Google Tag Manager only.
                          (GA4 + Ads are then configured INSIDE GTM.)
     • GTM_ID empty   ->  loads gtag.js directly using GA4_ID / ADS_ID.
     Leave any ID as '' to disable it. Empty config = nothing loads,
     the site keeps working exactly as before.

   IMPORTANT: this file is safe to ship with empty IDs. Nothing breaks.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═════════════════════════════════════════════════════════════════════
     ██  CONFIG — EDIT ONLY THIS BLOCK  ██
  ═════════════════════════════════════════════════════════════════════ */
  var CFG = {

    /* ── 1. Google Tag Manager ─────────────────────────────────────────
       From: tagmanager.google.com -> your container -> top right
       Looks like: 'GTM-ABCD123'                                        */
    GTM_ID: 'GTM-KTHX5J8X',

    /* ── 2. Google Analytics 4 ─────────────────────────────────────────
       From: analytics.google.com -> Admin -> Data streams -> Web
       Looks like: 'G-ABCDE12345'
       NOTE: if you filled GTM_ID above, LEAVE THIS EMPTY. You will add
       GA4 inside GTM instead (otherwise every visit is counted twice). */
    GA4_ID: 'G-S0ER5190KR',

    /* ── 3. Google Ads ─────────────────────────────────────────────────
       From: ads.google.com -> Goals -> Conversions -> your conversion
       -> "Tag setup" -> "Install the tag yourself"
       Conversion ID looks like : 'AW-123456789'
       Conversion label looks like: 'AbC-D_efGhIjKlMnO'
       Again: if you use GTM, leave these empty and build the Ads
       conversion tags inside GTM.                                      */
    ADS_ID: '',
    ADS_LABEL_BOOKING: '',    // fires when a booking is sent (main conversion)
    ADS_LABEL_WHATSAPP: '',   // fires on any WhatsApp click
    ADS_LABEL_CALL: '',       // fires on any phone-number click
    ADS_LABEL_CONTACT: '',    // fires on contact-form submit

    /* ── 3b. OpenAI / ChatGPT Ads Measurement Pixel ────────────────────
       From: ads.openai.com -> Tools -> Conversions -> Pixels
       Looks like: '4YWNK7m7bQ6HPsEuBayTat'
       Leave empty to disable the pixel completely.
       Conversion events are created in OpenAI Ads Manager:
         appointment_scheduled  <- booking sent
         lead_created           <- WhatsApp / phone / contact form      */
    OPENAI_PIXEL_ID: '4YWNK7m7bQ6HPsEuBayTat',

    /* ── 4. Performance ───────────────────────────────────────────────
       Google's tags are heavy. We wait until the visitor interacts, or
       until the page has finished loading + this delay, whichever comes
       first. This protects your PageSpeed / Lighthouse score.
       Set to 0 if you prefer maximum data accuracy over score.         */
    LOAD_DELAY_MS: 1500,

    /* ── 5. Options ───────────────────────────────────────────────────  */
    TRACK_SCROLL_DEPTH: true,   // fires at 25 / 50 / 75 / 90 %
    TRACK_OUTBOUND: true,       // clicks leaving hollywoodclinics.net
    DEBUG: false                // true = log every event to the console
  };
  /* ═════════════════════════════════════════════════════════════════════
     ██  END OF CONFIG — do not edit below this line  ██
  ═════════════════════════════════════════════════════════════════════ */


  /* ─────────────────────────────────────────────────────────────────────
     1. dataLayer + gtag stub + Consent Mode v2 defaults
     These are pure in-memory pushes — zero network cost, so they run
     immediately and keep event ordering correct.
  ───────────────────────────────────────────────────────────────────── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var USE_GTM    = !!CFG.GTM_ID;
  var USE_DIRECT = !USE_GTM && (!!CFG.GA4_ID || !!CFG.ADS_ID);
  var USE_OAI    = !!CFG.OPENAI_PIXEL_ID;

  /* OpenAI Ads pixel: in-memory command queue only — no network cost.
     The SDK itself is injected later by loadTags(), and replays this queue.
     Which HC events map onto which OpenAI standard event:               */
  var OAI_MAP = {
    booking_submitted:   'appointment_scheduled',
    whatsapp_click:      'lead_created',
    phone_click:         'lead_created',
    contact_form_submit: 'lead_created'
  };

  if (USE_OAI && !window.oaiq) {
    var oaiQueue = function () { oaiQueue.q.push(arguments); };
    oaiQueue.q = [];
    window.oaiq = oaiQueue;
    window.oaiq('init', { pixelId: CFG.OPENAI_PIXEL_ID });
  }

  if (USE_GTM && CFG.GA4_ID && CFG.DEBUG) {
    console.warn('[HC Analytics] GTM_ID and GA4_ID are both set. GA4_ID is ignored ' +
                 'to prevent double-counting. Configure GA4 inside GTM.');
  }

  // Consent Mode v2. The clinic serves Egypt, which is outside the EEA, so
  // consent is granted by default. If you ever advertise into the EU/UK you
  // must add a cookie banner and call gtag('consent','update',...) from it.
  gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  if (USE_DIRECT) {
    gtag('js', new Date());
    if (CFG.GA4_ID) gtag('config', CFG.GA4_ID, { send_page_view: true });
    if (CFG.ADS_ID) gtag('config', CFG.ADS_ID);
  }


  /* ─────────────────────────────────────────────────────────────────────
     2. Deferred tag loading
  ───────────────────────────────────────────────────────────────────── */
  var loaded = false;

  function injectScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadTags() {
    if (loaded) return;
    loaded = true;

    if (USE_OAI) {
      injectScript('https://bzrcdn.openai.com/sdk/oaiq.min.js');
      log('OpenAI Ads pixel loaded:', CFG.OPENAI_PIXEL_ID);
    }

    if (USE_GTM) {
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      injectScript('https://www.googletagmanager.com/gtm.js?id=' + CFG.GTM_ID);
      log('Google Tag Manager loaded:', CFG.GTM_ID);
    } else if (USE_DIRECT) {
      injectScript('https://www.googletagmanager.com/gtag/js?id=' +
                   (CFG.GA4_ID || CFG.ADS_ID));
      log('gtag.js loaded:', CFG.GA4_ID || CFG.ADS_ID);
    } else {
      log('No IDs configured — no tags loaded.');
    }
  }

  function scheduleLoad() {
    if (!USE_GTM && !USE_DIRECT && !USE_OAI) return;

    if (CFG.LOAD_DELAY_MS <= 0) { loadTags(); return; }

    var events = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'];
    function onFirstInteraction() {
      events.forEach(function (e) {
        window.removeEventListener(e, onFirstInteraction, true);
      });
      loadTags();
    }
    events.forEach(function (e) {
      window.addEventListener(e, onFirstInteraction, { capture: true, passive: true });
    });

    function afterLoad() { setTimeout(loadTags, CFG.LOAD_DELAY_MS); }
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad);

    // Absolute safety net so a session is never lost entirely.
    setTimeout(loadTags, 8000);
  }


  /* ─────────────────────────────────────────────────────────────────────
     3. The track() helper — every event in the site funnels through here
  ───────────────────────────────────────────────────────────────────── */
  function log() {
    if (!CFG.DEBUG) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[HC Analytics]');
    console.log.apply(console, args);
  }

  function currentLang() {
    if (window.I18N && typeof window.I18N.current === 'function') {
      return window.I18N.current();
    }
    return document.documentElement.getAttribute('lang') || 'en';
  }

  function pageName() {
    var p = window.location.pathname.replace(/\/$/, '');
    if (!p) return 'home';
    return p.replace(/^\//, '').replace(/\.html$/, '');
  }

  function track(name, params) {
    var payload = params || {};
    payload.page_name = payload.page_name || pageName();
    payload.site_language = currentLang();

    if (USE_GTM) {
      // ONE custom event for GTM. In GTM you create a single GA4 Event tag
      // with Event Name = {{DLV - hc_event_name}} on trigger "hc_event".
      var dl = { event: 'hc_event', hc_event_name: name };
      for (var k in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, k)) dl[k] = payload[k];
      }
      window.dataLayer.push(dl);
    } else {
      window.gtag('event', name, payload);
    }

    /* OpenAI / ChatGPT Ads. Only the four conversion events are forwarded;
       everything else stays GA4-only so the pixel is not flooded.        */
    if (USE_OAI && window.oaiq && OAI_MAP[name]) {
      try {
        window.oaiq('measure', OAI_MAP[name], { type: 'customer_action' });
        log('OpenAI Ads ->', OAI_MAP[name]);
      } catch (err) { /* never let tracking break the page */ }
    }

    log(name, payload);
  }

  function adsConversion(label, extra) {
    if (!CFG.ADS_ID || !label) return;   // GTM users: build this in GTM instead
    var data = { send_to: CFG.ADS_ID + '/' + label };
    if (extra) for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) data[k] = extra[k];
    }
    window.gtag('event', 'conversion', data);
    log('Ads conversion ->', data.send_to);
  }

  // Public API, so you can fire an event from anywhere:  hcTrack('my_event', {…})
  window.hcTrack = track;
  window.hcAdsConversion = adsConversion;


  /* ─────────────────────────────────────────────────────────────────────
     4. Click tracking
     ALL listeners are bound to `document`, never to elements.
     i18n.js rebuilds document.body.innerHTML when the language is toggled,
     which destroys every listener attached to a body element. Listeners on
     `document` survive that rebuild — this is why delegation is mandatory.
  ───────────────────────────────────────────────────────────────────── */
  function closest(el, sel) {
    return el && el.closest ? el.closest(sel) : null;
  }

  function whereAmI(el) {
    if (closest(el, '.floating-whatsapp')) return 'floating_button';
    if (closest(el, 'header, .navbar, .nav')) return 'header';
    if (closest(el, 'footer, .footer')) return 'footer';
    if (closest(el, '.hero')) return 'hero';
    return 'body';
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    /* ── Booking sent on WhatsApp — THE MAIN CONVERSION ──────────────
       booking.html renders the final "Send on WhatsApp" button with a
       [data-wa] attribute.                                            */
    if (closest(t, '[data-wa]')) {
      track('booking_submitted', { method: 'whatsapp' });
      adsConversion(CFG.ADS_LABEL_BOOKING);
      return;
    }

    /* ── Booking funnel steps (booking.html quiz) ─────────────────── */
    var opt = closest(t, '.opt');
    if (opt) {
      track('booking_step', {
        step_option: opt.getAttribute('data-opt') || '',
        step_label: (opt.textContent || '').trim().slice(0, 60)
      });
      return;
    }
    if (closest(t, '[data-general]')) {
      track('booking_step', { step_option: 'general_consultation' });
      return;
    }
    if (closest(t, '[data-next]')) {
      track('booking_next_clicked');
      return;
    }

    /* ── Link-based tracking ─────────────────────────────────────── */
    var a = closest(t, 'a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var loc = whereAmI(a);

    // WhatsApp
    if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
      track('whatsapp_click', { link_location: loc });
      adsConversion(CFG.ADS_LABEL_WHATSAPP);
      return;
    }

    // Phone
    if (href.indexOf('tel:') === 0) {
      track('phone_click', { link_location: loc, phone_number: href.slice(4) });
      adsConversion(CFG.ADS_LABEL_CALL);
      return;
    }

    // Email
    if (href.indexOf('mailto:') === 0) {
      track('email_click', { link_location: loc });
      return;
    }

    // Book-now navigation
    if (href.indexOf('booking') !== -1) {
      track('book_now_click', {
        link_location: loc,
        link_text: (a.textContent || '').trim().slice(0, 60)
      });
      return;
    }

    // Maps / directions
    if (href.indexOf('google.com/maps') !== -1 || href.indexOf('goo.gl/maps') !== -1) {
      track('directions_click', { link_location: loc });
      return;
    }

    // Social
    if (href.indexOf('instagram.com') !== -1) { track('social_click', { network: 'instagram', link_location: loc }); return; }
    if (href.indexOf('facebook.com') !== -1)  { track('social_click', { network: 'facebook',  link_location: loc }); return; }
    if (href.indexOf('tiktok.com') !== -1)    { track('social_click', { network: 'tiktok',    link_location: loc }); return; }
    if (href.indexOf('youtube.com') !== -1)   { track('social_click', { network: 'youtube',   link_location: loc }); return; }

    // Treatment / doctor page interest
    if (href.indexOf('/treatments/') !== -1 || href.indexOf('treatments/') === 0) {
      track('treatment_link_click', {
        treatment: href.split('/').pop().replace(/\.html$/, ''),
        link_location: loc
      });
      return;
    }
    if (href.indexOf('/doctors/') !== -1 || href.indexOf('doctors/') === 0) {
      track('doctor_link_click', {
        doctor: href.split('/').pop().replace(/\.html$/, ''),
        link_location: loc
      });
      return;
    }

    // Outbound
    if (CFG.TRACK_OUTBOUND && /^https?:\/\//i.test(href)) {
      var host = '';
      try { host = new URL(href, window.location.href).hostname; } catch (err) { host = ''; }
      if (host && host.indexOf('hollywoodclinics.net') === -1) {
        track('outbound_click', { outbound_domain: host, link_location: loc });
      }
    }
  }, true);


  /* ─────────────────────────────────────────────────────────────────────
     5. Form submissions (submit bubbles, so document-level works)
  ───────────────────────────────────────────────────────────────────── */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.nodeName !== 'FORM') return;

    var id = form.id || '';

    if (id === 'contactForm') {
      track('contact_form_submit');
      adsConversion(CFG.ADS_LABEL_CONTACT);
      return;
    }
    if (id.toLowerCase().indexOf('review') !== -1) {
      track('review_submit', { form_id: id });
      return;
    }
    track('form_submit', { form_id: id || 'unnamed' });
  }, true);


  /* ─────────────────────────────────────────────────────────────────────
     6. Language switching
  ───────────────────────────────────────────────────────────────────── */
  document.addEventListener('i18n:applied', function (e) {
    // Skip the initial apply on page load — only report real switches.
    if (!window.__hcLangReady) { window.__hcLangReady = true; return; }
    var lang = (e && e.detail && e.detail.lang) || currentLang();
    track('language_switch', { switched_to: lang });
  });


  /* ─────────────────────────────────────────────────────────────────────
     7. Scroll depth + engagement
  ───────────────────────────────────────────────────────────────────── */
  if (CFG.TRACK_SCROLL_DEPTH) {
    var marks = [25, 50, 75, 90];
    var hit = {};
    var ticking = false;

    function checkDepth() {
      ticking = false;
      var h = document.documentElement;
      var scrollable = (h.scrollHeight - window.innerHeight);
      if (scrollable <= 0) return;
      var pct = Math.round((window.scrollY / scrollable) * 100);
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i];
        if (pct >= m && !hit[m]) {
          hit[m] = true;
          track('scroll_depth', { percent_scrolled: m });
        }
      }
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(checkDepth);
    }, { passive: true });
  }

  // "Engaged visitor" — stayed 30s. Useful as a soft conversion in Ads.
  setTimeout(function () {
    if (document.visibilityState === 'visible') track('engaged_30s');
  }, 30000);


  /* ─────────────────────────────────────────────────────────────────────
     8. Go
  ───────────────────────────────────────────────────────────────────── */
  scheduleLoad();
  log('Ready. Mode:', USE_GTM ? 'GTM' : (USE_DIRECT ? 'direct gtag' : 'disabled'));

})();
