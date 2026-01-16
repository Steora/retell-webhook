# 🚀 Quick Start Guide

Get your VideoPlus Webhook Server running on AWS EC2 in 5 minutes!

## Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2
2. Click **Launch Instance**
3. Choose **Ubuntu Server 22.04 LTS**
4. Instance type: **t2.micro** (free tier) or **t2.small**
5. Create/select key pair for SSH
6. Security Group: Allow ports **22 (SSH)** and **8080 (Custom TCP)**
7. Launch instance

## Step 2: Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 3: Deploy

```bash
# Clone repository
git clone <your-repo-url>
cd retell-webhook

# Run automated deployment
chmod +x deploy.sh
./deploy.sh
```

## Step 4: Configure

```bash
# Edit environment file
nano .env
```

Add your credentials:
```env
ADMIN_EMAIL=soumik@steorasystems.com
GMAIL_USER=soumik@steorasystems.com
GMAIL_APP_PASSWORD=your_16_char_app_password
PORT=8080
NODE_ENV=production
```

Save: `Ctrl+X`, then `Y`, then `Enter`

## Step 5: Start Server

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## Step 6: Test

```bash
# Test health endpoint
curl http://localhost:8080/health

# Get your public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

Your webhook URL is: `http://YOUR-EC2-IP:8080/retell-webhook`

## Step 7: Configure Webhook in ElevenLabs/Retell

Use your webhook URL:
```
http://YOUR-EC2-IP:8080/retell-webhook
```

## Done! 🎉

Your server is now running!

### Useful Commands

```bash
# View logs
pm2 logs videoplus-webhook

# Restart server
pm2 restart videoplus-webhook

# Stop server
pm2 stop videoplus-webhook

# Server status
pm2 status
```

### Webhook Endpoint

**URL:** `http://YOUR-EC2-IP:8080/retell-webhook`  
**Method:** POST  
**Content-Type:** application/json

### Test with curl

```bash
curl -X POST http://YOUR-EC2-IP:8080/retell-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send_support_ticket",
    "args": {
      "user_name": "Test User",
      "user_email": "test@example.com",
      "issue_details": "Test support ticket"
    }
  }'
```

### Next Steps (Optional)

1. **Setup Domain:** Point your domain to EC2 IP
2. **Setup SSL:** Use Let's Encrypt (see DEPLOYMENT.md)
3. **Setup Nginx:** Reverse proxy (see DEPLOYMENT.md)

### Need Help?

- 📖 Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- 📚 Documentation: [README.md](README.md)
- 📧 Support: soumik@steorasystems.com

---

**Important:** Make sure to keep your `.env` file secure and never commit it to Git!

