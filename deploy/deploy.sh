#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
SYSTEMD_DIR="$DEPLOY_DIR/systemd"

PROJECT_NAME="${PROJECT_NAME:-app}"
ENVIRONMENT="${ENVIRONMENT:-production}"
USE_SYSTEMD=false

usage() {
    echo "App Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -i, --install         Install systemd service (first-run)"
    echo "  -u, --uninstall     Remove systemd service"
    echo "  -s, --systemd       Use systemd (default when installed)"
    echo "  -p, --project NAME   Project name (default: app)"
    echo "  -e, --env ENV      Environment: staging, production (default: production)"
    echo "  -b, --build        Force rebuild"
    echo "  -d, --down         Stop containers only"
    echo "  -l, --logs         Show logs after deploy"
    echo "  -m, --migrate     Run database migrations"
    echo "  --service SERVICE  Deploy specific service: frontend, backend, db (default: all)"
    echo "  -h, --help        Show this help"
echo ""
echo "Examples:"
echo "  $0                           # Deploy using systemd"
echo "  $0 --install                 # First-run: install systemd"
echo "  $0 -e staging -b            # Deploy to staging with rebuild"
echo "  $0 -d                       # Stop containers"
echo "  $0 --service frontend       # Deploy frontend only"
echo "  $0 --service backend        # Deploy backend and database"
echo "  $0 --service db             # Deploy database only"
    exit 1
}

BUILD=false
SHOW_LOGS=false
STOP_ONLY=false
RUN_MIGRATIONS=false
INSTALL=false
UNINSTALL=false
SERVICE="${SERVICE:-all}"

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--install)
            INSTALL=true
            shift
            ;;
        -u|--uninstall)
            UNINSTALL=true
            shift
            ;;
        -s|--systemd)
            USE_SYSTEMD=true
            shift
            ;;
        -p|--project)
            PROJECT_NAME="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -d|--down)
            STOP_ONLY=true
            shift
            ;;
        -l|--logs)
            SHOW_LOGS=true
            shift
            ;;
        -m|--migrate)
            RUN_MIGRATIONS=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        --service)
            SERVICE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

cd "$DEPLOY_DIR"

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "Error: This option requires root/sudo privileges."
        echo "Please run with: sudo $0"
        exit 1
    fi
}

do_install() {
    check_root
    
    echo "=== Installing App Systemd Service ==="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo ""
    
    local service_name="app@$ENVIRONMENT"
    local env_file="/etc/appdeploy/app.$ENVIRONMENT.env"
    
    echo "Creating systemd directories..."
    mkdir -p /etc/appdeploy
    mkdir -p "$HOME/$PROJECT_NAME"
    
    echo "Installing systemd service..."
    if [ -f "$SYSTEMD_DIR/app@.service" ]; then
        sed "s/%i/$PROJECT_NAME/g" "$SYSTEMD_DIR/app@.service" > "/tmp/$PROJECT_NAME.service"
        cp "/tmp/$PROJECT_NAME.service" "/etc/systemd/system/$service_name.service"
        rm -f "/tmp/$PROJECT_NAME.service"
    else
        echo "Error: Systemd service template not found"
        exit 1
    fi
    
    echo "Creating environment file at $env_file..."
    if [ -f "$SYSTEMD_DIR/app.$ENVIRONMENT.env" ]; then
        cp "$SYSTEMD_DIR/app.$ENVIRONMENT.env" "$env_file"
    elif [ -f "$SYSTEMD_DIR/app.env" ]; then
        sed "s/production/$ENVIRONMENT/g" "$SYSTEMD_DIR/app.env" | sed "s/PROJECT_NAME=[^ ]*/PROJECT_NAME=$PROJECT_NAME/" > "$env_file"
    else
        echo "Error: Environment template not found"
        exit 1
    fi
    
    echo "Setting permissions..."
    chmod 600 "$env_file"
    chown root:root "$env_file"
    
    echo "Reloading systemd..."
    systemctl daemon-reload
    
    echo "Enabling service..."
    systemctl enable "$service_name"
    
    echo "Starting service..."
    systemctl start "$service_name"
    
    echo ""
    echo "=== Installation Complete ==="
    echo "Service: $service_name"
    echo "Status: systemctl status $service_name"
    echo "Logs: journalctl -u $service_name -f"
    exit 0
}

do_uninstall() {
    check_root
    
    local service_name="app@$ENVIRONMENT"
    
    echo "=== Removing App Systemd Service ==="
    
    echo "Stopping service..."
    systemctl stop "$service_name" 2>/dev/null || true
    
    echo "Disabling service..."
    systemctl disable "$service_name" 2>/dev/null || true
    
    echo "Removing service file..."
    rm -f "/etc/systemd/system/$service_name.service"
    
    echo "Removing environment file..."
    rm -f "/etc/appdeploy/app.$ENVIRONMENT.env"
    
    echo "Reloading systemd..."
    systemctl daemon-reload
    
echo "=== Uninstall Complete ==="
exit 0
}

