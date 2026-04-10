#!/bin/bash

set -e

# =============================================================================
# Backup Script
# Automated backups to Oracle Cloud Object Storage
# =============================================================================

BACKUP_DIR="/opt/app-deploy/backups"
LOG_FILE="/var/log/app-deploy-backup.log"
CONFIG_FILE="/etc/appdeploy/backup.conf"

usage() {
    echo "App Deploy Backup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --database      Backup database only"
    echo "  -f, --files       Backup files only"
    echo "  -a, --all        Backup everything (default)"
    echo "  -l, --list       List existing backups"
    echo "  -r, --restore    Restore from backup"
    echo "  -c, --clean     Clean old backups"
    echo "  -s, --schedule  Setup cron schedule"
    echo "  -h, --help      Show this help"
    echo ""
    exit 1
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# =============================================================================
# Configuration
# =============================================================================

load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    else
        # Defaults
        BACKUP_REGION="${BACKUP_REGION:-us-phoenix-1}"
        BACKUP_NAMESPACE="${BACKUP_NAMESPACE:-your-tenant-namespace}"
        BACKUP_BUCKET="${BACKUP_BUCKET:-app-backups}"
        BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
        PROJECT_NAME="${PROJECT_NAME:-app}"
    fi
}

# =============================================================================
# Database Backup
# =============================================================================

backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${PROJECT_NAME}_db_${timestamp}.sql.gz"
    
    log "Starting database backup..."
    
    # Check if PostgreSQL is running
    if ! docker ps --filter "name=.*db.*" --format "{{.Names}}" | grep -q .; then
        log "Warning: No database container found, skipping database backup"
        return 0
    fi
    
    # Get database container
    local db_container=$(docker ps --filter "name=.*db.*" --format "{{.Names}}" | head -1)
    
    mkdir -p "$BACKUP_DIR"
    
    # Export database
    docker exec "$db_container" pg_dumpall -U postgres | gzip > "$backup_file"
    
    log "Database backup created: $backup_file"
    echo "$backup_file"
}

# =============================================================================
# Files Backup
# =============================================================================

backup_files() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${PROJECT_NAME}_files_${timestamp}.tar.gz"
    
    log "Starting files backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup important directories
    local backup_sources="/home/ubuntu /var/www /opt/app-deploy /etc/appdeploy"
    
    # Create archive
    tar -czf "$backup_file" $backup_sources 2>/dev/null || true
    
    log "Files backup created: $backup_file"
    echo "$backup_file"
}

# =============================================================================
# Upload to Object Storage
# =============================================================================

upload_backup() {
    local backup_file="$1"
    local filename=$(basename "$backup_file")
    
    log "Uploading to Object Storage..."
    
    # Check if OCI CLI is installed
    if ! command -v oci &>/dev/null; then
        log "Warning: OCI CLI not installed, skipping upload"
        return 1
    fi
    
    # Upload to Object Storage
    oci os object put \
        --namespace-name "$BACKUP_NAMESPACE" \
        --bucket-name "$BACKUP_BUCKET" \
        --object-name "backups/$PROJECT_NAME/$(date +%Y/%m/%d)/$filename" \
        --file-path "$backup_file" \
        --storage-tier STANDARD \
        || log "Warning: Upload failed, backup saved locally"
    
    log "Uploaded: $filename"
}

# =============================================================================
# List Backups
# =============================================================================

list_backups() {
    log "Available backups:"
    
    # Local backups
    echo "=== Local Backups ==="
    ls -lh "$BACKUP_DIR/" 2>/dev/null || echo "No local backups"
    
    # Remote backups
    if command -v oci &>/dev/null; then
        echo ""
        echo "=== Object Storage Backups ==="
        oci os object list \
            --namespace-name "$BACKUP_NAMESPACE" \
            --bucket-name "$BACKUP_BUCKET" \
            --prefix "backups/$PROJECT_NAME/" \
            2>/dev/null || echo "No remote backups or OCI not configured"
    fi
}

# =============================================================================
# Restore Backup
# =============================================================================

restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Error: Please specify backup file to restore"
        echo "Use: $0 --list to see available backups"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo "Error: Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Starting restore from: $backup_file"
    
    read -p "This will overwrite current data. Continue? [y/N] " confirm
    if [ "$confirm" != "y" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Determine backup type and restore
    if [[ "$backup_file" == *"_db_"* ]]; then
        log "Restoring database..."
        local db_container=$(docker ps --filter "name=.*db.*" --format "{{.Names}}" | head -1)
        gunzip -c "$backup_file" | docker exec -i "$db_container" psql -U postgres
    else
        log "Restoring files..."
        tar -xzf "$backup_file" -C /
    fi
    
    log "Restore complete!"
}

# =============================================================================
# Clean Old Backups
# =============================================================================

clean_backups() {
    log "Cleaning backups older than $BACKUP_RETENTION_DAYS days..."
    
    # Local cleanup
    find "$BACKUP_DIR/" -type f -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true
    
    # Remote cleanup (list and delete old objects)
    if command -v oci &>/dev/null; then
        log "Cleaning Object Storage..."
        # Note: OCI doesn't have automatic lifecycle management for buckets
        # You'll need to manage this via console or custom script
    fi
    
    log "Cleanup complete!"
}

# =============================================================================
# Setup Cron Schedule
# =============================================================================

setup_schedule() {
    log "Setting up backup cron schedule..."
    
    # Create cron job
    cat > /etc/cron.d/app-deploy-backup <<EOF
# Daily backups at 2 AM
0 2 * * * root $BACKUP_DIR/../../scripts/backup.sh --all >> $LOG_FILE 2>&1

# Weekly clean on Sundays
0 3 * * 0 root $BACKUP_DIR/../../scripts/backup.sh --clean >> $LOG_FILE 2>&1
EOF
    
    log "Cron schedule configured!"
}

# =============================================================================
# Main
# =============================================================================

load_config

DATABASE_ONLY=false
FILES_ONLY=false
ALL_BACKUP=true
LIST=false
RESTORE=false
CLEAN=false
SCHEDULE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--database)
            DATABASE_ONLY=true
            ALL_BACKUP=false
            shift
            ;;
        -f|--files)
            FILES_ONLY=true
            ALL_BACKUP=false
            shift
            ;;
        -a|--all)
            ALL_BACKUP=true
            shift
            ;;
        -l|--list)
            LIST=true
            shift
            ;;
        -r|--restore)
            RESTORE=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -s|--schedule)
            SCHEDULE=true
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

mkdir -p "$BACKUP_DIR"

if [ "$LIST" = true ]; then
    list_backups
elif [ "$RESTORE" = true ]; then
    shift
    restore_backup "$1"
elif [ "$CLEAN" = true ]; then
    clean_backups
elif [ "$SCHEDULE" = true ]; then
    setup_schedule
else
    log "=== Starting backup ==="
    
    if [ "$ALL_BACKUP" = true ] || [ "$DATABASE_ONLY" = true ]; then
        db_backup=$(backup_database)
        if [ -n "$db_backup" ]; then
            upload_backup "$db_backup"
        fi
    fi
    
    if [ "$ALL_BACKUP" = true ] || [ "$FILES_ONLY" = true ]; then
        files_backup=$(backup_files)
        if [ -n "$files_backup" ]; then
            upload_backup "$files_backup"
        fi
    fi
    
    log "=== Backup complete ==="
fi