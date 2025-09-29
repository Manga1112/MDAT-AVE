import { useMemo } from 'react';
import { Card } from '../UI';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

const STATUS_COLORS = {
  Pending: '#94a3b8',
  Routed: '#6366f1',
  Working: '#22c55e',
  Resolved: '#10b981',
  Created: '#a78bfa',
};

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#84cc16',
  low: '#22d3ee',
  P1: '#ef4444',
  P2: '#f59e0b',
  P3: '#84cc16',
  P4: '#22d3ee',
};

export default function ChartsPanel({ tickets = [], summary }) {
  const statusData = useMemo(() => {
    if (summary) {
      return [
        { name: 'Pending', value: Number(summary.pending) || 0 },
        { name: 'Routed', value: Number(summary.routed) || 0 },
        { name: 'Working', value: Number(summary.working) || 0 },
        { name: 'Resolved', value: Number(summary.resolved) || 0 },
      ];
    }
    const map = new Map();
    (tickets || []).forEach((t) => {
      const key = t.status || 'Pending';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [tickets, summary]);

  const priorityData = useMemo(() => {
    const map = new Map();
    (tickets || []).forEach((t) => {
      const key = (t.priority || 'medium').toString();
      map.set(key, (map.get(key) || 0) + 1);
    });
    const ordered = ['urgent', 'high', 'medium', 'low'];
    const result = Array.from(map, ([name, value]) => ({ name, value }));
    result.sort((a, b) => ordered.indexOf(a.name) - ordered.indexOf(b.name));
    return result;
  }, [tickets]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
      <Card style={{ padding: 12 }}>
        <div className="panel-title">Tickets by Status</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)' }} />
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card style={{ padding: 12 }}>
        <div className="panel-title">Tickets by Priority</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)' }} />
              <Bar dataKey="value">
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#7c3aed'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
