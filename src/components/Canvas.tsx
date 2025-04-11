import { useEffect, useRef } from "react";
import { fabric } from "fabric";
import { cn } from "@/lib/utils";

interface CanvasProps {
  className?: string;
  width?: number;
  height?: number;
  onCanvasCreated?: (canvas: fabric.Canvas) => void;
  showGrid?: boolean;
  gridSize?: number;
  bgColor?: string;
}

const Canvas = ({ 
  className, 
  width = 800, 
  height = 600, 
  onCanvasCreated,
  showGrid = true,
  gridSize = 20,
  bgColor = "#1a1a1a"
}: CanvasProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const isPanning = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number, y: number } | null>(null);
  const isAltKeyPressed = useRef<boolean>(false);

  useEffect(() => {
    let handleKeyDown: (e: KeyboardEvent) => void;
    let handleKeyUp: (e: KeyboardEvent) => void;
    let resizeObserver: ResizeObserver;

    // Create a new canvas instance
    const initCanvas = () => {
      // Clean up any existing canvas
      if (canvasRef.current) {
        try {
          const canvas = canvasRef.current;
          canvas.off(); // Remove event listeners first
          canvas.clear();
          canvas.dispose();
        } catch (error) {
          console.error("Error disposing canvas:", error);
        }
        canvasRef.current = null;
      }

      if (!canvasContainerRef.current) return;

      try {
        // Clear the container
        canvasContainerRef.current.innerHTML = '';

        // Create a new canvas element
        const canvasElement = document.createElement('canvas');
        canvasElement.width = width;
        canvasElement.height = height;
        canvasElement.style.width = "100%";
        canvasElement.style.height = "100%";
        canvasElement.id = "fabric-canvas-" + Date.now(); // Add unique ID
        canvasContainerRef.current.appendChild(canvasElement);

        // Initialize fabric canvas
        const canvas = new fabric.Canvas(canvasElement, {
          isDrawingMode: false, // Start with selection mode as default
          backgroundColor: bgColor,
          width: width,
          height: height,
          preserveObjectStacking: true,
          selection: true,
          renderOnAddRemove: true,
          fireRightClick: true,
          enableRetinaScaling: true, // Important for high-DPI displays
          imageSmoothingEnabled: true,
          includeDefaultValues: false, // Better performance
          defaultCursor: 'default', // Changed to default for better tool context
          hoverCursor: 'default', // Changed to default to allow tool-specific cursors
          selectionBorderColor: 'rgba(255, 255, 255, 0.5)',
          selectionColor: 'rgba(255, 255, 255, 0.1)',
          selectionLineWidth: 1,
          centeredScaling: true,
          centeredRotation: true,
          stopContextMenu: false, // Allow context menu to be handled by React
          uniformScaling: false, // Allow non-uniform scaling
          uniScaleKey: 'shiftKey', // Use shift for uniform scaling
          statefullCache: true, // Better performance for complex objects
          stateful: true // Ensure state is maintained between renders
        });
        
        // Set up event handlers
        handleKeyDown = function(e: KeyboardEvent) {
          if (e.code === 'Space' && !isPanning.current) {
            isPanning.current = true;
            if (canvasRef.current) {
              canvasRef.current.isDrawingMode = false;
              canvasRef.current.selection = false;
              canvasRef.current.defaultCursor = 'grab';
              // Only set cursor if the element exists
              const canvasEl = canvasRef.current.getElement();
              if (canvasEl && canvasEl.style) {
                canvasEl.style.cursor = 'grab';
              }
            }
          }
          
          // Also enable panning with Alt key
          if (e.key === 'Alt' && !isAltKeyPressed.current) {
            isAltKeyPressed.current = true;
            if (canvasRef.current) {
              canvasRef.current.isDrawingMode = false;
              canvasRef.current.selection = false;
              canvasRef.current.defaultCursor = 'grab';
              // Only set cursor if the element exists
              const canvasEl = canvasRef.current.getElement();
              if (canvasEl && canvasEl.style) {
                canvasEl.style.cursor = 'grab';
              }
            }
          }
        };
        
        handleKeyUp = function(e: KeyboardEvent) {
          if (e.code === 'Space' && isPanning.current) {
            isPanning.current = false;
            if (canvasRef.current) {
              canvasRef.current.defaultCursor = 'default';
              // Only set cursor if the element exists
              const canvasEl = canvasRef.current.getElement();
              if (canvasEl && canvasEl.style) {
                canvasEl.style.cursor = 'default';
              }
              // Return to previous state based on parent component's needs
              if (onCanvasCreated) {
                onCanvasCreated(canvasRef.current);
              }
            }
          }
          
          // Handle Alt key release
          if (e.key === 'Alt' && isAltKeyPressed.current) {
            isAltKeyPressed.current = false;
            if (canvasRef.current) {
              canvasRef.current.defaultCursor = 'default';
              // Only set cursor if the element exists
              const canvasEl = canvasRef.current.getElement();
              if (canvasEl && canvasEl.style) {
                canvasEl.style.cursor = 'default';
              }
              // Return to previous state
              if (onCanvasCreated) {
                onCanvasCreated(canvasRef.current);
              }
            }
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Handle mouse events for panning and object manipulation
        canvas.on('mouse:down', function(opt) {
          if (isPanning.current || isAltKeyPressed.current || opt.e.button === 1) { // Middle mouse or Space+mouse or Alt+mouse
            canvas.isDrawingMode = false;
            canvas.selection = false;
            canvas.defaultCursor = 'grabbing';
            
            // Only set cursor if the element exists
            const canvasEl = canvas.getElement();
            if (canvasEl && canvasEl.style) {
              canvasEl.style.cursor = 'grabbing';
            }
            
            lastPosRef.current = { 
              x: opt.e.clientX, 
              y: opt.e.clientY 
            };
            opt.e.preventDefault();
          }
        });

        canvas.on('mouse:move', function(opt) {
          if ((isPanning.current || isAltKeyPressed.current || opt.e.button === 1) && lastPosRef.current) {
            const dx = opt.e.clientX - lastPosRef.current.x;
            const dy = opt.e.clientY - lastPosRef.current.y;
            
            // Pan the canvas
            const delta = new fabric.Point(dx, dy);
            canvas.relativePan(delta);
            
            // Get current transform
            const vpt = canvas.viewportTransform;
            if (!vpt) return;
            
            const zoom = canvas.getZoom();
            const canvasEl = canvas.getElement();
            const width = canvasEl?.width || 0;
            const height = canvasEl?.height || 0;
            
            // Calculate boundaries to ensure the canvas remains fully pannable
            const panBoundary = 0.2; // 20% buffer
            const zoomFactor = 1 / zoom;
            
            // Apply constraints so we can pan to see all parts of the canvas at any zoom level
            if (vpt[4] > width * zoomFactor * panBoundary) {
              vpt[4] = width * zoomFactor * panBoundary;
            } else if (vpt[4] < -width * zoomFactor * (1 - panBoundary)) {
              vpt[4] = -width * zoomFactor * (1 - panBoundary);
            }
            
            if (vpt[5] > height * zoomFactor * panBoundary) {
              vpt[5] = height * zoomFactor * panBoundary;
            } else if (vpt[5] < -height * zoomFactor * (1 - panBoundary)) {
              vpt[5] = -height * zoomFactor * (1 - panBoundary);
            }
            
            // Apply the updated viewport transform
            canvas.setViewportTransform(vpt);
            
            lastPosRef.current = { 
              x: opt.e.clientX, 
              y: opt.e.clientY 
            };
            
            opt.e.preventDefault();
          }
        });

        canvas.on('mouse:up', function() {
          // Only update cursor if we were panning with middle mouse
          // Space key panning is handled by keyup event
          if (lastPosRef.current && !isPanning.current && canvasRef.current) {
            canvasRef.current.defaultCursor = 'default';
            // Only set cursor if the element exists
            const canvasEl = canvasRef.current.getElement();
            if (canvasEl && canvasEl.style) {
              canvasEl.style.cursor = 'default';
            }
            lastPosRef.current = null;
          }
          
          if (lastPosRef.current) {
            lastPosRef.current = null;
          }
        });

        // Fix issue with specific areas not being drawable
        // Ensure the canvas viewportTransform is properly set
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        
        // Define resize function and observer
        const resizeCanvas = () => {
          if (canvasContainerRef.current && canvas) {
            const containerWidth = canvasContainerRef.current.clientWidth;
            const containerHeight = canvasContainerRef.current.clientHeight;
            
            if (containerWidth > 0 && containerHeight > 0) {
              canvas.setWidth(containerWidth);
              canvas.setHeight(containerHeight);
              canvas.setZoom(canvas.getZoom()); // Maintain zoom level
              canvas.renderAll();
              
              // Recreate grid if needed
              if (showGrid) {
                // Remove existing grid
                const objects = canvas.getObjects();
                const existingGrid = objects.find(obj => obj.data?.type === 'grid');
                if (existingGrid) {
                  canvas.remove(existingGrid);
                }
                createGrid(canvas, gridSize);
              }
            }
          }
        };
        
        // Set resize observer to handle window resizing
        resizeObserver = new ResizeObserver(resizeCanvas);
        if (canvasContainerRef.current) {
          resizeObserver.observe(canvasContainerRef.current);
        }

        // Store reference
        canvasRef.current = canvas;
        
        // Force initial render
        requestAnimationFrame(() => canvas.renderAll());

        // Set up brush for when drawing mode is enabled
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = 5; 
        canvas.freeDrawingBrush.color = "#ffffff";
        canvas.freeDrawingBrush.strokeLineCap = 'round';
        canvas.freeDrawingBrush.strokeLineJoin = 'round';
        
        // Create the dotted grid background
        if (showGrid) {
          createGrid(canvas, gridSize);
        }
        
        // CRUCIAL FIX: After a path is created, immediately make it permanent
        canvas.on('path:created', function(e) {
          if (!e.path) return;
          
          // Configure new path to stay visible
          e.path.selectable = true;
          e.path.evented = true;
          
          // This ensures that strokes remain after mouse up
          requestAnimationFrame(() => {
            canvas.renderAll();
            
            // Notify parent component about the new state with a small delay
            if (onCanvasCreated) {
              onCanvasCreated(canvas);
            }
          });
        });

        // Setup mouse wheel for zooming
        canvas.on('mouse:wheel', function(opt) {
          const delta = opt.e.deltaY;
          let zoom = canvas.getZoom();
          zoom *= 0.999 ** delta;
          
          // Limit zoom levels
          if (zoom > 20) zoom = 20;
          if (zoom < 0.1) zoom = 0.1;
          
          // Calculate point to zoom to
          const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
          
          // First pan to position the zoom point at the center of the canvas
          const vpt = canvas.viewportTransform;
          if (!vpt) return;

          // Zoom to point
          canvas.zoomToPoint(point, zoom);
          
          // Ensure canvas is fully pannable even at high zoom levels
          const canvasEl = canvas.getElement();
          const width = canvasEl?.width || 0;
          const height = canvasEl?.height || 0;

          // Calculate boundaries to ensure the canvas remains fully pannable
          const panBoundary = 0.2; // 20% buffer
          const zoomFactor = 1 / zoom;

          // Apply constraints so we can pan to see all parts of the canvas at any zoom level
          if (vpt[4] > width * zoomFactor * panBoundary) {
            vpt[4] = width * zoomFactor * panBoundary;
          } else if (vpt[4] < -width * zoomFactor * (1 - panBoundary)) {
            vpt[4] = -width * zoomFactor * (1 - panBoundary);
          }

          if (vpt[5] > height * zoomFactor * panBoundary) {
            vpt[5] = height * zoomFactor * panBoundary;
          } else if (vpt[5] < -height * zoomFactor * (1 - panBoundary)) {
            vpt[5] = -height * zoomFactor * (1 - panBoundary);
          }
          
          // Apply the updated viewport transform
          canvas.setViewportTransform(vpt);
          
          opt.e.preventDefault();
          opt.e.stopPropagation();
        });

        // Initial notification to parent
        if (onCanvasCreated) {
          onCanvasCreated(canvas);
        }
      } catch (error) {
        console.error("Canvas initialization error:", error);
      }
    };

    // Try initializing
    initCanvas();

    // Clean up event listeners
    return () => {
      if (handleKeyDown) window.removeEventListener('keydown', handleKeyDown);
      if (handleKeyUp) window.removeEventListener('keyup', handleKeyUp);
      
      if (canvasContainerRef.current && resizeObserver) {
        resizeObserver.unobserve(canvasContainerRef.current);
      }
      
      // Canvas cleanup logic
      if (canvasRef.current) {
        try {
          const canvas = canvasRef.current;
          canvas.off();
          canvas.clear();
          canvas.dispose();
        } catch (error) {
          console.error("Error cleaning up canvas:", error);
        }
        canvasRef.current = null;
      }
    };
  }, [width, height, onCanvasCreated, showGrid, gridSize, bgColor]);

  // Function to create a dotted grid
  const createGrid = (canvas: fabric.Canvas, size: number) => {
    const gridGroup = new fabric.Group([], { selectable: false, evented: false });
    
    // Get actual canvas dimensions accounting for zoom and pan
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    // Create vertical lines
    for (let i = 0; i <= canvasWidth; i += size) {
      const line = new fabric.Line([i, 0, i, canvasHeight], {
        stroke: 'rgba(255, 255, 255, 0.2)',
        strokeWidth: 1,
        strokeDashArray: [2, 2],
        selectable: false
      });
      gridGroup.addWithUpdate(line);
    }
    
    // Create horizontal lines
    for (let i = 0; i <= canvasHeight; i += size) {
      const line = new fabric.Line([0, i, canvasWidth, i], {
        stroke: 'rgba(255, 255, 255, 0.2)',
        strokeWidth: 1,
        strokeDashArray: [2, 2],
        selectable: false
      });
      gridGroup.addWithUpdate(line);
    }
    
    // Add grid to canvas and send to back
    canvas.add(gridGroup);
    gridGroup.sendToBack();
    
    // Tag with data attribute for identification
    gridGroup.data = { type: 'grid' };
  };

  // Function to update grid when needed
  useEffect(() => {
    if (canvasRef.current && showGrid !== undefined) {
      try {
        // Remove existing grid
        const objects = canvasRef.current.getObjects();
        const existingGrid = objects.find(obj => obj.data?.type === 'grid');
        if (existingGrid) {
          canvasRef.current.remove(existingGrid);
        }
        
        // Create new grid if needed
        if (showGrid) {
          createGrid(canvasRef.current, gridSize || 20);
        }
        
        canvasRef.current.renderAll();
      } catch (error) {
        console.error("Error updating grid:", error);
      }
    }
  }, [showGrid, gridSize]);

  // Update background color when it changes
  useEffect(() => {
    if (canvasRef.current && bgColor) {
      canvasRef.current.backgroundColor = bgColor;
      canvasRef.current.renderAll();
    }
  }, [bgColor]);

  return (
    <div 
      ref={canvasContainerRef}
      className={cn("relative w-full h-full canvas-wrapper overflow-hidden", className)}
      style={{ 
        touchAction: 'none',
        minHeight: '300px', // Ensure minimum size
        minWidth: '300px'
      }}
    />
  );
};

export default Canvas;
