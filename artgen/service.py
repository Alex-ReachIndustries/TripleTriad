"""
FastAPI service for on-demand art generation using SDXL-Turbo.
All processing is local — no data leaves this machine.

Endpoints:
  GET  /health           - Check service status
  POST /generate         - Generate a single image (returns PNG)
  POST /location         - Generate a location background
  POST /portrait         - Generate an NPC portrait
"""

import os
import io
import threading
import torch
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="Triple Triad Art Generator",
    description="Local AI art generation service using SDXL-Turbo. All processing runs on-device — no data is sent externally.",
    version="1.0.0",
)

# ── Model loading ─────────────────────────────────────────────────────────────

_pipe = None
_pipe_lock = threading.Lock()
_model_ready = threading.Event()


def _load_model():
    """Load the SDXL-Turbo model. Called once at startup in a background thread."""
    global _pipe
    print("Loading SDXL-Turbo model...", flush=True)
    from diffusers import AutoPipelineForText2Image
    try:
        _pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=torch.float16,
            variant="fp16",
            local_files_only=True,
        )
    except Exception:
        print("Local cache miss, downloading model...", flush=True)
        _pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=torch.float16,
            variant="fp16",
        )
    _pipe.to("cuda")
    _model_ready.set()
    print("Model loaded and ready.", flush=True)


def _get_pipe():
    """Return the pipeline, waiting for startup loading to finish."""
    _model_ready.wait()
    return _pipe


@app.on_event("startup")
def startup_event():
    """Start model loading in a daemon thread so it doesn't block health checks."""
    t = threading.Thread(target=_load_model, daemon=True)
    t.start()


# ── Request models ───────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Text description of the image to generate")
    negative_prompt: str = Field("blurry, low quality, text, watermark, signature", description="Negative prompt")
    width: int = Field(512, description="Image width in pixels")
    height: int = Field(512, description="Image height in pixels")
    steps: int = Field(4, ge=1, le=50, description="Inference steps (4 for turbo)")
    guidance_scale: float = Field(0.0, description="Guidance scale (0.0 for turbo)")
    seed: int = Field(-1, description="Seed for reproducibility (-1 = random)")
    filename: Optional[str] = Field(None, description="If provided, saves to /output/{filename}.png and returns path")


class LocationRequest(BaseModel):
    location_id: str = Field(..., description="Location ID from world.ts (e.g. 'balamb_garden')")
    seed: int = Field(-1, description="Seed (-1 = random)")


class PortraitRequest(BaseModel):
    npc_id: str = Field(..., description="NPC ID (e.g. 'quistis_garden_ch1')")
    npc_name: str = Field("NPC", description="NPC display name")
    npc_type: str = Field("duel", description="NPC type: duel, shop, dialogue, tournament")
    location_id: str = Field("", description="Location ID for context")
    region_id: str = Field("balamb", description="Region ID for fallback styling")
    seed: int = Field(-1, description="Seed (-1 = random)")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _generate_image(prompt, negative_prompt, width, height, steps, guidance_scale, seed):
    pipe = _get_pipe()
    generator = None
    if seed >= 0:
        generator = torch.Generator("cuda").manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        generator=generator,
    )
    return result.images[0]


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _pipe is not None}


@app.post("/generate")
def generate(req: GenerateRequest):
    img = _generate_image(
        req.prompt, req.negative_prompt,
        req.width, req.height, req.steps, req.guidance_scale, req.seed,
    )

    if req.filename:
        path = f"/output/{req.filename}.png"
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img.save(path)
        return JSONResponse({"status": "ok", "path": path})

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@app.post("/location")
def location(req: LocationRequest):
    from generate import LOCATION_PROMPTS
    if req.location_id not in LOCATION_PROMPTS:
        raise HTTPException(status_code=404, detail=f"Unknown location: {req.location_id}. Available: {list(LOCATION_PROMPTS.keys())}")

    prompt = LOCATION_PROMPTS[req.location_id]
    img = _generate_image(prompt, "blurry, low quality, text, watermark", 1024, 576, 4, 0.0, req.seed)

    os.makedirs("/output/locations", exist_ok=True)
    path = f"/output/locations/{req.location_id}.png"
    img.save(path)
    return JSONResponse({"status": "ok", "path": path, "prompt": prompt})


@app.post("/portrait")
def portrait(req: PortraitRequest):
    from generate import get_npc_prompt
    prompt = get_npc_prompt(req.npc_id, req.npc_name, req.npc_type, req.location_id, req.region_id)
    full_prompt = f"anime style portrait, detailed face, {prompt}"

    img = _generate_image(full_prompt, "blurry, low quality, text, watermark", 512, 512, 4, 0.0, req.seed)

    os.makedirs("/output/portraits", exist_ok=True)
    path = f"/output/portraits/{req.npc_id}.png"
    img.save(path)
    return JSONResponse({"status": "ok", "path": path, "prompt": prompt})
