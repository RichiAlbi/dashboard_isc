# Backend – FastAPI + PostgreSQL + Alembic + LDAP

Dieses Backend läuft lokal in einer PostgreSQL-Instanz und wird mit **PyCharm** gestartet.
Frontend liegt in einem separaten Ordner (`frontend/`), Backend-Code in `backend/src/`.

Das Backend unterstützt **LDAP-Integration** für die Benutzer-Synchronisation.

---

## 1. Setup

### Virtuelle Umgebung erstellen

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# Linux/macOS
source .venv/bin/activate
```

### Dependencies installieren

```bash
pip install -r requirements.txt
```

### .env anlegen

```bash
cp .env.example .env
```

`.env` enthält deine lokalen DB-Daten (User, Passwort, DB-Name) sowie LDAP-Konfiguration.

---

## 2. PostgreSQL vorbereiten

Beispiel (psql):

```sql
CREATE DATABASE app_db;
CREATE USER app_user WITH PASSWORD 'app_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
```

Standardwerte findest du in `.env.example`.

---

## 3. LDAP-Integration

### Konfiguration

Die LDAP-Integration wird über Umgebungsvariablen in der `.env`-Datei konfiguriert:

```env
# LDAP aktivieren/deaktivieren
LDAP_ENABLED=true

# Automatische Synchronisation beim Startup
LDAP_SYNC_ON_STARTUP=true

# LDAP-Server
LDAP_SERVER=ldap://ldap.example.com:389

# Bind-Credentials
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=admin_password

# Such-Basis
LDAP_BASE_DN=dc=example,dc=com
LDAP_USER_SEARCH_BASE=ou=users,dc=example,dc=com

# Filter und Attribute
LDAP_USER_FILTER=(objectClass=person)
LDAP_USERNAME_ATTR=sAMAccountName
LDAP_EMAIL_ATTR=mail
LDAP_FIRSTNAME_ATTR=givenName
LDAP_LASTNAME_ATTR=sn
LDAP_DISPLAY_NAME_ATTR=displayName
```

### Funktionsweise

1. **Automatische Synchronisation beim Start:**
   Wenn `LDAP_SYNC_ON_STARTUP=true` gesetzt ist, werden beim Start der Anwendung alle LDAP-Benutzer mit der Datenbank
   synchronisiert:
    - Neue Benutzer aus LDAP werden zur Datenbank hinzugefügt
    - Bestehende Benutzer werden aktualisiert
    - Benutzer, die nicht mehr im LDAP vorhanden sind, werden deaktiviert

2. **Manuelle Synchronisation:**
   Über den API-Endpoint `POST /api/v1/users/sync-ldap` kann jederzeit eine manuelle Synchronisation angestoßen werden.

3. **LDAP-Daten beim Abrufen:**
   Wenn ein einzelner Benutzer über `GET /api/v1/users/{user_id}` abgerufen wird und LDAP aktiviert ist, werden die
   aktuellsten LDAP-Daten in die Response integriert.

### LDAP-Felder im User-Model

Das User-Model wurde um folgende Felder erweitert:

- `username`: LDAP-Benutzername
- `email`: E-Mail-Adresse
- `first_name`: Vorname
- `last_name`: Nachname
- `display_name`: Anzeigename
- `is_active`: Aktiv-Status
- `from_ldap`: Flag, ob Benutzer aus LDAP stammt
- `last_ldap_sync`: Zeitstempel der letzten Synchronisation

---

## 4. PyCharm Run/Debug Configs

### 🚀 API starten (Uvicorn über main.py)

1. **Add Configuration** → **Python**
2. Name: `Run API`
3. Script path: `backend/src/main.py`
4. Parameters: *(leer lassen)*
5. Working directory: `backend`
6. Environment variables:

    * `PYTHONPATH=.`
7. Optional: *Add content roots to PYTHONPATH* anhaken

Dann kannst du die API mit ▶️ starten.

Swagger-UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
OpenAPI-Schema: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

### 🔄 Migrationen (Alembic)

#### In PyCharm

1. **Add Configuration** → **Python**
2. Name: `Alembic`
3. Script path: `${backend}/.venv/bin/alembic` (Linux/macOS)
   oder `${backend}\.venv\Scripts\alembic.exe` (Windows)
4. Parameters: `upgrade head`
5. Working directory: `backend`
6. Environment variables:

    * `PYTHONPATH=.`

#### Wichtige Befehle (Terminal im Ordner `backend/`)

```bash
# Neue Migration erstellen
alembic revision --autogenerate -m "initial"

