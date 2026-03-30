from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict
import json
from datetime import datetime
import os

router = APIRouter()

# Simple in-memory schedule storage (can be replaced with database)
SCHEDULES_FILE = "/tmp/disk_analyzer_schedules.json"

def load_schedules() -> Dict:
    """Load schedules from file"""
    if os.path.exists(SCHEDULES_FILE):
        try:
            with open(SCHEDULES_FILE, 'r') as f:
                return json.load(f)
        except:
            return {"scans": []}
    return {"scans": []}

def save_schedules(schedules: Dict):
    """Save schedules to file"""
    try:
        with open(SCHEDULES_FILE, 'w') as f:
            json.dump(schedules, f, indent=2)
    except Exception as e:
        print(f"Error saving schedules: {e}")

@router.get("/scheduled-scans")
async def get_scheduled_scans() -> Dict:
    """Get all scheduled scans"""
    try:
        schedules = load_schedules()
        return {
            "scans": schedules.get("scans", []),
            "count": len(schedules.get("scans", []))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scheduled scans: {str(e)}")

@router.post("/scheduled-scans")
async def create_scheduled_scan(
    name: str,
    path: str,
    frequency: str,  # 'daily', 'weekly', 'monthly'
    time: str,  # HH:MM format
    enabled: bool = True
) -> Dict:
    """Create a new scheduled scan"""
    try:
        # Validate inputs
        if not name or not path or not frequency or not time:
            raise HTTPException(status_code=400, detail="Missing required fields")

        if frequency not in ['daily', 'weekly', 'monthly']:
            raise HTTPException(status_code=400, detail="Invalid frequency. Must be daily, weekly, or monthly")

        # Validate time format
        try:
            hour, minute = map(int, time.split(':'))
            if not (0 <= hour < 24 and 0 <= minute < 60):
                raise ValueError()
        except:
            raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

        schedules = load_schedules()

        # Create new schedule
        schedule = {
            "id": len(schedules["scans"]) + 1,
            "name": name,
            "path": path,
            "frequency": frequency,
            "time": time,
            "enabled": enabled,
            "created_at": datetime.now().isoformat(),
            "last_run": None,
            "next_run": calculate_next_run(frequency, time)
        }

        schedules["scans"].append(schedule)
        save_schedules(schedules)

        return {
            "success": True,
            "schedule": schedule,
            "message": f"Scheduled scan '{name}' created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create scheduled scan: {str(e)}")

@router.put("/scheduled-scans/{schedule_id}")
async def update_scheduled_scan(
    schedule_id: int,
    name: Optional[str] = None,
    path: Optional[str] = None,
    frequency: Optional[str] = None,
    time: Optional[str] = None,
    enabled: Optional[bool] = None
) -> Dict:
    """Update a scheduled scan"""
    try:
        schedules = load_schedules()

        # Find the schedule
        schedule = None
        for s in schedules["scans"]:
            if s["id"] == schedule_id:
                schedule = s
                break

        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        # Update fields
        if name:
            schedule["name"] = name
        if path:
            schedule["path"] = path
        if frequency:
            if frequency not in ['daily', 'weekly', 'monthly']:
                raise HTTPException(status_code=400, detail="Invalid frequency")
            schedule["frequency"] = frequency
            if time:
                schedule["time"] = time
            schedule["next_run"] = calculate_next_run(frequency, time or schedule["time"])
        if time:
            # Validate time format
            try:
                hour, minute = map(int, time.split(':'))
                if not (0 <= hour < 24 and 0 <= minute < 60):
                    raise ValueError()
                schedule["time"] = time
                schedule["next_run"] = calculate_next_run(schedule["frequency"], time)
            except:
                raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
        if enabled is not None:
            schedule["enabled"] = enabled

        save_schedules(schedules)

        return {
            "success": True,
            "schedule": schedule,
            "message": "Schedule updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update scheduled scan: {str(e)}")

@router.delete("/scheduled-scans/{schedule_id}")
async def delete_scheduled_scan(schedule_id: int) -> Dict:
    """Delete a scheduled scan"""
    try:
        schedules = load_schedules()

        # Find and remove the schedule
        initial_count = len(schedules["scans"])
        schedules["scans"] = [s for s in schedules["scans"] if s["id"] != schedule_id]

        if len(schedules["scans"]) == initial_count:
            raise HTTPException(status_code=404, detail="Schedule not found")

        save_schedules(schedules)

        return {
            "success": True,
            "message": "Schedule deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete scheduled scan: {str(e)}")

@router.post("/scheduled-scans/{schedule_id}/run")
async def run_scheduled_scan(schedule_id: int) -> Dict:
    """Manually trigger a scheduled scan"""
    try:
        schedules = load_schedules()

        # Find the schedule
        schedule = None
        for s in schedules["scans"]:
            if s["id"] == schedule_id:
                schedule = s
                break

        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        if not schedule["enabled"]:
            raise HTTPException(status_code=400, detail="Schedule is disabled")

        # Update last_run and next_run times
        schedule["last_run"] = datetime.now().isoformat()
        schedule["next_run"] = calculate_next_run(schedule["frequency"], schedule["time"])

        save_schedules(schedules)

        return {
            "success": True,
            "message": f"Scan for '{schedule['name']}' triggered",
            "path": schedule["path"],
            "schedule": schedule
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run scheduled scan: {str(e)}")

def calculate_next_run(frequency: str, time: str) -> str:
    """Calculate next run time"""
    try:
        now = datetime.now()
        hour, minute = map(int, time.split(':'))

        if frequency == 'daily':
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= now:
                # If time has passed today, schedule for tomorrow
                from datetime import timedelta
                next_run += timedelta(days=1)

        elif frequency == 'weekly':
            # Schedule for next week at the same time
            from datetime import timedelta
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=7)

        elif frequency == 'monthly':
            # Schedule for next month at the same time
            from datetime import timedelta
            try:
                # Try to use the same day next month
                if now.month == 12:
                    next_run = now.replace(year=now.year + 1, month=1, hour=hour, minute=minute, second=0, microsecond=0)
                else:
                    next_run = now.replace(month=now.month + 1, hour=hour, minute=minute, second=0, microsecond=0)
                if next_run <= now:
                    # If we're already past that time, add another month
                    if next_run.month == 12:
                        next_run = next_run.replace(year=next_run.year + 1, month=1)
                    else:
                        next_run = next_run.replace(month=next_run.month + 1)
            except ValueError:
                # Handle case where day doesn't exist in next month
                from datetime import timedelta
                next_run += timedelta(days=30)
                next_run = next_run.replace(hour=hour, minute=minute)

        return next_run.isoformat()
    except:
        return datetime.now().isoformat()
