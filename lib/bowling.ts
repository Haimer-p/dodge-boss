export interface BowlingPlayer {
  userId: string;
  username: string;
}

export type BowlingStatus = "waiting" | "playing" | "finished";

export interface BowlingFrameRoll {
  pinsKnocked: number;
  userId: string;
}

export interface BowlingGameState {
  version: number;
  players: BowlingPlayer[];
  currentPlayerIndex: number;
  frame: number;
  rollInFrame: number;
  pins: boolean[];
  frameScores: Record<string, number[]>;
  totalScores: Record<string, number>;
  status: BowlingStatus;
  lastRoll: BowlingFrameRoll | null;
  updatedAt: number;
}

const PIN_COUNT = 10;
const FRAMES = 10;

export function createInitialBowlingState(): BowlingGameState {
  return {
    version: 1,
    players: [],
    currentPlayerIndex: 0,
    frame: 1,
    rollInFrame: 1,
    pins: Array(PIN_COUNT).fill(true),
    frameScores: {},
    totalScores: {},
    status: "waiting",
    lastRoll: null,
    updatedAt: Date.now(),
  };
}

function freshPins(): boolean[] {
  return Array(PIN_COUNT).fill(true);
}

function countStanding(pins: boolean[]): number {
  return pins.filter(Boolean).length;
}

export function joinBowlingGame(
  state: BowlingGameState,
  userId: string,
  username: string
): BowlingGameState {
  if (state.players.some((p) => p.userId === userId)) return state;
  if (state.players.length >= 2) return state;

  const players = [...state.players, { userId, username }];
  const frameScores = { ...state.frameScores, [userId]: [] };
  const totalScores = { ...state.totalScores, [userId]: 0 };

  return {
    ...state,
    version: state.version + 1,
    players,
    frameScores,
    totalScores,
    status: players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}

function advanceTurn(state: BowlingGameState): Partial<BowlingGameState> {
  const nextPlayer = (state.currentPlayerIndex + 1) % state.players.length;
  let frame = state.frame;
  let rollInFrame = state.rollInFrame;
  let pins = state.pins;

  if (nextPlayer === 0) {
    if (rollInFrame === 1) {
      rollInFrame = 2;
    } else {
      rollInFrame = 1;
      frame += 1;
      pins = freshPins();
    }
  }

  if (frame > FRAMES) {
    return {
      status: "finished",
      currentPlayerIndex: state.currentPlayerIndex,
      frame: FRAMES,
      rollInFrame: 2,
    };
  }

  return {
    currentPlayerIndex: nextPlayer,
    frame,
    rollInFrame,
    pins,
  };
}

export function applyBowlingRoll(
  state: BowlingGameState,
  userId: string,
  power: number,
  angle: number
): { state: BowlingGameState; error?: string } {
  if (state.status !== "playing") {
    return { state, error: "Game is not in progress" };
  }

  const player = state.players[state.currentPlayerIndex];
  if (!player || player.userId !== userId) {
    return { state, error: "Not your turn" };
  }

  const p = Math.max(0.1, Math.min(1, power));
  const standing = countStanding(state.pins);
  const aimBonus = 1 - Math.min(1, Math.abs(angle) / 45);
  const knockProb = Math.min(0.95, 0.15 + p * 0.55 * aimBonus);
  let knocked = 0;

  const remaining = [...state.pins];
  for (let i = 0; i < remaining.length; i++) {
    if (!remaining[i]) continue;
    if (Math.random() < knockProb / standing) {
      remaining[i] = false;
      knocked++;
    }
  }

  if (knocked === 0 && standing > 0) {
    knocked = Math.random() < knockProb ? 1 : 0;
    if (knocked) {
      const idx = remaining.findIndex(Boolean);
      if (idx >= 0) remaining[idx] = false;
    }
  }

  const frameScores = { ...state.frameScores };
  const userFrames = [...(frameScores[userId] || [])];
  userFrames.push(knocked);
  frameScores[userId] = userFrames;

  const totalScores = {
    ...state.totalScores,
    [userId]: (state.totalScores[userId] || 0) + knocked,
  };

  const strike = knocked === standing && standing === PIN_COUNT;
  let pins = remaining;
  let rollInFrame = state.rollInFrame;
  let frame = state.frame;
  let currentPlayerIndex = state.currentPlayerIndex;

  if (strike && state.rollInFrame === 1) {
    pins = freshPins();
    rollInFrame = 1;
    currentPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    if (currentPlayerIndex === 0) frame += 1;
  } else if (rollInFrame === 2 || countStanding(pins) === 0) {
    const adv = advanceTurn({ ...state, pins, rollInFrame, frame, currentPlayerIndex });
    pins = (adv.pins as boolean[]) ?? freshPins();
    rollInFrame = adv.rollInFrame ?? 1;
    frame = adv.frame ?? frame;
    currentPlayerIndex = adv.currentPlayerIndex ?? currentPlayerIndex;
  } else {
    rollInFrame = 2;
  }

  const status: BowlingStatus = frame > FRAMES ? "finished" : "playing";

  return {
    state: {
      ...state,
      version: state.version + 1,
      pins,
      frameScores,
      totalScores,
      frame: Math.min(frame, FRAMES),
      rollInFrame,
      currentPlayerIndex,
      status,
      lastRoll: { pinsKnocked: knocked, userId },
      updatedAt: Date.now(),
    },
  };
}

export function resetBowlingGame(state: BowlingGameState): BowlingGameState {
  const players = state.players;
  const frameScores: Record<string, number[]> = {};
  const totalScores: Record<string, number> = {};
  players.forEach((p) => {
    frameScores[p.userId] = [];
    totalScores[p.userId] = 0;
  });

  return {
    ...createInitialBowlingState(),
    version: state.version + 1,
    players,
    frameScores,
    totalScores,
    status: players.length === 2 ? "playing" : "waiting",
    updatedAt: Date.now(),
  };
}
