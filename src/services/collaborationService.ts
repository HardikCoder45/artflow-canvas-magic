import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
export type CanvasAction = 
  | { type: 'canvas:update', payload: any }
  | { type: 'canvas:object:add', payload: any }
  | { type: 'canvas:object:modify', payload: any }
  | { type: 'canvas:object:remove', payload: any }
  | { type: 'canvas:clear', payload: any }
  | { type: 'cursor:move', payload: { userId: string, position: { x: number, y: number } } };

export type CollaborationSession = {
  sessionId: string;
  users: CollaborationUser[];
  canvasState: any;
};

export type CollaborationUser = {
  id: string;
  name: string;
  color: string;
  cursor: { x: number, y: number } | null;
};

// This will store the current session information
let currentSession: CollaborationSession | null = null;
let currentUser: CollaborationUser | null = null;
let actionListeners: ((action: CanvasAction) => void)[] = [];

// Create a new collaboration session
export async function createCollaborationSession(initialCanvasState: any): Promise<string> {
  const sessionId = uuidv4();
  const userId = uuidv4();
  
  // Create a random color for the user
  const userColor = generateRandomColor();
  
  // Set up the current user
  currentUser = {
    id: userId,
    name: `User-${userId.substring(0, 5)}`,
    color: userColor,
    cursor: null
  };
  
  // Create the session
  currentSession = {
    sessionId,
    users: [currentUser],
    canvasState: initialCanvasState
  };
  
  // Store the session in Supabase
  const { error } = await supabase
    .from('canvas_sessions')
    .insert({
      id: sessionId,
      created_by: userId,
      canvas_state: initialCanvasState,
      is_active: true,
    });
  
  if (error) {
    console.error("Failed to create collaboration session:", error);
    return "";
  }
  
  // Subscribe to the session's channel
  subscribeToSessionChannel(sessionId);
  
  return sessionId;
}

// Join an existing collaboration session
export async function joinCollaborationSession(sessionId: string): Promise<boolean> {
  // Check if the session exists
  const { data, error } = await supabase
    .from('canvas_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    console.error("Failed to join collaboration session:", error);
    return false;
  }
  
  const userId = uuidv4();
  const userColor = generateRandomColor();
  
  // Set up the current user
  currentUser = {
    id: userId,
    name: `User-${userId.substring(0, 5)}`,
    color: userColor,
    cursor: null
  };
  
  // Set the current session
  currentSession = {
    sessionId,
    users: [], // Will be updated from real-time events
    canvasState: data.canvas_state
  };
  
  // Subscribe to the session's channel
  subscribeToSessionChannel(sessionId);
  
  // Announce this user has joined
  await broadcastAction({
    type: 'user:join',
    payload: currentUser
  } as any);
  
  return true;
}

// Subscribe to a session's real-time updates
function subscribeToSessionChannel(sessionId: string) {
  const channel = supabase.channel(`canvas:${sessionId}`, {
    config: {
      broadcast: {
        self: false
      }
    }
  });
  
  channel
    .on('broadcast', { event: 'canvas:action' }, (payload) => {
      const action = payload.payload as CanvasAction;
      
      // Notify all listeners of the action
      actionListeners.forEach(listener => listener(action));
    })
    .subscribe();
}

// Broadcast an action to all users in the session
export async function broadcastAction(action: CanvasAction) {
  if (!currentSession) {
    console.error("No active session");
    return;
  }
  
  await supabase.channel(`canvas:${currentSession.sessionId}`).send({
    type: 'broadcast',
    event: 'canvas:action',
    payload: action
  });
}

// Register a listener for canvas actions
export function onCanvasAction(listener: (action: CanvasAction) => void) {
  actionListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    actionListeners = actionListeners.filter(l => l !== listener);
  };
}

// Get the current session information
export function getCurrentSession(): CollaborationSession | null {
  return currentSession;
}

// Get the current user information
export function getCurrentUser(): CollaborationUser | null {
  return currentUser;
}

// Update the cursor position
export async function updateCursorPosition(x: number, y: number) {
  if (!currentUser || !currentSession) return;
  
  currentUser.cursor = { x, y };
  
  await broadcastAction({
    type: 'cursor:move',
    payload: {
      userId: currentUser.id,
      position: { x, y }
    }
  });
}

// Leave the current session
export async function leaveCollaborationSession() {
  if (!currentSession || !currentUser) return;
  
  await broadcastAction({
    type: 'user:leave',
    payload: {
      userId: currentUser.id
    }
  } as any);
  
  currentSession = null;
  currentUser = null;
}

// Utility function to generate a random color for user
function generateRandomColor(): string {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', 
    '#33FFF5', '#F533FF', '#FFFC33', '#FF8C33',
    '#5733FF', '#33FFCB', '#FF33E6', '#33B5FF'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
} 