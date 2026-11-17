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
