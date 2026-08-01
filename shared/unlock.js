/* ============================================================
   DataCruise Arcade — Freemium gate
   - Marks paid cards as locked unless an unlock flag is present.
   - Intercepts clicks on locked cards → opens the unlock modal.
   - Validates a per-buyer Gumroad licence key via the
     /api/validate-license Worker (which forwards to Gumroad's
     /v2/licenses/verify) and persists the unlocked state to
     localStorage on success.
============================================================ */

(function () {
  'use strict';

  // ---------- catalogue: edit free/paid here -----------------
  const CATALOGUE = {
    free: ['mountain-climb', 'block-city', 'derive-jargon', 'sentence-builder'],
    paid: ['pie-spinner', 'bubble-catcher', 'dashboard-drop', 'data-crossword', 'scrub-mess', 'data-hunt', 'decision-lab'],
  };

  // ---------- config -----------------------------------------
  const STORAGE_KEY = 'datacruise.unlock.v1';
  const VALIDATE_ENDPOINT = '/api/validate-license';

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
        if (text) text.textContent = '4 games free · 7 unlocked with the full pack';
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

  function maskKey(key) {
    if (!key) return '—';
    const parts = String(key).split('-');
    if (parts.length < 2) return key.slice(0, 2) + '••••••';
    const head = parts[0];
    const tail = parts[parts.length - 1];
    const middle = parts.slice(1, -1).map(() => '••••').join('-');
    return middle ? `${head}-${middle}-${tail}` : `${head}-${tail}`;
  }

  function populateManageView() {
    const state = getUnlocked();
    if (!state) return;
    const keyEl = document.querySelector('[data-unlock-key-display]');
    const dateEl = document.querySelector('[data-unlock-date]');
    const toggle = document.querySelector('[data-unlock-key-toggle]');
    if (keyEl) {
      keyEl.dataset.fullKey = state.licenseKey || '';
      keyEl.dataset.revealed = 'false';
      keyEl.textContent = maskKey(state.licenseKey);
    }
    if (toggle) toggle.textContent = 'Show';
    if (dateEl && state.unlockedAt) {
      try {
        const d = new Date(state.unlockedAt);
        dateEl.textContent = d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch (_) {
        dateEl.textContent = state.unlockedAt;
      }
    }
  }

  function openModal() {
    const m = modal();
    if (!m) return;
    const view = getUnlocked() ? 'manage' : 'locked';
    showView(view);
    if (view === 'manage') populateManageView();
    if (typeof m.showModal === 'function') {
      m.showModal();
    } else {
      m.setAttribute('open', '');
    }
    if (view === 'locked') {
      const input = m.querySelector('[data-unlock-input]');
      setTimeout(() => input && input.focus(), 50);
    }
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

    try {
      const res = await fetch(VALIDATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key }),
      });

      // Endpoint not deployed yet or routing misconfigured.
      // (404 = no route on Cloudflare; 405/501 = local python
      // http.server doesn't speak POST when running offline.)
      if (res.status === 404 || res.status === 405 || res.status === 501) {
        return {
          ok: false,
          error:
            'The unlock service is temporarily unavailable. Please try again in a moment or contact support.',
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

    // Show/Hide the full unlock key in the Manage view
    const keyToggle = document.querySelector('[data-unlock-key-toggle]');
    if (keyToggle) {
      keyToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const keyEl = document.querySelector('[data-unlock-key-display]');
        if (!keyEl) return;
        const revealed = keyEl.dataset.revealed === 'true';
        if (revealed) {
          keyEl.textContent = maskKey(keyEl.dataset.fullKey);
          keyEl.dataset.revealed = 'false';
          keyToggle.textContent = 'Show';
        } else {
          keyEl.textContent = keyEl.dataset.fullKey || '—';
          keyEl.dataset.revealed = 'true';
          keyToggle.textContent = 'Hide';
        }
      });
    }

    // Sign out of this device
    const signoutBtn = document.querySelector('[data-unlock-signout]');
    if (signoutBtn) {
      signoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const confirmed = window.confirm(
          "Sign out of the full pack on this device?\n\nYou'll need to paste your unlock key again to re-unlock. Your key still works — this only clears it from this browser."
        );
        if (!confirmed) return;
        localStorage.removeItem(STORAGE_KEY);
        closeModal();
        decorateCards();
      });
    }

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
