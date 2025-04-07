
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
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create fabric canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      width,
      height,
      isDrawingMode: false,
    });

    // Set up brush
    fabricCanvas.freeDrawingBrush.color = "#000000";
    fabricCanvas.freeDrawingBrush.width = 5;

    // Modify default brush for smooth drawing
    if (fabricCanvas.freeDrawingBrush instanceof fabric.PencilBrush) {
      fabricCanvas.freeDrawingBrush.decimate = 8;
    }

    // Set up custom brush options
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

    // Set up events
    fabricCanvas.on('mouse:down', () => {
      setIsDrawing(true);
    });

    fabricCanvas.on('mouse:up', () => {
      setIsDrawing(false);
    });

    fabricCanvas.on('mouse:move', (event) => {
      if (fabricCanvas.isDrawingMode) {
        // Use mouse velocity to adjust brush width for pressure sensitivity simulation
        if (event.e && isDrawing) {
          const velocity = Math.sqrt(
            Math.pow(event.e.movementX || 0, 2) + 
            Math.pow(event.e.movementY || 0, 2)
          );
          
          // Adjust brush width based on velocity (faster = thinner, slower = thicker)
          // But only if it's not too extreme and we're actually drawing
          if (velocity > 0 && fabricCanvas.freeDrawingBrush) {
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

    setCanvas(fabricCanvas);
    
    // Notify parent component
    if (onCanvasCreated) {
      onCanvasCreated(fabricCanvas);
    }
    
    toast({
      title: "Canvas Ready",
      description: "Start creating your masterpiece with various brush textures!",
      duration: 3000,
    });

    // Cleanup on unmount
    return () => {
      fabricCanvas.dispose();
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
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={cn("relative canvas-wrapper", className)}>
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
