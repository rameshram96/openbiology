import { useState, useRef } from "react";

const API_BASE = "https://openbiology-backend.onrender.com";

// ─── Constants ────────────────────────────────────────────────────────────────

const SWATCHES = [
  { name: "Steel Blue",   hex: "#2166AC" },
  { name: "Crimson",      hex: "#D6604D" },
  { name: "Forest Green", hex: "#1A7741" },
  { name: "Orange",       hex: "#E69F00" },
  { name: "Purple",       hex: "#762A83" },
  { name: "Teal",         hex: "#009E73" },
  { name: "Slate Grey",   hex: "#737373" },
  { name: "Black",        hex: "#1C1C1C" },
];

const SHAPES = [
  { id: "circle",   glyph: "●" },
  { id: "triangle", glyph: "▲" },
  { id: "square",   glyph: "■" },
  { id: "diamond",  glyph: "◆" },
  { id: "cross",    glyph: "✚" },
];

const DEFAULT_PARAMS = {
  lineColor:     "#2166AC",
  showCi:        true,
  pointColor:    "#444444",
  pointSize:     6,
  pointShape:    "circle",
  plotTitle:     "",
  xLabel:        "",
  yLabel:        "",
  showGrid:      true,
  showEquation:  false,
  showN:         false,
};

// ─── Small reusable pieces ────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{ margin: "0 0 0.55rem", fontSize: "0.62rem", fontWeight: 700,
                color: "#AAAAAA", textTransform: "uppercase", letterSpacing: 1.2,
                fontFamily: "'DM Mono', monospace" }}>
      {children}
    </p>
  );
}

function SwatchRow({ selected, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.38rem" }}>
      {SWATCHES.map(s => (
        <div key={s.hex} title={s.name} onClick={() => onChange(s.hex)}
          style={{ width: 22, height: 22, borderRadius: "50%", background: s.hex,
                   cursor: "pointer", flexShrink: 0,
                   border: `2.5px solid ${selected === s.hex ? "#1C1C1C" : "transparent"}`,
                   boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                   transition: "border 0.12s" }} />
      ))}
    </div>
  );
}

function Toggle({ active, onToggle, labelOn, labelOff }) {
  return (
    <button onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: "0.35rem",
      padding: "0.32rem 0.7rem", borderRadius: 8, fontSize: "0.7rem",
      fontWeight: 600, cursor: "pointer",
      border: `1.5px solid ${active ? "#0072B2" : "#E5E5E5"}`,
      background: active ? "#EAF5FF" : "#FAFAFA",
      color: active ? "#0072B2" : "#AAAAAA",
      transition: "all 0.15s", userSelect: "none",
    }}>
      <span style={{ fontSize: "0.55rem" }}>{active ? "●" : "○"}</span>
      {active ? labelOn : labelOff}
    </button>
  );
}

