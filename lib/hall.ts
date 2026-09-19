import * as THREE from 'three';
import { createInteractionCues } from './interaction-cues';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  startups as previewStartups,
  placement,
  type Startup,
} from './startups';
import { previewSlides, investmentDisplay, boothJobs } from './booth-content';
import { createImmersivePopup } from './immersive-popup';
import { drawCompanyBoard, panelText } from './booth-panels';
import { drawProfileFacts } from './profile-fields';
import { companyImage, containedImage } from './company-images';
import type { BoothPopupType } from './booth-content';
import { createExhibit } from './abstract-exhibits';
import { exhibitConcept } from './exhibit-concepts';
import { hitsObstacle } from './navigation';
import {
  joystickStep,
  slideOnFloor,
  stickDeadzone,
  thumbstick,
} from './xr-locomotion';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export type HallAPI = {
  enter: () => void;
  visit: (id: number) => void;
  overview: () => void;
  dispose: () => void;
  vr: () => Promise<void>;
  motion: (active: boolean) => void;
  move: (x: number, z: number) => void;
  pause: (v: boolean) => void;
  explode: (v: boolean) => void;
  meeting: (id: number) => void;
  showcase: (id: number) => void;
};
export type HallCallbacks = {
  ready: () => void;
  select: (id: number) => void;
  content?: (
    id: number,
    tab: 'about' | 'slides' | 'video' | 'jobs' | 'facts',
  ) => void;
  popup?: (id: number, type: BoothPopupType, jobIndex?: number) => void;
  position: (x: number, z: number) => void;
  mode: (entered: boolean) => void;
  error: (message: string) => void;
  hint?: (message: string) => void;
  visited?: (id: number) => void;
};
export function createHall(
  host: HTMLElement,
  cb: HallCallbacks,
  startups: Startup[] = previewStartups,
): HallAPI {
  let disposed = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c3d4d5');
  scene.fog = new THREE.Fog('#c3d4d5', 65, 160);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.xr.enabled = true;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive 3D startup exhibition. Drag to look, use W A S D to walk, or use the accessible startup directory.',
  );
  renderer.domElement.tabIndex = 0;
  const camera = new THREE.PerspectiveCamera(
    62,
    host.clientWidth / host.clientHeight,
    0.05,
    200,
  );
  const rig = new THREE.Group();
  rig.add(camera);
  scene.add(rig);
  camera.position.set(15, 8.5, 24);
  camera.lookAt(-1, 1, -6);
  const popup = createImmersivePopup(scene, () =>
    renderer.xr.isPresenting ? renderer.xr.getCamera() : camera,
  );
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.35;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#dceeff', '#a59e8c', 2));
  const sun = new THREE.DirectionalLight('#fff1d9', 3.6);
  sun.position.set(-22, 32, 17);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -32,
    right: 32,
    top: 34,
    bottom: -34,
    near: 1,
    far: 95,
  });
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  scene.add(new THREE.AmbientLight('#ffffff', 0.25));
  const mat = (color: string, roughness = 0.55, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const stone = mat('#d8d7cd', 0.68),
    white = mat('#eeeee5', 0.53),
    wood = mat('#99714c', 0.62),
    dark = mat('#1d2e2d', 0.6),
    steel = mat('#879693', 0.26, 0.85),
    green = mat('#007d6a', 0.4),
    grass = mat('#7f9472', 0.95);
  // Fine mineral relief adds surface scale without external texture downloads.
  const surfaceCanvas = document.createElement('canvas');
  surfaceCanvas.width = surfaceCanvas.height = 256;
  const surfaceCtx = surfaceCanvas.getContext('2d')!;
  const surfaceData = surfaceCtx.createImageData(256, 256);
  let seed = 981;
  for (let i = 0; i < surfaceData.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = 140 + (seed % 52);
    surfaceData.data[i] = surfaceData.data[i + 1] = surfaceData.data[i + 2] = v;
    surfaceData.data[i + 3] = 255;
  }
  surfaceCtx.putImageData(surfaceData, 0, 0);
  const grain = new THREE.CanvasTexture(surfaceCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(28, 34);
  stone.bumpMap = grain;
  stone.bumpScale = 0.012;
  const timberCanvas = document.createElement('canvas');
  timberCanvas.width = 128;
  timberCanvas.height = 512;
  const timberCtx = timberCanvas.getContext('2d')!;
  timberCtx.fillStyle = '#a48460';
  timberCtx.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 100; i++) {
    timberCtx.strokeStyle = i % 3 ? '#92744d' : '#b19470';
    timberCtx.lineWidth = 0.4 + (i % 4) * 0.25;
    timberCtx.beginPath();
    timberCtx.moveTo(i * 1.3, 0);
    timberCtx.bezierCurveTo(
      i * 1.3 + Math.sin(i) * 2,
      170,
      i * 1.3 - 3,
      340,
      i * 1.3,
      512,
    );
    timberCtx.stroke();
  }
  const timberTex = new THREE.CanvasTexture(timberCanvas);
  timberTex.colorSpace = THREE.SRGBColorSpace;
  timberTex.wrapS = timberTex.wrapT = THREE.RepeatWrapping;
  wood.map = timberTex;
  wood.color.set('#ffffff');
  const mesh = (
    g: THREE.BufferGeometry,
    m: THREE.Material,
    p: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    p.add(o);
    return o;
  };
  const box = (
    p: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => mesh(new THREE.BoxGeometry(w, h, d), m, p, x, y, z);
  const cyl = (
    p: THREE.Object3D,
    r: number,
    h: number,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => mesh(new THREE.CylinderGeometry(r, r, h, 32), m, p, x, y, z);
  const textPanel = (
    parent: THREE.Object3D,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    draw: (c: CanvasRenderingContext2D) => void,
    px = Math.min(1024, Math.max(256, 2 ** Math.ceil(Math.log2(w * 400)))),
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = px;
    canvas.height = Math.round((px * h) / w);
    const c = canvas.getContext('2d')!;
    c.scale(px / 1024, px / 1024);
    draw(c);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const material = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
    });
    const o = mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z);
    o.castShadow = false;
    return o;
  };
  const label = (
    p: THREE.Object3D,
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    bg = '#173e36',
    fg = '#ffffff',
    size = 100,
  ) =>
    textPanel(p, w, h, x, y, z, (c) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, 1024, (1024 * h) / w);
      c.fillStyle = fg;
      c.font = `600 ${size}px Arial`;
      c.textBaseline = 'middle';
      c.fillText(text, 48, (512 * h) / w);
    });
  const imagePanel = (
    parent: THREE.Object3D, source: string, w: number, h: number,
    x: number, y: number, z: number, logo: boolean, id: number,
  ) => {
    new THREE.ImageLoader().setCrossOrigin('anonymous').load(source, (image) => {
      if (disposed) return;
      const canvas = document.createElement('canvas');
      // Bound texture memory for Quest; retain source aspect ratio with white margins.
      canvas.width = logo ? 512 : 1024;
      canvas.height = Math.round(canvas.width * h / w);
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const fit = containedImage(image.width, image.height, canvas.width, canvas.height, logo ? 18 : 0);
      context.drawImage(image, fit.x, fit.y, fit.width, fit.height);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
      const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
      const panel = mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z);
      panel.castShadow = false;
      panel.userData.activate = () => {
        const startup = startups.find(s => s.id === id)!;
        if (renderer.xr.isPresenting) popup.open(startup, 'profile');
        else cb.content?.(id, 'about');
      };
      panel.userData.hint = 'Open company profile';
      targets.push(panel);
    }, undefined, () => {
      // The permanent company name underneath remains available on load failure.
    });
  };
  const wrap = (
    c: CanvasRenderingContext2D,
    s: string,
    x: number,
    y: number,
    width: number,
    line: number,
  ) => {
    let row = '';
    for (const word of s.split(' ')) {
      if (c.measureText(row + word).width > width) {
        c.fillText(row, x, y);
        row = '';
        y += line;
      }
      row += word + ' ';
    }
    c.fillText(row, x, y);
    return y + line;
  };
  const targets: THREE.Object3D[] = [];
  const obstacles: THREE.Box3[] = [];
  box(scene, 130, 0.15, 140, grass, 0, -0.28, 0);
  const floor = box(scene, 38, 0.25, 50, stone, 0, -0.125, -1);
  floor.userData.floor = true;
  targets.push(floor);
  // Large-format stone tiles and a continuous green wayfinding strip.
  const grout = mat('#b9bcb4');
  for (let x = -18; x <= 18; x += 3)
    box(scene, 0.018, 0.005, 50, grout, x, 0.005, -1);
  for (let z = -25; z <= 24; z += 3)
    box(scene, 38, 0.005, 0.018, grout, 0, 0.006, z);
  box(scene, 0.085, 0.008, 42, green, -3.7, 0.015, -1);
  box(scene, 0.085, 0.008, 42, green, 3.7, 0.015, -1);
  // Timber portal frames with an open, glazed clerestory.
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#cfe4df',
    transparent: true,
    opacity: 0.16,
    roughness: 0.12,
    metalness: 0.12,
    depthWrite: false,
  });
  for (let z = -24; z <= 24; z += 8) {
    for (const x of [-18.5, 18.5]) {
      box(scene, 0.38, 8, 0.55, wood, x, 4, z);
      box(scene, 0.75, 0.22, 0.8, steel, x, 0.11, z);
    }
    box(scene, 37.5, 0.48, 0.55, wood, 0, 7.8, z);
    box(scene, 37, 0.055, 0.13, white, 0, 7.53, z);
  }
  for (const x of [-18.5, 18.5]) {
    box(scene, 0.08, 6.8, 48, glass, x, 3.6, 0);
    box(scene, 0.3, 0.3, 48, wood, x, 7.8, 0);
  }
  for (let x = -16; x <= 16; x += 4) box(scene, 0.14, 0.22, 48, wood, x, 8, 0);
  box(scene, 38, 7.8, 0.15, white, 0, 3.9, -25);
  label(
    scene,
    'FROM RESEARCH TO WHAT’S NEXT.',
    20,
    1.3,
    0,
    5.75,
    -24.85,
    '#eeeee5',
    '#183f35',
    67,
  );
  label(
    scene,
    'KARLSRUHE  /  VENTURE HALL',
    12,
    0.55,
    0,
    4.45,
    -24.84,
    '#eeeee5',
    '#527465',
    53,
  );
  const emit = new THREE.MeshStandardMaterial({
    color: '#fff6d6',
    emissive: '#fff0cb',
    emissiveIntensity: 2,
  });
  textPanel(scene, 3.3, 1.65, -4.9, 1.9, 15.6, (c) => {
    c.fillStyle = '#173e36';
    c.fillRect(0, 0, 1024, 512);
    c.fillStyle = '#c6e889';
    c.font = '25px Arial';
    c.fillText('WELCOME TO VENTURE HALL', 48, 63);
    c.fillStyle = '#fff';
    c.font = '600 49px Arial';
    c.fillText('Explore at your pace.', 48, 143);
    c.font = '31px Arial';
    [
      '01  Point + select to open cards and exhibits.',
      '02  In VR: select the floor to teleport.',
      '03  Left stick: walk. Right stick: turn.',
      '04  Squeeze to bring a reader back into view.',
    ].forEach((line, i) => c.fillText(line, 48, 229 + i * 61));
  });
  for (let z = -16; z <= 16; z += 8) {
    box(scene, 22, 0.035, 0.085, emit, 0, 7.48, z);
  }
  // Planters, lounge furniture and outdoor planting anchor the scale of the hall.
  const leafMats = [mat('#446a42'), mat('#668755')],
    soil = mat('#423f30');
  function plant(x: number, z: number, s = 1) {
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    p.scale.setScalar(s);
    scene.add(p);
    cyl(p, 0.7, 0.65, white, 0, 0.32);
    cyl(p, 0.62, 0.06, soil, 0, 0.67);
    cyl(p, 0.085, 2, wood, 0, 1.6);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      const leaf = mesh(
        new THREE.SphereGeometry(0.7, 9, 7),
        leafMats[i % 2],
        p,
        Math.cos(a) * 0.45,
        2.35 + (i % 3) * 0.3,
        Math.sin(a) * 0.45,
      );
      leaf.scale.set(0.8, 1, 0.8);
    }
  }
  for (const z of [19, 3, -13]) for (const x of [-16.7, 16.7]) plant(x, z, 1.1);
  for (let i = 0; i < 14; i++) {
    plant(
      (i % 2 ? -1 : 1) * (24 + (i % 3) * 4),
      -29 + (i / 2) * 9,
      1.6 + (i % 3) * 0.3,
    );
  }
  for (const x of [-7, 7]) {
    box(scene, 3.2, 0.45, 1.05, wood, x, 0.43, 17);
    for (const dx of [-1.25, 1.25])
      box(scene, 0.16, 0.5, 0.85, dark, x + dx, 0.25, 17);
  }
  const animated: THREE.Group[] = [];
  const exhibits: ReturnType<typeof createExhibit>[] = [];
  const extraTargets: THREE.Object3D[] = [];
  const updateText = (
    o: THREE.Mesh,
    draw: (c: CanvasRenderingContext2D) => void,
  ) => {
    const m = o.material as THREE.MeshBasicMaterial;
    const texture = m.map as THREE.CanvasTexture;
    const canvas = texture.image as HTMLCanvasElement;
    const c = canvas.getContext('2d')!;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.restore();
    c.textBaseline = 'alphabetic';
    draw(c);
    texture.needsUpdate = true;
  };
  const actionButton = (
    parent: THREE.Object3D,
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    activate: () => void,
  ) => {
    const b = label(
      parent,
      text,
      w,
      h,
      x,
      y,
      z,
      '#173e36',
      '#ffffff',
      Math.min(95, 1500 / text.length),
    );
    b.userData.activate = activate;
    b.userData.hint = text;
    targets.push(b);
    return b;
  };
  startups.forEach((s, i) => {
    const logo = companyImage(s, 'logo');
    const hero = companyImage(s, 'hero');
    const p = placement(i),
      booth = new THREE.Group();
    booth.position.set(p.x, 0, p.z);
    booth.rotation.y = p.r;
    scene.add(booth);
    const accent = mat(s.color, 0.42);
    box(booth, 7.25, 0.045, 5.7, wood, 0, 0.03, 0);
    const wall = box(booth, 7.2, 3.85, 0.17, white, 0, 1.98, -2.7);
    wall.userData.id = s.id;
    targets.push(wall);
    const sideWall = box(booth, 0.15, 3.85, hero ? 3.4 : 2.2, white, -3.55, 1.98, hero ? -1 : -1.7);
    if (hero) {
      // A separate inward-facing image wall preserves both full-size information boards.
      const pictureWall = new THREE.Group();
      pictureWall.position.set(-3.45, 2.14, -1);
      pictureWall.rotation.y = Math.PI / 2;
      booth.add(pictureWall);
      box(pictureWall, 3.14, 1.88, 0.06, dark);
      label(pictureWall, s.name, 3, 1.74, 0, 0, 0.036, '#ffffff', '#194b3b', 72);
      imagePanel(pictureWall, hero, 3, 1.74, 0, 0, 0.04, false, s.id);
    }
    // A gallery-like back wall: the profile is primary, film and meetings secondary.
    box(booth, 7.05, 0.72, 0.06, dark, 0, 3.38, -2.58);
    box(booth, 0.055, 2.35, 0.06, accent, 0.73, 1.75, -2.57);
    for (let slat = 0; slat < 7; slat++)
      box(booth, 0.085, 2.45, 0.065, wood, -3.45 + slat * 0.12, 1.5, -2.56);
    // A luminous open portal establishes a real, enterable exhibition booth.
    const posts = [
      box(booth, 0.22, 3.95, 0.22, white, -3.43, 2, 2.52),
      box(booth, 0.22, 3.95, 0.22, white, 3.43, 2, 2.52),
    ];
    box(booth, 7.1, 0.35, 0.32, white, 0, 3.85, 2.52);
    box(booth, 6.75, 0.035, 0.035, emit, 0, 3.64, 2.71);
    for (const x of [-3.43, 3.43]) {
      box(booth, 0.25, 0.26, 5.25, white, x, 3.87, 0);
      box(booth, 0.028, 0.035, 5.1, emit, x, 3.7, 0);
      box(booth, 0.026, 3.48, 0.026, emit, x, 1.93, 2.65);
    }
    const fascia = label(
      booth,
      `${String(s.id).padStart(2, '0')}  /  ${s.name}`,
      4.6,
      0.62,
      logo ? 0.45 : 0,
      4.13,
      2.72,
      '#f4f5ef',
      '#194b3b',
      s.name.length > 10 ? 74 : 95,
    );
    fascia.userData.id = s.id;
    targets.push(fascia);
    if (logo) {
      box(booth, 1.14, 0.66, 0.04, white, -2.72, 4.13, 2.7);
      imagePanel(booth, logo, 1.1, 0.62, -2.72, 4.13, 2.73, true, s.id);
      imagePanel(booth, logo, 0.88, 0.48, 2.03, 3.46, -2.525, true, s.id);
    }
    // Keep company funding targets and explicitly labeled preview amounts distinct.
    const funding = investmentDisplay(s);
    const investmentZone = new THREE.Group();
    investmentZone.position.set(3.38, 0, -0.24);
    investmentZone.rotation.y = -Math.PI / 2;
    booth.add(investmentZone);
    const investmentBack = box(investmentZone, 2.1, 1.75, 0.1, dark, 0, 2.04);
    const investmentBanner = textPanel(
      investmentZone,
      1.98,
      1.12,
      0,
      2.26,
      0.06,
      (c) => {
        c.fillStyle = '#173e36';
        c.fillRect(0, 0, 1024, 580);
        c.fillStyle = s.color;
        panelText(c, `INVESTMENT / ${funding.source}`, 48, 70, 920, 33, 1);
        c.fillStyle = '#ffffff';
        panelText(c, funding.amount, 48, 239, 920, 105, 1);
        c.fillStyle = '#c1d5c5';
        panelText(c, funding.label, 48, 327, 920, 38, 2);
        panelText(
          c,
          funding.note,
          48,
          421,
          920,
          32,
          3,
        );
      },
    );
    investmentBanner.userData.activate = () => openPopup(s.id, 'investment');
    targets.push(investmentBanner);
    actionButton(
      investmentZone,
      'Unverbindliches Interesse bekunden',
      1.98,
      0.3,
      0,
      1.45,
      0.062,
      () => openPopup(s.id, 'investment'),
    );
    label(
      booth,
      s.name.toUpperCase(),
      4.8,
      0.5,
      -0.78,
      3.48,
      -2.54,
      '#1d2e2d',
      '#ffffff',
      76,
    );
    label(
      booth,
      s.sector.toUpperCase(),
      4.5,
      0.23,
      -0.8,
      3.13,
      -2.54,
      '#1d2e2d',
      '#cbdcc7',
      35,
    );
    label(
      booth,
      String(s.id).padStart(2, '0'),
      0.62,
      0.62,
      2.94,
      3.3,
      -2.53,
      s.color,
      '#193e36',
      300,
    );
    // Oversized paper-like overview board with fixed text regions and real API facts.
    box(booth, 3.78, 2.46, 0.13, dark, -1.35, 1.74, -2.46);
    const slides = previewSlides(s);
    let currentSlide = 0;
    const board = textPanel(
      booth,
      3.6,
      2.278125,
      -1.35,
      1.74,
      -2.383,
      () => {},
    );
    function drawSlide() {
      updateText(board, (c) => drawCompanyBoard(c, s, currentSlide));
    }
    drawSlide();
    board.userData.activate = () => {
      if (renderer.xr.isPresenting) {
        popup.open(s, 'slides');
      } else cb.content?.(s.id, 'about');
    };
    board.userData.hint = 'Open presentation reader';
    targets.push(board);
    actionButton(booth, '← PREVIOUS', 1.1, 0.28, -2.48, 0.34, -2.25, () => {
      currentSlide = (currentSlide + slides.length - 1) % slides.length;
      drawSlide();
    });
    actionButton(booth, 'NEXT →', 1.1, 0.28, -0.2, 0.34, -2.25, () => {
      currentSlide = (currentSlide + 1) % slides.length;
      drawSlide();
    });
    // All profile fields replace the former video wall; video lives only in the profile popup.
    box(booth, 2.38, 2.46, 0.13, dark, 2.08, 1.74, -2.46);
    const facts = textPanel(booth, 2.25, 2.278125, 2.08, 1.74, -2.383, (c) =>
      drawProfileFacts(c, s),
    );
    const openFacts = () => {
      if (renderer.xr.isPresenting) popup.open(s, 'profile');
      else cb.content?.(s.id, 'facts');
    };
    facts.userData.activate = openFacts;
    facts.userData.hint = 'Read every product, company and headquarters field';
    targets.push(facts);
    actionButton(
      booth,
      'ALL PROFILE FIELDS ↗',
      2.25,
      0.28,
      2.08,
      0.34,
      -2.25,
      openFacts,
    );
    // Central exhibit: a generous approach on either side of the plinth.
    const pedestal = cyl(booth, 0.83, 0.75, dark, 0, 0.43, 0.3);
    pedestal.userData.id = s.id;
    targets.push(pedestal);
    cyl(booth, 0.87, 0.055, accent, 0, 0.84, 0.3);
    const exhibit = new THREE.Group();
    exhibit.position.set(0, 1.63, 0.3);
    booth.add(exhibit);
    animated.push(exhibit); // Keep moving parts out of the static architecture batch.
    const concept = exhibitConcept(s.id);
    const product = createExhibit(concept.kind, s.color);
    exhibit.add(product.group);
    exhibits.push(product);
    product.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.userData.id = s.id;
        o.userData.action = 'explode';
        o.userData.hint = `${concept.action} · select again to reset`;
        targets.push(o);
      }
    });
    const explore = label(
      booth,
      concept.action,
      1.8,
      0.27,
      0,
      1.01,
      1.16,
      '#e5edd7',
      '#234b35',
      58,
    );
    explore.userData.action = 'explode';
    explore.userData.id = s.id;
    targets.push(explore);
    label(
      booth,
      concept.title.toUpperCase(),
      2.1,
      0.18,
      0,
      0.44,
      1.14,
      '#1d2e2d',
      '#ffffff',
      34,
    );
    label(
      booth,
      'ILLUSTRATIVE EXHIBIT · NOT A DIGITAL TWIN',
      2.8,
      0.15,
      0,
      0.11,
      1.8,
      '#b8a080',
      '#173e36',
      35,
    );
    // Freestanding vertical literature rack with three slanted pockets.
    const rack = new THREE.Group();
    rack.position.set(-2.75, 0, 1.23);
    rack.rotation.y = 0.17;
    booth.add(rack);
    const rackBase = box(rack, 0.82, 0.055, 0.65, steel, 0, 0.075);
    box(rack, 0.09, 1.92, 0.08, steel, 0, 1.05, -0.1);
    box(rack, 0.67, 0.2, 0.07, accent, 0, 2, -0.06);
    label(
      rack,
      s.jobs.length ? `CAREERS / ${s.jobs.length}` : 'CAREERS',
      0.65,
      0.18,
      0,
      2,
      -0.015,
      '#173e36',
      '#fff',
      120,
    );
    for (let j = 0; j < 3; j++) {
      const role = s.jobs[j];
      const isJob = !!role || j === 0;
      const pocket = new THREE.Group();
      pocket.position.set(0, 1.62 - j * 0.43, 0.05);
      pocket.rotation.x = -0.22;
      rack.add(pocket);
      box(pocket, 0.72, 0.38, 0.035, white);
      box(pocket, 0.75, 0.035, 0.16, steel, 0, -0.19, 0.075);
      const card = textPanel(pocket, 0.65, 0.33, 0, 0.005, 0.026, (c) => {
        c.fillStyle = '#fbfbf2';
        c.fillRect(0, 0, 1024, 520);
        c.fillStyle = '#6a8060';
        panelText(
          c,
          role
            ? `ROLE ${j + 1} / ${s.jobs.length}`
            : j === 0
              ? 'SAMPLE ROLE'
              : j === 1
                ? 'COMPANY PROFILE'
                : 'Request follow up',
          45,
          76,
          935,
          38,
          1,
        );
        c.fillStyle = '#1d4532';
        panelText(
          c,
          isJob
            ? (role || boothJobs(s)[0]).title
            : j === 1
              ? 'Company overview'
              : 'Request follow up',
          45,
          166,
          935,
          57,
          3,
        );
        c.fillStyle = '#7c9070';
        c.font = '39px Arial';
        c.fillText('SELECT TO OPEN ↗', 45, 462);
      });
      card.userData.activate = () => {
        if (isJob) {
          openPopup(s.id, 'jobs', role ? j : 0);
          return;
        }
        if (j === 2) {
          openMeeting(s.id);
          return;
        }
        if (renderer.xr.isPresenting) {
          popup.open(s, 'slides');
        } else cb.content?.(s.id, 'about');
      };
      card.userData.hint = isJob
        ? `Read ${role?.title || 'the sample careers card'}`
        : j === 1
          ? 'Read the company story'
          : 'Request follow up';
      targets.push(card);
    }
    // The entire stand can be selected, including its frame and shelf pockets.
    rack.traverse((object) => {
      if (object instanceof THREE.Mesh && !object.userData.activate) {
        object.userData.activate = () => openPopup(s.id, 'jobs');
        object.userData.hint = 'Pick up a careers card';
        targets.push(object);
      }
    });
    // Angled meeting terminal with a large, reliable controller target.
    const kiosk = new THREE.Group();
    kiosk.position.set(2.77, 0, 1.43);
    kiosk.rotation.y = -0.17;
    booth.add(kiosk);
    const kioskBase = box(kiosk, 0.85, 0.09, 0.67, dark, 0, 0.08);
    box(kiosk, 0.56, 1.08, 0.42, white, 0, 0.62);
    box(kiosk, 0.61, 0.04, 0.05, emit, 0, 0.17, 0.23);
    const face = new THREE.Group();
    face.position.set(0, 1.24, 0);
    face.rotation.x = -0.34;
    kiosk.add(face);
    box(face, 0.86, 0.61, 0.09, dark);
    textPanel(face, 0.78, 0.53, 0, 0, 0.051, (c) => {
      c.fillStyle = '#173e36';
      c.fillRect(0, 0, 1024, 696);
      c.fillStyle = s.color;
      c.font = '36px Arial';
      c.fillText('START A CONVERSATION', 48, 74);
      c.fillStyle = '#fff';
      c.font = '600 99px Arial';
      wrap(c, 'Meet ' + s.name, 48, 220, 930, 112);
      c.font = '35px Arial';
      c.fillText('FOLLOW-UP REQUEST', 48, 629);
    });
    actionButton(face, 'Request follow up ↗', 0.78, 0.17, 0, -0.18, 0.057, () =>
      openMeeting(s.id),
    );
    label(
      kiosk,
      'Request follow up',
      0.55,
      0.2,
      0,
      0.77,
      0.216,
      '#eeeee5',
      '#1d4532',
      80,
    );
    label(
      kiosk,
      'Request follow up',
      0.65,
      0.1,
      0,
      0.47,
      0.22,
      '#eeeee5',
      '#607256',
      57,
    );
    booth.updateMatrixWorld(true);
    for (const ob of [
      wall,
      sideWall,
      investmentBack,
      pedestal,
      ...posts,
      rackBase,
      kioskBase,
    ])
      obstacles.push(new THREE.Box3().setFromObject(ob));
  });
  function openMeeting(id: number) {
    openPopup(id, 'meeting');
  }
  function openPopup(id: number, type: BoothPopupType, jobIndex = 0) {
    const company = startups.find((s) => s.id === id);
    if (!company) return;

    keys.clear();
    touchX = touchZ = 0;
    targetPos = null;
    sync();
    if (renderer.xr.isPresenting) {
      popup.open(company, type, jobIndex);
    } else cb.popup?.(id, type, jobIndex);
  }
  // One central information desk with the complete startup overview.
  const desk = new THREE.Group();
  desk.position.set(0, 0, 10);
  scene.add(desk);
  const body = cyl(desk, 2, 1.02, wood, 0, 0.53);
  body.scale.z = 0.55;
  body.userData.id = 0;
  targets.push(body);
  const top = cyl(desk, 2.12, 0.12, white, 0, 1.07);
  top.scale.z = 0.57;
  label(
    desk,
    'i   INFORMATION',
    3,
    0.46,
    0,
    0.66,
    1.08,
    '#99714c',
    '#ffffff',
    115,
  ).userData.id = 0;
  const ring = mesh(
    new THREE.TorusGeometry(2.2, 0.045, 10, 80),
    green,
    desk,
    0,
    4.35,
    0,
  );
  ring.rotation.x = Math.PI / 2;
  label(
    desk,
    '11 STARTUPS. ONE SHARED FUTURE.',
    4.2,
    0.37,
    0,
    3.86,
    0.15,
    '#173e36',
    '#ffffff',
    63,
  );
  for (const x of [-1.6, 1.6]) box(desk, 0.012, 3.3, 0.012, steel, x, 2.85, 0);
  const directory = textPanel(desk, 2.4, 1.6, 0, 1.85, -0.12, (c) => {
    c.fillStyle = '#163c33';
    c.fillRect(0, 0, 1024, 683);
    startups.forEach((s, i) => {
      c.fillStyle = '#fff';
      panelText(
        c,
        s.name,
        45 + (i > 5 ? 490 : 0),
        130 + (i % 6) * 79,
        435,
        33,
        1,
      );
    });
  });
  directory.userData.id = 0;
  targets.push(directory);
  // Separate in-world directory hit areas remain usable during immersive VR.
  startups.forEach((s, i) => {
    const b = mesh(
      new THREE.PlaneGeometry(1.08, 0.16),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      desk,
      i > 5 ? 0.59 : -0.57,
      2.32 - (i % 6) * 0.185,
      -0.108,
    );
    b.userData.action = 'visit';
    b.userData.id = s.id;
    targets.push(b);
  });
  let entered = false,
    paused = false,
    motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    expanded = false,
    expandedID = 1;
  let targetPos: THREE.Vector3 | null = null,
    targetQuat: THREE.Quaternion | null = null;
  let yaw = 0,
    pitch = 0;
  const keys = new Set<string>();
  let touchX = 0,
    touchZ = 0;
  const sync = () => {
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    yaw = e.y;
    pitch = e.x;
  };
  sync();
  function jump(pos: THREE.Vector3, look: THREE.Vector3) {
    popup.close();
    if (renderer.xr.isPresenting) {
      const head = renderer.xr.getCamera();
      const headPos = new THREE.Vector3();
      head.getWorldPosition(headPos);
      const delta = pos.clone().sub(headPos);
      delta.y = -rig.position.y;
      rig.position.add(delta);
      const dir = new THREE.Vector3();
      head.getWorldDirection(dir);
      const desired = Math.atan2(-(look.x - pos.x), -(look.z - pos.z));
      const current = Math.atan2(-dir.x, -dir.z);
      rotateRig(desired - current);
      return;
    }
    targetPos = pos;
    const c = camera.clone();
    c.position.copy(pos);
    c.lookAt(look);
    targetQuat = c.quaternion.clone();
    entered = true;
    cb.mode(true);
  }
  function enter() {
    jump(new THREE.Vector3(0, 1.7, 19), new THREE.Vector3(0, 1.7, -12));
  }
  function visit(id: number) {
    selectedVR = id;
    if (id) cb.visited?.(id);

    expandedID = id || 1;
    expanded = false;
    if (!id) {
      jump(new THREE.Vector3(0, 1.7, 13.6), new THREE.Vector3(0, 1.7, 10));
      return;
    }
    const p = placement(id - 1);
    const front = new THREE.Vector3(-1.15, 1.7, 2.1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), p.r)
      .add(new THREE.Vector3(p.x, 0, p.z));
    jump(front, new THREE.Vector3(p.x, 1.9, p.z - 0.01));
  }
  function overview() {
    popup.close();
    entered = false;
    cb.mode(false);
    targetPos = new THREE.Vector3(15, 8.5, 24);
    const c = camera.clone();
    c.position.copy(targetPos);
    c.lookAt(-1, 1, -6);
    targetQuat = c.quaternion.clone();
  }
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const focus = new THREE.BoxHelper(new THREE.Object3D(), '#00a181');
  focus.visible = false;
  focus.renderOrder = 10;
  scene.add(focus);
  let focusLabel = '';
  function desktopFocus() {
    ray.setFromCamera(pointer, camera);
    const hit =
      !paused && !down ? ray.intersectObjects(targets, true)[0] : undefined;
    const object = hit?.object;
    const interactive =
      object &&
      !object.userData.floor &&
      (object.userData.activate || object.userData.id !== undefined);
    focus.visible = !!interactive;
    let message = '';
    if (interactive) {
      focus.setFromObject(object);
      message =
        object.userData.hint ||
        (object.userData.action === 'explode'
          ? `${exhibitConcept(object.userData.id).action} · select again to reset`
          : object.userData.id === 0
            ? 'Open startup directory'
            : `Explore ${startups.find((s) => s.id === object.userData.id)?.name || 'this booth'}`);
    }
    if (message !== focusLabel) {
      focusLabel = message;
      cb.hint?.(message);
    }
    renderer.domElement.style.cursor = down
      ? 'grabbing'
      : interactive
        ? 'pointer'
        : 'grab';
  }
  function updatePointer(e: PointerEvent) {
    const rect = host.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }
  let down = false,
    lastX = 0,
    lastY = 0,
    travel = 0;
  const pd = (e: PointerEvent) => {
    down = true;
    travel = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.focus();
    focus.visible = false;
    renderer.domElement.style.cursor = 'grabbing';
  };
  const pm = (e: PointerEvent) => {
    updatePointer(e);
    if (!down) {
      desktopFocus();
      return;
    }
    if (paused || popup.active) return;
    const dx = e.clientX - lastX,
      dy = e.clientY - lastY;
    travel += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    if (targetPos) return;
    yaw -= dx * 0.003;
    pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -1.3, 1.3);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  };
  const pu = (e: PointerEvent) => {
    if (!down) return;
    down = false;
    desktopFocus();
    if (travel > 8 || paused) return;
    const rect = host.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(
      popup.active ? popup.targets : targets,
      true,
    )[0];
    if (hit && !popup.active) cues.click(hit.object);
    if (hit?.object.userData.activate) {
      hit.object.userData.activate(hit);
      return;
    }
    if (hit && hit.object.userData.id !== undefined) {
      if (hit.object.userData.action === 'explode') {
        expanded = expandedID === hit.object.userData.id ? !expanded : true;
        expandedID = hit.object.userData.id;
        return;
      }
      cb.select(hit.object.userData.id);
    }
  };
  const kd = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      popup.close();
      keys.clear();
      down = false;
    }
    if (
      paused ||
      popup.active ||
      /INPUT|TEXTAREA|BUTTON/.test((e.target as HTMLElement)?.tagName)
    )
      return;
    if (
      [
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(e.code)
    ) {
      e.preventDefault();
      keys.add(e.code);
      if (!entered) enter();
    }
  };
  const ku = (e: KeyboardEvent) => keys.delete(e.code);
  const blur = () => {
    keys.clear();
    down = false;
    touchX = touchZ = 0;
    focus.visible = false;
    focusLabel = '';
    cb.hint?.('');
  };
  renderer.domElement.addEventListener('pointerdown', pd);
  renderer.domElement.addEventListener('pointermove', pm);
  renderer.domElement.addEventListener('pointerup', pu);
  renderer.domElement.addEventListener('pointercancel', blur);
  renderer.domElement.addEventListener('pointerleave', blur);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('blur', blur);
  const size = () => {
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
  };
  const ro = new ResizeObserver(size);
  ro.observe(host);
  // Batch static architecture by material, preserving interactive meshes and moving exhibits.
  scene.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.Mesh[]>();
  scene.traverse((o) => {
    if (
      !(o instanceof THREE.Mesh) ||
      o instanceof THREE.InstancedMesh ||
      targets.includes(o) ||
      !(o.material instanceof THREE.MeshStandardMaterial) ||
      o.material.transparent
    )
      return;
    let ancestor: THREE.Object3D | null = o;
    while (ancestor) {
      if (animated.includes(ancestor as THREE.Group)) return;
      ancestor = ancestor.parent;
    }
    const list = buckets.get(o.material) || [];
    list.push(o);
    buckets.set(o.material, list);
  });
  for (const [material, objects] of buckets) {
    if (objects.length < 3) continue;
    const geometries = objects.map((o) =>
      o.geometry.clone().applyMatrix4(o.matrixWorld),
    );
    const merged = mergeGeometries(geometries, false);
    if (merged) {
      const batch = new THREE.Mesh(merged, material);
      batch.castShadow = batch.receiveShadow = true;
      scene.add(batch);
      objects.forEach((o) => {
        o.removeFromParent();
        o.geometry.dispose();
      });
    }
    geometries.forEach((g) => g.dispose());
  }
  // Floor-relative rig: head-directed walking, trigger teleport and snap turns.
  const controllers = [
    renderer.xr.getController(0),
    renderer.xr.getController(1),
  ];
  const tempMatrix = new THREE.Matrix4(),
    xrRay = new THREE.Raycaster(),
    headPos = new THREE.Vector3();
  const reticles = controllers.map(() => {
    const o = mesh(
      new THREE.RingGeometry(0.16, 0.23, 32),
      new THREE.MeshBasicMaterial({
        color: '#bbef98',
        side: THREE.DoubleSide,
        depthTest: false,
      }),
      scene,
    );
    o.rotation.x = -Math.PI / 2;
    o.visible = false;
    o.renderOrder = 5;
    return o;
  });
  const selectionDots = controllers.map(() => {
    const dot = mesh(
      new THREE.SphereGeometry(0.018, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#68dfff', depthTest: false }),
      scene,
    );
    dot.visible = false;
    dot.renderOrder = 110;
    return dot;
  });
  const walkingQuaternion = new THREE.Quaternion();
  const walkingEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  let walkReady = false;
  let snapReady = false,
    activeSession: XRSession | null = null,
    vrStarting = false;
  const savedPos = new THREE.Vector3(),
    savedQuat = new THREE.Quaternion();
  let selectedVR = 0;
  function canStand(p: { x: number; z: number }) {
    return (
      Math.abs(p.x) < 17.5 &&
      p.z > -23.7 &&
      p.z < 23 &&
      !(Math.abs(p.x) < 2.3 && Math.abs(p.z - 10) < 1.5) &&
      !hitsObstacle(p, obstacles)
    );
  }
  function rotateRig(angle: number) {
    renderer.xr.getCamera().getWorldPosition(headPos);
    rig.position
      .sub(headPos)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      .add(headPos);
    rig.rotation.y += angle;
    rig.updateMatrixWorld(true);
  }
  const menu = new THREE.Group();
  controllers[0].add(menu);
  menu.position.set(0, 0.07, -0.22);
  menu.rotation.x = -0.7;
  for (const [i, text] of [
    'INFO DESK',
    'PREV BOOTH',
    'NEXT BOOTH',
    'EXIT VR',
  ].entries()) {
    const b = label(
      menu,
      text,
      0.21,
      0.045,
      0,
      i * 0.057,
      0,
      '#174638',
      '#ffffff',
      130,
    );
    b.userData.action = ['home', 'previous', 'next', 'exit'][i];
    extraTargets.push(b);
  }
  const cues = createInteractionCues(scene, () => [
    ...targets,
    ...extraTargets,
  ]);
  const rayHit = (controller: THREE.Object3D) => {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    xrRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    xrRay.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return xrRay.intersectObjects(
      popup.active ? popup.targets : [...extraTargets, ...targets],
      true,
    )[0];
  };
  function selectVR(index: number) {
    if (!renderer.xr.isPresenting) return;
    const h = rayHit(controllers[index]);
    if (!h) return;
    const d = h.object.userData;
    if (!popup.active) cues.click(h.object);
    if (!d.floor || canStand(h.point)) {
      const input = controllerSources[index];
      void input?.gamepad?.hapticActuators?.[0]
        ?.pulse(0.25, 35)
        .catch(() => {});
    }
    if (d.activate) {
      d.activate(h);
      return;
    }
    if (d.action === 'exit') {
      void activeSession?.end();
      return;
    }
    if (d.action === 'home') {
      visit(0);
      return;
    }
    if (d.action === 'next') {
      selectedVR = (selectedVR % 11) + 1;
      visit(selectedVR);
      return;
    }
    if (d.action === 'previous') {
      selectedVR = selectedVR <= 1 ? 11 : selectedVR - 1;
      visit(selectedVR);
      return;
    }
    if (d.action === 'explode') {
      expanded = expandedID === d.id ? !expanded : true;
      expandedID = d.id;
      return;
    }
    if (d.id !== undefined) {
      selectedVR = d.id;
      visit(d.id);
      return;
    }
    if (d.floor && canStand(h.point)) {
      renderer.xr.getCamera().getWorldPosition(headPos);
      rig.position.x += h.point.x - headPos.x;
      rig.position.z += h.point.z - headPos.z;
      rig.updateMatrixWorld(true);
    }
  }
  const selectHandlers = controllers.map((controller, i) => {
    rig.add(controller);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(0, 0, -1),
      ]),
      new THREE.LineBasicMaterial({ color: '#aee3af' }),
    );
    line.name = 'laser';
    line.scale.z = 5;
    controller.add(line);
    const grip = cyl(controller, 0.018, 0.1, dark, 0, -0.025, 0.03);
    grip.rotation.x = Math.PI / 3;
    const fn = () => selectVR(i);
    controller.addEventListener('select', fn);
    return fn;
  });
  const controllerSources: (XRInputSource | undefined)[] = [];
  const connectionHandlers = controllers.map((controller, index) => {
    const connect = (event: { data: XRInputSource }) => {
      controllerSources[index] = event.data;
    };
    const disconnect = () => {
      controllerSources[index] = undefined;
    };
    controller.addEventListener('connected', connect);
    controller.addEventListener('disconnected', disconnect);
    return { connect, disconnect };
  });
  const squeeze = () => {
    if (popup.active) popup.recenter();
  };
  controllers.forEach((controller) =>
    controller.addEventListener('squeeze', squeeze),
  );
  const xrEnd = () => {
    popup.close();
    walkReady = snapReady = false;
    activeSession = null;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, 0, 0);
    camera.position.copy(savedPos);
    camera.quaternion.copy(savedQuat);
    sync();
    targetPos = null;
    controllers.forEach((c) => (c.visible = false));
    reticles.forEach((r) => (r.visible = false));
    selectionDots.forEach((dot) => (dot.visible = false));
    cb.mode(true);
  };
  controllers.forEach((c) => (c.visible = false));
  void navigator.xr?.isSessionSupported('immersive-vr').catch(() => false);
  async function startVR() {
    if (activeSession) {
      await activeSession.end();
      return;
    }
    if (vrStarting) return;
    if (!navigator.xr) {
      cb.error(
        'To enter VR, open this URL in Meta Quest Browser. You can explore the hall on desktop here.',
      );
      return;
    }
    vrStarting = true;
    savedPos.copy(camera.position);
    savedQuat.copy(camera.quaternion);
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor'],
      });
      activeSession = session;
      walkReady = snapReady = false;
      session.addEventListener('end', xrEnd, { once: true });
      targetPos = null;
      paused = false;
      focus.visible = false;
      entered = true;
      cb.mode(true);
      rig.position.set(0, 0, 19);
      rig.rotation.set(0, 0, 0);
      camera.position.set(0, 0, 0);
      camera.quaternion.identity();
      renderer.xr.setReferenceSpaceType('local-floor');
      renderer.xr.setFramebufferScaleFactor(1);
      renderer.xr.setFoveation(1);
      controllers.forEach((c) => (c.visible = true));
      await renderer.xr.setSession(session);
    } catch (e) {
      if (activeSession) {
        await activeSession.end().catch(() => {});
      } else {
        camera.position.copy(savedPos);
        camera.quaternion.copy(savedQuat);
        sync();
      }
      cb.error(
        (e as Error).name === 'NotAllowedError'
          ? 'VR permission was declined. Allow immersive access in your browser and try again.'
          : 'VR could not start. Open the secure exhibition URL in Meta Quest Browser and try again.',
      );
    } finally {
      vrStarting = false;
    }
  }
  const granted = () => {
    void startVR();
  };
  navigator.xr?.addEventListener('sessiongranted', granted);
  let last = performance.now(),
    posTimer = 0,
    elapsed = 0;
  renderer.setAnimationLoop((time) => {
    const dt = Math.min((time - last) / 1000, 0.05);
    last = time;
    elapsed += dt;
    if (targetPos && !renderer.xr.isPresenting) {
      const f = motion ? 1 - Math.exp(-dt * 5) : 1;
      camera.position.lerp(targetPos, f);
      camera.quaternion.slerp(targetQuat!, f);
      if (camera.position.distanceTo(targetPos) < 0.015) {
        camera.position.copy(targetPos);
        camera.quaternion.copy(targetQuat!);
        targetPos = null;
        sync();
      }
    } else if (
      entered &&
      !paused &&
      !popup.active &&
      !renderer.xr.isPresenting
    ) {
      const x =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
        touchX;
      const z =
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) -
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) +
        touchZ;
      const step = new THREE.Vector3(x, 0, z);
      if (step.length() > 1) step.normalize();
      step
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
        .multiplyScalar(dt * 3.4);
      const next = camera.position.clone().add(step);
      next.x = THREE.MathUtils.clamp(next.x, -17.6, 17.6);
      next.z = THREE.MathUtils.clamp(next.z, -23.7, 23);
      if (
        !hitsObstacle(next, obstacles, 0.28) &&
        !(Math.abs(next.x) < 2.3 && Math.abs(next.z - 10) < 1.4)
      )
        camera.position.copy(next);
    }
    // Keep the instructional objects facing the visitor; their own parts animate.
    exhibits.forEach((e, i) =>
      e.update(elapsed, expanded && expandedID === startups[i].id, motion),
    );
    if (renderer.xr.isPresenting) {
      // Update the headset's world pose before using its heading and floor position.
      renderer.xr.updateCamera(camera);
      const session = renderer.xr.getSession();
      let walk = { x: 0, y: 0 };
      let turn = 0;
      for (const source of session?.inputSources || []) {
        if (source.handedness === 'left') walk = thumbstick(source.gamepad);
        if (source.handedness === 'right') turn = thumbstick(source.gamepad).x;
      }
      if (paused || popup.active || session?.visibilityState !== 'visible') {
        walkReady = snapReady = false;
      } else {
        // Require a centered stick after a popup or headset menu closes.
        if (Math.hypot(walk.x, walk.y) <= stickDeadzone) walkReady = true;
        if (Math.abs(turn) < 0.3) snapReady = true;
        if (Math.abs(turn) > 0.7 && snapReady) {
          rotateRig((-Math.sign(turn) * Math.PI) / 6);
          renderer.xr.updateCamera(camera);
          snapReady = false;
        }
        if (walkReady) {
          const head = renderer.xr.getCamera();
          head.getWorldQuaternion(walkingQuaternion);
          walkingEuler.setFromQuaternion(walkingQuaternion, 'YXZ');
          const step = joystickStep(walk.x, walk.y, walkingEuler.y, dt);
          if (step.x || step.z) {
            head.getWorldPosition(headPos);
            const next = slideOnFloor(headPos, step, canStand);
            rig.position.x += next.x - headPos.x;
            rig.position.z += next.z - headPos.z;
            rig.updateMatrixWorld(true);
            renderer.xr.updateCamera(camera);
          }
        }
      }
      let popupHit: THREE.Intersection | undefined;
      controllers.forEach((c, i) => {
        const hit = rayHit(c);
        cues.hover(i, popup.active ? undefined : hit?.object);
        const laser = c.getObjectByName('laser') as THREE.Line;
        if (laser) {
          laser.scale.z = hit ? hit.distance : 7;
          (laser.material as THREE.LineBasicMaterial).color.set(
            hit && !hit.object.userData.floor ? '#68dfff' : '#aee3af',
          );
        }
        selectionDots[i].visible = !!hit && !hit.object.userData.floor;
        if (selectionDots[i].visible)
          selectionDots[i].position.copy(hit!.point);
        if (popup.active && hit) popupHit = hit;
        reticles[i].visible = !!hit?.object.userData.floor;
        if (reticles[i].visible) {
          reticles[i].position.set(hit!.point.x, 0.025, hit!.point.z);
          (reticles[i].material as THREE.MeshBasicMaterial).color.set(
            canStand(hit!.point) ? '#bbef98' : '#ee8c75',
          );
        }
      });
      if (popup.active) popup.hover(popupHit);
    }
    posTimer += dt;
    if (posTimer > 0.15) {
      if (renderer.xr.isPresenting) {
        renderer.xr.getCamera().getWorldPosition(headPos);
        cb.position(headPos.x, headPos.z);
      } else cb.position(camera.position.x, camera.position.z);
      posTimer = 0;
    }
    if (!renderer.xr.isPresenting) {
      cues.hover(0);
      cues.hover(1);
    }
    const activeCamera = renderer.xr.isPresenting
      ? renderer.xr.getCamera()
      : camera;
    cues.update(time / 1000, activeCamera, motion, !paused && !popup.active);
    popup.update(time / 1000, motion);
    if (focus.visible) {
      const line = focus.material as THREE.LineBasicMaterial;
      line.transparent = true;
      line.opacity = motion ? 0.72 + Math.sin(time / 420) * 0.15 : 0.85;
    }
    renderer.render(scene, camera);
  });
  cb.ready();
  return {
    enter,
    visit,
    overview,
    meeting: openMeeting,
    showcase(id) {
      expanded = expandedID === id ? !expanded : true;
      expandedID = id;
    },
    pause(v) {
      paused = v;
      focus.visible = false;
      focusLabel = '';
      cb.hint?.('');
      if (v) {
      }
      keys.clear();
    },
    move(x, z) {
      touchX = x;
      touchZ = z;
    },
    motion(v) {
      motion = v;
    },
    explode(v) {
      expanded = v;
    },
    vr: startVR,
    dispose() {
      disposed = true;
      popup.dispose();
      cues.dispose();
      focus.removeFromParent();
      focus.geometry.dispose();
      (focus.material as THREE.Material).dispose();
      void activeSession?.end();
      navigator.xr?.removeEventListener('sessiongranted', granted);
      controllers.forEach((c, i) =>
        c.removeEventListener('select', selectHandlers[i]),
      );
      controllers.forEach((c) => c.removeEventListener('squeeze', squeeze));
      controllers.forEach((c, i) => {
        c.removeEventListener('connected', connectionHandlers[i].connect);
        c.removeEventListener('disconnected', connectionHandlers[i].disconnect);
      });
      renderer.setAnimationLoop(null);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
      renderer.domElement.removeEventListener('pointerdown', pd);
      renderer.domElement.removeEventListener('pointermove', pm);
      renderer.domElement.removeEventListener('pointerup', pu);
      renderer.domElement.removeEventListener('pointercancel', blur);
      renderer.domElement.removeEventListener('pointerleave', blur);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          }
        }
      });
      grain.dispose();
      timberTex.dispose();
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
