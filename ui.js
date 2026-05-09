// ===========================
// ui.js — UI Utilities
// ===========================

// ---- Show/hide element ----
export function show(el) { if (el) el.style.display = ''; }
export function hide(el) { if (el) el.style.display = 'none'; }

// ---- Flash message ----
export function flashMsg(el, msg, type = 'success') {
  if (!el) return;
  el.textContent = msg;
  el.className   = `admin-msg ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'admin-msg'; }, 3500);
}

// ---- Create video card element ----
export function createVideoCard(video, onClick) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.setAttribute('data-id', video.id);

  const views = video.views || 0;

  card.innerHTML = `
    ${video.thumbnail
      ? `<img class="video-thumb" src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" loading="lazy" />`
      : `<div class="video-thumb-placeholder">🎬</div>`
    }
    <div class="video-meta">
      <p class="video-title">${escapeHtml(video.title || 'Untitled')}</p>
      <p class="video-views">${formatViews(views)} views</p>
    </div>
  `;

  card.addEventListener('click', () => onClick(video));

  // Lazy load image fallback
  const img = card.querySelector('.video-thumb');
  if (img) {
    img.classList.add('img-loading');
    img.addEventListener('load', () => img.classList.remove('img-loading'));
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const ph = document.createElement('div');
      ph.className = 'video-thumb-placeholder';
      ph.textContent = '🎬';
      img.parentElement.insertBefore(ph, img);
    });
  }

  return card;
}

// ---- Format view count ----
export function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return String(n);
}

// ---- Escape HTML ----
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Format timestamp ----
export function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---- Toast notification ----
let toastTimeout = null;
export function showToast(msg, type = 'info') {
  let toast = document.getElementById('cp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cp-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(15,15,22,0.95);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 0.85rem;
      font-family: var(--font-body);
      color: #f0f0f0;
      z-index: 500;
      opacity: 0;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  if (type === 'error') toast.style.borderColor = 'rgba(229,9,20,0.5)';
  else if (type === 'success') toast.style.borderColor = 'rgba(76,209,55,0.5)';
  else toast.style.borderColor = 'rgba(255,255,255,0.18)';

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}
