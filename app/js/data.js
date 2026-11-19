// Loads and validates app/data/trophies.json, and holds the roadmap's stage
// metadata. The data file is the guide's heart: all 55 official trophies with
// their enriched fields (kind, hidden flag, PSN target, roadmap stage, guide,
// sources, confidence). Nothing here reaches the network beyond that one
// same-directory fetch, and the app is served from app/ so it works offline.

export const TROPHY_TOTAL = 55;

export const STAGE_INFO = [
  {
    stage: 1,
    name: 'Stage 1 — Story first',
    hours: '≈ 60–80 hours (the story itself)',
    blurb:
      'Play the five chapters and the character strands in order. Two disciplines protect the whole run: a manual save at the start of every chapter, and Lucia\u2019s Chapter 1 balcony meditation done before Chapter 1 ends — the one possibly-missable moment in the game (PowerPyx, Step 1). Scan vehicles and study animals as you travel; Stage 2 inherits whatever you bank here.',
  },
  {
    stage: 2,
    name: 'Stage 2 — The 100% checklist',
    hours: '≈ 100 hours (PowerPyx, Step 2)',
    blurb:
      'After the story, the checklist appears under Progress > Stats > 100% Completion and earlier work already counts. Work its fractions: vehicles, animals, challenges, stunts, meditations, collections and the money trophies. Most individual trophies in this stage fall out of the checklist grind rather than needing a campaign of their own.',
  },
  {
    stage: 3,
    name: 'Stage 3 — Cleanup & secrets',
    hours: '≈ 20–40 hours (estimate)',
    blurb:
      'Everything left: the robbery set, the partner feats, the one-off free-roam trophies and the five hidden secrets whose triggers are still unconfirmed at launch. When the other 54 are earned, the platinum closes the guide.',
  },
];

export function roadmapCompare(a, b) {
  if (a.stage !== b.stage) return a.stage - b.stage;
  if (a.order !== b.order) return a.order - b.order;
  return a.id - b.id;
}

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('trophies.json could not be loaded');
  const parsed = await response.json();
  const trophies = Array.isArray(parsed) ? parsed : parsed.trophies;
  if (!Array.isArray(trophies) || trophies.length !== TROPHY_TOTAL) {
    throw new Error('trophies.json does not hold the expected 55 trophies');
  }
  for (const trophy of trophies) {
    if (typeof trophy.name !== 'string' || typeof trophy.guide !== 'string' || !trophy.guide.trim()) {
      throw new Error('a trophy is missing its name or guide');
    }
  }
  return trophies.slice().sort((a, b) => a.id - b.id);
}

export function stageOf(trophies, stage) {
  return trophies.filter((trophy) => trophy.stage === stage).sort(roadmapCompare);
}

export function countedTrophies(trophies) {
  return trophies.filter((trophy) => typeof trophy.target === 'number');
}
