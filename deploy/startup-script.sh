#!/bin/bash

# GCP VM startup script for Gentle Space Realty
set -e

echo "🚀 Starting Gentle Space Realty deployment setup..."

# Update system
apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker service
systemctl enable docker
systemctl start docker

# Create app directory
mkdir -p /opt/gentle-space-realty
cd /opt/gentle-space-realty

# Set environment variables
cat << 'EOF' > .env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://nfryqqpfprupwqayirnc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTQwMTgsImV4cCI6MjA3MzM5MDAxOH0.xfJdVjK2FPzLy5MYLVr0CHfwqZ_1lTcF0Jag9Z6kV1M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgxNDAxOCwiZXhwIjoyMDczMzkwMDE4fQ.XTxgPSa-J5uMLvs7uGOl4REH3ziEZNY1vHQjAple_fQ
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=*
EOF

# Create systemd service
cat << 'EOF' > /etc/systemd/system/gentle-space-realty.service
[Unit]
Description=Gentle Space Realty Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/gentle-space-realty
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
systemctl enable gentle-space-realty.service

echo "✅ Startup script completed. Ready for application deployment."