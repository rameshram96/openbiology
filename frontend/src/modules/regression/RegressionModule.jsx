import { useState, useRef } from "react";

const API_BASE = "https://openbiology-backend.onrender.com";

const SWATCHES = [
  { hex:"#0072B2",name:"Steel Blue"},{ hex:"#D55E00",name:"Vermillion"},
  { hex:"#009E73",name:"Forest Green"},{ hex:"#E69F00",name:"Orange"},
  { hex:"#CC79A7",name:"Pink"},{ hex:"#56B4E9",name:"Sky Blue"},
  { hex:"#737373",name:"Slate Grey"},{ hex:"#1C1C1C",name:"Black"},
];
const SHAPES=[{id:"circle",glyph:"●"},{id:"triangle",glyph:"▲"},
              {id:"square",glyph:"■"},{id:"diamond",glyph:"◆"},{id:"cross",glyph:"✚"}];
const PLOT_TABS=[{id:"fvo",label:"Fitted vs Observed"},{id:"rvf",label:"Residuals vs Fitted"},
                 {id:"qq",label:"Q-Q Plot"},{id:"forest",label:"Coefficients"}];
const REG_TYPES=[{id:"simple",label:"Simple Linear",desc:"One X, one Y"},
                 {id:"multiple",label:"Multiple Linear",desc:"Many X, one Y"},
                 {id:"stepwise",label:"Stepwise",desc:"Auto variable selection"}];
const DEFAULT={pointColor:"#0072B2",pointSize:6,pointShape:"circle",showGrid:true,
  titleFvo:"Fitted vs Observed",titleRvf:"Residuals vs Fitted",
  titleQq:"Normal Q-Q Plot",titleCoef:"Coefficient Plot (95% CI)",
  regType:"multiple",stepwiseDir:"both",stepwiseCriterion:"aic",stepwiseThreshold:0.05};

