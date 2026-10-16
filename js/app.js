/* ==========================================================================
   ARJUN SINGH — FACILITIES MANAGEMENT PORTFOLIO & MANAGEMENT PLATFORM
   CORE APPLICATION ENGINE (js/app.js)

   Contains application state, DOM controllers, UI rendering engines,
   CRUD forms, Super Admin CMS Dashboard, exports, and event handlers.
   ========================================================================== */
'use strict';

/* ==========================================================================
   Resilient Third-Party Library Loader (Chart.js, FullCalendar, jsPDF, etc.)
   ========================================================================== */
/* ==========================================================================
   Resilient third-party loader.
   Chart.js, FullCalendar, jsPDF, SheetJS and QRCode are loaded from a primary
   CDN with automatic mirror fallback. Every feature that depends on them has a
   built-in graceful degradation path, so the platform stays fully usable
   offline or if a CDN is blocked.
   ========================================================================== */
(function libLoader() {
  const LIBS = [
    { name: 'Chart', srcs: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js', 'https://unpkg.com/chart.js@4.4.7/dist/chart.umd.min.js'] },
    { name: 'FullCalendar', srcs: ['https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js', 'https://unpkg.com/fullcalendar@6.1.15/index.global.min.js'] },
    { name: 'jspdf', srcs: ['https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js', 'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js'] },
    { name: 'XLSX', srcs: ['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js'] },
    { name: 'QRCode', srcs: ['https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js', 'https://unpkg.com/qrcodejs@1.0.0/qrcode.min.js'] }
  ];
  const present = (n) => (n === 'jspdf' ? !!(window.jspdf && window.jspdf.jsPDF) : !!window[n]);
  function load(name, i) {
    const lib = LIBS.find((l) => l.name === name);
    if (!lib || i >= lib.srcs.length || present(name)) { if (present(name)) retry(); return; }
    const s = document.createElement('script');
    s.src = lib.srcs[i];
    s.async = true;
    s.onload = () => { if (present(name)) retry(); };
    s.onerror = () => { try { s.remove(); } catch (_) {} load(name, i + 1); };
    document.head.append(s);
  }
  function retry() {
    try { document.dispatchEvent(new CustomEvent('fm:libs')); } catch (_) { window.dispatchEvent(new Event('fm:libs')); }
  }
  LIBS.forEach((l) => { if (!present(l.name)) load(l.name, 0); });
})();

/* ==========================================================================
   DOM & UI Utility Helpers
   ========================================================================== */
/* ---------------- tiny DOM helpers ---------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'value') node.value = v;
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children])
    .filter((c) => c !== null && c !== undefined && c !== false)
    .forEach((c) => node.append(c instanceof Node ? c : document.createTextNode(String(c))));
  return node;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// uid, nowISO, and todayISO are defined globally in js/data.js
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
/* Live navbar height, read from the published --nav-h variable. The box
   shrinks once the page is scrolled, so offsets must be read at use time. */
function navOffset(extra) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
  const v = parseFloat(raw) || 80;
  return v + (extra || 0);
}
const deep = (o) => JSON.parse(JSON.stringify(o));
const debounce = (fn, ms = 240) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function money(n, cur = 'AED') {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return `${cur} ${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${cur} ${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${cur} ${(v / 1e3).toFixed(v >= 1e5 ? 0 : 1)}K`;
  return `${cur} ${v.toLocaleString('en-US')}`;
}
const moneyExact = (n, cur = 'AED') => `${cur} ${(Number(n) || 0).toLocaleString('en-US')}`;

function dLong(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
const dShort = (d) => (!d ? '—' : (isNaN(new Date(d)) ? String(d) : new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })));
const dMonth = (d) => (!d || isNaN(new Date(d)) ? '—' : new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));

function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 864e5); }
function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (isNaN(diff)) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return dLong(iso);
}
const titleCase = (s) => String(s || '').replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function icon(name, size = 18, cls = '') {
  const d = ICONS[name] || ICONS.spark;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/* ==========================================================================
   Ephemeral UI State & Active Database Instance
   ========================================================================== */
/* ---------------- STATE ---------------- */
let DB = null;                       // persisted database
const UI = {                          // ephemeral UI state (never persisted)
  view: 'public',
  dashPanel: 'overview',
  expView: 'timeline',
  skillFilter: 'All',
  skillSearch: '',
  projSearch: '',
  projStatus: 'All',
  projCat: '',
  projSort: 'recent',
  assetSearch: '',
  assetCat: '',
  assetStatus: '',
  woFilter: 'all',
  blogSearch: '',
  blogCat: '',
  testiIndex: 0,
  charts: {},
  calendar: null,
  editing: null,
  confirmCb: null
};

/* ==========================================================================
   Persistence Layer, LocalStorage Migration & Backup Engine
   ========================================================================== */
/* ---------------- persistence ---------------- */
function saveDB(reason = 'save') {
  try {
    DB.meta.updated = nowISO();
    localStorage.setItem(APP.key, JSON.stringify(DB));
    if (DB.settings && DB.settings.autoBackup && reason !== 'backup' && reason !== 'silent') {
      const last = Number(sessionStorage.getItem('fm_last_backup') || 0);
      if (Date.now() - last > 15 * 60 * 1000) { makeBackup(true); sessionStorage.setItem('fm_last_backup', String(Date.now())); }
    }
    return true;
  } catch (err) {
    if (String(err && err.name).includes('Quota')) toast('danger', 'Storage full', 'Browser storage limit reached. Export a backup and remove large images.');
    else toast('danger', 'Save failed', String(err && err.message || err));
    return false;
  }
}

function loadDB() {
  // Proactively clear legacy stored keys so no outdated cached state lingers
  try {
    ['fm_portfolio_db', 'fm_portfolio_db_v1', 'fm_portfolio_db_v2'].forEach((k) => localStorage.removeItem(k));
  } catch (_) {}

  let raw = null;
  try { raw = localStorage.getItem(APP.key); } catch (_) { raw = null; }
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const fresh = seedDB();
      seedContent(fresh);
      DB = migrate(parsed, fresh);
      return DB;
    } catch (err) {
      console.warn('Corrupt DB, reseeding.', err);
    }
  }
  DB = seedDB();
  seedContent(DB);
  populateDerived(DB);
  saveDB('silent');
  return DB;
}

/* Merge stored data over a fresh seed while guaranteeing official CV data from PDF */
function migrate(stored, fresh) {
  const out = Object.assign({}, fresh, stored);
  out.meta = Object.assign({}, fresh.meta, stored.meta || {});
  out.settings = Object.assign({}, fresh.settings, stored.settings || {});

  // Always enforce official PDF CV profile & content integrity
  out.profile = Object.assign({}, fresh.profile, stored.profile || {});
  out.profile.name = fresh.profile.name;
  out.profile.title = fresh.profile.title;
  out.profile.headline = fresh.profile.headline;
  out.profile.summary = fresh.profile.summary;
  out.profile.objective = fresh.profile.objective;
  out.profile.highlights = fresh.profile.highlights;
  out.profile.competencies = fresh.profile.competencies;
  out.profile.softSkills = fresh.profile.softSkills;
  out.profile.itSkills = fresh.profile.itSkills;
  out.profile.email = fresh.profile.email;
  out.profile.phone = fresh.profile.phone;
  out.profile.address = fresh.profile.address;
  out.profile.dob = fresh.profile.dob;
  out.profile.languages = fresh.profile.languages;
  out.profile.drivingLicence = fresh.profile.drivingLicence;
  out.profile.stats = fresh.profile.stats;

  out.experience = JSON.parse(JSON.stringify(fresh.experience));
  out.awards = JSON.parse(JSON.stringify(fresh.awards));
  out.certifications = JSON.parse(JSON.stringify(fresh.certifications));
  out.education = JSON.parse(JSON.stringify(fresh.education));
  out.skills = JSON.parse(JSON.stringify(fresh.skills));
  out.projects = JSON.parse(JSON.stringify(fresh.projects));

  ['users', 'skillCategories', 'assets', 'maintenance', 'testimonials', 'blog', 'messages', 'activity', 'notifications'].forEach((k) => {
    if (!Array.isArray(out[k]) || out[k].length === 0) out[k] = fresh[k];
  });
  out.meta.version = APP.version;
  populateDerived(out);
  return out;
}

/* Derived values recomputed on every load so data stays self-consistent. */
function populateDerived(db) {
  // project progress from milestones when present
  (db.projects || []).forEach((p) => {
    if (Array.isArray(p.milestones) && p.milestones.length) {
      const done = p.milestones.filter((m) => m.done).length;
      const calc = Math.round((done / p.milestones.length) * 100);
      if (p.autoProgress !== false && (p.status === 'Planned' || p.status === 'On Hold')) return;
      if (p.autoProgress !== false) p.progress = calc;
    }
    p.progress = clamp(Number(p.progress) || 0, 0, 100);
    if (p.status === 'Completed') p.progress = 100;
    // normalise gallery to array of {name, data}
    if (p.gallery && typeof p.gallery === 'string') { try { p.gallery = JSON.parse(p.gallery); } catch (_) { p.gallery = []; } }
    if (!Array.isArray(p.gallery)) p.gallery = [];
    if (!Array.isArray(p.team)) p.team = p.team ? String(p.team).split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (!Array.isArray(p.tags)) p.tags = [];
    if (!Array.isArray(p.milestones)) p.milestones = [];
    if (!Array.isArray(p.outcomes)) p.outcomes = [];
  });
  // default tags/ids
  (db.assets || []).forEach((a, i) => {
    if (!a.tag) a.tag = 'AST-' + String(i + 1).padStart(3, '0');
    if (!a.criticality) a.criticality = 'Medium';
  });
  // skill averages helper object cached on db
  db._skillAvg = (db.skills || []).length ? Math.round((db.skills || []).reduce((s, k) => s + (Number(k.level) || 0), 0) / db.skills.length) : 0;
  
  // Migration safeguard: Ensure modern natural assets are active
  if (db && db.profile) {
    if (!db.profile.photo || db.profile.photo.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBA')) {
      db.profile.photo = 'assets/profile.jpg';
    }
    if (!db.profile.avatar || db.profile.avatar.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCA')) {
      db.profile.avatar = 'assets/avatar.jpg';
    }
  }
  if (db && db.settings) {
    if (!db.settings.logoImg || db.settings.logoImg.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAABUCAYAAAC4AagSAAA8XUlEQVR42u')) {
      db.settings.logoImg = 'assets/logo.png';
    }
  }
  return db;
}

/* ---------------- backup engine ---------------- */
function makeBackup(silent = false) {
  try {
    const snaps = JSON.parse(localStorage.getItem(APP.backupKey) || '[]');
    snaps.unshift({ id: uid('bk'), ts: nowISO(), version: APP.version, size: JSON.stringify(DB).length, data: DB });
    const limit = clamp(Number(DB.settings.backupLimit) || 8, 1, 30);
    while (snaps.length > limit) snaps.pop();
    localStorage.setItem(APP.backupKey, JSON.stringify(snaps));
    if (!silent) toast('ok', 'Backup created', `Snapshot stored (${snaps.length} retained).`);
    return snaps;
  } catch (err) {
    if (!silent) toast('danger', 'Backup failed', String(err && err.message || err));
    return [];
  }
}
function listBackups() { try { return JSON.parse(localStorage.getItem(APP.backupKey) || '[]'); } catch (_) { return []; } }
function restoreBackup(id) {
  const snaps = listBackups();
  const found = snaps.find((s) => s.id === id);
  if (!found) return false;
  DB = migrate(found.data, seedDB());
  saveDB('silent');
  return true;
}

/* ---------------- activity + notifications ---------------- */
function logActivity(msg, kind = 'action', user) {
  DB.activity.unshift({ id: uid('a'), msg, user: user || currentUserName(), ts: nowISO(), kind });
  if (DB.activity.length > 400) DB.activity.length = 400;
}
function notify(title, msg, type = 'info', panel = '') {
  DB.notifications.unshift({ id: uid('n'), title, msg, type, panel, date: nowISO(), read: false });
  if (DB.notifications.length > 120) DB.notifications.length = 120;
  renderNotifBadge();
}
function renderNotifBadge() {
  const unread = DB.notifications.filter((n) => !n.read).length;
  const b = byId('notifBadge');
  if (!b) return;
  b.textContent = unread > 99 ? '99+' : String(unread);
  b.classList.toggle('hide', unread === 0);
}
const currentUser = () => {
  const s = DB.auth.session;
  if (!s) return null;
  return DB.users.find((u) => u.username.toLowerCase() === String(s.user).toLowerCase()) || null;
};
const currentUserName = () => (currentUser() && currentUser().name) || (DB.auth.session && DB.auth.session.user) || 'Guest';
const currentRole = () => (DB.auth.session && DB.auth.session.role) || 'Viewer';
const can = (perm) => !!(PERMS[currentRole()] && PERMS[currentRole()][perm]);
const canPanel = (panel) => (PANEL_ROLES[panel] || ROLES).includes(currentRole());

/* ==========================================================================
   Localization, Theming, Modals, Toasts, Command Palette & Reveal
   ========================================================================== */
function applyI18n() {
  const lang = (DB && DB.settings && DB.settings.lang) || 'en';
  document.documentElement.setAttribute('lang', lang === 'ne' ? 'ne' : 'en');
  $$('[data-i18n]').forEach((n) => { n.textContent = t(n.getAttribute('data-i18n')); });
  $$('[data-i18n-ph]').forEach((n) => { n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); });
  const lbl = byId('langLabel');
  if (lbl) lbl.textContent = lang === 'ne' ? 'ने' : 'EN';
}
function setLang(lang) {
  DB.settings.lang = lang === 'ne' ? 'ne' : 'en';
  applyI18n();
  saveDB('silent');
  logActivity(`Language switched to ${DB.settings.lang.toUpperCase()}`, 'settings');
  toast('ok', 'Language updated', DB.settings.lang === 'ne' ? 'नेपाली सक्रिय गरियो।' : 'English activated.');
}

/* ---------------- theme ---------------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  const btn = byId('themeBtn');
  if (btn) btn.innerHTML = icon(theme === 'light' ? 'moon' : 'sun', 19);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F8FAFC' : '#0F172A');
  Object.values(UI.charts).forEach((c) => { if (c && typeof c.update === 'function') { try { c.update('none'); } catch (_) {} } });
}
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  DB.settings.theme = next;
  applyTheme(next);
  saveDB('silent');
  toast('ok', next === 'light' ? 'Light mode' : 'Dark mode', 'Theme preference saved.');
}

/* ---------------- toasts ---------------- */
function toast(type, title, msg, ms) {
  const host = byId('toastHost');
  if (!host) return;
  const map = { ok: 'check', warn: 'alert', danger: 'alert', info: 'bell' };
  const node = el('div', { class: `toast toast--${type || 'info'}`, role: 'status' }, [
    el('div', { class: 'toast__icon', html: icon(map[type] || 'bell', 17) }),
    el('div', { class: 'toast__body' }, [
      el('div', { class: 'toast__title', text: title || '' }),
      msg ? el('div', { class: 'toast__msg', text: msg }) : null
    ]),
    el('button', { class: 'toast__x', type: 'button', 'aria-label': 'Dismiss', html: icon('x', 15), onclick: () => kill() })
  ]);
  host.append(node);
  const kill = () => { node.classList.add('is-out'); setTimeout(() => node.remove(), 320); };
  const timer = setTimeout(kill, ms || (type === 'danger' ? 7000 : 4200));
  node.addEventListener('mouseenter', () => clearTimeout(timer));
  node.addEventListener('mouseleave', () => setTimeout(kill, 1600));
  while (host.children.length > 5) host.firstElementChild.remove();
}

/* ---------------- modal engine ---------------- */
let modalStack = [];
function openModal({ title, body, footer, wide, narrow, onOpen }) {
  const ov = byId('modalOverlay'), box = byId('modalBox');
  byId('modalTitle').textContent = title || '';
  const bodyEl = byId('modalBody');
  bodyEl.innerHTML = '';
  if (typeof body === 'string') bodyEl.innerHTML = body;
  else if (body instanceof Node) bodyEl.append(body);
  const foot = byId('modalFoot');
  foot.innerHTML = '';
  if (footer) { if (typeof footer === 'string') foot.innerHTML = footer; else foot.append(footer); }
  foot.classList.toggle('hide', !footer);
  box.classList.toggle('modal--wide', !!wide);
  box.classList.toggle('modal--narrow', !!narrow);
  ov.classList.add('is-open');
  document.body.classList.add('no-scroll');
  modalStack.push(title);
  const focusable = box.querySelector('input,select,textarea,button:not([data-close-modal])');
  if (focusable) setTimeout(() => focusable.focus(), 90);
  if (typeof onOpen === 'function') onOpen(bodyEl, foot);
}
function closeModal() {
  byId('modalOverlay').classList.remove('is-open');
  modalStack.pop();
  if (!modalStack.length && !byId('drawerOverlay').classList.contains('is-open')) document.body.classList.remove('no-scroll');
}
function confirmDialog(msg, onYes, opts = {}) {
  byId('confirmMsg').textContent = msg;
  byId('confirmTitle').textContent = opts.title || 'Please confirm';
  byId('confirmYes').textContent = opts.yes || 'Confirm';
  byId('confirmNo').textContent = opts.no || 'Cancel';
  byId('confirmOverlay').classList.add('is-open');
  UI.confirmCb = onYes;
}
function closeConfirm() { byId('confirmOverlay').classList.remove('is-open'); UI.confirmCb = null; }
function openDrawer(title) {
  if (title) byId('drawerTitle').textContent = title;
  byId('drawerOverlay').classList.add('is-open');
  document.body.classList.add('no-scroll');
}
function closeDrawer() {
  byId('drawerOverlay').classList.remove('is-open');
  if (!$('.overlay.is-open')) document.body.classList.remove('no-scroll');
}
function lightbox(src, alt) {
  byId('lightboxImg').src = src;
  byId('lightboxImg').alt = alt || 'Enlarged view';
  byId('lightboxOverlay').classList.add('is-open');
  document.body.classList.add('no-scroll');
}

/* ---------------- command palette ---------------- */
function buildCommands() {
  const cmds = [
    { label: 'Go to Overview', grp: 'Dashboard', act: () => showDash('overview') },
    { label: 'Go to Projects manager', grp: 'Dashboard', act: () => showDash('projects') },
    { label: 'Go to Asset register', grp: 'Dashboard', act: () => showDash('assets') },
    { label: 'Go to Work orders', grp: 'Dashboard', act: () => showDash('maintenance') },
    { label: 'Go to Gantt & milestones', grp: 'Dashboard', act: () => showDash('gantt') },
    { label: 'Go to Calendar', grp: 'Dashboard', act: () => showDash('calendar') },
    { label: 'Go to Analytics', grp: 'Dashboard', act: () => showDash('analytics') },
    { label: 'Go to Reports & export', grp: 'Dashboard', act: () => showDash('reports') },
    { label: 'Go to Users & roles', grp: 'Dashboard', act: () => showDash('users') },
    { label: 'Go to Settings & backup', grp: 'Dashboard', act: () => showDash('settings') },
    { label: 'New project', grp: 'Action', act: () => projectForm() },
    { label: 'New asset', grp: 'Action', act: () => assetForm() },
    { label: 'New work order', grp: 'Action', act: () => woForm() },
    { label: 'Export full backup (JSON)', grp: 'Action', act: () => exportJSON() },
    { label: 'Create backup snapshot', grp: 'Action', act: () => makeBackup() },
    { label: 'Export projects to Excel', grp: 'Export', act: () => exportProjectsXlsx() },
    { label: 'Download resume (PDF)', grp: 'Export', act: () => downloadResume() },
    { label: 'Toggle dark / light mode', grp: 'Action', act: () => toggleTheme() },
    { label: 'Switch language (EN / नेपाली)', grp: 'Action', act: () => setLang(DB.settings.lang === 'en' ? 'ne' : 'en') },
    { label: 'Print / save as PDF', grp: 'Action', act: () => window.print() },
    { label: 'View public portfolio', grp: 'Navigate', act: () => showView('public') }
  ];
  DB.projects.forEach((p) => cmds.push({ label: p.name, grp: 'Project', act: () => { showDash('projects'); setTimeout(() => projectDetail(p.id), 120); } }));
  DB.assets.forEach((a) => cmds.push({ label: `${a.tag} — ${a.name}`, grp: 'Asset', act: () => { showDash('assets'); setTimeout(() => assetDetail(a.id), 120); } }));
  return cmds;
}
function openCmdk() {
  byId('cmdkOverlay').classList.add('is-open');
  document.body.classList.add('no-scroll');
  const input = byId('cmdkInput');
  input.value = '';
  renderCmdk('');
  setTimeout(() => input.focus(), 60);
}
function closeCmdk() { byId('cmdkOverlay').classList.remove('is-open'); if (!$('.overlay.is-open')) document.body.classList.remove('no-scroll'); }
let cmdkItems = [], cmdkSel = 0;
function renderCmdk(q) {
  const list = byId('cmdkList');
  const all = buildCommands();
  const needle = q.trim().toLowerCase();
  cmdkItems = (needle ? all.filter((c) => c.label.toLowerCase().includes(needle) || c.grp.toLowerCase().includes(needle)) : all).slice(0, 40);
  cmdkSel = 0;
  list.innerHTML = '';
  if (!cmdkItems.length) { list.append(el('div', { class: 'cmdk__item', text: 'No matches found' })); return; }
  cmdkItems.forEach((c, i) => {
    const node = el('div', { class: 'cmdk__item' + (i === 0 ? ' is-sel' : ''), role: 'option', tabindex: '-1' }, [
      el('span', { html: icon('spark', 15) }),
      el('span', { text: c.label }),
      el('span', { class: 'grp', text: c.grp })
    ]);
    node.addEventListener('click', () => { closeCmdk(); c.act(); });
    list.append(node);
  });
}
function cmdkMove(dir) {
  const items = $$('#cmdkList .cmdk__item');
  if (!items.length) return;
  items[cmdkSel] && items[cmdkSel].classList.remove('is-sel');
  cmdkSel = (cmdkSel + dir + items.length) % items.length;
  items[cmdkSel].classList.add('is-sel');
  items[cmdkSel].scrollIntoView({ block: 'nearest' });
}

/* ---------------- scroll reveal + counters + particles ---------------- */
let revealObserver = null;
function initReveal() {
  if (!('IntersectionObserver' in window)) { $$('[data-reveal]').forEach((n) => n.classList.add('is-in')); return; }
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  $$('[data-reveal]:not(.is-in)').forEach((n) => revealObserver.observe(n));
}
function animateCount(node, to, suffix = '', dur = 1500) {
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const p = clamp((now - start) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(from + (to - from) * eased);
    node.textContent = val.toLocaleString('en-US') + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function initCounters() {
  const nodes = $$('[data-count]');
  if (!nodes.length) return;
  const run = (n) => { if (n.dataset.counted) return; n.dataset.counted = '1'; animateCount(n, Number(n.dataset.count) || 0, n.dataset.suffix || ''); };
  if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.35 });
  nodes.forEach((n) => io.observe(n));
}
function initParticles() {
  const host = byId('particles');
  if (!host || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const count = window.innerWidth < 700 ? 12 : 26;
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const dur = 14 + Math.random() * 22;
    const delay = -Math.random() * 30;
    const size = 2 + Math.random() * 3;
    const col = Math.random() > 0.6 ? '#10B981' : (Math.random() > 0.5 ? '#06B6D4' : '#60A5FA');
    html += `<span class="particle" style="left:${left.toFixed(2)}%;bottom:-10px;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;background:${col};box-shadow:0 0 12px 2px ${col}80;animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"></span>`;
  }
  host.innerHTML = html;
}

/* ---------------- typing effect for hero role ---------------- */
function initTyping() {
  const node = byId('typeRole');
  if (!node) return;
  const roles = [
    'Senior Professional: Strategic Planning | Operations | FM',
    'Facilities Manager — Aldar Property, UAE',
    'Assistant Facilities Manager — Deyaar Property, UAE',
    'FM Engineer — DAMAC, UAE',
    'FM Coordinator — Bin Drai Enterprises, UAE',
    'FM Supervisor — Morganti Group Inc., UAE',
    'MEFMA Certified Facility Manager & NEBOSH IGC',
    'B.Tech. (Electrical Engineering) — 13 Years UAE Exp.'
  ];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { node.textContent = roles[0]; return; }
  let r = 0, c = 0, deleting = false;
  const tick = () => {
    const cur = roles[r];
    node.textContent = cur.slice(0, c);
    let wait = deleting ? 28 : 52;
    if (!deleting && c === cur.length) { deleting = true; wait = 2100; }
    else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; wait = 320; }
    c += deleting ? -1 : 1;
    setTimeout(tick, wait);
  };
  tick();
}

/* ---------------- chart helpers ---------------- */
const CHART_COLORS = ['#06B6D4', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#F43F5E', '#14B8A6', '#6366F1', '#EC4899', '#84CC16', '#0EA5E9', '#FB7185', '#A855F7', '#22C55E', '#EAB308'];
function chartReady() { return typeof window.Chart !== 'undefined'; }
function chartGrid() { return getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || 'rgba(148,197,255,.14)'; }
function chartText() { return getComputedStyle(document.documentElement).getPropertyValue('--text-3').trim() || '#93A6C4'; }
function chartFont() { return { family: "'Plus Jakarta Sans', system-ui, sans-serif", size: 11, weight: '600' }; }
function destroyChart(key) { if (UI.charts[key]) { try { UI.charts[key].destroy(); } catch (_) {} delete UI.charts[key]; } }
function chartFallback(canvasId, msg) {
  const c = byId(canvasId);
  if (!c) return;
  const box = c.parentElement;
  if (!box) return;
  box.innerHTML = `<div class="chart-fallback">${icon('chart', 30)}<p style="margin-top:10px">${esc(msg || 'Chart library unavailable offline — data is shown in the tables and lists above.')}</p></div>`;
}
/* Remove any offline fallback markup and return a live canvas for an id,
   recreating the canvas when an earlier fallback replaced it. Without this the
   charts could never appear once the library arrived, because the original
   canvas element no longer existed. */
function ensureCanvas(canvasId) {
  let c = byId(canvasId);
  if (c && c.tagName === 'CANVAS') return c;
  /* The canvas may have been replaced by offline fallback markup. Each
     chart-box wrapper carries a stable "box_<canvasId>" id precisely so it can
     be found again and the canvas rebuilt inside it. */
  let box = document.getElementById('box_' + canvasId);
  if (!box && c) box = c.closest('.chart-box') || c.parentElement;
  if (!box) box = document.querySelector(`[data-chartbox="${canvasId}"]`);
  if (!box) return null;
  box.innerHTML = '';
  c = document.createElement('canvas');
  c.id = canvasId;
  c.setAttribute('role', 'img');
  box.append(c);
  return c;
}

/* ==========================================================================
   PUBLIC SITE RENDERING
   ========================================================================== */
function renderMarquee() {
  const host = byId('marqueeTrack');
  if (!host) return;
  const items = [
    'Aldar Property', 'Deyaar Property', 'DAMAC', 'Bin Drai Enterprises', 'Morganti Group',
    'MEFMA Certified Facility Manager', 'NEBOSH IGC', 'CAI M-100', 'ISO 9001:2015', 'ISO 14001:2015',
    'ISO 45001:2018', 'Dubai Civil Defence', 'B.Tech Electrical Engineering', '13+ Years in the UAE'
  ];
  const one = items.map((i) => `<span class="marquee__item">${icon('check', 15)}${esc(i)}</span>`).join('');
  host.innerHTML = one + one;
}

function renderHeroStats() {
  const host = byId('heroStats');
  if (!host) return;
  const stats = (DB.stats || (DB.profile && DB.profile.stats) || []).slice(0, 4);
  host.innerHTML = stats.map((s) => `
    <div class="hero__meta-item">
      <b data-count="${Number(s.value) || 0}" data-suffix="${esc(s.suffix || '')}">0</b>
      <span>${esc(s.label)}</span>
    </div>`).join('');
  initCounters();
}

function renderAbout() {
  const p = DB.profile;
  const sum = byId('aboutSummary');
  if (sum) sum.textContent = p.summary;
  const hl = byId('aboutHighlights');
  if (hl) {
    hl.innerHTML = (p.highlights || []).map((h) => `
      <li style="display:flex;gap:10px;align-items:flex-start">
        <span style="color:var(--cyan);flex:none;margin-top:2px">${icon('check', 16)}</span>
        <span style="font-size:.885rem;color:var(--text-2);line-height:1.45">${esc(h)}</span>
      </li>`).join('');
  }
  const comp = byId('aboutCompetencies');
  if (comp) {
    comp.innerHTML = (p.competencies || []).map((c) => `
      <span class="chip" style="cursor:default;background:var(--card-bg);border:1px solid var(--border);padding:6px 12px;font-size:.82rem">
        <span style="color:var(--cyan);margin-right:5px">●</span>${esc(c)}
      </span>`).join('');
  }

  const softEl = byId('aboutSoftSkills');
  if (softEl) {
    const softList = (p.softSkills && p.softSkills.length) ? p.softSkills : ['Motivator', 'Collaborator', 'Communicator', 'Innovator', 'Team Building', 'Problem-Solver'];
    softEl.innerHTML = softList.map((s) => `
      <span class="badge badge--cyan" style="font-size:.76rem;padding:4px 9px">
        <span style="color:var(--accent);margin-right:4px">★</span>${esc(s)}
      </span>`).join('');
  }

  const itEl = byId('aboutItSkills');
  if (itEl) {
    const itList = (p.itSkills && p.itSkills.length) ? p.itSkills : ['MS Excel (Advanced)', 'MS Word', 'MS PowerPoint', 'Hardware & Networking', 'Application Programming', 'CAFM / BMS'];
    itEl.innerHTML = itList.map((it) => `
      <span class="badge badge--muted" style="font-size:.76rem;padding:4px 9px">
        <span style="color:var(--text-3);margin-right:4px">💻</span>${esc(it)}
      </span>`).join('');
  }

  const aw = byId('aboutAwards');
  if (aw) {
    const awardsList = (DB.awards && DB.awards.length) ? DB.awards : [
      { title: 'NEBOSH Award in Health & Safety at Work', issuer: 'DAMAC / NEBOSH — 03 Jan 2020', desc: 'Outstanding safety leadership' },
      { title: 'DAMAC Appreciation Award', issuer: 'DAMAC Hotel & Resorts', desc: 'Excellence in engineering operations' },
      { title: 'Employee Of Month Award', issuer: 'Green Point Technical Services', desc: 'Technical facility operations' },
      { title: "D'crowned For The Month Appreciation Award", issuer: 'DAMAC Hotel & Resorts', desc: 'Zero-downtime maintenance' },
      { title: 'Employee of Month Award', issuer: 'LOAMS', desc: 'Owner association management' }
    ];
    aw.innerHTML = awardsList.map((a) => `
      <li style="display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border)">
        <span class="contact-card__icon" style="width:36px;height:36px;border-radius:11px;color:var(--warn);background:var(--warn-bg);border-color:rgba(245,158,11,.3);flex:none">${icon('award', 17)}</span>
        <span style="flex:1">
          <b style="font-size:.88rem;display:block">${esc(a.title)}</b>
          <span style="font-size:.78rem;color:var(--text-3)">${esc(a.issuer || a.org || '')}</span>
          ${a.desc ? `<span style="font-size:.75rem;color:var(--text-2);display:block;margin-top:2px">${esc(a.desc)}</span>` : ''}
        </span>
      </li>`).join('');
  }
  const goals = byId('aboutGoals');
  if (goals) goals.textContent = p.goals || p.objective;

  const facts = byId('aboutFacts');
  if (facts) {
    const f = [
      { l: 'Experience', v: '13+ Years FM & Property' },
      { l: 'Location', v: p.address || 'Business Bay, Dubai, UAE' },
      { l: 'Date of Birth', v: '29th August 1990' },
      { l: 'Driving Licence', v: 'UAE LMV (17 Jan 2017)' },
      { l: 'Current Role', v: p.currentAt || 'Aldar Property, UAE' },
      { l: 'Languages', v: (p.languages || []).join(', ') },
      { l: 'Education', v: 'B.Tech EE & Diploma EEE (Attested)' },
      { l: 'ISO Audits', v: 'ISO 14001, 9001, 45001' }
    ];
    facts.innerHTML = f.map((x) => `
      <div class="neu" style="padding:12px">
        <div style="font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);font-weight:800;margin-bottom:4px">${esc(x.l)}</div>
        <div style="font-size:.83rem;font-weight:600">${esc(x.v)}</div>
      </div>`).join('');
  }
}

function renderExperience() {
  const host = byId('expTimeline');
  if (!host) return;
  host.innerHTML = DB.experience.map((e, i) => `
    <article class="tl-item card glass card--hover" data-current="${e.current ? 'true' : 'false'}" data-exp="${i}" data-reveal="left" data-delay="${(i % 4) + 1}">
      <div class="tl-head">
        <span class="tl-logo" aria-hidden="true">${esc(e.logo || initials(e.company))}</span>
        <div class="tl-body">
          <div class="row row--between" style="gap:10px;align-items:flex-start">
            <div>
              <div class="tl-company">${esc(e.company)}</div>
              <div class="tl-role">${esc(e.title)}</div>
            </div>
            <div style="text-align:right">
              <div class="tl-period">${esc(e.period)}</div>
              ${e.current ? '<span class="badge badge--ok" style="margin-top:6px">Current</span>' : `<span class="badge badge--muted" style="margin-top:6px">${esc(e.type || '')}</span>`}
            </div>
          </div>
          <div class="row" style="gap:8px;margin-top:10px">
            <span class="tag">${esc(e.location || 'UAE')}</span>
            <span class="tag">${(e.points || []).length} responsibilities</span>
            ${(e.projects || []).length ? `<span class="tag">${e.projects.length} highlights</span>` : ''}
          </div>
          <button class="btn btn--ghost btn--xs tl-toggle" type="button" aria-expanded="false" data-tl-toggle="${i}">
            <span>Details</span>${icon('arrowDown', 14)}
          </button>
          <div class="tl-points">
            <ul class="stack" style="gap:8px">
              ${(e.points || []).map((pt) => `<li>${esc(pt)}</li>`).join('')}
            </ul>
            ${(e.projects || []).length ? `
              <div style="margin-top:14px">
                <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);font-weight:800;margin-bottom:8px">Project highlights</div>
                <div class="row" style="gap:6px">${e.projects.map((x) => `<span class="badge badge--cyan">${esc(x)}</span>`).join('')}</div>
              </div>` : ''}
          </div>
        </div>
      </div>
    </article>`).join('');

  const table = byId('expTable');
  if (table) {
    table.innerHTML = `
      <thead><tr>
        <th>Company</th><th>Role</th><th>Period</th><th>Focus</th><th class="num">Responsibilities</th>
      </tr></thead>
      <tbody>${DB.experience.map((e) => `
        <tr>
          <td><b>${esc(e.company)}</b></td>
          <td>${esc(e.title)}</td>
          <td style="white-space:nowrap">${esc(e.period)}</td>
          <td><span class="badge badge--muted">${esc(e.type || '—')}</span></td>
          <td class="num">${(e.points || []).length}</td>
        </tr>`).join('')}
      </tbody>`;
  }
  initReveal();
}

