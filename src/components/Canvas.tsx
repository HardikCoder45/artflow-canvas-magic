import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { fabric } from "fabric";
import { cn } from "@/lib/utils";

// Create theme variables with defaults to avoid context dependency
const THEME_COLORS = {
  dark: {
    background: "#1a1a1a",
    grid: "rgba(255, 255, 255, 0.3)"
  },
  light: {
    background: "#f8f8f8", 
    grid: "rgba(0, 0, 0, 0.2)"
  }
};

interface CanvasProps {
  className?: string;
  width?: number;
  height?: number;
  onCanvasCreated?: (canvas: fabric.Canvas) => void;
  showGrid?: boolean;
  gridSize?: number;
  bgColor?: string;
  theme?: "light" | "dark";
}

const Canvas = ({ 
  className, 
  width: propWidth, 
  height: propHeight, 
  onCanvasCreated,
  showGrid = true,
  gridSize = 20,
  bgColor,
  theme = "dark"
}: CanvasProps) => {
  // Force fullscreen dimensions by default 
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const isPanning = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number, y: number } | null>(null);
  const isAltKeyPressed = useRef<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const gridRef = useRef<fabric.Group | null>(null);
  
  // Use theme colors directly, avoiding React context
  const themeColors = THEME_COLORS[theme];
  const effectiveBgColor = bgColor || themeColors.background;
  const gridColor = themeColors.grid;

  // Measure container size to set canvas dimensions
  const updateCanvasDimensions = () => {
    if (!canvasContainerRef.current) return;
    
    const container = canvasContainerRef.current;
    const computedStyle = window.getComputedStyle(container);
    
    // Account for padding/borders when calculating available space
    const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const borderX = parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
    const borderY = parseFloat(computedStyle.borderTopWidth) + parseFloat(computedStyle.borderBottomWidth);
    
    // Get container's client dimensions
    const containerWidth = container.clientWidth - paddingX - borderX;
    const containerHeight = container.clientHeight - paddingY - borderY;
    
    // Use props if provided, otherwise use container dimensions
    const newWidth = propWidth || containerWidth || window.innerWidth;
    const newHeight = propHeight || containerHeight || window.innerHeight;
    
    setWidth(newWidth);
    setHeight(newHeight);
    
    // Also update the canvas if it already exists
    if (canvasRef.current && isInitialized) {
      canvasRef.current.setWidth(newWidth);
      canvasRef.current.setHeight(newHeight);
      canvasRef.current.calcOffset();
      canvasRef.current.renderAll();
      
      // Update grid to match new dimensions
      if (showGrid) {
        createGrid(canvasRef.current, gridSize);
      }
    }
  };

  // Create grid with optimized performance
  const createGrid = (canvas: fabric.Canvas, size: number) => {
    if (!canvas || !canvas.getElement()) return;
    
    try {
      // Remove any existing grid first
      if (gridRef.current) {
        canvas.remove(gridRef.current);
        gridRef.current = null;
      }
      
      // Use lines instead of dots for better performance with large canvases
      const gridLines: fabric.Line[] = [];
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      
      // Create vertical lines
      for (let x = 0; x <= canvasWidth; x += size) {
        const line = new fabric.Line([x, 0, x, canvasHeight], {
          stroke: gridColor,
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          hoverCursor: 'default'
        });
        gridLines.push(line);
      }
      
      // Create horizontal lines
      for (let y = 0; y <= canvasHeight; y += size) {
        const line = new fabric.Line([0, y, canvasWidth, y], {
          stroke: gridColor,
          strokeWidth: 0.5,
            selectable: false,
          evented: false,
          hoverCursor: 'default'
        });
        gridLines.push(line);
      }
      
      // Group all lines together
      const gridGroup = new fabric.Group(gridLines, { 
        selectable: false, 
        evented: false,
        hoverCursor: 'default',
        data: { type: 'grid' },
        objectCaching: false
      });
      
      canvas.add(gridGroup);
      gridGroup.sendToBack();
      gridRef.current = gridGroup;
      
      // Make all grid elements non-erasable
      gridLines.forEach(line => {
        line.erasable = false;
      });
      
      canvas.renderAll();
    } catch (error) {
      console.error("Error in grid creation:", error);
    }
  };

  // Properly dispose of canvas and clean up resources
  const disposeCanvas = () => {
      if (canvasRef.current) {
        try {
          const canvas = canvasRef.current;
          canvas.off(); 
          canvas.clear();
          canvas.dispose();
        canvasRef.current = null;
      } catch (error) {
        console.error("Error disposing canvas:", error);
      }
    }
  };

  // Initialize the canvas in a more reliable way
  const initCanvas = () => {
    console.log("Initializing canvas with FULL dimensions:", window.innerWidth, "x", window.innerHeight);
    
    // Reset state and clean up any existing canvas
    setHasError(false);
    disposeCanvas();

      if (!canvasContainerRef.current) {
        console.error("Canvas container not found");
        setHasError(true);
        return;
      }

      try {
        // Clear the container
        canvasContainerRef.current.innerHTML = '';

      // Create a new canvas element - FORCE fullscreen
        const canvasElement = document.createElement('canvas');
      canvasElementRef.current = canvasElement;
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
      canvasElement.style.width = "100vw";
      canvasElement.style.height = "100vh";
        canvasElement.id = "fabric-canvas-" + Date.now();
        canvasContainerRef.current.appendChild(canvasElement);

      // Create the Fabric canvas immediately
      try {
        const canvasOptions: fabric.ICanvasOptions = {
          isDrawingMode: false,
          backgroundColor: effectiveBgColor,
          width: window.innerWidth,
          height: window.innerHeight,
          preserveObjectStacking: true,
          selection: true,
          renderOnAddRemove: true,
          enableRetinaScaling: true,
          selectionBorderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          selectionColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          defaultCursor: 'default',
          hoverCursor: 'default'
        };

        // Force browser to process the newly added element before creating canvas
        window.getComputedStyle(canvasElement).getPropertyValue('display');
        
        const canvas = new fabric.Canvas(canvasElement.id, canvasOptions);
        canvasRef.current = canvas;

        // Fix common Fabric.js errors
        const patchFabricPrototypes = () => {
          // Fix hasStateChanged method
          const originalHasStateChanged = fabric.Object.prototype.hasStateChanged;
          fabric.Object.prototype.hasStateChanged = function(propertySet) {
            if (!this || !this.stateProperties) return false;
            try {
              return originalHasStateChanged.call(this, propertySet);
            } catch (e) {
              console.warn('Error in hasStateChanged', e);
              return false;
            }
          };
          
          // Fix isCacheDirty method
          const originalIsCacheDirty = fabric.Object.prototype.isCacheDirty;
          fabric.Object.prototype.isCacheDirty = function() {
            try {
              return originalIsCacheDirty.call(this);
            } catch (e) {
              console.warn('Error in isCacheDirty', e);
              return true;
            }
          };
        };
        
        patchFabricPrototypes();
        
        // Create grid and complete initialization in a single frame
        if (showGrid) {
          createGrid(canvas, gridSize);
        }
        
        // Finalize initialization
        setIsInitialized(true);
        console.log("Canvas created successfully with dimensions:", canvas.width, "x", canvas.height);
        
        // Notify parent and broadcast event
        if (onCanvasCreated) {
          onCanvasCreated(canvas);
        }

        // Dispatch event for parent components
        window.dispatchEvent(new CustomEvent('artcanvas-initialized'));
        
      } catch (error) {
        console.error("Error creating Fabric canvas:", error);
        setHasError(true);
        if (canvasContainerRef.current) {
          canvasContainerRef.current.innerHTML = 
            '<div class="bg-red-600 text-white p-4 rounded">Failed to initialize canvas. Please refresh the page.</div>';
        }
      }
    } catch (error) {
      console.error("Canvas initialization error:", error);
        setHasError(true);
        
        // Show error message
        if (canvasContainerRef.current) {
          canvasContainerRef.current.innerHTML = '<div class="bg-red-600 text-white p-4 rounded">Error initializing canvas. Please try refreshing the page.</div>';
        }
      }
    };

  // Measure container and update dimensions on mount and prop changes
  useLayoutEffect(() => {
    updateCanvasDimensions();
  }, [propWidth, propHeight]);

  // Main effect for canvas initialization
  useEffect(() => {
    // Use a brief timeout to ensure container dimensions are finalized
    const timer = setTimeout(() => {
      updateCanvasDimensions();
      initCanvas();
    }, 10);
    
    // Set up resize handler for responsive canvas
    const handleResize = () => {
      updateCanvasDimensions();
    };
    
    window.addEventListener('resize', handleResize);

    // Clean up resources
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      disposeCanvas();
    };
  }, []);
  
  // Update when dependencies change
  useEffect(() => {
    if (isInitialized && canvasRef.current) {
      // Update background color
      if (effectiveBgColor) {
        canvasRef.current.backgroundColor = effectiveBgColor;
      }
      
      // Update grid
        if (showGrid) {
        createGrid(canvasRef.current, gridSize);
      } else if (gridRef.current) {
        canvasRef.current.remove(gridRef.current);
        gridRef.current = null;
        }
        
        canvasRef.current.renderAll();
    }
  }, [showGrid, gridSize, gridColor, effectiveBgColor, theme, isInitialized]);

  // Add this useEffect to force full screen dimensions on startup
  useEffect(() => {
    console.log(`Setting canvas to fullscreen: ${window.innerWidth}x${window.innerHeight}`);
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
    
    // Also update canvas if already initialized
    if (canvasRef.current && isInitialized) {
      canvasRef.current.setWidth(window.innerWidth);
      canvasRef.current.setHeight(window.innerHeight);
      canvasRef.current.calcOffset();
      canvasRef.current.renderAll();
    }
  }, [isInitialized]);

  // Add a fullscreen resize handler
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Force canvas to full screen size
    const setFullScreenSize = () => {
      console.log("Forcing full screen canvas:", window.innerWidth, "x", window.innerHeight);
      
      // Set canvas dimensions to window dimensions
      canvasRef.current?.setWidth(window.innerWidth);
      canvasRef.current?.setHeight(window.innerHeight);
      
      // Update state dimensions
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
      
      // Render and update grid if needed
      canvasRef.current?.calcOffset();
      canvasRef.current?.renderAll();
    };
    
    // Initial size setting
    setFullScreenSize();
    
    // Update size on window resize
    const handleFullScreenResize = () => {
      setFullScreenSize();
    };
    
    window.addEventListener('resize', handleFullScreenResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleFullScreenResize);
    };
  }, [canvasRef]);

  return (
    <div className="w-screen h-screen" >
      <div 
        ref={canvasContainerRef}
        className={cn("fixed inset-0 canvas-wrapper", className)}
        style={{ 
          touchAction: 'none',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: 0
        }}
        data-testid="canvas-container"
      >
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-50">
            <div className="bg-red-600 text-white p-4 rounded shadow-lg">
              <h3 className="text-lg font-bold mb-2">Canvas Error</h3>
              <p>Failed to initialize canvas. Please try refreshing the page.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
