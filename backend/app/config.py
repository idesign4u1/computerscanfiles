import os
from pathlib import Path
from typing import List

# Default excluded folders
DEFAULT_EXCLUSIONS = [
    "$RECYCLE.BIN",
    "System Volume Information",
    ".git",
    ".cache",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
]

# OS-specific exclusions
if os.name == "nt":  # Windows
    DEFAULT_EXCLUSIONS.extend([
        "C:\\Windows",
        "C:\\Program Files",
        "C:\\Program Files (x86)",
        "C:\\ProgramData",
    ])

# Database
DB_PATH = Path(__file__).parent.parent / "disk_analyzer.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Exclusion settings file
EXCLUSIONS_FILE = Path(__file__).parent.parent / "exclusions.json"

class Config:
    excluded_folders: List[str] = DEFAULT_EXCLUSIONS

    @classmethod
    def is_excluded(cls, path: str) -> bool:
        """Check if a path should be excluded from scanning"""
        for excluded in cls.excluded_folders:
            if excluded in path or path.endswith(excluded):
                return True
        return False
