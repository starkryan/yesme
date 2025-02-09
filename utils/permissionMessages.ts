export const PERMISSION_MESSAGES = {
  STORAGE: {
    REQUEST: 'Storage access is needed to save and share files',
    DENIED: 'Storage permission was denied. Some features may be limited',
    BLOCKED: 'Storage permission is blocked. Please enable it in settings',
  },
  CAMERA: {
    REQUEST: 'Camera access is needed for this feature',
    DENIED: 'Camera permission was denied. Some features may be limited',
    BLOCKED: 'Camera permission is blocked. Please enable it in settings',
  },
  LOCATION: {
    REQUEST: 'Location access is needed for this feature',
    DENIED: 'Location permission was denied. Some features may be limited',
    BLOCKED: 'Location permission is blocked. Please enable it in settings',
  },
  NOTIFICATIONS: {
    REQUEST: 'Notifications are needed for important updates',
    DENIED: 'Notification permission was denied. You may miss important updates',
    BLOCKED: 'Notifications are blocked. Please enable them in settings',
  },
} as const; 