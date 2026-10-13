"""Pydantic request and response schemas for the ML Insights service."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MoodDataPoint(BaseModel):
    """Anonymized numerical observation for a single check-in."""
    mood: float = Field(..., ge=1.0, le=5.0, description="Mood score on a 1.0 to 5.0 scale")
    sleep_hours: float = Field(..., ge=0.0, le=24.0, description="Recorded duration of sleep in hours")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="Day of week index (0=Sunday ... 6=Saturday or 0=Monday ... 6=Sunday)")
    date: Optional[str] = Field(None, description="Optional ISO date string for chronological sequencing")


class PredictRequest(BaseModel):
    """Payload containing anonymized numerical mood and sleep history."""
    entries: Optional[List[MoodDataPoint]] = Field(
        default=None,
        description="Chronological series of recorded mood data points"
    )
    recent_mood_values: Optional[List[float]] = Field(
        default=None,
        description="Direct sequence of recent numerical mood values"
    )
    recent_sleep_values: Optional[List[float]] = Field(
        default=None,
        description="Direct sequence of recent numerical sleep duration values"
    )
    min_required: Optional[int] = Field(
        default=None,
        description="Optional override for the minimum required entries threshold"
    )


class TrendPattern(BaseModel):
    """Identified upward, downward, or stable trajectory in mood values."""
    direction: str = Field(..., description="'upward', 'downward', or 'stable'")
    slope: float = Field(..., description="Estimated slope per check-in index from linear regression")
    r_squared: float = Field(..., description="Coefficient of determination for the fitted trend line")
    baseline_mean: float = Field(..., description="Overall baseline mean mood score")
    recent_mean: float = Field(..., description="Mean mood score over recent observations")
    confidence: str = Field(..., description="'high', 'moderate', or 'low'")
    description: str = Field(..., description="Neutral observation describing the trajectory")


class DeviationPattern(BaseModel):
    """Anomaly or unusual divergence from the user's historical baseline."""
    has_unusual_deviation: bool = Field(..., description="True if latest entry deviates significantly from baseline")
    severity: str = Field(..., description="'none', 'moderate', or 'notable'")
    latest_mood: float = Field(..., description="Most recent mood score evaluated")
    baseline_mean: float = Field(..., description="Mean of historical baseline entries")
    baseline_std: float = Field(..., description="Standard deviation of baseline entries")
    z_score: float = Field(..., description="Standard score (number of standard deviations from mean)")
    description: str = Field(..., description="Neutral observation describing divergence")


class SleepMoodPattern(BaseModel):
    """Statistical association between recorded sleep duration and mood."""
    relationship_type: str = Field(..., description="'positive', 'negative', or 'neutral'")
    correlation_coefficient: float = Field(..., description="Pearson r correlation coefficient")
    regression_slope: float = Field(..., description="Estimated change in mood per additional hour of sleep")
    r_squared: float = Field(..., description="Variance in mood explained by sleep duration")
    avg_mood_adequate_sleep: Optional[float] = Field(None, description="Average mood when sleep is >= 7 hours")
    avg_mood_low_sleep: Optional[float] = Field(None, description="Average mood when sleep is < 7 hours")
    description: str = Field(..., description="Neutral observation of sleep-mood relationship")


class RepeatedPattern(BaseModel):
    """Cyclical, day-of-week, or sequential rhythm patterns."""
    has_cyclical_pattern: bool = Field(..., description="True if clear recurring rhythm or day variation is detected")
    highest_day: Optional[str] = Field(None, description="Day of week with highest average recorded mood")
    highest_avg_mood: Optional[float] = Field(None, description="Average mood on the highest day")
    lowest_day: Optional[str] = Field(None, description="Day of week with lowest average recorded mood")
    lowest_avg_mood: Optional[float] = Field(None, description="Average mood on the lowest day")
    autocorrelation_lag1: Optional[float] = Field(None, description="First-order lag autocorrelation coefficient")
    pattern_type: Optional[str] = Field(None, description="Identified rhythm pattern classification")
    description: str = Field(..., description="Neutral observation of repeated rhythms")


class PatternInsights(BaseModel):
    """Aggregated pattern recognition results across all statistical models."""
    trend: TrendPattern
    deviation: DeviationPattern
    sleep_mood_relationship: SleepMoodPattern
    repeated_patterns: RepeatedPattern
    summary_observations: List[str]


class PredictResponse(BaseModel):
    """Structured response returned by POST /predict."""
    status: str = Field(..., description="'success', 'insufficient_data', or 'error'")
    message: Optional[str] = Field(None, description="Status explanation or insufficient data advisory")
    data_points_analyzed: int = Field(..., description="Number of entries processed")
    min_required: int = Field(..., description="Minimum number of data points needed for inference")
    disclaimer: str = Field(..., description="Non-clinical and non-diagnostic advisory statement")
    insights: Optional[PatternInsights] = Field(None, description="Extracted patterns when status is 'success'")


class HealthResponse(BaseModel):
    """Service health status check."""
    status: str
    service: str
    version: str
    disclaimer: str
