# Backend – FastAPI + PostgreSQL + Alembic

Dieses Backend läuft lokal in einer PostgreSQL-Instanz und wird mit **PyCharm** gestartet.
Frontend liegt in einem separaten Ordner (`frontend/`), Backend-Code in `backend/src/`.

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

`.env` enthält deine lokalen DB-Daten (User, Passwort, DB-Name).

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

## 3. PyCharm Run/Debug Configs

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

## 4. API testen

### IDE-intern (`requests.http`)

Öffne die Datei `requests.http` in PyCharm und klicke auf „Run Request“.

### Curl-Beispiele

```bash
# User anlegen
curl -X POST http://127.0.0.1:8000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","full_name":"Alice"}'

# User lesen
curl http://127.0.0.1:8000/api/v1/users/1

# User-Liste
curl http://127.0.0.1:8000/api/v1/users?skip=0&limit=50
```

---

## 5. Projektstruktur

```
backend/
├── .env.example
├── requirements.txt
├── requests.http
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
└── src/
    ├── main.py
    ├── core/
    │   └── config.py
    ├── db/
    │   ├── base.py
    │   └── session.py
    ├── models/
    │   └── user.py
    ├── schemas/
    │   └── user.py
    ├── crud/
    │   └── user.py
    └── api/
        └── v1/
            └── users.py
```

---

## 6. Tipps & Troubleshooting

* **FATAL: database "app_db" does not exist** → Datenbank anlegen (siehe oben).
* **role "app_user" does not exist** → User in Postgres erstellen.
* **Connection refused** → PostgreSQL läuft nicht oder falscher Port in `.env`.
* **Alembic findet keine Modelle** → sicherstellen, dass alle Models in `src/db/base.py` importiert sind.
* **Pfadprobleme in PyCharm** → `PYTHONPATH=.` setzen und Working Directory auf `backend` stellen.

---

## 7. Nächste Schritte

* Neue Endpunkte → in `src/api/v1/` anlegen.
* Neue Models → in `src/models/` anlegen, dann in `src/db/base.py` importieren.
* Neue Schemas → in `src/schemas/` erstellen.
* Business-Logik → in `src/crud/` implementieren.
* Tests hinzufügen → `pytest`, `httpx`, `pytest-asyncio`.
* Auth einbauen → z. B. JWT mit `python-jose`.