function renderSkills() {
  const avg = byId('skillAvg');
  if (avg) {
    const target = DB._skillAvg || 0;
    avg.innerHTML = `0<span style="font-size:.5em">%</span>`;
    const start = performance.now();
    const step = (now) => {
      const p = clamp((now - start) / 1400, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      avg.innerHTML = `${val}<span style="font-size:.5em">%</span>`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const cats = ['All'].concat(DB.skillCategories.filter((c) => DB.skills.some((s) => s.cat === c)));
  const fHost = byId('skillFilters');
  if (fHost) {
    fHost.innerHTML = cats.map((c) => `<button class="chip${c === UI.skillFilter ? ' is-active' : ''}" type="button" data-skill-cat="${esc(c)}" aria-pressed="${c === UI.skillFilter}">${esc(c)}</button>`).join('');
  }
  const list = byId('skillList');
  if (!list) return;
  const needle = UI.skillSearch.toLowerCase();
  const rows = DB.skills.filter((s) =>
    (UI.skillFilter === 'All' || s.cat === UI.skillFilter) &&
    (!needle || s.name.toLowerCase().includes(needle) || (s.note || '').toLowerCase().includes(needle))
  ).sort((a, b) => b.level - a.level);
  if (!rows.length) {
    list.innerHTML = `<div class="table-empty">${icon('search', 36)}<p>No skills match “${esc(UI.skillSearch)}”.</p></div>`;
    return;
  }
  list.innerHTML = rows.map((s) => `
    <div class="skill-row" title="${esc(s.note || '')}">
      <div style="flex:1;min-width:0">
        <div class="skill-row__name">${esc(s.name)}</div>
        <div style="font-size:.72rem;color:var(--text-3)">${esc(s.cat)}${s.years ? ` · ${s.years} yrs` : ''}</div>
      </div>
      <div class="skill-row__bar"><div class="bar bar--sm"><div class="bar__fill" data-fill="${s.level}"></div></div></div>
      <div class="skill-row__val">${s.level}%</div>
    </div>`).join('');
  requestAnimationFrame(() => $$('#skillList .bar__fill').forEach((f) => { f.style.width = f.dataset.fill + '%'; }));
  renderSkillCharts();
}

function renderSkillCharts() {
  if (!chartReady()) { chartFallback('chartSkillRadar', 'Charts need a network connection the first time. Skill values are listed below.'); chartFallback('chartSkillPie'); return; }
  const byCat = {};
  DB.skills.forEach((s) => { byCat[s.cat] = byCat[s.cat] || { sum: 0, n: 0 }; byCat[s.cat].sum += s.level; byCat[s.cat].n++; });
  const cats = Object.keys(byCat).sort((a, b) => (byCat[b].sum / byCat[b].n) - (byCat[a].sum / byCat[a].n));
  const avg = cats.map((c) => Math.round(byCat[c].sum / byCat[c].n));

  destroyChart('pie');
  const pie = ensureCanvas('chartSkillPie');
  if (pie) {
    UI.charts.pie = new Chart(pie, {
      type: 'doughnut',
      data: { labels: cats, datasets: [{ data: cats.map((c) => byCat[c].n), backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 8 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: { position: 'right', maxWidth: 128, labels: { color: chartText(), font: { family: "'Plus Jakarta Sans', system-ui, sans-serif", size: 10, weight: '600' }, boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 7, itemStyle: 'normal' } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} skills` } }
        }
      }
    });
  }
  destroyChart('radar');
  const radar = ensureCanvas('chartSkillRadar');
  if (radar) {
    UI.charts.radar = new Chart(radar, {
      type: 'radar',
      data: {
        labels: cats.slice(0, 10),
        datasets: [{
          label: 'Proficiency', data: avg.slice(0, 10),
          backgroundColor: 'rgba(6,182,212,.22)', borderColor: '#06B6D4', borderWidth: 2,
          pointBackgroundColor: '#06B6D4', pointBorderColor: '#04121b', pointRadius: 3.5, pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.r}% average` } } },
        scales: {
          r: {
            min: 40, max: 100, beginAtZero: false,
            angleLines: { color: chartGrid() }, grid: { color: chartGrid() },
            pointLabels: { color: chartText(), font: chartFont() },
            ticks: { display: false, stepSize: 20 }
          }
        }
      }
    });
  }
}

/* ==========================================================================
   Public Portfolio Renderers (Projects, Assets, Work Orders, Credentials)
   ========================================================================== */
/* ==========================================================================
   PART D — PUBLIC: projects, assets, maintenance, calendar, credentials,
            blog, testimonials, contact, footer, forms
   ========================================================================== */

const statusBadge = (s) => `<span class="badge ${(STATUS_META[s] || {}).cls || 'badge--muted'}">${esc(s)}</span>`;
const PRIORITY_CLS = { Critical: 'badge--danger', High: 'badge--warn', Medium: 'badge--info', Low: 'badge--muted' };

/* ---------------- Projects ---------------- */
function filteredProjects() {
  const q = UI.projSearch.toLowerCase();
  let rows = DB.projects.filter((p) => {
    const matchQ = !q || [p.name, p.client, p.category, p.desc, (p.tags || []).join(' '), (p.team || []).join(' ')].join(' ').toLowerCase().includes(q);
    const matchS = UI.projStatus === 'All' || p.status === UI.projStatus;
    const matchC = !UI.projCat || p.category === UI.projCat;
    return matchQ && matchS && matchC;
  });
  const sorters = {
    recent: (a, b) => new Date(b.start || 0) - new Date(a.start || 0),
    'budget-desc': (a, b) => (b.budget || 0) - (a.budget || 0),
    'budget-asc': (a, b) => (a.budget || 0) - (b.budget || 0),
    progress: (a, b) => (b.progress || 0) - (a.progress || 0),
    name: (a, b) => a.name.localeCompare(b.name)
  };
  rows.sort(sorters[UI.projSort] || sorters.recent);
  return rows;
}
function projectCard(p) {
  const cover = (p.gallery && p.gallery[0]) ? p.gallery[0].data : '';
  return `
  <article class="card glass card--hover proj" data-reveal="zoom" data-proj="${esc(p.id)}">
    <div class="proj__media ${cover ? '' : 'proj__media--empty'}">
      ${cover ? `<img src="${cover}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : icon('image', 44)}
      <div class="proj__badges">
        <span>${statusBadge(p.status)}</span>
        <span class="badge ${PRIORITY_CLS[p.priority] || 'badge--muted'}">${esc(p.priority || 'Medium')}</span>
      </div>
    </div>
    <div class="proj__body">
      <div>
        <h3 class="proj__title">${esc(p.name)}</h3>
        <div class="proj__client">${esc(p.client)} · ${esc(p.category)}</div>
      </div>
      <p style="font-size:.845rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:3.9em">${esc(String(p.desc || '').slice(0, 190))}${String(p.desc || '').length > 190 ? '…' : ''}</p>
      <div class="proj__stats">
        <div class="proj__stat"><span>Budget</span><b>${money(p.budget, DB.settings.currency)}</b></div>
        <div class="proj__stat"><span>Progress</span><b>${p.progress}%</b></div>
        <div class="proj__stat" style="grid-column:1/-1"><span>Period</span><b title="${esc(dLong(p.start) + ' → ' + dLong(p.end))}">${dShort(p.start)} → ${dShort(p.end)}</b></div>
      </div>
      <div class="bar bar--sm"><div class="bar__fill" data-fill="${p.progress}"></div></div>
      <div class="proj__tags">${(p.tags || []).slice(0, 4).map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
      <div class="proj__foot">
        <button class="btn btn--ghost btn--xs" type="button" data-proj-view="${esc(p.id)}">${icon('eye', 14)} Details</button>
        ${can('edit') ? `<button class="btn btn--ghost btn--xs" type="button" data-proj-edit="${esc(p.id)}">${icon('edit', 14)} Edit</button>` : ''}
        ${p.gallery && p.gallery.length ? `<span class="badge badge--muted" style="margin-left:auto">${icon('image', 13)} ${p.gallery.length}</span>` : ''}
      </div>
    </div>
  </article>`;
}
function renderProjects() {
  const grid = byId('projGrid');
  if (!grid) return;
  // filter widgets
  const statuses = ['All', 'Planned', 'Ongoing', 'Completed', 'On Hold'];
  const sf = byId('projStatusFilters');
  if (sf) sf.innerHTML = statuses.map((s) => `<button class="chip${UI.projStatus === s ? ' is-active' : ''}" type="button" data-proj-status="${s}" aria-pressed="${UI.projStatus === s}">${s}</button>`).join('');
  const catSel = byId('projCatFilter');
  if (catSel) {
    const cats = Array.from(new Set(DB.projects.map((p) => p.category).filter(Boolean))).sort();
    catSel.innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${esc(c)}"${UI.projCat === c ? ' selected' : ''}>${esc(c)}</option>`).join('');
  }
  const rows = filteredProjects();
  const pageRange = renderPaginationControls({
    total: rows.length, page: UI.projPage, perPage: UI.projPerPage,
    infoEl: byId('projPageInfo'), prevBtn: byId('projPrevBtn'), nextBtn: byId('projNextBtn'), pillsEl: byId('projPagePills'),
    onPage: (p) => { UI.projPage = p; renderProjects(); }
  });
  const pageRows = rows.slice(pageRange.start, pageRange.end);
  grid.innerHTML = pageRows.map(projectCard).join('');
  byId('projEmpty').classList.toggle('hide', rows.length > 0);
  requestAnimationFrame(() => $$('#projGrid .bar__fill').forEach((f) => { f.style.width = f.dataset.fill + '%'; }));
  initReveal();
}
function projectDetail(id) {
  const p = DB.projects.find((x) => x.id === id);
  if (!p) return;
  const milestones = (p.milestones || []);
  const doneCount = milestones.filter((m) => m.done).length;
  const body = `
    <div class="stack" style="gap:18px">
      <div class="row" style="gap:8px">${statusBadge(p.status)}<span class="badge ${PRIORITY_CLS[p.priority] || 'badge--muted'}">${esc(p.priority || '')}</span><span class="badge badge--muted">${esc(p.category)}</span><span class="badge badge--muted">${esc(p.id)}</span></div>
      <div class="grid g-4" style="gap:12px">
        <div class="neu" style="padding:12px"><div style="font-size:.65rem;color:var(--text-3);font-weight:800;letter-spacing:.09em;text-transform:uppercase">Budget</div><div style="font-weight:800">${moneyExact(p.budget, DB.settings.currency)}</div></div>
        <div class="neu" style="padding:12px"><div style="font-size:.65rem;color:var(--text-3);font-weight:800;letter-spacing:.09em;text-transform:uppercase">Spent</div><div style="font-weight:800">${moneyExact(p.spent || 0, DB.settings.currency)}</div></div>
        <div class="neu" style="padding:12px"><div style="font-size:.65rem;color:var(--text-3);font-weight:800;letter-spacing:.09em;text-transform:uppercase">Start</div><div style="font-weight:800">${dLong(p.start)}</div></div>
        <div class="neu" style="padding:12px"><div style="font-size:.65rem;color:var(--text-3);font-weight:800;letter-spacing:.09em;text-transform:uppercase">End</div><div style="font-weight:800">${dLong(p.end)}</div></div>
      </div>
      <div>
        <div class="row row--between" style="margin-bottom:8px"><b style="font-size:.86rem">Progress</b><b style="font-size:.86rem;color:var(--cyan)">${p.progress}%</b></div>
        <div class="bar bar--lg"><div class="bar__fill" style="width:${p.progress}%"></div></div>
      </div>
      <div><b style="font-size:.86rem">Description</b><p style="font-size:.885rem;margin-top:6px">${esc(p.desc)}</p></div>
      ${p.client ? `<div><b style="font-size:.86rem">Client</b><p style="font-size:.885rem;margin-top:6px">${esc(p.client)}</p></div>` : ''}
      <div><b style="font-size:.86rem">Team members</b><div class="row" style="gap:6px;margin-top:8px">${(p.team || []).map((m) => `<span class="chip" style="cursor:default">${icon('users', 13)} ${esc(m)}</span>`).join('') || '<span style="color:var(--text-3);font-size:.84rem">—</span>'}</div></div>
      ${(p.tags || []).length ? `<div><b style="font-size:.86rem">Tags</b><div class="row" style="gap:6px;margin-top:8px">${p.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div></div>` : ''}
      ${(p.outcomes || []).length ? `<div><b style="font-size:.86rem">Outcomes</b><ul class="stack" style="gap:7px;margin-top:8px">${p.outcomes.map((o) => `<li style="display:flex;gap:9px"><span style="color:var(--ok);flex:none">${icon('check', 15)}</span><span style="font-size:.87rem">${esc(o)}</span></li>`).join('')}</ul></div>` : ''}
      ${milestones.length ? `
        <div>
          <div class="row row--between" style="margin-bottom:10px"><b style="font-size:.86rem">Milestones</b><span class="badge badge--cyan">${doneCount}/${milestones.length} complete</span></div>
          <div class="stack" style="gap:9px">
            ${milestones.map((m) => `
              <div class="row" style="gap:10px;align-items:center">
                <span style="width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;background:${m.done ? 'var(--ok-bg)' : 'var(--elevate)'};color:${m.done ? 'var(--ok)' : 'var(--text-3)'}">${m.done ? icon('check', 13) : icon('clock', 13)}</span>
                <span style="flex:1;font-size:.87rem;${m.done ? '' : 'color:var(--text-2)'}">${esc(m.name)}</span>
                <span style="font-size:.76rem;color:var(--text-3);white-space:nowrap">${dShort(m.date)}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}
      <div>
        <div class="row row--between" style="margin-bottom:10px">
          <b style="font-size:.86rem">Gallery</b>
          ${can('create') ? `<button class="btn btn--xs btn--ghost" type="button" id="pdUpload">${icon('upload', 13)} Upload images</button>` : ''}
        </div>
        <div class="gallery-grid" id="pdGallery">${(p.gallery || []).map((g, i) => `
          <div class="gallery-item">
            <img src="${g.data}" alt="${esc(g.name || 'Project image')}" loading="lazy" data-lightbox="${i}">
            ${can('delete') ? `<button type="button" data-gallery-del="${i}" aria-label="Remove image">${icon('x', 13)}</button>` : ''}
          </div>`).join('') || '<p style="font-size:.85rem;color:var(--text-3)">No images attached yet.</p>'}
        </div>
      </div>
    </div>`;
  const foot = el('div', { class: 'row', style: 'width:100%;justify-content:space-between' });
  foot.append(
    el('div', { class: 'row', style: 'gap:8px' }, [
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', html: icon('download', 14) + ' PDF brief', onclick: () => projectPdf(p.id) }),
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', html: icon('print', 14) + ' Print', onclick: () => window.print() })
    ]),
    el('div', { class: 'row', style: 'gap:8px' }, [
      can('edit') ? el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: 'Edit project', onclick: () => { closeModal(); projectForm(p.id); } }) : null,
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Close', onclick: closeModal })
    ])
  );
  openModal({ title: p.name, body, footer: foot, wide: true });
  const up = byId('pdUpload');
  if (up) up.addEventListener('click', () => pickImages((files) => {
    files.forEach((f) => { if (p.gallery.length < 12) p.gallery.push({ name: f.name, data: f.data }); });
    saveDB(); logActivity(`Uploaded gallery images to ${p.name}`); toast('ok', 'Images added', `${files.length} image(s) attached.`);
    projectDetail(p.id); renderProjects();
  }));
  $$('#pdGallery [data-lightbox]').forEach((img) => img.addEventListener('click', () => lightbox(p.gallery[Number(img.dataset.lightbox)].data, p.name)));
  $$('#pdGallery [data-gallery-del]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.galleryDel);
    confirmDialog('Remove this image from the project gallery?', () => {
      p.gallery.splice(i, 1); saveDB(); logActivity(`Removed an image from ${p.name}`); projectDetail(p.id); renderProjects(); toast('ok', 'Image removed');
    });
  }));
}

/* ---------------- Assets ---------------- */
function assetAgeYears(a) { return a.install ? Math.max(0, (Date.now() - new Date(a.install).getTime()) / (365.25 * 864e5)) : 0; }
function assetLifePct(a) {
  const life = Number(a.lifeYears) || 15;
  return clamp(Math.round((assetAgeYears(a) / life) * 100), 0, 100);
}
function filteredAssets() {
  const q = UI.assetSearch.toLowerCase();
  return DB.assets.filter((a) =>
    (!q || [a.name, a.tag, a.location, a.category, a.vendor].join(' ').toLowerCase().includes(q)) &&
    (!UI.assetCat || a.category === UI.assetCat) &&
    (!UI.assetStatus || a.status === UI.assetStatus)
  ).sort((a, b) => a.tag.localeCompare(b.tag));
}
function renderAssets() {
  const kp = byId('assetKpis');
  if (kp) {
    const total = DB.assets.length;
    const op = DB.assets.filter((a) => a.status === 'Operational').length;
    const bad = DB.assets.filter((a) => a.status === 'Faulty' || a.status === 'Under Maintenance').length;
    const value = DB.assets.reduce((s, a) => s + (Number(a.cost) || 0), 0);
    const cards = [
      { icon: 'building', cls: '', label: 'Registered assets', value: total, note: 'Across all locations' },
      { icon: 'check', cls: 'kpi__icon--ok', label: 'Operational', value: op, note: `${pct(op, total)}% availability` },
      { icon: 'alert', cls: 'kpi__icon--danger', label: 'Needs attention', value: bad, note: 'Faulty or under maintenance' },
      { icon: 'coins', cls: 'kpi__icon--info', label: 'Asset value', value: money(value, DB.settings.currency), note: 'Recorded replacement cost' }
    ];
    kp.innerHTML = cards.map((c, i) => `
      <div class="card glass kpi" data-reveal="zoom" data-delay="${i}">
        <div class="kpi__top"><div class="kpi__icon ${c.cls}">${icon(c.icon, 20)}</div></div>
        <div class="kpi__value">${typeof c.value === 'number' ? c.value : esc(c.value)}</div>
        <div class="kpi__label">${esc(c.label)}</div>
        <div style="font-size:.74rem;color:var(--text-3);margin-top:6px">${esc(c.note)}</div>
      </div>`).join('');
  }
  const sel = byId('assetCatFilter');
  if (sel) {
    const cats = Array.from(new Set(DB.assets.map((a) => a.category).filter(Boolean))).sort();
    sel.innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${esc(c)}"${UI.assetCat === c ? ' selected' : ''}>${esc(c)}</option>`).join('');
  }
  const rows = filteredAssets();
  const pageRange = renderPaginationControls({
    total: rows.length, page: UI.assetPage, perPage: UI.assetPerPage,
    infoEl: byId('assetPageInfo'), prevBtn: byId('assetPrevBtn'), nextBtn: byId('assetNextBtn'), pillsEl: byId('assetPagePills'),
    onPage: (p) => { UI.assetPage = p; renderAssets(); }
  });
  const pageRows = rows.slice(pageRange.start, pageRange.end);
  const table = byId('assetTable');
  if (table) {
    table.innerHTML = `
      <thead><tr>
        <th>Tag</th><th>Asset</th><th>Category</th><th>Location</th><th>Status</th><th>Criticality</th><th style="min-width:130px">Lifecycle</th><th class="num">Actions</th>
      </tr></thead>
      <tbody>${pageRows.length ? pageRows.map((a) => {
        const lp = assetLifePct(a);
        const cls = lp > 90 ? 'bar__fill--danger' : lp > 70 ? 'bar__fill--warn' : '';
        return `<tr>
          <td><span class="badge badge--cyan" style="font-family:var(--mono)">${esc(a.tag)}</span></td>
          <td><b style="font-size:.86rem">${esc(a.name)}</b><div style="font-size:.72rem;color:var(--text-3)">${esc(a.vendor || '')}</div></td>
          <td>${esc(a.category)}</td>
          <td style="font-size:.82rem">${esc(a.location)}</td>
          <td>${statusBadge(a.status)}</td>
          <td><span class="badge ${PRIORITY_CLS[a.criticality] || 'badge--muted'}">${esc(a.criticality)}</span></td>
          <td>
            <div class="row row--between" style="font-size:.7rem;color:var(--text-3);margin-bottom:4px"><span>${assetAgeYears(a).toFixed(1)} yrs</span><span>${lp}% of life</span></div>
            <div class="bar bar--sm"><div class="bar__fill ${cls}" data-fill="${lp}"></div></div>
          </td>
          <td>
            <div class="cell-actions">
              <button class="btn btn--xs btn--ghost" type="button" data-asset-view="${esc(a.id)}" title="Details">${icon('eye', 13)}</button>
              <button class="btn btn--xs btn--ghost" type="button" data-asset-qr="${esc(a.id)}" title="QR tag">${icon('qr', 13)}</button>
              ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-asset-edit="${esc(a.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
              ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-asset-del="${esc(a.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
            </div>
          </td>
        </tr>`;
      }).join('') : `<tr><td colspan="8"><div class="table-empty">${icon('search', 36)}<p>No assets match your filters.</p></div></td></tr>`}
      </tbody>`;
  }
  const cnt = byId('assetCount');
  if (cnt) cnt.textContent = `${rows.length} of ${DB.assets.length} assets`;
  requestAnimationFrame(() => $$('#assetTable .bar__fill').forEach((f) => { f.style.width = f.dataset.fill + '%'; }));
  initReveal();
}
function assetDetail(id) {
  const a = DB.assets.find((x) => x.id === id);
  if (!a) return;
  const lp = assetLifePct(a);
  const wos = DB.maintenance.filter((m) => m.assetId === a.id);
  const body = `
    <div class="stack" style="gap:16px">
      <div class="row" style="gap:8px">${statusBadge(a.status)}<span class="badge ${PRIORITY_CLS[a.criticality] || 'badge--muted'}">${esc(a.criticality)}</span><span class="badge badge--cyan" style="font-family:var(--mono)">${esc(a.tag)}</span></div>
      <div class="grid g-2" style="gap:12px">
        ${[['Category', a.category], ['Location', a.location], ['Installed', dLong(a.install)], ['Expected life', (a.lifeYears || 15) + ' years'],
           ['Vendor', a.vendor || '—'], ['Warranty until', a.warranty ? dLong(a.warranty) : '—'],
           ['Replacement cost', moneyExact(a.cost || 0, DB.settings.currency)], ['Last service', a.lastService ? dLong(a.lastService) : '—'],
           ['Next service', a.nextService ? dLong(a.nextService) : '—'], ['Age', assetAgeYears(a).toFixed(1) + ' years']]
          .map(([k, v]) => `<div class="neu" style="padding:11px"><div style="font-size:.63rem;color:var(--text-3);font-weight:800;letter-spacing:.09em;text-transform:uppercase">${esc(k)}</div><div style="font-size:.85rem;font-weight:600">${esc(v)}</div></div>`).join('')}
      </div>
      <div>
        <div class="row row--between" style="margin-bottom:8px"><b style="font-size:.86rem">Remaining useful life</b><b style="font-size:.86rem;color:${lp > 90 ? 'var(--danger)' : lp > 70 ? 'var(--warn)' : 'var(--ok)'}">${Math.max(0, 100 - lp)}%</b></div>
        <div class="bar bar--lg"><div class="bar__fill ${lp > 90 ? 'bar__fill--danger' : lp > 70 ? 'bar__fill--warn' : 'bar__fill--emerald'}" style="width:${lp}%"></div></div>
        <p style="font-size:.78rem;color:var(--text-3);margin-top:6px">${esc(a.notes || 'No condition notes recorded.')}</p>
      </div>
      <div>
        <b style="font-size:.86rem">Maintenance history (${wos.length})</b>
        <div class="stack" style="gap:8px;margin-top:10px">${wos.length ? wos.map((w) => `
          <div class="row row--between" style="gap:10px;padding:9px 11px;border:1px solid var(--border);border-radius:10px">
            <div style="min-width:0"><div style="font-size:.84rem;font-weight:700">${esc(w.title)}</div><div style="font-size:.72rem;color:var(--text-3)">${esc(w.tech)} · ${dShort(w.date)}</div></div>
            ${statusBadge(w.status)}
          </div>`).join('') : '<p style="font-size:.84rem;color:var(--text-3)">No work orders recorded against this asset.</p>'}</div>
      </div>
    </div>`;
  const foot = el('div', { class: 'row', style: 'width:100%;justify-content:space-between' }, [
    el('button', { class: 'btn btn--ghost btn--sm', type: 'button', html: icon('qr', 14) + ' QR tag', onclick: () => assetQr(a.id) }),
    el('div', { class: 'row', style: 'gap:8px' }, [
      can('edit') ? el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: 'Edit asset', onclick: () => { closeModal(); assetForm(a.id); } }) : null,
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Close', onclick: closeModal })
    ])
  ]);
  openModal({ title: a.name, body, footer: foot, wide: true });
}
function assetQr(id) {
  const a = DB.assets.find((x) => x.id === id);
  if (!a) return;
  const payload = JSON.stringify({ tag: a.tag, id: a.id, name: a.name, loc: a.location, cat: a.category, status: a.status });
  const body = el('div', { class: 'stack', style: 'align-items:center;gap:16px' }, [
    el('div', { class: 'qr-box' }, [el('div', { id: 'qrTarget' }), el('span', { text: a.tag })]),
    el('p', { style: 'font-size:.83rem;text-align:center;max-width:44ch', text: `${a.name} — ${a.location}. Print and affix to the asset; scanning opens the asset record payload.` }),
    el('div', { class: 'glass card', style: 'padding:12px;width:100%' }, [
      el('div', { style: 'font-size:.7rem;color:var(--text-3);font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px', text: 'Encoded payload' }),
      el('pre', { style: 'font-family:var(--mono);font-size:.7rem;white-space:pre-wrap;word-break:break-all;color:var(--text-2)', text: payload })
    ])
  ]);
  const foot = el('div', { class: 'row', style: 'width:100%;justify-content:flex-end;gap:8px' }, [
    el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Close', onclick: closeModal }),
    el('button', { class: 'btn btn--primary btn--sm', type: 'button', html: icon('print', 14) + ' Print tag', onclick: () => printQr(a) })
  ]);
  openModal({ title: 'Asset QR tag', body, footer: foot, narrow: true, onOpen: () => {
    const target = byId('qrTarget');
    if (typeof window.QRCode !== 'undefined') {
      try { new QRCode(target, { text: payload, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M }); }
      catch (_) { target.innerHTML = svgQrFallback(a.tag); }
    } else target.innerHTML = svgQrFallback(a.tag);
  } });
}
function svgQrFallback(tag) {
  // deterministic decorative matrix (not scannable) used only when the QR library is unavailable
  let seed = 0; for (const ch of String(tag)) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
  let cells = '';
  const n = 21;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    const on = finder ? ((x % 6 === 0 || y % 6 === 0) || (x > 1 && x < 5 && y > 1 && y < 5)) : ((seed >> 8) % 2 === 0);
    if (on) cells += `<rect x="${x * 10}" y="${y * 10}" width="10" height="10" fill="#0F172A"/>`;
  }
  return `<svg viewBox="0 0 210 210" width="200" height="200" role="img" aria-label="Asset tag placeholder">${cells}</svg>`;
}
function printQr(a) {
  const payload = JSON.stringify({ tag: a.tag, id: a.id, name: a.name, loc: a.location });
  const w = window.open('', '_blank', 'width=460,height=620');
  if (!w) { toast('warn', 'Popup blocked', 'Allow popups to print the asset tag.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>${esc(a.tag)} — Asset tag</title>
    <style>body{font-family:'Segoe UI',system-ui,sans-serif;padding:26px;text-align:center;color:#0F172A}
    .tag{border:2px solid #0F172A;border-radius:14px;padding:20px;max-width:340px;margin:0 auto}
    h1{font-size:17px;margin:0 0 4px} p{margin:3px 0;font-size:12px;color:#334155}
    code{font-size:10px;word-break:break-all;display:block;margin-top:10px;color:#475569}
    .mark{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#0E7490;margin-bottom:10px}</style></head>
    <body><div class="tag"><div class="mark">Arjun Singh · FM Asset Tag</div>
    <div id="q"></div><h1>${esc(a.tag)}</h1><p><b>${esc(a.name)}</b></p>
    <p>${esc(a.location)}</p><p>${esc(a.category)} · ${esc(a.status)}</p>
    <code>${esc(payload)}</code></div>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
    <script>window.addEventListener('load',function(){var q=document.getElementById('q');
      if(window.QRCode){new QRCode(q,{text:${JSON.stringify(payload)},width:180,height:180});}
      setTimeout(function(){window.print();},420);});<\/script></body></html>`);
  w.document.close();
}

/* ---------------- Maintenance ---------------- */
function woKpis() {
  const rows = DB.maintenance;
  const open = rows.filter((w) => w.status !== 'Completed').length;
  const overdue = rows.filter((w) => w.status === 'Overdue' || (w.status !== 'Completed' && w.due && new Date(w.due) < new Date(todayISO()))).length;
  const ppm = rows.filter((w) => w.type === 'Preventive').length;
  const reactive = rows.filter((w) => w.type === 'Reactive').length;
  const cost = rows.reduce((s, w) => s + (Number(w.cost) || 0), 0);
  return [
    { icon: 'clock', cls: 'kpi__icon--info', label: 'Open work orders', value: open, note: `${rows.length} total logged` },
    { icon: 'alert', cls: 'kpi__icon--danger', label: 'Overdue', value: overdue, note: overdue ? 'Escalate to vendor' : 'Nothing overdue', bar: rows.length ? pct(overdue, rows.length) : 0 },
    { icon: 'wrench', cls: '', label: 'PPM vs Reactive', value: `${ppm} / ${reactive}`, note: `${pct(ppm, rows.length)}% planned` },
    { icon: 'coins', cls: 'kpi__icon--ok', label: 'Maintenance spend', value: money(cost, DB.settings.currency), note: 'Recorded in work orders' }
  ];
}
function renderMaintenance() {
  const kp = byId('maintKpis');
  if (kp) {
    kp.innerHTML = woKpis().map((c, i) => `
      <div class="card glass kpi" data-reveal="zoom" data-delay="${i}">
        <div class="kpi__top"><div class="kpi__icon ${c.cls}">${icon(c.icon, 20)}</div></div>
        <div class="kpi__value">${typeof c.value === 'number' ? c.value : esc(c.value)}</div>
        <div class="kpi__label">${esc(c.label)}</div>
        ${c.bar !== undefined ? `<div class="bar bar--sm" style="margin-top:10px"><div class="bar__fill ${c.bar > 20 ? 'bar__fill--danger' : 'bar__fill--warn'}" data-fill="${c.bar}"></div></div>` : ''}
        <div style="font-size:.74rem;color:var(--text-3);margin-top:8px">${esc(c.note)}</div>
      </div>`).join('');
  }
  const host = byId('woList');
  if (host) {
    const allRows = DB.maintenance
      .filter((w) => UI.woFilter === 'all' || w.type === UI.woFilter)
      .sort((a, b) => new Date(a.due || a.date) - new Date(b.due || b.date));
    const pageRange = renderPaginationControls({
      total: allRows.length, page: UI.woPage, perPage: UI.woPerPage,
      infoEl: byId('woPageInfo'), prevBtn: byId('woPrevBtn'), nextBtn: byId('woNextBtn'), pillsEl: byId('woPagePills'),
      onPage: (p) => { UI.woPage = p; renderMaintenance(); }
    });
    const rows = allRows.slice(pageRange.start, pageRange.end);
    host.innerHTML = rows.map((w) => `
      <div class="glass card" style="padding:14px" data-reveal="fade">
        <div class="row row--between" style="gap:10px;align-items:flex-start">
          <div style="min-width:0;flex:1">
            <div class="row" style="gap:7px;margin-bottom:6px">
              ${statusBadge(w.status)}
              <span class="badge ${w.type === 'Preventive' ? 'badge--info' : 'badge--warn'}">${esc(w.type)}</span>
              <span class="badge ${PRIORITY_CLS[w.priority] || 'badge--muted'}">${esc(w.priority || '')}</span>
            </div>
            <div style="font-size:.9rem;font-weight:700">${esc(w.title)}</div>
            <div style="font-size:.75rem;color:var(--text-3);margin-top:3px">${esc(w.id)} · ${esc(w.asset || '—')} · ${esc(w.tech || 'Unassigned')} · due ${dShort(w.due || w.date)}</div>
          </div>
          <div class="row" style="gap:6px;flex:none">
            <button class="btn btn--xs btn--ghost" type="button" data-wo-view="${esc(w.id)}" title="Details">${icon('eye', 13)}</button>
            ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-wo-edit="${esc(w.id)}" title="Edit / assign">${icon('edit', 13)}</button>` : ''}
            ${can('edit') ? `<button class="btn btn--xs btn--primary" type="button" data-wo-advance="${esc(w.id)}" title="Advance status">${icon('play', 13)}</button>` : ''}
          </div>
        </div>
      </div>`).join('') || `<div class="table-empty">${icon('check', 36)}<p>No work orders in this view.</p></div>`;
  }
  if (kp) requestAnimationFrame(() => $$('#maintKpis .bar__fill').forEach((f) => { f.style.width = f.dataset.fill + '%'; }));
  renderMaintChart();
  initReveal();
}
function renderMaintChart() {
  if (!chartReady()) { chartFallback('chartMaintMix'); return; }
  const ppm = DB.maintenance.filter((w) => w.type === 'Preventive').length;
  const re = DB.maintenance.filter((w) => w.type === 'Reactive').length;
  destroyChart('mix');
  const c = ensureCanvas('chartMaintMix');
  if (!c) return;
  UI.charts.mix = new Chart(c, {
    type: 'doughnut',
    data: { labels: ['Preventive (PPM)', 'Reactive'], datasets: [{ data: [ppm, re], backgroundColor: ['#10B981', '#F59E0B'], borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '64%',
      plugins: {
        legend: { position: 'bottom', labels: { color: chartText(), font: chartFont(), usePointStyle: true, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: (x) => ` ${x.label}: ${x.parsed} work orders` } }
      }
    }
  });
}
const WO_FLOW = { 'Scheduled': 'In Progress', 'In Progress': 'Completed', 'Overdue': 'In Progress', 'Completed': 'Scheduled' };
function advanceWo(id) {
  const w = DB.maintenance.find((x) => x.id === id);
  if (!w) return;
  w.status = WO_FLOW[w.status] || 'In Progress';
  if (w.status === 'Completed') w.completedAt = nowISO();
  saveDB(); logActivity(`Work order ${w.id} moved to ${w.status}`); notify(`Work order ${w.id}`, `Status changed to ${w.status}`, w.status === 'Completed' ? 'ok' : 'info', 'maintenance');
  toast('ok', 'Work order updated', `${w.id} → ${w.status}`);
  renderMaintenance(); renderDashCounts();
}

/* ---------------- Calendar (FullCalendar with graceful fallback) ---------------- */
function woEvents() {
  return DB.maintenance.map((w) => ({
    id: w.id, title: w.title, start: w.due || w.date, allDay: true,
    backgroundColor: w.status === 'Completed' ? '#10B981' : w.status === 'Overdue' ? '#F43F5E' : w.type === 'Preventive' ? '#0EA5E9' : '#F59E0B',
    borderColor: 'transparent',
    extendedProps: { wo: w }
  }));
}
function renderCalendar(elId) {
  const host = byId(elId);
  if (!host) return null;
  if (typeof window.FullCalendar === 'undefined') {
    host.innerHTML = simpleCalendarHtml();
    return null;
  }
  try {
    if (UI.calendar) { UI.calendar.destroy(); UI.calendar = null; }
    UI.calendar = new FullCalendar.Calendar(host, {
      initialView: 'dayGridMonth', height: 'auto', firstDay: 1, headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' },
      events: woEvents(), dayMaxEvents: 3, eventDisplay: 'block',
      eventClick: (info) => { const w = info.event.extendedProps.wo; if (w) woDetail(w.id); },
      dateClick: () => {}
    });
    UI.calendar.render();
    return UI.calendar;
  } catch (err) {
    console.warn('FullCalendar failed', err);
    host.innerHTML = simpleCalendarHtml();
    return null;
  }
}
function simpleCalendarHtml() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const byDay = {};
  DB.maintenance.forEach((w) => {
    const d = new Date(w.due || w.date);
    if (d.getMonth() === m && d.getFullYear() === y) { const k = d.getDate(); (byDay[k] = byDay[k] || []).push(w); }
  });
  let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<div style="text-align:center;font-size:.68rem;font-weight:800;color:var(--text-3);padding:6px">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) cells += '<div></div>';
  for (let d = 1; d <= days; d++) {
    const list = byDay[d] || [];
    const isToday = d === now.getDate();
    cells += `<div style="min-height:70px;border:1px solid var(--border);border-radius:9px;padding:5px;${isToday ? 'background:rgba(6,182,212,.1);border-color:rgba(6,182,212,.4)' : ''}">
      <div style="font-size:.7rem;font-weight:800;color:${isToday ? 'var(--cyan)' : 'var(--text-3)'}">${d}</div>
      ${list.slice(0, 2).map((w) => `<button type="button" data-wo-view="${esc(w.id)}" style="display:block;width:100%;text-align:left;font-size:.64rem;font-weight:700;margin-top:3px;padding:2px 5px;border-radius:5px;background:${w.status === 'Completed' ? '#10B981' : w.status === 'Overdue' ? '#F43F5E' : '#0EA5E9'};color:#04121b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(w.id)}</button>`).join('')}
      ${list.length > 2 ? `<div style="font-size:.62rem;color:var(--text-3);margin-top:2px">+${list.length - 2} more</div>` : ''}
    </div>`;
  }
  return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">${cells}</div>
    <p style="font-size:.74rem;color:var(--text-3);margin-top:10px">${icon('alert', 13)} Calendar library unavailable offline — showing this month's schedule instead.</p>`;
}
function woDetail(id) {
  const w = DB.maintenance.find((x) => x.id === id);
  if (!w) return;
  const body = `
    <div class="stack" style="gap:15px">
      <div class="row" style="gap:8px">${statusBadge(w.status)}<span class="badge ${w.type === 'Preventive' ? 'badge--info' : 'badge--warn'}">${esc(w.type)}</span><span class="badge ${PRIORITY_CLS[w.priority] || 'badge--muted'}">${esc(w.priority || '')}</span></div>
      <div class="grid g-2" style="gap:12px">
        ${[['Work order', w.id], ['Asset', w.asset || '—'], ['Technician', w.tech || 'Unassigned'], ['Due date', dLong(w.due || w.date)],
           ['Raised', dLong(w.date)], ['Recorded cost', moneyExact(w.cost || 0, DB.settings.currency)], ['Completed', w.completedAt ? dLong(w.completedAt) : '—'], ['Type', w.type]]
          .map(([k, v]) => `<div class="neu" style="padding:11px"><div style="font-size:.63rem;color:var(--text-3);font-weight:800;letter-spacing:.09em;text-transform:uppercase">${esc(k)}</div><div style="font-size:.85rem;font-weight:600">${esc(v)}</div></div>`).join('')}
      </div>
      <div><b style="font-size:.86rem">Notes</b><p style="font-size:.87rem;margin-top:6px">${esc(w.notes || '—')}</p></div>
    </div>`;
  const foot = el('div', { class: 'row', style: 'width:100%;justify-content:flex-end;gap:8px' }, [
    can('edit') ? el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: 'Edit / assign', onclick: () => { closeModal(); woForm(w.id); } }) : null,
    el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Close', onclick: closeModal })
  ]);
  openModal({ title: w.title, body, footer: foot });
}

/* ---------------- Credentials ---------------- */
function renderCredentials() {
  const certs = byId('certList');
  if (certs) {
    certs.innerHTML = (DB.certifications || []).map((c, i) => `
      <div class="glass card card--hover" style="padding:14px;display:flex;gap:13px;align-items:flex-start" data-reveal="fade" data-delay="${i % 5}">
        <span class="contact-card__icon" style="width:40px;height:40px;border-radius:12px;color:var(--cyan);background:rgba(6,182,212,.12);border-color:rgba(6,182,212,.3)">${icon('shield', 18)}</span>
        <span style="flex:1;min-width:0">
          <b style="display:block;font-size:.9rem;line-height:1.35">${esc(c.name)}</b>
          <span style="display:block;font-size:.78rem;color:var(--text-3);margin-top:3px">${esc(c.issuer)}</span>
          <span class="row" style="gap:6px;margin-top:8px">
            ${c.year && c.year !== '—' ? `<span class="badge badge--muted">${esc(c.year)}</span>` : ''}
            <span class="badge ${c.status === 'Active' ? 'badge--ok' : 'badge--muted'}">${esc(c.status || 'Active')}</span>
            ${c.credential ? `<span class="badge badge--info" style="font-size:.68rem">${esc(c.credential)}</span>` : ''}
          </span>
        </span>
        <span class="row" style="gap:5px;flex:none">
          <button class="btn btn--xs btn--ghost" type="button" data-cert-pdf="${esc(c.id)}" title="Download certificate record (PDF)">${icon('download', 13)}</button>
          ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-cert-edit="${esc(c.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
        </span>
      </div>`).join('');
  }

  const edu = byId('eduList');
  if (edu) {
    edu.innerHTML = (DB.education || []).map((e) => `
      <div class="glass card card--hover" style="padding:15px" data-reveal="fade">
        <div class="row" style="gap:12px;align-items:flex-start">
          <span class="contact-card__icon" style="width:40px;height:40px;border-radius:12px;color:var(--violet);background:var(--violet-bg);border-color:rgba(139,92,246,.3)">${icon('book', 18)}</span>
          <span style="flex:1">
            <b style="display:block;font-size:.92rem">${esc(e.degree)}</b>
            <span style="display:block;font-size:.8rem;color:var(--text-3);margin-top:3px">${esc(e.institution)} — ${esc(e.location || '')}</span>
            ${e.notes ? `<span style="display:block;font-size:.78rem;color:var(--text-2);margin-top:6px">${esc(e.notes)}</span>` : ''}
          </span>
          <span class="badge badge--cyan" style="flex:none">${esc(e.year)}</span>
        </div>
      </div>`).join('');
  }

  const tr = byId('trainingList');
  if (tr) {
    // Show the 5 Awards and Accolades in trainingList / Awards card
    const items = (DB.awards && DB.awards.length) ? DB.awards : (DB.certifications || []);
    tr.innerHTML = items.map((a) => `
      <div class="row row--between" style="gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card-bg)" data-reveal="fade">
        <span style="min-width:0">
          <b style="display:block;font-size:.85rem">${esc(a.title || a.name)}</b>
          <span style="font-size:.75rem;color:var(--text-3)">${esc(a.issuer || a.org || '')}</span>
        </span>
        <span class="badge badge--warn" style="flex:none">${esc(a.year || (a.date ? a.date.slice(0, 4) : 'Award'))}</span>
      </div>`).join('');
  }
  initReveal();
}

/* ---------------- Blog + testimonials ---------------- */
function filteredBlog() {
  const q = UI.blogSearch.toLowerCase();
  return DB.blog.filter((b) => b.published !== false &&
    (!q || (b.title + ' ' + b.excerpt + ' ' + (b.tags || []).join(' ') + ' ' + b.body).toLowerCase().includes(q)) &&
    (!UI.blogCat || b.category === UI.blogCat)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));
}
function renderBlog() {
  const sel = byId('blogCatFilter');
  if (sel) {
    const cats = Array.from(new Set(DB.blog.map((b) => b.category).filter(Boolean))).sort();
    sel.innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${esc(c)}"${UI.blogCat === c ? ' selected' : ''}>${esc(c)}</option>`).join('');
  }
  const grid = byId('blogGrid');
  if (!grid) return;
  const allRows = filteredBlog();
  const pageRange = renderPaginationControls({
    total: allRows.length, page: UI.blogPage, perPage: UI.blogPerPage,
    infoEl: byId('blogPageInfo'), prevBtn: byId('blogPrevBtn'), nextBtn: byId('blogNextBtn'), pillsEl: byId('blogPagePills'),
    onPage: (p) => { UI.blogPage = p; renderBlog(); }
  });
  const rows = allRows.slice(pageRange.start, pageRange.end);
  grid.innerHTML = rows.map((b, i) => `
    <article class="glass card card--hover post" data-reveal="zoom" data-delay="${i % 3}">
      <div class="post__meta">
        <span class="badge badge--cyan">${esc(b.category)}</span>
        <span>${dShort(b.date)}</span>
        <span>· ${esc(String(b.readMins || 5))} min read</span>
      </div>
      <h3 class="post__t">${esc(b.title)}</h3>
      <p class="post__x">${esc(b.excerpt || '')}</p>
      <div class="proj__tags">${(b.tags || []).slice(0, 3).map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:auto">
        <button class="btn btn--ghost btn--xs" type="button" data-blog-read="${esc(b.id)}">${icon('book', 13)} Read article</button>
        ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-blog-edit="${esc(b.id)}">${icon('edit', 13)}</button>` : ''}
        ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-blog-del="${esc(b.id)}">${icon('trash', 13)}</button>` : ''}
      </div>
    </article>`).join('') || `<div class="table-empty" style="grid-column:1/-1">${icon('book', 36)}<p>No articles match your search.</p></div>`;
  initReveal();
}
function blogRead(id) {
  const b = DB.blog.find((x) => x.id === id);
  if (!b) return;
  const body = `
    <div class="stack" style="gap:15px">
      <div class="post__meta"><span class="badge badge--cyan">${esc(b.category)}</span><span>${dLong(b.date)}</span><span>· ${esc(b.author || 'Arjun Singh')}</span><span>· ${esc(String(b.readMins || 5))} min read</span></div>
      <p style="font-size:.98rem;font-weight:600;color:var(--text)">${esc(b.excerpt || '')}</p>
      <hr class="hairline">
      <div style="font-size:.92rem;line-height:1.8;color:var(--text-2);white-space:pre-line">${esc(b.body || '')}</div>
      ${(b.tags || []).length ? `<div class="row" style="gap:6px">${b.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
    </div>`;
  const foot = el('div', { class: 'row', style: 'width:100%;justify-content:space-between;gap:8px' }, [
    el('button', { class: 'btn btn--ghost btn--sm', type: 'button', html: icon('print', 14) + ' Print', onclick: () => window.print() }),
    el('div', { class: 'row', style: 'gap:8px' }, [
      can('edit') ? el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: 'Edit article', onclick: () => { closeModal(); blogForm(b.id); } }) : null,
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Close', onclick: closeModal })
    ])
  ]);
  openModal({ title: b.title, body, footer: foot, wide: true });
}
let testiTimer = null;
function renderTestimonials() {
  const approved = DB.testimonials.filter((x) => x.approved !== false);
  const track = byId('testiTrack');
  const dots = byId('testiDots');
  if (!track) return;
  if (!approved.length) {
    track.innerHTML = '<div class="slider__slide"><p style="color:var(--text-3)">No testimonials yet.</p></div>';
    if (dots) dots.innerHTML = '';
    return;
  }
  UI.testiIndex = clamp(UI.testiIndex, 0, approved.length - 1);
  track.innerHTML = approved.map((x) => `
    <div class="slider__slide" role="group" aria-roledescription="slide" aria-label="${esc(x.name)}">
      <div class="quote-mark" aria-hidden="true">&ldquo;</div>
      <p style="font-size:clamp(.95rem,1.4vw,1.12rem);color:var(--text);line-height:1.75;margin:6px 0 16px">${esc(x.text)}</p>
      <div class="row row--between" style="gap:12px">
        <div class="row" style="gap:11px">
          <span class="contact-card__icon" style="width:42px;height:42px;border-radius:50%;font-weight:800">${esc(initials(x.name))}</span>
          <span><b style="display:block;font-size:.9rem">${esc(x.name)}</b><span style="font-size:.78rem;color:var(--text-3)">${esc(x.role || '')}</span></span>
        </div>
        <div class="stars" aria-label="${x.rating} out of 5">${'★'.repeat(x.rating)}${'☆'.repeat(5 - x.rating)}</div>
      </div>
    </div>`).join('');
  if (dots) dots.innerHTML = approved.map((x, i) => `<button class="slider__dot${i === UI.testiIndex ? ' is-active' : ''}" type="button" role="tab" aria-label="Testimonial ${i + 1}" aria-selected="${i === UI.testiIndex}" data-testi="${i}"></button>`).join('');
  slideTesti(UI.testiIndex);
  clearInterval(testiTimer);
  if (approved.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    testiTimer = setInterval(() => slideTesti((UI.testiIndex + 1) % approved.length), 7500);
  }
  // rating summary
  const total = approved.reduce((s, x) => s + x.rating, 0);
  const avgV = (total / approved.length).toFixed(1);
  if (byId('testiAvg')) byId('testiAvg').textContent = avgV;
  if (byId('testiCount')) byId('testiCount').textContent = `${approved.length} review${approved.length > 1 ? 's' : ''}`;
  if (byId('testiAvgStars')) byId('testiAvgStars').innerHTML = '★'.repeat(Math.round(avgV)) + '☆'.repeat(5 - Math.round(avgV));
  const dist = [5, 4, 3, 2, 1].map((r) => ({ r, n: approved.filter((x) => x.rating === r).length }));
  if (byId('testiBars')) {
    byId('testiBars').innerHTML = dist.map((d) => `
      <div class="row" style="gap:9px;align-items:center">
        <span style="font-size:.74rem;color:var(--text-3);width:26px;font-weight:700">${d.r}★</span>
        <span class="bar bar--sm" style="flex:1"><span class="bar__fill" style="width:${pct(d.n, approved.length)}%;display:block;height:100%;border-radius:99px;background:var(--accent-grad)"></span></span>
        <span style="font-size:.74rem;color:var(--text-3);width:18px;text-align:right">${d.n}</span>
      </div>`).join('');
  }
  if (chartReady() && ensureCanvas('chartRatings')) {
    destroyChart('ratings');
    UI.charts.ratings = new Chart(ensureCanvas('chartRatings'), {
      type: 'doughnut',
      data: { labels: dist.map((d) => `${d.r} star`), datasets: [{ data: dist.map((d) => d.n), backgroundColor: ['#10B981', '#06B6D4', '#3B82F6', '#F59E0B', '#F43F5E'], borderWidth: 0, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} review(s)` } } } }
    });
  } else if (ensureCanvas('chartRatings')) chartFallback('chartRatings');
}
function slideTesti(i) {
  const approved = DB.testimonials.filter((x) => x.approved !== false);
  if (!approved.length) return;
  UI.testiIndex = clamp(i, 0, approved.length - 1);
  const track = byId('testiTrack');
  if (track) track.style.transform = `translateX(-${UI.testiIndex * 100}%)`;
  $$('#testiDots .slider__dot').forEach((d, idx) => {
    d.classList.toggle('is-active', idx === UI.testiIndex);
    d.setAttribute('aria-selected', String(idx === UI.testiIndex));
  });
}

