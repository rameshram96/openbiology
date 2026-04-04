"""
Plant Science Data Analysis Suite — FastAPI App
Add new modules by dropping a folder in /modules/ and registering below.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Module routers ── add one line per new module ──
from modules.correlation.router import router as correlation_router
# from modules.anova.router import router as anova_router
# from modules.pca.router import router as pca_router
# from modules.regression.router import router as regression_router

app = FastAPI(
    title="Plant Science Data Analysis Suite",
    description="Statistical analysis tools for plant science research",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register modules ──
app.include_router(correlation_router)
# app.include_router(anova_router)
# app.include_router(pca_router)
# app.include_router(regression_router)


@app.get("/health")
def health():
    return {"status": "ok", "modules": ["correlation"]}
