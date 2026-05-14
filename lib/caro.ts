import { CaroCell, CaroGameState, CaroPlayer } from "./types";

export const CARO_WIN_LENGTH = 5;
export const CARO_INITIAL_VIEW_SIZE = 41;
export const CARO_VIEW_PADDING = 5;
export const CARO_VIEW_EXPAND = 14;
export const CARO_MAX_VIEW_SIZE = 71;
export const CARO_COORD_LIMIT = 500;

export type CaroStones = Record<string, "X" | "O">;

export function stoneKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function getStone(stones: CaroStones, row: number, col: number): CaroCell {
  return stones[stoneKey(row, col)] ?? "";
}

export function createInitialCaroState(): CaroGameState {
  return {
    version: 1,
    stones: {},
    players: [],
    currentTurn: "X",
    winner: null,
    winningCells: null,
    lastMove: null,
    status: "waiting",
    updatedAt: Date.now(),
  };
}

/** Convert legacy fixed 15×15 board saves to sparse stones. */
export function normalizeCaroState(state: CaroGameState): CaroGameState {
  if (state.stones && typeof state.stones === "object") {
    return state;
  }

  const stones: CaroStones = {};
  const legacy = state.board;
  if (legacy) {
    legacy.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === "X" || cell === "O") {
          stones[stoneKey(r, c)] = cell;
        }
      });
    });
  }

  const { board: _board, ...rest } = state;
  return { ...rest, stones };
}

export function getPlayerSymbol(
  state: CaroGameState,
  userId: string
): "X" | "O" | null {
  return state.players.find((p) => p.userId === userId)?.symbol ?? null;
}

export function joinCaroGame(
  state: CaroGameState,
  userId: string,
  username: string
): CaroGameState {
  if (state.players.some((p) => p.userId === userId)) return state;
  if (state.players.length >= 2) return state;

  const symbol: "X" | "O" = state.players.length === 0 ? "X" : "O";
  const players: CaroPlayer[] = [
    ...state.players,
    { userId, username, symbol },
  ];

  return {
    ...state,
    version: state.version + 1,
    players,
    status: players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}

function countDirection(
  stones: CaroStones,
  row: number,
  col: number,
  dr: number,
  dc: number,
  symbol: "X" | "O"
): [number, number][] {
  const cells: [number, number][] = [[row, col]];
  let r = row + dr;
  let c = col + dc;
  while (getStone(stones, r, c) === symbol) {
    cells.push([r, c]);
    r += dr;
    c += dc;
  }
  return cells;
}

export function findWinningCells(
  stones: CaroStones,
  row: number,
  col: number,
  symbol: "X" | "O"
): [number, number][] | null {
  const directions: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    const line = [
      ...countDirection(stones, row, col, -dr, -dc, symbol).reverse(),
      ...countDirection(stones, row, col, dr, dc, symbol).slice(1),
    ];
    if (line.length >= CARO_WIN_LENGTH) return line;
  }
  return null;
}

export function applyCaroMove(
  state: CaroGameState,
  userId: string,
  row: number,
  col: number
): { state: CaroGameState; error?: string } {
  if (state.status !== "playing") {
    return { state, error: "Game is not in progress" };
  }

  const symbol = getPlayerSymbol(state, userId);
  if (!symbol) return { state, error: "You are not in this game" };
  if (state.currentTurn !== symbol) return { state, error: "Not your turn" };
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    Math.abs(row) > CARO_COORD_LIMIT ||
    Math.abs(col) > CARO_COORD_LIMIT
  ) {
    return { state, error: "Invalid cell" };
  }

  const stones = { ...state.stones };
  const key = stoneKey(row, col);
  if (stones[key]) return { state, error: "Cell already taken" };

  stones[key] = symbol;

  const winningCells = findWinningCells(stones, row, col, symbol);
  const winner = winningCells ? symbol : null;

  return {
    state: {
      ...state,
      version: state.version + 1,
      stones,
      currentTurn: symbol === "X" ? "O" : "X",
      winner,
      winningCells,
      lastMove: { row, col, by: symbol },
      status: winner ? "finished" : "playing",
      updatedAt: Date.now(),
    },
  };
}

export function resetCaroGame(state: CaroGameState): CaroGameState {
  return {
    ...createInitialCaroState(),
    version: state.version + 1,
    players: state.players,
    status: state.players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}

export interface CaroViewport {
  originRow: number;
  originCol: number;
  size: number;
}

export function initialViewport(): CaroViewport {
  const half = Math.floor(CARO_INITIAL_VIEW_SIZE / 2);
  return {
    originRow: -half,
    originCol: -half,
    size: CARO_INITIAL_VIEW_SIZE,
  };
}

/** Expand or slide the visible window — board coordinates stay unlimited. */
export function computeViewport(
  viewport: CaroViewport,
  stones: CaroStones,
  lastMove: { row: number; col: number } | null
): CaroViewport {
  let { originRow, originCol, size } = viewport;

  const occupied = Object.keys(stones).map((k) => {
    const [row, col] = k.split(",").map(Number);
    return { row, col };
  });

  const focus =
    lastMove ??
    (occupied.length > 0
      ? {
          row: Math.round(occupied.reduce((s, p) => s + p.row, 0) / occupied.length),
          col: Math.round(occupied.reduce((s, p) => s + p.col, 0) / occupied.length),
        }
      : { row: 0, col: 0 });

  const targets = occupied.length > 0 ? occupied : [focus];

  for (const { row: r, col: c } of targets) {
    if (r - originRow < CARO_VIEW_PADDING) {
      const grow = CARO_VIEW_EXPAND;
      originRow -= grow;
      size += grow;
    }
    if (c - originCol < CARO_VIEW_PADDING) {
      const grow = CARO_VIEW_EXPAND;
      originCol -= grow;
      size += grow;
    }
    if (r - originRow > size - 1 - CARO_VIEW_PADDING) {
      size += CARO_VIEW_EXPAND;
    }
    if (c - originCol > size - 1 - CARO_VIEW_PADDING) {
      size += CARO_VIEW_EXPAND;
    }
  }

  if (size > CARO_MAX_VIEW_SIZE) {
    size = CARO_MAX_VIEW_SIZE;
    originRow = focus.row - Math.floor(size / 2);
    originCol = focus.col - Math.floor(size / 2);
  }

  if (size < CARO_INITIAL_VIEW_SIZE) {
    size = CARO_INITIAL_VIEW_SIZE;
    const half = Math.floor(size / 2);
    originRow = focus.row - half;
    originCol = focus.col - half;
  }

  return { originRow, originCol, size };
}

export function panViewport(
  viewport: CaroViewport,
  dRow: number,
  dCol: number
): CaroViewport {
  return {
    ...viewport,
    originRow: viewport.originRow + dRow,
    originCol: viewport.originCol + dCol,
  };
}
