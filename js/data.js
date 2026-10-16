/* ==========================================================================
   ARJUN SINGH — FACILITIES MANAGEMENT PORTFOLIO & MANAGEMENT PLATFORM
   DATA & CONFIGURATION MODULE (js/data.js)

   Contains all system defaults, branding, icons, RBAC configurations,
   panel metadata, status colors, i18n dictionaries, and initial seed datasets.
   ========================================================================== */
'use strict';

/* ---------------- Core ID & Date Helpers for Data Seeding ---------------- */
const uid = (p = 'id') => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowISO = () => new Date().toISOString();
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------------- Application System Config ---------------- */
const APP = {
  version: '1.4.0',
  key: 'fm_portfolio_db_v2',
  sessionKey: 'fm_portfolio_session_v2',
  backupKey: 'fm_portfolio_backups_v2',
  build: '2026.10'
};

/* ---------------- Inline SVG Icon Set ---------------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  building: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
  wrench: '<path d="M14.7 6.3a5 5 0 0 0 6.6 6.6L18 16l-4-4-3.4 3.4a5 5 0 0 1-6.6-6.6L7.4 12"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 4 3 5-7"/>',
  coins: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.75 1.75 0 0 1 0 3.5h-3a1.75 1.75 0 0 0 0 3.5h4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  star: '<path d="M12 2l3 6 6 1-4.5 4.3L18 20l-6-3.2L6 20l1.5-6.7L3 9l6-1z"/>',
  print: '<path d="M6 9V2h12v7"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v8H6z"/>',
  filter: '<path d="M3 4h18l-7 8v7l-4-2v-5z"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  play: '<path d="M5 3l14 9-14 9z"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  spark: '<path d="M12 2l1.9 5.6L19.5 9l-4.4 3.8L16.4 19 12 15.9 7.6 19l1.3-6.2L4.5 9l5.6-1.4z"/>',
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  layers: '<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  pin: '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  linkedin: '<rect x="2" y="9" width="4" height="12" rx="1"/><circle cx="4" cy="4.5" r="2"/><path d="M10 21V9h4v1.8A5 5 0 0 1 21 14v7h-4v-6a1.5 1.5 0 0 0-3 0v6z"/>',
  whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>',
  gantt: '<path d="M3 6h10M3 12h16M3 18h7"/>',
  db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.5L7 22l5-3 5 3-1.2-8.5"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
  droplet: '<path d="M12 2.7l5 5.6a7 7 0 1 1-10 0z"/>',
  wind: '<path d="M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"/>',
  doors: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M14 12h.01"/>',
  refresh: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.5 12.5L21 2M17 6l3 3M15 8l2 2"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  gauge: '<path d="M12 15l4-4"/><circle cx="12" cy="12" r="9"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
};

/* ---------------- Role-Based Access Control (RBAC) ---------------- */
const ROLES = ['Super Admin', 'Admin', 'Manager', 'Staff', 'Viewer'];
const PERMS = {
  'Super Admin': { view: 1, create: 1, edit: 1, delete: 1, users: 1, settings: 1, export: 1, audit: 1, approve: 1 },
  'Admin':       { view: 1, create: 1, edit: 1, delete: 1, users: 1, settings: 1, export: 1, audit: 1, approve: 1 },
  'Manager':     { view: 1, create: 1, edit: 1, delete: 0, users: 0, settings: 1, export: 1, audit: 1, approve: 1 },
  'Staff':       { view: 1, create: 1, edit: 1, delete: 0, users: 0, settings: 0, export: 1, audit: 0, approve: 0 },
  'Viewer':      { view: 1, create: 0, edit: 0, delete: 0, users: 0, settings: 0, export: 0, audit: 0, approve: 0 }
};

/* ---------------- Dashboard Panel Definitions & Titles ---------------- */
const PANEL_TITLES = {
  overview: ['Overview', 'Live position across projects, assets and maintenance'],
  projects: ['Projects', 'Create, edit, track progress and manage milestones'],
  assets: ['Asset Register', 'Lifecycle, criticality, QR tagging and condition data'],
  maintenance: ['Work Orders', 'Preventive and reactive maintenance control'],
  gantt: ['Gantt & Milestones', 'Schedule view across the project portfolio'],
  calendar: ['Calendar', 'PPM and reactive schedule by date'],
  analytics: ['Analytics', 'Budget, status and performance analysis'],
  reports: ['Reports & Export', 'Generate PDF, Excel and CSV outputs'],
  skills: ['Skills Matrix', 'Proficiency levels and category strength'],
  credentials: ['Certificates', 'Certifications, education and training records'],
  blog: ['Blog & Reviews', 'Publish articles and manage testimonials'],
  users: ['Users & Roles', 'Accounts, roles and the permission matrix'],
  contact: ['Enquiries', 'Messages received from the portfolio contact form'],
  activity: ['Activity & Audit', 'Every action recorded with user and timestamp'],
  settings: ['Settings & Backup', 'Appearance, data management and snapshots']
};

/* ---------------- Status Badges & Priority Classes ---------------- */
const STATUS_META = {
  'Planned':   { cls: 'badge--muted',  color: '#60A5FA' },
  'Ongoing':   { cls: 'badge--info',   color: '#0EA5E9' },
  'Completed': { cls: 'badge--ok',     color: '#10B981' },
  'On Hold':   { cls: 'badge--warn',   color: '#F59E0B' },
  'Scheduled': { cls: 'badge--info',   color: '#0EA5E9' },
  'In Progress': { cls: 'badge--violet', color: '#8B5CF6' },
  'Overdue':   { cls: 'badge--danger', color: '#F43F5E' },
  'Operational': { cls: 'badge--ok',   color: '#10B981' },
  'Under Maintenance': { cls: 'badge--warn', color: '#F59E0B' },
  'Faulty':    { cls: 'badge--danger', color: '#F43F5E' },
  'Decommissioned': { cls: 'badge--muted', color: '#93A6C4' }
};



