"""
OpenBiology — Plant Science Data Analysis Suite
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.correlation.router import router as correlation_router

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


@app.get("/")
def root():
    return {"status": "ok", "app": "OpenBiology", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "modules": ["correlation"]}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "modules": ["correlation"]}
