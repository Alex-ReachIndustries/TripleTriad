"""
FastAPI service for on-demand music generation using ACE-Step 1.5.
All processing is local — no data leaves this machine.

Endpoints:
  GET  /health           - Check service status
  POST /generate         - Generate a music track (returns MP3)
  POST /batch            - Generate multiple tracks from generate_music.py definitions
"""

import os
import io
import tempfile
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="Triple Triad Music Generator",
    description="Local AI music generation service using ACE-Step 1.5. All processing runs on-device — no data is sent externally.",
    version="1.0.0",
)

# ── Lazy model loading ───────────────────────────────────────────────────────

_dit_handler = None
_generate_music = None
_GenerationParams = None
_GenerationConfig = None


def _get_handler():
    global _dit_handler, _generate_music, _GenerationParams, _GenerationConfig
    if _dit_handler is None:
        print("Loading ACE-Step model (first request)...")
        from acestep.handler import AceStepHandler
        from acestep.inference import GenerationParams, GenerationConfig, generate_music

        _GenerationParams = GenerationParams
        _GenerationConfig = GenerationConfig
        _generate_music = generate_music

        _dit_handler = AceStepHandler()
        _dit_handler.initialize_service(
            project_root="/app/acestep",
            config_path="acestep-v15-turbo",
            device="cuda",
        )
        print("Model loaded.")
    return _dit_handler


# ── Request/Response models ──────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    caption: str = Field(..., description="Text description of the music to generate (genre, mood, instruments)")
    lyrics: str = Field("[Instrumental]", description="Lyrics or '[Instrumental]'")
    bpm: int = Field(100, ge=30, le=300, description="Beats per minute")
    duration: int = Field(30, ge=10, le=600, description="Duration in seconds")
    keyscale: str = Field("", description="Musical key, e.g. 'C Major', 'Am'")
    seed: int = Field(-1, description="Seed for reproducibility (-1 = random)")
    inference_steps: int = Field(8, ge=1, le=64, description="Inference steps (8 for turbo, 32-64 for base)")
    filename: Optional[str] = Field(None, description="If provided, saves to /output/{filename}.mp3 and returns path instead of file")


class BatchRequest(BaseModel):
    track_ids: Optional[list[str]] = Field(None, description="Specific track IDs to generate, or null for all")


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _dit_handler is not None}


@app.post("/generate")
def generate(req: GenerateRequest):
    handler = _get_handler()

    output_dir = "/output" if req.filename else tempfile.mkdtemp()
    os.makedirs(output_dir, exist_ok=True)

    params = _GenerationParams(
        caption=req.caption,
        lyrics=req.lyrics,
        bpm=req.bpm,
        duration=req.duration,
        keyscale=req.keyscale,
        inference_steps=req.inference_steps,
        shift=3.0,
        seed=req.seed,
    )

    config = _GenerationConfig(batch_size=1, audio_format="mp3")

    result = _generate_music(
        dit_handler=handler,
        llm_handler=None,
        params=params,
        config=config,
        save_dir=output_dir,
    )

    if not result.success or not result.audios:
        raise HTTPException(status_code=500, detail=f"Generation failed: {getattr(result, 'error', 'unknown')}")

    generated_path = result.audios[0]["path"]

    if req.filename:
        final_path = os.path.join("/output", f"{req.filename}.mp3")
        if generated_path != final_path:
            os.rename(generated_path, final_path)
        return JSONResponse({"status": "ok", "path": final_path, "seed": result.audios[0]["params"]["seed"]})

    return FileResponse(generated_path, media_type="audio/mpeg", filename="generated.mp3")


@app.post("/batch")
def batch(req: BatchRequest):
    """Run the batch generator from generate_music.py track definitions."""
    handler = _get_handler()

    from generate_music import ALL_TRACKS

    tracks = ALL_TRACKS
    if req.track_ids:
        tracks = [t for t in ALL_TRACKS if t["id"] in req.track_ids]
        if not tracks:
            raise HTTPException(status_code=400, detail=f"No matching tracks for IDs: {req.track_ids}")

    output_dir = "/output"
    os.makedirs(output_dir, exist_ok=True)
    results = []

    config = _GenerationConfig(batch_size=1, audio_format="mp3")

    for i, track in enumerate(tracks):
        track_id = track["id"]
        out_path = os.path.join(output_dir, f"{track_id}.mp3")

        if os.path.exists(out_path):
            results.append({"id": track_id, "status": "skipped", "path": out_path})
            continue

        params = _GenerationParams(
            caption=track["caption"],
            lyrics=track.get("lyrics", "[Instrumental]"),
            bpm=track["bpm"],
            duration=track["duration"],
            keyscale=track.get("keyscale", ""),
            inference_steps=8,
            shift=3.0,
            seed=42 + i,
        )

        result = _generate_music(
            dit_handler=handler, llm_handler=None,
            params=params, config=config, save_dir=output_dir,
        )

        if result.success and result.audios:
            generated_path = result.audios[0]["path"]
            if generated_path != out_path:
                os.rename(generated_path, out_path)
            results.append({"id": track_id, "status": "ok", "path": out_path})
        else:
            results.append({"id": track_id, "status": "failed", "error": str(getattr(result, "error", "unknown"))})

    return {"generated": len([r for r in results if r["status"] == "ok"]),
            "skipped": len([r for r in results if r["status"] == "skipped"]),
            "failed": len([r for r in results if r["status"] == "failed"]),
            "results": results}
