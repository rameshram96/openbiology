import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SponsorBanner from "./SponsorBanner";
import VisitorBadge from "./VisitorBadge";
import NoticeBar from "./NoticeBar";
// ─── Data ────────────────────────────────────────────────────────────────────



const NAV_SECTIONS = [
  { id: "analysis",       label: "Data Analysis" },
  { id: "plant-science",  label: "Plant Science" },
  { id: "bioinformatics", label: "Bioinformatics" },
  { id: "blog",           label: "Blog" },
  { id: "about",          label: "About" },
  { id: "feedback", label: "Feedback" },
];


const ANALYSIS_MODULES = [
  { id: "correlation",    icon: "⬡", title: "Correlation Analysis",   subtitle: "Pearson · Spearman · Kendall",   desc: "Explore relationships between plant traits with correlation matrices, heatmaps and scatter plots.", status: "ready",  color: "#0072B2" },
  { 
    id:       "two-var-correlation",
    icon:     "◈",
    title:    "Two-Variable Correlation",
    subtitle: "Scatter · Regression · Pearson r",
    desc:     "Explore the relationship between any two numeric traits with scatter plot, linear regression line, R², p-value, and 95% CI band.",
    status:   "ready",
    color:    "#E69F00"
  },
  { id: "anova",          icon: "◈", title: "ANOVA Suite",            subtitle: "One-way · Two-way · Three-way",  desc: "Compare means across treatment groups with post-hoc tests — Tukey, Duncan, LSD.",               status: "ready",   color: "#E69F00" },
  { id: "pca",            icon: "◎", title: "Principle Component Analysis(PCA)",     subtitle: "PCA · Cluster · Discriminant",   desc: "Reduce dimensionality and uncover hidden structure in multi-trait phenotypic data.",            status: "ready",   color: "#009E73" },
  { id:"regression", icon:"◬", title:"Regression", subtitle:"Simple · Multiple · Stepwise",
  desc:"Model trait relationships with full coefficient tables, ANOVA, R², and diagnostic plots.",
  status:"ready", color:"#CC79A7" },
  { id: "nonparametric",  icon: "◇", title: "Non-parametric Tests",   subtitle: "Kruskal-Wallis · Mann-Whitney", desc: "Robust statistical tests for non-normal distributions and small sample sizes.",                 status: "soon",   color: "#D55E00" },
  { id: "descriptive",    icon: "▣", title: "Descriptive Statistics", subtitle: "Mean · SD · CV · Normality",    desc: "Summarize datasets with comprehensive descriptive stats and normality diagnostics.",             status: "soon",   color: "#56B4E9" },
];

const PLANTSCIENCE_MODULES = [
  { id: "peg-calculator", icon: "◌",title:    "PEG Calculator",subtitle: "PEG 6000 · PEG 8000 · Ψ ↔ g/L",desc:     "Calculate PEG 6000/8000 concentration for a target water potential, or find achieved Ψ from concentration. Forward and reverse modes.",status:   "ready",  color:    "#2D9E5F"},
 {
  id:       "seed-germination",
  icon:     "🌱",
  title:    "Seed Germination Analysis",
  subtitle: "Kinetics · Vigour · Stress Tolerance",
  desc:     "Compute 16 germination indices including Timson, ERI and Weibull T50, plus 14 seedling metrics with STI, dry weight and vigor scoring.",
  status:   "ready",
  color:    "#2D9E5F"
},
  { id: "iari_weather",     icon: "✦", title: "IARI-Weather Data",      subtitle: "Weather Data · ICAR-IARI",      desc: "An automated dashboard that scrapes, archives, and visualises daily meteorological data from ICAR–IARI, New Delhi", status: "ready", color: "#2D9E5F", url: "https://rameshram96.github.io/iari_weather_data/" },
  { id: "hydro-calc",     icon: "◌", title: "Hydroponic Calculator",  subtitle: "Nutrient · Ion Balance",        desc: "Compute nutrient solution recipes with ionic compensation across N-source arms.",                  status: "soon",  color: "#4A9E6E" },
];

