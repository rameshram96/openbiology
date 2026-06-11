"""
ANOVA Suite — FastAPI Router v2
Designs: CRD (1/2/3-way), RBD (1/2/3-way)
"""
import json, uuid
from pathlib import Path
from typing import Literal, Optional
import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from .analysis import run_anova, regenerate_plots, model_formula_display

router = APIRouter(prefix="/api/anova", tags=["ANOVA"])
OUTPUT_BASE = Path("outputs/anova")
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
PLOT_FILES  = {"bar": "bar_plot", "interaction": "interaction_plot"}


def _read_df(content, filename):
    fn = filename.lower()
    try:
        if fn.endswith(".csv"):
            return pd.read_csv(pd.io.common.BytesIO(content))
        elif fn.endswith((".xlsx",".xls")):
            return pd.read_excel(pd.io.common.BytesIO(content))
        else:
            raise HTTPException(400,"Only CSV or Excel supported")
    except HTTPException: raise
    except Exception as e: raise HTTPException(400, f"File read error: {e}")


def _build_params(bar_title, int_title, x_label, y_label,
                  font_size, show_grid, bar_colors):
    return {"bar_title": bar_title, "int_title": int_title,
            "x_label": x_label,   "y_label": y_label,
            "font_size": font_size, "show_grid": show_grid,
            "bar_colors": bar_colors}


@router.post("/columns")
async def get_columns(file: UploadFile = File(...)):
    content = await file.read()
    df      = _read_df(content, file.filename)
    numeric = list(df.select_dtypes(include="number").columns)
    categ   = list(df.select_dtypes(exclude="number").columns)
    if not numeric:
        raise HTTPException(400, "No numeric columns found")
    return JSONResponse({"numeric_cols": numeric, "categorical_cols": categ,
                         "all_cols": list(df.columns)})


@router.post("/formula")
async def get_formula(
    y_col:       str = Form(...),
    factor_cols: str = Form(...),
    block_col:   str = Form(""),
    design:      str = Form("crd"),
):
    """Return the model formula string for live display — no file needed."""
    try:
        facs    = json.loads(factor_cols)
        blk     = block_col.strip() or None
        formula = model_formula_display(y_col, facs, blk, design)
        return JSONResponse({"formula": formula})
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/analyze")
async def analyze(
    file:        UploadFile = File(...),
    y_col:       str   = Form(...),
    factor_cols: str   = Form(...),
    block_col:   str   = Form(""),
    design:      str   = Form("crd"),
    anova_type:  str   = Form("one_way"),
    posthoc:     str   = Form("tukey"),
    error_bar:   str   = Form("sem"),
    bar_title:   str   = Form(""),
    int_title:   str   = Form(""),
    x_label:     str   = Form(""),
    y_label:     str   = Form(""),
    font_size:   float = Form(10.0),
    show_grid:   bool  = Form(True),
    bar_colors:  str   = Form(""),
):
    content = await file.read()
    df      = _read_df(content, file.filename)

    try:
        fac_list = json.loads(factor_cols)
    except Exception:
        raise HTTPException(400, "factor_cols must be a JSON array")

    try:
        colors = json.loads(bar_colors) if bar_colors.strip() else []
    except Exception:
        colors = []

    blk = block_col.strip() or None

    # Validate
    all_cols = list(df.columns)
    bad = [f for f in fac_list if f not in all_cols]
    if bad:
        raise HTTPException(400, f"Factor columns not found: {bad}")
    if y_col not in all_cols:
        raise HTTPException(400, f"Response column '{y_col}' not found")
    if blk and blk not in all_cols:
        raise HTTPException(400, f"Block column '{blk}' not found")

    n_required = {"one_way":1,"two_way":2,"three_way":3}[anova_type]
    if len(fac_list) != n_required:
        raise HTTPException(400,
            f"{anova_type} requires {n_required} factor(s), got {len(fac_list)}")
    if design == "rbd" and not blk:
        raise HTTPException(400, "RBD requires a block column")

    sid  = str(uuid.uuid4())
    sdir = OUTPUT_BASE / sid
    sdir.mkdir(parents=True)

    params = _build_params(bar_title, int_title, x_label, y_label,
                           font_size, show_grid, colors)

    (sdir/"input.json").write_text(json.dumps({
        "y_col": y_col, "factor_cols": fac_list,
        "block_col": blk, "design": design,
        "anova_type": anova_type, "posthoc": posthoc,
        "error_bar": error_bar, **params
    }))

    try:
        result = run_anova(
            df.to_dict(orient="list"),
            y_col, fac_list, blk,
            design, posthoc, error_bar,
            params, sdir,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Analysis error: {e}")

    result["session_id"] = sid
    result["anova_type"] = anova_type
    result.update(params)

    (sdir/"result.json").write_text(json.dumps(result, default=str))
    resp = {k: v for k, v in result.items() if k != "raw_data"}
    return JSONResponse(resp)


@router.post("/replot/{session_id}")
async def replot(
    session_id: str,
    bar_title:  str   = Form(""),
    int_title:  str   = Form(""),
    x_label:    str   = Form(""),
    y_label:    str   = Form(""),
    font_size:  float = Form(10.0),
    show_grid:  bool  = Form(True),
    bar_colors: str   = Form(""),
):
    rf = OUTPUT_BASE / session_id / "result.json"
    if not rf.exists():
        raise HTTPException(404, "Session not found")
    stored = json.loads(rf.read_text())
    try:
        colors = json.loads(bar_colors) if bar_colors.strip() else []
    except Exception:
        colors = []
    params = _build_params(bar_title, int_title, x_label, y_label,
                           font_size, show_grid, colors)
    try:
        regenerate_plots(stored, params, OUTPUT_BASE / session_id)
    except Exception as e:
        raise HTTPException(500, f"Plot error: {e}")
    return JSONResponse({"status": "success"})


@router.get("/preview/{session_id}/{plot_type}")
async def preview(session_id: str,
                  plot_type: Literal["bar","interaction"]):
    path = OUTPUT_BASE / session_id / (PLOT_FILES[plot_type] + ".png")
    if not path.exists():
        raise HTTPException(404, "Plot not found")
    return FileResponse(str(path), media_type="image/png",
                        headers={"Cache-Control":"no-cache,no-store"})


@router.get("/download/{session_id}/{fmt}")
async def download(session_id: str,
    fmt: Literal["bar_png","bar_svg",
                 "interaction_png","interaction_svg","excel"]):
    if fmt == "excel":
        p = OUTPUT_BASE / session_id / "anova_results.xlsx"
        return FileResponse(str(p),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="anova_results.xlsx")
    plot_key, ext = fmt.rsplit("_", 1)
    stem = PLOT_FILES.get(plot_key)
    if not stem:
        raise HTTPException(400, "Unknown plot type")
    path = OUTPUT_BASE / session_id / f"{stem}.{ext}"
    if not path.exists():
        raise HTTPException(404, f"{stem}.{ext} not found")
    return FileResponse(str(path),
        media_type="image/png" if ext=="png" else "image/svg+xml",
        filename=f"{stem}.{ext}")
