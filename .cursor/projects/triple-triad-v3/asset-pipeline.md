# Asset Pipeline Guide — Triple Triad V3

## Approach: Stable Diffusion + CSS/SVG Diagrams

The asset pipeline uses **local deep learning image generation** (Stable Diffusion 1.5) running on the user's NVIDIA RTX 4060 mobile GPU via Docker, combined with CSS/SVG for technical diagrams.

| Category | Method | Quantity |
|----------|--------|----------|
| NPC portraits | Stable Diffusion | ~50 images |
| Title screen art | Stable Diffusion | 1-2 images |
| Story cutscene panels | Stable Diffusion | ~7 panels |
| Dungeon backgrounds | Stable Diffusion | 5 images |
| Region vignettes | Stable Diffusion | 7 images |
| How To Play diagrams | CSS/SVG (code) | 5 diagrams |
| UI icons | Inline SVG (code) | ~8 icons |
| World map | Existing `world.jpg` | 0 (reuse) |
| Card art | Existing 110 PNGs | 0 (reuse) |

**Total generated images:** ~70-75 via Stable Diffusion
**Estimated generation time:** ~6-8 minutes on RTX 4060 mobile

---

## Docker GPU Setup

### Prerequisites (host machine)

1. **Windows NVIDIA driver** — latest Game-Ready or Studio driver from [nvidia.com](https://www.nvidia.com/download/index.aspx)
2. **Docker Desktop** — WSL 2 backend enabled (Settings → General → "Use the WSL 2 based engine")
3. **WSL kernel** — updated via `wsl --update` in PowerShell
4. **Verify GPU access:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
   ```
   Should show the RTX 4060 with driver version and CUDA 12.x.

> **Important:** Do NOT install NVIDIA Linux drivers inside WSL2 or the container. The Windows driver is automatically stubbed into WSL2 as `libcuda.so`. Installing a Linux driver overwrites this stub and breaks GPU access.

### Dockerfile

Located at `scripts/Dockerfile.sd`:

```dockerfile
FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv git wget \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# PyTorch with CUDA 12.4
RUN pip install --no-cache-dir \
    torch==2.5.1 torchvision==0.20.1 \
    --index-url https://download.pytorch.org/whl/cu124

# Diffusers stack
RUN pip install --no-cache-dir \
    diffusers==0.32.2 \
    transformers==4.47.1 \
    accelerate==1.2.1 \
    safetensors==0.4.5 \
    xformers==0.0.29.post1 \
    invisible-watermark \
    Pillow

WORKDIR /app
COPY generate_assets.py .
COPY prompts/ ./prompts/

CMD ["python3", "generate_assets.py"]
```

### docker-compose.yml Addition

```yaml
services:
  sd-generate:
    build:
      context: ./scripts
      dockerfile: Dockerfile.sd
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./frontend/public:/app/output
      - ./scripts/prompts:/app/prompts
      - sd-model-cache:/app/models
    environment:
      - TRANSFORMERS_CACHE=/app/models
      - HF_HOME=/app/models
    shm_size: '8g'

volumes:
  sd-model-cache:  # Persist downloaded model (~2GB) across runs
```

**Run with:**
```bash
docker compose run --rm sd-generate
```

---

## Model Choice: DreamShaper 8

| Property | Value |
|----------|-------|
| HuggingFace ID | `Lykon/dreamshaper-8` |
| Base | Stable Diffusion 1.5 |
| Resolution | 512×512 (native) |
| VRAM usage | ~4-5 GB with model_cpu_offload |
| Style | Fantasy art, painterly, JRPG portraits |
| Speed | ~4-6 seconds per image at 25 steps |

DreamShaper 8 was chosen because:
- SD 1.5 fits comfortably in 8GB VRAM (SDXL would be too tight)
- Excels at fantasy/JRPG character portraits without needing LoRAs
- Painterly style matches FFVIII Amano-inspired aesthetic
- fp16 variant available for immediate half-precision loading

---

## Generation Script Architecture

### `scripts/generate_assets.py`

The main script loads a JSON prompt manifest and generates all assets in one batch:

```python
"""
Stable Diffusion asset generator for Triple Triad V3.
Optimised for RTX 4060 Mobile (8GB VRAM).
"""

import torch
import json
import os
import time
from pathlib import Path
from diffusers import AutoPipelineForText2Image, DEISMultistepScheduler
from PIL import Image


def load_pipeline(model_id="Lykon/dreamshaper-8"):
    """Load SD pipeline with full VRAM optimisation stack."""
    pipe = AutoPipelineForText2Image.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True,
    )
    pipe.scheduler = DEISMultistepScheduler.from_config(pipe.scheduler.config)

    # VRAM optimisations for 8GB GPU
    pipe.enable_model_cpu_offload()     # ~4-5GB peak VRAM
    pipe.enable_attention_slicing()     # Chunk attention computation
    pipe.enable_vae_slicing()           # Decode one image at a time
    pipe.enable_vae_tiling()            # Tile large images for VAE

    try:
        pipe.enable_xformers_memory_efficient_attention()
        print("[OK] xFormers enabled")
    except Exception:
        print("[WARN] xFormers not available")

    pipe.unet.to(memory_format=torch.channels_last)
    return pipe


