import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const html = readFileSync('dist/index.html', 'utf8');
const css = readFileSync('dist/style.css', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate element IDs');
for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (href.startsWith('#')) assert(ids.includes(href.slice(1)), `Missing anchor ${href}`);
  else if (!/^(https?:|mailto:|tel:|data:)/.test(href)) assert(existsSync(resolve('dist', href)), `Missing asset ${href}`);
}
for (const [, name] of html.matchAll(/data-icon="([^"]+)"/g)) {
  const file = `dist/assets/icons/${name}.svg`;
  assert(existsSync(file), `Missing icon ${name}`);
  assert(readFileSync(file, 'utf8').includes('<svg'), `Invalid SVG ${name}`);
}
assert(existsSync('dist/assets/three.module.js'));
assert(existsSync('dist/assets/OrbitControls.js'));
assert(readFileSync('dist/Kiran-Kumar-Resume.pdf').subarray(0, 5).toString() === '%PDF-');
assert(!/[—–]/.test(html), 'Unexpected typography separators');
assert(css.includes('prefers-reduced-motion'), 'Missing reduced-motion styling');
const manifest = JSON.parse(readFileSync('.openai/hosting.json', 'utf8'));
assert(manifest.project_id && manifest.static.directory === 'dist');
for (const file of ['dist/app.js', 'dist/scene.js', 'dist/tools-scene.js']) execFileSync(process.execPath, ['--check', file]);
assert.equal([...html.matchAll(/data-tool="\d+"/g)].length, 10, 'All ten software tools must remain accessible');
console.log('Passed: local assets, icons, anchors, PDF, hosting manifest, motion fallback and JavaScript syntax.');
