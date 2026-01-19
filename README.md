# VideoPlus Webhook Server

Webhook server for handling Retell/ElevenLabs AI voice agent function calls for VideoPlus Court Transcription Service.

## Features

- 📧 Email notifications for orders and support tickets
- 🔄 Handles multiple function types (orders, support, website links)
- ⚖️ Ontario Superior Court transcript order processing
- 🎯 Compatible with Retell and ElevenLabs webhooks

## Prerequisites

- Node.js 18+ 
- Gmail account with App Password enabled
- AWS EC2 instance (or any Linux server)

## 📚 Documentation

| Guide | Purpose | Time |
|-------|---------|------|
| [QUICKSTART.md](QUICKSTART.md) | Deploy to AWS EC2 | 5 min |
| [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) | Connect frontend (no domain needed) | 10 min |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick commands & URLs | 2 min |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Detailed AWS guide | 20 min |

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd retell-webhook

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## Configuration

### 1. Gmail App Password Setup

1. Go to https://myaccount.google.com/apppasswords
2. Create a new App Password for "Mail"
3. Copy the 16-character password
4. Add it to your `.env` file

### 2. Environment Variables

Edit `.env` file:

```env
ADMIN_EMAIL=your-admin@email.com
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password
PORT=8080
NODE_ENV=production
```

## Running the Server

### Development Mode

```bash
npm start
```

### Production Mode (with PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start server.js --name videoplus-webhook

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## API Endpoints

### POST /retell-webhook

Handles webhook calls from Retell/ElevenLabs AI agents.

**Supported Functions:**

1. **submit_videoplus_order** - Process transcript orders
2. **send_support_ticket** - Create support tickets
3. **send_website_link** - Send website link to user
4. **end_call** - End the call gracefully

**Request Format (Retell):**
```json
{
  "name": "send_support_ticket",
  "args": {
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "issue_details": "Description of issue"
  }
}
```

**Response:**
```json
{
  "result": "Success message to be spoken by AI agent"
}
```

## File Structure

```
retell-webhook/
├── server.js                           # Main server file
├── agent-prompt.txt                    # AI agent prompt/instructions
├── schema-submit_videoplus_order.json  # Order form schema
├── package.json                        # Dependencies
├── .env                                # Environment variables (not in git)
├── .env.example                        # Environment template
└── README.md                           # This file
```

## AWS EC2 Deployment

### 1. Setup EC2 Instance

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### 2. Clone and Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd retell-webhook

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit with your credentials
```

### 3. Configure Firewall

```bash
# Allow port 8080
sudo ufw allow 8080/tcp
sudo ufw enable
```

### 4. Start Server

```bash
# Start with PM2
pm2 start server.js --name videoplus-webhook

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the command it outputs
```

### 5. Setup Nginx (Optional - Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/videoplus
```

Add this configuration:

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/videoplus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL (Optional - Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Monitoring

```bash
# View logs
pm2 logs videoplus-webhook

# Monitor status
pm2 status

# Restart server
pm2 restart videoplus-webhook

# Stop server
pm2 stop videoplus-webhook
```

## Troubleshooting

### Email Not Sending

1. Check Gmail App Password is correct
2. Verify 2FA is enabled on Gmail account
3. Check server logs: `pm2 logs`
4. Test SMTP connection manually

### Connection Timeout

- If on cloud hosting, SMTP ports may be blocked
- Consider using SendGrid or AWS SES instead
- Check firewall settings

### Port Already in Use

```bash
# Find process using port 8080
sudo lsof -i :8080

# Kill the process
sudo kill -9 <PID>
```

## Support

For issues or questions, contact: soumik@steorasystems.com

## License

Private - VideoPlus Court Transcription Service

