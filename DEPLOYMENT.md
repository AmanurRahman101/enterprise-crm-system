# 🚀 DEPLOYMENT CHECKLIST

## Pre-Deployment Checklist

### Security
- [ ] Change JWT_SECRET in production (use a strong random string)
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL in production
- [ ] Set NODE_ENV=production
- [ ] Remove .env from git (already in .gitignore)
- [ ] Use environment-specific configurations

### Database
- [ ] Backup database before deployment
- [ ] Test all database connections
- [ ] Optimize database indexes
- [ ] Set up automated backups
- [ ] Use database connection pooling (already configured)

### Backend
- [ ] Test all API endpoints
- [ ] Add rate limiting (optional)
- [ ] Set up logging (Winston/Morgan)
- [ ] Configure CORS for production domain
- [ ] Test error handling
- [ ] Add API versioning (optional)

### Frontend
- [ ] Test all pages and forms
- [ ] Build production bundle (`npm run build`)
- [ ] Test production build locally
- [ ] Optimize images and assets
- [ ] Configure environment variables for production API URL
- [ ] Test responsive design on mobile

### Testing
- [ ] Test complete authentication flow
- [ ] Test both Company and Customer flows
- [ ] Test protected routes
- [ ] Test logout functionality
- [ ] Test form validations
- [ ] Test error scenarios

---

## Deployment Options

### Option 1: VPS (DigitalOcean, Linode, AWS EC2)

**Backend:**
```bash
# Install Node.js and MySQL on server
# Upload backend files
# Install dependencies
npm install --production

# Set environment variables
export NODE_ENV=production
export DB_PASSWORD=your_secure_password

# Use PM2 for process management
npm install -g pm2
pm2 start index.js --name tawasol-api
pm2 save
pm2 startup
```

**Frontend:**
```bash
# Build frontend
npm run build

# Serve with Nginx or Apache
# Or deploy to CDN (Cloudflare, AWS S3 + CloudFront)
```

**MySQL:**
- Use managed MySQL (AWS RDS, DigitalOcean Managed Database)
- Or install MySQL on server
- Configure firewall rules

---

### Option 2: Platform as a Service

**Backend (Heroku, Render, Railway):**
- Connect GitHub repository
- Set environment variables in platform
- Deploy from main branch
- Platform handles SSL automatically

**Frontend (Vercel, Netlify):**
- Connect GitHub repository
- Set build command: `npm run build`
- Set publish directory: `dist`
- Auto-deploy on git push

**Database:**
- Use platform's managed database
- Or use external MySQL service (PlanetScale, AWS RDS)

---

### Option 3: Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./Backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=yourpassword
      - DB_NAME=tawasol_crm
    depends_on:
      - mysql

  frontend:
    build: ./Frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=yourpassword
      - MYSQL_DATABASE=tawasol_crm
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

---

## Environment Variables

### Production .env (Backend)
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host.com
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=tawasol_crm
DB_PORT=3306

# JWT
JWT_SECRET=very-long-random-secret-string-change-this-123456789
JWT_EXPIRATION=7d

# Optional
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend Environment (Production)
Create `Frontend/.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com
```

Update frontend fetch calls:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
fetch(`${API_URL}/rpc/signupCompany`, ...)
```

---

## Nginx Configuration (If using VPS)

```nginx
# Backend (API)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/tawasol/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Backend Logging (Winston)
```bash
npm install winston
```

```javascript
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Process Management (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start index.js --name tawasol-api

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart
pm2 restart tawasol-api

# Auto-start on reboot
pm2 startup
pm2 save
```

---

## Database Backup

### Manual Backup
```bash
mysqldump -u root -p tawasol_crm > backup_$(date +%Y%m%d).sql
```

### Automated Backup (Cron)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mysqldump -u root -p'password' tawasol_crm > /backups/tawasol_$(date +\%Y\%m\%d).sql
```

---

## Performance Optimization

### Backend
- [ ] Enable gzip compression
- [ ] Add caching headers
- [ ] Use Redis for sessions (optional)
- [ ] Optimize database queries
- [ ] Add request rate limiting

### Frontend
- [ ] Minimize bundle size
- [ ] Enable lazy loading
- [ ] Optimize images (WebP)
- [ ] Use CDN for static assets
- [ ] Enable service workers (PWA)

---

## Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

---

## Post-Deployment

- [ ] Test all features in production
- [ ] Monitor error logs
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up error tracking (Sentry)
- [ ] Monitor database performance
- [ ] Check SSL certificate expiration
- [ ] Document deployment process
- [ ] Create rollback plan

---

## Recommended Services

**Hosting:**
- Backend: Railway, Render, Heroku, DigitalOcean
- Frontend: Vercel, Netlify, Cloudflare Pages
- Database: PlanetScale, AWS RDS, DigitalOcean Managed DB

**Monitoring:**
- Uptime: UptimeRobot, Pingdom
- Errors: Sentry, LogRocket
- Analytics: Google Analytics, Plausible

**Email (Future):**
- SendGrid, Mailgun, Amazon SES

---

## Cost Estimate (Monthly)

**Option 1: Budget (Free Tier)**
- Frontend: Vercel/Netlify (Free)
- Backend: Render/Railway (Free tier)
- Database: PlanetScale (Free tier)
**Total: $0/month** (with limitations)

**Option 2: Production Ready**
- VPS: DigitalOcean Droplet ($6/month)
- Managed Database: ($15/month)
- CDN: Cloudflare (Free)
**Total: ~$21/month**

**Option 3: Enterprise**
- AWS EC2 + RDS + CloudFront ($50-200/month)

---

## Support & Maintenance

- Set up automated backups
- Monitor server resources
- Keep dependencies updated
- Review security patches
- Scale as needed

---

**You're ready to deploy! 🚀**
