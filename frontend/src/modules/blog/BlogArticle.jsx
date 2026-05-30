/**
 * BlogArticle.jsx
 * Route: /blog/:slug
 * Renders a single article using its slug to look up the component.
 */

import { useParams, useNavigate } from "react-router-dom";
import { getArticleBySlug }       from "./useArticles";
import AuthorCard                 from "./components/AuthorCard";

const GREEN_GRAD = "linear-gradient(135deg, #1a3a1a, #2d6a2d)";

const TAG_COLORS = {
  Tutorial:         "#0072B2",
  Methods:          "#009E73",
  "Research Note":  "#E69F00",
  Review:           "#CC79A7",
  Update:           "#56B4E9",
  CRISPR:           "#1a3a1a",
  Genomics:         "#5B3FA6",
  "Plant Science":  "#2D9E5F",
  Statistics:       "#D55E00",
};
function tagColor(tag) { return TAG_COLORS[tag] || "#737373"; }

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

export default function BlogArticle() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const article    = getArticleBySlug(slug);

  if (!article) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f0",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Sans',sans-serif" }}>
        <p style={{ fontSize: "1rem", color: "#AAAAAA", fontWeight: 600 }}>
          Article not found
        </p>
        <button onClick={() => navigate("/blog")} style={{
          marginTop: "1rem", padding: "0.5rem 1.2rem",
          background: GREEN_GRAD, border: "none", borderRadius: 9,
          color: "#fff", fontSize: "0.82rem", fontWeight: 600,
          cursor: "pointer",
        }}>
          ← Back to Blog
        </button>
      </div>
    );
  }

  const { metadata, Component } = article;
  const { title, date, tags = [], author } = metadata;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f0",
                  fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── Article header ────────────────────────────────────────── */}
      <div style={{ background: GREEN_GRAD, padding: "2rem 2rem 1.75rem",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {/* Back button */}
          <button onClick={() => navigate("/blog")} style={{
            background:   "rgba(255,255,255,0.12)",
            border:       "none",
            color:        "rgba(255,255,255,0.85)",
            borderRadius: 8,
            padding:      "0.3rem 0.85rem",
            fontSize:     "0.75rem",
            fontWeight:   600,
            cursor:       "pointer",
            marginBottom: "1.1rem",
            fontFamily:   "'DM Sans',sans-serif",
          }}>
            ← Back to Blog
          </button>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap",
                          gap: "0.35rem", marginBottom: "0.75rem" }}>
              {tags.map((tag) => (
                <span key={tag} style={{
                  padding:      "0.15rem 0.55rem",
                  borderRadius: 999,
                  background:   "rgba(255,255,255,0.15)",
                  color:        "#fff",
                  fontSize:     "0.62rem",
                  fontWeight:   600,
                  fontFamily:   "'DM Mono',monospace",
                  textTransform:"uppercase",
                  letterSpacing: 0.9,
                  border:       "1px solid rgba(255,255,255,0.25)",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 style={{ margin: "0 0 0.5rem", color: "#fff",
                       fontSize: "clamp(1.3rem,3vw,1.9rem)",
                       fontWeight: 700, lineHeight: 1.2,
                       letterSpacing: "-0.02em" }}>
            {title}
          </h1>

          {/* Date */}
          <p style={{ margin: 0, color: "rgba(255,255,255,0.55)",
                      fontSize: "0.75rem", fontFamily: "'DM Mono'" }}>
            {formatDate(date)}
          </p>
        </div>
      </div>

      {/* ── Article body ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 780, margin: "0 auto",
                    padding: "2rem 1.5rem 4rem" }}>

        {/* Article content */}
        <div style={{
          background:   "#fff",
          borderRadius: 14,
          border:       "1.5px solid #EBEBEB",
          padding:      "2rem 2.25rem",
          fontSize:     "0.9rem",
          lineHeight:   1.85,
          color:        "#333333",
          // Article typography
        }}>
          <ArticleStyles />
          <Component />
        </div>

        {/* Author card */}
        <AuthorCard author={author} />

        {/* Bottom back button */}
        <button onClick={() => navigate("/blog")} style={{
          marginTop:    "1.5rem",
          padding:      "0.55rem 1.3rem",
          background:   GREEN_GRAD,
          border:       "none",
          borderRadius: 9,
          color:        "#fff",
          fontSize:     "0.82rem",
          fontWeight:   600,
          cursor:       "pointer",
          fontFamily:   "'DM Sans',sans-serif",
          boxShadow:    "0 2px 8px rgba(26,58,26,0.18)",
        }}>
          ← Back to Blog
        </button>
      </div>
    </div>
  );
}

// ─── Inject article body typography via a style tag ──────────────────────────
function ArticleStyles() {
  return (
    <style>{`
      .ob-article h2 {
        font-size: 1.15rem; font-weight: 700; color: #1C1C1C;
        margin: 1.75rem 0 0.6rem; letter-spacing: -0.015em;
        border-bottom: 2px solid #f0f4f0; padding-bottom: 0.35rem;
      }
      .ob-article h3 {
        font-size: 1rem; font-weight: 700; color: #2d6a2d;
        margin: 1.4rem 0 0.45rem;
      }
      .ob-article p  { margin: 0 0 1rem; }
      .ob-article ul, .ob-article ol {
        margin: 0.5rem 0 1rem 1.4rem; padding: 0;
      }
      .ob-article li { margin-bottom: 0.4rem; }
      .ob-article code {
        background: #f0f4f0; border-radius: 4px;
        padding: 0.1rem 0.4rem; font-family: 'DM Mono', monospace;
        font-size: 0.82em; color: #1a3a1a;
      }
      .ob-article pre {
        background: #1C1C1C; border-radius: 10px;
        padding: 1.1rem 1.3rem; overflow-x: auto;
        margin: 1rem 0;
      }
      .ob-article pre code {
        background: transparent; color: #E8F4E8;
        font-size: 0.82rem; padding: 0;
      }
      .ob-article blockquote {
        border-left: 3px solid #2d6a2d;
        margin: 1rem 0; padding: 0.6rem 1rem;
        background: #f0f4f0; border-radius: 0 8px 8px 0;
        color: #555; font-style: italic;
      }
      .ob-article table {
        width: 100%; border-collapse: collapse;
        margin: 1rem 0; font-size: 0.82rem;
      }
      .ob-article th {
        background: #f0f4f0; padding: 0.45rem 0.7rem;
        text-align: left; font-weight: 700;
        border-bottom: 2px solid #ddeedd; color: #1a3a1a;
      }
      .ob-article td {
        padding: 0.38rem 0.7rem;
        border-bottom: 1px solid #F5F5F5; color: #444;
      }
      .ob-article a {
        color: #2d6a2d; text-decoration: underline;
        text-decoration-color: #2d6a2d55;
      }
      .ob-article a:hover { text-decoration-color: #2d6a2d; }
      .ob-article strong { color: #1C1C1C; }
      .ob-article em     { color: #555; }
    `}</style>
  );
}
