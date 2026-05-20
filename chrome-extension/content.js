function parseTime24ToHours(str) {
  const match = str.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1]) + parseInt(match[2]) / 60;
}

function hoursToTime(h) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.startH - b.startH);
  const merged = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].startH <= last.endH) {
      last.endH = Math.max(last.endH, sorted[i].endH);
    } else {
      merged.push({ ...sorted[i] });
    }
  }
  return merged;
}

function scrapeAllEvents() {
  const events = [];
  const seen = new Set();

  document.querySelectorAll('[data-eventid]').forEach(el => {
    const labelEl = el.querySelector('.XuJrye');
    if (!labelEl) return;

    const text = labelEl.textContent.trim();
    if (seen.has(text)) return;

    const match = text.match(/^(\d{1,2}:\d{2})\s+to\s+(\d{1,2}:\d{2}),\s*([^,]+)(?:.*,\s*(\d{1,2}\s+\w+\s+\d{4}))?/);
    if (!match) return;

    seen.add(text);

    const startH = parseTime24ToHours(match[1]);
    const endH = parseTime24ToHours(match[2]);
    if (startH === null || endH === null) return;

    const date = match[4] ? new Date(match[4]) : null;
    const day = date ? date.toLocaleDateString('en-GB', { weekday: 'long' }) : null;

    events.push({ title: match[3].trim(), startH, endH, start: match[1], end: match[2], day });
  });

  return events;
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

function computeAvailability(allEvents, monday) {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const result = {};
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const currentHours = now.getHours() + now.getMinutes() / 60;

  dayNames.forEach((day, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(dayDate.getDate() + idx);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate < today) {
      result[day] = { skip: true, slots: [] };
      return;
    }

    const isToday = dayDate.getTime() === today.getTime();
    const baseStart = day === 'Tuesday' ? 10 : 8.5;
    const dayStart = isToday ? Math.max(baseStart, currentHours) : baseStart;
    const dayEnd = 17;

    const meetings = mergeIntervals(
      allEvents
        .filter(e => e.day === day && !/^work/i.test(e.title))
        .map(e => ({ startH: e.startH, endH: e.endH }))
    ).filter(m => m.endH > dayStart && m.startH < dayEnd)
     .sort((a, b) => a.startH - b.startH);

    const freeSlots = [];
    let cursor = dayStart;

    meetings.forEach(meeting => {
      const meetStart = Math.max(meeting.startH, dayStart);
      const meetEnd = Math.min(meeting.endH, dayEnd);
      if (meetStart - cursor >= 0.5) {
        freeSlots.push({ startH: cursor, endH: meetStart });
      }
      cursor = Math.max(cursor, meetEnd);
    });

    if (dayEnd - cursor >= 0.5) {
      freeSlots.push({ startH: cursor, endH: dayEnd });
    }

    result[day] = { skip: false, slots: freeSlots };
  });

  return result;
}

function showAvailabilityOverlay(monday) {
  const existing = document.getElementById('avail-overlay');
  if (existing) {
    existing.remove();
    return;
  }

  const allEvents = scrapeAllEvents();
  const availability = computeAvailability(allEvents, monday);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const mondayStr = monday.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  function daySlotText(day) {
    const { slots } = availability[day];
    if (!slots.length) return 'No free time';
    return slots.map(s => `${hoursToTime(s.startH)} - ${hoursToTime(s.endH)}`).join(', ');
  }

  const activeDays = dayNames.filter(day => !availability[day].skip);

  const rows = activeDays.map(day => {
    const text = daySlotText(day);
    const isNone = text === 'No free time';
    return `<li class="avail-row"><strong>${day}</strong> - <span class="${isNone ? 'avail-none' : ''}">${text}</span></li>`;
  }).join('');

  const copyText = `My availability for w/c ${mondayStr}:\n\n` +
    activeDays.map(day => `${day} - ${daySlotText(day)}`).join('\n');

  const overlay = document.createElement('div');
  overlay.id = 'avail-overlay';
  overlay.innerHTML = `
    <div id="avail-dialog">
      <button id="avail-close" aria-label="Close">✕</button>
      <p id="avail-title">My availability for w/c ${mondayStr}:</p>
      <ul id="avail-list">${rows}</ul>
      <button id="avail-copy">Copy</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('avail-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(copyText).then(() => {
      const btn = document.getElementById('avail-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
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
    if (e.target === overlay || e.target.id === 'avail-close') closeOverlay();
  });

  document.addEventListener('keydown', keyHandler);
}

function injectButton() {
  if (!window.location.pathname.includes('/week')) {
    document.getElementById('wcm-btn')?.remove();
    document.getElementById('avail-btn')?.remove();
    return;
  }

  if (document.getElementById('wcm-btn') && document.getElementById('avail-btn')) return;

  const anchor = document.querySelector('[jscontroller="qoxFud"]');
  if (!anchor) {
    console.warn('[wcm] Anchor element not found — Google Calendar UI may have changed.');
    return;
  }

  // Insert availability button first, then count button — insertBefore(x, anchor.nextSibling)
  // places each at the front, so the last inserted ends up leftmost.
  // Result order: anchor → wcm-btn → avail-btn
  if (!document.getElementById('avail-btn')) {
    const availBtn = document.createElement('button');
    availBtn.id = 'avail-btn';
    availBtn.title = 'Show availability for this week';

    const availImg = document.createElement('img');
    availImg.src = chrome.runtime.getURL('icons/availability_icon128.png');
    availImg.alt = 'Availability';
    availImg.width = 32;
    availImg.height = 32;
    availBtn.appendChild(availImg);

    availBtn.addEventListener('click', () => {
      const monday = getMondayOfWeek(getDateFromUrl());
      showAvailabilityOverlay(monday);
    });

    anchor.parentNode.insertBefore(availBtn, anchor.nextSibling);
  }

  if (!document.getElementById('wcm-btn')) {
    const btn = document.createElement('button');
    btn.id = 'wcm-btn';
    btn.title = 'Show work hours for this week';

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/count_icon48.png');
    img.alt = 'Week';
    img.width = 24;
    img.height = 24;
    btn.appendChild(img);

    btn.addEventListener('click', () => {
      const monday = getMondayOfWeek(getDateFromUrl());
      showOverlay(monday);
    });

    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }
}

let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(injectButton, 300);
});
observer.observe(document.body, { childList: true, subtree: true });

injectButton();
