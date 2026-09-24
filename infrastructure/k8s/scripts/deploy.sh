#!/bin/bash
set -e

ENV=${1:-development}
echo "Deploying Instagram Clone microservices to Kubernetes ($ENV)..."

if [ "$ENV" == "production" ]; then
  kubectl apply -k infrastructure/k8s/overlays/production
else
  kubectl apply -k infrastructure/k8s/overlays/development
fi

echo "Waiting for PostgreSQL and Kafka to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n instagram --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=redis -n instagram --timeout=60s || true

echo "Cluster deployed successfully! Run 'kubectl get pods -n instagram' to check status."
