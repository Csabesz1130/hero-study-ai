# 🚀 Global Knowledge Co-Pilot - Production Deployment Guide

## 📋 Overview

Ez az útmutató lépésről lépésre végigvezet a Global Knowledge Co-Pilot teljes production környezetbe való telepítésén.

## 🏗️ **Architektúra Összefoglaló**

### Mikroszolgáltatások
- **Challenge Service**: Challenge-ek kezelése (100% ✅)
- **Team Formation Service**: AI-alapú csapatalkotás (95% ✅)
- **Workspace Service**: Kollaboratív munkaterületek (90% ✅)
- **Reputation Service**: Reputáció és skills (95% ✅)
- **Submission Service**: Submission showcase (85% ✅)

### Infrastruktúra Komponensek
- **Database**: PostgreSQL 15 + Drizzle ORM
- **Cache**: Redis 7
- **File Storage**: MinIO (S3-kompatibilis)
- **Search**: Elasticsearch 8.11
- **Message Queue**: RabbitMQ 3
- **WebSocket**: Real-time collaboration
- **Monitoring**: Prometheus + Grafana
- **Reverse Proxy**: Nginx
- **Auth**: JWT + RBAC

## 🔧 **Előfeltételek**

### System Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB ajánlott)
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

### Software Dependencies
```bash
# Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git
sudo apt update && sudo apt install git -y

# SSL/TLS (Let's Encrypt)
sudo apt install certbot -y
```

## 📁 **Projektstruktúra**

```
hero-study-ai/
├── docker-compose.production.yml    # Production Docker setup
├── Dockerfile.production           # Main app Dockerfile
├── .env.production                 # Environment variables
├── scripts/
│   ├── start.sh                   # Application startup script
│   ├── backup.sh                  # Database backup script
│   └── init-db.sql               # Database initialization
├── config/
│   ├── nginx/                     # Nginx configuration
│   ├── prometheus/                # Monitoring setup
│   ├── grafana/                   # Dashboard configuration
│   └── rabbitmq.conf             # Message queue config
├── src/                           # Application source code
└── services/                      # Microservices
    ├── file-service/
    ├── websocket-service/
    └── healthcheck/
```

## 🚀 **Deployment Steps**

### 1. Repository Setup
```bash
# Clone repository
git clone https://github.com/your-org/hero-study-ai.git
cd hero-study-ai

# Create production environment file
cp .env.production.template .env.production
```

### 2. Environment Configuration
Szerkeszd a `.env.production` fájlt:

```bash
nano .env.production
```

**Kritikus változók beállítása:**
```env
# Domain and URLs
FRONTEND_URL=https://your-domain.com

# Security (FONTOS: Generálj egyedi értékeket!)
JWT_SECRET=$(openssl rand -base64 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
RABBITMQ_PASSWORD=$(openssl rand -base64 32)

# OpenAI API Key
OPENAI_API_KEY=sk-your-real-openai-key

# Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_USER=notifications@your-domain.com
SMTP_PASSWORD=your-email-password
```

### 3. SSL Certificate Setup
```bash
# Generate Let's Encrypt certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Create SSL directory
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*
```

### 4. Nginx Configuration
```bash
# Create Nginx config directory
mkdir -p config/nginx

# Copy Nginx configuration
cat > config/nginx/copilot.conf << 'EOF'
upstream app_upstream {
    server copilot-app:3000;
}

upstream websocket_upstream {
    server websocket-service:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    client_max_body_size 50M;

    # Main application
    location / {
        proxy_pass http://app_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket connections
    location /socket.io/ {
        proxy_pass http://websocket_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

### 5. Database Initialization
```bash
# Create database initialization script
mkdir -p scripts
cat > scripts/init-db.sql << 'EOF'
-- Create database
CREATE DATABASE hero_study_copilot;

-- Create user
CREATE USER copilot_user WITH ENCRYPTED PASSWORD 'your-secure-postgres-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hero_study_copilot TO copilot_user;
ALTER USER copilot_user CREATEDB;

-- Enable extensions
\c hero_study_copilot;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

GRANT ALL ON SCHEMA public TO copilot_user;
EOF
```

### 6. Build and Deploy
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d --build

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f copilot-app
```

### 7. Health Check & Verification
```bash
# Check application health
curl https://your-domain.com/api/health

# Check individual services
curl http://localhost:3000/api/health    # Main app
curl http://localhost:9090/targets       # Prometheus
curl http://localhost:3001               # Grafana
curl http://localhost:15672              # RabbitMQ Management
```

## 🔍 **Service URLs**

