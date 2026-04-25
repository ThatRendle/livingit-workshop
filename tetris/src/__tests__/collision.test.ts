import { describe, it, expect } from "vitest";
import { resolveCircleAABB, reflectVelocity } from "../utils/collision";

function makeBall(x: number, y: number, vx = 0, vy = 0, radius = 8) {
  return { x, y, velocityX: vx, velocityY: vy, radius };
}

function makeBox(x: number, y: number, w = 30, h = 30) {
  return { x, y, width: w, height: h };
}

describe("resolveCircleAABB", () => {
  it("returns hit=false when ball is far from box", () => {
    const ball = makeBall(100, 100);
    const box = makeBox(200, 200);
    const result = resolveCircleAABB(ball, box);
    expect(result.hit).toBe(false);
  });

  it("detects a hit when ball overlaps box on the right side", () => {
    // Box at (100,100) size 30x30 → right edge at 130
    // Ball at x=122, radius=8 → left edge of ball at 114, overlapping
    const ball = makeBall(122, 115);
    const box = makeBox(100, 100);
    const result = resolveCircleAABB(ball, box);
    expect(result.hit).toBe(true);
    expect(result.normalX).toBeGreaterThan(0); // pushed right
  });

  it("detects a hit when ball overlaps box on the left side", () => {
    const ball = makeBall(98, 115);
    const box = makeBox(100, 100);
    const result = resolveCircleAABB(ball, box);
    expect(result.hit).toBe(true);
    expect(result.normalX).toBeLessThan(0); // pushed left
  });

  it("detects a hit on the top face", () => {
    const ball = makeBall(115, 98);
    const box = makeBox(100, 100);
    const result = resolveCircleAABB(ball, box);
    expect(result.hit).toBe(true);
    expect(result.normalY).toBeLessThan(0); // pushed up
  });

  it("detects a hit on the bottom face", () => {
    const ball = makeBall(115, 132);
    const box = makeBox(100, 100);
    const result = resolveCircleAABB(ball, box);
    expect(result.hit).toBe(true);
    expect(result.normalY).toBeGreaterThan(0); // pushed down
  });

  it("pushes ball out of box on corner overlap", () => {
    // Ball just touching corner
    const ball = makeBall(105, 105, 0, 0, 10);
    const box = makeBox(100, 100, 30, 30);
    // Ball centre inside box → should resolve
    const result = resolveCircleAABB(ball, box);
    expect(result.hit).toBe(true);
  });
});

describe("reflectVelocity", () => {
  it("reflects downward velocity off top face (normal = (0, -1))", () => {
    const [vx, vy] = reflectVelocity(0, 300, 0, -1);
    expect(vx).toBeCloseTo(0);
    expect(vy).toBeCloseTo(-300);
  });

  it("reflects leftward velocity off right face (normal = (1, 0))", () => {
    const [vx, vy] = reflectVelocity(-300, 0, 1, 0);
    expect(vx).toBeCloseTo(300);
    expect(vy).toBeCloseTo(0);
  });

  it("reflects diagonal velocity off a flat surface", () => {
    // Hitting a floor (normal = (0, -1)) with velocity (200, 200)
    const [vx, vy] = reflectVelocity(200, 200, 0, -1);
    expect(vx).toBeCloseTo(200);
    expect(vy).toBeCloseTo(-200);
  });

  it("preserves speed magnitude after reflection", () => {
    const [vx, vy] = reflectVelocity(200, -150, 0, -1);
    const speed = Math.sqrt(vx * vx + vy * vy);
    expect(speed).toBeCloseTo(Math.sqrt(200 * 200 + 150 * 150));
  });
});
