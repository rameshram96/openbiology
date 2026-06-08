/**
 * VisitorBadge.jsx
 *
 * Displays two live badges on the OpenBiology homepage:
 *   👥  Unique visitor count  — via countapi.mileshilliard.com (HTTPS, free, no key)
 *   📍  Visitor location      — via ipapi.co/json/ (HTTPS, free, no key, 1k/day)
 *
 * BEHAVIOUR
 * ─────────
 * • sessionStorage flag prevents double-counting on refresh within the same tab.
 * • Each badge fades in independently as data arrives.
 * • If either API fails the badge silently stays hidden — no broken UI.
 *
 * PLACEMENT  (in HomePage.jsx)
 * ─────────────────────────────
 * 1. Import at top:
 *      import VisitorBadge from "./VisitorBadge";
 *
 * 2. Drop inside the hero section, right after the <p> description tag
 *    (before the closing </div> of the hero block):
 *
 *      <div style={fade(0.05)}>
 *        <VisitorBadge />
 *      </div>
 *
 * COUNTER KEY
 * ───────────
 * The key "openbiology-in-visitors" is globally unique on countapi.mileshilliard.com.
 * Change it here if you ever need to reset the counter.
 */

import { useEffect, useState } from "react";

const COUNTER_KEY  = "openbiology-in-visitors";
const COUNTER_URL  = `https://countapi.mileshilliard.com/api/v1/hit/${COUNTER_KEY}`;
const LOCATION_URL = "https://ipapi.co/json/";
const SESSION_FLAG = "ob_visit_counted";

// ─── Tiny animated number that counts up from 0 ──────────────────────────────
function AnimatedCount({ target }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!target) return;
    const duration = 1200;
    const steps    = 40;
    const step     = Math.ceil(target / steps);
    let current    = Math.max(0, target - step * steps);
    const timer    = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplay(current);
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return display.toLocaleString("en-IN");
}

// ─── Single pill badge ────────────────────────────────────────────────────────
function Pill({ icon, children, accent = "#0072B2", visible }) {
  return (
    <div style={{
      display:        "inline-flex",
      alignItems:     "center",
      gap:            "0.42rem",
      padding:        "0.32rem 0.85rem 0.32rem 0.65rem",
      borderRadius:   999,
      background:     "#fff",
      border:         `1.5px solid ${accent}22`,
      boxShadow:      `0 2px 10px ${accent}18`,
      fontSize:       "0.72rem",
      fontFamily:     "'DM Sans', sans-serif",
      fontWeight:     500,
      color:          "#444",
      opacity:        visible ? 1 : 0,
      transform:      visible ? "translateY(0)" : "translateY(6px)",
      transition:     "opacity 0.5s ease, transform 0.5s ease",
      whiteSpace:     "nowrap",
      userSelect:     "none",
    }}>
      {/* Coloured dot accent */}
      <span style={{
        width:        6,
        height:       6,
        borderRadius: "50%",
        background:   accent,
        flexShrink:   0,
        boxShadow:    `0 0 0 2px ${accent}22`,
      }} />
      <span style={{ fontSize: "0.8rem", lineHeight: 1 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Skeleton shimmer pill while loading ─────────────────────────────────────
function SkeletonPill() {
  return (
    <div style={{
      display:      "inline-block",
      width:        140,
      height:       28,
      borderRadius: 999,
      background:   "linear-gradient(90deg,#ebebeb 25%,#f5f5f5 50%,#ebebeb 75%)",
      backgroundSize: "200% 100%",
      animation:    "ob-shimmer 1.4s infinite",
    }} />
  );
}

// Inject shimmer keyframe once
function ensureShimmerStyle() {
  if (document.getElementById("ob-shimmer-kf")) return;
  const s     = document.createElement("style");
  s.id        = "ob-shimmer-kf";
  s.textContent = `
    @keyframes ob-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes ob-pulse-dot {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.35; }
    }
  `;
  document.head.appendChild(s);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VisitorBadge() {
  const [count,    setCount]    = useState(null);
  const [location, setLocation] = useState(null);
  const [countVis, setCountVis] = useState(false);
  const [locVis,   setLocVis]   = useState(false);

  useEffect(() => {
    ensureShimmerStyle();

    // ── Visitor counter ───────────────────────────────────────────────────────
    const fetchCount = async () => {
      const alreadyCounted = sessionStorage.getItem(SESSION_FLAG);
      const url = alreadyCounted
        // read-only: get current value without incrementing
        ? `https://countapi.mileshilliard.com/api/v1/get/${COUNTER_KEY}`
        : COUNTER_URL;   // increments by 1

      try {
        const res  = await fetch(url);
        if (!res.ok) throw new Error("counter fetch failed");
        const data = await res.json();
        const val  = data?.value ?? data?.count ?? null;
        if (val !== null) {
          setCount(val);
          setTimeout(() => setCountVis(true), 80);
          if (!alreadyCounted) {
            sessionStorage.setItem(SESSION_FLAG, "1");
          }
        }
      } catch {
        // silently suppress — badge stays hidden
      }
    };

    // ── IP location ───────────────────────────────────────────────────────────
    const fetchLocation = async () => {
      try {
        const res  = await fetch(LOCATION_URL);
        if (!res.ok) throw new Error("location fetch failed");
        const data = await res.json();
        // ipapi.co returns { city, country_name, country_code, ... }
        const city    = data?.city        || "";
        const country = data?.country_name || data?.country || "";
        const flag    = data?.country_code
          ? countryCodeToFlag(data.country_code)
          : "🌍";
        if (country) {
          setLocation({ city, country, flag });
          setTimeout(() => setLocVis(true), 300);
        }
      } catch {
        // silently suppress
      }
    };

    fetchCount();
    fetchLocation();
  }, []);

  // Convert ISO 3166-1 alpha-2 → flag emoji  (e.g. "IN" → 🇮🇳)
  function countryCodeToFlag(code) {
    return code
      .toUpperCase()
      .split("")
      .map(c => String.fromCodePoint(0x1F1E0 - 65 + c.charCodeAt(0)))
      .join("");
  }

  const locationText = location
    ? location.city
      ? `${location.city}, ${location.country}`
      : location.country
    : null;

  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      gap:            "0.6rem",
      flexWrap:       "wrap",
      marginTop:      "1.1rem",
    }}>

      {/* Visitor count badge */}
      {count === null ? (
        <SkeletonPill />
      ) : (
        <Pill icon="👥" accent="#2D9E5F" visible={countVis}>
          <span style={{ fontWeight: 700, color: "#2D9E5F", fontFamily: "'DM Mono', monospace" }}>
            <AnimatedCount target={count} />
          </span>
          <span style={{ color: "#999", fontWeight: 400 }}>&nbsp;visitors</span>
        </Pill>
      )}

      {/* Divider dot */}
      <span style={{
        width:        3,
        height:       3,
        borderRadius: "50%",
        background:   "#DDDDDD",
        flexShrink:   0,
      }} />

      {/* Location badge */}
      {locationText === null ? (
        <SkeletonPill />
      ) : (
        <Pill icon={location.flag} accent="#0072B2" visible={locVis}>
          <span style={{ color: "#666" }}>You're visiting from&nbsp;</span>
          <span style={{ fontWeight: 700, color: "#0072B2" }}>{locationText}</span>
        </Pill>
      )}

    </div>
  );
}
