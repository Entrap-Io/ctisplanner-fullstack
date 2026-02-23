// app.js — Main UI logic.
// Depends on (loaded before this): state.js, utils.js, api.js

// ── Constants ────────────────────────────────────────────────────────────────
const SEASONS     = ['Fall','Spring','Fall','Spring','Fall','Spring (Intern.)','Fall','Spring'];
const NUM_SEMS    = 8;
const SW          = 190;   // slot/lane width px
const CW          = 108;   // card width px
const NO_PROF_IDS = [];    // course IDs that intentionally have no professor

const gx = sem => (sem - 1) * SW + 8;

// ── View switching ───────────────────────────────────────────────────────────
let activeView = 'map';

function showView(v) {
  activeView = v;
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(v + '-view').classList.add('active');

  const labels = { map: 'Map', is: 'IS Electives', profs: 'Professors', analytics: 'Analytics' };
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.textContent.includes(labels[v])) b.classList.add('active');
  });

  if (v === 'map')       renderAll();
  if (v === 'is')        renderIS();
  if (v === 'profs')     renderProfs();
  if (v === 'analytics') renderAnalytics();
}

// ── Render: map ──────────────────────────────────────────────────────────────
function autoLayout() { resetState(); renderAll(); toast('Layout reset'); }
function resetLayout() { if (confirm('Reset to default layout?')) autoLayout(); }

function renderAll() {
  const canvas = document.getElementById('canvas');
  canvas.querySelectorAll('.card').forEach(e => e.remove());

  const maxY = courses.reduce((m, c) => Math.max(m, c.y + 80), 700) + 60;
  const W    = NUM_SEMS * SW + 60;
  canvas.style.minWidth  = W    + 'px';
  canvas.style.minHeight = maxY + 'px';

  renderLanes(W, maxY);
  courses.forEach(c => mkCard(c));
  renderArrows();
  updateInfo();
}

function renderLanes(W, H) {
  const el = document.getElementById('slbg');
  el.innerHTML = '';
  el.style.width    = W + 'px';
  el.style.minHeight = H + 'px';
  for (let s = 1; s <= NUM_SEMS; s++) {
    const d = document.createElement('div');
    d.className   = 'slane';
    d.dataset.sem = s;
    d.style.width = SW + 'px';
    d.innerHTML   = `<div class="slane-hdr">
      <div class="slane-n">SEM ${s}</div>
      <div class="slane-s">${SEASONS[s - 1]}</div>
    </div>`;
    el.appendChild(d);
  }
}

const TC = { ctis: 'ct', 'non-ctis': 'nt', 'is-elective': 'it', slot: 'st' };

function mkCard(c) {
  const canvas  = document.getElementById('canvas');
  const showMv  = document.getElementById('chk-mv').checked;
  const moved   = c.sem !== c.origSem && showMv;
  const base    = moved ? 'mv' : (TC[c.type] || 'ct');

  const el = document.createElement('div');
  el.className    = 'card ' + base + (mode !== 'pre' ? ' edit-mode' : '');
  el.id           = 'cd-' + c.id;
  el.dataset.id   = c.id;
  el.style.left   = c.x + 'px';
  el.style.top    = c.y + 'px';

  const assigned  = (c.type === 'slot' || c.type === 'is-elective') && c.slotAssigned
    ? ISCAT.find(x => x.id === c.slotAssigned) : null;
  const displayCode = assigned ? assigned.short : c.short;
  const noProf    = NO_PROF_IDS.includes(c.id);
  const profNames = noProf ? [] : [...new Set((c.sections || []).map(s => s.profId))].map(id => {
    const p = gp(id); return p ? p.name.split(' ').slice(-1)[0] : '';
  }).filter(Boolean);

  el.innerHTML = `
    <div class="cc">${esc(displayCode)}</div>
    ${profNames.length ? `<div class="cp">${esc(profNames.slice(0, 2).join(', '))}</div>` : ''}
    <div class="ci">${c.credits}cr · ${c.ects}E</div>
    ${c.sem !== c.origSem ? `<div class="cm-tag">S${c.origSem}</div><div class="mvdot"></div>` : ''}
  `;

  if (c.type === 'slot' || c.type === 'is-elective') {
    const btn = document.createElement('div');
    btn.className   = 'slot-pick';
    btn.textContent = assigned ? '↺' : 'IS';
    btn.title       = assigned ? 'Change IS Elective' : 'Assign IS Elective';
    btn.onclick     = e => { e.stopPropagation(); openISPick(c.id); };
    el.appendChild(btn);
  }

  el.title = c.code + (assigned ? ' → ' + assigned.name : '');

  el.addEventListener('mousedown', onMD);
  if (mode === 'pre') {
    el.addEventListener('click', e => { e.stopPropagation(); handlePreClick(c.id); });
  } else {
    el.addEventListener('click', e => { if (!didDrag) openCM(c.id); });
    el.addEventListener('contextmenu', onCtx);
  }
  canvas.appendChild(el);
}

function renderArrows() {
  const svg = document.getElementById('asvg');
  svg.querySelectorAll('path').forEach(e => e.remove());
  if (!document.getElementById('chk-arr').checked) return;

  courses.forEach(c => {
    (c.prereqs || []).forEach(pid => {
      const from = courses.find(x => x.id === pid);
      if (!from) return;
      const fx = from.x + CW, fy = from.y + 20;
      const tx = c.x,         ty = c.y  + 20;
      const cx = (fx + tx) / 2;
      const isIS = c.type === 'is-elective';
      const col  = isIS ? 'rgba(168,85,247,.45)' : 'rgba(88,166,255,.32)';
      const mk   = isIS ? 'url(#ah-sel)' : 'url(#ah)';
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d',          `M${fx},${fy} C${cx},${fy} ${cx},${ty} ${tx},${ty}`);
      p.setAttribute('fill',       'none');
      p.setAttribute('stroke',     col);
      p.setAttribute('stroke-width','1.5');
      p.setAttribute('marker-end', mk);
      svg.appendChild(p);
    });
  });
}

function updateInfo() {
  const cr    = courses.reduce((a, c) => a + (c.credits || 0), 0);
  const semCr = computeSemesterCredits();
  const parts = [];
  for (let s = 1; s <= 8; s++) parts.push(`S${s}: ${semCr[s] || 0}cr`);
  document.getElementById('cinfo').textContent =
    `${courses.length} courses · ${cr} total cr · ${parts.join(' · ')}`;
}

