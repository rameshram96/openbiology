import { useState } from "react";
import HomePage from "./components/HomePage";
import CorrelationModule from "./modules/correlation/CorrelationModule";
// import AnovaModule     from "./modules/anova/AnovaModule";
// import PcaModule       from "./modules/pca/PcaModule";

const MODULE_MAP = {
  correlation: <CorrelationModule />,
  // anova:      <AnovaModule />,
  // pca:        <PcaModule />,
};

export default function App() {
  const [active, setActive] = useState(null); // null = homepage

  if (!active) {
    return <HomePage onNavigate={setActive} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f0" }}>
      {/* Top bar with back button */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
        padding: "0 2rem", height: 52,
        display: "flex", alignItems: "center", gap: "1rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
      }}>
        <button
          onClick={() => setActive(null)}
          style={{
            background: "rgba(255,255,255,0.12)", border: "none",
            color: "#fff", borderRadius: 8, padding: "0.35rem 0.9rem",
            cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
          }}
        >
          ← Home
        </button>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>🌿 Plant Stats Suite</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>/ {active}</span>
      </div>
      <main>{MODULE_MAP[active]}</main>
    </div>
  );
}
