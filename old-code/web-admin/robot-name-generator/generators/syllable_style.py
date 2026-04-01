"""
Syllable-style robot name generator.
Randomly assembles syllables according to phonetic templates to produce
names that sound real but don't exist (e.g. Zytron, Velox, Kabrix).
"""

import random

# Consonant and vowel pools
_CONSONANTS = list("bdfgklmnrstvxz")
_VOWELS = list("aeiou")

# Syllable templates: C = consonant, V = vowel
_SYLLABLE_TEMPLATES = [
    "CV",    # Ve
    "CVC",   # Vel
    "CCV",   # Str  (intentionally limited by filter)
    "CVCV",  # Velo
    "CVCVC", # Velox
]
_SYLLABLE_WEIGHTS = [0.15, 0.35, 0.05, 0.25, 0.20]

# Sci-fi suffixes appended to give more character
_SCI_FI_SUFFIXES = [
    "on", "ax", "ix", "ex", "yx",
    "ron", "tron", "nex", "rex", "vex",
    "ox", "ux", "or", "ar",
]
_SUFFIX_USE_PROBABILITY = 0.55  # 55% chance to append a suffix


def _build_syllable(template: str, rng: random.Random) -> str:
    result = []
    for ch in template:
        if ch == "C":
            result.append(rng.choice(_CONSONANTS))
        else:
            result.append(rng.choice(_VOWELS))
    return "".join(result)


def _generate_one(rng: random.Random) -> str:
    # Pick 1 or 2 syllables
    num_syllables = rng.choices([1, 2], weights=[0.6, 0.4])[0]
    core = "".join(
        _build_syllable(
            rng.choices(_SYLLABLE_TEMPLATES, weights=_SYLLABLE_WEIGHTS)[0],
            rng,
        )
        for _ in range(num_syllables)
    )

    if rng.random() < _SUFFIX_USE_PROBABILITY:
        core += rng.choice(_SCI_FI_SUFFIXES)

    return core.capitalize()


def generate(count: int, seed: int | None = None) -> list[str]:
    """Generate `count` syllable-style robot names."""
    rng = random.Random(seed)
    results: list[str] = []
    seen: set[str] = set()
    max_attempts = count * 50

    for _ in range(max_attempts):
        if len(results) >= count:
            break
        name = _generate_one(rng)
        if name not in seen:
            seen.add(name)
            results.append(name)

    return results
