// ===========================
// admin.js — Admin Panel
// ===========================

import { auth, db }                            from './firebase.js';
import { onAuthStateChanged, signOut }         from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  collection, getDocs, doc, deleteDoc,
  setDoc, updateDoc, query, orderBy,
  getCountFromServer, limit, startAfter
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ADMIN_EMAIL, logout }                 from './auth.js';
import { addVideo, deleteVideo, fetchAllVideos, getVideoCount } from './videos.js';
import { fetchTags, addTag, removeTag, getTagCount }            from './tags.js';
import { show, hide, showToast, escapeHtml, flashMsg }          from './ui.js';

const $ = id => document.getElementById(id);

// ==============================
// AUTH GUARD
// ==============================
onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== ADMIN_EMAIL) {
    show($('access-denied'));
    hide($('admin-panel'));
  } else {
    hide($('access-denied'));
    show($('admin-panel'));
    initAdmin(user);
  }
});

$('admin-logout-btn')?.addEventListener('click', async () => {
  await logout();
  window.location.href = 'index.html';
});

// ==============================
// INIT
// ==============================
async function initAdmin(user) {
  loadStats();
  loadTagsUI();
  loadVideosUI();
  loadUsersUI();
  setupAddVideo();
  setupAddTag();
  setupVideoSearch();
}

// ==============================
// STATS
// ==============================
async function loadStats() {
  try {
    const [videoCount, tagCount] = await Promise.all([
      getVideoCount(),
      getTagCount()
    ]);

    $('stat-videos').textContent = videoCount;
    $('stat-tags').textContent   = tagCount;

    // User count
    const usersSnap = await getCountFromServer(collection(db, 'users'));
    $('stat-users').textContent  = usersSnap.data().count;

    // Total views
    const videosSnap = await getDocs(collection(db, 'videos'));
    let totalViews = 0;
    videosSnap.forEach(d => { totalViews += (d.data().views || 0); });
    $('stat-views').textContent = totalViews;
  } catch (e) {
    console.error('loadStats error:', e);
  }
}

// ==============================
// TAGS
// ==============================
async function loadTagsUI() {
  const container = $('tag-management-list');
  container.innerHTML = '<div class="spinner"></div>';

  try {
    const tags = await fetchTags();
    renderTagsAdmin(tags, container);
    populateAdminTagSelect(tags);
  } catch (e) {
    container.innerHTML = '<p style="color:#e50914;font-size:.85rem;">Error loading tags.</p>';
  }
}

function renderTagsAdmin(tags, container) {
  container.innerHTML = '';
  if (!tags.length) {
    container.innerHTML = '<p style="color:rgba(240,240,240,.4);font-size:.85rem;">No tags yet.</p>';
    return;
  }
  tags.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'tag-manage-chip';
    chip.innerHTML = `<span>${escapeHtml(tag)}</span><button title="Remove tag">✕</button>`;
    chip.querySelector('button').addEventListener('click', async () => {
      try {
        await removeTag(tag);
        loadTagsUI();
        showToast(`Tag "${tag}" removed`, 'info');
      } catch (e) {
        showToast('Error: ' + e.message, 'error');
      }
    });
    container.appendChild(chip);
  });
}

function populateAdminTagSelect(tags) {
  const container = $('admin-tag-select');
  if (!container) return;
  container.innerHTML = '';
  tags.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'admin-tag-checkbox';
    chip.textContent = tag;
    chip.dataset.tag = tag;
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
    container.appendChild(chip);
  });
}

