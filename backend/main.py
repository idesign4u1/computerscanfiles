from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import scan, files, duplicates, analytics, reports, scheduling

app = FastAPI(
    title="Disk Space Analyzer API",
    description="API for analyzing disk space usage",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scan.router, prefix="/api/scan", tags=["Scanning"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(duplicates.router, prefix="/api/duplicates", tags=["Duplicates"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(scheduling.router, prefix="/api/scheduling", tags=["Scheduling"])

@app.get("/")
async def root():
    return {"message": "Disk Space Analyzer API"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
