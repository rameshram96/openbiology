/**
 * AboutPage.jsx
 * Route: /about
 * Single page — About · Privacy Policy · Data Disclaimer
 * Sticky sidebar navigation highlights active section on scroll.
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GREEN_GRAD = "linear-gradient(135deg, #1a3a1a, #2d6a2d)";

const SECTIONS = [
  { id: "about",      label: "About OpenBiology",  icon: "🌿" },
  { id: "privacy",    label: "Privacy Policy",      icon: "🔒" },
  { id: "disclaimer", label: "Data Disclaimer",     icon: "📋" },
];

// ─── Typography helpers ───────────────────────────────────────────────────────

function SectionHeading({ id, icon, title, subtitle }) {
  return (
    <div id={id} style={{ marginBottom: "1.5rem", scrollMarginTop: "2rem" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.65rem",
        marginBottom: "0.4rem",
      }}>
        <span style={{ fontSize: "1.2rem" }}>{icon}</span>
        <h2 style={{
          margin: 0, fontSize: "1.15rem", fontWeight: 700,
          color: "#1C1C1C", letterSpacing: "-0.015em",
        }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{
          margin: "0 0 0 2rem", fontSize: "0.72rem",
          color: "#AAAAAA", fontFamily: "'DM Mono', monospace",
        }}>
          {subtitle}
        </p>
      )}
      <div style={{
        height: 2, background: "linear-gradient(to right, #2d6a2d22, transparent)",
        marginTop: "0.65rem", borderRadius: 2,
      }} />
    </div>
  );
}

function SubHeading({ children }) {
  return (
    <h3 style={{
      margin: "1.5rem 0 0.5rem",
      fontSize: "0.92rem", fontWeight: 700,
      color: "#2d6a2d", letterSpacing: "-0.01em",
    }}>
      {children}
    </h3>
  );
}

function Prose({ children }) {
  return (
    <p style={{
      margin: "0 0 0.9rem",
      fontSize: "0.83rem", color: "#555",
      lineHeight: 1.85, fontWeight: 300,
    }}>
      {children}
    </p>
  );
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: "0 0 0.9rem 1.25rem", padding: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          fontSize: "0.83rem", color: "#555",
          lineHeight: 1.85, fontWeight: 300,
          marginBottom: "0.35rem",
        }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ children }) {
  return (
    <div style={{
      background: "#F0F8F0",
      border: "1.5px solid #B2DDB2",
      borderRadius: 12,
      padding: "1rem 1.25rem",
      margin: "1.1rem 0",
    }}>
      {children}
    </div>
  );
}

function WarningCard({ children }) {
  return (
    <div style={{
      background: "#FFFBEA",
      border: "1.5px solid #F5E6A0",
      borderRadius: 12,
      padding: "1rem 1.25rem",
      margin: "1.1rem 0",
    }}>
      {children}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth", block: "start",
    });
  };

  return (
    <div style={{
      position: "sticky", top: "1.5rem",
      width: 210, flexShrink: 0,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 13,
        border: "1.5px solid #EBEBEB",
        padding: "0.85rem 0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        <p style={{
          margin: "0 0 0.5rem",
          padding: "0 1rem",
          fontSize: "0.58rem", fontWeight: 700,
          color: "#CCCCCC", textTransform: "uppercase",
          letterSpacing: 1.3, fontFamily: "'DM Mono', monospace",
        }}>
          On this page
        </p>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            style={{
              width: "100%", display: "flex",
              alignItems: "center", gap: "0.6rem",
              padding: "0.52rem 1rem",
              border: "none", borderRadius: 0,
              background: active === s.id ? "#F0F8F0" : "transparent",
              borderLeft: `3px solid ${active === s.id ? "#2d6a2d" : "transparent"}`,
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{s.icon}</span>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: active === s.id ? 700 : 400,
              color: active === s.id ? "#2d6a2d" : "#666",
              lineHeight: 1.3,
            }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Quick contact card */}
      <div style={{
        marginTop: "0.75rem",
        background: "#fff",
        borderRadius: 13,
        border: "1.5px solid #EBEBEB",
        padding: "0.9rem 1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <p style={{
          margin: "0 0 0.5rem",
          fontSize: "0.58rem", fontWeight: 700,
          color: "#CCCCCC", textTransform: "uppercase",
          letterSpacing: 1.3, fontFamily: "'DM Mono', monospace",
        }}>
          Contact
        </p>
        <p style={{
          margin: "0 0 0.55rem",
          fontSize: "0.72rem", color: "#777", lineHeight: 1.6,
        }}>
          Questions, suggestions, or bug reports?
        </p>
        <a
          href="https://github.com/rameshram96"
          target="_blank" rel="noreferrer"
          style={{
            display: "inline-block",
            padding: "0.32rem 0.75rem",
            borderRadius: 7,
            border: "1.5px solid #1C1C1C",
            background: "#1C1C1C",
            color: "#fff",
            fontSize: "0.68rem", fontWeight: 600,
            textDecoration: "none",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          GitHub ↗
        </a>
      </div>
    </div>
  );
}

