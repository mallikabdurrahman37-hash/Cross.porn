// ===========================
// profile.js — Profile Page
// ===========================

import { auth, db }                   from './firebase.js';
import { onAuthStateChanged }         from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, updateDoc }     from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { logout }                     from './auth.js';
import { fetchHistory, deleteHistoryItem, clearHistory } from './history.js';
import { formatDate, show, hide, showToast }             from './ui.js';

const $ = id => document.getElementById(id);

const EMOJIS = ['😊','😎','🤩','🦁','🐯','🦊','🐺','🦅','🐉','👑','🔥','⚡','🌙','💎','🎭'];

// ---- Auth check ----
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    show($('profile-login-prompt'));
    hide($('profile-content'));
    return;
  }

  hide($('profile-login-prompt'));
  show($('profile-content'));

  const profile = await loadProfile(user);
  renderHistory(user.uid);
  setupUI(user, profile);
});

// ---- Load profile ----
async function loadProfile(user) {
  try {
    const snap    = await getDoc(doc(db, 'users', user.uid));
    const profile = snap.exists() ? snap.data() : {};

    $('profile-email').textContent    = user.email;
    $('profile-username').value       = profile.username || '';
    $('profile-avatar-display').textContent = profile.avatar || '😊';

    return profile;
  } catch (e) {
    console.error('loadProfile error:', e);
    return {};
  }
}

// ---- Render history ----
async function renderHistory(uid) {
  const list    = $('history-list');
  const history = await fetchHistory(uid);

  if (!history.length) {
    list.innerHTML = '<p class="empty-msg">No watch history yet.</p>';
    return;
  }

  list.innerHTML = '';
  history.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.dataset.id = item.videoId;

    el.innerHTML = `
      ${item.thumbnail
        ? `<img class="history-thumb" src="${item.thumbnail}" alt="${item.title}" loading="lazy" />`
        : `<div class="history-thumb" style="background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🎬</div>`
      }
      <div class="history-info">
        <div class="history-title">${item.title || 'Untitled'}</div>
        <div class="history-date">${item.watchedAt ? formatDate(item.watchedAt) : ''}</div>
      </div>
      <button class="history-delete" title="Remove">✕</button>
    `;

    // Open on click
    el.querySelector('.history-info').addEventListener('click', () => {
      if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
    });

    // Delete
    el.querySelector('.history-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteHistoryItem(uid, item.videoId);
      el.remove();
      if (!list.children.length) {
        list.innerHTML = '<p class="empty-msg">No watch history yet.</p>';
      }
      showToast('Removed from history', 'info');
    });

    list.appendChild(el);
  });
}

// ---- Setup UI interactions ----
function setupUI(user, profile) {
  // Save username
  $('save-username-btn').addEventListener('click', async () => {
    const username = $('profile-username').value.trim();
    if (!username) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { username });
      $('profile-save-msg').textContent = '✓ Username saved';
      setTimeout(() => $('profile-save-msg').textContent = '', 2500);
      showToast('Username updated ✓', 'success');
    } catch (e) {
      showToast('Error saving: ' + e.message, 'error');
    }
  });

  // Avatar emoji picker
  const avatarDisplay = $('profile-avatar-display');
  const emojiPicker   = $('emoji-picker');
  const emojiGrid     = emojiPicker.querySelector('.emoji-grid');

  // Populate emoji grid
  emojiGrid.innerHTML = EMOJIS.map(e => `<span data-emoji="${e}">${e}</span>`).join('');
  hide(emojiPicker);

  $('change-avatar-btn').addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
  });

  emojiGrid.addEventListener('click', async (e) => {
    const emoji = e.target.dataset.emoji;
    if (!emoji) return;
    avatarDisplay.textContent = emoji;
    hide(emojiPicker);
    try {
      await updateDoc(doc(db, 'users', user.uid), { avatar: emoji });
      showToast('Avatar updated ✓', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  // Close emoji picker on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-avatar-area')) hide(emojiPicker);
  });

  // Clear history
  $('clear-history-btn').addEventListener('click', async () => {
    if (!confirm('Clear all watch history?')) return;
    await clearHistory(user.uid);
    $('history-list').innerHTML = '<p class="empty-msg">No watch history yet.</p>';
    showToast('History cleared', 'info');
  });

  // Logout
  $('logout-btn')?.addEventListener('click', async () => {
    await logout();
    window.location.href = 'index.html';
  });
}
