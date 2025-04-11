import { useCallback, useState, useRef, useEffect, RefObject, MutableRefObject } from 'react';
import { fabric } from 'fabric';

type CanvasHandlers = {
  handleZoom: (event: React.WheelEvent<HTMLCanvasElement> | fabric.IEvent) => void;
  handlePanning: (e: fabric.IEvent) => void;
  handleCanvasCreated: (canvas: fabric.Canvas) => void;
  handleHistoryStateChange: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  handleKeyUp: (e: KeyboardEvent) => void;
  configureSelectTool: () => void;
  constrainCanvas: () => void;
};

type UseCanvasEventsParams = {
  canvasRef: MutableRefObject<fabric.Canvas | null>;
  historyRef: MutableRefObject<any[]>;
  historyIndexRef: MutableRefObject<number>;
  isDrawingRef: MutableRefObject<boolean>;
  isPanningRef: MutableRefObject<boolean>;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: string) => void;
  isToolPersistent: boolean;
  activeTool: string;
  containerRef: RefObject<HTMLDivElement>;
};

export const useCanvasEvents = ({
  canvasRef,
  historyRef,
  historyIndexRef,
  isDrawingRef,
  isPanningRef,
  setZoom,
  setActiveTool,
  isToolPersistent,
  activeTool,
  containerRef
}: UseCanvasEventsParams): CanvasHandlers => {
  // State for key presses and other temporary states
  const [spaceKeyPressed, setSpaceKeyPressed] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const historyUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRenderRef = useRef<boolean>(false);
  const MAX_HISTORY_LENGTH = 50;
  
  // Handle zoom with optimized performance
  const handleZoom = useCallback((event: React.WheelEvent<HTMLCanvasElement> | fabric.IEvent) => {
    if (!canvasRef.current) return;
    
    let deltaY: number;
    let clientX: number;
    let clientY: number;
    let target: Element;
    
    // Handle both React wheel events and fabric events
    if ('e' in event && event.e) {
      const wheelEvent = event.e as WheelEvent;
      deltaY = wheelEvent.deltaY;
      clientX = wheelEvent.clientX;
      clientY = wheelEvent.clientY;
      target = wheelEvent.target as Element;
      
      wheelEvent.preventDefault();
      wheelEvent.stopPropagation();
    } else {
      const wheelEvent = event as React.WheelEvent<HTMLCanvasElement>;
      deltaY = wheelEvent.deltaY;
      clientX = wheelEvent.clientX;
      clientY = wheelEvent.clientY;
      target = wheelEvent.target as Element;
      
      wheelEvent.preventDefault();
      wheelEvent.stopPropagation();
    }
    
    let zoom = canvasRef.current.getZoom();
    
    // Calculate zoom with improved sensitivity
    zoom *= 0.998 ** deltaY;
    
    // Limit max/min zoom
    if (zoom > 20) zoom = 20;
    if (zoom < 0.1) zoom = 0.1;
    
    // Get cursor position relative to canvas
    const pointer = canvasRef.current.getPointer({ 
      clientX, 
      clientY,
      target
    });
    
    // Point around which to zoom
    const point = new fabric.Point(pointer.x, pointer.y);
    
    // Apply zoom with point as origin
    canvasRef.current.zoomToPoint(point, zoom);
    
    // Update zoom state value
    setZoom(Math.round(zoom * 100));
    
    // Apply constraints to keep canvas in bounds
    constrainCanvas();
  }, [canvasRef, setZoom]);

  // Constrain canvas to keep it within reasonable bounds
  const constrainCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const vpt = canvasRef.current.viewportTransform;
    if (!vpt) return;
    
    // Get canvas dimensions
    const canvasWidth = canvasRef.current.getWidth() || 800;
    const canvasHeight = canvasRef.current.getHeight() || 600;
    
    // Calculate boundaries based on zoom
    const currentZoom = canvasRef.current.getZoom();
    const scaledWidth = canvasWidth * currentZoom;
    const scaledHeight = canvasHeight * currentZoom;
    
    // Set boundaries with padding
    const padding = 100;
    
    // Allow more flexible panning for large zoom levels
    const zoomFactor = 1 / currentZoom;
    
    // Constrain horizontal position
    if (vpt[4] > padding * zoomFactor) {
      vpt[4] = padding * zoomFactor;
    } else if (vpt[4] < canvasWidth - scaledWidth - padding * zoomFactor) {
      vpt[4] = canvasWidth - scaledWidth - padding * zoomFactor;
    }
    
    // Constrain vertical position
    if (vpt[5] > padding * zoomFactor) {
      vpt[5] = padding * zoomFactor;
    } else if (vpt[5] < canvasHeight - scaledHeight - padding * zoomFactor) {
      vpt[5] = canvasHeight - scaledHeight - padding * zoomFactor;
    }
    
    canvasRef.current.requestRenderAll();
  }, [canvasRef]);

  // Handle panning with improved handling
  const handlePanning = useCallback((e: fabric.IEvent) => {
    if (!canvasRef.current || !e.e) return;
    
    if (isPanningRef.current || spaceKeyPressed) {
      const delta = new fabric.Point(
        (e.e as MouseEvent).movementX, 
        (e.e as MouseEvent).movementY
      );
      canvasRef.current.relativePan(delta);
      
      // Ensure viewport stays within boundaries
      constrainCanvas();
    }
  }, [canvasRef, isPanningRef, spaceKeyPressed, constrainCanvas]);

  // Handle canvas history state changes with debounce
  const handleHistoryStateChange = useCallback(() => {
    if (!canvasRef.current) return;
    
    if (historyUpdateTimeoutRef.current) {
      clearTimeout(historyUpdateTimeoutRef.current);
    }
    
    historyUpdateTimeoutRef.current = setTimeout(() => {
      if (isDrawingRef.current) {
        pendingRenderRef.current = true;
        return;
      }
      
      try {
        // Create a more efficient history state
        const newState = {
          objects: canvasRef.current?.toJSON(['id']).objects || [],
          width: canvasRef.current?.width,
          height: canvasRef.current?.height,
          zoom: canvasRef.current?.getZoom(),
          viewportTransform: canvasRef.current?.viewportTransform,
        };
        
        const currentIndex = historyIndexRef.current;
        
        // If we're not at the end of history, truncate
        const newHistory = historyRef.current.slice(0, currentIndex + 1);
        
        // Add new state and limit history length
        newHistory.push(newState);
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          newHistory.shift();
        }
        
        // Update history references
        historyRef.current = newHistory;
        historyIndexRef.current = Math.min(currentIndex + 1, MAX_HISTORY_LENGTH - 1);
      } catch (error) {
        console.error("Failed to update history state", error);
      }
      
      historyUpdateTimeoutRef.current = null;
    }, 500);
  }, [canvasRef, historyRef, historyIndexRef, isDrawingRef]);

  // Configure select tool
  const configureSelectTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    canvasRef.current.defaultCursor = 'default';
    canvasRef.current.hoverCursor = 'move';
    canvasRef.current.renderAll();
  }, [canvasRef]);

  // Handle canvas creation and setup
  const handleCanvasCreated = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    
    // Configure initial state
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    
    // Setup event listeners for object modifications to track history
    canvas.on('object:modified', handleHistoryStateChange);
    canvas.on('object:added', handleHistoryStateChange);
    canvas.on('object:removed', handleHistoryStateChange);
    
    // Create initial history state
    handleHistoryStateChange();
  }, [canvasRef, handleHistoryStateChange]);

  // Handle key down events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !spaceKeyPressed) {
      setSpaceKeyPressed(true);
      if (canvasRef.current) {
        canvasRef.current.defaultCursor = 'grab';
        canvasRef.current.selection = false;
        
        const canvasEl = canvasRef.current.getElement();
        if (canvasEl && canvasEl.style) {
          canvasEl.style.cursor = 'grab';
        }
      }
    }
    
    // Handle tool shortcuts
    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'p':
          setActiveTool('pencil');
          break;
        case 'b':
          setActiveTool('brush');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 'r':
          setActiveTool('rectangle');
          break;
        case 'c':
          setActiveTool('circle');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'f':
          setActiveTool('fill');
          break;
        case 'k':
          setActiveTool('eyedropper');
          break;
        case 'g':
          setActiveTool('grid');
          break;
      }
    }
    
    // Handle undo/redo
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        // Handle undo
        e.preventDefault();
        // Implement undo logic
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        // Handle redo
        e.preventDefault();
        // Implement redo logic
      }
    }
  }, [canvasRef, spaceKeyPressed, setActiveTool]);

  // Handle key up events
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setSpaceKeyPressed(false);
      if (canvasRef.current) {
        if (activeTool === 'select') {
          canvasRef.current.defaultCursor = 'default';
          canvasRef.current.selection = true;
        } else {
          canvasRef.current.defaultCursor = 'crosshair';
        }
        
        const canvasEl = canvasRef.current.getElement();
        if (canvasEl && canvasEl.style) {
          canvasEl.style.cursor = activeTool === 'select' ? 'default' : 'crosshair';
        }
      }
    }
  }, [canvasRef, spaceKeyPressed, activeTool]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    handleZoom,
    handlePanning,
    handleCanvasCreated,
    handleHistoryStateChange,
    handleKeyDown,
    handleKeyUp,
    configureSelectTool,
    constrainCanvas
  };
};

export default useCanvasEvents; 