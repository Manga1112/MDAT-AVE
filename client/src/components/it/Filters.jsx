import { useMemo } from 'react';

export default function Filters({
  state,
  team = [],
  onChange,
  onApply,
  onReset,
}) {
  const pageSizeOptions = useMemo(() => [10, 20, 50], []);
  return (
    <div className="panel" style={{ backdropFilter: 'blur(6px)' }}>
      <div className="toolbar" style={{ marginBottom: 8, gap: 8 }}>
        <input
          placeholder="Search title/description/type"
          value={state.search}
          onChange={(e) => onChange({ search: e.target.value })}
          style={{ width: 260 }}
        />
        <select
          value={state.status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="">Status</option>
          <option>Created</option>
          <option>InProgress</option>
          <option>WaitingOnUser</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
        <select
          value={state.routeStatus}
          onChange={(e) => onChange({ routeStatus: e.target.value })}
        >
          <option value="">Routing</option>
          <option value="unrouted">Unrouted</option>
          <option value="routed">Routed</option>
        </select>
        <select
          value={state.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">Category</option>
          <option>network</option>
          <option>hardware</option>
          <option>software</option>
          <option>salary</option>
          <option>other</option>
        </select>
        <select
          value={state.priority}
          onChange={(e) => onChange({ priority: e.target.value })}
        >
          <option value="">Priority</option>
          <option>low</option>
          <option>medium</option>
          <option>high</option>
          <option>urgent</option>
        </select>
        <select
          value={state.assignedTo}
          onChange={(e) => onChange({ assignedTo: e.target.value })}
        >
          <option value="">Assigned</option>
          {team.map((m) => (
            <option key={m._id} value={m._id}>
              {m.username || m.name}
            </option>
          ))}
        </select>
        <div className="spacer" />
        <label className="muted">Page size</label>
        <select
          value={String(state.pageSize)}
          onChange={(e) => onChange({ pageSize: parseInt(e.target.value) || 10 })}
          style={{ width: 90 }}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button className="btn secondary" onClick={onReset}>
          Reset
        </button>
        <button className="btn" onClick={onApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
