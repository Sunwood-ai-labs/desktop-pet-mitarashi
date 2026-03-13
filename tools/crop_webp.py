"""
Crop whitespace from animated WebP images

Usage:
    uv run python tools/crop_webp.py <input.webp>

Example:
    uv run python tools/crop_webp.py assets/running_cat.webp
"""
from PIL import Image
import sys

if len(sys.argv) < 2:
    print("Usage: uv run python tools/crop_webp.py <input.webp>")
    sys.exit(1)

input_path = sys.argv[1]
print(f"Processing: {input_path}")

# Open the animated WebP
img = Image.open(input_path)
frames = []
durations = []

# Read all frames
try:
    while True:
        # Convert to RGBA to ensure alpha channel
        frame = img.convert("RGBA")
        frames.append(frame.copy())
        durations.append(img.info.get('duration', 100))
        img.seek(img.tell() + 1)
except EOFError:
    pass

print(f"Loaded {len(frames)} frames")
print(f"Original size: {frames[0].size}")

# Find bounding box across all frames
min_x, min_y = frames[0].size
max_x, max_y = 0, 0

for frame in frames:
    # Get the bounding box of non-transparent content
    bbox = frame.getbbox()
    if bbox:
        min_x = min(min_x, bbox[0])
        min_y = min(min_y, bbox[1])
        max_x = max(max_x, bbox[2])
        max_y = max(max_y, bbox[3])

print(f"Crop region: ({min_x}, {min_y}) -> ({max_x}, {max_y})")
new_size = (max_x - min_x, max_y - min_y)
print(f"New size: {new_size}")

# Crop all frames
cropped_frames = []
for frame in frames:
    cropped = frame.crop((min_x, min_y, max_x, max_y))
    cropped_frames.append(cropped)

# Save as animated WebP
output_path = input_path  # Overwrite original
cropped_frames[0].save(
    output_path,
    save_all=True,
    append_images=cropped_frames[1:],
    duration=durations,
    loop=img.info.get('loop', 0),
    lossless=False,
    quality=85
)

print(f"\nDone! Saved to {output_path}")
