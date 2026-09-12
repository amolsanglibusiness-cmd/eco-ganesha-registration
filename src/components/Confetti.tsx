import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'triangle';
}

const COLORS = ['#ff4b2b', '#b71c1c', '#10b981', '#f59e0b', '#ff9933', '#ffffff'];

function createPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 8 + Math.random() * 8,
    shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
  }));
}

export default function Confetti() {
  const [pieces] = useState(() => createPieces(120));

  useEffect(() => {
    const timer = setTimeout(() => {}, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: p.shape === 'triangle' ? '0' : `${p.size}px`,
            height: p.shape === 'triangle' ? '0' : `${p.size}px`,
            backgroundColor: p.shape !== 'triangle' ? p.color : undefined,
            borderRadius: p.shape === 'circle' ? '50%' : '0',
            borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
            borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
            borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
          }}
        />
      ))}
    </div>
  );
}
