# Generative Services — Art & Music

Both services run **entirely locally on your GPU**. No data is sent to any external server. Models are downloaded once and cached in Docker layers.

## Quick Reference

| Service | Model | Port | GPU VRAM | ~Time per item |
|---------|-------|------|----------|----------------|
| **Art** (artgen) | SDXL-Turbo | 8091 | ~4 GB | ~7s per image |
| **Music** (musicgen) | ACE-Step 1.5 Turbo | 8090 | ~4 GB | ~15-20s per track |

---

## Art Generator (SDXL-Turbo)

### Start the service

```bash
docker compose -f docker-compose.yml -f docker-compose.artgen.yml up artgen --build
```

### Stop

```bash
docker compose -f docker-compose.yml -f docker-compose.artgen.yml down
```

### Interactive API docs

Open http://localhost:8091/docs in your browser for the Swagger UI.

### Generate a custom image

```bash
# Returns PNG directly
curl -X POST http://localhost:8091/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "magical floating castle above clouds, anime style, vibrant colors",
    "width": 1024,
    "height": 576,
    "seed": 42
  }' --output my_image.png
```

### Generate and save to project

```bash
# Saves to frontend/public/{filename}.png and returns JSON path
curl -X POST http://localhost:8091/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "dark forest with glowing mushrooms, anime style",
    "width": 1024,
    "height": 576,
    "filename": "locations/my_custom_bg"
  }'
```

### Generate a game location background

```bash
# Uses the built-in prompt for a known location ID
curl -X POST http://localhost:8091/location \
  -H 'Content-Type: application/json' \
  -d '{"location_id": "balamb_garden", "seed": 42}'
```

Available location IDs: `balamb_garden`, `balamb_town`, `fire_cavern`, `dollet`, `radio_tower`, `timber`, `galbadia_garden`, `deling_city`, `tomb_of_unknown_king`, `deling_sewers`, `winhill`, `d_district_prison`, `galbadia_missile_base`, `balamb_garden_basement`, `fishermans_horizon`, `balamb_under_siege`, `roaming_forest`, `trabia_garden`, `galbadia_garden_revolution`, `edeas_house`, `white_seed_ship`, `great_salt_lake`, `esthar_city`, `lunar_base`, `sorceress_memorial`, `deep_sea_research_center`, `shumi_village`, `lunatic_pandora`, `centra_excavation_site`, `centra_ruins`

### Generate an NPC portrait

```bash
curl -X POST http://localhost:8091/portrait \
  -H 'Content-Type: application/json' \
  -d '{
    "npc_id": "quistis_garden_ch1",
    "npc_name": "Instructor Quistis",
    "npc_type": "dialogue",
    "location_id": "balamb_garden",
    "region_id": "balamb"
  }'
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Text description of image |
| `negative_prompt` | string | "blurry, low quality..." | What to avoid |
| `width` | int | 512 | Image width (px) |
| `height` | int | 512 | Image height (px) |
| `steps` | int | 4 | Inference steps (4 for turbo) |
| `guidance_scale` | float | 0.0 | CFG scale (0.0 for turbo) |
| `seed` | int | -1 | Seed (-1 = random) |
| `filename` | string | null | Save path under /output/ |

---

## Music Generator (ACE-Step 1.5)

Uses the community ACE-Step 1.5 Docker image with its built-in async API. Tracks are submitted as tasks, polled for completion, then downloaded.

### Start the service

```bash
docker compose -f docker-compose.yml -f docker-compose.music.yml up musicgen
```

### Stop

```bash
docker compose -f docker-compose.yml -f docker-compose.music.yml down
```

### Interactive API docs

Open http://localhost:8090/docs in your browser for the Swagger UI.

### Generate a custom music track (async pattern)

```bash
# 1. Submit task → get task_id
TASK=$(curl -s -X POST http://localhost:8090/release_task \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "calm piano jazz, late night cafe ambience, relaxing",
    "lyrics": "[Instrumental]",
    "bpm": 85,
    "audio_duration": 45,
    "key_scale": "Bb Major",
    "seed": 42,
    "use_random_seed": false,
    "audio_format": "mp3",
    "inference_steps": 8
  }')
echo $TASK  # {"data": {"task_id": "...", "status": "queued"}}

# 2. Poll for result (repeat until status == 1)
curl -s -X POST http://localhost:8090/query_result \
  -H 'Content-Type: application/json' \
  -d '{"task_id_list": ["<task_id>"]}'

# 3. Download audio when done
curl -s "http://localhost:8090/v1/audio?path=<file_path>" --output track.mp3
```

### Generate all game tracks (Python script)

```bash
# Generate all 57 predefined tracks (skips existing files)
python musicgen/generate_music.py

# Generate specific tracks only
python musicgen/generate_music.py title battle_early boss_tier3
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/release_task` | POST | Submit a music generation task |
| `/query_result` | POST | Poll task results (batch) |
| `/v1/audio?path=...` | GET | Download generated audio file |

### Key Parameters (POST /release_task)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Music description (genre, mood, instruments) |
| `lyrics` | string | "[Instrumental]" | Lyrics or instrumental marker |
| `bpm` | int | 100 | Beats per minute (30-300) |
| `audio_duration` | float | 30 | Duration in seconds (10-600) |
| `key_scale` | string | "" | Musical key (e.g. "C Major", "Am") |
| `seed` | int | -1 | Seed (-1 = random) |
| `use_random_seed` | bool | true | Use random seed (set false + seed for reproducibility) |
| `inference_steps` | int | 8 | Steps (8 for turbo, 32-64 for quality) |
| `audio_format` | string | "mp3" | Output format (mp3/wav) |

---

## Privacy & Data

Both services are **100% local**:

- **Models**: Downloaded from HuggingFace on first build, cached in Docker image layers
- **Processing**: Runs entirely on your local GPU (RTX 4060)
- **Network**: No outbound API calls during generation
- **Storage**: Generated files saved to `frontend/public/` via Docker volume mounts
- **No telemetry**: Neither SDXL-Turbo nor ACE-Step phone home

The only network activity is the initial model download during `docker build`.

---

## Tips

- **Regenerate a specific image/track**: Use the same `seed` value to get identical output
- **Iterate on prompts**: Use the `/generate` endpoint with different prompts until you're happy, then save with `filename`
- **Running both services**: They use different ports (8090/8091) and share the GPU, but avoid running both simultaneously to prevent VRAM contention
- **Art batch mode**: Override the service CMD to run batch scripts directly:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.artgen.yml run --rm artgen python generate.py
  ```
- **Music batch mode**: Run the Python script on the host (it calls the API):
  ```bash
  python musicgen/generate_music.py
  ```
