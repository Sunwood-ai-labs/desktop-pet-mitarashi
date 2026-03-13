#!/usr/bin/env python3
"""
Release header image generator for Desktop Pet Mitarashi
Usage: uv run python scripts/generate_release_header.py --version 0.1.0 --output assets/release-header-v0.1.0.svg
"""

import argparse
import re
from pathlib import Path
import xml.etree.ElementTree as ET
import html


def extract_graphical_content(svg_content: str) -> str:
    """Extract only graphical elements from Layer 1, cleaning namespace attributes."""
    # Remove namespace declarations that cause parsing issues
    clean_content = svg_content
    # Register namespaces to avoid ns0 prefixes
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

    try:
        root = ET.fromstring(svg_content.encode('utf-8'))

        # Find Layer 1 group
        for g in root.iter('{http://www.w3.org/2000/svg}g'):
            label = g.get('{http://www.inkscape.org/namespaces/inkscape}label', '')
            if label == 'Layer 1':
                # Remove inkscape and sodipodi attributes from this element
                for attr in list(g.attrib.keys()):
                    if 'inkscape' in attr or 'sodipodi' in attr:
                        del g.attrib[attr]

                # Recursively clean all child elements
                clean_element(g)

                # Convert back to string
                return ET.tostring(g, encoding='unicode')

        # Fallback: no Layer 1 found, extract all paths
        paths = []
        for path in root.iter('{http://www.w3.org/2000/svg}path'):
            clean_element(path)
            paths.append(ET.tostring(path, encoding='unicode'))
        return '\n'.join(paths)

    except ET.ParseError:
        # Fallback to regex if XML parsing fails
        paths = re.findall(r'<path[^>]*/>', svg_content)
        content = '\n'.join(paths)
        content = re.sub(r'\s+inkscape:[a-zA-Z]+="[^"]*"', '', content)
        content = re.sub(r'\s+sodipodi:[a-zA-Z]+="[^"]*"', '', content)
        return content


def clean_element(elem):
    """Remove inkscape and sodipodi attributes from element and its children."""
    for attr in list(elem.attrib.keys()):
        if 'inkscape' in attr or 'sodipodi' in attr:
            del elem.attrib[attr]
    for child in elem:
        clean_element(child)


def generate_release_header(version: str, output_path: str, source_svg: str = "assets/mitarashi_minimal.svg", subtitle: str = None, features: list = None):
    """Generate a release header image with the cat character centered."""

    # Read the source SVG
    source_path = Path(source_svg)
    if not source_path.exists():
        raise FileNotFoundError(f"Source SVG not found: {source_path}")

    source_content = source_path.read_text(encoding="utf-8")

    # Extract only the graphical content (paths)
    graphical_content = extract_graphical_content(source_content)

    # Set subtitle
    subtitle_text = html.escape(subtitle) if subtitle else "🎉 New Release"

    # Generate feature tags
    feature_colors = ["#D98943", "#BF622C", "#D98471"]
    if features:
        feature_tags_parts = []
        x_pos = 820
        for i, feature in enumerate(features[:3]):  # Max 3 features
            color = feature_colors[i % len(feature_colors)]
            width = max(80, len(feature) * 8 + 20)
            escaped_feature = html.escape(feature)
            feature_tags_parts.append(f'''  <rect x="{x_pos}" y="510" width="{width}" height="28" rx="14" fill="{color}"/>
  <text x="{x_pos + width//2}" y="530" font-family="Arial, sans-serif" font-size="12" fill="#F2E2CE" text-anchor="middle">{escaped_feature}</text>''')
            x_pos += width + 10
        feature_tags = "\n".join(feature_tags_parts)
    else:
        feature_tags = ""

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

  <!-- Centered cat character -->
  <g transform="translate(90, 150)">
    ''' + graphical_content + '''
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
    v''' + version + '''
  </text>

  <!-- Subtitle -->
  <text x="820" y="480" font-family="Arial, sans-serif" font-size="18" fill="#D98943">
    ''' + subtitle_text + '''
  </text>

''' + feature_tags + '''

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

    # Validate the generated SVG
    validate_svg(output_path)


def validate_svg(svg_path: str) -> bool:
    """Validate the generated SVG file."""
    path = Path(svg_path)
    content = path.read_text(encoding="utf-8")

    # Check 1: Valid XML
    try:
        tree = ET.parse(path)
        root = tree.getroot()
        print(f"  [OK] Valid XML - Root: {root.tag.split('}')[-1] if '}' in root.tag else root.tag}")
    except ET.ParseError as e:
        print(f"  [ERROR] Invalid XML: {e}")
        return False

    # Check 2: No sodipodi namespace
    sodipodi_count = content.count('sodipodi')
    if sodipodi_count > 0:
        print(f"  [ERROR] Contains {sodipodi_count} sodipodi references")
        return False
    print("  [OK] No sodipodi namespace")

    # Check 3: No inkscape namespace
    inkscape_count = content.count('inkscape')
    if inkscape_count > 0:
        print(f"  [ERROR] Contains {inkscape_count} inkscape references")
        return False
    print("  [OK] No inkscape namespace")

    # Check 4: Required elements
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    root = tree.getroot()
    paths = len(root.findall('.//svg:path', ns))
    texts = len(root.findall('.//svg:text', ns))
    print(f"  [OK] Elements: path={paths}, text={texts}")

    print(f"Validation passed: {svg_path}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate release header image")
    parser.add_argument("--version", required=True, help="Version string (e.g., 0.1.0)")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--source", default="assets/mitarashi_minimal.svg", help="Source SVG file")
    parser.add_argument("--subtitle", default=None, help="Subtitle text (e.g., '🎉 System Tray Support')")
    parser.add_argument("--features", default=None, help="Comma-separated feature tags (e.g., 'Tray,Random,Bg')")

    args = parser.parse_args()

    features = args.features.split(",") if args.features else None

    generate_release_header(args.version, args.output, args.source, args.subtitle, features)


if __name__ == "__main__":
    main()
