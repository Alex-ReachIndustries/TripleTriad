"""
Generate an app icon for Triple Triad using SDXL-Turbo.
Outputs: /output/icon/icon_512.png (base), plus all Android mipmap sizes.
"""
import os
import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image, ImageDraw

OUTPUT_DIR = "/output/icon"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Android adaptive icon sizes (foreground is 108dp, inner 72dp safe zone)
MIPMAP_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

# Legacy launcher icon sizes
LEGACY_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def make_round(img: Image.Image) -> Image.Image:
    """Create a circular version of the image."""
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(img, mask=mask)
    return result


def main():
    print("=== Triple Triad Icon Generator ===")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    # Load SDXL-Turbo
    print("\nLoading SDXL-Turbo model...")
    pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float16,
        variant="fp16",
    )
    device = "cuda" if torch.cuda.is_available() else "cpu"
    pipe.to(device)
    print("Model loaded!\n")

    prompt = (
        "app icon for a card game, Triple Triad from Final Fantasy VIII, "
        "stylized 3x3 grid of playing cards with one card prominently in center, "
        "blue and gold color scheme, magical glow effects, "
        "clean bold design suitable for mobile app icon, "
        "dark blue background with gold accents, "
        "high quality, sharp details, professional app icon design, "
        "centered composition, no text, square format"
    )
    neg_prompt = (
        "blurry, low quality, text, watermark, signature, letters, words, "
        "deformed, ugly, photorealistic, photograph, human face, fingers, "
        "busy background, cluttered, too many details"
    )

    # Generate multiple candidates and pick the best
    print("Generating icon candidates...")
    best_image = None
    for i in range(4):
        print(f"  Candidate {i+1}/4...")
        image = pipe(
            prompt=prompt,
            negative_prompt=neg_prompt,
            num_inference_steps=4,
            guidance_scale=0.0,
            width=512,
            height=512,
        ).images[0]
        image.save(os.path.join(OUTPUT_DIR, f"candidate_{i+1}.png"))
        best_image = image  # Keep last one; user can pick from candidates

    # Use the last generated as the base (user can swap with any candidate)
    base = best_image
    base_path = os.path.join(OUTPUT_DIR, "icon_base_512.png")
    base.save(base_path)
    print(f"\nBase icon saved to {base_path}")

    # Generate all Android mipmap sizes
    print("\nGenerating Android mipmap sizes...")

    for folder, size in MIPMAP_SIZES.items():
        out_dir = os.path.join(OUTPUT_DIR, folder)
        os.makedirs(out_dir, exist_ok=True)

        # Foreground (adaptive icon)
        fg = base.resize((size, size), Image.LANCZOS)
        fg.save(os.path.join(out_dir, "ic_launcher_foreground.png"))

        # Legacy launcher icon
        legacy_size = LEGACY_SIZES[folder]
        legacy = base.resize((legacy_size, legacy_size), Image.LANCZOS)
        legacy.save(os.path.join(out_dir, "ic_launcher.png"))

        # Round icon
        round_icon = make_round(legacy)
        round_icon.save(os.path.join(out_dir, "ic_launcher_round.png"))

        print(f"  {folder}: foreground={size}px, legacy={legacy_size}px")

    print("\n=== Done! Icon files generated. ===")
    print("Candidates saved as candidate_1.png through candidate_4.png")
    print("Pick your favourite and re-run, or copy mipmap folders to Android project.")


if __name__ == "__main__":
    main()