// ── Credit helpers ───────────────────────────────────────────────────────────
function computeSemesterCredits() {
  const by = {};
  courses.forEach(c => { const s = c.sem || c.origSem || 1; by[s] = (by[s] || 0) + (c.credits || 0); });
  return by;
}
function computeSemesterECTS() {
  const by = {};
  courses.forEach(c => { const s = c.sem || c.origSem || 1; by[s] = (by[s] || 0) + (c.ects || 0); });
  return by;
}

// ── Section helpers ──────────────────────────────────────────────────────────
function sectionCountsForProf(prof) {
  const result = {};
  const add = arr => arr.forEach(c => {
    if (NO_PROF_IDS.includes(c.id)) return;
    (c.sections || []).forEach(s => {
      if (s.profId !== prof.id) return;
      if (!result[c.id]) result[c.id] = { fall: 0, spring: 0 };
      const fc = s.fallCount ?? 0, sc = s.springCount ?? 0, base = s.count || 0;
      if      (s.sem === 'fall')   result[c.id].fall   += fc || base;
      else if (s.sem === 'spring') result[c.id].spring += sc || base;
      else { result[c.id].fall += fc; result[c.id].spring += sc; }
    });
  });
  add(courses);
  const mapped = new Set(courses.map(c => c.id));
  add(ISCAT.filter(ic => !mapped.has(ic.id)));
  return result;
}
function totalSections(prof) {
  return Object.values(sectionCountsForProf(prof)).reduce((t, v) => t + v.fall + v.spring, 0);
}
function semSections(prof, sem) {
  return Object.values(sectionCountsForProf(prof)).reduce((t, v) => t + (sem === 'fall' ? v.fall : v.spring), 0);
}

// ── Mode ─────────────────────────────────────────────────────────────────────
let mode    = 'edit';
let preFrom = null;
let drag    = null;
let didDrag = false;
let ctxId   = null;
let ispSlotId  = null;
let ispSelected = null;
let sortCols = {};

function setMode(m) {
  mode = m; preFrom = null;
  ['edit', 'pre'].forEach(x => {
    document.getElementById('m-' + x).classList.remove('on', 'edit-on');
  });
  if (m === 'edit') { document.getElementById('m-edit').classList.add('on', 'edit-on'); toast('Edit Layout — drag cards to reposition'); }
  if (m === 'pre')  { document.getElementById('m-pre').classList.add('edit-on');  toast('Prereq Mode — click FROM then TO'); }
  document.getElementById('pre-hint').style.display = m === 'pre' ? 'block' : 'none';
  renderAll();
}

// ── Prereq editing ───────────────────────────────────────────────────────────
function handlePreClick(id) {
  if (!preFrom) {
    preFrom = id;
    const el = document.getElementById('cd-' + id);
    if (el) { el.style.outline = '2px solid var(--amber)'; el.style.outlineOffset = '2px'; }
    toast('FROM ' + (gc(id)?.short || '') + ' — now click TO');
    return;
  }
  if (preFrom === id) { preFrom = null; renderAll(); return; }
  const to = gc(id); if (!to) { preFrom = null; return; }
  const idx = (to.prereqs || []).indexOf(preFrom);
  if (idx >= 0) { to.prereqs.splice(idx, 1); toast('Prerequisite removed'); }
  else          { (to.prereqs = to.prereqs || []).push(preFrom); toast('Prerequisite added'); }
  preFrom = null; renderAll();
}

// ── Drag & drop ──────────────────────────────────────────────────────────────
function onMD(e) {
  if (e.button !== 0 || mode === 'pre') return;
  const id = e.currentTarget.dataset.id;
  const c  = gc(id);
  const el = e.currentTarget;
  const cr = el.getBoundingClientRect();
  drag = { id, c, el, offX: e.clientX - cr.left, offY: e.clientY - cr.top, sx: e.clientX, sy: e.clientY, origSem: c.sem };
  didDrag = false;

  function mm(ev) {
    if (!drag) return;
    if (Math.abs(ev.clientX - drag.sx) < 4 && Math.abs(ev.clientY - drag.sy) < 4 && !didDrag) return;
    if (!didDrag) { ev.preventDefault(); el.classList.add('drag'); }
    didDrag = true;
    const wrap = document.getElementById('cwrap');
    const wr   = wrap.getBoundingClientRect();
    let nx = ev.clientX - wr.left + wrap.scrollLeft - drag.offX;
    let ny = ev.clientY - wr.top  + wrap.scrollTop  - drag.offY;
    nx = Math.max(0,  Math.round(nx / 10) * 10);
    ny = Math.max(30, Math.round(ny / 10) * 10);
    drag.el.style.left = nx + 'px';
    drag.el.style.top  = ny + 'px';
    const ns = Math.min(NUM_SEMS, Math.max(1, Math.floor(nx / SW) + 1));
    drag.c.sem = ns; drag.c.x = nx; drag.c.y = ny;
    document.querySelectorAll('.slane').forEach(l => l.classList.toggle('dhl', +l.dataset.sem === ns));
    renderArrows();
  }

  function mu() {
    if (!drag) return;
    drag.el.classList.remove('drag');
    document.querySelectorAll('.slane').forEach(l => l.classList.remove('dhl'));

    // Swap section fall/spring counts when card crosses odd↔even semester boundary
    if (didDrag && drag.c.sem !== 6 && drag.origSem % 2 !== drag.c.sem % 2) {
      const swap = arr => (arr || []).forEach(s => {
        const tmp = s.fallCount || 0;
        s.fallCount   = s.springCount || 0;
        s.springCount = tmp;
        s.sem = s.fallCount > 0 && s.springCount === 0 ? 'fall'
              : s.springCount > 0 && s.fallCount === 0 ? 'spring' : 'both';
      });
      swap(drag.c.sections);
      if (drag.c.type === 'is-elective' && drag.c.slotAssigned) {
        const isEntry = ISCAT.find(x => x.id === drag.c.slotAssigned);
        const snap    = INITIAL_ISCAT.find(x => x.id === drag.c.slotAssigned);
        if (isEntry && snap) isEntry.sections = JSON.parse(JSON.stringify(snap.sections || []));
        if (isEntry) autoAlignISCourseSections(isEntry, drag.c.sem);
      }
      toast('Section counts swapped for semester change');
    }

    const wasDrag = didDrag;
    drag = null; setTimeout(() => didDrag = false, 50);
    if (wasDrag) {
      renderAll();
      if (activeView === 'analytics') renderAnalytics();
      if (activeView === 'profs')     renderProfs();
    }
    document.removeEventListener('mousemove', mm);
    document.removeEventListener('mouseup',   mu);
  }

  document.addEventListener('mousemove', mm);
  document.addEventListener('mouseup',   mu);
}

