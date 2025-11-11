# Instructions GitHub Copilot - Nina.fm SSE Server

## Architecture Générale

**Type de projet :** Serveur Node.js Express - Server-Sent Events (SSE) pour streaming de métadonnées  
**Stack technique :** Node.js 18, Express, TypeScript, node-html-parser, Docker

## Vue d'ensemble

Service de streaming temps réel qui agrège et redistribue les métadonnées de la webradio Nina.fm via SSE.
Interroge IceCast et AirTime pour fournir 3 flux distincts : events, progress, listeners.

## Structure du Projet

```
src/
├── index.ts          # Point d'entrée Express + routes SSE
├── types.ts          # Définitions TypeScript (IcecastMetadata, AirtimeMetadata, etc.)
├── fetchIcecast.ts   # Récupération métadonnées IceCast
├── fetchAirtime.ts   # Récupération métadonnées AirTime
└── utils.ts          # Utilitaires (parseAirtimeDate, etc.)
```

## Flux SSE disponibles

### 1. `/events` - Métadonnées complètes
Combine IceCast + AirTime, émis toutes les 30 secondes
```typescript
{
  iceCastMetadata: {
    server_name: string
    stream_start: string
    listeners: number
    // ...
  },
  airtimeMetadata: {
    currentShow: { name, starts, ends }
    nextShow: { name, starts, ends }
    current: { name, starts, ends }
    next: { name, starts, ends }
  }
}
```

### 2. `/progress` - Progression lecture
Émis toutes les secondes
```typescript
{
  elapsed: number  // secondes écoulées
  total: number    // durée totale
}
```

### 3. `/listeners` - Nombre d'auditeurs
Émis toutes les 2 secondes
```typescript
{
  listeners: number
}
```

## Configuration & Environnement

Variables d'environnement requises :
```env
PORT=3001                                          # Port serveur (défaut: 3001)
ICECAST_URL=http://flux.nina.fm/status-json.xsl  # URL status IceCast
AIRTIME_URL=https://libretime.nina.fm/api/live-info  # URL API AirTime
```

## Déploiement Docker

### Dockerfile
- Base image: `node:18-alpine`
- Multi-stage build (dependencies → build → production)
- Healthcheck: `curl -f http://localhost:3001/events || exit 1`
- User non-root: `nodejs:nodejs`
- Port exposé: 3001

### docker-compose.prod.yml
```yaml
services:
  nina-sse:
    image: ghcr.io/nina-fm/nina.fm-sse:latest
    container_name: nina-sse
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    env_file: ../.env.prod
    networks:
      - nina-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:3001/events"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Variables dans .env.prod
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
ICECAST_URL=http://flux.nina.fm/status-json.xsl
AIRTIME_URL=https://libretime.nina.fm/api/live-info
```

## CI/CD - GitHub Actions

### Workflow `.github/workflows/deploy.yml`

**Jobs:**
1. **test** - Lint + Build de validation
2. **build** - Build image Docker + push vers GHCR
3. **deploy** - Pull image + démarrage conteneur
4. **cleanup** - Nettoyage anciennes images

**Variables GitHub requises:**
- `ICECAST_URL`
- `AIRTIME_URL`

**Secrets GitHub requis:**
- `SERVER_HOST` - IP/domaine serveur
- `SERVER_USER` - User SSH
- `SSH_PRIVATE_KEY` - Clé SSH pour déploiement

**Déclenchement:**
- Push sur `main`
- Workflow manual avec option `no-cache`

**Durée moyenne:** ~4-5 minutes

## Gestion des Connexions SSE

### Headers SSE requis
```typescript
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')
res.setHeader('Access-Control-Allow-Origin', '*')
```

### Format des messages
```typescript
res.write(`data: ${JSON.stringify(data)}\n\n`)
```

### Cleanup connexions
```typescript
req.on('close', () => {
  clearInterval(intervalId)
  res.end()
})
```

## Types TypeScript

### IcecastMetadata
```typescript
interface IcecastMetadata {
  server_name: string
  stream_start: string
  listener_peak: number
  listeners: number
  listenurl: string
  server_description: string
  server_type: string
  dummy: string | null
}
```

### AirtimeMetadata
```typescript
interface AirtimeMetadata {
  currentShow: AirtimeShow[]
  nextShow: AirtimeShow[]
  current: AirtimeTrack | null
  next: AirtimeTrack | null
}

interface AirtimeShow {
  name: string
  starts: string
  ends: string
  // ...
}

interface AirtimeTrack {
  name: string
  starts: string
  ends: string
  // ...
}
```

## Parsing & Utilitaires

### parseAirtimeDate(dateString: string): Date
Convertit format AirTime (`YYYY-MM-DD HH:mm:ss`) en objet Date

### Gestion erreurs fetch
- Retry automatique sur échec IceCast/AirTime
- Fallback sur dernières données connues
- Log erreurs mais maintien du service

## Scripts npm

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

## Nginx Configuration

### /etc/nginx/sites-available/sse.nina.fm.conf
```nginx
server {
  server_name sse.nina.fm;
  
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $host;
  }
  
  location ~ ^/(events|progress|listeners)/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
  }
  
  listen 443 ssl;
  ssl_certificate /etc/letsencrypt/live/sse.nina.fm/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sse.nina.fm/privkey.pem;
}
```

**Important:** S'assurer que le lien symbolique existe dans `/etc/nginx/sites-enabled/`

## Monitoring & Debug

### Vérifier status conteneur
```bash
ninsh "docker ps --filter name=nina-sse"
```

### Logs en temps réel
```bash
ninsh "docker logs -f nina-sse"
```

### Tester endpoints localement
```bash
ninsh "curl http://localhost:3001/events"
ninsh "curl http://localhost:3001/progress"
ninsh "curl http://localhost:3001/listeners"
```

### Healthcheck manuel
```bash
ninsh "docker exec nina-sse curl -f http://localhost:3001/events"
```

## Conventions de Code

1. **TypeScript strict** : Toujours typer les fonctions et variables
2. **Error handling** : Toujours wrapper les fetch dans try/catch
3. **SSE cleanup** : Toujours écouter `req.on('close')` pour nettoyer les intervalles
4. **Logs** : Utiliser `console.log` avec timestamps pour debugging
5. **Intervalles** : Stocker les IDs pour cleanup proper

## Problèmes Connus & Solutions

### SSE ne répond pas (404)
**Cause:** Config nginx non activée  
**Solution:** 
```bash
sudo ln -s /etc/nginx/sites-available/sse.nina.fm.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Connexions qui se ferment prématurément
**Cause:** Timeout nginx ou proxy  
**Solution:** Ajouter `proxy_read_timeout 3600s;` dans nginx config

### Données IceCast/AirTime vides
**Cause:** URLs incorrectes ou service down  
**Solution:** Vérifier variables d'env, tester URLs manuellement

## Intégration avec Website

Le site web consomme ces flux via :
```typescript
// stores/metadata.ts
const eventSource = new EventSource(`${sseUrl}/events`)
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Process metadata
}
```

## Performance

- **Mémoire:** ~50-70 MB par conteneur
- **CPU:** Minimal (< 1%)
- **Connexions simultanées:** Supporte 1000+ clients SSE
- **Latence:** < 100ms pour chaque émission

## Règles de Développement

1. Ne jamais bloquer l'event loop avec des opérations synchrones longues
2. Toujours cleanup les EventSource listeners côté client
3. Tester les changements avec plusieurs clients connectés simultanément
4. Vérifier que les intervalles sont bien cleared à la déconnexion
5. Logger les connexions/déconnexions pour monitoring
