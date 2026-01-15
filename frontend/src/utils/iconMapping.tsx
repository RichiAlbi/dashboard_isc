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
} from '../components/icons'

/**
 * Icon mapping for widgets
 * Maps icon keys (stored in database) to React icon components
 */
export const ICON_MAP = {
  folder: <FolderIcon />,
  calendar: <CalendarIcon />,
  google: <GoogleIcon />,
  nextcloud: <NextcloudIcon />,
  lernsax: <LernsaxIcon />,
  ticket: <TicketIcon />,
  grid: <GridIcon />,
  school: <SchoolIcon />,
  list: <ListIcon />,
  news: <NewsIcon />,
} as const

/**
 * Valid icon keys for TypeScript type checking
 */
export type IconKey = keyof typeof ICON_MAP

/**
 * Get icon component by key with no fallback (returns null for invalid keys)
 * @param iconKey - The icon key from database (e.g., "folder", "calendar")
 * @returns React icon component or null if key is invalid/missing
 */
export function getIcon(iconKey: string | null | undefined): React.ReactNode {
  if (!iconKey || !(iconKey in ICON_MAP)) {
    return null // No icon shown for invalid/missing keys
  }
  return ICON_MAP[iconKey as IconKey]
}
