#!/usr/bin/env bash
set -euo pipefail

# Convert NEF (Nikon RAW) files in Images/ to JPG for web use.
# Produces JPGs alongside the originals (same basename).
# Resizes images to max 2000px and sets JPEG quality to 85.

# Find available tool: prefer magick (ImageMagick), then convert, then dcraw.
if command -v magick >/dev/null 2>&1; then
  TOOL="magick"
elif command -v convert >/dev/null 2>&1; then
  TOOL="convert"
elif command -v dcraw >/dev/null 2>&1; then
  TOOL="dcraw"
else
  echo "No supported tool found. Install ImageMagick (magick) or dcraw."
  exit 2
fi

echo "Using tool: $TOOL"

shopt -s nullglob
count=0
for f in Images/*.NEF Images/*.nef; do
  base="${f%.*}"
  out="${base}.jpg"
  echo "Converting: $f -> $out"
  if [ "$TOOL" = "dcraw" ]; then
    # Use dcraw to output a PPM stream then convert to JPG (requires ImageMagick's convert)
    if ! command -v convert >/dev/null 2>&1; then
      echo "dcraw requires ImageMagick's convert; please install it." >&2
      exit 3
    fi
    dcraw -c "$f" | convert - -resize 2000x2000\> -quality 85 "$out"
  else
    # magick or convert can read NEF if built with raw support
    "$TOOL" "$f" -resize 2000x2000\> -quality 85 "$out"
  fi
  count=$((count+1))
done

if [ "$count" -eq 0 ]; then
  echo "No NEF files found in Images/"
else
  echo "Converted $count NEF file(s)."
fi
