import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import ArtCanvas from './ArtCanvas';
// import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { setupCanvasCollaboration, CanvasCollaboration } from '@/integrations/supabase/canvas-collaboration';
import { canvasRealtime } from '@/integrations/supabase/canvas-realtime';
import CollaborationStatus from './CollaborationStatus';

// Use a simple implementation of useParams that gets the ID from the URL
const useSimpleParams = () => {
  const [params, setParams] = useState<{ id?: string }>({});
  
  useEffect(() => {
    // This gets the canvas ID from the URL path
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    setParams({ id });
  }, []);
  
  return params;
};

interface CollaborativeArtCanvasProps {
  fullScreen?: boolean;
  width?: number;
  height?: number;
  initialTool?: string;
  onToolSelect?: (tool: string) => void;
  onChanged?: (changed: boolean) => void;
  onCanvasCreated?: (canvas: fabric.Canvas) => void;
}

const CollaborativeArtCanvas: React.FC<CollaborativeArtCanvasProps> = (props) => {
  const canvasId = useSimpleParams()?.id as string;
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const collabRef = useRef<CanvasCollaboration | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const ignoreNextUpdateRef = useRef(false);
  const { toast } = useToast();

  // Create a combined callback that will initialize collaboration and call the original onCanvasCreated if provided
  const handleCanvasCreated = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    
    // Initialize collaboration if we have a canvas ID
    if (canvasId) {
      initializeCollaboration(canvas);
    }
    
    // Call the original onCanvasCreated prop if it exists
    if (props.onCanvasCreated) {
      props.onCanvasCreated(canvas);
    }
  }, [canvasId, props.onCanvasCreated]);

  // Initialize the collaboration
  const initializeCollaboration = async (canvas: fabric.Canvas) => {
    try {
      // Initialize canvas collaboration with handlers for remote actions
      collabRef.current = new CanvasCollaboration({
        canvasId,
        onRemoteAction: (action) => handleRemoteAction(action, canvas),
        onPresenceUpdate: (users) => setCollaborators(users),
        autoConnect: true
      });
      
      setIsConnected(true);
      
      // Set up canvas event listeners for local actions
      canvas.on('object:modified', (e) => handleObjectModified(e, canvas));
      canvas.on('object:added', (e) => handleObjectAdded(e, canvas));
      canvas.on('object:removed', (e) => handleObjectRemoved(e, canvas));
      
      // Set up mouse move event for cursor position
      canvas.on('mouse:move', (e) => {
        if (e.absolutePointer) {
          canvasRealtime.updateCursorPosition(e.absolutePointer.x, e.absolutePointer.y);
        }
      });
      
      // Show success toast
      toast({
        title: "Collaboration Active",
        description: `You are now collaborating on canvas: ${canvasId.slice(0, 8)}`
      });
      
      return () => {
        // Remove event listeners when cleaning up
        canvas.off('object:modified');
        canvas.off('object:added');
        canvas.off('object:removed');
        canvas.off('mouse:move');
      };
    } catch (error) {
      console.error("Failed to set up collaboration:", error);
      
      // Show error toast
      toast({
        title: "Collaboration Failed",
        description: "Could not connect to collaboration session. Try refreshing.",
        variant: "destructive"
      });
    }
  };

  // Handle local object modifications
  const handleObjectModified = (e: fabric.IEvent, canvas: fabric.Canvas) => {
    if (ignoreNextUpdateRef.current) {
      ignoreNextUpdateRef.current = false;
      return;
    }
    
    const obj = e.target;
    if (!obj || !collabRef.current) return;
    
    try {
      // Get object JSON representation
      const objData = obj.toJSON(['id']);
      
      // Broadcast this change to all collaborators
      collabRef.current.broadcastAction('object_modified', {
        objectId: obj.data?.id || obj.id,
        object: objData
      });
    } catch (err) {
      console.error("Error broadcasting object modification:", err);
    }
  };

  // Handle local object additions
  const handleObjectAdded = (e: fabric.IEvent, canvas: fabric.Canvas) => {
    if (ignoreNextUpdateRef.current) {
      ignoreNextUpdateRef.current = false;
      return;
    }
    
    const obj = e.target;
    if (!obj || !collabRef.current) return;
    
    // Only broadcast objects that are not internal to the canvas (like grid)
    if (obj.data?.type === 'grid' || obj.data?.internal) {
      return;
    }
    
    try {
      // Ensure the object has a unique ID
      if (!obj.data) obj.data = {};
      if (!obj.data.id) obj.data.id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get object JSON
      const objData = obj.toJSON(['id']);
      
      // Broadcast object added
      collabRef.current.broadcastAction('object_added', {
        objectId: obj.data.id,
        object: objData
      });
    } catch (err) {
      console.error("Error broadcasting object addition:", err);
    }
  };

  // Handle local object removals
  const handleObjectRemoved = (e: fabric.IEvent, canvas: fabric.Canvas) => {
    if (ignoreNextUpdateRef.current) {
      ignoreNextUpdateRef.current = false;
      return;
    }
    
    const obj = e.target;
    if (!obj || !collabRef.current) return;
    
    // Don't broadcast removal of internal objects
    if (obj.data?.type === 'grid' || obj.data?.internal) {
      return;
    }
    
    try {
      // Broadcast object removal
      collabRef.current.broadcastAction('object_removed', {
        objectId: obj.data?.id || obj.id
      });
    } catch (err) {
      console.error("Error broadcasting object removal:", err);
    }
  };

  // Handle remote actions received from other collaborators
  const handleRemoteAction = (action: any, canvas: fabric.Canvas) => {
    if (!canvas) return;
    
    console.log("Received remote action:", action.type);
    
    // Prevent triggering local actions when applying remote actions
    ignoreNextUpdateRef.current = true;
    
    switch (action.type) {
      case 'object_added':
        try {
          // Create object from received data
          fabric.util.enlivenObjects([action.payload.object], (enlivenedObjects) => {
            if (enlivenedObjects.length > 0) {
              const obj = enlivenedObjects[0];
              
              // Set data ID to match the remote object
              if (!obj.data) obj.data = {};
              obj.data.id = action.payload.objectId;
              
              // Add to canvas
              canvas.add(obj);
              canvas.renderAll();
            }
          });
        } catch (err) {
          console.error("Error applying remote object addition:", err);
        }
        break;
        
      case 'object_modified':
        try {
          // Find object by ID
          const objects = canvas.getObjects();
          const objToUpdate = objects.find(obj => 
            (obj.data?.id === action.payload.objectId) || (obj.id === action.payload.objectId)
          );
          
          if (objToUpdate) {
            // Load new state from json
            fabric.util.enlivenObjects([action.payload.object], (enlivenedObjects) => {
              if (enlivenedObjects.length > 0) {
                const newObj = enlivenedObjects[0];
                
                // Copy properties from new object to existing object
                objToUpdate.set(newObj.toObject(['id']));
                
                // Update object on canvas
                objToUpdate.setCoords();
                canvas.renderAll();
              }
            });
          }
        } catch (err) {
          console.error("Error applying remote object modification:", err);
        }
        break;
        
      case 'object_removed':
        try {
          // Find object by ID
          const objects = canvas.getObjects();
          const objToRemove = objects.find(obj => 
            (obj.data?.id === action.payload.objectId) || (obj.id === action.payload.objectId)
          );
          
          if (objToRemove) {
            canvas.remove(objToRemove);
            canvas.renderAll();
          }
        } catch (err) {
          console.error("Error applying remote object removal:", err);
        }
        break;
        
      case 'cursor_moved':
        // Handle cursor movement is done directly by the Canvas collaboration component
        break;
    }
    
    // Reset ignored flag after a short delay to ensure all events are processed
    setTimeout(() => {
      ignoreNextUpdateRef.current = false;
    }, 50);
  };

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      if (collabRef.current) {
        collabRef.current.cleanup();
        collabRef.current = null;
        setIsConnected(false);
      }
    };
  }, []);

  // Create a new props object without our intercepted props
  const { onCanvasCreated: _, ...passthroughProps } = props;

  return (
    <div className="relative w-full h-full">
      {/* Pass the props to ArtCanvas but use our wrapped callback */}
      <ArtCanvas
        {...passthroughProps}
        onCanvasCreated={handleCanvasCreated}
      />
      
      {/* Display collaboration status */}
      {canvasId && (
        <CollaborationStatus 
          isConnected={isConnected} 
          collaboratorCount={collaborators.length} 
          className="z-50"
        />
      )}
      
      {/* Render collaborator cursors */}
      {isConnected && collaborators.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {collaborators.map(user => {
            // Skip own cursor
            if (user.user_id === canvasRealtime.getCurrentUserId()) return null;
            
            // Render remote cursor if position exists
            if (user.cursor_position) {
              return (
                <div 
                  key={user.user_id}
                  className="absolute w-4 h-4 transform -translate-x-2 -translate-y-2 pointer-events-none"
                  style={{
                    left: `${user.cursor_position.x}px`,
                    top: `${user.cursor_position.y}px`,
                    zIndex: 9999
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path
                      d="M0 0L10 5L5 10L0 0Z"
                      fill={user.user_color || '#ff0000'}
                      stroke="#ffffff"
                      strokeWidth="1"
                      transform="rotate(-45, 5, 5)"
                    />
                  </svg>
                  <div 
                    className="absolute left-4 top-0 px-2 py-1 text-xs rounded whitespace-nowrap"
                    style={{
                      backgroundColor: user.user_color || '#ff0000',
                      color: '#ffffff'
                    }}
                  >
                    {user.user_name || 'Anonymous'}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default CollaborativeArtCanvas; 