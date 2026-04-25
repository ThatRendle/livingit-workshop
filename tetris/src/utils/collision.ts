// Custom AABB collision — no Phaser Arcade Physics.

export interface AABB {
  x: number; // left edge
  y: number; // top edge
  width: number;
  height: number;
}

export interface CircleBall {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
}

export interface CollisionResult {
  hit: boolean;
  normalX: number; // unit normal facing outward from AABB
  normalY: number;
  overlapX: number;
  overlapY: number;
}

/** Test and resolve a circle vs AABB collision.
 *  Mutates ball position (pushes out) and returns the normal for velocity reflection.
 *  Returns hit=false if no overlap. */
export function resolveCircleAABB(ball: CircleBall, box: AABB): CollisionResult {
  const closestX = Math.max(box.x, Math.min(ball.x, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(ball.y, box.y + box.height));

  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= ball.radius * ball.radius) {
    return { hit: false, normalX: 0, normalY: 0, overlapX: 0, overlapY: 0 };
  }

  const dist = Math.sqrt(distSq);

  let normalX: number;
  let normalY: number;
  let overlapX: number;
  let overlapY: number;

  if (dist === 0) {
    // Ball centre is inside the box — push out on the axis of least penetration
    const overlapLeft = ball.x - box.x + ball.radius;
    const overlapRight = box.x + box.width - ball.x + ball.radius;
    const overlapTop = ball.y - box.y + ball.radius;
    const overlapBottom = box.y + box.height - ball.y + ball.radius;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft) {
      normalX = -1; normalY = 0;
      overlapX = overlapLeft; overlapY = 0;
      ball.x -= overlapLeft;
    } else if (minOverlap === overlapRight) {
      normalX = 1; normalY = 0;
      overlapX = overlapRight; overlapY = 0;
      ball.x += overlapRight;
    } else if (minOverlap === overlapTop) {
      normalX = 0; normalY = -1;
      overlapX = 0; overlapY = overlapTop;
      ball.y -= overlapTop;
    } else {
      normalX = 0; normalY = 1;
      overlapX = 0; overlapY = overlapBottom;
      ball.y += overlapBottom;
    }
  } else {
    normalX = dx / dist;
    normalY = dy / dist;
    const overlap = ball.radius - dist;
    overlapX = normalX * overlap;
    overlapY = normalY * overlap;
    ball.x += overlapX;
    ball.y += overlapY;
  }

  return { hit: true, normalX, normalY, overlapX, overlapY };
}

/** Reflect a velocity vector off a surface with the given unit normal.
 *  Returns a new [vx, vy] — does not mutate input. */
export function reflectVelocity(
  vx: number,
  vy: number,
  normalX: number,
  normalY: number
): readonly [number, number] {
  // v' = v - 2(v·n)n
  const dot = vx * normalX + vy * normalY;
  return [vx - 2 * dot * normalX, vy - 2 * dot * normalY];
}
