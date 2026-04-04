import { useState, useRef } from "react";

const API_BASE = "";

const METHOD_INFO = {
  pearson:  { label: "Pearson",  desc: "Linear relationships, normally distributed data" },
  spearman: { label: "Spearman", desc: "Monotonic relationships, ordinal or non-normal data" },
  kendall:  { label: "Kendall",  desc: "Small samples, robust to outliers" },
};

const PALETTES = [
  { id: "RdBu",       label: "Red–Blue",       colors: ["#d73027","#ffffff","#4575b4"] },
  { id: "PRGn",       label: "Purple–Green",   colors: ["#762a83","#f7f7f7","#1b7837"] },
  { id: "PiYG",       label: "Pink–Green",     colors: ["#c51b7d","#f7f7f7","#4d9221"] },
  { id: "Colorblind", label: "Colorblind Safe",colors: ["#0072B2","#ffffff","#D55E00"] },
  { id: "Greyscale",  label: "Greyscale",      colors: ["#000000","#888888","#ffffff"] },
  { id: "Blues",      label: "Blues",          colors: ["#f7fbff","#6baed6","#08306b"] },
];

const RESOLUTIONS = [
  { id: 72,  label: "72 dpi", desc: "Screen / preview" },
  { id: 150, label: "150 dpi", desc: "Standard print" },
  { id: 300, label: "300 dpi", desc: "High-res / publication" },
];

const INPUT = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div style={{ marginBottom: "0.75rem" }}>
    <label style={{ display: "block", fontSize: "0.75rem", color: "#555", fontWeight: 600, marginBottom: 4 }}>{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "0.45rem 0.65rem", borderRadius: 7,
        border: "1px solid #D5D5D5", fontSize: "0.82rem",
        fontFamily: "inherit", boxSizing: "border-box", outline: "none",
        background: "#FAFAFA", color: "#1C1C1C",
      }}
    />
  </div>
);

