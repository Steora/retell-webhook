# AWS EC2 Deployment Guide

Quick guide to deploy VideoPlus Webhook Server on AWS EC2.

## Prerequisites

- AWS Account
- EC2 instance (Ubuntu 20.04+ or Amazon Linux 2)
- SSH access to your EC2 instance
- Domain name (optional, for SSL)

## Quick Deployment (5 minutes)

### 1. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Clone Repository

```bash
git clone <your-repo-url>
cd retell-webhook
```

### 3. Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Configure Environment

```bash
nano .env
```

Add your credentials:
```env
ADMIN_EMAIL=soumik@steorasystems.com
GMAIL_USER=soumik@steorasystems.com
GMAIL_APP_PASSWORD=your_16_char_password
PORT=8080
NODE_ENV=production
```

### 5. Start Server

```bash
npm run pm2:start
```

### 6. Test

```bash
curl http://localhost:8080/health
```

You should see:
```json
{
  "status": "ok",
  "uptime": 1.234,
  "timestamp": "2024-01-16T..."
}
```

## Security Group Configuration

In AWS Console, configure your EC2 Security Group:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | Webhook server |
| HTTP | TCP | 80 | 0.0.0.0/0 | (If using Nginx) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | (If using SSL) |

## PM2 Commands

```bash
# Start server
npm run pm2:start

# Stop server
npm run pm2:stop

# Restart server
npm run pm2:restart

# View logs
npm run pm2:logs

# Monitor
pm2 monit

# Status
pm2 status
```

## Optional: Setup Nginx Reverse Proxy

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/videoplus
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/videoplus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Optional: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already setup by certbot)
sudo certbot renew --dry-run
```

## Monitoring & Logs

### View Server Logs

```bash
pm2 logs videoplus-webhook
```

### View Specific Log Files

```bash
# Error logs
tail -f logs/error.log

# Output logs
tail -f logs/output.log

# Combined logs
tail -f logs/combined.log
```

### Monitor Resources

```bash
pm2 monit
```

## Troubleshooting

### Port Already in Use

```bash
# Find process
sudo lsof -i :8080

# Kill process
sudo kill -9 <PID>
```

### Server Not Starting

```bash
# Check logs
pm2 logs videoplus-webhook

# Check environment
cat .env

# Restart
pm2 restart videoplus-webhook
```

### Email Not Sending

1. Check Gmail App Password
2. Verify .env configuration
3. Check server logs
4. Test SMTP connection:

```bash
curl -X POST http://localhost:8080/retell-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send_support_ticket",
    "args": {
      "user_name": "Test User",
      "user_email": "test@example.com",
      "issue_details": "Test issue"
    }
  }'
```

### Firewall Issues

```bash
# Check UFW status
sudo ufw status

# Allow port
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable
```

## Updating the Server

```bash
# Pull latest changes
git pull

# Install dependencies
npm install

# Restart server
pm2 restart videoplus-webhook
```

## Backup & Restore

### Backup

```bash
# Backup .env file
cp .env .env.backup

# Backup PM2 configuration
pm2 save
```

### Restore

```bash
# Restore .env
cp .env.backup .env

# Restore PM2
pm2 resurrect
```

## Performance Optimization

### Increase PM2 Instances (if needed)

Edit `ecosystem.config.cjs`:
```javascript
instances: 2, // or 'max' for all CPU cores
exec_mode: 'cluster',
```

Then restart:
```bash
pm2 restart videoplus-webhook
```

## Support

For issues, check:
1. Server logs: `pm2 logs`
2. System logs: `sudo journalctl -u pm2-ubuntu`
3. Nginx logs: `sudo tail -f /var/log/nginx/error.log`

Contact: soumik@steorasystems.com

