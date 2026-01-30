import os
from PIL import Image

# Target folder
folder = r"D:\Offline Drive\Baltha Studio\Baltha Studio v2\public\assets\models\geely"

# Files to ignore
excluded_files = {
    "AtlasColorTexture_png.png",
    "AtlasGrayTexture_alpha_png.png",
    "AtlasGrayTexture_png.png"
}

# Target width
target_width = 512

# Supported image extensions
image_exts = ('.png', '.jpg', '.jpeg', '.tga')

for filename in os.listdir(folder):
    if not filename.lower().endswith(image_exts):
        continue
    if filename in excluded_files:
        continue

    path = os.path.join(folder, filename)
    try:
        with Image.open(path) as img:
            w_percent = target_width / float(img.size[0])
            h_size = int((float(img.size[1]) * float(w_percent)))
            resized = img.resize((target_width, h_size), Image.LANCZOS)

            # Overwrite the original image
            resized.save(path)
            print(f"Resized: {filename}")
    except Exception as e:
        print(f"Failed to process {filename}: {e}")
