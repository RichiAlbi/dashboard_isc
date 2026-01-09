#!/bin/bash
#
# Dashboard ISC - Deploy Script
# Lädt die neuesten Docker Images von GitHub Artifacts und deployed sie
#
# Verwendung:
#   ./deploy.sh                    # Lädt latest successful workflow run
#   ./deploy.sh v1.0.0             # Lädt Artifacts von Tag v1.0.0
#   ./deploy.sh --run-id 12345     # Lädt Artifacts von spezifischem Workflow Run
#   ./deploy.sh --restart-all      # Startet alle Container neu (ohne Download)
#

set -e

# ============================================================================
# KONFIGURATION - ANPASSEN!
# ============================================================================
GITHUB_OWNER="RichiAlbi"
GITHUB_REPO="dashboard_isc"               # Repository Name
GITHUB_TOKEN="${GITHUB_TOKEN:-}"          # Token als Env-Variable oder hier eintragen

# Lokale Pfade
BASE_DIR="/opt/disc"
REGISTRY_URL="localhost:5000"             # Lokale Registry
REGISTRY_USER="${REGISTRY_USER:-}"        # Registry Benutzername
REGISTRY_PASS="${REGISTRY_PASS:-}"        # Registry Passwort
DOWNLOAD_DIR="/tmp/dashboard-artifacts"

# Image Namen (müssen mit Workflow übereinstimmen)
BACKEND_IMAGE="dashboard-backend"
FRONTEND_IMAGE="dashboard-frontend"

# Flags
FORCE_DOWNLOAD=false
RESTART_ALL=false

# ============================================================================
# HILFSFUNKTIONEN
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_requirements() {
    log_info "Prüfe Voraussetzungen..."
    
    if [[ -z "$GITHUB_TOKEN" ]]; then
        log_error "GITHUB_TOKEN nicht gesetzt!"
        echo "Setze den Token mit: export GITHUB_TOKEN='ghp_xxxxx'"
        echo "Oder trage ihn direkt in diesem Script ein."
        echo ""
        echo "Token erstellen: https://github.com/settings/tokens"
        echo "Benötigte Berechtigung: 'actions:read' (oder 'repo' für private Repos)"
        exit 1
    fi
    
    for cmd in curl unzip docker; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd ist nicht installiert!"
            exit 1
        fi
    done
    
    log_info "Alle Voraussetzungen erfüllt ✓"
}

registry_login() {
    if [[ -n "$REGISTRY_USER" && -n "$REGISTRY_PASS" ]]; then
        log_info "Melde bei Registry an..."
        echo "$REGISTRY_PASS" | docker login "$REGISTRY_URL" -u "$REGISTRY_USER" --password-stdin
    fi
}

# Prüft ob ein Image mit Tag bereits in der Registry existiert
image_exists_in_registry() {
    local image_name="$1"
    local tag="$2"
    
    # Versuche das Manifest abzurufen (funktioniert auch ohne Pull)
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "${REGISTRY_USER}:${REGISTRY_PASS}" \
        "http://${REGISTRY_URL}/v2/${image_name}/manifests/${tag}" \
        -H "Accept: application/vnd.docker.distribution.manifest.v2+json" 2>/dev/null)
    
    [[ "$response" == "200" ]]
}

# Löscht alte/ungenutzte Docker Images um Speicherplatz zu sparen
cleanup_old_images() {
    log_info "Räume alte Docker Images auf..."
    
    # Entferne dangling images (untagged)
    docker image prune -f 2>/dev/null || true
    
    # Entferne alte Versionen der Dashboard Images (behalte nur latest)
    for image in "$BACKEND_IMAGE" "$FRONTEND_IMAGE" "$REGISTRY_URL/$BACKEND_IMAGE" "$REGISTRY_URL/$FRONTEND_IMAGE"; do
        # Hole alle Tags außer 'latest'
        local old_images=$(docker images "$image" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null | grep -v ":latest$" || true)
        if [[ -n "$old_images" ]]; then
            log_info "Lösche alte Images von $image..."
            echo "$old_images" | xargs -r docker rmi 2>/dev/null || true
        fi
    done
    
    log_info "Aufräumen abgeschlossen ✓"
}

# ============================================================================
# GITHUB API FUNKTIONEN
# ============================================================================
api_call() {
    local endpoint="$1"
    curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github+json" \
         "https://api.github.com$endpoint"
}

