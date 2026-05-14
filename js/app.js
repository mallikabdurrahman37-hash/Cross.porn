// ===========================
// app.js — Main Application
// Cross.porn Homepage
// ===========================

import { auth }                             from './firebase.js';
import { onUserChange, login, register, logout, getUserProfile, ADMIN_EMAIL } from './auth.js';
import { fetchVideos, incrementVideoStat }  from './videos.js';
import { fetchTags }                        from './tags.js';
import { saveHistory }                      from './history.js';
import { setupSearch }                      from './search.js';
import { renderPagination }                 from './pagination.js';
import { createVideoCard, show, hide, showToast } from './ui.js';

// ==============================
// STATE
// ==============================
const state = {
  user:        null,
  isAdmin:     false,
  currentTag:  'all',
  searchQuery: '',
  currentPage: 1,
  pageHistory: [null], // pageHistory[i] = startAfter cursor for page i+1
  tags:        [],
};

// ==============================
// DOM REFS
// ==============================
const $ = id => document.getElementById(id);
const splashEl        = $('splash-screen');
const ageGateEl       = $('age-gate');
const appEl           = $('app');
const cookieBar       = $('cookie-bar');
const videoGrid       = $('video-grid');
const noResults       = $('no-results');
const loadingInd      = $('loading-indicator');
const tagBar          = $('tag-bar');
const tagMoreBtn      = $('tag-more-btn');
const paginationWrap  = $('pagination-wrapper');
const paginationEl    = $('pagination');
const searchWrapper   = $('search-wrapper');
const searchInput     = $('search-input');
const authModal       = $('auth-modal');
const sideMenu        = $('side-menu');
const sideOverlay     = $('side-overlay');

// ==============================
// SPLASH
// ==============================
function hideSplash() {
  if (!splashEl) return;
  splashEl.classList.add('fade-out');
  setTimeout(() => splashEl.remove(), 700);
}

// ==============================
// AGE GATE (always shown)
// ==============================
function showAgeGate() {
  show(ageGateEl);

  $('enter-btn').addEventListener('click', () => {
    hide(ageGateEl);
    show(appEl);
    showCookieBar();
    init();
  });

  $('leave-btn').addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
  });
}

// ==============================
// COOKIE BAR
// ==============================
function showCookieBar() {
  if (sessionStorage.getItem('cp_cookie')) return;
  show(cookieBar);
  $('cookie-dismiss').addEventListener('click', () => {
    hide(cookieBar);
    sessionStorage.setItem('cp_cookie', '1');
  });
}

// ==============================
// AUTH UI
// ==============================
function setupAuth() {
  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      hide($('login-form'));
      hide($('register-form'));
      if (tab.dataset.tab === 'login') show($('login-form'));
      else show($('register-form'));
    });
  });

  // Login
  $('login-submit').addEventListener('click', async () => {
    const email    = $('login-email').value.trim();
    const password = $('login-password').value;
    $('login-error').textContent = '';
    try {
      await login({ email, password });
      hide(authModal);
      showToast('Logged in successfully ✓', 'success');
    } catch (e) {
      $('login-error').textContent = e.message;
    }
  });

  // Register
  $('register-submit').addEventListener('click', async () => {
    const username = $('reg-username').value.trim();
    const email    = $('reg-email').value.trim();
    const password = $('reg-password').value;
    const mobile   = $('reg-mobile').value.trim();
    $('register-error').textContent = '';
    try {
      await register({ username, email, password, mobile });
      hide(authModal);
      showToast('Account created! Welcome 🎉', 'success');
    } catch (e) {
      $('register-error').textContent = e.message;
    }
  });

  // Close
  $('auth-close').addEventListener('click', () => hide(authModal));
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) hide(authModal);
  });
}

// ==============================
// SIDE MENU
// ==============================
function setupSideMenu() {
  $('menu-toggle').addEventListener('click', openMenu);
  $('side-close').addEventListener('click', closeMenu);
  sideOverlay.addEventListener('click', closeMenu);

  function openMenu() {
    show(sideMenu);
    show(sideOverlay);
  }
  function closeMenu() {
    hide(sideMenu);
    hide(sideOverlay);
  }

  $('menu-profile-link').addEventListener('click', (e) => {
    if (!state.user) { e.preventDefault(); show(authModal); closeMenu(); }
  });
  $('menu-logout-link').addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
    showToast('Logged out', 'info');
    closeMenu();
  });
}

// ==============================
// PROFILE BUTTON
// ==============================
function setupProfileBtn() {
  $('profile-btn').addEventListener('click', () => {
    if (state.user) window.location.href = 'profile.html';
    else show(authModal);
  });
}

// ==============================
// SEARCH
// ==============================
function setupSearchUI() {
  $('search-toggle').addEventListener('click', () => {
    show(searchWrapper);
    searchInput.focus();
  });

  $('search-close').addEventListener('click', () => {
    hide(searchWrapper);
    searchInput.value = '';
    state.searchQuery = '';
    state.currentPage = 1;
    state.pageHistory = [null];
    loadVideos();
  });

  setupSearch(searchInput, (q) => {
    state.searchQuery = q;
    state.currentPage = 1;
    state.pageHistory = [null];
    loadVideos();
  });
}

