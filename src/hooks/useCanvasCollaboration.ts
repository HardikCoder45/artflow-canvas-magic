import { useEffect, useState, useRef } from 'react';
import { fabric } from 'fabric';
import { useToast } from '@/components/ui/use-toast';
import { canvasRealtime } from '@/integrations/supabase/canvas-realtime';
import { setupCanvasCollaboration, CanvasCollaboration } from '@/integrations/supabase/canvas-collaboration';

interface CollaborationStatus {
  isConnected: boolean;
  collaborators: any[];
  currentUserId: string;
}

/**
 * React hook to add collaboration functionality to a Fabric.js canvas
 * 
 * @param canvas - Reference to the Fabric.js canvas
 * @param canvasId - Unique identifier for the canvas collaboration
 * @returns Collaboration status and functions
 */
export function useCanvasCollaboration(
  canvas: fabric.Canvas | null,
  canvasId: string | undefined
): CollaborationStatus {
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const collaborationRef = useRef<CanvasCollaboration | null>(null);
  const { toast } = useToast();
  
  // Set up collaboration when canvas and canvasId are available
  useEffect(() => {
    if (!canvas || !canvasId) return;
    
    const setupCollaboration = async () => {
      try {
        // Initialize collaboration
        collaborationRef.current = setupCanvasCollaboration(canvas, canvasId);
        
        // Set current user ID
        setCurrentUserId(canvasRealtime.getCurrentUserId());
        setIsConnected(true);
        
        // Set up interval to update collaborators list
        const updateCollaborators = async () => {
          const users = await canvasRealtime.getConnectedUsers();
          setCollaborators(users);
        };
        
        updateCollaborators();
        const intervalId = setInterval(updateCollaborators, 5000);
        
        // Show success toast
        toast({
          title: "Collaboration Active",
          description: "You are now collaborating with others in real-time."
        });
        
        return () => {
          clearInterval(intervalId);
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
    
    setupCollaboration();
    
    // Clean up when unmounting
    return () => {
      if (collaborationRef.current) {
        collaborationRef.current.cleanup();
        collaborationRef.current = null;
        setIsConnected(false);
      }
    };
  }, [canvas, canvasId, toast]);

  return {
    isConnected,
    collaborators,
    currentUserId
  };
} 