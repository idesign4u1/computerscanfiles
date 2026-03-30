from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import shutil
import os
import json
from app.services.scanner import DiskScanner
from app.services.storage import DatabaseManager
from app.models.schemas import DiskStats
from datetime import datetime

router = APIRouter()
scanner = DiskScanner()
db = DatabaseManager()

# Store current scan progress
_scan_progress = {
    "current_file": None,
    "files_scanned": 0,
    "total_size": 0,
    "is_scanning": False,
}

@router.get("/start")
async def start_scan(path: Optional[str] = None):
    """Start scanning disk or specific folder"""
    try:
        if not path:
            path = "/"  # Scan home directory by default
            if os.name == "nt":
                path = "C:\\"

        # Clear previous cache
        db.clear_scan_cache()

        # Perform scan
        result = await scanner.scan_disk(path)

        # Save to history
        db.save_scan_history(path, result)

        return {
            "status": "completed",
            "scanned_path": result["scanned_path"],
            "total_size": result["total_size"],
            "file_count": result["file_count"],
            "folder_count": result["folder_count"],
            "timestamp": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.get("/progress")
async def get_scan_progress():
    """Get current scan progress"""
    return _scan_progress

@router.get("/stats")
async def get_disk_stats(path: Optional[str] = None) -> DiskStats:
    """Get disk space statistics"""
    try:
        if not path:
            path = "/"
            if os.name == "nt":
                path = "C:\\"

        usage = shutil.disk_usage(path)

        return DiskStats(
            total_size=usage.total,
            used_size=usage.used,
            free_size=usage.free,
            percent_used=round((usage.used / usage.total) * 100, 2),
            scanned_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