/* ---------------- Internationalization (English & Nepali) ---------------- */
const I18N = {
  en: {
    'skip': 'Skip to main content',
    'brand.sub': 'Facilities Manager · UAE',
    'nav.home': 'Home', 'nav.about': 'About', 'nav.experience': 'Experience', 'nav.skills': 'Skills',
    'nav.projects': 'Projects', 'nav.assets': 'Assets', 'nav.maintenance': 'Maintenance',
    'nav.credentials': 'Credentials', 'nav.insights': 'Insights', 'nav.contact': 'Contact', 'nav.dashboard': 'Dashboard',
    'hero.status': 'Open to senior FM assignments · Dubai, UAE',
    'hero.hi': "Hi, I'm",
    'hero.lede': '13+ years setting up and running residential, commercial and hospitality facility operations — 24×7 service delivery, ISO-aligned maintenance, budget ownership and vendor performance across Aldar, Deyaar, DAMAC, Bin Drai and Morganti Group in the UAE.',
    'hero.resume': 'Download Resume', 'hero.contact': 'Contact Me', 'hero.projects': 'View Projects',
    'hero.search': 'Search', 'hero.searchPh': 'Search projects, assets, skills, articles…',
    'search.title': 'Search', 'search.ph': 'Search projects, assets, skills, articles, certifications…',
    'search.hint': 'Type to search…', 'search.none': 'No matches found', 'search.all': 'All',
    'hero.fc1': 'Assets managed', 'hero.fc2': 'SLA compliance', 'hero.fc3': 'Years in FM',
    'about.eyebrow': 'About Me',
    'about.title': 'Operations leader for complex, high-value assets',
    'about.sub': "A career built on reliability engineering, contract discipline and people leadership across the UAE's residential, commercial and hospitality portfolios.",
    'about.summary': 'Professional Summary', 'about.competencies': 'Core Competencies',
    'about.achievements': 'Achievements & Awards', 'about.goals': 'Professional Goals',
    'exp.eyebrow': 'Career Timeline',
    'exp.title': "13+ years across the UAE's leading developers",
    'exp.sub': 'From MEP supervision on site to facilities management of residential and commercial portfolios — expanding scope, budget and team responsibility at every step.',
    'exp.timeline': 'Timeline', 'exp.table': 'Table', 'exp.expandAll': 'Expand all', 'exp.export': 'Export CSV',
    'skills.eyebrow': 'Skills Dashboard', 'skills.title': 'Competency across the full FM stack',
    'skills.sub': 'Self-assessed proficiency benchmarked against 13 years of delivered scope. Filter by discipline to see the depth behind each area.',
    'skills.avgBadge': 'Weighted', 'skills.avgLabel': 'Average proficiency', 'skills.byCategory': 'Proficiency by category',
    'skills.radar': 'Capability radar', 'skills.all': 'Skill breakdown', 'skills.search': 'Search skills…',
    'proj.eyebrow': 'Projects & Works', 'proj.title': 'Delivered capital, retrofit and compliance works',
    'proj.sub': 'Chiller retrofits, BMS integration, Civil Defence upgrades, waterproofing and amenity refurbishment — tracked end to end with budget, timeline and progress.',
    'proj.search': 'Search projects, clients, tags…', 'proj.add': 'Add project',
    'asset.eyebrow': 'Asset Management', 'asset.title': 'Asset register, lifecycle & QR tagging',
    'asset.sub': 'Every critical plant item tracked with location, installation date, lifecycle age and condition status — with printable QR tags for field scanning.',
    'asset.search': 'Search asset, tag or location…', 'asset.add': 'Add asset',
    'asset.hint': 'Tip: press “QR” to generate a scannable asset tag.',
    'maint.eyebrow': 'Maintenance Management', 'maint.title': 'PPM, reactive works & work-order control',
    'maint.sub': 'Planned preventive schedules sit beside reactive tickets, technician assignment and a live calendar so nothing slips past its service window.',
    'maint.workOrders': 'Work orders', 'maint.newWo': 'New work order', 'maint.calendar': 'Maintenance calendar',
    'maint.live': 'Live', 'maint.split': 'PPM vs reactive mix',
    'cred.eyebrow': 'Certifications & Education', 'cred.title': 'Accredited, audited and continuously trained',
    'cred.sub': 'MEFMA Certified Facility Manager, NEBOSH IGC, CAI M-100, Civil Defence fire warden and first-aid certified — with a B.Tech in Electrical Engineering behind the technical scope.',
    'cred.certs': 'Professional Certifications', 'cred.edu': 'Education', 'cred.training': 'Training & Professional Development',
    'ins.eyebrow': 'Insights & Testimonials', 'ins.title': 'Field notes from live FM operations',
    'ins.sub': 'Practical writing on PPM strategy, Civil Defence readiness, CAFM adoption and owner-association budgeting — plus what colleagues and clients say.',
    'ins.search': 'Search articles…', 'ins.newPost': 'New article', 'ins.rating': 'Rating summary', 'ins.addReview': 'Add a testimonial',
    'contact.eyebrow': 'Contact', 'contact.title': "Let's talk about your asset portfolio",
    'contact.sub': 'Available for senior Facilities Management assignments across the UAE. Enquiries answered within one business day.',
    'contact.name': 'Full name *', 'contact.email': 'Email *', 'contact.company': 'Company', 'contact.subject': 'Subject',
    'contact.message': 'Message *', 'contact.send': 'Send message', 'contact.clear': 'Clear',
    'contact.privacy': 'Stored locally in your browser — nothing is uploaded.',
    'footer.bio': "Facilities, property and asset management leader with 13+ years across the UAE's residential, commercial and hospitality portfolios.",
    'footer.explore': 'Explore', 'footer.platform': 'Platform', 'footer.contact': 'Contact',
    'footer.reports': 'Reports & Exports', 'footer.backup': 'Backup & Restore',
    'footer.rights': 'All rights reserved.', 'footer.built': 'Single-file platform · Works offline · Data stored locally',
    'fab.whatsapp': 'WhatsApp', 'fab.email': 'Email me', 'fab.top': 'Back to top',
    'notif.markAll': 'Mark all read', 'notif.clear': 'Clear all',
    'login.title': 'Platform Sign In', 'login.sub': 'CMS, project and asset management console',
    'login.user': 'Username', 'login.pass': 'Password', 'login.remember': 'Remember me', 'login.forgot': 'Forgot password?',
    'login.signin': 'Sign in', 'login.demo': 'Demo credentials', 'login.autofill': 'Autofill', 'login.back': '← Back to portfolio',
    'dash.gOperations': 'Operations', 'dash.gInsights': 'Insights', 'dash.gAdmin': 'Administration',
    'dash.overview': 'Overview', 'dash.projects': 'Projects', 'dash.assets': 'Assets', 'dash.workorders': 'Work Orders',
    'dash.gantt': 'Gantt & Milestones', 'dash.calendar': 'Calendar', 'dash.analytics': 'Analytics',
    'dash.reports': 'Reports & Export', 'dash.skills': 'Skills Matrix', 'dash.credentials': 'Certificates',
    'dash.blog': 'Blog & Reviews', 'dash.users': 'Users & Roles', 'dash.inbox': 'Enquiries', 'dash.activity': 'Activity & Audit',
    'dash.settings': 'Settings & Backup', 'dash.logout': 'Sign out', 'dash.search': 'Search', 'dash.print': 'Print',
    'dash.viewSite': 'View site',
    'ui.cancel': 'Cancel', 'ui.confirm': 'Confirm', 'ui.save': 'Save', 'ui.close': 'Close', 'ui.delete': 'Delete',
    'ui.edit': 'Edit', 'ui.view': 'View', 'ui.add': 'Add', 'ui.none': 'None', 'ui.yes': 'Yes', 'ui.no': 'No'
  },
  ne: {
    'skip': 'मुख्य सामग्रीमा जानुहोस्',
    'brand.sub': 'सुविधा प्रबन्धक · यूएई',
    'nav.home': 'गृहपृष्ठ', 'nav.about': 'परिचय', 'nav.experience': 'अनुभव', 'nav.skills': 'सीपहरू',
    'nav.projects': 'परियोजनाहरू', 'nav.assets': 'सम्पत्तिहरू', 'nav.maintenance': 'मर्मतसम्भार',
    'nav.credentials': 'प्रमाणपत्र', 'nav.insights': 'लेखहरू', 'nav.contact': 'सम्पर्क', 'nav.dashboard': 'ड्यासबोर्ड',
    'hero.status': 'वरिष्ठ एफएम जिम्मेवारीका लागि उपलब्ध · दुबई, यूएई',
    'hero.hi': 'नमस्ते, म हुँ',
    'hero.lede': '१३ वर्षभन्दा बढी अनुभवसहित आवासीय, व्यावसायिक र आतिथ्य सुविधा सञ्चालनको नेतृत्व — २४×७ सेवा, आईएसओ अनुरूप मर्मत, बजेट र ठेक्का व्यवस्थापन। यूएईमा Aldar, Deyaar, DAMAC, Bin Drai र Morganti Group सँग कार्य अनुभव।',
    'hero.resume': 'बायोडाटा डाउनलोड', 'hero.contact': 'सम्पर्क गर्नुहोस्', 'hero.projects': 'परियोजना हेर्नुहोस्',
    'hero.search': 'खोज्नुहोस्', 'hero.searchPh': 'परियोजना, सम्पत्ति, सीप, लेख खोज्नुहोस्…',
    'search.title': 'खोज', 'search.ph': 'परियोजना, सम्पत्ति, सीप, लेख, प्रमाणपत्र खोज्नुहोस्…',
    'search.hint': 'खोज्न टाइप गर्नुहोस्…', 'search.none': 'कुनै नतिजा भेटिएन', 'search.all': 'सबै',
    'hero.fc1': 'सम्पत्ति व्यवस्थापन', 'hero.fc2': 'एसएलए अनुपालन', 'hero.fc3': 'वर्ष अनुभव',
    'about.eyebrow': 'मेरो परिचय',
    'about.title': 'जटिल र उच्च मूल्यका सम्पत्तिको सञ्चालन नेतृत्व',
    'about.sub': 'यूएईका आवासीय, व्यावसायिक र आतिथ्य पोर्टफोलियोमा विश्वसनीयता, ठेक्का अनुशासन र टोली नेतृत्वमा आधारित करियर।',
    'about.summary': 'व्यावसायिक सारांश', 'about.competencies': 'मुख्य दक्षताहरू',
    'about.achievements': 'उपलब्धि र पुरस्कार', 'about.goals': 'व्यावसायिक लक्ष्य',
    'exp.eyebrow': 'कार्यकाल', 'exp.title': 'यूएईका प्रमुख कम्पनीहरूमा १३+ वर्ष',
    'exp.sub': 'साइटमा एमईपी सुपरिवेक्षणदेखि आवासीय तथा व्यावसायिक पोर्टफोलियोको सुविधा व्यवस्थापनसम्म — हरेक चरणमा जिम्मेवारी विस्तार।',
    'exp.timeline': 'समयरेखा', 'exp.table': 'तालिका', 'exp.expandAll': 'सबै खोल्नुहोस्', 'exp.export': 'सीएसभी निर्यात',
    'skills.eyebrow': 'सीप ड्यासबोर्ड', 'skills.title': 'पूर्ण एफएम क्षेत्रमा दक्षता',
    'skills.sub': '१३ वर्षको कार्यअनुभवका आधारमा स्वमूल्याङ्कन गरिएको दक्षता। विधा अनुसार फिल्टर गर्नुहोस्।',
    'skills.avgBadge': 'भारित', 'skills.avgLabel': 'औसत दक्षता', 'skills.byCategory': 'विधा अनुसार दक्षता',
    'skills.radar': 'क्षमता रडार', 'skills.all': 'सीप विवरण', 'skills.search': 'सीप खोज्नुहोस्…',
    'proj.eyebrow': 'परियोजना र कार्य', 'proj.title': 'सम्पन्न पुँजीगत, पुनर्संरचना र अनुपालन कार्य',
    'proj.sub': 'चिलर पुनर्संरचना, बीएमएस एकीकरण, नागरिक सुरक्षा उन्नयन, वाटरप्रुफिङ र सुविधा पुनर्निर्माण — बजेट, समय र प्रगतिसहित।',
    'proj.search': 'परियोजना, ग्राहक, ट्याग खोज्नुहोस्…', 'proj.add': 'परियोजना थप्नुहोस्',
    'asset.eyebrow': 'सम्पत्ति व्यवस्थापन', 'asset.title': 'सम्पत्ति दर्ता, जीवनचक्र र क्यूआर ट्यागिङ',
    'asset.sub': 'प्रत्येक महत्वपूर्ण प्लान्ट वस्तुको स्थान, जडान मिति, उमेर र अवस्था — फिल्ड स्क्यानका लागि क्यूआर ट्यागसहित।',
    'asset.search': 'सम्पत्ति, ट्याग वा स्थान खोज्नुहोस्…',
    'asset.add': 'सम्पत्ति थप्नुहोस्', 'asset.hint': 'सुझाव: क्यूआर ट्याग बनाउन “QR” थिच्नुहोस्।',
    'maint.eyebrow': 'मर्मतसम्भार व्यवस्थापन', 'maint.title': 'पीपीएम, आकस्मिक कार्य र वर्क-अर्डर नियन्त्रण',
    'maint.sub': 'योजनाबद्ध निवारक तालिका, आकस्मिक टिकट, प्राविधिक जिम्मेवारी र प्रत्यक्ष क्यालेन्डर एकै ठाउँमा।',
    'maint.workOrders': 'वर्क अर्डरहरू', 'maint.newWo': 'नयाँ वर्क अर्डर', 'maint.calendar': 'मर्मत क्यालेन्डर',
    'maint.live': 'प्रत्यक्ष', 'maint.split': 'पीपीएम र आकस्मिक अनुपात',
    'cred.eyebrow': 'प्रमाणपत्र र शिक्षा', 'cred.title': 'मान्यता प्राप्त, अडिट गरिएको र निरन्तर तालिम',
    'cred.sub': 'MEFMA प्रमाणित सुविधा प्रबन्धक, NEBOSH IGC, CAI M-100, नागरिक सुरक्षा फायर वार्डन र प्राथमिक उपचार प्रमाणित — साथै विद्युतीय इन्जिनियरिङमा बी.टेक।',
    'cred.certs': 'व्यावसायिक प्रमाणपत्रहरू', 'cred.edu': 'शिक्षा', 'cred.training': 'तालिम र व्यावसायिक विकास',
    'ins.eyebrow': 'लेख र प्रतिक्रिया', 'ins.title': 'प्रत्यक्ष एफएम सञ्चालनका अनुभवहरू',
    'ins.sub': 'पीपीएम रणनीति, नागरिक सुरक्षा तयारी, CAFM प्रयोग र बजेटमा व्यावहारिक लेख — साथै सहकर्मी र ग्राहकका प्रतिक्रिया।',
    'ins.search': 'लेख खोज्नुहोस्…', 'ins.newPost': 'नयाँ लेख', 'ins.rating': 'मूल्याङ्कन सारांश', 'ins.addReview': 'प्रतिक्रिया थप्नुहोस्',
    'contact.eyebrow': 'सम्पर्क', 'contact.title': 'तपाईंको सम्पत्ति पोर्टफोलियोबारे कुरा गरौं',
    'contact.sub': 'यूएईभर वरिष्ठ सुविधा व्यवस्थापन जिम्मेवारीका लागि उपलब्ध। एक कार्यदिनभित्र जवाफ।',
    'contact.name': 'पूरा नाम *', 'contact.email': 'इमेल *', 'contact.company': 'कम्पनी', 'contact.subject': 'विषय',
    'contact.message': 'सन्देश *', 'contact.send': 'सन्देश पठाउनुहोस्', 'contact.clear': 'खाली गर्नुहोस्',
    'contact.privacy': 'तपाईंको ब्राउजरमै सुरक्षित — केही पनि अपलोड हुँदैन।',
    'footer.bio': '१३+ वर्षको अनुभवसहित सुविधा, सम्पत्ति र एसेट व्यवस्थापन नेतृत्व।',
    'footer.explore': 'अन्वेषण', 'footer.platform': 'प्लेटफर्म', 'footer.contact': 'सम्पर्क',
    'footer.reports': 'रिपोर्ट र निर्यात', 'footer.backup': 'ब्याकअप र पुनर्स्थापना',
    'footer.rights': 'सर्वाधिकार सुरक्षित।', 'footer.built': 'एकल फाइल प्लेटफर्म · अफलाइन कार्य · डाटा स्थानीय',
    'fab.whatsapp': 'व्हाट्सएप', 'fab.email': 'इमेल गर्नुहोस्', 'fab.top': 'माथि जानुहोस्',
    'notif.markAll': 'सबै पढिएको', 'notif.clear': 'सबै हटाउनुहोस्',
    'login.title': 'प्लेटफर्म लगइन', 'login.sub': 'सीएमएस, परियोजना र सम्पत्ति व्यवस्थापन कन्सोल',
    'login.user': 'प्रयोगकर्ता नाम', 'login.pass': 'पासवर्ड', 'login.remember': 'मलाई सम्झनुहोस्', 'login.forgot': 'पासवर्ड बिर्सनुभयो?',
    'login.signin': 'लगइन', 'login.demo': 'डेमो प्रमाणहरू', 'login.autofill': 'स्वतः भर्नुहोस्', 'login.back': '← पोर्टफोलियोमा फर्कनुहोस्',
    'dash.gOperations': 'सञ्चालन', 'dash.gInsights': 'विश्लेषण', 'dash.gAdmin': 'प्रशासन',
    'dash.overview': 'अवलोकन', 'dash.projects': 'परियोजनाहरू', 'dash.assets': 'सम्पत्तिहरू', 'dash.workorders': 'वर्क अर्डर',
    'dash.gantt': 'गान्ट र माइलस्टोन', 'dash.calendar': 'क्यालेन्डर', 'dash.analytics': 'विश्लेषण',
    'dash.reports': 'रिपोर्ट र निर्यात', 'dash.skills': 'सीप म्याट्रिक्स', 'dash.credentials': 'प्रमाणपत्र',
    'dash.blog': 'लेख र प्रतिक्रिया', 'dash.users': 'प्रयोगकर्ता र भूमिका', 'dash.inbox': 'प्राप्त सन्देश',
    'dash.activity': 'गतिविधि र अडिट', 'dash.settings': 'सेटिङ र ब्याकअप', 'dash.logout': 'साइन आउट',
    'dash.search': 'खोज्नुहोस्', 'dash.print': 'प्रिन्ट', 'dash.viewSite': 'साइट हेर्नुहोस्',
    'ui.cancel': 'रद्द', 'ui.confirm': 'पुष्टि', 'ui.save': 'सुरक्षित', 'ui.close': 'बन्द', 'ui.delete': 'मेटाउनुहोस्',
    'ui.edit': 'सम्पादन', 'ui.view': 'हेर्नुहोस्', 'ui.add': 'थप्नुहोस्', 'ui.none': 'छैन', 'ui.yes': 'हो', 'ui.no': 'होइन'
  }
};

