import { Chess } from "chess.js";

export type ChessColor = "w" | "b";

export interface ChessPlayer {
  userId: string;
  username: string;
  color: ChessColor;
}

export type ChessStatus = "waiting" | "playing" | "finished";

export interface ChessGameState {
  version: number;
  fen: string;
  players: ChessPlayer[];
  status: ChessStatus;
  turn: ChessColor;
  winner: ChessColor | "draw" | null;
  lastMove: { from: string; to: string; san: string } | null;
  updatedAt: number;
}

const START_FEN = new Chess().fen();

export function createInitialChessState(): ChessGameState {
  return {
    version: 1,
    fen: START_FEN,
    players: [],
    status: "waiting",
    turn: "w",
    winner: null,
    lastMove: null,
    updatedAt: Date.now(),
  };
}

export function getChessPlayerColor(
  state: ChessGameState,
  userId: string
): ChessColor | null {
  return state.players.find((p) => p.userId === userId)?.color ?? null;
}

export function joinChessGame(
  state: ChessGameState,
  userId: string,
  username: string
): ChessGameState {
  if (state.players.some((p) => p.userId === userId)) return state;
  if (state.players.length >= 2) return state;

  const color: ChessColor = state.players.length === 0 ? "w" : "b";
  const players = [...state.players, { userId, username, color }];

  return {
    ...state,
    version: state.version + 1,
    players,
    status: players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}

export function applyChessMove(
  state: ChessGameState,
  userId: string,
  from: string,
  to: string,
  promotion?: string
): { state: ChessGameState; error?: string } {
  if (state.status !== "playing") {
    return { state, error: "Game is not in progress" };
  }

  const color = getChessPlayerColor(state, userId);
  if (!color) return { state, error: "You are not in this game" };
  if (state.turn !== color) return { state, error: "Not your turn" };

  const chess = new Chess(state.fen);
  let move;
  try {
    move = chess.move({ from, to, promotion: promotion || "q" });
  } catch {
    return { state, error: "Invalid move" };
  }
  if (!move) return { state, error: "Invalid move" };

  let winner: ChessColor | "draw" | null = null;
  let status: ChessStatus = "playing";
  if (chess.isCheckmate()) {
    winner = color;
    status = "finished";
  } else if (chess.isDraw() || chess.isStalemate()) {
    winner = "draw";
    status = "finished";
  }

  return {
    state: {
      ...state,
      version: state.version + 1,
      fen: chess.fen(),
      turn: chess.turn(),
      winner,
      status,
      lastMove: { from, to, san: move.san },
      updatedAt: Date.now(),
    },
  };
}

export function resignChess(
  state: ChessGameState,
  userId: string
): { state: ChessGameState; error?: string } {
  const color = getChessPlayerColor(state, userId);
  if (!color) return { state, error: "You are not in this game" };
  if (state.status !== "playing") return { state, error: "Game over" };

  return {
    state: {
      ...state,
      version: state.version + 1,
      status: "finished",
      winner: color === "w" ? "b" : "w",
      updatedAt: Date.now(),
    },
  };
}

export function resetChessGame(state: ChessGameState): ChessGameState {
  return {
    ...createInitialChessState(),
    version: state.version + 1,
    players: state.players,
    status: state.players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}
