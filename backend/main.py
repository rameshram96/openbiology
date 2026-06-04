"""
OpenBiology — Plant Science Data Analysis Suite
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.correlation.router import router as correlation_router
from modules.two_var_correlation.router import router as two_var_router
from modules.regression.router import router as regression_router
from modules.pca.router import router as pca_router
from modules.seed_germination.router import router as seed_router


app = FastAPI(
    title="OpenBiology",
    description="Comprehensive Data Analysis and Analytical Suite for Plant Science Research",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(correlation_router)
app.include_router(two_var_router)
app.include_router(pca_router)
app.include_router(regression_router)
app.include_router(seed_router)

@app.get("/")
def root():
    return {"status": "ok", "app": "OpenBiology", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "modules": ["correlation"]}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "modules": ["correlation"]}
