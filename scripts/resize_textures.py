"""
Texture Resizer for Portfolio Models

This script resizes all textures in the portfolio model folders so that 
the smaller dimension is at most 512px (configurable), while maintaining
the original aspect ratio. Only processes textures larger than the target size.

Usage:
    python scripts/resize_textures.py
    python scripts/resize_textures.py --size 1024
    python scripts/resize_textures.py --dry-run

Author: Artur Balthazar
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is not installed. Run: pip install Pillow")
    sys.exit(1)

# Fix Windows console encoding for unicode characters
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================================
# CONFIGURATION
# ============================================================================

# Base path to the models folder (relative to script location)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
MODELS_PATH = PROJECT_ROOT / "public" / "assets" / "models"

# Portfolio company/project folders to process
PORTFOLIO_FOLDERS = [
    "balthamaker",
    "meetkai", 
    "morethanreal",
    "personal",
    "ufsc"
]

# Supported image extensions
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.tga', '.webp'}

# Default target size for the smaller dimension
DEFAULT_TARGET_SIZE = 512

# ============================================================================
# FUNCTIONS
# ============================================================================


def get_new_dimensions(width: int, height: int, target_size: int) -> tuple[int, int]:
    """
    Calculate new dimensions where the smaller side equals target_size,
    maintaining aspect ratio.
    
    Returns original dimensions if both sides are already <= target_size.
    """
    smaller_side = min(width, height)
    
    # If already small enough, return original
    if smaller_side <= target_size:
        return width, height
    
    # Calculate scale factor based on smaller side
    scale = target_size / smaller_side
    
    new_width = int(width * scale)
    new_height = int(height * scale)
    
    return new_width, new_height


def process_texture(filepath: Path, target_size: int, dry_run: bool = False) -> dict:
    """
    Process a single texture file.
    
    Returns a dict with results:
        - status: 'resized', 'skipped', 'error'
        - original_size: (w, h)
        - new_size: (w, h) or None
        - message: description
    """
    filename = filepath.name
    
    try:
        with Image.open(filepath) as img:
            original_size = img.size
            width, height = original_size
            
            new_width, new_height = get_new_dimensions(width, height, target_size)
            
            # Check if resize is needed
            if (new_width, new_height) == (width, height):
                return {
                    'status': 'skipped',
                    'original_size': original_size,
                    'new_size': None,
                    'message': f"Already small enough: {filename} ({width}x{height})"
                }
            
            new_size = (new_width, new_height)
            
            if not dry_run:
                # Preserve the original format and mode
                original_format = img.format or 'PNG'
                original_mode = img.mode
                
                # Resize with high quality
                resized = img.resize(new_size, Image.LANCZOS)
                
                # Handle different modes for saving
                if original_mode == 'RGBA' and filepath.suffix.lower() in ['.jpg', '.jpeg']:
                    # Convert RGBA to RGB for JPEG
                    resized = resized.convert('RGB')
                
                # Save with appropriate quality
                if filepath.suffix.lower() in ['.jpg', '.jpeg']:
                    resized.save(filepath, quality=90, optimize=True)
                elif filepath.suffix.lower() == '.png':
                    resized.save(filepath, optimize=True)
                else:
                    resized.save(filepath)
            
            return {
                'status': 'resized',
                'original_size': original_size,
                'new_size': new_size,
                'message': f"{'[DRY RUN] Would resize' if dry_run else 'Resized'}: {filename} ({width}x{height} → {new_width}x{new_height})"
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'original_size': None,
            'new_size': None,
            'message': f"Error processing {filename}: {e}"
        }


def find_textures(folder: Path) -> list[Path]:
    """Recursively find all texture files in a folder."""
    textures = []
    for ext in IMAGE_EXTENSIONS:
        textures.extend(folder.rglob(f"*{ext}"))
        textures.extend(folder.rglob(f"*{ext.upper()}"))
    return sorted(set(textures))


def main():
    parser = argparse.ArgumentParser(
        description="Resize portfolio textures so smaller dimension is at most target size."
    )
    parser.add_argument(
        '--size', 
        type=int, 
        default=DEFAULT_TARGET_SIZE,
        help=f"Target size for smaller dimension (default: {DEFAULT_TARGET_SIZE})"
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help="Show what would be done without making changes"
    )
    parser.add_argument(
        '--folder',
        type=str,
        default=None,
        help="Process only a specific portfolio folder (e.g., 'morethanreal')"
    )
    parser.add_argument(
        '--exclude',
        type=str,
        nargs='+',
        default=[],
        help="Exclude specific project folders from processing (e.g., '--exclude seara dolcegusto')"
    )
    
    args = parser.parse_args()
    
    # Normalize exclusion list to lowercase for case-insensitive matching
    excluded_folders = [f.lower() for f in args.exclude]
    
    print("=" * 60)
    print("PORTFOLIO TEXTURE RESIZER")
    print("=" * 60)
    print(f"Target size: {args.size}px (smaller dimension)")
    print(f"Models path: {MODELS_PATH}")
    if args.dry_run:
        print("MODE: DRY RUN (no changes will be made)")
    if excluded_folders:
        print(f"Excluding: {', '.join(args.exclude)}")
    print("=" * 60)
    print()
    
    # Check if models path exists
    if not MODELS_PATH.exists():
        print(f"ERROR: Models path not found: {MODELS_PATH}")
        sys.exit(1)
    
    # Determine which folders to process
    folders_to_process = [args.folder] if args.folder else PORTFOLIO_FOLDERS
    
    # Statistics
    total_stats = {
        'resized': 0,
        'skipped': 0,
        'error': 0
    }
    
    for folder_name in folders_to_process:
        folder_path = MODELS_PATH / folder_name
        
        if not folder_path.exists():
            print(f"⚠ Folder not found: {folder_name}")
            continue
        
        print(f"\n📁 Processing: {folder_name}")
        print("-" * 40)
        
        textures = find_textures(folder_path)
        
        if not textures:
            print("   No textures found.")
            continue
        
        for texture_path in textures:
            # Check if this texture should be excluded based on its path
            rel_path_parts = [part.lower() for part in texture_path.relative_to(folder_path).parts]
            if any(excluded in rel_path_parts for excluded in excluded_folders):
                total_stats['skipped'] += 1
                continue
            
            result = process_texture(texture_path, args.size, args.dry_run)
            total_stats[result['status']] += 1
            
            # Only print non-skipped results for cleaner output
            if result['status'] != 'skipped':
                status_icon = {
                    'resized': '✓',
                    'error': '✗'
                }.get(result['status'], '?')
                
                # Show relative path for readability
                rel_path = texture_path.relative_to(MODELS_PATH / folder_name)
                print(f"   {status_icon} {rel_path}: {result['message'].split(': ', 1)[-1]}")
    
    # Print summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Resized:  {total_stats['resized']}")
    print(f"  Skipped:  {total_stats['skipped']} (already <= {args.size}px)")
    print(f"  Errors:   {total_stats['error']}")
    print()
    
    if args.dry_run and total_stats['resized'] > 0:
        print("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
