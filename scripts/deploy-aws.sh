#!/bin/bash
set -e

# Recipe Battle Platform - AWS EC2 Deployment Script
# Usage: ./deploy-aws.sh <instance-ip> <key-file>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <instance-ip> <key-file.pem>"
    exit 1
fi

INSTANCE_IP=$1
KEY_FILE=$2
REMOTE_USER="ubuntu"
PROJECT_DIR="/home/ubuntu/recipe"

echo "🚀 Deploying Recipe Battle Platform to AWS EC2..."
echo "Instance: $INSTANCE_IP"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf recipe-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='postgres_data' \
    --exclude='uploads' \
    --exclude='logs' \
    .

# Copy to EC2
echo "📤 Uploading to EC2 instance..."
scp -i "$KEY_FILE" recipe-deploy.tar.gz ${REMOTE_USER}@${INSTANCE_IP}:/tmp/

# Deploy on EC2
echo "🔧 Deploying on EC2..."
ssh -i "$KEY_FILE" ${REMOTE_USER}@${INSTANCE_IP} << 'EOF'
    set -e
    
    # Create project directory
    mkdir -p /home/ubuntu/recipe
    cd /home/ubuntu/recipe
    
    # Extract deployment package
    tar -xzf /tmp/recipe-deploy.tar.gz
    rm /tmp/recipe-deploy.tar.gz
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo "⚠️  .env file not found. Copying from .env.example..."
        cp .env.example .env
        echo "🔑 Please update .env with production values!"
    fi
    
    # Pull latest images and rebuild
    echo "🐳 Building Docker images..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
    
    # Stop old containers
    echo "🛑 Stopping old containers..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    
    # Start new containers
    echo "▶️  Starting containers..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    # Check status
    docker-compose ps
    
    echo "✅ Deployment complete!"
EOF

# Cleanup
rm recipe-deploy.tar.gz

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "Access your application at: http://${INSTANCE_IP}"
echo ""
echo "Next steps:"
echo "  1. SSH into the instance: ssh -i $KEY_FILE ${REMOTE_USER}@${INSTANCE_IP}"
echo "  2. Update .env file: nano /home/ubuntu/recipe/.env"
echo "  3. Restart services: cd /home/ubuntu/recipe && docker-compose restart"
echo "  4. Check logs: docker-compose logs -f"
echo ""
