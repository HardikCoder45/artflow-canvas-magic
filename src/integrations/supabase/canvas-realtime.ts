import { supabase, updateCollaboratorPresence } from "./client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { REALTIME_CONFIG, getCanvasChannelName, initializeRealtimeDebug } from "./config";

// Initialize realtime debugging
initializeRealtimeDebug();

interface CanvasAction {
  type: 'object_added' | 'object_modified' | 'object_removed' | 'canvas_cleared' | 'multiple_objects_added' | 'position_changed' | 'cursor_moved';
  payload: any;
  userId: string;
  timestamp: number;
}

interface PresenceUser {
  user_id: string;
  online_at: string;
  user_name?: string;
  user_color?: string;
  cursor_position?: { x: number; y: number };
  active_tool?: string;
}

class CanvasRealtimeManager {
  private channel: RealtimeChannel | null = null;
  private canvasId: string | null = null;
  private userId: string;
  private userName: string | null = null;
  private userColor: string | null = null;
  private onActionCallback: ((action: CanvasAction) => void) | null = null;
  private onPresenceCallback: ((users: PresenceUser[]) => void) | null = null;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = REALTIME_CONFIG.MAX_CONNECTION_ATTEMPTS;
  private sessionChecked: boolean = false;
  private reconnectOnVisibilityChange: boolean = REALTIME_CONFIG.RECONNECT_ON_VISIBILITY_CHANGE;
  private heartbeatInterval: number | null = null;
  private cursorPosition: { x: number; y: number } | null = null;
  private activeTool: string | null = null;
  private isReconnecting: boolean = false;

