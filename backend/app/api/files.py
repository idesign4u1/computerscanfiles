from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import shutil
from app.services.scanner import DiskScanner
from app.models.schemas import FolderContents

router = APIRouter()
scanner = DiskScanner()

@router.get("/folder")
async def get_folder_contents(path: str = Query(...)) -> FolderContents:
    """Get contents of a folder"""
    try:
        return await scanner.scan_folder(path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/delete")
async def delete_file(path: str = Query(...)):
    """Delete a file or folder"""
    try:
        file_path = Path(path)

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File or folder not found")

        if file_path.is_file():
            file_path.unlink()
            return {"status": "deleted", "type": "file", "path": path}
        elif file_path.is_dir():
            shutil.rmtree(file_path)
            return {"status": "deleted", "type": "folder", "path": path}
        else:
            raise HTTPException(status_code=400, detail="Invalid path")

    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@router.get("/size")
async def get_file_size(path: str = Query(...)):
    """Get size of a file or folder"""
    try:
        size = await scanner.get_file_size(path)
        return {"path": path, "size": size}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/exclusions/add")
async def add_exclusion(folder_path: str = Query(...)):
    """Add a folder to exclusion list"""
    from app.services.storage import DatabaseManager
    db = DatabaseManager()
    db.add_exclusion(folder_path)
    return {"status": "added", "folder_path": folder_path}

@router.post("/exclusions/remove")
async def remove_exclusion(folder_path: str = Query(...)):
    """Remove a folder from exclusion list"""
    from app.services.storage import DatabaseManager
    db = DatabaseManager()
    db.remove_exclusion(folder_path)
    return {"status": "removed", "folder_path": folder_path}

@router.get("/exclusions")
async def get_exclusions():
    """Get list of excluded folders"""
    from app.services.storage import DatabaseManager
    db = DatabaseManager()
    exclusions = db.load_exclusions()
    return {"excluded_folders": exclusions}
