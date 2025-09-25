import { useEffect, useMemo, useState } from 'react';

export default function QuotesMarquee({ intervalMs = 8000 }) {
  const quotes = useMemo(
    () => [
      'I am Iron Man.',
      'Sometimes you gotta run before you can walk.',
      'Genius, billionaire, playboy, philanthropist.',
      "If we can’t protect the Earth, you can be damn sure we’ll avenge it.",
      'It’s not about how much we lost, it’s about how much we have left.',
      'Following’s not really my style.',
      'My armor was never a distraction or a hobby, it was a cocoon. And now, I’m a changed man.',
    ],
    []
  );

  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % quotes.length), intervalMs);
    return () => clearInterval(t);
  }, [quotes.length, intervalMs]);

  return (
    <div className="marquee" aria-label="Rotating inspirational quotes">
      <div className="marquee__track" key={i}>
        <span className="marquee__text">“{quotes[i]}” — Tony Stark</span>
      </div>
    </div>
  );
}
