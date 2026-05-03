#!/bin/bash

# Kubernetes setup script for kubeadm deployment
# Usage: ./k8s-setup.sh

set -e

CLUSTER_NAME=${1:-medicare-cluster}
CONTROL_PLANE_IP=${2:-192.168.1.100}
CONTROL_PLANE_PORT=${3:-6443}

echo "=========================================="
echo "Kubernetes Setup for MediCareAI Frontend"
echo "=========================================="
echo ""

# Create namespaces
echo "📦 Creating namespaces..."
kubectl apply -f k8s/namespace.yaml

# Create ConfigMaps
echo "⚙️  Creating ConfigMaps..."
kubectl apply -f k8s/configmap.yaml

# Deploy to production
echo "🚀 Deploying to production..."
kubectl apply -f k8s/production/deployment.yaml

# Deploy to staging
echo "🚀 Deploying to staging..."
kubectl apply -f k8s/staging/deployment.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/medicareai-frontend -n production --timeout=5m
kubectl rollout status deployment/medicareai-frontend-staging -n staging --timeout=5m

# Get service information
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Production Service:"
kubectl get service medicareai-frontend -n production
echo ""
echo "Staging Service:"
kubectl get service medicareai-frontend-staging -n staging
echo ""

# Get NodePort information
PROD_NODE_PORT=$(kubectl get service medicare-frontend -n production -o jsonpath='{.spec.ports[0].nodePort}')
STAGING_NODE_PORT=$(kubectl get service medicare-frontend-staging -n staging -o jsonpath='{.spec.ports[0].nodePort}')

echo "Access your application:"
echo "  Production: http://<VM-IP>:${PROD_NODE_PORT}"
echo "  Staging:    http://<VM-IP>:${STAGING_NODE_PORT}"
echo ""

# Show pod status
echo "Pod Status:"
echo "Production:"
kubectl get pods -n production -l app=medicareai-frontend
echo ""
echo "Staging:"
kubectl get pods -n staging -l app=medicareai-frontend-staging
echo ""

echo "To check logs: kubectl logs -f deployment/medicareai-frontend -n production"
echo ""
