# Deployment Guide - Observability Monitoring Platform

## Overview

This guide covers building, testing, and deploying the Observability Monitoring Platform to production environments. The platform is a 100% client-side Vue 3 application with no backend dependencies, making deployment straightforward.

## Prerequisites

- Node.js ≥ 18.0.0 (LTS recommended)
- npm ≥ 9.0.0
- Git for version control
- Web server (nginx, Apache, or cloud CDN) for serving static files
- Modern browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)

## Build Process

### Development Build

```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev

# Server runs on http://localhost:5173/
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Output: dist/ directory with:
# - index.html (entry point)
# - assets/[chunk-name].js (code chunks)
# - assets/[chunk-name].css (compiled styles)

# Verify build output
ls -lh dist/
# Expected: index.html (~2KB), assets/ directory with .js and .css files
```

### Build Output Structure

```
dist/
├── index.html                    # Entry point (~2KB)
├── assets/
│   ├── vue-core-[hash].js       # Vue 3 + Router + Pinia (~150KB)
│   ├── ui-libs-[hash].js        # Element Plus + Iconify (~200KB)
│   ├── chart-libs-[hash].js     # ECharts + G6 (~300KB)
│   ├── main-[hash].js           # Application code (~100KB)
│   ├── main-[hash].css          # Compiled SCSS (~50KB)
│   └── [other-chunks].js        # Code-split components
```

**Total Bundle Size**: < 2MB gzipped (typical: 1.2-1.5MB)

### Build Configuration

The build is configured in `vite.config.ts` with:

- **Code Splitting**: Separates vendor code (vue-core, ui-libs, chart-libs) from application code
- **Minification**: Terser minifier with console statement removal
- **Source Maps**: Disabled in production (reduces bundle size)
- **Asset Optimization**: Images and fonts inlined or optimized
- **CSS Purging**: Unused styles removed via PurgeCSS

## Testing Before Deployment

### Unit Tests

```bash
# Run unit test suite
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Expected: >70% code coverage
```

### Type Checking

```bash
# Verify TypeScript compilation
npm run type-check

# Should complete with no errors (strict mode enabled)
```

### Linting

```bash
# Check code quality
npm run lint

# Auto-fix fixable issues
npm run lint --fix

# Expected: 0 errors, 0 warnings
```

### Code Formatting

```bash
# Check formatting compliance
npx prettier --check .

# Auto-format all files
npm run format

# Expected: All files formatted per .prettierrc.json
```

### Local Production Preview

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Server runs on http://localhost:4173/
# Test all features before deployment
```

## Performance Validation

### Lighthouse Audit

```bash
# Run Chrome DevTools Lighthouse audit on local preview
# Target scores:
# - Performance: ≥ 90
# - Accessibility: ≥ 95
# - Best Practices: ≥ 90
# - SEO: ≥ 90
```

### Performance Metrics

Verify these metrics before deployment:

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 2000ms | Chrome DevTools |
| Time to Interactive (TTI) | < 2000ms | Chrome DevTools |
| Largest Contentful Paint (LCP) | < 2500ms | Chrome DevTools |
| Cumulative Layout Shift (CLS) | < 0.1 | Chrome DevTools |
| Page Transition | < 300ms | Manual testing |
| Chart Render | < 500ms | Manual testing |
| Virtual Scroll (10k items) | 60 FPS | Chrome DevTools |
| Memory Usage | < 150MB | Chrome DevTools |

### Bundle Analysis

```bash
# Analyze bundle composition
npm run build -- --analyze

# Review chunk sizes:
# - vue-core: ~150KB
# - ui-libs: ~200KB
# - chart-libs: ~300KB
# - main: ~100KB
# - Total: < 2MB gzipped
```

## Deployment Strategies

### Static File Hosting (Recommended)

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name monitoring.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name monitoring.example.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/monitoring.crt;
    ssl_certificate_key /etc/ssl/private/monitoring.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    gzip_min_length 1000;
    gzip_comp_level 6;

    # Cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing: serve index.html for all non-file routes
    location / {
        root /var/www/monitoring/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API proxy (if backend added in future)
    location /api/ {
        proxy_pass http://backend-server:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName monitoring.example.com
    DocumentRoot /var/www/monitoring/dist

    # SSL configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/monitoring.crt
    SSLCertificateKeyFile /etc/ssl/private/monitoring.key

    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"

    # Gzip compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain text/css text/javascript application/javascript application/json
    </IfModule>

    # Cache control
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    # SPA routing
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>

    # API proxy (if backend added)
    ProxyPass /api/ http://backend-server:3000/
    ProxyPassReverse /api/ http://backend-server:3000/
</VirtualHost>
```

### Cloud Deployment

#### AWS S3 + CloudFront

```bash
# Build production bundle
npm run build

# Upload to S3
aws s3 sync dist/ s3://monitoring-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD \
  --paths "/*"
```

#### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure vercel.json for SPA routing
cat > vercel.json << EOF
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
EOF
```

#### Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Configure netlify.toml for SPA routing
cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
```

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build Docker image
docker build -t monitoring-platform:latest .

# Run container
docker run -p 80:80 monitoring-platform:latest

# Push to registry
docker tag monitoring-platform:latest registry.example.com/monitoring-platform:latest
docker push registry.example.com/monitoring-platform:latest
```

### Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: monitoring-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: monitoring-platform
  template:
    metadata:
      labels:
        app: monitoring-platform
    spec:
      containers:
      - name: monitoring-platform
        image: registry.example.com/monitoring-platform:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: monitoring-platform-service
spec:
  selector:
    app: monitoring-platform
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: monitoring-platform-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: monitoring-platform
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

```bash
# Deploy to Kubernetes
kubectl apply -f deployment.yaml