NEGATIVE_PROMPT = (
    "lowres, bad anatomy, bad hands, text, error, missing fingers, "
    "extra digit, fewer digits, cropped, worst quality, low quality, "
    "jpeg artifacts, signature, watermark, username, blurry, "
    "deformed, ugly, duplicate, modern clothing, photo, 3d render"
)


def generate_image(pipe, prompt, width, height, seed=42, steps=25, cfg=7.5):
    """Generate a single image and return it."""
    generator = torch.Generator(device="cpu").manual_seed(seed)
    return pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE_PROMPT,
        width=width,
        height=height,
        num_inference_steps=steps,
        guidance_scale=cfg,
        generator=generator,
    ).images[0]


def run_batch(pipe, manifest_path, output_base="/app/output"):
    """Process a full prompt manifest."""
    with open(manifest_path) as f:
        manifest = json.load(f)

    total = len(manifest)
    for i, item in enumerate(manifest):
        out_path = os.path.join(output_base, item["output"])
        if os.path.exists(out_path):
            print(f"[{i+1}/{total}] SKIP (exists): {item['output']}")
            continue

        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        print(f"[{i+1}/{total}] Generating: {item['output']}")

        start = time.time()
        img = generate_image(
            pipe,
            prompt=item["prompt"],
            width=item.get("width", 512),
            height=item.get("height", 512),
            seed=item.get("seed", 42 + i),
            steps=item.get("steps", 25),
            cfg=item.get("cfg", 7.5),
        )

        # Post-process: resize if target differs from generation size
        target_w = item.get("target_width", item.get("width", 512))
        target_h = item.get("target_height", item.get("height", 512))
        if (target_w, target_h) != (img.width, img.height):
            img = img.resize((target_w, target_h), Image.LANCZOS)

        img.save(out_path, quality=90)
        elapsed = time.time() - start
        print(f"  → {out_path} ({elapsed:.1f}s)")

    print(f"\nDone. Processed {total} assets.")


if __name__ == "__main__":
    pipe = load_pipeline()
    for manifest in sorted(Path("/app/prompts").glob("*.json")):
        print(f"\n=== Processing {manifest.name} ===")
        run_batch(pipe, str(manifest))
