#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Event Calendar — One-time Linux server setup
# Tested on Ubuntu 22.04 / 24.04 LTS
#
# Run as root:
#   curl -fsSL https://raw.githubusercontent.com/.../setup-server.sh | bash
#   -- OR --
#   bash deploy/setup-server.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

if [ "$(id -u)" != "0" ]; then
    echo "Error: please run as root (sudo bash setup-server.sh)"
    exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo " Event Calendar — Server Setup"
echo "════════════════════════════════════════"
echo ""

# ── System update ─────────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release

# ── Docker ────────────────────────────────────────────────────────────────────
echo "→ Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io
systemctl enable --now docker

# ── Nginx ─────────────────────────────────────────────────────────────────────
echo "→ Installing Nginx..."
apt-get install -y nginx
systemctl enable --now nginx

# ── Certbot ───────────────────────────────────────────────────────────────────
echo "→ Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# ── Java (required by Jenkins) ────────────────────────────────────────────────
echo "→ Installing Java 17..."
apt-get install -y openjdk-17-jre

# ── Jenkins ───────────────────────────────────────────────────────────────────
echo "→ Installing Jenkins..."
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key \
    | tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
     https://pkg.jenkins.io/debian-stable binary/" \
    | tee /etc/apt/sources.list.d/jenkins.list > /dev/null
apt-get update -y
apt-get install -y jenkins
systemctl enable --now jenkins

# ── Grant Jenkins access to Docker ───────────────────────────────────────────
echo "→ Adding jenkins to docker group..."
usermod -aG docker jenkins
# NOTE: Jenkins must be restarted for the group change to take effect
systemctl restart jenkins

# ── Certbot webroot dir ───────────────────────────────────────────────────────
mkdir -p /var/www/certbot

# ── Done ─────────────────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
JENKINS_PASS=$(cat /var/lib/jenkins/secrets/initialAdminPassword 2>/dev/null || echo "(not yet generated)")

echo ""
echo "════════════════════════════════════════"
echo " Setup complete!"
echo "════════════════════════════════════════"
echo ""
echo "  Jenkins UI  : http://${SERVER_IP}:8080"
echo "  Admin pass  : ${JENKINS_PASS}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Finish Jenkins setup at http://${SERVER_IP}:8080"
echo "     Install suggested plugins + Pipeline plugin."
echo ""
echo "  2. Add credentials in Jenkins:"
echo "     Manage Jenkins → Credentials → Global → Add Credential (Secret text)"
echo "       ID: EC_DATABASE_URL   Value: your Neon pooled connection string"
echo "       ID: EC_DIRECT_URL     Value: your Neon direct connection string"
echo "       ID: EC_SESSION_SECRET Value: random string (min 32 chars)"
echo "       ID: EC_ANTHROPIC_KEY  Value: your Anthropic API key"
echo ""
echo "  3. Create a Pipeline job:"
echo "     New Item → Pipeline → Definition: Pipeline script from SCM"
echo "     → Git repo URL + branch (main) + Script Path: Jenkinsfile"
echo ""
echo "  4. Configure Nginx:"
echo "     Edit /etc/nginx/sites-available/event-calendar (replace yourdomain.com)"
echo "     nginx -t && systemctl reload nginx"
echo ""
echo "  5. Get SSL certificate:"
echo "     certbot --nginx -d yourdomain.com"
echo ""
echo "  6. Set up webhook in GitHub/GitLab:"
echo "     URL: http://${SERVER_IP}:8080/github-webhook/"
echo "     Content type: application/json"
echo "     Trigger: push to main"
echo ""