# Migration anwenden
alembic upgrade head

# Migration zurückrollen
alembic downgrade -1
```

---

## 5. API testen

### IDE-intern (`requests.http`)

Öffne die Datei `requests.http` in PyCharm und klicke auf „Run Request".

### Curl-Beispiele

```bash
# User anlegen
curl -X POST http://127.0.0.1:8000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","firstName":"Alice","lastName":"Smith"}'

# User lesen
curl http://127.0.0.1:8000/api/v1/users/{user_id}

# User-Liste
curl "http://127.0.0.1:8000/api/v1/users?q=alice&limit=50&offset=0"

# LDAP-Synchronisation manuell auslösen
curl -X POST http://127.0.0.1:8000/api/v1/users/sync-ldap
```

---

## 6. Projektstruktur

```
backend/
├── .env.example
├── requirements.txt
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── 3e756fb37186_init.py
│       └── add_ldap_fields.py
└── src/
    ├── __init__.py
    ├── main.py
    ├── core/
    │   └── config.py
    ├── db/
    │   ├── base.py
    │   └── session.py
    ├── models/
    │   ├── user.py
    │   ├── widget.py
    │   ├── user_widget.py
    │   ├── news.py
    │   └── settings.py
    ├── schemas/
    │   ├── user.py
    │   ├── widget.py
    │   ├── user_widget.py
    │   ├── news.py
    │   └── settings.py
    ├── crud/
    │   ├── user.py
    │   ├── widget.py
    │   ├── user_widget.py
    │   ├── news.py
    │   └── settings.py
    ├── services/
    │   ├── __init__.py
    │   └── ldap_service.py
    └── api/
        └── v1/
            ├── deps.py
            ├── users.py
            ├── widgets.py
            ├── widget.py
            ├── newsfeed.py
            └── settings.py
```

---

## 7. Tipps & Troubleshooting

* **FATAL: database "app_db" does not exist** → Datenbank anlegen (siehe oben).
* **role "app_user" does not exist** → User in Postgres erstellen.
* **Connection refused** → PostgreSQL läuft nicht oder falscher Port in `.env`.
* **Alembic findet keine Modelle** → sicherstellen, dass alle Models in `src/db/base.py` importiert sind.
* **Pfadprobleme in PyCharm** → `PYTHONPATH=.` setzen und Working Directory auf `backend` stellen.
* **LDAP-Verbindung schlägt fehl** → LDAP-Server-URL, Bind-DN und Passwort in `.env` prüfen.
* **Module 'ldap3' not found** → `pip install -r requirements.txt` ausführen.

---

## 8. API-Dokumentation

Die API-Dokumentation ist automatisch über Swagger UI verfügbar:

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc
- **OpenAPI Schema**: http://127.0.0.1:8000/openapi.json

Eine statische OpenAPI-Spezifikation befindet sich in `openapi.json`.

---

## 9. Nächste Schritte

* Neue Endpunkte → in `src/api/v1/` anlegen.
* Neue Models → in `src/models/` anlegen, dann in `src/db/base.py` importieren.
* Neue Schemas → in `src/schemas/` erstellen.
* Business-Logik → in `src/crud/` implementieren.
* Tests hinzufügen → `pytest`, `httpx`, `pytest-asyncio`.
* Auth einbauen → z. B. JWT mit `python-jose` oder LDAP-Authentifizierung erweitern.
