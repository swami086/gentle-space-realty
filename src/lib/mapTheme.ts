/**
 * Map Theme Constants
 * Centralized styling and theming for Google Maps Static API integration
 */

/**
 * Color constants for map overlays and UI elements
 */
export const MAP_COLORS = {
  // Primary colors (Material Design Blue palette)
  primary: {
    stroke: '0x1976D2',      // Material Blue 700
    fill: '0x1976D2',        // Same as stroke for consistency
    strokeOpacity: 0.8,
    fillOpacity: 0.15
  },
  
  // Alternative color schemes for different contexts
  secondary: {
    stroke: '0x388E3C',      // Material Green 700
    fill: '0x388E3C',
    strokeOpacity: 0.8,
    fillOpacity: 0.15
  },
  
  warning: {
    stroke: '0xF57C00',      // Material Orange 700
    fill: '0xF57C00',
    strokeOpacity: 0.8,
    fillOpacity: 0.15
  },
  
  // UI feedback colors
  error: {
    stroke: '0xD32F2F',      // Material Red 700
    fill: '0xD32F2F',
    strokeOpacity: 0.8,
    fillOpacity: 0.15
  }
} as const;

/**
 * Circle overlay styling options
 */
export const CIRCLE_OVERLAY_STYLES = {
  default: {
    strokeColor: MAP_COLORS.primary.stroke,
    strokeOpacity: MAP_COLORS.primary.strokeOpacity,
    strokeWeight: 2,
    fillColor: MAP_COLORS.primary.fill,
    fillOpacity: MAP_COLORS.primary.fillOpacity
  },
  
  highlighted: {
    strokeColor: MAP_COLORS.secondary.stroke,
    strokeOpacity: MAP_COLORS.secondary.strokeOpacity,
    strokeWeight: 3,
    fillColor: MAP_COLORS.secondary.fill,
    fillOpacity: MAP_COLORS.secondary.fillOpacity
  },
  
  warning: {
    strokeColor: MAP_COLORS.warning.stroke,
    strokeOpacity: MAP_COLORS.warning.strokeOpacity,
    strokeWeight: 2,
    fillColor: MAP_COLORS.warning.fill,
    fillOpacity: MAP_COLORS.warning.fillOpacity
  }
} as const;

/**
 * Map style configurations for different contexts
 */
export const MAP_STYLES = {
  property: {
    zoom: 12, // Zoomed out to show more area
    size: '300x150',
    maptype: 'roadmap' as const,
    scale: 2 as const
  },
  propertyCard: {
    zoom: 11, // Zoomed out to make 1km circle appear smaller
    size: '280x120',
    maptype: 'roadmap' as const,
    scale: 2 as const
  },
  modal: {
    zoom: 13, // Zoomed out for modal view
    size: '500x300',
    maptype: 'roadmap' as const,
    scale: 2 as const
  },
  
  // Additional contexts
  thumbnail: {
    zoom: 13,
    size: '150x100',
    maptype: 'roadmap' as const,
    scale: 2 as const
  },
  
  fullscreen: {
    zoom: 17,
    size: '800x600',
    maptype: 'roadmap' as const,
    scale: 2 as const
  }
} as const;

/**
 * UI theme constants for map components
 */
export const MAP_UI_THEME = {
  // Loading states
  loading: {
    backgroundColor: 'bg-gray-100',
    spinnerColor: 'text-gray-500',
    textColor: 'text-gray-500'
  },
  
  // Error states
  error: {
    backgroundColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    iconColor: 'text-gray-400',
    textColor: 'text-gray-500',
    warningColor: 'text-orange-600'
  },
  
  // Interactive states
  interactive: {
    hoverBackground: 'hover:bg-gray-50',
    cursor: 'cursor-pointer',
    linkColor: 'text-blue-600',
    linkHoverColor: 'hover:text-blue-700'
  },
  
  // Overlay indicators
  overlay: {
    radiusIndicator: {
      background: 'bg-black bg-opacity-60',
      textColor: 'text-white',
      borderRadius: 'rounded',
      padding: 'px-2 py-1',
      fontSize: 'text-xs'
    },
    
    interactionHint: {
      background: 'bg-white bg-opacity-90',
      borderRadius: 'rounded-full',
      padding: 'p-1',
      iconColor: 'text-gray-700'
    }
  }
} as const;

/**
 * Default circle overlay options using theme constants
 */
export const DEFAULT_CIRCLE_OVERLAY = CIRCLE_OVERLAY_STYLES.default;

/**
 * Get circle overlay style by type
 */
export function getCircleOverlayStyle(
  type: keyof typeof CIRCLE_OVERLAY_STYLES = 'default'
) {
  return CIRCLE_OVERLAY_STYLES[type];
}

/**
 * Get map style configuration by context
 */
export function getMapStyle(
  context: keyof typeof MAP_STYLES = 'property'
) {
  return MAP_STYLES[context];
}