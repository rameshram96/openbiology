import { useState, useRef } from "react";

const API_BASE = "https://openbiology-backend.onrender.com";

// ─── Constants ────────────────────────────────────────────────────────────────

const SHAPES = [
  { id: "circle",   glyph: "●" },
  { id: "triangle", glyph: "▲" },
  { id: "square",   glyph: "■" },
  { id: "diamond",  glyph: "◆" },
  { id: "cross",    glyph: "✚" },
];

const PLOT_TABS = [
  { id: "scree",   label: "Scree",         titleKey: "screeTitle"   },
  { id: "scores",  label: "Score Plot",    titleKey: "scoreTitle"   },
  { id: "biplot",  label: "Biplot",        titleKey: "biplotTitle"  },
  { id: "loading", label: "Loading Map",   titleKey: "loadingTitle" },
];

const DEFAULT_PARAMS = {
  scale:        true,
  nComponents:  5,
  pcX:          1,
  pcY:          2,
  pointSize:    6,
  pointShape:   "circle",
  showGrid:     true,
  screeTitle:   "Scree Plot",
  scoreTitle:   "PCA Score Plot",
  biplotTitle:  "PCA Biplot",
  loadingTitle: "PCA Loadings Heatmap",
};

// ─── Small components ─────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{ margin: "0 0 0.5rem", fontSize: "0.61rem", fontWeight: 700,
                color: "#AAAAAA", textTransform: "uppercase", letterSpacing: 1.2,
                fontFamily: "'DM Mono', monospace" }}>
      {children}
    </p>
  );
}

function Toggle({ active, onToggle, label }) {
  return (
    <button onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: "0.35rem",
      padding: "0.3rem 0.65rem", borderRadius: 8, fontSize: "0.7rem",
      fontWeight: 600, cursor: "pointer", userSelect: "none",
      border: `1.5px solid ${active ? "#0072B2" : "#E5E5E5"}`,
      background: active ? "#EAF5FF" : "#FAFAFA",
      color: active ? "#0072B2" : "#AAAAAA",
      transition: "all 0.15s",
    }}>
      <span style={{ fontSize: "0.52rem" }}>{active ? "●" : "○"}</span>
      {label}
    </button>
  );
}

