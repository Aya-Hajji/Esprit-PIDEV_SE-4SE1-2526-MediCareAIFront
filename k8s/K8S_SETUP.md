# Kubernetes Deployment Guide - MediCareAI Frontend

## Prerequisites

- Vagrant VM with kubeadm installed
- kubectl installed on your local machine
- Docker image pushed to registry (ghcr.io)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Vagrant VM (kubeadm)            │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐   │
│  │  nginx-ingress Controller        │   │
│  │  (Port 80/443)                   │   │
│  └──────────────────────────────────┘   │
│           ↓                              │
│  ┌──────────────────────────────────┐   │
│  │   Production Namespace           │   │
│  │  ┌────────────────────────────┐  │   │
│  │  │ medicare-frontend (2 pods) │  │   │
│  │  │ (NodePort: 30080)          │  │   │
│  │  └────────────────────────────┘  │   │
│  └──────────────────────────────────┘   │
│           ↓                              │
│  ┌──────────────────────────────────┐   │
│  │   Staging Namespace              │   │
│  │  ┌────────────────────────────┐  │   │
│  │  │ medicare-frontend-staging  │  │   │
│  │  │ (NodePort: 30081)          │  │   │
│  │  └────────────────────────────┘  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Files Overview

### Core Manifests

- **namespace.yaml** - Creates production and staging namespaces
- **configmap.yaml** - nginx configuration for both environments
- **production/deployment.yaml** - Production deployment with service and ingress
- **staging/deployment.yaml** - Staging deployment with service and ingress

### Scripts

- **kubeadm-init.sh** - Initialize kubeadm cluster on Vagrant VM
- **deploy.sh** - Deploy application to Kubernetes cluster

## Step 1: Initialize Kubeadm Cluster

### On Vagrant VM (Master Node):

```bash
# SSH into Vagrant VM
vagrant ssh

# Run initialization script
bash /path/to/k8s/kubeadm-init.sh

# This will:
# - Install Docker, kubeadm, kubelet, kubectl
# - Disable swap
# - Initialize kubeadm cluster
# - Install Flannel CNI
# - Install nginx-ingress controller
```

### Verify Cluster

```bash
# Check nodes
kubectl get nodes

# Check system pods
kubectl get pods -A

# Expected output:
# All nodes should show "Ready" status
```

## Step 2: Configure kubectl on Local Machine

### Copy kubeconfig from Vagrant VM:

```bash
# On your local machine
vagrant scp master:/home/vagrant/.kube/config ~/.kube/config-medicareai

# Update kubeconfig to use local VM IP
# Edit ~/.kube/config-medicareai and change:
# server: https://127.0.0.1:6443
# to:
# server: https://192.168.1.100:6443  (use your VM IP)

# Set KUBECONFIG
export KUBECONFIG=~/.kube/config-medicareai

# Verify connection
kubectl cluster-info
```

## Step 3: Deploy Application

### From Project Root:

```bash
# Make scripts executable
chmod +x k8s/*.sh

# Deploy to cluster
./k8s/deploy.sh

# This will:
# - Create namespaces
# - Create ConfigMaps
# - Deploy production environment
# - Deploy staging environment
# - Show access URLs
```

## Step 4: Configure /etc/hosts

Add entries to your /etc/hosts file (on your local machine):

```bash
# On macOS/Linux (edit /etc/hosts)
192.168.1.100 medicare.local staging-medicare.local

# On Windows (edit C:\Windows\System32\drivers\etc\hosts)
192.168.1.100 medicare.local staging-medicare.local
```

## Step 5: Access Application

### Via NodePort (Direct):

```bash
# Production
http://192.168.1.100:30080

# Staging
http://192.168.1.100:30081
```

### Via Ingress (if DNS is configured):

```bash
# Production
http://medicare.local

# Staging
http://staging-medicare.local
```

## Common Commands

### View Deployments

```bash
# All namespaces
kubectl get deployments -A

# Production only
kubectl get deployments -n production

# Staging only
kubectl get deployments -n staging
```

### View Pods

```bash
# Production
kubectl get pods -n production

# Staging
kubectl get pods -n staging

# With detailed info
kubectl get pods -n production -o wide
```

### View Services

```bash
# Production
kubectl get svc -n production

# Staging
kubectl get svc -n staging
```

### View Logs

```bash
# Recent logs
kubectl logs deployment/medicare-frontend -n production

# Follow logs
kubectl logs -f deployment/medicare-frontend -n production

# Specific pod
kubectl logs <pod-name> -n production
```

### Describe Resources

```bash
# Get detailed info about deployment
kubectl describe deployment medicare-frontend -n production

# Get detailed info about pod
kubectl describe pod <pod-name> -n production
```

### Update Deployment

```bash
# Update image
kubectl set image deployment/medicare-frontend \
  frontend=ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:latest \
  -n production

# Rollout status
kubectl rollout status deployment/medicare-frontend -n production

# Rollback to previous version
kubectl rollout undo deployment/medicare-frontend -n production
```

### Scale Deployment

```bash
# Scale to 3 replicas
kubectl scale deployment medicare-frontend --replicas=3 -n production

# View HPA status
kubectl get hpa -n production
```

### Access Shell in Pod

```bash
# Get into a pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Run command in pod
kubectl exec <pod-name> -n production -- curl http://localhost/health
```

## Troubleshooting

### Pod not starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n production

# Check logs
kubectl logs <pod-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
```

### Image pull errors

```bash
# Verify image exists
docker pull ghcr.io/brahem-ahmed/esprit-pidev_se-4se1-2526-medicareaifront:latest

# Check image pull secrets (if using private registry)
kubectl get secrets -n production
```

### Network connectivity issues

```bash
# Test DNS
kubectl run -it --rm debug --image=busybox -- nslookup kubernetes.default

# Test connectivity between pods
kubectl run -it --rm debug --image=busybox -- wget http://medicare-frontend:80/health
```

### Ingress not working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress
kubectl get ingress -n production

# Describe ingress
kubectl describe ingress medicare-frontend -n production

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

## Monitoring & Health Checks

### Health Check Endpoint

The nginx configuration includes a `/health` endpoint that returns:

```bash
curl http://192.168.1.100:30080/health
# Output: healthy
```

### Pod Health Status

```bash
# Liveness probe (restarts if failing)
# Readiness probe (removes from load balancer if failing)

kubectl get pods -n production -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")]}'
```

### Resource Usage

```bash
# Show CPU/memory usage
kubectl top nodes
kubectl top pods -n production
kubectl top pods -n staging
```

## Cleanup

### Remove deployment

```bash
# Remove specific deployment
kubectl delete deployment medicare-frontend -n production

# Remove entire namespace
kubectl delete namespace production

# Remove all resources
kubectl delete -f k8s/
```

### Reset cluster

```bash
# WARNING: This deletes everything!
sudo kubeadm reset -f
```

## CI/CD Integration

To automate deployments from GitHub Actions:

```yaml
# .github/workflows/deploy-k8s.yml
- name: Deploy to Kubernetes
  run: |
    kubectl set image deployment/medicare-frontend \
      frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
      -n production
    kubectl rollout status deployment/medicare-frontend -n production
```

## Next Steps

1. **Configure DNS** - Set up proper DNS records pointing to your Vagrant VM
2. **Enable HTTPS** - Install cert-manager and configure Let's Encrypt
3. **Setup monitoring** - Install Prometheus and Grafana
4. **Setup logging** - Install ELK stack or similar
5. **Add backup strategy** - Regular etcd backups

## References

- [kubeadm Documentation](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/)
- [nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Flannel CNI](https://github.com/coreos/flannel)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
