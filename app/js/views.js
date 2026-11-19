// Every view of the guide: the checklist, the guide pane, the roadmap, the
// missables page, the Next-up planner and the Sources & honesty page. Views
// are rendered from the trophy data and the store; every interaction calls
// back into the app object main.js provides, which saves and re-renders.

import { STAGE_INFO, stageOf } from './data.js';
import {
  KIND_FILTERS,
  countForKindFilter,
  matchesFilters,
  sortTrophies,
  displayName,
  displayDescription,
  isSpoilerHidden,
} from './filters.js';

function h(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
}

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };
const CONFIDENCE_LABEL = { confirmed: 'Confirmed', reported: 'Reported', unconfirmed: 'Unconfirmed' };

function gradeChip(trophy) {
  return h('span', { class: `chip grade-${trophy.grade}` }, GRADE_LABEL[trophy.grade]);
}
function kindChip(trophy) {
  return h('span', { class: 'chip' }, KIND_LABEL[trophy.kind] ?? trophy.kind);
}
function stateChips(trophy) {
  const chips = [];
  if (trophy.hidden) chips.push(h('span', { class: 'chip hidden-chip' }, 'Hidden on PSN'));
  if (trophy.missable) chips.push(h('span', { class: 'chip missable' }, 'Possibly missable'));
  if (trophy.timeSensitive) chips.push(h('span', { class: 'chip time-chip' }, 'Time-sensitive'));
  chips.push(h('span', { class: `chip conf-${trophy.confidence}` }, CONFIDENCE_LABEL[trophy.confidence]));
  return chips;
}

export function formatCount(trophy, value) {
  if (trophy.target >= 100000) return '$' + value.toLocaleString('en-US');
  return value.toLocaleString('en-US');
}

/* ---------------- header stats ---------------- */

export function updateHeaderStats(trophies, store) {
  const earned = trophies.filter((trophy) => store.isEarned(trophy.id));
  document.getElementById('stat-earned-count').textContent = `${earned.length} of ${trophies.length}`;
  const percent = Math.round((earned.length / trophies.length) * 100);
  document.getElementById('stat-percent-value').textContent = `${percent}%`;
  document.getElementById('progress-bar-fill').style.width = `${percent}%`;
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((trophy) => trophy.grade === grade).length;
    const got = earned.filter((trophy) => trophy.grade === grade).length;
    document.getElementById(`stat-grade-${grade}`).textContent = `${got}/${total}`;
  }
}

/* ---------------- checklist ---------------- */

export function renderTrophyList(region, app) {
  const { trophies, store, filters } = app;
  const visible = sortTrophies(trophies.filter((trophy) => matchesFilters(trophy, filters, store)), filters.sort);
  region.replaceChildren(
    h('p', { id: 'results-line' }, `${visible.length} of ${trophies.length} trophies shown`),
    h(
      'ul',
      { id: 'trophy-list' },
      visible.map((trophy) => trophyRow(trophy, app)),
    ),
  );
}