// ── Context menu ─────────────────────────────────────────────────────────────
function onCtx(e) {
  e.preventDefault(); e.stopPropagation();
  ctxId = e.currentTarget.dataset.id;
  const c = gc(ctxId);
  const m = document.getElementById('ctxm');
  document.getElementById('ctx-mkis').style.display = c?.type === 'is-elective' ? 'none' : 'flex';
  document.getElementById('ctx-rmis').style.display = c?.type === 'is-elective' ? 'flex' : 'none';
  m.style.display = 'block';
  m.style.left    = e.clientX + 'px';
  m.style.top     = e.clientY + 'px';
  document.addEventListener('click', () => m.style.display = 'none', { once: true });
}
function ctxEdit() { if (ctxId) openCM(ctxId); }
function ctxMkIS() {
  const c = gc(ctxId); if (!c || c.type === 'is-elective') return;
  if (c._origSem == null) c._origSem = c.origSem;
  c._savedType   = c.type;
  c.type         = 'is-elective';
  c.slotAssigned = null;

  // Add to IS catalog if not already there
  if (!ISCAT.find(x => x.id === c.id)) {
    const entry = JSON.parse(JSON.stringify(c));
    ISCAT.push(entry);
    INITIAL_ISCAT.push(JSON.parse(JSON.stringify(entry))); // ← this line
  }

  renderAll(); toast('Made IS Elective');
}
function ctxRmIS() {
  const c = gc(ctxId); if (!c) return;
  c.type = c._savedType || 'ctis';
  c.slotAssigned = null;
  if (c._origSem != null) { c.origSem = c._origSem; c.sem = c._origSem; }
  renderAll(); toast('IS status removed');
}
function ctxDel() { if (ctxId) deleteCourse(ctxId); }

