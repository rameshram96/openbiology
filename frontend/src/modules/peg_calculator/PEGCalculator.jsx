import { useState, useEffect } from "react";

// ─── Formula coefficients (Michel & Kaufmann 1973 / Steuter 1981) ─────────────
// Psi(bar) = a*W + b*W^2 + (c*W - d*W^2)*T   where W = g PEG per 100g water

const COEFF = {
  6000: { a: -1.18, b: 0.0354, c: 0.0351, d: 0.00106 },
  8000: { a: -1.18, b: 0.0365, c: 0.0362, d: 0.00108 },
};

function psiBar(W, T, k) {
  return k.a * W + k.b * W * W + (k.c * W - k.d * W * W) * T;
}

function dpsiBar(W, T, k) {
  return k.a + 2 * k.b * W + (k.c - 2 * k.d * W) * T;
}

function solveW(targetBar, T, k) {
  let W = 10;
  for (let i = 0; i < 150; i++) {
    const f  = psiBar(W, T, k) - targetBar;
    const df = dpsiBar(W, T, k);
    if (Math.abs(df) < 1e-12) break;
    W -= f / df;
    if (W < 0.001) W = 0.001;
    if (W > 80)    W = 80;
    if (Math.abs(f) < 1e-10) break;
  }
  return W;
}

function minPsi(T, k) {
  let W = 10;
  for (let i = 0; i < 200; i++) {
    const d1 = k.a + 2 * k.b * W + (k.c - 2 * k.d * W) * T;
    const d2 = 2 * k.b - 2 * k.d * T;
    if (Math.abs(d2) < 1e-12) break;
    W += -d1 / d2;
    if (W < 0.001) W = 0.001;
  }
  return { W, psi: psiBar(W, T, k) };
}

// ─── Tiny sub-components ──────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{
      margin: "0 0 0.45rem", fontSize: "0.6rem", fontWeight: 700,
      color: "#AAAAAA", textTransform: "uppercase", letterSpacing: 1.3,
      fontFamily: "'DM Mono', monospace",
    }}>
      {children}
    </p>
  );
}

function ResultCard({ label, value, unit, accent }) {
  return (
    <div style={{
      background: "#FAFAFA", borderRadius: 10,
      border: `1.5px solid ${accent ? "#2D9E5F33" : "#EBEBEB"}`,
      padding: "0.9rem 1rem",
    }}>
      <p style={{ margin: "0 0 0.2rem", fontSize: "0.6rem", color: "#AAAAAA",
                  textTransform: "uppercase", letterSpacing: 1.1,
                  fontFamily: "'DM Mono'" }}>{label}</p>
      <p style={{ margin: 0 }}>
        <span style={{ fontSize: "1.3rem", fontWeight: 700,
                       color: accent ? "#1B7A4A" : "#1C1C1C",
                       fontFamily: "'DM Mono'" }}>
          {value}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#AAAAAA",
                       marginLeft: 5 }}>{unit}</span>
      </p>
    </div>
  );
}