function setupAddTag() {
  $('add-tag-btn')?.addEventListener('click', async () => {
    const input = $('new-tag-input');
    const val   = input.value.trim();
    if (!val) return;
    try {
      await addTag(val);
      input.value = '';
      loadTagsUI();
      showToast(`Tag "${val.toUpperCase()}" added ✓`, 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  });
}

// ==============================
// ADD VIDEO
// ==============================
function setupAddVideo() {
  let fetchedMeta = null;

  $('fetch-meta-btn')?.addEventListener('click', async () => {
    const urlVal = $('video-url-input').value.trim();
    if (!urlVal) { showToast('Please enter a URL', 'error'); return; }

    $('fetch-meta-btn').textContent = 'Fetching…';
    $('fetch-meta-btn').disabled = true;

    try {
      // Use Microlink API for metadata
      const apiUrl  = `https://api.microlink.io/?url=${encodeURIComponent(urlVal)}`;
      const resp    = await fetch(apiUrl);
      const data    = await resp.json();

      if (data.status === 'success') {
        fetchedMeta = {
          url:       urlVal,
          title:     data.data.title     || '',
          thumbnail: data.data.image?.url || data.data.screenshot?.url || ''
        };
      } else {
        fetchedMeta = { url: urlVal, title: '', thumbnail: '' };
      }

      $('meta-title').value     = fetchedMeta.title;
      $('meta-thumb').src       = fetchedMeta.thumbnail;
      show($('meta-preview'));

    } catch (e) {
      fetchedMeta = { url: urlVal, title: '', thumbnail: '' };
      $('meta-title').value = '';
      show($('meta-preview'));
    } finally {
      $('fetch-meta-btn').textContent = 'Fetch Metadata';
      $('fetch-meta-btn').disabled    = false;
    }
  });

  $('add-video-btn')?.addEventListener('click', async () => {
    if (!fetchedMeta) { showToast('Fetch metadata first', 'error'); return; }

    const title     = $('meta-title').value.trim()     || fetchedMeta.title || 'Untitled';
    const thumbnail = $('meta-thumb').src              || fetchedMeta.thumbnail;
    const hashtags  = $('meta-hashtags').value.trim();

    // Get selected tags
    const selectedTags = Array.from($('admin-tag-select').querySelectorAll('.selected'))
      .map(el => el.dataset.tag);

    const msgEl = $('add-video-msg');

    try {
      $('add-video-btn').textContent = 'Adding…';
      $('add-video-btn').disabled    = true;

      await addVideo({
        url:       fetchedMeta.url,
        title,
        thumbnail,
        hashtags,
        tags: selectedTags
      });

      flashMsg(msgEl, '✓ Video added successfully!', 'success');
      hide($('meta-preview'));
      $('video-url-input').value = '';
      fetchedMeta = null;
      loadStats();
      loadVideosUI();

    } catch (e) {
      flashMsg(msgEl, 'Error: ' + e.message, 'error');
    } finally {
      $('add-video-btn').textContent = 'Add Video';
      $('add-video-btn').disabled    = false;
    }
  });
}

// ==============================
// VIDEOS LIST
// ==============================
let adminVideoLastDoc = null;

async function loadVideosUI(reset = true) {
  const listEl = $('admin-video-list');
  if (reset) {
    listEl.innerHTML = '<div class="spinner"></div>';
    adminVideoLastDoc = null;
  }

  try {
    const { videos, lastVisible } = await fetchAllVideos({ lastDoc: adminVideoLastDoc });
    adminVideoLastDoc = lastVisible;

    listEl.innerHTML = '';

    if (!videos.length) {
      listEl.innerHTML = '<p style="color:rgba(240,240,240,.4);font-size:.85rem;">No videos yet.</p>';
      return;
    }

    videos.forEach(v => {
      const item = document.createElement('div');
      item.className = 'admin-video-item';
      item.innerHTML = `
        ${v.thumbnail
          ? `<img class="admin-video-thumb" src="${escapeHtml(v.thumbnail)}" alt="" loading="lazy" />`
          : `<div class="admin-video-thumb" style="background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🎬</div>`
        }
        <div class="admin-video-info">
          <div class="admin-video-title">${escapeHtml(v.title || 'Untitled')}</div>
          <div class="admin-video-url">${escapeHtml(v.url || '')}</div>
        </div>
        <div class="admin-video-views">👁 ${v.views || 0}</div>
        <button class="admin-video-delete">Delete</button>
      `;

      item.querySelector('.admin-video-delete').addEventListener('click', async () => {
        if (!confirm(`Delete "${v.title}"?`)) return;
        try {
          await deleteVideo(v.id);
          item.remove();
          loadStats();
          showToast('Video deleted', 'info');
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
        }
      });

      listEl.appendChild(item);
    });
  } catch (e) {
    listEl.innerHTML = `<p style="color:#e50914;font-size:.85rem;">Error: ${e.message}</p>`;
  }
}

function setupVideoSearch() {
  let debounce = null;
  $('admin-video-search')?.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => filterAdminVideos(e.target.value.trim()), 300);
  });
}

function filterAdminVideos(query) {
  const items = $('admin-video-list').querySelectorAll('.admin-video-item');
  const q = query.toLowerCase();
  items.forEach(item => {
    const title = item.querySelector('.admin-video-title')?.textContent.toLowerCase() || '';
    item.style.display = !q || title.includes(q) ? '' : 'none';
  });
}

// ==============================
// USERS LIST
// ==============================
async function loadUsersUI() {
  const listEl = $('admin-user-list');
  listEl.innerHTML = '<div class="spinner"></div>';

  try {
    const usersSnap   = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)));
    const bannedSnap  = await getDocs(collection(db, 'banned_users'));
    const bannedIds   = new Set(bannedSnap.docs.map(d => d.id));

    listEl.innerHTML = '';

    if (!usersSnap.docs.length) {
      listEl.innerHTML = '<p style="color:rgba(240,240,240,.4);font-size:.85rem;">No users yet.</p>';
      return;
    }

    usersSnap.docs.forEach(d => {
      const u      = d.data();
      const isBan  = bannedIds.has(d.id);

      const item = document.createElement('div');
      item.className = 'admin-user-item';
      item.innerHTML = `
        <div class="admin-user-avatar">${u.avatar || '😊'}</div>
        <div class="admin-user-info">
          <div class="admin-user-name">${escapeHtml(u.username || 'Unknown')}</div>
          <div class="admin-user-email">${escapeHtml(u.email || '')}</div>
        </div>
        ${isBan ? '<span class="admin-user-banned">BANNED</span>' : ''}
        ${u.email !== ADMIN_EMAIL
          ? isBan
            ? `<button class="admin-user-unban-btn" data-uid="${d.id}">Unban</button>`
            : `<button class="admin-user-ban-btn" data-uid="${d.id}">Ban</button>`
          : '<span style="font-size:.75rem;color:var(--brand-gold)">ADMIN</span>'
        }
      `;

      // Ban
      item.querySelector('.admin-user-ban-btn')?.addEventListener('click', async () => {
        if (!confirm(`Ban user "${u.username}"?`)) return;
        try {
          await setDoc(doc(db, 'banned_users', d.id), {
            uid:      d.id,
            email:    u.email,
            bannedAt: new Date()
          });
          loadUsersUI();
          showToast(`User "${u.username}" banned`, 'info');
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
        }
      });

      // Unban
      item.querySelector('.admin-user-unban-btn')?.addEventListener('click', async () => {
        try {
          await deleteDoc(doc(db, 'banned_users', d.id));
          loadUsersUI();
          showToast(`User "${u.username}" unbanned`, 'success');
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
        }
      });

      listEl.appendChild(item);
    });
  } catch (e) {
    listEl.innerHTML = `<p style="color:#e50914;font-size:.85rem;">Error: ${e.message}</p>`;
  }
}
