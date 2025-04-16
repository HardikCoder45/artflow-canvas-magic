import { supabase } from "./client";
import { canvasRealtime } from "./canvas-realtime";

/**
 * MCP-based collaboration manager for ArtFlow
 * This provides a simplified approach to handling collaborative canvas sessions
 */
export class MCPCollaborationManager {
  private projectId: string | null = null;
  private organizationId: string | null = null;
  private currentCanvasId: string | null = null;
  private isInitialized: boolean = false;
  
  /**
   * Initialize collaboration with a Supabase project
   */
  async initialize(projectId: string, orgId?: string): Promise<boolean> {
    try {
      // Store project and organization IDs
      this.projectId = projectId;
      this.organizationId = orgId || null;
      
      // Check project status
      const project = await this.getProjectDetails();
      if (!project) {
        throw new Error("Failed to get project details");
      }
      
      console.log("MCP Collaboration initialized with project:", project.name);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize MCP collaboration:", error);
      return false;
    }
  }
  
  /**
   * Get project details using MCP
   */
  async getProjectDetails() {
    if (!this.projectId) {
      throw new Error("Project ID not set");
    }
    
    try {
      // Use the MCP function directly to get project details
      const response = await fetch(`/api/mcp/supabase/projects/${this.projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get project: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error getting project details:", error);
      return null;
    }
  }
  
  /**
   * Create a new canvas collaboration session
   */
  async createCanvas(name: string, description?: string): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error("MCP Collaboration not initialized");
    }
    
    try {
      // Create canvas session in the database
      const { data, error } = await supabase
        .from('canvas_sessions')
        .insert({
          name,
          description,
          is_public: true,
          canvas_state: { objects: [], background: '#ffffff' }
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      const canvasId = data.id;
      this.currentCanvasId = canvasId;
      
      // Set up realtime connection
      await canvasRealtime.connect(canvasId);
      
      return canvasId;
    } catch (error) {
      console.error("Error creating canvas:", error);
      return null;
    }
  }
  
  /**
   * Join an existing canvas session
   */
  async joinCanvas(canvasId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error("MCP Collaboration not initialized");
    }
    
    try {
      // Verify canvas exists
      const { data, error } = await supabase
        .from('canvas_sessions')
        .select('id, name')
        .eq('id', canvasId)
        .single();
      
      if (error || !data) {
        throw new Error("Canvas not found");
      }
      
      this.currentCanvasId = canvasId;
      
      // Connect to the realtime channel
      await canvasRealtime.connect(canvasId);
      
      return true;
    } catch (error) {
      console.error("Error joining canvas:", error);
      return false;
    }
  }
  
  /**
   * Get current canvas state
   */
  async getCanvasState(): Promise<any | null> {
    if (!this.currentCanvasId) {
      throw new Error("No active canvas");
    }
    
    try {
      const { data, error } = await supabase
        .from('canvas_sessions')
        .select('canvas_state')
        .eq('id', this.currentCanvasId)
        .single();
      
      if (error) throw error;
      
      return data?.canvas_state || null;
    } catch (error) {
      console.error("Error fetching canvas state:", error);
      return null;
    }
  }
  
  /**
   * Save canvas state
   */
  async saveCanvasState(canvasState: any): Promise<boolean> {
    if (!this.currentCanvasId) {
      throw new Error("No active canvas");
    }
    
    try {
      const { error } = await supabase
        .from('canvas_sessions')
        .update({
          canvas_state: canvasState,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentCanvasId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Error saving canvas state:", error);
      return false;
    }
  }
  
  /**
   * Get active collaborators
   */
  async getCollaborators(): Promise<any[]> {
    if (!this.currentCanvasId) {
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('canvas_id', this.currentCanvasId)
        .gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      return [];
    }
  }
  
  /**
   * Disconnect from current canvas
   */
  disconnect(): void {
    if (this.currentCanvasId) {
      canvasRealtime.disconnect();
      this.currentCanvasId = null;
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.disconnect();
    this.isInitialized = false;
  }
}

// Export a singleton instance
export const mcpCollaboration = new MCPCollaborationManager(); 