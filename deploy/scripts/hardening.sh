#!/bin/bash

set -e

# =============================================================================
# Security Hardening Script
# Additional security measures for production deployment
# =============================================================================

HARDENING_LOG="/var/log/app-deploy-hardening.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$HARDENING_LOG"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "Error: This script must be run as root"
        exit 1
    fi
}

# =============================================================================
# SSH Hardening
# =============================================================================

ssh_hardening() {
    log "Hardening SSH..."
    
    # Backup original SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Configure SSH
    cat > /etc/ssh/sshd_config_hardened <<'EOF'
# SSH Hardened Configuration

# Disable root login
PermitRootLogin no

# Disable password authentication (use key-based)
PasswordAuthentication no

# Allow specific users only
# AllowUsers ubuntu deploy

# Disable empty passwords
PermitEmptyPasswords no

# Use strong ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# Use strong key exchange
KexAlgorithms curve25519-sha256,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521

# Use strong host key algorithms
HostKeyAlgorithms ecdsa-sha2-nistp256,ecdsa-sha2-nistp384,ecdsa-sha2-nistp521,ssh-ed25519,rsa-sha2-512,rsa-sha2-256

# Disable unused authentication methods
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no

# Session settings
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Disable explicit banners
# Banner /etc/ssh/banner

# Allow TCP forwarding
AllowTcpForwarding no
AllowAgentForwarding no
X11Forwarding no

# Disable tunneled MIDI
PermitUserEnvironment no
PermitUserEnvironment no

# DNS for logging
UseDNS no

# Strict modes
StrictModes yes

# Disable compression (security risk)
Compression no

# Enable maximum login attempts
MaxAuthTries 3
MaxSessions 10
EOF

    # Apply new config
    cp /etc/ssh/sshd_config_hardened /etc/ssh/sshd_config
    systemctl reload sshd
    
    log "SSH hardened!"
}

# =============================================================================
# System Users Hardening
# =============================================================================

users_hardening() {
    log "Hardening system users..."
    
    # Disable unnecessary system accounts
    for user in games news uucp; do
        if id "$user" &>/dev/null; then
            usermod -L "$user" 2>/dev/null || true
        fi
    done
    
    # Set secure permissions for sensitive files
    chmod 600 /etc/shadow
    chmod 600 /etc/gshadow
    chmod 644 /etc/passwd
    chmod 644 /etc/group
    chmod 644 /etc/services
    chmod 600 /etc/ssh/ssh_host_*_key
    
    log "System users hardened!"
}

# =============================================================================
# Kernel Hardening
# =============================================================================

kernel_hardening() {
    log "Hardening kernel parameters..."
    
    cat > /etc/sysctl.d/99-security.conf <<'EOF'
# Kernel Security Settings

# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignore bogus ICMP errors
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Enable TCP SYN cookies
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048

# Disable IP source routing
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv6.conf.all.send_redirects = 0
net.ipv6.conf.default.send_redirects = 0

# Disable IP forwarding
net.ipv4.conf.all.forwarding = 0
net.ipv4.conf.default.forwarding = 0
net.ipv6.conf.all.forwarding = 0
net.ipv6.conf.default.forwarding = 0

# Disable ICMP redirect acceptance
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Log suspicious packets
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Protect against TCP SYN flood attacks
net.netfilter.nf_conntrack_tcp_timeout_established = 3600

# Kernel hardening
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1
kernel.sysrq = 0

# Disable unprivileged BPF
kernel.bpf_jit_harden = 2
EOF

    sysctl -p /etc/sysctl.d/99-security.conf 2>/dev/null || true
    
    log "Kernel hardened!"
}

# =============================================================================
# File System Hardening
# =============================================================================

fs_hardening() {
    log "Hardening file systems..."
    
    # Read-only mounts
    mount -o remount,ro /proc 2>/dev/null || true
    mount -o remount,ro /sys 2>/dev/null || true
    
    # Prevent core dumps
    cat > /etc/security/limits.d/99-disable-coredump.conf <<'EOF'
*                hard    core          0
root             hard    core          0
EOF

    # Disable core dumps in sysctl
    echo "kernel.core_pattern = |/bin/false" >> /etc/sysctl.d/99-security.conf
    
    log "File system hardened!"
}

# =============================================================================
# Network Services Hardening
# =============================================================================

network_hardening() {
    log "Hardening network services..."
    
    # Disable unused services
    for service in telnet.socket rsh.socket ypbind.target nis.target; do
        systemctl disable "$service" 2>/dev/null || true
        systemctl mask "$service" 2>/dev/null || true
    done
    
    # Disable IPV6 if not needed
    # sysctl -w net.ipv6.conf.all.disable_ipv6=1
    
    log "Network services hardened!"
}

# =============================================================================
# Audit Setup
# =============================================================================

audit_setup() {
    log "Setting up audit logging..."
    
    # Install auditd if not present
    which auditd &>/dev/null || apt-get install -y -qq auditd
    
    # Configure audit rules
    cat > /etc/audit/rules.d/app-deploy.rules <<'EOF'
# Monitor user commands
-w /usr/bin/sudo -p x -k sudo
-w /usr/bin/wget -p x -k wget
-w /usr/bin/curl -p x -k curl

# Monitor SSH
-w /usr/bin/ssh -p x -k ssh
-w /etc/ssh/sshd_config -p wa -k ssh_config

# Monitor Docker
-w /var/lib/docker -p rwxa -k docker
-w /etc/docker -p wa -k docker

# Monitor sensitive files
-w /etc/passwd -p wa -k passwd
-w /etc/shadow -p wa -k shadow
-w /etc/group -p wa -k group
-w /etc/sudoers -p wa -k sudoers
-w /etc/hosts.allow -p wa -k hosts
-w /etc/hosts.deny -p wa -k hosts
EOF

    systemctl enable auditd
    systemctl restart auditd
    
    log "Audit logging configured!"
}

# =============================================================================
# Rate Limiting
# =============================================================================

rate_limit_setup() {
    log "Setting up rate limiting..."
    
    # UFW rate limiting for SSH
    ufw limit 22/tcp comment 'Rate limit SSH'
    
    # Nginx rate limiting (add to nginx.conf)
    cat >> /etc/nginx/nginx.conf <<'EOF'

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
EOF

    log "Rate limiting configured!"
}

# =============================================================================
# Main
# =============================================================================

check_root
log "Starting security hardening..."

# Run all hardening steps
ssh_hardening
users_hardening
kernel_hardening
fs_hardening
network_hardening
audit_setup
rate_limit_setup

log "========================================"
log "Security hardening complete!"
log "========================================"