function trophyRow(trophy, app) {
  const { store, selectedId } = app;
  const earned = store.isEarned(trophy.id);
  const blanked = isSpoilerHidden(trophy, store);
  const checkbox = h('input', {
    type: 'checkbox',
    class: 'earned-box',
    'aria-label': `Mark ${trophy.name} earned`,
    onchange: (event) => {
      event.stopPropagation();
      app.toggleEarned(trophy.id);
    },
  });
  checkbox.checked = earned;
  const star = h(
    'button',
    {
      type: 'button',
      class: store.isStarred(trophy.id) ? 'star-btn starred' : 'star-btn',
      'aria-label': 'Star for the Next-up planner',
      onclick: (event) => {
        event.stopPropagation();
        app.toggleStar(trophy.id);
      },
    },
    store.isStarred(trophy.id) ? '★' : '☆',
  );
  const meta = h(
    'div',
    { class: 'row-meta' },
    gradeChip(trophy),
    kindChip(trophy),
    h('span', { class: 'chip' }, `Stage ${trophy.stage}`),
    trophy.hidden ? h('span', { class: 'chip hidden-chip' }, 'Hidden') : null,
    trophy.missable ? h('span', { class: 'chip missable' }, 'Missable?') : null,
  );
  const side = [star];
  if (typeof trophy.target === 'number') {
    const count = store.count(trophy.id);
    side.push(h('span', { class: 'row-count' }, `${formatCount(trophy, count)} / ${formatCount(trophy, trophy.target)}`));
    const fill = h('div', { class: 'row-count-fill' });
    fill.style.width = `${Math.min(100, (count / trophy.target) * 100)}%`;
    side.push(h('div', { class: 'row-count-bar' }, fill));
  }
  const row = h(
    'li',
    {
      class: `trophy-row${earned ? ' earned' : ''}${selectedId === trophy.id ? ' selected' : ''}`,
      onclick: () => app.select(trophy.id),
    },
    checkbox,
    h(
      'div',
      { class: 'row-main' },
      h(
        'div',
        { class: 'row-name' },
        h('span', { class: 'row-num' }, `#${trophy.id}`),
        blanked ? 'Hidden story trophy' : trophy.name,
      ),
      h('div', { class: 'row-desc' }, displayDescription(trophy, store)),
      meta,
    ),
    h('div', { class: 'row-side' }, side),
  );
  return row;
}

export function renderChecklistView(root, app) {
  const { trophies, filters } = app;
  const chips = h(
    'div',
    { id: 'kind-chips' },
    KIND_FILTERS.map((kind) =>
      h(
        'button',
        {
          type: 'button',
          class: `kind-chip${filters.kind === kind.key ? ' active' : ''}`,
          onclick: () => app.setFilter({ kind: kind.key }),
        },
        `${kind.label} `,
        h('span', { class: 'chip-count' }, countForKindFilter(trophies, kind.key)),
      ),
    ),
  );
  const gradeSelect = h(
    'select',
    { id: 'grade-filter', onchange: (event) => app.setFilter({ grade: event.target.value }) },
    ['all', 'platinum', 'gold', 'silver', 'bronze'].map((grade) =>
      h('option', { value: grade }, grade === 'all' ? 'All grades' : GRADE_LABEL[grade]),
    ),
  );
  gradeSelect.value = filters.grade;
  const statusSelect = h(
    'select',
    { id: 'status-filter', onchange: (event) => app.setFilter({ status: event.target.value }) },
    [
      ['all', 'All statuses'],
      ['earned', 'Earned'],
      ['unearned', 'Not yet earned'],
    ].map(([value, label]) => h('option', { value }, label)),
  );
  statusSelect.value = filters.status;
  const sortSelect = h(
    'select',
    { id: 'sort-select', onchange: (event) => app.setFilter({ sort: event.target.value }) },
    [
      ['roadmap', 'Roadmap order'],
      ['grade', 'Grade'],
      ['name', 'Name A–Z'],
    ].map(([value, label]) => h('option', { value }, label)),
  );
  sortSelect.value = filters.sort;
  const search = h('input', {
    id: 'search-input',
    type: 'search',
    placeholder: 'Search name, description, guide…',
    value: filters.query,
    oninput: (event) => app.setQuery(event.target.value),
  });
  const hideEarned = h('input', {
    type: 'checkbox',
    id: 'hide-earned-toggle',
    onchange: (event) => app.setFilter({ hideEarned: event.target.checked }),
  });
  hideEarned.checked = filters.hideEarned === true;
  const listRegion = h('div', { id: 'list-region' });
  root.replaceChildren(
    h(
      'div',
      { id: 'filters-bar' },
      chips,
      h(
        'div',
        { id: 'filter-controls' },
        h('label', {}, 'Grade', gradeSelect),
        h('label', {}, 'Status', statusSelect),
        h('label', {}, 'Sort', sortSelect),
        search,
        h('label', {}, hideEarned, 'Hide earned'),
      ),
    ),
    listRegion,
  );
  renderTrophyList(listRegion, app);
}

/* ---------------- guide pane ---------------- */

