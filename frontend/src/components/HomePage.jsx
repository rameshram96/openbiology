import { useState, useEffect } from "react";

const modules = [
  {
    id: "correlation",
    icon: "⬡",
    title: "Correlation Analysis",
    subtitle: "Pearson · Spearman · Kendall",
    desc: "Explore relationships between plant traits with correlation matrices, heatmaps and scatter plots.",
    status: "ready",
    color: "#0072B2",
  },
  {
    id: "anova",
    icon: "◈",
    title: "ANOVA Suite",
    subtitle: "One-way · Two-way · Three-way",
    desc: "Compare means across treatment groups with post-hoc tests — Tukey, Duncan, LSD.",
    status: "soon",
    color: "#E69F00",
  },
  {
    id: "pca",
    icon: "◎",
    title: "PCA & Multivariate",
    subtitle: "PCA · Cluster · Discriminant",
    desc: "Reduce dimensionality and uncover hidden structure in multi-trait phenotypic data.",
    status: "soon",
    color: "#009E73",
  },
  {
    id: "regression",
    icon: "◬",
    title: "Regression",
    subtitle: "Simple · Multiple · Stepwise",
    desc: "Model trait relationships and predict outcomes across genotypes and environments.",
    status: "soon",
    color: "#CC79A7",
  },
  {
    id: "nonparametric",
    icon: "◇",
    title: "Non-parametric Tests",
    subtitle: "Kruskal-Wallis · Mann-Whitney",
    desc: "Robust statistical tests for non-normal distributions and small sample sizes.",
    status: "soon",
    color: "#D55E00",
  },
  {
    id: "descriptive",
    icon: "▣",
    title: "Descriptive Statistics",
    subtitle: "Mean · SD · CV · Normality",
    desc: "Summarize datasets with comprehensive descriptive stats and normality diagnostics.",
    status: "soon",
    color: "#56B4E9",
  },
];

const stats = [
  { value: "6", label: "Modules" },
  { value: "3", label: "Correlation Methods" },
  { value: "∞", label: "Variables" },
  { value: "XLS · PNG", label: "Export" },
];

export default function HomePage({ onNavigate }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F7F7F5",
      fontFamily: "'Source Serif 4', Georgia, serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{
        background: "#1C1C1C", padding: "0 2.5rem", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: 18 }}>🌿</span>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem", letterSpacing: 0.3 }}>Open Biology</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontFamily: "'DM Mono'" }}>v1.0</span>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Hero */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease", textAlign: "center", marginBottom: "3.5rem",
        }}>
          <div style={{
            display: "inline-block", background: "#E8F4FD",
            border: "1px solid #56B4E9", borderRadius: 999,
            padding: "0.3rem 1rem", marginBottom: "1.25rem",
          }}>
            <span style={{ color: "#0072B2", fontSize: "0.72rem", fontFamily: "'DM Mono'", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Comprehensive Data Analysis Suite for Plant Science Research
            </span>
          </div>

          <h1 style={{
            margin: "0 0 1rem", fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontWeight: 700, color: "#1C1C1C", lineHeight: 1.1, letterSpacing: "-0.02em",
          }}>
            Data Analysis Suite
          </h1>

          <p style={{
            color: "#555", fontSize: "1rem", maxWidth: 480,
            margin: "0 auto 2rem", lineHeight: 1.75, fontWeight: 300,
          }}>
            A modular statistical platform — correlation, ANOVA, PCA and more —
            designed for plant research communities.
          </p>

          {/* Stats strip */}
          <div style={{
            display: "inline-flex", borderRadius: 12, overflow: "hidden",
            border: "1px solid #E0E0E0", background: "#fff",
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: "0.75rem 1.4rem",
                borderRight: i < stats.length - 1 ? "1px solid #E0E0E0" : "none",
              }}>
                <div style={{ color: "#0072B2", fontWeight: 700, fontSize: "1rem", fontFamily: "'DM Mono'" }}>{s.value}</div>
                <div style={{ color: "#888", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Module cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}>
          {modules.map((mod, i) => {
            const isReady = mod.status === "ready";
            const isHovered = hoveredId === mod.id && isReady;

            return (
              <div
                key={mod.id}
                onClick={() => isReady && onNavigate(mod.id)}
                onMouseEnter={() => setHoveredId(mod.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s, box-shadow 0.2s, border-color 0.2s, background 0.2s`,
                  background: isHovered ? "#fff" : "#fff",
                  border: `1.5px solid ${isHovered ? mod.color : "#E5E5E5"}`,
                  borderRadius: 14, padding: "1.5rem",
                  cursor: isReady ? "pointer" : "default",
                  boxShadow: isHovered ? `0 6px 24px rgba(0,0,0,0.10)` : "0 1px 4px rgba(0,0,0,0.05)",
                  position: "relative",
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  position: "absolute", left: 0, top: 16, bottom: 16,
                  width: 3, borderRadius: "0 3px 3px 0",
                  background: isReady ? mod.color : "#DEDEDE",
                }} />

                {/* Status */}
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  padding: "0.18rem 0.55rem", borderRadius: 999,
                  background: isReady ? "#E8F4FD" : "#F2F2F2",
                  color: isReady ? "#0072B2" : "#999",
                  fontSize: "0.62rem", fontFamily: "'DM Mono'",
                  textTransform: "uppercase", letterSpacing: 1.2,
                  border: `1px solid ${isReady ? "#56B4E9" : "#E0E0E0"}`,
                }}>
                  {isReady ? "● Live" : "Soon"}
                </div>

                {/* Icon */}
                <div style={{
                  fontSize: "1.6rem", marginBottom: "0.75rem",
                  color: isReady ? mod.color : "#BDBDBD",
                  transition: "color 0.2s",
                }}>
                  {mod.icon}
                </div>

                {/* Title */}
                <h3 style={{
                  margin: "0 0 0.2rem", fontSize: "0.98rem",
                  fontWeight: 700, color: "#1C1C1C",
                }}>
                  {mod.title}
                </h3>

                {/* Subtitle */}
                <p style={{
                  margin: "0 0 0.65rem", fontSize: "0.7rem",
                  color: isReady ? mod.color : "#AAAAAA",
                  fontFamily: "'DM Mono'", letterSpacing: 0.3,
                  transition: "color 0.2s",
                }}>
                  {mod.subtitle}
                </p>

                {/* Desc */}
                <p style={{
                  margin: 0, fontSize: "0.8rem", lineHeight: 1.65,
                  color: "#666", fontWeight: 300,
                }}>
                  {mod.desc}
                </p>

                {isReady && (
                  <div style={{
                    marginTop: "1rem", fontSize: "0.75rem",
                    color: mod.color, fontWeight: 600,
                    opacity: isHovered ? 1 : 0, transition: "opacity 0.2s",
                    fontFamily: "'DM Mono'",
                  }}>
                    Open module →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "3rem", textAlign: "center",
          color: "#BBBBBB", fontSize: "0.68rem",
          fontFamily: "'DM Mono'", letterSpacing: 1.5,
        }}>
          crisprramesh@gmail.com · Developed and Maintained by Ramesh R
        </div>
      </div>
    </div>
  );
}