// ── Course modal ─────────────────────────────────────────────────────────────
function openCM(id) {
  const c = gc(id); if (!c) return;
  document.getElementById('cm-t').textContent = c.code || 'New Course';
  const b = document.getElementById('cm-body');
  b.innerHTML = `
    <div class="form-row"><label>Code</label><input id="cm-code" value="${esc(c.code || '')}"></div>
    <div class="form-row"><label>Short</label><input id="cm-short" value="${esc(c.short || '')}"></div>
    <div class="form-row"><label>Name</label><input id="cm-name" value="${esc(c.name || '')}"></div>
    <div class="form-2col">
      <div class="form-row"><label>Credits</label><input id="cm-cr" type="number" value="${c.credits || 0}"></div>
      <div class="form-row"><label>ECTS</label><input id="cm-ects" type="number" step="0.5" value="${c.ects || 0}"></div>
    </div>
    <div class="form-row"><label>Type</label><select id="cm-type">
      <option value="ctis"        ${c.type === 'ctis'         ? 'selected' : ''}>CTIS</option>
      <option value="non-ctis"    ${c.type === 'non-ctis'     ? 'selected' : ''}>Non-CTIS</option>
      <option value="slot"        ${c.type === 'slot'         ? 'selected' : ''}>Elective Slot</option>
      <option value="is-elective" ${c.type === 'is-elective'  ? 'selected' : ''}>IS Elective Slot</option>
    </select></div>
    <div class="form-row"><label>Offered</label><select id="cm-off">
      <option value="both"   ${c.offered === 'both'   ? 'selected' : ''}>Both</option>
      <option value="fall"   ${c.offered === 'fall'   ? 'selected' : ''}>Fall</option>
      <option value="spring" ${c.offered === 'spring' ? 'selected' : ''}>Spring</option>
    </select></div>
    <div class="form-row"><label>Notes</label><textarea id="cm-notes">${esc(c.notes || '')}</textarea></div>
    <div class="form-row"><label>Prerequisites</label>
      <div class="prereq-chips" id="cm-prereqs">
        ${(c.prereqs || []).map(pid => {
          const pc = gc(pid);
          return `<div class="prereq-chip">${esc(pc ? pc.short : pid)}<button onclick="removePre('${pid}')">&times;</button></div>`;
        }).join('')}
      </div>
      <select id="cm-pre-add" style="margin-top:6px;width:100%">
        <option value="">+ Add prerequisite</option>
        ${courses.filter(x => x.id !== c.id).map(x => `<option value="${x.id}">${esc(x.code)}</option>`).join('')}
      </select>
    </div>
    <div class="form-row"><label>Sections</label>
      <div class="sections-list" id="cm-secs">
        ${(c.sections || []).map((s, i) => {
          const fc = s.fallCount  !== undefined ? s.fallCount  : (s.sem === 'fall'   || s.sem === 'both' ? s.count || 0 : 0);
          const sc = s.springCount !== undefined ? s.springCount : (s.sem === 'spring' || s.sem === 'both' ? s.count || 0 : 0);
          return `<div class="section-row">
            <select class="sec-prof" data-idx="${i}">
              <option value="">No Prof</option>
              ${profs.map(p => `<option value="${p.id}" ${s.profId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
            </select>
            <div class="sec-sem-pair"><label>Fall</label>
              <input type="number" class="sec-fall" data-idx="${i}" value="${fc}" min="0">
            </div>
            <div class="sec-sem-pair"><label>Spring</label>
              <input type="number" class="sec-spring" data-idx="${i}" value="${sc}" min="0">
            </div>
            <button class="btn xs danger" onclick="removeSec(${i})" style="width:28px;padding:2px;align-self:center">×</button>
          </div>`;
        }).join('')}
      </div>
      <button class="btn xs" onclick="addSec()" style="margin-top:6px">+ Section</button>
    </div>`;

  document.getElementById('cm-pre-add').onchange = function () {
    if (!this.value) return;
    (c.prereqs = c.prereqs || []);
    if (!c.prereqs.includes(this.value)) c.prereqs.push(this.value);
    openCM(id);
  };

  document.getElementById('cm-foot').innerHTML = `
    <button class="btn danger" onclick="deleteCourse('${c.id}')">Delete</button>
    ${c.type === 'ctis' ? `<button class="btn" onclick="convertToISCat('${c.id}')" style="margin-left:6px">→ IS Catalog</button>` : ''}
    <div style="flex:1"></div>
    <button class="btn" onclick="hideCM()">Cancel</button>
    <button class="btn primary" onclick="saveCM('${c.id}')">Save</button>`;

  document.getElementById('cm').dataset.cid = c.id;
  openModal('cm');
}

function hideCM() { closeModal('cm'); }

function removePre(pid) {
  const cid = document.getElementById('cm').dataset.cid;
  const c   = gc(cid); if (!c) return;
  c.prereqs = (c.prereqs || []).filter(x => x !== pid);
  openCM(c.id);
}
function addSec() {
  const c = gc(document.getElementById('cm').dataset.cid); if (!c) return;
  (c.sections = c.sections || []).push({ profId: '', fallCount: 1, springCount: 0 });
  openCM(c.id);
}
function removeSec(i) {
  const c = gc(document.getElementById('cm').dataset.cid); if (!c) return;
  c.sections.splice(i, 1); openCM(c.id);
}

function saveCM(id) {
  const c = gc(id); if (!c) return;
  const isISCAT = !!ISCAT.find(x => x.id === id);

  c.code    = document.getElementById('cm-code').value.trim();
  c.short   = document.getElementById('cm-short').value.trim();
  c.name    = document.getElementById('cm-name').value.trim();
  c.credits = +document.getElementById('cm-cr').value || 0;
  c.ects    = +document.getElementById('cm-ects').value || 0;
  if (!isISCAT) {
    c.type    = document.getElementById('cm-type').value;
    c.offered = document.getElementById('cm-off').value;
    c.notes   = document.getElementById('cm-notes').value.trim();
  }

  c.sections = [];
  document.querySelectorAll('.sec-prof').forEach((el, i) => {
    const profId      = el.value;
    const fallCount   = +document.querySelector(`.sec-fall[data-idx="${i}"]`).value   || 0;
    const springCount = +document.querySelector(`.sec-spring[data-idx="${i}"]`).value || 0;
    if (!profId) return;
    const sem = fallCount > 0 && springCount === 0 ? 'fall'
              : springCount > 0 && fallCount === 0 ? 'spring' : 'both';
    c.sections.push({ profId, sem, fallCount, springCount });
  });

  hideCM(); renderAll(); updateInfo(); renderAnalytics();
  if (isISCAT) renderIS();
  toast('Saved');
}

function newCourse() {
  const nc = {
    origSem: 1, id: uid(), code: '', short: '', name: '',
    credits: 3, ects: 5, sem: 1, type: 'ctis', offered: 'both',
    prereqs: [], sections: [], notes: '', slotAssigned: null, x: 10, y: 100
  };
  courses.push(nc);
  openCM(nc.id);
}

function deleteCourse(id) {
  if (!confirm('Delete this course?')) return;
  courses = courses.filter(c => c.id !== id);
  courses.forEach(c => c.prereqs = (c.prereqs || []).filter(p => p !== id));
  hideCM(); renderAll(); updateInfo(); renderAnalytics();
  toast('Course deleted');
}

function convertToISCat(id) {
  const c = courses.find(x => x.id === id); if (!c) return;
  if (!confirm(`Move "${c.name}" to IS Elective Catalog?`)) return;
  if (c._origSem == null) c._origSem = c.origSem;
  const prereqCodes = (c.prereqs || []).map(pid => { const pc = gc(pid); return pc ? pc.code : pid; }).join(', ');
  const existing = ISCAT.find(x => x.id === id);
  if (existing) {
    Object.assign(existing, { code: c.code, short: c.short, name: c.name, credits: c.credits, ects: c.ects,
      _origSem: c._origSem, origSem: c.origSem, prereqCodes, prereqs: [...(c.prereqs || [])],
      sections: JSON.parse(JSON.stringify(c.sections || [])) });
    const snap = INITIAL_ISCAT.find(x => x.id === id); // ← mirror update to snapshot
    if (snap) Object.assign(snap, JSON.parse(JSON.stringify(existing)));
  } else {
    const entry = { id: c.id, _origSem: c._origSem, origSem: c.origSem, code: c.code, short: c.short,
      name: c.name, credits: c.credits, ects: c.ects, prereqCodes,
      prereqs: [...(c.prereqs || [])], sections: JSON.parse(JSON.stringify(c.sections || [])) };
    ISCAT.push(entry);
    INITIAL_ISCAT.push(JSON.parse(JSON.stringify(entry))); // ← mirror push to snapshot
  }
  courses = courses.filter(x => x.id !== id);
  courses.forEach(x => x.prereqs = (x.prereqs || []).filter(p => p !== id));
  hideCM(); renderAll(); renderIS(); renderAnalytics();
  toast(c.code + ' moved to IS Catalog');
}

// ── IS Elective Slot picker ──────────────────────────────────────────────────
function openISPick(slotId) {
  ispSlotId = slotId; ispSelected = null;
  document.getElementById('isp-search').value = '';
  const grid = document.getElementById('is-pick-grid');
  grid.innerHTML = '';
  INITIAL_ISCAT.forEach(c => {
    const div = document.createElement('div');
    div.className = 'is-item'; div.dataset.id = c.id;
    div.innerHTML = `<div class="is-code">${esc(c.code)}</div>
      <div class="is-name">${esc(c.name)}</div>
      <div class="is-cr">${c.credits} cr · ${c.ects} ECTS</div>`;
    div.onclick = () => {
      ispSelected = c.id;
      document.querySelectorAll('.is-item').forEach(x => x.classList.remove('selected'));
      div.classList.add('selected');
    };
    grid.appendChild(div);
  });
  openModal('is-pick-modal');
}

function filterISPick() {
  const q = document.getElementById('isp-search').value.toLowerCase();
  document.querySelectorAll('#is-pick-grid .is-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function applyISPrereqsToSlot(slot, isCourse) {
  if (!isCourse.prereqCodes) { slot.prereqs = []; return; }
  const ids = [];
  isCourse.prereqCodes.split(',').map(s => s.trim()).filter(Boolean).forEach(cs => {
    cs.split(/OR/i).map(s => s.trim()).forEach(part => {
      const found = courses.find(c => c.code === part.replace(/\s+/g, ' '));
      if (found) ids.push(found.id);
    });
  });
  slot.prereqs = [...new Set(ids)];
}

function autoAlignISCourseSections(isCourse, slotSem) {
  const secs = isCourse.sections || []; if (!secs.length) return;
  const tf = secs.reduce((a, s) => a + (s.fallCount || 0), 0);
  const ts = secs.reduce((a, s) => a + (s.springCount || 0), 0);
  if (tf === ts || (tf > ts) === (slotSem % 2 === 1)) return;
  secs.forEach(s => {
    const tmp = s.fallCount || 0; s.fallCount = s.springCount || 0; s.springCount = tmp;
    s.sem = s.fallCount > 0 && s.springCount === 0 ? 'fall'
          : s.springCount > 0 && s.fallCount === 0 ? 'spring' : 'both';
  });
}

function confirmISPick() {
  if (!ispSlotId || !ispSelected) { toast('Please select an elective', 'err'); return; }
  const slot = gc(ispSlotId); if (!slot) return;
  let is = ISCAT.find(x => x.id === ispSelected);
  if (!is) {
    const snap = INITIAL_ISCAT.find(x => x.id === ispSelected);
    if (!snap) return;
    is = JSON.parse(JSON.stringify(snap));
    ISCAT.push(is);
  }
  const snap = INITIAL_ISCAT.find(x => x.id === ispSelected);
  if (snap) is.sections = JSON.parse(JSON.stringify(snap.sections || []));
  autoAlignISCourseSections(is, slot.sem);
  slot.slotAssigned = is.id;
  applyISPrereqsToSlot(slot, is);
  closeModal('is-pick-modal'); renderAll(); renderAnalytics(); renderIS();
}

function clearSlot() {
  const slot = gc(ispSlotId); if (!slot) return;
  if (slot.slotAssigned) {
    const is   = ISCAT.find(x => x.id === slot.slotAssigned);
    const snap = INITIAL_ISCAT.find(x => x.id === slot.slotAssigned);
    if (is && snap) is.sections = JSON.parse(JSON.stringify(snap.sections || []));
  }
  slot.slotAssigned = null;
  slot.prereqs = [...(slotOriginalPrereqs[slot.id] || [])];
  closeModal('is-pick-modal'); renderAll(); renderAnalytics(); renderIS();
  toast('Slot cleared');
}

function clearSlotById(slotId) {
  const slot = courses.find(x => x.id === slotId); if (!slot) return;
  if (slot.slotAssigned) {
    const is   = ISCAT.find(x => x.id === slot.slotAssigned);
    const snap = INITIAL_ISCAT.find(x => x.id === slot.slotAssigned);
    if (is && snap) is.sections = JSON.parse(JSON.stringify(snap.sections || []));
  }
  slot.slotAssigned = null;
  slot.prereqs = [...(slotOriginalPrereqs[slot.id] || [])];
  renderAll(); renderAnalytics(); renderIS(); toast('Slot cleared');
}

// ── IS View ──────────────────────────────────────────────────────────────────
function renderIS() {
  // Catalog panel
  const list = document.getElementById('is-cat-list');
  list.innerHTML = '';
  if (!ISCAT.length) {
    list.innerHTML = '<p style="color:var(--muted);font-size:12px;padding:10px">All IS courses are on the map.</p>';
  }
  ISCAT.forEach(c => {
    const profsStr = [...new Set((c.sections || []).map(s => profName(s.profId)))].join(', ') || 'Unassigned';
    const div = document.createElement('div');
    div.className = 'is-cat-item';
    div.innerHTML = `<div style="flex:1">
        <span class="is-cat-code">${esc(c.code)}</span>
        <div class="is-cat-name">${esc(c.name)}</div>
        <div class="is-cat-meta">${c.credits}cr ${c.ects}E · ${esc(profsStr)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0">
        <button class="btn xs grn" onclick="mapISAsNormal('${c.id}')">Map</button>
        <button class="btn xs"     onclick="openISCM('${c.id}')">Edit</button>
      </div>`;
    list.appendChild(div);
  });

  // Slots panel
  const body  = document.getElementById('is-slots-body');
  body.innerHTML = '';
  const slots = courses.filter(c => c.type === 'is-elective');
  if (!slots.length) {
    body.innerHTML = '<p style="color:var(--muted);font-size:12px">No IS Elective slots on the map.</p>';
  }
  slots.forEach(c => {
    const assigned = c.slotAssigned ? (ISCAT.find(x => x.id === c.slotAssigned) || courses.find(x => x.id === c.slotAssigned)) : null;
    const div = document.createElement('div');
    div.className = 'is-slot-card' + (assigned ? ' filled' : '');
    div.innerHTML = `<div class="is-slot-title">IS Slot · Sem ${c.sem} — ${esc(c.code)}</div>
      <div class="is-slot-content">
        ${assigned
          ? `<div><div class="is-slot-course-code">${esc(assigned.code)}</div><div class="is-slot-course-name">${esc(assigned.name)}</div></div>
             <button class="btn xs danger" onclick="clearSlotById('${c.id}')">Clear</button>`
          : `<div class="is-slot-empty">Empty — click to assign</div>
             <button class="btn xs amb" onclick="openISPick('${c.id}')">Assign</button>`
        }
      </div>`;
    body.appendChild(div);
  });
}
function renderISView() { renderIS(); } // alias used by handleFileLoad

function openISCM(id) {
  const c = ISCAT.find(x => x.id === id); if (!c) return;
  document.getElementById('cm-t').textContent = 'Edit IS Elective';
  document.getElementById('cm-body').innerHTML = `
    <div class="form-row"><label>Code</label><input id="cm-code" value="${esc(c.code || '')}"></div>
    <div class="form-row"><label>Short</label><input id="cm-short" value="${esc(c.short || '')}"></div>
    <div class="form-row"><label>Name</label><input id="cm-name" value="${esc(c.name || '')}"></div>
    <div class="form-2col">
      <div class="form-row"><label>Credits</label><input id="cm-cr" type="number" value="${c.credits || 0}"></div>
      <div class="form-row"><label>ECTS</label><input id="cm-ects" type="number" step="0.5" value="${c.ects || 0}"></div>
    </div>
    <div class="form-row"><label>Sections</label>
      <div class="sections-list">
        ${(c.sections || []).map((s, i) => {
          const fc = s.fallCount  !== undefined ? s.fallCount  : (s.sem === 'fall'   || s.sem === 'both' ? s.count || 0 : 0);
          const sc = s.springCount !== undefined ? s.springCount : (s.sem === 'spring' || s.sem === 'both' ? s.count || 0 : 0);
          return `<div class="section-row">
            <select class="sec-prof" data-idx="${i}">
              <option value="">No Prof</option>
              ${profs.map(p => `<option value="${p.id}" ${s.profId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
            </select>
            <div class="sec-sem-pair"><label>Fall</label><input type="number" class="sec-fall" data-idx="${i}" value="${fc}" min="0"></div>
            <div class="sec-sem-pair"><label>Spring</label><input type="number" class="sec-spring" data-idx="${i}" value="${sc}" min="0"></div>
            <button class="btn xs danger" onclick="removeISCMSec(${i},'${id}')" style="width:28px;padding:2px;align-self:center">×</button>
          </div>`;
        }).join('')}
      </div>
      <button class="btn xs" onclick="addISCMSec('${id}')" style="margin-top:6px">+ Section</button>
    </div>`;
  document.getElementById('cm-foot').innerHTML = `
    <div style="flex:1"></div>
    <button class="btn" onclick="hideCM()">Cancel</button>
    <button class="btn primary" onclick="saveCM('${id}')">Save</button>`;
  document.getElementById('cm').dataset.cid = id;
  openModal('cm');
}
function addISCMSec(id) {
  const c = ISCAT.find(x => x.id === id); if (!c) return;
  (c.sections = c.sections || []).push({ profId: '', fallCount: 1, springCount: 0 }); openISCM(id);
}
function removeISCMSec(i, id) {
  const c = ISCAT.find(x => x.id === id); if (!c) return;
  c.sections.splice(i, 1); openISCM(id);
}

function mapISAsNormal(isId) {
  const is = ISCAT.find(x => x.id === isId); if (!is) return;
  if (courses.find(x => x.id === is.id || x.code === is.code)) { toast(is.code + ' already on map', 'err'); return; }
  const origSem = is._origSem || is.origSem || INITIAL_COURSES.find(x => x.id === is.id)?._origSem || 7;
  const snap    = INITIAL_ISCAT.find(x => x.id === isId);
  const prereqIds = [];
  (is.prereqCodes || '').split(',').map(s => s.trim()).filter(Boolean).forEach(cs => {
    for (const part of cs.split(' OR ').map(s => s.trim())) {
      const found = courses.find(cc => cc.code === part);
      if (found) { prereqIds.push(found.id); break; }
    }
  });
  courses.push({
    origSem, _origSem: origSem, id: is.id, code: is.code, short: is.short, name: is.name,
    credits: is.credits, ects: is.ects, sem: origSem, type: 'ctis', offered: 'both',
    prereqs: [...new Set(prereqIds)], slotAssigned: null, notes: '',
    sections: JSON.parse(JSON.stringify(snap?.sections || is.sections || [])),
    x: gx(origSem) + 10, y: 260
  });
  ISCAT.splice(ISCAT.indexOf(is), 1);
  renderAll(); renderIS(); renderAnalytics();
  toast(is.code + ' mapped (Sem ' + origSem + ')', 'ok');
}

// ── Professors ───────────────────────────────────────────────────────────────
function renderProfs() {
  const grid = document.getElementById('prof-grid');
  grid.innerHTML = '';
  profs.forEach(p => {
    const tot    = totalSections(p);
    const fall   = semSections(p, 'fall');
    const spring = semSections(p, 'spring');
    const anyRed = tot > 8 || fall > 5 || spring > 5;
    const div = document.createElement('div');
    div.className = 'prof-card' + (anyRed ? ' wl-over' : '');
    div.innerHTML = `
      <div class="prof-card-hdr" onclick="toggleProfCourses('${p.id}')">
        <div class="prof-avatar">${initials(p.name)}</div>
        <div><div class="prof-name">${esc(p.name)}</div><div class="prof-dept">${esc(p.dept)}</div></div>
        <div class="prof-stats">
          <div><div class="prof-stat-val${tot > 8 ? ' st-red' : ''}">${tot}</div><div class="prof-stat-lbl">Total</div></div>
          <div><div class="prof-stat-val${fall > 5 ? ' st-red' : ''}">${fall}</div><div class="prof-stat-lbl">Fall</div></div>
          <div><div class="prof-stat-val${spring > 5 ? ' st-red' : ''}">${spring}</div><div class="prof-stat-lbl">Spring</div></div>
        </div>
        <button class="btn xs danger" onclick="event.stopPropagation();deleteProf('${p.id}')" style="margin-left:8px;flex-shrink:0">✕</button>
      </div>
      <div class="prof-courses" id="pc-${p.id}"></div>`;
    grid.appendChild(div);
    const pc = document.getElementById('pc-' + p.id);
    const rows = [];
    courses.forEach(c => (c.sections || []).forEach(s => { if (s.profId === p.id) rows.push({ code: c.short, name: c.name, sem: s.sem }); }));
    ISCAT.forEach(c => (c.sections || []).forEach(s => { if (s.profId === p.id) rows.push({ code: c.short, name: c.name, sem: s.sem }); }));
    rows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'prof-course-row';
      row.innerHTML = `<div class="pcr-code">${esc(r.code)}</div><div class="pcr-name">${esc(r.name)}</div><div class="pcr-sem">${esc(r.sem)}</div>`;
      pc.appendChild(row);
    });
  });
}
function toggleProfCourses(id) {
  document.getElementById('pc-' + id)?.classList.toggle('open');
}
function deleteProf(id) {
  const p = gp(id); if (!p) return;
  let count = 0;
  courses.forEach(c => (c.sections || []).forEach(s => { if (s.profId === id) count++; }));
  ISCAT.forEach(c   => (c.sections || []).forEach(s => { if (s.profId === id) count++; }));
  if (!confirm(count > 0
    ? `"${p.name}" has ${count} section(s). Deleting will unassign them. Continue?`
    : `Delete "${p.name}"?`)) return;
  profs = profs.filter(x => x.id !== id);
  courses.forEach(c => (c.sections || []).forEach(s => { if (s.profId === id) s.profId = ''; }));
  ISCAT.forEach(c   => (c.sections || []).forEach(s => { if (s.profId === id) s.profId = ''; }));
  renderProfs(); renderAnalytics(); toast(p.name + ' deleted');
}
function showAddProf() {
  document.getElementById('pm-n').value = '';
  document.getElementById('pm-d').value = 'CTIS';
  openModal('pm');
}
function saveProf() {
  const n = document.getElementById('pm-n').value.trim();
  const d = document.getElementById('pm-d').value.trim() || 'CTIS';
  if (!n) { toast('Name required', 'err'); return; }
  profs.push({ id: uid(), name: n, dept: d });
  closeModal('pm'); renderProfs(); renderAnalytics();
}

// ── Analytics ────────────────────────────────────────────────────────────────
function showATab(key, btn) {
  document.querySelectorAll('.a-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.analytics-section').forEach(s => s.classList.remove('active'));
  document.getElementById('at-' + key).classList.add('active');
}

function renderAnalytics() {
  renderOverviewAnalytics();
  renderCourseAnalytics();
  renderWorkloadAnalytics();
  renderPrereqAnalytics();
  renderCreditAnalytics();
  renderISElectiveAnalytics();
}

function renderOverviewAnalytics() {
  const semCr = computeSemesterCredits();
  document.getElementById('at-overview').innerHTML = `
    <div class="stat-row">
      <div class="stat-card"><div class="val">${courses.length}</div><div class="lbl">Courses on Map</div></div>
      <div class="stat-card"><div class="val">${courses.filter(c => c.type === 'ctis').length}</div><div class="lbl">CTIS</div></div>
      <div class="stat-card"><div class="val">${courses.filter(c => c.type === 'non-ctis').length}</div><div class="lbl">Non-CTIS</div></div>
      <div class="stat-card"><div class="val">${courses.filter(c => c.type === 'slot' || c.type === 'is-elective').length}</div><div class="lbl">Slots & IS EL</div></div>
      <div class="stat-card"><div class="val">${profs.length}</div><div class="lbl">Professors</div></div>
      <div class="stat-card"><div class="val">${ISCAT.length}</div><div class="lbl">IS Electives</div></div>
    </div>
    <div class="stat-row">
      ${[1,2,3,4,5,6,7,8].map(s => `<div class="stat-card"><div class="val">${semCr[s]||0}</div><div class="lbl">Sem ${s} cr</div></div>`).join('')}
    </div>`;
}

function renderCourseAnalytics() {
  document.getElementById('at-courses').innerHTML = `
    <table class="data-table"><thead><tr>
      <th onclick="sortTable('at-courses','code')">Code<span class="si">▲</span></th>
      <th onclick="sortTable('at-courses','name')">Name<span class="si">▲</span></th>
      <th onclick="sortTable('at-courses','sem')">Sem<span class="si">▲</span></th>
      <th onclick="sortTable('at-courses','credits')">Cr<span class="si">▲</span></th>
      <th>Type</th><th>Offered</th>
    </tr></thead><tbody>
      ${courses.map(c => `<tr data-code="${esc(c.code)}" data-name="${esc(c.name)}" data-sem="${c.sem}" data-credits="${c.credits}">
        <td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${c.sem}</td><td>${c.credits}</td>
        <td><span class="badge ${c.type === 'ctis' ? 'ctis' : c.type === 'non-ctis' ? 'non' : c.type === 'is-elective' ? 'is' : 'slot'}">${esc(c.type)}</span></td>
        <td><span class="badge ${c.offered}">${esc(c.offered || '')}</span></td>
      </tr>`).join('')}
    </tbody></table>`;
}

function renderWorkloadAnalytics() {
  document.getElementById('at-workload').innerHTML = `
    <table class="data-table"><thead><tr>
      <th onclick="sortTable('at-workload','name')">Professor<span class="si">▲</span></th>
      <th onclick="sortTable('at-workload','tot')">Total<span class="si">▲</span></th>
      <th onclick="sortTable('at-workload','fall')">Fall<span class="si">▲</span></th>
      <th onclick="sortTable('at-workload','spring')">Spring<span class="si">▲</span></th>
    </tr></thead><tbody>
      ${profs.map(p => {
        const tot = totalSections(p), fall = semSections(p,'fall'), spring = semSections(p,'spring');
        return `<tr data-name="${esc(p.name)}" data-tot="${tot}" data-fall="${fall}" data-spring="${spring}"
            ${(tot>8||fall>5||spring>5)?'style="background:rgba(239,68,68,.07)"':''}>
          <td>${esc(p.name)}</td>
          <td style="${tot>8?'color:var(--red);font-weight:700':''}">${tot}</td>
          <td style="${fall>5?'color:var(--red);font-weight:700':''}">${fall}</td>
          <td style="${spring>5?'color:var(--red);font-weight:700':''}">${spring}</td>
        </tr>`;
      }).join('')}
    </tbody></table>`;
}

function renderPrereqAnalytics() {
  document.getElementById('at-prereqs').innerHTML = `
    <table class="data-table"><thead><tr>
      <th>Course</th>
      <th onclick="sortTable('at-prereqs','count')">Prereq count<span class="si">▲</span></th>
    </tr></thead><tbody>
      ${courses.map(c => `<tr data-count="${(c.prereqs||[]).length}">
        <td>${esc(c.code)} — ${esc(c.name)}</td><td>${(c.prereqs||[]).length}</td>
      </tr>`).join('')}
    </tbody></table>`;
}

function renderCreditAnalytics() {
  const semCr = computeSemesterCredits(), semEcts = computeSemesterECTS();
  let totalCr = 0, totalEcts = 0;
  for (let s = 1; s <= 8; s++) { totalCr += semCr[s] || 0; totalEcts += semEcts[s] || 0; }
  document.getElementById('at-credits').innerHTML = `
    <h3 style="margin-bottom:12px">Credit & ECTS Distribution by Semester</h3>
    <table class="data-table"><thead><tr><th>Semester</th><th>Credits</th><th>ECTS</th></tr></thead><tbody>
      ${Array.from({length:8},(_,i)=>`<tr><td>Semester ${i+1}</td><td>${semCr[i+1]||0}</td><td>${semEcts[i+1]||0}</td></tr>`).join('')}
      <tr><td><strong>Total</strong></td><td><strong>${totalCr}</strong></td><td><strong>${totalEcts}</strong></td></tr>
    </tbody></table>`;
}

function renderISElectiveAnalytics() {
  const slots    = courses.filter(c => c.type === 'is-elective');
  const filled   = slots.filter(s => s.slotAssigned);
  document.getElementById('at-isel').innerHTML = `
    <div class="stat-row">
      <div class="stat-card"><div class="val">${filled.length}/${slots.length}</div><div class="lbl">IS slots filled</div></div>
    </div>
    <table class="data-table"><thead><tr><th>Slot</th><th>IS Course</th><th>Semester</th></tr></thead><tbody>
      ${slots.map(s => {
        const is = s.slotAssigned ? ISCAT.find(x => x.id === s.slotAssigned) : null;
        return `<tr><td>${esc(s.code)}</td><td>${is ? esc(is.code) + ' — ' + esc(is.name) : '<i>Not assigned</i>'}</td><td>${s.sem}</td></tr>`;
      }).join('')}
    </tbody></table>`;
}

function sortTable(sectionId, col) {
  const sec   = document.getElementById(sectionId);
  const tbody = sec.querySelector('tbody'); if (!tbody) return;
  const state = sortCols[sectionId] || { col: null, dir: 1 };
  const dir   = state.col === col ? -state.dir : 1;
  sortCols[sectionId] = { col, dir };
  const rows  = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const va = a.dataset[col] ?? '', vb = b.dataset[col] ?? '';
    const na = parseFloat(va), nb = parseFloat(vb);
    return !isNaN(na) && !isNaN(nb) ? dir * (na - nb) : dir * va.localeCompare(vb);
  });
  rows.forEach(r => tbody.appendChild(r));
}

// ── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── File I/O ─────────────────────────────────────────────────────────────────
function triggerJSONLoad() { document.getElementById('file-input').click(); }

function handleFileLoad(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      loadState(JSON.parse(ev.target.result));
      renderAll(); renderAnalytics(); renderProfs(); renderISView(); updateInfo();
      toast('JSON imported');
    } catch (err) { console.error(err); toast('Invalid JSON', 'err'); }
  };
  r.readAsText(file);
}

function doExport() {
  const blob = new Blob([JSON.stringify(getCurrentState(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ctisplanner-${Date.now()}.json`;
  a.click();
  toast('Exported');
}

// ── Save / Load (via api.js) ──────────────────────────────────────────────────
function showSave() {
  document.getElementById('slm-t').textContent = 'Save Layout';
  document.getElementById('slm-b').innerHTML = `
    <div class="form-row">
      <label>Your Name</label>
      <input id="save-by" placeholder="Anonymous" value="${localStorage.getItem('ctis_saved_by') || ''}">
    </div>
    <div class="form-row">
      <label>Layout Name</label>
      <input id="save-name" placeholder="My Layout" value="Layout ${new Date().toLocaleString()}">
    </div>
    <button class="btn primary" onclick="doSave()" style="margin-top:10px">Save</button>`;
  openModal('slm');
}

async function doSave() {
  const name     = document.getElementById('save-name').value || 'Unnamed Layout';
  const saved_by = document.getElementById('save-by').value.trim() || 'Anonymous';
  localStorage.setItem('ctis_saved_by', saved_by);
  const state = getCurrentState();
  const result = await saveNamedLayout(name, saved_by, state);
  if (result) closeModal('slm');
}

function showLoad() {
  document.getElementById('slm-t').textContent = 'Load Layout';
  document.getElementById('slm-b').innerHTML   = '<p style="color:var(--muted);font-size:12px">Loading…</p>';
  openModal('slm');
  loadAllLayouts();
}

async function loadAllLayouts() {
  const layouts = await getAllSavedLayouts();           // api.js
  let html = '<div class="saves">';
  if (layouts.length) {
    layouts.forEach(l => {
      html += `<div class="svi">
        <div style="flex:1">
          <div class="svi-n">${esc(l.saved_by ? l.saved_by + ' — ' + l.name : l.name)}</div>
          <div class="svi-d">${new Date(l.saved_at || l.savedAt).toLocaleString()}</div>
        </div>
        <button class="btn sm" onclick="loadLayoutById('${l.id}')">Load</button>
        <button class="btn sm danger" onclick="deleteLayoutById('${l.id}')">Delete</button>
      </div>`;
    });
  } else {
    html += '<p style="color:var(--muted)">No saved layouts yet.</p>';
  }
  html += '</div>';
  document.getElementById('slm-b').innerHTML = html;
}

async function loadLayoutById(id){
  const layout = await loadSpecificLayout(id);
  if(layout){
    const data = layout.state || layout;  // ← unwrap if nested
    loadState(data);
    renderAll();
    closeModal('slm');
  }
}

async function deleteLayoutById(id) {
  if (!confirm('Delete this layout?')) return;
  await deleteLayout(id);                              // api.js
  loadAllLayouts();
}

// ── Auto-save every 60 s ─────────────────────────────────────────────────────
setInterval(() => {
  if (window._catalogLoaded && typeof saveLayoutToBackend === 'function') {
      saveLayoutToBackend(getCurrentState()); // api.js — silent, no toast
  }
}, 60000);

// ── Boot ─────────────────────────────────────────────────────────────────────
async function initializeApp() {
  const catalog = await fetchCatalog();                // api.js → GET /api/catalog
  if (!catalog) {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;
      font-family:system-ui;color:#ef4444;font-size:14px;background:#0d0f14">
      ⚠ Failed to load catalog from server.<br>Make sure the backend is running on port 3000.
    </div>`;
    return;
  }

  initializeState(catalog);   // state.js — sets courses / profs / ISCAT / INITIAL_* / slotOriginalPrereqs
  window._catalogLoaded = true;

  // Try to restore the last auto-saved session if function exists
  if (typeof loadLayoutFromBackend === 'function') {
    try {
      const saved = await loadLayoutFromBackend();
      if (saved) { loadState(saved); toast('Session restored', 'ok'); }
    } catch (e) {
      console.warn('Auto-restore failed:', e);
    }
  }

  showView('map');
}

document.addEventListener('DOMContentLoaded', initializeApp);