# Verify deployment
kubectl get pods
kubectl get svc monitoring-platform-service
```

## Environment Configuration

### Environment Variables

Create `.env.production` for production settings:

```env
# Application
VITE_APP_TITLE=Observability Monitoring Platform
VITE_APP_VERSION=1.0.0

# API Configuration (if backend added)
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=5000

# Feature Flags
VITE_MOCK_DATA_ENABLED=false
VITE_ENABLE_EXPORT=true
VITE_ENABLE_SHARING=true

# Logging
VITE_LOG_LEVEL=warn

# Theme
VITE_THEME=dark
VITE_ENABLE_THEME_TOGGLE=true

# Analytics (optional)
VITE_ANALYTICS_ENABLED=false
VITE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

### Build with Environment

```bash
# Build with production environment
npm run build -- --mode production

# Build with staging environment
npm run build -- --mode staging

# Create .env.staging file with staging-specific settings
```

## Security Considerations

### Content Security Policy (CSP)

```html
<!-- In public/index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
">
```

### CORS Configuration

If backend API is added:

```javascript
// Backend CORS configuration
const corsOptions = {
  origin: ['https://monitoring.example.com', 'https://staging-monitoring.example.com'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### HTTPS/TLS

- **Minimum TLS Version**: 1.2 (preferably 1.3)
- **Certificate**: Valid SSL/TLS certificate from trusted CA
- **HSTS**: Enable HTTP Strict-Transport-Security header
- **Certificate Pinning**: Consider for high-security environments

### Authentication (Future Enhancement)

When adding authentication:

```javascript
// Example: OAuth 2.0 with PKCE flow
const authConfig = {
  authority: 'https://auth.example.com',
  client_id: 'monitoring-platform-client',
  redirect_uri: 'https://monitoring.example.com/callback',
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: 'https://monitoring.example.com'
};
```

## Monitoring & Logging

### Application Monitoring

```javascript
// Example: Sentry error tracking (optional)
import * as Sentry from "@sentry/vue";

Sentry.init({
  dsn: "https://[key]@sentry.io/[project]",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    return event;
  }
});
```

### Performance Monitoring

```javascript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Browser Console Logging

Production build removes `console.log()` statements but preserves:
- `console.warn()` - Important warnings
- `console.error()` - Critical errors

## Rollback Procedures

### Nginx Rollback

```bash
# Keep previous version in /var/www/monitoring/dist-previous
# Symlink current version
ln -sfn /var/www/monitoring/dist-v1.0.0 /var/www/monitoring/dist

# Rollback to previous
ln -sfn /var/www/monitoring/dist-previous /var/www/monitoring/dist

# Reload nginx
sudo systemctl reload nginx
```

### S3 + CloudFront Rollback

```bash
# Restore previous version from S3 versioning
aws s3api list-object-versions --bucket monitoring-bucket

# Restore specific version
aws s3api get-object \
  --bucket monitoring-bucket \
  --key index.html \
  --version-id [VERSION_ID] \
  index.html

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234ABCD \
  --paths "/*"
```

### Docker Rollback

```bash
# Rollback to previous image
docker run -p 80:80 monitoring-platform:v1.0.0

# Or use Kubernetes rollout
kubectl rollout undo deployment/monitoring-platform
```

## Maintenance & Updates

### Regular Maintenance Tasks

- **Weekly**: Monitor error logs, check performance metrics
- **Monthly**: Review security updates, update dependencies
- **Quarterly**: Full security audit, performance optimization review
- **Annually**: Major version upgrades, architecture review

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update minor/patch versions
npm update

# Update major versions (requires testing)
npm install [package]@latest

# Audit for security vulnerabilities
npm audit
npm audit fix
```

### Version Management

```bash
# Tag releases in Git
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Semantic versioning:
# MAJOR.MINOR.PATCH
# - MAJOR: Breaking changes
# - MINOR: New features (backward compatible)
# - PATCH: Bug fixes
```

## Troubleshooting

### Common Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank page | SPA routing not configured | Configure web server to serve index.html for all routes |
| 404 on refresh | Missing SPA routing | Add rewrite rules to serve index.html |
| Slow load time | Large bundle | Check bundle size, enable gzip compression |
| CORS errors | Missing CORS headers | Configure CORS in backend or proxy |
| Stale content | Aggressive caching | Invalidate CDN cache, use cache busting |
| High memory | Memory leak | Check browser DevTools, review component lifecycle |

### Debug Mode

```bash
# Build with source maps for debugging
npm run build -- --sourcemap

# Enable verbose logging
VITE_LOG_LEVEL=debug npm run build
```

## Checklist Before Production

- [ ] All tests passing (`npm run test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted correctly (`npm run format`)
- [ ] Bundle size < 2MB gzipped
- [ ] Lighthouse scores ≥ 90
- [ ] Performance metrics met (FCP < 2s, TTI < 2s)
- [ ] Security headers configured
- [ ] HTTPS/TLS enabled
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Monitoring/logging configured
- [ ] Rollback procedure documented
- [ ] Backup of previous version created
- [ ] Team notified of deployment
- [ ] Post-deployment testing completed

## Support & Documentation

- **Architecture**: See `docs/ARCHITECTURE.md`
- **Components**: See `docs/COMPONENT_GUIDE.md`
- **Mock Data**: See `docs/MOCK_DATA.md`
- **Styling**: See `docs/STYLING_GUIDE.md`
- **README**: See `README.md` for setup and features

## Contact & Support

For deployment issues or questions:
- Review logs: Check web server and browser console logs
- Check status: Verify application health endpoint
- Rollback: Use rollback procedures above
- Escalate: Contact DevOps team for infrastructure issues
