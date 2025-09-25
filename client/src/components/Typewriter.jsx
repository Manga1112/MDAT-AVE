import { useEffect, useState } from 'react';

export default function Typewriter({ text, speed = 35, className = '' }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return (
    <span className={`typewriter ${className}`}>{display}<span className="caret" aria-hidden>▌</span></span>
  );
}
