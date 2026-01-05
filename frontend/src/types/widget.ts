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
 * Widget with user-specific configuration (for logged-in users)
 */
export interface UserWidget extends Widget {
  userId: string
  visible: boolean
  config: Record<string, unknown> | null
}
