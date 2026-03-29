import hashlib
import asyncio
from pathlib import Path
from typing import Dict, List
from app.models.schemas import DuplicateFile

class DuplicateDetector:
    """Service for detecting duplicate files based on hash"""

    def __init__(self, chunk_size: int = 8192):
        self.chunk_size = chunk_size
        self.file_hashes: Dict[str, List[str]] = {}

    async def find_duplicates(self, folder_path: str) -> List[DuplicateFile]:
        """Find duplicate files in a folder"""
        path = Path(folder_path)

        if not path.exists() or not path.is_dir():
            raise ValueError(f"Invalid folder path: {folder_path}")

        self.file_hashes.clear()

        # Hash all files
        for file_path in path.rglob("*"):
            if file_path.is_file():
                try:
                    file_hash = await self._hash_file(file_path)
                    if file_hash not in self.file_hashes:
                        self.file_hashes[file_hash] = []
                    self.file_hashes[file_hash].append(str(file_path))
                except (OSError, PermissionError):
                    continue

                # Yield control
                await asyncio.sleep(0)

        # Build list of duplicates
        duplicates = []
        for file_hash, paths in self.file_hashes.items():
            if len(paths) > 1:
                file_size = Path(paths[0]).stat().st_size
                duplicates.append(DuplicateFile(
                    file_hash=file_hash,
                    file_size=file_size,
                    paths=paths,
                    count=len(paths)
                ))

        return duplicates

    async def _hash_file(self, file_path: Path) -> str:
        """Calculate SHA256 hash of a file"""
        sha256_hash = hashlib.sha256()

        try:
            with open(file_path, "rb") as f:
                while True:
                    data = f.read(self.chunk_size)
                    if not data:
                        break
                    sha256_hash.update(data)
                    # Yield control to event loop
                    await asyncio.sleep(0)
        except (OSError, PermissionError):
            raise

        return sha256_hash.hexdigest()
