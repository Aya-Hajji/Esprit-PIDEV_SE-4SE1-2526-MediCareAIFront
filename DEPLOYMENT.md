# Deployment Guide

Complete guide for deploying the MediCare AI Frontend application.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Kubernetes Deployment](#kubernetes-deployment)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Docker Deployment

### Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

### Production Build

```bash
# Build Docker image
docker build -t medicare-ai-frontend:latest .

# Run container
docker run -p 4200:80 \
  --name medicare-frontend \
  --restart unless-stopped \
  medicare-ai-frontend:latest
```

### Production Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v
```

### Environment Variables

For production, you might need to configure environment-specific variables:

```bash
docker run -p 4200:80 \
  -e API_URL=https://api.example.com \
  -e ENVIRONMENT=production \
  medicare-ai-frontend:latest
```

### Health Check

```bash
# Check container health
docker ps | grep medicare-frontend

# Manual health check
curl http://localhost:4200/health

# View health check logs
docker inspect --format='{{json .State.Health}}' medicare-frontend
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Helm (optional, for advanced deployments)

### Namespaces

Create namespaces for different environments:

```bash
kubectl create namespace staging
kubectl create namespace production
```

### Staging Deployment

```bash
# Deploy to staging
kubectl apply -f k8s/staging/deployment.yaml

# Check deployment status
kubectl get deployments -n staging

# View pods
kubectl get pods -n staging

# View service
kubectl get svc -n staging

# Check logs
kubectl logs -n staging deployment/medicare-frontend --all-containers=true -f
```

### Production Deployment

```bash
# Deploy to production
kubectl apply -f k8s/production/deployment.yaml

# Check deployment status
kubectl get deployments -n production

# View pods with more details
kubectl get pods -n production -o wide

# View service endpoints
kubectl get svc -n production

# Check logs
kubectl logs -n production deployment/medicare-frontend --all-containers=true -f
```

### Rolling Update

```bash
# Update image to new version
kubectl set image deployment/medicare-frontend \
  frontend=ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:v1.1.0 \
  -n production

# Check rollout status
kubectl rollout status deployment/medicare-frontend -n production

# View rollout history
kubectl rollout history deployment/medicare-frontend -n production

# Rollback if needed
kubectl rollout undo deployment/medicare-frontend -n production
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment/medicare-frontend --replicas=5 -n production

# HPA status
kubectl get hpa -n production

# View HPA details
kubectl describe hpa medicare-frontend -n production
```

### Port Forwarding

```bash
# Forward local port to service
kubectl port-forward svc/medicare-frontend 8080:80 -n staging

# Access at http://localhost:8080
```

---

## Local Development

### Using Docker Compose (Development)

```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up

# Application available at http://localhost:4200
```

### Direct npm Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance benchmarks acceptable
- [ ] Environment variables configured
- [ ] Database migrations completed (if needed)
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Deployment plan documented

### Step-by-Step Production Deployment

#### 1. Prepare Release

```bash
# Create version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# This triggers automated GitHub Actions workflow
```

#### 2. Build & Test

```bash
# Automated by CI/CD pipeline
# - Unit tests run
# - Build created
# - Docker image built
# - Security scan performed
```

#### 3. Deploy to Kubernetes

```bash
# Update deployment image in k8s/production/deployment.yaml
# Then apply:
kubectl apply -f k8s/production/deployment.yaml

# Monitor rollout
kubectl rollout status deployment/medicare-frontend -n production -w
```

#### 4. Verify Deployment

```bash
# Check all pods running
kubectl get pods -n production

# Check service is ready
kubectl get svc -n production

# Test endpoint
curl https://your-domain.com/health

# Check logs for errors
kubectl logs -n production deployment/medicare-frontend --all-containers=true
```

#### 5. Post-deployment

```bash
# Monitor metrics
kubectl top pods -n production

# Check resource usage
kubectl describe hpa -n production

# Review logs
kubectl logs -n production deployment/medicare-frontend -f
```

### Rollback Procedure

If something goes wrong:

```bash
# Check rollout history
kubectl rollout history deployment/medicare-frontend -n production

# Rollback to previous version
kubectl rollout undo deployment/medicare-frontend -n production

# Monitor rollback
kubectl rollout status deployment/medicare-frontend -n production -w
```

---

## Environment Configuration

### Build Arguments

```dockerfile
ARG NODE_ENV=production
ARG API_URL=https://api.example.com
```

### Runtime Environment Variables

```yaml
environment:
  NODE_ENV: production
  API_URL: https://api.example.com
  ENVIRONMENT: production
```

### ConfigMap (Kubernetes)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: production
data:
  API_URL: "https://api.example.com"
  ENVIRONMENT: "production"
  LOG_LEVEL: "info"
```

### Secrets (Kubernetes)

```bash
# Create secret
kubectl create secret generic frontend-secrets \
  --from-literal=api-key=your-api-key \
  -n production

# Use in deployment
valueFrom:
  secretKeyRef:
    name: frontend-secrets
    key: api-key
```

---

## Monitoring & Logging

### Prometheus Metrics

```bash
# Expose metrics endpoint
kubectl port-forward svc/medicare-frontend 9090:9090 -n production
```

### Log Aggregation

```bash
# View structured logs
kubectl logs -n production deployment/medicare-frontend -f --timestamps=true

# Export logs to file
kubectl logs -n production deployment/medicare-frontend > logs.txt
```

### Health Monitoring

```bash
# Check pod health
kubectl get pods -n production -o wide

# Detailed pod status
kubectl describe pod POD_NAME -n production

# Events
kubectl get events -n production --sort-by='.lastTimestamp'
```

---

## Backup & Recovery

### Backup Configuration

```bash
# Backup deployment configuration
kubectl get deployment medicare-frontend -n production -o yaml > deployment-backup.yaml

# Backup all K8s resources
kubectl get all -n production -o yaml > production-backup.yaml
```

### Recovery

```bash
# Restore from backup
kubectl apply -f deployment-backup.yaml

# Restore entire namespace
kubectl apply -f production-backup.yaml
```

---

## Troubleshooting

### Common Issues

#### 1. CrashLoopBackOff

```bash
# Check pod logs
kubectl logs POD_NAME -n production

# Check resource limits
kubectl describe pod POD_NAME -n production

# Check events
kubectl describe events -n production
```

**Solution**: Review logs, increase resource limits, or check image validity.

#### 2. ImagePullBackOff

```bash
# Verify image exists
docker pull ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:latest

# Check imagePullSecrets
kubectl get secrets -n production
```

**Solution**: Create image pull secret or verify image accessibility.

#### 3. Service Unreachable

```bash
# Check service endpoints
kubectl get endpoints -n production

# Check service selectors
kubectl get svc medicare-frontend -n production -o yaml

# Port forward and test
kubectl port-forward svc/medicare-frontend 8080:80 -n production
curl http://localhost:8080
```

**Solution**: Verify service selectors match pod labels.

#### 4. High Resource Usage

```bash
# Check resource metrics
kubectl top pods -n production

# Check HPA status
kubectl describe hpa -n production

# Adjust HPA thresholds
kubectl patch hpa medicare-frontend -p '{"spec":{"targetCPUUtilizationPercentage":75}}' -n production
```

#### 5. SSL/TLS Certificate Issues

```bash
# Check certificate
kubectl get certificate -n production

# View cert details
kubectl describe certificate frontend-cert -n production

# Renew certificate (if using cert-manager)
kubectl annotate certificate frontend-cert \
  cert-manager.io/issue-temporary-certificate="true" \
  -n production --overwrite
```

---

## Performance Tuning

### Resource Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

### HPA Configuration

Adjust autoscaling based on metrics:

```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

### Cache Configuration

Browser cache headers are configured in nginx.conf for optimal performance.

---

## Security Hardening

### Pod Security Policy

```yaml
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

### Network Policy

```bash
# Apply network policy to restrict traffic
kubectl apply -f k8s/network-policy.yaml -n production
```

---

## Maintenance

### Regular Tasks

```bash
# Weekly: Check logs for errors
kubectl logs -n production deployment/medicare-frontend --tail=1000

# Monthly: Review resource usage
kubectl top nodes
kubectl top pods -n production

# Quarterly: Update base images
docker pull node:21-alpine
docker pull nginx:alpine
```

---

## Support

For issues or questions:
- Check logs: `kubectl logs -n production deployment/medicare-frontend`
- Review events: `kubectl get events -n production`
- Consult [DOCKER.md](./DOCKER.md) for Docker-specific issues
- Consult [PIPELINE.md](./PIPELINE.md) for CI/CD pipeline issues
