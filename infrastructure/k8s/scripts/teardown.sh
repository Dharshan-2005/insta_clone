#!/bin/bash
set -e

ENV=${1:-development}
echo "Tearing down Instagram Clone microservices ($ENV)..."

if [ "$ENV" == "production" ]; then
  kubectl delete -k infrastructure/k8s/overlays/production
else
  kubectl delete -k infrastructure/k8s/overlays/development
fi

echo "Teardown complete."
