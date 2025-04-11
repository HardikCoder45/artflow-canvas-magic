import { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

export type CollaborationUser = {
  id: string;
  name: string;
  color: string;
  cursor: { x: number, y: number } | null;
};

interface UseCanvasCollaborationOptions {
  canvas: fabric.Canvas | null;
  updateHistory: () => void;
}

export function useCanvasCollaboration({ canvas, updateHistory }: UseCanvasCollaborationOptions) {
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [remoteCursors, setRemoteCursors] = useState<{ [userId: string]: { user: CollaborationUser, position: { x: number, y: number } } }>({});
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  
  const channelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastCursorUpdateRef = useRef<number>(0);
  
  // Generate a random color for the user
  const generateRandomColor = () => {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33A8', 
      '#33FFF5', '#F533FF', '#FFFC33', '#FF8C33',
      '#5733FF', '#33FFCB', '#FF33E6', '#33B5FF'
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Create a new collaboration session
  const createSession = useCallback(async () => {
    if (!canvas) return '';
    
    // Generate a unique session ID
    const newSessionId = uuidv4();
    
    // Generate a user ID and color
    const userId = uuidv4();
    const userColor = generateRandomColor();
    
    // Set the current user
    const user = {
      id: userId,
      name: `User-${userId.substring(0, 5)}`,
      color: userColor,
      cursor: null
    };
    
    setCurrentUser(user);
    
    // Get canvas state
    const canvasState = canvas.toJSON(['id']);
    
    // Store in Supabase
    try {
      const { error } = await supabase
        .from('canvas_sessions')
        .insert({
          id: newSessionId,
          created_by: userId,
          canvas_state: canvasState,
          is_active: true,
        });
      
      if (error) {
        console.error("Failed to create collaboration session:", error);
        return '';
      }
      
      // Set local state
      setSessionId(newSessionId);
      setIsCollaborating(true);
      
      // Set up real-time channel
      setupRealtimeChannel(newSessionId, userId);
      
      return newSessionId;
    } catch (err) {
      console.error("Error creating session:", err);
      return '';
    }
  }, [canvas]);

  // Join an existing session
  const joinSession = useCallback(async (joinSessionId: string) => {
    if (!canvas || !joinSessionId) return false;
    
    try {
      // Check if session exists
      const { data, error } = await supabase
        .from('canvas_sessions')
        .select('*')
        .eq('id', joinSessionId)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        console.error("Failed to join session:", error);
        return false;
      }
      
      // Generate a user ID and color
      const userId = uuidv4();
      const userColor = generateRandomColor();
      
      // Set the current user
      const user = {
        id: userId,
        name: `User-${userId.substring(0, 5)}`,
        color: userColor,
        cursor: null
      };
      
      setCurrentUser(user);
      
      // Load canvas state
      canvas.loadFromJSON(data.canvas_state, () => {
        canvas.renderAll();
      });
      
      // Set local state
      setSessionId(joinSessionId);
      setIsCollaborating(true);
      
      // Set up real-time channel
      setupRealtimeChannel(joinSessionId, userId);
      
      return true;
    } catch (err) {
      console.error("Error joining session:", err);
      return false;
    }
  }, [canvas]);

  // Set up the Supabase realtime channel
  const setupRealtimeChannel = useCallback((channelSessionId: string, userId: string) => {
    // Create a channel for this session
    const channel = supabase.channel(`canvas:${channelSessionId}`, {
      config: {
        broadcast: {
          self: false
        }
      }
    });
    
    // Listen for canvas updates
    channel
      .on('broadcast', { event: 'canvas:update' }, (payload) => {
        if (!canvas) return;
        
        canvas.loadFromJSON(payload.payload, () => {
          canvas.renderAll();
          updateHistory();
        });
      })
      .on('broadcast', { event: 'canvas:object:add' }, (payload) => {
        if (!canvas) return;
        
        fabric.util.enlivenObjects([payload.payload], (objects) => {
          objects.forEach(obj => {
            canvas.add(obj);
          });
          canvas.renderAll();
          updateHistory();
        });
      })
      .on('broadcast', { event: 'canvas:object:modify' }, (payload) => {
        if (!canvas) return;
        
        const objId = payload.payload.id;
        const changes = payload.payload.changes;
        
        const objToUpdate = canvas.getObjects().find(
          (o: any) => o.id === objId
        );
        
        if (objToUpdate) {
          objToUpdate.set(changes);
          objToUpdate.setCoords();
          canvas.renderAll();
          updateHistory();
        }
      })
      .on('broadcast', { event: 'canvas:object:remove' }, (payload) => {
        if (!canvas) return;
        
        const objId = payload.payload.id;
        
        const objToRemove = canvas.getObjects().find(
          (o: any) => o.id === objId
        );
        
        if (objToRemove) {
          canvas.remove(objToRemove);
          canvas.renderAll();
          updateHistory();
        }
      })
      .on('broadcast', { event: 'cursor:move' }, (payload) => {
        const cursorUserId = payload.payload.userId;
        const position = payload.payload.position;
        const userName = payload.payload.userName;
        const userColor = payload.payload.userColor;
        
        if (cursorUserId !== userId) {
          setRemoteCursors(prev => ({
            ...prev,
            [cursorUserId]: {
              user: { 
                id: cursorUserId, 
                name: userName || `User-${cursorUserId.substring(0, 5)}`, 
                color: userColor || '#ff0000',
                cursor: position 
              },
              position
            }
          }));
        }
      })
      .on('broadcast', { event: 'user:leave' }, (payload) => {
        const leavingUserId = payload.payload.userId;
        
        setRemoteCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[leavingUserId];
          return newCursors;
        });
      })
      .subscribe();
    
    // Save channel reference for cleanup
    channelRef.current = channel;
    
    // Set up canvas event listeners for broadcasting changes
    setupCanvasListeners(channelSessionId, userId);
    
    // Set up mouse movement tracking
    setupCursorTracking(channelSessionId, userId);
  }, [canvas, updateHistory]);

  // Set up canvas event listeners to broadcast changes
  const setupCanvasListeners = useCallback((channelSessionId: string, userId: string) => {
    if (!canvas) return;
    
    // Add event listeners to broadcast changes
    const handleObjectAdded = (e: fabric.IEvent) => {
      if (e.target && !(e.target as any).id) {
        (e.target as any).id = `obj_${Date.now()}`;
      }
      
      if (e.target && (e.target as any).id) {
        broadcastCanvasUpdate(channelSessionId, 'canvas:object:add', (e.target as any).toObject(['id']));
      }
    };
    
    const handleObjectModified = (e: fabric.IEvent) => {
      if (e.target && (e.target as any).id) {
        broadcastCanvasUpdate(channelSessionId, 'canvas:object:modify', {
          id: (e.target as any).id,
          changes: (e.target as any).toObject(['id'])
        });
      }
    };
    
    const handleObjectRemoved = (e: fabric.IEvent) => {
      if (e.target && (e.target as any).id) {
        broadcastCanvasUpdate(channelSessionId, 'canvas:object:remove', {
          id: (e.target as any).id
        });
      }
    };
    
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);
    
    // Return cleanup function
    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [canvas]);

  // Set up mouse movement tracking for cursor sharing
  const setupCursorTracking = useCallback((channelSessionId: string, userId: string) => {
    if (!containerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!currentUser) return;
      
      // Get position relative to container
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Throttle updates to reduce network traffic (every 50ms)
        if (Date.now() - (lastCursorUpdateRef.current || 0) > 50) {
          broadcastCanvasUpdate(channelSessionId, 'cursor:move', {
            userId,
            userName: currentUser.name,
            userColor: currentUser.color,
            position: { x, y }
          });
          
          lastCursorUpdateRef.current = Date.now();
        }
      }
    };
    
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    // Return cleanup function
    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [currentUser]);

  // Broadcast a canvas update to all users
  const broadcastCanvasUpdate = async (channelSessionId: string, event: string, payload: any) => {
    if (!channelRef.current) return;
    
    await supabase.channel(`canvas:${channelSessionId}`).send({
      type: 'broadcast',
      event,
      payload
    });
  };

  // Leave the current session
  const leaveSession = useCallback(async () => {
    if (!isCollaborating || !currentUser) return;
    
    // Notify others that user is leaving
    await broadcastCanvasUpdate(sessionId, 'user:leave', {
      userId: currentUser.id
    });
    
    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    // Reset state
    setIsCollaborating(false);
    setSessionId('');
    setRemoteCursors({});
    setCurrentUser(null);
    
    // Remove URL query parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.replaceState({}, document.title, url.toString());
  }, [isCollaborating, sessionId, currentUser]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    isCollaborating,
    sessionId,
    remoteCursors,
    containerRef,
    createSession,
    joinSession,
    leaveSession
  };
} 