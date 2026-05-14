/* ============================================================
   DataCruise Arcade — Freemium gate
   - Marks paid cards as locked unless an unlock flag is present.
   - Intercepts clicks on locked cards → opens the unlock modal.
   - Validates a license key via the /api/validate-license Worker
     and persists the unlocked state to localStorage.
   - Includes a built-in dev key so the flow can be tested before
     the Lemon Squeezy account is live.
============================================================ */

(function () {
  'use strict';

  // ---------- catalogue: edit free/paid here -----------------
  const CATALOGUE = {
    free: ['mountain-climb', 'block-city', 'derive-jargon', 'sentence-builder'],
    paid: ['pie-spinner', 'bubble-catcher', 'dashboard-drop', 'data-crossword', 'scrub-mess', 'data-hunt'],
  };

  // ---------- config -----------------------------------------
  const STORAGE_KEY = 'datacruise.unlock.v1';
  const VALIDATE_ENDPOINT = '/api/validate-license';
  // While the Cloudflare Worker isn't deployed yet, this key
  // unlocks the pack locally so the flow can be tested end-to-end.
  // Strip this constant once the Worker is wired to Lemon Squeezy.
  const DEV_TEST_KEY = 'DC-ARCADE-DEV-2026';

  // ---------- state ------------------------------------------
  function getUnlocked() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.unlocked) return null;
      return obj;
    } catch (_) {
      return null;
    }
  }

  function setUnlocked(licenseKey) {
    const obj = {
      unlocked: true,
      licenseKey: licenseKey,
      unlockedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  // ---------- card lock rendering ----------------------------
  function isLocked(slug) {
    return CATALOGUE.paid.includes(slug);
  }

  function decorateCards() {
    const unlocked = !!getUnlocked();
    const cards = document.querySelectorAll('.game-card[data-slug]');

    cards.forEach((card) => {
      const slug = card.getAttribute('data-slug');
      const locked = isLocked(slug) && !unlocked;

      card.classList.toggle('is-locked', locked);
      card.classList.toggle('is-free', !isLocked(slug));

      // Add or remove the badge
      let badge = card.querySelector('.card-lock-badge');
      if (locked && !badge) {
        badge = document.createElement('span');
        badge.className = 'card-lock-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.innerHTML = '<span class="card-lock-icon">🔒</span><span class="card-lock-text">Locked</span>';
        card.appendChild(badge);
      } else if (!locked && badge) {
        badge.remove();
      }

      // Add or remove the "Free" chip
      let freeChip = card.querySelector('.card-free-chip');
      if (!isLocked(slug) && !freeChip) {
        freeChip = document.createElement('span');
        freeChip.className = 'card-free-chip';
        freeChip.textContent = 'Free';
        card.appendChild(freeChip);
      }
    });

    // Update the hero meta strip
    const meta = document.querySelector('[data-unlock-status]');
    if (meta) {
      const icon = meta.querySelector('.hero-meta-icon');
      const text = meta.querySelector('.hero-meta-text');
      const action = meta.querySelector('[data-unlock-open]');
      if (unlocked) {
        if (icon) icon.textContent = '✓';
        if (text) text.textContent = 'Full pack unlocked on this device.';
        if (action) {
          action.textContent = 'Manage';
          action.classList.add('is-unlocked');
        }
        meta.classList.add('is-unlocked');
      } else {
        if (icon) icon.textContent = '🔓';
        if (text) text.textContent = '4 games free · 6 unlocked with the full pack';
        if (action) {
          action.textContent = 'Unlock the full pack';
          action.classList.remove('is-unlocked');
        }
        meta.classList.remove('is-unlocked');
      }
    }
  }

  // ---------- click interception ------------------------------
  function bindCardClicks() {
    document.querySelectorAll('.game-card[data-slug]').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (card.classList.contains('is-locked')) {
          e.preventDefault();
          openModal();
        }
      });
    });
  }

  // ---------- modal -------------------------------------------
  const modal = () => document.querySelector('[data-unlock-modal]');

  function openModal() {
    const m = modal();
    if (!m) return;
    showView('locked');
    if (typeof m.showModal === 'function') {
      m.showModal();
    } else {
      m.setAttribute('open', '');
    }
    const input = m.querySelector('[data-unlock-input]');
    setTimeout(() => input && input.focus(), 50);
  }

  function closeModal() {
    const m = modal();
    if (!m) return;
    if (typeof m.close === 'function') {
      m.close();
    } else {
      m.removeAttribute('open');
    }
    clearError();
  }

  function showView(name) {
    const m = modal();
    if (!m) return;
    m.querySelectorAll('[data-unlock-view]').forEach((view) => {
      view.hidden = view.getAttribute('data-unlock-view') !== name;
    });
  }

  function showError(msg) {
    const el = document.querySelector('[data-unlock-error]');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }
  function clearError() {
    const el = document.querySelector('[data-unlock-error]');
    if (!el) return;
    el.textContent = '';
    el.hidden = true;
  }

  function setSubmitting(submitting) {
    const btn = document.querySelector('[data-unlock-submit]');
    const input = document.querySelector('[data-unlock-input]');
    if (btn) {
      btn.disabled = submitting;
      btn.textContent = submitting ? 'Checking…' : 'Unlock';
    }
    if (input) input.disabled = submitting;
  }

  // ---------- validation --------------------------------------
  async function validateKey(rawKey) {
    const key = (rawKey || '').trim();
    if (!key) {
      return { ok: false, error: 'Please enter your unlock key.' };
    }

    // Dev/test key — works offline so the flow can be exercised
    // before the Worker + Lemon Squeezy are wired together.
    if (key === DEV_TEST_KEY) {
      return { ok: true, licenseKey: key, dev: true };
    }

    try {
      const res = await fetch(VALIDATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key }),
      });

      // Endpoint not deployed yet (404 = no such route on Cloudflare,
      // 405/501 = the local python http.server doesn't speak POST) →
      // return a clear message so the user knows to use the dev key.
      if (res.status === 404 || res.status === 405 || res.status === 501) {
        return {
          ok: false,
          error:
            'The unlock service isn’t live yet. Try the test key DC-ARCADE-DEV-2026 for now.',
        };
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data && data.valid) {
        return { ok: true, licenseKey: key };
      }
      return {
        ok: false,
        error: (data && data.error) || 'That key doesn’t match. Check the email from your purchase.',
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Couldn’t reach the unlock service. Check your connection and try again.',
      };
    }
  }

  function bindModal() {
    document.querySelectorAll('[data-unlock-open]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });
    document.querySelectorAll('[data-unlock-close]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
      });
    });

    const m = modal();
    if (m) {
      // Click-outside-to-close for native <dialog>
      m.addEventListener('click', (e) => {
        if (e.target === m) closeModal();
      });
    }

    const form = document.querySelector('[data-unlock-form]');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();
        const input = form.querySelector('[data-unlock-input]');
        const key = input ? input.value : '';
        setSubmitting(true);
        const result = await validateKey(key);
        setSubmitting(false);
        if (result.ok) {
          setUnlocked(result.licenseKey);
          decorateCards();
          showView('success');
        } else {
          showError(result.error);
        }
      });
    }
  }

  // ---------- boot --------------------------------------------
  function boot() {
    decorateCards();
    bindCardClicks();
    bindModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
