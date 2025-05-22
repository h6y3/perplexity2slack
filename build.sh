#!/bin/bash

# Clean build directories
rm -rf ./dist/*
rm -rf ./build

# Create a temporary build directory
mkdir -p ./build

# Copy the necessary files to the build directory
cp manifest.json background.js content.js ./build/
cp -r styles ./build/
mkdir -p ./build/assets/icons
cp -r perplexity2slack/assets/icons/* ./build/assets/icons/

# Create the zip file
cd ./build
zip -r ../dist/perplexity2slack.zip *
cd ..

# Clean up the temporary build directory
rm -rf ./build

echo "Build completed. Extension package is in ./dist/perplexity2slack.zip"