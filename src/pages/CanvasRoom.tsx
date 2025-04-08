
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArtCanvas from '@/components/ArtCanvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const CanvasRoom = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Set dark mode for canvas room
    document.body.classList.add('dark-theme');
    
    // Simulate loading delay for animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 600);
    
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('dark-theme');
    };
  }, []);

  const handleShareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Room link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
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
          
          <Button onClick={handleShareRoom} variant="outline" className="gap-1 border-white/20 bg-white/5 hover:bg-white/10">
            <Share2 size={16} />
            <span className="hidden md:inline">Share Room</span>
          </Button>
        </div>
      </div>

      <motion.div 
        ref={canvasContainerRef}
        className="container mx-auto py-20 px-0 h-[calc(100vh-80px)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {isLoaded ? (
          <div className="w-full h-full">
            <ArtCanvas fullScreen={true} />
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
