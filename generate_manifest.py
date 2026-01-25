#!/usr/bin/env python3
"""
Generate manifest.json for the pictures gallery.

Usage:
    python generate_manifest.py

This script scans the 'pictures/' folder for image files and creates
a manifest.json that the gallery page uses to dynamically load images.

To add new images:
1. Drop image files into the 'pictures/' folder
2. Run this script: python generate_manifest.py
3. Commit and push the changes
"""

import json
import os
from pathlib import Path
from datetime import datetime

# Supported image extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.heic'}

def get_image_files(pictures_dir: Path) -> list[str]:
    """Get all image files from the pictures directory."""
    images = []

    for file in pictures_dir.iterdir():
        if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS:
            images.append(file.name)

    # Sort by modification time (newest first)
    images.sort(key=lambda x: (pictures_dir / x).stat().st_mtime, reverse=True)

    return images

def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    pictures_dir = script_dir / 'pictures'

    if not pictures_dir.exists():
        print(f"Creating pictures directory: {pictures_dir}")
        pictures_dir.mkdir(parents=True)

    # Get all image files
    images = get_image_files(pictures_dir)

    # Create manifest
    manifest = {
        "generated": datetime.now().isoformat(),
        "count": len(images),
        "images": images
    }

    # Write manifest
    manifest_path = pictures_dir / 'manifest.json'
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f"Generated manifest with {len(images)} images:")
    for img in images:
        print(f"  - {img}")
    print(f"\nManifest saved to: {manifest_path}")

if __name__ == '__main__':
    main()
