import { useEffect, useState } from "react";
import { api, STATUSES, PRIORITIES } from "../api.js";
import LeadForm from "../components/LeadForm.jsx";

function priorityBadgeClass(priority) {
  if (priority === "Høy") return "badge badge-hoy";
  if (priority === "Middels") return "badge badge-middels";
  return "badge badge-lav";
}

function followupClass(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const in7 = new Date();
  in7.setDate(now.getDate() + 7);
  if (date < now) return "due-overdue";
  if (date <= in7) return "due-soon";
  return "";
}

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", industry: "", priority: "", search: "" });
  const [editingLead, setEditingLead] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getLeads(filters);
      setLeads(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function refreshLead(id) {
    const fresh = await api.getLead(id);
    setEditingLead(fresh);
    load();
  }

  async function handleDelete(id) {
    if (!confirm("Er du sikker på at du vil slette denne leaden?")) return;
    await api.deleteLead(id);
    load();
  }

  async function handleStatusChange(id, status) {
    await api.updateLeadStatus(id, status);
    load();
  }

  const industries = [...new Set(leads.map((l) => l.industry).filter(Boolean))];

  return (
    <div>
      <h1>Leads</h1>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Søk (navn, bransje, sted)…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="input"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Alle statuser</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="input"
          value={filters.priority}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
        >
          <option value="">Alle prioriteter</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          className="input"
          value={filters.industry}
          onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}
        >
          <option value="">Alle bransjer</option>
          {industries.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <div className="spacer" />
        <a className="btn" href={api.exportCsvUrl()}>Eksporter CSV</a>
        <button className="btn btn-primary" onClick={() => { setEditingLead(null); setShowForm(true); }}>
          + Ny lead
        </button>
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {loading && <p className="empty">Laster…</p>}

      {!loading && leads.length === 0 && (
        <p className="empty">Ingen leads funnet. Legg til din første over.</p>
      )}

      {!loading && leads.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bedrift</th>
                <th>Bransje</th>
                <th>Kontakt</th>
                <th>Status</th>
                <th>Prioritet</th>
                <th>Neste oppfølging</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div
                      style={{ fontWeight: 600, cursor: "pointer" }}
                      onClick={() => { setEditingLead(lead); setShowForm(true); }}
                    >
                      {lead.company_name}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                      {lead.location}
                    </div>
                  </td>
                  <td>{lead.industry || "—"}</td>
                  <td>
                    {lead.contact_person || "—"}
                    {lead.phone && <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{lead.phone}</div>}
                  </td>
                  <td>
                    <select
                      className="input"
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={priorityBadgeClass(lead.priority)}>{lead.priority}</span>
                  </td>
                  <td className={followupClass(lead.next_followup_date)}>
                    {lead.next_followup_date
                      ? new Date(lead.next_followup_date).toLocaleDateString("nb-NO")
                      : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => { setEditingLead(lead); setShowForm(true); }}
                      >
                        Rediger
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(lead.id)}>
                        Slett
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <LeadForm
          lead={editingLead}
          onClose={() => setShowForm(false)}
          onSaved={(keepOpen) => {
            if (keepOpen && editingLead) {
              refreshLead(editingLead.id);
            } else {
              setShowForm(false);
              load();
            }
          }}
        />
      )}
    </div>
  );
}
