"""
Regression Module — FastAPI Router
  POST /api/regression/columns
  POST /api/regression/analyze
  POST /api/regression/replot/{id}
  GET  /api/regression/preview/{id}/{plot}
  GET  /api/regression/download/{id}/{fmt}
"""
import json, uuid
from pathlib import Path
from typing import Literal
import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from .analysis import run_regression, regenerate_plots

router = APIRouter(prefix="/api/regression", tags=["Regression"])
OUTPUT_BASE = Path("outputs/regression")
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
PLOT_FILES = {"fvo":"fitted_vs_observed","rvf":"residuals_vs_fitted",
              "qq":"qq_plot","forest":"coef_forest"}

def _read_df(content, filename):
    fn = filename.lower()
    try:
        if fn.endswith(".csv"):   return pd.read_csv(pd.io.common.BytesIO(content))
        elif fn.endswith((".xlsx",".xls")): return pd.read_excel(pd.io.common.BytesIO(content))
        else: raise HTTPException(400, "Only CSV or Excel supported")
    except HTTPException: raise
    except Exception as e: raise HTTPException(400, f"File read error: {e}")

def _params(pc,ps,psh,sg,t1,t2,t3,t4):
    return {"point_color":pc,"point_size":ps,"point_shape":psh,"show_grid":sg,
            "title_fvo":t1,"title_rvf":t2,"title_qq":t3,"title_coef":t4}

@router.post("/columns")
async def get_columns(file: UploadFile = File(...)):
    df = _read_df(await file.read(), file.filename)
    cols = list(df.select_dtypes(include="number").columns)
    if len(cols) < 2: raise HTTPException(400,"Need at least 2 numeric columns")
    return JSONResponse({"columns": cols})

@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    y_col: str = Form(...), x_cols: str = Form(...),
    reg_type: str = Form("multiple"),
    stepwise_dir: str = Form("both"), stepwise_criterion: str = Form("aic"),
    stepwise_threshold: float = Form(0.05),
    point_color: str = Form("#0072B2"), point_size: float = Form(6.0),
    point_shape: str = Form("circle"), show_grid: bool = Form(True),
    title_fvo: str = Form("Fitted vs Observed"),
    title_rvf: str = Form("Residuals vs Fitted"),
    title_qq:  str = Form("Normal Q-Q Plot"),
    title_coef:str = Form("Coefficient Plot (95% CI)"),
):
    content = await file.read()
    df = _read_df(content, file.filename)
    try: x_list = json.loads(x_cols)
    except: raise HTTPException(400,"x_cols must be JSON array")
    num_cols = list(df.select_dtypes(include="number").columns)
    bad = [c for c in ([y_col]+x_list) if c not in num_cols]
    if bad: raise HTTPException(400,f"Columns not found/not numeric: {bad}")
    if y_col in x_list: raise HTTPException(400,"Y cannot also be X")
    if not x_list: raise HTTPException(400,"Select at least one X column")

    sid = str(uuid.uuid4())
    sdir = OUTPUT_BASE/sid; sdir.mkdir(parents=True)
    p = _params(point_color,point_size,point_shape,show_grid,
                title_fvo,title_rvf,title_qq,title_coef)
    (sdir/"input.json").write_text(json.dumps(
        {"y_col":y_col,"x_cols":x_list,"reg_type":reg_type,
         "stepwise_dir":stepwise_dir,"stepwise_criterion":stepwise_criterion,
         "stepwise_threshold":stepwise_threshold,**p}))
    try:
        result = run_regression(
            df.select_dtypes(include="number").to_dict(orient="list"),
            y_col,x_list,reg_type,stepwise_dir,stepwise_criterion,
            stepwise_threshold,p,sdir)
    except ValueError as e: raise HTTPException(400,str(e))
    except Exception as e:  raise HTTPException(500,f"Analysis error: {e}")
    result["session_id"]=sid; result.update(p)
    (sdir/"result.json").write_text(json.dumps(result))
    resp = {k:v for k,v in result.items()
            if k not in ("y_actual","y_fitted","residuals")}
    return JSONResponse(resp)

@router.post("/replot/{session_id}")
async def replot(
    session_id: str,
    point_color: str = Form("#0072B2"), point_size: float = Form(6.0),
    point_shape: str = Form("circle"),  show_grid: bool = Form(True),
    title_fvo: str = Form("Fitted vs Observed"),
    title_rvf: str = Form("Residuals vs Fitted"),
    title_qq:  str = Form("Normal Q-Q Plot"),
    title_coef:str = Form("Coefficient Plot (95% CI)"),
):
    rf = OUTPUT_BASE/session_id/"result.json"
    if not rf.exists(): raise HTTPException(404,"Session not found")
    stored = json.loads(rf.read_text())
    p = _params(point_color,point_size,point_shape,show_grid,
                title_fvo,title_rvf,title_qq,title_coef)
    try: regenerate_plots(stored,p,OUTPUT_BASE/session_id)
    except Exception as e: raise HTTPException(500,f"Plot error: {e}")
    return JSONResponse({"status":"success"})

@router.get("/preview/{session_id}/{plot_type}")
async def preview(session_id:str, plot_type:Literal["fvo","rvf","qq","forest"]):
    path = OUTPUT_BASE/session_id/(PLOT_FILES[plot_type]+".png")
    if not path.exists(): raise HTTPException(404,"Plot not found")
    return FileResponse(str(path),media_type="image/png",
                        headers={"Cache-Control":"no-cache, no-store"})

@router.get("/download/{session_id}/{fmt}")
async def download(session_id:str,
    fmt:Literal["fvo_png","fvo_svg","rvf_png","rvf_svg",
                "qq_png","qq_svg","forest_png","forest_svg","excel"]):
    if fmt=="excel":
        p=OUTPUT_BASE/session_id/"regression_results.xlsx"
        return FileResponse(str(p),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="regression_results.xlsx")
    plot_key,ext=fmt.rsplit("_",1)
    stem=PLOT_FILES.get(plot_key)
    if not stem: raise HTTPException(400,"Unknown plot type")
    path=OUTPUT_BASE/session_id/f"{stem}.{ext}"
    if not path.exists(): raise HTTPException(404,"File not found")
    return FileResponse(str(path),
        media_type="image/png" if ext=="png" else "image/svg+xml",
        filename=f"{stem}.{ext}")
