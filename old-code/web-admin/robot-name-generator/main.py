"""
Robot Name Generator
Usage:
    python main.py --count 1000
    python main.py --count 5000 --human-ratio 0.6 --format csv --seed 42
"""

import argparse
import csv
import json
import sys
from pathlib import Path

from generators import human_style, syllable_style
from generators.quality import deduplicate, filter_names

OUTPUT_DIR = Path(__file__).parent / "output"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate robot names for games or other creative uses.",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1000,
        help="Total number of names to generate (default: 1000)",
    )
    parser.add_argument(
        "--human-ratio",
        type=float,
        default=0.5,
        dest="human_ratio",
        help="Fraction of names from human-style generator, 0.0–1.0 (default: 0.5)",
    )
    parser.add_argument(
        "--format",
        choices=["json", "csv", "txt"],
        default="txt",
        help="Output file format: json | csv | txt (default: txt)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducible output (default: random)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output file path (default: output/names.<format>)",
    )
    return parser.parse_args()


def generate_names(count: int, human_ratio: float, seed: int | None) -> list[str]:
    human_count = round(count * human_ratio)
    syllable_count = count - human_count

    # Generate slightly more than needed to compensate for quality-filter losses
    overshoot = 1.3

    human_seed = seed
    syllable_seed = (seed + 1) if seed is not None else None

    raw_human = human_style.generate(round(human_count * overshoot), seed=human_seed)
    raw_syllable = syllable_style.generate(round(syllable_count * overshoot), seed=syllable_seed)

    combined = raw_human + raw_syllable
    filtered = filter_names(combined)
    unique = deduplicate(filtered)

    if len(unique) < count:
        print(
            f"[warn] Requested {count} names but only {len(unique)} unique names "
            "passed quality filters. Try increasing word banks or lowering --count.",
            file=sys.stderr,
        )

    return unique[:count]


def save_txt(names: list[str], path: Path) -> None:
    path.write_text("\n".join(names), encoding="utf-8")


def save_json(names: list[str], path: Path) -> None:
    path.write_text(json.dumps(names, ensure_ascii=False, indent=2), encoding="utf-8")


def save_csv(names: list[str], path: Path) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name"])
        for idx, name in enumerate(names, start=1):
            writer.writerow([idx, name])


def main() -> None:
    args = parse_args()

    if not (0.0 <= args.human_ratio <= 1.0):
        print("[error] --human-ratio must be between 0.0 and 1.0", file=sys.stderr)
        sys.exit(1)

    print(f"Generating {args.count} names  "
          f"(human {args.human_ratio:.0%} / syllable {1 - args.human_ratio:.0%}) ...")

    names = generate_names(args.count, args.human_ratio, args.seed)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = Path(args.output) if args.output else OUTPUT_DIR / f"names.{args.format}"

    if args.format == "json":
        save_json(names, out_path)
    elif args.format == "csv":
        save_csv(names, out_path)
    else:
        save_txt(names, out_path)

    print(f"Done. {len(names)} names saved to: {out_path}")

    # Print a short preview
    preview = names[:10]
    print("\nPreview (first 10):")
    for name in preview:
        print(f"  {name}")


if __name__ == "__main__":
    main()
