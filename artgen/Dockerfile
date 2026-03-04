FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

RUN pip install --no-cache-dir \
    diffusers[torch]==0.30.3 \
    transformers==4.44.2 \
    accelerate==0.34.2 \
    safetensors \
    Pillow \
    sentencepiece \
    protobuf

WORKDIR /app
COPY generate.py /app/generate.py

ENTRYPOINT ["python", "/app/generate.py"]