function StatBadge({ label, value, color = "#555" }) {
  return (
    <div style={{ textAlign: "center", padding: "0 0.6rem" }}>
      <div style={{ fontSize: "0.57rem", color: "#CCCCCC", fontFamily: "'DM Mono'",
                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: "0.88rem", fontWeight: 700, color,
                    fontFamily: "'DM Mono'" }}>
        {value}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PCAModule() {
  const [file,         setFile]         = useState(null);
  const [numericCols,  setNumericCols]  = useState([]);
  const [categoryCols, setCategoryCols] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [groupCol,     setGroupCol]     = useState("");
  const [params,       setParams]       = useState(DEFAULT_PARAMS);
  const [pending,      setPending]      = useState(DEFAULT_PARAMS);
  const [result,       setResult]       = useState(null);
  const [sessionId,    setSessionId]    = useState(null);
  const [activeTab,    setActiveTab]    = useState("scree");
  const [plotKey,      setPlotKey]      = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [replotting,   setReplotting]   = useState(false);
  const [dirty,        setDirty]        = useState(false);
  const [error,        setError]        = useState("");

  const fileRef = useRef();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set = (key, val) => {
    setPending(p => ({ ...p, [key]: val }));
    if (sessionId) setDirty(true);
  };

  const isVisualOnly = (key) =>
    ["pcX","pcY","pointSize","pointShape","showGrid",
     "screeTitle","scoreTitle","biplotTitle","loadingTitle"].includes(key);

  // Changing scale/nComponents/selected cols requires re-analysis
  // Changing visual params only needs replot
  const needsReanalysis = () =>
    pending.scale      !== params.scale      ||
    pending.nComponents !== params.nComponents;

  const buildFormData = (p) => {
    const fd = new FormData();
    fd.append("pc_x",          p.pcX);
    fd.append("pc_y",          p.pcY);
    fd.append("point_size",    p.pointSize);
    fd.append("point_shape",   p.pointShape);
    fd.append("show_grid",     p.showGrid);
    fd.append("scree_title",   p.screeTitle);
    fd.append("score_title",   p.scoreTitle);
    fd.append("biplot_title",  p.biplotTitle);
    fd.append("loading_title", p.loadingTitle);
    return fd;
  };

  // ── File upload ────────────────────────────────────────────────────────────

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setSessionId(null);
    setError("");
    setDirty(false);
    setNumericCols([]);
    setCategoryCols([]);
    setSelectedCols([]);
    setGroupCol("");

    const fd = new FormData();
    fd.append("file", f);
    try {
      const res  = await fetch(`${API_BASE}/api/pca/columns`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not read file");
      setNumericCols(data.numeric_cols);
      setCategoryCols(data.categorical_cols);
      setSelectedCols(data.numeric_cols);   // all selected by default
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCol = (col) => {
    setSelectedCols(prev =>
      prev.includes(col)
        ? prev.length > 2 ? prev.filter(c => c !== col) : prev  // keep min 2
        : [...prev, col]
    );
    if (sessionId) setDirty(true);
  };

  // ── Analyse ────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!file || selectedCols.length < 2) return;
    setLoading(true);
    setError("");

    const fd = buildFormData(pending);
    fd.append("file",           file);
    fd.append("selected_cols",  JSON.stringify(selectedCols));
    fd.append("group_col",      groupCol);
    fd.append("scale",          pending.scale);
    fd.append("n_components",   pending.nComponents);

    try {
      const res  = await fetch(`${API_BASE}/api/pca/analyze`, { method: "POST", body: fd });
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
    setReplotting(true);
    setError("");

    const fd = buildFormData(pending);
    try {
      const res = await fetch(`${API_BASE}/api/pca/replot/${sessionId}`,
                              { method: "POST", body: fd });
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
      setReplotting(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const canAnalyze   = file && selectedCols.length >= 2 && !loading && !replotting;
  const analysed     = !!result;
  const dirtyVisOnly = dirty && !needsReanalysis();

  const btnLabel = loading    ? "Running PCA…"
                 : replotting ? "Updating…"
                 : analysed && dirty && needsReanalysis() ? "⟳ Re-analyse"
                 : analysed && dirty ? "⟳ Update Plots"
                 : analysed ? "✓ Up to date"
                 : "▶ Run PCA";

  const btnBg = !canAnalyze ? "#E5E5E5"
              : analysed && dirty && needsReanalysis() ? "#D55E00"
              : analysed && dirty ? "#E69F00"
              : analysed ? "#009E73"
              : "#0072B2";

  const pcOptions = result
    ? Array.from({ length: result.n_components }, (_, i) => i + 1)
    : [1, 2, 3, 4, 5];

  // ── Styles ─────────────────────────────────────────────────────────────────

  const card = { background: "#fff", borderRadius: 12,
                 border: "1.5px solid #EBEBEB", padding: "1rem 1.1rem" };
  const inp  = { width: "100%", border: "1.5px solid #E8E8E8", borderRadius: 8,
                 padding: "0.38rem 0.65rem", fontSize: "0.76rem", color: "#1C1C1C",
                 background: "#FAFAFA", boxSizing: "border-box", outline: "none",
                 fontFamily: "'DM Sans', sans-serif" };
  const sel  = { ...inp, cursor: "pointer" };
  const div  = { height: 1, background: "#F0F0F0", margin: "0.8rem 0" };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5",
                  fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#1C1C1C", padding: "1rem 2rem",
                    display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <span style={{ fontSize: 20, color: "#009E73" }}>◎</span>
        <div>
          <h1 style={{ margin: 0, color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>
            Principal Component Analysis
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.65rem",
                      fontFamily: "'DM Mono'" }}>
            Scree · Score · Biplot · Loading Heatmap
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "1.5rem",
                    display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>

        {/* ─────────── Left: Controls ─────────────────────────────────── */}
        <div style={{ width: 295, flexShrink: 0, display: "flex",
                      flexDirection: "column", gap: "0.75rem" }}>

          {/* 1. Data */}
          <div style={card}>
            <SectionLabel>📂 Data</SectionLabel>
            <div onClick={() => fileRef.current.click()} style={{
              border: `2px dashed ${file ? "#0072B2" : "#DDDDDD"}`,
              borderRadius: 10, padding: "0.9rem", textAlign: "center",
              cursor: "pointer", background: file ? "#EAF5FF" : "#FAFAFA",
              transition: "all 0.18s",
            }}>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
                     style={{ display: "none" }} onChange={handleFile} />
              <p style={{ margin: 0, fontSize: "0.72rem",
                          color: file ? "#0072B2" : "#BBBBBB",
                          fontWeight: file ? 600 : 400 }}>
                {file ? `📄 ${file.name}` : "Click to upload CSV or Excel"}
              </p>
            </div>

            {/* Column checklist */}
            {numericCols.length > 0 && (
              <>
                <div style={div} />
                <SectionLabel>Include columns ({selectedCols.length}/{numericCols.length})</SectionLabel>
                <div style={{ maxHeight: 160, overflowY: "auto",
                              border: "1px solid #F0F0F0", borderRadius: 8,
                              padding: "0.4rem 0.55rem",
                              display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {numericCols.map(col => (
                    <label key={col} style={{ display: "flex", alignItems: "center",
                                             gap: "0.45rem", cursor: "pointer",
                                             fontSize: "0.74rem", color: "#444" }}>
                      <input type="checkbox"
                             checked={selectedCols.includes(col)}
                             onChange={() => toggleCol(col)}
                             style={{ accentColor: "#0072B2", width: 13, height: 13 }} />
                      <span style={{ fontFamily: "'DM Mono'", fontSize: "0.68rem",
                                     color: selectedCols.includes(col) ? "#1C1C1C" : "#BBBBBB" }}>
                        {col}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Group colour column */}
            {categoryCols.length > 0 && (
              <>
                <div style={div} />
                <SectionLabel>Group / colour by</SectionLabel>
                <select value={groupCol} onChange={e => { setGroupCol(e.target.value); if (sessionId) setDirty(true); }}
                        style={sel}>
                  <option value="">— none —</option>
                  {categoryCols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
          </div>

          {/* 2. PCA settings */}
          <div style={card}>
            <SectionLabel>⚙ PCA Settings</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <Toggle active={pending.scale}
                      onToggle={() => set("scale", !pending.scale)}
                      label="Standardise (Z-score)" />
              <div>
                <p style={{ margin: "0 0 0.3rem", fontSize: "0.6rem", color: "#CCCCCC",
                            fontFamily: "'DM Mono'" }}>
                  MAX PCs — {pending.nComponents}
                </p>
                <input type="range" min={2} max={10} step={1}
                       value={pending.nComponents}
                       onChange={e => set("nComponents", parseInt(e.target.value))}
                       style={{ width: "100%", accentColor: "#009E73" }} />
              </div>
            </div>
          </div>

          {/* 3. Axes (score + biplot) */}
          <div style={card}>
            <SectionLabel>🔭 Plot Axes (Score & Biplot)</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[["pcX", "X axis"], ["pcY", "Y axis"]].map(([key, label]) => (
                <div key={key}>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.6rem",
                              color: "#CCCCCC", fontFamily: "'DM Mono'" }}>{label}</p>
                  <select value={pending[key]}
                          onChange={e => set(key, parseInt(e.target.value))}
                          style={sel}>
                    {pcOptions.map(n => (
                      <option key={n} value={n}>PC{n}
                        {result ? ` (${(result.explained[n-1]*100).toFixed(1)}%)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Point style */}
          <div style={card}>
            <SectionLabel>● Point Style</SectionLabel>
            <div style={{ display: "flex", gap: "0.28rem", marginBottom: "0.55rem" }}>
              {SHAPES.map(s => (
                <button key={s.id} title={s.id} onClick={() => set("pointShape", s.id)} style={{
                  width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                  fontSize: "0.85rem",
                  border: `1.5px solid ${pending.pointShape === s.id ? "#009E73" : "#E8E8E8"}`,
                  background: pending.pointShape === s.id ? "#E8F8F3" : "#FAFAFA",
                  color: pending.pointShape === s.id ? "#009E73" : "#AAAAAA",
                  transition: "all 0.13s",
                }}>{s.glyph}</button>
              ))}
            </div>
            <p style={{ margin: "0 0 0.28rem", fontSize: "0.6rem",
                        color: "#CCCCCC", fontFamily: "'DM Mono'" }}>
              SIZE — {pending.pointSize}
            </p>
            <input type="range" min={3} max={14} step={0.5}
                   value={pending.pointSize}
                   onChange={e => set("pointSize", parseFloat(e.target.value))}
                   style={{ width: "100%", accentColor: "#009E73" }} />
          </div>

          {/* 5. Titles & grid */}
          <div style={card}>
            <SectionLabel>🏷 Plot Titles & Grid</SectionLabel>
            {[
              ["screeTitle",   "Scree plot title"],
              ["scoreTitle",   "Score plot title"],
              ["biplotTitle",  "Biplot title"],
              ["loadingTitle", "Loading heatmap title"],
            ].map(([key, ph]) => (
              <input key={key} placeholder={ph} value={pending[key]}
                     onChange={e => set(key, e.target.value)}
                     style={{ ...inp, marginBottom: "0.38rem" }} />
            ))}
            <Toggle active={pending.showGrid}
                    onToggle={() => set("showGrid", !pending.showGrid)}
                    label="Grid lines" />
          </div>

          {/* Run button */}
          <button
            onClick={analysed && dirty && !needsReanalysis() ? handleReplot : handleAnalyze}
            disabled={!canAnalyze}
            style={{
              width: "100%", padding: "0.72rem", borderRadius: 10, border: "none",
              background: btnBg,
              color: !canAnalyze ? "#BBBBBB" : "#fff",
              fontSize: "0.82rem", fontWeight: 700, letterSpacing: 0.3,
              cursor: !canAnalyze ? "not-allowed" : "pointer",
              transition: "background 0.18s",
            }}>
            {btnLabel}
          </button>
        </div>

        {/* ─────────── Right: Results ──────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9rem" }}>

          {error && (
            <div style={{ background: "#FFF5F5", border: "1.5px solid #FFCCCC",
                          borderRadius: 10, padding: "0.7rem 1rem",
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
              <span style={{ fontSize: 34, opacity: 0.2 }}>◎</span>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#CCCCCC" }}>
                Upload a file and click Run PCA
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#DDDDDD" }}>
                Scree, Score, Biplot, and Loading Heatmap will appear here
              </p>
            </div>
          )}

          {loading && (
            <div style={{ background: "#fff", borderRadius: 14,
                          border: "1.5px solid #EBEBEB",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "5rem" }}>
              <span style={{ fontSize: "0.88rem", color: "#009E73", fontWeight: 500 }}>
                Running PCA…
              </span>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Variance explained summary row */}
              <div style={{ background: "#fff", borderRadius: 12,
                            border: "1.5px solid #EBEBEB",
                            padding: "0.85rem 1.25rem",
                            display: "flex", gap: "0", alignItems: "center",
                            flexWrap: "wrap", overflowX: "auto" }}>
                {result.explained.map((v, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <StatBadge
                      label={`PC${i+1}`}
                      value={`${(v*100).toFixed(1)}%`}
                      color={i < 2 ? "#009E73" : "#888"}
                    />
                    {i < result.explained.length - 1 && (
                      <div style={{ width: 1, height: 28, background: "#F0F0F0",
                                    margin: "0 0.1rem" }} />
                    )}
                  </div>
                ))}
                <div style={{ marginLeft: "auto", fontSize: "0.65rem",
                              color: "#AAAAAA", fontFamily: "'DM Mono'",
                              whiteSpace: "nowrap", paddingLeft: "1rem" }}>
                  n={result.n} · p={result.p} · {result.scale ? "scaled" : "unscaled"}
                </div>
              </div>

              {/* Plot tabs */}
              <div style={{ background: "#fff", borderRadius: 14,
                            border: "1.5px solid #EBEBEB", overflow: "hidden" }}>

                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid #F0F0F0",
                              background: "#FAFAFA" }}>
                  {PLOT_TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      flex: 1, padding: "0.65rem 0.5rem", border: "none",
                      background: activeTab === t.id ? "#fff" : "transparent",
                      borderBottom: activeTab === t.id
                        ? "2px solid #009E73" : "2px solid transparent",
                      color: activeTab === t.id ? "#009E73" : "#AAAAAA",
                      fontSize: "0.72rem", fontWeight: activeTab === t.id ? 700 : 500,
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Plot image */}
                <div style={{ position: "relative" }}>
                  {replotting && (
                    <div style={{ position: "absolute", inset: 0, zIndex: 5,
                                  background: "rgba(255,255,255,0.75)",
                                  display: "flex", alignItems: "center",
                                  justifyContent: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "#009E73",
                                     fontWeight: 600 }}>Updating…</span>
                    </div>
                  )}
                  <img
                    key={`${activeTab}-${plotKey}`}
                    src={`${API_BASE}/api/pca/preview/${sessionId}/${activeTab}?t=${plotKey}`}
                    alt={activeTab}
                    style={{ width: "100%", display: "block" }}
                  />
                </div>

                {/* Download row per tab */}
                <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #F5F5F5",
                              display: "flex", gap: "0.45rem", justifyContent: "flex-end",
                              alignItems: "center" }}>
                  <span style={{ fontSize: "0.62rem", color: "#CCCCCC",
                                 fontFamily: "'DM Mono'", marginRight: "0.25rem" }}>
                    Download:
                  </span>
                  {["png", "svg"].map(fmt => (
                    <a key={fmt}
                       href={`${API_BASE}/api/pca/download/${sessionId}/${activeTab}_${fmt}`}
                       download={`${activeTab}.${fmt}`}
                       style={{ padding: "0.32rem 0.75rem", borderRadius: 7,
                                border: "1.5px solid #009E73", background: "#E8F8F3",
                                color: "#009E73", fontSize: "0.65rem", fontWeight: 700,
                                textDecoration: "none", fontFamily: "'DM Mono'" }}>
                      ↓ {fmt.toUpperCase()}
                    </a>
                  ))}
                  <div style={{ width: 1, height: 20, background: "#E8E8E8",
                                margin: "0 0.2rem" }} />
                  <a href={`${API_BASE}/api/pca/download/${sessionId}/excel`}
                     download="pca_results.xlsx"
                     style={{ padding: "0.32rem 0.75rem", borderRadius: 7,
                              border: "1.5px solid #0072B2", background: "#EAF5FF",
                              color: "#0072B2", fontSize: "0.65rem", fontWeight: 700,
                              textDecoration: "none", fontFamily: "'DM Mono'" }}>
                    ↓ Excel
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
