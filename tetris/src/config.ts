// Grid dimensions
export const CELL_SIZE = 30;
export const GRID_COLS = 10;
export const TETRIS_ROWS = 18;
export const BREAKOUT_ROWS = 8;
export const TOTAL_ROWS = TETRIS_ROWS + BREAKOUT_ROWS; // 26

// Canvas and pit layout
export const CANVAS_W = 560;
export const CANVAS_H = 860;
export const PIT_X = 130; // left edge of the pit
export const PIT_Y = 80; // top edge of the pit
export const PIT_WIDTH = GRID_COLS * CELL_SIZE; // 300
export const PIT_HEIGHT = TOTAL_ROWS * CELL_SIZE; // 780

// Zone divider Y position (pixel)
export const ZONE_DIVIDER_Y = PIT_Y + TETRIS_ROWS * CELL_SIZE;

// Piece spawn column
export const SPAWN_COL = 3;
export const SPAWN_ROW = 0;

// Timing (milliseconds)
export const FALL_INTERVAL = 800;
export const SOFT_DROP_INTERVAL = 50;
export const DAS_DELAY = 167;
export const ARR_INTERVAL = 33;

// Ball and paddle
export const BALL_SPEED = 300; // px/s
export const BALL_RADIUS = 8;
export const MAX_BALL_SPEED_X = 250; // px/s
export const PADDLE_SPEED = 350; // px/s
export const PADDLE_WIDTH = 80;
export const PADDLE_HEIGHT = 12;
export const PADDLE_Y = PIT_Y + TOTAL_ROWS * CELL_SIZE - 20; // near bottom of pit

// Speed ratchet
export const SPEED_RATCHET_BASE = 1.0;
export const SPEED_RATCHET_INCREMENT = 0.1;
export const SPEED_RATCHET_MAX = 3.0;

// Scoring
export const POINTS_ROW_COMPLETED = 100;
export const POINTS_ROW_DESTROYED = 250;

// Colours
export const COLOUR_BACKGROUND = 0x1a1a2e;
export const COLOUR_PIT_BORDER = 0x4a4a6a;
export const COLOUR_ZONE_DIVIDER = 0xffff00;
export const COLOUR_COMPLETED_OUTLINE = 0xffffff;
export const COLOUR_BALL = 0xffffff;
export const COLOUR_PADDLE = 0x00aaff;
export const COLOUR_HUD_TEXT = 0xffffff;

// Input map — all key bindings in one place
export const INPUT_MAP = {
  // Tetris player (left hand)
  PIECE_LEFT: "A",
  PIECE_RIGHT: "D",
  PIECE_ROTATE: "W",
  PIECE_SOFT_DROP: "S",

  // Breakout player (right hand)
  PADDLE_LEFT: "LEFT",
  PADDLE_RIGHT: "RIGHT",

  // Menu / restart
  START: "SPACE",
  RESTART: "R",
} as const;
