export function Button({ children, style, variant = 'default', ...rest }) {
  const base = {
    default: {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      color: '#fff',
    },
    primary: {
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      border: '1px solid rgba(255,255,255,0.25)',
      color: '#fff',
    },
    danger: {
      background: 'linear-gradient(135deg,#ef4444,#f97316)',
      border: '1px solid rgba(255,255,255,0.25)',
      color: '#fff',
    },
  }[variant] || {};
  return (
    <button className="btn" style={{ ...base, ...style }} {...rest}>
      {children}
    </button>
  );
}

export function Input({ label, hint, style, ...rest }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {label && <label className="sub" style={{ fontWeight: 600 }}>{label}</label>}
      <input style={{ width: '100%' }} {...rest} />
      {hint && <div className="sub" style={{ opacity: 0.8 }}>{hint}</div>}
    </div>
  );
}

export function Select({ label, hint, children, style, ...rest }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {label && <label className="sub" style={{ fontWeight: 600 }}>{label}</label>}
      <select style={{ width: '100%' }} {...rest}>
        {children}
      </select>
      {hint && <div className="sub" style={{ opacity: 0.8 }}>{hint}</div>}
    </div>
  );
}

export function Badge({ children, variant = 'secondary', style }) {
  const base = {
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    display: 'inline-block',
    border: '1px solid rgba(255,255,255,0.12)'
  };
  const variants = {
    secondary: { background: 'rgba(148,163,184,0.18)', borderColor: 'rgba(148,163,184,0.35)' },
    outline: { background: 'transparent', borderColor: 'rgba(255,255,255,0.25)' },
    destructive: { background: 'rgba(244,63,94,0.2)', borderColor: 'rgba(244,63,94,0.5)' }
  };
  return <span style={{ ...base, ...(variants[variant] || {}), ...style }}>{children}</span>;
}

export function Card({ children, style, header, footer }) {
  return (
    <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: 16, borderRadius: 12, ...style }}>
      {header}
      {children}
      {footer}
    </div>
  );
}
