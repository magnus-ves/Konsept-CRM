// I produksjon settes VITE_API_URL til backendens fulle URL (f.eks.
// https://konsept-crm-api.vercel.app/api). Lokalt brukes Vite-proxyen i
// vite.config.js, som ruter /api videre til backend på localhost:8000.
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const PASSWORD_KEY = "konsept_crm_password";

export function getStoredPassword() {
  try {
    return localStorage.getItem(PASSWORD_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredPassword(password) {
  try {
    localStorage.setItem(PASSWORD_KEY, password);
  } catch {
    // ignorer (f.eks. privat nettlesing uten lagringstilgang)
  }
}

export function clearStoredPassword() {
  try {
    localStorage.removeItem(PASSWORD_KEY);
  } catch {
    // ignorer
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-App-Password": getStoredPassword(),
    },
    ...options,
  });
  if (res.status === 401) {
    clearStoredPassword();
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error("Feil passord");
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Feil (${res.status})`);
  }
  return res.json();
}

export const api = {
  checkPassword: async (password) => {
    const res = await fetch(`${BASE_URL}/auth/check`, {
      headers: { "X-App-Password": password },
    });
    return res.ok;
  },
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
  sendEmail: (id, data) =>
    request(`/leads/${id}/send-email`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDashboard: () => request("/dashboard"),
  exportCsv: async () => {
    const res = await fetch(`${BASE_URL}/export/csv`, {
      headers: { "X-App-Password": getStoredPassword() },
    });
    if (res.status === 401) {
      clearStoredPassword();
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      throw new Error("Feil passord");
    }
    if (!res.ok) throw new Error(`Feil (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
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