// ─── Section content ──────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <div>
      <SectionHeading
        id="about"
        icon="🌿"
        title="About OpenBiology.in"
      />

      <InfoCard>
        <Prose>
          <strong style={{ color: "#1B7A4A" }}>Openbiology.in</strong> is an
          open-access web platform developed to support researchers, students,
          educators, and professionals working in plant sciences, agriculture,
          biology, and related life science disciplines.
        </Prose>
        <Prose style={{ margin: 0 }}>
          The platform aims to provide accessible, user-friendly, and
          scientifically relevant computational tools that simplify data
          analysis, visualization, and interpretation for the research community.
        </Prose>
      </InfoCard>

      <Prose>
        The project is being developed by researchers for researchers, with a
        strong commitment to promoting open science, reproducible research, and
        equitable access to scientific resources. Our goal is to make advanced
        analytical tools available to everyone, regardless of institutional
        affiliation, geographical location, or funding constraints.
      </Prose>

      <Prose>
        Openbiology.in is built using a wide range of open-source software,
        libraries, frameworks, and community-driven technologies. We are grateful
        to the global open-source community whose contributions make projects
        like Openbiology.in possible.
      </Prose>

      <Prose>
        The platform is actively maintained and continuously improved based on
        emerging scientific needs, technological advancements, and feedback from
        users. We welcome suggestions, feature requests, bug reports, and
        collaborative opportunities from researchers, developers, educators, and
        organizations who share our vision.
      </Prose>

      <SubHeading>Our Mission</SubHeading>
      <Prose>
        Our long-term mission is to create a sustainable ecosystem of freely
        available computational resources that accelerate scientific discovery,
        education, and innovation in the life sciences.
      </Prose>

      <SubHeading>Get Involved</SubHeading>
      <Prose>
        For collaborations, feedback, or contributions, users are encouraged to
        connect with the development team through the project's GitHub repository
        and associated communication channels.
      </Prose>
    </div>
  );
}

function PrivacySection() {
  return (
    <div>
      <SectionHeading
        id="privacy"
        icon="🔒"
        title="Privacy Policy"
        subtitle="Last Updated: June 2026"
      />

      <Prose>
        At Openbiology.in, we respect and value the privacy of our users. This
        Privacy Policy explains how information is handled when you use our
        platform and services.
      </Prose>

      <SubHeading>Information Collection</SubHeading>
      <Prose>
        Openbiology.in is designed to provide biological and agricultural
        research tools while minimizing the collection of user information. At
        present, we do not intentionally collect, sell, rent, or use personal
        information from users for commercial, marketing, or profiling purposes.
      </Prose>

      <SubHeading>User Uploaded Data</SubHeading>
      <Prose>
        Many Openbiology.in tools may require users to upload datasets,
        experimental results, sequence files, spreadsheets, or other
        research-related information for analysis. We are committed to protecting
        the confidentiality of user data:
      </Prose>
      <BulletList items={[
        "Uploaded files are processed solely for the purpose of performing the requested analysis.",
        "The development team does not access, inspect, monitor, or use user-uploaded data for research, commercial activities, or any other purpose.",
        "User-uploaded datasets are not intentionally stored as part of a permanent database for future use.",
        "We do not claim ownership of any data submitted to the platform.",
      ]} />
      <Prose>
        Users remain solely responsible for ensuring that the data they upload
        complies with applicable institutional, ethical, legal, and regulatory
        requirements.
      </Prose>

      <SubHeading>Cookies and Analytics</SubHeading>
      <Prose>
        Openbiology.in currently does not intentionally use user data for
        tracking, behavioral profiling, or advertising purposes. However, basic
        technical information such as server logs, browser information, or
        network diagnostics may be generated automatically by hosting providers,
        cloud services, or infrastructure components to ensure platform
        functionality, performance, and security.
      </Prose>

      <SubHeading>Third-Party Services</SubHeading>
      <Prose>
        Openbiology.in may utilize third-party open-source libraries, hosting
        infrastructure, or external services that are necessary for the operation
        of the platform. These services may have their own privacy policies and
        terms of use. Users are encouraged to review the policies of relevant
        third-party providers where applicable.
      </Prose>

      <SubHeading>Future Changes</SubHeading>
      <Prose>
        As Openbiology.in continues to evolve, certain features may require the
        collection of limited user information to improve functionality, provide
        user accounts, enable collaboration features, or enhance service quality.
        Should any significant changes to our data collection or data handling
        practices occur in the future, they will be clearly disclosed and
        documented in this Privacy Policy before implementation.
      </Prose>

      <SubHeading>Data Security</SubHeading>
      <Prose>
        We strive to implement reasonable technical and organizational measures
        to protect the security and integrity of the platform. However, no
        internet-based service can guarantee absolute security, and users should
        exercise appropriate caution when uploading sensitive or confidential
        information.
      </Prose>

      <SubHeading>Contact</SubHeading>
      <Prose>
        Questions, suggestions, or concerns regarding this Privacy Policy may be
        submitted through the Openbiology.in GitHub repository or other official
        project communication channels.
      </Prose>

      <InfoCard>
        <p style={{
          margin: 0, fontSize: "0.78rem", color: "#2d6a2d",
          lineHeight: 1.7,
        }}>
          By using Openbiology.in, you acknowledge and agree to the terms
          described in this Privacy Policy.
        </p>
      </InfoCard>
    </div>
  );
}

