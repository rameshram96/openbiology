"""
Correlation Module — FastAPI Router
"""

import json
import subprocess
import uuid
from pathlib import Path
from typing import Literal

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

router = APIRouter(prefix="/api/correlation", tags=["Correlation"])

OUTPUT_BASE = Path("outputs/correlation")
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)

R_SCRIPT        = Path(__file__).parent / "r_scripts" / "correlation_analysis.R"
R_HEATMAP_ONLY  = Path(__file__).parent / "r_scripts" / "heatmap_only.R"


def run_r(script: Path, payload: dict, session_dir: Path) -> dict:
    input_file = session_dir / "input.json"
    input_file.write_text(json.dumps(payload))
    result = subprocess.run(
        ["Rscript", str(script), str(input_file), str(session_dir)],
        capture_output=True, text=True, timeout=180,
    )
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"R Error: {result.stderr}")
    try:
        start = result.stdout.index("{")
        return json.loads(result.stdout[start:])
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=500, detail=f"R parse error: {result.stdout}")


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
    filename = file.filename.lower()
    content  = await file.read()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(pd.io.common.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(pd.io.common.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel files supported")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File read error: {str(e)}")

    numeric_df = df.select_dtypes(include="number").dropna(how="all")
    if numeric_df.shape[1] < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 numeric columns")

    session_id  = str(uuid.uuid4())
    session_dir = OUTPUT_BASE / session_id
    session_dir.mkdir(parents=True)

    payload = {
        "data": numeric_df.to_dict(orient="list"),
        "method": method, "sig_level": sig_level,
        "heatmap_palette": heatmap_palette, "axis_font_size": axis_font_size,
        "show_coef": show_coef, "plot_title": plot_title,
        "scatter_dpi": scatter_dpi, "scatter_width": scatter_width,
        "scatter_height": scatter_height,
    }

    result = run_r(R_SCRIPT, payload, session_dir)
    result["session_id"] = session_id
    result["columns"]    = list(numeric_df.columns)
    result["rows"]       = int(numeric_df.shape[0])
    return JSONResponse(content=result)


@router.post("/heatmap/{session_id}")
async def regenerate_heatmap(
    session_id:      str,
    heatmap_palette: str   = Form("RdBu"),
    axis_font_size:  float = Form(0.85),
    show_coef:       bool  = Form(True),
    plot_title:      str   = Form(""),
):
    """Regenerate heatmap only with new visual settings — no re-analysis."""
    session_dir = OUTPUT_BASE / session_id
    result_file = session_dir / "input.json"

    if not result_file.exists():
        raise HTTPException(status_code=404, detail="Session not found. Run analysis first.")

    # Load previously stored analysis result
    stored = json.loads(result_file.read_text())

    payload = {
        "cor_matrix":     stored.get("cor_matrix") or stored.get("data"),
        "p_matrix":       stored.get("p_matrix"),
        "method":         stored.get("method", "pearson"),
        "n":              stored.get("n", 0),
        "heatmap_palette": heatmap_palette,
        "axis_font_size":  axis_font_size,
        "show_coef":       show_coef,
        "plot_title":      plot_title,
    }

    # Save result alongside for heatmap re-use
    heatmap_input = session_dir / "heatmap_input.json"
    heatmap_input.write_text(json.dumps(payload))

    result = subprocess.run(
        ["Rscript", str(R_HEATMAP_ONLY), str(heatmap_input), str(session_dir)],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"R Error: {result.stderr}")

    return JSONResponse(content={"status": "success"})


@router.post("/save-result/{session_id}")
async def save_result(session_id: str, payload: dict):
    """Save full analysis result for later heatmap regeneration."""
    session_dir = OUTPUT_BASE / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    (session_dir / "result.json").write_text(json.dumps(payload))
    return {"status": "saved"}


@router.get("/download/{session_id}/{file_type}")
async def download_file(session_id: str, file_type: Literal["excel", "heatmap", "scatter"]):
    file_map = {
        "excel":   ("correlation_results.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        "heatmap": ("correlation_heatmap.png",  "image/png"),
        "scatter": ("scatter_matrix.png",        "image/png"),
    }
    filename, media_type = file_map[file_type]
    path = OUTPUT_BASE / session_id / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path=str(path), media_type=media_type, filename=filename)


@router.get("/preview/{session_id}/{file_type}")
async def preview_image(session_id: str, file_type: Literal["heatmap", "scatter"]):
    file_map = {"heatmap": "correlation_heatmap.png", "scatter": "scatter_matrix.png"}
    path = OUTPUT_BASE / session_id / file_map[file_type]
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(str(path), media_type="image/png", headers={"Cache-Control": "no-cache"})
