import { useState } from "react";
import { api, setStoredPassword } from "../api.js";
import konseptLogo from "../assets/konsept-logo-full.svg";

export default function AuthGate({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setChecking(true);
    setError("");
    try {
      const ok = await api.checkPassword(password.trim());
      if (ok) {
        setStoredPassword(password.trim());
        onSuccess();
      } else {
        setError("Feil passord");
      }
    } catch {
      setError("Kunne ikke koble til serveren");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form onSubmit={handleSubmit} className="modal" style={{ maxWidth: 360 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img
            src={konseptLogo}
            alt="Konsept"
            style={{ height: 32, width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Passord</label>
          <input
            className="input"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Skriv inn passord"
          />
        </div>
        {error && <p style={{ color: "var(--danger)", marginTop: 0 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={checking}>
          {checking ? "Sjekker…" : "Logg inn"}
        </button>
      </form>
    </div>
  );
}
