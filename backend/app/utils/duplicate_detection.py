"""
Duplicate complaint detection utility.

Detects potential duplicates by combining:
1. Geographic proximity — issues within PROXIMITY_THRESHOLD_METERS of each other
2. Text similarity   — title+description similarity above TEXT_SIMILARITY_THRESHOLD

Both conditions must be satisfied for a pair to be flagged as a duplicate.
"""
import math
from difflib import SequenceMatcher
from typing import List, Any

# --- Thresholds ---
PROXIMITY_THRESHOLD_METERS = 500   # Issues within 500m are "nearby"
TEXT_SIMILARITY_THRESHOLD = 0.45   # 45% text overlap triggers a flag (lowered for practicality)


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance in metres between two GPS coordinates.
    Uses the Haversine formula.
    """
    R = 6_371_000  # Earth radius in metres

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def _text_similarity(text_a: str, text_b: str) -> float:
    """Returns a 0-1 similarity ratio between two strings."""
    combined_a = text_a.lower().strip()
    combined_b = text_b.lower().strip()
    return SequenceMatcher(None, combined_a, combined_b).ratio()


def find_similar_issues(
    target_issue: Any,
    all_issues: List[Any],
    exclude_id: str = None,
) -> List[Any]:
    """
    Given a target issue and a list of all issues, return those that are
    potentially duplicate — i.e., within PROXIMITY_THRESHOLD_METERS AND
    share significant text similarity.

    Args:
        target_issue: SQLAlchemy Issue object to check against.
        all_issues:   Full list of Issue objects to compare with.
        exclude_id:   ID to exclude from results (usually the target itself).

    Returns:
        List of Issue objects considered potential duplicates.
    """
    duplicates = []
    target_text = f"{target_issue.title} {target_issue.description}"

    for issue in all_issues:
        if issue.id == exclude_id or issue.id == target_issue.id:
            continue

        # Geographic check
        distance = _haversine_distance(
            target_issue.latitude, target_issue.longitude,
            issue.latitude, issue.longitude
        )
        if distance > PROXIMITY_THRESHOLD_METERS:
            continue

        # Text similarity check
        candidate_text = f"{issue.title} {issue.description}"
        similarity = _text_similarity(target_text, candidate_text)

        if similarity >= TEXT_SIMILARITY_THRESHOLD:
            duplicates.append(issue)

    return duplicates
