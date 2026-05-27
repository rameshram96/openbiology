"""
Two-Variable Correlation — FastAPI Router
Mirrors the architecture of modules/correlation/router.py:
  - POST /api/two-var-correlation/columns   → parse file, return column list
  - POST /api/two-var-correlation/analyze   → full analysis + initial plot
  - POST /api/two-var-correlation/replot/{id} → re-draw with new visual params
  - GET  /api/two-var-correlation/preview/{id} → serve PNG for display
  - GET  /api/two-var-correlation/download/{id}/{fmt} → download PNG or SVG
"""

import json
import uuid
from pathlib import Path
from typing import Literal, Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from .analysis import run_analysis, regenerate_plot

router = APIRouter(prefix="/api/two-var-correlation", tags=["Two-Variable Correlation"])

OUTPUT_BASE = Path("outputs/two_var_correlation")
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _read_file(content: bytes, filename: str) -> pd.DataFrame:
    fname = filename.lower()
    try:
        if fname.endswith(".csv"):
            return pd.read_csv(pd.io.common.BytesIO(content))
        elif fname.endswith((".xlsx", ".xls")):
            return pd.read_excel(pd.io.common.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel files are supported")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File read error: {e}")


def _build_params(
    line_color, show_ci, point_color, point_size, point_shape,
    plot_title, x_label, y_label, show_grid, show_equation, show_n
) -> dict:
    return {
        "line_color":    line_color,
        "show_ci":       show_ci,
        "point_color":   point_color,
        "point_size":    point_size,
        "point_shape":   point_shape,
        "plot_title":    plot_title,
        "x_label":       x_label,
        "y_label":       y_label,
        "show_grid":     show_grid,
        "show_equation": show_equation,
        "show_n":        show_n,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/columns")
async def get_columns(file: UploadFile = File(...)):
    """
    Parse uploaded file and return numeric column names.
    Frontend uses this to decide whether to show column dropdowns.
    """
    content = await file.read()
    df      = _read_file(content, file.filename)

    numeric_cols = list(df.select_dtypes(include="number").columns)
    if len(numeric_cols) < 2:
        raise HTTPException(status_code=400, detail="File must contain at least 2 numeric columns")

    return JSONResponse({
        "columns":  numeric_cols,
        "auto":     len(numeric_cols) == 2,   # True → frontend auto-selects; False → show dropdowns
    })


@router.post("/analyze")
async def analyze(
    file:          UploadFile = File(...),
    x_col:         Optional[str] = Form(None),
    y_col:         Optional[str] = Form(None),
    line_color:    str   = Form("#2166AC"),
    show_ci:       bool  = Form(True),
    point_color:   str   = Form("#444444"),
    point_size:    float = Form(6.0),
    point_shape:   str   = Form("circle"),
    plot_title:    str   = Form(""),
    x_label:       str   = Form(""),
    y_label:       str   = Form(""),
    show_grid:     bool  = Form(True),
    show_equation: bool  = Form(False),
    show_n:        bool  = Form(False),
):
    content    = await file.read()
    df         = _read_file(content, file.filename)
    numeric_df = df.select_dtypes(include="number").dropna(how="all")
    cols       = list(numeric_df.columns)

    if len(cols) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 numeric columns")

    # Auto-select if exactly 2 columns; otherwise validate the provided selection
    if len(cols) == 2:
        x_col, y_col = cols[0], cols[1]
    else:
        if not x_col or not y_col:
            raise HTTPException(status_code=400, detail="Please select X and Y columns")
        if x_col not in cols or y_col not in cols:
            raise HTTPException(status_code=400, detail="Selected columns not found in file")
        if x_col == y_col:
            raise HTTPException(status_code=400, detail="X and Y columns must be different")

    session_id  = str(uuid.uuid4())
    session_dir = OUTPUT_BASE / session_id
    session_dir.mkdir(parents=True)

    params = _build_params(
        line_color, show_ci, point_color, point_size, point_shape,
        plot_title, x_label or x_col, y_label or y_col,
        show_grid, show_equation, show_n
    )

    # Save raw input so the session can be identified later (mirrors correlation pattern)
    (session_dir / "input.json").write_text(json.dumps({
        "x_col": x_col, "y_col": y_col, **params
    }))

    try:
        result = run_analysis(
            numeric_df[x_col].tolist(),
            numeric_df[y_col].tolist(),
            x_col, y_col, params, session_dir
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result["session_id"] = session_id
    result.update(params)

    # Persist result (x_data, y_data, stats, params) — required by replot
    (session_dir / "result.json").write_text(json.dumps(result))

    return JSONResponse(result)


@router.post("/replot/{session_id}")
async def replot(
    session_id:    str,
    line_color:    str   = Form("#2166AC"),
    show_ci:       bool  = Form(True),
    point_color:   str   = Form("#444444"),
    point_size:    float = Form(6.0),
    point_shape:   str   = Form("circle"),
    plot_title:    str   = Form(""),
    x_label:       str   = Form(""),
    y_label:       str   = Form(""),
    show_grid:     bool  = Form(True),
    show_equation: bool  = Form(False),
    show_n:        bool  = Form(False),
):
    """Regenerate plot with new visual settings — no re-analysis, no file re-upload."""
    result_file = OUTPUT_BASE / session_id / "result.json"
    if not result_file.exists():
        raise HTTPException(status_code=404, detail="Session not found. Run analysis first.")

    stored = json.loads(result_file.read_text())
    params = _build_params(
        line_color, show_ci, point_color, point_size, point_shape,
        plot_title,
        x_label or stored.get("x_col", ""),
        y_label or stored.get("y_col", ""),
        show_grid, show_equation, show_n
    )

    try:
        regenerate_plot(stored, params, OUTPUT_BASE / session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plot generation error: {e}")

    return JSONResponse({"status": "success"})


@router.get("/preview/{session_id}")
async def preview(session_id: str):
    path = OUTPUT_BASE / session_id / "scatter_plot.png"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Plot not found")
    return FileResponse(str(path), media_type="image/png",
                        headers={"Cache-Control": "no-cache, no-store"})


@router.get("/download/{session_id}/{fmt}")
async def download(session_id: str, fmt: Literal["png", "svg"]):
    fname      = f"scatter_plot.{fmt}"
    media_type = "image/png" if fmt == "png" else "image/svg+xml"
    path       = OUTPUT_BASE / session_id / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{fname} not found")
    return FileResponse(str(path), media_type=media_type, filename=fname)