```

Key features:
- **Skip existing:** Won't regenerate images that already exist (idempotent)
- **Post-process resize:** Generate at SD native resolution, resize to target
- **Multiple manifests:** Processes all `.json` files in `/app/prompts/`

---

## Prompt Manifests

All prompt JSON files live in `scripts/prompts/`. Each entry:

```json
{
  "prompt": "...",
  "output": "relative/path/from/public/filename.png",
  "width": 512,
  "height": 512,
  "target_width": 256,
  "target_height": 256,
  "seed": 42,
  "steps": 25,
  "cfg": 7.5
}
```

### 1. `scripts/prompts/npc-portraits.json` — NPC Portraits (~50 images)

Every NPC gets a unique 256×256 portrait. Generated at 512×512 then downscaled for quality.

**Prompt template for town duel/dialogue NPCs:**
```
"fantasy character portrait, JRPG style, {character_description}, {region_mood},
painterly style, soft dramatic lighting, detailed face,
Yoshitaka Amano inspired, watercolor accents, dark background,
portrait framing, masterpiece, best quality, sharp focus"
```

**Prompt template for dungeon floor NPCs:**
```
"dark fantasy creature portrait, JRPG style, {creature_description},
{dungeon_mood}, ominous lighting, ethereal glow,
painterly style, Yoshitaka Amano inspired, dark atmospheric background,
portrait framing, masterpiece, best quality"
```

**Prompt template for boss NPCs:**
```
"epic boss portrait, JRPG style, {boss_description},
{dungeon_mood}, dramatic lighting from below, powerful aura,
painterly style, Yoshitaka Amano inspired, dark background with energy effects,
portrait framing, masterpiece, best quality, sharp focus"
```

**Example entries:**

```json
[
  {
    "prompt": "fantasy character portrait, JRPG style, friendly middle-aged man with weathered face, fishing hat, ocean-blue eyes, coastal village, painterly style, soft dramatic lighting, detailed face, Yoshitaka Amano inspired, watercolor accents, dark background, portrait framing, masterpiece, best quality, sharp focus",
    "output": "npcs/balamb_townsperson.png",
    "width": 512, "height": 512,
    "target_width": 256, "target_height": 256,
    "seed": 100
  },
  {
    "prompt": "fantasy character portrait, JRPG style, old fisherman with gray beard, sun-worn skin, straw hat, holding fishing rod, coastal sunset, painterly style, soft dramatic lighting, detailed face, Yoshitaka Amano inspired, watercolor accents, dark background, portrait framing, masterpiece, best quality, sharp focus",
    "output": "npcs/balamb_fisher.png",
    "width": 512, "height": 512,
    "target_width": 256, "target_height": 256,
    "seed": 101
  },
  {
    "prompt": "fantasy character portrait, JRPG style, young spiky-haired man with tattoo on face, energetic expression, martial artist, black vest, painterly style, soft dramatic lighting, detailed face, Yoshitaka Amano inspired, watercolor accents, dark background, portrait framing, masterpiece, best quality, sharp focus",
    "output": "characters/zell.png",
    "width": 512, "height": 512,
    "target_width": 256, "target_height": 256,
    "seed": 200
  },
  {
    "prompt": "dark fantasy creature portrait, JRPG style, giant fire demon with horns, Ifrit, burning eyes, molten rock skin, volcanic cavern background, ominous lighting, ethereal fire glow, painterly style, Yoshitaka Amano inspired, dark atmospheric background, portrait framing, masterpiece, best quality",
    "output": "npcs/ifrit_guardian.png",
    "width": 512, "height": 512,
    "target_width": 256, "target_height": 256,
    "seed": 300
  }
]
```

**Full NPC list (37 duel + ~13 dialogue/shop + 1 post-boss = ~50):**

| Region | NPC | Type | Portrait Style |
|--------|-----|------|----------------|
| Balamb | Balamb Townsperson | duel | Friendly villager, coastal |
| Balamb | Balamb Fisher | duel | Old fisherman, weathered |
| Balamb | Card Shop Owner | shop | Merchant with card display |
| Balamb | Zell | dialogue | Spiky hair, face tattoo, energetic |
| Balamb | Garden Student | duel | Young cadet in uniform |
| Balamb | CC Club Jack | duel | Confident teen, card emblems |
| Balamb | Quistis | dialogue | Blonde instructor, glasses, whip |
| Balamb | Library Girl | shop | Quiet girl surrounded by books |
| Balamb | Cave Bat | dungeon floor | Giant bat creature, dark cave |
| Balamb | Fire Spirit | dungeon floor | Flame elemental, glowing |
| Balamb | Ifrit Guardian | dungeon boss | Fire demon, horns, volcanic |
| Dollet | Dollet Citizen | duel | European-styled townsperson |
| Dollet | Dollet Soldier | duel | Soldier in blue uniform |
| Dollet | Dollet Pub Owner | shop | Barkeeper, warm lighting |
| Dollet | Queen of Cards | dialogue | Elegant woman, card motifs |
| Galbadia | Timber Maniac | duel | Reporter with notebook |
| Galbadia | Forest Fox | duel | Resistance fighter, forest camo |
| Galbadia | Resistance Member | dialogue | Hooded rebel |
| Galbadia | Timber Card Dealer | shop | Street vendor |
| Galbadia | Galbadia Student | duel | Military academy student |
| Galbadia | Galbadia Instructor | duel | Stern instructor, medals |
| Galbadia | Irvine | dialogue | Cowboy hat, long hair, rifle |
| Galbadia | Deling City Guard | duel | Armoured guard, ornate |
| Galbadia | General's Aide | duel | Officer in formal uniform |
| Galbadia | Prison Inmate | dungeon floor | Ragged prisoner |
| Galbadia | Prison Enforcer | dungeon floor | Large brute, chains |
| Galbadia | Warden | dungeon boss | Authority figure, keys |
| Galbadia | Winhill Villager | duel | Peaceful countryside person |
| Galbadia | Winhill Flower Girl | duel | Young woman with flowers |
| Galbadia | Laguna | dialogue | Handsome older man, kind eyes |
| FH | FH Resident | duel | Pacifist engineer, goggles |
| FH | Bridge Mechanic | duel | Grease-stained mechanic |
| FH | FH Fisherman | dialogue | Laid-back angler |
| FH | FH Card Trader | shop | Weathered trader |
| FH | Mayor Dobe | dialogue | Elderly dignified man |
| Trabia | Trabia Student | duel | Bundled-up student, cold weather |
| Trabia | Trabia Scout | duel | Scout in winter gear |
| Trabia | Selphie | dialogue | Cheerful girl, yellow dress |
| Trabia | Shumi Elder | duel | Alien-like creature, wise |
| Trabia | Shumi Artisan | shop | Alien craftsman |
| Trabia | Shumi Sculptor | dialogue | Alien sculptor with tools |
| Centra | White SeeD | duel | White-uniformed soldier, sea |
| Centra | White SeeD Captain | duel | Captain's hat, stern, sea |
| Centra | Edea | dialogue | Dark sorceress, elegant headdress |
| Centra | Ruin Explorer | shop | Adventurer, dusty clothes |
| Centra | Tonberry King | dialogue | Small green creature with crown |
| Centra | Ruin Spirit | dungeon floor | Ghostly figure, ancient |
| Centra | Ancient Sentinel | dungeon floor | Stone golem, glowing eyes |
| Centra | Centra Guardian | dungeon boss | Ancient armoured being |
| Esthar | Esthar Scientist | duel | Lab coat, futuristic visor |
| Esthar | Esthar Soldier | duel | Sci-fi armour, glowing |
| Esthar | Rinoa | dialogue | Dark-haired young woman, blue |
| Esthar | Space Engineer | dialogue | Spacesuit, helmet off |
| Esthar | Gate Sentry | dungeon floor | Armoured tech guard |
| Esthar | Lunar Soldier | dungeon floor | Space military, heavy armour |
| Esthar | Lunar Officer | dungeon boss | Commander in space uniform |
| Esthar | Deep Sea Drone | dungeon floor | Robotic underwater entity |
| Esthar | Abyssal Creature | dungeon floor | Deep sea monster |
| Esthar | Research Subject | dungeon floor | Mutated lab creature |
| Esthar | Deep Sea Researcher | dungeon boss | Scientist fused with machine |
| Esthar | Bahamut | post-boss dialogue | Dragon god, majestic |

### 2. `scripts/prompts/backgrounds.json` — Backgrounds & Scenes

**Title screen (1 image):**
```json
{
  "prompt": "epic fantasy landscape, Balamb Garden floating castle at sunset, FFVIII inspired, dramatic clouds, golden light, card symbols in the sky, painterly style, Yoshitaka Amano inspired, masterpiece, best quality, cinematic composition, wide angle",
  "output": "backgrounds/title-bg.jpg",
  "width": 768, "height": 512,
  "target_width": 1920, "target_height": 1080,
  "seed": 1000, "steps": 30, "cfg": 8.0
}
```

**Dungeon backgrounds (5 images):**
```json
[
  {
    "prompt": "dark volcanic cavern interior, lava flows, fire crystals, JRPG dungeon, atmospheric, orange and red lighting, fantasy game background, painterly style, no characters, masterpiece",
    "output": "backgrounds/dungeon-fire-cavern.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 2000
  },
  {
    "prompt": "dark industrial prison interior, metal corridors, dim fluorescent lights, oppressive atmosphere, JRPG dungeon, desert prison, fantasy game background, painterly style, no characters, masterpiece",
    "output": "backgrounds/dungeon-d-district.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 2001
  },
  {
    "prompt": "ancient stone ruins interior, crumbling pillars, mystical glowing runes, overgrown with vines, JRPG dungeon, fantasy game background, painterly style, ethereal green light, no characters, masterpiece",
    "output": "backgrounds/dungeon-centra-ruins.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 2002
  },
  {
    "prompt": "futuristic space facility interior, launch pad, sleek metal walls, holographic displays, sci-fi JRPG, blue and white lighting, fantasy game background, painterly style, no characters, masterpiece",
    "output": "backgrounds/dungeon-lunar-gate.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 2003
  },
  {
    "prompt": "underwater research facility, deep ocean, glass corridors showing dark water, bioluminescent creatures outside, sci-fi JRPG, deep blue and teal lighting, fantasy game background, painterly style, no characters, masterpiece",
    "output": "backgrounds/dungeon-deep-sea.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 2004
  }
]
```

**Region vignettes (7 images — used as background on region screens):**
```json
[
  {
    "prompt": "peaceful coastal island town, blue ocean, white buildings, JRPG landscape, Balamb island, tropical gardens, warm sunlight, painterly style, fantasy game background, no characters, masterpiece",
    "output": "backgrounds/region-balamb.jpg",
    "width": 768, "height": 512,
    "target_width": 1280, "target_height": 720,
    "seed": 3000
  }
]
```
_(Similar entries for dollet, galbadia, fh, trabia, centra, esthar)_

### 3. `scripts/prompts/cutscenes.json` — Story Cutscene Panels

7 panels total (4 opening + 3 story beats), generated at 768×512 and upscaled:

```json
[
  {
    "prompt": "epic fantasy academy at sunset, Balamb Garden floating school, FFVIII inspired, golden hour, dramatic clouds, cinematic composition, painterly style, Yoshitaka Amano inspired, masterpiece, best quality",
    "output": "cutscenes/opening-01.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 4000, "steps": 30
  },
  {
    "prompt": "two young students playing a card game at a table, fantasy academy interior, warm candlelight, cards spread on table, JRPG scene, painterly style, Yoshitaka Amano inspired, masterpiece, best quality",
    "output": "cutscenes/opening-02.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 4001, "steps": 30
  },
  {
    "prompt": "close-up of a hand holding five fantasy trading cards, ornate card borders, magical glow, dark background with sparkles, JRPG style, painterly, masterpiece, best quality",
    "output": "cutscenes/opening-03.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 4002, "steps": 30
  },
  {
    "prompt": "fantasy world map seen from above, continents and oceans, ancient parchment style with glowing location markers, JRPG overworld, painterly style, cinematic, masterpiece, best quality",
    "output": "cutscenes/opening-04.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 4003, "steps": 30
  },
  {
    "prompt": "fantasy military continent, Galbadian architecture, imposing fortresses, vast plains, dark clouds gathering, JRPG landscape, dramatic atmosphere, painterly style, Yoshitaka Amano inspired, masterpiece",
    "output": "cutscenes/story-galbadia.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 4004, "steps": 30
  },
  {
    "prompt": "devastated ancient continent, ruins and craters, red sky, desolate landscape, JRPG post-apocalyptic, Centra wasteland, ominous atmosphere, painterly style, Yoshitaka Amano inspired, masterpiece",
    "output": "cutscenes/story-centra.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 4005, "steps": 30
  },
  {
    "prompt": "deep underwater research facility, bioluminescent depths, mysterious and foreboding, final dungeon entrance, JRPG climactic scene, dark blue atmosphere, painterly style, masterpiece",
    "output": "cutscenes/story-deepsea.jpg",
    "width": 768, "height": 512,
    "target_width": 1920, "target_height": 1080,
    "seed": 4006, "steps": 30
  }
]
```

---

## VRAM Optimisation Reference

All optimisations are applied in `load_pipeline()`:

| Technique | Effect | VRAM Saved | Speed Cost |
|-----------|--------|------------|------------|
| `torch.float16` | Half-precision weights | ~50% | None (faster) |
| `enable_model_cpu_offload()` | Move idle sub-models to CPU | ~3 GB | ~10% slower |
| `enable_attention_slicing()` | Chunk attention computation | ~1 GB | ~10% slower |
| `enable_vae_slicing()` | Decode images one at a time | Varies | Minimal |
| `enable_vae_tiling()` | Tile large image VAE decode | Needed for >512 | Minimal |
| `xformers` | Memory-efficient attention | ~0.5 GB | 20-30% faster |
| `channels_last` memory | Optimised tensor layout | None | 5-10% faster |

**Peak VRAM usage with all optimisations: ~4-5 GB** (safe for 8 GB RTX 4060 mobile)

If OOM errors occur, replace `enable_model_cpu_offload()` with `enable_sequential_cpu_offload()` — this moves individual layers instead of whole models, reducing peak VRAM to ~3 GB but running ~2x slower.

---

## How To Play Diagrams (CSS/SVG — No Image Generation)

These are technical diagrams better suited to code than AI art:

### a) Card Anatomy
SVG component showing a card with labeled arrows:
- Top/Bottom/Left/Right rank positions
- Element icon slot
- Card name and level indicator

### b) Capture Example (3 panels)
1. Board with opponent card showing rank 3 on left side
2. Player places card with rank 5 on right side (adjacent)
3. Arrow shows 5 > 3, opponent card flips to player colour

### c) Same Rule Illustration
- Placed card matching ranks on 2+ adjacent sides
- Highlight matching pairs with connecting lines
- Both opponent cards flip

### d) Plus Rule Illustration
- Sum equations displayed (e.g., "5+3 = 8 = 4+4")
- Adjacent touching ranks shown with sum

### e) Elemental Rule Illustration
- Board grid with element icons on cells
- Matching element: +1 boost (green)
- Non-matching: -1 penalty (red)

Implement these as React components using inline SVG with the design system colours from `ui-ux.md`.

---

## Asset Naming Conventions

```
frontend/public/
├── backgrounds/
│   ├── title-bg.jpg                 # Title screen (SD generated)
│   ├── dungeon-fire-cavern.jpg      # Dungeon backgrounds (SD generated)
│   ├── dungeon-d-district.jpg
│   ├── dungeon-centra-ruins.jpg
│   ├── dungeon-lunar-gate.jpg
│   ├── dungeon-deep-sea.jpg
│   ├── region-balamb.jpg            # Region screen backgrounds (SD generated)
│   ├── region-dollet.jpg
│   ├── region-galbadia.jpg
│   ├── region-fh.jpg
│   ├── region-trabia.jpg
│   ├── region-centra.jpg
│   └── region-esthar.jpg
├── cards/
│   └── {card_id}.png                # 110 existing card art (unchanged)
├── characters/
│   └── {character_id}.png           # Named FFVIII characters (SD generated)
├── cutscenes/
│   ├── opening-01.jpg               # Story panels (SD generated)
│   ├── opening-02.jpg
│   ├── opening-03.jpg
│   ├── opening-04.jpg
│   ├── story-galbadia.jpg
│   ├── story-centra.jpg
│   └── story-deepsea.jpg
├── map/
│   └── world.jpg                    # Existing world map (unchanged)
└── npcs/
    └── {npc_id}.png                 # NPC portraits (SD generated)
