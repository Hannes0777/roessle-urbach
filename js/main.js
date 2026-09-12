(() => {
  'use strict';

  /* ---- Mobile nav overlay ------------------------------------------------ */
  const toggle = document.querySelector('.nav-toggle');
  const overlay = document.querySelector('.nav-overlay');
  const closeBtn = document.querySelector('.nav-overlay__close');

  function openNav() {
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (toggle && overlay) {
    toggle.addEventListener('click', openNav);
    closeBtn?.addEventListener('click', closeNav);
    overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
  }

  /* ---- Live opening status ------------------------------------------------
     Restaurant: Do-Sa 17:30-23:00, So 11:30-14:30 + 17:30-21:00.
     Hotel/Rezeption: täglich erreichbar. Quelle: roessle-urbach.de */
  const RESTAURANT_HOURS = {
    4: [[17.5, 23]],        // Donnerstag
    5: [[17.5, 23]],        // Freitag
    6: [[17.5, 23]],        // Samstag
    0: [[11.5, 14.5], [17.5, 21]], // Sonntag
  };

  function isRestaurantOpenNow(date) {
    const day = date.getDay();
    const hours = date.getHours() + date.getMinutes() / 60;
    const ranges = RESTAURANT_HOURS[day] || [];
    return ranges.some(([from, to]) => hours >= from && hours < to);
  }

  function paintStatus(el, open) {
    el.dataset.status = open ? 'open' : 'closed';
    const label = el.querySelector('[data-status-label]');
    if (label) label.textContent = open ? 'Restaurant jetzt geöffnet' : 'Restaurant aktuell geschlossen';
  }

  document.querySelectorAll('[data-live-status]').forEach((el) => paintStatus(el, isRestaurantOpenNow(new Date())));

  /* ---- Reveal-on-scroll (dezent, respektiert prefers-reduced-motion über CSS) */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }
})();
