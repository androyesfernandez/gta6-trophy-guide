// Boot and routing for the Leonida Field Guide. Loads the trophy data, opens
// the store, wires the header (spoiler toggle, export / import / reset),
// routes between the five views by hash, and re-renders on every change.
// Views are reached at #/checklist, #/roadmap, #/missables, #/planner and
// #/honesty; #/trophy/<id> opens the checklist with that trophy selected.

import { loadTrophyData } from './data.js';
import { createStore } from './store.js';
import {
  updateHeaderStats,
  renderChecklistView,
  renderTrophyList,
  renderGuidePane,
  renderRoadmapView,
  renderMissablesView,
  renderPlannerView,
  renderHonestyView,
} from './views.js';

const VIEW_RENDERERS = {
  checklist: renderChecklistView,
  roadmap: renderRoadmapView,
  missables: renderMissablesView,
  planner: renderPlannerView,
  honesty: renderHonestyView,
};

async function boot() {
  const root = document.getElementById('view-root');
  const pane = document.getElementById('guide-pane');
  let trophies;
  try {
    trophies = await loadTrophyData();
  } catch (error) {
    root.textContent = `The guide data could not be loaded: ${error.message}`;
    return;
  }
  const store = createStore(window.localStorage);

  const app = {
    trophies,
    store,
    view: 'checklist',
    selectedId: 28,
    filters: {
      kind: 'all',
      grade: 'all',
      status: 'all',
      sort: 'roadmap',
      query: '',
      hideEarned: store.state.settings.hideEarned === true,
    },
    select(id) {
      app.selectedId = id;
      renderGuidePane(pane, app);
      if (app.view === 'checklist') renderChecklistView(root, app);
    },
    gotoView(view) {
      if (location.hash !== `#/${view}`) location.hash = `#/${view}`;
      else render();
    },
    setFilter(patch) {
      Object.assign(app.filters, patch);
      if ('hideEarned' in patch) store.setSetting('hideEarned', patch.hideEarned === true);
      renderChecklistView(root, app);
    },
    setQuery(query) {
      app.filters.query = query;
      const region = document.getElementById('list-region');
      if (region) renderTrophyList(region, app);
    },
    toggleEarned(id) {
      store.setEarned(id, !store.isEarned(id));
      render();
    },
    setCount(id, value) {
      const trophy = trophies.find((candidate) => candidate.id === id);
      const clamped = Math.min(Math.max(0, value), trophy?.target ?? value);
      store.setCount(id, clamped);
      render();
    },
    toggleStar(id) {
      store.toggleStarred(id);
      render();
    },
    setNote(id, text) {
      store.setNote(id, text);
    },
  };

  function render() {
    updateHeaderStats(trophies, store);
    for (const tab of document.querySelectorAll('.view-tab')) {
      tab.classList.toggle('active', tab.dataset.view === app.view);
    }
    // In the planner, the guide pane spotlights the starred counted trophy
    // closest to its target — the goal the plan is really about.
    app.paneId = null;
    if (app.view === 'planner') {
      const candidates = trophies
        .filter((trophy) => store.isStarred(trophy.id) && typeof trophy.target === 'number' && !store.isEarned(trophy.id))
        .sort((a, b) => store.count(b.id) / b.target - store.count(a.id) / a.target);
      if (candidates.length) app.paneId = candidates[0].id;
    }
    VIEW_RENDERERS[app.view](root, app);
    renderGuidePane(pane, app);
  }

  function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [head, tail] = hash.split('/');
    if (head === 'trophy' && Number.isInteger(Number(tail))) {
      app.view = 'checklist';
      app.selectedId = Number(tail);
    } else if (head in VIEW_RENDERERS) {
      app.view = head;
    }
    render();
  }

  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.addEventListener('click', () => app.gotoView(tab.dataset.view));
  }

  const spoilerToggle = document.getElementById('spoiler-toggle');
  spoilerToggle.checked = store.state.settings.spoiler === true;
  spoilerToggle.addEventListener('change', () => {
    store.setSetting('spoiler', spoilerToggle.checked);
    render();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leonida-field-guide-progress.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  const importFile = document.getElementById('import-file');
  document.getElementById('import-btn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    const ok = store.importJson(await file.text());
    importFile.value = '';
    if (ok) {
      spoilerToggle.checked = store.state.settings.spoiler === true;
      app.filters.hideEarned = store.state.settings.hideEarned === true;
      render();
    } else {
      window.alert('That file is not a Leonida Field Guide progress export.');
    }
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!window.confirm('Clear all progress, counters, notes and stars?')) return;
    store.reset();
    spoilerToggle.checked = false;
    app.filters.hideEarned = false;
    render();
  });

  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select')) return;
    const views = ['checklist', 'roadmap', 'missables', 'planner', 'honesty'];
    const index = Number(event.key) - 1;
    if (index >= 0 && index < views.length) app.gotoView(views[index]);
    if (event.key === '/' && app.view === 'checklist') {
      event.preventDefault();
      document.getElementById('search-input')?.focus();
    }
  });

  window.addEventListener('hashchange', route);
  route();
}

boot();
