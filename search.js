// ===========================
// search.js — Search Logic
// ===========================

let searchDebounce = null;

/**
 * Sets up search input with debounced callback
 * @param {HTMLInputElement} input
 * @param {Function} onSearch - callback(query: string)
 */
export function setupSearch(input, onSearch) {
  input.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      onSearch(input.value.trim());
    }, 350);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(searchDebounce);
      onSearch(input.value.trim());
    }
    if (e.key === 'Escape') {
      input.value = '';
      onSearch('');
    }
  });
}

/**
 * Filter videos client-side
 * @param {Array} videos
 * @param {string} query
 */
export function filterVideos(videos, query) {
  if (!query) return videos;
  const q = query.toLowerCase();
  return videos.filter(v => {
    const title    = (v.title    || '').toLowerCase();
    const hashtags = (v.hashtags || '').toLowerCase();
    const tags     = (Array.isArray(v.tags) ? v.tags : []).join(' ').toLowerCase();
    return title.includes(q) || hashtags.includes(q) || tags.includes(q);
  });
}