/* ---------------- Contact ---------------- */
function renderContact() {
  const p = DB.profile;
  const host = byId('contactCards');
  if (host) {
    const cards = [
      { icon: 'mail', label: 'Email', value: p.email, href: `mailto:${p.email}` },
      { icon: 'phone', label: 'Mobile', value: p.phone, href: `tel:${p.phoneRaw || p.phone}` },
      { icon: 'whatsapp', label: 'WhatsApp', value: 'Chat instantly', href: p.social.whatsapp },
      { icon: 'pin', label: 'Location', value: p.address, href: 'https://www.openstreetmap.org/?mlat=25.1875&mlon=55.2750#map=14/25.1875/55.2750' }
    ];
    host.innerHTML = cards.map((c, i) => `
      <a class="card glass contact-card" href="${esc(c.href)}" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} data-reveal="zoom" data-delay="${i}">
        <span class="contact-card__icon">${icon(c.icon, 19)}</span>
        <span style="min-width:0">
          <b style="display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.09em;color:var(--text-3)">${esc(c.label)}</b>
          <span style="font-size:.85rem;font-weight:600;word-break:break-word">${esc(c.value)}</span>
        </span>
      </a>`).join('');
  }
  const fs = byId('footerSocials');
  if (fs) {
    const items = [
      { icon: 'linkedin', href: p.social.linkedin, label: 'LinkedIn' },
      { icon: 'whatsapp', href: p.social.whatsapp, label: 'WhatsApp' },
      { icon: 'mail', href: `mailto:${p.email}`, label: 'Email' },
      { icon: 'phone', href: `tel:${p.phoneRaw || p.phone}`, label: 'Phone' }
    ];
    fs.innerHTML = items.map((s) => `<a class="social" href="${esc(s.href)}" aria-label="${esc(s.label)}" ${s.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${icon(s.icon, 17)}</a>`).join('');
  }
  const mail = byId('footerEmail'); if (mail) { mail.href = `mailto:${p.email}`; mail.textContent = p.email; }
  const tel = byId('footerPhone'); if (tel) { tel.href = `tel:${p.phoneRaw || p.phone}`; tel.textContent = p.phone; }
  initReveal();
}
function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value.trim(), email: form.email.value.trim(), company: form.company.value.trim(),
    subject: form.subject.value.trim(), message: form.message.value.trim()
  };
  const err = byId('cfError');
  const fail = (m) => { err.textContent = m; err.classList.remove('hide'); };
  if (!data.name) return fail('Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return fail('Please enter a valid email address.');
  if (data.message.length < 10) return fail('Please add a little more detail to your message.');
  err.classList.add('hide');
  DB.messages.unshift(Object.assign({ id: uid('m'), date: nowISO(), read: false, source: 'portfolio' }, data));
  notify('New enquiry', `${data.name} — ${data.subject || 'Portfolio enquiry'}`, 'ok', 'contact');
  logActivity(`Enquiry received from ${data.name}`);
  saveDB();
  form.reset();
  toast('ok', 'Message saved', 'Your enquiry is recorded. Connect your mail client to send it externally.');
  renderDashCounts();
  if (UI.dashPanel === 'contact' && UI.view === 'dashboard') renderDashPanel('contact');
}

/* ==========================================================================
   Form Generators, CRUD Handlers, Reporting & File Exports (PDF / Excel / CSV)
   ========================================================================== */
/* ==========================================================================
   PART E — Forms (CRUD), file handling, PDF/Excel/CSV exports, reports
   ========================================================================== */

function fText(name, label, value = '', opts = {}) {
  return `<div class="field ${opts.full ? 'form-grid--full' : ''}">
    <label for="f_${name}">${esc(label)}</label>
    <input class="input" id="f_${name}" name="${name}" type="${opts.type || 'text'}" value="${esc(value ?? '')}"
      placeholder="${esc(opts.ph || '')}" ${opts.required ? 'required' : ''} ${opts.step ? `step="${opts.step}"` : ''} ${opts.min ? `min="${opts.min}"` : ''} ${opts.max ? `max="${opts.max}"` : ''}>
  </div>`;
}
function fArea(name, label, value = '', opts = {}) {
  return `<div class="field form-grid--full">
    <label for="f_${name}">${esc(label)}</label>
    <textarea class="textarea" id="f_${name}" name="${name}" placeholder="${esc(opts.ph || '')}" ${opts.rows ? `rows="${opts.rows}"` : ''}>${esc(value ?? '')}</textarea>
  </div>`;
}
function fSelect(name, label, value, options, opts = {}) {
  return `<div class="field">
    <label for="f_${name}">${esc(label)}</label>
    <select class="select" id="f_${name}" name="${name}" ${opts.multiple ? 'multiple size="5"' : ''}>
      ${(options || []).map((o) => {
        const val = typeof o === 'object' ? o.value : o;
        const lab = typeof o === 'object' ? o.label : o;
        const sel = Array.isArray(value) ? value.includes(val) : String(value) === String(val);
        return `<option value="${esc(val)}"${sel ? ' selected' : ''}>${esc(lab)}</option>`;
      }).join('')}
    </select>
  </div>`;
}
function fRange(name, label, value = 50, min = 0, max = 100) {
  return `<div class="field form-grid--full">
    <label for="f_${name}">${esc(label)} <span id="f_${name}_out" style="color:var(--cyan)">${value}%</span></label>
    <input type="range" id="f_${name}" name="${name}" min="${min}" max="${max}" value="${value}" step="1"
      style="width:100%;accent-color:var(--cyan)" oninput="document.getElementById('f_${name}_out').textContent=this.value+'%'">
  </div>`;
}
function fCheck(name, label, checked) {
  return `<div class="field">
    <label for="f_${name}">${esc(label)}</label>
    <label class="row" style="gap:9px;cursor:pointer;padding-top:6px">
      <span class="switch"><input type="checkbox" id="f_${name}" name="${name}" ${checked ? 'checked' : ''}><span class="switch__track"></span></span>
      <span style="font-size:.84rem;color:var(--text-2)">${checked ? 'Enabled' : 'Disabled'}</span>
    </label>
  </div>`;
}
function readForm(form) {
  const out = {};
  $$('input,select,textarea', form).forEach((f) => {
    if (!f.name) return;
    if (f.type === 'checkbox') out[f.name] = f.checked;
    else if (f.multiple) out[f.name] = Array.from(f.selectedOptions).map((o) => o.value);
    else if (f.type === 'number' || f.type === 'range') out[f.name] = f.value === '' ? 0 : Number(f.value);
    else out[f.name] = f.value.trim ? f.value.trim() : f.value;
  });
  return out;
}

/* ---- generic CRUD form ---- */
function openEntityForm(cfg) {
  const { title, fields, values = {}, onSubmit, wide = true, saveLabel = 'Save', deleteFn } = cfg;
  const form = el('form', { id: 'entityForm', novalidate: true, html: `<div class="form-grid">${fields.join('')}</div>` });
  const err = el('p', { class: 'hide', role: 'alert', style: 'color:var(--danger);font-size:.84rem;font-weight:700;margin-top:12px' });
  const foot = el('div', { class: 'row', style: 'width:100%;justify-content:space-between;gap:8px' }, [
    el('div', { class: 'row', style: 'gap:8px' }, [
      deleteFn ? el('button', { class: 'btn btn--danger btn--sm', type: 'button', text: 'Delete', onclick: () => { closeModal(); deleteFn(); } }) : null
    ]),
    el('div', { class: 'row', style: 'gap:8px' }, [
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Cancel', onclick: closeModal }),
      el('button', { class: 'btn btn--primary btn--sm', type: 'submit', form: 'entityForm', text: saveLabel })
    ])
  ]);
  openModal({ title, body: form, footer: foot, wide, onOpen: (bodyEl) => { bodyEl.append(err); } });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = readForm(form);
    const msg = onSubmit(data);
    if (msg) { err.textContent = msg; err.classList.remove('hide'); return; }
    closeModal();
  });
}

