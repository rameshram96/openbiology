import { useState, useRef, useCallback } from "react";

const API_BASE = "https://openbiology-backend.onrender.com";

// ─── Example data (embedded as CSV strings) ─────────────────────────────────

const EXAMPLE_GERM_CSV = `Treatment,Replicate,3,5,7,10,14
Control,1,0,8,18,24,25
Control,2,0,7,16,23,25
Drought,1,0,3,9,15,18
Drought,2,0,2,8,13,17
Salinity,1,0,1,5,10,14
Salinity,2,0,2,6,11,15`;

const EXAMPLE_SEED_CSV = `Treatment,Replicate,Shoot_cm,Root_cm,Shoot_DW_g,Root_DW_g
Control,1,4.2,6.8,0.028,0.041
Control,1,3.9,6.2,0.025,0.038
Control,1,4.5,7.1,0.031,0.044
Control,2,4.1,6.5,0.027,0.040
Control,2,4.3,7.0,0.029,0.043
Drought,1,2.1,3.4,0.014,0.019
Drought,1,1.8,3.0,0.012,0.017
Drought,1,2.3,3.7,0.015,0.021
Drought,2,2.0,3.2,0.013,0.018
Drought,2,1.9,3.1,0.013,0.018
Salinity,1,2.6,4.1,0.017,0.024
Salinity,1,2.4,3.8,0.016,0.022
Salinity,1,2.8,4.3,0.018,0.026
Salinity,2,2.5,4.0,0.017,0.023
Salinity,2,2.7,4.2,0.018,0.025`;

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"),
                             { href: url, download: filename });
  a.click(); URL.revokeObjectURL(url);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SWATCHES = [
  { hex:"#0072B2",name:"Steel Blue" },{ hex:"#D55E00",name:"Vermillion" },
  { hex:"#009E73",name:"Forest Green"},{ hex:"#E69F00",name:"Orange" },
  { hex:"#CC79A7",name:"Pink" },       { hex:"#56B4E9",name:"Sky Blue" },
  { hex:"#737373",name:"Slate Grey" }, { hex:"#1C1C1C",name:"Black" },
];
const SHAPES = [
  {id:"circle",g:"●"},{id:"triangle",g:"▲"},
  {id:"square",g:"■"},{id:"diamond",g:"◆"},{id:"cross",g:"✚"},
];
const PLOT_TABS = [
  {id:"gcurve",label:"Germination Curve", germ:true},
  {id:"rate",  label:"Daily Rate",         germ:true},
  {id:"index", label:"Index Chart",        germ:true},
  {id:"box",   label:"Seedling Box Plots", germ:false},
  {id:"dw",    label:"Dry Weight",         germ:false},
];

const GERM_INDEX_INFO = {
  FGP:   "Final Germination % — seeds germinated out of total sown",
  GSI:   "Germination Speed Index — higher = faster germination",
  MGT:   "Mean Germination Time (days) — lower = faster",
  MGR:   "Mean Germination Rate (1/MGT) — higher = faster",
  T50:   "Days to 50% germination (interpolated)",
  T50_Weibull: "Days to 50% germination (Weibull model fit)",
  UnifG: "T90 − T10 spread — lower = more synchronised",
  CVt:   "Coefficient of Variation of germination time (%)",
  CVG:   "Coefficient of Velocity of Germination (%/day)",
  Timson:"Timson's Index — cumulative germination area",
  ERI:   "Emergence Rate Index — speed-weighted germination",
  Sinc:  "Synchrony (Z index) — 1 = all seeds germinate simultaneously",
  Unc:   "Uncertainty (Shannon entropy) — lower = more synchronised",
  VarGer:"Variance of germination time",
};

const SEED_INDEX_INFO = {
  Mean_Shoot_cm:     "Mean shoot (hypocotyl) length per replicate",
  Mean_Root_cm:      "Mean primary root length per replicate",
  Mean_Total_cm:     "Shoot + Root combined length",
  Shoot_Root_ratio:  "Root ÷ Shoot ratio (higher = more root investment)",
  Unif1: "Uniformity 1 — deviation-based with dead seed penalty (0–1000)",
  Unif2: "Uniformity 2 — SD-based across shoot, root, total, ratio (0–1000)",
  Growth:"Growth Index = Root×wr + Shoot×wh",
  Vigor_Unif1: "Vigor = Growth×wg + Unif1×wu",
  Vigor_Unif2: "Vigor = Growth×wg + Unif2×wu",
  Vigor_corr_Unif1: "Vigor_Unif1 × FGP/100 (penalises low germination)",
  Vigor_corr_Unif2: "Vigor_Unif2 × FGP/100 (penalises low germination)",
  Mean_Shoot_DW: "Mean shoot dry weight (g)",
  Mean_Root_DW:  "Mean root dry weight (g)",
  Total_DW:      "Mean total dry weight (g)",
  DW_Ratio:      "Root DW ÷ Shoot DW ratio",
  STI_Shoot:     "Stress Tolerance Index for shoot length",
  STI_Root:      "Stress Tolerance Index for root length",
  STI_Total_DW:  "Stress Tolerance Index for total dry weight",
};

