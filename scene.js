// Hero: an original, procedurally built interior diorama. Scroll drives three chapters
// (render -> exploded technical view -> delivered), pointer adds parallax and drag-to-look,
// and the sideboard fronts can be opened by clicking them.
import * as THREE from 'three';
import { RoomEnvironment } from './assets/RoomEnvironment.js';

const host = document.querySelector('#scene');
const hero = document.querySelector('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const { damp, smoothstep, lerp, clamp } = THREE.MathUtils;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-hidden', 'true');
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
const studio = new RoomEnvironment();
scene.environment = pmrem.fromScene(studio, 0.04).texture;
scene.environmentIntensity = 0.3;
studio.dispose(); pmrem.dispose();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 90);

// ---------- procedural textures (seeded, so every visit looks the same)
let seed = 11;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function paintTexture(w, h, paint, repeat = [1, 1], srgb = true) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  paint(canvas.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function grain(ctx, w, h, base, count, tone, alpha, size) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const v = tone + (rand() - 0.5) * 70 | 0;
    ctx.fillStyle = `rgba(${v},${v - 6},${v - 16},${alpha})`;
    ctx.fillRect(rand() * w, rand() * h, rand() * size + 0.5, rand() * size + 0.5);
  }
}
const travertinePaint = (ctx, w, h) => {
  grain(ctx, w, h, '#d9cdb9', 9000, 196, 0.22, 2);
  for (let i = 0; i < 90; i++) { // horizontal veins and pores, typical of travertine
    ctx.fillStyle = `rgba(146,124,96,${0.06 + rand() * 0.18})`;
    ctx.fillRect(rand() * w, rand() * h, 30 + rand() * 280, 0.6 + rand() * 1.8);
  }
};
const floorTex = paintTexture(512, 512, travertinePaint, [3, 2.3]);
const stoneTex = paintTexture(512, 512, travertinePaint, [1, 1]);
const walnutTex = paintTexture(256, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#5c3a24'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) {
    const x = rand() * w, a = rand() * 7, g = 58 + rand() * 52 | 0;
    ctx.strokeStyle = `rgba(${g + 42},${g + 4},${g - 22},${0.12 + rand() * 0.38})`;
    ctx.lineWidth = 0.5 + rand() * 2.6; ctx.beginPath();
    for (let y = 0; y <= h; y += 24) ctx.lineTo(x + Math.sin(y * 0.008 + i) * a, y);
    ctx.stroke();
  }
});
const plasterTex = paintTexture(512, 512, (ctx, w, h) => grain(ctx, w, h, '#d6cab7', 14000, 200, 0.16, 1.6), [2, 1]);
const boucleTex = paintTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    ctx.strokeStyle = `rgba(${v},${v},${v},.35)`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(rand() * w, rand() * h, 1 + rand() * 2.4, 0, 6.3); ctx.stroke();
  }
}, [3, 3], false);
const rugTex = paintTexture(512, 512, (ctx, w, h) => {
  grain(ctx, w, h, '#ddd2bf', 16000, 205, 0.2, 1.5);
  ctx.strokeStyle = 'rgba(120,96,70,.35)'; ctx.lineWidth = 6; ctx.strokeRect(26, 26, w - 52, h - 52);
  ctx.lineWidth = 1.5; ctx.strokeRect(44, 44, w - 88, h - 88);
});

