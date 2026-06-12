/**
 * NoticeBar.jsx
 *
 * A continuously scrolling marquee strip showing rotating announcements.
 * Matches the navbar's green gradient.
 *
 * PLACEMENT (in HomePage.jsx)
 * ────────────────────────────
 * 1. Import at top:
 *      import NoticeBar from "./NoticeBar";
 *
 * 2. Place directly below the navbar div, before the
 *    <div style={{ maxWidth: 1100, ... }}> content wrapper:
 *
 *      </div>  ← end of navbar
 *      <NoticeBar />
 *      <div style={{ maxWidth: 1100, ... }}>  ← content wrapper
 *
 * EDITING ANNOUNCEMENTS
 * ───────────────────────
 * Just edit the NOTICES array below — add, remove, or reorder freely.
 * Each item can optionally have an emoji prefix baked into the text.
 */

import { useEffect } from "react";

// ─── Edit your rotating announcements here ───────────────────────────────────
const NOTICES = [
  "🌱 New: Seed Germination & Seedling Analysis module — 16 indices + Weibull T50 fitting",
  "📊 PCA module now live — Scree, Score, Biplot & Loading Heatmap with full Excel export",
  "🧬 PTGprimerDesigner & BioSafe Primer tools available for CRISPR construct design",
  "📈 Regression module supports Simple, Multiple & Stepwise selection (AIC/BIC/p-value)",
  "💧 PEG Calculator — compute osmotic potential for PEG 6000 / 8000 instantly",
  "📝 Knowledge Hub — tutorials and methods notes for plant science research",
  "🆓 OpenBiology is 100% free & open — support us if it helps your research",
];

const STYLE_ID = "ob-noticebar-style";
function ensureNoticeStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ob-notice-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .ob-notice-track {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      animation: ob-notice-scroll 50s linear infinite;
    }
    .ob-notice-track:hover {
      animation-play-state: paused;
    }
    @media (max-width: 640px) {
      .ob-notice-track {
        animation-duration: 32s;
      }
    }
  `;
  document.head.appendChild(s);
}

function NoticeContent() {
  return (
    <>
      {NOTICES.map((text, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span style={{
            fontSize:   "0.78rem",
            fontWeight: 500,
            color:      "rgba(255,255,255,0.92)",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.01em",
          }}>
            {text}
          </span>
          {/* Separator dot */}
          <span style={{
            display:      "inline-block",
            width:        4,
            height:       4,
            borderRadius: "50%",
            background:   "rgba(255,255,255,0.35)",
            margin:       "0 1.75rem",
            flexShrink:   0,
          }} />
        </span>
      ))}
    </>
  );
}

export default function NoticeBar() {
  useEffect(() => { ensureNoticeStyle(); }, []);

  return (
    <div style={{
      background:   "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
      overflow:     "hidden",
      position:     "relative",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      boxShadow:    "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      {/* Left fade edge */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 36,
        background: "linear-gradient(to right, #1a3a1a, transparent)",
        zIndex: 2, pointerEvents: "none",
      }} />
      {/* Right fade edge */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 36,
        background: "linear-gradient(to left, #2d6a2d, transparent)",
        zIndex: 2, pointerEvents: "none",
      }} />

      <div style={{ padding: "0.5rem 0" }}>
        <div className="ob-notice-track">
          <NoticeContent />
          {/* Duplicate for seamless loop */}
          <NoticeContent />
        </div>
      </div>
    </div>
  );
}
