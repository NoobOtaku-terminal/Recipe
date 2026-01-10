# AWS EC2 Deployment Guide

Complete guide for deploying Recipe Battle Platform to AWS EC2.

## 📋 Prerequisites

- AWS Account with EC2 access
- AWS CLI installed and configured (optional)
- SSH key pair for EC2 access
- Domain name (optional, for SSL)

## 🚀 Quick Deployment

### 1. Launch EC2 Instance

**Recommended Configuration:**

- **Instance Type**: t3.medium or better (2 vCPU, 4 GB RAM minimum)
- **AMI**: Ubuntu Server 22.04 LTS
- **Storage**: 30 GB root volume + 20 GB EBS volume for data
- **Security Group Rules**:
  - SSH (22): Your IP
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0

**Launch via AWS Console:**

```bash
1. Go to EC2 Dashboard → Launch Instance
2. Name: recipe-platform-prod
3. AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
4. Instance type: t3.medium
5. Key pair: Create new or select existing
6. Network: Default VPC
7. Storage: 30 GB gp3
8. Launch instance
```

**Or via AWS CLI:**

```bash
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --instance-type t3.medium \
    --key-name your-key-name \
    --security-group-ids sg-xxxxxxxx \
    --subnet-id subnet-xxxxxxxx \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=recipe-platform-prod}]'
```

### 2. Attach EBS Volume for Data Persistence

```bash
# Create EBS volume (20 GB)
aws ec2 create-volume \
    --size 20 \
    --volume-type gp3 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=recipe-data}]'

# Attach to instance
aws ec2 attach-volume \
    --volume-id vol-xxxxxxxx \
    --instance-id i-xxxxxxxx \
    --device /dev/sdf
```

**Format and mount (on EC2):**

```bash
sudo mkfs -t ext4 /dev/sdf
sudo mkdir -p /mnt/recipe-data
sudo mount /dev/sdf /mnt/recipe-data
echo '/dev/sdf /mnt/recipe-data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
```

### 3. Configure Security Group

**Inbound Rules:**
| Type | Protocol | Port | Source | Description |
|-------|----------|------|-------------|--------------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |

**Via AWS Console:**

```
1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Edit inbound rules
4. Add rules as per table above
5. Save rules
```

### 4. Automated Setup

```bash
# Clone repository locally
git clone <your-repo-url>
cd Recipe

# Make scripts executable
chmod +x scripts/*.sh

# Set up EC2 instance (installs Docker, creates directories)
./scripts/setup-ec2.sh <instance-ip> <key-file.pem>

# Deploy application
./scripts/deploy-aws.sh <instance-ip> <key-file.pem>
```

### 5. Manual Configuration

After deployment, SSH into the instance:

```bash
ssh -i your-key.pem ubuntu@<instance-ip>
cd /home/ubuntu/recipe
```

**Update environment variables:**

```bash
nano .env
```

**Required changes:**

```env
# Generate secure password
POSTGRES_PASSWORD=<generate-strong-password>

# Generate JWT secret (64 characters)
JWT_SECRET=<generate-random-string>

# Production settings
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

**Generate secure secrets:**

```bash
# PostgreSQL password
openssl rand -base64 32

# JWT secret
openssl rand -base64 64
```

**Restart services:**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

## 🔒 SSL/HTTPS Setup

### Option 1: Let's Encrypt (Free)

**Install Certbot:**

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

**Generate certificates:**

```bash
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

**Update nginx configuration:**

```bash
cd /home/ubuntu/recipe
nano nginx/nginx.conf

# Uncomment HTTPS server block
# Update server_name with your domain
# Update SSL certificate paths:
#   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

**Mount certificates in docker-compose.prod.yml:**

```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/nginx/ssl:ro
```

**Restart nginx:**

```bash
docker-compose restart nginx
```

**Auto-renewal:**

```bash
# Add cron job
sudo crontab -e

# Add line:
0 3 * * * certbot renew --quiet && docker-compose -f /home/ubuntu/recipe/docker-compose.yml -f /home/ubuntu/recipe/docker-compose.prod.yml restart nginx
```

### Option 2: AWS Certificate Manager + Load Balancer

1. Request certificate in ACM
2. Create Application Load Balancer
3. Add HTTPS listener with ACM certificate
4. Forward traffic to EC2 instance

## 📊 Monitoring & Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Checks

```bash
# Run health check script
./scripts/health-check.sh http://<instance-ip>

