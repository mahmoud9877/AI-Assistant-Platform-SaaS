"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Bubble {
  size: number;
  left: string;
  top: string;
  x: number;
  y: number;
  duration: number;
}

const randomBubbles = (count: number): Bubble[] =>
  Array.from({ length: count }, () => ({
    size: Math.random() * 200 + 50,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    x: Math.random() * 100 - 50,
    y: Math.random() * 100 - 50,
    duration: Math.random() * 10 + 10,
  }));

/** Floating translucent bubbles behind a page. */
export function AnimatedBackground({ count = 20 }: { count?: number }) {
  // Generated after mount so server and client markup match.
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  useEffect(() => setBubbles(randomBubbles(count)), [count]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {bubbles.map((bubble, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10 backdrop-blur-sm"
          style={{ width: bubble.size, height: bubble.size, left: bubble.left, top: bubble.top }}
          animate={{ x: [0, bubble.x], y: [0, bubble.y] }}
          transition={{ duration: bubble.duration, repeat: Infinity, repeatType: "reverse" }}
        />
      ))}
    </div>
  );
}
