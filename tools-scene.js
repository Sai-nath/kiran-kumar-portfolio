import * as THREE from 'three';

const host = document.querySelector('#tools-canvas');
const motionButton = document.querySelector('#tools-motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-7, 7, 3.5, -3.5, 0.1, 100);
camera.position.set(0, 0, 16);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.domElement.setAttribute('aria-hidden', 'true');
host.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xe7edff, 2.4));
const light = new THREE.DirectionalLight(0xffffff, 3.5);
light.position.set(-3, 6, 8); scene.add(light);
const rim = new THREE.DirectionalLight(0x9dbdff, 3);
rim.position.set(5, -2, 2); scene.add(rim);

const tools = [
  ['3ds Max','cube','#277d92'], ['V-Ray','sun','#c35945'],
  ['Photoshop','image','#276da5'], ['IMOS iX','ruler','#708a49'],
  ['Cut Rite','scissors','#ad7640'], ['KCDW','stack','#4868a4'],
  ['Illustrator','vector-three','#ad5a2d'], ['Premiere Pro','film-strip','#7151ae'],
  ['After Effects','sparkle','#795ca6'], ['CorelDRAW','paint-brush','#468768']
];
const shape = new THREE.Shape();
const w = 1.85, h = 1.58, r = 0.18;
shape.moveTo(-w/2+r,-h/2); shape.lineTo(w/2-r,-h/2);
shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); shape.lineTo(w/2,h/2-r);
shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2); shape.lineTo(-w/2+r,h/2);
shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); shape.lineTo(-w/2,-h/2+r);
shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.055, bevelThickness: 0.055, curveSegments: 10 });
geometry.translate(0,0,-0.14);
await document.fonts.ready;
const cards = await Promise.all(tools.map(async ([name, icon, color], i) => {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 432;
  const ctx = canvas.getContext('2d');
  const symbol = new Image();
  symbol.src = `assets/icons/${icon}.svg`;
  await symbol.decode();
  ctx.drawImage(symbol, 162, 52, 188, 188);
  ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#faf7ff'; ctx.fillRect(0,0,512,432);
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#faf7ff';
  ctx.font = `600 ${name.length > 10 ? 38 : 44}px Manrope, sans-serif`;
  ctx.textAlign = 'center'; ctx.fillText(name, 256, 332);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  const body = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, metalness: 0.22, roughness: 0.33 }));
  group.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.73,1.46), new THREE.MeshBasicMaterial({ map:texture,transparent:true,depthWrite:false }));
  face.position.z = 0.199; group.add(face);
  group.userData.index = i;
  group.rotation.set(0.14, i%2 ? -0.18 : 0.18, i%2 ? 0.04 : -0.04);
  scene.add(group);
  return { group, body, base: new THREE.Vector3(), i };
}));

let selected = Number(document.querySelector('[data-tool][aria-pressed=true]').dataset.tool);
let moving = !reducedMotion.matches;
let visible = false;
let lost = false;
let dirty = true;
let elapsed = 0;
let lastTime = 0;
let frame;
let mobile = false;
function resize() {
  const width = host.clientWidth, height = host.clientHeight;
  mobile = width < 650;
  const columns = mobile ? 2 : 5;
  const rows = Math.ceil(cards.length / columns);
  const aspect = width / height;
  const halfHeight = mobile ? 5.3 : Math.max(2.7, 5.9 / aspect);
  camera.left = -halfHeight*aspect; camera.right = halfHeight*aspect;
  camera.top = halfHeight; camera.bottom = -halfHeight;
  camera.updateProjectionMatrix(); renderer.setSize(width,height);
  cards.forEach(({group,base,i}) => {
    base.set((i%columns - (columns-1)/2)*2.2, ((rows-1)/2-Math.floor(i/columns))*1.95, 0);
    group.position.copy(base);
  });
  dirty = true;
}
function updateButton() {
  motionButton.setAttribute('aria-pressed',String(moving));
  motionButton.querySelector('span:last-child').textContent = moving ? 'Pause motion' : 'Play motion';
  motionButton.querySelector('.icon').style.setProperty('--icon',`url("assets/icons/${moving?'pause':'play'}.svg")`);
}
function render(time) {
  const delta = Math.min((time-lastTime)/1000,0.08); lastTime = time;
  if (moving) elapsed += delta;
  if (moving || dirty) {
    cards.forEach(({group,base,i}) => {
      const t = elapsed + i*0.72;
      group.position.set(base.x,base.y + Math.sin(t*1.35)*0.13,i===selected?0.65:0);
      group.rotation.set(0.17+Math.sin(t)*0.13,Math.sin(t*0.8)*0.27,Math.cos(t*0.9)*0.055);
      group.scale.setScalar(i===selected?1.07:1);
    });
    renderer.render(scene,camera); dirty = false;
  }
  if (moving) frame=requestAnimationFrame(render);
}
function syncLoop() {
  cancelAnimationFrame(frame);
  if (visible && !document.hidden && !lost) {lastTime=performance.now();frame=requestAnimationFrame(render);}
}
host.addEventListener('selecttool', event => { selected=event.detail; dirty=true; syncLoop(); });
motionButton.addEventListener('click',()=>{moving=!moving;updateButton();dirty=true;syncLoop();});
reducedMotion.addEventListener('change',()=>{moving=!reducedMotion.matches;updateButton();dirty=true;syncLoop();});
new ResizeObserver(()=>{resize();syncLoop();}).observe(host);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;syncLoop();}).observe(host);
document.addEventListener('visibilitychange',syncLoop);
const raycaster = new THREE.Raycaster();
renderer.domElement.addEventListener('click',event=>{
  const bounds=renderer.domElement.getBoundingClientRect();
  const pointer=new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(cards.map(card=>card.body))[0];
  if (hit) document.querySelector(`[data-tool="${hit.object.parent.userData.index}"]`).click();
});
renderer.domElement.addEventListener('webglcontextlost',event=>{
  event.preventDefault();lost=true;cancelAnimationFrame(frame);
  renderer.domElement.hidden=true;
  document.querySelector('.tools-loading').hidden=false;
  document.querySelector('.tools-loading').textContent='3D paused. Reload to restore the moving toolkit.';
  motionButton.disabled=true;
});
resize();updateButton();motionButton.disabled=false;
renderer.render(scene,camera);
document.querySelector('.tools-loading').hidden=true;
host.dataset.ready='true';