const DEFAULT = {
  pointShape:"circle", pointSize:6, showGrid:true,
  wr:90, wh:10, wg:0.7, wu:0.3,
  titleGcurve:"Germination Curve",     titleRate:"Daily Germination Rate",
  titleIndex:"Germination Index Comparison",
  titleBox:"Seedling Length Distribution", titleDw:"Seedling Dry Weight",
};

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function SL({ children }) {
  return <p style={{ margin:"0 0 0.42rem", fontSize:"0.6rem", fontWeight:700,
    color:"#AAAAAA", textTransform:"uppercase", letterSpacing:1.2,
    fontFamily:"'DM Mono',monospace" }}>{children}</p>;
}
function Info({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-block" }}>
      <span onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
        style={{ cursor:"help", color:"#BBBBBB", fontSize:"0.65rem",
                 marginLeft:4 }}>ⓘ</span>
      {show && (
        <div style={{ position:"absolute", bottom:"100%", left:0, zIndex:99,
          background:"#1C1C1C", color:"#fff", fontSize:"0.68rem",
          borderRadius:7, padding:"0.4rem 0.65rem", whiteSpace:"nowrap",
          boxShadow:"0 4px 16px rgba(0,0,0,0.25)", maxWidth:280,
          whiteSpace:"normal", lineHeight:1.5 }}>
          {text}
        </div>
      )}
    </span>
  );
}
function Toggle({ active, onToggle, label }) {
  return (
    <button onClick={onToggle} style={{ display:"inline-flex", alignItems:"center",
      gap:"0.3rem", padding:"0.28rem 0.6rem", borderRadius:7,
      fontSize:"0.7rem", fontWeight:600, cursor:"pointer", userSelect:"none",
      border:`1.5px solid ${active?"#2D9E5F":"#E5E5E5"}`,
      background:active?"#EAF8F0":"#FAFAFA",
      color:active?"#2D9E5F":"#AAAAAA", transition:"all 0.14s" }}>
      <span style={{ fontSize:"0.5rem" }}>{active?"●":"○"}</span>{label}
    </button>
  );
}
function SwatchRow({ selected, onChange }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem" }}>
      {SWATCHES.map(s => (
        <div key={s.hex} title={s.name} onClick={() => onChange(s.hex)}
          style={{ width:20, height:20, borderRadius:"50%", background:s.hex,
            cursor:"pointer", border:`2.5px solid ${selected===s.hex?"#1C1C1C":"transparent"}`,
            boxShadow:"0 1px 3px rgba(0,0,0,0.15)", transition:"border 0.12s" }} />
      ))}
    </div>
  );
}

