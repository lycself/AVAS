/** Display lanes are schematic; longitudinal coordinates are never changed. */
export type Interval = { z0: number; z1: number };
export type LaneItem = Interval & { lane: number; block: number | null };

export function overlaps(a: Interval, b: Interval): boolean {
  if (a.z0 === a.z1 || b.z0 === b.z1) return a.z0 <= b.z1 && b.z0 <= a.z1;
  return a.z0 < b.z1 - 1e-10 && b.z0 < a.z1 - 1e-10;
}

export function assignLanes<T extends Interval>(items: T[]): (T & { lane: number })[] {
  const lanes: Interval[][] = [];
  const assigned = new Map<T, number>();
  for (const item of [...items].sort((a, b) => a.z0 - b.z0 || b.z1 - a.z1)) {
    let lane = lanes.findIndex((members) => members.every((other) => !overlaps(item, other)));
    if (lane < 0) { lane = lanes.length; lanes.push([]); }
    lanes[lane].push(item);
    assigned.set(item, lane);
  }
  return items.map((item) => ({ ...item, lane: assigned.get(item)! }));
}

export const LANE_HEIGHT = 32;
export const LANE_TOP = 36;
export const laneCenter = (lane: number) => LANE_TOP + (lane + 0.5) * LANE_HEIGHT;
export const laneAt = (y: number) => Math.floor((y - LANE_TOP) / LANE_HEIGHT);

export function superposeGroups(items: LaneItem[]): Interval[] {
  const groups = new Map<number, Interval>();
  for (const item of items) {
    if (item.block == null) continue;
    const group = groups.get(item.block);
    groups.set(item.block, { z0: Math.min(group?.z0 ?? item.z0, item.z0), z1: Math.max(group?.z1 ?? item.z1, item.z1) });
  }
  return [...groups.values()];
}

export function drawGroups(ctx: CanvasRenderingContext2D, items: LaneItem[], xOf: (z: number) => number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  for (const group of superposeGroups(items)) {
    const x0 = xOf(group.z0), x1 = xOf(group.z1);
    ctx.beginPath();
    ctx.moveTo(x0, 33); ctx.lineTo(x0, 27); ctx.lineTo(x1, 27); ctx.lineTo(x1, 33);
    ctx.stroke();
    if (x1 - x0 > 64) ctx.fillText("superpose", (x0 + x1) / 2, 25);
  }
  ctx.restore();
}
