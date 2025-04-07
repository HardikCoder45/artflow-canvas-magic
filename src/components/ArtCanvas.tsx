
import { useEffect, useState } from "react";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import LayersPanel from "./Layers";
import { fabric } from "fabric";
import { useToast } from "@/components/ui/use-toast";

const ArtCanvas = () => {
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const { toast } = useToast();
  
  // Set up event listeners for canvas creation
  const handleCanvasCreated = (canvas: fabric.Canvas) => {
    setFabricCanvas(canvas);
    
    // Initialize history
    const initialState = JSON.stringify(canvas.toJSON());
    
    // Set up event listeners for pressure sensitivity simulation
    canvas.on('mouse:move', (options) => {
      if (!canvas.isDrawingMode || !options.e) return;
      
      // Calculate velocity for pressure sensitivity simulation
      const now = Date.now();
      const velocity = calculateVelocity(options.e, now);
      
      // Adjust brush width based on velocity (faster = thinner)
      if (velocity > 0) {
        const currentWidth = canvas.freeDrawingBrush.width;
        const maxWidth = currentWidth * 1.5;
        const minWidth = currentWidth * 0.5;
        
        // Inverse relationship - faster movement = thinner line
        const newWidth = Math.max(
          minWidth, 
          Math.min(maxWidth, maxWidth - (velocity * (maxWidth - minWidth)))
        );
        
        canvas.freeDrawingBrush.width = newWidth;
      }
    });
  };
  
  // Simple velocity calculation for pressure sensitivity
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  
  const calculateVelocity = (e: MouseEvent, now: number): number => {
    if (!e) return 0;
    
    if (lastTime === 0) {
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
      return 0;
    }
    
    const dt = now - lastTime;
    if (dt === 0) return 0;
    
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / dt; // pixels per ms
    
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;
    
    return velocity;
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-2rem)]">
      <div className="flex-none w-full md:w-auto">
        <Toolbar canvas={fabricCanvas} />
      </div>
      
      <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="flex-grow overflow-auto p-4 bg-artflow-dark-purple/10 rounded-lg flex items-center justify-center">
          <Canvas 
            width={800} 
            height={600} 
            className="animate-fade-in"
            onCanvasCreated={handleCanvasCreated}
          />
        </div>
        
        <div className="flex-none w-full md:w-64">
          <LayersPanel canvas={fabricCanvas} />
          {/* Future panels can go here (effects, filters, etc.) */}
        </div>
      </div>
    </div>
  );
};

export default ArtCanvas;
