// state.js — owns all mutable runtime data and the pristine initial snapshots.
// Loaded FIRST by index.html, before utils / api / app.

// ── Runtime state (mutated freely by app.js) ────────────────────────────────
let courses = [];
let profs   = [];
let ISCAT   = [];

// ── Pristine snapshots set once by initializeState() ────────────────────────
// Used by autoLayout() to reset back to the catalog defaults.
let INITIAL_COURSES = [];
let INITIAL_PROFS   = [];
let INITIAL_ISCAT   = [];

// Original prereqs of IS-elective slots so clearSlot() can restore them.
const slotOriginalPrereqs = {};

// ── Called once on boot with the catalog payload from /api/catalog ───────────
function initializeState(catalog) {
  if (catalog.courses) {
    INITIAL_COURSES = JSON.parse(JSON.stringify(catalog.courses));
    courses         = JSON.parse(JSON.stringify(catalog.courses));
  }
  if (catalog.professors) {
    INITIAL_PROFS = JSON.parse(JSON.stringify(catalog.professors));
    profs         = JSON.parse(JSON.stringify(catalog.professors));
  }
  if (catalog.isElectives) {
    INITIAL_ISCAT = JSON.parse(JSON.stringify(catalog.isElectives));
    ISCAT.length  = 0;
    ISCAT.push(...JSON.parse(JSON.stringify(catalog.isElectives)));
  }

  // Snapshot the original prereqs of every IS-elective slot
  courses.forEach(c => {
    if (c.type === 'is-elective') {
      slotOriginalPrereqs[c.id] = [...(c.prereqs || [])];
    }
  });
}

// ── Snapshot current runtime state for save / export ────────────────────────
function getCurrentState() {
  return {
    courses: JSON.parse(JSON.stringify(courses)),
    profs:   JSON.parse(JSON.stringify(profs)),
    ISCAT:   JSON.parse(JSON.stringify(ISCAT)),
  };
}

// ── Apply a saved snapshot back to runtime state ─────────────────────────────
function loadState(data) {
  if (data.courses) courses = JSON.parse(JSON.stringify(data.courses));
  if (data.profs)   profs   = JSON.parse(JSON.stringify(data.profs));

  // Support both key names used by different save paths
  const iscat = data.ISCAT || data.iscat;
  if (iscat) {
    ISCAT.length = 0;
    ISCAT.push(...JSON.parse(JSON.stringify(iscat)));
  }
}

// ── Reset everything to the original catalog layout ──────────────────────────
function resetState() {
  courses = JSON.parse(JSON.stringify(INITIAL_COURSES));
  profs   = JSON.parse(JSON.stringify(INITIAL_PROFS));
  ISCAT.length = 0;
  ISCAT.push(...JSON.parse(JSON.stringify(INITIAL_ISCAT)));
}
