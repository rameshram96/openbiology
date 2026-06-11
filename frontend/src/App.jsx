import { Routes, Route, useNavigate } from "react-router-dom";
import HomePage          from "./components/HomePage";
import CorrelationModule from "./modules/correlation/CorrelationModule";
import TwoVarCorrelation   from "./modules/two_var_correlation/TwoVarCorrelation";
import PCAModule from "./modules/pca/PCAModule";
import PEGCalculator from "./modules/peg_calculator/PEGCalculator";
import PortfolioPage     from "./pages/PortfolioPage";
import RegressionModule from "./modules/regression/RegressionModule";
import BlogPage          from "./modules/blog/BlogPage";
import BlogArticle       from "./modules/blog/BlogArticle";
import SeedGerminationModule from "./modules/seed_germination/SeedGerminationModule";
import AboutPage         from "./pages/AboutPage";
import FeedbackPage      from "./modules/feedback/FeedbackPage";
import AnovaModule from "./modules/anova/AnovaModule";
// import AnovaModule    from "./modules/anova/AnovaModule";

const TopBar = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      background: "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
      padding: "0 2rem", height: 52,
      display: "flex", alignItems: "center", gap: "1rem",
      boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
    }}>
      <button onClick={() => navigate("/")} style={{
        background: "rgba(255,255,255,0.12)", border: "none",
        color: "#fff", borderRadius: 8, padding: "0.35rem 0.9rem",
        cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
      }}>← Home</button>
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
        🌿 OpenBiology
      </span>

      {/* Right-side nav links */}
      <div style={{ marginLeft: "auto", display: "flex", gap: "0.25rem" }}>
        {[
          { label: "Blog",     path: "/blog"     },
          { label: "Feedback", path: "/feedback" },
          { label: "About",    path: "/about"    },
        ].map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.65)", borderRadius: 8,
              padding: "0.35rem 0.9rem", cursor: "pointer",
              fontSize: "0.82rem", fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ModulePage = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "#f0f4f0" }}>
    <TopBar />
    <main>{children}</main>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/"             element={<HomePage />} />
      <Route path="/correlation"  element={<ModulePage><CorrelationModule /></ModulePage>} />
      <Route path="/two-var-correlation" element={<ModulePage><TwoVarCorrelation /></ModulePage>} />
      <Route path="/pca" element={<ModulePage><PCAModule /></ModulePage>} />
      <Route path="/regression" element={<ModulePage><RegressionModule /></ModulePage>} />
      <Route path="/peg-calculator" element={<ModulePage><PEGCalculator /></ModulePage>} />
      <Route path="/portfolio"    element={<PortfolioPage />} />
      <Route path="/blog"         element={<BlogPage />} />
      <Route path="/blog/:slug"   element={<BlogArticle />} />
      <Route path="/seed-germination" element={<ModulePage><SeedGerminationModule /></ModulePage>} />
      <Route path="/feedback"     element={<ModulePage><FeedbackPage /></ModulePage>} />
      <Route path="/about"        element={<AboutPage />} />
      <Route path="/anova" element={<ModulePage><AnovaModule /></ModulePage>} />
      {/* <Route path="/anova" element={<ModulePage><AnovaModule /></ModulePage>} /> */}
    </Routes>
  );
}