# Service-specific deployment functions
deploy_frontend() {
    local service_name="app@$ENVIRONMENT"
    
    echo "=== Frontend-Only Deployment ==="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "Mode: $([ "$USE_SYSTEMD" = true ] && echo "systemd" || echo "docker-compose")"
    echo "==============================="
    
    if [ "$STOP_ONLY" = true ]; then
        if [ "$USE_SYSTEMD" = true ]; then
            echo "Stopping via systemd..."
            systemctl stop "$service_name"
        else
            echo "Stopping containers..."
            docker-compose -f docker-compose.yml --profile frontend down
        fi
        echo "Containers stopped."
        exit 0
    fi
    
    if [ "$USE_SYSTEMD" = true ]; then
        echo "Pulling latest code..."
        cd "$HOME/$PROJECT_NAME"
        git pull origin main 2>/dev/null || echo "Not a git repo, continuing..."
        
        echo "Building containers..."
        cd "$HOME/$PROJECT_NAME/deploy"
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml --profile frontend build --no-cache
        else
            docker-compose -f docker-compose.yml --profile frontend build
        fi
        
        echo "Restarting service..."
        systemctl restart "$service_name"
        
        echo "Waiting for services..."
        sleep 20
        
    else
        if [ ! -f ".env" ]; then
            echo "Error: .env file not found!"
            echo "Please use systemd or provide .env file."
            exit 1
        fi
        
        export PROJECT_NAME
        export ENVIRONMENT
        source ".env"
        
        echo "Building containers..."
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml --profile frontend build --no-cache
        else
            docker-compose -f docker-compose.yml --profile frontend build
        fi
        
        echo "Starting containers..."
        docker-compose -f docker-compose.yml --profile frontend up -d --remove-orphans
        
        echo "Waiting for services..."
        sleep 15
        
        # Skip migrations for frontend-only deployment
        if [ "$RUN_MIGRATIONS" = true ]; then
            echo "Note: Skipping database migrations for frontend-only deployment"
        fi
    fi
    
    echo "Health check..."
    curl -sf http://localhost:${NGINX_PORT:-80}/health || echo "Warning: Health check returned non-zero"
    
    if [ "$SHOW_LOGS" = true ]; then
        echo ""
        echo "=== Recent Logs ==="
        docker-compose -f docker-compose.yml --profile frontend logs --tail=50
    fi
    
    echo ""
    echo "=== Frontend Deployment Complete ==="
    echo "$PROJECT_NAME frontend available at http://localhost:${NGINX_PORT:-80}"
}

deploy_backend() {
    local service_name="app@$ENVIRONMENT"
    
    echo "=== Backend Deployment ==="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "Mode: $([ "$USE_SYSTEMD" = true ] && echo "systemd" || echo "docker-compose")"
    echo "=========================="
    
    if [ "$STOP_ONLY" = true ]; then
        if [ "$USE_SYSTEMD" = true ]; then
            echo "Stopping via systemd..."
            systemctl stop "$service_name"
        else
            echo "Stopping containers..."
            docker-compose -f docker-compose.yml --profile backend down
        fi
        echo "Containers stopped."
        exit 0
    fi
    
    if [ "$USE_SYSTEMD" = true ]; then
        echo "Pulling latest code..."
        cd "$HOME/$PROJECT_NAME"
        git pull origin main 2>/dev/null || echo "Not a git repo, continuing..."
        
        echo "Building containers..."
        cd "$HOME/$PROJECT_NAME/deploy"
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml --profile backend build --no-cache
        else
            docker-compose -f docker-compose.yml --profile backend build
        fi
        
        echo "Restarting service..."
        systemctl restart "$service_name"
        
        echo "Waiting for services..."
        sleep 20
        
    else
        if [ ! -f ".env" ]; then
            echo "Error: .env file not found!"
            echo "Please use systemd or provide .env file."
            exit 1
        fi
        
        export PROJECT_NAME
        export ENVIRONMENT
        source ".env"
        
        echo "Building containers..."
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml --profile backend build --no-cache
        else
            docker-compose -f docker-compose.yml --profile backend build
        fi
        
        echo "Starting containers..."
        docker-compose -f docker-compose.yml --profile backend up -d --remove-orphans
        
        echo "Waiting for services..."
        sleep 15
        
        if [ "$RUN_MIGRATIONS" = true ]; then
            echo "Running database migrations..."
            docker-compose -f docker-compose.yml exec -T backend npx prisma migrate deploy
            echo "Migrations complete."
        fi
    fi
    
    echo "Health check..."
    curl -sf http://localhost:${NGINX_PORT:-80}/health || echo "Warning: Health check returned non-zero"
    
    if [ "$SHOW_LOGS" = true ]; then
        echo ""
        echo "=== Recent Logs ==="
        docker-compose -f docker-compose.yml --profile backend logs --tail=50
    fi
    
    echo ""
    echo "=== Backend Deployment Complete ==="
    echo "$PROJECT_NAME backend available at http://localhost:${NGINX_PORT:-80}"
}