export default function CorrelationModule() {
  const [file, setFile]             = useState(null);
  const [method, setMethod]         = useState("pearson");
  const [sigLevel, setSigLevel]     = useState(0.05);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [activeTab, setActiveTab]   = useState("matrix");

  // Graph customization
  const [palette, setPalette]       = useState("RdBu");
  const [axisFontSize, setAxisFontSize] = useState(0.85);
  const [showCoef, setShowCoef]     = useState(true);
  const [plotTitle, setPlotTitle]   = useState("");
  const [xLabel, setXLabel]         = useState("");
  const [yLabel, setYLabel]         = useState("");
  const [scatterDpi, setScatterDpi] = useState(150);
  const [showCustom, setShowCustom] = useState(false);

  const fileRef = useRef();

  const handleUpload = (e) => { const f = e.target.files[0]; if (f) setFile(f); setResult(null); setError(""); };
  const handleDrop   = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setResult(null); setError(""); } };

  const runAnalysis = async () => {
    if (!file) { setError("Please upload a file first."); return; }
    setLoading(true); setError(""); setResult(null);

    const form = new FormData();
    form.append("file",            file);
    form.append("method",          method);
    form.append("sig_level",       sigLevel);
    form.append("heatmap_palette", palette);
    form.append("axis_font_size",  axisFontSize);
    form.append("show_coef",       showCoef);
    form.append("plot_title",      plotTitle);
    form.append("x_label",         xLabel);
    form.append("y_label",         yLabel);
    form.append("scatter_dpi",     scatterDpi);
    form.append("scatter_width",   scatterDpi === 300 ? 1800 : scatterDpi === 72 ? 900 : 1200);
    form.append("scatter_height",  scatterDpi === 300 ? 1500 : scatterDpi === 72 ? 750 : 1000);

    try {
      const res  = await fetch(`${API_BASE}/api/correlation/analyze`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data); setActiveTab("matrix");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const download = (type) => { if (!result) return; window.open(`${API_BASE}/api/correlation/download/${result.session_id}/${type}`, "_blank"); };

  const getCorColor = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "#f5f5f5";
    const abs = Math.abs(val);
    if (val > 0) return `rgba(0,114,178,${0.1 + abs * 0.8})`;
    return `rgba(213,94,0,${0.1 + abs * 0.8})`;
  };
  const getTextColor = (val) => (!val && val !== 0) ? "#444" : Math.abs(val) > 0.55 ? "#fff" : "#222";

  const sectionStyle = { background: "#fff", borderRadius: 14, padding: "1.1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "0.9rem" };
  const labelStyle   = { fontWeight: 700, color: "#1C1C1C", fontSize: "0.82rem", display: "block", marginBottom: "0.65rem" };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#F7F7F5", padding: "1.75rem" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0072B2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⬡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#1C1C1C" }}>Correlation Analysis</h1>
            <p style={{ margin: 0, color: "#888", fontSize: "0.78rem" }}>Pearson · Spearman · Kendall</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem", alignItems: "start" }}>

          {/* LEFT PANEL */}
          <div>
            {/* Upload */}
            <div style={sectionStyle}>
              <label style={labelStyle}>📂 Data File</label>
              <div
                onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current.click()}
                style={{
                  border: `2px dashed ${file ? "#0072B2" : "#D5D5D5"}`, borderRadius: 10,
                  padding: "1.25rem", textAlign: "center", cursor: "pointer",
                  background: file ? "#E8F4FD" : "#FAFAFA", transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: 24, marginBottom: "0.3rem" }}>{file ? "✅" : "📊"}</div>
                <p style={{ margin: 0, color: file ? "#0072B2" : "#999", fontSize: "0.78rem", fontWeight: file ? 600 : 400 }}>
                  {file ? file.name : "Drop CSV or Excel\nor click to browse"}
                </p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} style={{ display: "none" }} />
            </div>

            {/* Method */}
            <div style={sectionStyle}>
              <label style={labelStyle}>📐 Method</label>
              {Object.entries(METHOD_INFO).map(([key, info]) => (
                <div key={key} onClick={() => setMethod(key)} style={{
                  border: `1.5px solid ${method === key ? "#0072B2" : "#E5E5E5"}`,
                  borderRadius: 9, padding: "0.55rem 0.8rem", marginBottom: "0.45rem",
                  cursor: "pointer", background: method === key ? "#E8F4FD" : "#FAFAFA", transition: "all 0.15s"
                }}>
                  <div style={{ fontWeight: 600, color: method === key ? "#0072B2" : "#333", fontSize: "0.82rem" }}>{info.label}</div>
                  <div style={{ color: "#888", fontSize: "0.72rem", marginTop: 1 }}>{info.desc}</div>
                </div>
              ))}
            </div>

            {/* Significance */}
            <div style={sectionStyle}>
              <label style={labelStyle}>⚗️ Significance (α)</label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {[0.001, 0.01, 0.05, 0.1].map(v => (
                  <button key={v} onClick={() => setSigLevel(v)} style={{
                    padding: "0.32rem 0.75rem", borderRadius: 7,
                    border: `1.5px solid ${sigLevel === v ? "#0072B2" : "#E0E0E0"}`,
                    background: sigLevel === v ? "#0072B2" : "#fff",
                    color: sigLevel === v ? "#fff" : "#555",
                    fontWeight: 600, fontSize: "0.78rem", cursor: "pointer"
                  }}>{v}</button>
                ))}
              </div>
            </div>

            {/* Graph Customization */}
            <div style={sectionStyle}>
              <div
                onClick={() => setShowCustom(!showCustom)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <label style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>🎨 Graph Options</label>
                <span style={{ color: "#0072B2", fontSize: "0.8rem" }}>{showCustom ? "▲ Hide" : "▼ Show"}</span>
              </div>

              {showCustom && (
                <div style={{ marginTop: "0.9rem" }}>

                  {/* Heatmap palette */}
                  <label style={{ fontSize: "0.75rem", color: "#555", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Heatmap Palette</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.9rem" }}>
                    {PALETTES.map(p => (
                      <div key={p.id} onClick={() => setPalette(p.id)} style={{
                        border: `1.5px solid ${palette === p.id ? "#0072B2" : "#E5E5E5"}`,
                        borderRadius: 8, padding: "0.45rem 0.6rem", cursor: "pointer",
                        background: palette === p.id ? "#E8F4FD" : "#FAFAFA",
                      }}>
                        <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                          {p.colors.map((c, i) => (
                            <div key={i} style={{ flex: 1, height: 8, borderRadius: 3, background: c, border: "1px solid rgba(0,0,0,0.08)" }} />
                          ))}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: palette === p.id ? "#0072B2" : "#666", fontWeight: palette === p.id ? 700 : 400 }}>{p.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Show coefficients toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#555", fontWeight: 600 }}>Show values on heatmap</label>
                    <div onClick={() => setShowCoef(!showCoef)} style={{
                      width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                      background: showCoef ? "#0072B2" : "#CCCCCC", position: "relative", transition: "background 0.2s"
                    }}>
                      <div style={{
                        position: "absolute", top: 3, left: showCoef ? 20 : 3,
                        width: 16, height: 16, borderRadius: "50%", background: "#fff",
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                      }} />
                    </div>
                  </div>

                  {/* Axis font size */}
                  <div style={{ marginBottom: "0.9rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#555", fontWeight: 600, display: "block", marginBottom: 4 }}>
                      Axis Font Size: <span style={{ color: "#0072B2" }}>{axisFontSize}×</span>
                    </label>
                    <input type="range" min="0.6" max="1.4" step="0.05" value={axisFontSize}
                      onChange={e => setAxisFontSize(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#0072B2" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#AAA" }}>
                      <span>Small</span><span>Normal</span><span>Large</span>
                    </div>
                  </div>

                  {/* Custom title & labels */}
                  <INPUT label="Plot Title (optional)" value={plotTitle} onChange={setPlotTitle} placeholder="e.g. Wheat Trait Correlations" />
                  <INPUT label="X-axis Label (scatter)" value={xLabel} onChange={setXLabel} placeholder="optional" />
                  <INPUT label="Y-axis Label (scatter)" value={yLabel} onChange={setYLabel} placeholder="optional" />

                  {/* Scatter DPI */}
                  <label style={{ fontSize: "0.75rem", color: "#555", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Scatter Plot Resolution</label>
                  {RESOLUTIONS.map(r => (
                    <div key={r.id} onClick={() => setScatterDpi(r.id)} style={{
                      border: `1.5px solid ${scatterDpi === r.id ? "#0072B2" : "#E5E5E5"}`,
                      borderRadius: 8, padding: "0.45rem 0.75rem", marginBottom: "0.4rem",
                      cursor: "pointer", background: scatterDpi === r.id ? "#E8F4FD" : "#FAFAFA",
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <span style={{ fontWeight: 600, color: scatterDpi === r.id ? "#0072B2" : "#333", fontSize: "0.8rem" }}>{r.label}</span>
                      <span style={{ color: "#999", fontSize: "0.7rem" }}>{r.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Run button */}
            <button onClick={runAnalysis} disabled={loading || !file} style={{
              width: "100%", padding: "0.85rem", borderRadius: 10, border: "none",
              background: loading || !file ? "#CCCCCC" : "#0072B2",
              color: "#fff", fontWeight: 700, fontSize: "0.95rem",
              cursor: loading || !file ? "not-allowed" : "pointer",
              boxShadow: loading || !file ? "none" : "0 4px 14px rgba(0,114,178,0.3)",
              transition: "all 0.2s"
            }}>
              {loading ? "⏳ Analyzing..." : "▶ Run Analysis"}
            </button>

            {error && (
              <div style={{ marginTop: "0.75rem", background: "#FFF0F0", border: "1px solid #FFCCCC", borderRadius: 9, padding: "0.65rem", color: "#C0392B", fontSize: "0.78rem" }}>
                ❌ {error}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div>
            {!result && !loading && (
              <div style={{ ...sectionStyle, padding: "3rem", textAlign: "center", color: "#BBB" }}>
                <div style={{ fontSize: 48, marginBottom: "0.75rem" }}>📈</div>
                <p style={{ fontSize: "0.95rem", fontWeight: 500, color: "#999" }}>Upload data and run analysis</p>
                <p style={{ fontSize: "0.78rem", color: "#BBB" }}>Correlation matrix, heatmap and scatter plots appear here</p>
              </div>
            )}

            {loading && (
              <div style={{ ...sectionStyle, padding: "3rem", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: "0.75rem" }}>⚙️</div>
                <p style={{ color: "#0072B2", fontWeight: 600 }}>Running R analysis...</p>
                <p style={{ color: "#AAA", fontSize: "0.78rem" }}>Computing correlations and generating plots</p>
              </div>
            )}

            {result && (
              <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                {/* Stats bar */}
                <div style={{ background: "#0072B2", padding: "0.9rem 1.5rem", display: "flex", gap: "2rem" }}>
                  {[
                    { label: "Method", val: result.method?.toUpperCase() },
                    { label: "Variables", val: result.variables?.length },
                    { label: "Observations", val: result.n },
                    { label: "α", val: sigLevel },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.68rem" }}>{s.label}</div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", fontFamily: "'DM Mono'" }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1.5px solid #EEEEEE", padding: "0 1.25rem" }}>
                  {[
                    { id: "matrix",  label: "📊 Matrix" },
                    { id: "pvalues", label: "📉 P-values" },
                    { id: "heatmap", label: "🗺 Heatmap" },
                    { id: "scatter", label: "🔵 Scatter" },
                  ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                      padding: "0.7rem 0.9rem", border: "none", background: "none",
                      borderBottom: activeTab === t.id ? "2px solid #0072B2" : "2px solid transparent",
                      color: activeTab === t.id ? "#0072B2" : "#888",
                      fontWeight: activeTab === t.id ? 700 : 400,
                      fontSize: "0.78rem", cursor: "pointer", marginBottom: "-1.5px"
                    }}>{t.label}</button>
                  ))}
                </div>

                <div style={{ padding: "1.25rem 1.5rem" }}>

                  {/* Matrix */}
                  {activeTab === "matrix" && result.cor_matrix && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.75rem" }}>
                        <thead>
                          <tr>
                            <th style={{ padding: "0.45rem", textAlign: "left", color: "#0072B2", fontWeight: 700 }}>Variable</th>
                            {result.variables.map(v => (
                              <th key={v} style={{ padding: "0.45rem", color: "#0072B2", fontWeight: 700, textAlign: "center" }}>{v}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.variables.map((rowVar, i) => (
                            <tr key={rowVar}>
                              <td style={{ padding: "0.38rem 0.45rem", fontWeight: 600, color: "#0072B2", whiteSpace: "nowrap" }}>{rowVar}</td>
                              {result.variables.map((colVar, j) => {
                                const val  = result.cor_matrix[i]?.[j];
                                const pval = result.p_matrix?.[i]?.[j];
                                const isDiag = i === j;
                                return (
                                  <td key={colVar} style={{
                                    padding: "0.38rem 0.45rem", textAlign: "center",
                                    background: isDiag ? "#E8F4FD" : getCorColor(val),
                                    color: isDiag ? "#0072B2" : getTextColor(val),
                                    fontWeight: isDiag ? 700 : 500,
                                    borderRadius: 5, fontFamily: "'DM Mono'",
                                    position: "relative"
                                  }}>
                                    {isDiag ? "1.000" : val !== undefined ? val.toFixed(3) : "—"}
                                    {!isDiag && pval < sigLevel && (
                                      <span style={{ position: "absolute", top: 1, right: 3, fontSize: 8 }}>*</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ margin: "0.4rem 0 0", fontSize: "0.68rem", color: "#AAA" }}>* p &lt; {sigLevel} · Blue = positive · Orange = negative</p>
                    </div>
                  )}

                  {/* P-values */}
                  {activeTab === "pvalues" && result.p_matrix && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.75rem" }}>
                        <thead>
                          <tr>
                            <th style={{ padding: "0.45rem", textAlign: "left", color: "#0072B2", fontWeight: 700 }}>Variable</th>
                            {result.variables.map(v => (
                              <th key={v} style={{ padding: "0.45rem", color: "#0072B2", fontWeight: 700, textAlign: "center" }}>{v}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.variables.map((rowVar, i) => (
                            <tr key={rowVar}>
                              <td style={{ padding: "0.38rem 0.45rem", fontWeight: 600, color: "#0072B2" }}>{rowVar}</td>
                              {result.variables.map((colVar, j) => {
                                const pval   = result.p_matrix?.[i]?.[j];
                                const isDiag = i === j;
                                const sig    = !isDiag && pval < sigLevel;
                                return (
                                  <td key={colVar} style={{
                                    padding: "0.38rem 0.45rem", textAlign: "center",
                                    background: isDiag ? "#E8F4FD" : sig ? "#E8F4FD" : "#FFF8F8",
                                    color: isDiag ? "#0072B2" : sig ? "#0072B2" : "#AAAAAA",
                                    fontFamily: "'DM Mono'", borderRadius: 5, fontWeight: sig ? 700 : 400
                                  }}>
                                    {isDiag ? "—" : pval !== undefined ? pval.toFixed(4) : "—"}
                                    {sig && " *"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ margin: "0.4rem 0 0", fontSize: "0.68rem", color: "#AAA" }}>* p &lt; {sigLevel}</p>
                    </div>
                  )}

                  {/* Heatmap */}
                  {activeTab === "heatmap" && (
                    <div style={{ textAlign: "center" }}>
                      <img
                        src={`${API_BASE}/api/correlation/preview/${result.session_id}/heatmap`}
                        alt="Correlation Heatmap"
                        style={{ maxWidth: "100%", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                      />
                    </div>
                  )}

                  {/* Scatter */}
                  {activeTab === "scatter" && (
                    <div style={{ textAlign: "center" }}>
                      <img
                        src={`${API_BASE}/api/correlation/preview/${result.session_id}/scatter`}
                        alt="Scatter Matrix"
                        style={{ maxWidth: "100%", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                      />
                    </div>
                  )}
                </div>

                {/* Export */}
                <div style={{ padding: "0.9rem 1.5rem", borderTop: "1px solid #EEEEEE", display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "#AAA" }}>Export:</span>
                  {[
                    { type: "excel",   label: "📥 Excel",         color: "#009E73" },
                    { type: "heatmap", label: "🖼 Heatmap PNG",  color: "#0072B2" },
                    { type: "scatter", label: "🖼 Scatter PNG",   color: "#E69F00" },
                  ].map(btn => (
                    <button key={btn.type} onClick={() => download(btn.type)} style={{
                      padding: "0.4rem 0.9rem", borderRadius: 7,
                      border: `1px solid ${btn.color}`, background: "transparent",
                      color: btn.color, fontWeight: 600, fontSize: "0.75rem", cursor: "pointer"
                    }}>{btn.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
