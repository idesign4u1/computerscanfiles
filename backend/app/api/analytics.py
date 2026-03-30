from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, List
import os
import time
from datetime import datetime, timedelta
from app.services.storage import DatabaseManager
import hashlib

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

@router.get("/cleanup-recommendations")
async def get_cleanup_recommendations(path: Optional[str] = None) -> Dict:
    """Generate cleanup recommendations based on file analysis"""
    try:
        if not path:
            path = "/"
            if os.name == "nt":
                path = "C:\\"

        recommendations = {
            "old_files": [],
            "duplicate_candidates": [],
            "temp_files": [],
            "large_unused": [],
            "total_savings_possible": 0
        }

        # Temporary file patterns
        temp_patterns = ['.tmp', '.temp', '.bak', '.backup', '.cache', '.log', '~']
        old_file_days = 365  # Files older than 1 year
        current_time = time.time()

        # Collect all files
        all_files = []
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                try:
                    file_path = os.path.join(root, file)
                    size = os.path.getsize(file_path)
                    mod_time = os.path.getmtime(file_path)
                    ext = os.path.splitext(file)[1].lower()

                    all_files.append({
                        "name": file,
                        "path": file_path,
                        "size": size,
                        "mod_time": mod_time,
                        "ext": ext
                    })
                except (OSError, PermissionError):
                    continue

        # Analyze for old files (older than 1 year)
        for file in all_files:
            age_days = (current_time - file["mod_time"]) / (24 * 3600)
            if age_days > old_file_days:
                recommendations["old_files"].append({
                    "name": file["name"],
                    "path": file["path"],
                    "size": file["size"],
                    "age_days": int(age_days),
                    "last_modified": datetime.fromtimestamp(file["mod_time"]).isoformat()
                })
                recommendations["total_savings_possible"] += file["size"]

        # Analyze for temporary files
        for file in all_files:
            is_temp = any(file["name"].endswith(pattern) for pattern in temp_patterns)
            if is_temp or file["ext"] in temp_patterns:
                recommendations["temp_files"].append({
                    "name": file["name"],
                    "path": file["path"],
                    "size": file["size"]
                })
                recommendations["total_savings_possible"] += file["size"]

        # Find duplicate candidates (same filename and size)
        file_signatures = {}
        for file in all_files:
            key = (file["name"], file["size"])
            if key not in file_signatures:
                file_signatures[key] = []
            file_signatures[key].append(file)

        for (name, size), files in file_signatures.items():
            if len(files) > 1:
                # Keep first, mark rest as duplicates
                for dup_file in files[1:]:
                    recommendations["duplicate_candidates"].append({
                        "name": dup_file["name"],
                        "path": dup_file["path"],
                        "size": dup_file["size"],
                        "duplicate_count": len(files) - 1
                    })
                    recommendations["total_savings_possible"] += dup_file["size"]

        # Find large unused files (large + not modified recently)
        for file in all_files:
            size_mb = file["size"] / (1024 * 1024)
            age_days = (current_time - file["mod_time"]) / (24 * 3600)

            # Large (> 100MB) and not modified in 90 days
            if size_mb > 100 and age_days > 90:
                # Only add if not already in other categories
                if not any(f["path"] == file["path"] for f in recommendations["old_files"] + recommendations["temp_files"]):
                    recommendations["large_unused"].append({
                        "name": file["name"],
                        "path": file["path"],
                        "size": file["size"],
                        "age_days": int(age_days),
                        "size_mb": round(size_mb, 2)
                    })

        # Sort by size
        for category in ["old_files", "temp_files", "duplicate_candidates", "large_unused"]:
            recommendations[category].sort(key=lambda x: x["size"], reverse=True)
            # Keep only top 20 per category
            recommendations[category] = recommendations[category][:20]

        # Limit total savings possible (avoid double counting)
        # Recalculate to avoid double-counting
        recommendations["total_savings_possible"] = 0
        seen_paths = set()
        for category in ["old_files", "temp_files", "duplicate_candidates", "large_unused"]:
            for item in recommendations[category]:
                if item["path"] not in seen_paths:
                    recommendations["total_savings_possible"] += item["size"]
                    seen_paths.add(item["path"])

        return {
            "recommendations": recommendations,
            "scanned_path": path,
            "file_count": len(all_files),
            "analysis_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cleanup recommendations: {str(e)}")

@router.get("/file-age-stats")
async def get_file_age_stats(path: Optional[str] = None) -> Dict:
    """Get file age distribution statistics"""
    try:
        if not path:
            path = "/"
            if os.name == "nt":
                path = "C:\\"

        current_time = time.time()
        age_groups = {
            'last_30_days': {'count': 0, 'size': 0},
            'last_90_days': {'count': 0, 'size': 0},
            'last_year': {'count': 0, 'size': 0},
            'older_than_year': {'count': 0, 'size': 0}
        }

        total_size = 0
        total_files = 0
        sum_age = 0

        # Walk through directory
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                try:
                    file_path = os.path.join(root, file)
                    size = os.path.getsize(file_path)
                    mod_time = os.path.getmtime(file_path)

                    # Calculate age in days
                    age_days = (current_time - mod_time) / (24 * 3600)

                    total_size += size
                    total_files += 1
                    sum_age += age_days

                    # Categorize by age
                    if age_days <= 30:
                        age_groups['last_30_days']['count'] += 1
                        age_groups['last_30_days']['size'] += size
                    elif age_days <= 90:
                        age_groups['last_90_days']['count'] += 1
                        age_groups['last_90_days']['size'] += size
                    elif age_days <= 365:
                        age_groups['last_year']['count'] += 1
                        age_groups['last_year']['size'] += size
                    else:
                        age_groups['older_than_year']['count'] += 1
                        age_groups['older_than_year']['size'] += size

                except (OSError, PermissionError):
                    continue

        # Calculate average age
        average_age = sum_age / total_files if total_files > 0 else 0

        return {
            "age_groups": age_groups,
            "total_files": total_files,
            "total_size": total_size,
            "average_age_days": average_age,
            "scanned_path": path,
            "analysis_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file age stats: {str(e)}")
