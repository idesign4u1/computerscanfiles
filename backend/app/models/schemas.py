from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FileInfo(BaseModel):
    """File or folder information"""
    path: str
    name: str
    size: int
    is_dir: bool
    modified_time: datetime
    file_type: Optional[str] = None  # Extension or folder type

class FolderContents(BaseModel):
    """Contents of a folder"""
    path: str
    items: List[FileInfo]
    total_size: int

class DiskStats(BaseModel):
    """Overall disk statistics"""
    total_size: int
    used_size: int
    free_size: int
    percent_used: float
    scanned_at: datetime

class DuplicateFile(BaseModel):
    """File that has duplicates"""
    file_hash: str
    file_size: int
    paths: List[str]
    count: int

class ScanProgress(BaseModel):
    """Scan progress information"""
    status: str  # scanning, completed, failed
    current_path: Optional[str] = None
    files_scanned: int = 0
    folders_scanned: int = 0
    percent_complete: float = 0.0

class ExclusionList(BaseModel):
    """List of excluded folders"""
    excluded_folders: List[str]