const BIOINFORMATICS_MODULES = [
  { id: "ptg-primer",     icon: "✦", title: "PTGprimerDesigner",      subtitle: "Golden Gate · PTG-CRISPR",      desc: "Design Golden Gate assembly primers for PTG-CRISPR constructs following the Xie et al. framework.", status: "ready", color: "#2D9E5F", url: "https://rameshram96.github.io/PTGprimerDesigner" },
  { id: "biosafe",        icon: "◉", title: "BioSafe Primer",         subtitle: "Overlapping PCR Design",        desc: "Design overlapping PCR primers for CRISPR validation with automated specificity checks.",         status: "ready", color: "#1B7A4A", url: "https://rameshram96.github.io/BioSafe-Primer" },
  { id: "haplo",          icon: "◑", title: "Haplotype Viewer",       subtitle: "SNP · Association · 3K Panel",  desc: "Visualize haplotype-phenotype associations from SNP data, with subpopulation filtering.",         status: "soon",  color: "#5B3FA6" },
  { id: "variant",        icon: "⬟", title: "Variant Annotator",      subtitle: "VCF · Effect · Gene Model",     desc: "Annotate plant genome variants with functional effect predictions and gene context.",            status: "soon",  color: "#7B5EA7" },
];

const BLOG_POSTS = [
  // Hardcode posts here; swap for API fetch later
  // { id: 1, title: "...", date: "2025-05-01", category: "Tutorial", summary: "..." }
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ icon, title, desc, id }) {
  return (
    <div id={id} style={{ marginBottom: "1.5rem", paddingTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1C1C1C", letterSpacing: "-0.01em" }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #E0E0E0, transparent)", marginLeft: "0.5rem" }} />
      </div>
      <p style={{ margin: 0, fontSize: "0.74rem", color: "#999", fontWeight: 400, paddingLeft: "1.6rem" }}>{desc}</p>
    </div>
  );
}

