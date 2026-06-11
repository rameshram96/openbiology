import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "https://openbiology-backend.onrender.com";

// ─── Constants ────────────────────────────────────────────────────────────────

const DESIGNS = [
  { id: "crd", label: "CRD", full: "Completely Randomised Design" },
  { id: "rbd", label: "RBD", full: "Randomised Block Design" },
];

const WAYS = [
  { id: "one_way",   label: "One-Way",   factors: 1 },
  { id: "two_way",   label: "Two-Way",   factors: 2 },
  { id: "three_way", label: "Three-Way", factors: 3 },
];

const POSTHOC = [
  { id: "tukey",  label: "Tukey HSD", desc: "Controls family-wise error" },
  { id: "duncan", label: "Duncan",    desc: "Multiple Range Test" },
  { id: "lsd",    label: "LSD",       desc: "Fisher's Least Significant Difference" },
];

const ERROR_BARS = [
  { id: "sem",  label: "SEM",    desc: "Standard Error of Mean" },
  { id: "sd",   label: "SD",     desc: "Standard Deviation" },
  { id: "ci95", label: "95% CI", desc: "95% Confidence Interval" },
];

const PALETTE = [
  "#0072B2","#D55E00","#009E73","#E69F00",
  "#CC79A7","#56B4E9","#737373","#1C1C1C",
];

const DEFAULT = {
  design: "crd", anovaType: "one_way",
  posthoc: "tukey", errorBar: "sem",
  barTitle:"", intTitle:"Interaction Plot",
  xLabel:"", yLabel:"",
  fontSize: 10, showGrid: true,
  barColors: [...PALETTE],
};

// ─── Example data for guide panel ────────────────────────────────────────────

const EXAMPLES = {
  crd_one_way: {
    headers: ["Treatment","Yield"],
    rows: [["Control","5.2"],["Control","4.9"],["Control","5.4"],
           ["Drought","3.7"],["Drought","3.5"],["Drought","4.0"],
           ["Salinity","4.1"],["Salinity","3.9"],["Salinity","4.3"]],
    note: "Each row = one observation. No replicate column needed.",
    csv: "Treatment,Yield\nControl,5.2\nControl,4.9\nControl,5.4\nDrought,3.7\nDrought,3.5\nDrought,4.0\nSalinity,4.1\nSalinity,3.9\nSalinity,4.3",
  },
  crd_two_way: {
    headers: ["Treatment","Genotype","Yield"],
    rows: [["Control","G1","5.2"],["Control","G2","5.5"],
           ["Drought","G1","3.7"],["Drought","G2","4.0"],
           ["Salinity","G1","4.1"],["Salinity","G2","4.4"]],
    note: "Each row = one observation. Two treatment factors.",
    csv: "Treatment,Genotype,Yield\nControl,G1,5.2\nControl,G2,5.5\nDrought,G1,3.7\nDrought,G2,4.0\nSalinity,G1,4.1\nSalinity,G2,4.4",
  },
  rbd_one_way: {
    headers: ["Block","Treatment","Yield"],
    rows: [["B1","Control","5.3"],["B1","Drought","3.8"],["B1","Salinity","4.2"],
           ["B2","Control","5.0"],["B2","Drought","3.6"],["B2","Salinity","4.0"],
           ["B3","Control","5.4"],["B3","Drought","3.9"],["B3","Salinity","4.3"]],
    note: "One row per Block × Treatment combination. Block = replicate.",
    csv: "Block,Treatment,Yield\nB1,Control,5.3\nB1,Drought,3.8\nB1,Salinity,4.2\nB2,Control,5.0\nB2,Drought,3.6\nB2,Salinity,4.0\nB3,Control,5.4\nB3,Drought,3.9\nB3,Salinity,4.3",
  },
  rbd_two_way: {
    headers: ["Block","Treatment","Genotype","Yield"],
    rows: [["B1","T1","G1","5.3"],["B1","T1","G2","5.6"],
           ["B1","T2","G1","3.8"],["B1","T2","G2","4.1"],
           ["B2","T1","G1","5.1"],["B2","T1","G2","5.4"],
           ["B2","T2","G1","3.6"],["B2","T2","G2","3.9"]],
    note: "One row per Block × Treatment × Genotype combination.",
    csv: "Block,Treatment,Genotype,Yield\nB1,T1,G1,5.3\nB1,T1,G2,5.6\nB1,T2,G1,3.8\nB1,T2,G2,4.1\nB2,T1,G1,5.1\nB2,T1,G2,5.4\nB2,T2,G1,3.6\nB2,T2,G2,3.9",
  },
};

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click(); URL.revokeObjectURL(url);
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function SL({ children }) {
  return (
    <p style={{ margin:"0 0 0.45rem", fontSize:"0.6rem", fontWeight:700,
                color:"#AAAAAA", textTransform:"uppercase", letterSpacing:1.2,
                fontFamily:"'DM Mono',monospace" }}>
      {children}
    </p>
  );
}

function Toggle({ active, onToggle, label }) {
  return (
    <button onClick={onToggle} style={{
      display:"inline-flex", alignItems:"center", gap:"0.35rem",
      padding:"0.28rem 0.65rem", borderRadius:7,
      fontSize:"0.7rem", fontWeight:600, cursor:"pointer",
      border:`1.5px solid ${active?"#009E73":"#E5E5E5"}`,
      background:active?"#E8F8F3":"#FAFAFA",
      color:active?"#009E73":"#AAAAAA", transition:"all 0.14s",
    }}>
      <span style={{ fontSize:"0.5rem" }}>{active?"●":"○"}</span>{label}
    </button>
  );
}

function SigBadge({ p }) {
  if (p == null) return <span style={{ color:"#CCC" }}>—</span>;
  const s   = p<0.001?"***":p<0.01?"**":p<0.05?"*":"ns";
  const col = p<0.001?"#009E73":p<0.01?"#2D9E5F":p<0.05?"#E69F00":"#AAAAAA";
  return <span style={{ fontWeight:700, color:col, fontFamily:"'DM Mono'" }}>{s}</span>;
}

