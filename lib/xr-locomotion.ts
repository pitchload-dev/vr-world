type FloorPoint = { x: number; z: number };
export const stickDeadzone = 0.16;

// xr-standard reserves axes 2/3 for the thumbstick (0/1 are the touchpad).
// https://www.w3.org/TR/webxr-gamepads-module-1/#xr-standard-gamepad-mapping
export function thumbstick(gamepad?: Pick<Gamepad, 'axes'> | null) {
  return {
    x: Number.isFinite(gamepad?.axes[2]) ? gamepad!.axes[2] : 0,
    y: Number.isFinite(gamepad?.axes[3]) ? gamepad!.axes[3] : 0,
  };
}

export function joystickStep(
  x: number,
  y: number,
  yaw: number,
  dt: number,
): FloorPoint {
  const length = Math.hypot(x, y);
  if (length <= stickDeadzone) return { x: 0, z: 0 };
  const strength = (Math.min(1, length) - stickDeadzone) / (1 - stickDeadzone);
  const scale = (strength * 1.8 * Math.max(0, Math.min(dt, 0.05))) / length;
  // Forward on the stick is negative Y, matching the camera's local -Z.
  return {
    x: (x * Math.cos(yaw) + y * Math.sin(yaw)) * scale,
    z: (-x * Math.sin(yaw) + y * Math.cos(yaw)) * scale,
  };
}

export function slideOnFloor(
  start: FloorPoint,
  step: FloorPoint,
  canStand: (point: FloorPoint) => boolean,
): FloorPoint {
  const next = { ...start };
  const count = Math.max(1, Math.ceil(Math.hypot(step.x, step.z) / 0.08));
  for (let i = 0; i < count; i++) {
    const x = next.x + step.x / count;
    if (canStand({ x, z: next.z })) next.x = x;
    const z = next.z + step.z / count;
    if (canStand({ x: next.x, z })) next.z = z;
  }
  return next;
}
