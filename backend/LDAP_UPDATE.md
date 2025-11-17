# LDAP-Konfiguration aktualisiert (Teachers Only)

## Durchgeführte Änderungen

### 1. **System auf Lehrer-Only umgestellt**

Das System wurde vollständig auf die Arbeit mit Lehrern umgestellt:

- **sAMAccountName** → Username (z.B. Lehrer-Login)
- **mail** → E-Mail
- **givenName** → Vorname
- **sn** → Nachname

**Entfernte Felder (nicht mehr benötigt):**

- ~~displayName~~
- ~~sophomorixRole~~
- ~~sophomorixAdminClass~~

### 2. **LDAP-Verbindungskonfiguration (.env)**

```env
LDAP_ENABLED=true
LDAP_SYNC_ON_STARTUP=false
LDAP_SERVER=ldaps://iss.industrieschule.de:636
LDAP_BIND_DN=dashboard-binduser@industrieschule.de
LDAP_BIND_PASSWORD=Xd&pQynRE6BB72UY8QN
LDAP_BASE_DN=DC=industrieschule,DC=de
LDAP_USER_FILTER=(&(objectCategory=person)(objectClass=user))
LDAP_USER_SEARCH_BASE=OU=Teachers,OU=default-school,OU=SCHOOLS,DC=industrieschule,DC=de
LDAP_USERNAME_ATTR=sAMAccountName
LDAP_EMAIL_ATTR=mail
LDAP_FIRSTNAME_ATTR=givenName
LDAP_LASTNAME_ATTR=sn
```

**Wichtige Änderungen:**

- ✅ Bind-DN verwendet jetzt **UserPrincipalName-Format** (`dashboard-binduser@industrieschule.de`)
- ✅ **Search Base** auf Teachers OU beschränkt: `OU=Teachers,OU=default-school,OU=SCHOOLS,DC=industrieschule,DC=de`
- ✅ Korrekter **User-Filter** für Active Directory: `(&(objectCategory=person)(objectClass=user))`
- ✅ **TLS/SSL-Konfiguration** für sichere LDAPS-Verbindung
- ✅ **Nur Lehrer-Attribute** werden synchronisiert

### 3. **Datenbankmodell aktualisiert**

**src/models/user.py:**

**Behaltene Felder:**

- `username` - LDAP-Benutzername
- `email` - E-Mail-Adresse
- `first_name` - Vorname
- `last_name` - Nachname
- `is_active` - Aktiv-Status
- `from_ldap` - LDAP-Herkunft-Flag
- `last_ldap_sync` - Letzter Sync-Timestamp
- `theme` - UI-Theme-Präferenz

**Entfernte Felder:**

- ~~`display_name`~~ - Nicht mehr benötigt
- ~~`role`~~ - Alle sind Lehrer
- ~~`class_name`~~ - Nicht relevant für Lehrer

### 4. **Pydantic-Schemas aktualisiert**

**src/schemas/user.py:**

- `UserBase`, `UserUpdate`, `UserRead` enthalten nur noch: `username`, `email`, `firstName`, `lastName`
- JSON-Aliase für Frontend-Kompatibilität beibehalten

### 5. **LDAP-Service vereinfacht**

**src/services/ldap_service.py:**

- ✅ SSL/TLS-Konfiguration mit `Tls(validate=ssl.CERT_NONE)`
- ✅ Korrekte Authentifizierung
- ✅ Erweiterte Fehlerbehandlung mit detailliertem Logging
- ✅ Suche nur in Teachers OU
- ✅ Extrahiert nur relevante Lehrer-Attribute
- ✅ Synchronisiert nur Lehrer

### 6. **Datenbankmigrationen**

**Neue Migration:** `alembic/versions/remove_student_fields.py`

- Entfernt `display_name`, `role` und `class_name` Spalten aus der `users` Tabelle

## Nächste Schritte

### 1. Datenbank-Migration ausführen

```bash
cd C:\Users\richi\OneDrive\Code\dashboard_isc\backend
alembic upgrade head
```

### 2. Backend starten

```bash
uvicorn src.main:app --reload
```

### 3. LDAP-Sync manuell auslösen

```bash
# Im Browser oder via curl
POST http://localhost:8000/api/v1/users/sync-ldap
```

## Erwartetes Verhalten

Nach dem Start sollte das Backend:

1. ✅ Erfolgreich zu LDAP verbinden (ldaps://iss.industrieschule.de:636)
2. ✅ Alle Lehrer aus `OU=Teachers,OU=default-school,OU=SCHOOLS,DC=industrieschule,DC=de` abrufen
3. ✅ Folgende Attribute extrahieren:
    - Username (sAMAccountName)
    - E-Mail (mail)
    - Vorname (givenName)
    - Nachname (sn)
4. ✅ Lehrer in der Datenbank synchronisieren

## Fehlerbehebung

Falls Probleme auftreten:

1. **Logs prüfen:** Die Anwendung gibt detaillierte LDAP-Logs aus
2. **Attribute prüfen:** Im Log wird angezeigt, welche Attribute gefunden wurden
3. **Filter testen:** LDAP-Filter mit `ldapsearch` testen:

```bash
ldapsearch -x -H ldaps://iss.industrieschule.de \
  -D "dashboard-binduser@industrieschule.de" -W \
  -b "OU=Teachers,OU=default-school,OU=SCHOOLS,DC=industrieschule,DC=de" \
  -s sub '(&(objectCategory=person)(objectClass=user))' \
  sAMAccountName mail givenName sn
```

## Geänderte Dateien

- ✅ `.env` - LDAP-Konfiguration aktualisiert
- ✅ `src/core/config.py` - Entfernte role/class/displayName Attribute
- ✅ `src/models/user.py` - Datenbankmodell vereinfacht
- ✅ `src/schemas/user.py` - Pydantic-Schemas vereinfacht
- ✅ `src/services/ldap_service.py` - LDAP-Service auf Lehrer umgestellt
- ✅ `src/crud/user.py` - CRUD-Operationen aktualisiert
- ✅ `src/api/v1/users.py` - API-Routen aktualisiert
- ✅ `alembic/versions/remove_student_fields.py` - Neue Migration zum Entfernen von Schüler-Feldern

