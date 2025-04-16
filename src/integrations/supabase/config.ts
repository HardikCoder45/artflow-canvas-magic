/**
 * Supabase Configuration
 * 
 * This file contains global configuration settings for Supabase
 * that are used throughout the application for consistency.
 */

/**
 * Configure canvas realtime collaboration settings
 */
export const REALTIME_CONFIG = {
  // Maximum retry attempts
  MAX_CONNECTION_ATTEMPTS: 5,
  
  // Base delay for retry backoff in milliseconds
  BASE_RETRY_DELAY: 2000,
  
  // Maximum delay for retry backoff in milliseconds
  MAX_RETRY_DELAY: 10000,
  
  // Interval to update collaborator list in milliseconds
  COLLABORATOR_UPDATE_INTERVAL: 5000,
  
  // Whether to include self in broadcast messages
  BROADCAST_SELF: true,
  
  // Debug mode for realtime features
  DEBUG: true,
  
  // Default presence timeout in seconds
  PRESENCE_TIMEOUT: 60,
  
  // Enable broadcast message batching for better performance
  ENABLE_MESSAGE_BATCHING: true,
  
  // ID prefix for canvas channels
  CHANNEL_PREFIX: 'canvas:',
  
  // Maximum number of collaborators allowed per canvas
  MAX_COLLABORATORS: 20,
  
  // Enable reconnection on page visibility change
  RECONNECT_ON_VISIBILITY_CHANGE: true,
  
  // Heartbeat interval in milliseconds to keep presence alive
  HEARTBEAT_INTERVAL: 30000,
};

/**
 * Database schema configuration
 */
export const DB_CONFIG = {
  // Supabase connection details
  SUPABASE_URL: 'https://dfwtdecyycnhaywriaaq.supabase.co',
  SUPABASE_ANON_KEY:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd3RkZWN5eWNuaGF5d3JpYWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNjIxNjIsImV4cCI6MjA1ODczODE2Mn0.91FMmE-dF3h3kis8GYTihq5hDn7nA3sn6vvVa3Qnn4w',
  
  SCHEMAS: {
    PUBLIC: 'public',
    ARTFLOW: 'artflow',
    REALTIME: '_realtime',
  },
  
  TABLES: {
    CANVAS_SESSIONS: 'artflow.canvas_sessions',
    COLLABORATORS: 'artflow.collaborators',
    TEMPLATES: 'artflow.templates',
    CANVAS_OPERATIONS: 'artflow.canvas_operations',
  },
  
  FUNCTIONS: {
    GET_TEMPLATES: 'api_get_template_list',
    CREATE_CANVAS: 'create_canvas_from_template',
    UPDATE_PRESENCE: 'update_collaborator_presence',
    GET_COLLABORATORS: 'get_canvas_collaborators',
  }
};

/**
 * Convert milliseconds to Supabase interval format
 */
export const msToInterval = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  return `${seconds} seconds`;
};

/**
 * Initialize Supabase realtime debugging
 */
export const initializeRealtimeDebug = (): void => {
  if (typeof window !== 'undefined' && REALTIME_CONFIG.DEBUG) {
    (window as any).localStorage.setItem('supabase.realtime.debug', 'true');
  }
};

/**
 * Get the full channel name for a canvas ID
 */
export const getCanvasChannelName = (canvasId: string): string => {
  return `${REALTIME_CONFIG.CHANNEL_PREFIX}${canvasId}`;
}; 