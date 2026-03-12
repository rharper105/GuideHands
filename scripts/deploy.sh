#!/bin/bash

# GuideHands - Google Cloud Run Local Deployment Script
# Ensure you have the Google Cloud SDK installed and authenticated `gcloud auth login`

set -e

PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: No Google Cloud project configured."
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

SERVICE_NAME="guidehands"
REGION="us-central1"
IMAGE_URL="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY environment variable is not set locally."
  echo "Please export GEMINI_API_KEY=your_key before running this script."
  exit 1
fi

echo "🚀 Building and pushing container image to Google Container Registry..."
gcloud builds submit --tag "$IMAGE_URL"

echo "☁️ Deploying to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URL" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}"

echo "✅ Deployment successful!"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format="value(status.url)"