```

### Naming Rules
- All lowercase, snake_case
- NPC IDs match their data ID in world data (e.g., `balamb_townsperson`, `ifrit_guardian`)
- Character IDs match named FFVIII characters (e.g., `zell`, `quistis`, `rinoa`)
- Dungeon backgrounds prefixed with `dungeon-`, regions with `region-`

---

## Image Sizes

| Asset Type | Generation Size | Target Size | Format | Notes |
|-----------|----------------|-------------|--------|-------|
| Title background | 768×512 | 1920×1080 | JPEG 90% | Lanczos upscale |
| Dungeon backgrounds | 768×512 | 1920×1080 | JPEG 90% | Lanczos upscale |
| Region vignettes | 768×512 | 1280×720 | JPEG 90% | Lanczos upscale |
| Cutscene panels | 768×512 | 1920×1080 | JPEG 90% | Lanczos upscale |
| NPC portraits | 512×512 | 256×256 | PNG | Lanczos downscale (sharper) |
| Character portraits | 512×512 | 256×256 | PNG | Lanczos downscale |
| Card art | — | 256×368 | PNG | Existing, no change |
| World map | — | existing | JPEG | Keep as-is |

---

## Fallbacks

If Stable Diffusion generation fails or a specific image is unsatisfactory:

1. **Re-generate with different seed:** Change the seed in the manifest and re-run (existing good images are skipped)
2. **Adjust prompt:** Modify the specific entry in the manifest JSON
3. **CSS fallback for portraits:**
```tsx
// In NPC component — only if portrait file is missing
<div className="npc-portrait-fallback" style={{
  background: `var(--region-${regionId}-color)`,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}}>
  <span className="npc-initials">{name.split(' ').map(w => w[0]).join('')}</span>
</div>
```

---

## SVG Icon Set

Create a minimal icon set as React components (no image generation needed):

```tsx
// frontend/src/components/icons/
export const DuelIcon = () => <svg>...</svg>
export const ShopIcon = () => <svg>...</svg>
export const DialogueIcon = () => <svg>...</svg>
export const TournamentIcon = () => <svg>...</svg>
export const LockIcon = () => <svg>...</svg>
export const QuestIcon = () => <svg>...</svg>
export const StarIcon = () => <svg>...</svg>
export const GilIcon = () => <svg>...</svg>
```

Simple inline SVGs, 24px viewBox, stroke-based design for clarity at small sizes.

---

## Running the Pipeline

```bash
# 1. Verify GPU access
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi

# 2. Build the SD container (first run downloads ~2GB model)
docker compose build sd-generate

# 3. Generate all assets (~6-8 minutes)
docker compose run --rm sd-generate

# 4. Check outputs
ls frontend/public/npcs/
ls frontend/public/backgrounds/
ls frontend/public/cutscenes/

# 5. Re-generate specific images (delete the file, re-run)
rm frontend/public/npcs/ifrit_guardian.png
docker compose run --rm sd-generate
```

The pipeline is idempotent — running it multiple times only generates missing images.
