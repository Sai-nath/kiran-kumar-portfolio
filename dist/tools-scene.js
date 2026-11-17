// Toolkit: ten glossy app tiles on a turning carousel. Tool marks and colours are read
// from the accessible buttons in the page, so the DOM stays the single source of truth.
import * as THREE from 'three';
import { RoomEnvironment } from './assets/RoomEnvironment.js';

const host = document.querySelector('#tools-canvas');
const motionButton = document.querySelector('#tools-motion');
const buttons = [...document.querySelectorAll('[data-tool]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const { damp, clamp } = THREE.MathUtils;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.domElement.setAttribute('aria-hidden', 'true');
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
const studio = new RoomEnvironment();
scene.environment = pmrem.fromScene(studio, 0.04).texture;
studio.dispose(); pmrem.dispose();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight('#ffffff', '#30302f', 0.7));
const key = new THREE.DirectionalLight('#fff4e6', 2.2); key.position.set(-4, 6, 8); scene.add(key);
const spot = new THREE.PointLight('#ffffff', 0, 9, 1.4); scene.add(spot);

// Each tile carries the official product logo referenced by its picker button.
const tools = buttons.map(button => {
  const style = getComputedStyle(button);
  return {
    logo: button.querySelector('.logo-plate img').src, kind: button.dataset.kind, caption: button.dataset.caption || '',
    name: button.querySelector('.tool-name').textContent.trim(), bg: style.getPropertyValue('--tb').trim(), fg: style.getPropertyValue('--tf').trim(),
  };
});

// rounded app-tile body
const S = 1.6, R = 0.3, DEPTH = 0.22, BEVEL = 0.07;
const shape = new THREE.Shape();
const h = S / 2 - BEVEL;
shape.moveTo(-h + R, -h); shape.lineTo(h - R, -h); shape.quadraticCurveTo(h, -h, h, -h + R);
shape.lineTo(h, h - R); shape.quadraticCurveTo(h, h, h - R, h); shape.lineTo(-h + R, h);
shape.quadraticCurveTo(-h, h, -h, h - R); shape.lineTo(-h, -h + R); shape.quadraticCurveTo(-h, -h, -h + R, -h);
const tileGeometry = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelSize: BEVEL, bevelThickness: BEVEL, bevelSegments: 6, curveSegments: 16 });
tileGeometry.translate(0, 0, -DEPTH / 2);
const faceGeometry = new THREE.ShapeGeometry(shape, 16);
// ShapeGeometry UVs are in shape units; remap to 0..1 for the canvas face
const uv = faceGeometry.attributes.uv;
for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + h) / (2 * h), (uv.getY(i) + h) / (2 * h));

