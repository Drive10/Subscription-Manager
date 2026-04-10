#!/bin/bash

set -e

# =============================================================================
# Server Setup Script
# Runs on first boot after Oracle Cloud instance is provisioned
# =============================================================================

INSTALL_DIR="/opt/app-deploy"
LOG_FILE="/var/log/app-deploy-setup.log"

usage() {
    echo "App Deploy Server Setup"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --full         Full setup (Docker + hardening + monitoring)"
    echo "  -d, --docker      Docker and Docker Compose only"
    echo "  -h, --hardening  Security hardening only"
    echo "  -m, --monitoring  Monitoring setup only"
    echo "  -y, --yes        Skip confirmation prompts"
    echo "  -h, --help       Show this help"
    exit 1
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

confirm() {
    if [ "$SKIP_CONFIRM" = "true" ]; then
        return 0
    fi
    read -p "$1 [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# =============================================================================
# Check Root
# =============================================================================

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "Error: This script must be run as root"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# =============================================================================
# Initial Setup
# =============================================================================

initial_setup() {
    log "Starting initial setup..."
    
    log "Creating application directory..."
    mkdir -p "$INSTALL_DIR"
    
    log "Updating package lists..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    
    log "Installing base dependencies..."
    apt-get install -y -qq curl wget git htop vim ufw fail2ban logrotate \
        apt-transport-https ca-certificates software-properties-common
}

# =============================================================================
# Docker Setup
# =============================================================================

docker_setup() {
    log "Setting up Docker..."
    
    # Check if Docker is already installed
    if command -v docker &>/dev/null; then
        log "Docker already installed, skipping..."
        return 0
    fi
    
    log "Adding Docker GPG key..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null
    
    log "Adding Docker repository..."
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    
    log "Installing Docker..."
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
    
    log "Enabling Docker service..."
    systemctl enable docker
    systemctl start docker
    
    log "Adding ubuntu user to docker group..."
    usermod -aG docker ubuntu
    
    log "Installing Docker Compose standalone..."
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -o '"tag_name"' | cut -d: -f2 | tr -d '"')
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log "Docker setup complete!"
}

# =============================================================================
# Swap Setup
# =============================================================================

swap_setup() {
    log "Setting up swap file..."
    
    if [ -n "$(swapon --show)" ]; then
        log "Swap already configured, skipping..."
        return 0
    fi
    
    log "Creating 2GB swap file..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Add to fstab
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi
    
    log "Configuring swapiness..."
    sysctl vm.swappiness=10
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    
    log "Swap setup complete!"
}

# =============================================================================
# Firewall Setup
# =============================================================================

firewall_setup() {
    log "Configuring firewall..."
    
    # Reset to defaults
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (limit rate)
    ufw limit SSH/tcp
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    echo "y" | ufw enable
    
    log "Firewall configured!"
}

# =============================================================================
# Fail2Ban Setup
# =============================================================================

fail2ban_setup() {
    log "Configuring Fail2Ban..."
    
    # Configure SSH protection
    cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
findtime = 600
bantime = 3600
ignoreip = 127.0.0.1

[nginx-http-auth]
enabled = false
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600
EOF

    systemctl enable fail2ban
    systemctl restart fail2ban
    
    log "Fail2Ban configured!"
}

# =============================================================================
# Logrotate Setup
# =============================================================================

logrotate_setup() {
    log "Configuring logrotate..."
    
    cat > /etc/logrotate.d/app-deploy <<'EOF'
/var/log/app-deploy/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
    
    mkdir -p /var/log/app-deploy
    
    log "Logrotate configured!"
}

# =============================================================================
# Auto Security Updates
# =============================================================================

autoupdate_setup() {
    log "Configuring automatic security updates..."
    
    apt-get install -y -qq unattended-upgrades
    
    cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}:${distro_codename}-updates";
};

Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
Unattended-Upgrade::Mail "root";
Unattended-Upgrade::MailOnlyOnError "true";
EOF

    log "Auto security updates configured!"
}

# =============================================================================
# Monitoring Setup
# =============================================================================

