export type XiangqiColor = "r" | "b";

export interface XiangqiPlayer {
  userId: string;
  username: string;
  color: XiangqiColor;
}

export type XiangqiStatus = "waiting" | "playing" | "finished";

export interface XiangqiGameState {
  version: number;
  board: string[][];
  players: XiangqiPlayer[];
  status: XiangqiStatus;
  turn: XiangqiColor;
  winner: XiangqiColor | null;
  lastMove: { from: [number, number]; to: [number, number] } | null;
  updatedAt: number;
}

const ROWS = 10;
const COLS = 9;

export function createInitialXiangqiBoard(): string[][] {
  return [
    ["rR", "rN", "rB", "rA", "rK", "rA", "rB", "rN", "rR"],
    ["", "", "", "", "", "", "", "", ""],
    ["", "rC", "", "", "", "", "", "rC", ""],
    ["rP", "", "rP", "", "rP", "", "rP", "", "rP"],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["bP", "", "bP", "", "bP", "", "bP", "", "bP"],
    ["", "bC", "", "", "", "", "", "bC", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["bR", "bN", "bB", "bA", "bK", "bA", "bB", "bN", "bR"],
  ];
}

export function createInitialXiangqiState(): XiangqiGameState {
  return {
    version: 1,
    board: createInitialXiangqiBoard(),
    players: [],
    status: "waiting",
    turn: "r",
    winner: null,
    lastMove: null,
    updatedAt: Date.now(),
  };
}

function pieceColor(piece: string): XiangqiColor | null {
  if (!piece) return null;
  return piece[0] === "r" ? "r" : piece[0] === "b" ? "b" : null;
}

function pieceType(piece: string): string {
  return piece.slice(1);
}

export function getXiangqiPlayerColor(
  state: XiangqiGameState,
  userId: string
): XiangqiColor | null {
  return state.players.find((p) => p.userId === userId)?.color ?? null;
}

export function joinXiangqiGame(
  state: XiangqiGameState,
  userId: string,
  username: string
): XiangqiGameState {
  if (state.players.some((p) => p.userId === userId)) return state;
  if (state.players.length >= 2) return state;

  const color: XiangqiColor = state.players.length === 0 ? "r" : "b";
  const players = [...state.players, { userId, username, color }];

  return {
    ...state,
    version: state.version + 1,
    players,
    status: players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}

function inPalace(r: number, c: number, color: XiangqiColor): boolean {
  if (c < 3 || c > 5) return false;
  return color === "r" ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
}

function crossedRiver(r: number, color: XiangqiColor): boolean {
  return color === "r" ? r <= 4 : r >= 5;
}

function cloneBoard(board: string[][]): string[][] {
  return board.map((row) => [...row]);
}

function findKing(board: string[][], color: XiangqiColor): [number, number] | null {
  const k = `${color}K`;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === k) return [r, c];
    }
  }
  return null;
}

function isValidMove(
  board: string[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  color: XiangqiColor
): boolean {
  if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) return false;
  const piece = board[fr][fc];
  if (!piece || pieceColor(piece) !== color) return false;
  const target = board[tr][tc];
  if (target && pieceColor(target) === color) return false;

  const type = pieceType(piece);
  const dr = tr - fr;
  const dc = tc - fc;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  switch (type) {
    case "K":
      if (!inPalace(tr, tc, color)) return false;
      if (adr + adc !== 1) return false;
      return true;
    case "A":
      if (!inPalace(tr, tc, color)) return false;
      return adr === 1 && adc === 1;
    case "B": {
      if (crossedRiver(tr, color)) return false;
      if (adr !== 2 || adc !== 2) return false;
      const blockR = fr + dr / 2;
      const blockC = fc + dc / 2;
      return !board[blockR][blockC];
    }
    case "N": {
      if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
      if (adr === 2) {
        const legR = fr + dr / 2;
        if (board[legR][fc]) return false;
      } else {
        const legC = fc + dc / 2;
        if (board[fr][legC]) return false;
      }
      return true;
    }
    case "R": {
      if (fr !== tr && fc !== tc) return false;
      if (fr === tr) {
        const step = dc > 0 ? 1 : -1;
        for (let c = fc + step; c !== tc; c += step) {
          if (board[fr][c]) return false;
        }
      } else {
        const step = dr > 0 ? 1 : -1;
        for (let r = fr + step; r !== tr; r += step) {
          if (board[r][fc]) return false;
        }
      }
      return true;
    }
    case "C": {
      if (fr !== tr && fc !== tc) return false;
      let jumped = false;
      if (fr === tr) {
        const step = dc > 0 ? 1 : -1;
        for (let c = fc + step; c !== tc; c += step) {
          if (board[fr][c]) {
            if (jumped) return false;
            jumped = true;
          }
        }
      } else {
        const step = dr > 0 ? 1 : -1;
        for (let r = fr + step; r !== tr; r += step) {
          if (board[r][fc]) {
            if (jumped) return false;
            jumped = true;
          }
        }
      }
      return jumped;
    }
    case "P": {
      const forward = color === "r" ? -1 : 1;
      if (dr === forward && dc === 0 && !target) return true;
      if (crossedRiver(fr, color) && dr === 0 && adc === 1 && !target) return true;
      return false;
    }
    default:
      return false;
  }
}

function kingsFace(board: string[][]): boolean {
  const rk = findKing(board, "r");
  const bk = findKing(board, "b");
  if (!rk || !bk || rk[1] !== bk[1]) return false;
  const col = rk[1];
  const [r1, r2] = rk[0] < bk[0] ? [rk[0], bk[0]] : [bk[0], rk[0]];
  for (let r = r1 + 1; r < r2; r++) {
    if (board[r][col]) return false;
  }
  return true;
}

export function applyXiangqiMove(
  state: XiangqiGameState,
  userId: string,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): { state: XiangqiGameState; error?: string } {
  if (state.status !== "playing") {
    return { state, error: "Game is not in progress" };
  }

  const color = getXiangqiPlayerColor(state, userId);
  if (!color) return { state, error: "You are not in this game" };
  if (state.turn !== color) return { state, error: "Not your turn" };

  const board = cloneBoard(state.board);
  if (!isValidMove(board, fromRow, fromCol, toRow, toCol, color)) {
    return { state, error: "Invalid move" };
  }

  const captured = board[toRow][toCol];
  board[toRow][toCol] = board[fromRow][fromCol];
  board[fromRow][fromCol] = "";

  if (kingsFace(board)) {
    return { state, error: "Kings cannot face" };
  }

  let winner: XiangqiColor | null = null;
  if (captured && pieceType(captured) === "K") {
    winner = color;
  }

  return {
    state: {
      ...state,
      version: state.version + 1,
      board,
      turn: color === "r" ? "b" : "r",
      winner,
      status: winner ? "finished" : "playing",
      lastMove: { from: [fromRow, fromCol], to: [toRow, toCol] },
      updatedAt: Date.now(),
    },
  };
}

export function resetXiangqiGame(state: XiangqiGameState): XiangqiGameState {
  return {
    ...createInitialXiangqiState(),
    version: state.version + 1,
    players: state.players,
    status: state.players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}

export const XIANGQI_ROWS = ROWS;
export const XIANGQI_COLS = COLS;

export const XIANGQI_PIECE_LABELS: Record<string, string> = {
  rK: "帥",
  rA: "仕",
  rB: "相",
  rN: "傌",
  rR: "車",
  rC: "炮",
  rP: "兵",
  bK: "將",
  bA: "士",
  bB: "象",
  bN: "馬",
  bR: "車",
  bC: "砲",
  bP: "卒",
};
