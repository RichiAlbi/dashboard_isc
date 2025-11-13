"""
LDAP Service für Benutzer-Synchronisation
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
from ldap3 import Server, Connection, ALL, SUBTREE, Tls
import ssl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from models.user import User

logger = logging.getLogger(__name__)


class LDAPService:
    def __init__(self):
        self.enabled = settings.ldap_enabled
        if not self.enabled:
            logger.info("LDAP ist deaktiviert")
            return

        # TLS-Konfiguration für LDAPS (nicht für STARTTLS)
        # LDAPS verwendet bereits SSL, daher nur für Zertifikatsvalidierung
        tls_configuration = Tls(
            validate=ssl.CERT_NONE,
            version=ssl.PROTOCOL_TLS,
            ca_certs_file=None
        )

        # Server ohne TLS, da ldaps:// bereits verschlüsselt ist
        self.server = Server(
            settings.ldap_server,
            get_info=ALL,
            use_ssl=True,
            tls=tls_configuration
        )
        self.bind_dn = settings.ldap_bind_dn
        self.bind_password = settings.ldap_bind_password
        self.base_dn = settings.ldap_base_dn
        self.user_filter = settings.ldap_user_filter
        self.search_base = settings.ldap_user_search_base or self.base_dn

        # Attribute Mappings
        self.username_attr = settings.ldap_username_attr
        self.email_attr = settings.ldap_email_attr
        self.firstname_attr = settings.ldap_firstname_attr
        self.lastname_attr = settings.ldap_lastname_attr
        self.display_name_attr = settings.ldap_display_name_attr
        self.role_attr = settings.ldap_role_attr
        self.class_attr = settings.ldap_class_attr

        logger.info(f"LDAP konfiguriert: Server={settings.ldap_server}, Base DN={self.base_dn}")

    def _get_connection(self) -> Optional[Connection]:
        """Erstellt eine LDAP-Verbindung"""
        if not self.enabled:
            return None

        try:
            logger.debug(f"Verbinde zu LDAP Server: {settings.ldap_server}")
            logger.debug(f"Bind DN: {self.bind_dn}")

            conn = Connection(
                self.server,
                user=self.bind_dn,
                password=self.bind_password,
                auto_bind='NONE',
                raise_exceptions=True
            )

            # Manuell binden
            if not conn.bind():
                logger.error(f"LDAP Bind fehlgeschlagen: {conn.result}")
                return None

            logger.info("LDAP-Verbindung erfolgreich hergestellt")
            return conn
        except Exception as e:
            logger.error(f"LDAP-Verbindung fehlgeschlagen: {e}", exc_info=True)
            logger.error(f"Server: {settings.ldap_server}")
            logger.error(f"Bind DN: {self.bind_dn}")
            return None

    def get_all_users(self) -> List[Dict[str, any]]:
        """Holt alle Benutzer aus LDAP"""
        if not self.enabled:
            return []

        conn = self._get_connection()
        if not conn:
            return []

        users = []
        try:
            logger.info(f"Starte LDAP-Suche: Base={self.search_base}, Filter={self.user_filter}")

            conn.search(
                search_base=self.search_base,
                search_filter=self.user_filter,
                search_scope=SUBTREE,
                attributes=[
                    self.username_attr,
                    self.email_attr,
                    self.firstname_attr,
                    self.lastname_attr,
                    self.display_name_attr,
                    self.role_attr,
                    self.class_attr,
                    'cn',  # Zum Debuggen
                    'objectClass'  # Zum Debuggen
                ]
            )

            logger.info(f"{len(conn.entries)} LDAP-Einträge gefunden")

            for entry in conn.entries:
                user_data = {
                    'username': self._get_attr(entry, self.username_attr),
                    'email': self._get_attr(entry, self.email_attr),
                    'first_name': self._get_attr(entry, self.firstname_attr),
                    'last_name': self._get_attr(entry, self.lastname_attr),
                    'display_name': self._get_attr(entry, self.display_name_attr),
                    'role': self._get_attr(entry, self.role_attr),
                    'class_name': self._get_attr(entry, self.class_attr),
                }

                # Nur Benutzer mit username hinzufügen
                if user_data['username']:
                    users.append(user_data)
                else:
                    cn = self._get_attr(entry, 'cn')
                    logger.debug(f"Überspringe Eintrag ohne sAMAccountName: cn={cn}")

            logger.info(f"{len(users)} gültige Benutzer aus LDAP extrahiert")
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der LDAP-Benutzer: {e}", exc_info=True)
        finally:
            conn.unbind()

        return users

    def get_user_by_username(self, username: str) -> Optional[Dict[str, any]]:
        """Holt einen einzelnen Benutzer aus LDAP"""
        if not self.enabled:
            return None

        conn = self._get_connection()
        if not conn:
            return None

        user_data = None
        try:
            search_filter = f"(&{self.user_filter}({self.username_attr}={username}))"
            logger.debug(f"Suche Benutzer: {username} mit Filter: {search_filter}")

            conn.search(
                search_base=self.search_base,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=[
                    self.username_attr,
                    self.email_attr,
                    self.firstname_attr,
                    self.lastname_attr,
                    self.display_name_attr,
                    self.role_attr,
                    self.class_attr
                ]
            )

            if len(conn.entries) > 0:
                entry = conn.entries[0]
                user_data = {
                    'username': self._get_attr(entry, self.username_attr),
                    'email': self._get_attr(entry, self.email_attr),
                    'first_name': self._get_attr(entry, self.firstname_attr),
                    'last_name': self._get_attr(entry, self.lastname_attr),
                    'display_name': self._get_attr(entry, self.display_name_attr),
                    'role': self._get_attr(entry, self.role_attr),
                    'class_name': self._get_attr(entry, self.class_attr),
                }
                logger.info(f"Benutzer {username} in LDAP gefunden")
            else:
                logger.warning(f"Benutzer {username} nicht in LDAP gefunden")
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des LDAP-Benutzers {username}: {e}", exc_info=True)
        finally:
            conn.unbind()

        return user_data

    def _get_attr(self, entry, attr_name: str) -> Optional[str]:
        """Holt ein Attribut aus einem LDAP-Entry"""
        try:
            if hasattr(entry, attr_name):
                value = getattr(entry, attr_name).value
                if isinstance(value, list) and len(value) > 0:
                    return str(value[0]) if value[0] else None
                elif value:
                    return str(value)
        except Exception as e:
            logger.debug(f"Konnte Attribut {attr_name} nicht extrahieren: {e}")
        return None

    async def sync_users(self, db: AsyncSession) -> Dict[str, int]:
        """
        Synchronisiert LDAP-Benutzer mit der Datenbank
        - Fügt neue Benutzer hinzu
        - Aktualisiert bestehende Benutzer
        - Deaktiviert Benutzer, die nicht mehr im LDAP sind
        """
        if not self.enabled:
            logger.info("LDAP-Sync übersprungen (deaktiviert)")
            return {"added": 0, "updated": 0, "deactivated": 0}

        logger.info("Starte LDAP-Benutzer-Synchronisation...")

        # Hole alle LDAP-Benutzer
        ldap_users = self.get_all_users()
        ldap_usernames = {u['username'] for u in ldap_users}

        # Hole alle DB-Benutzer, die aus LDAP stammen
        stmt = select(User).where(User.from_ldap == True)
        result = await db.execute(stmt)
        db_users = result.scalars().all()

        stats = {"added": 0, "updated": 0, "deactivated": 0}
        current_time = datetime.utcnow()

        # Erstelle Mapping username -> DB User
        db_user_map = {u.username: u for u in db_users if u.username}

        # Neue und aktualisierte Benutzer
        for ldap_user in ldap_users:
            username = ldap_user['username']

            if username in db_user_map:
                # Benutzer existiert -> aktualisieren
                db_user = db_user_map[username]
                db_user.email = ldap_user.get('email')
                db_user.first_name = ldap_user.get('first_name')
                db_user.last_name = ldap_user.get('last_name')
                db_user.display_name = ldap_user.get('display_name')
                db_user.role = ldap_user.get('role')
                db_user.class_name = ldap_user.get('class_name')
                db_user.is_active = True
                db_user.last_ldap_sync = current_time
                stats["updated"] += 1
            else:
                # Neuer Benutzer -> anlegen
                new_user = User(
                    username=username,
                    email=ldap_user.get('email'),
                    first_name=ldap_user.get('first_name'),
                    last_name=ldap_user.get('last_name'),
                    display_name=ldap_user.get('display_name'),
                    role=ldap_user.get('role'),
                    class_name=ldap_user.get('class_name'),
                    from_ldap=True,
                    is_active=True,
                    last_ldap_sync=current_time
                )
                db.add(new_user)
                stats["added"] += 1

        # Deaktiviere Benutzer, die nicht mehr im LDAP sind
        for db_user in db_users:
            if db_user.username not in ldap_usernames and db_user.is_active:
                db_user.is_active = False
                stats["deactivated"] += 1

        await db.commit()

        logger.info(
            f"LDAP-Sync abgeschlossen: "
            f"{stats['added']} hinzugefügt, "
            f"{stats['updated']} aktualisiert, "
            f"{stats['deactivated']} deaktiviert"
        )

        return stats


# Singleton-Instanz
ldap_service = LDAPService()
