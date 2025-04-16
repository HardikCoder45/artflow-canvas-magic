import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CollaborativeArtCanvas } from '@/components';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Download, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { canvasRealtime } from '@/integrations/supabase/canvas-realtime';

const CanvasRoom = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('artflow-user-name') || `User-${Math.floor(Math.random() * 1000)}`;
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Set theme for canvas room
    document.body.style.overflow = 'hidden';
    
    // Short loading delay to ensure DOM is ready
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Start polling for collaborators if canvas ID exists
    let collaboratorInterval: number | null = null;
    if (id) {
      const updateCollaborators = async () => {
        try {
          const users = await canvasRealtime.getConnectedUsers();
          setCollaborators(users);
        } catch (error) {
          console.error("Failed to fetch collaborators:", error);
        }
      };
      
      // Initial fetch
      updateCollaborators();
      
      // Poll every 3 seconds
      collaboratorInterval = window.setInterval(updateCollaborators, 3000);
    }
    
    return () => {
      setIsMounted(false);
      document.body.style.overflow = '';
      clearTimeout(loadingTimer);
      if (collaboratorInterval) {
        clearInterval(collaboratorInterval);
      }
    };
  }, [id]);

  const handleShareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Room link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleDownload = () => {
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `artflow-${id?.slice(0, 8)}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success("Canvas downloaded!");
      } else {
        toast.error("Canvas not found!");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download canvas");
    }
  };

  // Handle username change
  const handleChangeUserName = () => {
    const newName = prompt("Enter your display name for this collaboration:", userName);
    if (newName && newName.trim() !== '') {
      setUserName(newName.trim());
      localStorage.setItem('artflow-user-name', newName.trim());
      
      // Update in realtime if connected
      if (canvasRealtime.isConnected()) {
        canvasRealtime.setUserInfo(newName.trim());
        toast.success("Display name updated!");
      }
    }
  };

  return (
    <div className={`min-h-screen h-screen w-screen overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-black' : 'bg-gradient-to-br from-gray-100 to-white'} text-foreground`}>
      <div className="fixed top-0 left-0 w-full bg-background/30 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-background/10">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Canvas Room: {id?.slice(0, 8)}</h1>
            
            {/* Collaborator indicator */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-background/10"
                onClick={handleChangeUserName}
              >
                <Users size={16} />
                <span className="hidden md:inline">
                  {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'} 
                </span>
                <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  You: {userName}
                </span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              onClick={handleDownload} 
              variant="outline" 
              size="sm" 
              className="gap-1 border-border/20 bg-background/5 hover:bg-background/10"
              disabled={isLoading}
            >
              <Download size={16} />
              <span className="hidden md:inline">Download</span>
            </Button>
            <Button 
              onClick={handleShareRoom} 
              variant="outline" 
              size="sm" 
              className="gap-1 border-border/20 bg-background/5 hover:bg-background/10"
            >
              <Share2 size={16} />
              <span className="hidden md:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>

      <motion.div 
        className="h-[calc(100vh-60px)] w-full mt-[60px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {!isLoading ? (
          <div className="w-full h-full">
            <CollaborativeArtCanvas 
              fullScreen={true}
              initialTool="pencil"
            />
            
            {/* Connected users visualization */}
            <div className="fixed bottom-4 right-4 flex flex-wrap-reverse gap-2 max-w-[200px] pointer-events-none">
              {collaborators.map((user, index) => (
                <div 
                  key={user.user_id || index}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ 
                    backgroundColor: user.user_color || '#888',
                    border: user.user_id === canvasRealtime.getCurrentUserId() ? '2px solid white' : 'none'
                  }}
                  title={user.user_name || `User ${index + 1}`}
                >
                  {(user.user_name || 'U').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <p className="text-lg text-foreground/70">Loading canvas...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CanvasRoom;
