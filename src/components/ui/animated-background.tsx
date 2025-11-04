'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingOrb {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
}

export function AnimatedBackground() {
  const [orbs, setOrbs] = useState<FloatingOrb[]>([]);

  useEffect(() => {
    // Generate floating orbs
    const orbData: FloatingOrb[] = [
      {
        id: 1,
        x: 10,
        y: 20,
        size: 400,
        color: 'rgba(14, 173, 105, 0.05)',
        duration: 20,
      },
      {
        id: 2,
        x: 70,
        y: 60,
        size: 300,
        color: 'rgba(108, 92, 231, 0.04)',
        duration: 25,
      },
      {
        id: 3,
        x: 40,
        y: 80,
        size: 350,
        color: 'rgba(0, 255, 136, 0.03)',
        duration: 30,
      },
      {
        id: 4,
        x: 80,
        y: 10,
        size: 250,
        color: 'rgba(255, 0, 84, 0.04)',
        duration: 22,
      },
    ];
    setOrbs(orbData);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-animated-gradient" />

      {/* Grain texture overlay */}
      <div className="absolute inset-0 texture-grain" />

      {/* Floating orbs with blur */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: 'blur(60px)',
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle perspective grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(199, 211, 217, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(199, 211, 217, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: 'perspective(1000px) rotateX(60deg)',
          transformOrigin: 'center bottom',
        }}
      />
    </div>
  );
}
