# Quick Start Guide - Docker & CI/CD

Fast-track setup guide for running the MediCare AI Frontend with Docker and understanding the CI/CD pipeline.

## 🚀 Quick Start (5 minutes)

### Option 1: Run Directly with Docker

```bash
# Clone repository
git clone https://github.com/Brahem-Ahmed/Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront.git
cd Esprit-PIDEV_SE-4SE1-2526-MediCareAIFront

# Build image
docker build -t medicare-ai:latest .

# Run container
docker run -p 4200:80 medicare-ai:latest

# Open browser
# http://localhost:4200
```

### Option 2: Run with Docker Compose

```bash
# Start application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Open browser
# http://localhost:4200
```

### Option 3: Development with Hot Reload

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Application reloads on file changes
# http://localhost:4200
```

---

## 📦 What's Included

### Docker Files
| File | Purpose |
|------|---------|
| `Dockerfile` | Production-optimized multi-stage build |
| `Dockerfile.dev` | Development image with hot reload |
| `nginx.conf` | Nginx configuration with optimization |
| `.dockerignore` | Files excluded from Docker build |

### Docker Compose Files
| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production setup |
| `docker-compose.dev.yml` | Development setup with hot reload |

### CI/CD Workflows
| File | Triggers | Purpose |
|------|----------|---------|
| `.github/workflows/ci-cd.yml` | Push, PR, Manual | Main pipeline |
| `.github/workflows/testing.yml` | Push, PR, Schedule | Testing & coverage |
| `.github/workflows/quality.yml` | Push, PR | Code quality analysis |
| `.github/workflows/release.yml` | Tags, Main branch | Release & deployment |

### Kubernetes Files
| File | Environment | Purpose |
|------|-------------|---------|
| `k8s/staging/deployment.yaml` | Staging | Staging deployment config |
| `k8s/production/deployment.yaml` | Production | Production deployment config |

### Documentation
| File | Content |
|------|---------|
| `DOCKER.md` | Docker setup & usage |
| `PIPELINE.md` | CI/CD pipeline details |
| `DEPLOYMENT.md` | Deployment procedures |
| `QUICKSTART.md` | This file |

---

## 🔄 CI/CD Pipeline Overview

```
┌─────────────────┐
│  Push to repo   │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │   Testing  │  (npm test, coverage)
    └────┬───────┘
         │
         ▼
    ┌────────────┐
    │   Build    │  (npm run build)
    └────┬───────┘
         │
         ▼
┌─────────────────┐
│ Docker Build &  │  (Build image, push to registry)
│   Registry      │
└────┬────────────┘
     │
     ├─────────────────┐
     │                 │
     ▼                 ▼
  STAGING        PRODUCTION
  (develop)      (main branch)
```

### Pipeline Stages

1. **Test** ✅ - Unit tests, coverage, quality checks
2. **Build** 🏗️ - Compile Angular application
3. **Docker** 🐳 - Build and push Docker image
4. **Security** 🔒 - Scan dependencies, analyze code
5. **Deploy** 🚀 - Deploy to staging/production

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| Base Image Size | ~5MB (Alpine) |
| Final Image Size | 50-60MB |
| Build Time | ~2-3 minutes |
| Test Suite | 175 tests ✅ |
| Code Coverage | Tracked in Codecov |

---

## 🔐 Environment Variables

### For Docker Run

```bash
docker run -p 4200:80 \
  -e API_URL=https://api.example.com \
  -e ENVIRONMENT=production \
  medicare-ai:latest
```

### For Kubernetes

```yaml
env:
  - name: API_URL
    value: "https://api.example.com"
  - name: ENVIRONMENT
    value: "production"
```

---

## 📋 Common Commands

### Docker Commands

```bash
# View running containers
docker ps

# View container logs
docker logs CONTAINER_ID -f

# Stop container
docker stop CONTAINER_ID

# Remove container
docker rm CONTAINER_ID

# View image info
docker images

# Remove image
docker rmi IMAGE_ID
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f SERVICE_NAME

# Execute command in container
docker-compose exec frontend sh

# Rebuild image
docker-compose build --no-cache
```

### Kubernetes Commands (if using K8s)

```bash
# Check deployments
kubectl get deployments -n staging

# View pods
kubectl get pods -n staging

# View service
kubectl get svc -n staging

# Check logs
kubectl logs -n staging deployment/medicare-frontend

# Scale deployment
kubectl scale deployment/medicare-frontend --replicas=3 -n staging
```

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs CONTAINER_ID

# Check image
docker images

# Rebuild image
docker build -t medicare-ai:latest .
```

### Port already in use

```bash
# Find process using port 4200
lsof -i :4200

# Or use different port
docker run -p 3000:80 medicare-ai:latest
```

### Tests failing

```bash
# Run tests locally
npm test

# Run tests headless
npm run test -- --watch=false --browsers=ChromeHeadless
```

### Pipeline not triggering

1. Check branch name (main or develop)
2. Verify `.github/workflows/` files exist
3. Check GitHub Actions is enabled
4. Review workflow syntax: `act -l`

---

## 📚 Documentation Links

- [Detailed Docker Setup](./DOCKER.md)
- [CI/CD Pipeline Details](./PIPELINE.md)
- [Deployment Procedures](./DEPLOYMENT.md)
- [Angular Documentation](https://angular.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 🚢 Production Deployment Checklist

- [ ] All tests passing (175/175) ✅
- [ ] Code reviewed and approved
- [ ] Security scan completed
- [ ] Docker image built and tested
- [ ] Kubernetes manifests prepared
- [ ] Environment variables configured
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Load balancer configured
- [ ] DNS updated (if needed)
- [ ] SSL certificate installed
- [ ] Health checks verified
- [ ] Rollback plan documented

---

## 💡 Pro Tips

### 1. Cache Optimization

```bash
# Docker layer caching
# Install dependencies first (slowly changing)
COPY package*.json ./
RUN npm ci

# Then copy source code (frequently changing)
COPY . .
```

### 2. Multi-stage Builds

Production image only includes built artifacts, not source code or dev dependencies. This reduces image size from 500MB → 50MB.

### 3. Health Checks

```bash
# Health endpoint for monitoring
curl http://localhost:4200/health

# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 80
```

### 4. Logging

```bash
# View Docker logs
docker logs CONTAINER_ID -f --timestamps

# View Kubernetes logs
kubectl logs deployment/medicare-frontend -f
```

### 5. Scaling

```bash
# Horizontal Pod Autoscaler (HPA)
# Automatically scales pods based on CPU/memory

# Manual scaling
kubectl scale deployment/medicare-frontend --replicas=5
```

---

## 🆘 Need Help?

### Debug Container

```bash
# Access container shell
docker exec -it CONTAINER_ID sh

# Or with Docker Compose
docker-compose exec frontend sh
```

### View Detailed Logs

```bash
# Docker
docker logs CONTAINER_ID --tail=100 -f

# Docker Compose
docker-compose logs -f --tail=100

# Kubernetes
kubectl logs POD_NAME -n staging --all-containers=true -f
```

### Check Health

```bash
# Docker
docker ps  # Check container status
docker inspect CONTAINER_ID | grep "State"

# Docker Compose
docker-compose ps

# Kubernetes
kubectl describe pod POD_NAME -n staging
```

---

## 📞 Support Resources

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: See DOCKER.md, PIPELINE.md, DEPLOYMENT.md
- **Logs**: Always check application and pipeline logs first
- **Community**: Angular and Docker documentation communities

---

**Ready to go?** Start with: `docker-compose up -d` 🚀

For detailed information, see the full documentation files in the repository.
