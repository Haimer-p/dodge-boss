"use client";

import { useState, useEffect, useCallback } from "react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const CATCHPHRASES = [
  "Keep coding, you're doing great!",
  "You got this! Bug-free zone!",
  "Push it! You're on fire today!",
  "Another ticket closed! Legend!",
  "Deploy to prod? You brave soul!",
  "Merge conflict? You'll win!",
  "Code review passed! High five!",
  "Your code compiles on the first try. Wow!",
  "Coffee level: Optimal. Code level: Godlike.",
  "You're the reason the build passes.",
  "404: Bug not found. You fixed it!",
  "Senior dev energy detected!",
  "Less goooo! Ship it!",
  "Stack Overflow? More like Stack Underflow for you!",
  "You didn't write that bug, you inherited it. We know.",
];

const PETS = [
  {
    name: "devCat",
    emoji: "🐱",
    body: (
      <g>
        {/* Cat body - 3D-ish with gradients */}
        <defs>
          <radialGradient id="catGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <radialGradient id="catBelly" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </radialGradient>
        </defs>
        {/* Tail */}
        <path d="M22 28 Q10 20 8 10 Q6 2 12 4" stroke="url(#catGrad)" strokeWidth="3" fill="none" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="-5 22 28;10 22 28;-5 22 28" dur="1.5s" repeatCount="indefinite" />
        </path>
        {/* Body */}
        <ellipse cx="20" cy="30" rx="12" ry="10" fill="url(#catGrad)" />
        <ellipse cx="20" cy="32" rx="8" ry="6" fill="url(#catBelly)" />
        {/* Head */}
        <circle cx="20" cy="14" r="10" fill="url(#catGrad)" />
        {/* Ears */}
        <polygon points="12,8 8,0 15,4" fill="url(#catGrad)" />
        <polygon points="28,8 32,0 25,4" fill="url(#catGrad)" />
        <polygon points="13,7 10,3 15,5" fill="#fca5a5" />
        <polygon points="27,7 30,3 25,5" fill="#fca5a5" />
        {/* Eyes */}
        <ellipse cx="16" cy="13" rx="2.5" ry="3" fill="#1e293b">
          <animate attributeName="ry" values="3;0.5;3" dur="4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="24" cy="13" rx="2.5" ry="3" fill="#1e293b">
          <animate attributeName="ry" values="3;0.5;3" dur="4s" repeatCount="indefinite" />
        </ellipse>
        {/* Eye shine */}
        <circle cx="17" cy="12" r="1" fill="white" />
        <circle cx="25" cy="12" r="1" fill="white" />
        {/* Nose */}
        <polygon points="20,16 18.5,18 21.5,18" fill="#fca5a5" />
        {/* Mouth */}
        <path d="M18 19 Q20 21 22 19" stroke="#92400e" strokeWidth="0.8" fill="none" />
        {/* Whiskers */}
        <line x1="10" y1="16" x2="3" y2="14" stroke="#92400e" strokeWidth="0.6" opacity="0.5" />
        <line x1="10" y1="18" x2="2" y2="19" stroke="#92400e" strokeWidth="0.6" opacity="0.5" />
        <line x1="30" y1="16" x2="37" y2="14" stroke="#92400e" strokeWidth="0.6" opacity="0.5" />
        <line x1="30" y1="18" x2="38" y2="19" stroke="#92400e" strokeWidth="0.6" opacity="0.5" />
        {/* Paws */}
        <ellipse cx="14" cy="39" rx="4" ry="2.5" fill="url(#catGrad)" />
        <ellipse cx="26" cy="39" rx="4" ry="2.5" fill="url(#catGrad)" />
      </g>
    ),
  },
  {
    name: "devDog",
    emoji: "🐶",
    body: (
      <g>
        <defs>
          <radialGradient id="dogGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
        </defs>
        {/* Tail */}
        <path d="M34 24 Q42 14 40 6" stroke="url(#dogGrad)" strokeWidth="3" fill="none" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="0 34 24;15 34 24;0 34 24" dur="0.8s" repeatCount="indefinite" />
        </path>
        {/* Body */}
        <ellipse cx="24" cy="30" rx="13" ry="10" fill="url(#dogGrad)" />
        {/* Head */}
        <circle cx="16" cy="14" r="10" fill="url(#dogGrad)" />
        {/* Ear left */}
        <ellipse cx="8" cy="8" rx="4" ry="7" fill="#1d4ed8" transform="rotate(-15 8 8)" />
        {/* Ear right */}
        <ellipse cx="24" cy="8" rx="4" ry="7" fill="#1d4ed8" transform="rotate(15 24 8)" />
        {/* Eyes */}
        <circle cx="12" cy="13" r="2.5" fill="#1e293b">
          <animate attributeName="r" values="2.5;1;2.5" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="13" r="2.5" fill="#1e293b">
          <animate attributeName="r" values="2.5;1;2.5" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="13" cy="12" r="0.8" fill="white" />
        <circle cx="21" cy="12" r="0.8" fill="white" />
        {/* Nose */}
        <circle cx="16" cy="18" r="3" fill="#1e293b" />
        {/* Tongue */}
        <ellipse cx="16" cy="22" rx="2" ry="2.5" fill="#fca5a5">
          <animate attributeName="ry" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" />
        </ellipse>
        {/* Legs */}
        <rect x="16" y="38" width="4" height="6" rx="2" fill="url(#dogGrad)" />
        <rect x="28" y="38" width="4" height="6" rx="2" fill="url(#dogGrad)" />
      </g>
    ),
  },
  {
    name: "devAstro",
    emoji: "🚀",
    body: (
      <g>
        <defs>
          <linearGradient id="astroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <radialGradient id="visorGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>
        </defs>
        {/* Helmet */}
        <circle cx="20" cy="14" r="10" fill="#e2e8f0" />
        <circle cx="20" cy="14" r="8" fill="url(#visorGrad)" />
        <ellipse cx="20" cy="14" rx="6" ry="5" fill="#e0f2fe" opacity="0.3" />
        {/* Visor shine */}
        <ellipse cx="17" cy="11" rx="2" ry="1.5" fill="white" opacity="0.6" />
        {/* Body */}
        <rect x="12" y="22" width="16" height="14" rx="3" fill="url(#astroGrad)" />
        {/* Belt */}
        <rect x="12" y="30" width="16" height="2" fill="#fbbf24" />
        {/* Arms */}
        <rect x="6" y="24" width="5" height="3" rx="1.5" fill="url(#astroGrad)">
          <animateTransform attributeName="transform" type="rotate" values="-10 12 24;10 12 24;-10 12 24" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="29" y="24" width="5" height="3" rx="1.5" fill="url(#astroGrad)">
          <animateTransform attributeName="transform" type="rotate" values="10 28 24;-10 28 24;10 28 24" dur="2s" repeatCount="indefinite" />
        </rect>
        {/* Legs */}
        <rect x="14" y="36" width="4" height="5" rx="1.5" fill="#cbd5e1" />
        <rect x="22" y="36" width="4" height="5" rx="1.5" fill="#cbd5e1" />
        {/* Backpack */}
        <rect x="12" y="22" width="4" height="10" rx="2" fill="#7c3aed" opacity="0.5" />
        {/* Antenna */}
        <line x1="20" y1="4" x2="20" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="20" cy="0" r="2" fill="#ef4444">
          <animate attributeName="fill" values="#ef4444;#fbbf24;#ef4444" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>
    ),
  },
];

