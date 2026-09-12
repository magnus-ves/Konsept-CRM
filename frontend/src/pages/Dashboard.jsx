import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="empty">Kunne ikke laste oversikt: {error}</p>;
  if (!stats) return <p className="empty">Laster…</p>;

  const maxStatus = Math.max(1, ...Object.values(stats.by_status));

  return (
    <div>
      <h1>Oversikt</h1>
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="num">{stats.total}</div>
          <div className="label">Totalt antall leads</div>
        </div>
        <div className="stat-tile">
          <div className="num">{stats.due_this_week}</div>
          <div className="label">Oppfølging denne uken</div>
        </div>
        <div className="stat-tile">
          <div className="num" style={{ color: stats.overdue > 0 ? "var(--danger)" : undefined }}>
            {stats.overdue}
          </div>
          <div className="label">Forfalt oppfølging</div>
        </div>
        <div className="stat-tile">
          <div className="num">{stats.by_status["Kunde"] || 0}</div>
          <div className="label">Kunder</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h2>Leads per status</h2>
        <div className="status-breakdown">
          {Object.entries(stats.by_status).map(([name, count]) => (
            <div className="status-row" key={name}>
              <div className="name">{name}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / maxStatus) * 100}%` }}
                />
              </div>
              <div className="count">{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Leads per prioritet</h2>
        <div className="status-breakdown">
          {Object.entries(stats.by_priority).map(([name, count]) => (
            <div className="status-row" key={name}>
              <div className="name">{name}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / Math.max(1, stats.total)) * 100}%` }}
                />
              </div>
              <div className="count">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
