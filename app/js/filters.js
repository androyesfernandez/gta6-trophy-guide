// Filtering, sorting and the spoiler rule for the checklist. Pure functions
// over the trophy data plus the store's state, so the views stay declarative.

export const KIND_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
  { key: 'online', label: 'Online' },
];

export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function trophyKinds(trophy) {
  return Array.isArray(trophy.kinds) && trophy.kinds.length ? trophy.kinds : [trophy.kind];
}

export function countForKindFilter(trophies, key) {
  if (key === 'all') return trophies.length;
  if (key === 'missable') return trophies.filter((trophy) => trophy.missable).length;
  return trophies.filter((trophy) => trophyKinds(trophy).includes(key)).length;
}

export function matchesKindFilter(trophy, key) {
  if (key === 'all') return true;
  if (key === 'missable') return trophy.missable === true;
  return trophyKinds(trophy).includes(key);
}

export function matchesFilters(trophy, filters, store) {
  if (!matchesKindFilter(trophy, filters.kind)) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.status === 'earned' && !store.isEarned(trophy.id)) return false;
  if (filters.status === 'unearned' && store.isEarned(trophy.id)) return false;
  if (filters.hideEarned && store.isEarned(trophy.id)) return false;
  if (filters.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(filters.query.toLowerCase())) return false;
  }
  return true;
}

export function sortTrophies(trophies, sortKey) {
  const list = trophies.slice();
  if (sortKey === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortKey === 'grade') {
    list.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  } else {
    list.sort((a, b) => a.stage - b.stage || a.order - b.order || a.id - b.id);
  }
  return list;
}

// The spoiler rule: with spoiler mode on, an unearned story trophy shows
// neither its name nor its description (nor its guide, which would spoil
// both) until it is earned. The platinum itself is public on PlayStation's
// list from the start, so it is never blanked.
export function isSpoilerHidden(trophy, store) {
  return (
    store.state.settings.spoiler === true &&
    trophy.kind === 'story' &&
    trophy.id !== 1 &&
    !store.isEarned(trophy.id)
  );
}

export const SPOILER_NAME = 'Hidden story trophy';
export const SPOILER_TEXT = 'Earn this story trophy to reveal its name and description.';

export function displayName(trophy, store) {
  return isSpoilerHidden(trophy, store) ? SPOILER_NAME : trophy.name;
}

export function displayDescription(trophy, store) {
  return isSpoilerHidden(trophy, store) ? SPOILER_TEXT : trophy.description;
}