// ---------- materials
const M = {
  floor: new THREE.MeshStandardMaterial({ map: floorTex, bumpMap: floorTex, bumpScale: 1.4, roughness: 0.74 }),
  stone: new THREE.MeshStandardMaterial({ map: stoneTex, bumpMap: stoneTex, bumpScale: 1, roughness: 0.6 }),
  base: new THREE.MeshStandardMaterial({ color: '#1b1916', roughness: 0.9 }),
  plaster: new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.96 }),
  walnut: new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.52 }),
  slatBack: new THREE.MeshStandardMaterial({ color: '#191613', roughness: 0.85 }),
  bronze: new THREE.MeshStandardMaterial({ color: '#2d2723', metalness: 0.75, roughness: 0.4 }),
  lacquer: new THREE.MeshPhysicalMaterial({ color: '#7d8b6a', roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.28 }),
  board: new THREE.MeshStandardMaterial({ color: '#dac8a8', roughness: 0.72 }),
  brass: new THREE.MeshStandardMaterial({ color: '#d4aa5e', metalness: 1, roughness: 0.26 }),
  fabric: new THREE.MeshPhysicalMaterial({ color: '#b65a3b', roughness: 0.94, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffb898'), bumpMap: boucleTex, bumpScale: 2.2 }),
  oak: new THREE.MeshStandardMaterial({ color: '#b78c5d', roughness: 0.58 }),
  ceramic: new THREE.MeshStandardMaterial({ color: '#e7ded1', roughness: 0.5 }),
  clayPot: new THREE.MeshStandardMaterial({ color: '#a9573a', roughness: 0.86 }),
  soil: new THREE.MeshStandardMaterial({ color: '#2a2018', roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#76845a', roughness: 0.62, side: THREE.DoubleSide }),
  bark: new THREE.MeshStandardMaterial({ color: '#4a3b2c', roughness: 0.9 }),
  rug: new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }),
  book: ['#2f3a45', '#c9b79a', '#8a3f2b'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.8 })),
  glow: new THREE.MeshStandardMaterial({ color: '#fff6e8', emissive: '#ffcf96', emissiveIntensity: 2.6 }),
};

