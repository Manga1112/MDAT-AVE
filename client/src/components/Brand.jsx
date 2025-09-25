import { useEffect, useMemo, useState } from 'react';

export default function Brand({ size = 24, cycleMs = 1400 }) {
  const frames = useMemo(() => [
    'AI Avengers',
    'AI • Avengers',
    'A.I. Avengers',
    'AI  Avengers',
  ], []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), cycleMs);
    return () => clearInterval(t);
  }, [frames.length, cycleMs]);

  return (
    <span
      className="brand-title"
      style={{
        fontSize: size,
        lineHeight: 1.1,
        backgroundImage: 'linear-gradient(90deg,#22d3ee,#a78bfa,#f472b6)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {frames[i]}
    </span>
  );
}