function UnitPill({ unit, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "0.2rem 0.6rem", border: "none", borderRadius: 5,
      background: active ? "#fff" : "transparent",
      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
      color: active ? "#1C1C1C" : "#AAAAAA",
      fontSize: "0.65rem", fontWeight: active ? 700 : 500,
      cursor: "pointer", fontFamily: "'DM Mono'", transition: "all 0.12s",
    }}>
      {unit}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PEGCalculator() {
  const [pegType,  setPegType]  = useState(6000);
  const [mode,     setMode]     = useState("fwd");  // fwd | rev
  const [psiUnit,  setPsiUnit]  = useState("bar");  // bar | mpa
  const [temp,     setTemp]     = useState(20);
  const [psiInput, setPsiInput] = useState(-4);
  const [concInput,setConcInput]= useState(169);
  const [result,   setResult]   = useState(null);
  const [limited,  setLimited]  = useState(false);

  // ── Recalculate whenever any input changes ──────────────────────────────────
  useEffect(() => {
    const k = COEFF[pegType];
    const T = parseFloat(temp) || 20;

    if (mode === "fwd") {
      const raw    = parseFloat(psiInput);
      if (isNaN(raw)) { setResult(null); return; }
      const inBar  = psiUnit === "bar" ? raw : raw * 10;
      const minR   = minPsi(T, k);
      let W; let lim = false;
      if (inBar < minR.psi) { W = minR.W; lim = true; }
      else                  { W = solveW(inBar, T, k); }
      const achieved = psiBar(W, T, k);
      setLimited(lim);
      setResult({
        kind: "fwd",
        gL:   (W * 10).toFixed(2),
        gcc:  (W / 100).toFixed(5),
        bar:  achieved.toFixed(3),
        mpa:  (achieved * 0.1).toFixed(4),
        hint: psiUnit === "bar"
          ? `= ${(inBar * 0.1).toFixed(4)} MPa`
          : `= ${(raw * 10).toFixed(3)} bar`,
      });
    } else {
      const C = parseFloat(concInput);
      if (isNaN(C) || C < 0) { setResult(null); return; }
      const W   = C / 10;
      const pb  = psiBar(W, T, k);
      setLimited(false);
      setResult({
        kind: "rev",
        bar:  pb.toFixed(3),
        mpa:  (pb * 0.1).toFixed(4),
      });
    }
  }, [pegType, mode, psiUnit, temp, psiInput, concInput]);

  // ── Unit conversion when pill toggles ──────────────────────────────────────
  const handlePsiUnitToggle = (u) => {
    const cur = parseFloat(psiInput) || 0;
    if (u === "mpa" && psiUnit === "bar") setPsiInput((cur * 0.1).toFixed(3));
    if (u === "bar" && psiUnit === "mpa") setPsiInput((cur * 10).toFixed(2));
    setPsiUnit(u);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card = {
    background: "#fff", borderRadius: 13,
    border: "1.5px solid #EBEBEB", padding: "1.1rem 1.15rem",
  };
  const inp = {
    width: "100%", border: "1.5px solid #E8E8E8", borderRadius: 8,
    padding: "0.42rem 0.7rem", fontSize: "0.82rem", color: "#1C1C1C",
    background: "#FAFAFA", boxSizing: "border-box", outline: "none",
    fontFamily: "'DM Mono', monospace",
  };
  const modeBtn = (active) => ({
    flex: 1, padding: "0.6rem 0.5rem", border: "none",
    background: active ? "#fff" : "transparent",
    borderBottom: active ? "2px solid #2D9E5F" : "2px solid transparent",
    color: active ? "#2D9E5F" : "#AAAAAA",
    fontSize: "0.74rem", fontWeight: active ? 700 : 500,
    cursor: "pointer", transition: "all 0.15s",
  });
  const pegBtn = (active) => ({
    padding: "0.28rem 0.8rem", borderRadius: 7,
    border: `1.5px solid ${active ? "#2D9E5F" : "#E5E5E5"}`,
    background: active ? "#EAF8F0" : "#FAFAFA",
    color: active ? "#1B7A4A" : "#AAAAAA",
    fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
    fontFamily: "'DM Mono'", transition: "all 0.15s",
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5",
                  fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#1C1C1C", padding: "1rem 2rem",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span style={{ fontSize: 20, color: "#2D9E5F" }}>◌</span>
          <div>
            <h1 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>
              PEG Osmotic Potential Calculator
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.45)",
                        fontSize: "0.65rem", fontFamily: "'DM Mono'" }}>
              Michel &amp; Kaufmann (1973) · Plant Physiology 51:914–916
            </p>
          </div>
        </div>
        {/* PEG type toggle */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {[6000, 8000].map(p => (
            <button key={p} onClick={() => setPegType(p)} style={pegBtn(pegType === p)}>
              PEG {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Mode tabs */}
        <div style={{ ...card, padding: 0, marginBottom: "1rem", overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #F0F0F0",
                        background: "#FAFAFA" }}>
            <button style={modeBtn(mode === "fwd")} onClick={() => setMode("fwd")}>
              Ψ → g/L &nbsp;<span style={{ opacity: 0.5, fontWeight: 400 }}>
                (target → concentration)
              </span>
            </button>
            <button style={modeBtn(mode === "rev")} onClick={() => setMode("rev")}>
              g/L → Ψ &nbsp;<span style={{ opacity: 0.5, fontWeight: 400 }}>
                (concentration → achieved)
              </span>
            </button>
          </div>

          <div style={{ padding: "1.1rem 1.15rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

              {/* Temperature */}
              <div>
                <SectionLabel>Temperature (°C)</SectionLabel>
                <input type="number" value={temp} min={0} max={45} step={0.5}
                       style={inp}
                       onChange={e => setTemp(e.target.value)} />
              </div>

              {/* Ψ input (forward mode) */}
              {mode === "fwd" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center",
                                justifyContent: "space-between", marginBottom: "0.45rem" }}>
                    <SectionLabel>Water potential (Ψ)</SectionLabel>
                    <div style={{ display: "flex", gap: 2, background: "#F0F0F0",
                                  borderRadius: 7, padding: 2 }}>
                      <UnitPill unit="bar" active={psiUnit === "bar"}
                                onClick={() => handlePsiUnitToggle("bar")} />
                      <UnitPill unit="MPa" active={psiUnit === "mpa"}
                                onClick={() => handlePsiUnitToggle("mpa")} />
                    </div>
                  </div>
                  <input type="number" value={psiInput} step={psiUnit === "bar" ? 0.1 : 0.01}
                         style={inp}
                         onChange={e => setPsiInput(e.target.value)} />
                  {result?.hint && (
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.62rem",
                                color: "#AAAAAA", fontFamily: "'DM Mono'" }}>
                      {result.hint}
                    </p>
                  )}
                </div>
              )}

              {/* Concentration input (reverse mode) */}
              {mode === "rev" && (
                <div>
                  <SectionLabel>Concentration (g / L water)</SectionLabel>
                  <input type="number" value={concInput} min={0} max={500} step={1}
                         style={inp}
                         onChange={e => setConcInput(e.target.value)} />
                </div>
              )}
            </div>

            {/* Limit warning */}
            {limited && (
              <div style={{ marginTop: "0.85rem", background: "#FAEEDA",
                            borderRadius: 8, padding: "0.6rem 0.9rem",
                            fontSize: "0.72rem", color: "#854F0B", fontWeight: 500 }}>
                ⚠ Target Ψ is more negative than achievable at {temp}°C with PEG {pegType}.
                Showing the closest achievable concentration.
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: "grid",
                        gridTemplateColumns: mode === "fwd" ? "1fr 1fr 1fr 1fr" : "1fr 1fr",
                        gap: "0.75rem", marginBottom: "1.5rem" }}>
            {mode === "fwd" ? (
              <>
                <ResultCard label="g / L water"  value={result.gL}  unit="g/L"  accent />
                <ResultCard label="g / cc water" value={result.gcc} unit="g/cc" accent />
                <ResultCard label="Achieved Ψ"   value={result.bar} unit="bar" />
                <ResultCard label="Achieved Ψ"   value={result.mpa} unit="MPa" />
              </>
            ) : (
              <>
                <ResultCard label="Water potential Ψ" value={result.bar} unit="bar" accent />
                <ResultCard label="Water potential Ψ" value={result.mpa} unit="MPa" accent />
              </>
            )}
          </div>
        )}

        {/* Citation footer */}
        <div style={{ fontSize: "0.65rem", color: "#CCCCCC", lineHeight: 1.7,
                      fontFamily: "'DM Mono'", borderTop: "1px solid #EBEBEB",
                      paddingTop: "0.85rem" }}>
          <p style={{ margin: "0 0 0.2rem" }}>
            Ψ(bar) = −1.18W + 0.0354W² + (0.0351W − 0.00106W²)·T
            &nbsp;|&nbsp; W = g PEG / 100 g water
          </p>
          <p style={{ margin: 0 }}>
            Michel &amp; Kaufmann (1973) Plant Physiol 51:914–916 &nbsp;·&nbsp;
            Steuter et al. (1981) Plant Physiol 67:64–67 (PEG 8000)
          </p>
        </div>
      </div>
    </div>
  );
}
