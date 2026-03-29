import os
import asyncio
from pathlib import Path
from typing import List, Optional, Tuple
from datetime import datetime
from app.models.schemas import FileInfo, FolderContents
from app.config import Config

class DiskScanner:
    """Service for scanning disk and collecting file information"""

    def __init__(self):
        self.scanned_files = []
        self.scanned_folders = []

    async def scan_folder(self, folder_path: str) -> FolderContents:
        """Scan a specific folder and return its contents"""
        path = Path(folder_path)

        if not path.exists():
            raise ValueError(f"Path does not exist: {folder_path}")

        if not path.is_dir():
            raise ValueError(f"Path is not a directory: {folder_path}")

        items: List[FileInfo] = []
        total_size = 0

        try:
            for item in path.iterdir():
                # Skip excluded paths
                if Config.is_excluded(str(item)):
                    continue

                try:
                    stat = item.stat()
                    size = stat.st_size if item.is_file() else await self._get_dir_size(item)
                    modified_time = datetime.fromtimestamp(stat.st_mtime)
                    file_type = item.suffix if item.is_file() else "folder"

                    file_info = FileInfo(
                        path=str(item),
                        name=item.name,
                        size=size,
                        is_dir=item.is_dir(),
                        modified_time=modified_time,
                        file_type=file_type
                    )
                    items.append(file_info)
                    total_size += size
                except (OSError, PermissionError):
                    # Skip files we can't access
                    continue
        except PermissionError:
            raise ValueError(f"Permission denied: {folder_path}")

        # Sort by size descending
        items.sort(key=lambda x: x.size, reverse=True)

        return FolderContents(
            path=str(path),
            items=items,
            total_size=total_size
        )

    async def _get_dir_size(self, path: Path) -> int:
        """Recursively calculate directory size"""
        total = 0
        try:
            for entry in path.rglob("*"):
                if entry.is_file():
                    try:
                        total += entry.stat().st_size
                    except (OSError, PermissionError):
                        continue
        except (OSError, PermissionError):
            pass
        return total

    async def scan_disk(self, start_path: str = "/") -> dict:
        """Scan entire disk or partition"""
        path = Path(start_path)

        if not path.exists():
            start_path = self._get_default_scan_path()
            path = Path(start_path)

        total_size = 0
        folder_count = 0
        file_count = 0

        try:
            for item in path.rglob("*"):
                if Config.is_excluded(str(item)):
                    continue

                try:
                    if item.is_file():
                        total_size += item.stat().st_size
                        file_count += 1
                    elif item.is_dir():
                        folder_count += 1
                except (OSError, PermissionError):
                    continue

                # Yield control to event loop
                await asyncio.sleep(0)
        except (OSError, PermissionError):
            pass

        return {
            "total_size": total_size,
            "file_count": file_count,
            "folder_count": folder_count,
            "scanned_path": str(path)
        }

    def _get_default_scan_path(self) -> str:
        """Get default scan path based on OS"""
        if os.name == "nt":  # Windows
            return "C:\\"
        else:  # Unix/Linux/macOS
            return os.path.expanduser("~")

    async def get_file_size(self, file_path: str) -> int:
        """Get size of a single file"""
        path = Path(file_path)
        if path.is_file():
            return path.stat().st_size
        elif path.is_dir():
            return await self._get_dir_size(path)
        return 0
