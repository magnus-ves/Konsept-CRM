import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import LeadsList from "./pages/LeadsList.jsx";
import KanbanBoard from "./pages/KanbanBoard.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Konsept · Mini-CRM</div>
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
