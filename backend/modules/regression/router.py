from fastapi import APIRouter, UploadFile, File, Form
import pandas as pd
import io
import json

from .analysis import run_regression_analysis

router = APIRouter()


@router.post("/regression")
async def regression_analysis(
    file: UploadFile = File(...),
    dependent_var: str = Form(...),
    independent_vars: str = Form(...)
):

    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))

    elif file.filename.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(contents))

    else:
        return {"error": "Unsupported file format"}

    independent_vars = json.loads(independent_vars)

    results = run_regression_analysis(
        df,
        dependent_var,
        independent_vars
    )

    return results