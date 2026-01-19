# ⚡ Quick Reference Card

## 🔗 Your Webhook URLs

### Without Domain (Current)
```
http://YOUR-EC2-PUBLIC-IP:8080/retell-webhook
```

**Example:**
```
http://54.123.45.67:8080/retell-webhook
```

### With Domain (Future)
```
https://webhook.yourdomain.com/retell-webhook
```

---

## 🎯 Get Your EC2 Public IP

```bash
# Method 1: From AWS Console
AWS Console → EC2 → Instances → Your Instance → Public IPv4

# Method 2: From EC2 Terminal
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

---

## 🧪 Quick Tests

### Test 1: Health Check
```bash
curl http://YOUR-EC2-IP:8080/health
```

### Test 2: Browser Console
```javascript
fetch('http://YOUR-EC2-IP:8080/health')
  .then(r => r.json())
  .then(console.log);
```

### Test 3: Support Ticket
```javascript
fetch('http://YOUR-EC2-IP:8080/retell-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'send_support_ticket',
    args: {
      user_name: 'Test User',
      user_email: 'test@example.com',
      issue_details: 'Test issue'
    }
  })
}).then(r => r.json()).then(console.log);
```

---

## 🔧 Frontend Integration

### Simple Fetch
```javascript
const response = await fetch('http://YOUR-EC2-IP:8080/retell-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'send_support_ticket',
    args: {
      user_name: userName,
      user_email: userEmail,
      issue_details: issue
    }
  })
});
const result = await response.json();
```

### Environment Variable
```env
# .env
REACT_APP_WEBHOOK_URL=http://54.123.45.67:8080/retell-webhook
```

```javascript
const WEBHOOK_URL = process.env.REACT_APP_WEBHOOK_URL;
```

---

## 🛠️ PM2 Commands

```bash
# Start
pm2 start ecosystem.config.cjs

# Status
pm2 status

# Logs
pm2 logs videoplus-webhook

# Restart
pm2 restart videoplus-webhook

# Stop
pm2 stop videoplus-webhook
```

---

## 🔥 AWS Security Group

Required ports:

| Port | Purpose | Source |
|------|---------|--------|
| 22 | SSH | Your IP |
| 8080 | Webhook | 0.0.0.0/0 |

---

## 📊 Server Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/retell-webhook` | POST | Main webhook |

---

## 🚨 Troubleshooting

### Can't Connect?
1. ✅ Check EC2 Security Group (port 8080)
2. ✅ Check server is running: `pm2 status`
3. ✅ Check firewall: `sudo ufw status`

### CORS Error?
Already handled! Server has `app.use(cors())` enabled.

### Email Not Sending?
Check logs: `pm2 logs videoplus-webhook`

### IP Changed?
Get Elastic IP (AWS Console → EC2 → Elastic IPs)

---

## 📱 Function Names

Available webhook functions:

1. **`send_support_ticket`**
   - Args: `user_name`, `user_email`, `issue_details`

2. **`submit_videoplus_order`**
   - Args: See `schema-submit_videoplus_order.json`

3. **`send_website_link`**
   - Args: `email`

4. **`end_call`**
   - Args: None

---

## 🔐 Security

### Environment Variables
```env
ADMIN_EMAIL=soumik@steorasystems.com
GMAIL_USER=soumik@steorasystems.com
GMAIL_APP_PASSWORD=your_16_char_password
PORT=8080
NODE_ENV=production
```

### Never Commit
- ❌ `.env` file
- ❌ Gmail passwords
- ❌ API keys

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - 5-minute deployment
- [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - Frontend setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed AWS guide
- [README.md](README.md) - Full documentation

---

## 🎯 Next Steps

### Now (No Domain)
1. Deploy to EC2
2. Get Elastic IP
3. Use: `http://YOUR-EC2-IP:8080/retell-webhook`

### Later (With Domain)
1. Point domain to EC2
2. Setup Nginx
3. Add SSL (Let's Encrypt)
4. Use: `https://webhook.yourdomain.com/retell-webhook`

---

**Quick Support:** soumik@steorasystems.com

