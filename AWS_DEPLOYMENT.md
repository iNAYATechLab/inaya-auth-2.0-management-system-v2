# AWS Deployment Guide - iNAYA Auth 2.0

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53                              │
│                    (DNS Management)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   CloudFront CDN                             │
│              (SSL/TLS Termination)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│   EC2 Instance  │    │   EC2 Instance  │
│  (App Server 1) │    │  (App Server 2) │
│   Next.js App   │    │   Next.js App   │
└────────┬────────┘    └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Application Load    │
         │      Balancer         │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │      Amazon RDS       │
         │    (PostgreSQL)       │
         └───────────────────────┘
                     │
         ┌───────────▼───────────┐
         │    Amazon S3          │
         │  (Backups & Files)    │
         └───────────────────────┘
```

---

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Domain name** registered in Route 53
4. **SSL certificate** (will be created via ACM)

---

## 🚀 Step 1: Create VPC and Networking

### 1.1 Create VPC

```bash
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=inaya-auth-vpc}]'
```

### 1.2 Create Subnets

```bash
# Public Subnet 1
aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=inaya-auth-public-1}]'

# Public Subnet 2
aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=inaya-auth-public-2}]'

# Private Subnet 1 (for RDS)
aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.3.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=inaya-auth-private-1}]'

# Private Subnet 2 (for RDS)
aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.4.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=inaya-auth-private-2}]'
```

### 1.3 Create Internet Gateway

```bash
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=inaya-auth-igw}]'

aws ec2 attach-internet-gateway \
  --internet-gateway-id igw-xxx \
  --vpc-id vpc-xxx
```

---

## 🗄️ Step 2: Create RDS PostgreSQL Database

### 2.1 Create DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name inaya-auth-db-subnet-group \
  --db-subnet-group-description "Subnet group for iNAYA Auth RDS" \
  --subnet-ids subnet-xxx subnet-yyy
```

### 2.2 Create DB Security Group

```bash
aws ec2 create-security-group \
  --group-name inaya-auth-db-sg \
  --description "Security group for iNAYA Auth RDS" \
  --vpc-id vpc-xxx

# Allow access from app servers
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.1.0/24
```

### 2.3 Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier inaya-auth-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username inaya_admin \
  --master-user-password 'YourStrongPassword123!' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --db-subnet-group-name inaya-auth-db-subnet-group \
  --vpc-security-group-ids sg-xxx \
  --multi-az \
  --backup-retention-period 30 \
  --preferred-backup-window 03:00-04:00 \
  --preferred-maintenance-window mon:04:00-mon:05:00 \
  --tags Key=Name,Value=inaya-auth-db
```

---

## 💾 Step 3: Create S3 Bucket for Backups

```bash
aws s3api create-bucket \
  --bucket inaya-auth-backups \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket inaya-auth-backups \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket inaya-auth-backups \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket inaya-auth-backups \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

---

## 🖥️ Step 4: Create EC2 Instances

### 4.1 Create Key Pair

```bash
aws ec2 create-key-pair \
  --key-name inaya-auth-key \
  --key-type ed25519 \
  --query 'KeyMaterial' \
  --output text > inaya-auth-key.pem

chmod 400 inaya-auth-key.pem
```

### 4.2 Create AMI with Application

Create an AMI with:
- Amazon Linux 2023
- Node.js 20
- PM2 process manager
- Application code

### 4.3 Create EC2 Security Group

```bash
aws ec2 create-security-group \
  --group-name inaya-auth-app-sg \
  --description "Security group for iNAYA Auth app servers" \
  --vpc-id vpc-xxx

# Allow HTTP/HTTPS from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 3000 \
  --source-group sg-alb-xxx
```

### 4.4 Launch EC2 Instances

```bash
# Instance 1
aws ec2 run-instances \
  --image-id ami-xxx \
  --instance-type t3.medium \
  --key-name inaya-auth-key \
  --security-group-ids sg-xxx \
  --subnet-id subnet-xxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=inaya-auth-app-1}]' \
  --user-data file://user-data.sh

# Instance 2
aws ec2 run-instances \
  --image-id ami-xxx \
  --instance-type t3.medium \
  --key-name inaya-auth-key \
  --security-group-ids sg-xxx \
  --subnet-id subnet-yyy \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=inaya-auth-app-2}]' \
  --user-data file://user-data.sh
```

### 4.5 User Data Script (user-data.sh)

```bash
#!/bin/bash
# Update system
yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install PM2
npm install -g pm2

# Install application
cd /opt
git clone https://github.com/iNAYATechLab/inaya-auth-2.0-management-system-v2.git
cd inaya-auth-2.0-management-system-v2

# Install dependencies
npm ci --production

# Build application
npm run build

# Create environment file
cat > .env <<EOF
DATABASE_URL="postgresql://inaya_admin:YourStrongPassword123!@inaya-auth-db.xxx.us-east-1.rds.amazonaws.com:5432/inaya_auth"
AUTH_SECRET="your-auth-secret"
NEXT_PUBLIC_APP_URL="https://app.inaya-auth.com"
NODE_ENV="production"
# ... other environment variables
EOF

# Start application with PM2
pm2 start npm --name "inaya-auth" -- start
pm2 save
pm2 startup
```

