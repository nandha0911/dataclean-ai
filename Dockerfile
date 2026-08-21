FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create user with UID 1000 for Hugging Face Spaces compatibility
RUN useradd -m -u 1000 user
WORKDIR /app

# Install Python packages
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ /app/

# Create runtime directories and grant permissions
RUN mkdir -p /app/datasets /app/reports /app/models \
    && chown -R user:user /app \
    && chmod -R 777 /app

USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

# Run uvicorn supporting both Railway ($PORT) and Hugging Face (7860)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
