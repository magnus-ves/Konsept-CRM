const BASE_URL = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Feil (${res.status})`);
  }
  return res.json();
}

export const api = {
  getLeads: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    ).toString();
    return request(`/leads${query ? `?${query}` : ""}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  createLead: (data) =>
    request("/leads", { method: "POST", body: JSON.stringify(data) }),
  updateLead: (id, data) =>
    request(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateLeadStatus: (id, status) =>
    request(`/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteLead: (id) => request(`/leads/${id}`, { method: "DELETE" }),
  addNote: (id, text) =>
    request(`/leads/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  getDashboard: () => request("/dashboard"),
  exportCsvUrl: () => `${BASE_URL}/export/csv`,
};

export const STATUSES = [
  "Ny",
  "Kontaktet",
  "Tilbud sendt",
  "Møte avtalt",
  "Kunde",
  "Avslått",
  "Ikke aktuell",
];

export const PRIORITIES = ["Høy", "Middels", "Lav"];

export const INDUSTRIES = [
  "Restaurant",
  "Håndverker",
  "Frisør",
  "Veterinær",
  "Butikk",
  "Annet",
];
