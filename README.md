# Webanwendung

## Features

- Dashboard zur Verwaltung von **Lehreraufgaben/-diensten**
- Anmeldung mit **Schulbenutzer**
  - Apps/Widgets werden eingeloggt geöffnet (**SSO: Single Sign On**)
  - Datensicherheit
  - modular & erweiterbar
- Dokumentation

## Farbthema

- Corporate Design Herr Rein

## Tech Stack

- Versionsmanagement: **GitHub**

### Electron App

- **Frontend**: React + Vite (JavaScript, Bundler)  
  → NodeJS (Chromium-Browser-basiert)
- **Backend**: Java / Kotlin / Python
- **Kundenabsprache**: Login-Möglichkeiten für Schulweb

---

## Funktionsumfang

- Profil vom **IDP**
- zentraler Zugriff (Dashboard) auf alle benötigten Systeme (Absprache)
- intuitive, übersichtliche GUI

---

## Widgets

### Öffentlich

- **Schul-Homepage**: [industrieschule.de](https://industrieschule.de)  
- **Vertretungsplan**: [system-kiosk.industrieschule.de/tv](https://system-kiosk.industrieschule.de/tv)

### Mit Login

- **Schulportal Sachsen**: [login.schule.sachsen.de](https://login.schule.sachsen.de)  
  → Login über Schullogin IDP (oder manuell)
- **Lernsax**: [lernsax.de](https://lernsax.de)  
  → Anmeldung über Schullogin IDP

### LDAP / Auth Proxy

- **Raumplansystem**: [mrbs.industrieschule.de](https://mrbs.industrieschule.de) → Anmeldung über Auth Proxy
- **Ticketsystem**: [ticket.industrieschule.de](https://ticket.industrieschule.de) → Anmeldung über Auth Proxy (?)
- **Schulkonsole**: [iss.industrieschule.de](https://iss.industrieschule.de) → Anmeldung über Auth Proxy (?)
- **Nextcloud**: [nextcloud.industrieschule.de](https://nextcloud.industrieschule.de) → Anmeldung über OIDC/SAML oder Auth Proxy
- optionale weitere Widgets (z. B. **News, Notizen, …**)
