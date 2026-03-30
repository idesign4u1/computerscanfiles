import sqlite3
import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from app.config import DB_PATH, EXCLUSIONS_FILE, Config

class DatabaseManager:
    """SQLite database manager for storing scan results and exclusions"""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Files table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY,
                path TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                size INTEGER NOT NULL,
                is_dir BOOLEAN NOT NULL,
                modified_time TIMESTAMP NOT NULL,
                file_type TEXT,
                file_hash TEXT
            )
        """)

        # Scan history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY,
                start_path TEXT NOT NULL,
                total_size INTEGER NOT NULL,
                file_count INTEGER NOT NULL,
                folder_count INTEGER NOT NULL,
                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()

    def save_file_info(self, file_info: dict):
        """Save file information to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT OR REPLACE INTO files
                (path, name, size, is_dir, modified_time, file_type, file_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                file_info.get("path"),
                file_info.get("name"),
                file_info.get("size"),
                file_info.get("is_dir"),
                file_info.get("modified_time"),
                file_info.get("file_type"),
                file_info.get("file_hash")
            ))
            conn.commit()
        finally:
            conn.close()

    def clear_scan_cache(self):
        """Clear all cached file information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM files")
        conn.commit()
        conn.close()

    def get_file_info(self, path: str) -> Optional[dict]:
        """Get file information from cache"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            cursor.execute("SELECT * FROM files WHERE path = ?", (path,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def save_scan_history(self, start_path: str, scan_result: dict):
        """Save scan history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO scans (start_path, total_size, file_count, folder_count)
                VALUES (?, ?, ?, ?)
            """, (
                start_path,
                scan_result.get("total_size", 0),
                scan_result.get("file_count", 0),
                scan_result.get("folder_count", 0)
            ))
            conn.commit()
        finally:
            conn.close()

    def load_exclusions(self) -> List[str]:
        """Load exclusion list from file"""
        if EXCLUSIONS_FILE.exists():
            try:
                with open(EXCLUSIONS_FILE, "r") as f:
                    data = json.load(f)
                    return data.get("excluded_folders", Config.DEFAULT_EXCLUSIONS)
            except (json.JSONDecodeError, IOError):
                return Config.DEFAULT_EXCLUSIONS
        return Config.DEFAULT_EXCLUSIONS

    def save_exclusions(self, excluded_folders: List[str]):
        """Save exclusion list to file"""
        with open(EXCLUSIONS_FILE, "w") as f:
            json.dump({"excluded_folders": excluded_folders}, f, indent=2)
        Config.excluded_folders = excluded_folders

    def add_exclusion(self, folder_path: str):
        """Add a folder to exclusion list"""
        exclusions = self.load_exclusions()
        if folder_path not in exclusions:
            exclusions.append(folder_path)
            self.save_exclusions(exclusions)

    def remove_exclusion(self, folder_path: str):
        """Remove a folder from exclusion list"""
        exclusions = self.load_exclusions()
        if folder_path in exclusions:
            exclusions.remove(folder_path)
            self.save_exclusions(exclusions)
