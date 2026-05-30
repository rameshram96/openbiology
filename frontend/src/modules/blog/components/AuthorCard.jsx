/**
 * AuthorCard.jsx
 * Reusable author profile card.
 * Used on individual article pages.
 */

export default function AuthorCard({ author }) {
  if (!author) return null;
  const { name, affiliation, photo } = author;

  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      gap:           "0.9rem",
      background:    "#fff",
      border:        "1.5px solid #EBEBEB",
      borderRadius:  12,
      padding:       "0.9rem 1.1rem",
      marginTop:     "1.5rem",
    }}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          style={{
            width:        48,
            height:       48,
            borderRadius: "50%",
            objectFit:    "cover",
            flexShrink:   0,
            border:       "2px solid #E8F4FD",
            boxShadow:    "0 2px 8px rgba(0,114,178,0.12)",
          }}
        />
      ) : (
        <div style={{
          width:           48,
          height:          48,
          borderRadius:    "50%",
          background:      "linear-gradient(135deg, #1a3a1a, #2d6a2d)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          flexShrink:      0,
          color:           "#fff",
          fontWeight:      700,
          fontSize:        "1.1rem",
        }}>
          {name ? name.charAt(0).toUpperCase() : "A"}
        </div>
      )}
      <div>
        <p style={{
          margin:     0,
          fontSize:   "0.85rem",
          fontWeight: 700,
          color:      "#1C1C1C",
        }}>
          {name}
        </p>
        {affiliation && (
          <p style={{
            margin:    "0.15rem 0 0",
            fontSize:  "0.72rem",
            color:     "#888",
            fontWeight: 400,
          }}>
            {affiliation}
          </p>
        )}
      </div>
    </div>
  );
}
