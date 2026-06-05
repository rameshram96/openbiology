"""
Correlation Module — FastAPI Router
Python rewrite: replaces subprocess Rscript calls with direct Python calls.
All endpoint URLs, response shapes, and output filenames are unchanged
so the frontend (CorrelationModule.jsx) requires zero modifications.
"""

import json
import uuid
from pathlib import Path
from typing import Literal

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from .analysis import run_analysis, regenerate_heatmap

router = APIRouter(prefix="/api/correlation", tags=["Correlation"])

OUTPUT_BASE = Path("outputs/correlation")
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)


# ─── Helper ───────────────────────────────────────────────────────────────────

def _read_df(content: bytes, filename: str) -> pd.DataFrame:
    fname = filename.lower()
    try:
        if fname.endswith(".csv"):
            return pd.read_csv(pd.io.common.BytesIO(content))
        elif fname.endswith((".xlsx", ".xls")):
            return pd.read_excel(pd.io.common.BytesIO(content))
        else:
            raise HTTPException(
                status_code=400,
                detail="Only CSV or Excel files are supported",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File read error: {e}")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_correlation(
    file:            UploadFile = File(...),
    method:          Literal["pearson", "spearman", "kendall"] = Form("pearson"),
    sig_level:       float = Form(0.05),
    heatmap_palette: str   = Form("RdBu"),
    axis_font_size:  float = Form(0.85),
    show_coef:       bool  = Form(True),
    plot_title:      str   = Form(""),
    scatter_dpi:     int   = Form(150),
    scatter_width:   int   = Form(1200),
    scatter_height:  int   = Form(1000),
):
    content = await file.read()
    df      = _read_df(content, file.filename)

    numeric_df = df.select_dtypes(include="number").dropna(how="all")
    if numeric_df.shape[1] < 2:
        raise HTTPException(
            status_code=400,
            detail="Need at least 2 numeric columns",
        )

    session_id  = str(uuid.uuid4())
    session_dir = OUTPUT_BASE / session_id
    session_dir.mkdir(parents=True)

    params = {
        "heatmap_palette": heatmap_palette,
        "axis_font_size":  axis_font_size,
        "show_coef":       show_coef,
        "plot_title":      plot_title,
        "scatter_dpi":     scatter_dpi,
        "scatter_width":   scatter_width,
        "scatter_height":  scatter_height,
        "sig_level":       sig_level,
    }

    try:
        result = run_analysis(
            data=numeric_df.to_dict(orient="list"),
            method=method,
            params=params,
            session_dir=session_dir,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {e}")

    result["session_id"] = session_id
    result["columns"]    = list(numeric_df.columns)
    result["rows"]       = int(numeric_df.shape[0])
    result.update(params)

    # Persist for heatmap regeneration
    (session_dir / "result.json").write_text(json.dumps(result))

    return JSONResponse(content=result)


@router.post("/heatmap/{session_id}")
async def regenerate_heatmap_endpoint(
    session_id:      str,
    heatmap_palette: str   = Form("RdBu"),
    axis_font_size:  float = Form(0.85),
    show_coef:       bool  = Form(True),
    plot_title:      str   = Form(""),
):
    """Regenerate heatmap only with new visual settings — no re-analysis."""
    result_file = OUTPUT_BASE / session_id / "result.json"
    if not result_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Session not found. Run analysis first.",
        )

    stored = json.loads(result_file.read_text())

    params = {
        "heatmap_palette": heatmap_palette,
        "axis_font_size":  axis_font_size,
        "show_coef":       show_coef,
        "plot_title":      plot_title,
    }

    try:
        regenerate_heatmap(
            cor_mat_list=stored["cor_matrix"],
            p_mat_list=stored["p_matrix"],
            variables=stored["variables"],
            method=stored.get("method", "pearson"),
            n=stored.get("n", 0),
            params=params,
            session_dir=OUTPUT_BASE / session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Heatmap error: {e}")

    return JSONResponse(content={"status": "success"})


@router.get("/download/{session_id}/{file_type}")
async def download_file(
    session_id: str,
    file_type: Literal["excel", "heatmap", "scatter"],
):
    file_map = {
        "excel":   (
            "correlation_results.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ),
        "heatmap": ("correlation_heatmap.png", "image/png"),
        "scatter": ("scatter_matrix.png",       "image/png"),
    }
    filename, media_type = file_map[file_type]
    path = OUTPUT_BASE / session_id / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(
        path=str(path), media_type=media_type, filename=filename,
    )


@router.get("/preview/{session_id}/{file_type}")
async def preview_image(
    session_id: str,
    file_type: Literal["heatmap", "scatter"],
):
    file_map = {
        "heatmap": "correlation_heatmap.png",
        "scatter": "scatter_matrix.png",
    }
    path = OUTPUT_BASE / session_id / file_map[file_type]
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(
        str(path), media_type="image/png",
        headers={"Cache-Control": "no-cache"},
    )
