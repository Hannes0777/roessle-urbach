(() => {
  'use strict';
  const widget = document.querySelector('.booking-widget');
  if (!widget) return;

  /* ---- Demo-Daten ---------------------------------------------------------
     Zimmerpreise sind echt (roessle-urbach.de/hotel/preise). Die
     Verfügbarkeit ist eine feste Demo-Belegung, keine echte Anbindung an ein
     Reservierungssystem — siehe Hinweis im Buchungswidget selbst. */
  const ROOMS = [
    { id: 'ez', name: 'Einzelzimmer', desc: 'Dusche/WC', price: 60 },
    { id: 'dz-ez', name: 'Doppelzimmer als Einzelzimmer', desc: 'Dusche/WC', price: 70 },
    { id: 'dz', name: 'Doppelzimmer', desc: 'Dusche/WC', price: 99 },
  ];
  const BREAKFAST_PRICE = 9.5;

  /** Deterministisch "belegte" Tage für die Demo (kein echter Kalender-Feed). */
  function isBlocked(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const seed = (day * 7 + month * 3) % 11;
    return seed === 0 || seed === 5;
  }

  const state = {
    step: 1,
    roomId: null,
    checkIn: null,
    checkOut: null,
    guests: 2,
    breakfast: false,
    calMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  };

  const steps = widget.querySelectorAll('.booking-steps__step');
  const panels = widget.querySelectorAll('.booking-panel');

  function fmtDate(d) {
    return d ? d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';
  }
  function nights() {
    if (!state.checkIn || !state.checkOut) return 0;
    return Math.round((state.checkOut - state.checkIn) / 86400000);
  }
  function room() { return ROOMS.find((r) => r.id === state.roomId); }
  function total() {
    const r = room();
    if (!r) return 0;
    const n = nights();
    let sum = r.price * n;
    if (state.breakfast) sum += BREAKFAST_PRICE * state.guests * n;
    return sum;
  }

  function goToStep(n) {
    state.step = n;
    steps.forEach((el, i) => {
      const stepNum = i + 1;
      el.classList.toggle('is-active', stepNum === n);
      el.classList.toggle('is-done', stepNum < n);
    });
    panels.forEach((el) => { el.hidden = Number(el.dataset.step) !== n; });
    widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---- Schritt 1: Zimmerwahl ---------------------------------------------- */
  const roomList = widget.querySelector('.room-select-list');
  if (roomList) {
    roomList.querySelectorAll('.room-select').forEach((el) => {
      el.addEventListener('click', () => {
        state.roomId = el.dataset.roomId;
        roomList.querySelectorAll('.room-select').forEach((x) => x.classList.remove('is-selected'));
        el.classList.add('is-selected');
        el.querySelector('input[type="radio"]').checked = true;
        widget.querySelector('[data-next="1"]').disabled = false;
      });
    });
  }

  /* ---- Schritt 2: Kalender -------------------------------------------------- */
  const calGrid = widget.querySelector('.mini-cal__grid');
  const calMonthLabel = widget.querySelector('.mini-cal__month');
  const calDatesSummary = widget.querySelector('[data-cal-summary]');

  function renderCalendar() {
    if (!calGrid) return;
    const year = state.calMonth.getFullYear();
    const month = state.calMonth.getMonth();
    calMonthLabel.textContent = state.calMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

    const dows = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    let html = dows.map((d) => `<div class="mini-cal__dow">${d}</div>`).join('');

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Montag = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startOffset; i++) html += `<div class="mini-cal__day is-empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const past = date < today;
      const blocked = !past && isBlocked(date);
      const inRange = state.checkIn && state.checkOut && date > state.checkIn && date < state.checkOut;
      const isSelected = (state.checkIn && date.getTime() === state.checkIn.getTime()) ||
                          (state.checkOut && date.getTime() === state.checkOut.getTime());
      const classes = ['mini-cal__day'];
      if (blocked || past) classes.push('is-blocked');
      if (inRange) classes.push('is-in-range');
      if (isSelected) classes.push('is-selected');
      html += `<button type="button" class="${classes.join(' ')}" ${blocked || past ? 'disabled' : ''} data-date="${date.toISOString()}">${d}</button>`;
    }
    calGrid.innerHTML = html;

    calGrid.querySelectorAll('button[data-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const date = new Date(btn.dataset.date);
        if (!state.checkIn || (state.checkIn && state.checkOut)) {
          state.checkIn = date;
          state.checkOut = null;
        } else if (date > state.checkIn) {
          state.checkOut = date;
        } else {
          state.checkIn = date;
          state.checkOut = null;
        }
        renderCalendar();
        updateCalSummary();
      });
    });
  }

  function updateCalSummary() {
    if (!calDatesSummary) return;
    const n = nights();
    calDatesSummary.textContent = state.checkIn && state.checkOut
      ? `${fmtDate(state.checkIn)} – ${fmtDate(state.checkOut)} · ${n} ${n === 1 ? 'Nacht' : 'Nächte'}`
      : state.checkIn
        ? `Anreise ${fmtDate(state.checkIn)} – bitte Abreise wählen`
        : 'Bitte Anreise- und Abreisedatum wählen';
    const nextBtn = widget.querySelector('[data-next="2"]');
    if (nextBtn) nextBtn.disabled = !(state.checkIn && state.checkOut && n > 0);
  }

  widget.querySelector('[data-cal-prev]')?.addEventListener('click', () => {
    state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  widget.querySelector('[data-cal-next]')?.addEventListener('click', () => {
    state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  const guestsInput = widget.querySelector('[name="guests"]');
  guestsInput?.addEventListener('change', () => { state.guests = Number(guestsInput.value) || 1; });
  const breakfastInput = widget.querySelector('[name="breakfast"]');
  breakfastInput?.addEventListener('change', () => { state.breakfast = breakfastInput.checked; });

  renderCalendar();
  updateCalSummary();

  /* ---- Navigation zwischen Schritten --------------------------------------- */
  const form = widget.querySelector('#booking-form');

  widget.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('disabled')) return;
      const next = Number(btn.dataset.next) + 1;
      // Pflichtfelder validieren, SOLANGE das Formular noch sichtbar ist —
      // ein natives required-Feld in einem bereits [hidden] Panel kann der
      // Browser nicht fokussieren, die Fehlermeldung würde sonst lautlos verschluckt.
      if (next === 4 && form && !form.reportValidity()) return;
      if (next === 4) renderSummary();
      goToStep(next);
    });
  });
  widget.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.back)));
  });

  /* ---- Schritt 4: Zusammenfassung + Absenden ------------------------------- */
  function renderSummary() {
    const r = room();
    const box = widget.querySelector('[data-summary-box]');
    if (!box || !r) return;
    box.innerHTML = `
      <dl>
        <dt>Zimmer</dt><dd>${r.name}</dd>
        <dt>Zeitraum</dt><dd>${fmtDate(state.checkIn)} – ${fmtDate(state.checkOut)} (${nights()} Nächte)</dd>
        <dt>Gäste</dt><dd>${state.guests}</dd>
        <dt>Frühstück</dt><dd>${state.breakfast ? `Ja (+${BREAKFAST_PRICE.toFixed(2)} €/Person/Nacht)` : 'Nein'}</dd>
        <dt class="total">Voraussichtlicher Preis</dt><dd class="total">${total().toFixed(2)} €</dd>
      </dl>
    `;
  }

  const statusEl = widget.querySelector('.form-status');
  const ENDPOINT = 'https://contact-form-roessle-urbach.workers.dev'; // Demo-Endpunkt, siehe README des Worker-Ordners

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Der Submit-Button steht in Schritt 4, außerhalb des <form> (verknüpft
    // per form="booking-form"), daher document-weite Suche statt form.querySelector.
    const submitBtn = document.querySelector('button[type="submit"][form="booking-form"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet …';

    const fd = new FormData(form);
    const payload = {
      type: 'Zimmer-Buchungsanfrage (Demo)',
      zimmer: room()?.name || '',
      anreise: fmtDate(state.checkIn),
      abreise: fmtDate(state.checkOut),
      naechte: String(nights()),
      gaeste: String(state.guests),
      fruehstueck: state.breakfast ? 'Ja' : 'Nein',
      voraussichtlicher_preis: `${total().toFixed(2)} €`,
      name: fd.get('name') || '',
      email: fd.get('email') || '',
      telefon: fd.get('telefon') || '',
      nachricht: fd.get('nachricht') || '',
      website: fd.get('website') || '', // honeypot
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('request failed');
      goToStep(5);
    } catch {
      statusEl.hidden = false;
      statusEl.dataset.state = 'error';
      statusEl.textContent = 'Die Anfrage konnte gerade nicht gesendet werden. Bitte rufen Sie uns alternativ unter 07181 72751 an.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Anfrage unverbindlich senden';
    }
  });
})();
