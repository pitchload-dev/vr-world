export type FloorObstacle = {
  min: { x: number; z: number };
  max: { x: number; z: number };
};
export function hitsObstacle(
  point: { x: number; z: number },
  obstacles: FloorObstacle[],
  clearance = 0.3,
) {
  return obstacles.some(
    (b) =>
      point.x >= b.min.x - clearance &&
      point.x <= b.max.x + clearance &&
      point.z >= b.min.z - clearance &&
      point.z <= b.max.z + clearance,
  );
}
