import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import LeadsList from "./pages/LeadsList.jsx";
import KanbanBoard from "./pages/KanbanBoard.jsx";
import AuthGate from "./components/AuthGate.jsx";
import { getStoredPassword } from "./api.js";
import konseptLogo from "./assets/konsept-logo-full.svg";

export default function App() {
  const [authed, setAuthed] = useState(!!getStoredPassword());

  useEffect(() => {
    function handleUnauthorized() {
      setAuthed(false);
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  if (!authed) {
    return <AuthGate onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src={konseptLogo} alt="Konsept" className="brand-logo" />
          <span className="brand-suffix">· Mini-CRM</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Oversikt
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => (isActive ? "active" : "")}>
            Leads
          </NavLink>
          <NavLink to="/kanban" className={({ isActive }) => (isActive ? "active" : "")}>
            Kanban
          </NavLink>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<LeadsList />} />
          <Route path="/kanban" element={<KanbanBoard />} />
        </Routes>
      </main>
    </div>
  );
}