function counterWidget(trophy, app) {
  const { store } = app;
  const count = store.count(trophy.id);
  const target = trophy.target;
  const largeStep = target >= 1000 ? 1000 : target >= 50 ? 10 : null;
  const stepButton = (delta, label) =>
    h('button', { type: 'button', onclick: () => app.setCount(trophy.id, count + delta) }, label);
  const children = [
    h(
      'div',
      { class: 'counter-head' },
      h('span', {}, 'Interactive counter — tick it off as you play'),
      h('span', { class: 'counter-value' }, `${formatCount(trophy, count)} / ${formatCount(trophy, target)}`),
    ),
    h(
      'div',
      { class: 'counter-stepper' },
      largeStep ? stepButton(-largeStep, `−${largeStep}`) : null,
      stepButton(-1, '−1'),
      stepButton(1, '+1'),
      largeStep ? stepButton(largeStep, `+${largeStep}`) : null,
      h('button', { type: 'button', onclick: () => app.setCount(trophy.id, target) }, 'Set to target'),
    ),
  ];
  if (target <= 120) {
    const ticks = [];
    for (let i = 0; i < target; i += 1) {
      ticks.push(
        h('button', {
          type: 'button',
          class: `tick${i < count ? ' on' : ''}`,
          'aria-label': `Set count to ${i + 1}`,
          onclick: () => app.setCount(trophy.id, count === i + 1 ? i : i + 1),
        }),
      );
    }
    children.push(h('div', { class: 'tick-grid' }, ticks));
  } else {
    const fill = h('div', { class: 'counter-bar-fill' });
    fill.style.width = `${Math.min(100, (count / target) * 100)}%`;
    children.push(h('div', { class: 'counter-bar' }, fill));
  }
  if (count >= target && !store.isEarned(trophy.id)) {
    children.push(
      h(
        'p',
        { class: 'counter-suggest' },
        'Counter complete. When the trophy pops in game, mark it earned: ',
        h('button', { type: 'button', onclick: () => app.toggleEarned(trophy.id) }, 'Mark earned'),
      ),
    );
  }
  return h('div', { class: 'counter-box', id: 'guide-counter' }, children);
}