// Technical "clay" pass: the room darkens into a drafting stage while the product turns to light clay.
const clay = { value: 0 };
const darkRoom = new Set([M.floor, M.plaster, M.base, M.slatBack, M.walnut, M.bronze, M.rug]);
function clayify(material) {
  if (material.userData.clay || material === M.glow) return;
  material.userData.clay = true;
  const tone = darkRoom.has(material) ? 'vec3(0.035, 0.038, 0.045)' : 'vec3(0.5, 0.49, 0.47)';
  material.customProgramCacheKey = () => tone;
  material.onBeforeCompile = shader => {
    shader.uniforms.uClay = clay;
    shader.fragmentShader = 'uniform float uClay;\n' + shader.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, ${tone}, uClay);`);
  };
}

// ---------- geometry helpers
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function mesh(geometry, material, position, rotation, parent = scene) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  if (rotation) m.rotation.set(...rotation);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
// Rounded box with smooth normals: push box vertices onto a rounded hull.
function rounded(w, h, d, r, seg = 12) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const p = g.attributes.position, n = g.attributes.normal;
  const max = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r), min = max.clone().negate();
  const v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); c.copy(v).clamp(min, max);
    v.sub(c).normalize(); n.setXYZ(i, v.x, v.y, v.z);
    v.multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

// ---------- the room shell (a cutaway, like an architectural model)
mesh(box(7, 0.32, 5.4), M.floor, [0, -0.16, 0]);
mesh(box(6.6, 0.1, 5), M.base, [0, -0.37, 0]);
mesh(box(7.22, 3.6, 0.22), M.plaster, [-0.11, 1.8, -2.81]);
// left wall with a window opening (z -1.7..0.5, y 0.55..2.95)
const wx = -3.61;
mesh(box(0.22, 0.55, 5.62), M.plaster, [wx, 0.275, -0.11]);
mesh(box(0.22, 0.65, 5.62), M.plaster, [wx, 3.275, -0.11]);
mesh(box(0.22, 2.4, 1.22), M.plaster, [wx, 1.75, -2.31]);
mesh(box(0.22, 2.4, 2.2), M.plaster, [wx, 1.75, 1.6]);
for (const z of [-0.967, -0.233]) mesh(box(0.07, 2.4, 0.05), M.bronze, [-3.53, 1.75, z]);
mesh(box(0.07, 0.05, 2.2), M.bronze, [-3.53, 2.28, -0.6]);
mesh(box(0.34, 0.05, 2.3), M.stone, [-3.48, 0.55, -0.6]);
const skyMaterial = new THREE.MeshBasicMaterial({ color: '#ffe2bf' });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.8), skyMaterial);
sky.position.set(-3.95, 1.75, -0.6); sky.rotation.y = Math.PI / 2; scene.add(sky); skyMaterial.userData.clay = true;
// ribbed walnut feature wall
mesh(box(2.7, 3.3, 0.03), M.slatBack, [2.1, 1.75, -2.685]);
for (let i = 0; i < 18; i++) mesh(box(0.075, 3.24, 0.07), M.walnut, [0.85 + i * 0.148, 1.75, -2.63]);
// rug
mesh(box(3.1, 0.016, 2.35), M.rug, [0.55, 0.008, 0.55]);

// ---------- the sideboard: a modular cabinet that explodes into its panels
const W = 2.4, H = 0.72, D = 0.5, T = 0.036, divX = -W / 2 + 1.3;
const cab = new THREE.Group(); cab.position.set(-1.0, 0.1, -2.43); scene.add(cab);
const cabBase = cab.position.clone();
const edgeMaterial = new THREE.LineBasicMaterial({ color: '#1c9fd6', transparent: true, opacity: 0 });
const parts = [], fronts = [];
function part(object, explode) {
  cab.add(object);
  parts.push({ object, base: object.position.clone(), explode: new THREE.Vector3(...explode) });
  object.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = child.receiveShadow = true;
    if (child.geometry.type === 'BoxGeometry') child.add(new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry), edgeMaterial));
  });
  return object;
}
const panel = (w, h, d, material, position) => { const m = new THREE.Mesh(box(w, h, d), material); m.position.set(...position); return m; };
part(panel(T, H, D, M.lacquer, [-W / 2 + T / 2, H / 2, 0]), [-0.55, 0, 0]);
part(panel(T, H, D, M.lacquer, [W / 2 - T / 2, H / 2, 0]), [0.55, 0, 0]);
part(panel(W, T, D, M.lacquer, [0, H - T / 2, 0]), [0, 0.55, 0]);
part(panel(W - 2 * T, T, D, M.board, [0, T / 2, 0]), [0, -0.22, 0]);
part(panel(W - 2 * T, H - 2 * T, 0.012, M.board, [0, H / 2, -D / 2 + 0.006]), [0, 0, -0.32]);
part(panel(T, H - 2 * T, D - 0.02, M.board, [divX, H / 2, -0.01]), [0, 0.18, -0.12]);
part(panel(1.3 - 1.5 * T, T, D - 0.06, M.board, [(-W / 2 + divX) / 2, H / 2, -0.02]), [-0.15, 0.06, 0.32]);
part(panel(W - 0.12, 0.1, D - 0.1, M.base, [0, -0.05, -0.02]), [0, -0.3, 0]);
// stone top with a small styled vignette on it
const top = new THREE.Group(); top.position.set(0, H + 0.015, 0);
top.add(panel(W + 0.04, 0.03, D + 0.03, M.stone, [0, 0, 0]));
const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.085, 0], [0.11, 0.05], [0.12, 0.16], [0.09, 0.29], [0.05, 0.35], [0.056, 0.39]].map(([x, y]) => new THREE.Vector2(x, y)), 40), M.ceramic);
vase.position.set(-0.7, 0.015, -0.02); top.add(vase);
for (const [rx, rz, len] of [[0.35, 0.1, 0.9], [-0.28, -0.25, 0.75], [0.1, 0.45, 0.6]]) {
  const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.008, len, 5), M.bark);
  twig.position.set(-0.7 + Math.sin(rz) * len * 0.45, 0.39 + len * 0.45, Math.sin(rx) * len * 0.3);
  twig.rotation.set(rx, 0, rz); top.add(twig);
}
[[0.42, 0.05, 0.3, 0.05], [0.4, 0.04, 0.28, -0.12], [0.36, 0.035, 0.26, 0.2]].reduce((y, [w, h, d, r], i) => {
  const book = new THREE.Mesh(box(w, h, d), M.book[i]); book.position.set(0.55, y + h / 2, 0); book.rotation.y = r; top.add(book);
  return y + h;
}, 0.015);
const orb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 20), M.brass); orb.position.set(0.58, 0.21, 0); top.add(orb);
part(top, [0, 1.05, 0]);
// fronts: two hinged doors and three drawers, each clickable
function addFront(kind, pivot, frontWidth, frontHeight, explode, extra) {
  const group = new THREE.Group(); group.position.set(...pivot);
  const offset = kind === 'doorL' ? frontWidth / 2 : kind === 'doorR' ? -frontWidth / 2 : 0;
  const face = panel(frontWidth, frontHeight, 0.022, M.lacquer, [offset, 0, 0]); group.add(face);
  if (kind === 'drawer') {
    group.add(panel(frontWidth - 0.12, frontHeight - 0.06, 0.42, M.board, [0, -0.01, -0.22]));
    group.add(panel(0.32, 0.014, 0.022, M.brass, [0, frontHeight / 2 - 0.035, 0.022]));
  } else group.add(panel(0.014, 0.3, 0.022, M.brass, [offset * 2 - Math.sign(offset) * 0.04, 0.12, 0.022]));
  part(group, explode);
  const front = { group, kind, open: 0, manual: 0, extra };
  face.userData.front = front; fronts.push(front);
}
const doorW = (1.3 - T - 0.006) / 2, frontH = H - 0.008, z = D / 2 + 0.011;
addFront('doorL', [-W / 2 + T / 2, H / 2, z], doorW, frontH, [-0.12, 0, 0.75]);
addFront('doorR', [divX, H / 2, z], doorW, frontH, [0.02, 0, 0.75]);
const drawerH = (H - 0.016) / 3, drawerW = W / 2 - divX - T / 2 - 0.006, drawerX = (divX + W / 2) / 2;
for (let i = 0; i < 3; i++) addFront('drawer', [drawerX, H - 0.004 - drawerH * (i + 0.5), z], drawerW, drawerH - 0.006, [0.22, (1 - i) * 0.12, 0.72 + i * 0.14], 0.34 - i * 0.05);
// dimension annotations for the technical view
const dims = new THREE.Group(); cab.add(dims);
function label(text, position) {
  const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 80;
  const ctx = canvas.getContext('2d'); ctx.font = '700 38px Manrope, sans-serif'; ctx.fillStyle = '#5cd0ff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 160, 40);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, opacity: 0, depthTest: false }));
  sprite.scale.set(0.64, 0.16, 1); sprite.position.set(...position); sprite.renderOrder = 10; dims.add(sprite);
}
const dimPoints = [];
const segment = (a, b) => dimPoints.push(new THREE.Vector3(...a), new THREE.Vector3(...b));
const yW = H + 1.45, xH = W / 2 + 0.85;
segment([-W / 2, yW, D / 2], [W / 2, yW, D / 2]);
for (const x of [-W / 2, W / 2]) segment([x, yW - 0.06, D / 2], [x, yW + 0.06, D / 2]);
segment([xH, -0.1, D / 2], [xH, H + 0.03, D / 2]);
for (const y of [-0.1, H + 0.03]) segment([xH - 0.06, y, D / 2], [xH + 0.06, y, D / 2]);
dims.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(dimPoints), edgeMaterial));
label('2400 mm', [0, yW + 0.14, D / 2]);
label('820 mm', [xH + 0.42, H / 2, D / 2]);

// ---------- lounge chair, side table, pendant, olive tree
const chair = new THREE.Group(); chair.position.set(1.55, 0, 0.55); chair.rotation.y = -0.62; scene.add(chair);
for (const [x, zz] of [[-0.36, -0.33], [0.36, -0.33], [-0.36, 0.33], [0.36, 0.33]]) mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.2, 12), M.oak, [x, 0.1, zz], null, chair);
mesh(rounded(0.86, 0.06, 0.8, 0.025, 6), M.oak, [0, 0.225, 0], null, chair);
mesh(rounded(0.62, 0.17, 0.7, 0.07), M.fabric, [0, 0.33, 0.04], null, chair);
mesh(rounded(0.62, 0.62, 0.17, 0.075), M.fabric, [0, 0.62, -0.31], [-0.17, 0, 0], chair);
for (const x of [-0.39, 0.39]) mesh(rounded(0.13, 0.4, 0.8, 0.055), M.fabric, [x, 0.43, 0], null, chair);
const table = new THREE.Group(); table.position.set(0.5, 0, 1.4); scene.add(table);
mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.035, 48), M.stone, [0, 0.5, 0], null, table);
mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 16), M.bronze, [0, 0.25, 0], null, table);
mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.025, 40), M.bronze, [0, 0.0125, 0], null, table);
mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.085, 24), M.ceramic, [-0.08, 0.56, -0.04], null, table);
mesh(new THREE.SphereGeometry(0.06, 24, 16), M.clayPot, [0.1, 0.578, 0.05], null, table);
const pendant = new THREE.Group(); pendant.position.set(0.5, 3.9, 1.4); scene.add(pendant);
mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.95, 6), M.bronze, [0, -0.975, 0], null, pendant);
mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.06, 20), M.brass, [0, -1.95, 0], null, pendant);
const globe = mesh(new THREE.SphereGeometry(0.17, 40, 28), M.glow, [0, -2.12, 0], null, pendant); globe.castShadow = false;
const bulb = new THREE.PointLight('#ffb468', 5, 7, 1.6); bulb.position.set(0, -2.12, 0); pendant.add(bulb);
// olive tree in a terracotta planter
const tree = new THREE.Group(); tree.position.set(-2.8, 0, -1.95); scene.add(tree);
mesh(new THREE.LatheGeometry([[0, 0], [0.19, 0], [0.24, 0.5], [0.26, 0.52], [0.25, 0.54]].map(([x, y]) => new THREE.Vector2(x, y)), 36), M.clayPot, [0, 0, 0], null, tree);
mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 30), M.soil, [0, 0.49, 0], null, tree);
mesh(new THREE.CylinderGeometry(0.022, 0.04, 1.3, 8), M.bark, [0.02, 1.12, 0], [0, 0, -0.05], tree);
const clusters = [[0.05, 1.95, 0, 0.42], [-0.28, 1.62, 0.12, 0.3], [0.3, 1.72, -0.1, 0.3]];
for (const [x, y, zz, r] of clusters) mesh(new THREE.CylinderGeometry(0.008, 0.016, Math.hypot(x, y - 1.2), 6), M.bark, [x / 2, (y + 1.2) / 2, zz / 2], [zz, 0, -Math.atan2(x, y - 1.2)], tree);
const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), M.leaf, 360);
const dummy = new THREE.Object3D();
for (let i = 0; i < leaves.count; i++) {
  const [x, y, zz, r] = clusters[i % 3];
  const a = rand() * Math.PI * 2, b = Math.acos(rand() * 2 - 1), d = Math.cbrt(rand()) * r;
  dummy.position.set(x + Math.sin(b) * Math.cos(a) * d, y + Math.cos(b) * d * 0.7, zz + Math.sin(b) * Math.sin(a) * d);
  dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
  dummy.scale.set(0.022, 0.085, 0.008);
  dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);
}
leaves.castShadow = true; tree.add(leaves);

// ---------- light: low sun through the window, pendant glow, cool rim
const hemi = new THREE.HemisphereLight('#dfe7ff', '#3b2b1f', 0.28); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffcc96', 6);
sun.position.set(-9.5, 6.4, 1.4); sun.target.position.set(0.2, 0, -0.6); scene.add(sun, sun.target);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(innerWidth < 760 ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 2, far: 24 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 5;
const fill = new THREE.DirectionalLight('#fff0dc', 0.35); fill.position.set(5, 3.5, 9); scene.add(fill);
const rim = new THREE.DirectionalLight('#9ccbff', 1.1); rim.position.set(6, 4, -7); scene.add(rim);
const grid = new THREE.GridHelper(5.4, 27, '#1c9fd6', '#1c9fd6');
grid.material.transparent = true; grid.material.opacity = 0; grid.material.depthWrite = false; grid.position.y = 0.021; scene.add(grid);
// dust motes drifting through the sunlight
const moteCount = 240, motePositions = new Float32Array(moteCount * 3);
for (let i = 0; i < moteCount; i++) motePositions.set([-3.3 + rand() * 3.2, 0.2 + rand() * 2.8, -1.8 + rand() * 2.6], i * 3);
const motes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(motePositions, 3)),
  new THREE.PointsMaterial({ color: '#ffdcb0', size: 0.018, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(motes);
scene.traverse(o => { if (o.isMesh) clayify(o.material); });

// ---------- camera choreography: one keyframe per chapter
const keys = [
  { target: [0.1, 0.95, -0.4], yaw: 0.62, pitch: 0.38, dist: 15.5, phone: 15 },
  { target: [-0.95, 1.3, -1.4], yaw: 0.42, pitch: 0.24, dist: 9.6, phone: 15.5 },
  { target: [0.15, 0.9, -0.3], yaw: -0.18, pitch: 0.46, dist: 14.5, phone: 15 },
];
const state = { yaw: keys[0].yaw, pitch: keys[0].pitch, dist: keys[0].dist, target: new THREE.Vector3(...keys[0].target), tech: 0, open: 0, explode: 0 };
const pointer = { x: 0, y: 0, lx: 0, ly: 0 };
const drag = { active: false, x: 0, y: 0, yaw: 0, pitch: 0, moved: 0 };
let moving = !reduced.matches, techManual = null, lastChapter = 0, elapsed = 0, lastTime = performance.now();
let visible = true, lost = false, frame, layout = { offsetX: 0, offsetY: 0, distScale: 1, phone: false }, lastSignature = '';

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < 760 ? 38 : 30;
  const wide = w >= 1024;
  layout = {
    offsetX: wide ? -w * 0.17 : 0,
    offsetY: w < 760 ? -h * 0.02 : 0,
    distScale: wide ? 1 : 1.12,
    phone: w < 760,
  };
  camera.setViewOffset(w, h, layout.offsetX, layout.offsetY, w, h);
  lastSignature = '';
}

function frameTargets(p) {
  // piecewise blend between the chapter keyframes
  const seg = p < 0.5 ? 0 : 1, local = smoothstep(p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5, 0, 1);
  const a = keys[seg], b = keys[seg + 1], dist = k => layout.phone ? k.phone : k.dist * layout.distScale;
  return {
    yaw: lerp(a.yaw, b.yaw, local), pitch: lerp(a.pitch, b.pitch, local), dist: lerp(dist(a), dist(b), local),
    target: new THREE.Vector3(...a.target).lerp(new THREE.Vector3(...b.target), local),
  };
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1); lastTime = now;
  const still = reduced.matches;
  if (moving) elapsed += dt;
  const p = hero.progress ?? 0;
  const chapter = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
  if (chapter !== lastChapter) { lastChapter = chapter; techManual = null; syncButtons(); }
  const goal = frameTargets(p);
  const k = (rate) => still ? 1 : 1 - Math.exp(-rate * dt);
  // pointer parallax (mouse) and drag-to-look
  pointer.lx += (pointer.x - pointer.lx) * k(3); pointer.ly += (pointer.y - pointer.ly) * k(3);
  const idle = moving ? Math.sin(elapsed * 0.16) * 0.06 : 0;
  state.yaw += (goal.yaw + drag.yaw + pointer.lx * 0.09 + idle - state.yaw) * k(4);
  state.pitch += (clamp(goal.pitch + drag.pitch - pointer.ly * 0.05, 0.04, 0.9) - state.pitch) * k(4);
  state.dist += (goal.dist - state.dist) * k(4);
  state.target.lerp(goal.target, k(4));
  const scrollTech = smoothstep(p, 0.2, 0.42) * (1 - smoothstep(p, 0.6, 0.78));
  const techGoal = techManual === null ? scrollTech : techManual ? 1 : 0;
  state.tech = still ? techGoal : damp(state.tech, techGoal, 4, dt);
  const openGoal = smoothstep(p, 0.8, 0.97);
  state.open = still ? openGoal : damp(state.open, openGoal, 4, dt);

  // apply camera
  const cp = Math.cos(state.pitch);
  camera.position.set(Math.sin(state.yaw) * cp, Math.sin(state.pitch), Math.cos(state.yaw) * cp).multiplyScalar(state.dist).add(state.target);
  camera.lookAt(state.target);

  // technical view: explode panels, clay materials, cyan edges, blueprint grid
  const e = state.tech;
  clay.value = e * 0.92;
  edgeMaterial.opacity = e;
  grid.material.opacity = e * 0.45;
  dims.children.forEach(c => { if (c.isSprite) c.material.opacity = smoothstep(e, 0.5, 1); });
  cab.position.copy(cabBase).add(new THREE.Vector3(0, 0.38 * e, 0.95 * e));
  for (const { object, base, explode } of parts) object.position.copy(base).addScaledVector(explode, e);
  for (const f of fronts) {
    const target = Math.max(state.open, f.manual) * (1 - e);
    f.open = still ? target : damp(f.open, target, 6, dt);
    if (f.kind === 'doorL') f.group.rotation.y = -1.45 * f.open;
    else if (f.kind === 'doorR') f.group.rotation.y = 1.45 * f.open;
    else f.group.position.z += f.extra * f.open;
  }
  sun.intensity = lerp(6, 1.8, e);
  hemi.intensity = lerp(0.28, 0.7, e);
  // decor steps aside so the sideboard reads as a product study
  const away = Math.max(0.001, 1 - smoothstep(e, 0, 0.7));
  for (const item of [chair, table, tree]) item.scale.setScalar(away);
  pendant.position.y = 3.9 + 2.5 * smoothstep(e, 0, 0.8);
  rim.intensity = lerp(1.1, 2.4, e);
  bulb.intensity = lerp(5, 0.6, e);
  M.glow.emissiveIntensity = lerp(2.6, 0.4, e);
  skyMaterial.color.setRGB(1, 0.89, 0.75).multiplyScalar(1 - 0.85 * e);
  motes.material.opacity = 0.6 * (1 - e);

  // ambient life
  if (moving) {
    pendant.rotation.z = Math.sin(elapsed * 0.9) * 0.012;
    pendant.rotation.x = Math.cos(elapsed * 0.7) * 0.01;
    for (let i = 0; i < moteCount; i++) {
      const y = motePositions[i * 3 + 1] + dt * (0.03 + (i % 7) * 0.006);
      motePositions[i * 3 + 1] = y > 3 ? 0.2 : y;
      motePositions[i * 3] += Math.sin(elapsed * 0.5 + i) * dt * 0.02;
    }
    motes.geometry.attributes.position.needsUpdate = true;
  }

  // render only when something changed (keeps reduced-motion and paused states idle)
  const signature = [camera.position.x, camera.position.y, camera.position.z, e, state.open, ...fronts.map(f => f.open)].map(n => n.toFixed(4)).join() + moving;
  if (moving || signature !== lastSignature) { renderer.render(scene, camera); lastSignature = signature; }
  frame = requestAnimationFrame(tick);
}

function loop() {
  cancelAnimationFrame(frame);
  if (visible && !document.hidden && !lost) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
}

// ---------- controls
const $ = s => document.querySelector(s);
const techButton = $('#view-tech'), openButton = $('#view-open'), motionButton = $('#view-motion'), resetButton = $('#view-reset');
const setIcon = (el, name) => el.querySelector('.icon').style.setProperty('--icon', `url("assets/icons/${name}.svg")`);
function syncButtons() {
  const techOn = techManual === null ? lastChapter === 1 : techManual;
  techButton.setAttribute('aria-pressed', String(techOn));
  openButton.setAttribute('aria-pressed', String(fronts.every(f => f.manual === 1)));
  motionButton.setAttribute('aria-pressed', String(!moving));
  setIcon(motionButton, moving ? 'pause' : 'play');
}
techButton.addEventListener('click', () => { techManual = techButton.getAttribute('aria-pressed') !== 'true'; syncButtons(); });
openButton.addEventListener('click', () => {
  const open = openButton.getAttribute('aria-pressed') !== 'true';
  fronts.forEach(f => { f.manual = open ? 1 : 0; });
  if (open) techManual = false;
  syncButtons();
});
motionButton.addEventListener('click', () => { moving = !moving; syncButtons(); });
resetButton.addEventListener('click', () => {
  Object.assign(drag, { yaw: 0, pitch: 0 }); techManual = null; fronts.forEach(f => { f.manual = 0; });
  moving = !reduced.matches; syncButtons();
});
const finishes = {
  sage: { color: '#7d8b6a', map: null, roughness: 0.42, label: 'Sage lacquer' },
  walnut: { color: '#ffffff', map: walnutTex, roughness: 0.5, label: 'Smoked walnut' },
  ink: { color: '#25313f', map: null, roughness: 0.34, label: 'Ink blue lacquer' },
};
document.querySelectorAll('[data-finish]').forEach(button => {
  button.disabled = false;
  button.addEventListener('click', () => {
    const f = finishes[button.dataset.finish];
    M.lacquer.color.set(f.color); M.lacquer.map = f.map; M.lacquer.roughness = f.roughness; M.lacquer.needsUpdate = true;
    $('#finish-label').textContent = f.label;
    document.querySelectorAll('[data-finish]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    lastSignature = '';
  });
});
reduced.addEventListener('change', () => { moving = !reduced.matches; syncButtons(); });

// pointer: parallax for mouse, drag to look for mouse and touch, click fronts to open them
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
const hint = $('#drag-hint'), defaultHint = matchMedia('(pointer: coarse)').matches ? 'Swipe sideways to look around' : 'Drag to look around, click a front to open it';
function frontAt(event) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObject(cab, true).find(h => h.object.isMesh);
  return hit?.object.userData.front;
}
addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse') { pointer.x = event.clientX / innerWidth * 2 - 1; pointer.y = event.clientY / innerHeight * 2 - 1; }
}, { passive: true });
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', event => {
  Object.assign(drag, { active: true, x: event.clientX, y: event.clientY, moved: 0 });
  if (event.pointerType === 'mouse') canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (drag.active) {
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag.x = event.clientX; drag.y = event.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.yaw = clamp(drag.yaw - dx * 0.004, -0.8, 0.8);
    if (event.pointerType === 'mouse') drag.pitch = clamp(drag.pitch + dy * 0.002, -0.2, 0.35);
  } else if (event.pointerType === 'mouse') {
    const front = frontAt(event);
    canvas.style.cursor = front ? 'pointer' : 'grab';
    hint.textContent = front ? `${front.kind === 'drawer' ? 'Drawer' : 'Door'} front: click to ${front.manual ? 'close' : 'open'}` : defaultHint;
  }
});
const endDrag = event => {
  if (drag.active && drag.moved < 6 && event.type === 'pointerup') {
    const front = frontAt(event);
    if (front) { front.manual = front.manual ? 0 : 1; techManual = false; syncButtons(); }
  }
  drag.active = false;
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => { hint.textContent = defaultHint; });

canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); lost = true; cancelAnimationFrame(frame);
  canvas.hidden = true; $('#scene-fallback').hidden = false; document.documentElement.classList.add('no-webgl');
  $('#scene-status').textContent = '3D paused by the browser. Reload to restore the interactive scene. AI-generated concept shown meanwhile.';
  document.querySelectorAll('.scene-toolbar button').forEach(b => { b.disabled = true; });
});
new ResizeObserver(resize).observe(host);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; loop(); }).observe(host);
document.addEventListener('visibilitychange', loop);

resize();
renderer.compile(scene, camera);
renderer.render(scene, camera);
[techButton, openButton, motionButton, resetButton].forEach(b => { b.disabled = false; });
hint.textContent = defaultHint;
$('#scene-fallback').hidden = true;
host.dataset.ready = 'true';
syncButtons();
loop();