get_latest_run_id() {
    local tag_filter="$1"
    
    log_info "Suche neuesten Workflow Run..."
    
    local runs=$(api_call "/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/runs?status=success&per_page=20")
    
    local run_id=""
    if [[ -n "$tag_filter" ]]; then
        # Suche nach Run mit spezifischem Tag
        run_id=$(echo "$runs" | tr ',' '\n' | grep -A5 "\"head_branch\":\"$tag_filter\"" | grep '"id"' | head -1 | sed 's/.*"id":\([0-9]*\).*/\1/')
    fi
    
    # Fallback: Nimm die erste Run-ID
    if [[ -z "$run_id" ]]; then
        run_id=$(echo "$runs" | sed 's/.*"workflow_runs":\[{"id":\([0-9]*\).*/\1/')
    fi
    
    if [[ -z "$run_id" || "$run_id" == "null" || ! "$run_id" =~ ^[0-9]+$ ]]; then
        log_error "Kein passender Workflow Run gefunden!"
        exit 1
    fi
    
    echo "$run_id"
}

download_artifact() {
    local run_id="$1"
    local artifact_name="$2"
    local output_file="$3"
    
    log_info "Suche Artifact '$artifact_name'..."
    
    local artifacts=$(api_call "/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/runs/$run_id/artifacts")
    
    # Da das JSON formatiert ist: finde die Zeile mit dem Namen und hole die ID aus dem Block davor
    local artifact_id=$(echo "$artifacts" | grep -B10 "\"name\": \"$artifact_name\"" | grep '"id"' | tail -1 | sed 's/[^0-9]//g')
    
    if [[ -z "$artifact_id" || ! "$artifact_id" =~ ^[0-9]+$ ]]; then
        log_error "Artifact '$artifact_name' nicht gefunden!"
        exit 1
    fi
    
    log_info "Lade Artifact herunter (ID: $artifact_id)..."
    
    curl -sL -H "Authorization: Bearer $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github+json" \
         "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/artifacts/$artifact_id/zip" \
         -o "$output_file"
    
    log_info "Download abgeschlossen: $output_file"
}

# ============================================================================
# DOCKER FUNKTIONEN
# ============================================================================
load_and_tag_image() {
    local tar_file="$1"
    local image_name="$2"
    local source_tag="$3"
    
    log_info "Lade Docker Image: $image_name..."
    
    # Image laden
    docker load -i "$tar_file"
    
    # Nur als 'latest' taggen (spart Speicherplatz)
    docker tag "$image_name:$source_tag" "$REGISTRY_URL/$image_name:latest"
    
    # In Registry pushen (nur latest)
    log_info "Pushe zu lokaler Registry als latest..."
    docker push "$REGISTRY_URL/$image_name:latest"
    
    # Lokales getaggtes Image entfernen (nur latest behalten)
    docker rmi "$image_name:$source_tag" 2>/dev/null || true
    
    log_info "Image $image_name erfolgreich als latest geladen ✓"
}

deploy_stack() {
    log_info "Starte Deployment..."
    
    cd "$BASE_DIR"
    
    # Backend neu starten
    log_info "Aktualisiere Backend..."
    cd "$BASE_DIR/backend"
    docker compose pull 2>/dev/null || true
    # Container stoppen und entfernen, dann neu erstellen
    docker compose down --remove-orphans 2>/dev/null || true
    docker compose up -d --force-recreate
    
    # Frontend neu starten  
    log_info "Aktualisiere Frontend..."
    cd "$BASE_DIR/frontend"
    docker compose pull 2>/dev/null || true
    docker compose down --remove-orphans 2>/dev/null || true
    docker compose up -d --force-recreate
    
    # Proxy neu starten (falls vorhanden)
    if [[ -d "$BASE_DIR/proxy" ]]; then
        log_info "Aktualisiere Proxy..."
        cd "$BASE_DIR/proxy"
        docker compose down --remove-orphans 2>/dev/null || true
        docker compose up -d --force-recreate
    fi
    
    log_info "Deployment abgeschlossen ✓"
}

# Startet alle Container neu ohne Download
restart_all_containers() {
    log_info "Starte alle Container neu..."
    
    # Backend
    if [[ -d "$BASE_DIR/backend" ]]; then
        log_info "Restarte Backend..."
        cd "$BASE_DIR/backend"
        docker compose restart
    fi
    
    # Frontend
    if [[ -d "$BASE_DIR/frontend" ]]; then
        log_info "Restarte Frontend..."
        cd "$BASE_DIR/frontend"
        docker compose restart
    fi
    
    # Proxy
    if [[ -d "$BASE_DIR/nginx" ]]; then
        log_info "Restarte Proxy..."
        cd "$BASE_DIR/nginx"
        docker compose restart
    fi
    
    # Registry
    if [[ -d "$BASE_DIR/registry" ]]; then
        log_info "Restarte Registry..."
        cd "$BASE_DIR/registry"
        docker compose restart
    fi
    
    log_info "Alle Container neu gestartet ✓"
}

