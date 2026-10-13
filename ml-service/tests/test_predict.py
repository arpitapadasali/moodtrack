"""Automated test suite for MoodTrack ML pattern detection algorithms and FastAPI endpoints."""

import pytest
from app.pattern_detector import (
    detect_trend,
    detect_deviation,
    detect_sleep_mood_relationship,
    detect_repeated_patterns,
    extract_all_patterns
)
from app.models import MoodDataPoint


def test_detect_trend_upward():
    # Progressively increasing moods
    moods = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]
    trend = detect_trend(moods)
    assert trend.direction == "upward"
    assert trend.slope > 0.05
    assert "upward" in trend.description.lower()


def test_detect_trend_downward():
    # Progressively decreasing moods
    moods = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0]
    trend = detect_trend(moods)
    assert trend.direction == "downward"
    assert trend.slope < -0.05
    assert "downward" in trend.description.lower()


def test_detect_trend_stable():
    # Stable moods
    moods = [3.0, 3.2, 3.1, 3.0, 3.1, 3.0, 3.2]
    trend = detect_trend(moods)
    assert trend.direction == "stable"
    assert abs(trend.slope) < 0.05


def test_detect_deviation_notable():
    # Baseline ~3.0, latest drops sharply to 1.0
    moods = [3.0, 3.2, 3.1, 3.0, 3.1, 3.0, 1.0]
    deviation = detect_deviation(moods)
    assert deviation.has_unusual_deviation is True
    assert deviation.severity == "notable"
    assert deviation.z_score < -1.5


def test_detect_deviation_normal():
    moods = [3.0, 3.5, 4.0, 3.5, 3.8, 3.7]
    deviation = detect_deviation(moods)
    assert deviation.has_unusual_deviation is False
    assert deviation.severity in ("none", "moderate")


def test_sleep_mood_positive_relationship():
    # Higher sleep corresponds to higher mood
    moods = [1.0, 2.0, 3.0, 4.0, 5.0, 5.0]
    sleeps = [4.0, 5.0, 6.0, 7.5, 8.5, 9.0]
    rel = detect_sleep_mood_relationship(moods, sleeps)
    assert rel.relationship_type == "positive"
    assert rel.correlation_coefficient > 0.50
    assert rel.avg_mood_adequate_sleep is not None
    assert rel.avg_mood_adequate_sleep > rel.avg_mood_low_sleep


def test_repeated_patterns_day_of_week():
    # Pattern: Friday (idx 5) = 5.0, Monday (idx 1) = 2.0
    moods = [2.0, 5.0, 2.1, 4.9, 2.0, 5.0]
    days = [1, 5, 1, 5, 1, 5]
    rep = detect_repeated_patterns(moods, days)
    assert rep.has_cyclical_pattern is True
    assert rep.highest_day == "Friday"
    assert rep.lowest_day == "Monday"


def test_extract_all_patterns():
    moods = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5]
    sleeps = [5.0, 5.5, 6.5, 7.5, 8.0, 8.5]
    insights = extract_all_patterns(moods, sleeps)
    assert insights.trend.direction == "upward"
    assert insights.sleep_mood_relationship.relationship_type == "positive"
    assert len(insights.summary_observations) >= 1
