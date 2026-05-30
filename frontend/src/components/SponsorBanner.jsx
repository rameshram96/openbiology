/**
 * SponsorBanner.jsx
 * Reads config from src/config/sponsor.js — no API, no backend.
 *
 * To update: edit sponsor.js + replace public/sponsor/banner.jpg, then push.
 *
 * States:
 *   active: true  → shows banner image (clickable if link set)
 *   active: false → shows animated marquee fallback
 */

import { useEffect } from "react";
import sponsor from "../config/sponsor";

// ─── Marquee keyframe injected once ──────────────────────────────────────────
const STYLE_ID = "ob-marquee-style";
function ensureMarqueeStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ob-marquee {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .ob-marquee-track {
      display: inline-flex;
      white-space: nowrap;
      animation: ob-marquee 28s linear infinite;
    }
    .ob-marquee-track:hover { animation-play-state: paused; }
  `;
  document.head.appendChild(s);
}

const MARQUEE_TEXT =
  "✦  Display your products here to reach the global science community  —  " +
  "Contact our team for product promotion  ✦  " +
  "Showcase your lab reagents, instruments, software, and services  —  " +
  "Trusted by plant scientists and bioinformaticians worldwide  ✦  " +
  "Display your products here to reach the global science community  —  " +
  "Contact our team for product promotion  ✦  ";

// ─── Fallback ─────────────────────────────────────────────────────────────────
function MarqueeFallback() {
  useEffect(() => { ensureMarqueeStyle(); }, []);

  return (
    <div style={{
      width: "100%", height: 320, borderRadius: 14,
      background: "linear-gradient(135deg,#1a3a1a 0%,#2d6a2d 50%,#1a4a2a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
      boxShadow: "0 4px 24px rgba(26,58,26,0.18)",
    }}>

      {/* Decorative circles */}
      <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220,
                    borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>
      <div style={{ position:"absolute", bottom:-80, left:-40, width:280, height:280,
                    borderRadius:"50%", background:"rgba(255,255,255,0.03)" }}/>

      {/* Sponsored pill */}
      <div style={{
        position:"absolute", top:14, right:16,
        background:"rgba(255,255,255,0.15)",
        border:"1px solid rgba(255,255,255,0.25)",
        borderRadius:999, padding:"0.2rem 0.65rem",
        fontSize:"0.6rem", fontWeight:700,
        color:"rgba(255,255,255,0.7)",
        fontFamily:"'DM Mono',monospace",
        textTransform:"uppercase", letterSpacing:1.2,
      }}>
        Sponsored
      </div>

      {/* Centre content */}
      <div style={{ textAlign:"center", padding:"0 2rem",
                    zIndex:1, marginBottom:"2.5rem" }}>
        <p style={{ margin:"0 0 0.5rem", fontSize:"1.5rem" }}>📢</p>
        <p style={{ margin:"0 0 0.3rem", fontSize:"1rem", fontWeight:700,
                    color:"#fff", letterSpacing:"-0.01em" }}>
          Promote Your Products Here
        </p>
        <p style={{ margin:0, fontSize:"0.78rem",
                    color:"rgba(255,255,255,0.6)", fontWeight:300 }}>
          Reach plant scientists and bioinformaticians worldwide
        </p>
      </div>

      {/* Marquee strip */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        background:"rgba(0,0,0,0.25)",
        borderTop:"1px solid rgba(255,255,255,0.08)",
        padding:"0.6rem 0", overflow:"hidden",
      }}>
        <div className="ob-marquee-track">
          <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.75)",
                         fontFamily:"'DM Sans',sans-serif", fontWeight:400,
                         paddingRight:"2rem" }}>
            {MARQUEE_TEXT}
          </span>
          <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.75)",
                         fontFamily:"'DM Sans',sans-serif", fontWeight:400,
                         paddingRight:"2rem" }}>
            {MARQUEE_TEXT}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Active banner ────────────────────────────────────────────────────────────
function ActiveBanner({ image, link }) {
  const img = (
    <div style={{
      width:"100%", height:320, borderRadius:14,
      overflow:"hidden", position:"relative",
      boxShadow:"0 4px 24px rgba(0,0,0,0.12)",
      cursor: link ? "pointer" : "default",
    }}>
      <img
        src={image}
        alt="Sponsor"
        style={{ width:"100%", height:"100%",
                 objectFit:"cover", objectPosition:"center",
                 display:"block" }}
      />
      {/* Sponsored label */}
      <div style={{
        position:"absolute", top:12, right:14,
        background:"rgba(0,0,0,0.48)",
        backdropFilter:"blur(4px)",
        border:"1px solid rgba(255,255,255,0.18)",
        borderRadius:999, padding:"0.2rem 0.65rem",
        fontSize:"0.6rem", fontWeight:700,
        color:"rgba(255,255,255,0.85)",
        fontFamily:"'DM Mono',monospace",
        textTransform:"uppercase", letterSpacing:1.2,
      }}>
        Sponsored
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer"
         style={{ display:"block", textDecoration:"none" }}>
        {img}
      </a>
    );
  }
  return img;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SponsorBanner() {
  return (
    <div style={{ marginBottom:"2.5rem" }}>
      {sponsor.active
        ? <ActiveBanner image={sponsor.image} link={sponsor.link} />
        : <MarqueeFallback />
      }
    </div>
  );
}
