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

  const overlay = document.createElement('div');
  overlay.id = 'wcm-overlay';
  overlay.innerHTML = `
    <div id="wcm-dialog">
      <button id="wcm-close" aria-label="Close">✕</button>
      <p id="wcm-label">Week commencing</p>
      <p id="wcm-date">${formatDate(monday)}</p>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.id === 'wcm-close') {
      overlay.remove();
    }
  });

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handler);
    }
  });
}

function injectButton() {
  if (!window.location.pathname.includes('/week/')) {
    document.getElementById('wcm-btn')?.remove();
    return;
  }

  if (document.getElementById('wcm-btn')) return;

  const anchor = document.querySelector('[jscontroller="qoxFud"]');
  if (!anchor) return;

  const btn = document.createElement('button');
  btn.id = 'wcm-btn';
  btn.textContent = 'Week';
  btn.title = 'Show Monday of current week';

  btn.addEventListener('click', () => {
    const monday = getMondayOfWeek(getDateFromUrl());
    showOverlay(monday);
  });

  anchor.parentNode.insertBefore(btn, anchor.nextSibling);
}

const observer = new MutationObserver(() => injectButton());
observer.observe(document.body, { childList: true, subtree: true });

injectButton();
