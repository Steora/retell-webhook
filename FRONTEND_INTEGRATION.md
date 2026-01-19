# 🌐 Frontend Integration Guide (Without Domain)

## Quick Answer

Your webhook URL will be: `http://YOUR-EC2-PUBLIC-IP:8080/retell-webhook`

---

## Step 1: Get Your EC2 Public IP

### Method 1: AWS Console
1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Copy the **Public IPv4 address** (e.g., `54.123.45.67`)

### Method 2: From EC2 Terminal
```bash
# SSH into your EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Get public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Example output: 54.123.45.67
```

---

## Step 2: Configure ElevenLabs/Retell

### Your Webhook URL
```
http://54.123.45.67:8080/retell-webhook
```
Replace `54.123.45.67` with your actual EC2 public IP.

### In ElevenLabs Dashboard
1. Go to your AI Agent settings
2. Find the tool configuration (e.g., `send_support_ticket`)
3. Set the webhook URL:
   ```
   URL: http://YOUR-EC2-IP:8080/retell-webhook
   Method: POST
   ```

### In Retell Dashboard
1. Go to your Agent configuration
2. Under "Custom Tools" or "Webhook"
3. Set the webhook URL:
   ```
   http://YOUR-EC2-IP:8080/retell-webhook
   ```

---

## Step 3: Frontend Integration Options

### Option A: Direct API Calls (Simple)

If your frontend needs to call the webhook directly:

```javascript
// Frontend code (React, Vue, etc.)
const sendSupportTicket = async (userData) => {
  try {
    const response = await fetch('http://54.123.45.67:8080/retell-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'send_support_ticket',
        args: {
          user_name: userData.name,
          user_email: userData.email,
          issue_details: userData.issue
        }
      })
    });
    
    const result = await response.json();
    console.log('Result:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Usage
await sendSupportTicket({
  name: "John Doe",
  email: "john@example.com",
  issue: "Cannot access my account"
});
```

### Option B: Environment Variables (Recommended)

Create a `.env` file in your frontend project:

```env
# .env (React)
REACT_APP_WEBHOOK_URL=http://54.123.45.67:8080/retell-webhook

# .env (Next.js)
NEXT_PUBLIC_WEBHOOK_URL=http://54.123.45.67:8080/retell-webhook

# .env (Vue)
VUE_APP_WEBHOOK_URL=http://54.123.45.67:8080/retell-webhook
```

Then use it in your code:

```javascript
// React
const WEBHOOK_URL = process.env.REACT_APP_WEBHOOK_URL;

// Next.js
const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL;

// Vue
const WEBHOOK_URL = process.env.VUE_APP_WEBHOOK_URL;

// Use it
const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'send_support_ticket', args: {...} })
});
```

### Option C: API Service Layer (Best Practice)

```javascript
// services/webhookAPI.js
const WEBHOOK_URL = process.env.REACT_APP_WEBHOOK_URL || 'http://54.123.45.67:8080/retell-webhook';

class WebhookAPI {
  static async sendSupportTicket(userName, userEmail, issueDetails) {
    return this.callWebhook('send_support_ticket', {
      user_name: userName,
      user_email: userEmail,
      issue_details: issueDetails
    });
  }

  static async submitOrder(orderData) {
    return this.callWebhook('submit_videoplus_order', orderData);
  }

  static async sendWebsiteLink(email) {
    return this.callWebhook('send_website_link', { email });
  }

  static async callWebhook(functionName, args) {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: functionName,
          args: args
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  static async healthCheck() {
    try {
      const response = await fetch(`${WEBHOOK_URL.replace('/retell-webhook', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error' };
    }
  }
}

export default WebhookAPI;
```

Usage:
```javascript
// In your React component
import WebhookAPI from './services/webhookAPI';

const handleSubmit = async () => {
  try {
    const result = await WebhookAPI.sendSupportTicket(
      "John Doe",
      "john@example.com",
      "I need help with my order"
    );
    alert(result.result); // "I've created a support ticket..."
  } catch (error) {
    alert('Failed to submit ticket');
  }
};
```

---

## Step 4: CORS Configuration

✅ **Good news**: Your server already has CORS enabled!

Your `server.js` already includes:
```javascript
app.use(cors());
```

This allows requests from **any origin**. Perfect for development and frontends without domains!

### If You Need to Restrict Origins Later

When you get a domain, you can update `server.js`:

```javascript
// Allow specific origins
app.use(cors({
  origin: [
    'http://localhost:3000',           // Local development
    'http://54.123.45.67:8080',        // EC2 IP
    'https://yourdomain.com',          // Your future domain
  ],
  credentials: true
}));
```

---

## Step 5: Testing the Connection

### Test 1: Health Check

```bash
# From your local machine
curl http://54.123.45.67:8080/health

