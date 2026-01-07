#!/bin/bash
#
# Dashboard ISC - Deploy Script
# Lädt die neuesten Docker Images von GitHub Artifacts und deployed sie
#
# Verwendung:
#   ./deploy.sh                    # Lädt latest successful workflow run
#   ./deploy.sh v1.0.0             # Lädt Artifacts von Tag v1.0.0
#   ./deploy.sh --run-id 12345     # Lädt Artifacts von spezifischem Workflow Run
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
DOWNLOAD_DIR="/tmp/dashboard-artifacts"

# Image Namen (müssen mit Workflow übereinstimmen)
BACKEND_IMAGE="dashboard-backend"
FRONTEND_IMAGE="dashboard-frontend"

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
    
    for cmd in curl jq docker; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd ist nicht installiert!"
            exit 1
        fi
    done
    
    log_info "Alle Voraussetzungen erfüllt ✓"
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
    
    if [[ -n "$tag_filter" ]]; then
        # Suche nach Run mit spezifischem Tag
        local run_id=$(echo "$runs" | jq -r ".workflow_runs[] | select(.head_branch == \"$tag_filter\") | .id" | head -1)
    else
        # Nimm den neuesten erfolgreichen Run
        local run_id=$(echo "$runs" | jq -r '.workflow_runs[0].id')
    fi
    
    if [[ -z "$run_id" || "$run_id" == "null" ]]; then
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
    local artifact_id=$(echo "$artifacts" | jq -r ".artifacts[] | select(.name == \"$artifact_name\") | .id")
    
    if [[ -z "$artifact_id" || "$artifact_id" == "null" ]]; then
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
    local tag="$3"
    
    log_info "Lade Docker Image: $image_name..."
    
    # Image laden
    docker load -i "$tar_file"
    
    # Für lokale Registry taggen
    docker tag "$image_name:$tag" "$REGISTRY_URL/$image_name:$tag"
    docker tag "$image_name:$tag" "$REGISTRY_URL/$image_name:latest"
    
    # In Registry pushen
    log_info "Pushe zu lokaler Registry..."
    docker push "$REGISTRY_URL/$image_name:$tag"
    docker push "$REGISTRY_URL/$image_name:latest"
    
    log_info "Image $image_name:$tag erfolgreich geladen ✓"
}

deploy_stack() {
    log_info "Starte Deployment..."
    
    cd "$BASE_DIR"
    
    # Backend neu starten
    log_info "Aktualisiere Backend..."
    cd "$BASE_DIR/backend"
    docker compose pull 2>/dev/null || true
    docker compose up -d --remove-orphans
    
    # Frontend neu starten
    log_info "Aktualisiere Frontend..."
    cd "$BASE_DIR/frontend"
    docker compose pull 2>/dev/null || true
    docker compose up -d --remove-orphans
    
    log_info "Deployment abgeschlossen ✓"
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
            -h|--help)
                echo "Verwendung: $0 [TAG] [--run-id ID]"
                echo ""
                echo "Optionen:"
                echo "  TAG           Version/Tag zum Deployen (z.B. v1.0.0)"
                echo "  --run-id ID   Spezifische Workflow Run ID"
                echo ""
                echo "Beispiele:"
                echo "  $0                    # Latest successful run"
                echo "  $0 v1.0.0             # Artifacts von Tag v1.0.0"
                echo "  $0 --run-id 12345     # Spezifischer Run"
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
    
    check_requirements
    
    # Workflow Run ID ermitteln
    if [[ -z "$run_id" ]]; then
        run_id=$(get_latest_run_id "$tag")
    fi
    
    log_info "Verwende Workflow Run: $run_id"
    
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
    
    # Image Tag aus Workflow ermitteln (aus dem tar-Dateinamen oder API)
    local image_tag="${tag:-latest}"
    if [[ -z "$tag" ]]; then
        # Versuche Tag aus Run zu ermitteln
        local run_info=$(api_call "/repos/$GITHUB_OWNER/$GITHUB_REPO/actions/runs/$run_id")
        image_tag=$(echo "$run_info" | jq -r '.head_branch // "latest"')
    fi
    
    log_info "Image Tag: $image_tag"
    
    # Images laden und taggen
    load_and_tag_image "$DOWNLOAD_DIR/backend/backend-image.tar" "$BACKEND_IMAGE" "$image_tag"
    load_and_tag_image "$DOWNLOAD_DIR/frontend/frontend-image.tar" "$FRONTEND_IMAGE" "$image_tag"
    
    # Aufräumen
    log_info "Räume auf..."
    rm -rf "$DOWNLOAD_DIR"
    
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
