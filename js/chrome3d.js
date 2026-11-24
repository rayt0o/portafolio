/* rayt0o · Objetos y logos en cromo 3D
   Uso: <canvas class="chrome3d" data-model="svg:img/trama-logo.svg" data-depth="60"></canvas>
        <canvas class="chrome3d" data-model="ring"></canvas>  (ring · skeleton · minifig)
   Se gira arrastrando; quieto, flota y gira despacio. Si no hay WebGL, el canvas se oculta. */
import * as THREE from 'three';
import { SVGLoader } from './vendor/SVGLoader.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Entorno: lo que el cromo refleja (paleta rayt0o) ---------- */
function makeEnv(renderer) {
  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 64, 32);
  const cols = [];
  const pos = geo.attributes.position;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10; // -1 abajo, 1 arriba
    if (y > 0.5) c.set('#ffffff');
    else if (y > 0.18) c.set('#c9cad6').lerp(new THREE.Color('#ffffff'), (y - 0.18) / 0.32);
    else if (y > 0.06) c.set('#8a8da0').lerp(new THREE.Color('#c9cad6'), (y - 0.06) / 0.12);
    else if (y > 0.0) c.set('#6fd3ff');
    else if (y > -0.05) c.set('#2b4bff');
    else if (y > -0.45) c.set('#14141e').lerp(new THREE.Color('#4a4c5c'), (y + 0.45) / 0.4);
    else c.set('#07070b');
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  // dos paneles de luz para los brillos duros
  const panel = (w, h, x, y, z, col) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); scene.add(m);
  };
  panel(6, 2, -4, 5, 5, 0xffffff);
  panel(2, 6, 6, 1, 2, 0xb9e8ff);
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(scene, 0.02).texture;
  pm.dispose();
  return env;
}

const chrome = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08 });
const darkChrome = () => new THREE.MeshPhysicalMaterial({ color: 0x5a5c6e, metalness: 1, roughness: 0.32 });

/* ---------- Modelos ---------- */
async function svgModel(url, depth) {
  const txt = await (await fetch(url)).text();
  const data = new SVGLoader().parse(txt);
  const g = new THREE.Group();
  const mat = chrome();
  data.paths.forEach(p => {
    SVGLoader.createShapes(p).forEach(sh => {
      const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * 0.18, bevelSize: depth * 0.12, bevelSegments: 4, curveSegments: 6 });
      g.add(new THREE.Mesh(geo, mat));
    });
  });
  g.scale.set(1, -1, 1);
  return g;
}

function keyring(r = 0.32) {
  return new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 16, 48), chrome());
}

function ringModel() {
  const g = new THREE.Group();
  // aro (perfil girado)
  const prof = [[0.78, -0.22], [0.86, -0.25], [0.95, -0.2], [0.98, 0], [0.95, 0.2], [0.86, 0.25], [0.78, 0.22]].map(([x, y]) => new THREE.Vector2(x, y));
  const band = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), chrome());
  band.rotation.x = Math.PI / 2;
  g.add(band);
  // sello: caja redondeada arriba del aro
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.34, 0.78, 4, 0.08), chrome());
  bezel.position.y = 1.02; g.add(bezel);
  // piedra azul tallada
  const gemGeo = new THREE.CylinderGeometry(0.34, 0.46, 0.22, 4, 1);
  gemGeo.rotateY(Math.PI / 4);
  const gem = new THREE.Mesh(gemGeo, new THREE.MeshPhysicalMaterial({ color: 0x2b4bff, metalness: 0.15, roughness: 0.04, transmission: 0.55, thickness: 0.5, ior: 2.2, clearcoat: 1, emissive: 0x0a1a8a, emissiveIntensity: 0.6 }));
  gem.scale.set(1.15, 1, 0.92);
  gem.position.y = 1.27; g.add(gem);
  // grabado lateral (greca) sugerido con relieves
  [-1, 1].forEach(s => {
    const r = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.24, 0.5, 2, 0.02), darkChrome());
    r.position.set(0.5 * s, 0.96, 0); g.add(r);
  });
  g.rotation.x = -0.35;
  return g;
}

function skeletonModel() {
  const g = new THREE.Group();
  const box = (w, h, d, x, y, z, m = chrome()) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.025), m); b.position.set(x, y, z); g.add(b); return b; };
  // cabeza con ojos y boca hundidos
  box(0.9, 0.9, 0.9, 0, 1.15, 0);
  box(0.2, 0.14, 0.05, -0.2, 1.2, 0.44, darkChrome());
  box(0.2, 0.14, 0.05, 0.2, 1.2, 0.44, darkChrome());
  box(0.5, 0.06, 0.05, 0, 0.95, 0.44, darkChrome());
  // columna y costillas
  box(0.16, 0.85, 0.16, 0, 0.3, 0);
  for (let i = 0; i < 3; i++) box(0.72, 0.1, 0.32, 0, 0.58 - i * 0.2, 0);
  // brazos
  box(0.14, 0.75, 0.14, -0.5, 0.25, 0);
  box(0.14, 0.75, 0.14, 0.5, 0.25, 0);
  // pelvis y piernas
  box(0.6, 0.14, 0.3, 0, -0.18, 0);
  box(0.14, 0.6, 0.14, -0.18, -0.55, 0);
  box(0.14, 0.6, 0.14, 0.18, -0.55, 0);
  box(0.62, 0.12, 0.34, 0, -0.9, 0.04);
  const k = keyring(0.26); k.position.set(0, 1.85, 0); k.rotation.y = Math.PI / 2; g.add(k);
  return g;
}

