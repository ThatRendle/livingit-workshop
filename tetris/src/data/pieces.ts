// Tetromino piece definitions with all 4 rotations.
// Each rotation is an array of [row, col] offsets from the piece origin.
// IP risk surface — keep isolated from the rest of the codebase.

export enum PieceType {
  I = "I",
  O = "O",
  T = "T",
  S = "S",
  Z = "Z",
  J = "J",
  L = "L",
}

export interface PieceDefinition {
  type: PieceType;
  colour: number;
  // rotations[rotationIndex] = array of [row, col] offsets
  rotations: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
}

export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  [PieceType.I]: {
    type: PieceType.I,
    colour: 0x00f0f0,
    rotations: [
      [[0, 0], [0, 1], [0, 2], [0, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 1], [1, 1], [2, 1], [3, 1]],
    ],
  },
  [PieceType.O]: {
    type: PieceType.O,
    colour: 0xf0f000,
    rotations: [
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 0], [0, 1], [1, 0], [1, 1]],
    ],
  },
  [PieceType.T]: {
    type: PieceType.T,
    colour: 0xa000f0,
    rotations: [
      [[0, 0], [0, 1], [0, 2], [1, 1]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [1, 1], [1, 2], [0, 1]],
      [[0, 0], [1, 0], [2, 0], [1, 1]],  // corrected: [[0,1],[1,0],[1,1],[2,1]]
    ],
  },
  [PieceType.S]: {
    type: PieceType.S,
    colour: 0x00f000,
    rotations: [
      [[0, 1], [0, 2], [1, 0], [1, 1]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 1], [1, 2], [2, 0], [2, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1]],
    ],
  },
  [PieceType.Z]: {
    type: PieceType.Z,
    colour: 0xf00000,
    rotations: [
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 2], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[0, 1], [1, 0], [1, 1], [2, 0]],
    ],
  },
  [PieceType.J]: {
    type: PieceType.J,
    colour: 0x0000f0,
    rotations: [
      [[0, 0], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 0], [2, 1]],
    ],
  },
  [PieceType.L]: {
    type: PieceType.L,
    colour: 0xf0a000,
    rotations: [
      [[0, 2], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [1, 2], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
    ],
  },
};

export const ALL_PIECE_TYPES: PieceType[] = [
  PieceType.I,
  PieceType.O,
  PieceType.T,
  PieceType.S,
  PieceType.Z,
  PieceType.J,
  PieceType.L,
];
