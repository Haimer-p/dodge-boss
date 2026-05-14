"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  symbol: string;
}

interface FloatingPet {
  id: number;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
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
];

// Monochrome SVG silhouettes
function PetSvg({ type, size }: { type: number; size: number }) {
  const fill = "currentColor";
  switch (type % 3) {
    case 0: // Cat
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill={fill}>
          <path d="M8 14 L5 6 L12 10 Z M32 14 L35 6 L28 10 Z" opacity="0.9" />
          <ellipse cx="20" cy="24" rx="10" ry="8" />
          <circle cx="20" cy="14" r="9" />
          <ellipse cx="16" cy="13" rx="2" ry="2.5" fill="#0f0f23" />
          <ellipse cx="24" cy="13" rx="2" ry="2.5" fill="#0f0f23" />
          <path d="M10 28 Q6 22 8 16" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 1: // Dog
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill={fill}>
          <ellipse cx="14" cy="14" rx="9" ry="9" />
          <ellipse cx="26" cy="26" rx="11" ry="8" />
          <ellipse cx="8" cy="10" rx="3" ry="5" transform="rotate(-20 8 10)" />
          <ellipse cx="20" cy="8" rx="3" ry="5" transform="rotate(20 20 8)" />
          <circle cx="11" cy="13" r="2" fill="#0f0f23" />
          <circle cx="17" cy="13" r="2" fill="#0f0f23" />
          <path d="M32 20 Q36 12 34 6" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default: // Bird/rocket
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill={fill}>
          <ellipse cx="20" cy="22" rx="8" ry="10" />
          <circle cx="20" cy="12" r="7" />
          <path d="M6 18 L2 14 L8 16 Z M34 18 L38 14 L32 16 Z" />
          <circle cx="17" cy="11" r="1.5" fill="#0f0f23" />
          <circle cx="23" cy="11" r="1.5" fill="#0f0f23" />
          <path d="M20 4 L20 0 M16 2 L20 4 L24 2" stroke={fill} strokeWidth="1.5" fill="none" />
        </svg>
      );
  }
}

function createPet(id: number, w: number, h: number): FloatingPet {
  const edge = Math.floor(Math.random() * 4);
  let x = Math.random() * w;
  let y = Math.random() * h;
  if (edge === 0) { x = -40; }
  else if (edge === 1) { x = w + 40; }
  else if (edge === 2) { y = -40; }
  else { y = h + 40; }

  const speed = 0.6 + Math.random() * 1.2;
  const angle = Math.random() * Math.PI * 2;
  return {
    id,
    type: Math.floor(Math.random() * 3),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 28 + Math.random() * 20,
    opacity: 0.25 + Math.random() * 0.35,
  };
}

const MAX_PETS = 8;
const SPAWN_INTERVAL = 3500;

export default function PetCompanion() {
  const [pets, setPets] = useState<FloatingPet[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [message, setMessage] = useState<{ text: string; x: number; y: number } | null>(null);
  const [clickedId, setClickedId] = useState<number | null>(null);
  const nextId = useRef(0);
  const dims = useRef({ w: 800, h: 600 });

  useEffect(() => {
    const updateDims = () => {
      dims.current = { w: window.innerWidth, h: window.innerHeight };
    };
    updateDims();
    window.addEventListener("resize", updateDims);

    // Initial spawn
    const initial: FloatingPet[] = [];
    for (let i = 0; i < 4; i++) {
      initial.push(createPet(nextId.current++, dims.current.w, dims.current.h));
    }
    setPets(initial);

    // Spawn more periodically
    const spawnTimer = setInterval(() => {
      setPets((prev) => {
        if (prev.length >= MAX_PETS) return prev;
        return [...prev, createPet(nextId.current++, dims.current.w, dims.current.h)];
      });
    }, SPAWN_INTERVAL);

    // Animation loop
    const animTimer = setInterval(() => {
      const { w, h } = dims.current;
      setPets((prev) =>
        prev.map((pet) => {
          let { x, y, vx, vy } = pet;
          x += vx;
          y += vy;

          // Bounce off edges with padding
          if (x < -60 || x > w + 60) vx *= -1;
          if (y < -60 || y > h + 60) vy *= -1;

          // Slight random drift
          vx += (Math.random() - 0.5) * 0.08;
          vy += (Math.random() - 0.5) * 0.08;
          const maxSpeed = 2;
          vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));
          vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));

          return { ...pet, x, y, vx, vy };
        })
      );
    }, 40);

    return () => {
      window.removeEventListener("resize", updateDims);
      clearInterval(spawnTimer);
      clearInterval(animTimer);
    };
  }, []);

  const handlePetClick = useCallback((pet: FloatingPet) => {
    setClickedId(pet.id);
    setTimeout(() => setClickedId(null), 600);

    const symbols = ["*", "+", "~", "^", "o", "."];
    const newSparkles: Sparkle[] = [];
    for (let i = 0; i < 10; i++) {
      newSparkles.push({
        id: Date.now() + i,
        x: pet.x + (Math.random() - 0.5) * 100,
        y: pet.y + (Math.random() - 0.5) * 100,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
      });
    }
    setSparkles((prev) => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.find((ns) => ns.id === s.id)));
    }, 1200);

    const phrase = CATCHPHRASES[Math.floor(Math.random() * CATCHPHRASES.length)];
    setMessage({ text: phrase, x: pet.x, y: pet.y });
    setTimeout(() => setMessage(null), 2500);
  }, []);

  return (
    <>
      {pets.map((pet) => (
        <div
          key={pet.id}
          onClick={() => handlePetClick(pet)}
          className={`fixed z-30 cursor-pointer select-none text-white/60 hover:text-white/90 transition-colors duration-300 ${
            clickedId === pet.id ? "pet-bounce scale-125" : ""
          }`}
          style={{
            left: pet.x,
            top: pet.y,
            opacity: pet.opacity,
            transform: `scaleX(${pet.vx < 0 ? -1 : 1})`,
            pointerEvents: "auto",
          }}
          title="Click me!"
        >
          <PetSvg type={pet.type} size={pet.size} />
        </div>
      ))}

      {message && (
        <div
          className="fixed z-50 pointer-events-none animate-fade-slide"
          style={{
            left: Math.min(message.x, dims.current.w - 240),
            top: Math.max(message.y - 60, 10),
            maxWidth: 220,
          }}
        >
          <div className="glass px-3 py-2 rounded-xl text-xs font-medium text-gray-200 shadow-xl border border-white/10">
            {message.text}
          </div>
        </div>
      )}

      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle fixed z-40 text-sm text-white/70 pointer-events-none font-mono"
          style={{ left: s.x, top: s.y }}
        >
          {s.symbol}
        </div>
      ))}
    </>
  );
}