deploy_db() {
    local service_name="app@$ENVIRONMENT"
    
    echo "=== Database Deployment ==="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "Mode: $([ "$USE_SYSTEMD" = true ] && echo "systemd" || echo "docker-compose")"
    echo "==========================="
    
    if [ "$STOP_ONLY" = true ]; then
        if [ "$USE_SYSTEMD" = true ]; then
            echo "Stopping via systemd..."
            systemctl stop "$service_name"
        else
            echo "Stopping containers..."
            docker-compose -f docker-compose.yml --profile db down
        fi
        echo "Containers stopped."
        exit 0
    fi
    
    if [ "$USE_SYSTEMD" = true ]; then
        echo "Pulling latest code..."
        cd "$HOME/$PROJECT_NAME"
        git pull origin main 2>/dev/null || echo "Not a git repo, continuing..."
        
        echo "Building containers..."
        cd "$HOME/$PROJECT_NAME/deploy"
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml --profile db build --no-cache
        else
            docker-compose -f docker-compose.yml --profile db build
        fi
        
        echo "Restarting service..."
        systemctl restart "$service_name"
        
        echo "Waiting for services..."
        sleep 20
        
    else
        if [ ! -f ".env" ]; then
            echo "Error: .env file not found!"
            echo "Please use systemd or provide .env file."
            exit 1
        fi
        
        export PROJECT_NAME
        export ENVIRONMENT
        source ".env"
        
        echo "Building containers..."
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml --profile db build --no-cache
        else
            docker-compose -f docker-compose.yml --profile db build
        fi
        
        echo "Starting containers..."
        docker-compose -f docker-compose.yml --profile db up -d --remove-orphans
        
        echo "Waiting for services..."
        sleep 15
    fi
    
    echo "Health check..."
    curl -sf http://localhost:${NGINX_PORT:-80}/health || echo "Warning: Health check returned non-zero"
    
    if [ "$SHOW_LOGS" = true ]; then
        echo ""
        echo "=== Recent Logs ==="
        docker-compose -f docker-compose.yml --profile db logs --tail=50
    fi
    
    echo ""
    echo "=== Database Deployment Complete ==="
    echo "$PROJECT_NAME database available at localhost:${POSTGRES_PORT:-5432}"
}

do_deploy() {
    local service_name="app@$ENVIRONMENT"
    
    echo "=== App Deployment ==="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "Mode: $([ "$USE_SYSTEMD" = true ] && echo "systemd" || echo "docker-compose")"
    echo "===================="
    
    if [ "$STOP_ONLY" = true ]; then
        if [ "$USE_SYSTEMD" = true ]; then
            echo "Stopping via systemd..."
            systemctl stop "$service_name"
        else
            echo "Stopping containers..."
            docker-compose -f docker-compose.yml down
        fi
        echo "Containers stopped."
        exit 0
    fi
    
    if [ "$USE_SYSTEMD" = true ]; then
        echo "Pulling latest code..."
        cd "$HOME/$PROJECT_NAME"
        git pull origin main 2>/dev/null || echo "Not a git repo, continuing..."
        
        echo "Building containers..."
        cd "$HOME/$PROJECT_NAME/deploy"
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml build --no-cache
        else
            docker-compose -f docker-compose.yml build
        fi
        
        echo "Restarting service..."
        systemctl restart "$service_name"
        
        echo "Waiting for services..."
        sleep 20
        
    else
        if [ ! -f ".env" ]; then
            echo "Error: .env file not found!"
            echo "Please use systemd or provide .env file."
            exit 1
        fi
        
        export PROJECT_NAME
        export ENVIRONMENT
        source ".env"
        
        echo "Building containers..."
        if [ "$BUILD" = true ]; then
            docker-compose -f docker-compose.yml build --no-cache
        else
            docker-compose -f docker-compose.yml build
        fi
        
        echo "Starting containers..."
        docker-compose -f docker-compose.yml up -d --remove-orphans
        
        echo "Waiting for services..."
        sleep 15
        
        if [ "$RUN_MIGRATIONS" = true ]; then
            echo "Running database migrations..."
            docker-compose -f docker-compose.yml exec -T backend npx prisma migrate deploy
            echo "Migrations complete."
        fi
    fi
    
    echo "Health check..."
    curl -sf http://localhost:${NGINX_PORT:-80}/health || echo "Warning: Health check returned non-zero"
    
    if [ "$SHOW_LOGS" = true ]; then
        echo ""
        echo "=== Recent Logs ==="
        docker-compose -f docker-compose.yml logs --tail=50
    fi
    
    echo ""
    echo "=== Deployment Complete ==="
    echo "$PROJECT_NAME available at http://localhost:${NGINX_PORT:-80}"
}

if [ "$UNINSTALL" = true ]; then
    do_uninstall
elif [ "$INSTALL" = true ]; then
    do_install
else
    if [ "$USE_SYSTEMD" = true ] || systemctl list-unit-files "app@$ENVIRONMENT.service" &>/dev/null; then
        USE_SYSTEMD=true
    fi
    
    # Route to service-specific deployment functions
    case "$SERVICE" in
        frontend)
            deploy_frontend
            ;;
        backend)
            deploy_backend
            ;;
        db)
            deploy_db
            ;;
        all|*)
            do_deploy
            ;;
    esac
fi