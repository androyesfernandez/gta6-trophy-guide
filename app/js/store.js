// The tracker store: everything the reader earns, counts, notes, stars and
// sets lives in one versioned localStorage object, so progress survives
// reloads and can be exported to a file and imported back. The store knows
// nothing about the DOM; views read it and call its setters.

export const STORAGE_KEY = 'leonida-field-guide:v1';

function blankState() {
  return {
    version: 1,
    earned: {},
    counts: {},
    notes: {},
    starred: [],
    settings: { spoiler: false, hideEarned: false },
  };
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Accepts only the shapes this store writes; anything else is rejected so a
// stray file cannot corrupt the tracker.
export function validateImport(parsed) {
  if (!isPlainObject(parsed)) return null;
  const clean = blankState();
  if (isPlainObject(parsed.earned)) {
    for (const [key, value] of Object.entries(parsed.earned)) {
      if (value === true && Number.isInteger(Number(key))) clean.earned[key] = true;
    }
  }
  if (isPlainObject(parsed.counts)) {
    for (const [key, value] of Object.entries(parsed.counts)) {
      const n = Number(value);
      if (Number.isInteger(Number(key)) && Number.isFinite(n) && n >= 0) clean.counts[key] = Math.floor(n);
    }
  }
  if (isPlainObject(parsed.notes)) {
    for (const [key, value] of Object.entries(parsed.notes)) {
      if (typeof value === 'string' && Number.isInteger(Number(key))) clean.notes[key] = value.slice(0, 2000);
    }
  }
  if (Array.isArray(parsed.starred)) {
    clean.starred = [...new Set(parsed.starred.filter((id) => Number.isInteger(id)))];
  }
  if (isPlainObject(parsed.settings)) {
    clean.settings.spoiler = parsed.settings.spoiler === true;
    clean.settings.hideEarned = parsed.settings.hideEarned === true;
  }
  return clean;
}

export function createStore(storage) {
  let state = blankState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) state = validateImport(JSON.parse(raw)) ?? blankState();
  } catch {
    state = blankState();
  }

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the tracker keeps working for the session.
    }
  }

  return {
    get state() {
      return state;
    },
    isEarned(id) {
      return state.earned[id] === true;
    },
    setEarned(id, earned) {
      if (earned) state.earned[id] = true;
      else delete state.earned[id];
      save();
    },
    count(id) {
      return state.counts[id] ?? 0;
    },
    setCount(id, value) {
      state.counts[id] = Math.max(0, Math.floor(value));
      save();
    },
    note(id) {
      return state.notes[id] ?? '';
    },
    setNote(id, text) {
      state.notes[id] = text;
      save();
    },
    isStarred(id) {
      return state.starred.includes(id);
    },
    toggleStarred(id) {
      state.starred = state.starred.includes(id)
        ? state.starred.filter((starredId) => starredId !== id)
        : [...state.starred, id];
      save();
    },
    setSetting(key, value) {
      state.settings[key] = value === true;
      save();
    },
    exportJson() {
      return JSON.stringify(state, null, 2);
    },
    importJson(text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return false;
      }
      const clean = validateImport(parsed);
      if (!clean) return false;
      state = clean;
      save();
      return true;
    },
    reset() {
      state = blankState();
      save();
    },
  };
}