/* ---------------- Initial Database Schema & Profile Seed ---------------- */
function seedDB() {
  const portrait = 'assets/profile.jpg';
  return {
    meta: { version: APP.version, created: nowISO(), updated: nowISO() },
    auth: { session: null, lastLogin: null },
    users: [
      { id: uid('u'), username: 'Admin',   password: 'Admin@981474594', name: 'Arjun Singh', role: 'Super Admin', active: true,  created: nowISO(), email: 'singh.arjun0231257@gmail.com' },
      { id: uid('u'), username: 'manager', password: 'Manager@123',     name: 'Portfolio Manager', role: 'Manager', active: true, created: nowISO(), email: '' },
      { id: uid('u'), username: 'staff',   password: 'Staff@123',       name: 'FM Engineer', role: 'Staff', active: true, created: nowISO(), email: '' },
      { id: uid('u'), username: 'viewer',  password: 'Viewer@123',      name: 'Owner Representative', role: 'Viewer', active: true, created: nowISO(), email: '' }
    ],
    profile: {
      name: 'Arjun Singh',
      avatar: 'assets/avatar.jpg',
      title: 'Facilities Manager',
      headline: 'Senior Professional: Strategic Planning | Operations | Facilities Management',
      altTitle: 'Strategic Planning • Operations • Facilities Management',
      tagline: 'Strategic Planning • Operations • Facilities Management — UAE',
      photo: 'assets/profile.jpg',
      email: 'singh.arjun0231257@gmail.com',
      phone: '+971-50-467-2006',
      phoneRaw: '971504672006',
      whatsapp: '971504672006',
      address: 'Business Bay, Dubai, United Arab Emirates',
      dob: '1990-08-29',
      nationality: 'Nepal',
      visa: 'UAE Residence Visa',
      drivingLicence: 'UAE Light Motor Vehicle driving license issued by UAE government on 17th Jan 2017',
      languages: ['English', 'Hindi', 'Nepali', 'Bhojpuri', 'Maithili'],
      currentAt: 'Aldar Property, UAE',
      objective: 'Multi-tasking professional targeting senior assignments in Facilities Management to deliver quality work in a reputed organization for mutual growth, preferably in Dubai.',
      summary: 'Versatile performer with proven skills, offering 13 years of experience focused in setting-up & managing operations of facilities and general management including renovation, preventative / grounds maintenance & upgrades. Adept at handling day-to-day activities in co-ordination with internal / external departments for ensuring smooth business operations. Proven skills in directing & delivering 24x7 service operations of all sites including design of developing procedures & performance measures, supply of materials & service, coordination with building managers & business units on project issues and property inspections. Ensuring full compliance with ISO 14001:2015, ISO 9001:2015 and ISO 45001:2018 standards.',
      goals: 'Targeting senior assignments in Facilities Management to deliver quality work in a reputed organization for mutual growth, preferably in Dubai. Progressing into a Head of Facilities / Senior FM leadership role owning multi-asset portfolios across the UAE & GCC.',
      highlights: [
        '13 years of experience focused in setting-up & managing operations of facilities and general management including renovation, preventative / grounds maintenance & upgrades',
        'Adept at handling day-to-day activities in co-ordination with internal / external departments for ensuring smooth business operations',
        'Proven skills in directing & delivering 24x7 service operations of all sites including design of developing procedures & performance measures, supply of materials & service, coordination with building managers & business units on project issues and property inspections',
        'Proficient in investigating the availability and suitability of options for new premises; significant experience in planning for future development in line with strategic business objectives',
        'Monitored & managed the major assets and technologies within the workplace to ensure maximum return on investment',
        'Allocated & managed facility space for maximum accuracy; coordinated intra-office moves; supervised maintenance and repair of facilities and equipment',
        'Ensured compliance with the ISO standards (ISO 14001:2015, ISO 9001:2015, ISO 45001:2018)',
        'Focused on contingency plans regarding what needs to be done in the event that certain situations occur, such as equipment breaking down unexpectedly',
        'People Manager: directing productive cross-functional teams using interactive and motivational leadership that spurs people to willingly give 100% effort'
      ],
      competencies: [
        'Corporate Strategy Planning',
        'Property & Facility Management',
        'Operations & Maintenance',
        'Cross-functional Coordination',
        'General Administration',
        'Staff Management & Coordination',
        'Advisory Services',
        'Team Building & Leadership',
        'Stakeholder Management'
      ],
      softSkills: [
        'Motivator',
        'Collaborator',
        'Communicator',
        'Innovator',
        'Team Building',
        'Problem-Solver'
      ],
      itSkills: [
        'MS Excel (Advanced)',
        'MS Word',
        'MS PowerPoint',
        'CAFM / Help Desk Systems',
        'BMS (Building Management Systems)',
        'Hardware & Networking',
        'Application Programming'
      ],
      social: {
        linkedin: 'https://www.linkedin.com/',
        whatsapp: 'https://wa.me/971504672006?text=Hello%20Arjun,%20I%20viewed%20your%20Facilities%20Management%20portfolio',
        email: 'mailto:singh.arjun0231257@gmail.com',
        phone: 'tel:+971504672006'
      },
      stats: [
        { label: 'Years in FM & Property', value: 13, suffix: '+', icon: 'clock' },
        { label: 'SLA compliance delivered', value: 99.4, suffix: '%', icon: 'shield' },
        { label: 'Major developers in UAE', value: 5, suffix: ' Firms', icon: 'building' },
        { label: 'ISO Audits Passed', value: 100, suffix: '%', icon: 'check' }
      ]
    },
    experience: [
      {
        company: 'Aldar Property, UAE', short: 'Aldar', logo: 'AL',
        title: 'Facilities Manager — Residential & Commercial Projects',
        period: "Nov'24 — Present", start: '2024-11-01', end: '', current: true,
        location: 'Abu Dhabi / Dubai, UAE', type: 'Facilities Management',
        points: [
          'Leading the planning, implementation & maintenance of the infrastructure & equipment of buildings and facilities',
          'Inspecting the facility, systems, rooms & common areas and reporting back any findings or issues to the Facility Manager',
          'Managing quality & performance aspects of services including monthly performance reporting & maintenance of site document registry',
          'Facilitating coordination of the emergency procedures and managing relationships with key stakeholders, through regular communication & formal review meetings'
        ],
        projects: ['Residential & commercial towers MEP reliability programme', 'Common-area upgrade & lifecycle renewal works', 'Emergency response & evacuation readiness protocol']
      },
      {
        company: 'Deyaar Property, UAE', short: 'Deyaar', logo: 'DY',
        title: 'Assistant Facilities Manager in Residential, Commercial & Hospitality Projects',
        period: "Aug'21 — Oct'24", start: '2021-08-01', end: '2024-10-31', current: false,
        location: 'Dubai, UAE', type: 'Property & Facilities Management',
        points: [
          'Monitoring performance of in-house and out-sourced services to agreed service levels (SLAs)',
          'Drafting budgets, financial reports (monthly & quarterly), contracts, expenditures and purchase orders related to the facility',
          'Hiring, training & motivating facility personnel while maintaining positive staff relations and conducting or approving performance evaluations for staff',
          'Coordinating with PROs on affairs related with renewal of company’s computer card & municipality license, Immigration (obtaining & renewal of visas, passport, govt. Health card, driving license)',
          'Maintaining personnel files & documentation of all employees; preparing and issuing letters to the employees such as Employment Letter or any letter for other companies'
        ],
        projects: ['Service-level agreement restructuring & contractor tendering', 'Annual operating budget drafting & expenditure tracking', 'Hospitality & residential asset handover operations']
      },
      {
        company: 'DAMAC, UAE', short: 'DAMAC', logo: 'DM',
        title: 'FM Engineer in Hospitality & Residential Project',
        period: "Oct'17 — Aug'21", start: '2017-10-01', end: '2021-08-31', current: false,
        location: 'Dubai, UAE', type: 'MEP & Facilities Engineering',
        points: [
          'Developed, acquired consensus and implemented the best practice/building operation plan for assigned assets',
          'Arranged for alterations, maintenance or reconditioning of facilities, as per operating procedure / management services agreement',
          'Liaised with Procurement team, competitively bid & prepared non-engineering service contracts to assure high quality and cost effective services',
          'Prepared periodic inventory of premises contents and property condition and forwarded the listing to the Property Manager for review',
          'Ensured that services are reviewed and refinements made to enhance the services across the facility',
          'Coordinated with all departments for smooth & trouble free operations of engineering systems, equipment and customer interaction'
        ],
        projects: ['Building operation plan rollout across hospitality assets', 'Non-engineering service contract tendering & procurement', 'NEBOSH Health & Safety in the workplace compliance programme']
      },
      {
        company: 'Bin Drai Enterprises, UAE', short: 'Bin Drai', logo: 'BD',
        title: 'FM Coordinator',
        period: "Mar'15 — Sep'17", start: '2015-03-01', end: '2017-09-30', current: false,
        location: 'Dubai, UAE', type: 'Facilities Coordination',
        points: [
          'Attended all Facility Management/Property meetings as required and passed on necessary information to the Maintenance team in regular junior staff meetings',
          'Managed all necessary maintenance inspections at the required time, scheduled & supervised all repairs (both emergency & preventative to the building), monitored services installations, plant, fixtures, fittings and equipment',
          'Initiated Purchase Request for materials / parts needed in the execution of repair & maintenance involving electrical works'
        ],
        projects: ['Preventative maintenance scheduling system implementation', 'Electrical repair & installation monitoring programme']
      },
      {
        company: 'Morganti Group Inc., UAE', short: 'Morganti', logo: 'MG',
        title: 'FM Supervisor',
        period: "Feb'11 — Mar'15", start: '2011-02-01', end: '2015-03-31', current: false,
        location: 'UAE', type: 'MEP Supervision',
        points: [
          'Monitored & ensured sufficient stock to carry out repair & maintenance and to meet the Resort’s requirements',
          'Ensured that inspections required by Government authorities are properly conducted and documented which included operation & maintenance of the buildings, electrical, mechanical & plumbing services, plant, fixtures, furnishings and equipment',
          'Oversaw operation and maintenance of resort facilities ensuring uninterrupted 24x7 guest services'
        ],
        projects: ['Government inspection compliance & certification records', 'MEP plant operations, stock control & preventative maintenance']
      }
    ],
    skills: [
      { id: 's1',  name: 'Facilities Management',            cat: 'Facilities Management', level: 96, years: 13, note: 'Multi-asset residential, commercial and hospitality operations with 24×7 accountability.' },
      { id: 's2',  name: 'Property Management',              cat: 'Facilities Management', level: 92, years: 11, note: 'Owner associations, service charge scopes, tenant and occupier liaison.' },
      { id: 's3',  name: 'Asset Management',                 cat: 'Asset Management',     level: 90, years: 10, note: 'Asset registers, lifecycle planning, criticality ranking and replacement forecasting.' },
      { id: 's4',  name: 'Asset Lifecycle & Condition Audits', cat: 'Asset Management',   level: 86, years: 9,  note: 'Periodic premises inventories and condition reporting for property managers.' },
      { id: 's5',  name: 'MEP Operations',                   cat: 'MEP',                  level: 93, years: 13, note: 'Plant room operations, engineering systems coordination and fault diagnosis.' },
      { id: 's6',  name: 'HVAC & Chiller Plants',            cat: 'HVAC',                 level: 88, years: 11, note: 'Chiller plant performance, AHU/FCU maintenance, BMS-driven optimisation.' },
      { id: 's7',  name: 'Electrical Systems',               cat: 'Electrical',           level: 90, years: 13, note: 'B.Tech Electrical Engineering; LV distribution, generators, UPS and lighting.' },
      { id: 's8',  name: 'Plumbing & Drainage',              cat: 'Plumbing',             level: 78, years: 10, note: 'Water supply, drainage, pumps, water tanks and leakage remediation.' },
      { id: 's9',  name: 'Fire & Life Safety',               cat: 'Fire & Life Safety',   level: 91, years: 10, note: 'DCD Level-1 Fire Warden; alarm/FF systems, drills and Civil Defence audits.' },
      { id: 's10', name: 'Health, Safety & Environment',     cat: 'Fire & Life Safety',   level: 90, years: 12, note: 'NEBOSH IGC holder; risk assessments, permits to work and incident control.' },
      { id: 's11', name: 'Contracts & Tendering',            cat: 'Contracts',            level: 85, years: 9,  note: 'Competitive bidding, non-engineering service contracts and vendor evaluation.' },
      { id: 's12', name: 'Vendor & SLA Management',          cat: 'Contracts',            level: 88, years: 11, note: 'KPI-backed SLA measurement and monthly performance reporting.' },
      { id: 's13', name: 'Project Management',               cat: 'Project Management',   level: 86, years: 10, note: 'Retrofit, refurbishment and compliance project delivery to budget and date.' },
      { id: 's14', name: 'Preventive Maintenance Planning',  cat: 'MEP',                  level: 94, years: 13, note: 'PPM schedules, statutory testing calendars and completion tracking.' },
      { id: 's15', name: 'CAFM Systems',                     cat: 'CAFM',                 level: 84, years: 8,  note: 'Asset and work-order data discipline; reporting from CAFM extracts.' },
      { id: 's16', name: 'Help Desk & Service Requests',     cat: 'Help Desk',            level: 87, years: 10, note: 'Ticket triage, escalation matrices and response/resolution tracking.' },
      { id: 's17', name: 'Budget Management',                cat: 'Budget Management',    level: 84, years: 9,  note: 'Operating and capital budget drafting, variance analysis and cost control.' },
      { id: 's18', name: 'Financial Reporting',              cat: 'Budget Management',    level: 82, years: 9,  note: 'Monthly and quarterly facility financial and expenditure reporting.' },
      { id: 's19', name: 'ISO Compliance (9001/14001/45001)',cat: 'Compliance',           level: 88, years: 8,  note: 'Document control, internal audit readiness and corrective action closure.' },
      { id: 's20', name: 'Team Leadership & Development',    cat: 'Leadership',           level: 89, years: 11, note: 'Hiring, training, motivation and performance evaluation of FM teams.' },
      { id: 's21', name: 'Stakeholder Management',           cat: 'Leadership',           level: 87, years: 11, note: 'Developers, owners, occupiers, authorities and contractors.' },
      { id: 's22', name: 'Community Association Management', cat: 'Facilities Management', level: 80, years: 5, note: 'CAI M-100 trained in essentials of management for community associations.' },
      { id: 's23', name: 'Energy & Sustainability',          cat: 'MEP',                  level: 76, years: 7,  note: 'Consumption tracking, retrofit business cases and efficiency measures.' },
      { id: 's24', name: 'Space & Move Management',          cat: 'Facilities Management', level: 82, years: 9,  note: 'Space allocation accuracy and coordination of intra-office moves.' },
      { id: 's25', name: 'Emergency & Contingency Planning', cat: 'Fire & Life Safety',   level: 89, years: 10, note: 'Business continuity and equipment-failure contingency procedures.' },
      { id: 's26', name: 'MS Office & Data Reporting',       cat: 'Systems',              level: 85, years: 13, note: 'Advanced Excel analysis, Word and PowerPoint executive reporting.' }
    ],
    skillCategories: ['Facilities Management', 'Asset Management', 'MEP', 'HVAC', 'Electrical', 'Plumbing', 'Fire & Life Safety', 'Contracts', 'Project Management', 'CAFM', 'Help Desk', 'Budget Management', 'Compliance', 'Leadership', 'Systems'],
    projects: [],
    assets: [],
    maintenance: [],
    awards: [],
    certifications: [],
    education: [],
    testimonials: [],
    blog: [],
    messages: [],
    activity: [],
    notifications: [],
    settings: { theme: 'dark', lang: 'en', currency: 'AED', autoBackup: true, backupLimit: 8, animations: false, compact: false, org: 'Arjun Singh — FM Portfolio' }
  };
}