export function renderGuidePane(pane, app) {
  const { trophies, store } = app;
  const trophy = trophies.find((candidate) => candidate.id === (app.paneId ?? app.selectedId)) ?? trophies[0];
  const blanked = isSpoilerHidden(trophy, store);
  const earned = store.isEarned(trophy.id);
  const stage = STAGE_INFO[trophy.stage - 1];
  const stageList = stageOf(trophies, trophy.stage);
  const position = stageList.findIndex((candidate) => candidate.id === trophy.id) + 1;

  const children = [
    h('h2', { id: 'guide-title' }, displayName(trophy, store)),
    h(
      'div',
      { class: 'guide-chips', id: 'guide-chips' },
      gradeChip(trophy),
      kindChip(trophy),
      stateChips(trophy),
      h('span', { class: 'chip' }, `Stage ${trophy.stage} · ${position} of ${stageList.length}`),
      h('span', { class: 'chip' }, trophy.hours > 0 ? `≈ ${trophy.hours} h (estimate)` : 'Earned along the way'),
      h('span', { class: 'chip' }, `Difficulty ${trophy.difficulty}/5 (estimate)`),
    ),
    h('p', { class: 'guide-section-label' }, 'Official description'),
    h('p', { class: 'official-desc', id: 'guide-official' }, displayDescription(trophy, store)),
  ];

  if (trophy.missable) {
    children.push(
      h(
        'div',
        { class: 'missable-warning', id: 'guide-warning' },
        h('strong', {}, 'Possibly missable — '),
        trophy.missableNote ?? '',
      ),
    );
  }
  if (trophy.timeSensitive) {
    children.push(h('div', { class: 'time-note', id: 'guide-time-note' }, h('strong', {}, 'Time-sensitive — '), trophy.timeSensitive));
  }

  children.push(
    h(
      'p',
      { class: 'sources-strip' },
      h('strong', {}, 'Sources for this guide: '),
      trophy.sources.map((source) => source.name.split(' — ')[0]).join(' · '),
      ' — full citations below.',
    ),
    h('p', { class: 'guide-section-label' }, 'Guide — in this guide\u2019s own words'),
  );
  if (blanked) {
    children.push(
      h('p', { class: 'guide-prose spoiler-blank' }, 'Spoiler mode is on: this story trophy\u2019s guide stays hidden until you earn it.'),
    );
  } else {
    children.push(h('p', { class: 'guide-prose', id: 'guide-prose' }, trophy.guide));
  }

  if (typeof trophy.target === 'number' && !blanked) children.push(counterWidget(trophy, app));

  children.push(
    h('p', { class: 'guide-section-label' }, 'Roadmap'),
    h(
      'p',
      { class: 'fact-line', id: 'guide-roadmap-line' },
      `${stage.name}, position ${position} of ${stageList.length} in the stage order. `,
      h('button', { type: 'button', onclick: () => app.gotoView('roadmap') }, 'Open the roadmap'),
    ),
    h('p', { class: 'guide-section-label' }, 'Sources — where each fact comes from'),
    h(
      'div',
      { id: 'guide-sources' },
      trophy.sources.map((source) =>
        h(
          'div',
          { class: 'source-card' },
          h('span', { class: 'source-name' }, source.name),
          source.url ? h('div', {}, h('a', { href: source.url, target: '_blank', rel: 'noreferrer' }, source.url)) : null,
          h('p', {}, source.note),
        ),
      ),
    ),
    h(
      'div',
      { class: 'guide-actions', id: 'guide-actions' },
      h(
        'button',
        {
          type: 'button',
          class: earned ? 'earned-toggle earned' : 'earned-toggle',
          onclick: () => app.toggleEarned(trophy.id),
        },
        earned ? '✓ Earned — undo' : 'Mark earned',
      ),
      h(
        'button',
        { type: 'button', onclick: () => app.toggleStar(trophy.id) },
        store.isStarred(trophy.id) ? '★ In Next up — remove' : '☆ Add to Next up',
      ),
    ),
    h('label', { class: 'guide-section-label', for: 'guide-note' }, 'Your notes'),
  );
  const note = h('textarea', {
    id: 'guide-note',
    placeholder: 'Where you left off, what to try next…',
    onchange: (event) => app.setNote(trophy.id, event.target.value),
  });
  note.value = store.note(trophy.id);
  children.push(note);

  pane.replaceChildren(...children);
}

/* ---------------- roadmap ---------------- */

const COMPLETION_FACTS = [
  ['Vehicles discovered', '200 of 277 base models', 'GTABase roadmap; OutputLag'],
  ['Animals studied', '100 of 255', 'GTABase roadmap'],
  ['Challenges', '70 of the 80', 'PowerPyx Step 2; OutputLag'],
  ['Stunts', '300 (the trophy itself needs 250)', 'OutputLag'],
  ['Meditations for 100%', '15 of 18 — the trophy follows the PSN counter to 18', 'KeenGamer; PSNProfiles target'],
  ['Bank vaults', 'all 8 (the trophy needs 5)', 'OutputLag'],
  ['Illegal operations', 'all 39 (Pest Control needs one per gang, 9 gangs)', 'OutputLag'],
];

