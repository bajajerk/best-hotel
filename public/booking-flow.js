/*
 * booking-flow.js
 * ------------------------------------------------------------------
 * Voyagr Club — single-file journey controller for the 10-screen
 * mobile booking funnel. Connects the static prototypes with shared
 * sessionStorage state, CSS-transform page transitions, a persistent
 * urgency timer, form pre-fill, skeleton loading, and rate reveal.
 *
 * Screen order:
 *   1. search-home-prototype.html          (Search Home)
 *   2. (typeahead is inline inside #1)     (Typeahead)
 *   3. results-mobile-prototype.html       (Results)
 *   4. hotel-detail-mobile-prototype.html  (Hotel Detail)
 *   5. room-list-mobile-prototype.html     (Room Selection)
 *   6. rate-packages-mobile-prototype.html (Package Selection)
 *   7. review-reservation-mobile-prototype.html (Review)
 *   8. guest-details-mobile-prototype.html (Guest Details)
 *   9. payment-mobile-prototype.html       (Payment)
 *  10. confirmation-mobile-prototype.html  (Confirmation)
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  /* ================================================================
   * Constants — storage keys, timings, and page filenames.
   * =============================================================== */

  // Single sessionStorage key holding the full journey state blob.
  var STATE_KEY = 'voyagr_state';
  // Timer start timestamp (ms). Set once when Package Selection loads.
  var TIMER_KEY = 'voyagr_timer_start';
  // Flag so the hotel-detail rate reveal only plays once per session.
  var REVEAL_KEY = 'rateRevealSeen';
  // 5 minutes of hold.
  var TIMER_SECONDS = 300;
  // Shared transition durations (ms).
  var T_SLIDE = 250;
  var T_SHEET = 300;
  var T_DISMISS = 200;
  var T_FADE = 200;
  var T_PAY = 2000;

  // Page filenames — kept in one place so routing stays coherent.
  var PAGES = {
    search:       'search-home-prototype.html',
    results:      'results-mobile-prototype.html',
    hotel:        'hotel-detail-mobile-prototype.html',
    rooms:        'room-list-mobile-prototype.html',
    packages:     'rate-packages-mobile-prototype.html',
    review:       'review-reservation-mobile-prototype.html',
    guest:        'guest-details-mobile-prototype.html',
    payment:      'payment-mobile-prototype.html',
    confirmation: 'confirmation-mobile-prototype.html'
  };

  /* ================================================================
   * State — sessionStorage accessors.
   *
   * Shape matches the task spec exactly. Defaults are chosen so the
   * funnel works even if the user deep-links into a later screen.
   * =============================================================== */

  function defaultState() {
    return {
      destination: 'Udaipur',
      checkIn:  '2026-03-15',
      checkOut: '2026-03-17',
      nights:   2,
      guests:   2,
      rooms:    1,
      selectedHotel:   null, // { name, id, memberRate, publicRate, image }
      selectedRoom:    null, // { name, id, sqft, sleeps }
      selectedPackage: null, // { name, inclusions, rate, cancellationType }
      guestDetails:    null, // { firstName, lastName, pan, gst }
      bookingRef:      null
    };
  }

  function getState() {
    try {
      var raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return defaultState();
      // Merge onto defaults so new keys added over time don't blow up.
      var saved = JSON.parse(raw);
      var d = defaultState();
      for (var k in saved) if (Object.prototype.hasOwnProperty.call(saved, k)) d[k] = saved[k];
      return d;
    } catch (e) {
      return defaultState();
    }
  }

  function setState(patch) {
    var s = getState();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) s[k] = patch[k];
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  // Wipe everything the funnel owns. Called on timer expiry + on
  // "Book Another Stay" from the confirmation screen.
  function clearJourney() {
    try {
      sessionStorage.removeItem(STATE_KEY);
      sessionStorage.removeItem(TIMER_KEY);
      sessionStorage.removeItem(REVEAL_KEY);
    } catch (e) {}
  }

  /* ================================================================
   * Formatting helpers (rupee, date, etc.).
   * =============================================================== */

  function inr(n) {
    if (typeof n !== 'number' || isNaN(n)) return '₹—';
    return '₹' + n.toLocaleString('en-IN');
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return m + ':' + pad(s);
  }

  function diffDaysISO(fromISO, toISO) {
    var a = new Date(fromISO);
    var b = new Date(toISO);
    if (isNaN(+a) || isNaN(+b)) return 0;
    return Math.max(1, Math.round((b - a) / (24 * 3600 * 1000)));
  }

  /* ================================================================
   * Page detection — the whole router hinges on this. We match by
   * filename in the pathname, not by DOM sniffing, so a deep link
   * always lands on the right handler.
   * =============================================================== */

  function currentPage() {
    var p = (window.location.pathname || '').toLowerCase();
    if (p.indexOf('search-home') >= 0)          return 'search';
    if (p.indexOf('results-mobile') >= 0)       return 'results';
    if (p.indexOf('hotel-detail-mobile') >= 0)  return 'hotel';
    if (p.indexOf('room-list-mobile') >= 0)     return 'rooms';
    if (p.indexOf('rate-packages-mobile') >= 0) return 'packages';
    if (p.indexOf('review-reservation') >= 0)   return 'review';
    if (p.indexOf('guest-details-mobile') >= 0) return 'guest';
    if (p.indexOf('payment-mobile') >= 0)       return 'payment';
    if (p.indexOf('confirmation-mobile') >= 0)  return 'confirmation';
    return null;
  }

  /* ================================================================
   * Transitions — implemented as animated exits plus a keyed
   * "entry animation" hint stored in sessionStorage so the next page
   * can replay the correct motion on load.
   *
   * Because these are separate HTML files (not an SPA), we can't do
   * a true cross-page transform. The seams are hidden by animating
   * the current page out, then animating the next page in with a
   * complementary motion.
   * =============================================================== */

  var ENTRY_KEY = 'voyagr_entry_anim';

  // Kinds: 'slide-left' | 'slide-right' | 'slide-up' | 'sheet'.
  function scheduleEntry(kind) {
    try { sessionStorage.setItem(ENTRY_KEY, kind); } catch (e) {}
  }

  function consumeEntry() {
    var k = null;
    try {
      k = sessionStorage.getItem(ENTRY_KEY);
      sessionStorage.removeItem(ENTRY_KEY);
    } catch (e) {}
    return k;
  }

  // Apply the correct "slide in" animation for the page we just
  // landed on, based on what the previous page scheduled.
  function playEntryAnimation() {
    var kind = consumeEntry();
    if (!kind) return;
    var body = document.body;
    var fromTx = '0';
    var fromOpacity = '1';
    if (kind === 'slide-left') { fromTx = 'translateX(100%)'; fromOpacity = '0'; }
    else if (kind === 'slide-right') { fromTx = 'translateX(-100%)'; fromOpacity = '0'; }
    else if (kind === 'slide-up') { fromTx = 'translateY(100%)'; fromOpacity = '0'; }
    else if (kind === 'sheet') { fromTx = 'translateY(20px)'; fromOpacity = '0'; }
    else return;
    body.style.transform = fromTx;
    body.style.opacity = fromOpacity;
    body.style.transition = 'none';
    // Force reflow so the starting state takes effect.
    /* eslint-disable no-unused-expressions */
    body.offsetHeight;
    /* eslint-enable no-unused-expressions */
    var dur = (kind === 'sheet') ? T_FADE : T_SLIDE;
    body.style.transition = 'transform ' + dur + 'ms ease, opacity ' + dur + 'ms ease';
    body.style.transform = 'translateX(0) translateY(0)';
    body.style.opacity = '1';
    setTimeout(function () {
      body.style.transition = '';
      body.style.transform = '';
      body.style.opacity = '';
    }, dur + 20);
  }

  // Animate the current page out, then navigate. Used for all
  // forward moves and back arrows. `entryKind` is what the *next*
  // page should play when it loads — so "slide-left" on a forward
  // move, "slide-right" on a back move.
  function navigate(url, exitTransform, entryKind) {
    var body = document.body;
    scheduleEntry(entryKind);
    body.style.transition = 'transform ' + T_SLIDE + 'ms ease, opacity ' + T_SLIDE + 'ms ease';
    body.style.transform = exitTransform || 'translateX(-100%)';
    body.style.opacity = '0';
    setTimeout(function () { window.location.href = url; }, T_SLIDE);
  }

  // Conveniences for the four cardinal moves we use most.
  function slideLeftTo(url)  { navigate(url, 'translateX(-100%)', 'slide-left'); }
  function slideRightTo(url) { navigate(url, 'translateX(100%)',  'slide-right'); }
  function slideUpTo(url)    { navigate(url, 'translateY(-100%)', 'slide-up'); }

  /* ================================================================
   * Android hardware back / browser back.
   *
   * Pages loaded via window.location.href land in the browser's
   * session history, so the hardware back button just works — but
   * the stored `ENTRY_KEY` would already be consumed, so the reverse
   * transition would not replay. Patch with a `pageshow` listener
   * that triggers a "slide-right" when the page is restored from
   * bfcache (user pressed back).
   * =============================================================== */

  function wireBackCache() {
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        scheduleEntry('slide-right');
        playEntryAnimation();
      }
    });
  }

  /* ================================================================
   * Urgency timer — starts on Package Selection, persists via
   * TIMER_KEY (absolute start time, not remaining seconds, so the
   * countdown stays accurate across page loads).
   *
   * Runs on: Package Selection, Review, Guest Details, Payment.
   * =============================================================== */

  function ensureTimerStarted() {
    try {
      if (!sessionStorage.getItem(TIMER_KEY)) {
        sessionStorage.setItem(TIMER_KEY, String(Date.now()));
      }
    } catch (e) {}
  }

  function timerSecondsLeft() {
    var start = 0;
    try { start = parseInt(sessionStorage.getItem(TIMER_KEY) || '0', 10); } catch (e) {}
    if (!start) return TIMER_SECONDS;
    var elapsed = Math.floor((Date.now() - start) / 1000);
    return Math.max(0, TIMER_SECONDS - elapsed);
  }

  // Tick every second and stamp the canonical "m:ss" into every
  // countdown element on the page. Supports multiple selectors so
  // one loop handles review/guest/payment/package.
  function startTimerTick() {
    var selectors = [
      '#rv-countdown',
      '.rv-hold__time',
      '.gd-hold__time',
      '.py-hold__time',
      '[data-countdown]'
    ];
    function render() {
      var left = timerSecondsLeft();
      var txt = fmtTime(left);
      selectors.forEach(function (sel) {
        var els = document.querySelectorAll(sel);
        for (var i = 0; i < els.length; i++) els[i].textContent = txt;
      });
      if (left <= 0) {
        clearInterval(tid);
        onTimerExpiry();
      }
    }
    render();
    var tid = setInterval(render, 1000);
  }

  /* ================================================================
   * Expiry modal — gold "Search Again" CTA, navigates to Search Home
   * after clearing the journey.
   * =============================================================== */

  function onTimerExpiry() {
    if (document.getElementById('voyagr-expiry-modal')) return;
    var overlay = document.createElement('div');
    overlay.id = 'voyagr-expiry-modal';
    overlay.setAttribute('role', 'alertdialog');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'background:rgba(0,0,0,0.75)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:24px', 'font-family:inherit',
      'opacity:0', 'transition:opacity 200ms ease'
    ].join(';');
    overlay.innerHTML =
      '<div style="max-width:340px;width:100%;background:#0B1B2B;border:1px solid rgba(201,168,76,0.25);border-radius:14px;padding:26px 22px;text-align:center;color:#F5F0E8;">' +
        '<div style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:24px;line-height:1.2;margin-bottom:8px;">Your rate has been released.</div>' +
        '<p style="color:rgba(245,240,232,0.7);font-size:13px;margin-bottom:22px;">The hold on your selected room has expired. Rates may have changed — start a fresh search to continue.</p>' +
        '<button id="voyagr-expiry-cta" style="padding:13px 22px;border-radius:999px;background:#C9A84C;color:#0B1B2B;font-family:\'DM Mono\',ui-monospace,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:500;border:none;cursor:pointer;">Search Again</button>' +
      '</div>';
    document.body.appendChild(overlay);
    // Fade in after insertion so the transition plays.
    requestAnimationFrame(function () { overlay.style.opacity = '1'; });
    document.getElementById('voyagr-expiry-cta').addEventListener('click', function () {
      clearJourney();
      window.location.href = PAGES.search;
    });
  }

  /* ================================================================
   * Shared setup — runs on every page.
   * =============================================================== */

  function initCommon() {
    // Scroll new screen to top instantly — overrides any smooth
    // scroll CSS so the funnel lands at 0,0 every time.
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    } catch (e) {}
    window.scrollTo(0, 0);
    // Replay entry animation if the previous page scheduled one.
    playEntryAnimation();
    wireBackCache();
  }

  /* ================================================================
   * Screen 1 + 2: Search Home + Typeahead.
   *
   * The existing inline script on search-home-prototype.html already
   * renders the typeahead list and intercepts clicks on `.ta-item`.
   * It writes to sessionStorage? No — it navigates to
   * `search-prototype.html` ("Your Search" screen) which the new
   * journey explicitly skips.
   *
   * Strategy: install our own capture-phase listener that runs BEFORE
   * the inline listener, stores the destination in the new state
   * blob, and routes directly to Results.
   * =============================================================== */

  function initSearch() {
    // Back arrow — whole browser history back; falls through to
    // home elsewhere in the product.
    var back = document.querySelector('.search-back');
    if (back) back.addEventListener('click', function (e) {
      e.preventDefault();
      history.length > 1 ? history.back() : (window.location.href = '/');
    });

    var input = document.getElementById('searchInput');
    var typeahead = document.getElementById('typeahead');
    var bottomBar = document.getElementById('bottomBar');

    // Blur → slide the dropdown back up (matches spec: input blur
    // with no selection dismisses the typeahead).
    if (input && typeahead) {
      input.addEventListener('blur', function () {
        // Small delay so that a tap on a typeahead row (which causes
        // blur before click) isn't eaten before navigation fires.
        setTimeout(function () {
          if (document.activeElement !== input && !typeahead.contains(document.activeElement)) {
            typeahead.classList.remove('is-active');
          }
        }, 150);
      });
    }

    // Capture-phase intercept so we beat the existing inline handler
    // that navigates to search-prototype.html. Writes destination,
    // routes straight to Results.
    if (typeahead) {
      typeahead.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.ta-item');
        if (!btn) return;
        var destination = btn.dataset.city || btn.dataset.hotel || btn.dataset.region || '';
        if (!destination) return;
        // Preempt the inline listener.
        e.stopImmediatePropagation();
        e.preventDefault();
        setState({
          destination: destination,
          // If user picked a specific hotel from the dropdown we
          // pre-seed it so Hotel Detail can use the name. The hotel
          // ID & rate stay null until the user actually picks a
          // result card — that's fine; Results will overwrite.
          selectedHotel: btn.dataset.hotel ? {
            name: btn.dataset.hotel, id: null, memberRate: null, publicRate: null
          } : null
        });
        slideLeftTo(PAGES.results + '?dest=' + encodeURIComponent(destination));
      }, /* capture */ true);
    }

    // Recent searches — same intercept to route to Results.
    var recentList = document.getElementById('recentList');
    if (recentList) {
      recentList.addEventListener('click', function (e) {
        if (e.target.closest('.recent-item__dismiss')) return; // let inline handler remove row
        var row = e.target.closest('.recent-item');
        if (!row) return;
        var city = row.querySelector('.recent-item__city');
        if (!city) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        setState({ destination: city.textContent.trim() });
        slideLeftTo(PAGES.results + '?dest=' + encodeURIComponent(city.textContent.trim()));
      }, /* capture */ true);
    }

    // "Find Hotels" bottom bar CTA. Registered on document so the
    // capture phase runs BEFORE any target-phase inline handler.
    document.addEventListener('click', function (e) {
      var cta = e.target.closest && e.target.closest('.bottom-bar__cta');
      if (!cta) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      var v = input && input.value.trim();
      if (v) {
        setState({ destination: v });
        slideLeftTo(PAGES.results + '?dest=' + encodeURIComponent(v));
      } else {
        slideLeftTo(PAGES.results);
      }
    }, /* capture */ true);

    // If user focuses input, make sure the bottom bar is hidden so
    // the typeahead has room — mirrors existing inline behaviour.
    if (input && bottomBar) {
      input.addEventListener('focus', function () {
        // The inline script toggles this too; no-op if already set.
        if (input.value.trim().length > 0) bottomBar.classList.add('bottom-bar--hidden');
      });
    }
  }

  /* ================================================================
   * Screen 3: Results.
   *
   * - Show 3 skeleton cards first (800ms), then reveal real cards.
   * - Clicking a result card stores the selectedHotel and routes to
   *   Hotel Detail. The hero image src is carried forward so the
   *   next screen can reuse it (no flash).
   * =============================================================== */

  function initResults() {
    var grid = document.querySelector('.r-grid');
    if (!grid) return;

    var realCards = Array.prototype.slice.call(grid.querySelectorAll('.r-card'));

    // Skeleton: hide real cards, prepend 3 shimmer placeholders.
    realCards.forEach(function (c) { c.style.display = 'none'; });

    var skeletonHtml = '';
    for (var i = 0; i < 3; i++) {
      skeletonHtml +=
        '<article class="r-card voyagr-skeleton">' +
          '<div class="r-card__media voyagr-skeleton__media"></div>' +
          '<div class="r-card__body">' +
            '<div class="voyagr-skeleton__line voyagr-skeleton__line--sm"></div>' +
            '<div class="voyagr-skeleton__line voyagr-skeleton__line--lg"></div>' +
            '<div class="voyagr-skeleton__line voyagr-skeleton__line--md"></div>' +
            '<div class="voyagr-skeleton__line voyagr-skeleton__line--btn"></div>' +
          '</div>' +
        '</article>';
    }
    // Inject shimmer CSS once (scoped selectors only, matches the
    // existing card dimensions).
    injectStyles('voyagr-skeleton-css',
      '@keyframes voyagr-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }' +
      '.voyagr-skeleton .r-card__media, .voyagr-skeleton__media { height: 200px; background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03)); background-size: 400px 100%; animation: voyagr-shimmer 1.2s linear infinite; border-radius: 0; }' +
      '.voyagr-skeleton__line { height: 12px; margin: 10px 0; border-radius: 4px; background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03)); background-size: 400px 100%; animation: voyagr-shimmer 1.2s linear infinite; }' +
      '.voyagr-skeleton__line--sm { width: 40%; }' +
      '.voyagr-skeleton__line--md { width: 70%; }' +
      '.voyagr-skeleton__line--lg { width: 85%; height: 18px; }' +
      '.voyagr-skeleton__line--btn { width: 100%; height: 36px; margin-top: 14px; border-radius: 18px; }'
    );
    var skelWrap = document.createElement('div');
    skelWrap.id = 'voyagr-skel';
    skelWrap.innerHTML = skeletonHtml;
    // Move each skeleton card into the grid (so it inherits grid layout).
    while (skelWrap.firstChild) grid.insertBefore(skelWrap.firstChild, grid.firstChild);

    setTimeout(function () {
      // Remove skeletons, reveal real cards.
      var skels = grid.querySelectorAll('.voyagr-skeleton');
      for (var j = 0; j < skels.length; j++) skels[j].parentNode.removeChild(skels[j]);
      realCards.forEach(function (c) { c.style.display = ''; });
    }, 800);

    // Wire card clicks (delegated so it covers both real cards
    // once skeletons disappear).
    grid.addEventListener('click', function (e) {
      var cta = e.target.closest && e.target.closest('.r-card__cta');
      var card = e.target.closest && e.target.closest('.r-card');
      if (!card || card.classList.contains('voyagr-skeleton')) return;
      if (!cta && !e.target.closest('.r-card__media') && !e.target.closest('.r-card__name')) {
        // Only commit on CTA or media/name tap — lets link clicks
        // like "vs. public rate" still fire without hijacking.
        if (!cta) return;
      }
      var name  = card.querySelector('.r-card__name');
      var img   = card.querySelector('.r-card__media img');
      var mem   = card.querySelector('.r-card__member');
      var pub   = card.querySelector('.r-card__public');
      var memberRate = parseInr(mem && mem.textContent);
      var publicRate = parseInr(pub && pub.textContent);
      setState({
        selectedHotel: {
          name: name ? name.textContent.trim() : '',
          id:   'h-' + Math.random().toString(36).slice(2, 8),
          memberRate: memberRate,
          publicRate: publicRate,
          image: img ? img.src : null
        }
      });
      slideLeftTo(PAGES.hotel);
    });

    // Back arrow on the summary row ("edit search") — just go back.
    var summary = document.querySelector('.r-summary');
    if (summary) summary.addEventListener('click', function (e) {
      e.preventDefault();
      slideRightTo(PAGES.search);
    });
  }

  // "₹31,800" → 31800. Loose parse — tolerates spaces, commas, etc.
  function parseInr(text) {
    if (!text) return null;
    var m = String(text).replace(/[^0-9]/g, '');
    return m ? parseInt(m, 10) : null;
  }

  /* ================================================================
   * Screen 4: Hotel Detail.
   *
   * - Reuse the hero image from the selected result card so no flash.
   * - Rate reveal: member rate div starts blurred at opacity 0.4,
   *   after 700ms transitions to sharp 1.0 over 500ms. One-shot per
   *   session (guarded by REVEAL_KEY).
   * - Sticky bottom bar: hidden until user scrolls past 50% of the
   *   hero image height, then fades in.
   * - "Select Room" → Room Selection.
   * =============================================================== */

  function initHotel() {
    var state = getState();

    // Hero image swap — only if we have an image carried forward.
    if (state.selectedHotel && state.selectedHotel.image) {
      var heroImg = document.querySelector('.h-hero img');
      if (heroImg) heroImg.src = state.selectedHotel.image;
    }
    // Hotel name swap so the funnel feels coherent.
    if (state.selectedHotel && state.selectedHotel.name) {
      var nameEl = document.querySelector('.h-header__name');
      if (nameEl) nameEl.textContent = state.selectedHotel.name;
    }

    // Rate reveal (one-shot).
    var memberRateBlock = document.querySelector('.h-rate');
    var alreadySeen = false;
    try { alreadySeen = !!sessionStorage.getItem(REVEAL_KEY); } catch (e) {}
    if (memberRateBlock && !alreadySeen) {
      memberRateBlock.style.filter = 'blur(6px)';
      memberRateBlock.style.opacity = '0.4';
      memberRateBlock.style.transition = 'filter 0.5s ease-out, opacity 0.5s ease-out';
      setTimeout(function () {
        memberRateBlock.style.filter = 'blur(0)';
        memberRateBlock.style.opacity = '1';
        try { sessionStorage.setItem(REVEAL_KEY, '1'); } catch (e) {}
      }, 700);
    }

    // Sticky bottom bar visibility — hidden until 50% of hero scrolled past.
    var sticky = document.querySelector('.h-sticky');
    var hero   = document.querySelector('.h-hero');
    if (sticky && hero) {
      sticky.style.transform = 'translateY(100%)';
      sticky.style.transition = 'transform 0.2s ease';
      sticky.style.willChange = 'transform';
      var shown = false;
      function onScroll() {
        var threshold = hero.offsetHeight * 0.5;
        var scrolled = window.pageYOffset || document.documentElement.scrollTop || 0;
        var should = scrolled > threshold;
        if (should && !shown) {
          sticky.style.transform = 'translateY(0)';
          shown = true;
        } else if (!should && shown) {
          sticky.style.transform = 'translateY(100%)';
          shown = false;
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Back arrow.
    var back = document.querySelector('.h-chrome .h-iconbtn');
    if (back) back.addEventListener('click', function (e) {
      e.preventDefault();
      slideRightTo(PAGES.results);
    });

    // "Select Room" CTA.
    var cta = document.querySelector('.h-sticky__cta');
    if (cta) cta.addEventListener('click', function () { slideLeftTo(PAGES.rooms); });
  }

  /* ================================================================
   * Screen 5: Room Selection.
   *
   * Clicking "Select Package" captures the room spec (name, sqft,
   * sleeps) and opens Package Selection as a bottom-sheet transition.
   * =============================================================== */

  function initRooms() {
    // Swap hotel summary if we have it.
    var state = getState();
    if (state.selectedHotel && state.selectedHotel.name) {
      var hn = document.querySelector('.rl-summary__hotel');
      if (hn) hn.textContent = state.selectedHotel.name;
    }

    // Delegated CTA handler.
    var grid = document.querySelector('.rl-grid, section.rl-grid') ||
               document.querySelector('main.rl-page') ||
               document.body;
    grid.addEventListener('click', function (e) {
      var cta = e.target.closest && e.target.closest('.rl-card__cta');
      if (!cta) return;
      var card = cta.closest('.rl-card');
      if (!card) return;
      var nameEl = card.querySelector('.rl-card__name');
      var meta   = card.querySelectorAll('.rl-card__meta-item');
      var sqft = null, sleeps = null;
      for (var i = 0; i < meta.length; i++) {
        var t = meta[i].textContent.trim();
        if (/sqft/i.test(t))  sqft   = parseInt(t, 10);
        if (/sleep/i.test(t)) sleeps = parseInt(t.replace(/[^0-9]/g, ''), 10);
      }
      // Strip the " · Package" suffix so the room name stays clean.
      var baseName = nameEl ? nameEl.childNodes[0].textContent.trim().replace(/·.*$/, '').trim() : 'Room';
      setState({
        selectedRoom: {
          name: baseName,
          id: 'r-' + Math.random().toString(36).slice(2, 8),
          sqft: sqft,
          sleeps: sleeps
        }
      });
      // Bottom sheet transition — animate the current body out
      // upward slightly (partial) and schedule a "sheet" entry on
      // the next page. A dark overlay covers the existing screen
      // during the 300ms slide.
      showSheetOverlay();
      setTimeout(function () {
        navigate(PAGES.packages, 'translateY(-6%)', 'sheet');
      }, 50);
    });

    // Back arrow.
    var back = document.querySelector('.rl-back');
    if (back) back.addEventListener('click', function (e) {
      e.preventDefault();
      slideRightTo(PAGES.hotel);
    });
  }

  // Temporary full-screen dark overlay used as the backdrop while a
  // bottom sheet slides into view.
  function showSheetOverlay() {
    if (document.getElementById('voyagr-sheet-overlay')) return;
    var o = document.createElement('div');
    o.id = 'voyagr-sheet-overlay';
    o.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9998',
      'background:rgba(0,0,0,0.6)',
      'opacity:0', 'transition:opacity ' + T_SHEET + 'ms ease',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(o);
    requestAnimationFrame(function () { o.style.opacity = '1'; });
  }

  /* ================================================================
   * Screen 6: Package Selection.
   *
   * - Starts the urgency timer (once per session).
   * - Clicking "Select" on a package captures inclusions + rate +
   *   cancellation type, dismisses the sheet (200ms), pauses
   *   another 200ms, then slides left to Review (spec verbatim).
   * =============================================================== */

  function initPackages() {
    ensureTimerStarted();
    startTimerTick();

    var state = getState();
    if (state.selectedRoom && state.selectedRoom.name) {
      var ctxTitle = document.querySelector('.rp-roomctx__title');
      if (ctxTitle) ctxTitle.textContent = state.selectedRoom.name;
    }

    var root = document.querySelector('.rp-grid') || document.body;
    root.addEventListener('click', function (e) {
      var cta = e.target.closest && e.target.closest('.rp-card__cta');
      if (!cta) return;
      var card = cta.closest('.rp-card');
      if (!card) return;

      var nameEl = card.querySelector('.rp-card__name');
      var memberEl = card.querySelector('.rp-card__member');
      var cancelEl = card.querySelector('.rp-card__cancel');
      var inclusions = Array.prototype.map.call(card.querySelectorAll('.rp-card__inclusions li'), function (li) {
        // Trim SVG text and return only the label text.
        return li.textContent.trim();
      });
      var cancellationType = 'flexible';
      if (card.classList.contains('rp-card--nonref')) cancellationType = 'non-refundable';
      else if (card.classList.contains('rp-card--flex')) cancellationType = 'flexible';
      setState({
        selectedPackage: {
          name: nameEl ? nameEl.textContent.trim() : 'Package',
          inclusions: inclusions,
          rate: parseInr(memberEl && memberEl.textContent),
          cancellationType: cancellationType
        }
      });

      // Dismiss sheet (200ms), then slide left (after a further
      // 200ms as per spec) to Review.
      dismissSheetOverlay();
      document.body.style.transition = 'transform ' + T_DISMISS + 'ms ease, opacity ' + T_DISMISS + 'ms ease';
      document.body.style.transform = 'translateY(20%)';
      document.body.style.opacity = '0';
      setTimeout(function () {
        // 200ms pause, then left-slide to Review.
        setTimeout(function () {
          scheduleEntry('slide-left');
          // Reset body styles before navigation so pageshow restores cleanly.
          document.body.style.transition = '';
          document.body.style.transform = '';
          document.body.style.opacity = '0';
          window.location.href = PAGES.review;
        }, 200);
      }, T_DISMISS);
    });

    // Back arrow — dismiss sheet back to Room Selection.
    var back = document.querySelector('.rp-back');
    if (back) back.addEventListener('click', function (e) {
      e.preventDefault();
      slideRightTo(PAGES.rooms);
    });
  }

  function dismissSheetOverlay() {
    var o = document.getElementById('voyagr-sheet-overlay');
    if (!o) return;
    o.style.opacity = '0';
    setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, T_DISMISS);
  }

  /* ================================================================
   * Screen 7: Review.
   *
   * - Renders the urgency timer.
   * - "Confirm Stay" → Guest Details.
   * =============================================================== */

  function initReview() {
    ensureTimerStarted();
    startTimerTick();

    // Reflect selected state into the review cards where trivially
    // possible (hotel name, room name, package name).
    var state = getState();
    var hotelName = document.querySelector('.rv-hotel__name');
    if (hotelName && state.selectedHotel && state.selectedHotel.name) {
      hotelName.textContent = state.selectedHotel.name;
    }
    var roomName = document.querySelector('.rv-room__name');
    if (roomName && state.selectedRoom && state.selectedRoom.name) {
      roomName.textContent = state.selectedRoom.name;
    }
    var pkgName = document.querySelector('.rv-room__pkg');
    if (pkgName && state.selectedPackage && state.selectedPackage.name) {
      pkgName.textContent = state.selectedPackage.name;
    }

    var cta = document.querySelector('.rv-cta');
    if (cta) cta.addEventListener('click', function () {
      slideLeftTo(PAGES.guest);
    });

    var back = document.querySelector('.rv-back');
    if (back) back.addEventListener('click', function (e) {
      e.preventDefault();
      slideRightTo(PAGES.packages);
    });
  }

  /* ================================================================
   * Screen 8: Guest Details.
   *
   * The prototype has two side-by-side states (A = pre-filled,
   * B = empty). We fill inputs in BOTH states from sessionStorage
   * where available so either demo path honours the spec.
   *
   * On "Continue to Payment", we harvest values from the first
   * state card that has non-empty first/last name, persist into
   * state.guestDetails, and advance.
   * =============================================================== */

  function initGuest() {
    ensureTimerStarted();
    startTimerTick();

    var state = getState();
    var gd = state.guestDetails || {};

    // Pre-fill: if we already have first/last, populate BOTH state
    // cards' inputs so the demo remains consistent.
    var aFirst = document.getElementById('a-first');
    var aLast  = document.getElementById('a-last');
    var aPan   = document.getElementById('a-pan');
    var bFirst = document.getElementById('b-first');
    var bLast  = document.getElementById('b-last');
    var bPan   = document.getElementById('b-pan');

    if (gd.firstName) {
      if (aFirst) aFirst.value = gd.firstName;
      if (bFirst) bFirst.value = gd.firstName;
    }
    if (gd.lastName) {
      if (aLast) aLast.value = gd.lastName;
      if (bLast) bLast.value = gd.lastName;
    }
    if (gd.pan) {
      if (aPan) aPan.value = gd.pan;
      if (bPan) bPan.value = gd.pan;
    }

    // Show pre-fill banner if we have guestDetails, otherwise leave
    // the existing prototype DOM untouched (State A already shows
    // the banner by default).
    var banner = document.querySelector('.gd-prefill');
    if (banner && !gd.firstName) {
      // No pre-fill data yet: keep banner visible since the State-A
      // demo card expects it; not a layout change.
    }

    // Harvest helper — pick the first state card whose first-name
    // input has a real value, falling back to State A.
    function harvest() {
      var first = (aFirst && aFirst.value.trim()) ||
                  (bFirst && bFirst.value.trim()) || '';
      var last  = (aLast && aLast.value.trim()) ||
                  (bLast && bLast.value.trim()) || '';
      var pan   = (aPan && aPan.value.trim()) ||
                  (bPan && bPan.value.trim()) || '';
      return {
        firstName: first,
        lastName:  last,
        pan:       pan,
        gst:       gd.gst || null
      };
    }

    // Delegated listener across both .gd-cta buttons (state gallery
    // renders the footer twice).
    var ctas = document.querySelectorAll('.gd-cta');
    for (var i = 0; i < ctas.length; i++) {
      ctas[i].addEventListener('click', function () {
        var captured = harvest();
        setState({ guestDetails: captured });
        slideLeftTo(PAGES.payment);
      });
    }

    var backs = document.querySelectorAll('.gd-back');
    for (var j = 0; j < backs.length; j++) {
      backs[j].addEventListener('click', function (e) {
        e.preventDefault();
        slideRightTo(PAGES.review);
      });
    }
  }

  /* ================================================================
   * Screen 9: Payment.
   *
   * - "Pay ₹X Securely": loading spinner + disable → 2s → success
   *   → slide up full-screen Confirmation.
   * - On simulated error, reset button and show inline error line.
   * - Both state cards (A and B) render their own CTA, so handle
   *   all matching buttons.
   * =============================================================== */

  function initPayment() {
    ensureTimerStarted();
    startTimerTick();

    var ctas = document.querySelectorAll('.py-cta');
    var originals = [];
    for (var i = 0; i < ctas.length; i++) originals.push(ctas[i].innerHTML);

    function setLoading(btn) {
      btn.disabled = true;
      btn.style.opacity = '0.85';
      btn.style.cursor = 'wait';
      btn.innerHTML =
        '<span class="voyagr-spin" aria-hidden="true" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(11,27,43,0.2);border-top-color:#0B1B2B;border-radius:50%;animation:voyagr-rotate 0.7s linear infinite;"></span>' +
        ' &nbsp;Processing…';
      injectStyles('voyagr-spin-css',
        '@keyframes voyagr-rotate { 100% { transform: rotate(360deg); } }'
      );
    }

    function resetButton(btn, index, errorMsg) {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.innerHTML = originals[index];
      if (errorMsg) {
        var existing = btn.parentNode.querySelector('.voyagr-pay-error');
        if (existing) existing.remove();
        var err = document.createElement('div');
        err.className = 'voyagr-pay-error';
        err.textContent = errorMsg;
        err.style.cssText = 'margin-top:8px;color:#e57373;font-size:12px;font-family:inherit;text-align:center;';
        btn.parentNode.appendChild(err);
      }
    }

    for (var k = 0; k < ctas.length; k++) {
      (function (btn, idx) {
        btn.addEventListener('click', function () {
          if (btn.disabled) return;
          // Clear any previous error.
          var prevErr = btn.parentNode.querySelector('.voyagr-pay-error');
          if (prevErr) prevErr.remove();
          setLoading(btn);
          setTimeout(function () {
            // Simulated success path: 2% artificial-error rate would
            // normally live here; for the demo we always succeed.
            // (Swap the boolean to test the error branch.)
            var ok = true;
            if (!ok) {
              resetButton(btn, idx, 'Payment could not be completed. Please try again.');
              return;
            }
            var bookingRef = 'VC-' +
              Math.random().toString(36).slice(2, 6).toUpperCase() +
              Math.random().toString(36).slice(2, 5).toUpperCase();
            setState({ bookingRef: bookingRef });
            slideUpTo(PAGES.confirmation);
          }, T_PAY);
        });
      })(ctas[k], k);
    }

    var backs = document.querySelectorAll('.py-back');
    for (var b = 0; b < backs.length; b++) {
      backs[b].addEventListener('click', function (e) {
        e.preventDefault();
        slideRightTo(PAGES.guest);
      });
    }
  }

  /* ================================================================
   * Screen 10: Confirmation.
   *
   * Render the booking summary from sessionStorage, then stop the
   * urgency timer (it's no longer relevant post-payment). A fresh
   * "Book Another Stay" clears state and returns to Search Home.
   * =============================================================== */

  function initConfirmation() {
    var state = getState();
    // Timer is done — remove so it doesn't re-trigger expiry modal.
    try { sessionStorage.removeItem(TIMER_KEY); } catch (e) {}

    var ref = state.bookingRef ||
      ('VC-' + Math.random().toString(36).slice(2, 9).toUpperCase());
    if (!state.bookingRef) setState({ bookingRef: ref });

    setText('#cf-ref-value', ref);

    var hotelName = state.selectedHotel && state.selectedHotel.name;
    if (hotelName) setText('#cf-hotel', hotelName);

    var n = state.nights || diffDaysISO(state.checkIn, state.checkOut) || 2;
    var dates = '';
    if (state.checkIn && state.checkOut) {
      dates = formatStayDates(state.checkIn, state.checkOut) + ' · ' + n + ' ' + (n === 1 ? 'Night' : 'Nights');
    }
    if (dates) setText('#cf-dates', dates);

    if (state.selectedRoom && state.selectedRoom.name) {
      setText('#cf-room', state.selectedRoom.name);
    }
    if (state.selectedPackage && state.selectedPackage.name) {
      setText('#cf-package', state.selectedPackage.name);
    }

    var gd = state.guestDetails || {};
    if (gd.firstName || gd.lastName) {
      setText('#cf-guest', (gd.firstName || '') + ' ' + (gd.lastName || ''));
    }

    if (state.selectedPackage && state.selectedPackage.rate && n) {
      setText('#cf-total', inr(state.selectedPackage.rate * n));
    }

    var home = document.getElementById('cf-home');
    if (home) home.addEventListener('click', function () {
      clearJourney();
      slideLeftTo(PAGES.search);
    });
    var fresh = document.getElementById('cf-new');
    if (fresh) fresh.addEventListener('click', function () {
      clearJourney();
      slideLeftTo(PAGES.search);
    });
  }

  /* ================================================================
   * Tiny DOM / style helpers.
   * =============================================================== */

  function setText(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  // Inject a <style> block exactly once, keyed by id. Used for
  // shimmer / spinner keyframes so the static prototype CSS stays
  // untouched.
  function injectStyles(id, css) {
    if (document.getElementById(id)) return;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function formatStayDates(inISO, outISO) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var a = new Date(inISO);
    var b = new Date(outISO);
    if (isNaN(+a) || isNaN(+b)) return inISO + ' – ' + outISO;
    var sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (sameMonth) {
      return a.getDate() + '–' + b.getDate() + ' ' + months[a.getMonth()] + ' ' + a.getFullYear();
    }
    return a.getDate() + ' ' + months[a.getMonth()] + ' – ' + b.getDate() + ' ' + months[b.getMonth()] + ' ' + a.getFullYear();
  }

  /* ================================================================
   * Boot — run common setup, then the page-specific init.
   * =============================================================== */

  function boot() {
    initCommon();
    var page = currentPage();
    switch (page) {
      case 'search':       initSearch(); break;
      case 'results':      initResults(); break;
      case 'hotel':        initHotel(); break;
      case 'rooms':        initRooms(); break;
      case 'packages':     initPackages(); break;
      case 'review':       initReview(); break;
      case 'guest':        initGuest(); break;
      case 'payment':      initPayment(); break;
      case 'confirmation': initConfirmation(); break;
      default: /* not a funnel screen */ break;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
