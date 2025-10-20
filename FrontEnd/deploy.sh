#!/bin/bash

# Build the Next.js application
echo "Building the application..."
npm run build

# Create a deployment directory
echo "Creating deployment package..."
mkdir -p deployment
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp next.config.js deployment/
cp .env.local deployment/ 2>/dev/null || echo "Warning: .env.local not found. Make sure to create it on the server."

# Create a zip file
echo "Creating deployment zip file..."
cd deployment
zip -r ../deployment.zip .
cd ..

echo "Deployment package created: deployment.zip"
echo "Upload this file to your hosting service and run 'npm install --production' followed by 'npm start'"