export function renderRoadmapView(root, app) {
  const { trophies, store } = app;
  const children = [
    h(
      'p',
      { class: 'view-intro' },
      'The road to Vice Got a Price!: story first, then the 100% checklist, then cleanup. One playthrough is enough — the only moment that can be lost is a single meditation in Chapter 1. Hours are the launch guides\u2019 estimates, labelled as such.',
    ),
  ];
  for (const info of STAGE_INFO) {
    const list = stageOf(trophies, info.stage);
    const done = list.filter((trophy) => store.isEarned(trophy.id)).length;
    const fill = h('div', { class: 'stage-progress-fill' });
    fill.style.width = `${(done / list.length) * 100}%`;
    children.push(
      h(
        'section',
        { class: 'stage-card', id: `stage-card-${info.stage}` },
        h('h3', {}, info.name, h('span', { class: 'stage-hours' }, info.hours)),
        h('p', { class: 'fact-line' }, `${done} of ${list.length} trophies earned in this stage`),
        h('div', { class: 'stage-progress' }, fill),
        h('p', { class: 'fact-line' }, info.blurb),
        h(
          'ul',
          { class: 'stage-trophy-list' },
          list.map((trophy) =>
            h(
              'li',
              {
                class: store.isEarned(trophy.id) ? 'done' : '',
                onclick: () => app.select(trophy.id),
              },
              `${store.isEarned(trophy.id) ? '✓ ' : ''}${displayName(trophy, store)}`,
            ),
          ),
        ),
      ),
    );
  }
  children.push(
    h(
      'section',
      { class: 'info-card', id: 'completion-facts' },
      h('h3', {}, 'The 100% checklist, as the launch guides report it'),
      COMPLETION_FACTS.map(([label, value, source]) =>
        h('p', { class: 'fact-line' }, h('strong', {}, `${label}: `), `${value} `, h('span', { class: 'stat-facts-note' }, `(${source})`)),
      ),
      h(
        'p',
        { class: 'fact-line' },
        'The checklist itself only appears after the story (Progress > Stats > 100% Completion), but work done earlier already counts (OutputLag).',
      ),
    ),
    h(
      'section',
      { class: 'info-card', id: 'platinum-finale' },
      h('h3', {}, 'The platinum at the end of the road'),
      h(
        'p',
        { class: 'fact-line' },
        `Vice Got a Price! unlocks when the other 54 trophies are earned. You hold ${trophies.filter((trophy) => store.isEarned(trophy.id) && trophy.id !== 1).length} of the 54.`,
      ),
    ),
  );
  root.replaceChildren(...children);
}

/* ---------------- missables ---------------- */

export function renderMissablesView(root, app) {
  const { trophies } = app;
  const pma = trophies.find((trophy) => trophy.id === 28);
  const strangers = trophies.find((trophy) => trophy.id === 25);
  const actions = trophies.find((trophy) => trophy.id === 48);
  root.replaceChildren(
    h(
      'p',
      { class: 'view-intro' },
      'The honest launch position, as every major guide agrees: exactly ONE trophy on this list is possibly missable. Everything else can be finished after the story. Two more entries carry clocks or permanent choices and are flagged below — with their sources, and without inflating them into missables.',
    ),
    h(
      'section',
      { class: 'info-card', id: 'missable-pma' },
      h('h3', {}, `${pma.name} — possibly missable`),
      h('div', { class: 'missable-warning' }, h('strong', {}, 'Warning — '), pma.missableNote),
      h('p', { class: 'fact-line' }, pma.guide),
      h('button', { type: 'button', onclick: () => app.select(pma.id) }, 'Open its full guide'),
    ),
    h(
      'section',
      { class: 'info-card', id: 'time-sensitive' },
      h('h3', {}, 'Time-sensitive, not missable'),
      h('p', { class: 'fact-line' }, h('strong', {}, `${strangers.name}: `), strangers.timeSensitive),
      h(
        'p',
        { class: 'fact-line' },
        h('strong', {}, `${actions.name}: `),
        'GTABase\u2019s roadmap warns that the Irredeemable criminal profile is permanent once earned — a choice you cannot walk back, flagged here so it is a decision, not an accident.',
      ),
      h('button', { type: 'button', onclick: () => app.select(strangers.id) }, 'Open Strangers & Freaks'),
    ),
    h(
      'section',
      { class: 'info-card', id: 'save-protocol' },
      h('h3', {}, 'The manual-save protocol'),
      h(
        'ol',
        { class: 'protocol-list' },
        h('li', {}, 'Keep one manual save at the start of every chapter — five chapters, five slots. The game gives you 15 manual slots plus an autosave (OutputLag).'),
        h('li', {}, 'Do Lucia\u2019s Chapter 1 balcony meditation before Chapter 1 ends, and keep that Chapter 1 save until Positive Mental Attitude pops.'),
        h('li', {}, 'Park one untouched save just before the final mission; there is no mission replay and no New Game Plus.'),
        h('li', {}, 'Save before time-sensitive events (Race Against Yago) and before free-roam feats at VCIA and Mile Zero Air Station.'),
        h('li', {}, 'Never use cheats on your trophy save: launch guides report they disable trophies and saving.'),
      ),
    ),
  );
}