function ModuleCard({ mod, navigate }) {
  const [hovered, setHovered] = useState(false);
  const isReady  = mod.status === "ready";
  const isActive = hovered && isReady;

  const handleClick = () => {
    if (!isReady) return;
    if (mod.url) { window.open(mod.url, "_blank"); return; }
    navigate(`/${mod.id}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    "#fff",
        borderRadius:  12,
        padding:       "1.15rem 1.2rem",
        border:        `1.5px solid ${isActive ? mod.color : "#EBEBEB"}`,
        cursor:        isReady ? "pointer" : "default",
        position:      "relative",
        boxShadow:     isActive ? `0 6px 20px rgba(0,0,0,0.08)` : "0 1px 3px rgba(0,0,0,0.04)",
        transition:    "all 0.18s ease",
        opacity:       isReady ? 1 : 0.72,
      }}
    >
      {/* Left accent */}
      <div style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 3, borderRadius: "0 3px 3px 0", background: isReady ? mod.color : "#DEDEDE" }} />

      {/* Status badge */}
      <div style={{ position: "absolute", top: 12, right: 12, padding: "0.15rem 0.48rem", borderRadius: 999, background: isReady ? "#EAF5EA" : "#F4F4F4", color: isReady ? "#2D9E5F" : "#AAAAAA", fontSize: "0.58rem", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1.1, border: `1px solid ${isReady ? "#B2DDB2" : "#E5E5E5"}` }}>
        {isReady ? "● Live" : "Soon"}
      </div>

      <div style={{ fontSize: "1.3rem", marginBottom: "0.55rem", color: isReady ? mod.color : "#C8C8C8" }}>{mod.icon}</div>
      <h3 style={{ margin: "0 0 0.15rem", fontSize: "0.88rem", fontWeight: 700, color: "#1C1C1C" }}>{mod.title}</h3>
      <p style={{ margin: "0 0 0.55rem", fontSize: "0.64rem", color: isReady ? mod.color : "#AAAAAA", fontFamily: "'DM Mono', monospace" }}>{mod.subtitle}</p>
      <p style={{ margin: 0, fontSize: "0.74rem", lineHeight: 1.65, color: "#777", fontWeight: 300 }}>{mod.desc}</p>
      {isReady && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.68rem", color: mod.color, fontWeight: 600, opacity: isActive ? 1 : 0, transition: "opacity 0.18s", fontFamily: "'DM Mono', monospace" }}>
          {mod.url ? "Open tool ↗" : "Open module →"}
        </div>
      )}
    </div>
  );
}

function BlogCard({ post }) {
  const CATEGORY_COLORS = { Tutorial: "#0072B2", Methods: "#009E73", "Research Note": "#E69F00", Update: "#CC79A7" };
  const col = CATEGORY_COLORS[post.category] || "#888";
  return (
    <div style={{ background: "#fff", borderRadius: 11, padding: "1rem 1.15rem", border: "1.5px solid #EBEBEB", cursor: "pointer", transition: "box-shadow 0.18s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem" }}>
        <span style={{ padding: "0.12rem 0.5rem", borderRadius: 999, background: col + "18", color: col, fontSize: "0.6rem", fontWeight: 600, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>{post.category}</span>
        <span style={{ color: "#CCC", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace" }}>{post.date}</span>
      </div>
      <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", fontWeight: 700, color: "#1C1C1C", lineHeight: 1.35 }}>{post.title}</h4>
      <p style={{ margin: 0, fontSize: "0.72rem", color: "#888", lineHeight: 1.6, fontWeight: 300 }}>{post.summary}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate  = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  const fade = (delay = 0) => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
  });

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <div style={{ background: "#1C1C1C", padding: "0 2.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: 16 }}>🌿</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "-0.01em" }}>OpenBiology.in</span>
        </div>

        {/* Section nav */}
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          {NAV_SECTIONS.map(s => (
            <button key={s.id}
              onClick={() =>["blog", "about", "feedback"].includes(s.id)? navigate(`/${s.id}`): scrollTo(s.id)}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.65)", fontSize: "0.74rem", fontWeight: 500, cursor: "pointer", padding: "0.3rem 0.65rem", borderRadius: 6, transition: "color 0.15s, background 0.15s", fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={e => { e.target.style.color = "#fff"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.65)"; e.target.style.background = "transparent"; }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <button onClick={() => navigate("/portfolio")}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.75)", borderRadius: 7, padding: "0.25rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontWeight: 500 }}>
            Developer Info
          </button>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem", fontFamily: "'DM Mono'" }}>v1.0</span>
        </div>
      </div>
        <NoticeBar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.75rem 2rem 3.5rem" }}>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div style={{ ...fade(0), textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-block", background: "#E8F4FD", border: "1px solid #56B4E9", borderRadius: 999, padding: "0.25rem 1rem", marginBottom: "1rem" }}>
            <span style={{ color: "#0072B2", fontSize: "0.67rem", fontFamily: "'DM Mono'", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Statistics · Plant Science · Bioinformatics
            </span>
          </div>
          <h1 style={{ margin: "0 0 0.8rem", fontSize: "clamp(1.8rem,3.8vw,2.8rem)", fontWeight: 700, color: "#1C1C1C", lineHeight: 1.1, letterSpacing: "-0.025em" }}>
            Open Tools for Plant Science Research Community
          </h1>
          <p style={{ color: "#777", fontSize: "0.9rem", maxWidth: 480, margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>
            A free platform for data analysis, plant science utilities, and bioinformatics — built by a researcher, for researchers.
          </p>
        </div>
           <div style={fade(0.06)}>
             <SponsorBanner />
          </div>
        {/* ── Data Analysis ──────────────────────────────────────────────── */}
        <div style={fade(0.08)} id="analysis">
          <SectionHeading
            id="analysis-heading"
            icon="📊"
            title="Data Analysis Tools"
            desc="Statistical workflows for phenotypic data — correlation, ANOVA, PCA, regression and more."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "0.85rem", marginBottom: "3rem" }}>
            {ANALYSIS_MODULES.map(mod => <ModuleCard key={mod.id} mod={mod} navigate={navigate} />)}
          </div>
        </div>

        {/* ── Plant Science ──────────────────────────────────────────────── */}
        <div style={fade(0.13)} id="plant-science">
          <SectionHeading
            id="plant-science-heading"
            icon="🌾"
            title="Tools for Plant Science Research"
            desc="Domain-specific utilities for CRISPR design, primer generation, and hydroponic management."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "0.85rem", marginBottom: "3rem" }}>
            {PLANTSCIENCE_MODULES.map(mod => <ModuleCard key={mod.id} mod={mod} navigate={navigate} />)}
          </div>
        </div>

        {/* ── Bioinformatics ─────────────────────────────────────────────── */}
        <div style={fade(0.18)} id="bioinformatics">
          <SectionHeading
            id="bioinformatics-heading"
            icon="🧬"
            title="Bioinformatics Tools"
            desc="Sequence and genome-level tools — haplotype analysis, variant annotation, and population genomics."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "0.85rem", marginBottom: "3rem" }}>
            {BIOINFORMATICS_MODULES.map(mod => <ModuleCard key={mod.id} mod={mod} navigate={navigate} />)}
            {/* Placeholder when section is sparse */}
            <div style={{ background: "#FAFAFA", borderRadius: 12, padding: "1.15rem 1.2rem", border: "1.5px dashed #E0E0E0", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: 120, gap: "0.4rem" }}>
              <span style={{ fontSize: "1.2rem" }}>＋</span>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "#BBBBBB", fontWeight: 400 }}>More tools in development</p>
            </div>
          </div>
        </div>

        {/* ── Knowledge Hub — single unified card ────────────────────────── */}
<div style={fade(0.22)} id="blog">
  <div style={{
    background: "#fff",
    borderRadius: 16,
    border: "1.5px solid #EBEBEB",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
    marginBottom: "2rem",
  }}>

    {/* ── Card header ─────────────────────────────────────────────── */}
    <div style={{
      padding: "1.1rem 1.35rem 0.9rem",
      borderBottom: "1.5px solid #F0F0F0",
    }}>

      {/* Title row */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        marginBottom: "0.7rem",
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#1C1C1C",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}>
            📚 Knowledge Hub
          </h2>
          <p style={{
            margin: "0.2rem 0 0",
            fontSize: "0.72rem",
            color: "#999",
            fontWeight: 300,
          }}>
            Methods, tutorials, and research summaries
          </p>
        </div>

        {/* View all button */}
        <button
          onClick={() => navigate("/blog")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.85rem",
            borderRadius: 8,
            border: "1.5px solid #2D9E5F",
            background: "#EAF8F0",
            color: "#2D9E5F",
            fontSize: "0.7rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#2D9E5F";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#EAF8F0";
            e.currentTarget.style.color = "#2D9E5F";
          }}
        >
          Browse all →
        </button>
      </div>

      {/* Tag chips */}
      <div style={{
        display: "flex",
        gap: "0.32rem",
        flexWrap: "wrap",
      }}>
        {["CRISPR", "Statistics", "Plant Science", "Genomics", "Tutorial"].map(tag => (
          <span
            key={tag}
            onClick={() => navigate("/blog")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.18rem 0.58rem",
              borderRadius: 999,
              background: "#EAF3DE",
              border: "1px solid #C0DD97",
              color: "#3B6D11",
              fontSize: "0.6rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 0.4,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#C0DD97"}
            onMouseLeave={e => e.currentTarget.style.background = "#EAF3DE"}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>

    {/* ── Card body ────────────────────────────────────────────────── */}
    <div style={{ padding: "1.1rem 1.35rem 1.35rem" }}>

      {BLOG_POSTS.length === 0 ? (

        /* Empty state */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          textAlign: "center",
          gap: "0.65rem",
        }}>
          <span style={{ fontSize: "2rem", opacity: 0.18 }}>📝</span>
          <p style={{
            margin: 0,
            fontSize: "0.78rem",
            color: "#CCCCCC",
            fontWeight: 500,
          }}>
            Articles and tutorials coming soon
          </p>
          <button
            onClick={() => navigate("/blog")}
            style={{
              marginTop: "0.35rem",
              padding: "0.6rem 1.75rem",
              background: "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
              boxShadow: "0 2px 10px rgba(26,58,26,0.22)",
              transition: "opacity 0.15s",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Go to Knowledge Hub →
          </button>
        </div>

      ) : (

        /* Blog post grid */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
          gap: "0.85rem",
        }}>
          {BLOG_POSTS.slice(0, 3).map(post => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

      )}

    </div>
  </div>
</div>


        {/* ── Developer + Support Banner ─────────────────────────────────── */}
<div style={{
  ...fade(0.26),
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #EBEBEB",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  padding: "1.5rem",
  display: "flex",
  gap: "1.25rem",
  alignItems: "stretch",
  flexWrap: "wrap",
  marginBottom: "2rem",
}}>

  {/* ── Left: two developer cards stacked ──────────────────────── */}
  <div style={{
    flex: "1 1 300px",
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
  }}>

    {/* Developer 1 — Ramesh R */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1.1rem",
      background: "#FAFAFA",
      borderRadius: 12,
      border: "1px solid #F0F0F0",
      padding: "0.9rem 1rem",
    }}>
      <img
        src="https://rameshram96.github.io/Ramesh-Ramasamy/profile.jpg"
        alt="Ramesh R"
        style={{
          width: 52, height: 52, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          border: "2.5px solid #E8F4FD",
          boxShadow: "0 2px 8px rgba(0,114,178,0.12)",
        }}
      />
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: "0 0 0.12rem", fontSize: "0.88rem",
                     fontWeight: 700, color: "#1C1C1C" }}>
          Ramesh R
        </h3>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.68rem",
                    color: "#0072B2", fontWeight: 500 }}>
          Plant Physiologist · Genome editor · IARI New Delhi
        </p>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {[
            { label: "GitHub",       url: "https://github.com/rameshram96",                               color: "#1C1C1C" },
            { label: "ResearchGate", url: "https://www.researchgate.net/profile/Ramesh-R-8",              color: "#00CCBB" },
            { label: "Scholar",      url: "https://scholar.google.com/citations?user=pRR3FhsAAAAJ&hl=en", color: "#4285F4" },
            { label: "Portfolio",    url: "/portfolio",                                                    color: "#0072B2" },
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target={link.url.startsWith("/") ? undefined : "_blank"}
              rel="noreferrer"
              onClick={link.url.startsWith("/")
                ? (e) => { e.preventDefault(); navigate(link.url); }
                : undefined}
              style={{
                padding: "0.18rem 0.5rem", borderRadius: 6,
                border: `1px solid ${link.color}22`,
                background: `${link.color}0d`,
                color: link.color, fontSize: "0.62rem",
                fontWeight: 600, textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>

    {/* Developer 2 — Placeholder */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1.1rem",
      background: "#FAFAFA",
      borderRadius: 12,
      border: "1px solid #F0F0F0",
      padding: "0.9rem 1rem",
    }}>
      {/* Replace src with actual photo URL when available */}
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "#fff", fontWeight: 700, fontSize: "1.1rem",
        border: "2.5px solid #E8F4ED",
        boxShadow: "0 2px 8px rgba(45,106,45,0.12)",
      }}>
        {/* Replace with <img> once photo is available */}
        ?
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: "0 0 0.12rem", fontSize: "0.88rem",
                     fontWeight: 700, color: "#1C1C1C" }}>
          Mathiyarasi K
        </h3>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.68rem",
                    color: "#009E73", fontWeight: 500 }}>
          PhD Scholar·Environmental Science · ICAR-IARI 
        </p>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {[
            { label: "GitHub",    url: "#", color: "#1C1C1C" }, {/* ← Replace # with actual URLs */}
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "0.18rem 0.5rem", borderRadius: 6,
                border: `1px solid ${link.color}22`,
                background: `${link.color}0d`,
                color: link.color, fontSize: "0.62rem",
                fontWeight: 600, textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>

  </div>

  {/* ── Divider ─────────────────────────────────────────────────── */}
  <div style={{
    width: 1,
    alignSelf: "stretch",
    background: "#EBEBEB",
    flexShrink: 0,
  }} />

  {/* ── Right: Support card ─────────────────────────────────────── */}
  <div style={{
    flex: "1 1 260px",
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  }}>
    <div style={{
      border: "1.5px dashed #D0E8FF",
      borderRadius: 10,
      padding: "0.5rem",
      background: "#F8FBFF",
      flexShrink: 0,
    }}>
      <img
        src="/upi-qr.png"
        alt="UPI QR"
        onError={e => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
        style={{ width: 72, height: 72, borderRadius: 6, display: "block" }}
      />
      <div style={{
        display: "none", width: 72, height: 72,
        alignItems: "center", justifyContent: "center", fontSize: 22,
      }}>
        📱
      </div>
    </div>
    <div>
      <h4 style={{ margin: "0 0 0.3rem", fontSize: "0.85rem",
                   fontWeight: 700, color: "#1C1C1C" }}>
        Support OpenBiology 🌱
      </h4>
      <p style={{
        margin: 0, fontSize: "0.72rem", color: "#777",
        lineHeight: 1.65, fontWeight: 300, maxWidth: 240,
      }}>
        Openbiology.in is free for everyone. If it's been useful in your
        research, any support — however small — helps keep it running.{" "}
        <em style={{ color: "#009E73" }}>No obligation at all.</em>
      </p>
      <p style={{
        margin: "0.45rem 0 0", fontSize: "0.65rem",
        color: "#0072B2", fontWeight: 600,
        fontFamily: "'DM Mono'",
      }}>
        Scan QR · UPI supported
      </p>
    </div>
  </div>

</div>


        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
  ...fade(0.3),
  borderTop: "1px solid #EBEBEB",
  paddingTop: "1.75rem",
  marginTop: "0.5rem",
}}>
  {/* Footer links row */}
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.25rem",
    flexWrap: "wrap",
    marginBottom: "0.85rem",
  }}>
    {[
      { label: "About",          path: "/about"    },
      { label: "Privacy Policy", path: "/about#privacy"    },
      { label: "Disclaimer",     path: "/about#disclaimer" },
      { label: "Feedback",       path: "/feedback" },
      { label: "Blog",           path: "/blog"     },
      { label: "Portfolio",      path: "/portfolio"},
    ].map((link, i, arr) => (
      <span key={link.path} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <button
          onClick={() => navigate(link.path)}
          style={{
            background: "transparent", border: "none",
            color: "#AAAAAA", fontSize: "0.68rem",
            cursor: "pointer", padding: "0.1rem 0.25rem",
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#555"}
          onMouseLeave={e => e.currentTarget.style.color = "#AAAAAA"}
        >
          {link.label}
        </button>
        {i < arr.length - 1 && (
          <span style={{ color: "#E0E0E0", fontSize: "0.65rem" }}>·</span>
        )}
      </span>
    ))}
  </div>
    
  {/* Copyright line */}
  <div style={{
    textAlign: "center",
    color: "#CCCCCC",
    fontSize: "0.62rem",
    fontFamily: "'DM Mono'",
    letterSpacing: 1.2,
   }}>
    OPENBIOLOGY.IN · FREE & OPEN SOURCE · PLANT SCIENCE DATA ANALYSIS SUITE
  </div>
  {/* ADD THIS ↓ */}
      <div style={fade(0.05)}>
      <VisitorBadge />
      </div>
</div>
      </div>
    </div>
  );
}
