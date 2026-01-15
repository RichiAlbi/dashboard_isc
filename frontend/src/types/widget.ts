/**
 * Widget type definitions matching backend schemas
 */

export interface Widget {
  widgetId: string
  target: string
  icon: string
  title: string
  color: string
  default: boolean
  allow_iframe: boolean
}

export interface WidgetCreate {
  target: string
  icon: string
  title: string
  color: string
  default?: boolean
  allow_iframe?: boolean
}

export interface WidgetUpdate {
  widgetId: string
  target?: string
  icon?: string
  title?: string
  color?: string
  default?: boolean
  allow_iframe?: boolean
}

/**
 * Widget position configuration stored in user_widget.config
 */
export interface WidgetPosition {
  x: number
  y: number
}

/**
 * Widget with user-specific configuration (for logged-in users)
 */
export interface UserWidget extends Widget {
  userId: string
  visible: boolean
  config: WidgetPosition | null
}

/**
 * Update payload for a single user widget (position and visibility)
 * userId is now in the path, not in the payload
 */
export interface UserWidgetUpdate {
  widgetId: string
  visible?: boolean
  config?: WidgetPosition
}

/**
 * Bulk update payload - wraps array of updates
 */
export interface UserWidgetBulkUpdate {
  widgets: UserWidgetUpdate[]
}
