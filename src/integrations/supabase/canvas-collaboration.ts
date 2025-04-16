import { fabric } from 'fabric';
import { canvasRealtime } from './canvas-realtime';
import { supabase } from './client';
import { saveCanvasOperation } from './client';
import { DB_CONFIG } from './config';

export interface CollaborationInitOptions {
  onRemoteAction?: (action: any) => void;
  onPresenceUpdate?: (users: any[]) => void;
  autoConnect?: boolean;
  canvasId?: string;
  userName?: string;
  userColor?: string;
}

/**
 * Class to handle collaborative canvas functionality
 */
export class CanvasCollaboration {
  private initialized: boolean = false;
  private canvasId: string | null = null;
  private remoteActionCallback: ((action: any) => void) | null = null;
  private presenceCallback: ((users: any[]) => void) | null = null;

  constructor(options?: CollaborationInitOptions) {
    if (options) {
      this.initialize(options);
    }
  }

  /**
   * Initialize collaboration for a specific canvas
   */
  public async initialize(options: CollaborationInitOptions): Promise<void> {
    if (this.initialized && this.canvasId === options.canvasId) {
      console.log('Collaboration already initialized for this canvas');
      return;
    }
    
    // Cleanup previous connection if any
    this.cleanup();

    // Store callbacks
    this.remoteActionCallback = options.onRemoteAction || null;
    this.presenceCallback = options.onPresenceUpdate || null;
    this.canvasId = options.canvasId || null;

    // Set up event listeners for remote actions
    if (this.remoteActionCallback) {
      canvasRealtime.onAction(action => {
        if (this.remoteActionCallback) {
          this.remoteActionCallback(action);
        }
      });
    }

    // Set up presence callbacks
    if (this.presenceCallback) {
      canvasRealtime.onPresence(users => {
        if (this.presenceCallback) {
          this.presenceCallback(users);
        }
      });
    }
    
    // Set user info if provided
    if (options.userName || options.userColor) {
      canvasRealtime.setUserInfo(options.userName, options.userColor);
    }

    // Connect to the canvas channel if canvasId is provided
    if (options.canvasId && options.autoConnect !== false) {
      try {
        await canvasRealtime.connect(options.canvasId);
        this.initialized = true;
        console.log(`Connected to canvas collaboration: ${options.canvasId}`);
      } catch (error) {
        console.error('Failed to connect to canvas collaboration:', error);
        throw error;
      }
    } else {
      this.initialized = true;
    }
  }

  /**
   * Connect to a specific canvas collaboration
   */
  public async connect(canvasId: string): Promise<void> {
    if (this.canvasId === canvasId && canvasRealtime.isConnected()) {
      console.log('Already connected to this canvas');
      return;
    }

    this.canvasId = canvasId;
    
    try {
      await canvasRealtime.connect(canvasId);
      console.log(`Connected to canvas collaboration: ${canvasId}`);
    } catch (error) {
      console.error('Failed to connect to canvas collaboration:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the current canvas collaboration
   */
  public disconnect(): void {
    canvasRealtime.disconnect();
    this.canvasId = null;
  }

  /**
   * Broadcast a canvas action to all connected users
   */
  public async broadcastAction(
    type: string,
    payload: any,
    persistToDatabase: boolean = true
  ): Promise<void> {
    if (!this.canvasId) {
      console.error('Cannot broadcast: Not connected to a canvas');
      return;
    }

    // Broadcast action through the realtime channel
    canvasRealtime.broadcastAction(type as any, payload);

    // Optionally save action to database for persistence
    if (persistToDatabase) {
      try {
        await this.saveAction(type, payload);
      } catch (error) {
        console.error('Failed to save action to database:', error);
        // Continue anyway - realtime broadcast was successful
      }
    }
  }

  /**
   * Save a canvas action to the database for persistence
   */
  private async saveAction(type: string, payload: any): Promise<void> {
    if (!this.canvasId) {
      console.error('Cannot save action: Not connected to a canvas');
      return;
    }

    try {
      await saveCanvasOperation(
        this.canvasId,
        canvasRealtime.getCurrentUserId(),
        type,
        payload
      );
    } catch (error) {
      console.error('Error saving canvas operation:', error);
      throw error;
    }
  }

  /**
   * Update cursor position
   */
  public updateCursorPosition(x: number, y: number): void {
    canvasRealtime.updateCursorPosition(x, y);
  }

  /**
   * Update active tool
   */
  public updateActiveTool(tool: string): void {
    canvasRealtime.updateActiveTool(tool);
  }

  /**
   * Set user information
   */
  public setUserInfo(userName?: string, userColor?: string): void {
    canvasRealtime.setUserInfo(userName, userColor);
  }

  /**
   * Get all currently connected users
   */
  public async getConnectedUsers(): Promise<any[]> {
    return canvasRealtime.getConnectedUsers();
  }

  /**
   * Get the current user's ID
   */
  public getCurrentUserId(): string {
    return canvasRealtime.getCurrentUserId();
  }

  /**
   * Get the current user's name
   */
  public getCurrentUserName(): string | null {
    return canvasRealtime.getCurrentUserName();
  }

  /**
   * Get the current user's color
   */
  public getCurrentUserColor(): string {
    return canvasRealtime.getCurrentUserColor();
  }

  /**
   * Check if connected to a canvas
   */
  public isConnected(): boolean {
    return canvasRealtime.isConnected();
  }

  /**
   * Check if collaboration is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Force a reconnection attempt
   */
  public async reconnect(): Promise<boolean> {
    return canvasRealtime.reconnect();
  }

  /**
   * Clean up event listeners when the component is unmounted
   */
  public cleanup(): void {
    canvasRealtime.cleanup();
    this.initialized = false;
    this.canvasId = null;
    this.remoteActionCallback = null;
    this.presenceCallback = null;
  }
}

/**
 * Helper function to setup collaboration on a canvas
 */
export const setupCanvasCollaboration = (canvas: fabric.Canvas, canvasId: string): CanvasCollaboration => {
  return new CanvasCollaboration({ canvasId });
}; 