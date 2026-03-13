#!/usr/bin/env python3
"""
Release header image generator for Desktop Pet Mitarashi
Usage: python scripts/generate_release_header.py --version 0.1.0 --output assets/release-header-v0.1.0.svg
"""

import argparse
from pathlib import Path


def generate_release_header(version: str, output_path: str, source_svg: str = "assets/mitarashi_minimal.svg"):
    """Generate a release header image with the cat character centered."""

    # Read the source SVG
    source_path = Path(source_svg)
    if not source_path.exists():
        raise FileNotFoundError(f"Source SVG not found: {source_svg}")

    source_content = source_path.read_text(encoding="utf-8")

    # Extract the inner content (everything between <svg> and </svg>)
    # Find the start of inner content after the opening <svg> tag
    svg_start = source_content.find("<svg")
    svg_tag_end = source_content.find(">", svg_start) + 1
    svg_end = source_content.rfind("</svg>")

    # Get the inner content
    inner_content = source_content[svg_tag_end:svg_end]

    # Create new SVG with centered cat and text
    new_svg = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="1280"
   height="640"
   viewBox="0 0 1280 640"
   version="1.1"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2F5259;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a3a40;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#D98943;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#BF622C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#D98471;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="640" fill="url(#bg-gradient)"/>

  <!-- Decorative circles -->
  <circle cx="100" cy="100" r="150" fill="#D98943" opacity="0.1"/>
  <circle cx="1180" cy="540" r="200" fill="#D98471" opacity="0.1"/>

  <!-- Centered cat character (original SVG scaled and centered) -->
  <g transform="translate(90, 150) scale(1.0)">
    {inner_content}
  </g>

  <!-- Title section on the right -->
  <text x="820" y="280" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#F2E2CE">
    Desktop Pet
  </text>
  <text x="820" y="340" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#F2E2CE">
    Mitarashi
  </text>

  <!-- Version badge -->
  <rect x="820" y="380" width="140" height="50" rx="25" fill="url(#accent-gradient)"/>
  <text x="890" y="418" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#F2E2CE" text-anchor="middle">
    v{version}
  </text>

  <!-- Subtitle -->
  <text x="820" y="480" font-family="Arial, sans-serif" font-size="18" fill="#D98943">
    🎉 Initial Release
  </text>

  <!-- Feature tags -->
  <rect x="820" y="510" width="100" height="28" rx="14" fill="#D98943"/>
  <text x="870" y="530" font-family="Arial, sans-serif" font-size="12" fill="#F2E2CE" text-anchor="middle">Auto-Walk</text>

  <rect x="930" y="510" width="90" height="28" rx="14" fill="#BF622C"/>
  <text x="975" y="530" font-family="Arial, sans-serif" font-size="12" fill="#F2E2CE" text-anchor="middle">Draggable</text>

  <rect x="1030" y="510" width="120" height="28" rx="14" fill="#D98471"/>
  <text x="1090" y="530" font-family="Arial, sans-serif" font-size="12" fill="#F2E2CE" text-anchor="middle">Speed Control</text>

  <!-- Paw prints decoration -->
  <g fill="#F2E2CE" opacity="0.2">
    <circle cx="700" cy="550" r="10"/>
    <circle cx="720" cy="540" r="6"/>
    <circle cx="680" cy="540" r="6"/>
    <circle cx="710" cy="525" r="6"/>
    <circle cx="690" cy="525" r="6"/>
  </g>
</svg>
'''

    # Write the output
    output = Path(output_path)
    output.write_text(new_svg, encoding="utf-8")
    print(f"Generated: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate release header image")
    parser.add_argument("--version", required=True, help="Version string (e.g., 0.1.0)")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--source", default="assets/mitarashi_minimal.svg", help="Source SVG file")

    args = parser.parse_args()

    generate_release_header(args.version, args.output, args.source)


if __name__ == "__main__":
    main()
