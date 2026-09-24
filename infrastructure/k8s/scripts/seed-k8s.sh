#!/bin/bash
set -e

echo "Seeding databases inside Kubernetes cluster..."
AUTH_POD=$(kubectl get pod -l app=auth-service -n instagram -o jsonpath="{.items[0].metadata.name}")
USER_POD=$(kubectl get pod -l app=user-service -n instagram -o jsonpath="{.items[0].metadata.name}")
POST_POD=$(kubectl get pod -l app=post-service -n instagram -o jsonpath="{.items[0].metadata.name}")
FEED_POD=$(kubectl get pod -l app=feed-service -n instagram -o jsonpath="{.items[0].metadata.name}")
NOTIF_POD=$(kubectl get pod -l app=notification-service -n instagram -o jsonpath="{.items[0].metadata.name}")

echo "1. Seeding auth-service..."
kubectl exec -it $AUTH_POD -n instagram -- npm run seed

echo "2. Seeding user-service..."
kubectl exec -it $USER_POD -n instagram -- npm run seed

echo "3. Seeding post-service..."
kubectl exec -it $POST_POD -n instagram -- npm run seed

echo "4. Seeding feed-service..."
kubectl exec -it $FEED_POD -n instagram -- npm run seed

echo "5. Seeding notification-service..."
kubectl exec -it $NOTIF_POD -n instagram -- npm run seed

echo "Kubernetes seeding complete!"