// ==============================
// TAGS
// ==============================
async function loadTags() {
  state.tags = await fetchTags();
  renderTags();
}

function renderTags() {
  // Keep first "All" chip
  const existingChips = tagBar.querySelectorAll('.tag-chip:not([data-tag="all"])');
  existingChips.forEach(c => c.remove());

  state.tags.forEach(tag => {
    const chip = document.createElement('button');
    chip.className = 'tag-chip';
    chip.dataset.tag = tag;
    chip.textContent = tag;
    chip.addEventListener('click', () => selectTag(tag));
    tagBar.appendChild(chip);
  });

  // Show "More" if overflow
  checkTagOverflow();
}

function checkTagOverflow() {
  const wrapperH = 52;
  let totalH = 0;
  let overflow = false;
  const chips = tagBar.querySelectorAll('.tag-chip');
  chips.forEach(c => {
    totalH += c.offsetHeight + 8;
    if (totalH > wrapperH + 10) overflow = true;
  });

  if (overflow) show(tagMoreBtn);
  else hide(tagMoreBtn);
}

tagMoreBtn?.addEventListener('click', () => {
  tagBar.classList.toggle('expanded');
  tagMoreBtn.textContent = tagBar.classList.contains('expanded') ? 'Less ▴' : 'More ▾';
});

function selectTag(tag) {
  state.currentTag  = tag;
  state.currentPage = 1;
  state.pageHistory = [null];

  document.querySelectorAll('.tag-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tag === tag);
  });

  loadVideos();
}

// "All" chip
document.querySelector('.tag-chip[data-tag="all"]')?.addEventListener('click', () => selectTag('all'));

// ==============================
// LOAD VIDEOS
// ==============================
async function loadVideos() {
  show(loadingInd);
  hide(noResults);
  videoGrid.innerHTML = '';
  hide(paginationWrap);

  const startAfterDoc = state.pageHistory[state.currentPage - 1] || null;

  try {
    const { videos, lastVisible, hasMore } = await fetchVideos({
      tag:         state.currentTag,
      lastDoc:     startAfterDoc,
      searchQuery: state.searchQuery,
    });

    hide(loadingInd);

    if (videos.length === 0) {
      show(noResults);
      return;
    }

    // Store cursor for next page
    if (lastVisible) {
      state.pageHistory[state.currentPage] = lastVisible;
    }

    // Render cards
    videos.forEach(video => {
      const card = createVideoCard(video, (v) => onVideoClick(v));
      videoGrid.appendChild(card);
    });

    // Pagination
    show(paginationWrap);
    renderPagination({
      container:   paginationEl,
      currentPage: state.currentPage,
      hasMore,
      onPage: (page) => {
        state.currentPage = page;
        loadVideos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

  } catch (e) {
    hide(loadingInd);
    show(noResults);
    console.error('loadVideos error:', e);
  }
}

// ==============================
// VIDEO CLICK
// ==============================
async function onVideoClick(video) {
  // Open URL in new tab
  if (video.url) window.open(video.url, '_blank', 'noopener,noreferrer');

  // Track views
  try {
    await incrementVideoStat(video.id, 'views');
    await incrementVideoStat(video.id, 'clicks');
  } catch (_) { /* non-critical */ }

  // Save history
  if (state.user) {
    await saveHistory(state.user.uid, video);
  }
}

// ==============================
// USER STATE CHANGES
// ==============================
function onUserStateChange(user, isAdmin) {
  state.user    = user;
  state.isAdmin = isAdmin;

  const userInfoEl = $('side-user-info');

  if (user) {
    getUserProfile(user.uid).then(profile => {
      if (userInfoEl && profile) {
        userInfoEl.innerHTML = `${profile.avatar || '😊'} <strong>${profile.username}</strong><br><small>${user.email}</small>`;
      }
    });

    show($('menu-profile-link').parentElement);
    show($('menu-logout-link').parentElement);
    hide($('menu-login-link').parentElement);
  } else {
    if (userInfoEl) userInfoEl.innerHTML = '';
    hide($('menu-logout-link').parentElement);
    show($('menu-login-link').parentElement);
  }

  // Admin link visibility
  const adminLink = $('menu-admin-link');
  if (adminLink) {
    isAdmin ? show(adminLink.parentElement) : hide(adminLink.parentElement);
  }
}

// ==============================
// INIT
// ==============================
function init() {
  setupAuth();
  setupSideMenu();
  setupProfileBtn();
  setupSearchUI();

  // Side menu login link
  $('menu-login-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    show(authModal);
    hide(sideMenu);
    hide(sideOverlay);
  });

  // Auth state
  onUserChange(onUserStateChange);

  // Load tags then videos
  loadTags().then(() => loadVideos());
}

// ==============================
// BOOTSTRAP
// ==============================
window.addEventListener('load', () => {
  // Small delay to let splash show
  setTimeout(() => {
    hideSplash();
    showAgeGate();
  }, 2000);
});
