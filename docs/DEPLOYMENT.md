# Nina.fm SSE - Deployment Guide

## Docker Deployment

### Prerequisites
- Docker and Docker Compose installed on server
- GitHub Actions secrets configured
- Network `nina-network` exists

### GitHub Secrets Required

Go to: `https://github.com/Nina-fm/nina.fm-sse/settings/secrets/actions`

Add the following **Secrets**:
- `SERVER_HOST`: IP or hostname of production server
- `SERVER_USER`: SSH user (usually `nina`)
- `SSH_PRIVATE_KEY`: SSH private key for deployment
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions

### GitHub Variables Required

Go to: `https://github.com/Nina-fm/nina.fm-sse/settings/variables/actions`

Add the following **Variables**:
- `STREAM_API_URL`: `https://prog.nina.fm/api/live-info`
- `STREAM_API_URL_FALLBACK`: `http://flow.nina.fm/status-json.xsl`

### Server Setup

1. **Stop PM2 process** (if running):
```bash
pm2 stop nina-sse
pm2 delete nina-sse
pm2 save
```

2. **Ensure nina-network exists**:
```bash
docker network create nina-network 2>/dev/null || echo "Network already exists"
```

3. **Create deployment directory**:
```bash
mkdir -p /var/nina/sse/deploy
```

### Deployment Process

Deployment is automatic on push to `main` branch:

```bash
git add .
git commit -m "feat: dockerize SSE server"
git push origin main
```

GitHub Actions will:
1. Run tests (lint + build)
2. Build Docker image
3. Push to GitHub Container Registry (ghcr.io)
4. Pull image on production server
5. Deploy with docker-compose
6. Verify healthcheck passes

### Manual Deployment

If needed, deploy manually:

```bash
# On production server
cd /var/nina/sse/deploy

# Pull latest image
docker pull ghcr.io/nina-fm/nina.fm-sse:latest

# Start/restart container
docker-compose --env-file /var/nina/sse/.env.prod up -d --wait

# Check logs
docker logs nina-sse --tail 50
```

### Verify Deployment

```bash
# Check container status
docker ps | grep nina-sse

# Check healthcheck
curl http://localhost:3001/health

# Check SSE endpoints
curl http://localhost:3001/events
curl http://localhost:3001/listeners
curl http://localhost:3001/progress
```

### Nginx Configuration

SSE should be proxied via nginx to `sse.nina.fm`:

```nginx
server {
    listen 80;
    server_name sse.nina.fm;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE specific
        proxy_set_header X-Accel-Buffering no;
        proxy_buffering off;
        chunked_transfer_encoding on;
    }
}
```

### Rollback

To rollback to a previous version:

```bash
# List available tags
docker images ghcr.io/nina-fm/nina.fm-sse

# Pull specific version
docker pull ghcr.io/nina-fm/nina.fm-sse:main-<commit-sha>

# Update docker-compose.yml to use specific tag
# Then restart
docker-compose up -d --wait
```

### Troubleshooting

**Container won't start:**
```bash
docker logs nina-sse
docker inspect nina-sse
```

**Port conflict:**
```bash
# Check what's using port 3001
sudo lsof -i :3001
# Stop PM2 if still running
pm2 stop nina-sse
```

**Healthcheck failing:**
```bash
docker exec nina-sse curl http://localhost:3001/health
```

**Network issues:**
```bash
docker network inspect nina-network
docker network connect nina-network nina-sse
```