  constructor() {
    // Generate a unique ID for this user that persists in localStorage
    const savedUserId = localStorage.getItem('artflow-user-id');
    if (savedUserId) {
      this.userId = savedUserId;
    } else {
      this.userId = `user_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('artflow-user-id', this.userId);
    }
    
    // Get saved username if available
    this.userName = localStorage.getItem('artflow-user-name');
    
    // Generate a random user color if not already saved
    this.userColor = localStorage.getItem('artflow-user-color') || 
      `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    localStorage.setItem('artflow-user-color', this.userColor);
    
    // Set up visibility change handler if enabled
    if (this.reconnectOnVisibilityChange && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Handle page visibility changes to reconnect if needed
   */
  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.canvasId && !this.isConnected()) {
      console.log('Page became visible, reconnecting to collaboration...');
      this.reconnect().catch(err => console.error('Error reconnecting on visibility change:', err));
    }
  };

  /**
   * Connect to a specific canvas collaboration room
   */
  public connect(canvasId: string): Promise<void> {
    this.canvasId = canvasId;
    this.connectionAttempts = 0;
    this.isReconnecting = false;
    
    // Check Supabase session status first
    return this.checkSession().then(() => this.attemptConnection());
  }
  
  /**
   * Set user information
   */
  public setUserInfo(userName?: string, userColor?: string) {
    if (userName) {
      this.userName = userName;
      localStorage.setItem('artflow-user-name', userName);
    }
    
    if (userColor) {
      this.userColor = userColor;
      localStorage.setItem('artflow-user-color', userColor);
    }
    
    // Update presence if connected
    if (this.channel) {
      this.updatePresence();
    }
  }
  
  /**
   * Update user cursor position
   */
  public updateCursorPosition(x: number, y: number) {
    this.cursorPosition = { x, y };
    
    // Broadcast cursor position to other users
    if (this.channel && this.canvasId) {
      this.broadcastAction('cursor_moved', this.cursorPosition);
      this.updatePresence();
    }
  }
  
  /**
   * Update user active tool
   */
  public updateActiveTool(tool: string) {
    this.activeTool = tool;
    
    // Update presence with new tool
    if (this.channel && this.canvasId) {
      this.updatePresence();
    }
  }
  
  /**
   * Update user presence information
   */
  private updatePresence() {
    if (!this.channel || !this.canvasId) return;
    
    try {
      const presenceData: PresenceUser = {
        user_id: this.userId,
        online_at: new Date().toISOString()
      };
      
      if (this.userName) {
        presenceData.user_name = this.userName;
      }
      
      if (this.cursorPosition) {
        presenceData.cursor_position = this.cursorPosition;
      }
      
      if (this.activeTool) {
        presenceData.active_tool = this.activeTool;
      }
      
      if (this.userColor) {
        presenceData.user_color = this.userColor;
      }
      
      // Track presence data in the channel
      this.channel.track(presenceData);
      
      // Also call the DB function to persist collaborator data
      updateCollaboratorPresence(
        this.canvasId,
        this.userId,
        this.userName || undefined,
        this.userColor || undefined,
        this.cursorPosition || undefined,
        this.activeTool || undefined
      ).catch(err => {
        console.warn('Error updating collaborator presence in DB:', err);
        // Non-critical error, so we continue without failing
      });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }
  
  /**
   * Start the heartbeat interval to keep presence updated
   */
  private startHeartbeat() {
    // Clear any existing heartbeat
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
    }
    
    // Set new heartbeat interval
    this.heartbeatInterval = window.setInterval(() => {
      this.updatePresence();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Stop the heartbeat interval
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Check for an existing Supabase session
   */
  private async checkSession(): Promise<void> {
    if (this.sessionChecked) return;
    
    try {
      const { data } = await supabase.auth.getSession();
      console.log("Supabase auth session:", data?.session ? "Active" : "None");
      
      // If no session, try to sign in anonymously
      if (!data?.session) {
        console.log("No auth session - attempting anonymous sign-in");
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn("Anonymous sign-in failed:", error.message);
          // Continue anyway, we'll try with just the anon key
        } else {
          console.log("Anonymous sign-in successful");
        }
      }
      
      this.sessionChecked = true;
    } catch (error) {
      console.warn("Failed to check session, will proceed anonymously:", error);
    }
  }

  private attemptConnection(): Promise<void> {
    // Create a channel for this specific canvas with PUBLIC access
    const channelName = getCanvasChannelName(this.canvasId!);
    
    // Try with a more permissive configuration
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { 
          self: REALTIME_CONFIG.BROADCAST_SELF,
          ack: true
        },
        presence: { 
          key: this.userId 
        },
      },
    });

    console.log(`Creating realtime channel for ${channelName}`);

    // Set up channel event handlers with more verbose logging
    this.channel
      .on('broadcast', { event: 'canvas_action' }, ({ payload }) => {
        console.log('Received broadcast:', payload?.type);
        if (this.onActionCallback && payload.userId !== this.userId) {
          this.onActionCallback(payload);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log(`User ${key} joined. Current users:`, newPresences);
        if (this.onPresenceCallback) {
          const presenceState = this.channel?.presenceState() || {};
          this.onPresenceCallback(Object.values(presenceState).flat());
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log(`User ${key} left`, leftPresences);
        if (this.onPresenceCallback) {
          const presenceState = this.channel?.presenceState() || {};
          this.onPresenceCallback(Object.values(presenceState).flat());
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (this.onPresenceCallback) {
          const presenceState = this.channel?.presenceState() || {};
          this.onPresenceCallback(Object.values(presenceState).flat());
        }
      })
      .on('system', { event: 'error' }, (err) => {
        console.error('Realtime system error:', err);
        // Try to reconnect on error after a delay if not already reconnecting
        if (!this.isReconnecting && this.canvasId) {
          this.isReconnecting = true;
          setTimeout(() => {
            this.reconnect().finally(() => {
              this.isReconnecting = false;
            });
          }, 3000);
        }
      })
      .on('system', { event: '*' }, (event) => {
        console.log('System event:', event);
      });

    // Subscribe to the channel with enhanced debug logging
    return new Promise((resolve, reject) => {
      if (!this.channel) {
        reject(new Error("Channel creation failed"));
        return;
      }
      
      console.log(`Subscribing to channel ${channelName}`);
      
      this.channel.subscribe(async (status, err) => {
        console.log(`Channel status: ${status}`, err || '');
        
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully connected to ${channelName}`);
          // Reset connection attempts on success
          this.connectionAttempts = 0;
          
          // Track presence for this user
          try {
            this.updatePresence();
            this.startHeartbeat();
            resolve();
          } catch (error) {
            console.error("Error tracking presence:", error);
            // Continue anyway - presence is not critical
            resolve();
          }
        } else if (status === 'SUBSCRIPTION_ERROR' || status === 'CHANNEL_ERROR') {
          console.error('Subscription error details:', err);
          this.connectionAttempts++;
          console.warn(`Subscription attempt ${this.connectionAttempts} failed for ${channelName}`);
          
          if (this.connectionAttempts < this.maxConnectionAttempts) {
            const delay = Math.min(
              REALTIME_CONFIG.BASE_RETRY_DELAY * Math.pow(1.5, this.connectionAttempts-1), 
              REALTIME_CONFIG.MAX_RETRY_DELAY
            );
            
            console.log(`Retrying connection in ${delay/1000} seconds... (Attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`);
            
            setTimeout(() => {
              // Close previous channel if exists
              if (this.channel) {
                try {
                  this.channel.unsubscribe();
                } catch (e) {
                  console.warn("Error unsubscribing from previous channel:", e);
                }
              }
              
              // Try a fallback approach with minimal config
              this.channel = supabase.channel(channelName);
              
              // Minimal setup for retry
              this.channel
                .on('broadcast', { event: 'canvas_action' }, ({ payload }) => {
                  if (this.onActionCallback && payload.userId !== this.userId) {
                    this.onActionCallback(payload);
                  }
                });
              
              this.channel.subscribe((retryStatus) => {
                if (retryStatus === 'SUBSCRIBED') {
                  console.log(`Successfully connected on retry ${this.connectionAttempts}`);
                  resolve();
                } else {
                  this.attemptConnection()
                    .then(resolve)
                    .catch(reject);
                }
              });
            }, delay);
          } else {
            // Last attempt failed, but we'll resolve anyway with a fallback mechanism
            console.warn("Using fallback collaboration mode after failed attempts");
            resolve(); // Resolve anyway to allow app to function in degraded mode
          }
        } else if (status === 'CLOSED') {
          // Channel was closed
          console.log("Channel was closed");
          
          // Stop heartbeat
          this.stopHeartbeat();
          
          // If this was intentional, do nothing
          // Otherwise attempt reconnection
          if (this.connectionAttempts < this.maxConnectionAttempts) {
            setTimeout(() => {
              this.attemptConnection().catch(e => console.error("Reconnection failed:", e));
            }, REALTIME_CONFIG.BASE_RETRY_DELAY);
          }
        }
      });
    });
  }

  /**
   * Disconnect from the current canvas channel
   */
  public disconnect(): void {
    // Stop heartbeat
    this.stopHeartbeat();
    
    if (this.channel) {
      try {
        this.channel.unsubscribe();
      } catch (e) {
        console.warn("Error unsubscribing from channel:", e);
      }
      this.channel = null;
      this.canvasId = null;
    }
  }

  /**
   * Broadcast a canvas action to all connected users
   */
  public broadcastAction(type: CanvasAction['type'], payload: any): void {
    if (!this.channel || !this.canvasId) {
      console.error("Cannot broadcast: Not connected to a canvas channel");
      return;
    }

    const action: CanvasAction = {
      type,
      payload,
      userId: this.userId,
      timestamp: Date.now(),
    };

    try {
      console.log(`Broadcasting action: ${type}`);
      this.channel.send({
        type: 'broadcast',
        event: 'canvas_action',
        payload: action,
      });
    } catch (error) {
      console.error("Error broadcasting action:", error);
    }
  }

  /**
   * Set a callback function to handle incoming canvas actions
   */
  public onAction(callback: (action: CanvasAction) => void): void {
    this.onActionCallback = callback;
  }
  
  /**
   * Set a callback function to handle presence updates
   */
  public onPresence(callback: (users: PresenceUser[]) => void): void {
    this.onPresenceCallback = callback;
    
    // If we already have presence data, send it immediately
    if (this.channel) {
      const presenceState = this.channel.presenceState();
      const users = Object.values(presenceState).flat();
      callback(users);
    }
  }

  /**
   * Get all currently connected users
   */
  public async getConnectedUsers(): Promise<PresenceUser[]> {
    if (!this.channel) return [];
    
    try {
      // Get the current presence state
      const presenceState = this.channel.presenceState();
      return Object.values(presenceState).flat();
    } catch (error) {
      console.error("Error getting connected users:", error);
      return [];
    }
  }

  /**
   * Get the current user's ID
   */
  public getCurrentUserId(): string {
    return this.userId;
  }
  
  /**
   * Get the current user's name
   */
  public getCurrentUserName(): string | null {
    return this.userName;
  }
  
  /**
   * Get the current user's color
   */
  public getCurrentUserColor(): string {
    return this.userColor || '#ff0000';
  }
  
  /**
   * Check if the channel is currently connected
   */
  public isConnected(): boolean {
    return !!this.channel;
  }
  
  /**
   * Force a reconnection attempt
   */
  public async reconnect(): Promise<boolean> {
    if (!this.canvasId) return false;
    
    try {
      this.disconnect();
      await this.connect(this.canvasId);
      return true;
    } catch (error) {
      console.error("Reconnection failed:", error);
      return false;
    }
  }
  
  /**
   * Clean up event listeners when the component is unmounted
   */
  public cleanup(): void {
    this.stopHeartbeat();
    this.disconnect();
    
    if (this.reconnectOnVisibilityChange && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}

// Export a singleton instance
export const canvasRealtime = new CanvasRealtimeManager(); 