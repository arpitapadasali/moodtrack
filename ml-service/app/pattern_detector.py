"""Statistical pattern detection and machine learning algorithms for MoodTrack.
This module extracts trends, unusual baseline deviations, sleep-mood correlations,
and repeated cyclical rhythms over anonymized numerical time-series entries.
"""

from typing import List, Optional, Tuple, Dict, Any
import numpy as np
from app.models import (
    MoodDataPoint,
    TrendPattern,
    DeviationPattern,
    SleepMoodPattern,
    RepeatedPattern,
    PatternInsights
)

DAY_NAMES = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]


def detect_trend(mood_values: List[float]) -> TrendPattern:
    """Identify directional trajectory and slope over chronological mood entries using linear regression."""
    n = len(mood_values)
    x = np.arange(n, dtype=float)
    y = np.array(mood_values, dtype=float)

    baseline_mean = float(np.mean(y))
    recent_window = min(5, max(3, n // 2))
    recent_mean = float(np.mean(y[-recent_window:]))

    # OLS linear regression: y = slope * x + intercept
    x_mean = np.mean(x)
    x_dev = x - x_mean
    ss_x = np.sum(x_dev ** 2)

    if ss_x > 0:
        slope = float(np.sum(x_dev * (y - baseline_mean)) / ss_x)
    else:
        slope = 0.0

    y_pred = slope * x + (baseline_mean - slope * x_mean)
    ss_tot = np.sum((y - baseline_mean) ** 2)
    ss_res = np.sum((y - y_pred) ** 2)

    r_squared = float(max(0.0, 1.0 - (ss_res / ss_tot))) if ss_tot > 1e-6 else 0.0

    # Classify direction
    if slope >= 0.05:
        direction = "upward"
    elif slope <= -0.05:
        direction = "downward"
    else:
        direction = "stable"

    # Confidence rating based on sample count and R^2
    if n >= 10 and r_squared >= 0.30:
        confidence = "high"
    elif n >= 6 or r_squared >= 0.15:
        confidence = "moderate"
    else:
        confidence = "low"

    # Descriptive neutral phrasing
    if direction == "upward":
        desc = (
            f"Your recorded mood scores suggest a gradual upward trajectory across recent check-ins "
            f"(estimated trend slope: +{slope:.2f} per check-in)."
        )
    elif direction == "downward":
        desc = (
            f"Your recorded mood scores indicate a downward trend across recent check-ins "
            f"(estimated trend slope: {slope:.2f} per check-in)."
        )
    else:
        desc = (
            f"Your recorded mood scores have remained steady and balanced around an average of "
            f"{baseline_mean:.1f} without a pronounced directional swing."
        )

    return TrendPattern(
        direction=direction,
        slope=round(slope, 3),
        r_squared=round(r_squared, 3),
        baseline_mean=round(baseline_mean, 2),
        recent_mean=round(recent_mean, 2),
        confidence=confidence,
        description=desc
    )


def detect_deviation(mood_values: List[float]) -> DeviationPattern:
    """Identify whether the latest recorded entry deviates unusually from historical baseline."""
    n = len(mood_values)
    y = np.array(mood_values, dtype=float)
    latest_mood = float(y[-1])

    # Calculate baseline distribution using previous records if available
    if n > 3:
        baseline_slice = y[:-1]
    else:
        baseline_slice = y

    baseline_mean = float(np.mean(baseline_slice))
    baseline_std = float(np.std(baseline_slice, ddof=1)) if len(baseline_slice) > 1 else 0.0

    # Prevent division by zero if all prior entries were identical
    effective_std = max(baseline_std, 0.40)
    z_score = float((latest_mood - baseline_mean) / effective_std)

    abs_z = abs(z_score)
    if abs_z >= 2.0:
        severity = "notable"
        has_unusual_deviation = True
    elif abs_z >= 1.4:
        severity = "moderate"
        has_unusual_deviation = False
    else:
        severity = "none"
        has_unusual_deviation = False

    if severity == "notable" and z_score > 0:
        desc = (
            f"Your latest recorded mood score ({latest_mood:.1f}) is notably higher than your "
            f"typical historical baseline average ({baseline_mean:.1f}, z-score: +{z_score:.2f})."
        )
    elif severity == "notable" and z_score < 0:
        desc = (
            f"Your latest recorded mood score ({latest_mood:.1f}) represents a noticeable divergence "
            f"below your typical recorded average ({baseline_mean:.1f}, z-score: {z_score:.2f})."
        )
    elif severity == "moderate":
        desc = (
            f"Your latest recorded mood score ({latest_mood:.1f}) reflects a mild departure from "
            f"your baseline average ({baseline_mean:.1f}), within customary variance."
        )
    else:
        desc = (
            f"Your latest recorded mood score ({latest_mood:.1f}) aligns closely with your "
            f"customary baseline distribution (baseline average: {baseline_mean:.1f})."
        )

    return DeviationPattern(
        has_unusual_deviation=has_unusual_deviation,
        severity=severity,
        latest_mood=round(latest_mood, 2),
        baseline_mean=round(baseline_mean, 2),
        baseline_std=round(baseline_std, 2),
        z_score=round(z_score, 2),
        description=desc
    )


def detect_sleep_mood_relationship(moods: List[float], sleeps: List[float]) -> SleepMoodPattern:
    """Analyze statistical association and regression relationship between sleep duration and mood."""
    y = np.array(moods, dtype=float)
    x = np.array(sleeps, dtype=float)

    var_x = float(np.var(x))
    var_y = float(np.var(y))

    if var_x > 1e-5 and var_y > 1e-5:
        corr_matrix = np.corrcoef(x, y)
        r = float(corr_matrix[0, 1])
        if np.isnan(r):
            r = 0.0

        # Linear regression slope: mood = slope * sleep + intercept
        x_dev = x - np.mean(x)
        slope = float(np.sum(x_dev * (y - np.mean(y))) / np.sum(x_dev ** 2))
        r_squared = float(r ** 2)
    else:
        r = 0.0
        slope = 0.0
        r_squared = 0.0

    # Categorical split: Adequate sleep (>= 7h) vs low sleep (< 7h)
    high_mask = x >= 7.0
    low_mask = x < 7.0

    avg_mood_high = float(np.mean(y[high_mask])) if np.any(high_mask) else None
    avg_mood_low = float(np.mean(y[low_mask])) if np.any(low_mask) else None

    if r >= 0.25:
        relationship_type = "positive"
        if avg_mood_high is not None and avg_mood_low is not None:
            desc = (
                f"Your recorded data indicates a positive relationship (r = {r:.2f}) between sleep "
                f"duration and mood, averaging {avg_mood_high:.1f} on nights with 7+ hours of sleep "
                f"versus {avg_mood_low:.1f} on nights with less sleep."
            )
        else:
            desc = (
                f"Your recorded data suggests a positive correlation (r = {r:.2f}) where nights with "
                f"higher recorded sleep hours tend to accompany higher mood scores."
            )
    elif r <= -0.25:
        relationship_type = "negative"
        desc = (
            f"Your recorded entries suggest an inverse relationship (r = {r:.2f}) between sleep "
            f"hours and recorded mood scores across the analyzed window."
        )
    else:
        relationship_type = "neutral"
        desc = (
            f"Your recorded data shows an independent or neutral link (r = {r:.2f}) between "
            f"sleep duration and mood scores, suggesting other factors may play a larger role."
        )

    return SleepMoodPattern(
        relationship_type=relationship_type,
        correlation_coefficient=round(r, 2),
        regression_slope=round(slope, 3),
        r_squared=round(r_squared, 3),
        avg_mood_adequate_sleep=round(avg_mood_high, 2) if avg_mood_high is not None else None,
        avg_mood_low_sleep=round(avg_mood_low, 2) if avg_mood_low is not None else None,
        description=desc
    )


def detect_repeated_patterns(
    mood_values: List[float],
    day_indices: Optional[List[int]] = None
) -> RepeatedPattern:
    """Detect cyclical day-of-week patterns and sequential persistence (lag-1 autocorrelation)."""
    y = np.array(mood_values, dtype=float)
    n = len(y)

    # Autocorrelation lag-1 calculation
    autocorr = 0.0
    if n >= 5:
        y_mean = np.mean(y)
        y_dev = y - y_mean
        ss = np.sum(y_dev ** 2)
        if ss > 1e-6:
            autocorr = float(np.sum(y_dev[:-1] * y_dev[1:]) / ss)

    # Day-of-week breakdown if day_indices available
    has_cyclical = False
    highest_day = None
    highest_avg = None
    lowest_day = None
    lowest_avg = None
    pattern_type = "none"

    if day_indices and len(day_indices) == n:
        valid_days = {}
        for day_idx, mood_val in zip(day_indices, mood_values):
            if day_idx is not None and 0 <= day_idx <= 6:
                valid_days.setdefault(day_idx, []).append(mood_val)

        # Check if we have multiple days with data
        if len(valid_days) >= 2:
            day_averages = {d: float(np.mean(vals)) for d, vals in valid_days.items()}
            sorted_days = sorted(day_averages.items(), key=lambda kv: kv[1])
            low_idx, low_val = sorted_days[0]
            high_idx, high_val = sorted_days[-1]

            spread = high_val - low_val
            # A spread >= 0.6 mood points across distinct days indicates noticeable seasonality
            if spread >= 0.60 and len(valid_days[high_idx]) >= 1 and len(valid_days[low_idx]) >= 1:
                has_cyclical = True
                pattern_type = "day_of_week_variation"
                highest_day = DAY_NAMES[high_idx]
                highest_avg = round(high_val, 2)
                lowest_day = DAY_NAMES[low_idx]
                lowest_avg = round(low_val, 2)

    # Evaluate pattern descriptions
    if has_cyclical:
        desc = (
            f"Your entries show recurring day-of-week variation: {highest_day} has the highest "
            f"average recorded mood ({highest_avg:.1f}), while {lowest_day} averages {lowest_avg:.1f}."
        )
    elif autocorr >= 0.35:
        pattern_type = "serial_persistence"
        desc = (
            f"Your recorded mood displays day-to-day momentum (autocorrelation = +{autocorr:.2f}), "
            f"where higher or lower scores have tended to cluster in consecutive check-ins."
        )
    elif autocorr <= -0.35:
        pattern_type = "alternating_oscillation"
        desc = (
            f"Your recorded mood displays an oscillating rhythm (autocorrelation = {autocorr:.2f}), "
            f"tending to fluctuate between higher and lower scores on consecutive days."
        )
    else:
        desc = (
            "Your entries do not show a pronounced day-of-week recurrence or sequential clustering "
            "at this stage."
        )

    return RepeatedPattern(
        has_cyclical_pattern=has_cyclical,
        highest_day=highest_day,
        highest_avg_mood=highest_avg,
        lowest_day=lowest_day,
        lowest_avg_mood=lowest_avg,
        autocorrelation_lag1=round(autocorr, 2) if n >= 5 else None,
        pattern_type=pattern_type,
        description=desc
    )


def extract_all_patterns(
    moods: List[float],
    sleeps: List[float],
    days: Optional[List[int]] = None
) -> PatternInsights:
    """Run full pattern detection suite and synthesize summary observations."""
    trend = detect_trend(moods)
    deviation = detect_deviation(moods)
    sleep_mood = detect_sleep_mood_relationship(moods, sleeps)
    repeated = detect_repeated_patterns(moods, days)

    # Synthesize concise summary observations
    summary = []
    if trend.direction != "stable":
        summary.append(trend.description)
    else:
        summary.append(f"Recorded mood scores have held steady around an average of {trend.baseline_mean:.1f}.")

    if deviation.has_unusual_deviation:
        summary.append(deviation.description)

    if sleep_mood.relationship_type != "neutral":
        summary.append(sleep_mood.description)

    if repeated.has_cyclical_pattern or repeated.pattern_type in ("serial_persistence", "alternating_oscillation"):
        summary.append(repeated.description)

    return PatternInsights(
        trend=trend,
        deviation=deviation,
        sleep_mood_relationship=sleep_mood,
        repeated_patterns=repeated,
        summary_observations=summary
    )
