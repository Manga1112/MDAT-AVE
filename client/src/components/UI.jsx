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
