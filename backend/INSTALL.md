# ISC Dashboard Backend - Installationsanleitung

## Schnellstart

### 1. Abhängigkeiten installieren

```cmd
cd C:\Users\richi\OneDrive\Code\dashboard_isc\backend
pip install -r requirements.txt
```

### 2. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env` und passe die Werte an:

```cmd
copy .env.example .env
```

Wichtige Einstellungen in `.env`:

```env
# Datenbank
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=app_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=app_db

# LDAP (optional)
LDAP_ENABLED=false
LDAP_SYNC_ON_STARTUP=false
```

### 3. Datenbank vorbereiten

Stelle sicher, dass PostgreSQL läuft und erstelle die Datenbank:

```sql
CREATE DATABASE app_db;
CREATE USER app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
GRANT ALL ON SCHEMA public TO app_user;
```

### 4. Migrationen ausführen

```cmd
alembic upgrade head
```

### 5. Anwendung starten

```cmd
python src/main.py
```

Die API ist dann verfügbar unter:

- http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## LDAP-Integration aktivieren

1. In `.env` setzen:
   ```env
   LDAP_ENABLED=true
   LDAP_SYNC_ON_STARTUP=true
   LDAP_SERVER=ldap://your-ldap-server:389
   LDAP_BIND_DN=cn=admin,dc=example,dc=com
   LDAP_BIND_PASSWORD=your_password
   LDAP_BASE_DN=dc=example,dc=com
   ```

2. Beim nächsten Start werden automatisch alle LDAP-Benutzer synchronisiert.

3. Manuelle Synchronisation über API:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/users/sync-ldap
   ```

## API-Dokumentation

Die OpenAPI-Spezifikation befindet sich in `openapi.json`.

Um eine aktuelle Version zu generieren:

```cmd
python generate_openapi.py
```

## Troubleshooting

**Problem**: `ModuleNotFoundError: No module named 'ldap3'`
**Lösung**: `pip install -r requirements.txt`

**Problem**: `FATAL: database "app_db" does not exist`
**Lösung**: Datenbank in PostgreSQL erstellen (siehe Schritt 3)

**Problem**: `relation "users" does not exist`
**Lösung**: `alembic upgrade head` ausführen

**Problem**: LDAP-Verbindung schlägt fehl
**Lösung**: LDAP-Server-URL, Bind-DN und Passwort in `.env` prüfen

