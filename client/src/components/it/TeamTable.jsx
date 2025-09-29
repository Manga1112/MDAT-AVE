export default function TeamTable({ team = [] }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr className="muted">
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Member</th>
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '8px 6px' }}>Open tickets</th>
          </tr>
        </thead>
        <tbody>
          {team.map((m) => (
            <tr key={m._id}>
              <td style={{ padding: '8px 6px' }}>{m.name || m.username}</td>
              <td style={{ padding: '8px 6px' }}>{m.email || '-'}</td>
              <td style={{ padding: '8px 6px' }}>
                <span className="tag">{m.openTickets}</span>
              </td>
            </tr>
          ))}
          {!team.length && (
            <tr>
              <td className="muted" colSpan={3} style={{ padding: '10px 6px' }}>
                No team members
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
