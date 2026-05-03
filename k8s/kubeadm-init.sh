#!/bin/bash

# Kubeadm initialization script for Vagrant VM
# Run this on the master node after Vagrant VM is up

set -e

echo "=========================================="
echo "Initializing Kubernetes with kubeadm"
echo "=========================================="
echo ""

# Variables
POD_NETWORK_CIDR=${1:-10.244.0.0/16}  # Flannel default
CONTROL_PLANE_ENDPOINT=${2:-192.168.1.100:6443}

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# Install Docker (if not already installed)
if ! command -v docker &> /dev/null; then
  echo "🐳 Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
  sudo usermod -aG docker $USER
fi

# Install kubeadm, kubelet, kubectl
if ! command -v kubeadm &> /dev/null; then
  echo "☸️  Installing kubeadm, kubelet, kubectl..."
  
  # Add Kubernetes repo
  sudo curl -fsSLo /etc/apt/keyrings/kubernetes-archive-keyring.gpg https://dl.k8s.io/apt/doc/apt-key.gpg
  echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
  
  # Install
  sudo apt-get update -qq
  sudo apt-get install -y -qq kubeadm kubelet kubectl
  
  # Hold versions
  sudo apt-mark hold kubeadm kubelet kubectl
fi

# Disable swap
echo "🔧 Disabling swap..."
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# Load kernel modules
echo "📋 Loading kernel modules..."
sudo modprobe overlay
sudo modprobe br_netfilter

# Configure sysctl
echo "⚙️  Configuring sysctl..."
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes.conf
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sudo sysctl --system

# Initialize kubeadm
echo ""
echo "🚀 Initializing kubeadm..."
sudo kubeadm init \
  --apiserver-advertise-address=0.0.0.0 \
  --apiserver-cert-extra-sans=$CONTROL_PLANE_ENDPOINT \
  --pod-network-cidr=$POD_NETWORK_CIDR \
  --kubernetes-version=stable \
  --control-plane-endpoint=$CONTROL_PLANE_ENDPOINT \
  --skip-token-print

# Setup kubeconfig for current user
echo "📝 Setting up kubeconfig..."
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI plugin (Flannel)
echo "🌐 Installing Flannel CNI..."
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

# Wait for nodes to be ready
echo "⏳ Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s || true

# Install nginx-ingress controller
echo "🔌 Installing nginx-ingress controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/baremetal/deploy.yaml

# Wait for ingress controller
echo "⏳ Waiting for ingress controller..."
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/component=controller -n ingress-nginx --timeout=300s || true

# Get join command
echo ""
echo "=========================================="
echo "✅ Cluster initialization complete!"
echo "=========================================="
echo ""

TOKEN=$(sudo kubeadm token list | grep -v TOKEN | awk '{print $1}' | head -1)
CERT_HASH=$(openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der | openssl dgst -sha256 -hex | sed 's/^.* //')
CONTROL_IP=$(hostname -I | awk '{print $1}')

echo "To join worker nodes to the cluster, run this command on the worker node:"
echo ""
echo "sudo kubeadm join $CONTROL_IP:6443 --token $TOKEN --discovery-token-ca-cert-hash sha256:$CERT_HASH"
echo ""
echo "Cluster information:"
echo "  API Server: https://$CONTROL_IP:6443"
echo "  Kubeconfig: ~/.kube/config"
echo ""
echo "Check cluster status:"
echo "  kubectl get nodes"
echo "  kubectl get pods -A"
echo ""
