# Docker Registry Setup

## Quick Start

1. **Auth-Verzeichnis erstellen und Passwort setzen:**
   ```bash
   cd registry
   mkdir -p auth
   
   # htpasswd installieren (falls nicht vorhanden)
   # Ubuntu/Debian: sudo apt install apache2-utils
   # CentOS/RHEL: sudo yum install httpd-tools
   
   # Benutzer anlegen (Passwort wird abgefragt)
   htpasswd -Bc auth/htpasswd admin
   ```

2. **Registry starten:**
   ```bash
   docker compose up -d
   ```

3. **Zugriff:**
   - Registry API: `http://<VM-IP>:5000`
   - Web UI: `http://<VM-IP>:8080`

## Clients konfigurieren (Insecure Registry)

Da die Registry kein HTTPS verwendet, müssen alle Docker-Clients konfiguriert werden:

### Linux
```bash
sudo nano /etc/docker/daemon.json
```
```json
{
  "insecure-registries": ["<VM-IP>:5000"]
}
```
```bash
sudo systemctl restart docker
```

### Windows (Docker Desktop)
1. Docker Desktop → Settings → Docker Engine
2. Füge hinzu:
   ```json
   {
     "insecure-registries": ["<VM-IP>:5000"]
   }
   ```
3. Apply & Restart

### macOS (Docker Desktop)
Gleich wie Windows über Docker Desktop Settings.

## Login zur Registry

```bash
docker login <VM-IP>:5000
# Username: admin
# Password: <dein-passwort>
```

## Images pushen/pullen

```bash
# Taggen
docker tag myimage:latest <VM-IP>:5000/myimage:latest

# Pushen
docker push <VM-IP>:5000/myimage:latest

# Pullen
docker pull <VM-IP>:5000/myimage:latest
```

## GitHub Secrets

Für den GitHub Actions Workflow müssen folgende Secrets gesetzt werden:

| Secret | Wert |
|--------|------|
| `REGISTRY_URL` | `<VM-IP>:5000` |
| `REGISTRY_USERNAME` | `admin` |
| `REGISTRY_PASSWORD` | `<dein-passwort>` |

## Wartung

### Garbage Collection (unbenutzte Layer löschen)
```bash
docker exec registry bin/registry garbage-collect /etc/docker/registry/config.yml
```

### Logs ansehen
```bash
docker compose logs -f
```
