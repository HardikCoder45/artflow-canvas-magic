import { canvasRealtime } from '@/integrations/supabase/canvas-realtime';
import { createCollaborativeCanvas } from '@/integrations/supabase/client';
import { fabric } from 'fabric';

// Canvas action types
export type CanvasAction = 
  | { type: 'object_added'; payload: any }
  | { type: 'object_modified'; payload: any }
  | { type: 'object_removed'; payload: any }
  | { type: 'cursor_moved'; payload: { x: number; y: number } }
  | { type: 'canvas_cleared'; payload: null };

// Collaboration session data
export type CollaborationSession = {
  id: string;
  users: CollaborationUser[];
  createdAt: Date;
};

export type CollaborationUser = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  lastActivity: Date;
};

// State for current session
let currentSession: CollaborationSession | null = null;
let currentUser: CollaborationUser | null = null;
let actionCallback: ((action: CanvasAction) => void) | null = null;
let presenceCallback: ((users: CollaborationUser[]) => void) | null = null;

// Create a new collaboration session
export async function createCollaborationSession(initialCanvasState: any): Promise<string> {
  try {
    console.log('Creating new collaboration session with initial state:', 
      initialCanvasState ? 'Object present' : 'Empty canvas');
    
    // Create a new canvas in Supabase
    const result = await createCollaborativeCanvas(
      "Collaborative Canvas",
      localStorage.getItem('user-id') || 'anonymous',
      initialCanvasState
    );
    
    if (!result.success || !result.canvasId) {
      throw new Error("Failed to create collaborative canvas");
    }
    
    const sessionId = result.canvasId;
    console.log('Collaboration session created with ID:', sessionId);
    
    // Set up the current session
    currentSession = {
      id: sessionId,
      users: [],
      createdAt: new Date()
    };
    
    // Set up user info
    const userName = localStorage.getItem('artflow-user-name') || `User-${Math.floor(Math.random() * 1000)}`;
    const userColor = localStorage.getItem('artflow-user-color') || 
      `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    
    // Store user info
    currentUser = {
      id: canvasRealtime.getCurrentUserId(),
      name: userName,
      color: userColor,
      isActive: true,
      lastActivity: new Date()
    };
    
    // Connect to realtime channel
    await canvasRealtime.connect(sessionId);
    canvasRealtime.setUserInfo(userName, userColor);
    
    console.log('Connected to realtime channel for session:', sessionId);
    return sessionId;
    
  } catch (error) {
    console.error("Failed to create collaboration session:", error);
    throw error;
  }
}

// Join an existing collaboration session
export async function joinCollaborationSession(sessionId: string): Promise<boolean> {
  try {
    console.log('Joining collaboration session:', sessionId);
    
    // Connect to the realtime channel
    await canvasRealtime.connect(sessionId);
    
    // Set up user info
    const userName = localStorage.getItem('artflow-user-name') || `User-${Math.floor(Math.random() * 1000)}`;
    const userColor = localStorage.getItem('artflow-user-color') || 
      `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    
    canvasRealtime.setUserInfo(userName, userColor);
    
    // Store user and session info
    currentUser = {
      id: canvasRealtime.getCurrentUserId(),
      name: userName,
      color: userColor,
      isActive: true,
      lastActivity: new Date()
    };
    
    currentSession = {
      id: sessionId,
      users: [],
      createdAt: new Date()
    };
    
    console.log('Successfully joined collaboration session:', sessionId);
    return true;
  } catch (error) {
    console.error("Failed to join collaboration session:", error);
    return false;
  }
}

// Set up listeners for canvas actions
export function setupActionListener(callback: (action: CanvasAction) => void): () => void {
  console.log('Setting up action listener for collaboration');
  actionCallback = callback;
  
  // Set up realtime listener
  canvasRealtime.onAction((action) => {
    console.log('Received remote canvas action:', action.type);
    
    if (actionCallback) {
      actionCallback(action as unknown as CanvasAction);
    }
  });
  
  // Return cleanup function
  return () => {
    console.log('Cleaning up action listener for collaboration');
    actionCallback = null;
  };
}

// Set up listeners for presence updates
export function setupPresenceListener(callback: (users: CollaborationUser[]) => void): () => void {
  console.log('Setting up presence listener for collaboration');
  presenceCallback = callback;
  
  // Set up realtime listener
  canvasRealtime.onPresence((presenceUsers) => {
    console.log('Received presence update. Connected users:', presenceUsers.length);
    
    const mappedUsers: CollaborationUser[] = presenceUsers.map(user => ({
      id: user.user_id,
      name: user.user_name || 'Anonymous',
      color: user.user_color || '#888888',
      isActive: true,
      lastActivity: new Date()
    }));
    
    if (presenceCallback) {
      presenceCallback(mappedUsers);
    }
  });
  
  // Return cleanup function
  return () => {
    console.log('Cleaning up presence listener for collaboration');
    presenceCallback = null;
  };
}

// Broadcast a canvas action to all collaborators
export function broadcastCanvasAction(action: CanvasAction): void {
  if (!currentSession) {
    console.warn('Cannot broadcast action: No active collaboration session');
    return;
  }
  
  console.log('Broadcasting canvas action:', action.type);
  
  canvasRealtime.broadcastAction(
    action.type as any, 
    action.payload
  );
}

// Update cursor position
export function updateCursorPosition(x: number, y: number): void {
  if (!currentSession) return;
  
  canvasRealtime.updateCursorPosition(x, y);
}

// Get current collaboration session
export function getCurrentSession(): CollaborationSession | null {
  return currentSession;
}

// Get current user
export function getCurrentUser(): CollaborationUser | null {
  return currentUser;
}

// Check if collaboration is active
export function isCollaborationActive(): boolean {
  return canvasRealtime.isConnected();
}

// Leave the current collaboration session
export async function leaveCollaborationSession() {
  console.log('Leaving collaboration session');
  
  if (canvasRealtime.isConnected()) {
    canvasRealtime.disconnect();
  }
  
  currentSession = null;
  
  console.log('Successfully left collaboration session');
}

// Debug collaboration status
export function debugCollaborationStatus(): void {
  console.log('=== COLLABORATION DEBUG INFO ===');
  console.log('Session active:', !!currentSession);
  console.log('Realtime connected:', canvasRealtime.isConnected());
  console.log('Current user:', currentUser);
  console.log('Has action callback:', !!actionCallback);
  console.log('Has presence callback:', !!presenceCallback);
  console.log('================================');
}

// Initialize with debugging
console.log('Collaboration service initialized'); 