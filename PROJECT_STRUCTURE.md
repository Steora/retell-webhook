# 📁 Project Structure

## Essential Files (Required for Deployment)

### Core Application Files
- **`server.js`** - Main webhook server (Express + Nodemailer)
- **`package.json`** - Node.js dependencies and scripts
- **`package-lock.json`** - Locked dependency versions

### Configuration Files
- **`ecosystem.config.cjs`** - PM2 process manager configuration
- **`env.example`** - Environment variables template
- **`.gitignore`** - Git ignore rules

### Schema & Prompts
- **`schema-submit_videoplus_order.json`** - JSON schema for order form
- **`agent-prompt.txt`** - AI agent instructions for Retell/ElevenLabs

### Documentation
- **`README.md`** - Complete project documentation
- **`QUICKSTART.md`** - 5-minute deployment guide
- **`DEPLOYMENT.md`** - Detailed AWS EC2 deployment guide
- **`PROJECT_STRUCTURE.md`** - This file

### Deployment Scripts
- **`deploy.sh`** - Automated deployment script for Linux

---

## File Purposes

### `server.js`
Main application file containing:
- Express server setup
- Webhook endpoint (`/retell-webhook`)
- Health check endpoints (`/`, `/health`)
- Email sending logic (Nodemailer)
- HTML email templates
- Function handlers:
  - `submit_videoplus_order` - Process transcript orders
  - `send_support_ticket` - Create support tickets
  - `send_website_link` - Send website link
  - `end_call` - End call gracefully

### `package.json`
Dependencies:
- `express` - Web server framework
- `nodemailer` - Email sending
- `cors` - Cross-origin resource sharing

Scripts:
- `npm start` - Start server
- `npm run pm2:start` - Start with PM2
- `npm run pm2:logs` - View logs

### `ecosystem.config.cjs`
PM2 configuration:
- Process name: `videoplus-webhook`
- Single instance (can scale to multiple)
- Auto-restart on crash
- Log file locations
- Memory limit: 500MB

### `env.example`
Environment variables template:
- `ADMIN_EMAIL` - Admin notification email
- `GMAIL_USER` - Gmail account for sending
- `GMAIL_APP_PASSWORD` - Gmail app password
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (production/development)

### `schema-submit_videoplus_order.json`
JSON schema for ElevenLabs/Retell defining:
- Order form fields
- Field types and validations
- Required fields
- Field descriptions

### `agent-prompt.txt`
AI agent instructions:
- Persona and tone guidelines
- Conversation flow
- Verification protocols
- Function calling instructions

### `deploy.sh`
Automated deployment script:
- System updates
- Node.js installation
- PM2 installation
- Dependency installation
- Environment setup
- Firewall configuration
- Server startup

---

## Directory Structure

```
retell-webhook/
├── server.js                           # Main server
├── package.json                        # Dependencies
├── package-lock.json                   # Locked versions
├── ecosystem.config.cjs                # PM2 config
├── env.example                         # Env template
├── .gitignore                          # Git ignore
├── agent-prompt.txt                    # AI instructions
├── schema-submit_videoplus_order.json  # Order schema
├── deploy.sh                           # Deployment script
├── README.md                           # Main docs
├── QUICKSTART.md                       # Quick guide
├── DEPLOYMENT.md                       # Detailed guide
├── PROJECT_STRUCTURE.md                # This file
├── node_modules/                       # Dependencies (auto)
└── logs/                               # Log files (auto)
    ├── error.log
    ├── output.log
    └── combined.log
```

---

## What Was Removed (Cleanup)

### Removed Files
- ❌ `EMAIL_SETUP_GUIDE.md` - Setup guide (not needed)
- ❌ `SENDGRID_SETUP.md` - SendGrid guide (not needed)
- ❌ `server-sendgrid.js` - Alternative version (not needed)
- ❌ `extra.txt` - Notes file
- ❌ `serverExtra.txt` - Old backup
- ❌ `prompt.txt` - Duplicate prompt
- ❌ `prompt2.txt` - Duplicate prompt
- ❌ `prompt3.txt` - Duplicate prompt

### Why Removed?
- Reduced clutter
- Kept only production-ready files
- Removed duplicate/backup files
- Removed documentation for unused features (SendGrid)

---

## Files NOT in Git (.gitignore)

These files are generated or contain secrets:
- `node_modules/` - Dependencies (reinstalled via npm)
- `.env` - Environment variables (SECRETS!)
- `logs/` - Log files
- `.DS_Store` - macOS files
- `*.log` - Log files

---

## Deployment Checklist

Before deploying, ensure you have:

- ✅ `server.js` - Main application
- ✅ `package.json` - Dependencies list
- ✅ `ecosystem.config.cjs` - PM2 config
- ✅ `env.example` - Env template
- ✅ `.env` - Actual environment (create from template)
- ✅ `deploy.sh` - Deployment script
- ✅ Gmail App Password ready
- ✅ AWS EC2 instance ready
- ✅ Security groups configured (ports 22, 8080)

---

## Quick Commands

```bash
# Local development
npm install
npm start

# Production deployment
./deploy.sh

# PM2 management
pm2 start ecosystem.config.cjs
pm2 logs videoplus-webhook
pm2 restart videoplus-webhook
pm2 stop videoplus-webhook

# View logs
tail -f logs/combined.log
```

---

## Support

Questions? Check:
1. [QUICKSTART.md](QUICKSTART.md) - Fast setup
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed guide
3. [README.md](README.md) - Full documentation

Contact: soumik@steorasystems.com