const loadImage = src => { const img = new Image(); img.src = src; return img.decode().then(() => img); };
// kinds: "tile" = full app icon (fills the face), "icon" = mark centred on a dark tile, "wordmark" = logo on a light ceramic tile
function faceTexture(tool, logo, back = false) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d'), light = tool.kind === 'wordmark';
  if (light) {
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#fcfaf6'); g.addColorStop(1, '#e3dcd1'); x.fillStyle = g;
  } else x.fillStyle = tool.bg;
  x.fillRect(0, 0, 512, 512);
  x.imageSmoothingQuality = 'high';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (back) {
    x.fillStyle = light ? '#2a2723' : tool.fg;
    x.font = '700 58px Manrope, sans-serif'; x.fillText(tool.name, 256, 236, 440);
    x.font = '500 30px Manrope, sans-serif'; x.globalAlpha = 0.65; x.fillText('Kiran Kumar R · toolkit', 256, 300, 440);
  } else if (tool.kind === 'tile') x.drawImage(logo, 0, 0, 512, 512);
  else if (tool.kind === 'icon') x.drawImage(logo, 66, 56, 380, 380);
  else {
    const r = Math.min(400 / logo.naturalWidth, (tool.caption ? 150 : 200) / logo.naturalHeight);
    const w = logo.naturalWidth * r, h = logo.naturalHeight * r, y = tool.caption ? 206 : 256;
    x.drawImage(logo, 256 - w / 2, y - h / 2, w, h);
    if (tool.caption) {
      x.fillStyle = tool.fg; x.fillRect(226, 300, 60, 4);
      x.fillStyle = '#2a2723'; x.font = '700 50px Manrope, sans-serif'; x.fillText(tool.caption, 256, 372, 420);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

await document.fonts.ready;
const logos = await Promise.all(tools.map(tool => loadImage(tool.logo)));
const ring = new THREE.Group(); scene.add(ring);
const step = Math.PI * 2 / tools.length;
const cards = tools.map((tool, i) => {
  const holder = new THREE.Group(); // sits on the ring, faces outward
  const pivot = new THREE.Group(); holder.add(pivot); // animated wobble
  const light = tool.kind === 'wordmark';
  const body = new THREE.Mesh(tileGeometry, new THREE.MeshPhysicalMaterial({ color: tool.bg, metalness: light ? 0 : 0.25, roughness: light ? 0.3 : 0.22, clearcoat: 1, clearcoatRoughness: 0.06 }));
  const map = faceTexture(tool, logos[i]);
  const face = new THREE.Mesh(faceGeometry, new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: light ? 0.1 : 0.3, roughness: 0.3 }));
  face.position.z = DEPTH / 2 + BEVEL + 0.002;
  const backMap = faceTexture(tool, logos[i], true);
  const back = new THREE.Mesh(faceGeometry, new THREE.MeshStandardMaterial({ map: backMap, emissiveMap: backMap, emissive: '#ffffff', emissiveIntensity: light ? 0.08 : 0.22, roughness: 0.3 }));
  back.position.z = -face.position.z; back.rotation.y = Math.PI;
  pivot.add(body, face, back);
  body.userData.index = face.userData.index = back.userData.index = i;
  ring.add(holder);
  return { holder, pivot, hit: [body, face, back], sel: i === 0 ? 1 : 0, glow: new THREE.Color(tool.fg) };
});
// orbit track and soft contact shadow
const track = new THREE.Mesh(new THREE.TorusGeometry(1, 0.004, 6, 220), new THREE.MeshBasicMaterial({ color: '#8f897d', transparent: true, opacity: 0.4 }));
track.rotation.x = Math.PI / 2; scene.add(track);
const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 256;
const sctx = shadowCanvas.getContext('2d'), sg = sctx.createRadialGradient(128, 128, 20, 128, 128, 128);
sg.addColorStop(0, 'rgba(0,0,0,.42)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); sctx.fillStyle = sg; sctx.fillRect(0, 0, 256, 256);
const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);

let selected = Number(document.querySelector('[data-tool][aria-pressed="true"]').dataset.tool);
let angle = -selected * step, target = angle, radius = 4.4, moving = !reduced.matches, intro = reduced.matches ? 1 : 0;
let visible = false, lost = false, frame, elapsed = 0, lastTime = performance.now(), lastSignature = '';
const glowColor = new THREE.Color(tools[selected].fg);

