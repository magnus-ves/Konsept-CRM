import { useEffect, useState } from "react";
import { api, STATUSES } from "../api.js";
import LeadForm from "../components/LeadForm.jsx";

export default function KanbanBoard() {
  const [leads, setLeads] = useState([]);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await api.getLeads();
    setLeads(data);
  }

  useEffect(() => {
    load();
  }, []);

  function handleDrop(e, status) {
    e.preventDefault();
    setDragOverStatus(null);
    const leadId = Number(e.dataTransfer.getData("text/lead-id"));
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === status) return;
    api.updateLeadStatus(leadId, status).then(load);
  }

  return (
    <div>
      <h1>Kanban</h1>
      <div className="kanban">
        {STATUSES.map((status) => {
          const columnLeads = leads.filter((l) => l.status === status);
          return (
            <div
              key={status}
              className={`kanban-col ${dragOverStatus === status ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => handleDrop(e, status)}
            >
              <h3>{status} ({columnLeads.length})</h3>
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/lead-id", String(lead.id))}
                  onClick={() => { setEditingLead(lead); setShowForm(true); }}
                >
                  <div className="company">{lead.company_name}</div>
                  <div className="meta">{lead.industry || "—"} · {lead.priority}</div>
                  {lead.next_followup_date && (
                    <div className="meta">
                      Neste: {new Date(lead.next_followup_date).toLocaleDateString("nb-NO")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showForm && (
        <LeadForm
          lead={editingLead}
          onClose={() => setShowForm(false)}
          onSaved={async (keepOpen) => {
            if (keepOpen && editingLead) {
              const fresh = await api.getLead(editingLead.id);
              setEditingLead(fresh);
            } else {
              setShowForm(false);
            }
            load();
          }}
        />
      )}
    </div>
  );
}
