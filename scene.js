import * as THREE from 'three';
import { OrbitControls } from './assets/OrbitControls.js';

const container = document.querySelector('#scene');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.domElement.setAttribute('aria-hidden', 'true');
container.appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 100);
camera.position.set(8, 7.5, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.1, 0);
controls.enablePan = false;
controls.enableZoom = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 2.35;
controls.minAzimuthAngle = 0.15;
controls.maxAzimuthAngle = 1.2;
controls.autoRotateSpeed = 0.6;
// Keep single-finger vertical scrolling available on touch screens.
controls.touches.ONE = THREE.TOUCH.PAN;
controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
controls.update();
controls.saveState();

scene.add(new THREE.HemisphereLight(0xf0f3ff, 0x515e79, 2));
const sun = new THREE.DirectionalLight(0xfff0e1, 3.2);
sun.position.set(3, 8, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 25 });
sun.shadow.normalBias = 0.04;
sun.shadow.bias = -0.0002;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xd3e4ef, 1.4);
fill.position.set(-4, 4, -2);
scene.add(fill);

function material(color, roughness = 0.8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
const cabinet = material('#d9826f');
const wall = material('#d6d0bf');
const wood = material('#a97a52');
const woodDark = material('#68513b');
const stone = material('#d1cabc');
const metal = material('#282f2a', 0.4, 0.55);
const cream = material('#e9e2d0');
const glass = material('#38423d', 0.23, 0.35);
const leafMaterial = material('#5e7952');
const room = new THREE.Group();
scene.add(room);

function box(w, h, d, x, y, z, mat, parent = room) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function cylinder(top, bottom, h, x, y, z, mat, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, h, segments), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  room.add(mesh);
  return mesh;
}
function sphere(radius, x, y, z, mat) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  room.add(mesh);
  return mesh;
}

// The room is an illustrative portfolio interaction, not a reconstruction of a client project.
box(6.5, 0.22, 5.05, 0, -0.13, 0, material('#65799b'));
box(6.25, 0.09, 4.82, 0, 0.025, 0, wood);
for (let i = 0; i < 16; i++) {
  const plank = material(i % 3 === 0 ? '#b79b74' : i % 3 === 1 ? '#bfa17c' : '#b39773');
  box(0.382, 0.025, 4.78, -2.93 + i * 0.39, 0.085, 0, plank);
}
box(6.25, 2.95, 0.12, 0, 1.55, -2.4, wall);
// A low side wall keeps the room open from the initial camera angle.
box(0.13, 1.12, 4.8, -3.1, 0.64, 0, wall);
box(0.16, 0.04, 4.82, -3.1, 1.22, 0, stone);
box(6.25, 0.09, 0.04, 0, 0.16, -2.31, cream);

// Tall storage and oven tower.
box(0.92, 2.58, 0.75, -2.43, 1.39, -1.96, woodDark);
box(0.88, 1.08, 0.06, -2.43, 2.08, -1.55, wood);
box(0.88, 0.56, 0.06, -2.43, 0.42, -1.55, wood);
box(0.84, 0.75, 0.08, -2.43, 1.14, -1.51, metal);
box(0.69, 0.47, 0.02, -2.43, 1.08, -1.46, glass);
box(0.62, 0.035, 0.06, -2.43, 1.37, -1.42, stone);
box(0.025, 0.33, 0.07, -2.1, 2.03, -1.49, metal);
// Back counter, separate doors and drawer gaps.
box(4.08, 0.86, 0.76, 0.13, 0.56, -1.96, woodDark);
box(4.16, 0.09, 0.88, 0.13, 1.04, -1.92, stone);
for (let i = 0; i < 6; i++) {
  const x = -1.56 + i * 0.68;
  box(0.653, 0.78, 0.055, x, 0.58, -1.55, cabinet);
  box(0.36, 0.022, 0.05, x, 0.88, -1.5, metal);
  box(0.653, 0.76, 0.43, x, 2.15, -2.09, cabinet);
  box(0.3, 0.018, 0.035, x, 1.81, -1.86, metal);
}
box(4.05, 0.04, 0.04, 0.13, 1.745, -1.92, material('#e4d49b', 0.3));
box(0.75, 0.025, 0.54, 1.05, 1.1, -1.85, metal);
for (const x of [0.85, 1.25]) for (const z of [-1.99, -1.7]) {
  cylinder(0.105, 0.105, 0.015, x, 1.12, z, glass);
}

