import React from 'react'
import {
    FolderIcon,
    CalendarIcon,
    GridIcon,
    SchoolIcon,
    ListIcon,
    NewsIcon,
    GoogleIcon,
    NextcloudIcon,
    LernsaxIcon,
    TicketIcon,
    ConsoleIcon,
    DoorIcon,
} from '../components/icons'

// ─── File-based icon assets ───────────────────────────────────────────────────
// To add a new icon: drop the file into src/assets/icons/, add an import below,
// add an entry to IMAGE_ICON_MAP, and add a German display name to ICON_NAMES.
import webuntisIcon from '../assets/icons/webuntis.svg'

// ─── Code-generated icons (inline SVG components) ────────────────────────────

const CODE_ICON_MAP = {
  folder:    <FolderIcon />,
  calendar:  <CalendarIcon />,
  google:    <GoogleIcon />,
  nextcloud: <NextcloudIcon />,
  lernsax:   <LernsaxIcon />,
  ticket:    <TicketIcon />,
  console:   <ConsoleIcon />,
  door:      <DoorIcon />,
  grid:      <GridIcon />,
  school:    <SchoolIcon />,
  list:      <ListIcon />,
  news:      <NewsIcon />,
} as const

type CodeIconKey = keyof typeof CODE_ICON_MAP

// ─── File-based icons (image assets) ─────────────────────────────────────────

const IMAGE_ICON_MAP = {
  webuntis: webuntisIcon,
} as const

type ImageIconKey = keyof typeof IMAGE_ICON_MAP

// ─── Combined API ─────────────────────────────────────────────────────────────

/**
 * All valid icon keys (both code-generated and file-based).
 * This is the value stored in the widget's `icon` field in the database.
 */
export type IconKey = CodeIconKey | ImageIconKey

export const ICON_KEYS: IconKey[] = [
  ...(Object.keys(CODE_ICON_MAP) as CodeIconKey[]),
  ...(Object.keys(IMAGE_ICON_MAP) as ImageIconKey[]),
]

/**
 * Human-readable German display names for each icon key.
 */
export const ICON_NAMES: Record<IconKey, string> = {
  // Code icons
  folder:    'Ordner',
  calendar:  'Kalender',
  google:    'Google',
  nextcloud: 'Nextcloud',
  lernsax:   'LernSax',
  ticket:    'Ticket',
  console:   'Konsole',
  door:      'Tür',
  grid:      'Raster',
  school:    'Schule',
  list:      'Liste',
  news:      'Neuigkeiten',
  // File-based icons
  webuntis:  'WebUntis',
}

/**
 * Get icon element by key with no fallback (returns null for invalid keys).
 * Handles both inline SVG components and file-based image icons.
 * @param iconKey - The icon key from database (e.g., "folder", "webuntis")
 * @returns React icon element or null if key is invalid/missing
 */
export function getIcon(iconKey: string | null | undefined): React.ReactNode {
  if (!iconKey) return null

  if (iconKey in CODE_ICON_MAP) {
    return CODE_ICON_MAP[iconKey as CodeIconKey]
  }

  if (iconKey in IMAGE_ICON_MAP) {
    return (
      <img
        src={IMAGE_ICON_MAP[iconKey as ImageIconKey]}
        alt={iconKey}
        className="icon-image-asset"
      />
    )
  }

  return null
}

// Keep backward-compatible export (was previously the only map)
/** @deprecated Use ICON_KEYS / getIcon() instead */
export const ICON_MAP = CODE_ICON_MAP
