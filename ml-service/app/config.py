"""Configuration settings for the MoodTrack ML Service."""

import os

# Server networking configuration
HOST = os.getenv("ML_HOST", "0.0.0.0")
PORT = int(os.getenv("ML_PORT", "8000"))

# Thresholds
MIN_REQUIRED_ENTRIES = int(os.getenv("MIN_REQUIRED_ENTRIES", "5"))

# Mandatory non-clinical disclaimer
NON_CLINICAL_DISCLAIMER = (
    "This service provides automated statistical pattern detection and descriptive trend "
    "analysis on user-recorded numerical metrics. It is strictly observational and NOT a clinical, "
    "medical, psychological, or mental-health diagnostic tool."
)