function layout() {
  const w = host.clientWidth, hh = host.clientHeight, small = w < 700;
  renderer.setSize(w, hh, false);
  camera.aspect = w / hh;
  radius = small ? 2.7 : 4.4;
  camera.fov = small ? 34 : 28;
  camera.updateProjectionMatrix();
  cards.forEach(({ holder }, i) => {
    holder.position.set(Math.sin(i * step) * radius, 0, Math.cos(i * step) * radius);
    holder.rotation.y = i * step;
  });
  track.scale.setScalar(radius); track.position.y = -1.25;
  floor.scale.setScalar(radius + 1.8); floor.position.y = -1.3;
  spot.position.set(0, 0.8, radius + 1.7);
  lastSignature = '';
}
// shortest turn so the chosen tile faces the camera
function aim(index) {
  const goal = -index * step;
  target = goal + Math.round((angle - goal) / (Math.PI * 2)) * Math.PI * 2;
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.08); lastTime = now;
  const still = reduced.matches;
  if (moving) elapsed += dt;
  if (!dragging) angle = still ? target : damp(angle, target, 5, dt);
  ring.rotation.y = angle;
  if (intro < 1) intro = Math.min(1, intro + dt * 0.8);
  // scroll transition: the camera rises over the carousel as the section passes
  const r = host.getBoundingClientRect();
  const scrollK = clamp((r.top + r.height / 2 - innerHeight / 2) / innerHeight, -1, 1);
  const camY = 1.5 + scrollK * 1.2;
  camera.position.set(0, camY, radius + (host.clientWidth < 700 ? 6.6 : 8.6));
  camera.lookAt(0, 0.1 + scrollK * 0.2, radius * 0.25);
  cards.forEach((card, i) => {
    card.sel = still ? Number(i === selected) : damp(card.sel, Number(i === selected), 7, dt);
    const t = elapsed + i * 0.75;
    const k = THREE.MathUtils.smoothstep(intro * 1.6 - i * 0.06, 0, 1);
    card.holder.position.y = (1 - k) * -3 + Math.sin(t * 0.9) * 0.08 * Number(moving) + card.sel * 0.22;
    card.holder.scale.setScalar(Math.max(0.001, k) * (1 + card.sel * 0.2));
    card.pivot.rotation.set(Math.sin(t * 0.6) * 0.07 - 0.06, Math.sin(t * 0.5) * 0.16 + card.sel * Math.sin(elapsed * 1.3) * 0.2 * Number(moving), Math.cos(t * 0.7) * 0.03);
  });
  glowColor.lerp(new THREE.Color(tools[selected].fg), still ? 1 : 1 - Math.exp(-6 * dt));
  spot.color.copy(glowColor); spot.intensity = 9 * intro;
  const signature = [angle, camY, intro, ...cards.map(c => c.sel)].map(n => n.toFixed(4)).join() + moving + dragging;
  if (moving || signature !== lastSignature) { renderer.render(scene, camera); lastSignature = signature; }
  frame = requestAnimationFrame(tick);
}
function loop() {
  cancelAnimationFrame(frame);
  if (visible && !document.hidden && !lost) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
}

// selection comes from the buttons (app.js updates text and pressed state, then notifies us)
host.addEventListener('selecttool', event => { selected = event.detail; aim(selected); });
function updateMotionButton() {
  motionButton.setAttribute('aria-pressed', String(!moving));
  motionButton.querySelector('.icon').style.setProperty('--icon', `url("assets/icons/${moving ? 'pause' : 'play'}.svg")`);
}
motionButton.addEventListener('click', () => { moving = !moving; updateMotionButton(); });
reduced.addEventListener('change', () => { moving = !reduced.matches; updateMotionButton(); });

// drag to spin, release to snap; click a tile to choose it
const canvas = renderer.domElement, raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
let dragging = false, startX = 0, lastX = 0, moved = 0;
function tileAt(event) {
  const b = canvas.getBoundingClientRect();
  ndc.set((event.clientX - b.left) / b.width * 2 - 1, -(event.clientY - b.top) / b.height * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects(cards.flatMap(c => c.hit))[0]?.object.userData.index;
}
canvas.addEventListener('pointerdown', event => {
  dragging = true; startX = lastX = event.clientX; moved = 0;
  if (event.pointerType === 'mouse') canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!dragging) { if (event.pointerType === 'mouse') canvas.style.cursor = tileAt(event) === undefined ? 'grab' : 'pointer'; return; }
  const dx = event.clientX - lastX; lastX = event.clientX; moved += Math.abs(dx);
  angle += dx * (host.clientWidth < 700 ? 0.009 : 0.005); target = angle;
});
function release(event) {
  if (!dragging) return;
  dragging = false;
  if (moved < 6 && event.type === 'pointerup') {
    const index = tileAt(event);
    if (index !== undefined) { buttons[index].click(); return; }
  }
  const index = ((Math.round(-angle / step) % tools.length) + tools.length) % tools.length;
  if (index !== selected) buttons[index].click(); else aim(index);
}
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); lost = true; cancelAnimationFrame(frame); canvas.hidden = true;
  const note = document.querySelector('.tools-loading'); note.hidden = false;
  note.textContent = '3D paused by the browser. Reload to restore the carousel, or choose a tool below.';
  motionButton.disabled = true;
});
new ResizeObserver(layout).observe(host);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; loop(); }).observe(host);
document.addEventListener('visibilitychange', loop);

layout(); aim(selected); angle = target;
updateMotionButton(); motionButton.disabled = false;
document.querySelector('.tools-loading').hidden = true;
host.dataset.ready = 'true';
loop();
