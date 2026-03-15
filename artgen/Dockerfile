# SDXL-Turbo art generation service for Triple Triad.
# Exposes a FastAPI endpoint on port 8091 for on-demand image generation.
#
# Build:  docker compose up --build artgen
# Start:  docker compose up artgen
# Stop:   docker compose down
# Generate: curl -X POST http://localhost:8091/generate \
#           -H 'Content-Type: application/json' \
#           -d '{"prompt":"peaceful village","width":1024,"height":576}' --output image.png

FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

RUN pip install --no-cache-dir \
    diffusers[torch]==0.30.3 \
    transformers==4.44.2 \
    accelerate==0.34.2 \
    safetensors \
    Pillow \
    sentencepiece \
    protobuf \
    fastapi \
    uvicorn

WORKDIR /app
COPY generate.py /app/generate.py
COPY service.py /app/service.py

EXPOSE 8091

# Default: run as HTTP service. Override CMD for batch mode: python generate.py
CMD ["uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8091"]
