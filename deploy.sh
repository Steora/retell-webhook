#!/bin/bash

# VideoPlus Webhook - AWS EC2 Deployment Script

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run as root${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${GREEN}✅ Node.js already installed: $(node -v)${NC}"
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing project dependencies...${NC}"
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp env.example .env
    echo -e "${RED}❌ Please edit .env file with your credentials before continuing!${NC}"
    echo -e "${YELLOW}Run: nano .env${NC}"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
if pm2 list | grep -q "videoplus-webhook"; then
    echo -e "${YELLOW}🔄 Stopping existing server...${NC}"
    pm2 stop videoplus-webhook
    pm2 delete videoplus-webhook
fi

# Start server with PM2
echo -e "${YELLOW}🚀 Starting server with PM2...${NC}"
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (run once)
if ! systemctl is-enabled pm2-$(whoami) &> /dev/null; then
    echo -e "${YELLOW}⚙️  Setting up PM2 to start on boot...${NC}"
    pm2 startup | tail -n 1 | sudo bash
fi

# Configure firewall
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
    sudo ufw allow 8080/tcp
    sudo ufw --force enable
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}📡 Server is running on port 8080${NC}"
echo -e "${YELLOW}📊 View logs: pm2 logs videoplus-webhook${NC}"
echo -e "${YELLOW}📈 Monitor: pm2 monit${NC}"
echo -e "${YELLOW}🔄 Restart: pm2 restart videoplus-webhook${NC}"

