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

    // Format: "13:45 to 17:15, Work, Tom Natt, No location, 24 March 2026"
    const match = text.match(/^(\d{1,2}:\d{2})\s+to\s+(\d{1,2}:\d{2}),\s*([^,]+)(?:.*,\s*(\d{1,2}\s+\w+\s+\d{4}))?/);
    if (!match) return;
    const titleTrimmed = match[3].trim();
    let project;
    if (/^work$/i.test(titleTrimmed) || /^work\s*-\s*pol$/i.test(titleTrimmed)) {
      project = 'POL';
    } else if (/^work\s*-\s*dbt$/i.test(titleTrimmed)) {
      project = 'DBT';
    } else {
      return;
    }

    seen.add(text);

    const startH = parseTime24ToHours(match[1]);
    const endH = parseTime24ToHours(match[2]);
    if (startH === null || endH === null) return;

    const date = match[4] ? new Date(match[4]) : null;
    const day = date ? date.toLocaleDateString('en-GB', { weekday: 'long' }) : 'Unknown';
    const dayOrder = date ? date.getDay() : 99;

    events.push({
      start: match[1],
      end: match[2],
      duration: endH - startH,
      day,
      dayOrder,
      project
    });
  });

  events.sort((a, b) => a.dayOrder - b.dayOrder || a.start.localeCompare(b.start));
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

  function fmtH(h) { return `${h % 1 === 0 ? h : h.toFixed(2)}h`; }
  function fmtSheet(h) {
    if (h === 0) return '0';
    if (h % 1 === 0) return String(h);
    return parseFloat(h.toFixed(2)).toString();
  }

  function buildColumn(project) {
    const events = meetings.filter(e => e.project === project);
    if (!events.length) {
      return `<div class="wcm-column">
        <h3 class="wcm-col-header">${project}</h3>
        <ul class="wcm-col-events"><li class="wcm-empty">No events</li></ul>
        <p class="wcm-col-total">Total: <strong>0h</strong></p>
      </div>`;
    }

    const byDay = [];
    events.forEach(e => {
      let group = byDay.find(g => g.day === e.day);
      if (!group) { group = { day: e.day, events: [], subtotal: 0 }; byDay.push(group); }
      group.events.push(e);
      group.subtotal += e.duration;
    });

    const rows = byDay.map(g => `
      <li class="wcm-day-header">
        <span>${g.day}</span><span class="wcm-hours">${fmtH(g.subtotal)}</span>
      </li>
      ${g.events.map(e =>
        `<li class="wcm-event"><span class="wcm-time">${e.start} – ${e.end}</span><span class="wcm-hours">${fmtH(e.duration)}</span></li>`
      ).join('')}
    `).join('');

    const total = events.reduce((sum, e) => sum + e.duration, 0);
    return `<div class="wcm-column">
      <h3 class="wcm-col-header">${project}</h3>
      <ul class="wcm-col-events">${rows}</ul>
      <p class="wcm-col-total">Total: <strong>${fmtH(total)}</strong></p>
    </div>`;
  }

  const grandTotal = meetings.reduce((sum, e) => sum + e.duration, 0);
  const grandTotalLine = meetings.length
    ? `<p id="wcm-total">Combined total: <strong>${fmtH(grandTotal)}</strong></p>`
    : '';

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  function buildSheetColumn(project) {
    const byDay = {};
    meetings.filter(e => e.project === project).forEach(e => {
      byDay[e.day] = (byDay[e.day] || 0) + e.duration;
    });
    const values = dayNames.map(d => fmtSheet(byDay[d] || 0)).join('\n');
    return `<div class="wcm-sheet-col">
      <p class="wcm-sheet-proj">${project}</p>
      <pre class="wcm-sheet-pre" id="wcm-sheet-${project}">${values}</pre>
      <button class="wcm-sheet-copy" data-target="wcm-sheet-${project}">Copy</button>
    </div>`;
  }

  const overlay = document.createElement('div');
  overlay.id = 'wcm-overlay';
  overlay.innerHTML = `
    <div id="wcm-dialog">
      <button id="wcm-close" aria-label="Close">✕</button>
      <p id="wcm-label">Week commencing</p>
      <p id="wcm-date">${formatDate(monday)}</p>
      <div id="wcm-columns">
        ${buildColumn('POL')}
        ${buildColumn('DBT')}
      </div>
      ${grandTotalLine}
      <div id="wcm-sheet">
        <p id="wcm-sheet-label">Spreadsheet</p>
        <div id="wcm-sheet-cols">
          ${buildSheetColumn('POL')}
          ${buildSheetColumn('DBT')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('.wcm-sheet-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = document.getElementById(btn.dataset.target);
      navigator.clipboard.writeText(pre.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });

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
