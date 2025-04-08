
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArtCanvas from '@/components/ArtCanvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Download, Undo, Redo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const CanvasRoom = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Set component as mounted
    setIsMounted(true);
    
    // Set dark mode for canvas room
    document.body.classList.add('dark-theme');
    document.body.style.overflow = 'hidden';
    
    // Simulate loading delay for animation
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsLoaded(true);
      }
    }, 600);
    
    return () => {
      clearTimeout(timer);
      setIsMounted(false);
      document.body.classList.remove('dark-theme');
      document.body.style.overflow = '';
    };
  }, []);

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

  return (
    <div className="min-h-screen h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="fixed top-0 left-0 w-full bg-black/30 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Canvas Room: {id?.slice(0, 8)}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDownload} 
              variant="outline" 
              size="sm" 
              className="gap-1 border-white/20 bg-white/5 hover:bg-white/10"
            >
              <Download size={16} />
              <span className="hidden md:inline">Download</span>
            </Button>
            <Button 
              onClick={handleShareRoom} 
              variant="outline" 
              size="sm" 
              className="gap-1 border-white/20 bg-white/5 hover:bg-white/10"
            >
              <Share2 size={16} />
              <span className="hidden md:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>

      <motion.div 
        ref={canvasContainerRef}
        className="h-[calc(100vh-60px)] w-full mt-[60px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {isMounted && isLoaded ? (
          <div className="w-full h-full">
            <ArtCanvas key={`canvas-${id}`} fullScreen={true} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <p className="text-lg text-white/70">Loading canvas...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CanvasRoom;
