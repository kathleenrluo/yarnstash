# Multi-stage build for Railway
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --legacy-peer-deps

COPY frontend ./frontend
RUN cd frontend && VITE_DEMO_MODE=true npm run build

# Python backend stage
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy demo database
COPY backend/yarn_stash_demo.db ./backend/

# Expose port
EXPOSE $PORT

# Set environment variables
ENV SERVE_STATIC=true
ENV DEMO_MODE=true
ENV PORT=8000

# Start the server
CMD cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