/* ---------------- planner ---------------- */

export function renderPlannerView(root, app) {
  const { trophies, store } = app;
  const byRoadmap = (a, b) => a.stage - b.stage || a.order - b.order || a.id - b.id;
  const unearned = trophies.filter((trophy) => !store.isEarned(trophy.id));
  const hoursLeft = unearned.reduce((sum, trophy) => sum + (trophy.hours || 0), 0);
  const queue = trophies.filter((trophy) => store.isStarred(trophy.id)).sort(byRoadmap);
  const children = [
    h('p', { class: 'planner-total' }, h('strong', {}, `≈ ${Math.round(hoursLeft)} hours left`), ' on your road to the platinum'),
    h(
      'p',
      { class: 'view-intro' },
      'The sum of the per-trophy time estimates for everything you have not earned yet — estimates, labelled as estimates, drawn from the launch guides\u2019 figures. Star trophies in any guide to build your queue; it is ordered by the roadmap, not by when you starred it.',
    ),
    h(
      'section',
      { class: 'info-card', id: 'stage-remaining' },
      h('h3', {}, 'What is left, by stage'),
      STAGE_INFO.map((info) => {
        const left = stageOf(trophies, info.stage).filter((trophy) => !store.isEarned(trophy.id));
        const hours = left.reduce((sum, trophy) => sum + (trophy.hours || 0), 0);
        return h('p', { class: 'fact-line' }, h('strong', {}, `${info.name}: `), `${left.length} trophies left · ≈ ${Math.round(hours)} h (estimate)`);
      }),
    ),
  ];
  if (!queue.length) {
    children.push(
      h(
        'section',
        { class: 'info-card', id: 'queue-empty' },
        h('h3', {}, 'Your Next-up queue is empty'),
        h('p', { class: 'fact-line' }, 'Open any trophy\u2019s guide and choose \u201cAdd to Next up\u201d. A good first queue: Positive Mental Attitude (protect Chapter 1), The Shootist, Cunning Stunts, You WAiNKer! and Maximum Withdrawal.'),
      ),
    );
  } else {
    children.push(
      h(
        'section',
        { class: 'info-card', id: 'queue-card' },
        h('h3', {}, `Next up — ${queue.length} starred`),
        h(
          'ul',
          { class: 'queue-list' },
          queue.map((trophy) => {
            const countLine =
              typeof trophy.target === 'number' ? ` · counter ${formatCount(trophy, store.count(trophy.id))}/${formatCount(trophy, trophy.target)}` : '';
            return h(
              'li',
              { class: 'trophy-row', onclick: () => app.select(trophy.id) },
              h('span', {}, '★'),
              h(
                'div',
                { class: 'row-main' },
                h('div', { class: 'row-name' }, displayName(trophy, store)),
                h('div', { class: 'row-desc' }, `Stage ${trophy.stage} · ≈ ${trophy.hours} h (estimate)${countLine}${store.isEarned(trophy.id) ? ' · earned' : ''}`),
              ),
              gradeChip(trophy),
            );
          }),
        ),
      ),
    );
  }
  root.replaceChildren(...children);
}

/* ---------------- honesty ---------------- */

