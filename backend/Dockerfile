# RallyLens backend — FastAPI + FFmpeg + OpenCV
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    STORAGE_DIR=/data/storage

# FFmpeg/ffprobe for video metadata + thumbnails, fonts for the synthetic-demo
# overlay, and the shared libs OpenCV needs at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libglib2.0-0 \
        libgl1 \
        fonts-dejavu-core \
        fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh && mkdir -p /data/storage

EXPOSE 8000
CMD ["./entrypoint.sh"]