| Service | URL | Credentials |
|---------|-----|-------------|
| Main App | https://your-domain.com | - |
| Grafana | http://your-domain.com:3001 | admin / your-grafana-password |
| Prometheus | http://your-domain.com:9090 | - |
| RabbitMQ | http://your-domain.com:15672 | copilot_rabbit / your-rabbitmq-password |
| MinIO Console | http://your-domain.com:9001 | minio_admin / your-minio-password |
| Elasticsearch | http://your-domain.com:9200 | - |

## 📊 **Monitoring & Maintenance**

### Log Monitoring
```bash
# Application logs
docker-compose -f docker-compose.production.yml logs -f copilot-app

# Database logs
docker-compose -f docker-compose.production.yml logs -f postgres

# All services
docker-compose -f docker-compose.production.yml logs -f
```

### Database Backup
```bash
# Manual backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U copilot_user hero_study_copilot > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (setup cron)
0 2 * * * cd /path/to/hero-study-ai && docker-compose -f docker-compose.production.yml run --rm db-backup
```

### System Monitoring
```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check service health
docker-compose -f docker-compose.production.yml exec healthcheck curl localhost:8080/health
```

## 🔐 **Security Checklist**

### Before Production
- [ ] Change all default passwords
- [ ] Generate secure JWT secrets (64+ characters)
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules (only allow 80, 443, 22)
- [ ] Configure fail2ban for SSH protection
- [ ] Enable automated security updates
- [ ] Set up log monitoring and alerts
- [ ] Configure backup verification
- [ ] Test disaster recovery procedures

### Firewall Configuration
```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw deny 3000/tcp  # Block direct app access
sudo ufw deny 5432/tcp  # Block direct DB access
```

## 📈 **Performance Optimization**

### Scaling Options
```bash
# Scale application instances
docker-compose -f docker-compose.production.yml up -d --scale copilot-app=3

# Scale worker services
docker-compose -f docker-compose.production.yml up -d --scale worker-service=4

# Scale WebSocket services
docker-compose -f docker-compose.production.yml up -d --scale websocket-service=2
```

### Resource Monitoring
- CPU Usage: Keep below 70%
- Memory Usage: Keep below 80%
- Disk Usage: Keep below 80%
- Database Connections: Monitor connection pool

## 🚨 **Troubleshooting**

### Common Issues

**Service Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs service-name

# Check disk space
df -h

# Check memory
free -h
```

**Database Connection Issues**
```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.production.yml logs postgres

# Test connection
docker-compose -f docker-compose.production.yml exec postgres psql -U copilot_user -d hero_study_copilot -c "SELECT 1;"
```

**SSL Certificate Issues**
```bash
# Renew certificates
sudo certbot renew

# Update SSL files
sudo cp /etc/letsencrypt/live/your-domain.com/* ssl/
docker-compose -f docker-compose.production.yml restart nginx
```

## 📱 **Mobile & Cross-Platform**

### PWA Support
Az alkalmazás Progressive Web App funkcionalitással rendelkezik:
- Offline capability
- Push notifications
- Install prompt
- App-like experience

### API Access
REST API endpoints mobilalkalmazásokhoz:
```
GET /api/copilot/challenges
POST /api/copilot/teams
WebSocket: wss://your-domain.com/socket.io
```

## 🎯 **Befejezési Checklist**

### Deployment Verification
- [ ] Alkalmazás elérhető HTTPS-en
- [ ] Adatbázis kapcsolat működik
- [ ] WebSocket kapcsolat működik
- [ ] File upload/download működik
- [ ] Email notifikációk működnek
- [ ] Monitoring dashboardok elérhetők
- [ ] Backup rendszer beállítva
- [ ] SSL certificate automatikus megújítás
- [ ] Log aggregation működik
- [ ] Health check endpoints válaszolnak

### Post-Deployment
- [ ] Load testing elvégzése
- [ ] Security audit
- [ ] Performance baseline établálása
- [ ] Documentation frissítése
- [ ] Team training elvégzése

---

## 🎉 **Sikeres Deployment!**

A Global Knowledge Co-Pilot mostantól production-ready állapotban fut. A rendszer támogatja:
- **5 mikroszolgáltatás** teljes funkcionalitással
- **Real-time collaboration** WebSocket-tel
- **AI-powered team formation**
- **Scalable architecture** Docker Compose-zal
- **Comprehensive monitoring** Prometheus + Grafana
- **Enterprise security** JWT + RBAC

### Következő lépések:
1. Frontend development
2. Mobile app development  
3. Advanced AI features
4. Performance optimization
5. Advanced analytics

**Support**: Ha segítségre van szükség, ellenőrizd a logs-okat és a monitoring dashboardokat.