# Expected response:
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2024-01-16T..."
}
```

### Test 2: From Browser Console

Open your browser console and run:

```javascript
fetch('http://54.123.45.67:8080/health')
  .then(r => r.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Error:', err));
```

### Test 3: Full Webhook Test

```javascript
fetch('http://54.123.45.67:8080/retell-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'send_support_ticket',
    args: {
      user_name: 'Test User',
      user_email: 'test@example.com',
      issue_details: 'Testing from frontend'
    }
  })
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

---

## Common Issues & Solutions

### Issue 1: Connection Refused

**Problem:** Cannot connect to `http://EC2-IP:8080`

**Solutions:**
1. Check AWS Security Group allows port 8080
   ```
   Type: Custom TCP
   Port: 8080
   Source: 0.0.0.0/0 (anywhere)
   ```

2. Check server is running:
   ```bash
   # On EC2
   pm2 status
   pm2 logs videoplus-webhook
   ```

3. Check firewall on EC2:
   ```bash
   sudo ufw status
   sudo ufw allow 8080/tcp
   ```

### Issue 2: CORS Error

**Problem:** "Access-Control-Allow-Origin" error in browser

**Solution:** Already handled! Your server has CORS enabled. If still seeing issues:

```javascript
// Update server.js
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

### Issue 3: Timeout

**Problem:** Request times out

**Solutions:**
1. Check server is running: `pm2 status`
2. Check EC2 instance is running in AWS Console
3. Verify correct IP address
4. Check internet connection

### Issue 4: EC2 IP Changed

**Problem:** IP changes after EC2 restart

**Solution:** Get Elastic IP (free if attached to running instance)
1. AWS Console → EC2 → Elastic IPs
2. Allocate new Elastic IP
3. Associate with your instance
4. Use this IP (it won't change!)

---

## Alternative: Use ngrok for Development

If you're still developing and don't want to deploy to EC2 yet:

```bash
# Install ngrok
npm install -g ngrok

# Run your server locally
npm start

# In another terminal, expose it
ngrok http 8080

# Use the ngrok URL (e.g., https://abc123.ngrok.io/retell-webhook)
```

**Pros:**
- ✅ Free HTTPS
- ✅ No AWS needed
- ✅ Easy for testing

**Cons:**
- ❌ URL changes each time
- ❌ Not for production
- ❌ Limited free tier

---

## Production Considerations

### When You Get a Domain

1. **Point domain to EC2 IP:**
   - Add an A record: `webhook.yourdomain.com → 54.123.45.67`

2. **Setup Nginx reverse proxy** (see DEPLOYMENT.md)

3. **Add SSL with Let's Encrypt** (see DEPLOYMENT.md)

4. **Update webhook URL:**
   ```
   https://webhook.yourdomain.com/retell-webhook
   ```

### Get Elastic IP Now (Recommended)

Even without a domain, get an Elastic IP so your IP doesn't change:

1. AWS Console → EC2 → Elastic IPs
2. **Allocate Elastic IP address**
3. **Associate** with your instance
4. Use this IP everywhere (it's permanent!)

---

## Example: Complete React Integration

```jsx
// src/services/videoplus.js
const WEBHOOK_URL = process.env.REACT_APP_WEBHOOK_URL;

export const videoPlusAPI = {
  async createSupportTicket(name, email, issue) {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'send_support_ticket',
        args: { user_name: name, user_email: email, issue_details: issue }
      })
    });
    return response.json();
  },

  async checkHealth() {
    const healthUrl = WEBHOOK_URL.replace('/retell-webhook', '/health');
    const response = await fetch(healthUrl);
    return response.json();
  }
};

// src/components/SupportForm.jsx
import React, { useState } from 'react';
import { videoPlusAPI } from '../services/videoplus';

function SupportForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', issue: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    
    try {
      const result = await videoPlusAPI.createSupportTicket(
        formData.name,
        formData.email,
        formData.issue
      );
      setStatus('Success: ' + result.result);
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <input
        type="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      <textarea
        placeholder="Describe your issue"
        value={formData.issue}
        onChange={(e) => setFormData({...formData, issue: e.target.value})}
      />
      <button type="submit">Submit Ticket</button>
      {status && <p>{status}</p>}
    </form>
  );
}

export default SupportForm;
```

---

## Summary

### Without Domain (Now)
```
Webhook URL: http://YOUR-EC2-IP:8080/retell-webhook
Example: http://54.123.45.67:8080/retell-webhook
```

### With Domain (Future)
```
Webhook URL: https://webhook.yourdomain.com/retell-webhook
```

### Quick Checklist
- [ ] Deploy to EC2
- [ ] Get Elastic IP (recommended)
- [ ] Configure Security Group (port 8080)
- [ ] Test health endpoint
- [ ] Update ElevenLabs/Retell with webhook URL
- [ ] Test from frontend
- [ ] Monitor logs: `pm2 logs`

---

## Need Help?

Check:
1. [QUICKSTART.md](QUICKSTART.md) - Deploy in 5 minutes
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed AWS guide
3. [README.md](README.md) - Full documentation

Contact: soumik@steorasystems.com

