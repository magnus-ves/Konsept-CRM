import { useEffect, useState } from "react";
import { api, STATUSES, PRIORITIES, INDUSTRIES } from "../api.js";

const emptyForm = {
  company_name: "",
  industry: "",
  contact_person: "",
  phone: "",
  email: "",
  website: "",
  location: "",
  status: "Ny",
  priority: "Middels",
  missing_items: "",
  last_contact_date: "",
  next_followup_date: "",
};

function toDateInput(value) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function LeadForm({ lead, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (lead) {
      setForm({
        ...emptyForm,
        ...lead,
        last_contact_date: toDateInput(lead.last_contact_date),
        next_followup_date: toDateInput(lead.next_followup_date),
      });
    } else {
      setForm(emptyForm);
    }
  }, [lead]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        last_contact_date: form.last_contact_date || null,
        next_followup_date: form.next_followup_date || null,
      };
      if (lead) {
        await api.updateLead(lead.id, payload);
      } else {
        await api.createLead(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim() || !lead) return;
    try {
      await api.addNote(lead.id, noteText.trim());
      setNoteText("");
      onSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{lead ? "Rediger lead" : "Ny lead"}</h2>
          <button className="btn btn-sm" onClick={onClose}>Lukk</button>
        </div>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label>Bedriftsnavn *</label>
              <input
                className="input"
                required
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Bransje</label>
              <input
                className="input"
                list="industries"
                value={form.industry || ""}
                onChange={(e) => update("industry", e.target.value)}
              />
              <datalist id="industries">
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>

            <div className="field">
              <label>Sted / adresse</label>
              <input
                className="input"
                value={form.location || ""}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Kontaktperson</label>
              <input
                className="input"
                value={form.contact_person || ""}
                onChange={(e) => update("contact_person", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Telefon</label>
              <input
                className="input"
                value={form.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div className="field">
              <label>E-post</label>
              <input
                className="input"
                type="email"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Nettside</label>
              <input
                className="input"
                value={form.website || ""}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Prioritet</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Siste kontakt</label>
              <input
                className="input"
                type="date"
                value={form.last_contact_date || ""}
                onChange={(e) => update("last_contact_date", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Neste oppfølging</label>
              <input
                className="input"
                type="date"
                value={form.next_followup_date || ""}
                onChange={(e) => update("next_followup_date", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Hva mangler hos dem</label>
              <input
                className="input"
                placeholder="F.eks. ingen bilder, utdatert design, uklart budskap"
                value={form.missing_items || ""}
                onChange={(e) => update("missing_items", e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Lagrer…" : "Lagre"}
            </button>
          </div>
        </form>

        {lead && (
          <div style={{ marginTop: 18, paddingTop: 12 }}>
            <h2>Notatlogg</h2>
            <div className="notes-log">
              {(lead.notes || []).length === 0 && (
                <p className="empty">Ingen notater ennå</p>
              )}
              {(lead.notes || []).map((n) => (
                <div className="note-entry" key={n.id}>
                  <div className="ts">
                    {new Date(n.created_at).toLocaleString("nb-NO")}
                  </div>
                  <div>{n.text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Legg til nytt notat…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNote())}
              />
              <button type="button" className="btn" onClick={handleAddNote}>
                Legg til
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
