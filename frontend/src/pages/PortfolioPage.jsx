import { useNavigate } from "react-router-dom";

const Section = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #EEEEEE", marginBottom: "1.25rem" }}>
    <h2 style={{ margin: "0 0 1.1rem", fontSize: "1rem", fontWeight: 700, color: "#1C1C1C", borderBottom: "2px solid #E8F4FD", paddingBottom: "0.6rem" }}>{title}</h2>
    {children}
  </div>
);

const Tag = ({ label, color = "#0072B2" }) => (
  <span style={{ display: "inline-block", padding: "0.22rem 0.65rem", borderRadius: 999, background: `${color}15`, color, fontSize: "0.72rem", fontWeight: 600, margin: "0.2rem", border: `1px solid ${color}30` }}>{label}</span>
);

const publications = [
  { authors: "Bhupenchandra I, Chongtham SK, Devi EL, Ramesh R, et al.", year: 2022, title: "Role of biostimulants in mitigating the effects of climate change on crop performance.", journal: "Frontiers in Plant Science", detail: "967665" },
  { authors: "Barman D, Kumar R, Ghimire OP, Ramesh R, et al.", year: 2024, title: "Melatonin induces acclimation to heat stress and pollen viability by enhancing antioxidative defense in rice (Oryza sativa L.).", journal: "Environmental and Experimental Botany", detail: "220, 105693" },
  { authors: "Boopal J, Sathee L, Ramasamy R, Pandey R, Chinnasamy V.", year: 2023, title: "Influence of incremental short-term salt stress at the seedling stage on root plasticity, shoot thermal profile and ion homeostasis in contrasting wheat genotypes.", journal: "Agriculture", detail: "13(10), 1946" },
  { authors: "Majumdar S, Ramesh R, et al.", year: 2025, title: "Deciphering the Role of Silicon in Mitigation of Arsenic Toxicity in Soil–Plant Interface — An Overview.", journal: "Silicon", detail: "1–29" },
  { authors: "Kathirvelu D, Singh B, Ramasamy R, Krishna H, Vishwakarma C.", year: 2025, title: "Association of seedling root traits with field-level drought tolerance in wheat (Triticum aestivum).", journal: "Plant Physiology Reports", detail: "30(3), 569–581" },
];

const awards = [
  { title: "Joint CSIR–UGC NET – JRF (Life Sciences)", org: "CSIR, 2025", detail: "All India Rank: 79" },
  { title: "ASRB–NET (Plant Physiology)", org: "Agricultural Scientists Recruitment Board, 2025", detail: "" },
  { title: "ICAR JRF/SRF Fellowship", org: "Indian Council of Agricultural Research, 2022", detail: "" },
  { title: "ICAR–NTS (PG) Fellowship", org: "Indian Council of Agricultural Research, 2019", detail: "" },
  { title: "Best Poster Award", org: "National Conference of Plant Physiology, 2023", detail: "Indian Society for Plant Physiology" },
];

const education = [
  { degree: "Ph.D. in Plant Physiology", status: "Expected 2026", institute: "ICAR–Indian Agricultural Research Institute (IARI), New Delhi", division: "Division of Plant Physiology", detail: "CGPA: 85.1% | Enrolled: 2021" },
  { degree: "M.Sc. (Agriculture) – Crop Physiology", status: "2021", institute: "College of Agriculture, Assam Agricultural University, Jorhat", division: "", detail: "First Class with Distinction | 86.3%" },
  { degree: "B.Sc. (Agriculture)", status: "2018", institute: "TRIARD, Perambalur, Tamil Nadu Agricultural University", division: "", detail: "First Class | 81.4%" },
];

const competencies = [
  { icon: "🧬", title: "Genome Editing",       desc: "CRISPR/Cas & Molecular Breeding" },
  { icon: "🌱", title: "Plant Physiology",     desc: "Stress Resilience & Adaptation" },
  { icon: "💻", title: "Bioinformatics",       desc: "Promoter & Sequence Analysis" },
  { icon: "📊", title: "R Programming",        desc: "Package Development & Shiny Apps" },
  { icon: "📝", title: "Scientific Writing",   desc: "Research Communication" },
  { icon: "🔬", title: "Experimental Design",  desc: "Statistical Analysis & Visualization" },
];

const skills = ["CRISPR/Cas9","R Programming","Python","Bioinformatics","Statistical Analysis","Sequence Analysis","Motif Scanning","Shiny Apps","Package Development","Data Visualization","Experimental Design","Molecular Biology"];
const skillColors = ["#0072B2","#E69F00","#009E73","#CC79A7","#D55E00","#56B4E9","#0072B2","#E69F00","#009E73","#CC79A7","#D55E00","#56B4E9"];