// ─── Example data format panel ────────────────────────────────────────────────
function ExamplePanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"#fff", borderRadius:12,
                  border:"1.5px solid #EBEBEB", overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width:"100%", padding:"0.7rem 1rem", border:"none",
        background:"transparent", textAlign:"left", cursor:"pointer",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#2D9E5F" }}>
          📋 How to prepare your data
        </span>
        <span style={{ fontSize:"0.75rem", color:"#AAAAAA" }}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{ padding:"0 1rem 1rem", display:"flex",
                      flexDirection:"column", gap:"0.85rem" }}>

          {/* Germination format */}
          <div>
            <p style={{ margin:"0 0 0.4rem", fontSize:"0.72rem", fontWeight:700,
                        color:"#1C1C1C" }}>
              🌾 Germination file
            </p>
            <p style={{ margin:"0 0 0.5rem", fontSize:"0.68rem", color:"#888",
                        lineHeight:1.6 }}>
              Each row = one replicate of one treatment.
              Day columns = <strong>cumulative</strong> germinated seed counts at each
              observation day. Column headers must be the day numbers.
            </p>
            <div style={{ overflowX:"auto", borderRadius:8,
                          border:"1px solid #E8E8E8", marginBottom:"0.5rem" }}>
              <table style={{ fontSize:"0.65rem", borderCollapse:"collapse",
                               minWidth:360, width:"100%" }}>
                <thead>
                  <tr style={{ background:"#F0F8F0" }}>
                    {["Treatment","Replicate","3","5","7","10","14"].map(h => (
                      <th key={h} style={{ padding:"0.3rem 0.55rem", textAlign:"center",
                        fontFamily:"'DM Mono'", color:"#2D9E5F", borderBottom:"1px solid #E0E0E0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[["Control","1","0","8","18","24","25"],
                    ["Control","2","0","7","16","23","25"],
                    ["Drought","1","0","3","9","15","18"]].map((row,i) => (
                    <tr key={i} style={{ background:i%2===0?"#FAFAFA":"#fff" }}>
                      {row.map((v,j) => (
                        <td key={j} style={{ padding:"0.28rem 0.55rem", textAlign:"center",
                          fontFamily:"'DM Mono'", color:"#555",
                          borderBottom:"1px solid #F5F5F5" }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => downloadCSV(EXAMPLE_GERM_CSV,"example_germination.csv")}
              style={{ padding:"0.3rem 0.75rem", borderRadius:7,
                border:"1.5px solid #2D9E5F", background:"#EAF8F0",
                color:"#2D9E5F", fontSize:"0.65rem", fontWeight:700,
                cursor:"pointer", fontFamily:"'DM Mono'" }}>
              ↓ Download example germination CSV
            </button>
          </div>

          {/* Seedling format */}
          <div>
            <p style={{ margin:"0 0 0.4rem", fontSize:"0.72rem", fontWeight:700,
                        color:"#1C1C1C" }}>
              🌿 Seedling file
            </p>
            <p style={{ margin:"0 0 0.5rem", fontSize:"0.68rem", color:"#888",
                        lineHeight:1.6 }}>
              Each row = <strong>one individual seedling</strong> (not a replicate mean).
              Multiple rows per replicate are expected and required for
              Uniformity and box plot calculations. Column names must match exactly.
            </p>
            <div style={{ overflowX:"auto", borderRadius:8,
                          border:"1px solid #E8E8E8", marginBottom:"0.5rem" }}>
              <table style={{ fontSize:"0.65rem", borderCollapse:"collapse",
                               minWidth:420, width:"100%" }}>
                <thead>
                  <tr style={{ background:"#F0F8F0" }}>
                    {["Treatment","Replicate","Shoot_cm","Root_cm",
                      "Shoot_DW_g","Root_DW_g"].map(h => (
                      <th key={h} style={{ padding:"0.3rem 0.55rem", textAlign:"center",
                        fontFamily:"'DM Mono'", color:"#2D9E5F",
                        borderBottom:"1px solid #E0E0E0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[["Control","1","4.2","6.8","0.028","0.041"],
                    ["Control","1","3.9","6.2","0.025","0.038"],
                    ["Drought","1","2.1","3.4","0.014","0.019"]].map((row,i) => (
                    <tr key={i} style={{ background:i%2===0?"#FAFAFA":"#fff" }}>
                      {row.map((v,j) => (
                        <td key={j} style={{ padding:"0.28rem 0.55rem", textAlign:"center",
                          fontFamily:"'DM Mono'", color:"#555",
                          borderBottom:"1px solid #F5F5F5" }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => downloadCSV(EXAMPLE_SEED_CSV,"example_seedling.csv")}
              style={{ padding:"0.3rem 0.75rem", borderRadius:7,
                border:"1.5px solid #2D9E5F", background:"#EAF8F0",
                color:"#2D9E5F", fontSize:"0.65rem", fontWeight:700,
                cursor:"pointer", fontFamily:"'DM Mono'" }}>
              ↓ Download example seedling CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SeedGerminationModule() {
  const [germFile,  setGermFile]  = useState(null);
  const [seedFile,  setSeedFile]  = useState(null);
  const [germTrts,  setGermTrts]  = useState([]);
  const [seedTrts,  setSeedTrts]  = useState([]);
  const [nseeds,    setNseeds]    = useState(100);
  const [controlTrt,setControlTrt]= useState("");
  const [pending,   setPending]   = useState(DEFAULT);
  const [params,    setParams]    = useState(DEFAULT);
  const [result,    setResult]    = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState("gcurve");
  const [plotKey,   setPlotKey]   = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [replotting,setReplotting]= useState(false);
  const [dirty,     setDirty]     = useState(false);
  const [error,     setError]     = useState("");
  const germRef = useRef(); const seedRef = useRef();

  const set = (k, v) => { setPending(p => ({...p,[k]:v})); if(sessionId) setDirty(true); };

  // Linked wg + wu sliders
  const setWg = (v) => { const wg=parseFloat(v); set("wg",wg); set("wu",parseFloat((1-wg).toFixed(2))); };
  const setWu = (v) => { const wu=parseFloat(v); set("wu",wu); set("wg",parseFloat((1-wu).toFixed(2))); };

  const allTrts = [...new Set([...germTrts,...seedTrts])];

  const handleGermFile = async (e) => {
    const f = e.target.files[0]; if(!f) return;
    setGermFile(f); setError("");
    const fd = new FormData(); fd.append("file",f);
    try {
      const r = await fetch(`${API_BASE}/api/seed/parse-germ`,{method:"POST",body:fd});
      const d = await r.json();
      if(!r.ok) throw new Error(d.detail||"Cannot read file");
      setGermTrts(d.treatments);
    } catch(err) { setError(err.message); }
  };

  const handleSeedFile = async (e) => {
    const f = e.target.files[0]; if(!f) return;
    setSeedFile(f); setError("");
    const fd = new FormData(); fd.append("file",f);
    try {
      const r = await fetch(`${API_BASE}/api/seed/parse-seed`,{method:"POST",body:fd});
      const d = await r.json();
      if(!r.ok) throw new Error(d.detail||"Cannot read file");
      setSeedTrts(d.treatments);
    } catch(err) { setError(err.message); }
  };

  const buildFD = (p) => {
    const fd = new FormData();
    fd.append("nseeds",      nseeds);
    fd.append("control_trt", controlTrt);
    fd.append("point_size",  p.pointSize);
    fd.append("point_shape", p.pointShape);
    fd.append("show_grid",   p.showGrid);
    fd.append("wr",p.wr); fd.append("wh",p.wh);
    fd.append("wg",p.wg); fd.append("wu",p.wu);
    fd.append("title_gcurve",p.titleGcurve);
    fd.append("title_rate",  p.titleRate);
    fd.append("title_index", p.titleIndex);
    fd.append("title_box",   p.titleBox);
    fd.append("title_dw",    p.titleDw);
    return fd;
  };

  const handleAnalyze = async () => {
    if(!germFile && !seedFile){ setError("Upload at least one file"); return; }
    setLoading(true); setError("");
    const fd = buildFD(pending);
    if(germFile) fd.append("germ_file", germFile);
    if(seedFile) fd.append("seed_file", seedFile);
    try {
      const r = await fetch(`${API_BASE}/api/seed/analyze`,{method:"POST",body:fd});
      const d = await r.json();
      if(!r.ok) throw new Error(d.detail||"Analysis failed");
      setResult(d); setSessionId(d.session_id);
      setParams({...pending}); setPlotKey(k=>k+1); setDirty(false);
      const first = PLOT_TABS.find(t => d.plots?.includes(t.id));
      if(first) setActiveTab(first.id);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReplot = async () => {
    if(!sessionId) return;
    setReplotting(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/api/seed/replot/${sessionId}`,
                            {method:"POST",body:buildFD(pending)});
      if(!r.ok){ const d=await r.json(); throw new Error(d.detail||"Replot failed"); }
      setParams({...pending}); setPlotKey(k=>k+1); setDirty(false);
    } catch(err) { setError(err.message); }
    finally { setReplotting(false); }
  };

  const availTabs = result
    ? PLOT_TABS.filter(t => result.plots?.includes(t.id))
    : [];

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card = { background:"#fff", borderRadius:12,
                 border:"1.5px solid #EBEBEB", padding:"1rem 1.1rem" };
  const inp  = { width:"100%", border:"1.5px solid #E8E8E8", borderRadius:8,
                 padding:"0.38rem 0.65rem", fontSize:"0.76rem", color:"#1C1C1C",
                 background:"#FAFAFA", boxSizing:"border-box", outline:"none",
                 fontFamily:"'DM Sans',sans-serif" };
  const sel  = {...inp, cursor:"pointer"};
  const divr = { height:1, background:"#F0F0F0", margin:"0.75rem 0" };
  const tab  = (a) => ({ flex:1, padding:"0.5rem 0.25rem", border:"none",
    background:a?"#fff":"transparent",
    borderBottom:a?"2px solid #2D9E5F":"2px solid transparent",
    color:a?"#2D9E5F":"#AAAAAA", fontSize:"0.68rem",
    fontWeight:a?700:500, cursor:"pointer",
    transition:"all 0.14s", whiteSpace:"nowrap" });

  const canRun   = (germFile||seedFile) && !loading && !replotting;
  const analysed = !!result;
  const btnLabel = loading?"Running…":replotting?"Updating…":
    analysed&&dirty?"⟳ Update Plots":analysed?"✓ Up to date":"▶ Run Analysis";
  const btnBg = !canRun?"#E5E5E5":analysed&&dirty?"#E69F00":
    analysed?"#009E73":"#2D9E5F";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#F7F7F5",
                  fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a3a1a,#2d6a2d)",
                    padding:"1rem 2rem", display:"flex",
                    alignItems:"center", gap:"0.85rem" }}>
        <span style={{ fontSize:22 }}>🌱</span>
        <div>
          <h1 style={{ margin:0, color:"#fff", fontSize:"0.95rem", fontWeight:700 }}>
            Seed Germination &amp; Seedling Analysis
          </h1>
          <p style={{ margin:0, color:"rgba(255,255,255,0.45)", fontSize:"0.65rem",
                      fontFamily:"'DM Mono'" }}>
            16 germination indices · 17 seedling metrics · Weibull · STI · Vigor
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1150, margin:"0 auto", padding:"1.5rem",
                    display:"flex", gap:"1.25rem", alignItems:"flex-start" }}>

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div style={{ width:305, flexShrink:0, display:"flex",
                      flexDirection:"column", gap:"0.75rem" }}>

          {/* Data format guide */}
          <ExamplePanel />

          {/* Germination file */}
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center",
                          justifyContent:"space-between", marginBottom:"0.45rem" }}>
              <SL>🌾 Germination data</SL>
              <span style={{ fontSize:"0.6rem", color:"#AAAAAA" }}>optional</span>
            </div>
            <p style={{ margin:"0 0 0.5rem", fontSize:"0.68rem", color:"#888",
                        lineHeight:1.55 }}>
              Upload a file with <strong>Treatment</strong>, <strong>Replicate</strong>,
              then one column per observation day with cumulative germination counts.
            </p>
            <div onClick={() => germRef.current.click()} style={{
              border:`2px dashed ${germFile?"#2D9E5F":"#DDDDDD"}`,
              borderRadius:10, padding:"0.85rem", textAlign:"center",
              cursor:"pointer", background:germFile?"#EAF8F0":"#FAFAFA",
              transition:"all 0.18s" }}>
              <input ref={germRef} type="file" accept=".csv,.xlsx,.xls"
                     style={{ display:"none" }} onChange={handleGermFile}/>
              <p style={{ margin:0, fontSize:"0.72rem",
                          color:germFile?"#2D9E5F":"#BBBBBB",
                          fontWeight:germFile?600:400 }}>
                {germFile ? `📄 ${germFile.name}` : "Click to upload CSV / Excel"}
              </p>
            </div>
            {germTrts.length > 0 && (
              <p style={{ margin:"0.4rem 0 0", fontSize:"0.63rem",
                          color:"#2D9E5F", fontFamily:"'DM Mono'" }}>
                ✓ {germTrts.length} treatments: {germTrts.join(" · ")}
              </p>
            )}
            <div style={divr}/>
            <SL>Total seeds sown per replicate
              <Info text="The number of seeds placed per replicate. Used to calculate FGP = (germinated/nseeds)×100." />
            </SL>
            <input type="number" value={nseeds} min={1} step={1}
                   onChange={e => setNseeds(parseInt(e.target.value)||100)}
                   style={inp}/>
          </div>

          {/* Seedling file */}
          <div style={card}>
            <div style={{ display:"flex", alignItems:"center",
                          justifyContent:"space-between", marginBottom:"0.45rem" }}>
              <SL>🌿 Seedling data</SL>
              <span style={{ fontSize:"0.6rem", color:"#AAAAAA" }}>optional</span>
            </div>
            <p style={{ margin:"0 0 0.5rem", fontSize:"0.68rem", color:"#888",
                        lineHeight:1.55 }}>
              Each row = <strong>one individual seedling</strong>. Required columns:
              Treatment, Replicate, Shoot_cm, Root_cm, Shoot_DW_g, Root_DW_g.
            </p>
            <div onClick={() => seedRef.current.click()} style={{
              border:`2px dashed ${seedFile?"#2D9E5F":"#DDDDDD"}`,
              borderRadius:10, padding:"0.85rem", textAlign:"center",
              cursor:"pointer", background:seedFile?"#EAF8F0":"#FAFAFA",
              transition:"all 0.18s" }}>
              <input ref={seedRef} type="file" accept=".csv,.xlsx,.xls"
                     style={{ display:"none" }} onChange={handleSeedFile}/>
              <p style={{ margin:0, fontSize:"0.72rem",
                          color:seedFile?"#2D9E5F":"#BBBBBB",
                          fontWeight:seedFile?600:400 }}>
                {seedFile ? `📄 ${seedFile.name}` : "Click to upload CSV / Excel"}
              </p>
            </div>
            {seedTrts.length > 0 && (
              <p style={{ margin:"0.4rem 0 0", fontSize:"0.63rem",
                          color:"#2D9E5F", fontFamily:"'DM Mono'" }}>
                ✓ {seedTrts.length} treatments: {seedTrts.join(" · ")}
              </p>
            )}
            {allTrts.length > 0 && (
              <>
                <div style={divr}/>
                <SL>Control treatment (required for STI)
                  <Info text="Stress Tolerance Index compares each treatment against this control. STI = (stress×control) / control²." />
                </SL>
                <select value={controlTrt} onChange={e => setControlTrt(e.target.value)} style={sel}>
                  <option value="">— select control —</option>
                  {allTrts.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Index weights */}
          <div style={card}>
            <SL>⚖ Index Weights</SL>

            <p style={{ margin:"0 0 0.65rem", fontSize:"0.68rem", color:"#888",
                        lineHeight:1.6 }}>
              <strong>Growth</strong> = Root×wr + Shoot×wh
              <br/>
              <strong>Vigor</strong> = Growth×wg + Uniformity×wu
              <Info text="wr and wh are independent — set based on your study focus. wg + wu are linked and always sum to 1.0." />
            </p>

            {/* wr — independent */}
            <div style={{ marginBottom:"0.55rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"0.65rem", color:"#666", fontWeight:600 }}>
                  wr — Root weight in Growth
                </span>
                <span style={{ fontSize:"0.65rem", color:"#2D9E5F",
                               fontFamily:"'DM Mono'" }}>{pending.wr}</span>
              </div>
              <input type="range" min={0} max={100} step={1}
                     value={pending.wr}
                     onChange={e => set("wr", parseFloat(e.target.value))}
                     style={{ width:"100%", accentColor:"#2D9E5F" }}/>
            </div>

            {/* wh — independent */}
            <div style={{ marginBottom:"0.65rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"0.65rem", color:"#666", fontWeight:600 }}>
                  wh — Shoot weight in Growth
                </span>
                <span style={{ fontSize:"0.65rem", color:"#2D9E5F",
                               fontFamily:"'DM Mono'" }}>{pending.wh}</span>
              </div>
              <input type="range" min={0} max={100} step={1}
                     value={pending.wh}
                     onChange={e => set("wh", parseFloat(e.target.value))}
                     style={{ width:"100%", accentColor:"#009E73" }}/>
            </div>

            <div style={{ height:1, background:"#F0F0F0", margin:"0.5rem 0" }}/>

            {/* wg + wu — linked */}
            <div style={{ background:"#F8FAFF", borderRadius:8,
                          border:"1px solid #E0EEFF", padding:"0.6rem 0.7rem",
                          marginBottom:"0.1rem" }}>
              <p style={{ margin:"0 0 0.45rem", fontSize:"0.62rem", color:"#888",
                          display:"flex", justifyContent:"space-between" }}>
                <span>Linked sliders — always sum to 1.0</span>
                <span style={{ fontFamily:"'DM Mono'", color:"#0072B2",
                               fontWeight:700 }}>
                  {pending.wg.toFixed(2)} + {pending.wu.toFixed(2)} = 1.00
                </span>
              </p>
              <div style={{ marginBottom:"0.45rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:"0.65rem", color:"#666", fontWeight:600 }}>
                    wg — Growth weight in Vigor
                  </span>
                  <span style={{ fontSize:"0.65rem", color:"#0072B2",
                                 fontFamily:"'DM Mono'" }}>{pending.wg.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.05}
                       value={pending.wg}
                       onChange={e => setWg(e.target.value)}
                       style={{ width:"100%", accentColor:"#0072B2" }}/>
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:"0.65rem", color:"#666", fontWeight:600 }}>
                    wu — Uniformity weight in Vigor
                  </span>
                  <span style={{ fontSize:"0.65rem", color:"#CC79A7",
                                 fontFamily:"'DM Mono'" }}>{pending.wu.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.05}
                       value={pending.wu}
                       onChange={e => setWu(e.target.value)}
                       style={{ width:"100%", accentColor:"#CC79A7" }}/>
              </div>
            </div>

            {/* Uniformity note */}
            <div style={{ background:"#FFFBEA", borderRadius:7,
                          border:"1px solid #F5E6A0",
                          padding:"0.5rem 0.65rem", marginTop:"0.5rem" }}>
              <p style={{ margin:0, fontSize:"0.65rem", color:"#7A6000",
                          lineHeight:1.6 }}>
                <strong>Unif1</strong> (deviation-based, includes dead seed penalty) and
                <strong> Unif2</strong> (SD-based across 4 traits) are
                <strong> always computed</strong>.
                Vigor is calculated twice — once with each.
              </p>
            </div>
          </div>

          {/* Visual style */}
          <div style={card}>
            <SL>🎨 Plot Style</SL>
            <SwatchRow selected={pending.pointColor||"#2D9E5F"}
                       onChange={v => set("pointColor", v)}/>
            <div style={divr}/>
            <div style={{ display:"flex", gap:"0.25rem", marginBottom:"0.5rem" }}>
              {SHAPES.map(s => (
                <button key={s.id} title={s.id} onClick={() => set("pointShape",s.id)}
                  style={{ width:32, height:32, borderRadius:8, cursor:"pointer",
                    fontSize:"0.82rem",
                    border:`1.5px solid ${pending.pointShape===s.id?"#2D9E5F":"#E8E8E8"}`,
                    background:pending.pointShape===s.id?"#EAF8F0":"#FAFAFA",
                    color:pending.pointShape===s.id?"#2D9E5F":"#AAAAAA",
                    transition:"all 0.12s" }}>{s.g}</button>
              ))}
            </div>
            <SL>Size — {pending.pointSize}</SL>
            <input type="range" min={3} max={14} step={0.5}
                   value={pending.pointSize}
                   onChange={e => set("pointSize",parseFloat(e.target.value))}
                   style={{ width:"100%", accentColor:"#2D9E5F" }}/>
          </div>

          {/* Plot titles */}
          <div style={card}>
            <SL>🏷 Plot Titles &amp; Grid</SL>
            {[["titleGcurve","Germination curve title"],
              ["titleRate",  "Daily rate title"],
              ["titleIndex", "Index comparison title"],
              ["titleBox",   "Seedling box plot title"],
              ["titleDw",    "Dry weight chart title"]].map(([k,ph]) => (
              <input key={k} placeholder={ph} value={pending[k]}
                     onChange={e => set(k,e.target.value)}
                     style={{ ...inp, marginBottom:"0.38rem" }}/>
            ))}
            <Toggle active={pending.showGrid}
                    onToggle={() => set("showGrid",!pending.showGrid)}
                    label="Grid lines"/>
          </div>

          {/* Run */}
          <button onClick={analysed&&dirty?handleReplot:handleAnalyze}
                  disabled={!canRun} style={{
            width:"100%", padding:"0.72rem", borderRadius:10, border:"none",
            background:btnBg, color:!canRun?"#BBBBBB":"#fff",
            fontSize:"0.82rem", fontWeight:700, letterSpacing:0.3,
            cursor:!canRun?"not-allowed":"pointer", transition:"background 0.18s" }}>
            {btnLabel}
          </button>
        </div>

        {/* ── Right panel ───────────────────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.9rem" }}>

          {error && (
            <div style={{ background:"#FFF5F5", border:"1.5px solid #FFCCCC",
              borderRadius:10, padding:"0.7rem 1rem",
              color:"#CC0000", fontSize:"0.78rem" }}>⚠ {error}</div>
          )}

          {!result && !loading && (
            <div style={{ background:"#fff", borderRadius:14,
              border:"1.5px dashed #E5E5E5", display:"flex",
              flexDirection:"column", alignItems:"center",
              justifyContent:"center", padding:"4rem 2rem",
              textAlign:"center", gap:"0.6rem" }}>
              <span style={{ fontSize:40, opacity:0.15 }}>🌱</span>
              <p style={{ margin:0, fontSize:"0.88rem", fontWeight:600, color:"#CCCCCC" }}>
                Upload one or both files and click Run Analysis
              </p>
              <p style={{ margin:0, fontSize:"0.72rem", color:"#DDDDDD",
                          maxWidth:320, lineHeight:1.6 }}>
                Files are independent — use germination only, seedling only,
                or both together. When combined, Vigor is corrected by FGP automatically.
              </p>
              <div style={{ marginTop:"0.5rem", padding:"0.6rem 1rem",
                background:"#F0F8F0", borderRadius:9, border:"1px solid #B2DDB2",
                fontSize:"0.68rem", color:"#2D9E5F", lineHeight:1.7,
                textAlign:"left", maxWidth:340 }}>
                <strong>Tip:</strong> Download the example CSV files from
                "How to prepare your data" above to test the module immediately.
              </div>
            </div>
          )}

          {loading && (
            <div style={{ background:"#fff", borderRadius:14,
              border:"1.5px solid #EBEBEB", display:"flex",
              alignItems:"center", justifyContent:"center", padding:"5rem" }}>
              <span style={{ fontSize:"0.88rem", color:"#2D9E5F", fontWeight:500 }}>
                Running analysis…
              </span>
            </div>
          )}

          {result && !loading && (<>

            {/* Summary */}
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              {result.germ_results && (
                <div style={{ background:"#EAF8F0", border:"1px solid #B2DDB2",
                  borderRadius:8, padding:"0.4rem 0.85rem",
                  fontSize:"0.72rem", color:"#1B7A4A", fontWeight:600 }}>
                  ✓ Germination — {result.germ_results.length} replicates · 16 indices
                </div>
              )}
              {result.seed_results && (
                <div style={{ background:"#EAF8F0", border:"1px solid #B2DDB2",
                  borderRadius:8, padding:"0.4rem 0.85rem",
                  fontSize:"0.72rem", color:"#1B7A4A", fontWeight:600 }}>
                  ✓ Seedling — {result.seed_results.length} replicates · 17 metrics
                </div>
              )}
              {result.germ_results && result.seed_results && (
                <div style={{ background:"#EAF5FF", border:"1px solid #B5D4F4",
                  borderRadius:8, padding:"0.4rem 0.85rem",
                  fontSize:"0.72rem", color:"#0072B2", fontWeight:600 }}>
                  ✓ Vigor corrected by FGP
                </div>
              )}
            </div>

            {/* Plot tabs + image */}
            <div style={{ background:"#fff", borderRadius:14,
                          border:"1.5px solid #EBEBEB", overflow:"hidden" }}>
              <div style={{ display:"flex", borderBottom:"1px solid #F0F0F0",
                            background:"#FAFAFA", overflowX:"auto" }}>
                {availTabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                          style={tab(activeTab===t.id)}>{t.label}</button>
                ))}
              </div>
              <div style={{ position:"relative" }}>
                {replotting && (
                  <div style={{ position:"absolute", inset:0, zIndex:5,
                    background:"rgba(255,255,255,0.75)", display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:"0.8rem", color:"#2D9E5F",
                                   fontWeight:600 }}>Updating…</span>
                  </div>
                )}
                <img key={`${activeTab}-${plotKey}`}
                     src={`${API_BASE}/api/seed/preview/${sessionId}/${activeTab}?t=${plotKey}`}
                     alt={activeTab}
                     style={{ width:"100%", display:"block" }}/>
              </div>
              <div style={{ padding:"0.7rem 1rem", borderTop:"1px solid #F5F5F5",
                display:"flex", gap:"0.4rem", justifyContent:"flex-end",
                alignItems:"center" }}>
                <span style={{ fontSize:"0.62rem", color:"#CCCCCC",
                               fontFamily:"'DM Mono'", marginRight:"0.2rem" }}>
                  Download:
                </span>
                {["png","svg"].map(fmt => (
                  <a key={fmt}
                     href={`${API_BASE}/api/seed/download/${sessionId}/${activeTab}_${fmt}`}
                     download={`${activeTab}.${fmt}`}
                     style={{ padding:"0.3rem 0.7rem", borderRadius:7,
                       border:"1.5px solid #2D9E5F", background:"#EAF8F0",
                       color:"#2D9E5F", fontSize:"0.65rem", fontWeight:700,
                       textDecoration:"none", fontFamily:"'DM Mono'" }}>
                    ↓ {fmt.toUpperCase()}
                  </a>
                ))}
                <div style={{ width:1, height:18, background:"#E8E8E8",
                              margin:"0 0.2rem" }}/>
                <a href={`${API_BASE}/api/seed/download/${sessionId}/excel`}
                   download="seed_results.xlsx"
                   style={{ padding:"0.3rem 0.7rem", borderRadius:7,
                     border:"1.5px solid #009E73", background:"#E8F8F3",
                     color:"#009E73", fontSize:"0.65rem", fontWeight:700,
                     textDecoration:"none", fontFamily:"'DM Mono'" }}>
                  ↓ Excel
                </a>
              </div>
            </div>

            {/* Germination results table */}
            {result.germ_results && (
              <div style={{ background:"#fff", borderRadius:12,
                border:"1.5px solid #EBEBEB", padding:"1rem 1.1rem" }}>
                <p style={{ margin:"0 0 0.6rem", fontSize:"0.72rem", fontWeight:700,
                            color:"#1C1C1C" }}>
                  🌾 Germination Indices
                  <span style={{ fontSize:"0.62rem", color:"#AAAAAA",
                                 fontWeight:400, marginLeft:6 }}>
                    treatment means · hover column headers for descriptions
                  </span>
                </p>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse",
                                  fontSize:"0.67rem" }}>
                    <thead>
                      <tr>
                        {[["Treatment",""],
                          ["FGP","Final Germination %"],
                          ["GSI","Germination Speed Index"],
                          ["MGT","Mean Germination Time (days)"],
                          ["T50","Days to 50% (interpolated)"],
                          ["T50_W","Days to 50% (Weibull)"],
                          ["UnifG","T90−T10 spread"],
                          ["CVt","CV of germination time"],
                          ["CVG","Coefficient Velocity Germ."],
                          ["Timson","Timson's Index"],
                          ["ERI","Emergence Rate Index"],
                          ["Sinc","Synchrony index"],
                          ["Unc","Uncertainty (entropy)"],
                        ].map(([h,tip]) => (
                          <th key={h} title={tip}
                            style={{ padding:"0.3rem 0.5rem", textAlign:"right",
                              color:"#AAAAAA", fontWeight:600,
                              borderBottom:"1.5px solid #F0F0F0",
                              fontFamily:"'DM Mono'", cursor:tip?"help":"default",
                              whiteSpace:"nowrap" }}>
                            {h}{tip && <span style={{ color:"#DDD", marginLeft:2 }}>ⓘ</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        result.germ_results.reduce((acc,r) => {
                          if(!acc[r.Treatment]) acc[r.Treatment]={n:0,sum:{}};
                          const e=acc[r.Treatment]; e.n++;
                          ["FGP","GSI","MGT","T50","T50_Weibull","UnifG",
                           "CVt","CVG","Timson","ERI","Sinc","Unc"].forEach(k => {
                            e.sum[k]=(e.sum[k]||0)+(r[k]||0);
                          });
                          return acc;
                        },{})
                      ).map(([trt,{n,sum}],ri) => (
                        <tr key={trt}
                          style={{ background:ri%2===0?"#FAFAFA":"#fff" }}>
                          <td style={{ padding:"0.3rem 0.5rem", fontWeight:700,
                                       color:"#1C1C1C" }}>{trt}</td>
                          {["FGP","GSI","MGT","T50","T50_Weibull","UnifG",
                            "CVt","CVG","Timson","ERI","Sinc","Unc"].map(k => (
                            <td key={k} style={{ padding:"0.3rem 0.5rem",
                              textAlign:"right", fontFamily:"'DM Mono'",
                              borderBottom:"1px solid #F8F8F8",
                              color: k==="FGP"
                                ? (sum[k]/n>80?"#009E73":sum[k]/n>50?"#E69F00":"#D55E00")
                                : "#444" }}>
                              {isNaN(sum[k]/n)?"—":(sum[k]/n).toFixed(3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Seedling results table */}
            {result.seed_results && (
              <div style={{ background:"#fff", borderRadius:12,
                border:"1.5px solid #EBEBEB", padding:"1rem 1.1rem" }}>
                <p style={{ margin:"0 0 0.6rem", fontSize:"0.72rem", fontWeight:700,
                            color:"#1C1C1C" }}>
                  🌿 Seedling Metrics
                  <span style={{ fontSize:"0.62rem", color:"#AAAAAA",
                                 fontWeight:400, marginLeft:6 }}>
                    treatment means
                  </span>
                </p>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse",
                                  fontSize:"0.67rem" }}>
                    <thead>
                      <tr>
                        {[["Treatment",""],
                          ["Shoot cm","Mean shoot length"],
                          ["Root cm","Mean root length"],
                          ["Total cm","Shoot + Root"],
                          ["S:R ratio","Root ÷ Shoot"],
                          ["Unif1","Deviation-based uniformity (0–1000)"],
                          ["Unif2","SD-based uniformity (0–1000)"],
                          ["Growth","Root×wr + Shoot×wh"],
                          ["Vigor U1","Growth×wg + Unif1×wu"],
                          ["Vigor U2","Growth×wg + Unif2×wu"],
                          ["Vcorr U1","Vigor_U1 × FGP/100"],
                          ["Vcorr U2","Vigor_U2 × FGP/100"],
                          ["Total DW","Shoot+Root dry weight (g)"],
                          ["STI Shoot","Stress Tolerance Index — shoot"],
                          ["STI Root","Stress Tolerance Index — root"],
                        ].map(([h,tip]) => (
                          <th key={h} title={tip}
                            style={{ padding:"0.3rem 0.5rem", textAlign:"right",
                              color:"#AAAAAA", fontWeight:600,
                              borderBottom:"1.5px solid #F0F0F0",
                              fontFamily:"'DM Mono'", cursor:tip?"help":"default",
                              whiteSpace:"nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        result.seed_results.reduce((acc,r) => {
                          if(!acc[r.Treatment]) acc[r.Treatment]={n:0,sum:{}};
                          const e=acc[r.Treatment]; e.n++;
                          ["Mean_Shoot_cm","Mean_Root_cm","Mean_Total_cm",
                           "Shoot_Root_ratio","Unif1","Unif2","Growth",
                           "Vigor_Unif1","Vigor_Unif2",
                           "Vigor_corr_Unif1","Vigor_corr_Unif2",
                           "Total_DW","STI_Shoot","STI_Root"].forEach(k => {
                            e.sum[k]=(e.sum[k]||0)+(r[k]||0);
                          });
                          return acc;
                        },{})
                      ).map(([trt,{n,sum}],ri) => (
                        <tr key={trt}
                          style={{ background:ri%2===0?"#FAFAFA":"#fff" }}>
                          <td style={{ padding:"0.3rem 0.5rem", fontWeight:700,
                                       color:"#1C1C1C" }}>{trt}</td>
                          {["Mean_Shoot_cm","Mean_Root_cm","Mean_Total_cm",
                            "Shoot_Root_ratio","Unif1","Unif2","Growth",
                            "Vigor_Unif1","Vigor_Unif2",
                            "Vigor_corr_Unif1","Vigor_corr_Unif2",
                            "Total_DW","STI_Shoot","STI_Root"].map(k => (
                            <td key={k} style={{ padding:"0.3rem 0.5rem",
                              textAlign:"right", fontFamily:"'DM Mono'",
                              borderBottom:"1px solid #F8F8F8", color:"#444" }}>
                              {isNaN(sum[k]/n)?"—":(sum[k]/n).toFixed(3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>)}
        </div>
      </div>
    </div>
  );
}