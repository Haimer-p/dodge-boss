import { DisguiseMode } from "./types";

export const WORK_MODES: { id: DisguiseMode; label: string }[] = [
  { id: "document", label: "Docs" },
  { id: "code-editor", label: "Code" },
  { id: "terminal", label: "Terminal" },
  { id: "kanban", label: "Board" },
  { id: "spreadsheet", label: "Sheet" },
  { id: "email", label: "Mail" },
  { id: "dashboard", label: "Metrics" },
  { id: "music", label: "Music" },
  { id: "youtube", label: "YouTube" },
  { id: "google", label: "Google" },
  { id: "vocabulary", label: "Vocab" },
];

export const GAME_MODES: { id: DisguiseMode; label: string }[] = [
  { id: "caro", label: "Grid" },
  { id: "chess", label: "Chess" },
  { id: "xiangqi", label: "Xiangqi" },
  { id: "bowling", label: "Bowling" },
  { id: "arcade", label: "Arcade" },
];

export function isGameMode(mode: DisguiseMode): boolean {
  return GAME_MODES.some((g) => g.id === mode);
}
