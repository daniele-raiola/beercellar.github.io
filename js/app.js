import { CATEGORIES } from './data.js';
import { state, load } from './state.js';
import { catIcon, svgIcon } from './helpers.js';
import { renderHome, renderBeerList } from './views/home.js';
import { renderDetail } from './views/detail.js';
import { renderAdd, updateCatSelector, validateForm } from './views/add-edit.js';
import { renderStats } from './views/stats.js';
import { toggleFav, saveBeer, deleteBeer } from './actions.js';
import { exportData, importData, handleImportFile, applyImport } from './import-export.js';
import { initPWA } from './pwa.js';

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

export function navigate(view, opts = {}, { replace = false } = {}) {
  state.prevView = state.currentView;
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');

  const showNav = view === 'home' || view === 'stats';
  document.getElementById('bottom-nav').style.display = showNav ? 'flex' : 'none';
  document.getElementById('fab').style.display = (view === 'home') ? 'flex' : 'none';

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view);
  });

  if (view === 'home')   renderHome();
  if (view === 'stats')  renderStats();
  if (view === 'detail') renderDetail(opts.id);
  if (view === 'add')    renderAdd(opts.id || null);

  if (replace) {
    history.replaceState({ view, opts }, '');
  } else {
    history.pushState({ view, opts }, '');
  }

  window.scrollTo(0, 0);
  const mainPanel = document.querySelector('.home-main');
  if (mainPanel) mainPanel.scrollTop = 0;
}

// ═══════════════════════════════════════════════════════════
// EVENT WIRING
// ═══════════════════════════════════════════════════════════

function wire() {
  // Nav
  document.querySelectorAll('.nav-item[data-view]').forEach(n =>
    n.addEventListener('click', () => navigate(n.dataset.view)));

  // FAB
  document.getElementById('fab').addEventListener('click', () => navigate('add'));

  // Detail actions
  document.getElementById('detail-back').addEventListener('click', () => history.back());
  document.getElementById('detail-fav').addEventListener('click', () => {
    if (state.selectedBeer) toggleFav(state.selectedBeer);
  });
  document.getElementById('detail-edit').addEventListener('click', () => {
    if (state.selectedBeer) navigate('add', { id: state.selectedBeer });
  });
  document.getElementById('detail-delete').addEventListener('click', () => {
    if (state.selectedBeer) deleteBeer(state.selectedBeer);
  });

  // Add/edit back
  document.getElementById('add-back').addEventListener('click', () => history.back());

  // Form validation
  document.getElementById('f-name').addEventListener('input', validateForm);

  // Save
  document.getElementById('save-btn').addEventListener('click', saveBeer);

  // Search
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    state.selectedCategory = null;
    searchClear.classList.toggle('visible', !!searchInput.value);
    renderHome();
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.classList.remove('visible');
    renderHome();
  });

  // Filter bar
  document.getElementById('filter-bar').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.filterType = chip.dataset.filter;
    renderBeerList();
  });

  // Sort dropdown
  document.getElementById('sort-toggle').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('sort-dropdown').classList.toggle('open');
  });
  document.addEventListener('click', () =>
    document.getElementById('sort-dropdown').classList.remove('open'));
  document.getElementById('sort-dropdown').addEventListener('click', e => {
    e.stopPropagation();
    const opt = e.target.closest('.sort-option');
    if (!opt) return;
    state.sortOrder = opt.dataset.sort;
    document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    document.getElementById('sort-dropdown').classList.remove('open');
    renderBeerList();
  });

  // Category sheet
  document.getElementById('cat-selector').addEventListener('click', openCatSheet);
  document.getElementById('cat-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('cat-overlay'))
      document.getElementById('cat-overlay').classList.remove('open');
  });

  // Delete dialog — close on backdrop
  document.getElementById('delete-dialog').addEventListener('click', e => {
    if (e.target === document.getElementById('delete-dialog'))
      document.getElementById('delete-dialog').classList.remove('open');
  });

  // Export / Import buttons
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', importData);

  // File input
  const importFileInput = document.getElementById('import-file-input');
  importFileInput.addEventListener('change', () => {
    const file = importFileInput.files[0];
    importFileInput.value = '';
    if (file) handleImportFile(file);
  });

  // Import dialog actions
  document.getElementById('import-merge').addEventListener('click',   () => applyImport('merge'));
  document.getElementById('import-replace').addEventListener('click', () => applyImport('replace'));
  document.getElementById('import-cancel').addEventListener('click',  () => {
    document.getElementById('import-dialog').classList.remove('open');
  });
  document.getElementById('import-dialog').addEventListener('click', e => {
    if (e.target === document.getElementById('import-dialog')) {
      document.getElementById('import-dialog').classList.remove('open');
    }
  });
}

