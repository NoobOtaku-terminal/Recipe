#!/bin/bash
set -e

# Recipe Battle Platform - EC2 Instance Setup
# Usage: ./setup-ec2.sh <instance-ip> <key-file>

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <instance-ip> <key-file.pem>"
    exit 1
fi

INSTANCE_IP=$1
KEY_FILE=$2
REMOTE_USER="ubuntu"

echo "🔧 Setting up EC2 instance for Recipe Battle Platform..."
echo "Instance: $INSTANCE_IP"

ssh -i "$KEY_FILE" ${REMOTE_USER}@${INSTANCE_IP} << 'EOF'
    set -e
    
    echo "📦 Updating system packages..."
    sudo apt-get update
    sudo apt-get upgrade -y
    
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "📁 Creating data directories..."
    sudo mkdir -p /mnt/recipe-data/postgres
    sudo mkdir -p /mnt/recipe-data/uploads/recipes
    sudo mkdir -p /mnt/recipe-data/uploads/proofs
    sudo chown -R $USER:$USER /mnt/recipe-data
    
    echo "🔒 Configuring firewall..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw --force enable
    
    echo "⚙️  Installing utilities..."
    sudo apt-get install -y git wget curl htop
    
    echo "✅ EC2 setup complete!"
    echo ""
    echo "Docker version:"
    docker --version
    echo ""
    echo "Docker Compose version:"
    docker-compose --version
    echo ""
    echo "⚠️  You may need to log out and back in for Docker group changes to take effect."
EOF

echo ""
echo "🎉 EC2 instance setup successful!"
echo ""
echo "Next steps:"
echo "  1. Deploy the application: ./scripts/deploy-aws.sh $INSTANCE_IP $KEY_FILE"
echo "  2. Configure SSL certificates (optional)"
echo "  3. Set up automated backups"
echo ""