monitoring_setup() {
    log "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p "$INSTALL_DIR/monitoring"
    
    # Create health check script
    cat > "$INSTALL_DIR/monitoring/health.sh" <<'EOF'
#!/bin/bash
# Health check script

check_services() {
    local failed=0
    
    # Check Docker
    if ! systemctl is-active --quiet docker; then
        echo "ERROR: Docker is not running"
        ((failed++))
    fi
    
    # Check containers (if any running)
    if docker ps -q --filter "name=app" | grep -q .; then
        if ! docker exec $(docker ps -q --filter "name=app" --format "{{.ID}}" 2>/dev/null | head -1) curl -sf http://localhost/health &>/dev/null; then
            echo "WARN: Application health check failed"
        fi
    fi
    
    # Check disk space
    if [ $(df -BG / | awk 'NR==2 {print $5}' | tr -d '%') -gt 90 ]; then
        echo "WARN: Disk usage above 90%"
    fi
    
    # Check memory
    local mem_used=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    if [ "$mem_used" -gt 90 ]; then
        echo "WARN: Memory usage above 90%"
    fi
    
    # Check CPU load
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
    local cores=$(nproc)
    if (( $(echo "$load > $cores" | bc -l) )); then
        echo "WARN: Load average higher than CPU cores"
    fi
    
    if [ $failed -gt 0 ]; then
        return 1
    fi
    return 0
}

check_services
EOF
    chmod +x "$INSTALL_DIR/monitoring/health.sh"
    
    # Create metrics script
    cat > "$INSTALL_DIR/monitoring/metrics.sh" <<'EOF'
#!/bin/bash
# Metrics exporter (simple text format for Prometheus)

# System uptime
echo "app_deploy_uptime_seconds $(date +%s -d $(who -b | awk '{print $3,$4}'))"

# Memory
free -m | awk '/Mem:/ {printf "app_deploy_memory_used_mb %d\napp_deploy_memory_total_mb %d\n", $3, $2}'

# Disk
df -BG / | awk 'NR==2 {printf "app_deploy_disk_used_gb %d\napp_deploy_disk_total_gb %d\n", $3, $2}'

# Load
uptime | awk -F'load average:' '{printf "app_deploy_load_1m %s\napp_deploy_load_5m %s\napp_deploy_load_15m %s\n", $2, $3, $4}' | tr -d ','

# Container count
echo "app_deploy_containers $(docker ps -q | wc -l)"
EOF
    chmod +x "$INSTALL_DIR/monitoring/metrics.sh"
    
    # Create cron job for metrics
    cat > /etc/cron.d/app-deploy-metrics <<'EOF'
*/5 * * * * root $INSTALL_DIR/monitoring/metrics.sh > /var/www/html/metrics 2>/dev/null || true
EOF
    
    # Install curl in container if needed
    if ! command -v curl &>/dev/null; then
        apt-get install -y -qq curl
    fi
    
    log "Monitoring setup complete!"
}

# =============================================================================
# Setup Complete
# =============================================================================

setup_complete() {
    log "========================================"
    log "Server setup complete!"
    log "========================================"
    log ""
    log "Next steps:"
    log "  1. Configure environment: sudo nano /etc/appdeploy/app.production.env"
    log "  2. Deploy: cd $INSTALL_DIR && sudo ./scripts/deploy.sh --install"
    log "  3. Check status: sudo systemctl status app@production"
    log ""
    log "Useful commands:"
    log "  - View logs: sudo journalctl -u app@production -f"
    log "  - Check health: $INSTALL_DIR/monitoring/health.sh"
    log "  - View metrics: curl localhost/metrics"
    log "========================================"
}

# =============================================================================
# Main
# =============================================================================

SKIP_CONFIRM=false
DOCKER_ONLY=false
HARDENING_ONLY=false
MONITORING_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--full)
            FULL_SETUP=true
            shift
            ;;
        -d|--docker)
            DOCKER_ONLY=true
            shift
            ;;
        -h|--hardening)
            HARDENING_ONLY=true
            shift
            ;;
        -m|--monitoring)
            MONITORING_ONLY=true
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

check_root

log "Starting server setup..."

# Run selected components
if [ "$DOCKER_ONLY" = true ]; then
    docker_setup
elif [ "$HARDENING_ONLY" = true ]; then
    swap_setup
    firewall_setup
    fail2ban_setup
    logrotate_setup
    autoupdate_setup
elif [ "$MONITORING_ONLY" = true ]; then
    monitoring_setup
else
    initial_setup
    docker_setup
    swap_setup
    firewall_setup
    fail2ban_setup
    logrotate_setup
    autoupdate_setup
    monitoring_setup
fi

setup_complete