# ============================================================================
# HAUPTPROGRAMM
# ============================================================================
main() {
    local tag=""
    local run_id=""
    
    # Argumente parsen
    while [[ $# -gt 0 ]]; do
        case $1 in
            --run-id)
                run_id="$2"
                shift 2
                ;;
            --force|-f)
                FORCE_DOWNLOAD=true
                shift
                ;;
            --restart-all|--restart)
                RESTART_ALL=true
                shift
                ;;
            --cleanup)
                cleanup_old_images
                exit 0
                ;;
            -h|--help)
                echo "Verwendung: $0 [TAG] [OPTIONEN]"
                echo ""
                echo "Optionen:"
                echo "  TAG             Version/Tag zum Deployen (z.B. v1.0.0)"
                echo "  --run-id ID     Spezifische Workflow Run ID"
                echo "  --force, -f     Download erzwingen (auch wenn Version existiert)"
                echo "  --restart-all   Alle Container neu starten (ohne Download)"
                echo "  --cleanup       Alte Docker Images löschen und beenden"
                echo ""
                echo "Beispiele:"
                echo "  $0                    # Latest successful run deployen"
                echo "  $0 v1.0.0             # Artifacts von Tag v1.0.0"
                echo "  $0 --run-id 12345     # Spezifischer Run"
                echo "  $0 --restart-all      # Alle Container neu starten"
                echo "  $0 --cleanup          # Alte Images aufräumen"
                exit 0
                ;;
            *)
                tag="$1"
                shift
                ;;
        esac
    done
    
    echo "==========================================="
    echo "  Dashboard ISC - Deployment"
    echo "==========================================="
    echo ""
    
    # Nur Restart - kein Download nötig
    if [[ "$RESTART_ALL" == "true" ]]; then
        restart_all_containers
        echo ""
        log_info "Restart abgeschlossen! ✓"
        echo ""
        echo "Status prüfen: docker ps"
        exit 0
    fi
    
    check_requirements
    registry_login
    
    # Workflow Run ID ermitteln
    if [[ -z "$run_id" ]]; then
        run_id=$(get_latest_run_id "$tag")
    fi
    
    log_info "Verwende Workflow Run: $run_id"
    
    # Image Tag aus Workflow ermitteln (für Download)
    local source_tag="${tag:-latest}"
    if [[ -z "$tag" ]]; then
        # Versuche Tag aus Run zu ermitteln
        local run_info=$(api_call "/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/runs/$run_id")
        source_tag=$(echo "$run_info" | grep '"head_branch"' | head -1 | sed 's/.*"head_branch": *"\([^"]*\)".*/\1/')
        source_tag="${source_tag:-latest}"
    fi
    
    log_info "Source Tag: $source_tag (wird als 'latest' deployed)"
    
    # Immer neue Images laden wenn --force oder neuer Run
    local need_download=true
    
    if [[ "$FORCE_DOWNLOAD" != "true" ]]; then
        # Prüfe ob wir bereits die aktuelle Version haben
        # (vereinfacht: immer downloaden um sicherzugehen)
        log_info "Prüfe auf neue Images..."
    fi
    
    if [[ "$need_download" == "true" ]]; then
        # Download-Verzeichnis vorbereiten
        rm -rf "$DOWNLOAD_DIR"
        mkdir -p "$DOWNLOAD_DIR"
        
        # Artifacts herunterladen
        download_artifact "$run_id" "backend-image" "$DOWNLOAD_DIR/backend.zip"
        download_artifact "$run_id" "frontend-image" "$DOWNLOAD_DIR/frontend.zip"
        
        # Entpacken
        log_info "Entpacke Artifacts..."
        cd "$DOWNLOAD_DIR"
        unzip -q backend.zip -d backend/
        unzip -q frontend.zip -d frontend/
        
        # Images laden und als 'latest' taggen
        load_and_tag_image "$DOWNLOAD_DIR/backend/backend-image.tar" "$BACKEND_IMAGE" "$source_tag"
        load_and_tag_image "$DOWNLOAD_DIR/frontend/frontend-image.tar" "$FRONTEND_IMAGE" "$source_tag"
        
        # Alte Images aufräumen
        cleanup_old_images
        
        # Temp-Verzeichnis aufräumen
        log_info "Räume temporäre Dateien auf..."
        rm -rf "$DOWNLOAD_DIR"
    fi
    
    # Deployment
    deploy_stack
    
    echo ""
    echo "==========================================="
    log_info "Deployment erfolgreich abgeschlossen! 🚀"
    echo "==========================================="
    echo ""
    echo "Status prüfen:"
    echo "  docker ps"
    echo ""
    echo "Logs ansehen:"
    echo "  docker compose -f $BASE_DIR/backend/docker-compose.yml logs -f"
    echo "  docker compose -f $BASE_DIR/frontend/docker-compose.yml logs -f"
}

main "$@"
