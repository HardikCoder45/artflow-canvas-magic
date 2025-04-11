import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Users, Copy, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CollaborationPanelProps {
  canvasState: any;
  onJoinSession: (sessionState: any) => void;
  onUserCursorMove: (userId: string, position: { x: number, y: number }) => void;
  isCollaborating?: boolean;
  activeUsers?: number;
  onCreateSession?: () => Promise<string>;
  onLeaveSession?: () => Promise<void>;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ 
  canvasState, 
  onJoinSession,
  onUserCursorMove,
  isCollaborating = false,
  activeUsers = 0,
  onCreateSession,
  onLeaveSession
}) => {
  const [sessionId, setSessionId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'join'>('create');
  const [sessionUrl, setSessionUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a session ID in the URL
    const url = new URL(window.location.href);
    const sessionParam = url.searchParams.get('session');
    
    if (sessionParam) {
      setSessionId(sessionParam);
      setDialogMode('join');
      setIsDialogOpen(true);
    }
  }, []);

  // Create a new collaboration session
  const handleCreateSession = async () => {
    if (!onCreateSession) return;
    
    const newSessionId = await onCreateSession();
    
    if (newSessionId) {
      setSessionId(newSessionId);
      
      // Create shareable URL
      const url = new URL(window.location.href);
      url.searchParams.set('session', newSessionId);
      setSessionUrl(url.toString());
      
      // Close dialog
      setIsDialogOpen(false);
      
      toast({
        title: "Collaboration session created",
        description: "Share the URL to invite others to collaborate",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create collaboration session",
        variant: "destructive",
      });
    }
  };

  // Join an existing collaboration session
  const handleJoinSession = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Please enter a valid session ID",
        variant: "destructive",
      });
      return;
    }
    
    // Join the session
    onJoinSession({ sessionId });
    
    // Create shareable URL
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    setSessionUrl(url.toString());
    
    // Close dialog
    setIsDialogOpen(false);
    
    toast({
      title: "Joined collaboration session",
      description: "You are now collaborating with others",
    });
  };

  // Leave the current collaboration session
  const handleLeaveSession = async () => {
    if (onLeaveSession) {
      await onLeaveSession();
    }
    
    setSessionId('');
    setSessionUrl('');
    
    // Remove the session parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.replaceState({}, document.title, url.toString());
    
    toast({
      title: "Left collaboration session",
      description: "You are no longer collaborating",
    });
  };

  // Copy session link to clipboard
  const copySessionLink = () => {
    navigator.clipboard.writeText(sessionUrl);
    toast({
      title: "Link copied",
      description: "Collaboration link copied to clipboard",
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!isCollaborating ? (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              setDialogMode('create');
              setIsDialogOpen(true);
            }}
          >
            <Users size={16} />
            Collaborate
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <UserCheck size={14} />
              {activeUsers} Active
            </Badge>
            <Button size="sm" variant="outline" onClick={copySessionLink}>
              <Copy size={14} />
            </Button>
            <Button size="sm" variant="outline" onClick={handleLeaveSession}>
              Leave
            </Button>
          </div>
        )}
      </div>

      {/* Create/Join Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create Collaboration Session' : 'Join Collaboration Session'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Create a new session and invite others to collaborate'
                : 'Enter a session ID to join an existing collaboration'}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'join' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="session-id">Session ID</label>
                <Input
                  id="session-id"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              {dialogMode === 'create' ? (
                <>
                  <Button variant="outline" onClick={() => setDialogMode('join')}>
                    Join Instead
                  </Button>
                  <Button onClick={handleCreateSession}>Create Session</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setDialogMode('create')}>
                    Create Instead
                  </Button>
                  <Button onClick={handleJoinSession}>Join Session</Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CollaborationPanel; 