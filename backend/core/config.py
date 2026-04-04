"""
Shared configuration — available to all modules.
"""
from pathlib import Path

BASE_DIR    = Path(__file__).parent.parent
OUTPUTS_DIR = BASE_DIR / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)
