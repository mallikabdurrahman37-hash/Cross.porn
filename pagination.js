// ===========================
// pagination.js — Pagination System
// ===========================

/**
 * Renders numbered pagination buttons.
 * @param {Object} opts
 * @param {HTMLElement} opts.container - The pagination wrapper element
 * @param {number}      opts.currentPage
 * @param {boolean}     opts.hasMore
 * @param {Function}    opts.onPage - callback(page)
 */
export function renderPagination({ container, currentPage, hasMore, onPage }) {
  container.innerHTML = '';

  // PREV button
  const prev = createPageBtn('← Prev', currentPage <= 1);
  prev.addEventListener('click', () => {
    if (currentPage > 1) onPage(currentPage - 1);
  });
  container.appendChild(prev);

  // Page number buttons (sliding window of 5)
  const startPage = Math.max(1, currentPage - 2);
  const endPage   = hasMore ? currentPage + 2 : currentPage;

  for (let i = startPage; i <= endPage; i++) {
    const btn = createPageBtn(String(i), false);
    if (i === currentPage) btn.classList.add('active');
    const pageNum = i;
    btn.addEventListener('click', () => onPage(pageNum));
    container.appendChild(btn);
  }

  // NEXT button
  const next = createPageBtn('Next →', !hasMore);
  next.addEventListener('click', () => {
    if (hasMore) onPage(currentPage + 1);
  });
  container.appendChild(next);
}

function createPageBtn(label, disabled) {
  const btn = document.createElement('button');
  btn.className = 'page-btn';
  btn.textContent = label;
  btn.disabled = disabled;
  return btn;
}