function SL({children}){return <p style={{margin:"0 0 0.45rem",fontSize:"0.6rem",fontWeight:700,color:"#AAAAAA",textTransform:"uppercase",letterSpacing:1.2,fontFamily:"'DM Mono',monospace"}}>{children}</p>;}
function Toggle({active,onToggle,label}){return <button onClick={onToggle} style={{display:"inline-flex",alignItems:"center",gap:"0.3rem",padding:"0.28rem 0.6rem",borderRadius:7,fontSize:"0.7rem",fontWeight:600,cursor:"pointer",userSelect:"none",border:`1.5px solid ${active?"#0072B2":"#E5E5E5"}`,background:active?"#EAF5FF":"#FAFAFA",color:active?"#0072B2":"#AAAAAA",transition:"all 0.14s"}}><span style={{fontSize:"0.5rem"}}>{active?"●":"○"}</span>{label}</button>;}
function SwatchRow({selected,onChange}){return <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem"}}>{SWATCHES.map(s=><div key={s.hex} title={s.name} onClick={()=>onChange(s.hex)} style={{width:20,height:20,borderRadius:"50%",background:s.hex,cursor:"pointer",border:`2.5px solid ${selected===s.hex?"#1C1C1C":"transparent"}`,boxShadow:"0 1px 3px rgba(0,0,0,0.15)",transition:"border 0.12s"}}/>)}</div>;}
function formatP(p){if(p===null||p===undefined)return "—";return p<0.001?"< 0.001":p.toFixed(4);}
function stars(p){if(!p&&p!==0)return "";return p<0.001?"***":p<0.01?"**":p<0.05?"*":"ns";}

export default function RegressionModule(){
  const [file,setFile]=useState(null);
  const [columns,setColumns]=useState([]);
  const [yCol,setYCol]=useState("");
  const [xCols,setXCols]=useState([]);
  const [pending,setPending]=useState(DEFAULT);
  const [params,setParams]=useState(DEFAULT);
  const [result,setResult]=useState(null);
  const [sessionId,setSessionId]=useState(null);
  const [activeTab,setActiveTab]=useState("fvo");
  const [plotKey,setPlotKey]=useState(0);
  const [loading,setLoading]=useState(false);
  const [replotting,setReplotting]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [error,setError]=useState("");
  const fileRef=useRef();

  const set=(k,v)=>{setPending(p=>({...p,[k]:v}));if(sessionId)setDirty(true);};
  const needsRerun=()=>pending.regType!==params.regType||pending.stepwiseDir!==params.stepwiseDir||pending.stepwiseCriterion!==params.stepwiseCriterion||pending.stepwiseThreshold!==params.stepwiseThreshold;

  const buildFD=(p)=>{
    const fd=new FormData();
    fd.append("point_color",p.pointColor);fd.append("point_size",p.pointSize);
    fd.append("point_shape",p.pointShape);fd.append("show_grid",p.showGrid);
    fd.append("title_fvo",p.titleFvo);fd.append("title_rvf",p.titleRvf);
    fd.append("title_qq",p.titleQq);fd.append("title_coef",p.titleCoef);
    return fd;
  };

  const handleFile=async(e)=>{
    const f=e.target.files[0];if(!f)return;
    setFile(f);setResult(null);setSessionId(null);setError("");setDirty(false);setColumns([]);setYCol("");setXCols([]);
    const fd=new FormData();fd.append("file",f);
    try{const res=await fetch(`${API_BASE}/api/regression/columns`,{method:"POST",body:fd});
        const data=await res.json();if(!res.ok)throw new Error(data.detail||"Cannot read file");
        setColumns(data.columns);}catch(err){setError(err.message);}
  };

  const toggleX=(col)=>{
    if(col===yCol)return;
    setXCols(prev=>prev.includes(col)?prev.length>1?prev.filter(c=>c!==col):prev:[...prev,col]);
    if(sessionId)setDirty(true);
  };

  const handleAnalyze=async()=>{
    if(!file||!yCol||!xCols.length)return;
    setLoading(true);setError("");
    const fd=buildFD(pending);
    fd.append("file",file);fd.append("y_col",yCol);fd.append("x_cols",JSON.stringify(xCols));
    fd.append("reg_type",pending.regType);fd.append("stepwise_dir",pending.stepwiseDir);
    fd.append("stepwise_criterion",pending.stepwiseCriterion);fd.append("stepwise_threshold",pending.stepwiseThreshold);
    try{const res=await fetch(`${API_BASE}/api/regression/analyze`,{method:"POST",body:fd});
        const data=await res.json();if(!res.ok)throw new Error(data.detail||"Analysis failed");
        setResult(data);setSessionId(data.session_id);setParams({...pending});setPlotKey(k=>k+1);setDirty(false);
    }catch(err){setError(err.message);}finally{setLoading(false);}
  };

  const handleReplot=async()=>{
    if(!sessionId)return;setReplotting(true);setError("");
    try{const res=await fetch(`${API_BASE}/api/regression/replot/${sessionId}`,{method:"POST",body:buildFD(pending)});
        if(!res.ok){const d=await res.json();throw new Error(d.detail||"Replot failed");}
        setParams({...pending});setPlotKey(k=>k+1);setDirty(false);
    }catch(err){setError(err.message);}finally{setReplotting(false);}
  };

  const card={background:"#fff",borderRadius:12,border:"1.5px solid #EBEBEB",padding:"1rem 1.1rem"};
  const inp={width:"100%",border:"1.5px solid #E8E8E8",borderRadius:8,padding:"0.38rem 0.65rem",fontSize:"0.76rem",color:"#1C1C1C",background:"#FAFAFA",boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"};
  const sel={...inp,cursor:"pointer"};
  const divr={height:1,background:"#F0F0F0",margin:"0.75rem 0"};
  const modeBtn=(active)=>({flex:1,padding:"0.55rem",border:"none",background:active?"#fff":"transparent",borderBottom:active?"2px solid #0072B2":"2px solid transparent",color:active?"#0072B2":"#AAAAAA",fontSize:"0.72rem",fontWeight:active?700:500,cursor:"pointer",transition:"all 0.14s"});
  const analysed=!!result;
  const canRun=file&&yCol&&xCols.length>0&&!loading&&!replotting;
  const btnLabel=loading?"Running…":replotting?"Updating…":analysed&&dirty&&needsRerun()?"⟳ Re-run":analysed&&dirty?"⟳ Update Plots":analysed?"✓ Up to date":"▶ Run Regression";
  const btnBg=!canRun?"#E5E5E5":analysed&&dirty&&needsRerun()?"#D55E00":analysed&&dirty?"#E69F00":analysed?"#009E73":"#0072B2";

  return(
    <div style={{minHeight:"100vh",background:"#F7F7F5",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{background:"#1C1C1C",padding:"1rem 2rem",display:"flex",alignItems:"center",gap:"0.85rem"}}>
        <span style={{fontSize:20,color:"#CC79A7"}}>◬</span>
        <div>
          <h1 style={{margin:0,color:"#fff",fontSize:"0.95rem",fontWeight:700}}>Regression Analysis</h1>
          <p style={{margin:0,color:"rgba(255,255,255,0.45)",fontSize:"0.65rem",fontFamily:"'DM Mono'"}}>Simple · Multiple · Stepwise</p>
        </div>
      </div>
      <div style={{maxWidth:1120,margin:"0 auto",padding:"1.5rem",display:"flex",gap:"1.25rem",alignItems:"flex-start"}}>
        <div style={{width:300,flexShrink:0,display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div style={card}>
            <SL>📂 Data</SL>
            <div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${file?"#0072B2":"#DDDDDD"}`,borderRadius:10,padding:"0.9rem",textAlign:"center",cursor:"pointer",background:file?"#EAF5FF":"#FAFAFA"}}>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}} onChange={handleFile}/>
              <p style={{margin:0,fontSize:"0.72rem",color:file?"#0072B2":"#BBBBBB",fontWeight:file?600:400}}>{file?`📄 ${file.name}`:"Click to upload CSV or Excel"}</p>
            </div>
            {columns.length>0&&(<>
              <div style={divr}/>
              <div style={{marginBottom:"0.5rem"}}>
                <SL>Y (dependent)</SL>
                <select value={yCol} onChange={e=>{setYCol(e.target.value);setXCols([]);if(sessionId)setDirty(true);}} style={sel}>
                  <option value="">— select Y —</option>
                  {columns.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <SL>X columns ({xCols.length} selected)</SL>
              <div style={{maxHeight:150,overflowY:"auto",border:"1px solid #F0F0F0",borderRadius:8,padding:"0.4rem 0.55rem",display:"flex",flexDirection:"column",gap:"0.28rem"}}>
                {columns.filter(c=>c!==yCol).map(col=>(
                  <label key={col} style={{display:"flex",alignItems:"center",gap:"0.4rem",cursor:"pointer",fontSize:"0.74rem",color:"#444"}}>
                    <input type="checkbox" checked={xCols.includes(col)} onChange={()=>toggleX(col)}
                      disabled={pending.regType==="simple"&&xCols.length>0&&!xCols.includes(col)}
                      style={{accentColor:"#0072B2",width:13,height:13}}/>
                    <span style={{fontFamily:"'DM Mono'",fontSize:"0.68rem",color:xCols.includes(col)?"#1C1C1C":"#BBBBBB"}}>{col}</span>
                  </label>
                ))}
              </div>
            </>)}
          </div>
          <div style={card}>
            <SL>📐 Regression Type</SL>
            <div style={{display:"flex",flexDirection:"column",gap:"0.38rem"}}>
              {REG_TYPES.map(t=>(
                <button key={t.id} onClick={()=>set("regType",t.id)} style={{padding:"0.5rem 0.75rem",borderRadius:9,cursor:"pointer",textAlign:"left",border:`1.5px solid ${pending.regType===t.id?"#0072B2":"#E8E8E8"}`,background:pending.regType===t.id?"#EAF5FF":"#FAFAFA",transition:"all 0.13s"}}>
                  <p style={{margin:0,fontSize:"0.78rem",fontWeight:700,color:pending.regType===t.id?"#0072B2":"#555"}}>{t.label}</p>
                  <p style={{margin:0,fontSize:"0.63rem",color:"#AAAAAA"}}>{t.desc}</p>
                </button>
              ))}
            </div>
            {pending.regType==="stepwise"&&(
              <div style={{marginTop:"0.65rem",padding:"0.7rem",background:"#F8FAFF",borderRadius:8,border:"1px solid #E0EEFF",display:"flex",flexDirection:"column",gap:"0.45rem"}}>
                <div><SL>Direction</SL>
                  <select value={pending.stepwiseDir} onChange={e=>set("stepwiseDir",e.target.value)} style={sel}>
                    <option value="forward">Forward</option>
                    <option value="backward">Backward</option>
                    <option value="both">Both (bidirectional)</option>
                  </select>
                </div>
                <div><SL>Criterion</SL>
                  <select value={pending.stepwiseCriterion} onChange={e=>set("stepwiseCriterion",e.target.value)} style={sel}>
                    <option value="aic">AIC</option>
                    <option value="bic">BIC</option>
                    <option value="p_value">p-value threshold</option>
                  </select>
                </div>
                {pending.stepwiseCriterion==="p_value"&&(
                  <div><SL>p threshold — {pending.stepwiseThreshold}</SL>
                    <input type="range" min={0.01} max={0.2} step={0.01} value={pending.stepwiseThreshold}
                      onChange={e=>set("stepwiseThreshold",parseFloat(e.target.value))} style={{width:"100%",accentColor:"#0072B2"}}/>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={card}>
            <SL>● Point Style</SL>
            <SwatchRow selected={pending.pointColor} onChange={v=>set("pointColor",v)}/>
            <div style={divr}/>
            <div style={{display:"flex",gap:"0.25rem",marginBottom:"0.55rem"}}>
              {SHAPES.map(s=>(
                <button key={s.id} title={s.id} onClick={()=>set("pointShape",s.id)} style={{width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:"0.82rem",border:`1.5px solid ${pending.pointShape===s.id?"#0072B2":"#E8E8E8"}`,background:pending.pointShape===s.id?"#EAF5FF":"#FAFAFA",color:pending.pointShape===s.id?"#0072B2":"#AAAAAA",transition:"all 0.12s"}}>{s.glyph}</button>
              ))}
            </div>
            <SL>Size — {pending.pointSize}</SL>
            <input type="range" min={3} max={14} step={0.5} value={pending.pointSize} onChange={e=>set("pointSize",parseFloat(e.target.value))} style={{width:"100%",accentColor:"#0072B2"}}/>
          </div>
          <div style={card}>
            <SL>🏷 Plot Titles & Grid</SL>
            {[["titleFvo","Fitted vs Observed title"],["titleRvf","Residuals vs Fitted title"],["titleQq","Q-Q plot title"],["titleCoef","Coefficient plot title"]].map(([k,ph])=>(
              <input key={k} placeholder={ph} value={pending[k]} onChange={e=>set(k,e.target.value)} style={{...inp,marginBottom:"0.38rem"}}/>
            ))}
            <Toggle active={pending.showGrid} onToggle={()=>set("showGrid",!pending.showGrid)} label="Grid lines"/>
          </div>
          <button onClick={analysed&&dirty&&!needsRerun()?handleReplot:handleAnalyze} disabled={!canRun}
            style={{width:"100%",padding:"0.72rem",borderRadius:10,border:"none",background:btnBg,color:!canRun?"#BBBBBB":"#fff",fontSize:"0.82rem",fontWeight:700,letterSpacing:0.3,cursor:!canRun?"not-allowed":"pointer",transition:"background 0.18s"}}>
            {btnLabel}
          </button>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:"0.9rem"}}>
          {error&&<div style={{background:"#FFF5F5",border:"1.5px solid #FFCCCC",borderRadius:10,padding:"0.7rem 1rem",color:"#CC0000",fontSize:"0.78rem"}}>⚠ {error}</div>}
          {!result&&!loading&&(
            <div style={{background:"#fff",borderRadius:14,border:"1.5px dashed #E5E5E5",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"5rem 2rem",textAlign:"center",gap:"0.55rem"}}>
              <span style={{fontSize:34,opacity:0.18}}>◬</span>
              <p style={{margin:0,fontSize:"0.88rem",fontWeight:600,color:"#CCCCCC"}}>Upload a file and run regression</p>
              <p style={{margin:0,fontSize:"0.72rem",color:"#DDDDDD"}}>Plots and statistics will appear here</p>
            </div>
          )}
          {loading&&<div style={{background:"#fff",borderRadius:14,border:"1.5px solid #EBEBEB",display:"flex",alignItems:"center",justifyContent:"center",padding:"5rem"}}><span style={{fontSize:"0.88rem",color:"#0072B2",fontWeight:500}}>Running regression…</span></div>}
          {result&&!loading&&(<>
            {result.reg_type==="stepwise"&&(
              <div style={{background:"#EAF5FF",borderRadius:10,border:"1px solid #B5D4F4",padding:"0.6rem 1rem",fontSize:"0.74rem",color:"#0072B2"}}>
                Selected predictors: <strong>{result.final_cols.join(", ")}</strong> · {result.fit_stats.k} of {xCols.length} variables retained
              </div>
            )}
            <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #EBEBEB",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:"1px solid #F0F0F0",background:"#FAFAFA"}}>
                {PLOT_TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={modeBtn(activeTab===t.id)}>{t.label}</button>)}
              </div>
              <div style={{position:"relative"}}>
                {replotting&&<div style={{position:"absolute",inset:0,zIndex:5,background:"rgba(255,255,255,0.75)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:"0.8rem",color:"#0072B2",fontWeight:600}}>Updating…</span></div>}
                <img key={`${activeTab}-${plotKey}`} src={`${API_BASE}/api/regression/preview/${sessionId}/${activeTab}?t=${plotKey}`} alt={activeTab} style={{width:"100%",display:"block"}}/>
              </div>
              <div style={{padding:"0.7rem 1rem",borderTop:"1px solid #F5F5F5",display:"flex",gap:"0.4rem",justifyContent:"flex-end",alignItems:"center"}}>
                <span style={{fontSize:"0.62rem",color:"#CCCCCC",fontFamily:"'DM Mono'",marginRight:"0.2rem"}}>Download:</span>
                {["png","svg"].map(fmt=>(
                  <a key={fmt} href={`${API_BASE}/api/regression/download/${sessionId}/${activeTab}_${fmt}`} download={`${activeTab}.${fmt}`}
                    style={{padding:"0.3rem 0.7rem",borderRadius:7,border:"1.5px solid #0072B2",background:"#EAF5FF",color:"#0072B2",fontSize:"0.65rem",fontWeight:700,textDecoration:"none",fontFamily:"'DM Mono'"}}>
                    ↓ {fmt.toUpperCase()}
                  </a>
                ))}
                <div style={{width:1,height:18,background:"#E8E8E8",margin:"0 0.2rem"}}/>
                <a href={`${API_BASE}/api/regression/download/${sessionId}/excel`} download="regression_results.xlsx"
                  style={{padding:"0.3rem 0.7rem",borderRadius:7,border:"1.5px solid #009E73",background:"#E8F8F3",color:"#009E73",fontSize:"0.65rem",fontWeight:700,textDecoration:"none",fontFamily:"'DM Mono'"}}>
                  ↓ Excel
                </a>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.85rem"}}>
              <div style={card}>
                <SL>📊 Model Fit</SL>
                {[["R²",result.fit_stats.r2?.toFixed(4)],["Adjusted R²",result.fit_stats.adj_r2?.toFixed(4)],["RMSE",result.fit_stats.rmse?.toFixed(4)],["F-statistic",result.fit_stats.f_stat?.toFixed(3)],["F p-value",formatP(result.fit_stats.f_pval)],["AIC",result.fit_stats.aic?.toFixed(2)],["BIC",result.fit_stats.bic?.toFixed(2)],["n",result.fit_stats.n]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"0.32rem 0",borderBottom:"1px solid #F5F5F5",fontSize:"0.74rem"}}>
                    <span style={{color:"#888"}}>{l}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600,color:l==="F p-value"&&result.fit_stats.f_pval<0.05?"#009E73":"#1C1C1C"}}>{v??'—'}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <SL>📋 ANOVA</SL>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.68rem"}}>
                    <thead><tr>{["Source","SS","df","MS","F","p"].map(h=><th key={h} style={{padding:"0.3rem 0.4rem",textAlign:"right",color:"#AAAAAA",fontWeight:600,borderBottom:"1px solid #F0F0F0",fontFamily:"'DM Mono'"}}>{h}</th>)}</tr></thead>
                    <tbody>{result.anova.map(row=>(
                      <tr key={row.source}>
                        <td style={{padding:"0.3rem 0.4rem",color:"#555",fontWeight:600}}>{row.source}</td>
                        {[row.ss?.toFixed(3),row.df,row.ms?.toFixed(3)??"—",row.f?.toFixed(3)??"—",row.p!==null&&row.p!==undefined?formatP(row.p):"—"].map((v,i)=>(
                          <td key={i} style={{padding:"0.3rem 0.4rem",textAlign:"right",fontFamily:"'DM Mono'",color:i===4&&row.p<0.05?"#009E73":"#1C1C1C",borderBottom:"1px solid #F8F8F8"}}>{v}</td>
                        ))}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style={card}>
              <SL>🔢 Coefficients</SL>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.7rem"}}>
                  <thead><tr>{["Variable","β","SE","t","p-value","Sig","CI lower","CI upper"].map(h=><th key={h} style={{padding:"0.35rem 0.55rem",textAlign:"right",color:"#AAAAAA",fontWeight:600,borderBottom:"1.5px solid #F0F0F0",fontFamily:"'DM Mono'",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>{result.coef_table.map(row=>(
                    <tr key={row.variable} style={{background:row.p<0.05?"#F5FBF7":"transparent"}}>
                      <td style={{padding:"0.35rem 0.55rem",fontWeight:700,color:"#1C1C1C"}}>{row.variable}</td>
                      {[row.beta.toFixed(4),row.se.toFixed(4),row.t.toFixed(3)].map((v,i)=><td key={i} style={{padding:"0.35rem 0.55rem",textAlign:"right",fontFamily:"'DM Mono'",borderBottom:"1px solid #F8F8F8"}}>{v}</td>)}
                      <td style={{padding:"0.35rem 0.55rem",textAlign:"right",fontFamily:"'DM Mono'",color:row.p<0.001?"#009E73":row.p<0.05?"#E69F00":"#D55E00",fontWeight:600,borderBottom:"1px solid #F8F8F8"}}>{formatP(row.p)}</td>
                      <td style={{padding:"0.35rem 0.55rem",textAlign:"center",fontFamily:"'DM Mono'",color:"#555",borderBottom:"1px solid #F8F8F8"}}>{stars(row.p)}</td>
                      {[row.ci_lower.toFixed(4),row.ci_upper.toFixed(4)].map((v,i)=><td key={i} style={{padding:"0.35rem 0.55rem",textAlign:"right",fontFamily:"'DM Mono'",color:"#888",borderBottom:"1px solid #F8F8F8"}}>{v}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p style={{margin:"0.5rem 0 0",fontSize:"0.62rem",color:"#CCCCCC",fontFamily:"'DM Mono'"}}>*** p&lt;0.001 ** p&lt;0.01 * p&lt;0.05 ns not significant</p>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
