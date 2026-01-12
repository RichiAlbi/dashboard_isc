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
}

export interface WidgetCreate {
  target: string
  icon: string
  title: string
  color: string
  default?: boolean
}

export interface WidgetUpdate {
  widgetId: string
  target?: string
  icon?: string
  title?: string
  color?: string
  default?: boolean
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
 * Update payload for user widget (position and visibility)
 */
export interface UserWidgetUpdate {
  userId: string
  widgetId: string
  visible?: boolean
  config?: WidgetPosition
}
