#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 server. Run as root:
#   curl -fsSL https://raw.githubusercontent.com/Stijndh88/DAPV/main/infra/scripts/bootstrap-server.sh | bash
# (or copy it over with scp if the repo is private).
#
# Installs Docker, a firewall, automatic security updates and fail2ban,
# creates a `deploy` user for GitHub Actions, and turns off SSH password login.
set -euo pipefail

DEPLOY_USER=deploy
APP_DIR=/opt/plasvissers

[ "$(id -u)" = 0 ] || { echo "run as root"; exit 1; }

timedatectl set-timezone Europe/Brussels
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get -y upgrade
DEBIAN_FRONTEND=noninteractive apt-get -y install ca-certificates curl git ufw fail2ban unattended-upgrades

# Docker Engine + compose plugin (official repo)
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

# Firewall: SSH + web only. (Docker-published ports bypass ufw, but we publish only 80/443.)
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# Automatic security updates (reboots at 04:30 if needed)
dpkg-reconfigure -f noninteractive unattended-upgrades
cat > /etc/apt/apt.conf.d/52plasvissers <<'C'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
C

# Deploy user (can run docker, no password, SSH key only)
id "$DEPLOY_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /home/$DEPLOY_USER/.ssh
if [ -f /root/.ssh/authorized_keys ] && [ ! -s /home/$DEPLOY_USER/.ssh/authorized_keys ]; then
  cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/authorized_keys
  chown $DEPLOY_USER: /home/$DEPLOY_USER/.ssh/authorized_keys
fi

# SSH hardening: keys only
cat > /etc/ssh/sshd_config.d/10-plasvissers.conf <<'C'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
C
systemctl reload ssh || systemctl reload sshd

# App directory
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"
echo
echo "Done. Next steps (as $DEPLOY_USER):"
echo "  git clone https://github.com/Stijndh88/DAPV.git $APP_DIR/repo   # or rsync infra/"
echo "  ln -s $APP_DIR/repo/infra $APP_DIR/infra"
echo "  cd $APP_DIR/infra && cp .env.example .env && chmod 600 .env && nano .env"
echo "See docs/deployment.md."