function DisclaimerSection() {
  return (
    <div>
      <SectionHeading
        id="disclaimer"
        icon="📋"
        title="Data Disclaimer"
      />

      <Prose>
        Openbiology.in provides computational tools, analytical workflows,
        visualizations, and research support utilities for educational and
        scientific purposes.
      </Prose>

      <Prose>
        While every effort is made to ensure the accuracy, reliability, and
        scientific validity of the platform, the results generated by
        Openbiology.in should be considered supportive research outputs and
        not definitive scientific conclusions.
      </Prose>

      <SubHeading>User Responsibilities</SubHeading>
      <BulletList items={[
        "Verifying the accuracy and suitability of generated results.",
        "Independently validating findings before publication, regulatory submission, or decision-making.",
        "Ensuring that uploaded datasets and analyses comply with applicable ethical, legal, institutional, and regulatory requirements.",
      ]} />

      <SubHeading>Limitation of Liability</SubHeading>
      <Prose>
        The developers, contributors, and affiliated organizations make no
        warranties, expressed or implied, regarding the completeness, accuracy,
        reliability, or fitness of any output generated by the platform.
      </Prose>
      <Prose>
        Openbiology.in is provided on an "as available" and "as is" basis. The
        developers shall not be liable for any direct, indirect, incidental,
        consequential, or special damages arising from the use of the platform
        or reliance on its outputs.
      </Prose>

      <WarningCard>
        <p style={{
          margin: 0, fontSize: "0.78rem", color: "#7A6000",
          lineHeight: 1.7,
        }}>
          ⚠ By using Openbiology.in, users acknowledge that scientific analyses
          require independent interpretation and validation, and they accept full
          responsibility for the use of any results generated by the platform.
        </p>
      </WarningCard>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const navigate   = useNavigate();
  const [active, setActive] = useState("about");
  const contentRef = useRef(null);

  // Highlight sidebar based on scroll position
  useEffect(() => {
    const onScroll = () => {
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActive(SECTIONS[i].id);
            return;
          }
        }
      }
      setActive("about");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <div style={{
        background: "#1C1C1C",
        padding: "0 2.5rem", height: 52,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "#fff", borderRadius: 7, padding: "0.3rem 0.85rem",
              cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ← Home
          </button>
          <span style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.78rem",
          }}>
            🌿 OpenBiology · About
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() =>
                document.getElementById(s.id)?.scrollIntoView({
                  behavior: "smooth", block: "start",
                })
              }
              style={{
                background: "transparent", border: "none",
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.72rem", fontWeight: 500,
                cursor: "pointer", padding: "0.3rem 0.6rem",
                borderRadius: 6, fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div style={{
        background: GREEN_GRAD,
        padding: "2.25rem 2.5rem 1.85rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 999, padding: "0.22rem 0.9rem",
            marginBottom: "0.85rem",
          }}>
            <span style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.62rem", fontFamily: "'DM Mono'",
              letterSpacing: 1.4, textTransform: "uppercase",
            }}>
              Open Science · Free for Everyone
            </span>
          </div>
          <h1 style={{
            margin: "0 0 0.5rem",
            color: "#fff",
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}>
            About OpenBiology.in
          </h1>
          <p style={{
            margin: 0,
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.85rem", fontWeight: 300,
            maxWidth: 520,
          }}>
            Open-access computational tools for plant science, agriculture,
            and life science research — built by researchers, for researchers.
          </p>
        </div>
      </div>

      {/* ── Body: sidebar + content ──────────────────────────────────── */}
      <div style={{
        maxWidth: 1060, margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
        display: "flex", gap: "1.75rem",
        alignItems: "flex-start",
      }}>

        {/* Sidebar */}
        <Sidebar active={active} />

        {/* Main content */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 16,
            border: "1.5px solid #EBEBEB",
            padding: "2rem 2.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <AboutSection />
          <div style={{
            height: 1, background: "#F0F0F0",
            margin: "2.25rem 0",
          }} />
          <PrivacySection />
          <div style={{
            height: 1, background: "#F0F0F0",
            margin: "2.25rem 0",
          }} />
          <DisclaimerSection />

          {/* Bottom meta */}
          <div style={{
            marginTop: "2.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #F0F0F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}>
            <span style={{
              fontSize: "0.62rem",
              color: "#CCCCCC",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 1.1,
            }}>
              OPENBIOLOGY.IN · FREE & OPEN SOURCE
            </span>
            <button
              onClick={() =>
                document.getElementById("about")?.scrollIntoView({
                  behavior: "smooth", block: "start",
                })
              }
              style={{
                background: "transparent",
                border: "1px solid #E0E0E0",
                borderRadius: 7,
                padding: "0.25rem 0.7rem",
                fontSize: "0.65rem",
                color: "#AAAAAA",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              ↑ Back to top
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