function openCatSheet() {
  const overlay = document.getElementById('cat-overlay');
  const list    = document.getElementById('cat-sheet-list');
  list.innerHTML = CATEGORIES.map(c => `
    <div class="sheet-item ${state.formCategory === c.id ? 'active' : ''}" data-cat="${c.id}"
         style="${state.formCategory === c.id ? `--cat-color:${c.color}` : ''}">
      <span class="sheet-item-emoji" style="${state.formCategory === c.id ? `color:${c.color}` : ''}">${catIcon(c.id)}</span>
      <span class="sheet-item-label" style="${state.formCategory === c.id ? `color:${c.color}` : ''}">${c.name}</span>
      ${state.formCategory === c.id ? `<span class="sheet-item-check">${svgIcon('check','icon icon--sm')}</span>` : ''}
    </div>`).join('');

  list.querySelectorAll('.sheet-item').forEach(item => {
    item.addEventListener('click', () => {
      state.formCategory = item.dataset.cat;
      updateCatSelector();
      overlay.classList.remove('open');
    });
  });
  overlay.classList.add('open');
}

// ═══════════════════════════════════════════════════════════
// LOAD SVG SPRITE
// ═══════════════════════════════════════════════════════════

async function loadSprite() {
  try {
    const resp = await fetch('./assets/sprite.svg');
    const text = await resp.text();
    const div = document.createElement('div');
    div.style.display = 'none';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = text;
    document.body.insertBefore(div, document.body.firstChild);
  } catch (err) {
    console.warn('[App] Sprite SVG load failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

// History guard: prevents PWA from closing when pressing device back button.
// The history stack is: [GUARD] → [home] → [detail] → [add] → …
// When back reaches the guard, we bounce forward to home again.
const HISTORY_GUARD = { _guard: true };

window.addEventListener('popstate', e => {
  const s = e.state;
  if (!s || s._guard) {
    // Reached the guard (or fell out of app history) → bounce back to home
    history.pushState({ view: 'home', opts: {} }, '');
    _renderView('home', {});
    return;
  }
  _renderView(s.view, s.opts || {});
});

function _renderView(view, opts) {
  state.prevView = state.currentView;
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');

  const showNav = view === 'home' || view === 'stats';
  document.getElementById('bottom-nav').style.display = showNav ? 'flex' : 'none';
  document.getElementById('fab').style.display = (view === 'home') ? 'flex' : 'none';

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view);
  });

  if (view === 'home')   renderHome();
  if (view === 'stats')  renderStats();
  if (view === 'detail') renderDetail(opts.id);
  if (view === 'add')    renderAdd(opts.id || null);

  window.scrollTo(0, 0);
  const mainPanel = document.querySelector('.home-main');
  if (mainPanel) mainPanel.scrollTop = 0;
}

await loadSprite();
load();
wire();

// Set up history stack: GUARD (replaces browser's initial entry) + home (pushed on top)
history.replaceState(HISTORY_GUARD, '');
navigate('home');
initPWA();
