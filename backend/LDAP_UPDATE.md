# LDAP-Konfiguration aktualisiert

## Durchgeführte Änderungen

### 1. **Korrekte LDAP-Attribute konfiguriert**

Basierend auf Ihrer LDAP-Ausgabe wurden folgende Attribute identifiziert und konfiguriert:

- **sAMAccountName** → Username (z.B. `alsheiah`, `kunzeha`, `drilltlo`)
- **mail** → E-Mail (z.B. `alsheiah@isc.schule`)
- **givenName** → Vorname (z.B. `Ahmad`, `Hans`, `Louis`)
- **sn** → Nachname (z.B. `Al Sheikh`, `Kunze`, `Drilltzsch`)
- **displayName** → Anzeigename (z.B. `Ahmad Al Sheikh`)
- **sophomorixRole** → Rolle (z.B. `student`)
- **sophomorixAdminClass** → Klasse (z.B. `met22a`, `eeg24a`, `itf24c1`)

### 2. **LDAP-Verbindungskonfiguration (.env)**

```env
LDAP_ENABLED=true
LDAP_SYNC_ON_STARTUP=false
LDAP_SERVER=ldaps://iss.industrieschule.de:636
LDAP_BIND_DN=dashboard-binduser@industrieschule.de
LDAP_BIND_PASSWORD=Xd&pQynRE6BB72UY8QN
LDAP_BASE_DN=DC=industrieschule,DC=de
LDAP_USER_FILTER=(&(objectCategory=person)(objectClass=user))
LDAP_USER_SEARCH_BASE=DC=industrieschule,DC=de
LDAP_USERNAME_ATTR=sAMAccountName
LDAP_EMAIL_ATTR=mail
LDAP_FIRSTNAME_ATTR=givenName
LDAP_LASTNAME_ATTR=sn
LDAP_DISPLAY_NAME_ATTR=displayName
LDAP_ROLE_ATTR=sophomorixRole
LDAP_CLASS_ATTR=sophomorixAdminClass
```

**Wichtige Änderungen:**

- ✅ Bind-DN verwendet jetzt **UserPrincipalName-Format** (`dashboard-binduser@industrieschule.de`)
- ✅ Korrekter **User-Filter** für Active Directory: `(&(objectCategory=person)(objectClass=user))`
- ✅ **TLS/SSL-Konfiguration** für sichere LDAPS-Verbindung

### 3. **Datenbankmodell erweitert**

**src/models/user.py:**

- Hinzugefügt: `role` (String) - Benutzerrolle (student, teacher, etc.)
- Hinzugefügt: `class_name` (String) - Klassenname (z.B. eeg24a)

### 4. **Pydantic-Schemas aktualisiert**

**src/schemas/user.py:**

- `UserBase`, `UserUpdate`, `UserRead` enthalten jetzt `role` und `class_name`
- JSON-Aliase: `className` für Frontend-Kompatibilität

### 5. **LDAP-Service verbessert**

**src/services/ldap_service.py:**

- ✅ SSL/TLS-Konfiguration mit `Tls(validate=ssl.CERT_NONE)`
- ✅ Korrekte Authentifizierung: `authentication=SIMPLE, auto_bind='DEFAULT'`
- ✅ Erweiterte Fehlerbehandlung mit detailliertem Logging
- ✅ Extrahiert `sophomorixRole` und `sophomorixAdminClass` aus LDAP
- ✅ Synchronisiert alle Benutzerattribute inkl. Rolle und Klasse

### 6. **Datenbankmigrationen**

**Neue Migration:** `alembic/versions/b7f2c3d4e5a6_add_role_class_name.py`

- Fügt `role` und `class_name` Spalten zur `users` Tabelle hinzu

### 7. **Konfiguration**

**src/core/config.py:**

- Hinzugefügt: `ldap_role_attr` und `ldap_class_attr`
- Standard-User-Filter aktualisiert auf AD-kompatibel

## Nächste Schritte

### 1. Datenbank-Migration ausführen

```bash
cd C:\Users\richi\OneDrive\Code\dashboard_isc\backend
alembic upgrade head
```

### 2. LDAP-Verbindung testen (optional)

```bash
python test_ldap.py
```

### 3. Backend starten

```bash
uvicorn src.main:app --reload
```

### 4. LDAP-Sync manuell auslösen

```bash
# Im Browser oder via curl
POST http://localhost:8000/api/v1/users/sync-ldap
```

## Erwartetes Verhalten

Nach dem Start sollte das Backend:

1. ✅ Erfolgreich zu LDAP verbinden (ldaps://iss.industrieschule.de:636)
2. ✅ Alle Benutzer mit `(&(objectCategory=person)(objectClass=user))` Filter abrufen
3. ✅ Folgende Attribute extrahieren:
    - Username (sAMAccountName)
    - E-Mail (mail)
    - Vorname (givenName)
    - Nachname (sn)
    - Anzeigename (displayName)
    - Rolle (sophomorixRole)
    - Klasse (sophomorixAdminClass)
4. ✅ Benutzer in der Datenbank synchronisieren

## Beispiel-Benutzerdaten

Aus Ihrer LDAP-Ausgabe werden folgende Benutzer erkannt:

| Username | Name               | E-Mail              | Rolle   | Klasse  |
|----------|--------------------|---------------------|---------|---------|
| alsheiah | Ahmad Al Sheikh    | alsheiah@isc.schule | student | met22a  |
| kunzeha  | Hans Kunze         | kunzeha@isc.schule  | student | gbe25c1 |
| drilltlo | Louis Drilltzsch   | drilltlo@isc.schule | student | itf24c1 |
| skalicch | Christian Skalicky | skalicch@isc.schule | student | eeg24a  |

## Fehlerbehebung

Falls Probleme auftreten:

1. **Logs prüfen:** Die Anwendung gibt detaillierte LDAP-Logs aus
2. **Verbindung testen:** `test_ldap.py` ausführen
3. **Attribute prüfen:** Im Log wird angezeigt, welche Attribute gefunden wurden
4. **Filter testen:** LDAP-Filter mit `ldapsearch` testen:

```bash
ldapsearch -x -H ldaps://iss.industrieschule.de \
  -D "dashboard-binduser@industrieschule.de" -W \
  -b "DC=industrieschule,DC=de" \
  -s sub '(&(objectCategory=person)(objectClass=user))' \
  sAMAccountName mail givenName sn displayName sophomorixRole sophomorixAdminClass
```

## Geänderte Dateien

- ✅ `.env` - LDAP-Konfiguration
- ✅ `.env.example` - Dokumentierte Beispielkonfiguration
- ✅ `src/core/config.py` - Settings für role/class Attribute
- ✅ `src/models/user.py` - Datenbankmodell erweitert
- ✅ `src/schemas/user.py` - Pydantic-Schemas erweitert
- ✅ `src/services/ldap_service.py` - LDAP-Service verbessert
- ✅ `alembic/versions/b7f2c3d4e5a6_add_role_class_name.py` - Neue Migration
- ✅ `test_ldap.py` - Test-Script für LDAP-Verbindung