function minifigModel() {
  const g = new THREE.Group();
  const m = chrome();
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.42, 40), m); head.position.y = 1.0; g.add(head);
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 32), m); stud.position.y = 1.27; g.add(stud);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24), m); neck.position.y = 0.75; g.add(neck);
  // torso trapezoidal
  const torsoGeo = new THREE.BoxGeometry(0.9, 0.75, 0.42, 1, 1, 1);
  const p = torsoGeo.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setX(i, p.getX(i) * 0.72);
  torsoGeo.computeVertexNormals();
  const torso = new THREE.Mesh(torsoGeo, m); torso.position.y = 0.33; g.add(torso);
  // ojos grandes del traje sugeridos en el frente
  [-1, 1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), darkChrome());
    eye.scale.set(1.2, 0.8, 0.4); eye.position.set(0.12 * s, 1.04, 0.29); g.add(eye);
    // brazos y manos
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.55, 20), m);
    arm.position.set(0.47 * s, 0.32, 0.05); arm.rotation.z = 0.25 * s; arm.rotation.x = -0.35; g.add(arm);
    const hand = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.04, 12, 24, Math.PI * 1.4), m);
    hand.position.set(0.55 * s, 0.02, 0.18); hand.rotation.y = Math.PI / 2; g.add(hand);
    // piernas
    const leg = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.62, 0.44, 2, 0.03), m);
    leg.position.set(0.215 * s, -0.43, 0.02); g.add(leg);
  });
  const hips = new THREE.Mesh(new RoundedBoxGeometry(0.88, 0.14, 0.4, 2, 0.03), m); hips.position.y = -0.1; g.add(hips);
  const k = keyring(0.22); k.position.set(0, 1.55, 0); k.rotation.y = Math.PI / 2; g.add(k);
  return g;
}

/* ---------- Visor ---------- */
async function mount(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { canvas.hidden = true; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  cam.position.set(0, 0, 7);

  const kind = canvas.dataset.model || '';
  let obj;
  if (kind.startsWith('svg:')) obj = await svgModel(kind.slice(4), +(canvas.dataset.depth || 40));
  else if (kind === 'ring') obj = ringModel();
  else if (kind === 'skeleton') obj = skeletonModel();
  else if (kind === 'minifig') obj = minifigModel();
  else return;

  // centrar y ajustar al tamaño de la vista
  const holder = new THREE.Group(); holder.add(obj);
  const box = new THREE.Box3().setFromObject(holder);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  const pivot = new THREE.Group(); pivot.add(holder); scene.add(pivot);

  const baseX = +(canvas.dataset.tiltx || 0) * Math.PI / 180;   // perspectiva de reposo
  const baseY = +(canvas.dataset.tilty || 0) * Math.PI / 180;
  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    const pad = +(canvas.dataset.pad || 1.15);
    const halfFov = THREE.MathUtils.degToRad(cam.fov / 2);
    const dh = (size.y * pad / 2) / Math.tan(halfFov);
    const dw = (size.x * pad / 2) / (Math.tan(halfFov) * cam.aspect);
    cam.position.z = Math.max(dh, dw) + size.z;
    cam.near = cam.position.z / 100; cam.far = cam.position.z * 10;
    cam.updateProjectionMatrix();
  };
  fit(); new ResizeObserver(fit).observe(canvas);

  // interacción: arrastrar gira, soltar deja inercia; quieto, flota
  let rx = baseX, ry = baseY, vx = 0, vy = 0, drag = false, lx = 0, ly = 0, t0 = performance.now(), idle = 0;
  const spin = canvas.dataset.spin !== 'off';
  const limX = +(canvas.dataset.limx || 0) * Math.PI / 180;
  const limY = +(canvas.dataset.limy || 0) * Math.PI / 180;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-grab'); });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    vy = (e.clientX - lx) * 0.012; vx = (e.clientY - ly) * 0.008; lx = e.clientX; ly = e.clientY;
    ry += vy; rx += vx; idle = 0;
  });
  const up = () => { drag = false; canvas.classList.remove('is-grab'); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(canvas);
  let raf = 0;
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    if (!drag) {
      vx *= 0.94; vy *= 0.94; rx += vx; ry += vy; idle++;
      if (idle > 90) { rx += (baseX - rx) * 0.02; if (!spin) ry += (baseY - ry) * 0.02; }
      if (spin && !reduced) ry += 0.004;
    }
    // límites de giro (grados) para que nada se salga del recuadro
    if (limX) { rx = Math.min(baseX + limX, Math.max(baseX - limX, rx)); }
    if (limY) { ry = Math.min(baseY + limY, Math.max(baseY - limY, ry)); }
    pivot.rotation.set(rx, ry, 0);
    pivot.position.y = reduced ? 0 : Math.sin(t * 1.2) * size.y * 0.025;
    renderer.render(scene, cam);
    raf = requestAnimationFrame(loop);
  }
  loop();
  canvas.classList.add('is-ready');
}

document.querySelectorAll('canvas.chrome3d').forEach(c => mount(c));
