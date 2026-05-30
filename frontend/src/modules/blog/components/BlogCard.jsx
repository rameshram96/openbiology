/**
 * BlogCard.jsx
 * Article preview card for the /blog grid.
 * Matches the OpenBiology card design system.
 */

import { useNavigate } from "react-router-dom";
import { useState }    from "react";

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

function tagColor(tag) {
  return TAG_COLORS[tag] || "#737373";
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day:   "numeric",
      month: "short",
      year:  "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BlogCard({ metadata }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const { slug, title, description, tags = [], author, date } = metadata;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   "#fff",
        borderRadius: 13,
        border:       `1.5px solid ${hovered ? "#2d6a2d" : "#EBEBEB"}`,
        padding:      "1.15rem 1.2rem",
        cursor:       "pointer",
        boxShadow:    hovered
          ? "0 6px 24px rgba(45,106,45,0.10)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        transition:   "all 0.18s ease",
        display:      "flex",
        flexDirection:"column",
        gap:          "0.55rem",
        position:     "relative",
      }}
      onClick={() => navigate(`/blog/${slug}`)}
    >
      {/* Left accent bar */}
      <div style={{
        position:     "absolute",
        left:         0,
        top:          14,
        bottom:       14,
        width:        3,
        borderRadius: "0 3px 3px 0",
        background:   hovered
          ? "linear-gradient(to bottom, #1a3a1a, #2d6a2d)"
          : "#E5E5E5",
        transition:   "background 0.18s",
      }} />

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {tags.map((tag) => (
            <span key={tag} style={{
              padding:      "0.12rem 0.5rem",
              borderRadius: 999,
              background:   tagColor(tag) + "18",
              color:        tagColor(tag),
              fontSize:     "0.6rem",
              fontWeight:   600,
              fontFamily:   "'DM Mono', monospace",
              textTransform:"uppercase",
              letterSpacing: 0.9,
              border:       `1px solid ${tagColor(tag)}33`,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h3 style={{
        margin:     0,
        fontSize:   "0.9rem",
        fontWeight: 700,
        color:      "#1C1C1C",
        lineHeight: 1.35,
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        margin:     0,
        fontSize:   "0.74rem",
        color:      "#777",
        lineHeight: 1.65,
        fontWeight: 300,
        flexGrow:   1,
        // Clamp to 3 lines
        display:           "-webkit-box",
        WebkitLineClamp:   3,
        WebkitBoxOrient:   "vertical",
        overflow:          "hidden",
      }}>
        {description}
      </p>

      {/* Footer: author + date + read more */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginTop:      "0.25rem",
        borderTop:      "1px solid #F5F5F5",
        paddingTop:     "0.55rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {author?.photo ? (
            <img src={author.photo} alt={author.name}
              style={{ width: 24, height: 24, borderRadius: "50%",
                       objectFit: "cover", border: "1.5px solid #E8E8E8" }} />
          ) : (
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "linear-gradient(135deg,#1a3a1a,#2d6a2d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0,
            }}>
              {author?.name?.charAt(0) || "A"}
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 600,
                        color: "#555" }}>
              {author?.name}
            </p>
            <p style={{ margin: 0, fontSize: "0.6rem", color: "#AAAAAA",
                        fontFamily: "'DM Mono', monospace" }}>
              {formatDate(date)}
            </p>
          </div>
        </div>

        <span style={{
          fontSize:   "0.68rem",
          color:      hovered ? "#2d6a2d" : "#AAAAAA",
          fontWeight: 600,
          transition: "color 0.18s",
          fontFamily: "'DM Mono', monospace",
        }}>
          Read more →
        </span>
      </div>
    </div>
  );
}