---

## 🌐 Step 5: Create Application Load Balancer

### 5.1 Create ALB Security Group

```bash
aws ec2 create-security-group \
  --group-name inaya-auth-alb-sg \
  --description "Security group for iNAYA Auth ALB" \
  --vpc-id vpc-xxx

# Allow HTTP/HTTPS from internet
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### 5.2 Create Target Group

```bash
aws elbv2 create-target-group \
  --name inaya-auth-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-path /api/health \
  --health-check-protocol HTTP \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --health-check-timeout-seconds 5 \
  --health-check-interval-seconds 30
```

### 5.3 Create Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name inaya-auth-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application
```

### 5.4 Create Listener

```bash
# HTTP listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:xxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"

# HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:xxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:xxx:certificate/xxx \
  --default-actions Type=forward,TargetGroupArn=arn:xxx
```

---

## 🔒 Step 6: Request SSL Certificate

```bash
aws acm request-certificate \
  --domain-name app.inaya-auth.com \
  --subject-alternative-names "*.inaya-auth.com" \
  --validation-method DNS \
  --tags Key=Name,Value=inaya-auth-ssl
```

Add DNS records in Route 53 to validate the certificate.

---

## 🌍 Step 7: Configure Route 53

### 7.1 Create Hosted Zone

```bash
aws route53 create-hosted-zone \
  --name inaya-auth.com \
  --caller-reference $(date +%s)
```

### 7.2 Create DNS Records

```bash
# A record for ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXX \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "app.inaya-auth.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "ZXXX",
            "DNSName": "alb-xxx.us-east-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'
```

---

## 📊 Step 8: Set Up CloudWatch Monitoring

### 8.1 Create CloudWatch Alarm for CPU

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name inaya-auth-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:xxx:inaya-auth-alerts
```

### 8.2 Create CloudWatch Alarm for RDS

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name inaya-auth-db-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=inaya-auth-db \
  --alarm-actions arn:aws:sns:us-east-1:xxx:inaya-auth-alerts
```

---

## 🔄 Step 9: Set Up Automated Backups

### 9.1 Create Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backup"
S3_BUCKET="inaya-auth-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h inaya-auth-db.xxx.us-east-1.rds.amazonaws.com \
  -U inaya_admin \
  -d inaya_auth \
  -F c \
  -f $BACKUP_DIR/db_backup_$DATE.dump

# Encrypt backup
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in $BACKUP_DIR/db_backup_$DATE.dump \
  -out $BACKUP_DIR/db_backup_$DATE.dump.enc \
  -pass pass:YourEncryptionKey

# Upload to S3
aws s3 cp $BACKUP_DIR/db_backup_$DATE.dump.enc \
  s3://$S3_BUCKET/backups/db/

# Cleanup
rm -rf $BACKUP_DIR

echo "Backup completed: $DATE"
```

### 9.2 Set Up Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/scripts/backup.sh >> /var/log/inaya-backup.log 2>&1
```

---

## 🚀 Step 10: Deployment Script

### deploy.sh

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
cd /opt/inaya-auth-2.0-management-system-v2
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Run database migrations
npm run db:migrate:prod

# Restart application
pm2 restart inaya-auth

# Verify deployment
sleep 5
if curl -f http://localhost:3000/api/health; then
  echo "✅ Deployment successful!"
else
  echo "❌ Deployment failed!"
  pm2 logs inaya-auth --lines 50
  exit 1
fi
```

---

## 📈 Cost Estimation

| Service | Configuration | Monthly Cost (USD) |
|---------|--------------|-------------------|
| EC2 (2x t3.medium) | On-Demand | $60 |
| RDS (db.t3.medium) | Multi-AZ | $130 |
| ALB | - | $20 |
| S3 | 100 GB | $2.30 |
| Route 53 | Hosted Zone | $0.50 |
| CloudWatch | - | $5 |
| Data Transfer | 100 GB | $9 |
| **Total** | | **~$227/month** |

---

## 🔧 Post-Deployment Checklist

- [ ] Verify SSL certificate is active
- [ ] Test application at https://app.inaya-auth.com
- [ ] Run database migrations
- [ ] Create super admin user
- [ ] Configure OAuth providers
- [ ] Set up Stripe billing
- [ ] Configure email service (Resend)
- [ ] Set up monitoring alerts
- [ ] Test backup and restore
- [ ] Document runbook

---

## 📞 Support

For deployment issues, contact:
- Email: support@inaya-auth.com
- Documentation: https://docs.inaya-auth.com