const SOURCE_ROLES = [
  ['Exophase / PSNProfiles', 'The official list itself: names, descriptions, grades, which trophies are hidden on PSN, and the progress targets PlayStation tracks. The two databases agree on all 55; the list was frozen on 2026-11-18.'],
  ['PowerPyx', 'The roadmap\u2019s shape (story, then the 100% checklist), the difficulty and time estimates, and the first flag on the Chapter 1 meditation.'],
  ['GTABase', 'Per-trophy tips, the 100% checklist fractions, meditation counting with both characters, and the Irredeemable-profile caution.'],
  ['OutputLag', 'The robbery unlock chains (Snap Gun, vaults), the free-roam trophy steps, the time-sensitive Yago race, and the naming of the five unconfirmed trophies.'],
  ['KeenGamer', 'A second roadmap opinion; the 100% checklist\u2019s 15-of-18 meditation figure and the Chapter 1 meditation steps.'],
  ['EGamers', 'Cross-source comparison — where the meditation count disagreement (18 vs 15) is documented side by side.'],
  ['Push Square', 'A second roadmap; its longer platinum estimate (up to 300 hours) is why every time in this guide is labelled an estimate.'],
  ['GTA Zone / U7BUY', 'Chapter placements for story missions and requirement wording cross-checks (nine activity types; 500 Criminal Profile actions; both leads\u2019 Strength).'],
];

export function renderHonestyView(root, app) {
  const { trophies } = app;
  const counts = { confirmed: 0, reported: 0, unconfirmed: 0 };
  for (const trophy of trophies) counts[trophy.confidence] += 1;
  root.replaceChildren(
    h(
      'p',
      { class: 'view-intro' },
      'This guide was written in the game\u2019s launch week, when even the best sources are hours old. So every guide carries a confidence tag, every fact names its source beside it, and the disagreements are printed here instead of being quietly picked over.',
    ),
    h(
      'section',
      { class: 'info-card', id: 'confidence-counts' },
      h('h3', {}, 'Confidence across the 55 guides'),
      h('p', { class: 'fact-line' }, h('strong', {}, `${counts.confirmed} confirmed`), ' — the official list, or facts several launch sources agree on.'),
      h('p', { class: 'fact-line' }, h('strong', {}, `${counts.reported} reported`), ' — specific steps from one or two launch guides, not yet independently confirmed.'),
      h('p', { class: 'fact-line' }, h('strong', {}, `${counts.unconfirmed} unconfirmed`), ' — hidden trophies whose triggers nobody has verified yet; their guides say so and assert nothing.'),
    ),
    h(
      'section',
      { class: 'info-card', id: 'known-conflicts' },
      h('h3', {}, 'Known conflicts, stated plainly'),
      h(
        'div',
        { class: 'conflict-box' },
        h('strong', {}, 'Meditations: 15 or 18? '),
        'The in-game 100% checklist asks for 15 meditations (KeenGamer), while the PlayStation counter for Positive Mental Attitude runs to 18 (PSNProfiles; GTABase). Both numbers are printed in this guide where each belongs: 15 is a checklist fraction, 18 is the trophy\u2019s target. EGamers\u2019 comparison suggests the two may simply count different things.',
      ),
      h(
        'div',
        { class: 'conflict-box' },
        h('strong', {}, 'Is the Chapter 1 meditation required? '),
        'Unconfirmed. PowerPyx and GTABase both say the balcony meditation raises the counter but is not marked like the other spots, and whether the trophy needs it is not yet known. This guide\u2019s advice — do it, keep the save — is the safe play, labelled as such, not a fact.',
      ),
      h(
        'div',
        { class: 'conflict-box' },
        h('strong', {}, 'How long is the platinum? '),
        'PowerPyx estimates roughly 200 hours; Push Square warns of 300 or more. Both are printed in this guide\u2019s header as estimates, because at launch that is all they are.',
      ),
    ),
    h(
      'section',
      { class: 'info-card', id: 'source-roles' },
      h('h3', {}, 'Sources and what each one vouches for'),
      h(
        'table',
        { class: 'honesty-table' },
        SOURCE_ROLES.map(([name, role]) => h('tr', {}, h('td', {}, name), h('td', {}, role))),
      ),
      h(
        'p',
        { class: 'fact-line' },
        'The rule this guide was written under: a specific location, step or threshold with no source behind it earns no place in a guide. Where a source could not be found, the guide says \u201cunconfirmed\u201d instead of filling the gap.',
      ),
    ),
  );
}