// Island, recessed toe kick and fine vertical panel detailing.
box(3.0, 0.13, 1.17, 0.15, 0.18, 0.15, woodDark);
box(3.1, 0.89, 1.22, 0.15, 0.67, 0.15, cabinet);
for (let i = 0; i < 22; i++) box(0.038, 0.84, 0.025, -1.3 + i * 0.14, 0.67, 0.775, wood);
box(3.38, 0.11, 1.51, 0.15, 1.17, 0.2, stone);
box(0.68, 0.015, 0.43, -0.8, 1.235, 0.12, metal);
box(0.55, 0.016, 0.31, -0.8, 1.245, 0.12, glass);
const faucetPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.8, 1.24, -0.2), new THREE.Vector3(-0.8, 1.63, -0.2),
  new THREE.Vector3(-0.8, 1.7, -0.05), new THREE.Vector3(-0.8, 1.57, 0.08)
]);
const faucet = new THREE.Mesh(new THREE.TubeGeometry(faucetPath, 24, 0.024, 8, false), metal);
faucet.castShadow = true;
room.add(faucet);

// Stools.
for (const x of [-0.65, 0.98]) {
  cylinder(0.32, 0.3, 0.11, x, 0.83, 1.48, material('#678eb6'));
  for (const dx of [-0.19, 0.19]) for (const dz of [-0.19, 0.19]) {
    const leg = box(0.045, 0.69, 0.045, x + dx, 0.44, 1.48 + dz, metal);
    leg.rotation.z = dx < 0 ? -0.09 : 0.09;
  }
  box(0.45, 0.025, 0.025, x, 0.34, 1.67, metal);
}

// Pendant pair, suspended from a slim crossbar.
box(3.2, 0.055, 0.055, 0.1, 3.06, 0.15, metal);
box(0.045, 0.05, 2.55, -1.45, 3.06, -1.08, metal);
box(0.045, 0.05, 2.55, 1.65, 3.06, -1.08, metal);
for (const x of [-0.72, 1.0]) {
  cylinder(0.012, 0.012, 0.49, x, 2.79, 0.15, metal, 8);
  cylinder(0.11, 0.35, 0.23, x, 2.46, 0.15, cream);
  cylinder(0.31, 0.31, 0.018, x, 2.34, 0.15, material('#f0dfa4', 0.4));
}

// Open shelf and styled objects.
box(0.68, 0.06, 0.63, 2.62, 1.02, -1.99, wood);
box(0.68, 0.06, 0.63, 2.62, 1.79, -1.99, wood);
box(0.68, 0.06, 0.63, 2.62, 2.54, -1.99, wood);
box(0.05, 2.42, 0.65, 2.97, 1.35, -1.99, wood);
for (let i = 0; i < 5; i++) box(0.065, 0.28 + (i % 2) * 0.06, 0.22, 2.4 + i * 0.07, 1.2, -1.9, i % 2 ? cream : cabinet);
cylinder(0.13, 0.1, 0.28, 2.6, 1.96, -1.96, cream);
cylinder(0.11, 0.14, 0.24, 1.15, 1.35, 0.2, cream);
const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), woodDark);
bowl.position.set(0.45, 1.36, 0.3); room.add(bowl);
sphere(0.095, 0.41, 1.36, 0.3, material('#9da073'));
sphere(0.09, 0.53, 1.36, 0.28, material('#b6a16b'));

// Potted plant at the open end of the room.
cylinder(0.26, 0.18, 0.52, 2.5, 0.36, 1.18, material('#a58e76'));
cylinder(0.23, 0.23, 0.03, 2.5, 0.63, 1.18, woodDark);
cylinder(0.018, 0.025, 1.2, 2.5, 1.2, 1.18, woodDark, 8);
for (let i = 0; i < 11; i++) {
  const angle = i * 2.4;
  const y = 0.9 + i * 0.085;
  const r = 0.22 + (i % 3) * 0.08;
  const leaf = sphere(1, 2.5 + Math.cos(angle) * r, y, 1.18 + Math.sin(angle) * r, leafMaterial);
  leaf.scale.set(0.15, 0.025, 0.34);
  leaf.rotation.set(0.3, -angle + Math.PI / 2, 0.2);
}

