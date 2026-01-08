# Dashboard Reverse Proxy mit LDAP Authentifizierung

Dieser Reverse Proxy verwendet nginx zusammen mit dem `nginx-ldap-auth-service` um LDAP-Authentifizierung bereitzustellen.

## Architektur

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Client    │──────│  nginx (Proxy)   │──────│   Frontend   │
│  (Browser)  │      │    Port 80/443   │      │   Port 80    │
└─────────────┘      └────────┬─────────┘      └──────────────┘
                              │
                     ┌────────┴─────────┐
                     │                  │
              ┌──────▼──────┐    ┌──────▼──────┐
              │   Backend   │    │  LDAP Auth  │
              │  Port 8000  │    │  Port 8888  │
              └─────────────┘    └──────┬──────┘
                                        │
                                 ┌──────▼──────┐
                                 │ LDAP/AD     │
                                 │   Server    │
                                 └─────────────┘
```

## Funktionsweise

1. **Frontend**: Öffentlich zugänglich - zeigt Benutzerliste aus LDAP
2. **Login Modal**: Benutzer wählt sich aus Liste, gibt Passwort ein
3. **Auth Request**: Frontend sendet `POST /api/auth/verify` mit `username` + `password`
4. **LDAP Verification**: nginx-ldap-auth-service prüft Credentials gegen LDAP
5. **Session Cookie**: Bei Erfolg wird ein Session-Cookie gesetzt
6. **API Zugriff**: Alle `/api/*` Requests werden via `auth_request` gegen den Auth-Service geprüft

## Setup auf der VM

### 1. Verzeichnis erstellen

```bash
mkdir -p /opt/disc/proxy/conf.d
cd /opt/disc/proxy
```

### 2. Dateien kopieren

```bash
# docker-compose.yml, nginx.conf, conf.d/default.conf kopieren
# .env.example nach .env kopieren und anpassen
cp .env.example .env
nano .env
```

### 3. .env konfigurieren

```bash
# Sichere Keys generieren
openssl rand -hex 32  # für SECRET_KEY
openssl rand -hex 32  # für CSRF_SECRET_KEY
```

Wichtige Einstellungen in `.env`:

```env
# Deine LDAP-Server Einstellungen
LDAP_URI=ldaps://dein-ldap-server:636
LDAP_BINDDN=CN=ServiceUser,OU=ServiceAccounts,DC=industrieschule,DC=de
LDAP_PASSWORD=dein-ldap-passwort
LDAP_BASEDN=DC=industrieschule,DC=de
```

### 4. Docker Network erstellen (falls nicht vorhanden)

```bash
docker network create dashboard_network
```

### 5. Starten

```bash
# Proxy starten
cd /opt/disc/proxy
docker-compose up -d

# Logs prüfen
docker-compose logs -f
```

## Frontend Anpassungen

Im Frontend muss die Login-Logik angepasst werden um den `/api/auth/verify` Endpoint zu nutzen:

### Option A: Direkte Form-Submission

```typescript
// In LoginModal.tsx oder authService.ts
async function verifyUser(username: string, password: string): Promise<boolean> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    credentials: 'include', // Wichtig für Session Cookie!
  });
  
  if (response.ok) {
    // Login erfolgreich - Session Cookie wurde gesetzt
    return true;
  } else if (response.status === 401) {
    // Falsches Passwort
    throw new Error('Ungültige Anmeldedaten');
  }
  throw new Error('Authentifizierung fehlgeschlagen');
}
```

### Option B: Mit authService.ts

Erstelle eine neue Datei `frontend/src/services/authService.ts`:

```typescript
const AUTH_ENDPOINTS = {
  verify: '/api/auth/verify',
  logout: '/api/auth/logout',
};

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function verifyCredentials(
  username: string, 
  password: string
): Promise<AuthResult> {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(AUTH_ENDPOINTS.verify, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      credentials: 'include',
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    return { 
      success: false, 
      error: response.status === 401 
        ? 'Ungültige Anmeldedaten' 
        : 'Authentifizierung fehlgeschlagen'
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Netzwerkfehler bei der Authentifizierung' 
    };
  }
}

export async function logout(): Promise<void> {
  await fetch(AUTH_ENDPOINTS.logout, {
    method: 'GET',
    credentials: 'include',
  });
}
```

### Im LoginModal verwenden

```typescript
import { verifyCredentials } from '../services/authService';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const result = await verifyCredentials(username, password);
  
  if (result.success) {
    onSubmit(username, password); // Original callback
  } else {
    setError(result.error);
  }
};
```

## API-Requests nach Login

Nach erfolgreichem Login wird das Session-Cookie automatisch bei allen Requests mitgesendet. Stelle sicher, dass `credentials: 'include'` bei allen fetch-Requests gesetzt ist:

```typescript
// In api.ts
const response = await fetch(url, {
  ...options,
  credentials: 'include', // Session Cookie mitsenden
  headers: {
    'Content-Type': 'application/json',
    ...options?.headers,
  },
});
```

## Troubleshooting

### Logs prüfen

```bash
# nginx Proxy Logs
docker logs dashboard_proxy

# LDAP Auth Service Logs
docker logs dashboard_ldap_auth
```

### LDAP Verbindung testen

```bash
# Im ldap-auth Container
docker exec -it dashboard_ldap_auth sh
ldapsearch -H ldaps://your-ldap-server:636 -D "your-bind-dn" -w "password" -b "dc=domain,dc=local"
```

### Cookie nicht gesetzt?

- Prüfe ob `credentials: 'include'` gesetzt ist
- Prüfe CORS Headers
- Prüfe Browser DevTools → Application → Cookies

## SSL/HTTPS (empfohlen für Produktion)

Für HTTPS, füge Zertifikate hinzu und passe `conf.d/default.conf` an:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    
    # ... rest der config
}

# HTTP zu HTTPS Redirect
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```
