const root = document.documentElement;
const themeButton = document.querySelector('#theme');
document.querySelectorAll('[data-icon]').forEach(icon => icon.style.setProperty('--icon', `url("assets/icons/${icon.dataset.icon}.svg")`));
let preferredTheme;
try { preferredTheme = localStorage.getItem('kiran-theme'); } catch { /* Storage may be blocked by the browser. */ }
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(theme) {
  root.dataset.theme = theme;
  themeButton.querySelector('.theme-label').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  themeButton.querySelector('.icon').style.setProperty('--icon', `url("assets/icons/${theme === 'dark' ? 'sun' : 'moon'}.svg")`);
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}
applyTheme(preferredTheme === 'light' || preferredTheme === 'dark' ? preferredTheme : systemTheme.matches ? 'dark' : 'light');
themeButton.addEventListener('click', () => {
  preferredTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(preferredTheme);
  try { localStorage.setItem('kiran-theme', preferredTheme); } catch { /* The selected theme still works for this visit. */ }
});
systemTheme.addEventListener('change', event => { if (!preferredTheme) applyTheme(event.matches ? 'dark' : 'light'); });
document.querySelector('#year').textContent = new Date().getFullYear();
if ('IntersectionObserver' in window) {
  root.classList.add('js');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
import('./scene.js').catch(() => {
  document.querySelector('#scene-status').textContent = '3D is unavailable in this browser. Enjoy the interior concept instead.';
  document.querySelector('#drag-hint').textContent = 'Illustrative concept';
});
const toolDescriptions = [
  ['3ds Max', 'Architectural and furniture modelling, scene composition and material mapping.'],
  ['V-Ray', 'Interior lighting, material development and presentation rendering.'],
  ['Photoshop', 'Image editing, render post-production and compositing.'],
  ['IMOS iX CAD', 'Modular cabinet development, standard configurations and factory-ready detailing.'],
  ['Cut Rite', 'Part of my cabinetry and production software toolkit.'],
  ['KCDW', 'Part of my cabinetry and production software toolkit.'],
  ['Adobe Illustrator', 'Additional creative software in my design toolkit.'],
  ['Premiere Pro', 'Additional creative software in my design toolkit.'],
  ['After Effects', 'Additional creative software in my design toolkit.'],
  ['CorelDRAW', 'Additional creative software in my design toolkit.']
];
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
  const [title, description] = toolDescriptions[Number(button.dataset.tool)];
  document.querySelector('#tool-title').textContent = title;
  document.querySelector('#tool-description').textContent = description;
  document.querySelectorAll('[data-tool]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#tools-canvas').dispatchEvent(new CustomEvent('selecttool', { detail: Number(button.dataset.tool) }));
}));
function loadTools() {
  import('./tools-scene.js').catch(() => {
    document.querySelector('.tools-loading').textContent = 'The 3D toolkit is unavailable in this browser. Explore each tool below.';
  });
}
if ('IntersectionObserver' in window) {
  const toolsObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { toolsObserver.disconnect(); loadTools(); }
  }, { rootMargin: '400px' });
  toolsObserver.observe(document.querySelector('#tools-canvas'));
} else loadTools();