function fmtP(p) {
  if (p == null) return "—";
  return p < 0.001 ? "< 0.001" : p.toFixed(4);
}

function MiniTable({ headers, rows }) {
  return (
    <div style={{ overflowX:"auto", borderRadius:8, border:"1px solid #E8E8E8" }}>
      <table style={{ borderCollapse:"collapse", width:"100%", fontSize:"0.64rem" }}>
        <thead>
          <tr>{headers.map(h => (
            <th key={h} style={{ padding:"0.28rem 0.5rem", background:"#F0F8F0",
              color:"#2D9E5F", fontFamily:"'DM Mono'", borderBottom:"1px solid #E0E0E0",
              textAlign:"center" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>{rows.map((row,i) => (
          <tr key={i} style={{ background:i%2===0?"#FAFAFA":"#fff" }}>
            {row.map((v,j) => (
              <td key={j} style={{ padding:"0.25rem 0.5rem", fontFamily:"'DM Mono'",
                color:"#555", textAlign:"center",
                borderBottom:"1px solid #F5F5F5" }}>{v}</td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── Data Format Guide Panel ──────────────────────────────────────────────────

function DataGuide({ design, anovaType }) {
  const [open, setOpen] = useState(false);

  const exKey = `${design}_${anovaType === "three_way" ? "two_way" : anovaType}`;
  const ex    = EXAMPLES[exKey] || EXAMPLES[`${design}_one_way`];

  const designLabel = design === "rbd" ? "RBD" : "CRD";
  const wayLabel    = WAYS.find(w => w.id === anovaType)?.label || "";

  return (
    <div style={{ background:"#fff", borderRadius:12,
                  border:"1.5px solid #EBEBEB", overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width:"100%", padding:"0.7rem 1rem", border:"none",
        background:"transparent", textAlign:"left", cursor:"pointer",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#009E73" }}>
          📋 Data Format Guide — {designLabel} {wayLabel}
        </span>
        <span style={{ fontSize:"0.72rem", color:"#AAAAAA" }}>{open?"▲":"▼"}</span>
      </button>

      {open && (
        <div style={{ padding:"0 1rem 1rem",
                      display:"flex", flexDirection:"column", gap:"0.75rem" }}>

          {/* CRD explanation */}
          {design === "crd" && (
            <div style={{ background:"#F8FAFF", borderRadius:8,
                          border:"1px solid #E0EEFF", padding:"0.6rem 0.75rem" }}>
              <p style={{ margin:"0 0 0.3rem", fontSize:"0.72rem",
                          fontWeight:700, color:"#0072B2" }}>
                CRD — Completely Randomised Design
              </p>
              <p style={{ margin:0, fontSize:"0.68rem", color:"#666", lineHeight:1.6 }}>
                Treatments are assigned randomly to experimental units.
                Each row = <strong>one independent observation</strong>.
                Replicates are just repeated rows — no replicate column needed.
                Error is estimated from within-group variance.
              </p>
            </div>
          )}

          {/* RBD explanation */}
          {design === "rbd" && (
            <div style={{ background:"#F0FBF5", borderRadius:8,
                          border:"1px solid #B2DDB2", padding:"0.6rem 0.75rem" }}>
              <p style={{ margin:"0 0 0.3rem", fontSize:"0.72rem",
                          fontWeight:700, color:"#2D9E5F" }}>
                RBD — Randomised Block Design
              </p>
              <p style={{ margin:0, fontSize:"0.68rem", color:"#666", lineHeight:1.6 }}>
                Experimental units are grouped into homogeneous <strong>blocks</strong>{" "}
                (e.g. rows in a field, growth chambers, batches).
                Each Block × Treatment combination = <strong>one row</strong>.
                The Block column acts as the replicate structure.
                Block variance is removed from experimental error.
              </p>
            </div>
          )}

          {/* Example table */}
          <div>
            <p style={{ margin:"0 0 0.4rem", fontSize:"0.7rem",
                        fontWeight:700, color:"#1C1C1C" }}>
              Expected format — {designLabel} {wayLabel}
            </p>
            <MiniTable headers={ex.headers} rows={ex.rows.slice(0,5)} />
            <p style={{ margin:"0.35rem 0 0.5rem", fontSize:"0.65rem",
                        color:"#888", lineHeight:1.55 }}>
              ℹ {ex.note}
            </p>
            <button
              onClick={() => downloadCSV(ex.csv,
                `example_${design}_${anovaType}.csv`)}
              style={{ padding:"0.3rem 0.75rem", borderRadius:7,
                border:"1.5px solid #009E73", background:"#E8F8F3",
                color:"#009E73", fontSize:"0.65rem", fontWeight:700,
                cursor:"pointer", fontFamily:"'DM Mono'" }}>
              ↓ Download example CSV
            </button>
          </div>

          {/* Three-way note */}
          {anovaType === "three_way" && (
            <div style={{ background:"#FFFBEA", borderRadius:7,
                          border:"1px solid #F5E6A0", padding:"0.5rem 0.7rem" }}>
              <p style={{ margin:0, fontSize:"0.65rem", color:"#7A6000",
                          lineHeight:1.6 }}>
                <strong>Three-Way</strong>: Add a third treatment factor column.
                {design === "rbd" && " Block column still required."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Live Model Formula Display ───────────────────────────────────────────────

function ModelFormula({ yCol, factorCols, blockCol, design, nFactors }) {
  const activeFacs = factorCols.slice(0, nFactors).filter(Boolean);
  if (!yCol || activeFacs.length === 0) return null;

  // Build display formula client-side (mirrors backend logic)
  const terms = [];
  if (design === "rbd" && blockCol) terms.push(`C(${blockCol})`);
  activeFacs.forEach(f => terms.push(`C(${f})`));
  if (activeFacs.length >= 2) {
    for (let i = 0; i < activeFacs.length; i++) {
      for (let j = i+1; j < activeFacs.length; j++) {
        terms.push(`C(${activeFacs[i]}):C(${activeFacs[j]})`);
      }
    }
  }
  if (activeFacs.length === 3) {
    terms.push(`C(${activeFacs[0]}):C(${activeFacs[1]}):C(${activeFacs[2]})`);
  }

  const formula = `${yCol} ~ ${terms.join(" + ")}`;

  return (
    <div style={{ background:"#1C1C1C", borderRadius:10,
                  padding:"0.75rem 1rem", marginTop:"0.1rem" }}>
      <p style={{ margin:"0 0 0.25rem", fontSize:"0.58rem", fontWeight:700,
                  color:"rgba(255,255,255,0.4)", textTransform:"uppercase",
                  letterSpacing:1.2, fontFamily:"'DM Mono'" }}>
        ANOVA Model
      </p>
      <p style={{ margin:0, fontSize:"0.75rem", fontFamily:"'DM Mono'",
                  color:"#7ECBA1", lineHeight:1.7, wordBreak:"break-all" }}>
        {formula}
      </p>
      <div style={{ marginTop:"0.45rem", display:"flex", gap:"0.4rem",
                    flexWrap:"wrap" }}>
        {design === "rbd" && blockCol && (
          <span style={{ fontSize:"0.58rem", background:"rgba(45,158,95,0.2)",
                         color:"#7ECBA1", borderRadius:4, padding:"0.1rem 0.4rem",
                         fontFamily:"'DM Mono'" }}>
            Block: {blockCol}
          </span>
        )}
        {activeFacs.map((f,i) => (
          <span key={f} style={{ fontSize:"0.58rem",
            background:"rgba(0,114,178,0.2)", color:"#56B4E9",
            borderRadius:4, padding:"0.1rem 0.4rem",
            fontFamily:"'DM Mono'" }}>
            {i === 0 ? "Primary" : `Factor ${i+1}`}: {f}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnovaModule() {
  const [file,       setFile]       = useState(null);
  const [numCols,    setNumCols]    = useState([]);
  const [allCols,    setAllCols]    = useState([]);
  const [yCol,       setYCol]       = useState("");
  const [blockCol,   setBlockCol]   = useState("");
  const [factorCols, setFactorCols] = useState(["","",""]);
  const [pending,    setPending]    = useState(DEFAULT);
  const [params,     setParams]     = useState(DEFAULT);
  const [result,     setResult]     = useState(null);
  const [sessionId,  setSessionId]  = useState(null);
  const [activeTab,  setActiveTab]  = useState("bar");
  const [plotKey,    setPlotKey]    = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [replotting, setReplotting] = useState(false);
  const [dirty,      setDirty]      = useState(false);
  const [error,      setError]      = useState("");
  const fileRef = useRef();

  const set = (k, v) => {
    setPending(p => ({ ...p, [k]: v }));
    if (sessionId) setDirty(true);
  };

  const nFactors  = WAYS.find(w => w.id === pending.anovaType)?.factors || 1;
  const activeFacs = factorCols.slice(0, nFactors).filter(Boolean);

  // ── File upload ─────────────────────────────────────────────────────────────

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setResult(null); setSessionId(null);
    setError(""); setDirty(false);
    const fd = new FormData(); fd.append("file", f);
    try {
      const res  = await fetch(`${API_BASE}/api/anova/columns`,
                               { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Cannot read file");
      setNumCols(data.numeric_cols);
      setAllCols(data.all_cols || [
        ...data.numeric_cols, ...data.categorical_cols]);
      // Auto-assign sensible defaults
      setYCol(data.numeric_cols[0] || "");
      const cats = data.categorical_cols || [];
      setBlockCol(cats[0] || "");
      setFactorCols([
        cats[1] || cats[0] || "",
        cats[2] || cats[1] || "",
        cats[3] || cats[2] || "",
      ]);
    } catch (err) { setError(err.message); }
  };

  // ── Build FormData ──────────────────────────────────────────────────────────

  const buildFD = (p) => {
    const fd = new FormData();
    fd.append("bar_title",  p.barTitle);
    fd.append("int_title",  p.intTitle);
    fd.append("x_label",    p.xLabel);
    fd.append("y_label",    p.yLabel);
    fd.append("font_size",  p.fontSize);
    fd.append("show_grid",  p.showGrid);
    fd.append("bar_colors", JSON.stringify(p.barColors));
    return fd;
  };

  // ── Analyse ─────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!file || !yCol || activeFacs.length !== nFactors) return;
    if (pending.design === "rbd" && !blockCol) {
      setError("RBD requires a block column"); return;
    }
    setLoading(true); setError("");
    const fd = buildFD(pending);
    fd.append("file",        file);
    fd.append("y_col",       yCol);
    fd.append("factor_cols", JSON.stringify(activeFacs));
    fd.append("block_col",   pending.design === "rbd" ? blockCol : "");
    fd.append("design",      pending.design);
    fd.append("anova_type",  pending.anovaType);
    fd.append("posthoc",     pending.posthoc);
    fd.append("error_bar",   pending.errorBar);
    try {
      const res  = await fetch(`${API_BASE}/api/anova/analyze`,
                               { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data); setSessionId(data.session_id);
      setParams({ ...pending }); setPlotKey(k=>k+1);
      setDirty(false); setActiveTab("bar");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Replot ──────────────────────────────────────────────────────────────────

  const handleReplot = async () => {
    if (!sessionId) return;
    setReplotting(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/anova/replot/${sessionId}`,
                              { method:"POST", body:buildFD(pending) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Replot failed"); }
      setParams({ ...pending }); setPlotKey(k=>k+1); setDirty(false);
    } catch (err) { setError(err.message); }
    finally { setReplotting(false); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const needsRerun = () =>
    pending.design    !== (result?.design    || "") ||
    pending.anovaType !== (result?.anova_type|| "") ||
    pending.posthoc   !== (result?.posthoc   || "") ||
    pending.errorBar  !== (result?.error_bar || "");

  const canRun = file && yCol && activeFacs.length === nFactors &&
                 (pending.design === "crd" || blockCol) &&
                 !loading && !replotting;

  const analysed = !!result;
  const hasInt   = analysed && result.anova_type !== "one_way";

  const btnLabel = loading    ? "Running…"
                 : replotting ? "Updating…"
                 : analysed && dirty && needsRerun() ? "⟳ Re-run Analysis"
                 : analysed && dirty ? "⟳ Update Plots"
                 : analysed   ? "✓ Up to date"
                 :              "▶ Run ANOVA";

  const btnBg = !canRun ? "#E5E5E5"
              : analysed && dirty && needsRerun() ? "#D55E00"
              : analysed && dirty ? "#E69F00"
              : "#009E73";

  // ── Styles ───────────────────────────────────────────────────────────────────

  const card  = { background:"#fff", borderRadius:12,
                  border:"1.5px solid #EBEBEB", padding:"1rem 1.1rem" };
  const inp   = { width:"100%", border:"1.5px solid #E8E8E8", borderRadius:8,
                  padding:"0.38rem 0.65rem", fontSize:"0.76rem", color:"#1C1C1C",
                  background:"#FAFAFA", boxSizing:"border-box", outline:"none",
                  fontFamily:"'DM Sans',sans-serif" };
  const sel   = { ...inp, cursor:"pointer" };
  const divr  = { height:1, background:"#F0F0F0", margin:"0.75rem 0" };
  const tabBt = (a) => ({
    flex:1, padding:"0.58rem 0.4rem", border:"none",
    background:a?"#fff":"transparent",
    borderBottom:a?"2px solid #009E73":"2px solid transparent",
    color:a?"#009E73":"#AAAAAA",
    fontSize:"0.7rem", fontWeight:a?700:500,
    cursor:"pointer", transition:"all 0.14s", whiteSpace:"nowrap",
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight:"100vh", background:"#F7F7F5",
                  fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ background:"#1C1C1C", padding:"1rem 2rem",
                    display:"flex", alignItems:"center", gap:"0.85rem" }}>
        <span style={{ fontSize:20, color:"#009E73" }}>◈</span>
        <div>
          <h1 style={{ margin:0, color:"#fff", fontSize:"0.95rem", fontWeight:700 }}>
            ANOVA Suite
          </h1>
          <p style={{ margin:0, color:"rgba(255,255,255,0.45)",
                      fontSize:"0.65rem", fontFamily:"'DM Mono'" }}>
            CRD · RBD · One / Two / Three-Way · Tukey · Duncan · LSD
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1180, margin:"0 auto", padding:"1.5rem",
                    display:"flex", gap:"1.25rem", alignItems:"flex-start" }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
        <div style={{ width:318, flexShrink:0, display:"flex",
                      flexDirection:"column", gap:"0.75rem" }}>

          {/* Data format guide */}
          <DataGuide design={pending.design} anovaType={pending.anovaType} />

          {/* File upload */}
          <div style={card}>
            <SL>📂 Data File</SL>
            <div onClick={() => fileRef.current.click()} style={{
              border:`2px dashed ${file?"#009E73":"#DDDDDD"}`,
              borderRadius:10, padding:"0.9rem", textAlign:"center",
              cursor:"pointer", background:file?"#E8F8F3":"#FAFAFA",
              transition:"all 0.18s",
            }}>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
                     style={{ display:"none" }} onChange={handleFile}/>
              <p style={{ margin:0, fontSize:"0.72rem",
                          color:file?"#009E73":"#BBBBBB",
                          fontWeight:file?600:400 }}>
                {file ? `📄 ${file.name}` : "Click to upload CSV or Excel"}
              </p>
            </div>
            {allCols.length > 0 && (
              <p style={{ margin:"0.4rem 0 0", fontSize:"0.63rem",
                          color:"#AAAAAA", fontFamily:"'DM Mono'" }}>
                {numCols.length} numeric · {allCols.length - numCols.length} other columns detected
              </p>
            )}
          </div>

          {/* Design + Way selector */}
          <div style={card}>
            <SL>⚗️ Design & Structure</SL>

            {/* Design toggle */}
            <div style={{ display:"flex", gap:"0.4rem", marginBottom:"0.65rem" }}>
              {DESIGNS.map(d => (
                <button key={d.id} onClick={() => set("design", d.id)} style={{
                  flex:1, padding:"0.5rem", borderRadius:8, cursor:"pointer",
                  border:`1.5px solid ${pending.design===d.id?"#009E73":"#E8E8E8"}`,
                  background:pending.design===d.id?"#E8F8F3":"#FAFAFA",
                  transition:"all 0.13s",
                }}>
                  <p style={{ margin:"0 0 0.1rem", fontSize:"0.82rem", fontWeight:700,
                               color:pending.design===d.id?"#009E73":"#555" }}>
                    {d.label}
                  </p>
                  <p style={{ margin:0, fontSize:"0.58rem", color:"#AAAAAA",
                               lineHeight:1.3 }}>{d.full}</p>
                </button>
              ))}
            </div>

            {/* Way selector */}
            <div style={{ display:"flex", gap:"0.35rem" }}>
              {WAYS.map(w => (
                <button key={w.id} onClick={() => set("anovaType", w.id)} style={{
                  flex:1, padding:"0.42rem 0.3rem", borderRadius:8,
                  border:`1.5px solid ${pending.anovaType===w.id?"#009E73":"#E8E8E8"}`,
                  background:pending.anovaType===w.id?"#E8F8F3":"#FAFAFA",
                  cursor:"pointer", fontSize:"0.72rem", fontWeight:700,
                  color:pending.anovaType===w.id?"#009E73":"#888",
                  transition:"all 0.13s",
                }}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variable selection */}
          {allCols.length > 0 && (
            <div style={card}>
              <SL>📊 Assign Variables</SL>

              {/* Response Y */}
              <div style={{ marginBottom:"0.5rem" }}>
                <p style={{ margin:"0 0 0.22rem", fontSize:"0.62rem",
                             color:"#AAAAAA", fontFamily:"'DM Mono'",
                             textTransform:"uppercase", letterSpacing:1 }}>
                  Response (Y) — numeric
                </p>
                <select value={yCol}
                  onChange={e => { setYCol(e.target.value); if(sessionId) setDirty(true); }}
                  style={sel}>
                  <option value="">— select response —</option>
                  {numCols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Block column (RBD only) */}
              {pending.design === "rbd" && (
                <div style={{ marginBottom:"0.5rem",
                              background:"#F0FBF5", borderRadius:8,
                              border:"1px solid #B2DDB2", padding:"0.55rem 0.65rem" }}>
                  <p style={{ margin:"0 0 0.22rem", fontSize:"0.62rem",
                               color:"#2D9E5F", fontFamily:"'DM Mono'",
                               textTransform:"uppercase", letterSpacing:1,
                               fontWeight:700 }}>
                    Block Column (replicate)
                  </p>
                  <select value={blockCol}
                    onChange={e => { setBlockCol(e.target.value); if(sessionId) setDirty(true); }}
                    style={{ ...sel, borderColor:"#B2DDB2",
                             background:"#fff" }}>
                    <option value="">— select block —</option>
                    {allCols.filter(c => c !== yCol).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Treatment factors */}
              {Array.from({ length: nFactors }).map((_, i) => (
                <div key={i} style={{ marginBottom: i < nFactors-1 ? "0.45rem" : 0 }}>
                  <p style={{ margin:"0 0 0.22rem", fontSize:"0.62rem",
                               color:"#AAAAAA", fontFamily:"'DM Mono'",
                               textTransform:"uppercase", letterSpacing:1 }}>
                    {nFactors===1 ? "Treatment Factor" : `Treatment Factor ${i+1}`}
                    {i===0 ? " (post-hoc applied)" : ""}
                  </p>
                  <select
                    value={factorCols[i]}
                    onChange={e => {
                      const next = [...factorCols];
                      next[i] = e.target.value;
                      setFactorCols(next);
                      if (sessionId) setDirty(true);
                    }}
                    style={sel}>
                    <option value="">— select factor —</option>
                    {allCols.filter(c => c !== yCol &&
                      c !== blockCol &&
                      !factorCols.slice(0,nFactors).filter((_,fi)=>fi!==i).includes(c)
                    ).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Live model formula */}
              <div style={{ marginTop:"0.65rem" }}>
                <ModelFormula
                  yCol={yCol}
                  factorCols={factorCols}
                  blockCol={pending.design === "rbd" ? blockCol : null}
                  design={pending.design}
                  nFactors={nFactors}
                />
              </div>
            </div>
          )}

          {/* Post-hoc */}
          <div style={card}>
            <SL>🔬 Post-hoc Test</SL>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.32rem" }}>
              {POSTHOC.map(t => (
                <button key={t.id} onClick={() => set("posthoc", t.id)} style={{
                  padding:"0.42rem 0.7rem", borderRadius:8, cursor:"pointer",
                  textAlign:"left",
                  border:`1.5px solid ${pending.posthoc===t.id?"#0072B2":"#E8E8E8"}`,
                  background:pending.posthoc===t.id?"#EAF5FF":"#FAFAFA",
                  transition:"all 0.13s",
                }}>
                  <span style={{ fontSize:"0.76rem", fontWeight:700,
                                 color:pending.posthoc===t.id?"#0072B2":"#555" }}>
                    {t.label}
                  </span>
                  <span style={{ fontSize:"0.62rem", color:"#AAAAAA",
                                 marginLeft:"0.5rem" }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error bars */}
          <div style={card}>
            <SL>📏 Error Bars</SL>
            <div style={{ display:"flex", gap:"0.35rem" }}>
              {ERROR_BARS.map(e => (
                <button key={e.id} onClick={() => set("errorBar", e.id)} style={{
                  flex:1, padding:"0.42rem 0.3rem", borderRadius:8,
                  border:`1.5px solid ${pending.errorBar===e.id?"#009E73":"#E8E8E8"}`,
                  background:pending.errorBar===e.id?"#E8F8F3":"#FAFAFA",
                  cursor:"pointer", fontSize:"0.72rem", fontWeight:700,
                  color:pending.errorBar===e.id?"#009E73":"#888",
                  transition:"all 0.13s",
                }}>
                  {e.label}
                </button>
              ))}
            </div>
            <p style={{ margin:"0.3rem 0 0", fontSize:"0.62rem", color:"#BBBBBB" }}>
              {ERROR_BARS.find(e => e.id === pending.errorBar)?.desc}
            </p>
          </div>

          {/* Plot style */}
          <div style={card}>
            <SL>🎨 Plot Style</SL>
            <p style={{ margin:"0 0 0.35rem", fontSize:"0.62rem",
                        color:"#CCCCCC", fontFamily:"'DM Mono'" }}>
              BAR COLOURS — click to toggle
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem",
                          marginBottom:"0.6rem" }}>
              {PALETTE.map(hex => (
                <div key={hex} onClick={() => {
                    const cur = pending.barColors;
                    const next = cur.includes(hex)
                      ? cur.length > 1 ? cur.filter(c=>c!==hex) : cur
                      : [...cur, hex];
                    set("barColors", next);
                  }}
                  style={{ width:22, height:22, borderRadius:"50%",
                           background:hex, cursor:"pointer",
                           border:`2.5px solid ${pending.barColors.includes(hex)?"#1C1C1C":"transparent"}`,
                           boxShadow:"0 1px 3px rgba(0,0,0,0.15)",
                           transition:"border 0.12s" }}
                />
              ))}
            </div>
            <div style={divr}/>
            <p style={{ margin:"0 0 0.28rem", fontSize:"0.62rem",
                        color:"#CCCCCC", fontFamily:"'DM Mono'" }}>
              FONT SIZE — {pending.fontSize}pt
            </p>
            <input type="range" min={8} max={16} step={0.5}
                   value={pending.fontSize}
                   onChange={e => set("fontSize", parseFloat(e.target.value))}
                   style={{ width:"100%", accentColor:"#009E73" }}/>
            <div style={divr}/>
            <Toggle active={pending.showGrid}
                    onToggle={() => set("showGrid", !pending.showGrid)}
                    label="Grid lines"/>
          </div>

          {/* Titles */}
          <div style={card}>
            <SL>🏷 Titles & Labels</SL>
            {[["barTitle","Bar chart title"],["intTitle","Interaction plot title"],
              ["xLabel","X-axis label"],["yLabel","Y-axis label"]].map(([k,ph])=>(
              <input key={k} placeholder={ph} value={pending[k]}
                     onChange={e => set(k, e.target.value)}
                     style={{ ...inp, marginBottom:"0.38rem" }}/>
            ))}
          </div>

          {/* Run button */}
          <button
            onClick={analysed && dirty && !needsRerun()
              ? handleReplot : handleAnalyze}
            disabled={!canRun}
            style={{ width:"100%", padding:"0.75rem", borderRadius:10,
                     border:"none", background:btnBg,
                     color:!canRun?"#BBBBBB":"#fff",
                     fontSize:"0.84rem", fontWeight:700, letterSpacing:0.3,
                     cursor:!canRun?"not-allowed":"pointer",
                     transition:"background 0.18s",
                     boxShadow:canRun?"0 3px 12px rgba(0,158,115,0.25)":"none" }}>
            {btnLabel}
          </button>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column",
                      gap:"0.9rem" }}>

          {error && (
            <div style={{ background:"#FFF5F5", border:"1.5px solid #FFCCCC",
                          borderRadius:10, padding:"0.7rem 1rem",
                          color:"#CC0000", fontSize:"0.78rem" }}>
              ⚠ {error}
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div style={{ background:"#fff", borderRadius:14,
                          border:"1.5px dashed #E5E5E5",
                          display:"flex", flexDirection:"column",
                          alignItems:"center", justifyContent:"center",
                          padding:"4rem 2rem", textAlign:"center", gap:"0.65rem" }}>
              <span style={{ fontSize:40, opacity:0.15 }}>◈</span>
              <p style={{ margin:0, fontSize:"0.88rem", fontWeight:600,
                          color:"#CCCCCC" }}>
                Upload data and run ANOVA
              </p>
              <p style={{ margin:0, fontSize:"0.72rem", color:"#DDDDDD",
                          maxWidth:380, lineHeight:1.7 }}>
                Select your design (CRD or RBD), assign variables, choose post-hoc
                test and error bar type, then click Run ANOVA.
              </p>
              <div style={{ marginTop:"0.4rem", padding:"0.65rem 1rem",
                background:"#F0F8F0", borderRadius:9, border:"1px solid #B2DDB2",
                fontSize:"0.68rem", color:"#2D9E5F", lineHeight:1.7,
                textAlign:"left", maxWidth:380 }}>
                <strong>Tip:</strong> Use the Data Format Guide (left panel) to
                download example CSVs for each design type.
              </div>
            </div>
          )}

          {loading && (
            <div style={{ background:"#fff", borderRadius:14,
                          border:"1.5px solid #EBEBEB",
                          display:"flex", alignItems:"center",
                          justifyContent:"center", padding:"5rem" }}>
              <span style={{ fontSize:"0.88rem", color:"#009E73",
                             fontWeight:500 }}>Running ANOVA…</span>
            </div>
          )}

          {result && !loading && (<>

            {/* Summary badges */}
            <div style={{ display:"flex", gap:"0.45rem", flexWrap:"wrap" }}>
              {[
                { label: `${result.design?.toUpperCase()} — ${WAYS.find(w=>w.id===result.anova_type)?.label}`,
                  color:"#009E73" },
                { label:`n = ${result.n}`, color:"#0072B2" },
                { label:POSTHOC.find(p=>p.id===result.posthoc)?.label, color:"#CC79A7" },
                { label:ERROR_BARS.find(e=>e.id===result.error_bar)?.label+" error bars",
                  color:"#E69F00" },
              ].map(b => (
                <div key={b.label} style={{
                  background:b.color+"15", border:`1px solid ${b.color}33`,
                  borderRadius:8, padding:"0.3rem 0.72rem",
                  fontSize:"0.68rem", color:b.color, fontWeight:600 }}>
                  {b.label}
                </div>
              ))}
            </div>

            {/* Model formula (result) */}
            {result.formula_display && (
              <div style={{ background:"#1C1C1C", borderRadius:10,
                            padding:"0.65rem 1rem" }}>
                <p style={{ margin:"0 0 0.2rem", fontSize:"0.58rem", fontWeight:700,
                            color:"rgba(255,255,255,0.4)", textTransform:"uppercase",
                            letterSpacing:1.2, fontFamily:"'DM Mono'" }}>
                  ANOVA MODEL
                </p>
                <p style={{ margin:0, fontSize:"0.75rem", fontFamily:"'DM Mono'",
                            color:"#7ECBA1", lineHeight:1.7,
                            wordBreak:"break-all" }}>
                  {result.formula_display}
                </p>
              </div>
            )}

            {/* Plots + tables */}
            <div style={{ background:"#fff", borderRadius:14,
                          border:"1.5px solid #EBEBEB", overflow:"hidden" }}>

              {/* Tab bar */}
              <div style={{ display:"flex", borderBottom:"1px solid #F0F0F0",
                            background:"#FAFAFA", overflowX:"auto" }}>
                <button style={tabBt(activeTab==="bar")}
                        onClick={() => setActiveTab("bar")}>
                  📊 Bar Chart
                </button>
                {hasInt && (
                  <button style={tabBt(activeTab==="interaction")}
                          onClick={() => setActiveTab("interaction")}>
                    🔀 Interaction
                  </button>
                )}
                <button style={tabBt(activeTab==="anova_table")}
                        onClick={() => setActiveTab("anova_table")}>
                  📋 ANOVA Table
                </button>
                <button style={tabBt(activeTab==="posthoc")}
                        onClick={() => setActiveTab("posthoc")}>
                  🔬 Post-hoc
                </button>
                <button style={tabBt(activeTab==="means")}
                        onClick={() => setActiveTab("means")}>
                  📈 Means & CLD
                </button>
              </div>

              {/* Plot tabs */}
              {(activeTab==="bar"||activeTab==="interaction") && (
                <div style={{ position:"relative" }}>
                  {replotting && (
                    <div style={{ position:"absolute", inset:0, zIndex:5,
                      background:"rgba(255,255,255,0.75)",
                      display:"flex", alignItems:"center",
                      justifyContent:"center" }}>
                      <span style={{ fontSize:"0.8rem", color:"#009E73",
                                     fontWeight:600 }}>Updating…</span>
                    </div>
                  )}
                  <img
                    key={`${activeTab}-${plotKey}`}
                    src={`${API_BASE}/api/anova/preview/${sessionId}/${activeTab}?t=${plotKey}`}
                    alt={activeTab}
                    style={{ width:"100%", display:"block" }}
                  />
                </div>
              )}

              {/* ANOVA table */}
              {activeTab==="anova_table" && (
                <div style={{ padding:"1.2rem 1.4rem", overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse",
                                  fontSize:"0.72rem" }}>
                    <thead>
                      <tr>{["Source","SS","df","MS","F","p-value","Sig"].map(h=>(
                        <th key={h} style={{ padding:"0.4rem 0.6rem",
                          textAlign:h==="Source"?"left":"right",
                          color:"#AAAAAA", fontWeight:600,
                          borderBottom:"1.5px solid #F0F0F0",
                          fontFamily:"'DM Mono'" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {result.anova_table.map((row,i) => {
                        const isRes = row.source==="Residual";
                        const isBlk = row.source.startsWith("C(Block)") ||
                                      row.source.startsWith("C("+result.block_col);
                        return (
                          <tr key={i} style={{
                            background:isRes?"#FAFAFA":isBlk?"#F8FBF8":
                                       i%2===0?"#fff":"#FAFAFA",
                            borderTop:isRes?"1.5px solid #EBEBEB":"none",
                          }}>
                            <td style={{ padding:"0.38rem 0.6rem",
                              fontWeight:isRes?400:600,
                              color:isRes?"#AAAAAA":isBlk?"#2D9E5F":"#1C1C1C",
                              fontStyle:isBlk?"italic":"normal" }}>
                              {row.source}
                              {isBlk && (
                                <span style={{ fontSize:"0.58rem", color:"#AAAAAA",
                                               fontStyle:"normal", marginLeft:4 }}>
                                  (block)
                                </span>
                              )}
                            </td>
                            {[row.ss,row.df,row.ms,row.f].map((v,j)=>(
                              <td key={j} style={{ padding:"0.38rem 0.6rem",
                                textAlign:"right", fontFamily:"'DM Mono'",
                                color:"#444", borderBottom:"1px solid #F8F8F8" }}>
                                {v!=null?Number(v).toFixed(j===1?0:3):"—"}
                              </td>
                            ))}
                            <td style={{ padding:"0.38rem 0.6rem", textAlign:"right",
                              fontFamily:"'DM Mono'", borderBottom:"1px solid #F8F8F8",
                              color:row.p!=null&&row.p<0.05?"#009E73":"#888",
                              fontWeight:row.p!=null&&row.p<0.05?700:400 }}>
                              {fmtP(row.p)}
                            </td>
                            <td style={{ padding:"0.38rem 0.6rem", textAlign:"center",
                                         borderBottom:"1px solid #F8F8F8" }}>
                              <SigBadge p={row.p}/>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p style={{ margin:"0.5rem 0 0", fontSize:"0.62rem",
                              color:"#CCCCCC", fontFamily:"'DM Mono'" }}>
                    *** p&lt;0.001 &nbsp;** p&lt;0.01 &nbsp;* p&lt;0.05 &nbsp;ns not significant
                    {result.design==="rbd" && " · Block row shown in italics"}
                  </p>
                </div>
              )}

              {/* Post-hoc */}
              {activeTab==="posthoc" && (
                <div style={{ padding:"1.2rem 1.4rem", overflowX:"auto" }}>
                  <p style={{ margin:"0 0 0.7rem", fontSize:"0.72rem", color:"#888" }}>
                    Pairwise comparisons for{" "}
                    <strong>{result.factor_cols?.[0]}</strong> using{" "}
                    <strong>{POSTHOC.find(p=>p.id===result.posthoc)?.label}</strong>
                  </p>
                  <table style={{ width:"100%", borderCollapse:"collapse",
                                  fontSize:"0.72rem" }}>
                    <thead>
                      <tr>{["Group 1","Group 2","Mean Diff",
                             "p-adj","Sig","Reject H₀"].map(h=>(
                        <th key={h} style={{ padding:"0.4rem 0.6rem",
                          textAlign:h.includes("Group")?"left":"right",
                          color:"#AAAAAA", fontWeight:600,
                          borderBottom:"1.5px solid #F0F0F0",
                          fontFamily:"'DM Mono'" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {result.ph_results.map((row,i)=>(
                        <tr key={i} style={{
                          background:row.reject?"#F0FBF5":
                                     i%2===0?"#fff":"#FAFAFA" }}>
                          <td style={{ padding:"0.35rem 0.6rem",
                                       fontWeight:600, color:"#1C1C1C" }}>
                            {row.group1}
                          </td>
                          <td style={{ padding:"0.35rem 0.6rem",
                                       fontWeight:600, color:"#1C1C1C" }}>
                            {row.group2}
                          </td>
                          <td style={{ padding:"0.35rem 0.6rem",
                            textAlign:"right", fontFamily:"'DM Mono'",
                            color:row.mean_diff>0?"#0072B2":"#D55E00" }}>
                            {row.mean_diff?.toFixed(4)}
                          </td>
                          <td style={{ padding:"0.35rem 0.6rem",
                            textAlign:"right", fontFamily:"'DM Mono'",
                            color:row.reject?"#009E73":"#888",
                            fontWeight:row.reject?700:400 }}>
                            {fmtP(row.p_adj)}
                          </td>
                          <td style={{ padding:"0.35rem 0.6rem",
                                       textAlign:"center" }}>
                            <SigBadge p={row.p_adj}/>
                          </td>
                          <td style={{ padding:"0.35rem 0.6rem",
                            textAlign:"center", fontFamily:"'DM Mono'",
                            color:row.reject?"#009E73":"#AAAAAA",
                            fontSize:"0.65rem" }}>
                            {row.reject?"Yes ✓":"No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Means & CLD */}
              {activeTab==="means" && (
                <div style={{ padding:"1.2rem 1.4rem", overflowX:"auto" }}>
                  <p style={{ margin:"0 0 0.7rem", fontSize:"0.72rem", color:"#888" }}>
                    Treatment means ±{" "}
                    {ERROR_BARS.find(e=>e.id===result.error_bar)?.label} ·{" "}
                    groups sharing a letter are not significantly different (p&gt;0.05)
                  </p>
                  <table style={{ width:"100%", borderCollapse:"collapse",
                                  fontSize:"0.72rem" }}>
                    <thead>
                      <tr>
                        {[...(result.factor_cols||[]),
                          "n","Mean","SD","SEM","95% CI","CLD"].map(h=>(
                          <th key={h} style={{ padding:"0.4rem 0.6rem",
                            textAlign:(result.factor_cols||[]).includes(h)?"left":"right",
                            color:"#AAAAAA", fontWeight:600,
                            borderBottom:"1.5px solid #F0F0F0",
                            fontFamily:"'DM Mono'",
                            whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.means_table?.map((row,i)=>{
                        const pg   = row[result.factor_cols?.[0]];
                        const cldL = result.cld?.[String(pg)] || "";
                        return (
                          <tr key={i} style={{
                            background:i%2===0?"#fff":"#FAFAFA" }}>
                            {(result.factor_cols||[]).map(f=>(
                              <td key={f} style={{ padding:"0.38rem 0.6rem",
                                                   fontWeight:700, color:"#1C1C1C" }}>
                                {row[f]}
                              </td>
                            ))}
                            {["n","mean","sd","sem","ci95"].map(k=>(
                              <td key={k} style={{ padding:"0.38rem 0.6rem",
                                textAlign:"right", fontFamily:"'DM Mono'",
                                color:"#444", borderBottom:"1px solid #F8F8F8" }}>
                                {k==="n"?row[k]:row[k]?.toFixed(4)}
                              </td>
                            ))}
                            <td style={{ padding:"0.38rem 0.6rem",
                              textAlign:"center", fontFamily:"'DM Mono'",
                              fontWeight:700, fontSize:"0.88rem",
                              color:"#009E73",
                              borderBottom:"1px solid #F8F8F8" }}>
                              {cldL}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Download row */}
              <div style={{ padding:"0.72rem 1.2rem",
                            borderTop:"1px solid #F5F5F5",
                            display:"flex", gap:"0.4rem",
                            justifyContent:"flex-end",
                            alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontSize:"0.62rem", color:"#CCCCCC",
                               fontFamily:"'DM Mono'", marginRight:"0.1rem" }}>
                  Download:
                </span>
                {["png","svg"].map(fmt=>(
                  <a key={fmt}
                     href={`${API_BASE}/api/anova/download/${sessionId}/bar_${fmt}`}
                     download={`anova_bar.${fmt}`}
                     style={{ padding:"0.3rem 0.7rem", borderRadius:7,
                       border:"1.5px solid #009E73", background:"#E8F8F3",
                       color:"#009E73", fontSize:"0.65rem", fontWeight:700,
                       textDecoration:"none", fontFamily:"'DM Mono'" }}>
                    ↓ Bar {fmt.toUpperCase()}
                  </a>
                ))}
                {hasInt && ["png","svg"].map(fmt=>(
                  <a key={"i"+fmt}
                     href={`${API_BASE}/api/anova/download/${sessionId}/interaction_${fmt}`}
                     download={`anova_interaction.${fmt}`}
                     style={{ padding:"0.3rem 0.7rem", borderRadius:7,
                       border:"1.5px solid #0072B2", background:"#EAF5FF",
                       color:"#0072B2", fontSize:"0.65rem", fontWeight:700,
                       textDecoration:"none", fontFamily:"'DM Mono'" }}>
                    ↓ Int {fmt.toUpperCase()}
                  </a>
                ))}
                <div style={{ width:1, height:18, background:"#E8E8E8",
                              margin:"0 0.1rem" }}/>
                <a href={`${API_BASE}/api/anova/download/${sessionId}/excel`}
                   download="anova_results.xlsx"
                   style={{ padding:"0.3rem 0.7rem", borderRadius:7,
                     border:"1.5px solid #E69F00", background:"#FDF6E3",
                     color:"#B8860B", fontSize:"0.65rem", fontWeight:700,
                     textDecoration:"none", fontFamily:"'DM Mono'" }}>
                  ↓ Excel
                </a>
              </div>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