/* ---- image picking ---- */
function pickImages(cb, multiple = true) {
  const input = byId('hiddenFile');
  input.accept = 'image/*';
  input.multiple = multiple;
  input.value = '';
  input.onchange = () => {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    let pending = files.length;
    const out = [];
    files.forEach((file) => {
      if (file.size > 1.6 * 1024 * 1024) { toast('warn', 'Image skipped', `${file.name} exceeds 1.6 MB. Compress it first to keep browser storage healthy.`); if (--pending === 0) cb(out); return; }
      const fr = new FileReader();
      fr.onload = () => { out.push({ name: file.name, data: fr.result }); if (--pending === 0) cb(out); };
      fr.onerror = () => { toast('danger', 'Read failed', file.name); if (--pending === 0) cb(out); };
      fr.readAsDataURL(file);
    });
  };
  input.click();
}
function pickJsonFile(cb) {
  const input = byId('hiddenFile');
  input.accept = 'application/json,.json';
  input.multiple = false;
  input.value = '';
  input.onchange = () => {
    const file = (input.files || [])[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => cb(fr.result, file.name);
    fr.onerror = () => toast('danger', 'Read failed', file.name);
    fr.readAsText(file);
  };
  input.click();
}

/* ==========================================================
   PROJECT FORM
   ========================================================== */
function projectForm(id) {
  if (!can('create') && !id) return toast('warn', 'Permission denied', 'Your role cannot create projects.');
  const p = id ? DB.projects.find((x) => x.id === id) : null;
  if (id && !can('edit')) return toast('warn', 'Permission denied', 'Your role cannot edit projects.');
  const v = p || { name: '', client: '', category: 'MEP', status: 'Planned', priority: 'Medium', budget: '', spent: '', start: todayISO(), end: '', progress: 0, desc: '', team: [], tags: [], outcomes: [] };
  const cats = Array.from(new Set(['MEP', 'Refurbishment', 'Safety', 'Landscaping', 'Contracts', 'Fit-out', 'Civil Works'].concat(DB.projects.map((x) => x.category))));
  const fields = [
    fText('name', 'Project name *', v.name, { ph: 'e.g. Chiller Plant Retrofit — Tower A' }),
    fText('client', 'Client / owner *', v.client, { ph: 'e.g. Owners Association, Tower A' }),
    fSelect('category', 'Category', v.category, cats),
    fSelect('status', 'Status', v.status, ['Planned', 'Ongoing', 'Completed', 'On Hold']),
    fSelect('priority', 'Priority', v.priority || 'Medium', ['Critical', 'High', 'Medium', 'Low']),
    fText('budget', 'Budget (' + DB.settings.currency + ')', v.budget, { type: 'number', min: 0, step: 1000 }),
    fText('spent', 'Spent to date (' + DB.settings.currency + ')', v.spent, { type: 'number', min: 0, step: 1000 }),
    fText('start', 'Start date', v.start, { type: 'date' }),
    fText('end', 'End date', v.end, { type: 'date' }),
    fText('team', 'Team members (comma separated)', (v.team || []).join(', '), { full: true, ph: 'MEP Team, 3rd-party contractor' }),
    fText('tags', 'Tags (comma separated)', (v.tags || []).join(', '), { full: true, ph: 'Chiller, Energy, Retrofit' }),
    fRange('progress', 'Progress', Number(v.progress) || 0),
    fArea('desc', 'Description', v.desc, { ph: 'Scope, approach and deliverables…' }),
    fArea('outcomes', 'Outcomes (one per line)', (v.outcomes || []).join('\n'), { ph: 'Measured result achieved…' })
  ];
  openEntityForm({
    title: p ? 'Edit project' : 'New project',
    fields, values: v,
    saveLabel: p ? 'Update project' : 'Create project',
    deleteFn: p && can('delete') ? () => confirmDialog(`Delete “${p.name}”? This cannot be undone.`, () => {
      DB.projects = DB.projects.filter((x) => x.id !== p.id);
      saveDB(); logActivity(`Deleted project ${p.name}`); toast('ok', 'Project deleted'); renderProjects(); renderDashCounts(); if (UI.view === 'dashboard') renderDashPanel('projects');
    }) : null,
    onSubmit: (d) => {
      if (!d.name) return 'Project name is required.';
      if (!d.client) return 'Client / owner is required.';
      if (d.start && d.end && new Date(d.end) < new Date(d.start)) return 'End date cannot be before the start date.';
      const team = String(d.team || '').split(',').map((s) => s.trim()).filter(Boolean);
      const tags = String(d.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
      const outcomes = String(d.outcomes || '').split('\n').map((s) => s.trim()).filter(Boolean);
      if (p) {
        Object.assign(p, { name: d.name, client: d.client, category: d.category, status: d.status, priority: d.priority, budget: d.budget, spent: d.spent, start: d.start, end: d.end, progress: d.progress, desc: d.desc, team, tags, outcomes });
        if (p.status === 'Completed') p.progress = 100;
        logActivity(`Updated project ${p.name}`);
        toast('ok', 'Project updated', p.name);
      } else {
        const created = {
          id: 'P-' + (1000 + DB.projects.length + 1 + Math.floor(Math.random() * 400)),
          name: d.name, client: d.client, category: d.category, status: d.status, priority: d.priority,
          budget: d.budget, spent: d.spent, start: d.start, end: d.end, progress: d.progress, desc: d.desc,
          team, tags, outcomes, milestones: [], gallery: [], attachments: [], created: nowISO()
        };
        DB.projects.unshift(created);
        logActivity(`Created project ${created.name}`);
        notify('Project created', `${created.name} added to the portfolio`, 'ok', 'projects');
        toast('ok', 'Project created', created.name);
      }
      saveDB(); populateDerived(DB); renderProjects(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('projects');
      return null;
    }
  });
}

/* ==========================================================
   ASSET FORM
   ========================================================== */
function assetForm(id) {
  if (!can('create') && !id) return toast('warn', 'Permission denied', 'Your role cannot create assets.');
  const a = id ? DB.assets.find((x) => x.id === id) : null;
  const v = a || { tag: 'AST-' + String(DB.assets.length + 1).padStart(3, '0'), name: '', category: 'HVAC', location: '', status: 'Operational', criticality: 'Medium', install: todayISO(), warranty: '', vendor: '', cost: '', lifeYears: 15, lastService: '', nextService: '', notes: '' };
  const cats = Array.from(new Set(['HVAC', 'Electrical', 'Plumbing', 'Fire & Life Safety', 'Vertical Transport', 'Controls / BMS', 'Amenity', 'Civil'].concat(DB.assets.map((x) => x.category))));
  const fields = [
    fText('tag', 'Asset tag *', v.tag, { ph: 'AST-HVAC-001' }),
    fText('name', 'Asset name *', v.name, { ph: 'Chiller Unit 1 (Carrier 400TR)' }),
    fSelect('category', 'Category', v.category, cats),
    fText('location', 'Location *', v.location, { ph: 'Tower A — Central Plant Room' }),
    fSelect('status', 'Status', v.status, ['Operational', 'Under Maintenance', 'Faulty', 'Decommissioned']),
    fSelect('criticality', 'Criticality', v.criticality || 'Medium', ['Critical', 'High', 'Medium', 'Low']),
    fText('vendor', 'Vendor / OEM', v.vendor, { ph: 'Carrier, OTIS, Schneider…' }),
    fText('cost', 'Replacement cost (' + DB.settings.currency + ')', v.cost, { type: 'number', min: 0, step: 500 }),
    fText('install', 'Installation date', v.install, { type: 'date' }),
    fText('warranty', 'Warranty expiry', v.warranty, { type: 'date' }),
    fText('lifeYears', 'Expected life (years)', v.lifeYears, { type: 'number', min: 1, max: 60 }),
    fText('lastService', 'Last service', v.lastService, { type: 'date' }),
    fText('nextService', 'Next service due', v.nextService, { type: 'date' }),
    fArea('notes', 'Condition notes', v.notes)
  ];
  openEntityForm({
    title: a ? 'Edit asset' : 'New asset',
    fields, values: v,
    saveLabel: a ? 'Update asset' : 'Create asset',
    deleteFn: a && can('delete') ? () => confirmDialog(`Delete asset “${a.name}” (${a.tag})?`, () => {
      DB.assets = DB.assets.filter((x) => x.id !== a.id);
      saveDB(); logActivity(`Deleted asset ${a.tag}`); toast('ok', 'Asset deleted'); renderAssets(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('assets');
    }) : null,
    onSubmit: (d) => {
      if (!d.name) return 'Asset name is required.';
      if (!d.location) return 'Location is required.';
      const dup = DB.assets.find((x) => x.tag.toLowerCase() === String(d.tag).toLowerCase() && x.id !== (a && a.id));
      if (dup) return `Asset tag “${d.tag}” is already in use.`;
      if (a) {
        Object.assign(a, d);
        logActivity(`Updated asset ${a.tag}`);
        toast('ok', 'Asset updated', a.tag);
      } else {
        const created = Object.assign({ id: uid('A'), created: nowISO() }, d);
        DB.assets.push(created);
        logActivity(`Created asset ${created.tag}`);
        toast('ok', 'Asset created', created.tag);
      }
      saveDB(); renderAssets(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('assets');
      return null;
    }
  });
}

/* ==========================================================
   WORK ORDER FORM
   ========================================================== */
function woForm(id) {
  if (!can('create') && !id) return toast('warn', 'Permission denied', 'Your role cannot create work orders.');
  const w = id ? DB.maintenance.find((x) => x.id === id) : null;
  const v = w || { title: '', type: 'Preventive', asset: '', assetId: '', tech: '', priority: 'Medium', status: 'Scheduled', date: todayISO(), due: todayISO(), cost: 0, notes: '' };
  const assetOpts = [{ value: '', label: '— none / not linked —' }].concat(DB.assets.map((a) => ({ value: a.id, label: `${a.tag} — ${a.name}` })));
  const techs = Array.from(new Set(['Bikash Rai', 'Suresh KC', 'MEP Team', 'OTIS Vendor', 'KONE Vendor', 'Honeywell Gent', 'Eaton Vendor', 'Third-party thermography', 'Waterproofing specialist'].concat(DB.maintenance.map((x) => x.tech).filter(Boolean))));
  const fields = [
    fText('title', 'Work order title *', v.title, { full: true, ph: 'Chiller Unit 1 — Monthly PPM' }),
    fSelect('type', 'Type', v.type, ['Preventive', 'Reactive']),
    fSelect('priority', 'Priority', v.priority, ['Critical', 'High', 'Medium', 'Low']),
    fSelect('status', 'Status', v.status, ['Scheduled', 'In Progress', 'Completed', 'Overdue']),
    fText('assetId', 'Linked asset', v.assetId, { ph: 'asset id' }),
    fSelect('assetId', 'Linked asset (select)', v.assetId, assetOpts),
    fText('tech', 'Technician / vendor', v.tech, { ph: 'Bikash Rai' }),
    fText('date', 'Raised date', v.date, { type: 'date' }),
    fText('due', 'Due date', v.due, { type: 'date' }),
    fText('cost', 'Cost (' + DB.settings.currency + ')', v.cost, { type: 'number', min: 0, step: 100 }),
    fArea('notes', 'Notes / scope of work', v.notes)
  ];
  // remove the duplicate free-text asset field, keep only the select
  const cleaned = fields.filter((f, i) => !(i === 4));
  openEntityForm({
    title: w ? 'Edit work order' : 'New work order',
    fields: cleaned, values: v,
    saveLabel: w ? 'Update work order' : 'Create work order',
    deleteFn: w && can('delete') ? () => confirmDialog(`Delete work order ${w.id}?`, () => {
      DB.maintenance = DB.maintenance.filter((x) => x.id !== w.id);
      saveDB(); logActivity(`Deleted work order ${w.id}`); toast('ok', 'Work order deleted'); renderMaintenance(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('maintenance');
    }) : null,
    onSubmit: (d) => {
      if (!d.title) return 'Work order title is required.';
      if (d.due && d.date && new Date(d.due) < new Date(d.date)) return 'Due date cannot be earlier than the raised date.';
      const linked = DB.assets.find((x) => x.id === d.assetId);
      d.asset = linked ? linked.name : (d.asset || '');
      if (w) {
        Object.assign(w, d);
        logActivity(`Updated work order ${w.id}`);
        toast('ok', 'Work order updated', w.id);
      } else {
        const created = Object.assign({ id: 'WO-' + (200 + DB.maintenance.length + 1 + Math.floor(Math.random() * 90)), created: nowISO() }, d);
        DB.maintenance.unshift(created);
        logActivity(`Created work order ${created.id}`);
        notify('Work order created', `${created.title} — due ${dShort(created.due)}`, 'info', 'maintenance');
        toast('ok', 'Work order created', created.id);
      }
      saveDB(); renderMaintenance(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('maintenance');
      return null;
    }
  });
}

/* ==========================================================
   BLOG / CERTIFICATE / EDUCATION / TESTIMONIAL FORMS
   ========================================================== */
function blogForm(id) {
  if (!can('create') && !id) return toast('warn', 'Permission denied', 'Your role cannot create articles.');
  const b = id ? DB.blog.find((x) => x.id === id) : null;
  const v = b || { title: '', category: 'Maintenance Strategy', date: todayISO(), author: 'Arjun Singh', tags: [], excerpt: '', body: '', published: true, readMins: 5 };
  const cats = Array.from(new Set(['Maintenance Strategy', 'Compliance', 'CAFM & Data', 'Budgeting', 'Leadership', 'Contracts', 'Sustainability'].concat(DB.blog.map((x) => x.category))));
  const fields = [
    fText('title', 'Article title *', v.title, { full: true }),
    fSelect('category', 'Category', v.category, cats),
    fText('date', 'Publish date', v.date, { type: 'date' }),
    fText('author', 'Author', v.author),
    fText('readMins', 'Read time (minutes)', v.readMins, { type: 'number', min: 1, max: 40 }),
    fText('tags', 'Tags (comma separated)', (v.tags || []).join(', '), { full: true }),
    fCheck('published', 'Published', v.published !== false),
    fArea('excerpt', 'Excerpt / summary', v.excerpt, { rows: 3, ph: 'One or two sentences shown on the card…' }),
    fArea('body', 'Article body', v.body, { rows: 12, ph: 'Use blank lines between paragraphs…' })
  ];
  openEntityForm({
    title: b ? 'Edit article' : 'New article', fields, values: v, saveLabel: b ? 'Update article' : 'Publish article',
    deleteFn: b && can('delete') ? () => confirmDialog(`Delete article “${b.title}”?`, () => {
      DB.blog = DB.blog.filter((x) => x.id !== b.id);
      saveDB(); logActivity(`Deleted article ${b.title}`); toast('ok', 'Article deleted'); renderBlog(); renderDashCounts();
    }) : null,
    onSubmit: (d) => {
      if (!d.title) return 'Article title is required.';
      if (!d.body || d.body.length < 40) return 'Please write at least a short article body.';
      const tags = String(d.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
      const payload = Object.assign({}, d, { tags, readMins: d.readMins || 5 });
      if (b) { Object.assign(b, payload); logActivity(`Updated article ${b.title}`); toast('ok', 'Article updated', b.title); }
      else { const created = Object.assign({ id: uid('b'), created: nowISO() }, payload); DB.blog.unshift(created); logActivity(`Published article ${created.title}`); toast('ok', 'Article published', created.title); }
      saveDB(); renderBlog(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('blog');
      return null;
    }
  });
}
function certForm(id) {
  if (!can('create') && !id) return toast('warn', 'Permission denied', 'Your role cannot add certifications.');
  const c = id ? DB.certifications.find((x) => x.id === id) : null;
  const v = c || { name: '', issuer: '', year: String(new Date().getFullYear()), date: '', status: 'Active', skills: [] };
  const fields = [
    fText('name', 'Certification / training *', v.name, { full: true }),
    fText('issuer', 'Issuing body *', v.issuer, { full: true, ph: 'MEFMA, NEBOSH, CAI, DCD, CTEVT…' }),
    fText('year', 'Year / status text', v.year),
    fText('date', 'Certificate date', v.date, { type: 'date' }),
    fSelect('status', 'Status', v.status, ['Active', 'Completed', 'Expired', 'In Progress']),
    fText('skills', 'Related skills (comma separated)', (v.skills || []).join(', '), { full: true })
  ];
  openEntityForm({
    title: c ? 'Edit certification' : 'New certification', fields, values: v, saveLabel: c ? 'Update' : 'Add certification',
    deleteFn: c && can('delete') ? () => confirmDialog(`Delete “${c.name}”?`, () => {
      DB.certifications = DB.certifications.filter((x) => x.id !== c.id);
      saveDB(); logActivity(`Deleted certification ${c.name}`); toast('ok', 'Certification deleted'); renderCredentials(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('credentials');
    }) : null,
    onSubmit: (d) => {
      if (!d.name) return 'Certification name is required.';
      if (!d.issuer) return 'Issuing body is required.';
      d.skills = String(d.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (c) { Object.assign(c, d); toast('ok', 'Certification updated'); logActivity(`Updated certification ${c.name}`); }
      else { DB.certifications.unshift(Object.assign({ id: uid('c') }, d)); toast('ok', 'Certification added'); logActivity(`Added certification ${d.name}`); }
      saveDB(); renderCredentials(); renderDashCounts();
      if (UI.view === 'dashboard') renderDashPanel('credentials');
      return null;
    }
  });
}
function testiForm() {
  const fields = [
    fText('name', 'Reviewer name *', '', { full: true }),
    fText('role', 'Role / organisation', '', { full: true }),
    fSelect('rating', 'Rating', 5, [5, 4, 3, 2, 1]),
    fCheck('approved', 'Show on portfolio', true),
    fArea('text', 'Testimonial *', '', { rows: 5 })
  ];
  openEntityForm({
    title: 'Add testimonial', fields, values: {}, saveLabel: 'Add testimonial',
    onSubmit: (d) => {
      if (!d.name) return 'Reviewer name is required.';
      if (!d.text || d.text.length < 15) return 'Please write a slightly longer testimonial.';
      DB.testimonials.unshift(Object.assign({ id: uid('t'), date: todayISO() }, d, { rating: Number(d.rating) || 5 }));
      saveDB(); logActivity(`Added testimonial from ${d.name}`); notify('Testimonial added', d.name, 'ok', 'blog');
      toast('ok', 'Testimonial added'); renderTestimonials();
      if (UI.view === 'dashboard') renderDashPanel('blog');
      return null;
    }
  });
}

/* ==========================================================
   EXPORTS — JSON, CSV, Excel, PDF
   ========================================================== */
function download(filename, content, mime = 'application/octet-stream') {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (err) { toast('danger', 'Download failed', String(err && err.message || err)); }
}
function toCSV(rows, headers) {
  const cols = headers || Object.keys(rows[0] || {});
  const esc1 = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return '\uFEFF' + [cols.join(',')].concat(rows.map((r) => cols.map((c) => esc1(r[c])).join(','))).join('\r\n');
}
function exportJSON() {
  const payload = deep(DB);
  delete payload._skillAvg;
  download(`arjun-singh-fm-backup-${todayISO()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  logActivity('Exported full JSON backup'); toast('ok', 'Backup exported', 'JSON file downloaded.');
}
function importJSON(text, filename) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') throw new Error('Not a valid backup object.');
    if (!parsed.profile && !parsed.projects) throw new Error('This file does not look like a portfolio backup.');
    confirmDialog(`Import “${filename}”? This replaces your current data. A backup snapshot is taken first.`, () => {
      makeBackup(true);
      DB = migrate(parsed, seedDB());
      saveDB('silent');
      logActivity(`Imported data from ${filename}`, 'system');
      toast('ok', 'Import complete', 'Data restored from file.');
      renderPublicSite(); renderDashCounts();
      applyTheme(DB.settings.theme); applyI18n();
      if (UI.view === 'dashboard') renderDashPanel(UI.dashPanel);
    });
  } catch (err) { toast('danger', 'Import failed', String(err && err.message || err)); }
}
function exportTable(rows, headers, filename, sheetName) {
  if (!rows.length) { toast('warn', 'Nothing to export', 'No records match the current filters.'); return; }
  if (typeof window.XLSX !== 'undefined') {
    try {
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Data').slice(0, 30));
      XLSX.writeFile(wb, filename.replace(/\.csv$/, '.xlsx'));
      logActivity(`Exported ${rows.length} rows to Excel (${sheetName || 'Data'})`);
      toast('ok', 'Excel exported', `${rows.length} rows written.`);
      return;
    } catch (err) { console.warn('XLSX failed, falling back to CSV', err); }
  }
  download(filename.replace(/\.xlsx$/, '.csv'), toCSV(rows, headers), 'text/csv;charset=utf-8');
  toast('ok', 'CSV exported', 'Excel library unavailable offline — CSV written instead.');
}
function exportProjectsXlsx() {
  const rows = filteredProjects().map((p) => ({
    ID: p.id, Project: p.name, Client: p.client, Category: p.category, Status: p.status, Priority: p.priority,
    'Budget (AED)': p.budget, 'Spent (AED)': p.spent || 0, 'Start': p.start, 'End': p.end,
    'Progress %': p.progress, Team: (p.team || []).join('; '), Tags: (p.tags || []).join('; '), Description: p.desc
  }));
  exportTable(rows, Object.keys(rows[0] || {}), `projects-${todayISO()}.xlsx`, 'Projects');
}
function exportAssetsXlsx() {
  const rows = filteredAssets().map((a) => ({
    Tag: a.tag, Asset: a.name, Category: a.category, Location: a.location, Status: a.status,
    Criticality: a.criticality, Installed: a.install, 'Expected life (yrs)': a.lifeYears,
    'Age (yrs)': Number(assetAgeYears(a).toFixed(1)), '% of life used': assetLifePct(a),
    Vendor: a.vendor, 'Replacement cost (AED)': a.cost, 'Last service': a.lastService, 'Next service': a.nextService, Notes: a.notes
  }));
  exportTable(rows, Object.keys(rows[0] || {}), `asset-register-${todayISO()}.xlsx`, 'Asset Register');
}
function exportMaintenanceXlsx() {
  const rows = DB.maintenance.map((w) => ({
    'WO No': w.id, Title: w.title, Type: w.type, Priority: w.priority, Status: w.status, Asset: w.asset,
    Technician: w.tech, Raised: w.date, Due: w.due, 'Cost (AED)': w.cost, Notes: w.notes
  }));
  exportTable(rows, Object.keys(rows[0] || {}), `work-orders-${todayISO()}.xlsx`, 'Work Orders');
}
function exportSkillsXlsx() {
  const rows = DB.skills.map((s) => ({ Skill: s.name, Category: s.cat, 'Proficiency %': s.level, 'Years': s.years || '', Note: s.note || '' }));
  exportTable(rows, Object.keys(rows[0] || {}), `skills-matrix-${todayISO()}.xlsx`, 'Skills');
}
function exportExpCsv() {
  const rows = DB.experience.map((e) => ({
    Company: e.company, Role: e.title, Period: e.period, Type: e.type, Location: e.location,
    Responsibilities: (e.points || []).length, 'Key points': (e.points || []).join(' | '), Highlights: (e.projects || []).join(' | ')
  }));
  download(`experience-${todayISO()}.csv`, toCSV(rows, Object.keys(rows[0] || {})), 'text/csv;charset=utf-8');
  toast('ok', 'Experience exported', 'CSV file downloaded.');
}
function exportKpiReport() {
  const k = kpiSnapshot();
  const rows = Object.entries(k).map(([K, V]) => ({ Metric: K, Value: typeof V === 'number' ? V : String(V) }));
  exportTable(rows, ['Metric', 'Value'], `kpi-report-${todayISO()}.xlsx`, 'KPI Dashboard');
}

/* ---- jsPDF helpers ---- */
function pdfReady() { return !!(window.jspdf && window.jspdf.jsPDF); }
function pdfHeader(doc, title, subtitle) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, 30, 'F');
  doc.setFillColor(6, 182, 212); doc.rect(0, 30, W, 1.4, 'F');
  doc.setTextColor(248, 250, 252); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('ARJUN SINGH', 14, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(148, 197, 255);
  doc.text('Facilities Manager  ·  singh.arjun0231257@gmail.com  ·  +971 50 467 2006  ·  Business Bay, Dubai', 14, 20);
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(title, 14, 42);
  if (subtitle) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 107, 136); doc.text(subtitle, 14, 48); }
  doc.setTextColor(15, 23, 42);
  return 56;
}
function pdfFooter(doc) {
  const n = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 210, 225); doc.line(14, H - 14, W - 14, H - 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6); doc.setTextColor(120, 132, 152);
    doc.text(`Generated ${new Date().toLocaleString('en-GB')}  ·  Arjun Singh — FM Portfolio Platform`, 14, H - 9);
    doc.text(`Page ${i} of ${n}`, W - 14, H - 9, { align: 'right' });
  }
}
function pdfParagraph(doc, text, y, opts = {}) {
  const W = doc.internal.pageSize.getWidth();
  const lines = doc.splitTextToSize(text, opts.width || (W - 28));
  doc.text(lines, 14, y);
  return y + lines.length * (opts.lh || 4.6);
}
function pdfFallbackPrint(title, html) {
  const w = window.open('', '_blank');
  if (!w) { toast('warn', 'Popup blocked', 'Allow popups to generate the PDF.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>${esc(title)}</title><meta charset="utf-8">
    <style>body{font-family:'Segoe UI',system-ui,sans-serif;padding:34px;color:#0F172A;max-width:820px;margin:0 auto;line-height:1.6}
    h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;color:#1E3A8A;border-bottom:1px solid #DBE3EF;padding-bottom:5px}
    h3{font-size:13px;margin:14px 0 4px}table{border-collapse:collapse;width:100%;font-size:11.5px;margin:8px 0}
    td,th{border:1px solid #D5DEEA;padding:6px 8px;text-align:left}th{background:#F1F5FB}
    .muted{color:#64748B;font-size:11px}li{margin-bottom:4px}</style></head><body>${html}
    <script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});<\/script></body></html>`);
  w.document.close();
  toast('warn', 'PDF engine offline', 'Opened a print-ready view — choose “Save as PDF”.');
}

function showResumePreviewModal() {
  const bodyHtml = `
    <div style="max-height:72vh;overflow-y:auto;padding:12px;background:var(--bg-elevated);border-radius:12px;border:1px solid var(--border)">
      ${resumeHtml()}
    </div>
  `;

  openModal({
    title: 'Arjun Singh — Official Curriculum Vitae',
    wide: true,
    body: bodyHtml,
    footer: `
      <div class="row row--between" style="width:100%;gap:10px">
        <span style="font-size:.82rem;color:var(--text-3)">Facilities Management • Aldar • Deyaar • DAMAC</span>
        <div class="row" style="gap:8px">
          <button class="btn btn--ghost btn--sm" type="button" onclick="window.print()">${icon('print', 14)} Print CV</button>
          <button class="btn btn--primary btn--sm" id="cvModalDownloadPdf" type="button">${icon('download', 14)} Download PDF</button>
        </div>
      </div>
    `,
    onOpen: (modalEl) => {
      const dlBtn = modalEl.querySelector('#cvModalDownloadPdf');
      if (dlBtn) dlBtn.addEventListener('click', () => { downloadResume(); });
    }
  });
}

function downloadResume() {
  const p = DB.profile;
  if (!pdfReady()) {
    pdfFallbackPrint('Arjun Singh — Resume', resumeHtml());
    return;
  }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = pdfHeader(doc, 'Curriculum Vitae', p.title + '  ·  ' + p.languages.join(', '));
    doc.setFontSize(9.4); doc.setFont('helvetica', 'normal'); doc.setTextColor(45, 58, 80);
    y = pdfParagraph(doc, p.summary, y); y += 4;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text('Core Competencies', 14, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const compLines = doc.splitTextToSize(p.competencies.join('  •  '), 182);
    doc.text(compLines, 14, y); y += compLines.length * 4.4 + 4;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Professional Experience', 14, y); y += 6;
    DB.experience.forEach((e) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(e.company, 14, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.6); doc.setTextColor(90, 107, 136);
      doc.text(e.period, 196, y, { align: 'right' });
      y += 4.6; doc.setTextColor(6, 130, 160); doc.setFontSize(9); doc.text(e.title, 14, y); y += 4.6;
      doc.setTextColor(45, 58, 80); doc.setFontSize(8.8);
      (e.points || []).forEach((pt) => {
        if (y > 272) { doc.addPage(); y = 20; }
        const l = doc.splitTextToSize('•  ' + pt, 178);
        doc.text(l, 16, y); y += l.length * 4.1;
      });
      y += 3;
    });

    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text('Awards & Accolades', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(45, 58, 80);
    (DB.awards || []).forEach((a) => {
      if (y > 274) { doc.addPage(); y = 20; }
      const l = doc.splitTextToSize('•  ' + a.title + ' — ' + (a.issuer || '') + (a.date ? ' (' + a.date + ')' : ''), 178);
      doc.text(l, 16, y); y += l.length * 4.1;
    });
    y += 4;

    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text('Trainings & Certifications', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(45, 58, 80);
    DB.certifications.forEach((c) => {
      if (y > 274) { doc.addPage(); y = 20; }
      const l = doc.splitTextToSize('•  ' + c.name + ' — ' + c.issuer + (c.year && c.year !== '—' ? ' (' + c.year + ')' : ''), 178);
      doc.text(l, 16, y); y += l.length * 4.1;
    });
    y += 4;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text('Education', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(45, 58, 80);
    DB.education.forEach((e) => {
      const l = doc.splitTextToSize(`•  ${e.degree} — ${e.institution}, ${e.location} (${e.year})`, 178);
      doc.text(l, 16, y); y += l.length * 4.1;
    });
    y += 4;

    if (p.softSkills && p.softSkills.length) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.text('Soft Skills & IT Skills', 14, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.6); doc.setTextColor(45, 58, 80);
      const sLine = doc.splitTextToSize('Soft Skills: ' + p.softSkills.join(', '), 178);
      doc.text(sLine, 14, y); y += sLine.length * 4.1;
      const itLine = doc.splitTextToSize('IT Skills: ' + (p.itSkills || []).join(', '), 178);
      doc.text(itLine, 14, y); y += itLine.length * 4.1;
    }
    pdfFooter(doc);
    doc.save('Arjun-Singh-Facilities-Manager-CV.pdf');
    logActivity('Downloaded CV as PDF'); toast('ok', 'Resume downloaded', 'PDF generated from live profile data.');
  } catch (err) {
    console.warn(err); pdfFallbackPrint('Arjun Singh — Resume', resumeHtml());
  }
}
function resumeHtml() {
  const p = DB.profile;
  const awards = DB.awards || [];
  const certs = DB.certifications || [];
  const edu = DB.education || [];
  const exp = DB.experience || [];

  return `
    <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#0F172A;line-height:1.5">
      <div style="border-bottom:2px solid #0EA5E9;padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h1 style="font-size:1.6rem;font-weight:800;color:#0F172A;margin:0 0 4px">${esc(p.name)}</h1>
          <div style="font-size:.95rem;font-weight:700;color:#0369A1;margin-bottom:6px">${esc(p.headline || p.title)}</div>
          <div style="font-size:.82rem;color:#475569;display:flex;flex-wrap:wrap;gap:12px">
            <span><b>Email:</b> ${esc(p.email)}</span>
            <span><b>Mobile:</b> ${esc(p.phone)}</span>
            <span><b>Location:</b> ${esc(p.address)}</span>
            <span><b>Licence:</b> ${esc(p.drivingLicence)}</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <h2 style="font-size:1.05rem;font-weight:800;color:#0369A1;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">Profile Summary</h2>
        <p style="font-size:.86rem;color:#334155;margin:0 0 8px">${esc(p.summary)}</p>
        <ul style="margin:0;padding-left:18px;font-size:.82rem;color:#334155;display:grid;grid-template-columns:1fr;gap:4px">
          ${(p.highlights || []).map(h => `<li>${esc(h)}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <h2 style="font-size:.95rem;font-weight:800;color:#0369A1;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">Core Competencies</h2>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${(p.competencies || []).map(c => `<span style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:6px;padding:3px 8px;font-size:.76rem;font-weight:600;color:#1E293B">${esc(c)}</span>`).join('')}
          </div>
        </div>
        <div>
          <h2 style="font-size:.95rem;font-weight:800;color:#0369A1;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">Soft Skills &amp; IT Skills</h2>
          <div style="font-size:.78rem;color:#334155;margin-bottom:6px">
            <b>Soft Skills:</b> ${(p.softSkills || []).join(' • ')}
          </div>
          <div style="font-size:.78rem;color:#334155">
            <b>IT Skills:</b> ${(p.itSkills || []).join(' • ')}
          </div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <h2 style="font-size:1.05rem;font-weight:800;color:#0369A1;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em">Work Experience</h2>
        ${exp.map(e => `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <b style="font-size:.92rem;color:#0F172A">${esc(e.company)}</b>
              <span style="font-size:.8rem;font-weight:700;color:#0284C7">${esc(e.period)}</span>
            </div>
            <div style="font-size:.84rem;font-weight:600;color:#0E7490;margin-bottom:4px">${esc(e.title)} <span style="font-size:.78rem;font-weight:400;color:#64748B">(${esc(e.location || '')})</span></div>
            <ul style="margin:0;padding-left:18px;font-size:.8rem;color:#334155">
              ${(e.points || []).map(pt => `<li>${esc(pt)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <h2 style="font-size:.95rem;font-weight:800;color:#0369A1;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">Awards &amp; Accolades</h2>
          <ul style="margin:0;padding-left:18px;font-size:.78rem;color:#334155">
            ${awards.map(a => `<li><b>${esc(a.title)}</b> — ${esc(a.issuer || a.org || '')} ${a.date ? `(${esc(a.date)})` : ''}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h2 style="font-size:.95rem;font-weight:800;color:#0369A1;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">Education</h2>
          <ul style="margin:0;padding-left:18px;font-size:.78rem;color:#334155">
            ${edu.map(ed => `<li><b>${esc(ed.degree)}</b> (${esc(ed.year)})<br><span style="color:#64748B">${esc(ed.institution)} — ${esc(ed.location || '')}</span></li>`).join('')}
          </ul>
        </div>
      </div>

      <div>
        <h2 style="font-size:.95rem;font-weight:800;color:#0369A1;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em">Trainings &amp; Certifications</h2>
        <ul style="margin:0;padding-left:18px;font-size:.78rem;color:#334155;display:grid;grid-template-columns:1fr 1fr;gap:4px">
          ${certs.map(c => `<li><b>${esc(c.name)}</b><br><span style="color:#64748B">${esc(c.issuer)} ${c.year ? `(${esc(c.year)})` : ''}</span></li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}
function projectPdf(id) {
  const p = DB.projects.find((x) => x.id === id);
  if (!p) return;
  if (!pdfReady()) {
    pdfFallbackPrint(p.name, `<h1>${esc(p.name)}</h1><div class="muted">${esc(p.client)} · ${esc(p.category)} · ${esc(p.status)}</div>
      <h2>Overview</h2><p>${esc(p.desc)}</p>
      <h2>Commercials</h2><table><tr><th>Budget</th><td>${esc(moneyExact(p.budget, DB.settings.currency))}</td></tr>
      <tr><th>Spent</th><td>${esc(moneyExact(p.spent || 0, DB.settings.currency))}</td></tr><tr><th>Period</th><td>${esc(dLong(p.start))} → ${esc(dLong(p.end))}</td></tr>
      <tr><th>Progress</th><td>${p.progress}%</td></tr><tr><th>Team</th><td>${esc((p.team || []).join(', '))}</td></tr></table>
      ${(p.milestones || []).length ? `<h2>Milestones</h2><ul>${p.milestones.map((m) => `<li>${esc(m.name)} — ${esc(dLong(m.date))} ${m.done ? '✓' : ''}</li>`).join('')}</ul>` : ''}
      ${(p.outcomes || []).length ? `<h2>Outcomes</h2><ul>${p.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}`);
    return;
  }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = pdfHeader(doc, 'Project Brief', `${p.id}  ·  ${p.status}  ·  ${p.priority || 'Medium'} priority`);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(p.name, 14, y); y += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 107, 136);
    doc.text(`Client: ${p.client}   ·   Category: ${p.category}`, 14, y); y += 8;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Commercials', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    [['Budget', moneyExact(p.budget, DB.settings.currency)], ['Spent to date', moneyExact(p.spent || 0, DB.settings.currency)],
     ['Start', dLong(p.start)], ['End', dLong(p.end)], ['Progress', p.progress + '%'], ['Team', (p.team || []).join(', ') || '—']]
      .forEach(([k, v]) => { if (y > 275) { doc.addPage(); y = 20; } doc.setTextColor(90, 107, 136); doc.text(k, 14, y); doc.setTextColor(15, 23, 42); doc.text(String(v), 52, y); y += 5.2; });
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Description', 14, y); y += 5.6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(45, 58, 80);
    y = pdfParagraph(doc, p.desc || '—', y) + 4;
    if ((p.outcomes || []).length) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.text('Outcomes', 14, y); y += 5.6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(45, 58, 80);
      p.outcomes.forEach((o) => { const l = doc.splitTextToSize('•  ' + o, 178); doc.text(l, 16, y); y += l.length * 4.2; });
      y += 3;
    }
    if ((p.milestones || []).length) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.text('Milestones', 14, y); y += 5.6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(45, 58, 80);
      p.milestones.forEach((m) => { if (y > 275) { doc.addPage(); y = 20; } doc.text(`${m.done ? '[x]' : '[ ]'}  ${m.name}`, 16, y); doc.setTextColor(90, 107, 136); doc.text(dLong(m.date), 196, y, { align: 'right' }); doc.setTextColor(45, 58, 80); y += 5; });
    }
    pdfFooter(doc);
    doc.save(`project-${p.id}-brief.pdf`);
    logActivity(`Generated PDF brief for ${p.name}`); toast('ok', 'PDF generated', `${p.id} brief downloaded.`);
  } catch (err) { console.warn(err); pdfFallbackPrint(p.name, `<h1>${esc(p.name)}</h1><p>${esc(p.desc)}</p>`); }
}
function certPdf(id) {
  const c = DB.certifications.find((x) => x.id === id);
  if (!c) return;
  if (!pdfReady()) {
    pdfFallbackPrint(c.name, `<h1>${esc(c.name)}</h1><div class="muted">${esc(c.issuer)} · ${esc(c.year || '')}</div>
      <p>This record confirms that Arjun Singh holds the above certification. Status: ${esc(c.status || 'Active')}.</p>
      <p class="muted">Arjun Singh · Facilities Manager · singh.arjun0231257@gmail.com · +971 50 467 2006</p>`);
    return;
  }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, H, 'F');
    doc.setDrawColor(6, 182, 212); doc.setLineWidth(1.2); doc.rect(10, 10, W - 20, H - 20);
    doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.4); doc.rect(14, 14, W - 28, H - 28);
    doc.setTextColor(6, 182, 212); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('CERTIFICATION RECORD', W / 2, 40, { align: 'center' });
    doc.setTextColor(248, 250, 252); doc.setFontSize(26);
    doc.text('Arjun Singh', W / 2, 62, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(148, 197, 255);
    doc.text('Facilities Manager  ·  Dubai, United Arab Emirates', W / 2, 72, { align: 'center' });
    doc.setDrawColor(6, 182, 212); doc.line(W / 2 - 40, 80, W / 2 + 40, 80);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(248, 250, 252);
    const nameLines = doc.splitTextToSize(c.name, W - 80);
    doc.text(nameLines, W / 2, 98, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(200, 213, 236);
    doc.text(doc.splitTextToSize(c.issuer, W - 80), W / 2, 98 + nameLines.length * 8 + 6, { align: 'center' });
    doc.setFontSize(11); doc.setTextColor(16, 185, 129);
    doc.text(`${c.date ? dLong(c.date) : (c.year || '')}   ·   Status: ${c.status || 'Active'}`, W / 2, H - 46, { align: 'center' });
    doc.setFontSize(8.4); doc.setTextColor(148, 163, 184);
    doc.text('singh.arjun0231257@gmail.com  ·  +971 50 467 2006  ·  Business Bay, Dubai, UAE', W / 2, H - 30, { align: 'center' });
    doc.text(`Reference: ${c.id}  ·  Issued ${dLong(todayISO())}`, W / 2, H - 22, { align: 'center' });
    doc.save(`certificate-${String(c.name).slice(0, 40).replace(/[^\w]+/g, '-')}.pdf`);
    logActivity(`Generated certificate PDF for ${c.name}`); toast('ok', 'Certificate PDF', c.name);
  } catch (err) { console.warn(err); pdfFallbackPrint(c.name, `<h1>${esc(c.name)}</h1><p>${esc(c.issuer)}</p>`); }
}
function portfolioPdf() {
  const p = DB.profile;
  if (!pdfReady()) { pdfFallbackPrint('Arjun Singh — Portfolio Report', resumeHtml()); return; }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = pdfHeader(doc, 'Facilities Management Portfolio Report', `${DB.projects.length} projects · ${DB.assets.length} assets · ${DB.maintenance.length} work orders`);
    const k = kpiSnapshot();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('KPI Snapshot', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    Object.entries(k).forEach(([K, V]) => { if (y > 275) { doc.addPage(); y = 20; } doc.setTextColor(90, 107, 136); doc.text(K, 14, y); doc.setTextColor(15, 23, 42); doc.text(String(V), 92, y); y += 5; });
    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Project Portfolio', 14, y); y += 6;
    DB.projects.forEach((pr) => {
      if (y > 258) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.6); doc.text(`${pr.name}`, 14, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4); doc.setTextColor(90, 107, 136);
      doc.text(`${pr.status} · ${money(pr.budget, DB.settings.currency)} · ${pr.progress}%`, 196, y, { align: 'right' });
      y += 4.6; doc.setTextColor(45, 58, 80);
      const l = doc.splitTextToSize(`${pr.client} — ${pr.desc}`, 180);
      doc.text(l, 16, y); y += l.length * 4 + 3.4;
    });
    pdfFooter(doc);
    doc.save('arjun-singh-fm-portfolio-report.pdf');
    logActivity('Generated portfolio PDF report'); toast('ok', 'Portfolio PDF', 'Report downloaded.');
  } catch (err) { console.warn(err); pdfFallbackPrint('Portfolio Report', resumeHtml()); }
}
function kpiSnapshot() {
  const proj = DB.projects;
  const budget = proj.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const spent = proj.reduce((s, p) => s + (Number(p.spent) || 0), 0);
  const wo = DB.maintenance;
  const overdue = wo.filter((w) => w.status === 'Overdue').length;
  const complete = wo.filter((w) => w.status === 'Completed').length;
  const op = DB.assets.filter((a) => a.status === 'Operational').length;
  return {
    'Reporting date': dLong(todayISO()),
    'Total projects': proj.length,
    'Ongoing projects': proj.filter((p) => p.status === 'Ongoing').length,
    'Completed projects': proj.filter((p) => p.status === 'Completed').length,
    'Portfolio budget (AED)': moneyExact(budget, 'AED'),
    'Portfolio spend (AED)': moneyExact(spent, 'AED'),
    'Budget utilisation %': (budget ? Math.round((spent / budget) * 100) : 0) + '%',
    'Registered assets': DB.assets.length,
    'Assets operational': `${op} (${pct(op, DB.assets.length)}%)`,
    'Asset replacement value (AED)': moneyExact(DB.assets.reduce((s, a) => s + (Number(a.cost) || 0), 0), 'AED'),
    'Total work orders': wo.length,
    'Work orders completed': complete,
    'Work orders overdue': overdue,
    'PPM completion rate %': (wo.length ? Math.round((complete / wo.filter((w) => w.type === 'Preventive').length || 1) * 100) : 0) + '%',
    'Average skill proficiency %': (DB._skillAvg || 0) + '%',
    'Certifications held': DB.certifications.length
  };
}

/* ==========================================================================
   Super Admin CMS Dashboard & Operations Panels (Part 1)
   ========================================================================== */
/* ==========================================================================
   PART F — DASHBOARD (all panels), user management, RBAC matrix, settings
   ========================================================================== */

function showDash(panel) {
  if (!DB.auth.session) { showView('login'); toast('warn', 'Sign in required', 'Authenticate to open the management console.'); return; }
  if (panel && !canPanel(panel)) { toast('danger', 'Access denied', `Your role (${currentRole()}) cannot open ${PANEL_TITLES[panel] ? PANEL_TITLES[panel][0] : panel}.`); return; }
  showView('dashboard');
  UI.dashPanel = panel || UI.dashPanel || 'overview';
  $$('.side__link').forEach((b) => {
    const allowed = canPanel(b.dataset.dash);
    b.classList.toggle('hide', !allowed);
    b.classList.toggle('is-active', b.dataset.dash === UI.dashPanel);
  });
  $$('.dash-panel').forEach((p) => p.classList.toggle('hide', p.dataset.panel !== UI.dashPanel));
  const meta = PANEL_TITLES[UI.dashPanel] || ['Dashboard', ''];
  byId('dashTitle').textContent = meta[0];
  byId('dashSub').textContent = meta[1];
  renderDashPanel(UI.dashPanel);
  byId('sidebar').classList.remove('is-open');
  byId('sideScrim').classList.remove('is-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderDashPanel(panel) {
  const host = document.querySelector(`.dash-panel[data-panel="${panel}"]`);
  if (!host) return;
  host.innerHTML = panelSkeleton();
  try {
    const map = {
      overview: panelOverview, projects: panelProjects, assets: panelAssets, maintenance: panelMaintenance,
      gantt: panelGantt, calendar: panelCalendar, analytics: panelAnalytics, reports: panelReports,
      skills: panelSkillsDash, credentials: panelCredentials, blog: panelBlog, users: panelUsers,
      contact: panelContact, activity: panelActivity, settings: panelSettings
    };
    (map[panel] || panelOverview)(host);
  } catch (err) {
    console.error(err);
    host.innerHTML = `<div class="card glass"><div class="table-empty">${icon('alert', 36)}<p><b>Something went wrong rendering this panel.</b><br>${esc(String(err && err.message || err))}</p></div></div>`;
  }
  initReveal();
}
function panelSkeleton() {
  return `<div class="grid g-4" style="margin-bottom:18px">${'<div class="skeleton skeleton--card"></div>'.repeat(4)}</div>
    <div class="card glass"><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text" style="width:80%"></div><div class="skeleton skeleton--chart" style="margin-top:14px"></div></div>`;
}
function renderDashCounts() {
  const set = (id, n) => { const e = byId(id); if (e) e.textContent = n; };
  set('sideCountProjects', DB.projects.length);
  set('sideCountAssets', DB.assets.length);
  set('sideCountWo', DB.maintenance.filter((w) => w.status !== 'Completed').length);
  set('sideCountCerts', DB.certifications.length);
  set('sideCountUsers', DB.users.length);
  set('sideCountMsgs', DB.messages.filter((m) => !m.read).length);
  syncSidebarIdentity();
  renderNotifBadge();
}
/* Keep the sidebar identity block in step with the active session. */
function syncSidebarIdentity() {
  const user = currentUser();
  const nameEl = byId('sideUserName');
  const roleEl = byId('sideUserRole');
  if (nameEl) {
    const label = user ? (user.name || user.username) : 'Not signed in';
    if (nameEl.textContent !== label) nameEl.textContent = label;
  }
  if (roleEl) {
    const label = user ? user.role : 'Guest';
    if (roleEl.textContent !== label) roleEl.textContent = label;
  }
  const avatar = byId('sideAvatar');
  if (avatar) {
    const pic = (DB.profile && (DB.profile.avatar || DB.profile.photo)) || '';
    if (user && pic && avatar.getAttribute('src') !== pic) avatar.src = pic;
  }
}
function emptyState(msg, actionLabel, actionFn) {
  const wrap = el('div', { class: 'table-empty' }, [el('div', { html: icon('layers', 38) }), el('p', { text: msg })]);
  if (actionLabel) wrap.append(el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: actionLabel, style: 'margin-top:12px', onclick: actionFn }));
  return wrap;
}
function tableEmptyRow(cols, msg) { return `<tr><td colspan="${cols}"><div class="table-empty">${icon('search', 34)}<p>${esc(msg)}</p></div></td></tr>`; }

/* ---------------- Overview ---------------- */
function panelOverview(host) {
  const k = kpiSnapshot();
  const budget = DB.projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const cards = [
    { icon: 'layers', cls: '', label: 'Active projects', value: DB.projects.filter((p) => p.status === 'Ongoing').length, note: `${DB.projects.length} in register`, delta: '+2 this quarter', up: true },
    { icon: 'coins', cls: 'kpi__icon--info', label: 'Portfolio budget', value: money(budget, DB.settings.currency), note: `${k['Budget utilisation %']} utilised`, delta: money(DB.projects.reduce((s, p) => s + (Number(p.spent) || 0), 0), DB.settings.currency) + ' spent', up: true },
    { icon: 'wrench', cls: 'kpi__icon--warn', label: 'Open work orders', value: DB.maintenance.filter((w) => w.status !== 'Completed').length, note: `${DB.maintenance.length} logged total`, delta: DB.maintenance.filter((w) => w.status === 'Overdue').length + ' overdue', up: false },
    { icon: 'building', cls: 'kpi__icon--ok', label: 'Asset availability', value: `${pct(DB.assets.filter((a) => a.status === 'Operational').length, DB.assets.length)}%`, note: `${DB.assets.length} assets registered`, delta: DB.assets.filter((a) => a.status === 'Faulty').length + ' faulty', up: false }
  ];
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px">
      ${cards.map((c, i) => `
        <div class="card glass kpi card--hover" data-reveal="zoom" data-delay="${i}">
          <div class="kpi__top"><div class="kpi__icon ${c.cls}">${icon(c.icon, 20)}</div><span class="badge badge--muted">${esc(DB.settings.currency)}</span></div>
          <div class="kpi__value">${typeof c.value === 'number' ? c.value : esc(c.value)}</div>
          <div class="kpi__label">${esc(c.label)}</div>
          <div class="kpi__delta ${c.up ? 'kpi__delta--up' : 'kpi__delta--down'}">${icon(c.up ? 'arrowUp' : 'alert', 12)} ${esc(c.delta)}</div>
          <div style="font-size:.74rem;color:var(--text-3);margin-top:6px">${esc(c.note)}</div>
        </div>`).join('')}
    </div>

    <div class="live-strip">
      <span class="chip">${icon('clock', 13)} Updated ${relTime(DB.meta.updated)}</span>
      <span class="chip">${icon('db', 13)} ${(JSON.stringify(DB).length / 1024).toFixed(1)} KB stored</span>
      <span class="chip">${icon('users', 13)} ${DB.users.length} users · role: ${esc(currentRole())}</span>
      <span class="chip">${icon('shield', 13)} ${DB.certifications.length} credentials</span>
    </div>

    <div class="grid g-2" style="align-items:start">
      <div class="card glass panel" data-reveal="left">
        <div class="panel__head"><h3>${icon('chart', 17)} Budget vs spend by project</h3><span class="badge badge--cyan">${esc(DB.settings.currency)}</span></div>
        <div class="chart-box chart-box--bar" id="box_dashChartBudget"><canvas id="dashChartBudget" role="img" aria-label="Budget versus spend by project"></canvas></div>
      </div>
      <div class="card glass panel" data-reveal="right">
        <div class="panel__head"><h3>${icon('target', 17)} Project status mix</h3></div>
        <div class="chart-box chart-box--doughnut" id="box_dashChartStatus"><canvas id="dashChartStatus" role="img" aria-label="Project status distribution"></canvas></div>
      </div>
    </div>

    <div class="grid g-2" style="align-items:start;margin-top:18px">
      <div class="card glass panel" data-reveal="left">
        <div class="panel__head"><h3>${icon('alert', 17)} Needs attention</h3><span class="badge badge--danger">${DB.maintenance.filter((w) => w.status === 'Overdue' || w.status === 'In Progress').length + DB.assets.filter((a) => a.status !== 'Operational').length} items</span></div>
        <div class="stack" style="gap:9px">
          ${DB.maintenance.filter((w) => w.status === 'Overdue').map((w) => `
            <button class="row row--between" type="button" data-wo-view="${esc(w.id)}" style="width:100%;text-align:left;gap:10px;padding:11px;border:1px solid rgba(244,63,94,.35);background:var(--danger-bg);border-radius:12px">
              <span style="min-width:0"><b style="font-size:.85rem;display:block">${esc(w.title)}</b><span style="font-size:.73rem;color:var(--text-3)">${esc(w.id)} · due ${dShort(w.due)} · ${esc(w.tech || 'Unassigned')}</span></span>
              <span class="badge badge--danger">Overdue</span>
            </button>`).join('')}
          ${DB.assets.filter((a) => a.status !== 'Operational').map((a) => `
            <button class="row row--between" type="button" data-asset-view="${esc(a.id)}" style="width:100%;text-align:left;gap:10px;padding:11px;border:1px solid var(--border);background:var(--surface-2);border-radius:12px">
              <span style="min-width:0"><b style="font-size:.85rem;display:block">${esc(a.name)}</b><span style="font-size:.73rem;color:var(--text-3)">${esc(a.tag)} · ${esc(a.location)}</span></span>
              ${statusBadge(a.status)}
            </button>`).join('')}
          ${(!DB.maintenance.filter((w) => w.status === 'Overdue').length && !DB.assets.filter((a) => a.status !== 'Operational').length) ? `<div class="table-empty">${icon('check', 34)}<p>All assets operational and no overdue work orders.</p></div>` : ''}
        </div>
      </div>

      <div class="card glass panel" data-reveal="right">
        <div class="panel__head"><h3>${icon('clock', 17)} Recent activity</h3><button class="btn btn--ghost btn--xs" type="button" data-goto="activity">View audit trail</button></div>
        <div class="stack" style="gap:9px">
          ${DB.activity.slice(0, 8).map((a) => `
            <div class="row" style="gap:10px;align-items:flex-start">
              <span style="width:26px;height:26px;border-radius:8px;flex:none;display:grid;place-items:center;background:var(--elevate);color:var(--cyan)">${icon('bolt', 13)}</span>
              <span style="min-width:0;flex:1"><span style="font-size:.83rem;display:block">${esc(a.msg)}</span><span style="font-size:.7rem;color:var(--text-3)">${esc(a.user || 'System')} · ${relTime(a.ts)}</span></span>
            </div>`).join('') || '<p style="font-size:.85rem;color:var(--text-3)">No activity recorded yet.</p>'}
        </div>
      </div>
    </div>

    <div class="card glass panel" data-reveal style="margin-top:18px">
      <div class="panel__head"><h3>${icon('spark', 17)} Quick actions</h3></div>
      <div class="row" style="gap:10px">
        <button class="btn btn--primary btn--sm" type="button" data-quick="project">${icon('plus', 14)} New project</button>
        <button class="btn btn--ghost btn--sm" type="button" data-quick="asset">${icon('plus', 14)} New asset</button>
        <button class="btn btn--ghost btn--sm" type="button" data-quick="wo">${icon('plus', 14)} New work order</button>
        <button class="btn btn--ghost btn--sm" type="button" data-quick="blog">${icon('plus', 14)} New article</button>
        <button class="btn btn--ghost btn--sm" type="button" data-quick="backup">${icon('save', 14)} Snapshot backup</button>
        <button class="btn btn--ghost btn--sm" type="button" data-quick="portfolio-pdf">${icon('download', 14)} Portfolio PDF</button>
        <button class="btn btn--ghost btn--sm" type="button" data-quick="json">${icon('db', 14)} Export JSON</button>
      </div>
    </div>`;
  drawBudgetChart();
  drawStatusChart();
}
function drawBudgetChart() {
  if (!chartReady()) { chartFallback('dashChartBudget'); return; }
  const rows = DB.projects.slice(0, 8);
  destroyChart('budget');
  const c = byId('dashChartBudget');
  if (!c) return;
  UI.charts.budget = new Chart(c, {
    type: 'bar',
    data: {
      labels: rows.map((p) => p.name.length > 22 ? p.name.slice(0, 21) + '…' : p.name),
      datasets: [
        { label: 'Budget', data: rows.map((p) => p.budget || 0), backgroundColor: 'rgba(6,182,212,.75)', borderRadius: 7, maxBarThickness: 26 },
        { label: 'Spent', data: rows.map((p) => p.spent || 0), backgroundColor: 'rgba(16,185,129,.75)', borderRadius: 7, maxBarThickness: 26 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { labels: { color: chartText(), font: chartFont(), usePointStyle: true, boxWidth: 9 } },
        tooltip: { callbacks: { label: (x) => ` ${x.dataset.label}: ${moneyExact(x.parsed.x, DB.settings.currency)}` } }
      },
      scales: {
        x: { grid: { color: chartGrid() }, ticks: { color: chartText(), font: chartFont(), callback: (v) => money(v, '') } },
        y: { grid: { display: false }, ticks: { color: chartText(), font: chartFont() } }
      }
    }
  });
}
function drawStatusChart() {
  if (!chartReady()) { chartFallback('dashChartStatus'); return; }
  const statuses = ['Planned', 'Ongoing', 'Completed', 'On Hold'];
  const counts = statuses.map((s) => DB.projects.filter((p) => p.status === s).length);
  destroyChart('status');
  const c = byId('dashChartStatus');
  if (!c) return;
  UI.charts.status = new Chart(c, {
    type: 'doughnut',
    data: { labels: statuses, datasets: [{ data: counts, backgroundColor: ['#60A5FA', '#0EA5E9', '#10B981', '#F59E0B'], borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { color: chartText(), font: chartFont(), usePointStyle: true, boxWidth: 9, padding: 12 } },
        tooltip: { callbacks: { label: (x) => ` ${x.label}: ${x.parsed} project(s)` } }
      }
    }
  });
}

/* ---------------- Projects panel ---------------- */
function panelProjects(host) {
  const rows = filteredProjects();
  host.innerHTML = `
    <div class="card glass panel">
      <div class="panel__head">
        <h3>${icon('layers', 17)} Project register <span class="badge badge--muted">${rows.length}</span></h3>
        <div class="toolbar__group">
          <div class="search"><span>${icon('search', 16)}</span><input class="input" type="search" id="dpSearch" placeholder="Search projects…" value="${esc(UI.projSearch)}" aria-label="Search projects"></div>
          <select class="select" id="dpStatus" aria-label="Filter by status" style="min-width:150px">
            ${['All', 'Planned', 'Ongoing', 'Completed', 'On Hold'].map((s) => `<option${UI.projStatus === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn--ghost btn--sm" type="button" data-dash-export="projects">${icon('download', 14)} Excel</button>
          ${can('create') ? `<button class="btn btn--primary btn--sm" type="button" data-new="project">${icon('plus', 15)} New project</button>` : ''}
        </div>
      </div>
      <div class="table-wrap">
        <table class="data">
          <thead><tr>
            <th>ID</th><th>Project</th><th>Client</th><th>Status</th><th>Progress</th><th class="num">Budget</th><th class="num">Spent</th><th>Period</th><th class="num">Actions</th>
          </tr></thead>
          <tbody>${rows.length ? rows.map((p) => `
            <tr>
              <td><span class="badge badge--muted" style="font-family:var(--mono)">${esc(p.id)}</span></td>
              <td><b style="font-size:.86rem">${esc(p.name)}</b><div style="font-size:.72rem;color:var(--text-3)">${esc(p.category)} · ${esc(p.priority || '')}</div></td>
              <td style="font-size:.82rem">${esc(p.client)}</td>
              <td>${statusBadge(p.status)}</td>
              <td style="min-width:120px">
                <div class="bar bar--sm"><div class="bar__fill" data-fill="${p.progress}"></div></div>
                <span style="font-size:.72rem;color:var(--text-3)">${p.progress}%</span>
              </td>
              <td class="num">${money(p.budget, DB.settings.currency)}</td>
              <td class="num">${money(p.spent || 0, DB.settings.currency)}</td>
              <td style="font-size:.78rem;white-space:nowrap">${dShort(p.start)} → ${dShort(p.end)}</td>
              <td><div class="cell-actions">
                <button class="btn btn--xs btn--ghost" type="button" data-proj-view="${esc(p.id)}" title="Details">${icon('eye', 13)}</button>
                <button class="btn btn--xs btn--ghost" type="button" data-proj-milestones="${esc(p.id)}" title="Milestones">${icon('target', 13)}</button>
                ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-proj-edit="${esc(p.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
                ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-proj-del="${esc(p.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
              </div></td>
            </tr>`).join('') : tableEmptyRow(9, 'No projects match the current filters.')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('gantt', 17)} Kanban board — drag cards to change status</h3><span class="badge badge--cyan">Drag &amp; drop</span></div>
      <div class="kanban">${['Planned', 'Ongoing', 'On Hold', 'Completed'].map((s) => `
        <div class="kcol" data-drop="${s}">
          <div class="kcol__head"><span>${esc(s)}</span><span class="kcol__count">${DB.projects.filter((p) => p.status === s).length}</span></div>
          ${DB.projects.filter((p) => p.status === s).map((p) => `
            <div class="kcard" draggable="${can('edit') ? 'true' : 'false'}" data-kcard="${esc(p.id)}">
              <div class="kcard__t">${esc(p.name)}</div>
              <div class="kcard__m">
                <span>${esc(p.client.slice(0, 22))}</span>
                <span>${money(p.budget, DB.settings.currency)}</span>
              </div>
              <div class="bar bar--sm" style="margin-top:8px"><div class="bar__fill" data-fill="${p.progress}"></div></div>
            </div>`).join('')}
        </div>`).join('')}
      </div>
    </div>`;
  requestAnimationFrame(() => $$('.dash-panel .bar__fill').forEach((f) => { f.style.width = f.dataset.fill + '%'; }));
  // kanban drag & drop
  let dragged = null;
  $$('[data-kcard]').forEach((card) => {
    card.addEventListener('dragstart', (e) => { dragged = card.dataset.kcard; card.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragged); } catch (_) {} });
    card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); dragged = null; });
  });
  $$('.kcol').forEach((col) => {
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('is-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('is-over'));
    col.addEventListener('drop', (e) => {
      e.preventDefault(); col.classList.remove('is-over');
      if (!dragged || !can('edit')) { if (!can('edit')) toast('warn', 'Read-only role', 'Your role cannot change project status.'); return; }
      const p = DB.projects.find((x) => x.id === dragged);
      if (!p) return;
      const target = col.dataset.drop;
      if (p.status === target) return;
      const prev = p.status;
      p.status = target;
      if (target === 'Completed') p.progress = 100;
      saveDB(); logActivity(`Project ${p.name}: ${prev} → ${target}`);
      notify('Project status changed', `${p.name} moved to ${target}`, target === 'Completed' ? 'ok' : 'info', 'projects');
      toast('ok', 'Status updated', `${p.name} → ${target}`);
      renderDashPanel('projects'); renderDashCounts(); renderProjects();
    });
  });
  const s = byId('dpSearch');
  if (s) s.addEventListener('input', debounce((e) => { UI.projSearch = e.target.value; renderDashPanel('projects'); }, 260));
  const st = byId('dpStatus');
  if (st) st.addEventListener('change', (e) => { UI.projStatus = e.target.value; renderDashPanel('projects'); });
}
function milestonesEditor(id) {
  const p = DB.projects.find((x) => x.id === id);
  if (!p) return;
  const render = () => {
    const body = byId('msBody');
    if (!body) return;
    body.innerHTML = `
      <div class="stack" style="gap:9px">
        ${(p.milestones || []).map((m, i) => `
          <div class="row" style="gap:9px;align-items:center;padding:9px 11px;border:1px solid var(--border);border-radius:11px">
            <label class="switch"><input type="checkbox" data-ms-done="${i}" ${m.done ? 'checked' : ''}><span class="switch__track"></span></label>
            <input class="input" style="flex:1" value="${esc(m.name)}" data-ms-name="${i}" aria-label="Milestone name">
            <input class="input" type="date" style="width:150px" value="${esc((m.date || '').slice(0, 10))}" data-ms-date="${i}" aria-label="Milestone date">
            ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-ms-del="${i}" aria-label="Remove milestone">${icon('trash', 13)}</button>` : ''}
          </div>`).join('') || '<p style="font-size:.86rem;color:var(--text-3)">No milestones yet — add the first below.</p>'}
      </div>
      <div class="row" style="gap:9px;margin-top:14px">
        <input class="input" id="msNewName" placeholder="New milestone name" style="flex:1" aria-label="New milestone name">
        <input class="input" id="msNewDate" type="date" style="width:160px" aria-label="New milestone date">
        <button class="btn btn--primary btn--sm" type="button" id="msAdd">${icon('plus', 14)} Add</button>
      </div>
      <p style="font-size:.78rem;color:var(--text-3);margin-top:12px">Project progress recalculates automatically from completed milestones (${(p.milestones || []).filter((m) => m.done).length}/${(p.milestones || []).length} done).</p>`;
    $$('[data-ms-done]').forEach((c) => c.addEventListener('change', () => { p.milestones[Number(c.dataset.msDone)].done = c.checked; persistMs(); }));
    $$('[data-ms-name]').forEach((c) => c.addEventListener('change', () => { p.milestones[Number(c.dataset.msName)].name = c.value; persistMs(); }));
    $$('[data-ms-date]').forEach((c) => c.addEventListener('change', () => { p.milestones[Number(c.dataset.msDate)].date = c.value; persistMs(); }));
    $$('[data-ms-del]').forEach((b) => b.addEventListener('click', () => { p.milestones.splice(Number(b.dataset.msDel), 1); persistMs(); }));
    const add = byId('msAdd');
    if (add) add.addEventListener('click', () => {
      const name = byId('msNewName').value.trim();
      if (!name) return toast('warn', 'Name required', 'Enter a milestone name.');
      p.milestones.push({ name, date: byId('msNewDate').value || todayISO(), done: false });
      persistMs();
    });
  };
  const persistMs = () => {
    const done = (p.milestones || []).filter((m) => m.done);
    const total = (p.milestones || []).length;
    p.progress = total ? Math.round((done.length / total) * 100) : p.progress;
    if (p.status !== 'Completed' && total && done.length === total) { p.status = 'Completed'; }
    saveDB(); logActivity(`Updated milestones for ${p.name}`);
    render();
    renderProjects(); renderDashCounts();
  };
  openModal({
    title: `Milestones — ${p.name}`,
    body: '<div id="msBody"></div>',
    footer: el('div', { class: 'row', style: 'width:100%;justify-content:flex-end' }, [
      el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Close', onclick: () => { closeModal(); renderDashPanel('projects'); } })
    ]),
    onOpen: render
  });
}

/* ---------------- Assets panel ---------------- */
function panelAssets(host) {
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px" id="dashAssetKpis"></div>
    <div class="card glass panel">
      <div class="panel__head">
        <h3>${icon('building', 17)} Asset register</h3>
        <div class="toolbar__group">
          <div class="search"><span>${icon('search', 16)}</span><input class="input" type="search" id="daSearch" placeholder="Search assets…" value="${esc(UI.assetSearch)}" aria-label="Search assets"></div>
          <select class="select" id="daStatus" style="min-width:160px" aria-label="Filter by status">
            ${['', 'Operational', 'Under Maintenance', 'Faulty', 'Decommissioned'].map((s) => `<option value="${s}"${UI.assetStatus === s ? ' selected' : ''}>${s || 'All statuses'}</option>`).join('')}
          </select>
          <button class="btn btn--ghost btn--sm" type="button" data-dash-export="assets">${icon('download', 14)} Excel</button>
          ${can('create') ? `<button class="btn btn--primary btn--sm" type="button" data-new="asset">${icon('plus', 15)} New asset</button>` : ''}
        </div>
      </div>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Tag</th><th>Asset</th><th>Category</th><th>Status</th><th>Criticality</th><th class="num">Age</th><th class="num">% life</th><th class="num">Actions</th></tr></thead>
          <tbody>${filteredAssets().length ? filteredAssets().map((a) => `
            <tr>
              <td><span class="badge badge--cyan" style="font-family:var(--mono)">${esc(a.tag)}</span></td>
              <td><b style="font-size:.85rem">${esc(a.name)}</b><div style="font-size:.72rem;color:var(--text-3)">${esc(a.location)}</div></td>
              <td style="font-size:.82rem">${esc(a.category)}</td>
              <td>${statusBadge(a.status)}</td>
              <td><span class="badge ${PRIORITY_CLS[a.criticality] || 'badge--muted'}">${esc(a.criticality)}</span></td>
              <td class="num">${assetAgeYears(a).toFixed(1)}</td>
              <td class="num">${assetLifePct(a)}%</td>
              <td><div class="cell-actions">
                <button class="btn btn--xs btn--ghost" type="button" data-asset-view="${esc(a.id)}" title="Details">${icon('eye', 13)}</button>
                <button class="btn btn--xs btn--ghost" type="button" data-asset-qr="${esc(a.id)}" title="QR">${icon('qr', 13)}</button>
                ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-asset-edit="${esc(a.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
                ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-asset-del="${esc(a.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
              </div></td>
            </tr>`).join('') : tableEmptyRow(8, 'No assets match the current filters.')}</tbody>
        </table>
      </div>
    </div>
    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('gauge', 17)} Asset age profile</h3></div>
      <div class="chart-box chart-box--bar" id="box_dashChartAssetAge"><canvas id="dashChartAssetAge" role="img" aria-label="Asset age profile"></canvas></div>
    </div>`;
  const kp = byId('dashAssetKpis');
  if (kp) {
    const total = DB.assets.length;
    const op = DB.assets.filter((a) => a.status === 'Operational').length;
    const near = DB.assets.filter((a) => assetLifePct(a) > 75).length;
    const val = DB.assets.reduce((s, a) => s + (Number(a.cost) || 0), 0);
    kp.innerHTML = [
      { i: 'building', c: '', l: 'Registered assets', v: total },
      { i: 'check', c: 'kpi__icon--ok', l: 'Operational', v: `${pct(op, total)}%` },
      { i: 'alert', c: 'kpi__icon--warn', l: 'Beyond 75% of life', v: near },
      { i: 'coins', c: 'kpi__icon--info', l: 'Replacement value', v: money(val, DB.settings.currency) }
    ].map((x, i) => `<div class="card glass kpi" data-reveal="zoom" data-delay="${i}">
        <div class="kpi__top"><div class="kpi__icon ${x.c}">${icon(x.i, 20)}</div></div>
        <div class="kpi__value">${typeof x.v === 'number' ? x.v : esc(x.v)}</div>
        <div class="kpi__label">${esc(x.l)}</div>
      </div>`).join('');
  }
  if (chartReady()) {
    const buckets = { '< 3 yrs': 0, '3–7 yrs': 0, '7–12 yrs': 0, '12+ yrs': 0 };
    DB.assets.forEach((a) => {
      const age = assetAgeYears(a);
      if (age < 3) buckets['< 3 yrs']++; else if (age < 7) buckets['3–7 yrs']++; else if (age < 12) buckets['7–12 yrs']++; else buckets['12+ yrs']++;
    });
    destroyChart('assetAge');
    const c = byId('dashChartAssetAge');
    if (c) UI.charts.assetAge = new Chart(c, {
      type: 'bar',
      data: { labels: Object.keys(buckets), datasets: [{ label: 'Assets', data: Object.values(buckets), backgroundColor: ['#10B981', '#06B6D4', '#F59E0B', '#F43F5E'], borderRadius: 9, maxBarThickness: 62 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: chartText(), font: chartFont() } }, y: { grid: { color: chartGrid() }, ticks: { color: chartText(), font: chartFont(), precision: 0 } } } }
    });
  } else chartFallback('dashChartAssetAge');
  const s = byId('daSearch');
  if (s) s.addEventListener('input', debounce((e) => { UI.assetSearch = e.target.value; renderDashPanel('assets'); }, 260));
  const st = byId('daStatus');
  if (st) st.addEventListener('change', (e) => { UI.assetStatus = e.target.value; renderDashPanel('assets'); });
}

/* ---------------- Maintenance panel ---------------- */
function panelMaintenance(host) {
  const wos = DB.maintenance.slice().sort((a, b) => new Date(a.due || a.date) - new Date(b.due || b.date));
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px">
      ${woKpis().map((c, i) => `<div class="card glass kpi" data-reveal="zoom" data-delay="${i}">
        <div class="kpi__top"><div class="kpi__icon ${c.cls}">${icon(c.icon, 20)}</div></div>
        <div class="kpi__value">${typeof c.value === 'number' ? c.value : esc(c.value)}</div>
        <div class="kpi__label">${esc(c.label)}</div>
        <div style="font-size:.74rem;color:var(--text-3);margin-top:6px">${esc(c.note)}</div>
      </div>`).join('')}
    </div>
    <div class="card glass panel">
      <div class="panel__head">
        <h3>${icon('wrench', 17)} Work order register</h3>
        <div class="toolbar__group">
          <select class="select" id="dwFilter" style="min-width:160px" aria-label="Filter by type">
            <option value="all"${UI.woFilter === 'all' ? ' selected' : ''}>All types</option>
            <option value="Preventive"${UI.woFilter === 'Preventive' ? ' selected' : ''}>Preventive (PPM)</option>
            <option value="Reactive"${UI.woFilter === 'Reactive' ? ' selected' : ''}>Reactive</option>
          </select>
          <button class="btn btn--ghost btn--sm" type="button" data-dash-export="maintenance">${icon('download', 14)} Excel</button>
          ${can('create') ? `<button class="btn btn--primary btn--sm" type="button" data-new="wo">${icon('plus', 15)} New work order</button>` : ''}
        </div>
      </div>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>WO</th><th>Title</th><th>Type</th><th>Asset</th><th>Technician</th><th>Due</th><th>Status</th><th class="num">Cost</th><th class="num">Actions</th></tr></thead>
          <tbody>${wos.filter((w) => UI.woFilter === 'all' || w.type === UI.woFilter).length ? wos.filter((w) => UI.woFilter === 'all' || w.type === UI.woFilter).map((w) => `
            <tr>
              <td><span class="badge badge--muted" style="font-family:var(--mono)">${esc(w.id)}</span></td>
              <td><b style="font-size:.85rem">${esc(w.title)}</b></td>
              <td><span class="badge ${w.type === 'Preventive' ? 'badge--info' : 'badge--warn'}">${esc(w.type)}</span></td>
              <td style="font-size:.8rem">${esc(w.asset || '—')}</td>
              <td style="font-size:.8rem">${esc(w.tech || 'Unassigned')}</td>
              <td style="font-size:.8rem;white-space:nowrap">${dShort(w.due || w.date)}</td>
              <td>${statusBadge(w.status)}</td>
              <td class="num">${moneyExact(w.cost || 0, DB.settings.currency)}</td>
              <td><div class="cell-actions">
                <button class="btn btn--xs btn--ghost" type="button" data-wo-view="${esc(w.id)}" title="Details">${icon('eye', 13)}</button>
                ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-wo-edit="${esc(w.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
                ${can('edit') ? `<button class="btn btn--xs btn--primary" type="button" data-wo-advance="${esc(w.id)}" title="Advance">${icon('play', 13)}</button>` : ''}
                ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-wo-del="${esc(w.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
              </div></td>
            </tr>`).join('') : tableEmptyRow(9, 'No work orders in this view.')}</tbody>
        </table>
      </div>
    </div>
    <div class="grid g-2" style="margin-top:18px;align-items:start">
      <div class="card glass panel"><div class="panel__head"><h3>${icon('chart', 17)} PPM vs reactive</h3></div>
        <div class="chart-box chart-box--doughnut" id="box_dashChartWoMix"><canvas id="dashChartWoMix" role="img" aria-label="Work order type mix"></canvas></div></div>
      <div class="card glass panel"><div class="panel__head"><h3>${icon('calendar', 17)} Schedule</h3></div>
        <div class="cal-wrap"><div id="dashCalendar"></div></div></div>
    </div>`;
  if (chartReady()) {
    const ppm = DB.maintenance.filter((w) => w.type === 'Preventive').length;
    const re = DB.maintenance.filter((w) => w.type === 'Reactive').length;
    destroyChart('woMix');
    const c = byId('dashChartWoMix');
    if (c) UI.charts.woMix = new Chart(c, {
      type: 'doughnut',
      data: { labels: ['Preventive', 'Reactive'], datasets: [{ data: [ppm, re], backgroundColor: ['#10B981', '#F59E0B'], borderWidth: 0, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { position: 'bottom', labels: { color: chartText(), font: chartFont(), usePointStyle: true, boxWidth: 9 } } } }
    });
  } else chartFallback('dashChartWoMix');
  renderCalendar('dashCalendar');
  const f = byId('dwFilter');
  if (f) f.addEventListener('change', (e) => { UI.woFilter = e.target.value; renderDashPanel('maintenance'); });
}

/* ---------------- Gantt panel ---------------- */
function panelGantt(host) {
  const rows = DB.projects.filter((p) => p.start);
  if (!rows.length) { host.innerHTML = ''; host.append(emptyState('No projects with dates to plot.', 'New project', () => projectForm())); return; }
  const times = [];
  rows.forEach((p) => { if (p.start) times.push(new Date(p.start).getTime()); if (p.end) times.push(new Date(p.end).getTime()); });
  (DB.projects || []).forEach((p) => (p.milestones || []).forEach((m) => { if (m.date) times.push(new Date(m.date).getTime()); }));
  let min = Math.min.apply(null, times), max = Math.max.apply(null, times);
  min = new Date(min); max = new Date(max);
  min.setMonth(min.getMonth() - 1); max.setMonth(max.getMonth() + 1);
  const span = max - min || 1;
  const pos = (d) => clamp(((new Date(d).getTime() - min) / span) * 100, 0, 100);
  const ticks = [];
  const cursor = new Date(min);
  cursor.setDate(1);
  while (cursor <= max) { ticks.push(new Date(cursor)); cursor.setMonth(cursor.getMonth() + 2); }
  const barCls = (s) => s === 'Completed' ? 'gantt__bar--done' : s === 'On Hold' ? 'gantt__bar--hold' : s === 'Planned' ? 'gantt__bar--planned' : '';

  host.innerHTML = `
    <div class="card glass panel">
      <div class="panel__head">
        <h3>${icon('gantt', 17)} Portfolio schedule</h3>
        <div class="toolbar__group">
          <span class="badge badge--cyan">${dShort(min)} → ${dShort(max)}</span>
          <button class="btn btn--ghost btn--sm" type="button" data-dash-export="projects">${icon('download', 14)} Excel</button>
        </div>
      </div>
      <div class="gantt">
        <div class="gantt__inner">
          <div class="gantt__axis">
            <span style="font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--text-3)">Project</span>
            <span class="gantt__ticks">${ticks.map((tk) => `<span>${tk.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</span>`).join('')}</span>
          </div>
          ${rows.map((p) => {
            const left = pos(p.start);
            const right = p.end ? pos(p.end) : 100;
            const width = Math.max(2.5, right - left);
            return `<div class="gantt__row">
              <div>
                <div class="gantt__name" title="${esc(p.name)}">${esc(p.name)}</div>
                <div style="font-size:.68rem;color:var(--text-3)">${esc(p.status)} · ${p.progress}%</div>
              </div>
              <div class="gantt__track">
                <div class="gantt__bar ${barCls(p.status)}" style="left:${left}%;width:${width}%" title="${esc(p.name)} · ${dLong(p.start)} → ${dLong(p.end)}">
                  ${p.progress > 0 ? p.progress + '%' : ''}
                </div>
                ${(p.milestones || []).map((m) => m.date ? `<span title="${esc(m.name)} — ${dLong(m.date)}" style="position:absolute;left:${pos(m.date)}%;top:9px;width:8px;height:8px;transform:rotate(45deg);background:${m.done ? 'var(--ok)' : 'var(--warn)'};border:1px solid var(--bg);z-index:2"></span>` : '').join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="row" style="gap:14px;margin-top:14px;font-size:.76rem;color:var(--text-3);flex-wrap:wrap">
        <span class="row" style="gap:6px"><span style="width:12px;height:12px;border-radius:4px;background:linear-gradient(135deg,#06B6D4,#10B981)"></span> Ongoing</span>
        <span class="row" style="gap:6px"><span style="width:12px;height:12px;border-radius:4px;background:linear-gradient(135deg,#60A5FA,#3B82F6)"></span> Planned</span>
        <span class="row" style="gap:6px"><span style="width:12px;height:12px;border-radius:4px;background:linear-gradient(135deg,#F59E0B,#D97706)"></span> On hold</span>
        <span class="row" style="gap:6px"><span style="width:12px;height:12px;border-radius:4px;background:linear-gradient(135deg,#10B981,#059669)"></span> Completed</span>
        <span class="row" style="gap:6px"><span style="width:9px;height:9px;transform:rotate(45deg);background:var(--warn)"></span> Milestone</span>
      </div>
    </div>

    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('target', 17)} Milestone tracker</h3><span class="badge badge--muted">${DB.projects.reduce((s, p) => s + (p.milestones || []).length, 0)} milestones</span></div>
      ${DB.projects.filter((p) => (p.milestones || []).length).map((p) => `
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div class="row row--between" style="margin-bottom:9px">
            <b style="font-size:.87rem">${esc(p.name)}</b>
            <button class="btn btn--xs btn--ghost" type="button" data-proj-milestones="${esc(p.id)}">${icon('edit', 12)} Manage</button>
          </div>
          <div class="stack" style="gap:6px">
            ${p.milestones.map((m) => `
              <div class="row" style="gap:9px;font-size:.82rem">
                <span style="color:${m.done ? 'var(--ok)' : 'var(--text-3)'}">${m.done ? icon('check', 14) : icon('clock', 14)}</span>
                <span style="flex:1;${m.done ? '' : 'color:var(--text-2)'}">${esc(m.name)}</span>
                <span style="color:var(--text-3);font-size:.76rem">${dShort(m.date)}</span>
              </div>`).join('')}
          </div>
        </div>`).join('') || '<p style="font-size:.86rem;color:var(--text-3)">No milestones defined yet.</p>'}
    </div>`;
}

/* ---------------- Calendar panel ---------------- */
function panelCalendar(host) {
  host.innerHTML = `
    <div class="card glass panel">
      <div class="panel__head">
        <h3>${icon('calendar', 17)} Maintenance &amp; project calendar</h3>
        <div class="toolbar__group">
          <span class="badge badge--info">PPM</span><span class="badge badge--warn">Reactive</span><span class="badge badge--ok">Completed</span>
          <button class="btn btn--ghost btn--sm" type="button" data-dash-export="maintenance">${icon('download', 14)} Excel</button>
        </div>
      </div>
      <div class="cal-wrap"><div id="dashCalFull"></div></div>
    </div>
    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('clock', 17)} Upcoming (next 45 days)</h3></div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Due</th><th>WO</th><th>Title</th><th>Type</th><th>Technician</th><th>Status</th></tr></thead>
        <tbody>${DB.maintenance
          .filter((w) => { const d = new Date(w.due || w.date); const n = new Date(); return d >= n && d <= new Date(n.getTime() + 45 * 864e5); })
          .sort((a, b) => new Date(a.due) - new Date(b.due))
          .map((w) => `<tr><td style="white-space:nowrap">${dShort(w.due || w.date)}</td><td><span class="badge badge--muted" style="font-family:var(--mono)">${esc(w.id)}</span></td><td>${esc(w.title)}</td><td>${esc(w.type)}</td><td>${esc(w.tech || '—')}</td><td>${statusBadge(w.status)}</td></tr>`).join('') || tableEmptyRow(6, 'Nothing scheduled in the next 45 days.')}</tbody>
      </table></div>
    </div>`;
  renderCalendar('dashCalFull');
}

/* ---------------- Analytics panel ---------------- */
function panelAnalytics(host) {
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px">
      ${[
        { i: 'coins', c: 'kpi__icon--info', l: 'Total budget', v: money(DB.projects.reduce((s, p) => s + (Number(p.budget) || 0), 0), DB.settings.currency), n: `${DB.projects.length} projects` },
        { i: 'coins', c: 'kpi__icon--ok', l: 'Spend to date', v: money(DB.projects.reduce((s, p) => s + (Number(p.spent) || 0), 0), DB.settings.currency), n: 'Recorded expenditure' },
        { i: 'target', c: '', l: 'Avg. progress', v: (DB.projects.length ? Math.round(DB.projects.reduce((s, p) => s + p.progress, 0) / DB.projects.length) : 0) + '%', n: 'Across all projects' },
        { i: 'wrench', c: 'kpi__icon--warn', l: 'Maintenance cost', v: money(DB.maintenance.reduce((s, w) => s + (Number(w.cost) || 0), 0), DB.settings.currency), n: `${DB.maintenance.length} work orders` }
      ].map((x, i) => `<div class="card glass kpi" data-reveal="zoom" data-delay="${i}">
        <div class="kpi__top"><div class="kpi__icon ${x.c}">${icon(x.i, 20)}</div></div>
        <div class="kpi__value">${esc(x.v)}</div>
        <div class="kpi__label">${esc(x.l)}</div>
        <div style="font-size:.74rem;color:var(--text-3);margin-top:6px">${esc(x.n)}</div>
      </div>`).join('')}
    </div>
    <div class="grid g-2" style="align-items:start">
      <div class="card glass panel"><div class="panel__head"><h3>${icon('chart', 17)} Budget utilisation by project</h3></div>
        <div class="chart-box chart-box--bar" id="box_anChartUtil"><canvas id="anChartUtil" role="img" aria-label="Budget utilisation"></canvas></div></div>
      <div class="card glass panel"><div class="panel__head"><h3>${icon('db', 17)} Spend by category</h3></div>
        <div class="chart-box chart-box--doughnut" id="box_anChartCat"><canvas id="anChartCat" role="img" aria-label="Spend by category"></canvas></div></div>
      <div class="card glass panel"><div class="panel__head"><h3>${icon('wrench', 17)} Work orders by status</h3></div>
        <div class="chart-box chart-box--bar" id="box_anChartWo"><canvas id="anChartWo" role="img" aria-label="Work orders by status"></canvas></div></div>
      <div class="card glass panel"><div class="panel__head"><h3>${icon('spark', 17)} Skill strength by category</h3></div>
        <div class="chart-box chart-box--radar" id="box_anChartSkills"><canvas id="anChartSkills" role="img" aria-label="Skill strength"></canvas></div></div>
      <div class="card glass panel"><div class="panel__head"><h3>${icon('building', 17)} Asset status distribution</h3></div>
        <div class="chart-box chart-box--doughnut" id="box_anChartAsset"><canvas id="anChartAsset" role="img" aria-label="Asset status"></canvas></div></div>
      <div class="card glass panel"><div class="panel__head"><h3>${icon('gauge', 17)} KPI snapshot</h3><button class="btn btn--ghost btn--xs" type="button" data-dash-export="kpi">${icon('download', 12)} Excel</button></div>
        <div class="table-wrap" style="border:0"><table class="data" style="min-width:0"><tbody>
          ${Object.entries(kpiSnapshot()).map(([k, v]) => `<tr><td style="font-size:.82rem;color:var(--text-3)">${esc(k)}</td><td style="text-align:right;font-weight:700;font-size:.82rem">${esc(v)}</td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  if (!chartReady()) { ['anChartUtil', 'anChartCat', 'anChartWo', 'anChartSkills', 'anChartAsset'].forEach((id) => chartFallback(id)); return; }
  const rows = DB.projects.slice(0, 9);
  destroyChart('anUtil');
  if (byId('anChartUtil')) UI.charts.anUtil = new Chart(byId('anChartUtil'), {
    type: 'bar',
    data: {
      labels: rows.map((p) => p.name.length > 18 ? p.name.slice(0, 17) + '…' : p.name),
      datasets: [{ label: 'Utilisation %', data: rows.map((p) => (p.budget ? Math.round(((p.spent || 0) / p.budget) * 100) : 0)), backgroundColor: 'rgba(6,182,212,.8)', borderRadius: 8, maxBarThickness: 30 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => ` ${x.parsed.y}% of budget` } } },
      scales: { x: { grid: { display: false }, ticks: { color: chartText(), font: chartFont() } }, y: { grid: { color: chartGrid() }, ticks: { color: chartText(), font: chartFont(), callback: (v) => v + '%' }, max: 120 } } }
  });
  const cats = {};
  DB.projects.forEach((p) => { cats[p.category] = (cats[p.category] || 0) + (Number(p.spent) || 0); });
  destroyChart('anCat');
  if (byId('anChartCat')) UI.charts.anCat = new Chart(byId('anChartCat'), {
    type: 'doughnut',
    data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: chartText(), font: chartFont(), usePointStyle: true, boxWidth: 9, padding: 10 } },
      tooltip: { callbacks: { label: (x) => ` ${x.label}: ${moneyExact(x.parsed, DB.settings.currency)}` } } } }
  });
  const sts = ['Scheduled', 'In Progress', 'Completed', 'Overdue'];
  destroyChart('anWo');
  if (byId('anChartWo')) UI.charts.anWo = new Chart(byId('anChartWo'), {
    type: 'bar',
    data: { labels: sts, datasets: [{ label: 'Work orders', data: sts.map((s) => DB.maintenance.filter((w) => w.status === s).length), backgroundColor: ['#0EA5E9', '#8B5CF6', '#10B981', '#F43F5E'], borderRadius: 9, maxBarThickness: 56 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false }, ticks: { color: chartText(), font: chartFont() } }, y: { grid: { color: chartGrid() }, ticks: { color: chartText(), font: chartFont(), precision: 0 } } } }
  });
  const byCat = {};
  DB.skills.forEach((s) => { byCat[s.cat] = byCat[s.cat] || { sum: 0, n: 0 }; byCat[s.cat].sum += s.level; byCat[s.cat].n++; });
  const scats = Object.keys(byCat).sort((a, b) => (byCat[b].sum / byCat[b].n) - (byCat[a].sum / byCat[a].n)).slice(0, 10);
  destroyChart('anSkills');
  if (byId('anChartSkills')) UI.charts.anSkills = new Chart(byId('anChartSkills'), {
    type: 'radar',
    data: { labels: scats, datasets: [{ label: 'Avg %', data: scats.map((c) => Math.round(byCat[c].sum / byCat[c].n)), backgroundColor: 'rgba(16,185,129,.22)', borderColor: '#10B981', borderWidth: 2, pointBackgroundColor: '#10B981', pointRadius: 3.4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { r: { min: 40, max: 100, angleLines: { color: chartGrid() }, grid: { color: chartGrid() }, pointLabels: { color: chartText(), font: chartFont() }, ticks: { display: false } } } }
  });
  const asts = ['Operational', 'Under Maintenance', 'Faulty', 'Decommissioned'];
  destroyChart('anAsset');
  if (byId('anChartAsset')) UI.charts.anAsset = new Chart(byId('anChartAsset'), {
    type: 'doughnut',
    data: { labels: asts, datasets: [{ data: asts.map((s) => DB.assets.filter((a) => a.status === s).length), backgroundColor: ['#10B981', '#F59E0B', '#F43F5E', '#93A6C4'], borderWidth: 0, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: chartText(), font: chartFont(), usePointStyle: true, boxWidth: 9, padding: 11 } } } }
  });
}

/* ---------------- Reports panel ---------------- */
function panelReports(host) {
  const reports = [
    { id: 'portfolio', i: 'file', t: 'Portfolio Report', d: 'Full portfolio summary: KPIs, project list, budgets and progress.', f: 'PDF', fn: () => portfolioPdf() },
    { id: 'resume', i: 'award', t: 'CV / Resume', d: 'Complete CV with experience, certifications and education.', f: 'PDF', fn: () => downloadResume() },
    { id: 'projects-x', i: 'layers', t: 'Project Register', d: 'All filtered projects with budget, spend, dates and progress.', f: 'Excel / CSV', fn: () => exportProjectsXlsx() },
    { id: 'assets-x', i: 'building', t: 'Asset Register', d: 'Asset list with lifecycle age, criticality and replacement cost.', f: 'Excel / CSV', fn: () => exportAssetsXlsx() },
    { id: 'wo-x', i: 'wrench', t: 'Maintenance Report', d: 'Work orders with type, technician, due date, status and cost.', f: 'Excel / CSV', fn: () => exportMaintenanceXlsx() },
    { id: 'skills-x', i: 'spark', t: 'Skills Matrix', d: 'Skill proficiency by category for capability reviews.', f: 'Excel / CSV', fn: () => exportSkillsXlsx() },
    { id: 'kpi-x', i: 'gauge', t: 'KPI Dashboard', d: 'Executive metric snapshot with utilisation and completion rates.', f: 'Excel / CSV', fn: () => exportKpiReport() },
    { id: 'exp-csv', i: 'clock', t: 'Experience Record', d: 'Chronological career record suitable for tenders and bids.', f: 'CSV', fn: () => exportExpCsv() },
    { id: 'json', i: 'db', t: 'Full Data Backup', d: 'Complete platform data as a portable JSON backup file.', f: 'JSON', fn: () => exportJSON() },
    { id: 'print', i: 'print', t: 'Print / Save as PDF', d: 'Print the current view using the browser print dialogue.', f: 'Print', fn: () => window.print() }
  ];
  host.innerHTML = `
    <div class="card glass panel">
      <div class="panel__head"><h3>${icon('file', 17)} Report library</h3><span class="badge badge--cyan">${reports.length} outputs</span></div>
      <div class="grid g-3">
        ${reports.map((r, i) => `
          <div class="glass card card--hover" style="padding:16px;display:flex;flex-direction:column;gap:9px" data-reveal="zoom" data-delay="${i % 4}">
            <div class="row row--between"><span class="contact-card__icon" style="width:38px;height:38px;border-radius:11px">${icon(r.i, 17)}</span><span class="badge badge--muted">${esc(r.f)}</span></div>
            <b style="font-size:.92rem">${esc(r.t)}</b>
            <p style="font-size:.8rem;flex:1">${esc(r.d)}</p>
            <button class="btn btn--primary btn--sm btn--block" type="button" data-report="${esc(r.id)}">${icon('download', 14)} Generate</button>
          </div>`).join('')}
      </div>
    </div>
    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('gauge', 17)} KPI snapshot preview</h3><button class="btn btn--ghost btn--sm" type="button" data-dash-export="kpi">${icon('download', 14)} Excel</button></div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Metric</th><th style="text-align:right">Value</th></tr></thead>
        <tbody>${Object.entries(kpiSnapshot()).map(([k, v]) => `<tr><td>${esc(k)}</td><td style="text-align:right;font-weight:700">${esc(v)}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  $$('[data-report]').forEach((b) => b.addEventListener('click', () => {
    const r = reports.find((x) => x.id === b.dataset.report);
    if (r) r.fn();
  }));
}

/* ---------------- Skills panel ---------------- */
function panelSkillsDash(host) {
  const byCat = {};
  DB.skills.forEach((s) => { byCat[s.cat] = byCat[s.cat] || { sum: 0, n: 0 }; byCat[s.cat].sum += s.level; byCat[s.cat].n++; });
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px">
      <div class="card glass kpi" data-reveal="zoom"><div class="kpi__top"><div class="kpi__icon">${icon('spark', 20)}</div></div>
        <div class="kpi__value">${DB._skillAvg || 0}%</div><div class="kpi__label">Average proficiency</div></div>
      <div class="card glass kpi" data-reveal="zoom" data-delay="1"><div class="kpi__top"><div class="kpi__icon kpi__icon--info">${icon('layers', 20)}</div></div>
        <div class="kpi__value">${DB.skills.length}</div><div class="kpi__label">Skills tracked</div></div>
      <div class="card glass kpi" data-reveal="zoom" data-delay="2"><div class="kpi__top"><div class="kpi__icon kpi__icon--ok">${icon('check', 20)}</div></div>
        <div class="kpi__value">${DB.skills.filter((s) => s.level >= 85).length}</div><div class="kpi__label">Advanced (85%+)</div></div>
      <div class="card glass kpi" data-reveal="zoom" data-delay="3"><div class="kpi__top"><div class="kpi__icon kpi__icon--warn">${icon('target', 20)}</div></div>
        <div class="kpi__value">${Object.keys(byCat).length}</div><div class="kpi__label">Disciplines covered</div></div>
    </div>
    <div class="grid g-2" style="margin-bottom:18px;align-items:start">
      <div class="card glass panel"><div class="panel__head"><h3>${icon('chart', 17)} Category averages</h3></div>
        <div class="chart-box chart-box--bar" id="box_dsChartCat"><canvas id="dsChartCat" role="img" aria-label="Category averages"></canvas></div></div>
      <div class="card glass panel"><div class="panel__head"><h3>${icon('gauge', 17)} Radar</h3></div>
        <div class="chart-box chart-box--radar" id="box_dsChartRadar"><canvas id="dsChartRadar" role="img" aria-label="Skill radar"></canvas></div></div>
    </div>
    <div class="card glass panel">
      <div class="panel__head"><h3>${icon('spark', 17)} Skill matrix</h3>
        ${can('edit') ? `<button class="btn btn--primary btn--sm" type="button" data-new="skill">${icon('plus', 14)} Add skill</button>` : ''}</div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Skill</th><th>Category</th><th class="num">Years</th><th style="min-width:180px">Proficiency</th><th class="num">Actions</th></tr></thead>
        <tbody>${DB.skills.slice().sort((a, b) => b.level - a.level).map((s) => `
          <tr>
            <td><b style="font-size:.85rem">${esc(s.name)}</b><div style="font-size:.72rem;color:var(--text-3)">${esc(s.note || '')}</div></td>
            <td><span class="badge badge--muted">${esc(s.cat)}</span></td>
            <td class="num">${s.years || '—'}</td>
            <td><div class="row" style="gap:9px"><span class="bar bar--sm" style="flex:1"><span style="display:block;height:100%;border-radius:99px;background:var(--accent-grad);width:${s.level}%"></span></span><b style="font-size:.8rem;color:var(--cyan);width:38px;text-align:right">${s.level}%</b></div></td>
            <td><div class="cell-actions">
              ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-skill-edit="${esc(s.id)}">${icon('edit', 13)}</button>` : ''}
              ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-skill-del="${esc(s.id)}">${icon('trash', 13)}</button>` : ''}
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  if (!chartReady()) { chartFallback('dsChartCat'); chartFallback('dsChartRadar'); return; }
  const cats = Object.keys(byCat).sort((a, b) => (byCat[b].sum / byCat[b].n) - (byCat[a].sum / byCat[a].n));
  const avg = cats.map((c) => Math.round(byCat[c].sum / byCat[c].n));
  destroyChart('dsCat');
  if (byId('dsChartCat')) UI.charts.dsCat = new Chart(byId('dsChartCat'), {
    type: 'bar',
    data: { labels: cats, datasets: [{ label: 'Avg %', data: avg, backgroundColor: avg.map((v) => v >= 88 ? '#10B981' : v >= 80 ? '#06B6D4' : '#F59E0B'), borderRadius: 8, maxBarThickness: 30 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => ` ${x.parsed.x}% average` } } },
      scales: { x: { grid: { color: chartGrid() }, ticks: { color: chartText(), font: chartFont(), callback: (v) => v + '%' }, max: 100 }, y: { grid: { display: false }, ticks: { color: chartText(), font: chartFont() } } } }
  });
  destroyChart('dsRadar');
  if (byId('dsChartRadar')) UI.charts.dsRadar = new Chart(byId('dsChartRadar'), {
    type: 'radar',
    data: { labels: cats.slice(0, 10), datasets: [{ label: 'Avg %', data: avg.slice(0, 10), backgroundColor: 'rgba(6,182,212,.22)', borderColor: '#06B6D4', borderWidth: 2, pointBackgroundColor: '#06B6D4', pointRadius: 3.4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { r: { min: 40, max: 100, angleLines: { color: chartGrid() }, grid: { color: chartGrid() }, pointLabels: { color: chartText(), font: chartFont() }, ticks: { display: false } } } }
  });
}
function skillForm(id) {
  if (!can('create') && !id) return toast('warn', 'Permission denied', 'Your role cannot add skills.');
  const s = id ? DB.skills.find((x) => x.id === id) : null;
  const v = s || { name: '', cat: 'Facilities Management', level: 80, years: 5, note: '' };
  const fields = [
    fText('name', 'Skill name *', v.name, { full: true }),
    fSelect('cat', 'Category', v.cat, DB.skillCategories),
    fText('years', 'Years of experience', v.years, { type: 'number', min: 0, max: 50 }),
    fRange('level', 'Proficiency level', Number(v.level) || 80),
    fArea('note', 'Evidence / note', v.note, { rows: 3, ph: 'Where this was demonstrated…' })
  ];
  openEntityForm({
    title: s ? 'Edit skill' : 'Add skill', fields, values: v, saveLabel: s ? 'Update skill' : 'Add skill',
    onSubmit: (d) => {
      if (!d.name) return 'Skill name is required.';
      if (s) { Object.assign(s, d); toast('ok', 'Skill updated'); }
      else { DB.skills.push(Object.assign({ id: uid('s') }, d)); toast('ok', 'Skill added'); }
      saveDB(); populateDerived(DB); logActivity(`${s ? 'Updated' : 'Added'} skill ${d.name}`);
      renderSkills(); renderDashPanel('skills');
      return null;
    }
  });
}

/* ---------------- Credentials panel ---------------- */
function panelCredentials(host) {
  host.innerHTML = `
    <div class="card glass panel">
      <div class="panel__head"><h3>${icon('award', 17)} Certifications <span class="badge badge--muted">${DB.certifications.length}</span></h3>
        <div class="toolbar__group">
          <button class="btn btn--ghost btn--sm" type="button" data-dash-export="certs">${icon('download', 14)} Excel</button>
          ${can('create') ? `<button class="btn btn--primary btn--sm" type="button" data-new="cert">${icon('plus', 15)} Add certification</button>` : ''}
        </div>
      </div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Certification</th><th>Issuer</th><th>Year</th><th>Status</th><th class="num">Actions</th></tr></thead>
        <tbody>${DB.certifications.map((c) => `
          <tr>
            <td><b style="font-size:.85rem">${esc(c.name)}</b>${(c.skills || []).length ? `<div style="font-size:.7rem;color:var(--text-3)">${esc(c.skills.join(', '))}</div>` : ''}</td>
            <td style="font-size:.82rem">${esc(c.issuer)}</td>
            <td style="font-size:.82rem">${esc(c.year || '—')}</td>
            <td><span class="badge ${c.status === 'Active' ? 'badge--ok' : 'badge--muted'}">${esc(c.status || 'Active')}</span></td>
            <td><div class="cell-actions">
              <button class="btn btn--xs btn--ghost" type="button" data-cert-pdf="${esc(c.id)}" title="Certificate PDF">${icon('download', 13)}</button>
              ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-cert-edit="${esc(c.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
              ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-cert-del="${esc(c.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    </div>
    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('book', 17)} Education &amp; experience records</h3>
        ${can('edit') ? `<button class="btn btn--ghost btn--sm" type="button" data-new="education">${icon('plus', 14)} Add qualification</button>` : ''}</div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Qualification</th><th>Institution</th><th>Location</th><th>Year</th><th class="num">Actions</th></tr></thead>
        <tbody>${DB.education.map((e) => `
          <tr><td><b style="font-size:.85rem">${esc(e.degree)}</b></td><td style="font-size:.82rem">${esc(e.institution)}</td>
          <td style="font-size:.82rem">${esc(e.location || '—')}</td><td>${esc(e.year)}</td>
          <td><div class="cell-actions">${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-edu-edit="${esc(e.id)}">${icon('edit', 13)}</button>` : ''}${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-edu-del="${esc(e.id)}">${icon('trash', 13)}</button>` : ''}</div></td></tr>`).join('')}</tbody>
      </table></div>
    </div>
    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('clock', 17)} Experience timeline</h3>
        ${can('edit') ? `<button class="btn btn--ghost btn--sm" type="button" data-new="experience">${icon('plus', 14)} Add role</button>` : ''}</div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Company</th><th>Role</th><th>Period</th><th class="num">Points</th><th class="num">Actions</th></tr></thead>
        <tbody>${DB.experience.map((e, i) => `
          <tr><td><b style="font-size:.85rem">${esc(e.company)}</b>${e.current ? ' <span class="badge badge--ok">Current</span>' : ''}</td>
          <td style="font-size:.82rem">${esc(e.title)}</td><td style="font-size:.82rem">${esc(e.period)}</td><td class="num">${(e.points || []).length}</td>
          <td><div class="cell-actions">${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-exp-edit="${i}">${icon('edit', 13)}</button>` : ''}</div></td></tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}
function eduForm(id) {
  const e = id ? DB.education.find((x) => x.id === id) : null;
  const v = e || { degree: '', institution: '', location: '', year: String(new Date().getFullYear()), notes: '' };
  openEntityForm({
    title: e ? 'Edit qualification' : 'Add qualification',
    fields: [fText('degree', 'Qualification *', v.degree, { full: true }), fText('institution', 'Institution *', v.institution, { full: true }),
      fText('location', 'Location', v.location), fText('year', 'Year', v.year), fArea('notes', 'Notes', v.notes, { rows: 3 })],
    values: v, saveLabel: e ? 'Update' : 'Add',
    onSubmit: (d) => {
      if (!d.degree || !d.institution) return 'Qualification and institution are required.';
      if (e) { Object.assign(e, d); toast('ok', 'Qualification updated'); }
      else { DB.education.push(Object.assign({ id: uid('e') }, d)); toast('ok', 'Qualification added'); }
      saveDB(); logActivity(`${e ? 'Updated' : 'Added'} qualification ${d.degree}`);
      renderCredentials(); renderDashPanel('credentials');
      return null;
    }
  });
}
function expForm(index) {
  const e = index !== undefined && index !== null ? DB.experience[index] : null;
  const v = e || { company: '', short: '', logo: '', title: '', period: '', start: todayISO(), end: '', current: false, location: 'Dubai, UAE', type: '', points: [], projects: [] };
  openEntityForm({
    title: e ? 'Edit role' : 'Add role',
    fields: [
      fText('company', 'Company *', v.company), fText('short', 'Short name / logo initials', v.short || ''),
      fText('title', 'Job title *', v.title, { full: true }),
      fText('period', 'Display period', v.period, { ph: "Nov'24 — Present" }),
      fText('start', 'Start date', v.start, { type: 'date' }), fText('end', 'End date', v.end, { type: 'date' }),
      fText('location', 'Location', v.location), fText('type', 'Focus / type', v.type),
      fCheck('current', 'Current employer', !!v.current),
      fArea('points', 'Responsibilities (one per line)', (v.points || []).join('\n'), { rows: 7 }),
      fArea('projects', 'Project highlights (one per line)', (v.projects || []).join('\n'), { rows: 4 })
    ],
    values: v, saveLabel: e ? 'Update role' : 'Add role',
    onSubmit: (d) => {
      if (!d.company || !d.title) return 'Company and job title are required.';
      const points = String(d.points || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const projects = String(d.projects || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const payload = Object.assign({}, d, { points, projects });
      if (!payload.short) payload.short = d.company.slice(0, 10);
      if (!payload.logo) payload.logo = d.company.replace(/[^A-Za-z ]/g, '').split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
      if (e) { Object.assign(e, payload); toast('ok', 'Role updated'); }
      else { DB.experience.unshift(Object.assign({ id: uid('x') }, payload)); toast('ok', 'Role added'); }
      saveDB(); logActivity(`${e ? 'Updated' : 'Added'} experience ${d.company}`);
      renderExperience(); renderDashPanel('credentials');
      return null;
    }
  });
}

/* ==========================================================================
   Super Admin CMS Dashboard (Part 2), Global Event Listeners & System Boot
   ========================================================================== */
/* ==========================================================================
   PART G — Remaining panels, notifications, auth, global events, boot
   ========================================================================== */

/* ---------------- Blog & reviews panel ---------------- */
function panelBlog(host) {
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px">
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon">${icon('book', 20)}</div></div>
        <div class="kpi__value">${DB.blog.length}</div><div class="kpi__label">Articles</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--ok">${icon('eye', 20)}</div></div>
        <div class="kpi__value">${DB.blog.filter((b) => b.published !== false).length}</div><div class="kpi__label">Published</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--info">${icon('star', 20)}</div></div>
        <div class="kpi__value">${DB.testimonials.length ? (DB.testimonials.reduce((s, x) => s + x.rating, 0) / DB.testimonials.length).toFixed(1) : '0.0'}</div><div class="kpi__label">Average rating</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--violet">${icon('users', 20)}</div></div>
        <div class="kpi__value">${DB.testimonials.length}</div><div class="kpi__label">Testimonials</div></div>
    </div>
    <div class="card glass panel">
      <div class="panel__head"><h3>${icon('book', 17)} Articles</h3>
        ${can('create') ? `<button class="btn btn--primary btn--sm" type="button" data-new="blog">${icon('plus', 15)} New article</button>` : ''}</div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Title</th><th>Category</th><th>Date</th><th class="num">Read</th><th>Status</th><th class="num">Actions</th></tr></thead>
        <tbody>${DB.blog.map((b) => `
          <tr>
            <td><b style="font-size:.85rem">${esc(b.title)}</b><div style="font-size:.72rem;color:var(--text-3)">${esc((b.tags || []).join(' · '))}</div></td>
            <td><span class="badge badge--cyan">${esc(b.category)}</span></td>
            <td style="font-size:.8rem;white-space:nowrap">${dShort(b.date)}</td>
            <td class="num">${esc(String(b.readMins || 5))} min</td>
            <td><span class="badge ${b.published !== false ? 'badge--ok' : 'badge--muted'}">${b.published !== false ? 'Published' : 'Draft'}</span></td>
            <td><div class="cell-actions">
              <button class="btn btn--xs btn--ghost" type="button" data-blog-read="${esc(b.id)}" title="Read">${icon('eye', 13)}</button>
              ${can('edit') ? `<button class="btn btn--xs btn--ghost" type="button" data-blog-edit="${esc(b.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
              ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-blog-del="${esc(b.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
            </div></td>
          </tr>`).join('') || tableEmptyRow(6, 'No articles yet.')}</tbody>
      </table></div>
    </div>
    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('star', 17)} Testimonials</h3>
        <button class="btn btn--primary btn--sm" type="button" data-new="testimonial">${icon('plus', 15)} Add testimonial</button></div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Reviewer</th><th>Rating</th><th>Visible</th><th>Date</th><th>Comment</th><th class="num">Actions</th></tr></thead>
        <tbody>${DB.testimonials.map((t) => `
          <tr>
            <td><b style="font-size:.85rem">${esc(t.name)}</b><div style="font-size:.72rem;color:var(--text-3)">${esc(t.role || '')}</div></td>
            <td><span class="stars" style="font-size:.85rem">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</span></td>
            <td>${t.approved !== false ? '<span class="badge badge--ok">Shown</span>' : '<span class="badge badge--muted">Hidden</span>'}</td>
            <td style="font-size:.8rem">${dShort(t.date)}</td>
            <td style="font-size:.8rem;max-width:320px">${esc(String(t.text).slice(0, 90))}…</td>
            <td><div class="cell-actions">
              <button class="btn btn--xs btn--ghost" type="button" data-testi-toggle="${esc(t.id)}" title="Toggle visibility">${icon('eye', 13)}</button>
              ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-testi-del="${esc(t.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
            </div></td>
          </tr>`).join('') || tableEmptyRow(6, 'No testimonials yet.')}</tbody>
      </table></div>
    </div>`;
}

/* ---------------- Users & RBAC panel ---------------- */

/* Super Admin - Reset Password for Any User Account */
function openUserPwResetModal(userId) {
  if (!can('users')) {
    toast('danger', 'Access denied', 'Only Super Admin can reset user passwords.');
    return;
  }
  const u = DB.users.find(x => x.id === userId);
  if (!u) return;

  const fields = [
    fText('newPassword', `New Password for ${u.name || u.username} *`, '', { type: 'text', full: true, ph: 'Enter new password or click Generate' })
  ];

  openEntityForm({
    title: `Reset Password — ${u.name || u.username} (${u.role})`,
    fields,
    values: {},
    saveLabel: 'Save New Password',
    onOpen: (bodyEl) => {
      const genBtn = el('button', {
        class: 'btn btn--ghost btn--xs',
        type: 'button',
        html: icon('spark', 13) + ' Generate Strong Password',
        style: 'margin-top:8px',
        onclick: () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
          let gen = '';
          for (let i = 0; i < 10; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
          const input = bodyEl.querySelector('#f_newPassword');
          if (input) input.value = gen;
        }
      });
      bodyEl.append(genBtn);
    },
    onSubmit: (d) => {
      if (!d.newPassword || d.newPassword.length < 6) return 'Password must be at least 6 characters.';
      u.password = d.newPassword;
      saveDB();
      logActivity(`Super Admin reset password for user: ${u.username}`, 'security');
      toast('ok', 'Password Reset Successful', `New password saved for ${u.username}.`);
      renderDashPanel('users');
      return null;
    }
  });
}

function panelUsers(host) {
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px">
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon">${icon('users', 20)}</div></div>
        <div class="kpi__value">${DB.users.length}</div><div class="kpi__label">User accounts</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--ok">${icon('check', 20)}</div></div>
        <div class="kpi__value">${DB.users.filter((u) => u.active !== false).length}</div><div class="kpi__label">Active</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--info">${icon('key', 20)}</div></div>
        <div class="kpi__value">${ROLES.length}</div><div class="kpi__label">Roles defined</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--violet">${icon('shield', 20)}</div></div>
        <div class="kpi__value">${esc(currentRole())}</div><div class="kpi__label">Your role</div></div>
    </div>
    <div class="card glass panel">
      <div class="panel__head"><h3>${icon('users', 17)} User accounts</h3>
        <div class="toolbar__group">
          <button class="btn btn--ghost btn--sm" type="button" id="usersExport">${icon('download', 14)} Export</button>
          ${can('users') ? `<button class="btn btn--primary btn--sm" type="button" data-new="user">${icon('plus', 15)} Add user</button>` : ''}
        </div>
      </div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>User</th><th>Username</th><th>Role</th><th>Email</th><th>Created</th><th>Status</th><th class="num">Actions</th></tr></thead>
        <tbody>${DB.users.map((u) => `
          <tr>
            <td><div class="row" style="gap:9px"><span class="contact-card__icon" style="width:32px;height:32px;border-radius:9px;font-size:.72rem;font-weight:800">${esc(initials(u.name || u.username))}</span><b style="font-size:.85rem">${esc(u.name || u.username)}</b></div></td>
            <td><span style="font-family:var(--mono);font-size:.8rem">${esc(u.username)}</span></td>
            <td><span class="badge ${u.role === 'Super Admin' ? 'badge--danger' : u.role === 'Admin' ? 'badge--violet' : u.role === 'Manager' ? 'badge--info' : 'badge--muted'}">${esc(u.role)}</span></td>
            <td style="font-size:.8rem">${esc(u.email || '—')}</td>
            <td style="font-size:.78rem;white-space:nowrap">${dShort(u.created)}</td>
            <td>${u.active !== false ? '<span class="badge badge--ok">Active</span>' : '<span class="badge badge--danger">Disabled</span>'}</td>
            <td><div class="cell-actions">
              ${can('users') ? `<button class="btn btn--xs btn--ghost" type="button" data-user-edit="${esc(u.id)}" title="Edit">${icon('edit', 13)}</button>` : ''}
              ${can('users') ? `<button class="btn btn--xs btn--ghost" type="button" data-user-pw="${esc(u.id)}" title="Reset Password">${icon('key', 13)} Reset PW</button>` : ''}
              ${can('users') ? `<button class="btn btn--xs btn--ghost" type="button" data-user-toggle="${esc(u.id)}" title="Enable/disable">${icon('shield', 13)}</button>` : ''}
              ${can('users') && u.username.toLowerCase() !== 'admin' ? `<button class="btn btn--xs btn--danger" type="button" data-user-del="${esc(u.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
            </div></td>
          </tr>`).join('')}</tbody>
      </table></div>
    </div>
    <div class="card glass panel" style="margin-top:18px">
      <div class="panel__head"><h3>${icon('shield', 17)} Permission matrix</h3><span class="badge badge--cyan">Real-time · changes apply immediately</span></div>
      <div class="table-wrap"><table class="data perm-table">
        <thead><tr><th>Permission</th>${ROLES.map((r) => `<th>${esc(r)}</th>`).join('')}</tr></thead>
        <tbody>
          ${Object.keys(PERMS['Super Admin']).map((perm) => `
            <tr>
              <td><b style="font-size:.84rem;text-transform:capitalize">${esc(perm)}</b></td>
              ${ROLES.map((r) => `<td><label class="switch"><input type="checkbox" data-perm="${esc(perm)}" data-role="${esc(r)}" ${PERMS[r][perm] ? 'checked' : ''} ${can('users') ? '' : 'disabled'} aria-label="${esc(r)} ${esc(perm)}"><span class="switch__track"></span></label></td>`).join('')}
            </tr>`).join('')}
        </tbody>
      </table></div>
      <div class="table-wrap" style="margin-top:16px;border:0"><table class="data perm-table">
        <thead><tr><th>Panel access</th>${ROLES.map((r) => `<th>${esc(r)}</th>`).join('')}</tr></thead>
        <tbody>${Object.keys(PANEL_ROLES).map((p) => `
          <tr><td><b style="font-size:.84rem">${esc((PANEL_TITLES[p] || [p])[0])}</b></td>
          ${ROLES.map((r) => `<td><span class="badge ${PANEL_ROLES[p].includes(r) ? 'badge--ok' : 'badge--muted'}">${PANEL_ROLES[p].includes(r) ? 'Yes' : 'No'}</span></td>`).join('')}</tr>`).join('')}
        </tbody>
      </table></div>
      <p style="font-size:.78rem;color:var(--text-3);margin-top:12px">${icon('alert', 13)} Role defaults are enforced on every render. Toggling a permission updates the live matrix for this session and is recorded in the audit trail.</p>
    </div>`;
  const ex = byId('usersExport');
  if (ex) ex.addEventListener('click', () => exportTable(DB.users.map((u) => ({ Username: u.username, Name: u.name, Role: u.role, Email: u.email || '', Active: u.active !== false ? 'Yes' : 'No', Created: u.created })), ['Username', 'Name', 'Role', 'Email', 'Active', 'Created'], `users-${todayISO()}.xlsx`, 'Users'));
  $$('[data-perm]').forEach((c) => c.addEventListener('change', () => {
    if (!can('users')) return;
    const role = c.dataset.role, perm = c.dataset.perm;
    PERMS[role][perm] = c.checked ? 1 : 0;
    logActivity(`Permission “${perm}” for ${role} set to ${c.checked ? 'allowed' : 'denied'}`, 'security');
    saveDB('silent');
    toast('ok', 'Permission updated', `${role} · ${perm} → ${c.checked ? 'allowed' : 'denied'}`);
    renderDashPanel('users');
  }));
}
function userForm(id) {
  if (!can('users')) return toast('danger', 'Access denied', 'Only Super Admin and Admin can manage users.');
  const u = id ? DB.users.find((x) => x.id === id) : null;
  const v = u || { username: '', password: '', name: '', role: 'Staff', email: '', active: true };
  openEntityForm({
    title: u ? 'Edit user' : 'Add user',
    fields: [
      fText('username', 'Username *', v.username, { ph: 'e.g. jdoe' }),
      fText('name', 'Full name *', v.name, { ph: 'e.g. John Doe' }),
      fText('password', u ? 'New password (leave blank to keep)' : 'Password *', '', { type: 'password', ph: 'Minimum 6 characters' }),
      fSelect('role', 'Role', v.role, ROLES),
      fText('email', 'Email', v.email || '', { full: true, type: 'email' }),
      fCheck('active', 'Account active', v.active !== false)
    ],
    values: v, saveLabel: u ? 'Update user' : 'Create user',
    onSubmit: (d) => {
      if (!d.username) return 'Username is required.';
      if (!d.name) return 'Full name is required.';
      const dup = DB.users.find((x) => x.username.toLowerCase() === d.username.toLowerCase() && x.id !== (u && u.id));
      if (dup) return `Username “${d.username}” already exists.`;
      if (!u && (!d.password || d.password.length < 6)) return 'Password must be at least 6 characters.';
      if (d.password && d.password.length < 6) return 'Password must be at least 6 characters.';
      if (u) {
        u.username = d.username; u.name = d.name; u.role = d.role; u.email = d.email; u.active = d.active;
        if (d.password) u.password = d.password;
        logActivity(`Updated user ${u.username}`, 'security');
        toast('ok', 'User updated', u.username);
      } else {
        DB.users.push({ id: uid('u'), username: d.username, name: d.name, role: d.role, email: d.email, active: d.active, password: d.password, created: nowISO() });
        logActivity(`Created user ${d.username} with role ${d.role}`, 'security');
        notify('User created', `${d.username} — ${d.role}`, 'ok', 'users');
        toast('ok', 'User created', d.username);
      }
      saveDB(); renderDashCounts(); renderDashPanel('users');
      return null;
    }
  });
}

/* ---------------- Enquiries panel ---------------- */
function panelContact(host) {
  const msgs = DB.messages.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  host.innerHTML = `
    <div class="grid g-4" style="margin-bottom:18px">
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon">${icon('mail', 20)}</div></div>
        <div class="kpi__value">${msgs.length}</div><div class="kpi__label">Total enquiries</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--warn">${icon('alert', 20)}</div></div>
        <div class="kpi__value">${msgs.filter((m) => !m.read).length}</div><div class="kpi__label">Unread</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--ok">${icon('check', 20)}</div></div>
        <div class="kpi__value">${msgs.filter((m) => m.read).length}</div><div class="kpi__label">Reviewed</div></div>
      <div class="card glass kpi"><div class="kpi__top"><div class="kpi__icon kpi__icon--info">${icon('clock', 20)}</div></div>
        <div class="kpi__value">${msgs[0] ? relTime(msgs[0].date) : '—'}</div><div class="kpi__label">Latest enquiry</div></div>
    </div>
    <div class="card glass panel">
      <div class="panel__head"><h3>${icon('mail', 17)} Contact form submissions</h3>
        <div class="toolbar__group">
          <button class="btn btn--ghost btn--sm" type="button" id="msgExport">${icon('download', 14)} Export</button>
          ${can('delete') ? `<button class="btn btn--danger btn--sm" type="button" id="msgClear">${icon('trash', 14)} Clear read</button>` : ''}
        </div>
      </div>
      <div class="stack" style="gap:11px">
        ${msgs.length ? msgs.map((m) => `
          <div class="glass card ${m.read ? '' : 'card--glow'}" style="padding:15px;border-color:${m.read ? 'var(--border)' : 'rgba(6,182,212,.4)'}">
            <div class="row row--between" style="gap:10px;align-items:flex-start">
              <div style="min-width:0;flex:1">
                <div class="row" style="gap:8px;margin-bottom:5px">
                  ${!m.read ? '<span class="badge badge--cyan">New</span>' : ''}
                  <b style="font-size:.9rem">${esc(m.name)}</b>
                  ${m.company ? `<span class="tag">${esc(m.company)}</span>` : ''}
                </div>
                <div style="font-size:.78rem;color:var(--text-3);margin-bottom:7px">
                  <a href="mailto:${esc(m.email)}" style="color:var(--cyan)">${esc(m.email)}</a> · ${relTime(m.date)}
                </div>
                ${m.subject ? `<div style="font-size:.85rem;font-weight:700;margin-bottom:4px">${esc(m.subject)}</div>` : ''}
                <p style="font-size:.85rem">${esc(m.message)}</p>
              </div>
              <div class="cell-actions" style="flex:none">
                <button class="btn btn--xs btn--ghost" type="button" data-msg-read="${esc(m.id)}" title="Mark read/unread">${icon('check', 13)}</button>
                <a class="btn btn--xs btn--primary" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your enquiry'))}" title="Reply">${icon('mail', 13)}</a>
                ${can('delete') ? `<button class="btn btn--xs btn--danger" type="button" data-msg-del="${esc(m.id)}" title="Delete">${icon('trash', 13)}</button>` : ''}
              </div>
            </div>
          </div>`).join('') : `<div class="table-empty">${icon('mail', 36)}<p>No enquiries received yet. Submissions from the portfolio contact form appear here.</p></div>`}
      </div>
    </div>`;
  const ex = byId('msgExport');
  if (ex) ex.addEventListener('click', () => exportTable(msgs.map((m) => ({ Name: m.name, Email: m.email, Company: m.company || '', Subject: m.subject || '', Message: m.message, Received: m.date, Read: m.read ? 'Yes' : 'No' })), ['Name', 'Email', 'Company', 'Subject', 'Message', 'Received', 'Read'], `enquiries-${todayISO()}.xlsx`, 'Enquiries'));
  const cl = byId('msgClear');
  if (cl) cl.addEventListener('click', () => confirmDialog('Remove all reviewed enquiries?', () => {
    DB.messages = DB.messages.filter((m) => !m.read);
    saveDB(); logActivity('Cleared reviewed enquiries'); toast('ok', 'Enquiries cleared'); renderDashCounts(); renderDashPanel('contact');
  }));
}

/* ---------------- Activity panel ---------------- */
function panelActivity(host) {
  const kinds = Array.from(new Set(DB.activity.map((a) => a.kind || 'action')));
  host.innerHTML = `
    <div class="card glass panel">
      <div class="panel__head">
        <h3>${icon('clock', 17)} Activity &amp; audit trail <span class="badge badge--muted">${DB.activity.length}</span></h3>
        <div class="toolbar__group">
          <select class="select" id="actFilter" style="min-width:160px" aria-label="Filter activity">
            <option value="">All activity</option>
            ${kinds.map((k) => `<option value="${esc(k)}">${esc(titleCase(k))}</option>`).join('')}
          </select>
          <button class="btn btn--ghost btn--sm" type="button" id="actExport">${icon('download', 14)} Export</button>
          ${can('delete') ? `<button class="btn btn--danger btn--sm" type="button" id="actClear">${icon('trash', 14)} Clear log</button>` : ''}
        </div>
      </div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>When</th><th>User</th><th>Type</th><th>Action</th></tr></thead>
        <tbody id="actBody">${DB.activity.map((a) => `
          <tr data-kind="${esc(a.kind || 'action')}">
            <td style="white-space:nowrap;font-size:.8rem">${dShort(a.ts)} ${new Date(a.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
            <td><span class="badge badge--muted">${esc(a.user || 'System')}</span></td>
            <td><span class="badge ${a.kind === 'security' ? 'badge--danger' : a.kind === 'auth' ? 'badge--info' : 'badge--muted'}">${esc(titleCase(a.kind || 'action'))}</span></td>
            <td style="font-size:.84rem">${esc(a.msg)}</td>
          </tr>`).join('') || tableEmptyRow(4, 'No activity recorded.')}</tbody>
      </table></div>
    </div>`;
  const f = byId('actFilter');
  if (f) f.addEventListener('change', () => {
    const v = f.value;
    $$('#actBody tr').forEach((tr) => tr.classList.toggle('hide', !!v && tr.dataset.kind !== v));
  });
  const ex = byId('actExport');
  if (ex) ex.addEventListener('click', () => exportTable(DB.activity.map((a) => ({ Timestamp: a.ts, User: a.user || 'System', Type: a.kind || 'action', Action: a.msg })), ['Timestamp', 'User', 'Type', 'Action'], `audit-trail-${todayISO()}.xlsx`, 'Audit'));
  const cl = byId('actClear');
  if (cl) cl.addEventListener('click', () => confirmDialog('Clear the entire audit trail? This cannot be undone.', () => {
    DB.activity = [{ id: uid('a'), msg: 'Audit trail cleared by ' + currentUserName(), user: currentUserName(), ts: nowISO(), kind: 'security' }];
    saveDB(); toast('ok', 'Audit trail cleared'); renderDashPanel('activity');
  }));
}

/* ---------------- Settings panel ---------------- */
function panelSettings(host) {
  const backups = listBackups();
  const size = (JSON.stringify(DB).length / 1024).toFixed(1);
  host.innerHTML = `
    <div class="grid g-2" style="align-items:start">
      <div class="card glass panel">
        <div class="panel__head"><h3>${icon('gear', 17)} Appearance &amp; locale</h3></div>
        <div class="form-grid">
          <div class="field"><label>Theme</label>
            <div class="row" style="gap:8px">
              <button class="chip${DB.settings.theme === 'dark' ? ' is-active' : ''}" type="button" data-set-theme="dark">${icon('moon', 13)} Dark</button>
              <button class="chip${DB.settings.theme === 'light' ? ' is-active' : ''}" type="button" data-set-theme="light">${icon('sun', 13)} Light</button>
            </div>
          </div>
          <div class="field"><label>Language</label>
            <div class="row" style="gap:8px">
              <button class="chip${DB.settings.lang === 'en' ? ' is-active' : ''}" type="button" data-set-lang="en">English</button>
              <button class="chip${DB.settings.lang === 'ne' ? ' is-active' : ''}" type="button" data-set-lang="ne">नेपाली</button>
            </div>
          </div>
          <div class="field"><label for="setCurrency">Currency label</label>
            <input class="input" id="setCurrency" value="${esc(DB.settings.currency)}" maxlength="5">
          </div>
          <div class="field"><label for="setOrg">Organisation / brand</label>
            <input class="input" id="setOrg" value="${esc(DB.settings.org || '')}">
          </div>
          <div class="field"><label>Animations</label>
            <label class="row" style="gap:9px;cursor:pointer;padding-top:6px">
              <span class="switch"><input type="checkbox" id="setAnim" ${DB.settings && DB.settings.animations === true ? 'checked' : ''}><span class="switch__track"></span></span>
              <span style="font-size:.84rem;color:var(--text-2)">Enable motion effects</span>
            </label>
          </div>
          <div class="field"><label>Auto backup</label>
            <label class="row" style="gap:9px;cursor:pointer;padding-top:6px">
              <span class="switch"><input type="checkbox" id="setAuto" ${DB.settings.autoBackup !== false ? 'checked' : ''}><span class="switch__track"></span></span>
              <span style="font-size:.84rem;color:var(--text-2)">Snapshot every 15 minutes</span>
            </label>
          </div>
        </div>
        <div class="row" style="margin-top:16px;gap:9px">
          <button class="btn btn--primary btn--sm" type="button" id="setSave">${icon('save', 14)} Save settings</button>
          <button class="btn btn--ghost btn--sm" type="button" id="setResetAll">${icon('refresh', 14)} Reset demo data</button>
        </div>
      </div>

      <div class="card glass panel">
        <div class="panel__head"><h3>${icon('key', 17)} Security</h3><span class="badge badge--muted">${esc(currentUserName())}</span></div>
        <div class="form-grid">
          <div class="field form-grid--full"><label for="pwCurrent">Current password</label><input class="input" id="pwCurrent" type="password" autocomplete="current-password"></div>
          <div class="field"><label for="pwNew">New password</label><input class="input" id="pwNew" type="password" autocomplete="new-password"></div>
          <div class="field"><label for="pwConfirm">Confirm new password</label><input class="input" id="pwConfirm" type="password" autocomplete="new-password"></div>
        </div>
        <button class="btn btn--primary btn--sm" type="button" id="pwSave" style="margin-top:14px">${icon('shield', 14)} Change password</button>
        <hr class="hairline" style="margin:18px 0">
        <div class="stack" style="gap:8px">
          <div class="row row--between"><span style="font-size:.84rem;color:var(--text-2)">Signed in as</span><b style="font-size:.84rem">${esc(currentUserName())} · ${esc(currentRole())}</b></div>
          <div class="row row--between"><span style="font-size:.84rem;color:var(--text-2)">Last login</span><b style="font-size:.84rem">${DB.auth.lastLogin ? dLong(DB.auth.lastLogin) : '—'}</b></div>
          <div class="row row--between"><span style="font-size:.84rem;color:var(--text-2)">Session persistence</span><b style="font-size:.84rem">${DB.auth.session && DB.auth.session.remember ? 'Remembered' : 'This session'}</b></div>
          <div class="row row--between"><span style="font-size:.84rem;color:var(--text-2)">Data footprint</span><b style="font-size:.84rem">${size} KB</b></div>
        </div>
        <button class="btn btn--danger btn--sm btn--block" type="button" id="pwLogout" style="margin-top:14px">${icon('logout', 14)} Sign out of this device</button>
      </div>
    </div>

    <div class="grid g-2" style="align-items:start;margin-top:18px">
      <div class="card glass panel">
        <div class="panel__head"><h3>${icon('db', 17)} Backup &amp; restore</h3><span class="badge badge--cyan">${esc(APP.version)}</span></div>
        <div class="row" style="gap:9px;flex-wrap:wrap">
          <button class="btn btn--primary btn--sm" type="button" id="bkNow">${icon('save', 14)} Create snapshot</button>
          <button class="btn btn--ghost btn--sm" type="button" id="bkExport">${icon('download', 14)} Export JSON</button>
          <button class="btn btn--ghost btn--sm" type="button" id="bkImport">${icon('upload', 14)} Import JSON</button>
        </div>
        <hr class="hairline" style="margin:16px 0">
        <div class="stack" style="gap:9px">
          ${backups.length ? backups.map((b) => `
            <div class="row row--between" style="gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:11px">
              <span style="min-width:0">
                <b style="font-size:.83rem;display:block">${new Date(b.ts).toLocaleString('en-GB')}</b>
                <span style="font-size:.72rem;color:var(--text-3)">v${esc(b.version || '—')} · ${(b.size / 1024).toFixed(1)} KB</span>
              </span>
              <span class="row" style="gap:6px;flex:none">
                <button class="btn btn--xs btn--ghost" type="button" data-bk-restore="${esc(b.id)}">${icon('refresh', 12)} Restore</button>
                <button class="btn btn--xs btn--danger" type="button" data-bk-del="${esc(b.id)}">${icon('trash', 12)}</button>
              </span>
            </div>`).join('') : '<p style="font-size:.84rem;color:var(--text-3)">No snapshots yet — create your first backup.</p>'}
        </div>
        <div class="field" style="margin-top:16px">
          <label for="bkLimit">Snapshots retained</label>
          <input class="input" id="bkLimit" type="number" min="1" max="30" value="${Number(DB.settings.backupLimit) || 8}">
        </div>
      </div>

      <div class="card glass panel">
        <div class="panel__head"><h3>${icon('globe', 17)} Profile &amp; data health</h3></div>
        <div class="table-wrap" style="border:0"><table class="data" style="min-width:0"><tbody>
          ${[['Profile name', DB.profile.name], ['Title', DB.profile.title], ['Email', DB.profile.email], ['Phone', DB.profile.phone],
             ['Record counts', `${DB.projects.length} projects · ${DB.assets.length} assets · ${DB.maintenance.length} work orders`],
             ['Content', `${DB.blog.length} articles · ${DB.testimonials.length} testimonials · ${DB.certifications.length} certificates`],
             ['Storage key', APP.key],
             ['Build', APP.build]]
            .map(([k, v]) => `<tr><td style="font-size:.82rem;color:var(--text-3)">${esc(k)}</td><td style="text-align:right;font-size:.82rem;font-weight:700">${esc(v)}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="row" style="gap:9px;margin-top:16px;flex-wrap:wrap">
          <button class="btn btn--ghost btn--sm" type="button" id="dataValidate">${icon('shield', 14)} Validate data</button>
          <button class="btn btn--ghost btn--sm" type="button" id="dataPhoto">${icon('image', 14)} Update portrait</button>
        </div>
        <p style="font-size:.76rem;color:var(--text-3);margin-top:12px">Everything is stored in this browser's localStorage. Export a JSON backup regularly, or before clearing browser data.</p>
      </div>
    </div>`;

  $$('[data-set-theme]').forEach((b) => b.addEventListener('click', () => { DB.settings.theme = b.dataset.setTheme; applyTheme(DB.settings.theme); saveDB('silent'); renderDashPanel('settings'); }));
  $$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.setLang); renderDashPanel('settings'); }));
  byId('setSave').addEventListener('click', () => {
    DB.settings.currency = byId('setCurrency').value.trim().toUpperCase().slice(0, 5) || 'AED';
    DB.settings.org = byId('setOrg').value.trim();
    DB.settings.animations = byId('setAnim').checked;
    DB.settings.autoBackup = byId('setAuto').checked;
    saveDB(); logActivity('Updated platform settings', 'settings'); toast('ok', 'Settings saved');
    renderPublicSite(); renderDashPanel('settings');
  });
  byId('setResetAll').addEventListener('click', () => confirmDialog('Reset ALL data back to the seeded CV dataset? Your current data will be replaced (a snapshot is taken first).', () => {
    makeBackup(true);
    DB = seedDB(); seedContent(DB); populateDerived(DB);
    DB.auth.session = { user: currentUserName(), role: currentRole(), remember: true };
    saveDB('silent'); logActivity('Reset all data to seed dataset', 'settings');
    toast('ok', 'Data reset', 'Seeded CV dataset restored.');
    applyTheme(DB.settings.theme); applyI18n(); renderPublicSite(); renderDashCounts(); showDash('overview');
  updateAuthUI();
  }));
  byId('pwSave').addEventListener('click', changePassword);
  byId('pwLogout').addEventListener('click', logout);
  byId('bkNow').addEventListener('click', () => { makeBackup(); renderDashPanel('settings'); });
  byId('bkExport').addEventListener('click', exportJSON);
  byId('bkImport').addEventListener('click', () => pickJsonFile((text, name) => importJSON(text, name)));
  byId('bkLimit').addEventListener('change', (e) => { DB.settings.backupLimit = clamp(Number(e.target.value) || 8, 1, 30); saveDB('silent'); toast('ok', 'Retention updated', `${DB.settings.backupLimit} snapshots retained.`); renderDashPanel('settings'); });
  $$('[data-bk-restore]').forEach((b) => b.addEventListener('click', () => confirmDialog('Restore this snapshot? Current data will be replaced.', () => {
    if (restoreBackup(b.dataset.bkRestore)) { logActivity('Restored a backup snapshot', 'settings'); toast('ok', 'Snapshot restored'); applyTheme(DB.settings.theme); applyI18n(); renderPublicSite(); renderDashCounts(); renderDashPanel('settings'); }
    else toast('danger', 'Restore failed', 'Snapshot not found.');
  })));
  $$('[data-bk-del]').forEach((b) => b.addEventListener('click', () => {
    const snaps = listBackups().filter((s) => s.id !== b.dataset.bkDel);
    localStorage.setItem(APP.backupKey, JSON.stringify(snaps));
    toast('ok', 'Snapshot deleted'); renderDashPanel('settings');
  }));
  byId('dataValidate').addEventListener('click', () => {
    const problems = validateData();
    if (problems.length) {
      openModal({ title: 'Data validation', body: el('div', { class: 'stack', style: 'gap:9px' }, problems.map((p) => el('div', { class: 'notif is-unread' }, [el('span', { class: 'notif__dot' }), el('div', {}, [el('div', { class: 'notif__t', text: p })] )]))) , footer: el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: 'Close', onclick: closeModal }), wide: true });
    } else toast('ok', 'Data healthy', 'No integrity problems found.');
  });
  byId('dataPhoto').addEventListener('click', () => pickImages((files) => {
    if (!files.length) return;
    DB.profile.photo = files[0].data;
    DB.profile.avatar = files[0].data;
    $$('.hero-panel__img').forEach((img) => { img.src = files[0].data; });
    saveDB(); logActivity('Updated profile portrait'); toast('ok', 'Portrait updated', 'New photo applied to the portfolio.');
    renderDashPanel('settings');
  }, false));
}
function validateData() {
  const problems = [];
  const tags = {};
  DB.assets.forEach((a) => { if (tags[a.tag]) problems.push(`Duplicate asset tag: ${a.tag}`); tags[a.tag] = 1; if (!a.location) problems.push(`Asset ${a.tag} has no location.`); });
  DB.projects.forEach((p) => {
    if (p.end && p.start && new Date(p.end) < new Date(p.start)) problems.push(`Project “${p.name}” ends before it starts.`);
    if ((p.spent || 0) > (p.budget || 0) * 1.15) problems.push(`Project “${p.name}” is over budget by more than 15%.`);
  });
  DB.maintenance.forEach((w) => { if (w.assetId && !DB.assets.find((a) => a.id === w.assetId)) problems.push(`Work order ${w.id} links to a missing asset.`); });
  const unames = {};
  DB.users.forEach((u) => { const k = u.username.toLowerCase(); if (unames[k]) problems.push(`Duplicate username: ${u.username}`); unames[k] = 1; if (!PERMS[u.role]) problems.push(`User ${u.username} has an unknown role: ${u.role}`); });
  return problems;
}
function changePassword() {
  const user = currentUser();
  if (!user) return;
  const cur = byId('pwCurrent').value, nw = byId('pwNew').value, cf = byId('pwConfirm').value;
  if (cur !== user.password) return toast('danger', 'Incorrect password', 'The current password does not match.');
  if (nw.length < 6) return toast('warn', 'Too short', 'Use at least 6 characters with a mix of letters, numbers and symbols.');
  if (nw !== cf) return toast('warn', 'Mismatch', 'New password and confirmation do not match.');
  user.password = nw;
  saveDB(); logActivity('Changed account password', 'security');
  toast('ok', 'Password changed', 'Use the new password at your next sign-in.');
  byId('pwCurrent').value = ''; byId('pwNew').value = ''; byId('pwConfirm').value = '';
}

/* ---------------- Notifications drawer ---------------- */
function renderNotifications() {
  const host = byId('drawerBody');
  if (!host) return;
  const list = DB.notifications.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  host.innerHTML = list.length ? list.map((n) => `
    <button class="notif ${n.read ? '' : 'is-unread'}" type="button" data-notif="${esc(n.id)}" style="width:100%;text-align:left">
      <span class="notif__dot" style="background:${n.type === 'danger' ? 'var(--danger)' : n.type === 'warn' ? 'var(--warn)' : n.type === 'ok' ? 'var(--ok)' : 'var(--cyan)'}"></span>
      <span style="min-width:0;flex:1">
        <span class="notif__t" style="display:block">${esc(n.title)}</span>
        <span class="notif__m" style="display:block">${esc(n.msg)}</span>
        <span class="notif__d" style="display:block">${relTime(n.date)}</span>
      </span>
    </button>`).join('') : `<div class="table-empty">${icon('bell', 34)}<p>No notifications.</p></div>`;
  renderNotifBadge();
}

/* ---------------- Auth ---------------- */
function attemptLogin(username, password, remember) {
  const user = DB.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase().trim());
  if (!user) return 'No account found with that username.';
  if (user.active === false) return 'This account has been disabled. Contact an administrator.';
  if (user.password !== password) return 'Incorrect password. Please try again.';
  DB.auth.session = { user: user.username, role: user.role, remember: !!remember, since: nowISO() };
  DB.auth.lastLogin = nowISO();
  try {
    if (remember) localStorage.setItem(APP.sessionKey, JSON.stringify(DB.auth.session));
    else { localStorage.removeItem(APP.sessionKey); sessionStorage.setItem(APP.sessionKey, JSON.stringify(DB.auth.session)); }
  } catch (_) {}
  logActivity(`${user.username} signed in`, 'auth', user.username);
  saveDB('silent');
  return null;
}
function logout() {
  logActivity(`${currentUserName()} signed out`, 'auth');
  DB.auth.session = null;
  try { localStorage.removeItem(APP.sessionKey); sessionStorage.removeItem(APP.sessionKey); } catch (_) {}
  saveDB('silent');
  showView('public');
  toast('ok', 'Signed out', 'Your session has ended.');
  updateAuthUI();
  renderNotifBadge();
}
function restoreSession() {
  /* The database session is the source of truth: it is written on every login
     and cleared on logout. The separate session key exists only as a fallback
     for the case where the stored database lost its session field. Without this
     precedence a stale key could silently outvote the current database session. */
  const adopt = (s) => {
    if (!s || !s.user) return false;
    const user = DB.users.find((u) => u.username.toLowerCase() === String(s.user).toLowerCase());
    if (!user || user.active === false) return false;
    DB.auth.session = { user: user.username, role: user.role, remember: !!s.remember, since: s.since || nowISO() };
    return true;
  };
  if (DB.auth.session && adopt(DB.auth.session)) return;
  try {
    const raw = localStorage.getItem(APP.sessionKey) || sessionStorage.getItem(APP.sessionKey);
    if (!raw) { DB.auth.session = null; return; }
    const s = JSON.parse(raw);
    if (!adopt(s)) {
      DB.auth.session = null;
      try { localStorage.removeItem(APP.sessionKey); sessionStorage.removeItem(APP.sessionKey); } catch (_) {}
    }
  } catch (_) { DB.auth.session = null; }
}

/* ---------------- View switching ---------------- */
function showView(name) {
  const map = { public: 'view-public', dashboard: 'view-dashboard', login: 'view-login' };
  if (!map[name]) name = 'public';
  UI.view = name;
  Object.entries(map).forEach(([k, id]) => byId(id).classList.toggle('is-active', k === name));
  document.body.classList.toggle('no-scroll', false);
  if (name === 'public') {
    byId('nav').classList.remove('hide');
    byId('navLinks').classList.remove('is-open');
    initReveal(); initParticles(); initCounters();
  } else if (name === 'dashboard') {
    byId('nav').classList.remove('hide');
    renderDashCounts();
  } else {
    byId('nav').classList.add('hide');
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}
function renderPublicSite() {
  renderMarquee(); renderHeroStats(); renderAbout(); renderExperience(); renderSkills();
  renderProjects(); renderAssets(); renderMaintenance(); renderCredentials(); renderBlog();
  renderTestimonials(); renderContact();
  applyI18n();
  requestAnimationFrame(() => { $$('[data-fill]').forEach((f) => { f.style.width = f.dataset.fill + '%'; }); });
  initReveal(); initCounters();
}

/* ==========================================================================
   Role-Based UI Control & Left Menu Access Guard
   Rule: Left side menu CMS tools display ONLY when logged in with admin or superadmin
   ========================================================================== */
function updateAuthUI() {
  const isAuth = !!(DB && DB.auth && DB.auth.session);
  const role = isAuth ? (DB.auth.session.role || 'Viewer') : '';
  const isAdmin = isAuth && (role === 'Super Admin' || role === 'Admin');

  // 1. Left Menu Toggle Button in Header (Always visible and accessible)
  const lmBtn = byId('leftMenuBtn');
  const lmBtnText = byId('leftMenuBtnText');
  if (lmBtn) {
    lmBtn.style.display = 'inline-flex';
    lmBtn.classList.remove('hide');
    if (lmBtnText) lmBtnText.textContent = isAdmin ? 'CMS Menu' : 'Menu';
    lmBtn.setAttribute('title', isAdmin ? `CMS Left Menu (${role})` : 'Navigation Menu');
  }

  // 2. Left Menu: CMS & Operations group visible ONLY when admin or superadmin
  const cmsGroup = byId('lmCmsGroup');
  if (cmsGroup) cmsGroup.style.display = isAdmin ? 'flex' : 'none';

  // Guest group: shown when not logged in as admin
  const guestGroup = byId('lmGuestGroup');
  if (guestGroup) guestGroup.style.display = isAdmin ? 'none' : 'flex';

  const adminSessionGroup = byId('lmAdminSession');
  if (adminSessionGroup) {
    adminSessionGroup.style.display = isAdmin ? 'block' : 'none';
  }

  // 3. Open App / Login button in header
  const openAppBtn = byId('openAppBtn');
  if (openAppBtn) {
    const textSpan = openAppBtn.querySelector('[data-i18n]') || openAppBtn.querySelector('span');
    if (isAuth) {
      openAppBtn.classList.remove('btn--ghost');
      openAppBtn.classList.add('btn--primary');
      if (textSpan) textSpan.textContent = isAdmin ? 'CMS & Dashboard' : 'Dashboard';
      openAppBtn.setAttribute('title', `Signed in as ${currentUserName()} (${role})`);
    } else {
      openAppBtn.classList.remove('btn--primary');
      openAppBtn.classList.add('btn--ghost');
      if (textSpan) textSpan.textContent = 'Admin Login';
      openAppBtn.setAttribute('title', 'Sign in as Super Admin / Admin');
    }
  }

  // 4. User display in Left Menu
  $$('.left-menu__name').forEach((el) => {
    el.textContent = isAuth ? (currentUser() ? currentUser().name : DB.auth.session.user) : (DB.profile ? DB.profile.name : 'Arjun Singh');
  });
  $$('.left-menu__role').forEach((el) => {
    el.textContent = isAuth ? `${role} · CMS Access` : 'Facilities Manager · UAE';
  });
}

/* Left Menu Drawer Controls (Open menu drawer smoothly) */
const openLeftMenu = () => {
  const lm = byId('leftMenu');
  const sc = byId('leftMenuScrim');
  if (lm) lm.classList.add('is-open');
  if (sc) sc.classList.add('is-open');
  document.body.classList.add('no-scroll');
};

const closeLeftMenu = () => {
  const lm = byId('leftMenu');
  const sc = byId('leftMenuScrim');
  if (lm) lm.classList.remove('is-open');
  if (sc) sc.classList.remove('is-open');
  if (!$('.overlay.is-open')) document.body.classList.remove('no-scroll');
};

/* ---------------- Global event delegation ---------------- */
function bindGlobalEvents() {
  document.addEventListener('click', (e) => {
    const t0 = e.target;
    const hit = (attr) => (t0.closest ? t0.closest(`[${attr}]`) : null);

    /* theme / nav */
    const themeBtn = t0.closest('#themeBtn'); if (themeBtn) return toggleTheme();
    const langBtn = t0.closest('#langBtn'); if (langBtn) return setLang(DB.settings.lang === 'en' ? 'ne' : 'en');
    const navT = t0.closest('#navToggle');
    if (navT) { openLeftMenu(); return; }
    const lmBtnClick = t0.closest('#leftMenuBtn');
    if (lmBtnClick) { openLeftMenu(); return; }

    const navLink = t0.closest('.nav__link') || t0.closest('.left-menu__link');
    if (navLink) {
      closeLeftMenu();
      const nl = byId('navLinks');
      if (nl) nl.classList.remove('is-open');
      if (UI.view !== 'public') showView('public');
      const href = navLink.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const top = target.getBoundingClientRect().top + window.pageYOffset - navOffset(12);
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
      return;
    }
    const notifBtn = t0.closest('#notifBtn');
    if (notifBtn) { renderNotifications(); openDrawer('Notifications'); return; }
    const notifEl = hit('data-notif');
    if (notifEl) {
      const n = DB.notifications.find((x) => x.id === notifEl.dataset.notif);
      if (n) { n.read = true; saveDB('silent'); if (n.panel && canPanel(n.panel)) { closeDrawer(); showDash(n.panel); } renderNotifications(); }
      return;
    }
    if (t0.closest('#notifMarkAll')) { DB.notifications.forEach((n) => { n.read = true; }); saveDB('silent'); renderNotifications(); toast('ok', 'All marked read'); return; }
    if (t0.closest('#notifClear')) { DB.notifications = []; saveDB('silent'); renderNotifications(); toast('ok', 'Notifications cleared'); return; }

    /* app entry */
    const openApp = t0.closest('#openAppBtn');
    if (openApp) { if (DB.auth.session) showDash(UI.dashPanel || 'overview'); else showView('login'); return; }
    const openAppAttr = hit('data-open-app');
    if (openAppAttr) { e.preventDefault(); if (DB.auth.session) showDash(openAppAttr.dataset.openApp); else showView('login'); return; }
    if (t0.closest('#backToSiteBtn')) return showView('public');
    if (t0.closest('#loginBack')) return showView('public');
    if (t0.closest('#logoutBtn')) return confirmDialog('Sign out of the management console?', logout, { yes: 'Sign out' });
    if (t0.closest('#sideToggle')) { byId('sidebar').classList.toggle('is-open'); byId('sideScrim').classList.toggle('is-open'); return; }
    if (t0.closest('#sideScrim')) { byId('sidebar').classList.remove('is-open'); byId('sideScrim').classList.remove('is-open'); return; }
    if (t0.closest('#dashSearchBtn')) return openCmdk();
    if (t0.closest('#navSearchBtn')) return openSearch('');
    if (t0.closest('#heroSearchBtn')) { e.stopPropagation(); const v = (byId('heroSearchInput') || {}).value || ''; UI.heroSearch = v; return openSearch(v); }
    if (t0.closest('#searchClose')) return closeSearch();
    const sf = hit('data-search-filter');
    if (sf) { searchFilter = sf.dataset.searchFilter; renderSearchResults(); return; }
    const sh = hit('data-search-hit');
    if (sh) return openSearchHit(Number(sh.dataset.searchHit));
    if (t0.id === 'searchOverlay') return closeSearch();
    if (t0.closest('#dashPrintBtn')) return window.print();
    if (t0.closest('#togglePass')) { const p = byId('loginPass'); p.type = p.type === 'password' ? 'text' : 'password'; return; }
    if (t0.closest('#fillDemo')) {
      byId('loginUser').value = 'Admin'; byId('loginPass').value = 'Admin@981474594'; return;
    }
    if (t0.closest('#forgotBtn')) return toast('warn', 'Password recovery', 'This local platform stores credentials in your browser. Use the Admin account to reset a password, or restore a backup.');
    const goto = hit('data-goto'); if (goto) return showDash(goto.dataset.goto);
    const quick = hit('data-quick');
    if (quick) {
      const q = quick.dataset.quick;
      if (q === 'project') return projectForm();
      if (q === 'asset') return assetForm();
      if (q === 'wo') return woForm();
      if (q === 'blog') return blogForm();
      if (q === 'backup') { makeBackup(); return renderDashPanel(UI.dashPanel); }
      if (q === 'portfolio-pdf') return portfolioPdf();
      if (q === 'json') return exportJSON();
      return;
    }
    const newBtn = hit('data-new');
    if (newBtn) {
      const k = newBtn.dataset.new;
      if (k === 'project') return projectForm();
      if (k === 'asset') return assetForm();
      if (k === 'wo') return woForm();
      if (k === 'blog') return blogForm();
      if (k === 'cert') return certForm();
      if (k === 'user') return userForm();
      if (k === 'skill') return skillForm();
      if (k === 'testimonial') return testiForm();
      if (k === 'education') return eduForm();
      if (k === 'experience') return expForm();
      return;
    }
    const dExp = hit('data-dash-export');
    if (dExp) {
      const k = dExp.dataset.dashExport;
      if (k === 'projects') return exportProjectsXlsx();
      if (k === 'assets') return exportAssetsXlsx();
      if (k === 'maintenance') return exportMaintenanceXlsx();
      if (k === 'kpi') return exportKpiReport();
      if (k === 'certs') return exportTable(DB.certifications.map((c) => ({ Name: c.name, Issuer: c.issuer, Year: c.year, Date: c.date, Status: c.status })), ['Name', 'Issuer', 'Year', 'Date', 'Status'], `certifications-${todayISO()}.xlsx`, 'Certifications');
      return;
    }

    /* public filters */
    const sc = hit('data-skill-cat'); if (sc) { UI.skillFilter = sc.dataset.skillCat; renderSkills(); return; }
    const ps = hit('data-proj-status'); if (ps) { UI.projStatus = ps.dataset.projStatus; renderProjects(); return; }
    const expv = hit('data-exp-view');
    if (expv) {
      UI.expView = expv.dataset.expView;
      $$('[data-exp-view]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.expView === UI.expView)));
      byId('expTimeline').classList.toggle('hide', UI.expView !== 'timeline');
      byId('expTableWrap').classList.toggle('hide', UI.expView !== 'table');
      return;
    }
    const tl = hit('data-tl-toggle');
    if (tl) { const item = tl.closest('.tl-item'); const open = item.classList.toggle('is-open'); tl.setAttribute('aria-expanded', String(open)); return; }
    if (t0.closest('#expandAllExp')) {
      const items = $$('#expTimeline .tl-item');
      const anyClosed = items.some((i) => !i.classList.contains('is-open'));
      items.forEach((i) => i.classList.toggle('is-open', anyClosed));
      $$('[data-tl-toggle]').forEach((b) => b.setAttribute('aria-expanded', String(anyClosed)));
      byId('expandAllExp').textContent = anyClosed ? 'Collapse all' : 'Expand all';
      return;
    }
    if (t0.closest('#downloadExpCsv')) return exportExpCsv();
    if (t0.closest('#heroResume') || t0.closest('#lmResumeBtn')) return showResumePreviewModal();
    if (t0.closest('#addProjectPublic')) return projectForm();
    if (t0.closest('#addAssetBtn')) return assetForm();
    if (t0.closest('#addWoBtn')) return woForm();
    if (t0.closest('#addBlogBtn')) return blogForm();
    if (t0.closest('#addTestiBtn')) return testiForm();
    const wof = hit('data-wo-filter'); if (wof) { UI.woFilter = wof.dataset.woFilter; $$('[data-wo-filter]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.woFilter === UI.woFilter))); renderMaintenance(); return; }
    const testi = hit('data-testi'); if (testi) { slideTesti(Number(testi.dataset.testi)); clearInterval(testiTimer); return; }

    /* CRUD triggers */
    const pv = hit('data-proj-view'); if (pv) return projectDetail(pv.dataset.projView);
    const pe = hit('data-proj-edit'); if (pe) return projectForm(pe.dataset.projEdit);
    const pm = hit('data-proj-milestones'); if (pm) return milestonesEditor(pm.dataset.projMilestones);
    const pd = hit('data-proj-del');
    if (pd) { const p = DB.projects.find((x) => x.id === pd.dataset.projDel); if (p) confirmDialog(`Delete “${p.name}”?`, () => { DB.projects = DB.projects.filter((x) => x.id !== p.id); saveDB(); logActivity(`Deleted project ${p.name}`); toast('ok', 'Project deleted'); renderProjects(); renderDashCounts(); renderDashPanel('projects'); }); return; }
    const av = hit('data-asset-view'); if (av) return assetDetail(av.dataset.assetView);
    const aq = hit('data-asset-qr'); if (aq) return assetQr(aq.dataset.assetQr);
    const ae = hit('data-asset-edit'); if (ae) return assetForm(ae.dataset.assetEdit);
    const ad = hit('data-asset-del');
    if (ad) { const a = DB.assets.find((x) => x.id === ad.dataset.assetDel); if (a) confirmDialog(`Delete asset “${a.name}” (${a.tag})?`, () => { DB.assets = DB.assets.filter((x) => x.id !== a.id); saveDB(); logActivity(`Deleted asset ${a.tag}`); toast('ok', 'Asset deleted'); renderAssets(); renderDashCounts(); renderDashPanel('assets'); }); return; }
    const wv = hit('data-wo-view'); if (wv) return woDetail(wv.dataset.woView);
    const we = hit('data-wo-edit'); if (we) return woForm(we.dataset.woEdit);
    const wa = hit('data-wo-advance'); if (wa) return advanceWo(wa.dataset.woAdvance);
    const wd = hit('data-wo-del');
    if (wd) { const w = DB.maintenance.find((x) => x.id === wd.dataset.woDel); if (w) confirmDialog(`Delete work order ${w.id}?`, () => { DB.maintenance = DB.maintenance.filter((x) => x.id !== w.id); saveDB(); logActivity(`Deleted work order ${w.id}`); toast('ok', 'Work order deleted'); renderMaintenance(); renderDashCounts(); renderDashPanel('maintenance'); }); return; }
    const br = hit('data-blog-read'); if (br) return blogRead(br.dataset.blogRead);
    const be = hit('data-blog-edit'); if (be) return blogForm(be.dataset.blogEdit);
    const bd = hit('data-blog-del');
    if (bd) { const b = DB.blog.find((x) => x.id === bd.dataset.blogDel); if (b) confirmDialog(`Delete article “${b.title}”?`, () => { DB.blog = DB.blog.filter((x) => x.id !== b.id); saveDB(); logActivity(`Deleted article ${b.title}`); toast('ok', 'Article deleted'); renderBlog(); renderDashPanel('blog'); }); return; }
    const cp = hit('data-cert-pdf'); if (cp) return certPdf(cp.dataset.certPdf);
    const ce = hit('data-cert-edit'); if (ce) return certForm(ce.dataset.certEdit);
    const cd = hit('data-cert-del');
    if (cd) { const c = DB.certifications.find((x) => x.id === cd.dataset.certDel); if (c) confirmDialog(`Delete “${c.name}”?`, () => { DB.certifications = DB.certifications.filter((x) => x.id !== c.id); saveDB(); toast('ok', 'Certification deleted'); renderCredentials(); renderDashPanel('credentials'); }); return; }
    const ee = hit('data-edu-edit'); if (ee) return eduForm(ee.dataset.eduEdit);
    const ed = hit('data-edu-del');
    if (ed) { const x = DB.education.find((y) => y.id === ed.dataset.eduDel); if (x) confirmDialog(`Delete “${x.degree}”?`, () => { DB.education = DB.education.filter((y) => y.id !== x.id); saveDB(); toast('ok', 'Qualification deleted'); renderCredentials(); renderDashPanel('credentials'); }); return; }
    const xe = hit('data-exp-edit'); if (xe) return expForm(Number(xe.dataset.expEdit));
    const se = hit('data-skill-edit'); if (se) return skillForm(se.dataset.skillEdit);
    const sd = hit('data-skill-del');
    if (sd) { const s = DB.skills.find((x) => x.id === sd.dataset.skillDel); if (s) confirmDialog(`Delete skill “${s.name}”?`, () => { DB.skills = DB.skills.filter((x) => x.id !== s.id); saveDB(); populateDerived(DB); toast('ok', 'Skill deleted'); renderSkills(); renderDashPanel('skills'); }); return; }
    const ue = hit('data-user-edit'); if (ue) return userForm(ue.dataset.userEdit);
    const upw = hit('data-user-pw');
    if (upw) return openUserPwResetModal(upw.dataset.userPw);
    const ut = hit('data-user-toggle');
    if (ut) { const u = DB.users.find((x) => x.id === ut.dataset.userToggle); if (u && u.username.toLowerCase() === 'admin' && u.active !== false) return toast('warn', 'Protected account', 'The primary Admin account cannot be disabled.'); if (u) { u.active = u.active === false; saveDB(); logActivity(`${u.active ? 'Enabled' : 'Disabled'} user ${u.username}`, 'security'); toast('ok', `User ${u.active ? 'enabled' : 'disabled'}`, u.username); renderDashPanel('users'); } return; }
    const ud = hit('data-user-del');
    if (ud) { const u = DB.users.find((x) => x.id === ud.dataset.userDel); if (u) confirmDialog(`Delete user “${u.username}”?`, () => { DB.users = DB.users.filter((x) => x.id !== u.id); saveDB(); logActivity(`Deleted user ${u.username}`, 'security'); toast('ok', 'User deleted'); renderDashCounts(); renderDashPanel('users'); }); return; }
    const tt = hit('data-testi-toggle');
    if (tt) { const x = DB.testimonials.find((y) => y.id === tt.dataset.testiToggle); if (x) { x.approved = x.approved === false; saveDB(); toast('ok', x.approved ? 'Testimonial shown' : 'Testimonial hidden'); renderTestimonials(); renderDashPanel('blog'); } return; }
    const td = hit('data-testi-del');
    if (td) { confirmDialog('Delete this testimonial?', () => { DB.testimonials = DB.testimonials.filter((y) => y.id !== td.dataset.testiDel); saveDB(); toast('ok', 'Testimonial deleted'); renderTestimonials(); renderDashPanel('blog'); }); return; }
    const mr = hit('data-msg-read');
    if (mr) { const m = DB.messages.find((x) => x.id === mr.dataset.msgRead); if (m) { m.read = !m.read; saveDB(); renderDashCounts(); renderDashPanel('contact'); } return; }
    const md = hit('data-msg-del');
    if (md) { confirmDialog('Delete this enquiry?', () => { DB.messages = DB.messages.filter((x) => x.id !== md.dataset.msgDel); saveDB(); renderDashCounts(); toast('ok', 'Enquiry deleted'); renderDashPanel('contact'); }); return; }
    const rep = hit('data-report'); if (rep) return;

    /* sidebar */
    const side = hit('data-dash');
    if (side) return showDash(side.dataset.dash);

    /* overlays */
    if (t0.closest('[data-close-modal]')) return closeModal();
    if (t0.closest('[data-close-drawer]')) return closeDrawer();
    if (t0.closest('[data-close-confirm]')) return closeConfirm();
    if (t0.id === 'confirmYes') { const cb = UI.confirmCb; closeConfirm(); if (typeof cb === 'function') cb(); return; }
    if (t0.id === 'confirmNo') return closeConfirm();
    if (t0.id === 'modalOverlay') return closeModal();
    if (t0.id === 'drawerOverlay') return closeDrawer();
    if (t0.id === 'cmdkOverlay') return closeCmdk();
    if (t0.id === 'lightboxOverlay') { byId('lightboxOverlay').classList.remove('is-open'); if (!$('.overlay.is-open')) document.body.classList.remove('no-scroll'); return; }
    const cm = hit('data-close-modal'); if (cm) return closeModal();
  });

  /* ripple effect */
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest && e.target.closest('.btn');
    if (!btn || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = size + 'px';
    span.style.left = (e.clientX - r.left - size / 2) + 'px';
    span.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.append(span);
    setTimeout(() => span.remove(), 680);
  });

  /* filters with live input */
  const bind = (id, ev, fn) => { const n = byId(id); if (n) n.addEventListener(ev, fn); };
  bind('projSearch', 'input', debounce((e) => { UI.projSearch = e.target.value; renderProjects(); }, 220));
  bind('projCatFilter', 'change', (e) => { UI.projCat = e.target.value; renderProjects(); });
  bind('projSort', 'change', (e) => { UI.projSort = e.target.value; renderProjects(); });
  bind('skillSearch', 'input', debounce((e) => { UI.skillSearch = e.target.value; renderSkills(); }, 220));
  bind('assetSearch', 'input', debounce((e) => { UI.assetSearch = e.target.value; renderAssets(); }, 220));
  bind('assetCatFilter', 'change', (e) => { UI.assetCat = e.target.value; renderAssets(); });
  bind('assetStatusFilter', 'change', (e) => { UI.assetStatus = e.target.value; renderAssets(); });
  bind('assetExportXlsx', 'click', () => exportAssetsXlsx());
  bind('blogSearch', 'input', debounce((e) => { UI.blogSearch = e.target.value; renderBlog(); }, 220));
  bind('blogCatFilter', 'change', (e) => { UI.blogCat = e.target.value; renderBlog(); });
  bind('contactForm', 'submit', submitContact);
  bind('loginForm', 'submit', (e) => {
    e.preventDefault();
    const err = byId('loginError');
    const msg = attemptLogin(byId('loginUser').value, byId('loginPass').value, byId('rememberMe').checked);
    if (msg) { err.textContent = msg; err.classList.remove('hide'); byId('loginPass').select(); return; }
    err.classList.add('hide');
    byId('loginForm').reset();
    toast('ok', 'Welcome back', `${currentUserName()} · ${currentRole()}`);
    showDash('overview');
  updateAuthUI();
  });
  bind('dashEditProfileBtn', 'click', openProfileBrandEditor);
  bind('setAnim', 'change', (e) => {
    DB.settings.animations = e.target.checked;
    applyAnimations(e.target.checked);
    saveDB('silent');
    toast('ok', e.target.checked ? 'Animations Enabled' : 'Animations Disabled', 'Setting saved.');
  });
  bind('fabWhatsapp', 'click', () => window.open(DB.profile.social.whatsapp || `https://wa.me/${DB.profile.whatsapp}`, '_blank', 'noopener'));
  bind('fabEmail', 'click', () => { window.location.href = `mailto:${DB.profile.email}?subject=${encodeURIComponent('Facilities Management enquiry')}`; });
  bind('fabTop', 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const cmdkInput = byId('cmdkInput');
  if (cmdkInput) cmdkInput.addEventListener('input', (e) => renderCmdk(e.target.value));

  /* public-site search */
  const sInput = byId('searchInput');
  if (sInput) sInput.addEventListener('input', debounce(() => renderSearchResults(), 130));
  const hInput = byId('heroSearchInput');
  if (hInput) {
    hInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        /* The document-level keydown handler also listens for Enter and would
           otherwise see the just-opened dialog and fire the first result. */
        e.stopPropagation();
        openSearch(hInput.value);
      }
    });
    hInput.addEventListener('focus', () => { if (hInput.value) openSearch(hInput.value); });
  }
  const searchOv = byId('searchOverlay');
  if (searchOv) searchOv.addEventListener('click', (e) => { if (e.target === searchOv) closeSearch(); });

  /* Profile Modal on Click */
  const pCircle = byId('portraitCircleWrap');
  if (pCircle) {
    pCircle.addEventListener('click', () => {
      openModal({
        title: 'Executive Profile — Arjun Singh',
        body: `<div class="stack" style="gap:16px;text-align:center;align-items:center">
          <div style="position:relative;width:150px;height:150px;border-radius:50%;overflow:hidden;border:3px solid var(--cyan);box-shadow:0 0 24px rgba(6,182,212,.4);margin:0 auto">
            <img src="${pCircle.querySelector('img').src}" style="width:100%;height:100%;object-fit:cover" alt="Arjun Singh">
          </div>
          <div>
            <h3 style="font-size:1.35rem;margin-bottom:2px">Arjun Singh</h3>
            <p style="color:var(--cyan);font-weight:700;font-size:.92rem">Facilities Manager · UAE</p>
            <p style="color:var(--text-3);font-size:.8rem">Aldar Property · 13+ Years in Facilities, Property & Asset Management</p>
          </div>
          <div class="grid g-3" style="width:100%;gap:10px">
            <div class="neu" style="padding:10px"><div style="font-size:.65rem;color:var(--text-3);text-transform:uppercase;font-weight:800">Status</div><div style="color:var(--ok);font-weight:700;font-size:.85rem">Active Ops</div></div>
            <div class="neu" style="padding:10px"><div style="font-size:.65rem;color:var(--text-3);text-transform:uppercase;font-weight:800">SLA Rating</div><div style="color:var(--cyan);font-weight:700;font-size:.85rem">98% Verified</div></div>
            <div class="neu" style="padding:10px"><div style="font-size:.65rem;color:var(--text-3);text-transform:uppercase;font-weight:800">Accreditation</div><div style="font-weight:700;font-size:.85rem">MEFMA CFM</div></div>
          </div>
          <div class="row" style="gap:8px;justify-content:center">
            <a class="btn btn--primary btn--sm" href="#contact" onclick="closeModal()">Contact Me</a>
            <button class="btn btn--ghost btn--sm" type="button" onclick="downloadResume()">Download CV</button>
          </div>
        </div>`,
        footer: el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Close', onclick: closeModal })
      });
    });
  }

  /* scroll behaviours */
  function syncNavState() {
    const y = window.scrollY || window.pageYOffset || 0;
    const stuck = y > 10;
    byId('nav').classList.toggle('is-stuck', stuck);
    /* The box is slightly shorter once docked, so content beneath it shifts up
       with it rather than leaving a gap. */
    document.documentElement.style.setProperty('--nav-box-h', stuck ? '58px' : '62px');
    return y;
  }
  
  

  const lmBtn = byId('leftMenuBtn');
  if (lmBtn) lmBtn.addEventListener('click', openLeftMenu);
  const lmClose = byId('leftMenuClose');
  if (lmClose) lmClose.addEventListener('click', closeLeftMenu);
  const lmLog = byId('lmLogoutBtn');
  if (lmLog) lmLog.addEventListener('click', () => { closeLeftMenu(); logout(); });
  const lmScrim = byId('leftMenuScrim');
  if (lmScrim) lmScrim.addEventListener('click', closeLeftMenu);
  
  // Left menu item clicks
  $$('.left-menu__link').forEach((link) => {
    link.addEventListener('click', () => { closeLeftMenu(); });
  });
  // Left menu CMS & CRUD shortcuts
  const lmCrudP = byId('lmCrudProjects');
  if (lmCrudP) lmCrudP.addEventListener('click', () => { closeLeftMenu(); showDash('projects'); });
  const lmCrudA = byId('lmCrudAssets');
  if (lmCrudA) lmCrudA.addEventListener('click', () => { closeLeftMenu(); showDash('assets'); });
  const lmCrudW = byId('lmCrudWo');
  if (lmCrudW) lmCrudW.addEventListener('click', () => { closeLeftMenu(); showDash('maintenance'); });
  const lmBackup = byId('lmBackupBtn');
  if (lmBackup) lmBackup.addEventListener('click', () => { closeLeftMenu(); showDash('settings'); });

  const lmSearch = byId('lmSearchBtn');
  if (lmSearch) lmSearch.addEventListener('click', () => { closeLeftMenu(); openSearch(''); });
  const lmLang = byId('lmLangBtn');
  if (lmLang) lmLang.addEventListener('click', () => {
    setLang(DB.settings.lang === 'en' ? 'ne' : 'en');
    const lbl = byId('lmLangLabel');
    if (lbl) lbl.textContent = DB.settings.lang === 'ne' ? 'ने' : 'EN';
  });
  const lmTheme = byId('lmThemeBtn');
  if (lmTheme) lmTheme.addEventListener('click', () => { toggleTheme(); });
  const lmNotif = byId('lmNotifBtn');
  if (lmNotif) lmNotif.addEventListener('click', () => { closeLeftMenu(); renderNotifications(); openDrawer('Notifications'); });
  const lmResume = byId('lmResumeBtn');
  if (lmResume) lmResume.addEventListener('click', () => { closeLeftMenu(); downloadResume(); });
  const lmDash = byId('lmDashBtn');
  if (lmDash) lmDash.addEventListener('click', () => {
    closeLeftMenu();
    if (DB.auth.session) showDash(UI.dashPanel || 'overview');
    else showView('login');
  });
  const lmLogin = byId('lmLoginBtn');
  if (lmLogin) lmLogin.addEventListener('click', () => {
    closeLeftMenu();
    showView('login');
  });

  window.addEventListener('scroll', () => {
    const y = syncNavState();
    byId('fabTop').classList.toggle('is-in', y > 700);
    if (UI.view === 'public') {
      let current = '';
      const cut = navOffset(60);
      $$('main section[id]').forEach((s) => { if (s.offsetTop - cut <= y) current = s.id; });
      $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));
    }
  }, { passive: true });

  /* keyboard shortcuts */
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (DB.auth.session && UI.view === 'dashboard') openCmdk(); else openSearch(''); return; }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); openSearch(''); return; }
    if (e.key === 'Escape') {
      if (byId('searchOverlay') && byId('searchOverlay').classList.contains('is-open')) return closeSearch();
      if (byId('cmdkOverlay').classList.contains('is-open')) return closeCmdk();
      if (byId('lightboxOverlay').classList.contains('is-open')) { byId('lightboxOverlay').classList.remove('is-open'); return; }
      if (byId('confirmOverlay').classList.contains('is-open')) return closeConfirm();
      if (byId('modalOverlay').classList.contains('is-open')) return closeModal();
      if (byId('drawerOverlay').classList.contains('is-open')) return closeDrawer();
    }
    const sOv = byId('searchOverlay');
    if (sOv && sOv.classList.contains('is-open')) {
      const focusId = (document.activeElement || {}).id || '';
      const insideDialog = focusId === 'searchInput' || !!document.activeElement.closest('.searchbox');
      if (e.key === 'ArrowDown') { e.preventDefault(); searchMove(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); searchMove(-1); }
      if (e.key === 'Enter' && insideDialog) { e.preventDefault(); openSearchHit(searchSel); }
    }
    if (byId('cmdkOverlay').classList.contains('is-open')) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdkMove(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); cmdkMove(-1); }
      if (e.key === 'Enter') { e.preventDefault(); const c = cmdkItems[cmdkSel]; if (c) { closeCmdk(); c.act(); } }
    }
    if (!typing && e.key >= '1' && e.key <= '9' && e.altKey) {
      const order = ['overview', 'projects', 'assets', 'maintenance', 'gantt', 'calendar', 'analytics', 'reports', 'users'];
      if (DB.auth.session) showDash(order[Number(e.key) - 1]);
    }
  });

  /* responsive chart resize */
  window.addEventListener('resize', debounce(() => {
    Object.values(UI.charts).forEach((c) => { try { c.resize(); } catch (_) {} });
    if (UI.view === 'public') initParticles();
  }, 260));

  /* Apply the docked state immediately (covers restored scroll positions). */
  syncNavState();
  let navRaf = false;
  window.addEventListener('scroll', () => {
    if (navRaf) return;
    navRaf = true;
    requestAnimationFrame(() => { navRaf = false; syncNavState(); });
  }, { passive: true });

  /* auto-backup + session watchdog */
  setInterval(() => { if (DB.settings.autoBackup) makeBackup(true); }, 15 * 60 * 1000);
}

/* ==========================================================================
   PORTFOLIO SEARCH — public-site search across every content type.
   Results are grouped, keyboard navigable and deep-link to the right view.
   ========================================================================== */
const SEARCH_GROUPS = [
  { id: 'projects', label: 'Projects', icon: 'layers' },
  { id: 'assets', label: 'Assets', icon: 'building' },
  { id: 'skills', label: 'Skills', icon: 'spark' },
  { id: 'workorders', label: 'Work orders', icon: 'wrench' },
  { id: 'credentials', label: 'Certifications', icon: 'award' },
  { id: 'articles', label: 'Articles', icon: 'book' },
  { id: 'experience', label: 'Experience', icon: 'clock' }
];
let searchFilter = 'all';
let searchHits = [];
let searchSel = 0;

const SEARCH_SECTION = {
  projects: '#projects', assets: '#assets', skills: '#skills', workorders: '#maintenance',
  credentials: '#credentials', articles: '#insights', experience: '#experience'
};

function markHit(text, q) {
  const safe = esc(String(text || ''));
  if (!q) return safe;
  try {
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return safe.replace(re, '<mark class="hit">$1</mark>');
  } catch (_) { return safe; }
}

function searchIndex() {
  const out = [];
  const add = (group, title, sub, score) => out.push({ group, title, sub, score });

  (DB.projects || []).forEach((x) => {
    add('projects', x.name, [x.client, x.category, x.status, (x.tags || []).join(' ')].filter(Boolean).join(' · '),
      3 + (String(x.status).toLowerCase() === 'ongoing' ? 0.4 : 0));
  });
  (DB.assets || []).forEach((x) => {
    add('assets', x.name, [x.tag, x.category, x.location, x.status].filter(Boolean).join(' · '), 3);
  });
  (DB.skills || []).forEach((x) => {
    add('skills', x.name, [x.cat, x.years ? x.years + ' yrs' : '', x.note].filter(Boolean).join(' · '), 2);
  });
  (DB.maintenance || []).forEach((x) => {
    add('workorders', x.title, [x.id, x.type, x.asset, x.tech, x.status].filter(Boolean).join(' · '), 2);
  });
  (DB.certifications || []).forEach((x) => {
    add('credentials', x.name, [x.issuer, x.year, x.status].filter(Boolean).join(' · '), 1.6);
  });
  (DB.blog || []).forEach((x) => {
    add('articles', x.title, [x.category, x.excerpt].filter(Boolean).join(' · '), 2);
  });
  (DB.experience || []).forEach((x) => {
    add('experience', x.company, [x.title, x.period].filter(Boolean).join(' · '), 2);
  });
  return out;
}

function runSearch(q) {
  const needle = String(q || '').trim().toLowerCase();
  const idx = searchIndex();
  let hits = idx;
  if (needle) {
    const terms = needle.split(/\s+/).filter(Boolean);
    hits = idx.map((h) => {
      const hay = (h.title + ' ' + h.sub).toLowerCase();
      let score = 0, all = true;
      terms.forEach((t) => {
        const inTitle = h.title.toLowerCase().indexOf(t);
        if (inTitle === 0) score += 6;
        else if (inTitle > 0) score += 4;
        else if (hay.indexOf(t) >= 0) score += 2;
        else all = false;
      });
      return all && score > 0 ? Object.assign({}, h, { score: h.score + score }) : null;
    }).filter(Boolean);
  }
  hits.sort((a, b) => b.score - a.score);
  return searchFilter === 'all' ? hits : hits.filter((h) => h.group === searchFilter);
}

function renderSearchFilters() {
  const host = byId('searchFilters');
  if (!host) return;
  const counts = {};
  searchHits.forEach((h) => { counts[h.group] = (counts[h.group] || 0) + 1; });
  const parts = [`<button class="chip${searchFilter === 'all' ? ' is-active' : ''}" type="button" data-search-filter="all">All${searchHits.length ? ' ' + searchHits.length : ''}</button>`];
  SEARCH_GROUPS.forEach((g) => {
    if (!counts[g.id]) return;
    parts.push(`<button class="chip${searchFilter === g.id ? ' is-active' : ''}" type="button" data-search-filter="${g.id}">${esc(g.label)} ${counts[g.id]}</button>`);
  });
  host.innerHTML = parts.join('');
}

function renderSearchResults() {
  const host = byId('searchResults');
  const q = (byId('searchInput') || {}).value || '';
  if (!host) return;
  const shown = runSearch(q);
  searchSel = 0;
  if (!q.trim() && searchFilter === 'all') {
    host.innerHTML = `<div class="searchbox__foot" style="border:0;background:transparent;padding:22px 8px;display:block;text-align:center;color:var(--text-3)">
      Start typing to search ${searchIndex().length} indexed records — projects, assets, skills, work orders, certifications and articles.<br>
      <span style="font-size:.78rem">Try “chiller”, “NEBOSH”, “PPM”, “DAMAC” or “fire”.</span></div>`;
    renderSearchFilters();
    byId('searchCount').textContent = 'Type to search…';
    return;
  }
  if (!shown.length) {
    host.innerHTML = `<div class="table-empty">${icon('search', 34)}<p>No matches found for “${esc(q)}”.</p></div>`;
    renderSearchFilters();
    byId('searchCount').textContent = 'No matches';
    return;
  }
  const capped = shown.slice(0, 60);
  let html = '', lastGroup = null, i = 0;
  capped.forEach((h) => {
    if (h.group !== lastGroup) {
      if (lastGroup) html += '</div>';
      const g = SEARCH_GROUPS.find((x) => x.id === h.group) || { label: h.group, icon: 'spark' };
      html += `<div class="sres-group"><div class="sres-group__t">${esc(g.label)}</div>`;
      lastGroup = h.group;
    }
    html += `<button class="sres${i === 0 ? ' is-sel' : ''}" type="button" data-search-hit="${i}">
      <span class="sres__ic">${icon((SEARCH_GROUPS.find((x) => x.id === h.group) || {}).icon || 'spark', 16)}</span>
      <span class="sres__b">
        <span class="sres__t">${markHit(h.title, q)}</span>
        <span class="sres__s">${esc(h.sub || '')}</span>
      </span>
      <span class="sres__go">${icon('arrowUp', 15)}</span>
    </button>`;
    i++;
  });
  html += '</div>';
  host.innerHTML = html;
  searchHits = capped;
  renderSearchFilters();
  byId('searchCount').textContent = `${shown.length} match${shown.length === 1 ? '' : 'es'}${shown.length > capped.length ? ' (showing ' + capped.length + ')' : ''}`;
}

function openSearch(initial) {
  const ov = byId('searchOverlay');
  if (!ov) return;
  if (initial && String(initial).trim().length > 2) logActivity('Searched: ' + String(initial).trim().slice(0, 60), 'search');
  searchFilter = 'all';
  const input = byId('searchInput');
  input.value = initial || '';
  ov.classList.add('is-open');
  document.body.classList.add('no-scroll');
  renderSearchResults();
  setTimeout(() => { input.focus(); input.select(); }, 70);
}
function closeSearch() {
  byId('searchOverlay').classList.remove('is-open');
  if (!$('.overlay.is-open')) document.body.classList.remove('no-scroll');
}
/* Close the dialog and scroll the matching section into view (highlighting it). */
function gotoSection(sel) {
  closeSearch();
  showView('public');
  const el = document.querySelector(sel);
  if (!el) return;
  setTimeout(() => {
    const top = el.getBoundingClientRect().top + window.scrollY - navOffset(8);
    window.scrollTo({ top: top, behavior: 'smooth' });
    el.classList.remove('is-flash');
    void el.offsetWidth;
    el.classList.add('is-flash');
    setTimeout(() => el.classList.remove('is-flash'), 1500);
  }, 90);
}
function openSearchHit(i) {
  const h = searchHits[i];
  if (!h) return;
  const needle = (byId('searchInput') || {}).value || '';
  const rawTitle = h.title;
  closeSearch();
  showView('public');
  const q = (window.UI && UI.projSearch !== undefined) ? null : null;
  if (h.group === 'projects') {
    const p = DB.projects.find((x) => x.name === rawTitle);
    if (p) { if (UI.projSearch) { UI.projSearch = ''; const el = byId('projSearch'); if (el) el.value = ''; } renderProjects(); setTimeout(() => projectDetail(p.id), 160); return; }
  }
  if (h.group === 'assets') {
    const a = DB.assets.find((x) => x.name === rawTitle);
    if (a) { setTimeout(() => assetDetail(a.id), 160); return; }
  }
  if (h.group === 'articles') {
    const b = DB.blog.find((x) => x.title === rawTitle);
    if (b) { setTimeout(() => blogRead(b.id), 160); return; }
  }
  if (h.group === 'skills') {
    UI.skillFilter = 'All'; UI.skillSearch = rawTitle;
    const el = byId('skillSearch'); if (el) el.value = rawTitle;
    renderSkills();
    gotoSection('#skills');
    return;
  }
  gotoSection(SEARCH_SECTION[h.group] || '#hero');
}
function searchMove(dir) {
  const nodes = $$('#searchResults .sres');
  if (!nodes.length) return;
  nodes[searchSel] && nodes[searchSel].classList.remove('is-sel');
  searchSel = (searchSel + dir + nodes.length) % nodes.length;
  nodes[searchSel].classList.add('is-sel');
  nodes[searchSel].scrollIntoView({ block: 'nearest' });
}

/* ---------------- PWA ---------------- */
function initPWA() {
  const icon192 = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#0F172A"/><text x="96" y="128" font-family="Segoe UI,sans-serif" font-size="96" font-weight="700" fill="#06B6D4" text-anchor="middle">AS</text></svg>');
  const manifest = {
    name: 'Arjun Singh — Facilities Management Portfolio',
    short_name: 'AS · FM Portfolio',
    description: 'Facilities, property and asset management portfolio and CMS console.',
    start_url: '.', scope: '.', display: 'standalone', orientation: 'any',
    background_color: '#0F172A', theme_color: '#0F172A',
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: icon192, sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
    ]
  };
  const link = byId('pwa-manifest');
  if (link) link.href = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));

  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    } catch (_) {}
  }
  window.addEventListener('online', () => toast('ok', 'Back online', 'Cloud assets will refresh.'));
  window.addEventListener('offline', () => toast('warn', 'Offline mode', 'The platform continues to work from local storage.'));
}

/* ---------------- Boot ---------------- */

/* ==========================================================================
   PAGINATION CONTROLLERS & SUPER ADMIN PROFILE/BRAND MANAGER
   ========================================================================== */
UI.projPage = 1; UI.projPerPage = 6;
UI.assetPage = 1; UI.assetPerPage = 6;
UI.woPage = 1; UI.woPerPage = 5;
UI.blogPage = 1; UI.blogPerPage = 3;

function renderPaginationControls(opts) {
  const { total, page, perPage, infoEl, prevBtn, nextBtn, pillsEl, onPage } = opts;
  const maxPages = Math.max(1, Math.ceil(total / perPage));
  const curPage = Math.min(page, maxPages);
  const start = total ? (curPage - 1) * perPage + 1 : 0;
  const end = Math.min(curPage * perPage, total);

  if (infoEl) infoEl.textContent = `Showing ${start}–${end} of ${total}`;
  if (prevBtn) {
    prevBtn.disabled = curPage <= 1;
    prevBtn.onclick = () => onPage(curPage - 1);
  }
  if (nextBtn) {
    nextBtn.disabled = curPage >= maxPages;
    nextBtn.onclick = () => onPage(curPage + 1);
  }
  if (pillsEl) {
    pillsEl.innerHTML = '';
    for (let p = 1; p <= maxPages; p++) {
      if (maxPages > 5 && Math.abs(p - curPage) > 2 && p !== 1 && p !== maxPages) continue;
      const b = el('button', {
        class: `btn btn--xs ${p === curPage ? 'btn--primary' : 'btn--ghost'}`,
        text: String(p),
        style: 'min-width:28px;padding:4px 7px',
        onclick: () => onPage(p)
      });
      pillsEl.append(b);
    }
  }
  return { start: start - 1, end };
}

/* Super Admin Profile, Logo & Brand Editor */
/* Super Admin Master Editor — Profile, Logo, Photo & Branding */
function openProfileBrandEditor() {
  if (!can('settings')) {
    toast('danger', 'Access denied', 'Only Super Admin can manage core brand settings.');
    return;
  }
  const p = DB.profile;
  const s = DB.settings;

  const body = el('div', { class: 'stack', style: 'gap:18px' }, [
    el('div', { class: 'grid g-2', style: 'gap:12px;padding:12px;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface-2)' }, [
      el('div', { style: 'text-align:center' }, [
        el('div', { style: 'font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-3);margin-bottom:8px', text: 'Brand Logo' }),
        el('img', { id: 'brandLogoPreview', src: s.logoImg || 'assets/logo.png', style: 'height:48px;max-width:100%;object-fit:contain;margin-bottom:10px' }),
        el('button', {
          class: 'btn btn--primary btn--xs btn--block',
          type: 'button',
          html: icon('upload', 13) + ' Upload New Logo',
          onclick: () => pickImages((files) => {
            if (!files.length) return;
            s.logoImg = files[0].data;
            byId('brandLogoPreview').src = files[0].data;
            saveDB();
            applyBrandAndProfileUpdates();
            toast('ok', 'Logo Updated', 'New logo applied across all headers.');
          }, false)
        })
      ]),
      el('div', { style: 'text-align:center' }, [
        el('div', { style: 'font-size:.72rem;font-weight:800;text-transform:uppercase;color:var(--text-3);margin-bottom:8px', text: 'Profile Picture' }),
        el('img', { id: 'brandPhotoPreview', src: p.photo || 'assets/profile.jpg', style: 'width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--cyan);margin-bottom:6px' }),
        el('button', {
          class: 'btn btn--primary btn--xs btn--block',
          type: 'button',
          html: icon('upload', 13) + ' Upload New Photo',
          onclick: () => pickImages((files) => {
            if (!files.length) return;
            p.photo = files[0].data;
            p.avatar = files[0].data;
            byId('brandPhotoPreview').src = files[0].data;
            $$('.hero-panel__img').forEach(img => img.src = files[0].data);
            const sideAv = byId('sideAvatar'); if (sideAv) sideAv.src = files[0].data;
            saveDB();
            toast('ok', 'Profile Photo Updated', 'New photo applied across portfolio.');
          }, false)
        })
      ])
    ]),
    el('form', { id: 'brandMasterForm', novalidate: true }, [
      el('div', { class: 'form-grid', html: `
        ${fText('name', 'Full Name *', p.name, { full: true })}
        ${fText('title', 'Primary Job Title *', p.title)}
        ${fText('altTitle', 'Department / Focus', p.altTitle || '')}
        ${fText('currentAt', 'Current Employer', p.currentAt || '')}
        ${fText('logoText', 'Logo Text / Initials', s.logoText || 'AS')}
        ${fText('logoSub', 'Navbar Subtitle', s.logoSub || 'Facilities Manager · UAE', { full: true })}
        ${fText('email', 'Email Address *', p.email, { type: 'email' })}
        ${fText('phone', 'Phone Number *', p.phone)}
        ${fText('whatsapp', 'WhatsApp (digits only)', p.whatsapp || '971504672006')}
        ${fText('address', 'Office Location', p.address, { full: true })}
        ${fArea('summary', 'Professional Summary', p.summary, { rows: 3 })}
      ` })
    ])
  ]);

  const foot = el('div', { class: 'row', style: 'width:100%;justify-content:space-between' }, [
    el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Cancel', onclick: closeModal }),
    el('button', {
      class: 'btn btn--primary btn--sm',
      type: 'button',
      text: 'Save Brand & Identity',
      onclick: () => {
        const form = byId('brandMasterForm');
        const d = readForm(form);
        if (!d.name || !d.title) return toast('warn', 'Missing fields', 'Full Name and Job Title are required.');
        p.name = d.name; p.title = d.title; p.altTitle = d.altTitle;
        p.currentAt = d.currentAt; p.email = d.email; p.phone = d.phone;
        p.whatsapp = d.whatsapp; p.address = d.address; p.summary = d.summary;
        s.logoText = d.logoText || 'AS';
        s.logoSub = d.logoSub || 'Facilities Manager · UAE';
        saveDB();
        logActivity(`Super Admin updated brand settings: ${p.name}`, 'security');
        applyBrandAndProfileUpdates();
        toast('ok', 'Brand Settings Saved', 'All changes applied immediately.');
        closeModal();
      }
    })
  ]);

  openModal({ title: 'Super Admin — Brand, Logo & Profile Identity', body, footer: foot, wide: true });
}

function applyBrandAndProfileUpdates() {
  const p = DB.profile;
  const s = DB.settings;
  const logoSrc = s.logoImg || 'assets/logo.png';
  $$('.brand__logo-img').forEach(el => el.src = logoSrc);
  $$('[data-i18n="brand.sub"]').forEach(el => el.textContent = s.logoSub || 'Facilities Manager · UAE');
  $$('.portrait-meta__name').forEach(el => el.textContent = p.name);
  $$('.portrait-meta__title').forEach(el => el.textContent = p.title);
  $$('.portrait-meta__sub').forEach(el => el.textContent = (p.altTitle ? p.altTitle + ' · UAE' : 'Property & Asset Management · UAE'));
  $$('.left-menu__name').forEach(el => el.textContent = p.name);
  $$('.left-menu__role').forEach(el => el.textContent = p.title + ' · UAE');
  renderAbout();
  renderContact();
}

function applyAnimations(enabled) {
  document.documentElement.setAttribute('data-animations', enabled ? 'on' : 'off');
  const chk = byId('setAnim');
  if (chk) chk.checked = !!enabled;
  if (!enabled) {
    $$('[data-reveal]').forEach((n) => n.classList.add('is-in'));
    const p = byId('particles'); if (p) p.innerHTML = '';
  } else {
    initParticles();
    initReveal();
  }
}

function boot() {
  loadDB();
  applyAnimations(DB.settings && DB.settings.animations === true);
  applyBrandAndProfileUpdates();
  // Ensure profile avatar and photo use the latest high-tech portrait
  if (DB && DB.profile) {
    if (!DB.profile.photo || DB.profile.photo.includes("data:image")) DB.profile.photo = "assets/profile.jpg";
    if (!DB.profile.avatar || DB.profile.avatar.includes("data:image")) DB.profile.avatar = "assets/avatar.jpg";
  }
  applyTheme(DB.settings.theme || 'dark');
  applyI18n();
  restoreSession();
  updateAuthUI();
  renderPublicSite();
  renderNotifications();
  renderDashCounts();
  if (byId('demoCreds')) {
    byId('demoCreds').innerHTML = DB.users.filter((u) => u.active !== false).map((u) => `${esc(u.username)} / ${esc(u.password)} — <span style="color:var(--cyan)">${esc(u.role)}</span>`).join('<br>');
  }
  if (byId('year')) byId('year').textContent = String(new Date().getFullYear());
  bindGlobalEvents();
  initParticles();
  initPWA();
  // first-run guidance
  const seen = (() => { try { return localStorage.getItem('fm_seen_intro'); } catch (_) { return null; } })();
  if (!seen) {
    try { localStorage.setItem('fm_seen_intro', '1'); } catch (_) {}
    setTimeout(() => toast('ok', 'Welcome to your FM platform', 'Portfolio, asset register, work orders, reports and a CMS console — all in one offline-capable file. Press Ctrl+K to search.'), 900);
  }
  document.body.classList.add('is-ready');
  console.log(`%cAS · FM Portfolio Platform v${APP.version}`,`color:#06B6D4;font-weight:700`, `\n${DB.projects.length} projects · ${DB.assets.length} assets · ${DB.maintenance.length} work orders · ${DB.skills.length} skills`);

  /* Re-render once third-party libraries arrive (or fail) so charts, the
     calendar and PDF/Excel exports appear without a reload. */
  let libsDone = false;
  const refresh = () => {
    if (libsDone) return;
    libsDone = true;
    try { renderPublicSite(); } catch (e) { console.warn(e); }
    if (UI.view === 'dashboard') { try { renderDashPanel(UI.dashPanel); } catch (e) { console.warn(e); } }
  };
  document.addEventListener('fm:libs', () => { libsDone = false; refresh(); });
  window.addEventListener('load', () => setTimeout(refresh, 1200));
  setTimeout(refresh, 6000);
}

updateAuthUI();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
