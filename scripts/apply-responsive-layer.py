from pathlib import Path

# Deprecated compatibility script.
# Responsive rules are now part of the single production cascade in
# assets/site-bundle.css. This script intentionally does not modify HTML,
# preventing a second stylesheet layer from being reintroduced.
ROOT = Path(__file__).resolve().parents[1]
print(f'Responsive layer is consolidated in {ROOT / "assets/site-bundle.css"}; no HTML changes applied.')
