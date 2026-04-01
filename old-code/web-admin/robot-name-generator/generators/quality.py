"""
Quality control filters for generated robot names.
All filters are pure functions that return True when a name PASSES.
"""

import re

# Maximum consecutive consonants allowed (avoids unpronounceable names)
_MAX_CONSECUTIVE_CONSONANTS = 3
_CONSONANT_RE = re.compile(r"[^aeiou\s\-\.0-9]{4,}", re.IGNORECASE)

# Length constraints (characters, excluding spaces and hyphens)
_MIN_LEN = 4
_MAX_LEN = 20

# Simple blocklist — extend as needed
_BLOCKLIST: set[str] = {
    "sex", "ass", "die", "kill", "dead", "evil",
}


def _passes_length(name: str) -> bool:
    core = re.sub(r"[\s\-\.]", "", name)
    return _MIN_LEN <= len(core) <= _MAX_LEN


def _passes_pronunciation(name: str) -> bool:
    """Reject names where any word-segment has 4+ consecutive consonants."""
    for segment in re.split(r"[\s\-\.]", name):
        if _CONSONANT_RE.search(segment):
            return False
    return True


def _passes_blocklist(name: str) -> bool:
    lower = name.lower()
    return not any(blocked in lower for blocked in _BLOCKLIST)


def filter_names(names: list[str]) -> list[str]:
    """Apply all quality filters and return only passing names."""
    return [
        n for n in names
        if _passes_length(n)
        and _passes_pronunciation(n)
        and _passes_blocklist(n)
    ]


def deduplicate(names: list[str]) -> list[str]:
    """Remove duplicates while preserving insertion order."""
    seen: set[str] = set()
    result: list[str] = []
    for name in names:
        key = name.lower()
        if key not in seen:
            seen.add(key)
            result.append(name)
    return result
