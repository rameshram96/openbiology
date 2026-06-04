
import { useState } from "react";

// ── Replace this with your Google Apps Script deployment URL ──────────────
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzA02CAsPcs5A_UZr84pax7sge0nJoGbIU8FOG9aF2wOhPnWCAnmA4Gz6E20-Xq5bz1/exec";

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id:    "bug",
    icon:  "🐛",
    label: "Bug report",
    desc:  "Something is broken",
    color: "#D55E00",
    bg:    "#FFF3EC",
    border:"#F5B98A",
  },
  {
    id:    "feature",
    icon:  "💡",
    label: "Feature request",
    desc:  "New capability idea",
    color: "#0072B2",
    bg:    "#EAF5FF",
    border:"#93CAEC",
  },
  {
    id:    "general",
    icon:  "💬",
    label: "General feedback",
    desc:  "Anything else",
    color: "#2D9E5F",
    bg:    "#EAF8F0",
    border:"#8FDAB7",
  },
];

const MODULES = [
  "Correlation Analysis",
  "Two-Variable Correlation",
  "PCA",
  "Regression",
  "Seed Germination Analysis",
  "PEG Calculator",
  "PTGprimerDesigner",
  "BioSafe Primer",
  "IARI Weather Data",
  "Blog / Knowledge Hub",
  "Homepage / General",
  "Other",
];

const MAX_CHARS = 2000;

// ── Small helpers ─────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      margin: "0 0 0.65rem",
      fontSize: "0.6rem",
      fontWeight: 700,
      color: "#AAAAAA",
      textTransform: "uppercase",
      letterSpacing: 1.3,
      fontFamily: "'DM Mono', monospace",
    }}>
      {children}
    </p>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1.5px solid #EBEBEB",
      padding: "1.25rem 1.35rem",
      marginBottom: "0.85rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            title={LABELS[n]}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.6rem",
              cursor: "pointer",
              color: n <= active ? "#E69F00" : "#DDDDDD",
              padding: "2px",
              lineHeight: 1,
              transition: "color 0.12s, transform 0.1s",
              transform: n <= active ? "scale(1.12)" : "scale(1)",
            }}
          >
            ★
          </button>
        ))}
      </div>
      {active > 0 && (
        <span style={{
          fontSize: "0.72rem",
          color: "#E69F00",
          fontWeight: 600,
          fontFamily: "'DM Mono', monospace",
          transition: "opacity 0.15s",
        }}>
          {LABELS[active]}
        </span>
      )}
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────

