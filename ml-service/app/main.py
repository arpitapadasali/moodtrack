"""FastAPI application entry point for the MoodTrack ML Insights Service."""

import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import MIN_REQUIRED_ENTRIES, NON_CLINICAL_DISCLAIMER
from app.models import (
    PredictRequest,
    PredictResponse,
    HealthResponse,
    MoodDataPoint
)
from app.pattern_detector import extract_all_patterns

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("moodtrack-ml")

app = FastAPI(
    title="MoodTrack ML Insights Service",
    description=(
        "Microservice providing statistical time-series pattern detection "
        "(trends, baseline deviations, sleep-mood correlation, and repeated rhythms) "
        "over anonymized numerical mood data. Non-diagnostic and non-clinical."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local network and containerized environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Verify service uptime and verify operational status."""
    return HealthResponse(
        status="healthy",
        service="moodtrack-ml-insights",
        version="1.0.0",
        disclaimer=NON_CLINICAL_DISCLAIMER
    )


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
async def predict_patterns(payload: PredictRequest):
    """Analyze anonymized numerical mood and sleep history to detect statistical patterns.
    
    If fewer entries than the minimum required threshold are received, returns a clear
    advisory message rather than generating misleading or over-fitted predictions.
    """
    try:
        min_req = payload.min_required or MIN_REQUIRED_ENTRIES

        moods: List[float] = []
        sleeps: List[float] = []
        day_indices: List[Optional[int]] = []

        # 1. Parse structured entries if provided
        if payload.entries:
            for item in payload.entries:
                moods.append(float(item.mood))
                sleeps.append(float(item.sleep_hours))
                day_indices.append(item.day_of_week)

        # 2. Alternatively, parse direct array shortcuts if provided
        elif payload.recent_mood_values:
            moods = [float(m) for m in payload.recent_mood_values]
            if payload.recent_sleep_values and len(payload.recent_sleep_values) == len(moods):
                sleeps = [float(s) for s in payload.recent_sleep_values]
            else:
                # Default baseline sleep when sleep array is omitted
                sleeps = [7.0] * len(moods)
            day_indices = [None] * len(moods)

        total_points = len(moods)

        # Guard against insufficient historical data
        if total_points < min_req:
            logger.info(
                f"Prediction requested with insufficient data points ({total_points} < {min_req}). "
                "Returning safe informational response."
            )
            return PredictResponse(
                status="insufficient_data",
                message=(
                    f"Insufficient historical data for pattern detection. At least {min_req} recorded "
                    f"check-ins are required to identify meaningful patterns without misleading extrapolation "
                    f"({total_points} received)."
                ),
                data_points_analyzed=total_points,
                min_required=min_req,
                disclaimer=NON_CLINICAL_DISCLAIMER,
                insights=None
            )

        # Execute statistical pattern detection suite
        insights = extract_all_patterns(
            moods=moods,
            sleeps=sleeps,
            days=day_indices if any(d is not None for d in day_indices) else None
        )

        logger.info(
            f"Successfully extracted patterns across {total_points} data points "
            f"(Trend: {insights.trend.direction}, Sleep-Mood: {insights.sleep_mood_relationship.relationship_type})."
        )

        return PredictResponse(
            status="success",
            message=f"Successfully identified patterns across {total_points} recorded check-ins.",
            data_points_analyzed=total_points,
            min_required=min_req,
            disclaimer=NON_CLINICAL_DISCLAIMER,
            insights=insights
        )

    except Exception as exc:
        logger.error(f"Error during pattern prediction: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating statistical pattern model: {str(exc)}"
        )
