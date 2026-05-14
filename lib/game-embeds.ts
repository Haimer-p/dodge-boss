export interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  url: string;
  disguiseLabel: string;
  external?: boolean;
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: "2048",
    title: "2048",
    description: "Merge tiles — focus training puzzle",
    url: "/games/2048.html",
    disguiseLabel: "Module 2048 — Pattern Drill",
  },
  {
    id: "snake",
    title: "Snake",
    description: "Classic snake reflex drill",
    url: "/games/snake.html",
    disguiseLabel: "Module Snake — Path Optimizer",
  },
  {
    id: "breakout",
    title: "Breakout",
    description: "Brick breaker arcade",
    url: "/games/breakout.html",
    disguiseLabel: "Module Breakout — Target Practice",
  },
  {
    id: "lichess-tv",
    title: "Chess TV",
    description: "Watch live chess (Lichess)",
    url: "https://lichess.org/tv",
    disguiseLabel: "Live Strategy Stream",
    external: true,
  },
];
