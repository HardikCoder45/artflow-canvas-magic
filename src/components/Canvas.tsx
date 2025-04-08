
import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CanvasProps {
  className?: string;
  width?: number;
  height?: number;
  onCanvasCreated?: (canvas: fabric.Canvas) => void;
}

const Canvas = ({ className, width = 800, height = 600, onCanvasCreated }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPosX, setLastPosX] = useState(0);
  const [lastPosY, setLastPosY] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize canvas with better error handling
  useEffect(() => {
    // Short delay to ensure DOM is fully loaded
    const initTimer = setTimeout(() => {
      if (!canvasRef.current) return;
      
      try {
        // Create fabric canvas
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
          backgroundColor: "#ffffff",
          width,
          height,
          isDrawingMode: false,
          selection: true,
          preserveObjectStacking: true,
        });
        
        // Store in ref for cleanup
        fabricCanvasRef.current = fabricCanvas;
        
        // Set up brush
        if (fabricCanvas.freeDrawingBrush) {
          fabricCanvas.freeDrawingBrush.color = "#000000";
          fabricCanvas.freeDrawingBrush.width = 5;
          
          // Modify default brush for smooth drawing
          if (fabricCanvas.freeDrawingBrush instanceof fabric.PencilBrush) {
            fabricCanvas.freeDrawingBrush.decimate = 8;
          }
        }
        
        // Set up custom brush options
        if (typeof fabric.PatternBrush !== 'undefined') {
          fabric.PatternBrush.prototype.getPatternSrc = function() {
            // Default pattern if none specified
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = 10;
            patternCanvas.height = 10;
            const ctx = patternCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = this.color || 'rgb(0,0,0)';
              ctx.fillRect(0, 0, 10, 10);
            }
            return patternCanvas;
          };
        }
        
        // Set up events
        fabricCanvas.on('mouse:down', (opt) => {
          setIsDrawing(true);
          
          // Handle panning with middle mouse button or space + drag
          if (opt.e.button === 1 || (opt.e.shiftKey && !fabricCanvas.isDrawingMode)) {
            setIsPanning(true);
            fabricCanvas.selection = false;
            setLastPosX(opt.e.clientX);
            setLastPosY(opt.e.clientY);
            fabricCanvas.setCursor('grab');
          }
        });
        
        fabricCanvas.on('mouse:up', () => {
          setIsDrawing(false);
          setIsPanning(false);
          fabricCanvas.selection = true;
          fabricCanvas.setCursor('default');
        });
        
        fabricCanvas.on('mouse:move', (event) => {
          // Handle panning
          if (isPanning && event.e) {
            const deltaX = event.e.clientX - lastPosX;
            const deltaY = event.e.clientY - lastPosY;
            
            // Pan the canvas
            fabricCanvas.relativePan({ x: deltaX, y: deltaY });
            
            setLastPosX(event.e.clientX);
            setLastPosY(event.e.clientY);
            return;
          }
          
          if (fabricCanvas.isDrawingMode) {
            // Use mouse velocity to adjust brush width for pressure sensitivity simulation
            if (event.e && isDrawing && fabricCanvas.freeDrawingBrush) {
              const velocity = Math.sqrt(
                Math.pow(event.e.movementX || 0, 2) + 
                Math.pow(event.e.movementY || 0, 2)
              );
              
              // Adjust brush width based on velocity (faster = thinner, slower = thicker)
              // But only if it's not too extreme and we're actually drawing
              if (velocity > 0) {
                const currentWidth = fabricCanvas.freeDrawingBrush.width;
                const minWidth = Math.max(currentWidth * 0.5, 1); // Don't go below 1px
                const maxWidth = currentWidth * 1.5; // Don't expand too much
                
                // Inverse relationship - faster movement = thinner line
                const speedFactor = Math.max(0.1, Math.min(1.0, 10 / (velocity + 5)));
                const dynamicWidth = currentWidth * speedFactor;
                
                // Apply constrained width
                const newWidth = Math.max(minWidth, Math.min(maxWidth, dynamicWidth));
                fabricCanvas.freeDrawingBrush.width = newWidth;
              }
            }
          }
        });
        
        // Remove mouse wheel zoom handler to fix the clearRect error
        // Removed: fabricCanvas.on('mouse:wheel', ...)
        
        setCanvas(fabricCanvas);
        setIsInitialized(true);
        
        // Notify parent component
        if (onCanvasCreated) {
          onCanvasCreated(fabricCanvas);
        }
        
        toast({
          title: "Canvas Ready",
          description: "Start creating your masterpiece with various brush textures!",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error initializing canvas:", error);
        toast({
          title: "Canvas Error",
          description: "There was an issue loading the canvas. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }, 200);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (error) {
          console.error("Error disposing canvas:", error);
        }
        fabricCanvasRef.current = null;
      }
      
      setIsInitialized(false);
      setCanvas(null);
    };
  }, [width, height, toast, onCanvasCreated]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // Dispatch a custom event that the parent can listen to
        window.dispatchEvent(new CustomEvent('art-canvas-undo'));
        e.preventDefault();
      }
      // Ctrl+Y or Cmd+Y for Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        window.dispatchEvent(new CustomEvent('art-canvas-redo'));
        e.preventDefault();
      }
      // Space key for panning
      if (e.key === ' ' && canvas) {
        canvas.defaultCursor = 'grab';
        document.body.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Space key released
      if (e.key === ' ' && canvas) {
        canvas.defaultCursor = 'default';
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas]);

  return (
    <div 
      ref={wrapperRef}
      className={cn("relative canvas-wrapper overflow-hidden", className)}
    >
      <canvas 
        ref={canvasRef} 
        className={cn(
          "border rounded-lg shadow-lg transition-all", 
          isDrawing && "shadow-xl"
        )} 
      />
      
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full">
        {width} × {height}
      </div>
    </div>
  );
};

export default Canvas;
