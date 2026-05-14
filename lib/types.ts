export type MessageType = "text" | "image" | "system";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: number;
  type: MessageType;
}

export interface Room {
  name: string;
  password: string;
  created_at: string;
}

export interface RoomListItem {
  roomId: string;
  name: string;
  createdAt: number;
}

export type DisguiseMode =
  | "document"
  | "code-editor"
  | "terminal"
  | "kanban"
  | "spreadsheet"
  | "email"
  | "dashboard"
  | "music"
  | "youtube"
  | "google"
  | "caro"
  | "arcade"
  | "chess"
  | "xiangqi"
  | "bowling"
  | "vocabulary";

export type StealthTheme = "dark" | "light" | "gray";

export interface RoomSession {
  roomId: string;
  username: string;
  userId: string;
  avatar?: string;
  disguiseMode: DisguiseMode;
}

export interface ChatAppearance {
  presetId: string;
  panelBg: string;
  messagesBg: string;
  panelText: string;
  panelOpacity: number;
  ownBubble: string;
  otherBubble: string;
  ownText: string;
  otherText: string;
  ownName: string;
  otherName: string;
  timeColor: string;
}

export interface TypingUser {
  userId: string;
  username: string;
  updatedAt: number;
}

export type RealtimeEvent =
  | { type: "connected" }
  | { type: "message"; payload: ChatMessage }
  | { type: "typing"; payload: { typers: TypingUser[] } }
  | { type: "caro"; payload: CaroGameState }
  | { type: "chess"; payload: import("./chess-game").ChessGameState }
  | { type: "xiangqi"; payload: import("./xiangqi").XiangqiGameState }
  | { type: "bowling"; payload: import("./bowling").BowlingGameState };

export type CaroCell = "" | "X" | "O";

export interface CaroPlayer {
  userId: string;
  username: string;
  symbol: "X" | "O";
}

export type CaroStatus = "waiting" | "playing" | "finished";

export interface CaroGameState {
  version: number;
  stones: Record<string, "X" | "O">;
  /** @deprecated legacy 15×15 — migrated to stones on read */
  board?: CaroCell[][];
  players: CaroPlayer[];
  currentTurn: "X" | "O";
  winner: "X" | "O" | "draw" | null;
  winningCells: [number, number][] | null;
  lastMove: { row: number; col: number; by: "X" | "O" } | null;
  status: CaroStatus;
  updatedAt: number;
}