type PetType = typeof PETS[number];

export default function PetCompanion() {
  const [activePet, setActivePet] = useState<PetType>(PETS[0]);
  const [position, setPosition] = useState({ x: -100, y: 80 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [petIndex, setPetIndex] = useState(0);
  const [isPetting, setIsPetting] = useState(false);

  // Switch pet periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPetIndex((prev) => (prev + 1) % PETS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActivePet(PETS[petIndex]);
  }, [petIndex]);

  // Walking animation
  useEffect(() => {
    let direction = 1;
    let x = -80;
    const walkInterval = setInterval(() => {
      const maxX = typeof window !== "undefined" ? window.innerWidth - 100 : 500;
      x += 2 * direction;

      if (x > maxX) {
        direction = -1;
      } else if (x < -80) {
        direction = 1;
      }

      setPosition({ x, y: 80 });
    }, 50);

    return () => clearInterval(walkInterval);
  }, []);

  const createSparkles = useCallback((x: number, y: number) => {
    const emojis = ["⭐", "✨", "💖", "🌟", "💫", "🎉", "🎊", "💻", "🔥", "🚀"];
    const newSparkles: Sparkle[] = [];
    for (let i = 0; i < 12; i++) {
      newSparkles.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 120,
        y: y + (Math.random() - 0.5) * 120,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }
    setSparkles((prev) => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.find((ns) => ns.id === s.id)));
    }, 1500);
  }, []);

  const handlePetClick = useCallback(() => {
    setIsInteracting(true);
    setIsPetting(true);

    // Sparkle burst
    createSparkles(position.x + 40, position.y);

    // Random message
    const phrase = CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)];
    setMessage(phrase);

    setTimeout(() => {
      setIsInteracting(false);
      setIsPetting(false);
    }, 1000);

    setTimeout(() => {
      setMessage(null);
    }, 2500);
  }, [position, createSparkles]);

  return (
    <>
      {/* Pet */}
      <div
        onClick={handlePetClick}
        className={`fixed bottom-4 z-40 cursor-pointer select-none transition-transform duration-200 hover:scale-110 ${
          isPetting ? "scale-125 pet-bounce" : ""
        }`}
        style={{
          left: position.x,
          bottom: 20,
          width: 50,
          height: 50,
          transform: `${isPetting ? "scale(1.3)" : "scale(1)"} ${position.x > (typeof window !== "undefined" ? window.innerWidth / 2 : 500) ? "scaleX(-1)" : "scaleX(1)"}`,
        }}
        title="Click me! I'm your dev companion!"
      >
        <svg width="50" height="50" viewBox="0 0 42 44">
          {activePet.body}
        </svg>
      </div>

      {/* Speech bubble */}
      {message && (
        <div
          className="fixed z-50 animate-fade-slide"
          style={{
            left: Math.min(position.x - 30, typeof window !== "undefined" ? window.innerWidth - 220 : 300),
            bottom: 100,
            maxWidth: 240,
          }}
        >
          <div className="glass px-4 py-2 rounded-2xl text-sm font-medium text-gray-100 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activePet.emoji}</span>
              <span>{message}</span>
            </div>
          </div>
          {/* Chat bubble arrow */}
          <div
            className="w-3 h-3 glass rotate-45 mx-auto -mt-1.5"
            style={{ marginLeft: 40 }}
          />
        </div>
      )}

      {/* Sparkles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle fixed z-50 text-xl pointer-events-none"
          style={{ left: s.x, top: s.y + 20, position: "fixed" }}
        >
          {s.emoji}
        </div>
      ))}

      {/* Click ripple */}
      {isInteracting && (
        <div
          className="fixed z-30 pointer-events-none"
          style={{
            left: position.x + 20,
            bottom: 40,
          }}
        >
          <div className="w-2 h-2 bg-blue-400/40 rounded-full animate-ping absolute" />
          <div className="w-4 h-4 bg-purple-400/30 rounded-full animate-ping absolute -left-1 -top-1" style={{ animationDelay: "0.2s" }} />
          <div className="w-6 h-6 bg-pink-400/20 rounded-full animate-ping absolute -left-2 -top-2" style={{ animationDelay: "0.4s" }} />
        </div>
      )}
    </>
  );
}
