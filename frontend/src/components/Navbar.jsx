export default function Navbar({ active, onNavigate }) {
  const modules = [
    { id: "correlation", label: "Correlation", icon: "📊" },
    // Add new modules here as they are built
    // { id: "anova",       label: "ANOVA",       icon: "📉" },
    // { id: "pca",         label: "PCA",          icon: "🔵" },
    // { id: "regression",  label: "Regression",   icon: "📈" },
  ];

  return (
    <nav style={{
      background: "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
      padding: "0 2rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      height: 56,
      boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginRight: "1.5rem" }}>
        <span style={{ fontSize: 22 }}>🌿</span>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", letterSpacing: 0.3 }}>
          Plant Stats Suite
        </span>
      </div>

      {/* Module tabs */}
      {modules.map((m) => (
        <button
          key={m.id}
          onClick={() => onNavigate(m.id)}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: 8,
            border: "none",
            background: active === m.id ? "rgba(255,255,255,0.2)" : "transparent",
            color: "#fff",
            fontWeight: active === m.id ? 700 : 400,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          {m.icon} {m.label}
        </button>
      ))}
    </nav>
  );
}
