"""Convenience entry point for running the MoodTrack FastAPI ML service."""

import uvicorn
from app.config import HOST, PORT

if __name__ == "__main__":
    print(f"Starting MoodTrack ML Insights Service on {HOST}:{PORT}...")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
