#!/bin/bash
# Commands to push your portfolio to GitHub

# Initialize Git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Portfolio website ready for deployment"

# Add GitHub remote (your repository URL)
git remote add origin https://github.com/engrqasimkhan001-alt/portfolio.git

# Set branch to main
git branch -M main

# Push to GitHub
git push -u origin main