function StatCell({ label, value, color, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "0 0.75rem" }}>
      <div style={{ fontSize: "0.58rem", color: "#BBBBBB", fontFamily: "'DM Mono'",
                    textTransform: "uppercase", letterSpacing: 1.1, marginBottom: "0.18rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.05rem", fontWeight: 700, color, fontFamily: "'DM Mono'",
                    lineHeight: 1 }}>
        {value}
        {sub && <span style={{ fontSize: "0.62rem", marginLeft: 2, opacity: 0.8 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TwoVarCorrelation() {
  const [file,          setFile]          = useState(null);
  const [columns,       setColumns]       = useState([]);
  const [autoSelect,    setAutoSelect]    = useState(false);
  const [xCol,          setXCol]          = useState("");
  const [yCol,          setYCol]          = useState("");
  const [params,        setParams]        = useState(DEFAULT_PARAMS);   // last-rendered params
  const [pending,       setPending]       = useState(DEFAULT_PARAMS);   // controls state
  const [result,        setResult]        = useState(null);
  const [sessionId,     setSessionId]     = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [replotLoading, setReplotLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [plotKey,       setPlotKey]       = useState(0);
  const [dirty,         setDirty]         = useState(false);   // pending ≠ rendered

  const fileRef = useRef();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set = (key, val) => {
    setPending(p => ({ ...p, [key]: val }));
    if (sessionId) setDirty(true);
  };

  const buildForm = (p, extraEntries = {}) => {
    const fd = new FormData();
    fd.append("line_color",    p.lineColor);
    fd.append("show_ci",       p.showCi);
    fd.append("point_color",   p.pointColor);
    fd.append("point_size",    p.pointSize);
    fd.append("point_shape",   p.pointShape);
    fd.append("plot_title",    p.plotTitle);
    fd.append("x_label",       p.xLabel);
    fd.append("y_label",       p.yLabel);
    fd.append("show_grid",     p.showGrid);
    fd.append("show_equation", p.showEquation);
    fd.append("show_n",        p.showN);
    Object.entries(extraEntries).forEach(([k, v]) => fd.append(k, v));
    return fd;
  };

  const formatP = (p) => (p < 0.001 ? "< 0.001" : p.toFixed(4));
  const stars   = (p) => (p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : "ns");
  const rColor  = (r) => (Math.abs(r) > 0.7 ? "#009E73" : Math.abs(r) > 0.4 ? "#E69F00" : "#888");

  // ── File upload ────────────────────────────────────────────────────────────

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setSessionId(null);
    setError("");
    setDirty(false);

    const fd = new FormData();
    fd.append("file", f);

    try {
      const res  = await fetch(`${API_BASE}/api/two-var-correlation/columns`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not read file");

      setColumns(data.columns);
      setAutoSelect(data.auto);

      if (data.auto) {
        setXCol(data.columns[0]);
        setYCol(data.columns[1]);
        setPending(p => ({ ...p,
          xLabel: data.columns[0],
          yLabel: data.columns[1],
        }));
      } else {
        setXCol("");
        setYCol("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSwap = () => {
    setXCol(prev => { setYCol(xCol); return yCol; });
    // also swap the labels if they were auto-populated
    setPending(p => ({ ...p, xLabel: p.yLabel, yLabel: p.xLabel }));
    if (sessionId) setDirty(true);
  };

  // ── Analyze ────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!file || !xCol || !yCol) return;
    setLoading(true);
    setError("");

    const fd = buildForm(pending, { x_col: xCol, y_col: yCol });
    fd.append("file", file);

    try {
      const res  = await fetch(`${API_BASE}/api/two-var-correlation/analyze`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");

      setResult(data);
      setSessionId(data.session_id);
      setParams({ ...pending });
      setPlotKey(k => k + 1);
      setDirty(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Replot ─────────────────────────────────────────────────────────────────

  const handleReplot = async () => {
    if (!sessionId) return;
    setReplotLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/two-var-correlation/replot/${sessionId}`,
                              { method: "POST", body: buildForm(pending) });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Replot failed");
      }
      setParams({ ...pending });
      setPlotKey(k => k + 1);
      setDirty(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setReplotLoading(false);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const canAnalyze   = file && xCol && yCol && !loading && !replotLoading;
  const analysed     = !!result;

  const btnLabel = loading ? "Analysing…"
                 : replotLoading ? "Updating…"
                 : analysed && dirty ? "⟳ Update Plot"
                 : analysed ? "✓ Plot Current"
                 : "▶ Analyse";

  const btnBg    = !canAnalyze ? "#E5E5E5"
                 : analysed && dirty ? "#E69F00"
                 : "#0072B2";

  // ── Styles ─────────────────────────────────────────────────────────────────

  const card  = { background: "#fff", borderRadius: 13, border: "1.5px solid #EBEBEB", padding: "1.1rem 1.15rem" };
  const inp   = { width: "100%", border: "1.5px solid #E8E8E8", borderRadius: 8,
                  padding: "0.42rem 0.7rem", fontSize: "0.78rem", color: "#1C1C1C",
                  background: "#FAFAFA", boxSizing: "border-box", outline: "none",
                  fontFamily: "'DM Sans', sans-serif" };
  const sel   = { ...inp, cursor: "pointer" };
  const divider = { height: 1, background: "#F0F0F0", margin: "0.85rem 0" };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5",
                  fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── Module header ──────────────────────────────────────────────── */}
      <div style={{ background: "#1C1C1C", padding: "1rem 2rem",
                    display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <span style={{ fontSize: 20, color: "#E69F00" }}>◈</span>
        <div>
          <h1 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>
            Two-Variable Correlation
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.65rem",
                      fontFamily: "'DM Mono'" }}>
            Scatter plot · Linear regression · Pearson r · R²
          </p>
        </div>
      </div>

      {/* ── Main layout: controls left, results right ──────────────────── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "1.5rem",
                    display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>

        {/* ────────────────── Left: Control Panel ──────────────────────── */}
        <div style={{ width: 295, flexShrink: 0, display: "flex",
                      flexDirection: "column", gap: "0.8rem" }}>

          {/* 1. Data upload */}
          <div style={card}>
            <SectionLabel>📂 Data</SectionLabel>

            <div onClick={() => fileRef.current.click()} style={{
              border: `2px dashed ${file ? "#0072B2" : "#DDDDDD"}`,
              borderRadius: 10, padding: "1rem", textAlign: "center",
              cursor: "pointer", background: file ? "#EAF5FF" : "#FAFAFA",
              transition: "all 0.18s",
            }}>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
                     style={{ display: "none" }} onChange={handleFile} />
              <p style={{ margin: 0, fontSize: "0.73rem",
                          color: file ? "#0072B2" : "#BBBBBB",
                          fontWeight: file ? 600 : 400 }}>
                {file ? `📄 ${file.name}` : "Click to upload CSV or Excel"}
              </p>
            </div>

            {/* Column selection — only if 3+ cols */}
            {columns.length > 0 && !autoSelect && (
              <div style={{ marginTop: "0.75rem", display: "flex",
                            flexDirection: "column", gap: "0.45rem" }}>
                <div>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.62rem", color: "#AAAAAA",
                               textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Mono'" }}>
                    X axis (independent)
                  </p>
                  <select value={xCol} onChange={e => setXCol(e.target.value)} style={sel}>
                    <option value="">— select column —</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.62rem", color: "#AAAAAA",
                               textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Mono'" }}>
                    Y axis (dependent)
                  </p>
                  <select value={yCol} onChange={e => setYCol(e.target.value)} style={sel}>
                    <option value="">— select column —</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Auto-selected column display + swap */}
            {columns.length > 0 && (
              <div style={{ marginTop: "0.7rem", display: "flex",
                            alignItems: "center", gap: "0.5rem" }}>
                {autoSelect && (
                  <div style={{ flex: 1, fontSize: "0.68rem", color: "#777",
                                fontFamily: "'DM Mono'" }}>
                    <span style={{ color: "#0072B2", fontWeight: 600 }}>X </span>{xCol}
                    {"  "}
                    <span style={{ color: "#009E73", fontWeight: 600 }}>Y </span>{yCol}
                  </div>
                )}
                <button onClick={handleSwap} style={{
                  padding: "0.3rem 0.65rem", borderRadius: 7,
                  border: "1.5px solid #E5E5E5", background: "#FAFAFA",
                  fontSize: "0.7rem", cursor: "pointer", color: "#555",
                  fontWeight: 600, whiteSpace: "nowrap",
                }}>⇄ Swap</button>
              </div>
            )}
          </div>

          {/* 2. Line style */}
          <div style={card}>
            <SectionLabel>🎨 Regression Line</SectionLabel>
            <SwatchRow selected={pending.lineColor} onChange={v => set("lineColor", v)} />
            <div style={divider} />
            <Toggle active={pending.showCi}
                    onToggle={() => set("showCi", !pending.showCi)}
                    labelOn="95% CI band ON"
                    labelOff="95% CI band OFF" />
          </div>

          {/* 3. Point style */}
          <div style={card}>
            <SectionLabel>● Point Style</SectionLabel>

            <p style={{ margin: "0 0 0.3rem", fontSize: "0.6rem", color: "#CCCCCC",
                        fontFamily: "'DM Mono'" }}>COLOR</p>
            <SwatchRow selected={pending.pointColor} onChange={v => set("pointColor", v)} />

            <div style={divider} />

            <p style={{ margin: "0 0 0.3rem", fontSize: "0.6rem", color: "#CCCCCC",
                        fontFamily: "'DM Mono'" }}>SHAPE</p>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {SHAPES.map(s => (
                <button key={s.id} title={s.id} onClick={() => set("pointShape", s.id)} style={{
                  width: 33, height: 33, borderRadius: 8, cursor: "pointer",
                  fontSize: "0.88rem", border: `1.5px solid ${pending.pointShape === s.id ? "#0072B2" : "#E8E8E8"}`,
                  background: pending.pointShape === s.id ? "#EAF5FF" : "#FAFAFA",
                  color: pending.pointShape === s.id ? "#0072B2" : "#AAAAAA",
                  transition: "all 0.13s",
                }}>
                  {s.glyph}
                </button>
              ))}
            </div>

            <div style={divider} />

            <p style={{ margin: "0 0 0.3rem", fontSize: "0.6rem", color: "#CCCCCC",
                        fontFamily: "'DM Mono'" }}>SIZE — {pending.pointSize}</p>
            <input type="range" min={3} max={14} step={0.5} value={pending.pointSize}
                   onChange={e => set("pointSize", parseFloat(e.target.value))}
                   style={{ width: "100%", accentColor: "#0072B2" }} />
          </div>

          {/* 4. Labels & grid */}
          <div style={card}>
            <SectionLabel>🏷 Labels & Grid</SectionLabel>
            {[
              ["plotTitle", "Plot title"],
              ["xLabel",    "X axis label"],
              ["yLabel",    "Y axis label"],
            ].map(([key, ph]) => (
              <input key={key} placeholder={ph} value={pending[key]}
                     onChange={e => set(key, e.target.value)}
                     style={{ ...inp, marginBottom: "0.42rem" }} />
            ))}
            <Toggle active={pending.showGrid}
                    onToggle={() => set("showGrid", !pending.showGrid)}
                    labelOn="Grid lines ON"
                    labelOff="Grid lines OFF" />
          </div>

          {/* 5. Statistics options */}
          <div style={card}>
            <SectionLabel>σ Statistics Display</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Toggle active={pending.showEquation}
                      onToggle={() => set("showEquation", !pending.showEquation)}
                      labelOn="Equation on plot"
                      labelOff="Equation on plot" />
              <Toggle active={pending.showN}
                      onToggle={() => set("showN", !pending.showN)}
                      labelOn="Show n in stats"
                      labelOff="Show n in stats" />
            </div>
          </div>

          {/* Analyse / Update button */}
          <button
            onClick={analysed && dirty ? handleReplot : handleAnalyze}
            disabled={!canAnalyze}
            style={{
              width: "100%", padding: "0.75rem", borderRadius: 10, border: "none",
              background: btnBg,
              color: !canAnalyze ? "#BBBBBB" : "#fff",
              fontSize: "0.82rem", fontWeight: 700, letterSpacing: 0.3,
              cursor: !canAnalyze ? "not-allowed" : "pointer",
              transition: "background 0.18s",
            }}>
            {btnLabel}
          </button>
        </div>

        {/* ────────────────── Right: Results ───────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Error */}
          {error && (
            <div style={{ background: "#FFF5F5", border: "1.5px solid #FFCCCC",
                          borderRadius: 10, padding: "0.75rem 1rem",
                          color: "#CC0000", fontSize: "0.78rem" }}>
              ⚠ {error}
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div style={{ background: "#fff", borderRadius: 14,
                          border: "1.5px dashed #E5E5E5",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          padding: "5rem 2rem", textAlign: "center", gap: "0.55rem" }}>
              <span style={{ fontSize: 34, opacity: 0.25 }}>◈</span>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#CCCCCC" }}>
                Upload a file and click Analyse
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#DDDDDD" }}>
                Scatter plot with regression line and stats will appear here
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #EBEBEB",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "5rem" }}>
              <span style={{ fontSize: "0.88rem", color: "#0072B2", fontWeight: 500 }}>
                Computing correlation…
              </span>
            </div>
          )}

          {/* Plot */}
          {result && !loading && (
            <>
              <div style={{ background: "#fff", borderRadius: 14,
                            border: "1.5px solid #EBEBEB", overflow: "hidden",
                            position: "relative" }}>
                {replotLoading && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 5,
                                background: "rgba(255,255,255,0.72)",
                                display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#0072B2", fontWeight: 600 }}>
                      Updating plot…
                    </span>
                  </div>
                )}
                <img
                  key={plotKey}
                  src={`${API_BASE}/api/two-var-correlation/preview/${sessionId}?t=${plotKey}`}
                  alt="Scatter plot"
                  style={{ width: "100%", display: "block" }}
                />
              </div>

              {/* Stats row */}
              <div style={{ background: "#fff", borderRadius: 12,
                            border: "1.5px solid #EBEBEB",
                            padding: "1rem 1.25rem",
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap", gap: "0.75rem" }}>

                {/* Stat cells */}
                <div style={{ display: "flex", alignItems: "center",
                              flexWrap: "wrap", gap: "0", borderRight: "1px solid #F0F0F0" }}>
                  <StatCell label="Pearson r"
                            value={result.r}
                            color={rColor(result.r)} />
                  <div style={{ width: 1, height: 32, background: "#F0F0F0" }} />
                  <StatCell label="R²"
                            value={result.r2}
                            color="#0072B2" />
                  <div style={{ width: 1, height: 32, background: "#F0F0F0" }} />
                  <StatCell label="p-value"
                            value={formatP(result.p_value)}
                            color={result.p_value < 0.05 ? "#009E73" : "#D55E00"}
                            sub={stars(result.p_value)} />
                  {params.showN && (
                    <>
                      <div style={{ width: 1, height: 32, background: "#F0F0F0" }} />
                      <StatCell label="n" value={result.n} color="#888888" />
                    </>
                  )}
                </div>

                {/* Download buttons */}
                <div style={{ display: "flex", gap: "0.45rem" }}>
                  {["png", "svg"].map(fmt => (
                    <a key={fmt}
                       href={`${API_BASE}/api/two-var-correlation/download/${sessionId}/${fmt}`}
                       download={`scatter_plot.${fmt}`}
                       style={{ padding: "0.4rem 0.9rem", borderRadius: 8,
                                border: "1.5px solid #0072B2", background: "#EAF5FF",
                                color: "#0072B2", fontSize: "0.68rem", fontWeight: 700,
                                textDecoration: "none", fontFamily: "'DM Mono'" }}>
                      ↓ {fmt.toUpperCase()}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
