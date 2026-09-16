import * as THREE from 'three';

// A fixed pool of outlines keeps hints inexpensive and leaves hit targets still.
export function createInteractionCues(
  scene: THREE.Scene,
  targets: () => THREE.Object3D[],
) {
  const make = (color: string) => {
    const helper = new THREE.Box3Helper(new THREE.Box3(), color);
    const material = helper.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.depthWrite = false;
    material.toneMapped = false;
    helper.visible = false;
    scene.add(helper);
    return helper;
  };
  const idle = make('#c7e6ac'),
    click = make('#8cebcf');
  const hover = [make('#80dec6'), make('#80dec6')];
  const head = new THREE.Vector3(),
    center = new THREE.Vector3(),
    size = new THREE.Vector3();
  const bounds = new THREE.Box3();
  let candidate: THREE.Object3D | undefined,
    clicked: THREE.Object3D | undefined;
  let nextHint = 0,
    hintStarted = 0,
    clickedAt = -Infinity,
    cursor = 0;
  const hovered: (THREE.Object3D | undefined)[] = [];
  const usable = (object?: THREE.Object3D) =>
    object &&
    !object.userData.floor &&
    (object.userData.activate ||
      object.userData.action ||
      object.userData.id !== undefined);
  function outline(
    helper: THREE.Box3Helper,
    object: THREE.Object3D,
    opacity: number,
    padding = 0.018,
  ) {
    helper.box.setFromObject(object).expandByScalar(padding);
    helper.visible = !helper.box.isEmpty();
    (helper.material as THREE.LineBasicMaterial).opacity = opacity;
  }
  return {
    hover(index: number, object?: THREE.Object3D) {
      hovered[index] = usable(object) ? object : undefined;
    },
    click(object: THREE.Object3D) {
      if (usable(object)) {
        clicked = object;
        clickedAt = performance.now() / 1000;
      }
    },
    update(
      time: number,
      camera: THREE.Camera,
      motion: boolean,
      enabled: boolean,
    ) {
      idle.visible = click.visible = false;
      hover.forEach((helper, i) => {
        helper.visible = false;
        if (enabled && hovered[i])
          outline(
            helper,
            hovered[i]!,
            motion ? 0.62 + Math.sin(time * 3) * 0.12 : 0.72,
          );
      });
      if (!enabled || !motion) return;
      camera.getWorldPosition(head);
      if (time >= nextHint) {
        // Cycle all nearby targets, one quiet shimmer at a time.
        const nearby = [...new Set(targets())].filter((object) => {
          if (!usable(object)) return false;
          let ancestor: THREE.Object3D | null = object;
          while (ancestor) {
            if (!ancestor.visible) return false;
            ancestor = ancestor.parent;
          }
          bounds.setFromObject(object).getCenter(center);
          bounds.getSize(size);
          return center.distanceToSquared(head) < 64 && size.length() < 6;
        });
        candidate = nearby.length
          ? nearby[cursor++ % nearby.length]
          : undefined;
        hintStarted = time;
        nextHint = time + 3.8;
      }
      const phase = (time - hintStarted) / 1.4;
      if (candidate && phase < 1)
        outline(idle, candidate, Math.sin(phase * Math.PI) * 0.48);
      const pressed = (time - clickedAt) / 0.32;
      if (clicked && pressed >= 0 && pressed < 1)
        outline(click, clicked, (1 - pressed) * 0.9, 0.012 + pressed * 0.045);
    },
    dispose() {
      for (const helper of [idle, click, ...hover]) {
        helper.removeFromParent();
        helper.geometry.dispose();
        (helper.material as THREE.Material).dispose();
      }
    },
  };
}
