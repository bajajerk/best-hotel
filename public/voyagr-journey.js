/*
 * ──────────────────────────────────────────────────────────────────────────
 * Voyagr Club — Booking journey interaction layer
 * ──────────────────────────────────────────────────────────────────────────
 * Single-file vanilla JS. No jQuery, no frameworks. Mobile-first events.
 *
 * This file is the canonical interaction spec connecting the six stages of
 * the booking funnel:
 *
 *   1. Homepage arrival       — 4th-card blur, hero rate reveal
 *   2. Search / browse        — typeahead debounce, date guards, filters
 *   3. Hotel detail           — sticky rate panel, rate reveal, WA nudge
 *   4. Booking decision       — progress bar, room select, reserve guard
 *   5. Checkout               — profile prefill, payment tabs, UPI, CTA
 *   6. Confirmation           — checkmark draw, cascade reveal, referral
 *
 * Each init function feature-detects its hooks and gracefully no-ops when
 * they are absent. The file is therefore safe to load on any page — it only
 * activates where matching selectors exist.
 *
 * Session state keys (sessionStorage, JSON-encoded):
 *   rateRevealSeen   boolean   once the hero reveal has fired
 *   selectedDates    {from,to} picked in the sticky search bar
 *   selectedRoom     {name,rate} chosen on the detail page
 *   memberStatus     boolean   true when the user is signed in
 *
 * Durable state keys (localStorage, JSON-encoded):
 *   waPromptDismissed { ts }   WhatsApp nudge dismissed — 7-day TTL
 *   lastViewedHotels  [ ... ]  up to 6 most-recent hotels for "Recently viewed"
 * ──────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── constants ────────────────────────────────────────────────────────── */

  const KEYS = {
    rateReveal:    'rateRevealSeen',
    selectedDates: 'selectedDates',
    selectedRoom:  'selectedRoom',
    memberStatus:  'memberStatus',
    memberProfile: 'memberProfile',
    waDismissed:   'waPromptDismissed',
    lastViewed:    'lastViewedHotels',
  };

  const WA_TRIGGER_MS          = 40000;           // step 3: 40s dwell
  const WA_DISMISS_TTL_MS      = 7 * 86400000;    // 7 days silence after dismiss
  const TYPEAHEAD_DEBOUNCE_MS  = 300;             // step 2: debounce typeahead
  const STICKY_PANEL_PROGRESS  = 0.6;             // step 3: 60% past hero
  const RATE_REVEAL_THRESHOLD  = 0.45;            // IntersectionObserver ratio
  const MOBILE_BREAKPOINT      = '(max-width: 768px)';
  const LAST_VIEWED_LIMIT      = 6;

  /* ── tiny utils ───────────────────────────────────────────────────────── */

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function debounce(fn, ms) {
    let t;
    return function debounced() {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  const isMobile = () => window.matchMedia(MOBILE_BREAKPOINT).matches;

  /* ── storage helpers (defensive: JSON + try/catch everywhere) ─────────── */

  const store = (backend) => ({
    get(k) {
      try {
        const v = backend.getItem(k);
        return v === null ? null : JSON.parse(v);
      } catch (_) { return null; }
    },
    set(k, v) {
      try { backend.setItem(k, JSON.stringify(v)); } catch (_) {}
    },
    remove(k) {
      try { backend.removeItem(k); } catch (_) {}
    },
  });
  const session = store(window.sessionStorage);
  const local   = store(window.localStorage);

  const isMember = () => Boolean(session.get(KEYS.memberStatus));

  /* ── shared style injection (classes used by this file only) ──────────── */
  //
  // We inject the slide-in transforms for the sticky panel so the behaviour
  // is uniform whether the host HTML defines its own .is-hidden/.is-visible
  // rules or not. Scoped to our own journey-* classes to avoid collisions.

  function injectStyles() {
    if (document.getElementById('voyagr-journey-styles')) return;
    const css = `
      [data-journey-sticky] {
        transition: transform 0.3s ease, opacity 0.3s ease;
        will-change: transform, opacity;
      }
      [data-journey-sticky].journey-hidden {
        transform: translateX(100%);
        opacity: 0;
        pointer-events: none;
      }
      [data-journey-sticky].journey-shown {
        transform: translateX(0);
        opacity: 1;
      }
      @media ${MOBILE_BREAKPOINT} {
        [data-journey-sticky] { transition-duration: 0.25s; }
        [data-journey-sticky].journey-hidden { transform: translateY(100%); }
        [data-journey-sticky].journey-shown  { transform: translateY(0); }
      }
      .journey-blur-rate {
        filter: blur(6px);
        cursor: pointer;
        transition: text-shadow 0.25s ease;
      }
      .journey-blur-rate.is-hovered {
        text-shadow: 0 0 12px rgba(201, 168, 76, 0.55),
                     0 0 4px  rgba(201, 168, 76, 0.35);
      }
      .journey-pick-fade {
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .journey-pick-fade.is-in {
        opacity: 1;
        transform: translateY(0);
      }
      .journey-match-gold {
        color: #C9A84C !important;
        font-weight: 500;
      }
      .journey-room-selected {
        border-color: #C9A84C !important;
        box-shadow: inset 0 0 0 1px #C9A84C;
      }
      .journey-flash {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #0B1B2B;
        color: #F5F0E8;
        border: 1px solid #C9A84C;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 9999;
        font-size: 13px;
        letter-spacing: 0.02em;
      }
    `;
    const el = document.createElement('style');
    el.id = 'voyagr-journey-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function flash(msg) {
    const el = document.createElement('div');
    el.className = 'journey-flash';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /* ──────────────────────────────────────────────────────────────────────
   * STEP 1 — Homepage arrival
   * ────────────────────────────────────────────────────────────────────── */

  function initHomepage() {
    initHeroRateReveal();
    initFourthCardBlur();
  }

  // Hero comparison widget reveal — fires once per session.
  // Uses sessionStorage so navigating within the session doesn't re-trigger.
  function initHeroRateReveal() {
    const target = $('[data-rate-widget]') || $('[data-rate-reveal]');
    if (!target) return;

    if (session.get(KEYS.rateReveal)) {
      target.classList.add('is-revealed');
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        target.classList.add('is-revealed');
        session.set(KEYS.rateReveal, true);
        io.disconnect();
      });
    }, { threshold: RATE_REVEAL_THRESHOLD });
    io.observe(target);
  }

  // 4th hotel card: blurred rate with gold shimmer on hover, opens signup gate on click.
  // Guests only — members see clear rates everywhere.
  function initFourthCardBlur() {
    if (isMember()) return;
    const cards = $$('[data-hotel-card]');
    if (cards.length < 4) return;

    const fourth = cards[3];
    const rate = fourth.querySelector('[data-rate]')
              || fourth.querySelector('.club-card__member-rate');
    if (!rate) return;

    rate.classList.add('journey-blur-rate');
    const onEnter = () => rate.classList.add('is-hovered');
    const onLeave = () => rate.classList.remove('is-hovered');
    fourth.addEventListener('mouseenter', onEnter);
    fourth.addEventListener('mouseleave', onLeave);
    // Touch devices: use focus to simulate hover shimmer
    fourth.addEventListener('touchstart', onEnter, { passive: true });
    fourth.addEventListener('touchend',   onLeave, { passive: true });

    fourth.addEventListener('click', (e) => {
      e.preventDefault();
      fireSignupGate('fourth-card');
    });
  }

  // Fires a signup modal if one is present; otherwise dispatches an event
  // that a React/outer layer can listen for.
  function fireSignupGate(source) {
    const modal = $('[data-signup-modal]') || $('#signupModal');
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('data-source', source);
      return;
    }
    document.dispatchEvent(new CustomEvent('voyagr:signup-gate', {
      detail: { source },
      bubbles: true,
    }));
  }

  /* ──────────────────────────────────────────────────────────────────────
   * STEP 2 — Search / browse
   * ────────────────────────────────────────────────────────────────────── */

  function initSearch() {
    initTypeahead();
    initDateGuards();
    initResultsCount();
    initPickFadeIn();
  }

  // Layer debounce + gold match highlight on top of any existing typeahead.
  // The prototype's inline script already renders the result list; here we
  // only apply the visual polish so we don't fight the render loop.
  function initTypeahead() {
    const input = $('[data-typeahead]') || $('#destInput');
    const list  = $('[data-typeahead-list]') || $('#destList');
    if (!input || !list) return;

    const highlight = debounce(() => {
      const q = input.value.trim().toLowerCase();
      const items = list.querySelectorAll('li');
      items.forEach((li) => {
        const span = li.querySelector('span') || li;
        const text = (span.textContent || '').toLowerCase();
        const isMatch = q && text.includes(q);
        li.classList.toggle('journey-match-gold', isMatch);
      });
      // Top 6 only
      items.forEach((li, i) => {
        li.style.display = i < 6 ? '' : 'none';
      });
    }, TYPEAHEAD_DEBOUNCE_MS);

    input.addEventListener('input', highlight);
    highlight(); // apply top-6 cap immediately
  }

  // Disable past dates on any date input. The calendar in the prototype is
  // custom-built and blocks past dates natively; this guards stock inputs.
  function initDateGuards() {
    const today = new Date().toISOString().slice(0, 10);
    $$('input[type="date"]').forEach((i) => {
      if (!i.min) i.min = today;
    });
  }

  // Keep the results count in sync with DOM. Uses MutationObserver so the
  // count updates even when the inline filter/sort code mutates the grid.
  function initResultsCount() {
    const countEl = $('[data-results-count]') || $('#resultsCount');
    const grid    = $('[data-results-grid]')  || $('#resultsGrid');
    if (!countEl || !grid) return;

    const recount = () => {
      const n = grid.querySelectorAll('.club-card, [data-hotel-card]').length;
      countEl.textContent = String(n);
    };
    recount();
    new MutationObserver(recount).observe(grid, { childList: true });
  }

  // Stagger fade-in the Voyagr Pick cards on load for a calmer arrival.
  function initPickFadeIn() {
    const picks = $$('.club-card .club-card__badge, [data-voyagr-pick]');
    picks.forEach((badge, i) => {
      const card = badge.closest('.club-card, [data-hotel-card]');
      if (!card) return;
      card.classList.add('journey-pick-fade');
      setTimeout(() => card.classList.add('is-in'), 80 * i + 40);
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
   * STEP 3 — Hotel detail
   * ────────────────────────────────────────────────────────────────────── */

  function initHotelDetail() {
    initStickyPanel();
    initRateRevealOnDetail();
    initWhatsAppTrigger();
    trackLastViewed();
  }

  // Sticky panel appears after scrolling 60% past the hero.
  // Desktop: slides in from right (translateX). Mobile: slides up (translateY).
  function initStickyPanel() {
    const hero  = $('[data-hero]') || $('.hero');
    const panel = $('[data-sticky-panel]') || $('#ratePanel');
    if (!hero || !panel) return;

    panel.setAttribute('data-journey-sticky', '');
    panel.classList.add('journey-hidden');

    let ticking = false;
    const evaluate = () => {
      ticking = false;
      const rect = hero.getBoundingClientRect();
      const progress = (-rect.top) / Math.max(rect.height, 1);
      const shouldShow = progress >= STICKY_PANEL_PROGRESS;
      panel.classList.toggle('journey-shown',  shouldShow);
      panel.classList.toggle('journey-hidden', !shouldShow);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    evaluate();
  }

  // Rate comparison reveal on the detail page — fires once.
  function initRateRevealOnDetail() {
    const card = $('[data-rate-card]') || $('#rateCard');
    if (!card) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => card.classList.add('is-revealed'), 120);
        session.set(KEYS.rateReveal, true);
        io.disconnect();
      });
    }, { threshold: RATE_REVEAL_THRESHOLD });
    io.observe(card);
  }

  // WhatsApp nudge slides up after 40s dwell; dismissal silenced for 7 days.
  function initWhatsAppTrigger() {
    const nudge = $('[data-wa-nudge]') || $('#waNudge');
    if (!nudge) return;

    const dismissed = local.get(KEYS.waDismissed);
    if (dismissed && (Date.now() - dismissed.ts) < WA_DISMISS_TTL_MS) return;

    const timer = setTimeout(() => nudge.classList.add('is-visible'), WA_TRIGGER_MS);

    const close = $('[data-wa-nudge-close]') || $('#waNudgeClose');
    if (close) {
      close.addEventListener('click', () => {
        nudge.classList.remove('is-visible');
        clearTimeout(timer);
        local.set(KEYS.waDismissed, { ts: Date.now() });
      });
    }
  }

  // Recently viewed hotels cache — capped at 6, most-recent-first.
  function trackLastViewed() {
    const holder = $('[data-hotel-id]');
    if (!holder) return;
    const id = holder.dataset.hotelId;
    if (!id) return;
    const name = ($('[data-hotel-name]') || $('.hotel-name'))?.textContent?.trim() || '';
    const entry = { id, name, viewedAt: Date.now() };
    const prev = local.get(KEYS.lastViewed) || [];
    const next = [entry, ...prev.filter((e) => e.id !== id)].slice(0, LAST_VIEWED_LIMIT);
    local.set(KEYS.lastViewed, next);
  }

  /* ──────────────────────────────────────────────────────────────────────
   * STEP 4 — Booking decision
   * ────────────────────────────────────────────────────────────────────── */

  function initBooking() {
    initProgressBar();
    initDateConfirm();
    initRoomSelection();
    initReserveCTA();
  }

  function initProgressBar() {
    const bar = $('[data-progress-bar]') || $('.vc-steps');
    if (!bar) return;
    document.addEventListener('voyagr:dates-confirmed', () => {
      bar.setAttribute('data-current-step', '2');
      const step2 = bar.querySelector('[data-step="2"], .vc-steps__step:nth-child(2)');
      if (step2) step2.classList.add('is-active');
    });
  }

  // Parse the dates field on confirm and persist for the checkout step.
  function initDateConfirm() {
    const confirmBtn = $('[data-dates-confirm]') || $('#findRatesBtn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', () => {
      const valueEl = $('[data-dates-value]') || $('#datesValue');
      if (valueEl) {
        const parts = (valueEl.textContent || '').split('–').map((s) => s.trim());
        if (parts.length === 2) {
          session.set(KEYS.selectedDates, { from: parts[0], to: parts[1] });
        }
      }
      document.dispatchEvent(new CustomEvent('voyagr:dates-confirmed'));
    });
  }

  function initRoomSelection() {
    const rooms = $$('[data-room], .room');
    if (!rooms.length) return;

    rooms.forEach((room) => {
      room.addEventListener('click', () => {
        rooms.forEach((r) => r.classList.remove('journey-room-selected', 'is-selected'));
        room.classList.add('journey-room-selected', 'is-selected');

        const name = room.dataset.room
                  || room.querySelector('.room__name, [data-room-name]')?.textContent?.trim()
                  || 'Room';
        const rate = room.dataset.rate
                  || room.querySelector('[data-room-rate]')?.textContent?.trim()
                  || null;
        session.set(KEYS.selectedRoom, { name, rate });
        updateStickyPanelRoom({ name, rate });
      });
    });

    // Rehydrate selection on load.
    const saved = session.get(KEYS.selectedRoom);
    if (saved && saved.name) {
      rooms.forEach((r) => {
        const rn = r.dataset.room
                || r.querySelector('.room__name, [data-room-name]')?.textContent?.trim();
        if (rn === saved.name) r.classList.add('journey-room-selected', 'is-selected');
      });
      updateStickyPanelRoom(saved);
    }
  }

  function updateStickyPanelRoom({ name, rate }) {
    const select = $('[data-room-select]') || $('.rate-panel__select');
    if (select && select.tagName === 'SELECT' && name) {
      const match = Array.from(select.options).find((o) => o.textContent.includes(name));
      if (match) select.value = match.value;
    }
    if (rate) {
      const target = $('[data-panel-rate]');
      if (target) target.textContent = rate;
    }
  }

  // Reserve CTA: validate dates + room selected before navigating to checkout.
  function initReserveCTA() {
    const ctas = $$('[data-reserve-cta], .rate-panel__cta, #mobileReserveBtn');
    if (!ctas.length) return;
    ctas.forEach((cta) => {
      cta.addEventListener('click', (e) => {
        const dates = session.get(KEYS.selectedDates);
        const room  = session.get(KEYS.selectedRoom);
        if (!dates || !dates.from || !dates.to) {
          e.preventDefault();
          flash('Select your stay dates first.');
          return;
        }
        if (!room || !room.name) {
          e.preventDefault();
          flash('Choose a room to reserve.');
          return;
        }
        // If the CTA is an anchor pointing somewhere sensible, let it go.
        // Otherwise navigate to checkout explicitly.
        if (cta.tagName !== 'A' || cta.getAttribute('href') === '#') {
          e.preventDefault();
          window.location.href = '/checkout';
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
   * STEP 5 — Checkout
   * ────────────────────────────────────────────────────────────────────── */

  function initCheckout() {
    prefillProfile();
    initPaymentTabs();
    initUPIValidation();
    initPayCTA();
  }

  function prefillProfile() {
    const profile = session.get(KEYS.memberProfile);
    if (!profile) return;
    ['name', 'email', 'phone'].forEach((field) => {
      const input = $(`[data-prefill="${field}"]`)
                 || $(`input[name="${field}"]`)
                 || $(`#${field}Input`);
      if (input && !input.value && profile[field]) input.value = profile[field];
    });
  }

  // Payment method tabs: show/hide panels by key.
  function initPaymentTabs() {
    const tabs   = $$('[data-payment-tab], .vc-tabs__btn');
    const panels = $$('[data-payment-panel]');
    if (!tabs.length) return;

    const activate = (key) => {
      tabs.forEach((t) => {
        const tk = t.dataset.paymentTab || t.dataset.tab || t.textContent.trim().toLowerCase();
        t.classList.toggle('is-active', tk === key);
      });
      panels.forEach((p) => {
        p.hidden = p.dataset.paymentPanel !== key;
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.paymentTab || tab.dataset.tab || tab.textContent.trim().toLowerCase();
        activate(key);
      });
    });

    // Default to first tab.
    const first = tabs[0];
    if (first) {
      const key = first.dataset.paymentTab || first.dataset.tab || first.textContent.trim().toLowerCase();
      activate(key);
    }
  }

  // UPI format: `handle@provider`. CTA stays disabled until valid.
  function initUPIValidation() {
    const upi = $('[data-upi-input]') || $('#upiInput');
    const cta = $('[data-pay-cta]')   || $('.vc-pay-btn');
    if (!upi || !cta) return;

    // Permissive but pragmatic — matches the RBI NPCI VPA pattern.
    const re = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z][a-zA-Z0-9.\-_]{1,}$/;

    const validate = () => {
      const valid = re.test(upi.value.trim());
      cta.disabled = !valid;
      cta.classList.toggle('is-disabled', !valid);
      cta.setAttribute('aria-disabled', String(!valid));
    };
    upi.addEventListener('input', validate);
    upi.addEventListener('blur',  validate);
    validate();
  }

  // Pay CTA: single loading state, disabled to prevent double-submit.
  function initPayCTA() {
    const cta = $('[data-pay-cta]') || $('.vc-pay-btn');
    if (!cta) return;
    cta.addEventListener('click', (e) => {
      if (cta.disabled || cta.classList.contains('is-loading')) {
        e.preventDefault();
        return;
      }
      cta.dataset.originalLabel = cta.textContent || '';
      cta.classList.add('is-loading');
      cta.disabled = true;
      cta.textContent = 'Processing…';

      // Prototype-level simulation. Real page should POST and use the server
      // redirect. We defer navigation so the loading state is visible.
      setTimeout(() => {
        window.location.href = '/book/confirmation';
      }, 1200);
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
   * STEP 6 — Confirmation
   * ────────────────────────────────────────────────────────────────────── */

  function initConfirmation() {
    drawCheckmark();
    cascadeReveal();
    initReferralCopy();
  }

  // Checkmark SVG draw: stroke-dasharray/dashoffset trick, 0.8s gold stroke.
  function drawCheckmark() {
    const svg = $('[data-confirm-check]') || $('.confirm-check svg') || $('.confirm-check');
    if (!svg) return;
    const stroke = svg.querySelector('path, polyline');
    if (!stroke || typeof stroke.getTotalLength !== 'function') return;
    const length = stroke.getTotalLength();
    stroke.style.stroke         = '#C9A84C';
    stroke.style.strokeDasharray  = String(length);
    stroke.style.strokeDashoffset = String(length);
    stroke.style.transition     = 'stroke-dashoffset 0.8s ease';
    requestAnimationFrame(() => {
      stroke.style.strokeDashoffset = '0';
    });
  }

  // Hotel name fades in at 0.4s; savings callout slides up 0.3s later.
  function cascadeReveal() {
    const name = $('[data-confirm-hotel-name]');
    if (name) {
      name.style.opacity    = '0';
      name.style.transition = 'opacity 0.4s ease';
      setTimeout(() => { name.style.opacity = '1'; }, 400);
    }
    const savings = $('[data-confirm-savings]');
    if (savings) {
      savings.style.opacity    = '0';
      savings.style.transform  = 'translateY(16px)';
      savings.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => {
        savings.style.opacity   = '1';
        savings.style.transform = 'translateY(0)';
      }, 700);
    }
  }

  // Referral copy: clipboard write, button flashes "Copied!" for 2s.
  function initReferralCopy() {
    const btn = $('[data-referral-copy]') || $('.confirm-referral-copy');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const source = $('[data-referral-link]') || $('.confirm-referral-input');
      const link = btn.dataset.link
                || source?.value
                || source?.textContent?.trim();
      if (!link) return;
      try {
        await navigator.clipboard.writeText(link);
      } catch (_) {
        // Fallback for browsers without Clipboard API or insecure contexts.
        const ta = document.createElement('textarea');
        ta.value = link;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (__) {}
        ta.remove();
      }
      const original = btn.dataset.originalLabel || btn.textContent || 'Copy';
      if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent || '';
      btn.textContent = 'Copied!';
      btn.classList.add('is-copied');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('is-copied');
      }, 2000);
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
   * Boot
   * ──────────────────────────────────────────────────────────────────────
   * Each init is idempotent and guarded — we can safely call them all on
   * every page; only the matching hooks will light up.
   */

  function boot() {
    injectStyles();
    initHomepage();
    initSearch();
    initHotelDetail();
    initBooking();
    initCheckout();
    initConfirmation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose a tiny namespace for host pages that want to drive state transitions
  // from their own scripts (e.g. "mark user as member after signup").
  window.VoyagrJourney = {
    keys: KEYS,
    setMember(on) { session.set(KEYS.memberStatus, Boolean(on)); },
    setProfile(profile) { session.set(KEYS.memberProfile, profile || {}); },
    setSelectedDates(from, to) { session.set(KEYS.selectedDates, { from, to }); },
    setSelectedRoom(name, rate) { session.set(KEYS.selectedRoom, { name, rate }); },
    fireSignupGate,
  };
})();
