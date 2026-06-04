"""
Seed Germination & Seedling Analysis — FastAPI Router v2
"""
import json, uuid
from pathlib import Path
from typing import Literal, Optional
import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from .analysis import run_analysis, regenerate_plots

router = APIRouter(prefix="/api/seed", tags=["Seed Germination"])
OUTPUT_BASE = Path("outputs/seed_germination")
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
PLOT_FILES = {"gcurve":"germination_curve","rate":"daily_rate",
              "index":"index_comparison","box":"seedling_boxplots","dw":"dryweight_bar"}

def _read(content, filename):
    fn=filename.lower()
    try:
        if fn.endswith(".csv"):    return pd.read_csv(pd.io.common.BytesIO(content))
        elif fn.endswith((".xlsx",".xls")): return pd.read_excel(pd.io.common.BytesIO(content))
        else: raise HTTPException(400,"Only CSV or Excel supported")
    except HTTPException: raise
    except Exception as e: raise HTTPException(400,f"File read error: {e}")

def _params(ps,psh,sg,wr,wh,wg,wu,tg,tr,ti,tb,td):
    return {"point_size":ps,"point_shape":psh,"show_grid":sg,
            "wr":wr,"wh":wh,"wg":wg,"wu":wu,
            "title_gcurve":tg,"title_rate":tr,"title_index":ti,
            "title_box":tb,"title_dw":td}

@router.post("/parse-germ")
async def parse_germ(file: UploadFile = File(...)):
    df=_read(await file.read(),file.filename)
    for col in ("Treatment","Replicate"):
        if col not in df.columns: raise HTTPException(400,f"Missing '{col}' column")
    day_cols=[c for c in df.columns if c not in ("Treatment","Replicate")]
    if not day_cols: raise HTTPException(400,"No day columns found")
    return JSONResponse({"treatments":df["Treatment"].unique().tolist(),
                         "day_cols":day_cols,"n_rows":len(df)})

@router.post("/parse-seed")
async def parse_seed(file: UploadFile = File(...)):
    df=_read(await file.read(),file.filename)
    req=["Treatment","Replicate","Shoot_cm","Root_cm","Shoot_DW_g","Root_DW_g"]
    missing=[c for c in req if c not in df.columns]
    if missing: raise HTTPException(400,f"Missing columns: {missing}")
    return JSONResponse({"treatments":df["Treatment"].unique().tolist(),"n_rows":len(df)})

@router.post("/analyze")
async def analyze(
    germ_file:    Optional[UploadFile]=File(None),
    seed_file:    Optional[UploadFile]=File(None),
    nseeds:       int  =Form(100), control_trt: str  =Form(""),
    point_size:   float=Form(6.0), point_shape: str  =Form("circle"),
    show_grid:    bool =Form(True),
    wr: float=Form(90.0), wh: float=Form(10.0),
    wg: float=Form(0.7),  wu: float=Form(0.3),
    title_gcurve: str=Form("Germination Curve"),
    title_rate:   str=Form("Daily Germination Rate"),
    title_index:  str=Form("Germination Index Comparison"),
    title_box:    str=Form("Seedling Length Distribution"),
    title_dw:     str=Form("Seedling Dry Weight"),
):
    if germ_file is None and seed_file is None:
        raise HTTPException(400,"Upload at least one file")
    germ_data=None; seed_data=None
    if germ_file and germ_file.filename:
        germ_data=_read(await germ_file.read(),germ_file.filename).to_dict(orient="list")
    if seed_file and seed_file.filename:
        seed_data=_read(await seed_file.read(),seed_file.filename).to_dict(orient="list")
    sid=str(uuid.uuid4()); sdir=OUTPUT_BASE/sid; sdir.mkdir(parents=True)
    p=_params(point_size,point_shape,show_grid,wr,wh,wg,wu,
              title_gcurve,title_rate,title_index,title_box,title_dw)
    (sdir/"input.json").write_text(json.dumps(
        {"nseeds":nseeds,"control_trt":control_trt,**p}))
    try:
        result=run_analysis(germ_data,seed_data,nseeds,control_trt,p,sdir)
    except Exception as e: raise HTTPException(500,f"Analysis error: {e}")
    result["session_id"]=sid; result.update(p)
    (sdir/"result.json").write_text(json.dumps(
        {**result,"germ_data":germ_data,"seed_data":seed_data,"nseeds":nseeds},
        default=str))
    return JSONResponse({k:v for k,v in result.items()
                         if k not in ("germ_data","seed_data")})

@router.post("/replot/{session_id}")
async def replot(
    session_id: str,
    point_size: float=Form(6.0), point_shape: str=Form("circle"),
    show_grid:  bool =Form(True),
    wr: float=Form(90.0), wh: float=Form(10.0),
    wg: float=Form(0.7),  wu: float=Form(0.3),
    title_gcurve: str=Form("Germination Curve"),
    title_rate:   str=Form("Daily Germination Rate"),
    title_index:  str=Form("Germination Index Comparison"),
    title_box:    str=Form("Seedling Length Distribution"),
    title_dw:     str=Form("Seedling Dry Weight"),
):
    rf=OUTPUT_BASE/session_id/"result.json"
    if not rf.exists(): raise HTTPException(404,"Session not found")
    stored=json.loads(rf.read_text())
    p=_params(point_size,point_shape,show_grid,wr,wh,wg,wu,
              title_gcurve,title_rate,title_index,title_box,title_dw)
    try: regenerate_plots(stored,p,OUTPUT_BASE/session_id)
    except Exception as e: raise HTTPException(500,f"Plot error: {e}")
    return JSONResponse({"status":"success"})

@router.get("/preview/{session_id}/{plot_type}")
async def preview(session_id:str,
                  plot_type:Literal["gcurve","rate","index","box","dw"]):
    path=OUTPUT_BASE/session_id/(PLOT_FILES[plot_type]+".png")
    if not path.exists(): raise HTTPException(404,"Plot not found")
    return FileResponse(str(path),media_type="image/png",
                        headers={"Cache-Control":"no-cache,no-store"})

@router.get("/download/{session_id}/{fmt}")
async def download(session_id:str,
    fmt:Literal["gcurve_png","gcurve_svg","rate_png","rate_svg",
                "index_png","index_svg","box_png","box_svg",
                "dw_png","dw_svg","excel"]):
    if fmt=="excel":
        p=OUTPUT_BASE/session_id/"seed_results.xlsx"
        return FileResponse(str(p),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="seed_results.xlsx")
    pk,ext=fmt.rsplit("_",1); stem=PLOT_FILES.get(pk)
    if not stem: raise HTTPException(400,"Unknown plot type")
    path=OUTPUT_BASE/session_id/f"{stem}.{ext}"
    if not path.exists(): raise HTTPException(404,"File not found")
    return FileResponse(str(path),
        media_type="image/png" if ext=="png" else "image/svg+xml",
        filename=f"{stem}.{ext}")
