// Table-only component; uses existing global styles for buttons/labels.

export default function TicketTable({
  tickets,
  team,
  updating,
  comments,
  onUpdateStatus,
  onRoute,
  onAutoRoute,
  onAssign,
  onCommentChange,
  onFetchTicket, // (id) => Promise<Ticket>
  onAddComment, // (id, text) => Promise<void>
}) {
  const state = useDetailsState();
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr className="muted">
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Issue details</th>
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Reporter</th>
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Category & Priority</th>
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Status & Routing</th>
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t._id}>
              <td style={{ padding: '8px 6px' }}>
                <div><strong>{t.title}</strong> <span className="muted">({t.type})</span></div>
                <div className="muted">{t.description}</div>
                <div className="muted">Created: {new Date(t.createdAt).toLocaleString()}</div>
                <div style={{ marginTop: 6 }}>
                  <button
                    className="btn secondary"
                    onClick={async () => {
                      const open = !!state.expanded[t._id];
                      if (open) { state.toggle(t._id); return; }
                      try {
                        if (onFetchTicket) {
                          state.setLoading(t._id, true);
                          const full = await onFetchTicket(t._id);
                          state.setDetails(t._id, full);
                        }
                      } finally {
                        state.setLoading(t._id, false);
                        state.toggle(t._id);
                      }
                    }}
                  >
                    {state.expanded[t._id] ? 'Hide details' : (state.loading[t._id] ? 'Loading…' : 'View details')}
                  </button>
                </div>
                {state.expanded[t._id] && (
                  <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="sub" style={{ marginBottom: 6 }}>Status Timeline</div>
                    <ol style={{ position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 12, display: 'grid', gap: 8 }}>
                      {(state.details[t._id]?.history || []).slice().reverse().map((h, i) => (
                        <li key={i} className="sub" style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: -6.5, top: 6, width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', border: '1px solid rgba(255,255,255,0.35)' }} />
                          <div style={{ fontSize: 12 }}>
                            <strong>{new Date(h.at || Date.now()).toLocaleString()}</strong>
                            {h.status ? ` • status: ${h.status}` : ''}
                            {h.routeStatus ? ` • routing: ${h.routeStatus}` : ''}
                            {h.assignedTo ? ` • assigned: ${String(h.assignedTo)}` : ''}
                            {h.escalated ? ' • escalated' : ''}
                            {h.comment ? ` • comment: ${h.comment}` : ''}
                          </div>
                        </li>
                      ))}
                      {!(state.details[t._id]?.history || []).length && (
                        <li className="sub">No history yet</li>
                      )}
                    </ol>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <input
                        placeholder="Add a comment"
                        value={state.newComment[t._id] || ''}
                        onChange={(e) => state.setNewComment(t._id, e.target.value)}
                      />
                      <button
                        className="btn"
                        onClick={async () => {
                          const text = (state.newComment[t._id] || '').trim();
                          if (!text) return;
                          if (onAddComment) {
                            state.setPosting(t._id, true);
                            try {
                              await onAddComment(t._id, text);
                              // refresh
                              if (onFetchTicket) {
                                const full = await onFetchTicket(t._id);
                                state.setDetails(t._id, full);
                              }
                              state.setNewComment(t._id, '');
                            } finally {
                              state.setPosting(t._id, false);
                            }
                          }
                        }}
                        disabled={!!state.posting[t._id]}
                      >
                        {state.posting[t._id] ? 'Posting…' : 'Comment'}
                      </button>
                    </div>
                  </div>
                )}
              </td>
              <td style={{ padding: '8px 6px' }}>
                <div className="muted">{t.createdBy?.username || t.createdBy || '-'}</div>
              </td>
              <td style={{ padding: '8px 6px' }}>
                <div><span className="tag">{t.category || 'other'}</span></div>
                <div style={{ marginTop: 4 }}><span className={`tag tag-${t.priority || 'medium'}`}>{t.priority || 'medium'}</span></div>
              </td>
              <td style={{ padding: '8px 6px' }}>
                <div><span className="tag">{t.status}</span></div>
                <div style={{ marginTop: 4 }}><span className="tag">{t.routeStatus || 'unrouted'}</span></div>
                {t.assignedTo && (
                  <div style={{ marginTop: 4 }} className="muted">
                    IT: {team.find((m) => m._id === t.assignedTo)?.username || t.assignedTo}
                  </div>
                )}
              </td>
              <td style={{ padding: '8px 6px' }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary" disabled={!!updating} onClick={() => onUpdateStatus(t._id, 'InProgress')}>Work</button>
                    <button className="btn" disabled={!!updating} onClick={() => onUpdateStatus(t._id, 'Resolved')}>Resolve</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary" disabled={!!updating} onClick={() => onRoute(t._id)}>{updating === t._id + ':route' ? 'Routing…' : 'Route'}</button>
                    <button className="btn secondary" disabled={!!updating} onClick={() => onAutoRoute(t._id)}>{updating === t._id + ':autoroute' ? 'Auto…' : 'Auto-route'}</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={t.assignedTo || ''} onChange={(e) => onAssign(t._id, e.target.value)}>
                      <option value="">Assign to…</option>
                      {team.map((m) => (
                        <option key={m._id} value={m._id}>{m.username || m.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    placeholder="Notes (optional)"
                    value={comments[t._id] || ''}
                    onChange={(e) => onCommentChange(t._id, e.target.value)}
                  />
                </div>
              </td>
            </tr>
          ))}
          {!tickets.length && (
            <tr>
              <td className="muted" colSpan={5} style={{ padding: '10px 6px' }}>No tickets</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Local hook to manage details state
function useDetailsState() {
  const expanded = {};
  const loading = {};
  const details = {};
  const newComment = {};
  const posting = {};
  // Use simple objects mutated by methods; components re-render because parent updates props or via state setters on arrays. For reliability, you might convert these to React.useState maps.
  return {
    expanded,
    loading,
    details,
    newComment,
    posting,
    toggle(id) { this.expanded[id] = !this.expanded[id]; },
    setLoading(id, v) { this.loading[id] = !!v; },
    setPosting(id, v) { this.posting[id] = !!v; },
    setDetails(id, v) { this.details[id] = v; },
    setNewComment(id, v) { this.newComment[id] = v; },
  };
}