const shadow = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.ShadowMaterial({ opacity: 0.16 }));
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.25;
shadow.receiveShadow = true;
scene.add(shadow);
const parts = room.children.map(mesh => {
  const base = mesh.position.clone();
  const offset = new THREE.Vector3();
  if (base.y > 2.3 && base.z > -0.5) offset.y = 0.6;
  else if (base.y > 1.7 && base.z < -1.5) offset.set(0, 0.38, -0.2);
  else if (base.y > 1.1 && base.y < 1.75 && base.z > -0.7 && base.x < 2) offset.y = 0.52;
  else if (mesh.material === cabinet) offset.set(0, 0.08, 0.24);
  return { mesh, base, offset };
});
let exploded = false;
let explosion = 0;
let dirty = true;
let visible = true;
let contextLost = false;
let frame;
let lastTime = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const rotateButton = document.querySelector('#rotate');
const explodeButton = document.querySelector('#explode');
function updateRotationButton() {
  rotateButton.setAttribute('aria-pressed', String(controls.autoRotate));
  rotateButton.querySelector('span:last-child').textContent = controls.autoRotate ? 'Pause' : 'Rotate';
  rotateButton.querySelector('.icon').style.setProperty('--icon', `url("assets/icons/${controls.autoRotate ? 'pause' : 'play'}.svg")`);
}
function stopRotation() {
  controls.autoRotate = false;
  updateRotationButton();
}
function resize() {
  const width = container.clientWidth, height = container.clientHeight;
  const aspect = width / height;
  const halfHeight = Math.max(3.2, 4.5 / aspect);
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  dirty = true;
}
function animate(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  const target = exploded ? 1 : 0;
  if (Math.abs(explosion - target) > 0.001) {
    explosion = reducedMotion.matches ? target : THREE.MathUtils.damp(explosion, target, 6, delta);
    for (const { mesh, base, offset } of parts) mesh.position.copy(base).addScaledVector(offset, explosion);
    dirty = true;
  }
  if (controls.autoRotate) {
    const angle = controls.getAzimuthalAngle();
    if (angle < controls.minAzimuthAngle + 0.03) controls.autoRotateSpeed = -0.6;
    if (angle > controls.maxAzimuthAngle - 0.03) controls.autoRotateSpeed = 0.6;
  }
  if (controls.update(delta) || dirty) { renderer.render(scene, camera); dirty = false; }
  frame = requestAnimationFrame(animate);
}
function syncLoop() {
  cancelAnimationFrame(frame);
  if (visible && !document.hidden && !contextLost) { lastTime = performance.now(); frame = requestAnimationFrame(animate); }
}
controls.addEventListener('change', () => { dirty = true; });
controls.addEventListener('start', stopRotation);
document.addEventListener('visibilitychange', syncLoop);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncLoop(); }).observe(container);
new ResizeObserver(resize).observe(container);
const colors = { coral: '#d9826f', ocean: '#5686aa', lilac: '#9c84ba' };
document.querySelectorAll('[data-finish]').forEach(button => {
  button.disabled = false;
  button.addEventListener('click', () => {
    cabinet.color.set(colors[button.dataset.finish]);
    document.querySelectorAll('[data-finish]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#finish-label').textContent = button.dataset.finish[0].toUpperCase() + button.dataset.finish.slice(1);
    dirty = true;
  });
});
rotateButton.disabled = false;
explodeButton.disabled = false;
document.querySelector('#reset').disabled = false;
explodeButton.addEventListener('click', () => {
  exploded = !exploded;
  explodeButton.setAttribute('aria-pressed', String(exploded));
  explodeButton.querySelector('span:last-child').textContent = exploded ? 'Assemble' : 'Explode';
});
rotateButton.addEventListener('click', () => {
  if (reducedMotion.matches) {
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta = spherical.theta + 0.3 > controls.maxAzimuthAngle ? controls.minAzimuthAngle : spherical.theta + 0.3;
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update(); dirty = true;
    return;
  }
  controls.autoRotate = !controls.autoRotate;
  updateRotationButton();
  dirty = true;
});
document.querySelector('#reset').addEventListener('click', () => {
  stopRotation(); controls.reset(); exploded = false;
  explodeButton.setAttribute('aria-pressed', 'false');
  explodeButton.querySelector('span:last-child').textContent = 'Explode';
  dirty = true;
});
reducedMotion.addEventListener('change', () => { stopRotation(); controls.enableDamping = !reducedMotion.matches; });
controls.enableDamping = !reducedMotion.matches;
controls.autoRotate = !reducedMotion.matches;
updateRotationButton();
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault(); contextLost = true; cancelAnimationFrame(frame);
  renderer.domElement.hidden = true;
  document.querySelector('#scene-fallback').hidden = false;
  document.querySelector('#scene-status').textContent = '3D paused. Reload the page to restore the interactive room.';
  document.querySelectorAll('.scene-toolbar button').forEach(button => { button.disabled = true; });
});
resize();
renderer.render(scene, camera);
document.querySelector('#scene-fallback').hidden = true;
document.querySelector('#scene').dataset.ready = 'true';
document.querySelector('#drag-hint').textContent = matchMedia('(pointer: coarse)').matches ? 'Two fingers to rotate' : 'Drag to explore';
syncLoop();
