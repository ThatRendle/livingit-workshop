import { describe, it, expect } from "vitest";
import { gridToPixel, pixelToGrid } from "../utils/coords";
import { CELL_SIZE, PIT_X, PIT_Y } from "../config";

describe("gridToPixel", () => {
  it("maps origin (0,0) to (PIT_X, PIT_Y)", () => {
    const [x, y] = gridToPixel(0, 0);
    expect(x).toBe(PIT_X);
    expect(y).toBe(PIT_Y);
  });

  it("maps (row, col) to correct pixel offsets", () => {
    const [x, y] = gridToPixel(3, 5);
    expect(x).toBe(PIT_X + 5 * CELL_SIZE);
    expect(y).toBe(PIT_Y + 3 * CELL_SIZE);
  });
});

describe("pixelToGrid", () => {
  it("maps (PIT_X, PIT_Y) to grid (0, 0)", () => {
    const [row, col] = pixelToGrid(PIT_X, PIT_Y);
    expect(row).toBe(0);
    expect(col).toBe(0);
  });

  it("rounds down to the containing cell", () => {
    // Pixel at PIT_X + 5 * CELL_SIZE + 15 should map to col 5
    const [row, col] = pixelToGrid(PIT_X + 5 * CELL_SIZE + 15, PIT_Y + 3 * CELL_SIZE + 5);
    expect(col).toBe(5);
    expect(row).toBe(3);
  });

  it("round-trip: gridToPixel → pixelToGrid returns original coords", () => {
    for (let r = 0; r < 26; r++) {
      for (let c = 0; c < 10; c++) {
        const [px, py] = gridToPixel(r, c);
        const [rr, cc] = pixelToGrid(px, py);
        expect(rr).toBe(r);
        expect(cc).toBe(c);
      }
    }
  });
});