# Manual checks
curl http://<instance-ip>/health
curl http://<instance-ip>/api/health
curl http://<instance-ip>/api/health/db
```

### Container Stats

```bash
# Real-time stats
docker stats

# Container status
docker-compose ps
```

## 🗄️ Database Management

### Backups

**Automated backups (cron):**

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/ubuntu/recipe/scripts/backup-db.sh
```

**Manual backup:**

```bash
./scripts/backup-db.sh prod-backup-$(date +%Y%m%d)
```

**Backups are stored in:**

```
/home/ubuntu/recipe/backups/
```

### Restore

```bash
# From local backup
gunzip -c backups/recipe_db_20260108.sql.gz | docker-compose exec -T postgres psql -U recipeuser -d recipedb

# From S3 (if configured)
aws s3 cp s3://your-bucket/backups/recipe_db_20260108.sql.gz - | gunzip | docker-compose exec -T postgres psql -U recipeuser -d recipedb
```

### Database Access

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U recipeuser -d recipedb

# Run SQL file
docker-compose exec -T postgres psql -U recipeuser -d recipedb < script.sql
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# 1. SSH into instance
ssh -i your-key.pem ubuntu@<instance-ip>
cd /home/ubuntu/recipe

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 4. Check status
docker-compose ps
```

### System Updates

```bash
# Update Ubuntu packages
sudo apt-get update
sudo apt-get upgrade -y

# Update Docker
curl -fsSL https://get.docker.com | sh

# Reboot if kernel updated
sudo reboot
```

### Database Migrations

```bash
# Migrations run automatically on startup
# To manually run:
docker-compose run --rm migrations
```

## 📈 Scaling

### Horizontal Scaling (Multiple Backend Instances)

**Update docker-compose.prod.yml:**

```yaml
backend:
  deploy:
    replicas: 3 # Run 3 backend instances
```

**Restart:**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3
```

### Vertical Scaling (Larger Instance)

1. Stop application: `docker-compose down`
2. In AWS Console: Instance → Actions → Instance Settings → Change Instance Type
3. Select larger type (e.g., t3.large)
4. Start instance
5. Start application: `docker-compose up -d`

### Database Scaling

**Option 1: Larger instance + more resources**

```yaml
# docker-compose.prod.yml
postgres:
  deploy:
    resources:
      limits:
        cpus: "4"
        memory: 8G
```

**Option 2: Migrate to RDS**

1. Create RDS PostgreSQL instance
2. Migrate data using pg_dump/pg_restore
3. Update DATABASE_URL in .env
4. Restart application

## 🔧 Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -m

# Restart services
docker-compose restart
```

### Database connection errors

```bash
# Check postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify connection string
docker-compose exec backend printenv DATABASE_URL
```

### High memory usage

```bash
# Check stats
docker stats

# Reduce replicas
docker-compose scale backend=1

# Clear Docker cache
docker system prune -a
```

### Nginx errors

```bash
# Check nginx logs
docker-compose logs nginx

# Test configuration
docker-compose exec nginx nginx -t

# Restart nginx
docker-compose restart nginx
```

## 🛡️ Security Best Practices

### Firewall

```bash
# UFW is configured by setup script
sudo ufw status

# Allow specific IP only for SSH
sudo ufw delete allow 22/tcp
sudo ufw allow from YOUR_IP to any port 22
```

### Updates

```bash
# Enable automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Secrets Management

- Never commit .env to version control
- Use AWS Secrets Manager for production secrets
- Rotate JWT secrets regularly
- Use strong database passwords (32+ characters)

### Database

- PostgreSQL is NOT exposed to public internet
- Only accessible via Docker network
- Regular backups to S3
- Enable SSL for RDS in production

## 💰 Cost Optimization

**Monthly estimates (US East):**

| Resource      | Type       | Cost/Month |
| ------------- | ---------- | ---------- |
| EC2 t3.medium | On-Demand  | ~$30       |
| EBS 50 GB gp3 | Storage    | ~$4        |
| Data Transfer | 100 GB out | ~$9        |
| **Total**     |            | **~$43**   |

**Savings:**

- Reserved Instances: 40% savings
- Spot Instances: 70% savings (for dev)
- S3 for media: Cheaper than EBS
- CloudFront CDN: Reduce transfer costs

## 📞 Support & Monitoring

### CloudWatch Integration

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Alerts

Set up SNS topics and CloudWatch alarms for:

- CPU > 80%
- Memory > 80%
- Disk > 85%
- HTTP 5xx errors
- Database connection failures

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
