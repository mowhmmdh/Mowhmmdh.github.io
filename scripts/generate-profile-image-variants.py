"""Build small, lossless-to-source responsive WebP candidates for the homepage portrait.

The original portrait remains untouched and remains the fallback URL. This script
only creates derivatives for the below-the-fold identity card.
"""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images" / "profile.webp"
OUTPUT_DIR = ROOT / "qa-artifacts" / "profile-variants"
TARGET_WIDTHS = (360,)
QUALITY = 76


def main():
    if not SOURCE.is_file():
        raise SystemExit(f"Missing source portrait: {SOURCE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        source.load()
        if source.format != "WEBP":
            raise SystemExit(f"Expected WebP source, got {source.format!r}")
        if source.width < max(TARGET_WIDTHS):
            raise SystemExit(f"Source width {source.width}px is smaller than the largest candidate")

        image = source.convert("RGB")
        results = []
        for width in TARGET_WIDTHS:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = OUTPUT_DIR / f"profile-{width}.webp"
            resized.save(destination, format="WEBP", quality=QUALITY, method=6)
            with Image.open(destination) as check:
                if check.size != (width, height) or check.format != "WEBP":
                    raise SystemExit(f"Invalid generated candidate: {destination}")
            if destination.stat().st_size >= SOURCE.stat().st_size:
                raise SystemExit(f"Candidate is not smaller than the original: {destination}")
            results.append({
                "file": destination.name,
                "width": width,
                "height": height,
                "bytes": destination.stat().st_size,
            })

    print(json.dumps({
        "source": SOURCE.name,
        "source_dimensions": [source.width, source.height],
        "source_bytes": SOURCE.stat().st_size,
        "quality": QUALITY,
        "variants": results,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
