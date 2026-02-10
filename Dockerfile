# Multi-stage build for Railway
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps

WORKDIR /app
# Copy frontend source code (this includes public/ folder which Vite needs during build)
COPY frontend ./frontend
WORKDIR /app/frontend
# Verify public folder exists before build
RUN ls -la public/ || echo "WARNING: public folder not found"
# Build with demo mode off unless VITE_DEMO_MODE is set (e.g. for a read-only demo deploy)
ARG VITE_DEMO_MODE=false
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE
RUN npm run build
# Verify files were copied to dist after build
RUN echo "=== Files in dist after Vite build ===" && \
    ls -la dist/ | head -20 && \
    echo "=== Checking for image files ===" && \
    ls -la dist/*.JPG dist/*.jpg 2>/dev/null || echo "No JPG files found in dist"
WORKDIR /app

# Python backend stage
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Also copy public folder from builder stage and copy files to dist
# (Vite should copy public/ to dist/ during build, but ensure they're there)
COPY --from=frontend-builder /app/frontend/public ./frontend/public_temp
RUN cp -r /app/frontend/public_temp/* /app/frontend/dist/ 2>/dev/null || true && \
    rm -rf /app/frontend/public_temp && \
    echo "=== Files in dist after copying public ===" && \
    ls -la /app/frontend/dist/*.JPG /app/frontend/dist/*.jpg 2>/dev/null || echo "Still no JPG files"

# Copy frontend public assets (carousel images, about-me photo, etc.)
COPY frontend/public ./frontend/public

# Copy database (same file for both local and demo)
COPY backend/yarn_stash.db ./backend/

# Copy uploads directory (images)
COPY backend/uploads ./backend/uploads

# Expose port
EXPOSE $PORT

# Set environment variables (SERVE_STATIC so we serve the frontend; no DEMO_MODE here—frontend uses build-time VITE_DEMO_MODE)
ENV SERVE_STATIC=true
ENV PORT=8000

# Set working directory to backend
WORKDIR /app/backend

# Start the server
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
