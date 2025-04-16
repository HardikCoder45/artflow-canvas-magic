import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { canvasRealtime } from '@/integrations/supabase/canvas-realtime';
import { useToast } from '@/components/ui/use-toast';
import ArtCanvas from './ArtCanvas';
import { getCanvasCollaborators } from '@/integrations/supabase/client';
import { REALTIME_CONFIG } from '@/integrations/supabase/config';

// Helper function to get the canvas ID from the URL
const useCanvasId = () => {
  const [canvasId, setCanvasId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get from URL
    const url = new URL(window.location.href);
    const idFromUrl = url.searchParams.get('canvasId');
    
    if (idFromUrl) {
      setCanvasId(idFromUrl);
    } else {
      // If not in URL, generate a new one
      const newId = crypto.randomUUID();
      setCanvasId(newId);
    }
  }, []);
  
  return canvasId;
};

interface CanvasCollaborationWrapperProps {
  width?: number;
  height?: number;
  initialTool?: string;
  onToolSelect?: (tool: string) => void;
  fullScreen?: boolean;
  onChanged?: (changed: boolean) => void;
  userName?: string;
  userColor?: string;
}

const CanvasCollaborationWrapper = ({
  width,
  height,
  initialTool,
  onToolSelect,
  fullScreen,
  onChanged,
  userName,
  userColor
}: CanvasCollaborationWrapperProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const canvasRef = useRef<any>(null);
  const { toast } = useToast();
  const canvasId = useCanvasId();
  const connRetryRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set current tool in realtime presence
  useEffect(() => {
    if (isConnected && initialTool) {
      canvasRealtime.updateActiveTool(initialTool);
    }
  }, [isConnected, initialTool]);

  // Set user info if provided
  useEffect(() => {
    if (isConnected && (userName || userColor)) {
      canvasRealtime.setUserInfo(userName, userColor);
    }
  }, [isConnected, userName, userColor]);

  // Force a reconnection (for manual retry button)
  const handleReconnect = useCallback(async () => {
    if (!canvasId || isReconnecting) return;
    
    setIsReconnecting(true);
    setConnectionError(null);
    
    try {
      await canvasRealtime.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      await canvasRealtime.connect(canvasId);
      setIsConnected(true);
      setRetryCount(0);
      
      toast({
        title: "Reconnected",
        description: "Successfully reconnected to collaboration session."
      });
    } catch (error) {
      console.error("Manual reconnection failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setConnectionError(errorMsg);
      setRetryCount(prev => prev + 1);
      
      toast({
        title: "Reconnection Failed",
        description: "Could not reconnect to collaboration session. " + errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsReconnecting(false);
    }
  }, [canvasId, toast, isReconnecting]);

  // Clear any existing timers when unmounting
  useEffect(() => {
    return () => {
      if (connRetryRef.current) {
        clearTimeout(connRetryRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Function to update collaborators list
  const updateCollaborators = useCallback(async () => {
    try {
      if (canvasId && canvasRealtime.isConnected()) {
        const users = await getCanvasCollaborators(canvasId);
        setCollaborators(users || []);
      } else if (isConnected) {
        console.warn("Can't update collaborators - channel not connected");
        setIsConnected(false);
        // Only auto-reconnect if we think we're connected but aren't actually
        if (retryCount < REALTIME_CONFIG.MAX_CONNECTION_ATTEMPTS) {
          handleReconnect();
        }
      }
    } catch (error) {
      console.error("Error updating collaborators:", error);
      // Don't set disconnected on every error as the connection might still be valid
    }
  }, [canvasId, isConnected, handleReconnect, retryCount]);

  // Core effect to initialize collaboration
  useEffect(() => {
    if (!canvasId) {
      return;
    }
    
    // Add to URL if not already there
    if (window.location.href.indexOf(canvasId) === -1) {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('canvasId')) {
        url.searchParams.set('canvasId', canvasId);
        window.history.replaceState({}, '', url.toString());
      }
    }
    
    console.log(`Attempting to connect to canvas: ${canvasId}`);

    const setupCollaboration = async () => {
      // Clear any previous errors and state
      setConnectionError(null);
      setIsReconnecting(true);
      
      try {
        // Get user authentication status
        const { data: authData } = await supabase.auth.getSession();
        const userId = authData?.session?.user?.id || `anonymous-${crypto.randomUUID()}`;
        
        // Set up user info in realtime manager
        canvasRealtime.setUserInfo(
          userName || `User-${userId.substring(0, 6)}`,
          userColor || `#${Math.floor(Math.random()*16777215).toString(16)}`
        );
        
        // Listen for presence updates
        canvasRealtime.onPresence(users => {
          setCollaborators(users || []);
        });
        
        // Attempt to connect to the collaboration channel
        await canvasRealtime.connect(canvasId);
        setIsConnected(true);
        setRetryCount(0);
        
        // Initial update of collaborators
        await updateCollaborators();
        
        // Set up interval for regular updates
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(updateCollaborators, REALTIME_CONFIG.COLLABORATOR_UPDATE_INTERVAL);
        
        toast({
          title: "Collaboration Active",
          description: "You are now collaborating with others in real-time."
        });
      } catch (error) {
        console.error("Failed to connect to collaboration session:", error);
        
        // Store the error message
        if (error instanceof Error) {
          setConnectionError(error.message);
        } else {
          setConnectionError("Unknown error connecting to collaboration");
        }
        
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Collaboration Issue",
          description: "Having trouble connecting. Retrying in background.",
          variant: "destructive"
        });
        
        // Auto-retry with exponential backoff based on retry count
        if (connRetryRef.current) {
          clearTimeout(connRetryRef.current);
        }
        
        const retryDelay = Math.min(
          2000 * Math.pow(1.5, retryCount), 
          30000 // Cap at 30 seconds
        );
        
        connRetryRef.current = setTimeout(() => {
          console.log(`Auto-retrying collaboration connection... (attempt ${retryCount + 1})`);
          setupCollaboration();
        }, retryDelay);
      } finally {
        setIsReconnecting(false);
      }
    };

    setupCollaboration();

    return () => {
      if (connRetryRef.current) {
        clearTimeout(connRetryRef.current);
        connRetryRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      canvasRealtime.disconnect();
      setIsConnected(false);
    };
  }, [canvasId, toast, updateCollaborators, userName, userColor, retryCount]);

  // Enhanced Collaboration status indicator
  const CollaborationStatus = () => {
    if (!canvasId) return null;
    
    let statusText = "Connecting...";
    let statusColor = "bg-yellow-500";
    
    if (isReconnecting) {
      statusText = "Reconnecting...";
      statusColor = "bg-yellow-500 animate-pulse";
    } else if (isConnected) {
      statusText = `${collaborators.length} collaborator${collaborators.length !== 1 ? 's' : ''}`;
      statusColor = "bg-green-500";
    } else if (connectionError) {
      statusText = `Connection Error (Retry ${retryCount})`;
      statusColor = "bg-red-500";
    }
    
    return (
      <div
        className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-full flex items-center space-x-2 z-50 cursor-pointer hover:opacity-90 shadow-lg"
        onClick={handleReconnect}
        title={isConnected ? "Connected - Click to refresh" : "Disconnected - Click to retry"}
      >
        <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
        <span className="text-sm">{statusText}</span>
        
        {connectionError && (
          <div className="absolute bottom-full right-0 mb-2 bg-red-600 text-white p-2 rounded text-xs w-64 shadow-lg">
            {connectionError}
            <div className="mt-1 text-white underline">Click to retry</div>
          </div>
        )}
      </div>
    );
  };

  // Display sharing info if connected
  const SharingInfo = () => {
    if (!canvasId || !isConnected) return null;
    
    const copyShareLink = () => {
      const url = new URL(window.location.href);
      // Ensure canvasId is in the URL
      url.searchParams.set('canvasId', canvasId);
      navigator.clipboard.writeText(url.toString());
      toast({
        title: "Link Copied",
        description: "Share this link with others to collaborate"
      });
    };
    
    return (
      <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-md flex items-center space-x-2 z-50 cursor-pointer hover:opacity-90 shadow-lg" onClick={copyShareLink}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span className="text-sm">Share Canvas</span>
      </div>
    );
  };

  // Display collaborator cursors if available
  const CollaboratorCursors = () => {
    if (!canvasId || !isConnected || collaborators.length === 0) return null;
    
    return (
      <div className="fixed bottom-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-md z-50 shadow-lg">
        <div className="text-sm font-medium mb-1">Active Users</div>
        <div className="flex flex-col space-y-1">
          {collaborators.map(user => (
            <div key={user.user_id} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: user.user_color || '#888' }}
              />
              <span className="text-xs">{user.user_name || 'Anonymous'}</span>
              {user.active_tool && (
                <span className="text-xs opacity-70">({user.active_tool})</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <ArtCanvas
        width={width}
        height={height}
        initialTool={initialTool}
        onToolSelect={(tool) => {
          if (onToolSelect) onToolSelect(tool);
          if (isConnected) canvasRealtime.updateActiveTool(tool);
        }}
        fullScreen={fullScreen}
        onChanged={onChanged}
        canvasId={canvasId || undefined}
        isCollaborative={!!canvasId}
        onMouseMove={(x, y) => {
          if (isConnected) canvasRealtime.updateCursorPosition(x, y);
        }}
      />
      <CollaborationStatus />
      <SharingInfo />
      <CollaboratorCursors />
    </>
  );
};

export default CanvasCollaborationWrapper; 