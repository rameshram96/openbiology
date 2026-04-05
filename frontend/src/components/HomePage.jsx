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
  { value: "6",        label: "Modules" },
  { value: "3",        label: "Correlation Methods" },
  { value: "Free",     label: "Always" },
  { value: "XLS · PNG", label: "Export" },
];

export default function HomePage({ onNavigate }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [visible, setVisible]     = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  const fadeIn = (delay = 0) => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <div style={{ background: "#1C1C1C", padding: "0 2.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: 18 }}>🌿</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>OpenBiology</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontFamily: "'DM Mono'" }}>v1.0 · Plant Science Data Suite</span>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "3rem 2rem" }}>

        {/* Hero */}
        <div style={{ ...fadeIn(0), textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-block", background: "#E8F4FD", border: "1px solid #56B4E9", borderRadius: 999, padding: "0.28rem 1rem", marginBottom: "1.1rem" }}>
            <span style={{ color: "#0072B2", fontSize: "0.7rem", fontFamily: "'DM Mono'", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Statistical Analysis · Plant Science Research
            </span>
          </div>
          <h1 style={{ margin: "0 0 0.85rem", fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 700, color: "#1C1C1C", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Data Analysis Suite
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem", maxWidth: 460, margin: "0 auto 1.75rem", lineHeight: 1.75, fontWeight: 300 }}>
            A modular, free statistical platform designed for plant scientists — correlation, ANOVA, PCA and more.
          </p>
          {/* Stats strip */}
          <div style={{ display: "inline-flex", borderRadius: 12, overflow: "hidden", border: "1px solid #E0E0E0", background: "#fff" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: "0.7rem 1.3rem", borderRight: i < stats.length - 1 ? "1px solid #E0E0E0" : "none" }}>
                <div style={{ color: "#0072B2", fontWeight: 700, fontSize: "0.95rem", fontFamily: "'DM Mono'" }}>{s.value}</div>
                <div style={{ color: "#AAA", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Module cards */}
        <div style={{ ...fadeIn(0.1), display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
          {modules.map((mod, i) => {
            const isReady   = mod.status === "ready";
            const isHovered = hoveredId === mod.id && isReady;
            return (
              <div
                key={mod.id}
                onClick={() => isReady && onNavigate(mod.id)}
                onMouseEnter={() => setHoveredId(mod.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: "#fff", borderRadius: 14, padding: "1.4rem",
                  border: `1.5px solid ${isHovered ? mod.color : "#E5E5E5"}`,
                  cursor: isReady ? "pointer" : "default", position: "relative",
                  boxShadow: isHovered ? `0 6px 24px rgba(0,0,0,0.09)` : "0 1px 4px rgba(0,0,0,0.05)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 16, bottom: 16, width: 3, borderRadius: "0 3px 3px 0", background: isReady ? mod.color : "#DEDEDE" }} />
                <div style={{ position: "absolute", top: 14, right: 14, padding: "0.17rem 0.52rem", borderRadius: 999, background: isReady ? "#E8F4FD" : "#F2F2F2", color: isReady ? "#0072B2" : "#999", fontSize: "0.6rem", fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 1.2, border: `1px solid ${isReady ? "#56B4E9" : "#E0E0E0"}` }}>
                  {isReady ? "● Live" : "Soon"}
                </div>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.65rem", color: isReady ? mod.color : "#BDBDBD", transition: "color 0.2s" }}>{mod.icon}</div>
                <h3 style={{ margin: "0 0 0.18rem", fontSize: "0.95rem", fontWeight: 700, color: "#1C1C1C" }}>{mod.title}</h3>
                <p style={{ margin: "0 0 0.6rem", fontSize: "0.68rem", color: isReady ? mod.color : "#AAAAAA", fontFamily: "'DM Mono'", transition: "color 0.2s" }}>{mod.subtitle}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", lineHeight: 1.65, color: "#777", fontWeight: 300 }}>{mod.desc}</p>
                {isReady && <div style={{ marginTop: "0.9rem", fontSize: "0.72rem", color: mod.color, fontWeight: 600, opacity: isHovered ? 1 : 0, transition: "opacity 0.2s", fontFamily: "'DM Mono'" }}>Open module →</div>}
              </div>
            );
          })}
        </div>

        {/* Developer + Support row */}
        <div style={{ ...fadeIn(0.2), display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2.5rem" }}>

          {/* Developer Card */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #EEEEEE", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <img
              src="https://rameshram96.github.io/Ramesh-Ramasamy/profile.jpg"
              alt="Ramesh R"
              style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid #E8F4FD", marginBottom: "1rem", boxShadow: "0 2px 12px rgba(0,114,178,0.15)" }}
            />
            <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", fontWeight: 700, color: "#1C1C1C" }}>Ramesh R</h3>
            <p style={{ margin: "0 0 0.9rem", fontSize: "0.75rem", color: "#0072B2", fontWeight: 500, lineHeight: 1.5 }}>
              Plant Physiologist · CRISPR Genome Editor<br />Bioinformatics Developer
            </p>
            <p style={{ margin: "0 0 1.1rem", fontSize: "0.78rem", color: "#777", lineHeight: 1.65, fontWeight: 300, maxWidth: 280 }}>
              PhD scholar building open-source tools to make data analysis accessible to every plant scientist.
            </p>
            {/* Social links */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "GitHub",       url: "https://github.com/rameshram96",                                                                          color: "#1C1C1C" },
                { label: "ResearchGate", url: "https://www.researchgate.net/profile/Ramesh-R-8",                                                         color: "#00CCBB" },
                { label: "Scholar",      url: "https://scholar.google.com/citations?user=pRR3FhsAAAAJ&hl=en",                                            color: "#4285F4" },
                { label: "Email",        url: "mailto:crisprramesh@gmail.com",                                                                            color: "#E69F00" },
              ].map(link => (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer" style={{ padding: "0.3rem 0.75rem", borderRadius: 7, border: `1px solid ${link.color}`, color: link.color, fontSize: "0.72rem", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
{/* Co-Developer Card */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #EEEEEE", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <img
              src=""
              alt="Mathiyarasi K"
              style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid #E8F4FD", marginBottom: "1rem", boxShadow: "0 2px 12px rgba(0,114,178,0.15)" }}
            />
            <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", fontWeight: 700, color: "#1C1C1C" }}>Mathiyarasi K</h3>
            <p style={{ margin: "0 0 0.9rem", fontSize: "0.75rem", color: "#0072B2", fontWeight: 500, lineHeight: 1.5 }}>
              Environmental Science Scholar · <br />Co-Developer and Tester Openbiology.in
            </p>
            <p style={{ margin: "0 0 1.1rem", fontSize: "0.78rem", color: "#777", lineHeight: 1.65, fontWeight: 300, maxWidth: 280 }}>
              .
            </p>
            {/* Social links */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "GitHub",       url: "",                                                                          color: "#1C1C1C" },
                { label: "ResearchGate", url: "",                                                         color: "#00CCBB" },
                { label: "Scholar",      url: "",                                            color: "#4285F4" },
                { label: "Email",        url: "",                                                                            color: "#E69F00" },
              ].map(link => (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer" style={{ padding: "0.3rem 0.75rem", borderRadius: 7, border: `1px solid ${link.color}`, color: link.color, fontSize: "0.72rem", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          {/* Support Section */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #EEEEEE", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: "0.75rem" }}>🌱</div>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, color: "#1C1C1C" }}>Support OpenBiology</h3>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.8rem", color: "#666", lineHeight: 1.75, fontWeight: 300, maxWidth: 320 }}>
              OpenBiology is free and open to everyone in the plant science community. If this tool has been useful in your research, any support — however small — helps keep it running and growing.
              <br /><br />
              <em style={{ color: "#009E73", fontWeight: 500 }}>Please don't feel any obligation — your use of the tool is more than enough.</em>
            </p>

            {/* UPI QR placeholder */}
            <div style={{ border: "2px dashed #D0E8FF", borderRadius: 12, padding: "1.25rem", background: "#F8FBFF", width: "100%", maxWidth: 200 }}>
              {/* Replace upi-qr.png in frontend/public/ with your actual UPI QR code */}
              <img
                src="/upi-qr.png"
                alt="UPI QR Code"
                onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                style={{ width: "100%", borderRadius: 8 }}
              />
              <div style={{ display: "none", flexDirection: "column", alignItems: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: 36, marginBottom: "0.4rem" }}>📱</div>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#AAA" }}>Place your UPI QR code<br />as <code>upi-qr.png</code> in <code>frontend/public/</code></p>
              </div>
              <p style={{ margin: "0.65rem 0 0", fontSize: "0.72rem", color: "#0072B2", fontWeight: 600 }}>Scan to Support via UPI</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ ...fadeIn(0.3), textAlign: "center", color: "#CCCCCC", fontSize: "0.67rem", fontFamily: "'DM Mono'", letterSpacing: 1.2 }}>
          OPENBIOLOGY · PLANT SCIENCE DATA ANALYSIS SUITE · FREE & OPEN SOURCE
        </div>
      </div>
    </div>
  );
}