export default function PortfolioPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <div style={{ background: "#1C1C1C", padding: "0 2.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 7, padding: "0.3rem 0.85rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>← Home</button>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>🌿 OpenBiology · Portfolio</span>
        </div>
        <a href="https://rameshram96.github.io/Ramesh-Ramasamy/" target="_blank" rel="noreferrer"
          style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontFamily: "'DM Mono'", textDecoration: "none" }}>
          Full Site ↗
        </a>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 2rem" }}>

        {/* Hero */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #EEEEEE", marginBottom: "1.25rem", display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
          <img src="https://rameshram96.github.io/Ramesh-Ramasamy/profile.jpg" alt="Ramesh R"
            style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid #E8F4FD", boxShadow: "0 2px 16px rgba(0,114,178,0.15)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "#1C1C1C" }}>Ramesh R</h1>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#0072B2", fontWeight: 500 }}>
              Plant Physiologist · CRISPR Genome Editor · Bioinformatics Developer
            </p>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.75rem", color: "#666" }}>📍 New Delhi, India</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[
                { label: "GitHub",       url: "https://github.com/rameshram96",                               color: "#1C1C1C" },
                { label: "ResearchGate", url: "https://www.researchgate.net/profile/Ramesh-R-8",              color: "#00CCBB" },
                { label: "Google Scholar", url: "https://scholar.google.com/citations?user=pRR3FhsAAAAJ",    color: "#4285F4" },
                { label: "Email",        url: "mailto:crisprramesh@gmail.com",                                color: "#E69F00" },
                { label: "Projects",     url: "https://rameshram96.github.io/Ramesh-Ramasamy/projects.html", color: "#009E73" },
              ].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                  style={{ padding: "0.28rem 0.7rem", borderRadius: 7, border: `1px solid ${l.color}`, color: l.color, fontSize: "0.7rem", fontWeight: 600, textDecoration: "none" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <Section title="📋 Professional Summary">
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#555", lineHeight: 1.8, fontWeight: 300 }}>
            Plant Physiologist and agricultural researcher pursuing PhD in Plant Physiology, specializing in genome editing in rice using CRISPR/Cas technology. Expertise spans plant stress physiology, bioinformatics, and quantitative data analysis. Demonstrated proficiency in developing statistical and bioinformatics software using R and Python, with comprehensive research experience in plant molecular biology, genetic transformation, CRISPR-based crop improvement, and abiotic stress mitigation.
          </p>
        </Section>

        {/* Competencies */}
        <Section title="⚡ Core Competencies">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
            {competencies.map((c, i) => (
              <div key={i} style={{ background: "#F8FBFF", borderRadius: 10, padding: "0.9rem 1rem", border: "1px solid #E8F4FD" }}>
                <div style={{ fontSize: 22, marginBottom: "0.35rem" }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1C1C1C", marginBottom: "0.15rem" }}>{c.title}</div>
                <div style={{ fontSize: "0.72rem", color: "#888" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Experience */}
        <Section title="🔬 Research & Technical Experience">
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {[
              "Conducting genome editing research in rice to enhance yield and stress resilience using CRISPR/Cas technology",
              "Developed bioinformatics software for promoter extraction and transcription factor motif discovery",
              "Created visvaR R package incorporating ANOVA workflows, correlation modules, and automated Word/Excel report generation",
              "Developed PlantPhysioR R package for calculating stress indices in plant physiology research",
              "Expert in agricultural experimental design, statistical analysis, and data visualization",
            ].map((item, i) => (
              <li key={i} style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.75, marginBottom: "0.35rem", fontWeight: 300 }}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* Education */}
        <Section title="🎓 Education">
          {education.map((e, i) => (
            <div key={i} style={{ borderLeft: "3px solid #0072B2", paddingLeft: "1rem", marginBottom: i < education.length - 1 ? "1.1rem" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.25rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1C1C1C" }}>{e.degree}</span>
                <span style={{ fontSize: "0.72rem", color: "#0072B2", fontFamily: "'DM Mono'", fontWeight: 600 }}>{e.status}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#555", marginTop: "0.2rem" }}>{e.institute}</div>
              {e.division && <div style={{ fontSize: "0.73rem", color: "#888", marginTop: "0.1rem" }}>{e.division}</div>}
              <div style={{ fontSize: "0.72rem", color: "#009E73", marginTop: "0.2rem", fontWeight: 500 }}>{e.detail}</div>
            </div>
          ))}
        </Section>

        {/* Awards */}
        <Section title="🏆 Awards & Recognitions">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {awards.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#FFFDF0", borderRadius: 10, padding: "0.75rem 1rem", border: "1px solid #F5E6B0" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🏅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1C1C1C" }}>{a.title}</div>
                  <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.15rem" }}>{a.org}{a.detail ? ` · ${a.detail}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Publications */}
        <Section title="📄 Selected Publications">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {publications.map((pub, i) => (
              <div key={i} style={{ borderLeft: "3px solid #56B4E9", paddingLeft: "1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "#0072B2", fontFamily: "'DM Mono'", fontWeight: 600, marginBottom: "0.2rem" }}>{pub.year}</div>
                <div style={{ fontSize: "0.82rem", color: "#1C1C1C", fontWeight: 600, lineHeight: 1.5, marginBottom: "0.2rem" }}>{pub.title}</div>
                <div style={{ fontSize: "0.73rem", color: "#888" }}>{pub.authors}</div>
                <div style={{ fontSize: "0.72rem", color: "#009E73", fontStyle: "italic", marginTop: "0.15rem" }}>{pub.journal}, {pub.detail}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Skills */}
        <Section title="🛠 Technical Skills">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {skills.map((s, i) => <Tag key={i} label={s} color={skillColors[i % skillColors.length]} />)}
          </div>
        </Section>

        {/* Languages */}
        <Section title="🌐 Languages">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[{ lang: "English", level: "Fluent" }, { lang: "Tamil", level: "Native" }, { lang: "Hindi", level: "Conversational" }].map((l, i) => (
              <div key={i} style={{ background: "#F8FBFF", borderRadius: 10, padding: "0.65rem 1.1rem", border: "1px solid #E8F4FD", textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1C1C1C" }}>{l.lang}</div>
                <div style={{ fontSize: "0.7rem", color: "#0072B2", marginTop: 2 }}>{l.level}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div style={{ textAlign: "center", color: "#CCCCCC", fontSize: "0.67rem", fontFamily: "'DM Mono'", letterSpacing: 1.2, marginTop: "1.5rem" }}>
          OPENBIOLOGY · PLANT SCIENCE DATA ANALYSIS SUITE · FREE & OPEN SOURCE
        </div>
      </div>
    </div>
  );
}
