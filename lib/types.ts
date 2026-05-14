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
  | "google";

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
  | { type: "typing"; payload: { typers: TypingUser[] } };
