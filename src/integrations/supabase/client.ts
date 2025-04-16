// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { DB_CONFIG } from './config';

// Supabase configuration
const SUPABASE_URL = DB_CONFIG.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = DB_CONFIG.SUPABASE_ANON_KEY;

// Enable debug mode for realtime in development
if (typeof window !== 'undefined') {
  window.localStorage.setItem('supabase.realtime.debug', 'true');
}

// Create the Supabase client with enhanced permissions and error handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'artflow-auth-storage'
  },
  global: {
    headers: {
      'X-Client-Info': 'artflow-canvas',
      'X-Artflow-Anonymous-Auth': 'true' // Special header to help server identify anonymous usage
    }
  }
});

// Initialize anonymous session if needed
const initAnonymousSession = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      console.log("No active session, starting anonymous session");
      
      // Try anonymous sign-in to establish session
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn("Error creating anonymous session:", error.message);
        // Continue anyway as we have anon key access
      }
    }
  } catch (error) {
    console.warn("Session initialization error:", error);
    // Non-fatal, continue execution
  }
};

// Run initialization
initAnonymousSession();

// Log authentication status for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event);
  console.log('Session active:', !!session);
});

// Template API functions
export interface Template {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  canvas_state: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTemplates(): Promise<{ success: boolean; templates: Template[]; error?: string }> {
  try {
    // Call the API function we created
    const { data, error } = await supabase.rpc('api_get_template_list');
    
    if (error) {
      console.error('Error fetching templates:', error);
      return { success: false, templates: [], error: error.message };
    }
    
    return { success: true, templates: data || [] };
  } catch (err: any) {
    console.error('Exception fetching templates:', err);
    return { success: false, templates: [], error: err.message };
  }
}

// Canvas session functions
export async function createNewCanvas(templateId?: string): Promise<{ success: boolean; canvasId?: string; error?: string }> {
  try {
    if (templateId) {
      // Create from template
      const { data, error } = await supabase.rpc('create_canvas_from_template', {
        template_id: templateId
      });
      
      if (error) throw error;
      return { success: true, canvasId: data };
    } else {
      // Create empty canvas
      const { data, error } = await supabase.from('canvas_sessions').insert({
        canvas_state: { objects: [], background: '#ffffff' }
      }).select('id').single();
      
      if (error) throw error;
      return { success: true, canvasId: data.id };
    }
  } catch (err: any) {
    console.error('Error creating canvas:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create a new canvas session
 */
export const createCanvasSession = async (
  name: string, 
  description: string, 
  userId: string,
  isPublic: boolean = true
) => {
  try {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .insert({
        name,
        description,
        created_by: userId,
        is_public: isPublic
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating canvas session:', error);
    throw error;
  }
};

/**
 * Get canvas session details
 */
export const getCanvasSession = async (canvasId: string) => {
  try {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .select('*')
      .eq('id', canvasId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching canvas session:', error);
    return null;
  }
};

/**
 * Save a canvas operation to the database
 */
export const saveCanvasOperation = async (
  canvasId: string,
  userId: string,
  operationType: string,
  operationData: any,
  clientTimestamp?: number
) => {
  try {
    const { data, error } = await supabase
      .from('canvas_operations')
      .insert({
        canvas_id: canvasId,
        user_id: userId,
        operation_type: operationType,
        operation_data: operationData,
        client_timestamp: clientTimestamp || Date.now()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving canvas operation:', error);
    throw error;
  }
};

/**
 * Update a collaborator's presence information in the database
 */
export const updateCollaboratorPresence = async (
  canvasId: string,
  userId: string,
  userName?: string,
  userColor?: string,
  cursorPosition?: { x: number; y: number },
  activeTool?: string
) => {
  try {
    // Use the RPC function to update or create collaborator and handle canvas session
    const { data, error } = await supabase.rpc('update_or_create_collaborator', {
      canvas_id_param: canvasId,
      user_id_param: userId,
      user_name_param: userName || null,
      user_color_param: userColor || null,
      cursor_position_param: cursorPosition || null,
      active_tool_param: activeTool || null
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating collaborator presence:', error);
    // Return empty data but don't throw - to prevent collaboration breaking on DB errors
    return null;
  }
};

/**
 * Get all active collaborators for a canvas
 */
export const getCanvasCollaborators = async (canvasId: string) => {
  try {
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .eq('canvas_id', canvasId)
      .gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in the last 5 minutes
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching canvas collaborators:', error);
    return [];
  }
};

/**
 * Update the canvas state in the database
 */
export const saveCanvasState = async (canvasId: string, canvasState: any) => {
  try {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .update({
        canvas_state: canvasState,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('id', canvasId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving canvas state:', error);
    throw error;
  }
};

// Initialize a system channel for error monitoring
const channel = supabase.channel('system');
channel
  .on('system', { event: '*' }, (payload) => {
    console.log('Supabase system event:', payload);
  })
  .subscribe((status, err) => {
    if (err) {
      console.error('Supabase channel error:', err);
    }
    console.log('System channel status:', status);
  });

/**
 * Create a new collaborative canvas session with a shareable link
 */
export const createCollaborativeCanvas = async (
  name: string = "Collaborative Drawing",
  userId: string = "anonymous",
  initialState: any = { objects: [], background: '#ffffff' }
): Promise<{ success: boolean; canvasId?: string; shareUrl?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .insert({
        name,
        created_by: userId,
        canvas_state: initialState,
        is_public: true
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    const shareUrl = `${window.location.origin}/canvas/${data.id}`;
    
    return { 
      success: true, 
      canvasId: data.id,
      shareUrl
    };
  } catch (err: any) {
    console.error('Error creating collaborative canvas:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Get a list of active collaboration sessions
 */
export const getActiveCanvasSessions = async (): Promise<{ success: boolean; sessions?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('canvas_sessions')
      .select('*')
      .eq('is_public', true)
      .order('last_activity_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    return { 
      success: true, 
      sessions: data 
    };
  } catch (err: any) {
    console.error('Error fetching canvas sessions:', err);
    return { success: false, error: err.message, sessions: [] };
  }
};