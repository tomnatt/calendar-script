function parseTime24ToHours(str) {
  const match = str.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1]) + parseInt(match[2]) / 60;
}

function scrapeWorkMeetings() {
  const events = [];
  const seen = new Set();

  document.querySelectorAll('[data-eventid]').forEach(el => {
    const labelEl = el.querySelector('.XuJrye');
    if (!labelEl) return;

    const text = labelEl.textContent.trim();
    if (seen.has(text)) return;

    // Format: "13:45 to 17:15, Work, ..."
    const match = text.match(/^(\d{1,2}:\d{2})\s+to\s+(\d{1,2}:\d{2}),\s*([^,]+)/);
    if (!match) return;
    if (!/^work$/i.test(match[3].trim())) return;

    seen.add(text);

    const startH = parseTime24ToHours(match[1]);
    const endH = parseTime24ToHours(match[2]);
    if (startH === null || endH === null) return;

    events.push({
      start: match[1],
      end: match[2],
      duration: endH - startH
    });
  });

  return events;
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getDateFromUrl() {
  const match = window.location.pathname.match(/\/week\/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }
  return new Date();
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function showOverlay(monday) {
  const existing = document.getElementById('wcm-overlay');
  if (existing) {
    existing.remove();
    return;
  }

  const meetings = scrapeWorkMeetings();
  const total = meetings.reduce((sum, e) => sum + e.duration, 0);

  const rows = meetings.length
    ? meetings.map(e =>
        `<li class="wcm-event"><span class="wcm-time">${e.start} – ${e.end}</span><span class="wcm-hours">${e.duration % 1 === 0 ? e.duration : e.duration.toFixed(1)}h</span></li>`
      ).join('')
    : '<li class="wcm-empty">No "Work" events found in view</li>';

  const totalLine = meetings.length
    ? `<p id="wcm-total">Total: <strong>${total % 1 === 0 ? total : total.toFixed(1)} hours</strong></p>`
    : '';

  const overlay = document.createElement('div');
  overlay.id = 'wcm-overlay';
  overlay.innerHTML = `
    <div id="wcm-dialog">
      <button id="wcm-close" aria-label="Close">✕</button>
      <p id="wcm-label">Week commencing</p>
      <p id="wcm-date">${formatDate(monday)}</p>
      <ul id="wcm-events">${rows}</ul>
      ${totalLine}
    </div>
  `;

  document.body.appendChild(overlay);

  function closeOverlay() {
    overlay.remove();
    document.removeEventListener('keydown', keyHandler);
  }

  function keyHandler(e) {
    if (!overlay.isConnected) {
      document.removeEventListener('keydown', keyHandler);
      return;
    }
    if (e.key === 'Escape') closeOverlay();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.id === 'wcm-close') closeOverlay();
  });

  document.addEventListener('keydown', keyHandler);
}

function injectButton() {
  if (!window.location.pathname.includes('/week')) {
    document.getElementById('wcm-btn')?.remove();
    return;
  }

  if (document.getElementById('wcm-btn')) return;

  const anchor = document.querySelector('[jscontroller="qoxFud"]');
  if (!anchor) {
    console.warn('[wcm] Anchor element not found — Google Calendar UI may have changed.');
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'wcm-btn';
  btn.title = 'Show Monday of current week';

  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('icons/icon16.png');
  img.alt = 'Week';
  img.width = 16;
  img.height = 16;
  btn.appendChild(img);

  btn.addEventListener('click', () => {
    const monday = getMondayOfWeek(getDateFromUrl());
    showOverlay(monday);
  });

  anchor.parentNode.insertBefore(btn, anchor.nextSibling);
}

let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(injectButton, 300);
});
observer.observe(document.body, { childList: true, subtree: true });

injectButton();
