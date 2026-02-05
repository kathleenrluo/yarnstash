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
RUN VITE_DEMO_MODE=true npm run build
# Verify files were copied to dist after build
RUN ls -la dist/ | head -20
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
# Also copy public folder contents directly to dist (backup in case Vite didn't copy them)
COPY --from=frontend-builder /app/frontend/public/* ./frontend/dist/ 2>/dev/null || echo "Note: Public files should already be in dist from Vite build"

# Copy frontend public assets (carousel images, about-me photo, etc.)
COPY frontend/public ./frontend/public

# Copy demo database
COPY backend/yarn_stash_demo.db ./backend/

# Copy uploads directory (images)
COPY backend/uploads ./backend/uploads

# Expose port
EXPOSE $PORT

# Set environment variables
ENV SERVE_STATIC=true
ENV DEMO_MODE=true
ENV PORT=8000

# Set working directory to backend
WORKDIR /app/backend

# Start the server
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
