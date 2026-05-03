# MediCare AI Frontend - Docker Setup

This directory contains Docker configuration for the MediCare AI Frontend application.

## Files

- **Dockerfile**: Multi-stage Docker build configuration
- **nginx.conf**: Nginx web server configuration
- **docker-compose.yml**: Docker Compose configuration for local development

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

## Building the Docker Image

### Using Docker directly:

```bash
docker build -t medicare-ai-frontend:latest .
```

### Using Docker Compose:

```bash
docker-compose build
```

## Running the Application

### Using Docker directly:

```bash
# Build and run
docker run -p 4200:80 --name medicare-frontend medicare-ai-frontend:latest

# Or run existing image
docker run -p 4200:80 medicare-ai-frontend:latest
```

### Using Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose down
```

## Accessing the Application

Once running, access the application at: **http://localhost:4200**

## Docker Image Details

### Build Stage
- **Base Image**: `node:21-alpine`
- **Node.js Version**: 21 (LTS)
- **Dependencies**: Installed with `npm ci`
- **Build Command**: `npm run build`

### Production Stage
- **Base Image**: `nginx:alpine`
- **Configuration**: Custom Nginx config with:
  - Gzip compression
  - Security headers
  - Cache optimization
  - Angular routing support
  - Health check endpoint

## Environment Variables

Currently, the Docker setup doesn't require explicit environment variables. However, you can extend the Docker setup to support environment-specific configurations:

```bash
docker run -p 4200:80 \
  -e API_URL=http://api.example.com \
  medicare-ai-frontend:latest
```

## Health Checks

The container includes a health check that verifies the application is running:

```bash
# View health status
docker ps

# Manual health check
curl http://localhost/health
```

## Volumes (for development)

To mount local source code for development:

```bash
docker run -p 4200:80 \
  -v $(pwd)/src:/app/src \
  -v /app/node_modules \
  medicare-ai-frontend:latest
```

## Performance Optimization

The Docker setup includes:

1. **Multi-stage Build**: Reduces final image size
2. **Alpine Linux**: Minimal base image (~5MB)
3. **Nginx**: Lightweight, high-performance web server
4. **Gzip Compression**: Reduces bandwidth usage
5. **Cache Busting**: Static assets with long cache expiry
6. **Health Checks**: Automatic container restart on failure

## Image Size

- Build image: ~500MB (includes Node.js and dependencies)
- Final image: ~50-60MB (only Nginx and built assets)

## Troubleshooting

### Image won't build
```bash
# Clear Docker cache
docker system prune -a

# Rebuild
docker build -t medicare-ai-frontend:latest .
```

### Port already in use
```bash
# Use different port
docker run -p 3000:80 medicare-ai-frontend:latest
```

### View container logs
```bash
docker logs medicare-frontend
docker logs -f medicare-frontend  # Follow logs
```

### Access container shell
```bash
docker exec -it medicare-frontend sh
```

## Production Deployment

For production, consider:

1. **Registry**: Push image to Docker Registry (Docker Hub, AWS ECR, etc.)
   ```bash
   docker tag medicare-ai-frontend:latest your-registry/medicare-ai-frontend:latest
   docker push your-registry/medicare-ai-frontend:latest
   ```

2. **Orchestration**: Use Kubernetes or Docker Swarm
3. **Environment-specific builds**: Use build args for different configs
4. **Secrets management**: Use Docker Secrets or external vault

## CI/CD Integration

See `.github/workflows/` for automated build and deployment pipelines.
