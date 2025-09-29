import { Card } from "../UI";

export default function StatCard({ label, value, hint, style }) {
  return (
    <Card style={{ padding: 16, ...style }}>
      <div className="sub" style={{ textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {hint ? <div className="sub" style={{ marginTop: 4 }}>{hint}</div> : null}
    </Card>
  );
}
