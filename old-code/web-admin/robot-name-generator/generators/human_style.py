"""
Human-style robot name generator.
Combines optional prefix + name + optional suffix from word banks.
"""

import json
import random
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def _load(filename: str) -> list[str]:
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


# Four combination patterns, with weights controlling frequency
_PATTERNS = [
    "name",              # Nova
    "prefix_name",       # Ghost Rex
    "name_suffix",       # Orion Prime
    "prefix_name_suffix", # Iron Lyra X
]
_WEIGHTS = [0.15, 0.25, 0.35, 0.25]


def generate(count: int, seed: int | None = None) -> list[str]:
    """Generate `count` human-style robot names."""
    rng = random.Random(seed)

    prefixes = _load("prefixes.json")
    names = _load("names.json")
    suffixes = _load("suffixes.json")

    results: list[str] = []
    seen: set[str] = set()

    # Pre-calculate the theoretical maximum combinations to avoid infinite loops
    max_combinations = (
        len(names)
        + len(prefixes) * len(names)
        + len(names) * len(suffixes)
        + len(prefixes) * len(names) * len(suffixes)
    )
    attempts = 0
    max_attempts = count * 20

    while len(results) < count and attempts < max_attempts:
        attempts += 1
        pattern = rng.choices(_PATTERNS, weights=_WEIGHTS, k=1)[0]

        if pattern == "name":
            name = rng.choice(names)
        elif pattern == "prefix_name":
            name = f"{rng.choice(prefixes)} {rng.choice(names)}"
        elif pattern == "name_suffix":
            name = f"{rng.choice(names)}-{rng.choice(suffixes)}"
        else:
            name = f"{rng.choice(prefixes)} {rng.choice(names)}-{rng.choice(suffixes)}"

        if name not in seen:
            seen.add(name)
            results.append(name)

        if len(seen) >= max_combinations:
            break

    return results
