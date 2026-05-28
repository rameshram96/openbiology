"""
PCA Module — FastAPI Router

Endpoints
  POST /api/pca/columns             → parse file; return numeric + categorical cols
  POST /api/pca/analyze             → full PCA + 4 plots + Excel
  POST /api/pca/replot/{id}         → redraw plots with new visual params
  GET  /api/pca/preview/{id}/{plot} → serve PNG (no-cache)
  GET  /api/pca/download/{id}/{fmt} → download PNG / SVG / Excel
"""

import json
import uuid
from pathlib import Path
from typing import Literal, Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from .analysis import run_pca, regenerate_plots

router = APIRouter(prefix="/api/pca", tags=["PCA"])

OUTPUT_BASE = Path("outputs/pca")
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)

PLOT_FILES = {
    "scree":   "scree_plot",
    "scores":  "score_plot",
    "biplot":  "biplot",
    "loading": "loading_heatmap",
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _read_df(content: bytes, filename: str) -> pd.DataFrame:
    fname = filename.lower()
    try:
        if fname.endswith(".csv"):
            return pd.read_csv(pd.io.common.BytesIO(content))
        elif fname.endswith((".xlsx", ".xls")):
            return pd.read_excel(pd.io.common.BytesIO(content))
        else:
            raise HTTPException(status_code=400,
                                detail="Only CSV or Excel files are supported")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File read error: {e}")


def _build_params(
    scale, n_components, pc_x, pc_y,
    point_size, point_shape,
    show_grid,
    scree_title, score_title, biplot_title, loading_title,
) -> dict:
    return {
        "scale":         scale,
        "n_components":  n_components,
        "pc_x":          pc_x,
        "pc_y":          pc_y,
        "point_size":    point_size,
        "point_shape":   point_shape,
        "show_grid":     show_grid,
        "scree_title":   scree_title,
        "score_title":   score_title,
        "biplot_title":  biplot_title,
        "loading_title": loading_title,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/columns")
async def get_columns(file: UploadFile = File(...)):
    """
    Return numeric and categorical column names.
    Frontend uses numeric_cols for the inclusion checklist;
    categorical_cols for the group-colour selector.
    """
    content = await file.read()
    df      = _read_df(content, file.filename)

    numeric_cols     = list(df.select_dtypes(include="number").columns)
    categorical_cols = list(df.select_dtypes(exclude="number").columns)

    if len(numeric_cols) < 2:
        raise HTTPException(status_code=400,
                            detail="File must contain at least 2 numeric columns")

    return JSONResponse({
        "numeric_cols":     numeric_cols,
        "categorical_cols": categorical_cols,
    })


@router.post("/analyze")
async def analyze(
    file:           UploadFile = File(...),
    # Column selection — JSON arrays serialised as Form strings
    selected_cols:  str  = Form(...),   # e.g. '["col1","col2","col3"]'
    group_col:      str  = Form(""),    # empty string = no grouping
    # PCA parameters
    scale:          bool = Form(True),
    n_components:   int  = Form(5),
    # Plot axes
    pc_x:           int  = Form(1),
    pc_y:           int  = Form(2),
    # Visual params
    point_size:     float = Form(6.0),
    point_shape:    str   = Form("circle"),
    show_grid:      bool  = Form(True),
    scree_title:    str   = Form("Scree Plot"),
    score_title:    str   = Form("PCA Score Plot"),
    biplot_title:   str   = Form("PCA Biplot"),
    loading_title:  str   = Form("PCA Loadings Heatmap"),
):
    content = await file.read()
    df      = _read_df(content, file.filename)

    # Parse selected columns
    try:
        sel_cols = json.loads(selected_cols)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="selected_cols must be a JSON array")

    numeric_df = df.select_dtypes(include="number")
    all_numeric = list(numeric_df.columns)

    # Validate
    invalid = [c for c in sel_cols if c not in all_numeric]
    if invalid:
        raise HTTPException(status_code=400,
                            detail=f"Columns not found or not numeric: {invalid}")
    if len(sel_cols) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 columns")

    # Group data
    gc         = group_col.strip() if group_col else ""
    group_data = list(df[gc].astype(str)) if gc and gc in df.columns else None

    session_id  = str(uuid.uuid4())
    session_dir = OUTPUT_BASE / session_id
    session_dir.mkdir(parents=True)

    params = _build_params(
        scale, n_components, pc_x, pc_y,
        point_size, point_shape, show_grid,
        scree_title, score_title, biplot_title, loading_title,
    )

    # Write raw input for debugging / audit
    (session_dir / "input.json").write_text(json.dumps({
        "selected_cols": sel_cols,
        "group_col":     gc or None,
        **params,
    }))

    try:
        result = run_pca(
            data=numeric_df.to_dict(orient="list"),
            selected_cols=sel_cols,
            group_col=gc or None,
            group_data=group_data,
            params=params,
            session_dir=session_dir,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result["session_id"] = session_id
    result.update(params)

    # Persist — replot reads this
    (session_dir / "result.json").write_text(json.dumps(result))

    # Return stats only (not the raw X_fit matrix — too large for JSON response)
    response = {k: v for k, v in result.items() if k != "X_fit"}
    return JSONResponse(response)


@router.post("/replot/{session_id}")
async def replot(
    session_id:     str,
    pc_x:           int   = Form(1),
    pc_y:           int   = Form(2),
    point_size:     float = Form(6.0),
    point_shape:    str   = Form("circle"),
    show_grid:      bool  = Form(True),
    scree_title:    str   = Form("Scree Plot"),
    score_title:    str   = Form("PCA Score Plot"),
    biplot_title:   str   = Form("PCA Biplot"),
    loading_title:  str   = Form("PCA Loadings Heatmap"),
):
    """Regenerate all four plots with new visual params — no re-analysis."""
    result_file = OUTPUT_BASE / session_id / "result.json"
    if not result_file.exists():
        raise HTTPException(status_code=404,
                            detail="Session not found. Run analysis first.")

    stored = json.loads(result_file.read_text())
    params = _build_params(
        stored.get("scale", True),
        stored.get("n_components", 5),
        pc_x, pc_y,
        point_size, point_shape, show_grid,
        scree_title, score_title, biplot_title, loading_title,
    )

    try:
        regenerate_plots(stored, params, OUTPUT_BASE / session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plot error: {e}")

    return JSONResponse({"status": "success"})


@router.get("/preview/{session_id}/{plot_type}")
async def preview(
    session_id: str,
    plot_type:  Literal["scree", "scores", "biplot", "loading"],
):
    fname = PLOT_FILES[plot_type] + ".png"
    path  = OUTPUT_BASE / session_id / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail="Plot not found")
    return FileResponse(str(path), media_type="image/png",
                        headers={"Cache-Control": "no-cache, no-store"})


@router.get("/download/{session_id}/{fmt}")
async def download(
    session_id: str,
    fmt: Literal["scree_png", "scree_svg",
                 "scores_png", "scores_svg",
                 "biplot_png", "biplot_svg",
                 "loading_png", "loading_svg",
                 "excel"],
):
    if fmt == "excel":
        path = OUTPUT_BASE / session_id / "pca_results.xlsx"
        return FileResponse(str(path),
                            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            filename="pca_results.xlsx")

    plot_key, ext = fmt.rsplit("_", 1)
    stem = PLOT_FILES.get(plot_key)
    if not stem:
        raise HTTPException(status_code=400, detail="Unknown plot type")

    fname      = f"{stem}.{ext}"
    media_type = "image/png" if ext == "png" else "image/svg+xml"
    path       = OUTPUT_BASE / session_id / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{fname} not found")
    return FileResponse(str(path), media_type=media_type, filename=fname)
