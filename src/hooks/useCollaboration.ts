import { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { 
  createCollaborationSession,
  joinCollaborationSession,
  leaveCollaborationSession,
  broadcastAction,
  updateCursorPosition,
  onCanvasAction,
  getCurrentSession,
  getCurrentUser,
  CollaborationUser
} from '@/services/collaborationService';

interface UseCollaborationOptions {
  canvas: fabric.Canvas | null;
  debounceHistoryUpdate: () => void;
}

export function useCollaboration({ canvas, debounceHistoryUpdate }: UseCollaborationOptions) {
  const [isCollaborating, setIsCollaborating] = useState<boolean>(false);
  const [remoteCursors, setRemoteCursors] = useState<{ [userId: string]: { user: CollaborationUser, position: { x: number, y: number } } }>({});
  const [sessionId, setSessionId] = useState<string>('');
  const collaborationCleanupRef = useRef<(() => void) | null>(null);
  const lastCursorUpdateRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize collaboration listeners
  useEffect(() => {
    if (isCollaborating && canvas) {
      // Subscribe to real-time updates
      const unsubscribe = onCanvasAction((action) => {
        if (!canvas) return;
        
        switch (action.type) {
          case 'canvas:update':
            // Load the entire canvas state
            canvas.loadFromJSON(action.payload, () => {
              canvas.renderAll();
              debounceHistoryUpdate();
            });
            break;
            
          case 'canvas:object:add':
            // Add a new object to the canvas
            fabric.util.enlivenObjects([action.payload], (objects) => {
              objects.forEach(obj => {
                canvas.add(obj);
              });
              canvas.renderAll();
              debounceHistoryUpdate();
            });
            break;
            
          case 'canvas:object:modify':
            // Find and update an existing object
            const objToUpdate = canvas.getObjects().find(
              (o: any) => o.id === action.payload.id
            );
            
            if (objToUpdate) {
              objToUpdate.set(action.payload.changes);
              objToUpdate.setCoords();
              canvas.renderAll();
              debounceHistoryUpdate();
            }
            break;
            
          case 'canvas:object:remove':
            // Remove an object from the canvas
            const objToRemove = canvas.getObjects().find(
              (o: any) => o.id === action.payload.id
            );
            
            if (objToRemove) {
              canvas.remove(objToRemove);
              canvas.renderAll();
              debounceHistoryUpdate();
            }
            break;
            
          case 'cursor:move':
            // Update remote cursor position
            const { userId, position } = action.payload;
            const currentUser = getCurrentUser();
            
            if (currentUser && userId !== currentUser.id) {
              setRemoteCursors(prev => ({
                ...prev,
                [userId]: {
                  user: { id: userId, name: `User-${userId.substring(0, 5)}`, color: '#ff0000', cursor: position },
                  position
                }
              }));
            }
            break;
        }
      });
      
      collaborationCleanupRef.current = unsubscribe;
      
      // Set up canvas event listeners
      setupCanvasEventListeners();
    }
    
    return () => {
      if (collaborationCleanupRef.current) {
        collaborationCleanupRef.current();
      }
      
      // Clean up canvas event listeners
      cleanupCanvasEventListeners();
    };
  }, [isCollaborating, canvas, debounceHistoryUpdate]);

  // Track mouse movement for cursor sharing
  useEffect(() => {
    if (isCollaborating && containerRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        // Get position relative to canvas container
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Throttle updates to reduce network traffic
          if (Date.now() - (lastCursorUpdateRef.current || 0) > 50) {
            updateCursorPosition(x, y);
            lastCursorUpdateRef.current = Date.now();
          }
        }
      };
      
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isCollaborating, containerRef.current]);

  // Broadcast canvas changes
  const broadcastCanvasUpdate = useCallback((type: string, payload: any) => {
    if (isCollaborating) {
      switch (type) {
        case 'add':
          broadcastAction({
            type: 'canvas:object:add',
            payload: payload.toObject(['id'])
          });
          break;
          
        case 'modify':
          broadcastAction({
            type: 'canvas:object:modify',
            payload: {
              id: payload.id,
              changes: payload.toObject(['id'])
            }
          });
          break;
          
        case 'remove':
          broadcastAction({
            type: 'canvas:object:remove',
            payload: { id: payload.id }
          });
          break;
          
        case 'clear':
          broadcastAction({
            type: 'canvas:clear',
            payload: null
          });
          break;
          
        case 'update':
          broadcastAction({
            type: 'canvas:update',
            payload: canvas?.toJSON(['id'])
          });
          break;
      }
    }
  }, [isCollaborating, canvas]);

  // Set up canvas event listeners for broadcasting changes
  const setupCanvasEventListeners = useCallback(() => {
    if (!canvas || !isCollaborating) return;
    
    // Object added handler
    const handleObjectAdded = (e: fabric.IEvent) => {
      if (e.target && !(e.target as any).id) {
        (e.target as any).id = `obj_${Date.now()}`;
      }
      
      if (e.target && (e.target as any).id) {
        broadcastCanvasUpdate('add', e.target);
      }
    };
    
    // Object modified handler
    const handleObjectModified = (e: fabric.IEvent) => {
      if (e.target && (e.target as any).id) {
        broadcastCanvasUpdate('modify', e.target);
      }
    };
    
    // Object removed handler
    const handleObjectRemoved = (e: fabric.IEvent) => {
      if (e.target && (e.target as any).id) {
        broadcastCanvasUpdate('remove', e.target);
      }
    };
    
    // Register event handlers
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);
    
  }, [canvas, isCollaborating, broadcastCanvasUpdate]);

  // Clean up canvas event listeners
  const cleanupCanvasEventListeners = useCallback(() => {
    if (!canvas) return;
    
    canvas.off('object:added');
    canvas.off('object:modified');
    canvas.off('object:removed');
  }, [canvas]);

  // Create a new collaboration session
  const createSession = useCallback(async () => {
    if (!canvas) return '';

    const canvasState = canvas.toJSON(['id']);
    const newSessionId = await createCollaborationSession(canvasState);
    
    if (newSessionId) {
      setSessionId(newSessionId);
      setIsCollaborating(true);
    }
    
    return newSessionId;
  }, [canvas]);

  // Join an existing collaboration session
  const joinSession = useCallback(async (sessionIdToJoin: string) => {
    if (!canvas) return false;
    
    const success = await joinCollaborationSession(sessionIdToJoin);
    
    if (success) {
      setSessionId(sessionIdToJoin);
      setIsCollaborating(true);
      
      // Get the session state and apply it to canvas
      const session = getCurrentSession();
      if (session) {
        canvas.loadFromJSON(session.canvasState, () => {
          canvas.renderAll();
        });
      }
    }
    
    return success;
  }, [canvas]);

  // Leave the current collaboration session
  const leaveSession = useCallback(async () => {
    await leaveCollaborationSession();
    setIsCollaborating(false);
    setSessionId('');
    setRemoteCursors({});
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