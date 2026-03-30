from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.hasher import DuplicateDetector
from app.models.schemas import DuplicateFile

router = APIRouter()
detector = DuplicateDetector()

@router.get("/find", response_model=List[DuplicateFile])
async def find_duplicates(folder_path: str = Query(...)):
    """Find duplicate files in a folder"""
    try:
        duplicates = await detector.find_duplicates(folder_path)
        return duplicates
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/summary")
async def get_duplicates_summary(folder_path: str = Query(...)):
    """Get summary of duplicate files"""
    try:
        duplicates = await detector.find_duplicates(folder_path)

        total_duplicate_size = sum(d.file_size * (d.count - 1) for d in duplicates)
        total_duplicate_count = sum(d.count for d in duplicates)

        return {
            "duplicate_sets": len(duplicates),
            "total_duplicate_files": total_duplicate_count,
            "total_duplicate_size": total_duplicate_size,
            "potential_space_savings": total_duplicate_size
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
