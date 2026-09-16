import * as THREE from 'three';
import type { ExhibitKind } from './exhibit-concepts';

// Small schematic teaching objects, with shared low-resolution geometry.
export function createExhibit(kind: ExhibitKind, color: string) {
  const group = new THREE.Group();
  group.name = `concept-${kind}`;
  const motions: ((time: number, amount: number) => void)[] = [];
  const mat = (c: string, metalness = 0.15) =>
    new THREE.MeshStandardMaterial({ color: c, metalness, roughness: 0.48 });
  const stone = mat('#dce4df'),
    dark = mat('#263d39'),
    accent = mat(color),
    metal = mat('#aebdb7', 0.7),
    warm = mat('#efad61'),
    blue = mat('#67c5e8');
  const glow = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.55,
    roughness: 0.45,
  });
  const sphere = new THREE.SphereGeometry(1, 12, 8),
    cube = new THREE.BoxGeometry(1, 1, 1),
    rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  const mesh = (
    geo: THREE.BufferGeometry,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    p: THREE.Object3D = group,
  ) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    p.add(o);
    return o;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    p: THREE.Object3D = group,
  ) => {
    const o = mesh(cube, m, x, y, z, p);
    o.scale.set(w, h, d);
    return o;
  };
  const ball = (
    r: number,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    p: THREE.Object3D = group,
  ) => {
    const o = mesh(sphere, m, x, y, z, p);
    o.scale.setScalar(r);
    return o;
  };
  const line = (
    a: number[],
    b: number[],
    m: THREE.Material,
    r = 0.018,
    p: THREE.Object3D = group,
  ) => {
    const from = new THREE.Vector3(...a),
      to = new THREE.Vector3(...b),
      delta = to.clone().sub(from),
      o = mesh(rod, m, 0, 0, 0, p);
    o.position.copy(from).add(to).multiplyScalar(0.5);
    o.scale.set(r, delta.length(), r);
    o.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return o;
  };
  const ring = (
    r: number,
    m: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    p: THREE.Object3D = group,
  ) => mesh(new THREE.TorusGeometry(r, 0.025, 6, 24), m, x, y, z, p);
  const plaque = (
    text: string,
    x: number,
    y: number,
    z: number,
    w = 0.7,
    h = 0.25,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = Math.round((512 * h) / w);
    const c = canvas.getContext('2d')!;
    c.fillStyle = '#eef4ee';
    c.fillRect(0, 0, 512, canvas.height);
    c.fillStyle = '#173e36';
    c.font = '600 65px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 256, canvas.height / 2, 480);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
      x,
      y,
      z,
    );
  };
  if (kind === 'circular') {
    const pieces: THREE.Mesh[] = [],
      starts: THREE.Vector3[] = [];
    for (let i = 0; i < 9; i++) {
      const o = box(
        0.22,
        0.2,
        0.22,
        i % 3 === 0 ? stone : i % 3 === 1 ? metal : accent,
        ((i % 3) - 1) * 0.23,
        -0.28 + Math.floor(i / 3) * 0.17,
        (i % 2) * 0.12,
      );
      o.rotation.set(i * 0.19, i * 0.4, 0.17);
      pieces.push(o);
      starts.push(o.position.clone());
    }
    const co2 = new THREE.Group();
    group.add(co2);
    co2.position.y = 0.58;
    ball(0.095, dark, 0, 0, 0, co2);
    for (const x of [-0.2, 0.2]) {
      ball(0.08, blue, x, 0, 0, co2);
      line([0, 0, 0], [x, 0, 0], metal, 0.018, co2);
    }
    plaque('CO₂', 0, 0.8, 0, 0.45, 0.18);
    motions.push((t, a) => {
      pieces.forEach((o, i) => {
        o.position
          .copy(starts[i])
          .lerp(
            new THREE.Vector3(
              ((i % 3) - 1) * 0.46,
              -0.35 + Math.floor(i / 3) * 0.22,
              0,
            ),
            a,
          );
        o.rotation.z = 0.17 * (1 - a);
      });
      co2.position.y = 0.58 - a * 0.18;
    });
  } else if (kind === 'engineering') {
    const pages: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Group();
      group.add(p);
      p.position.set(-0.5, -0.08 + i * 0.09, i * 0.08);
      box(0.38, 0.53, 0.025, stone, 0, 0, 0, p);
      for (let j = 0; j < 3; j++)
        box(
          0.24 - j * 0.03,
          0.025,
          0.012,
          j === 0 ? accent : metal,
          0,
          0.13 - j * 0.1,
          0.022,
          p,
        );
      pages.push(p);
    }
    box(0.3, 0.3, 0.3, accent, 0, 0.08);
    plaque('AI', 0, 0.09, 0.16, 0.22, 0.14);
    const part = ring(0.23, metal, 0.54, 0.08);
    box(0.13, 0.13, 0.13, dark, 0.54, 0.08);
    line([-0.28, 0.08, 0], [-0.16, 0.08, 0], glow);
    line([0.16, 0.08, 0], [0.3, 0.08, 0], glow);
    motions.push((t, a) => {
      pages.forEach((p, i) => {
        p.rotation.y = (i - 1) * a * 0.4;
        p.position.y = -0.1 + i * (0.09 + a * 0.13);
      });
      part.rotation.z = a * t * 0.4;
    });
  } else if (kind === 'isolation') {
    const halves = [-1, 1].map((sign) => {
      const p = new THREE.Group();
      p.position.x = sign * 0.33;
      group.add(p);
      box(0.35, 0.48, 0.45, dark, 0, 0, 0, p);
      box(0.31, 0.06, 0.46, metal, 0, 0.26, 0, p);
      const lens = ball(0.085, blue, -sign * 0.19, 0, 0, p);
      lens.scale.x = 0.025;
      return p;
    });
    const beam = line([-0.15, 0, 0], [0.15, 0, 0], glow, 0.013),
      pulse = ball(0.045, glow);
    motions.push((t, a) => {
      halves.forEach(
        (p, i) => (p.position.x = (i ? 1 : -1) * (0.33 + a * 0.2)),
      );
      beam.scale.y = 0.3 + a * 0.4;
      pulse.position.x = (((t * 0.5) % 1) - 0.5) * (0.3 + a * 0.4);
    });
  } else if (kind === 'swarm') {
    const convoy = new THREE.Group();
    group.add(convoy);
    box(1.08, 0.27, 0.7, stone, 0, 0.15, 0, convoy);
    box(0.8, 0.045, 0.46, accent, 0, 0.307, 0, convoy);
    for (const x of [-0.38, 0.38])
      for (const z of [-0.23, 0.23]) {
        box(0.34, 0.14, 0.29, accent, x, -0.14, z, convoy);
        for (const side of [-1, 1]) {
          const wheel = mesh(
            new THREE.CylinderGeometry(0.068, 0.068, 0.065, 12),
            dark,
            x + side * 0.15,
            -0.23,
            z,
            convoy,
          );
          wheel.rotation.z = Math.PI / 2;
        }
      }
    motions.push((t, a) => {
      convoy.position.x = Math.sin(t * 0.65) * 0.18 * a;
      convoy.position.z = Math.cos(t * 0.65) * 0.12 * a;
      convoy.rotation.y = Math.sin(t * 0.65) * 0.12 * a;
    });
  } else if (kind === 'assurance') {
    box(0.35, 0.35, 0.35, accent);
    plaque('AI', 0, 0, 0.18, 0.25, 0.15);
    const frames: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Group();
      group.add(p);
      for (const sign of [-1, 1]) {
        box(0.76, 0.035, 0.035, i === 1 ? metal : stone, 0, sign * 0.38, 0, p);
        box(0.035, 0.76, 0.035, i === 1 ? metal : stone, sign * 0.38, 0, 0, p);
      }
      frames.push(p);
    }
    const check = new THREE.Group();
    group.add(check);
    line([-0.16, 0.05, 0], [-0.04, -0.07, 0], glow, 0.04, check);
    line([-0.04, -0.07, 0], [0.2, 0.22, 0], glow, 0.04, check);
    check.position.y = 0.59;
    motions.push((t, a) => {
      frames.forEach((p, i) => {
        p.position.z = (i - 1) * (0.13 + 0.23 * a);
        p.rotation.z = (i - 1) * a * 0.16;
      });
      check.scale.setScalar(0.01 + 0.99 * a);
    });
  } else if (kind === 'nanotexture') {
    box(0.62, 0.1, 0.75, metal, -0.37, -0.31);
    box(0.62, 0.1, 0.75, metal, 0.37, -0.31);
    const texture = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.038, 1, 6),
      metal,
      36,
    );
    texture.castShadow = true;
    group.add(texture);
    const dummy = new THREE.Object3D();
    plaque('SMOOTH', -0.37, -0.5, 0.39, 0.6, 0.15);
    plaque('TEXTURED', 0.37, -0.5, 0.39, 0.6, 0.15);
    motions.push((t, a) => {
      const h = 0.06 + 0.27 * a;
      for (let i = 0; i < 36; i++) {
        dummy.position.set(
          0.12 + (i % 6) * 0.1,
          -0.26 + h / 2,
          -0.25 + Math.floor(i / 6) * 0.1,
        );
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        texture.setMatrixAt(i, dummy.matrix);
      }
      texture.instanceMatrix.needsUpdate = true;
      texture.computeBoundingSphere();
    });
  } else if (kind === 'heat-power') {
    for (let j = 0; j < 3; j++) {
      const pts = Array.from(
        { length: 13 },
        (_, i) =>
          new THREE.Vector3(
            -0.73 + i * 0.024,
            -0.28 + j * 0.21 + Math.sin((i / 12) * Math.PI * 2) * 0.045,
            0,
          ),
      );
      mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(pts),
          16,
          0.023,
          5,
          false,
        ),
        warm,
      );
    }
    const wheel = new THREE.Group();
    group.add(wheel);
    ring(0.26, metal, 0, 0, 0, wheel);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      line(
        [0, 0, 0],
        [Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0],
        accent,
        0.02,
        wheel,
      );
    }
    ball(0.08, metal);
    const lamp = ball(0.17, glow, 0.58, 0.14);
    box(0.16, 0.16, 0.16, dark, 0.58, -0.1);
    line([0.29, 0, 0], [0.48, 0, 0], metal);
    motions.push((t, a) => {
      wheel.rotation.z = -t * 1.7 * a;
      lamp.scale.setScalar(0.13 + 0.04 * a);
      glow.emissiveIntensity = 0.08 + 0.8 * a;
    });
  } else if (kind === 'conductive') {
    box(1.35, 0.065, 0.72, stone, 0, -0.29);
    const particles: THREE.Mesh[] = [],
      start: THREE.Vector3[] = [];
    for (let i = 0; i < 9; i++) {
      const o = ball(
        0.075,
        metal,
        -0.52 + (i % 3) * 0.5,
        -0.15,
        (Math.floor(i / 3) - 1) * 0.22,
      );
      particles.push(o);
      start.push(o.position.clone());
    }
    const path = new THREE.Group();
    group.add(path);
    for (let i = 0; i < 8; i++) {
      const x = -0.54 + i * 0.135;
      line(
        [x, -0.15, Math.sin(i * 0.8) * 0.12],
        [x + 0.135, -0.15, Math.sin((i + 1) * 0.8) * 0.12],
        accent,
        0.023,
        path,
      );
    }
    const light = ball(0.07, glow, 0.67, -0.12);
    motions.push((t, a) => {
      particles.forEach((o, i) =>
        o.position
          .copy(start[i])
          .lerp(
            new THREE.Vector3(
              -0.54 + i * 0.135,
              -0.15,
              Math.sin(i * 0.8) * 0.12,
            ),
            a,
          ),
      );
      path.visible = a > 0.6;
      light.scale.setScalar(0.045 + 0.025 * a);
      glow.emissiveIntensity = 0.08 + 0.8 * a;
    });
  } else if (kind === 'explainable') {
    line([-0.68, -0.36, 0], [0.68, -0.36, 0], metal);
    line([-0.68, -0.36, 0], [-0.68, 0.55, 0], metal);
    for (let i = 0; i < 9; i++) {
      const x = -0.55 + i * 0.1375;
      ball(0.035, accent, x, x * x * 1.5 - 0.25 + Math.sin(i * 2) * 0.06, 0.04);
    }
    const pts = Array.from({ length: 25 }, (_, i) => {
      const x = -0.6 + i * 0.05;
      return new THREE.Vector3(x, x * x * 1.5 - 0.25, 0);
    });
    const curve = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        28,
        0.022,
        6,
        false,
      ),
      glow,
    );
    const formula = plaque('y = x²', 0.25, 0.58, 0, 0.7, 0.25);
    motions.push((t, a) => {
      curve.visible = a > 0.15;
      formula.scale.setScalar(0.01 + 0.99 * a);
    });
  } else if (kind === 'sun-hydrogen') {
    box(1.04, 0.07, 0.6, dark, 0, -0.22);
    box(0.96, 0.018, 0.52, blue, 0, -0.174);
    ball(0.15, warm, -0.5, 0.64);
    for (let i = 0; i < 3; i++)
      line(
        [-0.5 + i * 0.08, 0.43, 0],
        [-0.25 + i * 0.16, -0.12, 0],
        warm,
        0.012,
      );
    const water = new THREE.Group();
    group.add(water);
    water.position.set(-0.59, -0.09, 0.3);
    ball(0.085, blue, 0, 0, 0, water);
    ball(0.05, stone, -0.08, 0.08, 0, water);
    ball(0.05, stone, 0.08, 0.08, 0, water);
    plaque('H₂O', -0.59, -0.42, 0.34, 0.4, 0.16);
    plaque('H₂', 0.53, 0.69, 0, 0.4, 0.18);
    const bubbles = Array.from({ length: 3 }, () => {
      const p = new THREE.Group();
      group.add(p);
      ball(0.055, accent, -0.055, 0, 0, p);
      ball(0.055, accent, 0.055, 0, 0, p);
      return p;
    });
    motions.push((t, a) => {
      bubbles.forEach((p, i) => {
        p.position.set(
          0.4 + (i % 2) * 0.13,
          -0.02 + ((t * 0.23 + i / 3) % 1) * 0.56 * a,
          0,
        );
        p.scale.setScalar(i === 0 ? 1 : a);
      });
    });
  } else {
    const corners: THREE.Mesh[] = [];
    for (const x of [-1, 1])
      for (const y of [-1, 1])
        for (const z of [-1, 1])
          corners.push(
            box(0.18, 0.18, 0.18, accent, x * 0.23, y * 0.23, z * 0.23),
          );
    plaque('CONCEPT PENDING', 0, 0.6, 0, 1.35, 0.19);
    motions.push((t, a) => {
      for (const o of corners)
        o.position.set(
          Math.sign(o.position.x) * (0.23 + 0.12 * a),
          Math.sign(o.position.y) * (0.23 + 0.12 * a),
          Math.sign(o.position.z) * (0.23 + 0.12 * a),
        );
    });
  }
  let amount = 0,
    lastTime: number | undefined;
  const apply = (t: number) => motions.forEach((f) => f(t, amount));
  apply(0);
  return {
    group,
    update(time: number, expanded: boolean, animate = true) {
      const dt =
        lastTime === undefined
          ? 1 / 60
          : Math.max(0, Math.min(time - lastTime, 0.1));
      lastTime = time;
      amount = animate
        ? THREE.MathUtils.lerp(amount, expanded ? 1 : 0, 1 - Math.exp(-dt * 7))
        : expanded
          ? 1
          : 0;
      apply(animate ? time : 0);
    },
  };
}
