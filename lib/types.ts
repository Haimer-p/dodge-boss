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

export type DisguiseMode =
  | "document"
  | "code-editor"
  | "terminal"
  | "kanban"
  | "spreadsheet";

export type StealthTheme = "dark" | "light" | "gray";

export interface RoomSession {
  roomId: string;
  username: string;
  userId: string;
  avatar?: string;
  disguiseMode: DisguiseMode;
}
