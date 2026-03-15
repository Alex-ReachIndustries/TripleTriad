# ACE-Step 1.5 music generation service for Triple Triad.
# Uses the pre-built community image with model weights included.
#
# Build:  docker compose -f docker-compose.music.yml build musicgen
# Start:  docker compose -f docker-compose.music.yml up musicgen
# Batch:  docker compose -f docker-compose.music.yml run --rm musicgen python /scripts/generate_music.py

FROM ghcr.io/dotnetautor/ace-step-1.5-docker:latest

ENV PYTHONUNBUFFERED=1
ENV PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

# Install FastAPI for service mode
RUN uv pip install --system fastapi uvicorn

COPY service.py /scripts/service.py
COPY generate_music.py /scripts/generate_music.py

EXPOSE 8090

CMD ["uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8090", "--app-dir", "/scripts"]
