import { useState, useRef, useCallback, useEffect } from "react";

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
  { id: "Colorblind", label: "Colorblind Safe", colors: ["#0072B2","#ffffff","#D55E00"] },
  { id: "Greyscale",  label: "Greyscale",      colors: ["#000000","#888888","#ffffff"] },
  { id: "Blues",      label: "Blues",          colors: ["#f7fbff","#6baed6","#08306b"] },
];

const RESOLUTIONS = [
  { id: 72,  label: "72 dpi",  desc: "Screen" },
  { id: 150, label: "150 dpi", desc: "Print" },
  { id: 300, label: "300 dpi", desc: "Publication" },
];

const EXAMPLE_DATA = {
  headers: ["Genotype", "PlantHeight", "GrainYield", "SPAD", "Biomass", "TGW"],
  rows: [
    ["G001", "92.4", "4.21", "42.1", "18.3", "38.2"],
    ["G002", "88.1", "3.87", "39.5", "16.7", "35.9"],
    ["G003", "95.7", "4.56", "44.3", "19.8", "40.1"],
    ["G004", "85.3", "3.64", "37.8", "15.2", "33.7"],
    ["G005", "91.2", "4.33", "41.6", "18.0", "37.5"],
  ],
};

function DataTable({ headers, rows, small }) {
  return (
    <div style={{ overflowX: "auto", marginTop: "0.6rem" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: small ? "0.67rem" : "0.74rem" }}>
        <thead>
          <tr>{headers.map((h, i) => (
            <th key={i} style={{ padding: "0.32rem 0.5rem", background: "#EEF5FF", color: "#0072B2", fontWeight: 700, borderBottom: "2px solid #C5DCF5", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#FAFAFA" : "#fff" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "0.28rem 0.5rem", color: "#333", borderBottom: "1px solid #EEEEEE", whiteSpace: "nowrap" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CorrelationModule() {
  const [file, setFile]               = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const [method, setMethod]           = useState("pearson");
  const [sigLevel, setSigLevel]       = useState(0.05);
  const [loading, setLoading]         = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState("");
  const [activeTab, setActiveTab]     = useState("matrix");
  const [heatmapKey, setHeatmapKey]   = useState(Date.now());

  // Graph options
  const [palette, setPalette]               = useState("RdBu");
  const [axisFontSize, setAxisFontSize]     = useState(0.85);
  const [showCoef, setShowCoef]             = useState(true);
  const [plotTitle, setPlotTitle]           = useState("");
  const [scatterDpi, setScatterDpi]         = useState(150);
  const [showCustom, setShowCustom]         = useState(false);

  const fileRef    = useRef();
  const regenTimer = useRef(null);

  // Real-time heatmap regeneration
  const regenerateHeatmap = useCallback(async (sessionId, pal, fontSize, coef, title) => {
    if (!sessionId) return;
    setHeatmapLoading(true);
    const form = new FormData();
    form.append("heatmap_palette", pal);
    form.append("axis_font_size",  fontSize);
    form.append("show_coef",       coef);
    form.append("plot_title",      title);
    try {
      await fetch(`${API_BASE}/api/correlation/heatmap/${sessionId}`, { method: "POST", body: form });
      setHeatmapKey(Date.now()); // force image reload
    } catch (e) { console.error(e); }
    finally { setHeatmapLoading(false); }
  }, []);

  // Debounced trigger for real-time updates
  const triggerRegen = useCallback((pal, fontSize, coef, title) => {
    if (!result?.session_id) return;
    clearTimeout(regenTimer.current);
    regenTimer.current = setTimeout(() => {
      regenerateHeatmap(result.session_id, pal, fontSize, coef, title);
    }, 600);
  }, [result, regenerateHeatmap]);

  const handlePaletteChange = (p) => { setPalette(p); triggerRegen(p, axisFontSize, showCoef, plotTitle); };
  const handleFontChange    = (v) => { setAxisFontSize(v); triggerRegen(palette, v, showCoef, plotTitle); };
  const handleCoefToggle    = ()  => { const v = !showCoef; setShowCoef(v); triggerRegen(palette, axisFontSize, v, plotTitle); };
  const handleTitleChange   = (v) => { setPlotTitle(v); triggerRegen(palette, axisFontSize, showCoef, v); };

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError("");
    if (f.name.toLowerCase().endsWith(".csv")) {
      const text  = await f.text();
      const lines = text.trim().split("\n").slice(0, 7);
      const headers = lines[0].split(",").map(h => h.replace(/"/g,"").trim());
      const rows    = lines.slice(1,6).map(l => l.split(",").map(c => c.replace(/"/g,"").trim()));
      setFilePreview({ headers, rows, type: "csv", cols: headers.length, rowCount: text.trim().split("\n").length - 1 });
    } else {
      setFilePreview({ type: "excel", name: f.name, size: (f.size/1024).toFixed(1) });
    }
  };

  const handleUpload = (e) => handleFile(e.target.files[0]);
  const handleDrop   = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

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
    form.append("scatter_dpi",     scatterDpi);
    form.append("scatter_width",   scatterDpi === 300 ? 1800 : scatterDpi === 72 ? 900 : 1200);
    form.append("scatter_height",  scatterDpi === 300 ? 1500 : scatterDpi === 72 ? 750 : 1000);
    try {
      const res  = await fetch(`${API_BASE}/api/correlation/analyze`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data); setActiveTab("matrix"); setHeatmapKey(Date.now());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const download = (type) => result && window.open(`${API_BASE}/api/correlation/download/${result.session_id}/${type}?t=${Date.now()}`, "_blank");

  const getCorColor  = (val) => { if (!val && val !== 0) return "#f5f5f5"; const a = Math.abs(val); return val > 0 ? `rgba(0,114,178,${0.1+a*0.8})` : `rgba(213,94,0,${0.1+a*0.8})`; };
  const getTextColor = (val) => (!val && val !== 0) ? "#444" : Math.abs(val) > 0.55 ? "#fff" : "#222";
  const getStars     = (pv)  => pv < 0.001 ? "***" : pv < 0.01 ? "**" : pv < 0.05 ? "*" : "";

  const box   = { background:"#fff", borderRadius:14, padding:"1.1rem 1.25rem", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", marginBottom:"0.85rem" };
  const lbl   = { fontWeight:700, color:"#1C1C1C", fontSize:"0.82rem", display:"block", marginBottom:"0.6rem" };
  const chip  = (active) => ({ padding:"0.3rem 0.7rem", borderRadius:7, border:`1.5px solid ${active?"#0072B2":"#E0E0E0"}`, background:active?"#0072B2":"#fff", color:active?"#fff":"#555", fontWeight:600, fontSize:"0.75rem", cursor:"pointer" });

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", minHeight:"100vh", background:"#F7F7F5", padding:"1.75rem" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth:1160, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"#0072B2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#fff" }}>⬡</div>
          <div>
            <h1 style={{ margin:0, fontSize:"1.3rem", fontWeight:700, color:"#1C1C1C" }}>Correlation Analysis</h1>
            <p style={{ margin:0, color:"#888", fontSize:"0.78rem" }}>Pearson · Spearman · Kendall</p>
          </div>
        </div>

        {/* Example data */}
        <div style={{ ...box, marginBottom:"1.1rem", padding:"0.85rem 1.25rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:600, color:"#1C1C1C", fontSize:"0.82rem" }}>📋 Expected Data Format</span>
            <button onClick={() => setShowExample(!showExample)} style={{ padding:"0.25rem 0.7rem", borderRadius:7, border:"1px solid #0072B2", background:"transparent", color:"#0072B2", fontSize:"0.72rem", fontWeight:600, cursor:"pointer" }}>
              {showExample ? "Hide" : "Show Example"}
            </button>
          </div>
          {showExample && (
            <div style={{ marginTop:"0.65rem" }}>
              <p style={{ margin:"0 0 0.4rem", fontSize:"0.72rem", color:"#666", lineHeight:1.6 }}>
                • First row = <strong>column headers</strong> (trait names) &nbsp;·&nbsp; Each row = one <strong>observation / genotype</strong><br />
                • Non-numeric columns (e.g. Genotype) are <strong>ignored automatically</strong> &nbsp;·&nbsp; Accepted: <strong>CSV, XLSX, XLS</strong>
              </p>
              <DataTable headers={EXAMPLE_DATA.headers} rows={EXAMPLE_DATA.rows} small />
            </div>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:"1.25rem", alignItems:"start" }}>

          {/* LEFT */}
          <div>
            {/* Upload */}
            <div style={box}>
              <label style={lbl}>📂 Upload Data</label>
              <div onDrop={handleDrop} onDragOver={e=>e.preventDefault()} onClick={()=>fileRef.current.click()}
                style={{ border:`2px dashed ${file?"#0072B2":"#D5D5D5"}`, borderRadius:10, padding:"1rem", textAlign:"center", cursor:"pointer", background:file?"#E8F4FD":"#FAFAFA", transition:"all 0.2s" }}>
                <div style={{ fontSize:22, marginBottom:"0.25rem" }}>{file?"✅":"📊"}</div>
                <p style={{ margin:0, color:file?"#0072B2":"#999", fontSize:"0.75rem", fontWeight:file?600:400 }}>
                  {file ? file.name : "Drop CSV or Excel\nor click to browse"}
                </p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} style={{ display:"none" }} />

              {/* File preview */}
              {filePreview && (
                <div style={{ marginTop:"0.7rem" }}>
                  {filePreview.type === "csv" ? (
                    <>
                      <p style={{ margin:"0 0 0.3rem", fontSize:"0.7rem", color:"#555", fontWeight:600 }}>
                        Preview — {filePreview.cols} columns · {filePreview.rowCount} rows detected
                      </p>
                      <DataTable headers={filePreview.headers} rows={filePreview.rows} small />
                    </>
                  ) : (
                    <div style={{ background:"#F0F6FF", borderRadius:8, padding:"0.5rem 0.75rem", fontSize:"0.72rem", color:"#0072B2" }}>
                      📄 <strong>{filePreview.name}</strong> · {filePreview.size} KB — Excel file ready
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Method */}
            <div style={box}>
              <label style={lbl}>📐 Method</label>
              {Object.entries(METHOD_INFO).map(([key, info]) => (
                <div key={key} onClick={()=>setMethod(key)} style={{ border:`1.5px solid ${method===key?"#0072B2":"#E5E5E5"}`, borderRadius:9, padding:"0.5rem 0.75rem", marginBottom:"0.4rem", cursor:"pointer", background:method===key?"#E8F4FD":"#FAFAFA", transition:"all 0.15s" }}>
                  <div style={{ fontWeight:600, color:method===key?"#0072B2":"#333", fontSize:"0.8rem" }}>{info.label}</div>
                  <div style={{ color:"#888", fontSize:"0.68rem", marginTop:1 }}>{info.desc}</div>
                </div>
              ))}
            </div>

            {/* Significance */}
            <div style={box}>
              <label style={lbl}>⚗️ Significance (α)</label>
              <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                {[0.001,0.01,0.05,0.1].map(v=>(
                  <button key={v} onClick={()=>setSigLevel(v)} style={chip(sigLevel===v)}>{v}</button>
                ))}
              </div>
            </div>

            {/* Graph Options */}
            <div style={box}>
              <div onClick={()=>setShowCustom(!showCustom)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <label style={{ ...lbl, marginBottom:0, cursor:"pointer" }}>🎨 Graph Options
                  {result && <span style={{ marginLeft:8, fontSize:"0.65rem", color:"#009E73", fontWeight:400 }}>● live</span>}
                </label>
                <span style={{ color:"#0072B2", fontSize:"0.72rem" }}>{showCustom?"▲ Hide":"▼ Show"}</span>
              </div>

              {showCustom && (
                <div style={{ marginTop:"0.85rem" }}>
                  {/* Palette */}
                  <label style={{ fontSize:"0.7rem", color:"#555", fontWeight:600, display:"block", marginBottom:"0.4rem" }}>Heatmap Palette</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.32rem", marginBottom:"0.8rem" }}>
                    {PALETTES.map(p=>(
                      <div key={p.id} onClick={()=>handlePaletteChange(p.id)} style={{ border:`1.5px solid ${palette===p.id?"#0072B2":"#E5E5E5"}`, borderRadius:8, padding:"0.38rem 0.5rem", cursor:"pointer", background:palette===p.id?"#E8F4FD":"#FAFAFA" }}>
                        <div style={{ display:"flex", gap:3, marginBottom:3 }}>
                          {p.colors.map((c,i)=><div key={i} style={{ flex:1, height:7, borderRadius:3, background:c, border:"1px solid rgba(0,0,0,0.08)" }}/>)}
                        </div>
                        <div style={{ fontSize:"0.63rem", color:palette===p.id?"#0072B2":"#666", fontWeight:palette===p.id?700:400 }}>{p.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Show coef */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.8rem" }}>
                    <label style={{ fontSize:"0.7rem", color:"#555", fontWeight:600 }}>Show values on heatmap</label>
                    <div onClick={handleCoefToggle} style={{ width:38, height:20, borderRadius:10, cursor:"pointer", background:showCoef?"#0072B2":"#CCCCCC", position:"relative", transition:"background 0.2s" }}>
                      <div style={{ position:"absolute", top:2, left:showCoef?19:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                    </div>
                  </div>

                  {/* Font size */}
                  <div style={{ marginBottom:"0.8rem" }}>
                    <label style={{ fontSize:"0.7rem", color:"#555", fontWeight:600, display:"block", marginBottom:4 }}>
                      Axis Font Size: <span style={{ color:"#0072B2" }}>{axisFontSize}×</span>
                    </label>
                    <input type="range" min="0.6" max="1.4" step="0.05" value={axisFontSize}
                      onChange={e=>handleFontChange(parseFloat(e.target.value))}
                      style={{ width:"100%", accentColor:"#0072B2" }}/>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.6rem", color:"#AAA" }}>
                      <span>Small</span><span>Normal</span><span>Large</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ marginBottom:"0.8rem" }}>
                    <label style={{ fontSize:"0.7rem", color:"#555", fontWeight:600, display:"block", marginBottom:3 }}>Plot Title (optional)</label>
                    <input type="text" value={plotTitle} onChange={e=>handleTitleChange(e.target.value)}
                      placeholder="e.g. Wheat Trait Correlations"
                      style={{ width:"100%", padding:"0.38rem 0.6rem", borderRadius:7, border:"1px solid #D5D5D5", fontSize:"0.75rem", fontFamily:"inherit", boxSizing:"border-box", background:"#FAFAFA" }}/>
                  </div>

                  {/* Scatter DPI */}
                  <label style={{ fontSize:"0.7rem", color:"#555", fontWeight:600, display:"block", marginBottom:"0.38rem" }}>Scatter Resolution</label>
                  {RESOLUTIONS.map(r=>(
                    <div key={r.id} onClick={()=>setScatterDpi(r.id)} style={{ border:`1.5px solid ${scatterDpi===r.id?"#0072B2":"#E5E5E5"}`, borderRadius:8, padding:"0.38rem 0.7rem", marginBottom:"0.32rem", cursor:"pointer", background:scatterDpi===r.id?"#E8F4FD":"#FAFAFA", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontWeight:600, color:scatterDpi===r.id?"#0072B2":"#333", fontSize:"0.75rem" }}>{r.label}</span>
                      <span style={{ color:"#999", fontSize:"0.65rem" }}>{r.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Run */}
            <button onClick={runAnalysis} disabled={loading||!file} style={{ width:"100%", padding:"0.82rem", borderRadius:10, border:"none", background:loading||!file?"#CCCCCC":"#0072B2", color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:loading||!file?"not-allowed":"pointer", boxShadow:loading||!file?"none":"0 4px 14px rgba(0,114,178,0.3)", transition:"all 0.2s" }}>
              {loading?"⏳ Analyzing...":"▶ Run Analysis"}
            </button>

            {error && <div style={{ marginTop:"0.7rem", background:"#FFF0F0", border:"1px solid #FFCCCC", borderRadius:9, padding:"0.6rem", color:"#C0392B", fontSize:"0.73rem" }}>❌ {error}</div>}
          </div>

          {/* RIGHT */}
          <div>
            {!result && !loading && (
              <div style={{ ...box, padding:"3rem", textAlign:"center" }}>
                <div style={{ fontSize:46, marginBottom:"0.7rem" }}>📈</div>
                <p style={{ fontSize:"0.9rem", fontWeight:500, color:"#999" }}>Upload data and run analysis</p>
                <p style={{ fontSize:"0.73rem", color:"#BBB" }}>Correlation matrix, heatmap and scatter plots appear here</p>
              </div>
            )}

            {loading && (
              <div style={{ ...box, padding:"3rem", textAlign:"center" }}>
                <div style={{ fontSize:36 }}>⚙️</div>
                <p style={{ color:"#0072B2", fontWeight:600 }}>Running R analysis...</p>
                <p style={{ color:"#AAA", fontSize:"0.73rem" }}>Computing correlations and generating plots</p>
              </div>
            )}

            {result && (
              <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
                {/* Stats */}
                <div style={{ background:"#0072B2", padding:"0.82rem 1.5rem", display:"flex", gap:"2rem" }}>
                  {[{label:"Method",val:result.method?.toUpperCase()},{label:"Variables",val:result.variables?.length},{label:"Observations",val:result.n},{label:"α",val:sigLevel}].map(s=>(
                    <div key={s.label}>
                      <div style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.63rem" }}>{s.label}</div>
                      <div style={{ color:"#fff", fontWeight:700, fontSize:"0.9rem", fontFamily:"'DM Mono'" }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display:"flex", borderBottom:"1.5px solid #EEEEEE", padding:"0 1.25rem" }}>
                  {[{id:"matrix",label:"📊 Matrix"},{id:"pvalues",label:"📉 P-values"},{id:"heatmap",label:"🗺 Heatmap"},{id:"scatter",label:"🔵 Scatter"}].map(t=>(
                    <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:"0.62rem 0.82rem", border:"none", background:"none", borderBottom:activeTab===t.id?"2px solid #0072B2":"2px solid transparent", color:activeTab===t.id?"#0072B2":"#888", fontWeight:activeTab===t.id?700:400, fontSize:"0.73rem", cursor:"pointer", marginBottom:"-1.5px" }}>{t.label}</button>
                  ))}
                </div>

                <div style={{ padding:"1.2rem 1.5rem" }}>

                  {/* Matrix */}
                  {activeTab==="matrix" && result.cor_matrix && (
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ borderCollapse:"collapse", width:"100%", fontSize:"0.7rem" }}>
                        <thead><tr>
                          <th style={{ padding:"0.38rem 0.5rem", textAlign:"left", color:"#0072B2", fontWeight:700 }}>Variable</th>
                          {result.variables.map(v=><th key={v} style={{ padding:"0.38rem 0.5rem", color:"#0072B2", fontWeight:700, textAlign:"center" }}>{v}</th>)}
                        </tr></thead>
                        <tbody>
                          {result.variables.map((rowVar,i)=>(
                            <tr key={rowVar}>
                              <td style={{ padding:"0.33rem 0.5rem", fontWeight:600, color:"#0072B2", whiteSpace:"nowrap" }}>{rowVar}</td>
                              {result.variables.map((colVar,j)=>{
                                const val=result.cor_matrix[i]?.[j], pval=result.p_matrix?.[i]?.[j], isDiag=i===j;
                                const stars = !isDiag && pval!==undefined ? getStars(pval) : "";
                                return (
                                  <td key={colVar} style={{ padding:"0.33rem 0.5rem", textAlign:"center", background:isDiag?"#E8F4FD":getCorColor(val), color:isDiag?"#0072B2":getTextColor(val), fontWeight:isDiag?700:500, borderRadius:5, fontFamily:"'DM Mono'" }}>
                                    {isDiag?"1.000":val!==undefined?val.toFixed(3):"—"}
                                    {stars&&<sup style={{ fontSize:8, marginLeft:1 }}>{stars}</sup>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ margin:"0.45rem 0 0", fontSize:"0.63rem", color:"#AAA" }}>* p&lt;0.05 &nbsp; ** p&lt;0.01 &nbsp; *** p&lt;0.001 &nbsp;·&nbsp; Blue=positive · Orange=negative</p>
                    </div>
                  )}

                  {/* P-values */}
                  {activeTab==="pvalues" && result.p_matrix && (
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ borderCollapse:"collapse", width:"100%", fontSize:"0.7rem" }}>
                        <thead><tr>
                          <th style={{ padding:"0.38rem 0.5rem", textAlign:"left", color:"#0072B2", fontWeight:700 }}>Variable</th>
                          {result.variables.map(v=><th key={v} style={{ padding:"0.38rem 0.5rem", color:"#0072B2", fontWeight:700, textAlign:"center" }}>{v}</th>)}
                        </tr></thead>
                        <tbody>
                          {result.variables.map((rowVar,i)=>(
                            <tr key={rowVar}>
                              <td style={{ padding:"0.33rem 0.5rem", fontWeight:600, color:"#0072B2" }}>{rowVar}</td>
                              {result.variables.map((colVar,j)=>{
                                const pval=result.p_matrix?.[i]?.[j], isDiag=i===j;
                                const stars = !isDiag && pval!==undefined ? getStars(pval) : "";
                                const sig = stars !== "";
                                return (
                                  <td key={colVar} style={{ padding:"0.33rem 0.5rem", textAlign:"center", background:isDiag?"#E8F4FD":sig?"#E8F4FD":"#FAFAFA", color:isDiag?"#0072B2":sig?"#0072B2":"#AAAAAA", fontFamily:"'DM Mono'", borderRadius:5, fontWeight:sig?700:400 }}>
                                    {isDiag?"—":pval!==undefined?pval.toFixed(4):"—"}
                                    {stars&&<sup style={{ fontSize:8 }}>{stars}</sup>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ margin:"0.45rem 0 0", fontSize:"0.63rem", color:"#AAA" }}>* p&lt;0.05 &nbsp; ** p&lt;0.01 &nbsp; *** p&lt;0.001</p>
                    </div>
                  )}

                  {/* Heatmap */}
                  {activeTab==="heatmap" && (
                    <div style={{ textAlign:"center", position:"relative" }}>
                      {heatmapLoading && (
                        <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.75)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:10, zIndex:2 }}>
                          <span style={{ color:"#0072B2", fontWeight:600, fontSize:"0.82rem" }}>⚙️ Updating heatmap...</span>
                        </div>
                      )}
                      <img key={heatmapKey} src={`${API_BASE}/api/correlation/preview/${result.session_id}/heatmap?t=${heatmapKey}`}
                        alt="Heatmap" style={{ maxWidth:"100%", borderRadius:10, boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}/>
                    </div>
                  )}

                  {/* Scatter */}
                  {activeTab==="scatter" && (
                    <div style={{ textAlign:"center" }}>
                      <img src={`${API_BASE}/api/correlation/preview/${result.session_id}/scatter`}
                        alt="Scatter" style={{ maxWidth:"100%", borderRadius:10, boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}/>
                    </div>
                  )}
                </div>

                {/* Export */}
                <div style={{ padding:"0.82rem 1.5rem", borderTop:"1px solid #EEEEEE", display:"flex", gap:"0.55rem", flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:"0.72rem", color:"#AAA" }}>Export:</span>
                  {[{type:"excel",label:"📥 Excel",color:"#009E73"},{type:"heatmap",label:"🖼 Heatmap PNG",color:"#0072B2"},{type:"scatter",label:"🖼 Scatter PNG",color:"#E69F00"}].map(btn=>(
                    <button key={btn.type} onClick={()=>download(btn.type)} style={{ padding:"0.35rem 0.82rem", borderRadius:7, border:`1px solid ${btn.color}`, background:"transparent", color:btn.color, fontWeight:600, fontSize:"0.7rem", cursor:"pointer" }}>{btn.label}</button>
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
