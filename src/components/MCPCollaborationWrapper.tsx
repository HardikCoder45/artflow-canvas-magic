import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ArtCanvas from './ArtCanvas';
import { mcpCollaboration } from '@/integrations/supabase/mcp-collaboration';
import { canvasRealtime } from '@/integrations/supabase/canvas-realtime';
import { mcp_supabase_list_projects, mcp_supabase_get_project } from '@/functions/mcp';

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

interface MCPCollaborationWrapperProps {
  width?: number;
  height?: number;
  initialTool?: string;
  onToolSelect?: (tool: string) => void;
  fullScreen?: boolean;
  onChanged?: (changed: boolean) => void;
  userName?: string;
  userColor?: string;
  projectId?: string;
}

const MCPCollaborationWrapper = ({
  width,
  height,
  initialTool,
  onToolSelect,
  fullScreen,
  onChanged,
  userName,
  userColor,
  projectId
}: MCPCollaborationWrapperProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [supabaseProjects, setSupabaseProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const canvasRef = useRef<any>(null);
  const { toast } = useToast();
  const canvasId = useCanvasId();
  const connRetryRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available Supabase projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await mcp_supabase_list_projects({ random_string: "dummy" });
        setSupabaseProjects(response);
        
        // If projectId is provided, select that project
        if (projectId && response.some((p: any) => p.id === projectId)) {
          const projDetails = await mcp_supabase_get_project({ id: projectId });
          setSelectedProject(projDetails);
        }
      } catch (error) {
        console.error("Error fetching Supabase projects:", error);
      }
    };
    
    fetchProjects();
  }, [projectId]);

  // Initialize MCP collaboration when project is selected
  useEffect(() => {
    if (selectedProject && !isConnected) {
      initializeMCPCollaboration();
    }
  }, [selectedProject]);

  const initializeMCPCollaboration = async () => {
    if (!selectedProject || !canvasId) return;
    
    setIsReconnecting(true);
    setConnectionError(null);
    
    try {
      // Initialize MCP collaboration
      const initialized = await mcpCollaboration.initialize(selectedProject.id);
      if (!initialized) {
        throw new Error("Failed to initialize MCP collaboration");
      }
      
      // Join or create canvas
      let joined = false;
      
      // Try joining existing canvas
      joined = await mcpCollaboration.joinCanvas(canvasId);
      
      // If joining failed, create a new canvas
      if (!joined) {
        const newCanvasId = await mcpCollaboration.createCanvas(`Collaborative Canvas ${canvasId.substring(0, 8)}`, "Created with MCP");
        if (!newCanvasId) {
          throw new Error("Failed to create canvas");
        }
        
        // Update URL with new canvas ID
        const url = new URL(window.location.href);
        url.searchParams.set('canvasId', newCanvasId);
        window.history.replaceState({}, '', url.toString());
      }
      
      // Update connection status
      setIsConnected(true);
      
      // Set up user info in realtime manager
      canvasRealtime.setUserInfo(
        userName || `User-${Math.random().toString(36).substring(2, 8)}`,
        userColor || `#${Math.floor(Math.random()*16777215).toString(16)}`
      );
      
      // Listen for presence updates
      canvasRealtime.onPresence(users => {
        setCollaborators(users || []);
      });
      
      // Set up interval for regular updates
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(async () => {
        const collabs = await mcpCollaboration.getCollaborators();
        setCollaborators(collabs || []);
      }, 5000);
      
      toast({
        title: "MCP Collaboration Active",
        description: "You are now collaborating via Supabase MCP."
      });
    } catch (error) {
      console.error("MCP collaboration error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setConnectionError(errorMsg);
      setRetryCount(prev => prev + 1);
      
      toast({
        title: "MCP Connection Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsReconnecting(false);
    }
  };

  // Force a reconnection (for manual retry button)
  const handleReconnect = useCallback(async () => {
    if (isReconnecting) return;
    
    // Clean up and try again
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    mcpCollaboration.cleanup();
    setIsConnected(false);
    
    initializeMCPCollaboration();
  }, [isReconnecting]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (connRetryRef.current) {
        clearTimeout(connRetryRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      mcpCollaboration.cleanup();
    };
  }, []);

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

  // Enhanced Collaboration status indicator
  const CollaborationStatus = () => {
    if (!canvasId) return null;
    
    let statusText = "Connecting to MCP...";
    let statusColor = "bg-yellow-500";
    
    if (isReconnecting) {
      statusText = "Reconnecting...";
      statusColor = "bg-yellow-500 animate-pulse";
    } else if (isConnected) {
      statusText = `${collaborators.length} collaborator${collaborators.length !== 1 ? 's' : ''}`;
      statusColor = "bg-green-500";
    } else if (connectionError) {
      statusText = `MCP Error (Retry ${retryCount})`;
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
        <span className="text-sm">Share MCP Canvas</span>
      </div>
    );
  };

  // Display collaborator cursors if available
  const CollaboratorCursors = () => {
    if (!canvasId || !isConnected || collaborators.length === 0) return null;
    
    return (
      <div className="fixed bottom-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-md z-50 shadow-lg">
        <div className="text-sm font-medium mb-1">Active MCP Users</div>
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

  // Project selection UI if no project is selected
  const ProjectSelector = () => {
    if (selectedProject) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Select Supabase Project</h2>
          {supabaseProjects.length === 0 ? (
            <p>Loading projects...</p>
          ) : (
            <div className="space-y-4">
              {supabaseProjects.map(project => (
                <div 
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center space-x-2"
                >
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground">{project.region}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        onChanged={(changed) => {
          if (onChanged) onChanged(changed);
          if (changed && isConnected) {
            // In a real implementation, we'd save the canvas state
            // This would involve getting the canvas JSON and saving it
            // mcpCollaboration.saveCanvasState(canvasState);
          }
        }}
        canvasId={canvasId || undefined}
        isCollaborative={!!canvasId && isConnected}
        onMouseMove={(x, y) => {
          if (isConnected) canvasRealtime.updateCursorPosition(x, y);
        }}
      />
      <ProjectSelector />
      <CollaborationStatus />
      <SharingInfo />
      <CollaboratorCursors />
    </>
  );
};

export default MCPCollaborationWrapper; 