function SuccessScreen({ category, onReset }) {
  const cat = CATEGORIES.find(c => c.id === category);
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1.5px solid #EBEBEB",
      padding: "3.5rem 2rem",
      textAlign: "center",
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "#EAF8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem",
        margin: "0 auto 1.25rem",
        border: "2px solid #B2DDB2",
      }}>
        ✓
      </div>
      <h2 style={{
        margin: "0 0 0.5rem",
        fontSize: "1.15rem",
        fontWeight: 700,
        color: "#1C1C1C",
        letterSpacing: "-0.01em",
      }}>
        Feedback received!
      </h2>
      <p style={{
        margin: "0 0 0.35rem",
        fontSize: "0.82rem",
        color: "#777",
        lineHeight: 1.7,
        maxWidth: 360,
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        Thank you — your {cat?.label.toLowerCase()} has been logged. It directly shapes what gets improved in OpenBiology.
      </p>
      <p style={{
        margin: "0 0 1.75rem",
        fontSize: "0.72rem",
        color: "#AAAAAA",
        fontFamily: "'DM Mono', monospace",
      }}>
        Saved to the OpenBiology feedback sheet ✓
      </p>
      <button
        onClick={onReset}
        style={{
          padding: "0.55rem 1.4rem",
          borderRadius: 9,
          border: "1.5px solid #E0E0E0",
          background: "#FAFAFA",
          color: "#555",
          fontSize: "0.78rem",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Submit another
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [category,  setCategory]  = useState("bug");
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [module,    setModule]    = useState("");
  const [subject,   setSubject]   = useState("");
  const [message,   setMessage]   = useState("");
  const [rating,    setRating]    = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  const canSubmit = subject.trim().length > 3 && message.trim().length > 5 && !loading;

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    const payload = {
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      category,
      name:    name.trim()    || "(anonymous)",
      email:   email.trim()   || "(not provided)",
      module:  module         || "(none selected)",
      subject: subject.trim(),
      message: message.trim(),
      rating:  rating > 0 ? `${rating}/5` : "(not rated)",
    };

    // ── If webhook not configured, show success anyway (dev mode) ──────────
    if (WEBHOOK_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
      console.log("Feedback payload (webhook not configured):", payload);
      await new Promise(r => setTimeout(r, 700));
      setLoading(false);
      setSubmitted(true);
      return;
    }

    try {
      // no-cors is required for Google Apps Script webhooks from a browser
      await fetch(WEBHOOK_URL, {
        method:  "POST",
        mode:    "no-cors",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      setSubmitted(true);
    } catch (e) {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCategory("bug");
    setName(""); setEmail(""); setModule("");
    setSubject(""); setMessage(""); setRating(0);
    setError(""); setSubmitted(false);
  };

  // ── Shared input style ──────────────────────────────────────────────────
  const inp = {
    width: "100%",
    border: "1.5px solid #E8E8E8",
    borderRadius: 9,
    padding: "0.45rem 0.75rem",
    fontSize: "0.8rem",
    color: "#1C1C1C",
    background: "#FAFAFA",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F7F7F5",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* ── Module header ──────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
        padding: "1.1rem 2rem",
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      }}>
        <span style={{ fontSize: 22 }}>📬</span>
        <div>
          <h1 style={{
            margin: 0,
            color: "#fff",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}>
            Feedback & Suggestions
          </h1>
          <p style={{
            margin: 0,
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.65rem",
            fontFamily: "'DM Mono'",
          }}>
            Bug reports · Feature requests · General feedback
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "2rem 1.5rem 3.5rem",
      }}>

        {submitted ? (
          <SuccessScreen category={category} onReset={handleReset} />
        ) : (
          <>

            {/* 1. Category */}
            <Card>
              <SectionLabel>What type of feedback?</SectionLabel>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.6rem",
              }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: "0.85rem 0.5rem",
                      borderRadius: 11,
                      border: category === cat.id
                        ? `2px solid ${cat.border}`
                        : "1.5px solid #EBEBEB",
                      background: category === cat.id ? cat.bg : "#FAFAFA",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                      boxShadow: category === cat.id
                        ? `0 2px 12px ${cat.color}18`
                        : "none",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>
                      {cat.icon}
                    </div>
                    <div style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: category === cat.id ? cat.color : "#1C1C1C",
                      marginBottom: "0.15rem",
                    }}>
                      {cat.label}
                    </div>
                    <div style={{
                      fontSize: "0.63rem",
                      color: "#AAAAAA",
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {cat.desc}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* 2. Your details */}
            <Card>
              <SectionLabel>
                Your details{" "}
                <span style={{ color: "#CCCCCC", fontWeight: 400 }}>(optional)</span>
              </SectionLabel>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}>
                <div>
                  <p style={{
                    margin: "0 0 0.3rem",
                    fontSize: "0.63rem",
                    color: "#AAAAAA",
                    fontFamily: "'DM Mono'",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}>
                    Name
                  </p>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ramesh R"
                    style={inp}
                  />
                </div>
                <div>
                  <p style={{
                    margin: "0 0 0.3rem",
                    fontSize: "0.63rem",
                    color: "#AAAAAA",
                    fontFamily: "'DM Mono'",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}>
                    Email
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inp}
                  />
                </div>
              </div>
            </Card>

            {/* 3. Details */}
            <Card>
              <SectionLabel>Details</SectionLabel>

              {/* Module */}
              <div style={{ marginBottom: "0.75rem" }}>
                <p style={{
                  margin: "0 0 0.3rem",
                  fontSize: "0.63rem",
                  color: "#AAAAAA",
                  fontFamily: "'DM Mono'",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}>
                  Which module? (optional)
                </p>
                <select
                  value={module}
                  onChange={e => setModule(e.target.value)}
                  style={{ ...inp, cursor: "pointer" }}
                >
                  <option value="">— select if applicable —</option>
                  {MODULES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: "0.75rem" }}>
                <p style={{
                  margin: "0 0 0.3rem",
                  fontSize: "0.63rem",
                  color: "#AAAAAA",
                  fontFamily: "'DM Mono'",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}>
                  Subject <span style={{ color: "#D55E00" }}>*</span>
                </p>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Short summary of your feedback"
                  style={{
                    ...inp,
                    borderColor: subject.trim().length > 0 && subject.trim().length <= 3
                      ? "#F5A88A"
                      : "#E8E8E8",
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: "0.75rem" }}>
                <p style={{
                  margin: "0 0 0.3rem",
                  fontSize: "0.63rem",
                  color: "#AAAAAA",
                  fontFamily: "'DM Mono'",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}>
                  Message <span style={{ color: "#D55E00" }}>*</span>
                </p>
                <textarea
                  value={message}
                  onChange={e => {
                    if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
                  }}
                  placeholder="Describe the issue, idea, or suggestion in detail…"
                  rows={5}
                  style={{
                    ...inp,
                    resize: "vertical",
                    minHeight: 110,
                    lineHeight: 1.65,
                  }}
                />
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "0.25rem",
                }}>
                  <span style={{
                    fontSize: "0.6rem",
                    color: message.length > MAX_CHARS * 0.9 ? "#D55E00" : "#CCCCCC",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {message.length} / {MAX_CHARS}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <p style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.63rem",
                  color: "#AAAAAA",
                  fontFamily: "'DM Mono'",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}>
                  Overall satisfaction (optional)
                </p>
                <StarRating value={rating} onChange={setRating} />
              </div>
            </Card>

            {/* Error bar */}
            {error && (
              <div style={{
                background: "#FFF0F0",
                border: "1.5px solid #FFCCCC",
                borderRadius: 10,
                padding: "0.65rem 1rem",
                color: "#C0392B",
                fontSize: "0.75rem",
                marginBottom: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                ❌ {error}
              </div>
            )}

            {/* Submit row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.85rem",
            }}>
              <p style={{
                margin: 0,
                fontSize: "0.65rem",
                color: "#BBBBBB",
                fontFamily: "'DM Mono', monospace",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}>
                🔒 Saved privately to a Google Sheet — never shared
              </p>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  padding: "0.65rem 1.75rem",
                  borderRadius: 10,
                  border: "none",
                  background: canSubmit
                    ? "linear-gradient(135deg, #1a3a1a, #2d6a2d)"
                    : "#DDDDDD",
                  color: canSubmit ? "#fff" : "#AAAAAA",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.18s",
                  boxShadow: canSubmit
                    ? "0 3px 12px rgba(26,58,26,0.25)"
                    : "none",
                  letterSpacing: 0.3,
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "ob-spin 0.7s linear infinite",
                    }} />
                    Sending…
                  </>
                ) : (
                  <>📨 Send feedback</>
                )}
              </button>
            </div>

            {/* Spinner keyframe */}
            <style>{`
              @keyframes ob-spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}
