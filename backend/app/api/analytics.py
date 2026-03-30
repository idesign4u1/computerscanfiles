from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, List
import os
from app.services.storage import DatabaseManager

router = APIRouter()
db = DatabaseManager()

FILE_TYPE_CATEGORIES = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff'],
    'Documents': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'],
    'Videos': ['.mp4', '.avi', '.mkv', '.mov', '.flv', '.wmv', '.webm', '.m4v'],
    'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.iso'],
    'Code': ['.js', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go'],
    'Other': []
}

@router.get("/file-types")
async def get_file_type_breakdown(path: Optional[str] = None) -> Dict:
    """Get file type breakdown statistics"""
    try:
        if not path:
            path = "/"
            if os.name == "nt":
                path = "C:\\"

        # Collect file statistics
        file_stats = {category: {"count": 0, "size": 0} for category in FILE_TYPE_CATEGORIES}

        # Walk through the directory
        for root, dirs, files in os.walk(path):
            # Skip system directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                try:
                    file_path = os.path.join(root, file)
                    ext = os.path.splitext(file)[1].lower()
                    size = os.path.getsize(file_path)

                    # Categorize the file
                    category_found = False
                    for category, extensions in FILE_TYPE_CATEGORIES.items():
                        if category != 'Other' and ext in extensions:
                            file_stats[category]["count"] += 1
                            file_stats[category]["size"] += size
                            category_found = True
                            break

                    if not category_found:
                        file_stats['Other']["count"] += 1
                        file_stats['Other']["size"] += size
                except (OSError, PermissionError):
                    continue

        # Format response
        result = []
        for category, stats in file_stats.items():
            if stats["count"] > 0:
                result.append({
                    "name": category,
                    "count": stats["count"],
                    "size": stats["size"]
                })

        return {
            "file_types": result,
            "total_files": sum(s["count"] for s in file_stats.values()),
            "total_size": sum(s["size"] for s in file_stats.values()),
            "scanned_path": path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze file types: {str(e)}")

@router.get("/large-files")
async def get_large_files(path: Optional[str] = None, limit: int = 20) -> Dict:
    """Get largest files in the directory"""
    try:
        if not path:
            path = "/"
            if os.name == "nt":
                path = "C:\\"

        files = []

        # Walk through the directory
        for root, dirs, filenames in os.walk(path):
            # Skip system directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in filenames:
                try:
                    file_path = os.path.join(root, file)
                    size = os.path.getsize(file_path)
                    files.append({
                        "name": file,
                        "path": file_path,
                        "size": size
                    })
                except (OSError, PermissionError):
                    continue

        # Sort by size and return top N
        files.sort(key=lambda x: x["size"], reverse=True)
        return {
            "large_files": files[:limit],
            "total_files_found": len(files),
            "scanned_path": path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get large files: {str(e)}")