/* ---------------- Comprehensive Seed Dataset ---------------- */
function seedContent(db) {
  db.projects = [
    {
      id: 'P-1001', name: 'Chiller Plant Retrofit & Optimization', client: 'Aldar Property Portfolio, UAE',
      category: 'MEP', status: 'Completed', budget: 1850000, spent: 1796000,
      start: '2024-11-15', end: '2025-04-20', progress: 100, priority: 'High',
      team: ['Aldar FM Team', '3rd-party chiller contractor', 'BMS vendor'],
      tags: ['Chiller', 'Energy', 'Retrofit'],
      desc: 'Full retrofit and reliability overhaul of central chiller plant including compressor overhaul, condenser descaling, controls upgrade and insulation renewal across residential/commercial towers.',
      outcomes: ['Specific power reduced from 0.92 to 0.71 kW/TR', 'Unplanned chiller downtime eliminated for 14 months', 'Payback modelled at 3.4 years'],
      gallery: [], milestones: [
        { name: 'Condition survey & scope', date: '2024-11-20', done: true },
        { name: 'Contractor mobilisation', date: '2024-12-05', done: true },
        { name: 'Compressor overhaul', date: '2025-02-15', done: true },
        { name: 'Controls & commissioning', date: '2025-04-20', done: true }
      ], attachments: []
    },
    {
      id: 'P-1002', name: 'Lobby & Amenity Refurbishment', client: 'Deyaar Property Management, UAE',
      category: 'Refurbishment', status: 'Completed', budget: 3200000, spent: 3040000,
      start: '2023-09-01', end: '2024-03-01', progress: 100, priority: 'High',
      team: ['Interior contractor', 'Deyaar FM Team', 'ID Consultant'],
      tags: ['Fit-out', 'Amenity', 'Finishes'],
      desc: 'Comprehensive refresh of lobby, gym and pool-deck finishes across multi-building residential & commercial assets — stone and joinery replacement, lighting redesign, pool-deck slip-resistant surfacing and FF&E renewal.',
      outcomes: ['Phased access maintained for residents throughout with zero complaints', 'Enhanced asset valuation and tenant satisfaction scores'],
      gallery: [], milestones: [
        { name: 'Design freeze & tender', date: '2023-09-15', done: true },
        { name: 'Tower 1 lobby complete', date: '2023-12-20', done: true },
        { name: 'Gym & pool deck renewal', date: '2024-02-01', done: true },
        { name: 'Snag closure & handover', date: '2024-03-01', done: true }
      ], attachments: []
    },
    {
      id: 'P-1003', name: 'Fire Alarm & Life Safety System Upgrade (DCD)', client: 'DAMAC Hotel & Resorts / LOAMS',
      category: 'Safety', status: 'Completed', budget: 1450000, spent: 1380000,
      start: '2020-02-01', end: '2020-10-30', progress: 100, priority: 'Critical',
      team: ['NAFFCO Fire contractor', 'DCD-approved consultant', 'DAMAC FM Engineering'],
      tags: ['Fire Alarm', 'DCD', 'Compliance'],
      desc: 'Upgrade of addressable fire alarm panels, detection loops and cause-and-effect matrix to meet the latest Civil Defence code, including voice evacuation interfacing and NEBOSH safety compliance.',
      outcomes: ['Zero DCD observations at final Civil Defence audit', 'Contributed to NEBOSH and DAMAC Appreciation recognition'],
      gallery: [], milestones: [
        { name: 'DCD drawing approval', date: '2020-02-20', done: true },
        { name: 'Panel replacement & wiring', date: '2020-05-15', done: true },
        { name: 'Loop & device commissioning', date: '2020-08-10', done: true },
        { name: 'Final DCD inspection sign-off', date: '2020-10-30', done: true }
      ], attachments: []
    },
    {
      id: 'P-1004', name: 'Landscape Irrigation Automation & Water Saving', client: 'DAMAC / Luxury Community Associations',
      category: 'Landscaping', status: 'Completed', budget: 620000, spent: 590000,
      start: '2019-04-01', end: '2019-09-01', progress: 100, priority: 'Medium',
      team: ['Landscaping vendor', 'Irrigation specialist', 'DAMAC FM'],
      tags: ['Irrigation', 'Water Saving', 'Sustainability'],
      desc: 'Automated drip irrigation with soil-moisture and weather-based controllers across community podium gardens to reduce municipal water consumption and manual labour.',
      outcomes: ['Delivered 32% reduction in irrigation water expenditure', 'Automated fault alerts to central facilities desk'],
      gallery: [], milestones: [
        { name: 'Scope & BOQ', date: '2019-04-10', done: true },
        { name: 'Installation & piping', date: '2019-06-20', done: true },
        { name: 'Commissioning & testing', date: '2019-09-01', done: true }
      ], attachments: []
    },
    {
      id: 'P-1005', name: 'Podium Waterproofing & Structural Remediation', client: 'Bin Drai Enterprises, UAE',
      category: 'MEP', status: 'Completed', budget: 980000, spent: 940000,
      start: '2016-01-10', end: '2016-06-25', progress: 100, priority: 'High',
      team: ['Waterproofing specialist', 'Bin Drai FM Coordination team'],
      tags: ['Waterproofing', 'Leakage', 'Structure'],
      desc: 'Remedial waterproofing to podium slab, expansion joints and planters following recurring leakage into retail units and parking basements.',
      outcomes: ['Zero water ingress across retail and basement zones following remediation', 'Extended structural waterproofing warranty by 10 years'],
      gallery: [], milestones: [
        { name: 'Leak investigation & core test', date: '2016-01-20', done: true },
        { name: 'Trial patch & membrane testing', date: '2016-03-10', done: true },
        { name: 'Full remediation & flood test', date: '2016-06-25', done: true }
      ], attachments: []
    },
    {
      id: 'P-1006', name: 'BMS Central Integration & Energy Telemetry', client: 'Morganti Group Inc. / Hospitality Assets',
      category: 'MEP', status: 'Completed', budget: 2100000, spent: 2015000,
      start: '2013-05-01', end: '2014-02-15', progress: 100, priority: 'High',
      team: ['Honeywell BMS vendor', 'Morganti MEP Team'],
      tags: ['BMS', 'Controls', 'Energy'],
      desc: 'Integration of chillers, booster pumps, AHUs and common-area lighting into a single BMS platform with trend logging, alarms and scheduled optimisation strategies for 24x7 guest operations.',
      outcomes: ['Alarm flood reduced 64% via rationalisation', 'Uninterrupted 24x7 guest service reliability maintained'],
      gallery: [], milestones: [
        { name: 'Point schedule approval', date: '2013-05-20', done: true },
        { name: 'Field device wiring & DDC', date: '2013-08-30', done: true },
        { name: 'Graphics & trends setup', date: '2013-11-15', done: true },
        { name: 'Handover & authority sign-off', date: '2014-02-15', done: true }
      ], attachments: []
    },
    {
      id: 'P-1007', name: 'Annual Hard & Soft Services Contract Re-tender', client: 'Deyaar Property Management, UAE',
      category: 'Contracts', status: 'Completed', budget: 340000, spent: 318000,
      start: '2022-03-01', end: '2022-06-30', progress: 100, priority: 'Medium',
      team: ['Procurement', 'Deyaar FM Operations Team'],
      tags: ['Tender', 'SLA', 'Cost Saving'],
      desc: 'Competitive re-tender of the integrated hard and soft services contracts across residential portfolios with re-scoped KPIs, statutory testing matrix and SLA penalty/incentive frameworks.',
      outcomes: ['12.8% operational cost reduction while elevating KPI compliance to 99.4%', 'Streamlined vendor escalation and quarterly review protocols'],
      gallery: [], milestones: [
        { name: 'Scope & KPI drafting', date: '2022-03-15', done: true },
        { name: 'Bid evaluation & commercial review', date: '2022-05-10', done: true },
        { name: 'Award & contractor mobilisation', date: '2022-06-30', done: true }
      ], attachments: []
    }
  ];

  db.assets = [
    { id: 'A-01', tag: 'AST-HVAC-001', name: 'Chiller Unit 1 (Carrier 400TR)', category: 'HVAC', location: 'Tower A — Central Plant Room', status: 'Operational', criticality: 'Critical', install: '2019-03-01', warranty: '2027-03-01', vendor: 'Carrier / chiller contractor', cost: 780000, lifeYears: 20, lastService: '2026-07-04', nextService: '2026-08-04', notes: 'Compressor overhauled in 2024 retrofit.' },
    { id: 'A-02', tag: 'AST-HVAC-002', name: 'Chiller Unit 2 (Carrier 400TR)', category: 'HVAC', location: 'Tower A — Central Plant Room', status: 'Operational', criticality: 'Critical', install: '2019-03-01', warranty: '2027-03-01', vendor: 'Carrier / chiller contractor', cost: 780000, lifeYears: 20, lastService: '2026-07-06', nextService: '2026-08-06', notes: '' },
    { id: 'A-03', tag: 'AST-FLS-001', name: 'Fire Pump Set (Electric + Jockey)', category: 'Fire & Life Safety', location: 'Tower A — Basement Pump Room', status: 'Operational', criticality: 'Critical', install: '2018-11-15', warranty: '2023-11-15', vendor: 'NAFFCO', cost: 210000, lifeYears: 15, lastService: '2026-07-07', nextService: '2026-08-07', notes: 'Weekly churn test logged in CAFM.' },
    { id: 'A-04', tag: 'AST-VT-001', name: 'Elevator Bank 1 (4 cars)', category: 'Vertical Transport', location: 'Tower A — Service Core', status: 'Under Maintenance', criticality: 'High', install: '2018-06-01', warranty: '2023-06-01', vendor: 'OTIS', cost: 1450000, lifeYears: 25, lastService: '2026-08-01', nextService: '2026-08-15', notes: 'Car 3 door operator fault under rectification.' },
    { id: 'A-05', tag: 'AST-ELEC-001', name: 'Standby Generator 1250 kVA', category: 'Electrical', location: 'Tower B — Generator Yard', status: 'Operational', criticality: 'Critical', install: '2020-01-10', warranty: '2025-01-10', vendor: 'Cummins', cost: 1250000, lifeYears: 20, lastService: '2026-07-11', nextService: '2026-08-11', notes: 'Monthly load test at 80% rated load.' },
    { id: 'A-06', tag: 'AST-PLB-001', name: 'Pool Filtration & Dosing Unit', category: 'Plumbing', location: 'Amenity Deck — Pool Plant', status: 'Operational', criticality: 'Medium', install: '2016-05-01', warranty: '2019-05-01', vendor: 'Hayward', cost: 145000, lifeYears: 12, lastService: '2026-07-20', nextService: '2026-08-20', notes: 'Replacement business case drafted for FY27.' },
    { id: 'A-07', tag: 'AST-BMS-001', name: 'BMS Head-End & Controllers', category: 'Controls / BMS', location: 'Tower A — FM Office / Risers', status: 'Operational', criticality: 'High', install: '2023-08-01', warranty: '2026-08-01', vendor: 'Honeywell', cost: 860000, lifeYears: 12, lastService: '2026-07-02', nextService: '2026-09-02', notes: 'Phase-2 integration completed Jan 2024.' },
    { id: 'A-08', tag: 'AST-ELEC-002', name: 'Main LV Switchgear & Panels', category: 'Electrical', location: 'Tower A/B — LV Rooms', status: 'Operational', criticality: 'Critical', install: '2018-04-01', warranty: '2023-04-01', vendor: 'Schneider', cost: 1680000, lifeYears: 25, lastService: '2026-06-18', nextService: '2026-12-18', notes: 'Thermographic survey done annually.' },
    { id: 'A-09', tag: 'AST-FLS-002', name: 'Addressable Fire Alarm Panel', category: 'Fire & Life Safety', location: 'Tower A — Security Control Room', status: 'Under Maintenance', criticality: 'Critical', install: '2018-09-01', warranty: '2023-09-01', vendor: 'Honeywell Gent', cost: 320000, lifeYears: 15, lastService: '2026-08-02', nextService: '2026-08-16', notes: 'Being replaced under DCD upgrade project P-1003.' },
    { id: 'A-10', tag: 'AST-PLB-002', name: 'Domestic Water Booster Pumps', category: 'Plumbing', location: 'Tower B — Wet Riser Room', status: 'Operational', criticality: 'High', install: '2019-07-15', warranty: '2024-07-15', vendor: 'Grundfos', cost: 185000, lifeYears: 15, lastService: '2026-07-25', nextService: '2026-08-25', notes: '' },
    { id: 'A-11', tag: 'AST-ELEC-003', name: 'UPS System 200 kVA', category: 'Electrical', location: 'Tower A — Server Room', status: 'Operational', criticality: 'High', install: '2019-02-01', warranty: '2024-02-01', vendor: 'Eaton', cost: 240000, lifeYears: 12, lastService: '2026-07-15', nextService: '2026-10-15', notes: 'Battery string due for replacement in 2027.' },
    { id: 'A-12', tag: 'AST-HVAC-003', name: 'AHU Set — Levels 1-8', category: 'HVAC', location: 'Tower A — AHU Rooms', status: 'Operational', criticality: 'High', install: '2018-08-01', warranty: '2021-08-01', vendor: 'Zamil', cost: 540000, lifeYears: 18, lastService: '2026-07-30', nextService: '2026-08-30', notes: 'Filter and belt schedule per PPM.' },
    { id: 'A-13', tag: 'AST-LIFT-002', name: 'Service Lift (Tower B)', category: 'Vertical Transport', location: 'Tower B — Core', status: 'Faulty', criticality: 'High', install: '2018-06-01', warranty: '2023-06-01', vendor: 'KONE', cost: 420000, lifeYears: 25, lastService: '2026-08-02', nextService: '2026-08-05', notes: 'Door interlock reported 2 Aug; vendor attending.' },
    { id: 'A-14', tag: 'AST-ELEC-004', name: 'Common Area Lighting Controls', category: 'Electrical', location: 'Podium & Car Parks', status: 'Operational', criticality: 'Medium', install: '2023-08-01', warranty: '2026-08-01', vendor: 'Philips / Dynalite', cost: 320000, lifeYears: 12, lastService: '2026-06-28', nextService: '2026-09-28', notes: 'Schedules tied to BMS occupancy logic.' },
    { id: 'A-15', tag: 'AST-MISC-001', name: 'Gym & Pool Equipment Set', category: 'Amenity', location: 'Amenity Deck', status: 'Operational', criticality: 'Low', install: '2020-10-01', warranty: '2023-10-01', vendor: 'Technogym', cost: 260000, lifeYears: 8, lastService: '2026-07-18', nextService: '2026-09-18', notes: 'Refurbishment included in P-1002 scope.' },
    { id: 'A-16', tag: 'AST-FLS-003', name: 'Wet Riser & Sprinkler System', category: 'Fire & Life Safety', location: 'Tower A & B — Risers', status: 'Operational', criticality: 'Critical', install: '2018-09-01', warranty: '2023-09-01', vendor: 'NAFFCO', cost: 680000, lifeYears: 20, lastService: '2026-07-09', nextService: '2026-08-09', notes: 'Quarterly flow test recorded.' }
  ];

  db.maintenance = [
    { id: 'WO-201', title: 'Chiller Unit 1 — Monthly PPM', type: 'Preventive', asset: 'Chiller Unit 1 (Carrier 400TR)', assetId: 'A-01', tech: 'Bikash Rai', priority: 'High', date: '2026-08-04', due: '2026-08-04', status: 'Scheduled', cost: 0, notes: 'Compressor amps, condenser approach, oil analysis.' },
    { id: 'WO-202', title: 'Fire Pump Set — Weekly Churn Test', type: 'Preventive', asset: 'Fire Pump Set (Electric + Jockey)', assetId: 'A-03', tech: 'Suresh KC', priority: 'Critical', date: '2026-08-07', due: '2026-08-07', status: 'Scheduled', cost: 0, notes: 'Record pressure at churn and 100% flow.' },
    { id: 'WO-203', title: 'Elevator Bank 1 — Car 3 Door Fault', type: 'Reactive', asset: 'Elevator Bank 1 (4 cars)', assetId: 'A-04', tech: 'OTIS Vendor', priority: 'High', date: '2026-08-01', due: '2026-08-03', status: 'In Progress', cost: 4200, notes: 'Door operator PCB suspected; resident notice issued.' },
    { id: 'WO-204', title: 'Generator 1250 kVA — Monthly Load Test', type: 'Preventive', asset: 'Standby Generator 1250 kVA', assetId: 'A-05', tech: 'Bikash Rai', priority: 'High', date: '2026-08-11', due: '2026-08-11', status: 'Scheduled', cost: 0, notes: '30-minute run at 80% load; coolant and fuel check.' },
    { id: 'WO-205', title: 'Service Lift Tower B — Door Interlock', type: 'Reactive', asset: 'Service Lift (Tower B)', assetId: 'A-13', tech: 'KONE Vendor', priority: 'Critical', date: '2026-08-02', due: '2026-08-02', status: 'Overdue', cost: 0, notes: 'Lift locked off; vendor attendance overdue — escalated.' },
    { id: 'WO-206', title: 'Fire Alarm Panel — Loop Diagnostics', type: 'Reactive', asset: 'Addressable Fire Alarm Panel', assetId: 'A-09', tech: 'Honeywell Gent', priority: 'Critical', date: '2026-08-02', due: '2026-08-06', status: 'In Progress', cost: 9500, notes: 'Loop 3 intermittent faults pre-replacement.' },
    { id: 'WO-207', title: 'AHU Set — Filter & Belt Replacement', type: 'Preventive', asset: 'AHU Set — Levels 1-8', assetId: 'A-12', tech: 'MEP Team', priority: 'Medium', date: '2026-07-30', due: '2026-07-30', status: 'Completed', cost: 6800, notes: 'All 12 AHUs completed; filters logged.' },
    { id: 'WO-208', title: 'Pool Dosing Controller — Calibration', type: 'Preventive', asset: 'Pool Filtration & Dosing Unit', assetId: 'A-06', tech: 'Suresh KC', priority: 'Medium', date: '2026-07-20', due: '2026-07-20', status: 'Completed', cost: 1200, notes: 'pH and ORP probes calibrated.' },
    { id: 'WO-209', title: 'Podium Leak — Temporary Diversion', type: 'Reactive', asset: 'Podium Waterproofing', assetId: '', tech: 'Waterproofing specialist', priority: 'High', date: '2026-06-28', due: '2026-06-29', status: 'Completed', cost: 14500, notes: 'Interim diversion; permanent works on hold (P-1005).' },
    { id: 'WO-210', title: 'UPS Battery String — Capacity Test', type: 'Preventive', asset: 'UPS System 200 kVA', assetId: 'A-11', tech: 'Eaton Vendor', priority: 'Medium', date: '2026-08-18', due: '2026-08-18', status: 'Scheduled', cost: 3200, notes: 'Discharge test to confirm string health before 2027 replacement.' },
    { id: 'WO-211', title: 'LV Switchgear — Thermographic Survey', type: 'Preventive', asset: 'Main LV Switchgear & Panels', assetId: 'A-08', tech: 'Third-party thermography', priority: 'High', date: '2026-08-25', due: '2026-08-25', status: 'Scheduled', cost: 7400, notes: 'Annual survey; shutdown not required.' },
    { id: 'WO-212', title: 'Common Area Lighting — Schedule Review', type: 'Preventive', asset: 'Common Area Lighting Controls', assetId: 'A-14', tech: 'Dynalite Vendor', priority: 'Low', date: '2026-09-28', due: '2026-09-28', status: 'Scheduled', cost: 0, notes: 'Align schedules with occupancy and daylight hours.' }
  ];

    db.awards = [
    { id: uid('aw'), title: 'NEBOSH Award in Health & Safety at Work', issuer: 'DAMAC / NEBOSH', year: '2020', date: '2020-01-03', category: 'Award', desc: 'Conferred on 03 Jan 2020 in DAMAC for exceptional occupational safety and site risk control.' },
    { id: uid('aw'), title: 'DAMAC Appreciation Award', issuer: 'DAMAC Hotel & Resorts', year: '2021', date: '2021-04-15', category: 'Award', desc: 'Corporate recognition for outstanding engineering operations, building reliability and asset care.' },
    { id: uid('aw'), title: 'Employee Of Month Award', issuer: 'Green Point Technical Services', year: '2016', date: '2016-08-20', category: 'Award', desc: 'Awarded for outstanding performance, excellent services & dedication in technical facility operations.' },
    { id: uid('aw'), title: "D'crowned For The Month Appreciation Award", issuer: 'DAMAC Hotel & Resorts', year: '2019', date: '2019-11-10', category: 'Award', desc: 'Prestigious hospitality award for exceptional customer satisfaction and engineering responsiveness.' },
    { id: uid('aw'), title: 'Employee of Month Award', issuer: 'LOAMS (Luxury Owner Association Management)', year: '2023', date: '2023-05-18', category: 'Award', desc: 'Awarded for outstanding performance, excellent services and dedication in owner association management.' }
  ];

  db.certifications = [
    { id: uid('c'), name: 'M-100: The Essentials of Management Community Association', issuer: 'CAI (Community Associations Institute)', year: '2022', date: '2022-06-01', credential: 'M-100 Certified', status: 'Active', category: 'Certification', skills: ['Community Association Management', 'Facilities Management'] },
    { id: uid('c'), name: 'NEBOSH Award in International General Certificate', issuer: 'NEBOSH (undertaken at DAMAC)', year: '2021', date: '2021-01-20', credential: 'IGC Certified', status: 'Active', category: 'Certification', skills: ['Health, Safety & Environment', 'ISO 45001'] },
    { id: uid('c'), name: 'Certified Facility Manager (CFM)', issuer: 'MEFMA (Middle East Facility Management Association)', year: 'Certified', date: '2023-03-15', credential: 'MEFMA Certified', status: 'Active', category: 'Certification', skills: ['Facilities Management', 'Asset Management'] },
    { id: uid('c'), name: 'Level - 1 Fire Warden Certificate', issuer: 'DCD (Dubai Civil Defence)', year: 'Certified', date: '2020-09-12', credential: 'Fire Warden DCD', status: 'Active', category: 'Certification', skills: ['Fire & Life Safety', 'Emergency Response'] },
    { id: uid('c'), name: 'Level – 2 First Aid Training Certificate', issuer: 'DCD Training Center Dubai', year: 'Certified', date: '2020-10-05', credential: 'DCD First Aid Level 2', status: 'Active', category: 'Certification', skills: ['Health & Safety', 'First Aid'] },
    { id: uid('c'), name: 'TOT (Training of Trainers)', issuer: 'CTEVT (Council for Technical Education & Vocational Training)', year: '2013', date: '2013-02-07', credential: 'CTEVT Certified Trainer', status: 'Active', category: 'Training', skills: ['Team Leadership', 'Technical Coaching'] },
    { id: uid('c'), name: 'Diploma in Hardware & Networking', issuer: "Master Mind Int'l Education", year: '2011', date: '2011-07-31', credential: '18-Month Diploma', status: 'Active', category: 'Training', skills: ['Hardware', 'Networking', 'IT Infrastructure'] },
    { id: uid('c'), name: 'Diploma in Application Programming', issuer: "Master Mind Int'l Education", year: '2011', date: '2011-01-31', credential: '12-Month Diploma', status: 'Active', category: 'Training', skills: ['Programming', 'Database Administration'] },
    { id: uid('c'), name: 'Light Motor Vehicle Driving License', issuer: 'UAE Government', year: '2017', date: '2017-01-17', credential: 'UAE License 17-Jan-2017', status: 'Active', category: 'Licence', skills: ['Emergency Dispatch', 'Multi-Site Mobility'] }
  ];

  db.education = [
    { id: uid('e'), degree: 'B.Tech. (Electrical Engineering)', institution: 'Manav Bharti University', location: 'Himachal Pradesh, India', year: '2018', grade: '', notes: 'Four-year Electrical Engineering degree underpinning high-voltage substations, central chiller plants, MEP operations and BMS telemetry.' },
    { id: uid('e'), degree: 'Diploma (Electrical & Electronics Engineering)', institution: 'Purwanachal Engineering Campus', location: 'Dharan, Nepal (Attested by UAE Embassy)', year: '2007', grade: '', notes: 'Three-year engineering diploma officially attested by the UAE Embassy for formal UAE engineering and FM credential recognition.' }
  ];

  db.testimonials = [
    { id: uid('t'), name: 'Property Director', role: 'Aldar Residential Portfolio', rating: 5, date: '2026-05-12', approved: true, text: 'Arjun brought our reactive maintenance back under control within two quarters. Owners noticed the difference immediately, and the reporting discipline he introduced is now the portfolio standard.' },
    { id: uid('t'), name: 'Development Manager', role: 'Deyaar', rating: 5, date: '2024-08-20', approved: true, text: 'Meticulous with compliance documentation and always ahead of Civil Defence audits. He manages budgets the way an owner would.' },
    { id: uid('t'), name: 'MEP Contractor Lead', role: 'Chiller Retrofit Programme', rating: 4, date: '2024-07-02', approved: true, text: 'Clear scopes, fair bid evaluations and a genuine understanding of the systems he manages. Site coordination was among the smoothest we have worked with.' },
    { id: uid('t'), name: 'Owners Association Chairman', role: 'Tower A & B', rating: 5, date: '2025-11-08', approved: true, text: 'Transparent communication through a difficult waterproofing issue. He explained the options, the cost implications and the risk — and then delivered.' },
    { id: uid('t'), name: 'Senior Facilities Manager', role: 'DAMAC Hotel & Resorts', rating: 5, date: '2021-06-15', approved: true, text: 'Reliable, hands-on and calm under pressure. Arjun was the person we sent to assets that needed to be turned around.' }
  ];

  db.blog = [
    {
      id: uid('b'), title: 'Building a PPM Calendar That Survives a Dubai Summer', category: 'Maintenance Strategy',
      date: '2026-07-14', author: 'Arjun Singh', tags: ['PPM', 'HVAC', 'Summer'], published: true, readMins: 6,
      excerpt: 'Chiller loading peaks between June and September. If your preventive calendar treats those months like any other, you have already lost control of the season.',
      body: 'The single most common PPM design flaw I see in UAE residential towers is a flat annual schedule. Chiller plants, pumps and AHUs do not experience a flat year — they experience a load curve that roughly doubles between June and September.\n\nStart by shifting inspection density, not inspection count. Condenser cleaning, water treatment verification and approach-temperature checks should be weekly during peak and fortnightly outside it. Keep statutory tests exactly where the authority requires them and move everything else around that spine.\n\nSecond, protect the shutdown window. PPM that needs a plant shutdown should be scheduled outside peak so you are never choosing between maintenance and resident comfort. Build a two-week float into the calendar so a failed attempt does not cascade.\n\nFinally, report the season, not the month. A one-page peak-readiness summary — plant availability, approach temperatures, water quality, outstanding defects — gives owners something they can actually act on.'
    },
    {
      id: uid('b'), title: 'Civil Defence Readiness: What Actually Gets Audited', category: 'Compliance',
      date: '2026-06-02', author: 'Arjun Singh', tags: ['Civil Defence', 'Fire Safety', 'DCD'], published: true, readMins: 5,
      excerpt: 'Most failed inspections are not failures of equipment. They are failures of evidence — the system works, but the record does not prove it.',
      body: 'When Civil Defence attends, they are assessing two things: is the system functional, and can you demonstrate that it has been maintained in accordance with the approved design?\n\nThat second question is where facilities teams lose time. Keep the cause-and-effect matrix current with every modification — the moment you move a detector, the matrix is stale. Log every weekly churn test with pressures, not just a tick. Retain the DCD-approved drawings with revision numbers matching the as-built installation.\n\nFire warden and evacuation drill records should be dated, signed and cross-referenced to training certificates. Where a contractor performed works, keep their DCD approval documentation alongside your own records.\n\nDo this and the inspection becomes a records review rather than a defence.'
    },
    {
      id: uid('b'), title: 'CAFM Data Discipline: Why Your Asset Register Is Lying to You', category: 'CAFM & Data',
      date: '2026-04-18', author: 'Arjun Singh', tags: ['CAFM', 'Asset Register', 'Data'], published: true, readMins: 7,
      excerpt: 'A CAFM system is only as good as the naming convention behind it. Duplicate assets and orphaned work orders quietly destroy your reporting credibility.',
      body: 'I have opened asset registers containing three separate entries for the same chiller, each with a different installation date. The plant is the same; the records are not. Any capital planning built on that register is guesswork.\n\nFix the foundation first: one tagging convention, one naming standard, one location hierarchy. Asset tags should be physically affixed and physically verifiable — if the tag exists only in software, it will drift.\n\nThen close the loop between work orders and assets. Every work order references an asset ID. If the dropdown allows free text, someone will use it.\n\nWith clean links you can answer the questions that matter to owners: cost per asset, failure frequency, mean time between failures, and replacement forecast. That is when CAFM stops being an administrative burden and starts being a decision tool.'
    },
    {
      id: uid('b'), title: 'Writing an Owner-Association Budget a Non-Technical Board Will Approve', category: 'Budgeting',
      date: '2026-02-26', author: 'Arjun Singh', tags: ['Budget', 'Owners Association', 'Service Charge'], published: true, readMins: 6,
      excerpt: 'Boards approve clarity, not spreadsheets. Present the risk, the cost of inaction and the phasing — in that order.',
      body: 'Facilities budgets are usually rejected for one reason: the board cannot see the consequence of not spending. A line item called "chiller overhaul — AED 180,000" competes poorly against a lower service charge.\n\nLead with condition and risk. Show the asset, its age against expected life, the failure consequence, and the likelihood. Photographs of a scaled condenser do more work than any spreadsheet.\n\nThen give the numbers three ways: the full scope, a phased approach, and the do-nothing scenario with its expected cost. Boards will often choose the phased option — which is a win, because it is funded and it starts.\n\nFinally, report actual against budget monthly, and flag variance immediately rather than at year end. Credibility on small numbers buys authority on large ones.'
    },
    {
      id: uid('b'), title: 'The 24×7 Mindset: Structuring an FM Team That Does Not Burn Out', category: 'Leadership',
      date: '2026-01-20', author: 'Arjun Singh', tags: ['Leadership', 'Team', 'Operations'], published: true, readMins: 5,
      excerpt: 'Round-the-clock coverage is a system design problem before it is a rostering problem. Get escalation right and the night shift stops calling you.',
      body: 'A 24×7 operation fails in predictable ways: unclear escalation, undocumented procedures, and a supervisor who becomes the single point of knowledge.\n\nWrite the escalation matrix with names, thresholds and timeframes. Define what may be handled in-house overnight and what must wake a manager. Publish it where staff actually look.\n\nInvest in the first responder. A technician who can read a BMS alarm, isolate a pump safely and communicate clearly to a resident prevents most escalations. Training here pays back immediately.\n\nRotate the roster with the load, not the calendar. Give the people who carry the peak months their leave outside it — and say so in advance, so it feels like a plan rather than a favour.'
    },
    {
      id: uid('b'), title: 'Vendor Performance Reviews That Change Behaviour', category: 'Contracts',
      date: '2025-12-05', author: 'Arjun Singh', tags: ['SLA', 'Vendor', 'Contracts'], published: true, readMins: 5,
      excerpt: 'A monthly review that only discusses complaints is a complaint meeting. Structure it around KPI evidence and it becomes a performance tool.',
      body: 'Effective vendor management starts with KPIs that are measurable from your own data, not the vendor report. Response time, first-time fix rate, PPM completion, repeat failures on the same asset, and safety observations are all defensible and hard to dispute.\n\nCirculate the scorecard before the meeting. Discussion should interpret the numbers, not discover them.\n\nSeparate the conversation into three parts: what the data says, what the site says, and what changes next month with owners and dates. End every review with written actions.\n\nFinally, use the incentive structure you wrote. If the contract only penalises, you will get compliance. If it recognises sustained performance, you get cooperation.'
    }
  ];

  db.messages = [
    { id: uid('m'), name: 'Fatima Al Mansoori', email: 'f.almansoori@example.ae', company: 'Aldar Communities', subject: 'Senior FM role — Abu Dhabi portfolio', message: 'Good afternoon Arjun. We are recruiting for a Senior Facilities Manager covering a mixed-use portfolio. Your Aldar experience is directly relevant. Would you be open to a conversation this week?', date: '2026-08-01T09:14:00.000Z', read: false, source: 'portfolio' },
    { id: uid('m'), name: 'Daniel Okafor', email: 'd.okafor@fmcontractor.example', company: 'Emrill', subject: 'Chiller retrofit reference', message: 'We are bidding for a chiller retrofit and would value a reference on your Tower A project — particularly the energy savings methodology you used.', date: '2026-07-29T14:02:00.000Z', read: true, source: 'portfolio' }
  ];

  db.notifications = [
    { id: uid('n'), title: 'Work order overdue', msg: 'WO-205 Service Lift Tower B door interlock has passed its due date.', type: 'danger', date: '2026-08-02T06:00:00.000Z', read: false, panel: 'maintenance' },
    { id: uid('n'), title: 'PPM due in 2 days', msg: 'WO-204 Generator monthly load test is due on 11 Aug 2026.', type: 'warn', date: '2026-08-02T05:00:00.000Z', read: false, panel: 'maintenance' },
    { id: uid('n'), title: 'Project milestone', msg: 'Fire Alarm System Upgrade — DCD drawing approval completed.', type: 'info', date: '2026-07-31T11:20:00.000Z', read: true, panel: 'projects' },
    { id: uid('n'), title: 'New enquiry', msg: 'Fatima Al Mansoori submitted an enquiry about a Senior FM role.', type: 'ok', date: '2026-08-01T09:14:00.000Z', read: false, panel: 'contact' }
  ];

  db.activity = [
    { id: uid('a'), msg: 'Portfolio platform initialised with CV dataset', user: 'System', ts: nowISO(), kind: 'system' },
    { id: uid('a'), msg: 'Admin logged in', user: 'Admin', ts: nowISO(), kind: 'auth' }
  ];
  return db;
}
