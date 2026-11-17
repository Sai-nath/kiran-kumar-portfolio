const root = document.documentElement;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const setIcon = (el, name) => el.style.setProperty('--icon', `url("assets/icons/${name}.svg")`);
$$('[data-icon]').forEach(icon => setIcon(icon, icon.dataset.icon));
$('#year').textContent = new Date().getFullYear();

// ---------- theme (dark by default, remembers an explicit choice)
const themeButton = $('#theme');
let storedTheme;
try { storedTheme = localStorage.getItem('kiran-theme'); } catch { /* storage can be blocked */ }
function applyTheme(theme) {
  root.dataset.theme = theme;
  const next = theme === 'dark' ? 'light' : 'dark';
  setIcon(themeButton.querySelector('.icon'), theme === 'dark' ? 'sun' : 'moon');
  themeButton.setAttribute('aria-label', `Switch to ${next} mode`);
  $('meta[name="theme-color"]').content = theme === 'dark' ? '#0b0b0d' : '#efeae1';
}
applyTheme(storedTheme === 'light' ? 'light' : 'dark');
themeButton.addEventListener('click', () => {
  const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('kiran-theme', theme); } catch { /* still applies for this visit */ }
});

// ---------- header: solid after scrolling, mobile menu
const header = $('#header'), menu = $('#menu');
function setMenu(open) {
  header.dataset.open = String(open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menu.addEventListener('click', () => setMenu(header.dataset.open !== 'true'));
$$('#nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', event => { if (event.key === 'Escape' && header.dataset.open === 'true') { setMenu(false); menu.focus(); } });

// ---------- hero chapters: scroll position drives the 3D scene and the copy
const hero = $('.hero'), tabs = $$('[data-goto]');
let chapter = -1;
const scrubbed = () => !reduced.matches && !root.classList.contains('no-webgl');
function setProgress(p) {
  hero.progress = p; // ponytail: read each frame by scene.js; an event bus would add nothing here
  const next = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
  if (next === chapter) return;
  chapter = next;
  hero.dataset.chapter = next;
  tabs.forEach((tab, i) => tab.setAttribute('aria-current', i === next ? 'step' : 'false'));
}
function onScroll() {
  header.classList.toggle('scrolled', scrollY > 30);
  if (!scrubbed()) return;
  const r = hero.getBoundingClientRect(), span = r.height - innerHeight;
  setProgress(span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0);
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
addEventListener('resize', onScroll);
tabs.forEach((tab, i) => tab.addEventListener('click', () => {
  if (!scrubbed()) return setProgress(i / 2);
  const span = hero.offsetHeight - innerHeight;
  scrollTo({ top: hero.offsetTop + span * (i / 2) + (i ? 2 : 0), behavior: 'smooth' });
}));
reduced.addEventListener('change', onScroll);
setProgress(0); onScroll();

// ---------- reveal-on-scroll and counters
if ('IntersectionObserver' in window) {
  root.classList.add('js');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
    const counter = entry.target.querySelector('[data-count]');
    if (counter && !reduced.matches) countUp(counter);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => observer.observe(el));
}
function countUp(el) {
  const end = Number(el.dataset.count), start = performance.now(), format = n => Math.round(n).toLocaleString('en-US');
  const step = now => {
    const t = Math.min(1, (now - start) / 1400);
    el.textContent = format(end * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- toolkit picker (works with or without 3D)
const toolInfo = [
  ['3ds Max', '3D & rendering', 'Architectural, interior and furniture modelling, scene composition and material mapping. Hands-on from 2015 to 2022.'],
  ['V-Ray', '3D & rendering', 'Interior lighting, materials and presentation renders for kitchens, wardrobes and residential spaces.'],
  ['Photoshop', '3D & rendering', 'Image editing, render post-production and compositing.'],
  ['IMOS iX CAD', 'Cabinetry & production', 'Modular cabinet development, standard configurations and factory-ready detailing. 62,000+ cabinet modules created and managed at Livspace.'],
  ['Cut Rite', 'Cabinetry & production', 'Panel cutting and production software, part of my cabinetry and production toolkit.'],
  ['KCDW', 'Cabinetry & production', 'Cabinet design software, part of my cabinetry and production toolkit.'],
  ['Adobe Illustrator', 'Additional software', 'Vector illustration and layout. Listed in my resume as additional software.'],
  ['Premiere Pro', 'Additional software', 'Video editing. Listed in my resume as additional software.'],
  ['After Effects', 'Additional software', 'Motion graphics and compositing. Listed in my resume as additional software.'],
  ['CorelDRAW', 'Additional software', 'Vector graphics and layout. Listed in my resume as additional software.'],
];
const toolButtons = $$('[data-tool]');
toolButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    const [title, category, description] = toolInfo[index];
    $('#tool-title').textContent = title;
    $('#tool-category').textContent = category;
    $('#tool-description').textContent = description;
    toolButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('#tools-canvas').dispatchEvent(new CustomEvent('selecttool', { detail: index }));
  });
  button.addEventListener('keydown', event => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = toolButtons[(index + move + toolButtons.length) % toolButtons.length];
    next.focus(); next.click();
  });
});

// ---------- 3D: load only where WebGL works, otherwise keep the labelled image fallback
function hasWebGL() {
  if (new URLSearchParams(location.search).has('fallback')) return false; // manual check of the no-3D path
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
function heroFallback(message) {
  root.classList.add('no-webgl');
  $('#scene-status').textContent = message;
  $('#drag-hint').textContent = 'AI-generated concept shown';
  $$('.scene-toolbar button').forEach(button => { button.disabled = true; });
  onScroll();
}
function toolsFallback() {
  $('.tools-loading').textContent = 'The 3D carousel needs WebGL. Choose a tool below to read about it.';
  $('#tools-motion').hidden = true;
}
if (hasWebGL()) {
  import('./scene.js').catch(() => heroFallback('3D could not start in this browser. Showing an AI-generated interior concept instead.'));
  const loadTools = () => import('./tools-scene.js').catch(toolsFallback);
  if ('IntersectionObserver' in window) {
    const toolsObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { toolsObserver.disconnect(); loadTools(); }
    }, { rootMargin: '600px' });
    toolsObserver.observe($('#tools-canvas'));
  } else loadTools();
} else {
  heroFallback('3D is unavailable in this browser. Showing an AI-generated interior concept instead.');
  toolsFallback();
}
