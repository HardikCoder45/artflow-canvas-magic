import { fabric } from "fabric";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import Canvas from "./Canvas";
import { 
  Brush, 
  Eraser, 
  Download, 
  Share2, 
  UndoIcon, 
  RedoIcon, 
  ArrowLeft,
  Grid,
  PenTool,
  Pencil,
  Type,
  Image as ImageIcon,
  Circle,
  Square,
  Triangle,
  Star,
  Sparkles,
  Highlighter,
  Palette,
  Pipette,
  Trash2,
  Copy,
  Scissors,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  SlidersHorizontal,
  Wand2,
  Droplets,
  PaintBucket,
  Spline,
  Ruler,
  Focus,
  Gauge,
  createLucideIcon,
  Dices,
  LineChart,
  FolderOpen,
  Save,
  Crop,
  SplitSquareVertical,
  AlignJustify,
  FlipHorizontal,
  FlipVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import ContextMenu from './ContextMenu';
import FloatingToolbar from './FloatingToolbar';
import { useTheme } from "next-themes";

// Define the DrawingTool type
type DrawingTool = "select" | "pencil" | "brush" | "spray" | "marker" | "calligraphy" | 
  "crayon" | "watercolor" | "glitter" | "eraser" | "rectangle" | "circle" | 
  "triangle" | "line" | "star" | "arrow" | "custom" | "blur" | "grayscale" | 
  "sepia" | "pixelate" | "noise" | "sharpen" | "eyedropper" | "fill" | 
  "text" | "layers" | "crop" | "grid" | "ruler" | "image" | "bringToFront" | 
  "sendToBack" | "rotateLeft" | "rotateRight" | "duplicate" | "delete" | "connector" |
  // New tools
  "polygon" | "pen" | "bezier" | "sticky" | "speech-bubble" | "flowchart" | 
  "gradient" | "pattern" | "free-transform" | "magnifier" | 
  "template" | "group" | "ungroup" | "align" | "distribute" | 
  "mask" | "handwriting" | "laser" | "timeline" | "emoji" |
  "snap" | "curves" | "chart" | "callout" | "shadow";

interface ArtCanvasProps {
  fullScreen?: boolean;
  onChanged?: (changed: boolean) => void;
  width?: number;
  height?: number;
  initialTool?: string;
  onToolSelect?: (tool: string) => void;
}

interface ToolbarPosition {
  x: number;
  y: number;
  position: "top" | "left" | "right" | "bottom";
  showLabels: boolean;
}

interface ToolOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  color?: string;
  size?: number;
}

// Define CanvasState interface for history management
interface CanvasState {
  objects: any[];
  width?: number;
  height?: number;
  zoom?: number;
  viewportTransform?: number[] | null;
}

// Define the missing Blur icon
const Blur = createLucideIcon('Blur', [
  ['circle', { cx: '12', cy: '12', r: '10', opacity: '0.5' }],
  ['circle', { cx: '12', cy: '12', r: '6', opacity: '0.7' }],
  ['circle', { cx: '12', cy: '12', r: '2', opacity: '0.9' }]
]);

// Define the toolbarPositions if it's missing
const toolbarPositions = [
  { id: "top", name: "Top" },
  { id: "left", name: "Left" },
  { id: "right", name: "Right" },
  { id: "bottom", name: "Bottom" },
];

// Define utilityTools if it's missing
const utilityTools = [
  { id: "select", name: "Select", icon: <Crop size={20} />, tooltip: "Select objects" },
  { id: "eyedropper", name: "Eyedropper", icon: <Pipette size={20} />, tooltip: "Pick color from canvas" },
  { id: "fill", name: "Fill", icon: <PaintBucket size={20} />, tooltip: "Fill tool" },
  { id: "text", name: "Text", icon: <Type size={20} />, tooltip: "Add text" },
  { id: "layers", name: "Layers", icon: <Layers size={20} />, tooltip: "Manage layers" },
  { id: "crop", name: "Crop", icon: <Crop size={20} />, tooltip: "Crop canvas" },
  { id: "grid", name: "Grid", icon: <Grid size={20} />, tooltip: "Toggle grid" },
  { id: "ruler", name: "Ruler", icon: <Ruler size={20} />, tooltip: "Measure distances" },
  { id: "image", name: "Image", icon: <ImageIcon size={20} />, tooltip: "Import image" },
];

const ArtCanvas = ({ fullScreen = false, onChanged, width = 800, height = 600, initialTool, onToolSelect }: ArtCanvasProps) => {
  // State declarations
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [redoStack, setRedoStack] = useState<CanvasState[]>([]);
  const [brushOpacity, setBrushOpacity] = useState(() => {
    const saved = localStorage.getItem('artflow-brush-opacity');
    return saved ? parseFloat(saved) : 1;
  });
  const [isMounted, setIsMounted] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const lastMousePosition = useRef<{ x: number, y: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const startDragPosRef = useRef<{ x: number, y: number } | null>(null);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const clipboardRef = useRef<fabric.Object | null>(null);

  // Canvas properties and settings
  const [canvasHeight, setCanvasHeight] = useState(height);
  const [canvasWidth, setCanvasWidth] = useState(width);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [bgColor, setBgColor] = useState("#1a1a1a");
  
  // Tool states consolidated into a single object
  const [toolState, setToolState] = useState<{
    activeTool: DrawingTool;
    previousTool: DrawingTool;
    isToolPersistent: boolean;
  }>(() => {
    return {
      activeTool: (localStorage.getItem('artflow-selected-tool') as DrawingTool) || "select",
      previousTool: (localStorage.getItem('artflow-previous-tool') as DrawingTool) || "select",
      isToolPersistent: localStorage.getItem('artflow-tool-persistent') !== 'false'
    };
  });

  // Drawing states
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  // Tool states
  const [activeTool, setActiveTool] = useState<DrawingTool>(() => {
    // Initialize from localStorage or default to "select"
    return (localStorage.getItem('artflow-selected-tool') as DrawingTool) || "select";
  });
  const [currentTool, setCurrentTool] = useState<DrawingTool>(() => {
    // Initialize from localStorage or default to "select"
    return (localStorage.getItem('artflow-selected-tool') as DrawingTool) || "select";
  });
  const [activeShape, setActiveShape] = useState<DrawingTool | null>(null);
  const [activeEffect, setActiveEffect] = useState<DrawingTool | null>(null);
  const [isToolPersistent, setIsToolPersistent] = useState(true);
  const [brushColor, setBrushColor] = useState(() => {
    return localStorage.getItem('artflow-brush-color') || "#000000";
  });
  const [brushSize, setBrushSize] = useState(() => {
    const saved = localStorage.getItem('artflow-brush-size');
    return saved ? parseInt(saved) : 5;
  });
  const [currentBrush, setCurrentBrush] = useState<DrawingTool>("pencil");
  const [currentBlendMode, setCurrentBlendMode] = useState("normal");
  
  // Drawing states
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [isShapeDrawing, setIsShapeDrawing] = useState(false);
  const [isEffectApplying, setIsEffectApplying] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  
  // Tool active states
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [isFillActive, setIsFillActive] = useState(false);
  const [isSprayActive, setIsSprayActive] = useState(false);
  const [isMarkerActive, setIsMarkerActive] = useState(false);
  const [isCalligraphyActive, setIsCalligraphyActive] = useState(false);
  const [isCrayonActive, setIsCrayonActive] = useState(false);
  const [isWatercolorActive, setIsWatercolorActive] = useState(false);
  const [isGlitterActive, setIsGlitterActive] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [isTextActive, setIsTextActive] = useState(false);
  const [isRectangleActive, setIsRectangleActive] = useState(false);
  const [isCircleActive, setIsCircleActive] = useState(false);
  const [isTriangleActive, setIsTriangleActive] = useState(false);
  const [isLineActive, setIsLineActive] = useState(false);
  const [isStarActive, setIsStarActive] = useState(false);
  const [isArrowActive, setIsArrowActive] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [isGrayscaleActive, setIsGrayscaleActive] = useState(false);
  const [isSepiaActive, setIsSepiaActive] = useState(false);
  const [isPixelateActive, setIsPixelateActive] = useState(false);
  const [isNoiseActive, setIsNoiseActive] = useState(false);
  const [isSharpenActive, setIsSharpenActive] = useState(false);
  
  // New tool states
  const [isPolygonActive, setIsPolygonActive] = useState(false);
  const [isPenActive, setIsPenActive] = useState(false); 
  const [isBezierActive, setIsBezierActive] = useState(false);
  const [isStickyActive, setIsStickyActive] = useState(false);
  const [isSpeechBubbleActive, setIsSpeechBubbleActive] = useState(false);
  const [isFlowchartActive, setIsFlowchartActive] = useState(false);
  const [isGradientActive, setIsGradientActive] = useState(false);
  const [isPatternActive, setIsPatternActive] = useState(false);
  const [isFreeTransformActive, setIsFreeTransformActive] = useState(false);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [isTemplateActive, setIsTemplateActive] = useState(false);
  const [isGroupActive, setIsGroupActive] = useState(false);
  const [isUngroupActive, setIsUngroupActive] = useState(false);
  const [isAlignActive, setIsAlignActive] = useState(false);
  const [isDistributeActive, setIsDistributeActive] = useState(false);
  const [isMaskActive, setIsMaskActive] = useState(false);
  const [isHandwritingActive, setIsHandwritingActive] = useState(false);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [isTimelineActive, setIsTimelineActive] = useState(false);
  const [isEmojiActive, setIsEmojiActive] = useState(false);
  const [isSnapActive, setIsSnapActive] = useState(false);
  const [isCurvesActive, setIsCurvesActive] = useState(false);
  const [isChartActive, setIsChartActive] = useState(false);
  const [isCalloutActive, setIsCalloutActive] = useState(false);
  const [isShadowActive, setIsShadowActive] = useState(false);
  
  // UI states
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isBrushSettingsOpen, setIsBrushSettingsOpen] = useState(false);
  const [isToolbarDragging, setIsToolbarDragging] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ 
    x: 20, 
    y: 20, 
    position: "bottom",
    showLabels: false 
  });
  const [activePalette, setActivePalette] = useState<string>("tools");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const minZoom = 0.1;
  const maxZoom = 5;
  
  // Navigation states
  const [spaceKeyPressed, setSpaceKeyPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  
  // History states
  const [undoStack, setUndoStack] = useState<fabric.Object[][]>([]);
  
  // Optimize performance by adding these flags
  const isDrawingRef = useRef(false);
  const pendingRenderRef = useRef(false);
  const historyUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_HISTORY_LENGTH = 30; // Limit history to avoid memory issues
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetObject: fabric.Object | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetObject: null,
  });
  
  // Add state for floating toolbar visibility and position
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(true);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState<{ x: number; y: number }>({
    x: 20,
    y: 100
  });
  
  const { toast } = useToast();
  const { theme } = useTheme();
  
  // Performance optimization refs
  const renderRequestRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const batchProcessingRef = useRef<boolean>(false);
  const renderTimeframe = 10; // ms between renders
  
  // Text formatting states
  const [showTextFormatToolbar, setShowTextFormatToolbar] = useState(false);
  
  // Add state declarations at the top of your component
  const [showTransformPanel, setShowTransformPanel] = useState(false);
  
  // Add this state at the top of your component
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Add this state at the top of your component
  const [showTimelinePanel, setShowTimelinePanel] = useState(false);
  const [timelineFrames, setTimelineFrames] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Fix 1: Add these state variables at the top of the component
  const [activeTextObject, setActiveTextObject] = useState<fabric.IText | null>(null);
  
  // Fix 2: Add the text control helper functions
  const showTextControls = (text: fabric.IText) => {
    setActiveTextObject(text);
    setShowTextFormatToolbar(true);
  };
  
  const hideTextControls = () => {
    setActiveTextObject(null);
    setShowTextFormatToolbar(false);
  };
  
  // Create a debounced history update function
  const debounceHistoryUpdate = useCallback(() => {
    if (historyUpdateTimeoutRef.current) {
      clearTimeout(historyUpdateTimeoutRef.current);
    }
    
    historyUpdateTimeoutRef.current = setTimeout(() => {
      generateHistoryState();
      historyUpdateTimeoutRef.current = null;
    }, 500); // Debounce for 500ms for better performance
  }, []);
  
  // Function declarations
  const generateHistoryState = useCallback(() => {
    if (!canvasRef.current) return null;
    
    // Cancel any pending history updates
    if (historyUpdateTimeoutRef.current) {
      clearTimeout(historyUpdateTimeoutRef.current);
      historyUpdateTimeoutRef.current = null;
    }
    
    // If currently drawing, defer history update
    if (isDrawingRef.current) {
      pendingRenderRef.current = true;
      return null;
    }
    
    const newState: CanvasState = {
      objects: canvasRef.current.getObjects().map(obj => obj.toObject(['id'])), // Only serialize essential properties
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        zoom: canvasRef.current.getZoom(),
        viewportTransform: canvasRef.current.viewportTransform,
      };
    
    // Update history stack with size limit
    setHistory(prevHistory => {
      // Truncate history at current position if we're not at the end
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      // Limit history length to prevent memory issues
      const limitedHistory = [...newHistory, newState].slice(-MAX_HISTORY_LENGTH);
      return limitedHistory;
    });
    
    // Update history index, accounting for potential truncation
    setHistoryIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      return Math.min(newIndex, MAX_HISTORY_LENGTH - 1);
    });
    
    // Clear redo stack when a new action is performed
    setRedoStack([]);
    
    return newState;
  }, [canvasRef, historyIndex, MAX_HISTORY_LENGTH]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    
    // Get cursor position relative to canvas
    const pointer = canvasRef.current.getPointer({ 
      clientX: e.clientX, 
      clientY: e.clientY,
      target: e.target as Element
    });
    
    // Find if there's an object under cursor
    const targetObject = canvasRef.current.findTarget(e as any, false);
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetObject
    });
    
    // If there's an object, select it
    if (targetObject) {
      canvasRef.current.setActiveObject(targetObject);
      canvasRef.current.renderAll();
    }
  }, [canvasRef]);

  const handleCloseContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleContextMenuAction = (action: string) => {
    if (!canvasRef.current) return;
    
    const activeObject = canvasRef.current.getActiveObject();
    
    switch (action) {
      case 'delete':
        if (activeObject) {
          canvasRef.current?.remove(activeObject);
          generateHistoryState();
        }
        break;
      case 'duplicate':
        if (activeObject) {
          activeObject.clone((cloned) => {
            if (cloned) {
              cloned.set({
                left: (cloned.left || 0) + 10,
                top: (cloned.top || 0) + 10,
              });
              canvasRef.current?.add(cloned);
              canvasRef.current?.setActiveObject(cloned);
              generateHistoryState();
            }
          });
        }
        break;
      case 'bringToFront':
        if (activeObject) {
          activeObject.bringToFront();
          generateHistoryState();
        }
        break;
      case 'bringForward':
        if (activeObject) {
          activeObject.bringForward();
          generateHistoryState();
        }
        break;
      case 'sendBackward':
        if (activeObject) {
          activeObject.sendBackward();
          generateHistoryState();
        }
        break;
      case 'sendToBack':
        if (activeObject) {
          activeObject.sendToBack();
          generateHistoryState();
        }
        break;
      case 'selectAll':
        const objects = canvasRef.current.getObjects();
        if (objects.length > 0) {
          canvasRef.current.discardActiveObject();
          const selectionObj = new fabric.ActiveSelection(objects, {
            canvas: canvasRef.current,
          });
          canvasRef.current.setActiveObject(selectionObj);
          canvasRef.current.requestRenderAll();
        }
        break;
      case 'paste':
        // Implement paste functionality
        break;
      default:
        break;
    }
    
    handleCloseContextMenu();
  };

  // Optimized rendering function
  const optimizedRender = useCallback(() => {
    if (!canvasRef.current) return;
    
    const currentTime = performance.now();
    
    // Cancel any pending render requests
    if (renderRequestRef.current !== null) {
      cancelAnimationFrame(renderRequestRef.current);
      renderRequestRef.current = null;
    }
    
    // If sufficient time has passed since last render, render immediately
    if (currentTime - lastRenderTimeRef.current > renderTimeframe) {
      canvasRef.current.renderAll();
      lastRenderTimeRef.current = currentTime;
      return;
    }
    
    // Otherwise, schedule a render for the next animation frame
    renderRequestRef.current = requestAnimationFrame(() => {
      if (canvasRef.current) {
        canvasRef.current.renderAll();
      }
      lastRenderTimeRef.current = performance.now();
      renderRequestRef.current = null;
    });
  }, []);
  
  // Apply optimizations when canvas is created
  const setupOptimizedRendering = useCallback((canvas: fabric.Canvas) => {
    // Override default renderAll method with an optimized version
    const originalRenderAll = canvas.renderAll.bind(canvas);
    
    canvas.renderAll = function() {
      // Skip rendering during batch operations
      if (batchProcessingRef.current) return;
      
      const currentTime = performance.now();
      
      // Cancel any pending render requests
      if (renderRequestRef.current !== null) {
        cancelAnimationFrame(renderRequestRef.current);
        renderRequestRef.current = null;
      }
      
      // If sufficient time has passed since last render, render immediately
      if (currentTime - lastRenderTimeRef.current > renderTimeframe) {
        originalRenderAll();
        lastRenderTimeRef.current = currentTime;
        return;
      }
      
      // Otherwise, schedule a render for the next animation frame
      renderRequestRef.current = requestAnimationFrame(() => {
        originalRenderAll();
        lastRenderTimeRef.current = performance.now();
        renderRequestRef.current = null;
      });
    };
    
    // Optimize object addition
    const originalAdd = canvas.add.bind(canvas);
    canvas.add = function(...objects: fabric.Object[]) {
      // Process all objects to ensure they have proper caching set up
      objects.forEach(obj => {
        if (!obj.objectCaching) {
          obj.objectCaching = true;
        }
      });
      
      return originalAdd(...objects);
    };
  }, []);
  
  // Modified handleCanvasCreated to add performance optimizations
  const handleCanvasCreated = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    
    // Apply performance optimizations
    fabric.Object.prototype.objectCaching = true;
    fabric.Object.prototype.statefullCache = true;
    fabric.Object.prototype.noScaleCache = false;
    
    // Set up optimized rendering
    setupOptimizedRendering(canvas);
    
    // Ensure canvas starts with consistent appearance
    canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));
    
    // Reset default settings
    canvas.isDrawingMode = false;
    canvas.selection = true;
    
    // Check if we have a saved tool in localStorage
    const savedTool = localStorage.getItem('artflow-selected-tool') as DrawingTool;
    
    // Update current tool state
    const toolToUse = savedTool || "select";
    setActiveTool(toolToUse);
    setCurrentTool(toolToUse);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('artcanvas-tool-selected', { 
      detail: { tool: toolToUse } 
    }));
    
    // Setup right-click context menu
    canvas.on('contextmenu', (e) => {
      if (e.e) {
        handleContextMenu(e.e as unknown as React.MouseEvent<HTMLCanvasElement>);
      }
      return false;
    });
    
    // Add event listener for object modifications to track history
    canvas.on('object:modified', debounceHistoryUpdate);
    canvas.on('object:added', debounceHistoryUpdate);
    canvas.on('object:removed', debounceHistoryUpdate);
    
    // Generate initial history state
    generateHistoryState();
  }, [canvasRef, handleContextMenu, debounceHistoryUpdate, generateHistoryState, setupOptimizedRendering, bgColor]);

  // Handle zooming
  const handleZoom = (event: React.WheelEvent<HTMLCanvasElement> | fabric.IEvent) => {
    if (!canvasRef.current) return;
    
    let deltaY: number;
    let clientX: number;
    let clientY: number;
    let target: Element;
    
    // Handle both React wheel events and fabric events
    if ('e' in event && event.e) {
      // This is a fabric.IEvent
      const wheelEvent = event.e as WheelEvent;
      deltaY = wheelEvent.deltaY;
      clientX = wheelEvent.clientX;
      clientY = wheelEvent.clientY;
      target = wheelEvent.target as Element;
      
      wheelEvent.preventDefault();
      wheelEvent.stopPropagation();
    } else {
      // This is a React.WheelEvent
      const wheelEvent = event as React.WheelEvent<HTMLCanvasElement>;
      deltaY = wheelEvent.deltaY;
      clientX = wheelEvent.clientX;
      clientY = wheelEvent.clientY;
      target = wheelEvent.target as Element;
      
      wheelEvent.preventDefault();
      wheelEvent.stopPropagation();
    }
    
    let zoom = canvasRef.current.getZoom();
    
    // Calculate new zoom
    zoom *= 0.999 ** deltaY;
    
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
    
    // Update canvas state
    generateHistoryState();
  };

  // Add constrainCanvas function
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
    const padding = 50;
    
    // Constrain horizontal position
    if (vpt[4] > padding) {
      vpt[4] = padding;
    } else if (vpt[4] < canvasWidth - scaledWidth - padding) {
      vpt[4] = canvasWidth - scaledWidth - padding;
    }
    
    // Constrain vertical position
    if (vpt[5] > padding) {
      vpt[5] = padding;
    } else if (vpt[5] < canvasHeight - scaledHeight - padding) {
      vpt[5] = canvasHeight - scaledHeight - padding;
    }
    
    canvasRef.current.requestRenderAll();
  }, [canvasRef]);

  // Fix the handlePanning function
  const handlePanning = useCallback((e: fabric.IEvent) => {
    if (!canvasRef.current || !e.e) return;
    
    if (isPanning || spaceKeyPressed) {
      const delta = new fabric.Point(
        (e.e as MouseEvent).movementX, 
        (e.e as MouseEvent).movementY
      );
      canvasRef.current.relativePan(delta);
      
      // Ensure viewport stays within boundaries
      constrainCanvas();
    }
  }, [canvasRef, isPanning, spaceKeyPressed, constrainCanvas]);

  // Handle keyboard events for space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spaceKeyPressed) {
        setSpaceKeyPressed(true);
        if (canvasRef.current) {
          canvasRef.current.defaultCursor = 'grab';
          canvasRef.current.selection = false;
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceKeyPressed(false);
        if (canvasRef.current) {
          if (activeTool === 'select') {
            canvasRef.current.defaultCursor = 'default';
            canvasRef.current.selection = true;
          } else {
            canvasRef.current.defaultCursor = 'crosshair';
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, spaceKeyPressed, activeTool]);

  // Set up canvas event listeners
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Set up zoom event listener
    canvasRef.current.on('mouse:wheel', handleZoom);
    
    // Set up pan event listeners
    canvasRef.current.on('mouse:down', (e) => {
      if (!e.e) return;
      // Middle mouse button or space+left click for panning
      if ((e.e as MouseEvent).button === 1 || 
          ((e.e as MouseEvent).button === 0 && spaceKeyPressed)) {
        setIsPanning(true);
        canvasRef.current.selection = false;
        canvasRef.current.defaultCursor = 'grabbing';
        canvasRef.current.hoverCursor = 'grabbing';
        e.e.preventDefault();
      }
    });
    
    canvasRef.current.on('mouse:move', handlePanning);
    
    canvasRef.current.on('mouse:up', () => {
      setIsPanning(false);
      if (activeTool === 'select') {
        canvasRef.current.selection = true;
        canvasRef.current.defaultCursor = 'default';
        canvasRef.current.hoverCursor = 'move';
      } else {
        canvasRef.current.defaultCursor = 'crosshair';
        canvasRef.current.hoverCursor = 'crosshair';
      }
    });
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.off('mouse:wheel');
        canvasRef.current.off('mouse:down');
        canvasRef.current.off('mouse:move');
        canvasRef.current.off('mouse:up');
      }
    };
  }, [canvasRef, isPanning, zoom, spaceKeyPressed, activeTool, handleZoom, handlePanning]);

  // Configure text selection behavior
  const configureTextSettings = () => {
    if (!canvasRef.current) return;
    
    // Set custom text editing handlers
    fabric.IText.prototype.keysMap = {
      ...(fabric.IText.prototype.keysMap || {}),
      // Add additional key mappings here
      // Example: 9: 'exitEditing' // Tab key exits editing
    };
    
    // Improve text editing experience
    canvasRef.current.on('text:changed', (e) => {
      // Update history when text is changed
      generateHistoryState();
    });
    
    // Double-click to edit text directly
    canvasRef.current.on('mouse:dblclick', (e) => {
      if (e.target && e.target.type === 'i-text') {
        e.target.enterEditing();
        e.target.selectAll();
      }
    });
    
    // Handle font style buttons (these would connect to UI controls)
    canvasRef.current.on('selection:created', (e) => {
      if (e.selected && e.selected[0].type === 'i-text') {
        // Update font controls in UI based on selected text
        // This would trigger UI updates in your toolbar
      }
    });
    
    canvasRef.current.on('selection:updated', (e) => {
      if (e.selected && e.selected[0].type === 'i-text') {
        // Update font controls in UI based on selected text
        // This would trigger UI updates in your toolbar
      }
    });
  };

  // Add this to the useEffect that configures canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    // ... existing code ...
    
    // Configure text settings
    configureTextSettings();
    
    // ... existing code ...
  }, [canvasRef]);

  // Handle text formatting functions
  const applyTextFormatting = (property: string, value: any) => {
    if (!canvasRef.current) return;
    
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject || activeObject.type !== 'i-text') return;
    
    // Apply the formatting
    switch(property) {
      case 'fontFamily':
        activeObject.set('fontFamily', value);
        break;
      case 'fontSize':
        activeObject.set('fontSize', parseInt(value));
        break;
      case 'fontWeight':
        activeObject.set('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold');
        break;
      case 'fontStyle':
        activeObject.set('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic');
        break;
      case 'underline':
        activeObject.set('underline', !activeObject.underline);
        break;
      case 'textAlign':
        activeObject.set('textAlign', value);
        break;
      case 'fill':
        activeObject.set('fill', value);
        break;
    }
    
    canvasRef.current.renderAll();
    generateHistoryState();
  };

  const renderToolbar = () => {
    // Define all tool categories and their tools
    const drawingTools = [
      { id: "select", name: "Select", icon: <Crop size={18} />, tooltip: "Select objects (V)" },
      { id: "pencil", name: "Pencil", icon: <Pencil size={18} />, tooltip: "Pencil tool (P)" },
      { id: "brush", name: "Brush", icon: <Brush size={18} />, tooltip: "Brush tool (B)" },
      { id: "spray", name: "Spray", icon: <Droplets size={18} />, tooltip: "Spray tool (S)" },
      { id: "marker", name: "Marker", icon: <Highlighter size={18} />, tooltip: "Marker (M)" },
      { id: "calligraphy", name: "Calligraphy", icon: <PenTool size={18} />, tooltip: "Calligraphy (C)" },
      { id: "crayon", name: "Crayon", icon: <Pencil size={18} />, tooltip: "Crayon effect" },
      { id: "watercolor", name: "Watercolor", icon: <Droplets size={18} />, tooltip: "Watercolor effect" },
      { id: "glitter", name: "Glitter", icon: <Sparkles size={18} />, tooltip: "Glitter effect" },
      { id: "eraser", name: "Eraser", icon: <Eraser size={18} />, tooltip: "Eraser (E)" },
    ];

    const shapeTools = [
      { id: "rectangle", name: "Rectangle", icon: <Square size={18} />, tooltip: "Rectangle (R)" },
      { id: "circle", name: "Circle", icon: <Circle size={18} />, tooltip: "Circle (O)" },
      { id: "triangle", name: "Triangle", icon: <Triangle size={18} />, tooltip: "Triangle (T)" },
      { id: "line", name: "Line", icon: <Minus size={18} />, tooltip: "Line (L)" },
      { id: "star", name: "Star", icon: <Star size={18} />, tooltip: "Star" },
      { id: "arrow", name: "Arrow", icon: <ArrowLeft size={18} />, tooltip: "Arrow" },
    ];

    const effectTools = [
      { id: "blur", name: "Blur", icon: <Blur size={18} />, tooltip: "Blur effect" },
      { id: "grayscale", name: "Grayscale", icon: <Palette size={18} />, tooltip: "Grayscale" },
      { id: "sepia", name: "Sepia", icon: <Wand2 size={18} />, tooltip: "Sepia effect" },
      { id: "pixelate", name: "Pixelate", icon: <Grid size={18} />, tooltip: "Pixelate effect" },
      { id: "noise", name: "Noise", icon: <Dices size={18} />, tooltip: "Add noise" },
      { id: "sharpen", name: "Sharpen", icon: <Focus size={18} />, tooltip: "Sharpen effect" },
    ];

    const utilityTools = [
      { id: "eyedropper", name: "Eyedropper", icon: <Pipette size={18} />, tooltip: "Color picker (K)" },
      { id: "fill", name: "Fill", icon: <PaintBucket size={18} />, tooltip: "Fill (F)" },
      { id: "text", name: "Text", icon: <Type size={18} />, tooltip: "Add text (T)" },
      { id: "layers", name: "Layers", icon: <Layers size={18} />, tooltip: "Manage layers" },
      { id: "grid", name: "Grid", icon: <Grid size={18} />, tooltip: "Toggle grid" },
      { id: "ruler", name: "Ruler", icon: <Ruler size={18} />, tooltip: "Measure distances" },
      { id: "image", name: "Image", icon: <ImageIcon size={18} />, tooltip: "Import image" },
    ];

    // Text formatting options that appear when text is selected
    const textFormatOptions = [
      { id: "bold", name: "Bold", action: () => applyTextFormatting('fontWeight', 'bold'), icon: <span className="font-bold">B</span> },
      { id: "italic", name: "Italic", action: () => applyTextFormatting('fontStyle', 'italic'), icon: <span className="italic">I</span> },
      { id: "underline", name: "Underline", action: () => applyTextFormatting('underline', true), icon: <span className="underline">U</span> },
      { id: "alignLeft", name: "Align Left", action: () => applyTextFormatting('textAlign', 'left'), icon: <AlignLeft size={18} /> },
      { id: "alignCenter", name: "Align Center", action: () => applyTextFormatting('textAlign', 'center'), icon: <AlignCenter size={18} /> },
      { id: "alignRight", name: "Align Right", action: () => applyTextFormatting('textAlign', 'right'), icon: <AlignRight size={18} /> },
    ];

    // Arrange/transform tools for selected objects
    const transformTools = [
      { id: "bringToFront", name: "Bring to Front", icon: <Layers size={18} />, tooltip: "Bring to front" },
      { id: "sendToBack", name: "Send to Back", icon: <Layers size={18} />, tooltip: "Send to back" },
      { id: "rotateLeft", name: "Rotate Left", icon: <RotateCcw size={18} />, tooltip: "Rotate left" },
      { id: "rotateRight", name: "Rotate Right", icon: <RotateCw size={18} />, tooltip: "Rotate right" },
      { id: "duplicate", name: "Duplicate", icon: <Copy size={18} />, tooltip: "Duplicate (Ctrl+D)" },
      { id: "delete", name: "Delete", icon: <Trash2 size={18} />, tooltip: "Delete (Del)" },
    ];

    // Check if text is currently selected
    const activeObject = canvasRef.current?.getActiveObject();
    const isTextSelected = activeObject?.type === 'i-text';

    // Determine which tool category is active
    const [activeCategoryId, setActiveCategoryId] = useState('drawing');
    
    // Group all tools for easy access
    const toolCategories = [
      { id: "drawing", name: "Drawing Tools", tools: drawingTools },
      { id: "shapes", name: "Shapes", tools: shapeTools },
      { id: "effects", name: "Effects", tools: effectTools },
      { id: "utility", name: "Utilities", tools: utilityTools },
      { id: "transform", name: "Transform", tools: transformTools },
    ];

    // Create a custom styles object for active tools
    const activeToolStyle = "bg-primary text-primary-foreground border-2 border-white transform scale-110 shadow-lg";
    const inactiveToolStyle = "text-white/70 hover:text-white hover:bg-black/40 transition-all duration-200 ease-in-out";

    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex flex-col gap-2">
        {/* Main toolbar panel - Figma-inspired design */}
        <div className="bg-black/90 backdrop-blur-md rounded-full py-1.5 px-3 shadow-xl border border-white/10 flex items-center">
          {/* History controls */}
          <div className="flex items-center border-r border-white/10 pr-2 mr-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={() => {
                      // Undo functionality
                      if (canvasRef.current && historyIndex > 0) {
                        // Save current state to redo stack
                        const currentState = history[historyIndex];
                        setRedoStack(prev => [...prev, currentState]);
                        
                        // Go back to previous state
                        const prevState = history[historyIndex - 1];
                        canvasRef.current.loadFromJSON(prevState, () => {
                          canvasRef.current?.renderAll();
                          setHistoryIndex(historyIndex - 1);
                        });
                        
                      toast({ title: "Undo", description: "Action undone" });
                      }
                    }}
                    disabled={historyIndex <= 0}
                  >
                    <UndoIcon size={17} className={historyIndex <= 0 ? "opacity-50" : ""} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={() => {
                      // Redo functionality
                      if (canvasRef.current && redoStack.length > 0) {
                        // Get last state from redo stack
                        const lastIndex = redoStack.length - 1;
                        const nextState = redoStack[lastIndex];
                        
                        // Apply it to canvas
                        canvasRef.current.loadFromJSON(nextState, () => {
                          canvasRef.current?.renderAll();
                          
                          // Update history index and remove from redo stack
                          setHistoryIndex(historyIndex + 1);
                          setRedoStack(redoStack.slice(0, -1));
                        });
                        
                      toast({ title: "Redo", description: "Action redone" });
                      }
                    }}
                    disabled={redoStack.length === 0}
                  >
                    <RedoIcon size={17} className={redoStack.length === 0 ? "opacity-50" : ""} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Tool category tabs */}
          <Tabs 
            value={activeCategoryId} 
            onValueChange={setActiveCategoryId}
            className="border-r border-white/10 pr-2 mr-2"
          >
            <TabsList className="bg-transparent border border-white/10 rounded-full p-0.5 h-8">
              {toolCategories.slice(0, 3).map(category => (
                <TabsTrigger 
                  key={category.id}
                  value={category.id}
                  className="rounded-full px-3 text-xs h-6 data-[state=active]:bg-white/20"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Tools section based on active category */}
          <div className="flex items-center border-r border-white/10 pr-2 mr-2 space-x-1">
            {toolCategories.find(c => c.id === activeCategoryId)?.tools.map(tool => (
              <TooltipProvider key={tool.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full", 
                        activeTool === tool.id ? activeToolStyle : inactiveToolStyle
                      )}
                      onClick={() => handleToolSelect(tool.id as DrawingTool)}
                    >
                      {tool.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{tool.tooltip || tool.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          {/* Color picker and brush size */}
          <div className="flex items-center border-r border-white/10 pr-2 mr-2">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-6 h-6 rounded-full border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: brushColor }}
              />
              
              <div className="h-6 flex items-center gap-1">
                {['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ffffff', '#000000'].map(color => (
                  <button
                    key={color}
                    onClick={() => handleBrushColorChange(color)}
                    className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="mx-2 h-4 border-r border-white/10"></div>
            
            <Select 
              value={brushSize.toString()} 
              onValueChange={(val) => handleBrushSizeChange(parseInt(val))}
            >
              <SelectTrigger className="h-7 w-14 bg-transparent border-0 text-xs text-white">
                <span>{brushSize}px</span>
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 8, 12, 16, 24, 32].map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-white/10"
              onClick={() => setShowSettings(!showSettings)}
            >
              <SlidersHorizontal size={17} />
            </Button>
          </div>
          
          {/* View controls */}
          <div className="flex items-center">
            <div className="flex h-8 items-center bg-black/40 rounded-full px-1 mr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-white/10 p-0"
                onClick={() => {
                  if (canvasRef.current) {
                    const zoom = Math.max(minZoom, canvasRef.current.getZoom() - 0.1);
                    canvasRef.current.zoomToPoint(
                      new fabric.Point(canvasWidth/2, canvasHeight/2), 
                      zoom
                    );
                    setZoom(Math.round(zoom * 100));
                  }
                }}
              >
                <Minus size={14} />
              </Button>
              
              <span className="text-white text-xs px-2 select-none">{zoom}%</span>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-white/10 p-0"
                onClick={() => {
                  if (canvasRef.current) {
                    const zoom = Math.min(maxZoom, canvasRef.current.getZoom() + 0.1);
                    canvasRef.current.zoomToPoint(
                      new fabric.Point(canvasWidth/2, canvasHeight/2), 
                      zoom
                    );
                    setZoom(Math.round(zoom * 100));
                  }
                }}
              >
                <Plus size={14} />
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                      className="h-8 w-8 rounded-full hover:bg-white/10"
                      onClick={() => {
                        if (canvasRef.current) {
                          const json = JSON.stringify(canvasRef.current.toJSON());
                          localStorage.setItem('canvas-state', json);
                          toast({ title: "Saved", description: "Canvas saved locally" });
                        }
                      }}
                    >
                      <Save size={17} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>Save (Ctrl+S)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={() => {
                      const savedState = localStorage.getItem('canvas-state');
                      if (savedState && canvasRef.current) {
                        canvasRef.current.loadFromJSON(JSON.parse(savedState), () => {
                          canvasRef.current?.renderAll();
                          generateHistoryState();
                          toast({ title: "Loaded", description: "Canvas loaded from local storage" });
                        });
                      }
                    }}
                  >
                    <FolderOpen size={17} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Open (Ctrl+O)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={() => {
                      if (canvasRef.current) {
                        const canvasEl = canvasRef.current.getElement();
                        if (canvasEl) {
                          const dataURL = canvasEl.toDataURL({
                            format: 'png',
                            quality: 1
                          });
                          
                          const link = document.createElement('a');
                          link.download = 'canvas-export.png';
                          link.href = dataURL;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          toast({ title: "Exported", description: "Canvas exported as PNG" });
                        }
                      }
                    }}
                  >
                    <Download size={17} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Export (Ctrl+E)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
              
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?share=true`;
                      navigator.clipboard.writeText(shareUrl);
                      sonnerToast.success("Share link copied to clipboard");
                    }}
                  >
                    <Share2 size={17} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>
          </div>
        </div>
        
       
        {showSettings && (
          <motion.div 
            className="bg-black/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-3">
              <div className="text-white text-xs font-medium">Canvas Settings</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="tool-persistence"
                    checked={isToolPersistent}
                    onCheckedChange={(checked) => {
                      setIsToolPersistent(checked);
                      localStorage.setItem('artflow-tool-persistent', checked.toString());
                    }}
                  />
                  <Label htmlFor="tool-persistence" className="text-white text-xs">
                    Tool Persistence
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                  <Label htmlFor="show-grid" className="text-white text-xs">
                    Show Grid
                  </Label>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="bg-color" className="text-white text-xs w-20">Background:</Label>
                <input 
                  type="color" 
                  value={brushColor} 
                  onChange={(e) => handleBrushColorChange(e.target.value)} 
                  className="w-6 h-6 rounded cursor-pointer"
                  id="bg-color"
                />
                
                <Label htmlFor="grid-size" className="text-white text-xs w-16 ml-2">Grid Size:</Label>
                <Select 
                  value={gridSize.toString()} 
                  onValueChange={(val) => setGridSize(parseInt(val))}
                >
                  <SelectTrigger className="h-7 w-16 bg-transparent">
                    <SelectValue placeholder={gridSize} />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 25, 30, 40, 50].map(size => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="canvas-size" className="text-white text-xs w-20">Canvas Size:</Label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(parseInt(e.target.value) || width)}
                    className="w-16 h-7 bg-transparent text-white text-xs rounded px-2 border border-white/20"
                  />
                  <span className="text-white text-xs">×</span>
                  <input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(parseInt(e.target.value) || height)}
                    className="w-16 h-7 bg-transparent text-white text-xs rounded px-2 border border-white/20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (canvasRef.current) {
                        canvasRef.current.setWidth(canvasWidth);
                        canvasRef.current.setHeight(canvasHeight);
                        canvasRef.current.renderAll();
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              
              {/* Blend mode selection */}
              <div className="flex items-center gap-2">
                <Label htmlFor="blend-mode" className="text-white text-xs w-20">Blend Mode:</Label>
                <Select 
                  value={currentBlendMode} 
                  onValueChange={setCurrentBlendMode}
                >
                  <SelectTrigger className="h-7 bg-transparent">
                    <SelectValue placeholder="Normal" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "normal", "multiply", "screen", "overlay", 
                      "darken", "lighten", "color-dodge", "color-burn", 
                      "hard-light", "soft-light", "difference", "exclusion"
                    ].map(mode => (
                      <SelectItem key={mode} value={mode}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Brush opacity slider */}
              <div className="flex items-center gap-2">
                <Label htmlFor="brush-opacity" className="text-white text-xs w-20">Opacity:</Label>
                <Slider
                  value={[brushOpacity * 100]}
                  min={10}
                  max={100}
                  step={5}
                  className="flex-1"
                  onValueChange={([value]) => handleOpacityChange(value / 100)}
                />
                <span className="text-white text-xs w-8 text-right">{Math.round(brushOpacity * 100)}%</span>
              </div>
            </div>
          </motion.div>
        )}
        
       
        {showColorPicker && (
          <motion.div 
            className="bg-black/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-white text-xs font-medium">Color Picker</span>
                <input 
                  type="color" 
                  value={brushColor} 
                  onChange={(e) => handleBrushColorChange(e.target.value)} 
                  className="w-8 h-8 rounded-md cursor-pointer"
                />
              </div>
              
              <div className="grid grid-cols-8 gap-1">
                {[
                  '#ff0000', '#ff4500', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff',
                  '#ff00ff', '#ff69b4', '#ffffff', '#d3d3d3', '#a9a9a9', '#808080', '#556b2f', '#000000',
                  '#663399', '#f08080', '#ffd700', '#20b2aa', '#87cefa', '#778899', '#b0c4de', '#ffb6c1',
                  '#00fa9a', '#8a2be2', '#dc143c', '#00ced1', '#ff1493', '#ffa07a', '#7b68ee', '#cd5c5c'
                ].map(color => (
                  <Button
                    key={color}
                    variant="ghost"
                    className="w-6 h-6 p-0 rounded-md hover:ring-2 hover:ring-white/40"
                    style={{ backgroundColor: color }}
                    onClick={() => handleBrushColorChange(color)}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-white text-xs w-14">Opacity:</Label>
                <Slider
                  value={[brushOpacity * 100]}
                  min={10}
                  max={100}
                  step={5}
                  className="flex-1"
                  onValueChange={([value]) => handleOpacityChange(value / 100)}
                />
                <span className="text-white text-xs w-8">{Math.round(brushOpacity * 100)}%</span>
              </div>
              
              {/* Saved colors/swatches */}
              <div className="mt-2 border-t border-white/10 pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white text-xs">Saved Colors</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => {
                      // Add current color to saved colors logic
                      toast({ title: "Color Saved", description: "Color added to swatches" });
                    }}
                  >
                    Save Current
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    '#2a9d8f', '#e76f51', '#264653', '#e9c46a', '#f4a261', 
                    '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4'
                  ].map(color => (
                    <button
                      key={color}
                      className="w-5 h-5 rounded-md hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleBrushColorChange(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // 1. First move handleBrushColorChange and other brush-related functions above handleEyedropper
  // Callback function declarations for brush settings
  const handleBrushColorChange = useCallback((color: string) => {
    setBrushColor(color);
    localStorage.setItem('artflow-brush-color', color);
    
    if (canvasRef.current && canvasRef.current.freeDrawingBrush) {
      canvasRef.current.freeDrawingBrush.color = color;
    }
    
    // Dispatch custom event for external components
    window.dispatchEvent(new CustomEvent('artcanvas-brush-color-changed', { 
      detail: { color } 
    }));
  }, [canvasRef]);

  const handleOpacityChange = useCallback((opacity: number) => {
    if (canvasRef.current && canvasRef.current.freeDrawingBrush) {
      canvasRef.current.freeDrawingBrush.opacity = opacity;
    }
    
    // Dispatch custom event for external components
    window.dispatchEvent(new CustomEvent('artcanvas-opacity-changed', { 
      detail: { opacity } 
    }));
  }, [canvasRef]);

  const handleBrushSizeChange = useCallback((size: number) => {
    setBrushSize(size);
    localStorage.setItem('artflow-brush-size', size.toString());
    
    if (canvasRef.current && canvasRef.current.freeDrawingBrush) {
      canvasRef.current.freeDrawingBrush.width = size;
    }
    
    // Dispatch custom event for external components
    window.dispatchEvent(new CustomEvent('artcanvas-brush-size-changed', { 
      detail: { size } 
    }));
  }, [canvasRef]);

  // 2. Configure tool functions need to be defined before handleToolSelect
  // Configure select tool
  const configureSelectTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    canvasRef.current.defaultCursor = 'default';
    canvasRef.current.hoverCursor = 'move';
    canvasRef.current.renderAll();
  }, [canvasRef]);

  // Configure brush tool
  const configureBrushTool = useCallback((brushType: DrawingTool) => {
    if (!canvasRef.current) return;
    
    try {
      canvasRef.current.isDrawingMode = true;
      
      let brush;
      
      // Configure different brush types
      switch (brushType) {
        case "pencil":
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize;
          (brush as fabric.PencilBrush).color = brushColor;
          (brush as fabric.PencilBrush).strokeLineCap = 'round';
          (brush as fabric.PencilBrush).strokeLineJoin = 'round';
          break;
          
        case "brush":
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize * 2;
          (brush as fabric.PencilBrush).color = brushColor;
          (brush as fabric.PencilBrush).strokeLineCap = 'round';
          (brush as fabric.PencilBrush).strokeLineJoin = 'round';
          (brush as any).opacity = brushOpacity;
          break;
          
        case "spray":
          brush = new fabric.SprayBrush(canvasRef.current);
          (brush as fabric.SprayBrush).width = brushSize * 5;
          (brush as fabric.SprayBrush).density = brushSize * 2;
          (brush as fabric.SprayBrush).dotWidth = brushSize / 2;
          (brush as fabric.SprayBrush).color = brushColor;
          (brush as any).opacity = brushOpacity;
          break;
          
        case "marker":
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize * 3;
          (brush as fabric.PencilBrush).color = brushColor;
          (brush as any).opacity = 0.5 * brushOpacity;
          (brush as fabric.PencilBrush).strokeLineCap = 'square';
          break;
          
        case "calligraphy":
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize;
          (brush as fabric.PencilBrush).color = brushColor;
          (brush as any).opacity = brushOpacity;
          (brush as fabric.PencilBrush).strokeLineCap = 'butt';
          (brush as fabric.PencilBrush).strokeLineJoin = 'miter';
          break;
          
        case "crayon":
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize;
          (brush as fabric.PencilBrush).color = brushColor;
          (brush as any).opacity = brushOpacity;
          (brush as fabric.PencilBrush).strokeLineCap = 'round';
          (brush as fabric.PencilBrush).strokeLineJoin = 'round';
          (brush as any).shadow = new fabric.Shadow({
            color: brushColor,
            blur: 2,
            offsetX: 1,
            offsetY: 1
          });
          break;
          
        case "watercolor":
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize * 2;
          (brush as fabric.PencilBrush).color = brushColor;
          (brush as any).opacity = 0.7 * brushOpacity;
          (brush as fabric.PencilBrush).strokeLineCap = 'round';
          (brush as fabric.PencilBrush).strokeLineJoin = 'round';
          break;
          
        case "glitter":
          brush = new fabric.SprayBrush(canvasRef.current);
          (brush as fabric.SprayBrush).width = brushSize * 3;
          (brush as fabric.SprayBrush).density = brushSize * 3;
          (brush as fabric.SprayBrush).dotWidth = 2;
          (brush as fabric.SprayBrush).color = brushColor;
          (brush as any).opacity = brushOpacity;
          (brush as any).randomOpacity = true;
          break;
          
        case "eraser":
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize * 2;
          (brush as fabric.PencilBrush).color = bgColor;
          (brush as any).opacity = 1;
          (brush as any).globalCompositeOperation = 'destination-out';
          break;
          
        default:
          brush = new fabric.PencilBrush(canvasRef.current);
          (brush as fabric.PencilBrush).width = brushSize;
          (brush as fabric.PencilBrush).color = brushColor;
          (brush as any).opacity = brushOpacity;
      }
      
      canvasRef.current.freeDrawingBrush = brush;
      
      // Ensure brush properties are applied
      if (canvasRef.current.freeDrawingBrush) {
        canvasRef.current.freeDrawingBrush.color = (brush as any).color;
        canvasRef.current.freeDrawingBrush.width = (brush as any).width;
        // Try to apply opacity if possible
        try {
          (canvasRef.current.freeDrawingBrush as any).opacity = (brush as any).opacity;
        } catch (e) {
          console.warn('Could not set brush opacity:', e);
        }
      }
      
      return brush;
    } catch (error) {
      console.error('Error configuring brush tool:', error);
      toast({ title: "Error", description: "Could not configure brush tool" });
      
      // Fallback to pencil brush on error
      const fallbackBrush = new fabric.PencilBrush(canvasRef.current);
      fallbackBrush.width = brushSize;
      fallbackBrush.color = brushColor;
      canvasRef.current.freeDrawingBrush = fallbackBrush;
      return fallbackBrush;
    }
  }, [canvasRef, brushColor, brushSize, brushOpacity, bgColor, toast]);

  // Handle text tool
  const handleTextTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    try {
      // Configure canvas for text placement
      canvasRef.current.isDrawingMode = false;
      canvasRef.current.selection = true;
      canvasRef.current.defaultCursor = 'text';
      canvasRef.current.hoverCursor = 'text';
      
      // Add text click handler
      const textHandler = (options: fabric.IEvent) => {
        if (!canvasRef.current) return;
        
        const pointer = canvasRef.current.getPointer(options.e);
        
        // Create interactive text object with enhanced properties
        const text = new fabric.IText('Edit this text', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fontSize: brushSize * 4 || 24,
          fill: brushColor,
          padding: 7,
          borderColor: '#333',
          editingBorderColor: '#00ADEF',
          cursorWidth: 2,
          cursorColor: '#00ADEF',
          selectionColor: 'rgba(0, 173, 239, 0.3)',
          shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.2)',
            blur: 3,
            offsetX: 1,
            offsetY: 1
          }),
          textAlign: 'left',
          lineHeight: 1.2
        });
        
        // Add custom controls for text formatting
        text.on('selected', function() {
          showTextControls(text);
        });
        
        text.on('deselected', function() {
          hideTextControls();
        });
        
        canvasRef.current.add(text);
        canvasRef.current.setActiveObject(text);
        text.enterEditing();
        canvasRef.current.renderAll();
        
        generateHistoryState();
      };
      
      // Remove any existing handlers
      canvasRef.current.off('mouse:down');
      canvasRef.current.on('mouse:down', textHandler);
      
      // Show the text formatting toolbar
      setShowTextFormatToolbar(true);
      
    } catch (error) {
      console.error('Error adding text:', error);
      toast({ title: "Error", description: "Could not add text" });
    }
  }, [canvasRef, brushColor, brushSize, generateHistoryState, toast]);

  // Eyedropper tool
  const handleEyedropper = useCallback(() => {
    if (!canvasRef.current) return;

    // Create eyedropper handler
    const eyedropperHandler = (event: fabric.IEvent) => {
      const pointer = canvasRef.current?.getPointer(event.e);
      if (!pointer) return;
      
      // Get the pixel color at the pointer position
      const context = canvasRef.current?.getSelectionContext();
      if (!context) return;
      
      const x = Math.round(pointer.x);
      const y = Math.round(pointer.y);
      const imageData = context.getImageData(x, y, 1, 1).data;
      const r = imageData[0];
      const g = imageData[1];
      const b = imageData[2];
      
      // Convert RGB to hex color
      const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      // Update the brush color
      handleBrushColorChange(hexColor);
      
      // Display toast notification of picked color
      toast({
        title: "Color picked",
        description: `Selected color: ${hexColor}`,
        duration: 1500
      });
      
      // REMOVED: code that switched back to select tool
      // The eyedropper will now remain active until user explicitly changes tools
    };

    // Configure canvas for eyedropper
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    canvasRef.current.isDrawingMode = false;
    
    // First remove any existing eyedropper listeners
    canvasRef.current.off('mouse:down', eyedropperHandler);
    
    // Add the new eyedropper listener
    canvasRef.current.on('mouse:down', eyedropperHandler);
  }, [canvasRef, handleBrushColorChange, toast]);

  // Fill tool
  const handleFill = useCallback(() => {
    if (!canvasRef.current) return;
    
    const fillHandler = (event: fabric.IEvent) => {
      const pointer = canvasRef.current?.getPointer(event.e);
      if (!pointer) return;
      
      // Create a fill rectangle - use current brush color
      const rect = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        fill: brushColor,
        opacity: brushOpacity,
        selectable: false,
        hoverCursor: 'default',
      });
      
      // Add to canvas under all other objects
      canvasRef.current.add(rect);
      rect.sendToBack();
      canvasRef.current.renderAll();
      
      // Save to history
      debounceHistoryUpdate();
      
      // Notify user of fill
      toast({
        title: "Fill applied",
        description: "Canvas background changed",
        duration: 1500
      });
      
      // REMOVED: code that switched back to select tool
      // The fill tool will now remain active until user explicitly changes tools
    };
    
    // Configure canvas for fill tool
    canvasRef.current.defaultCursor = 'cell';
    canvasRef.current.hoverCursor = 'cell';
    canvasRef.current.isDrawingMode = false;
    
    // First remove any existing fill listeners
    canvasRef.current.off('mouse:down', fillHandler);
    
    // Add the new fill listener
    canvasRef.current.on('mouse:down', fillHandler);
  }, [canvasRef, brushColor, brushOpacity, debounceHistoryUpdate, toast]);

  // Improved effect application
  const applyEffect = useCallback((effectType: DrawingTool) => {
    if (!canvasRef.current) return;
    
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject) return;
    
    // Check if object is an image or can have filters
    const canApplyFilter = activeObject instanceof fabric.Image;
    
    switch (effectType) {
      case "blur":
        if (canApplyFilter) {
          const filter = new fabric.Image.filters.Blur({
            blur: 0.5
          });
          (activeObject as fabric.Image).filters = [(activeObject as fabric.Image).filters || [], filter].flat();
        } else {
          // Fallback for non-image objects
          activeObject.set({
            shadow: new fabric.Shadow({
              color: 'rgba(0,0,0,0.3)',
              blur: 20,
              offsetX: 0,
              offsetY: 0
            })
          });
        }
        break;
        
      case "grayscale":
        if (canApplyFilter) {
          const filter = new fabric.Image.filters.Grayscale();
          (activeObject as fabric.Image).filters = [(activeObject as fabric.Image).filters || [], filter].flat();
        } else {
          // Convert fill color to grayscale
          const color = new fabric.Color(activeObject.fill as string);
          const grayValue = 0.3 * color.getSource()[0] + 0.59 * color.getSource()[1] + 0.11 * color.getSource()[2];
          const grayColor = `rgb(${grayValue},${grayValue},${grayValue})`;
          activeObject.set('fill', grayColor);
        }
        break;
        
      case "pixelate":
        if (canApplyFilter) {
          const filter = new fabric.Image.filters.Pixelate({
            blocksize: 8
          });
          (activeObject as fabric.Image).filters = [(activeObject as fabric.Image).filters || [], filter].flat();
        } else {
          toast({
            title: "Cannot Apply",
            description: "Pixelate effect works best on images"
          });
        }
        break;
        
      // Add more effects...
    }
    
    // Apply filters and render
    if (canApplyFilter) {
      (activeObject as fabric.Image).applyFilters();
    }
    
    canvasRef.current.renderAll();
    generateHistoryState();
  }, [canvasRef, generateHistoryState, toast]);

  // 3. Now define handleToolSelect after all its dependencies
  const handleToolSelect = useCallback((tool: DrawingTool) => {
    if (!canvasRef.current) return;
    
    try {
      // Always update state first
      setActiveTool(tool);
      setCurrentTool(tool);

      // Save to localStorage for persistence
      localStorage.setItem('artflow-selected-tool', tool);

      // Call onToolSelect if provided
      if (onToolSelect) {
        onToolSelect(tool);
      }

      // Dispatch custom event for external components
      window.dispatchEvent(new CustomEvent('artcanvas-tool-selected', { 
        detail: { tool } 
      }));

      // Reset all tool active states first
      setIsEyedropperActive(false);
      setIsFillActive(false);
      setIsSprayActive(false);
      setIsMarkerActive(false);
      setIsCalligraphyActive(false);
      setIsCrayonActive(false);
      setIsWatercolorActive(false);
      setIsGlitterActive(false);
      setIsEraserActive(false);
      setIsTextActive(false);
      setIsRectangleActive(false);
      setIsCircleActive(false);
      setIsTriangleActive(false);
      setIsLineActive(false);
      setIsStarActive(false);
      setIsArrowActive(false);
      setIsBlurActive(false);
      setIsGrayscaleActive(false);
      setIsSepiaActive(false);
      setIsPixelateActive(false);
      setIsNoiseActive(false);
      setIsSharpenActive(false);

      // Set the specific tool state to active
      switch (tool) {
        case "eyedropper": setIsEyedropperActive(true); break;
        case "fill": setIsFillActive(true); break;
        case "spray": setIsSprayActive(true); break;
        case "marker": setIsMarkerActive(true); break;
        case "calligraphy": setIsCalligraphyActive(true); break;
        case "crayon": setIsCrayonActive(true); break;
        case "watercolor": setIsWatercolorActive(true); break;
        case "glitter": setIsGlitterActive(true); break;
        case "eraser": setIsEraserActive(true); break;
        case "text": setIsTextActive(true); break;
        case "rectangle": setIsRectangleActive(true); break;
        case "circle": setIsCircleActive(true); break;
        case "triangle": setIsTriangleActive(true); break;
        case "line": setIsLineActive(true); break;
        case "star": setIsStarActive(true); break;
        case "arrow": setIsArrowActive(true); break;
        case "blur": setIsBlurActive(true); break;
        case "grayscale": setIsGrayscaleActive(true); break;
        case "sepia": setIsSepiaActive(true); break;
        case "pixelate": setIsPixelateActive(true); break;
        case "noise": setIsNoiseActive(true); break;
        case "sharpen": setIsSharpenActive(true); break;
        // New tool states
        case "polygon": setIsPolygonActive(true); break;
        case "pen": setIsPenActive(true); break;
        case "bezier": setIsBezierActive(true); break;
        case "sticky": setIsStickyActive(true); break;
        case "speech-bubble": setIsSpeechBubbleActive(true); break;
        case "flowchart": setIsFlowchartActive(true); break;
        case "gradient": setIsGradientActive(true); break;
        case "pattern": setIsPatternActive(true); break;
        case "free-transform": setIsFreeTransformActive(true); break;
        case "magnifier": setIsMagnifierActive(true); break;
        case "template": setIsTemplateActive(true); break;
        case "group": setIsGroupActive(true); break;
        case "ungroup": setIsUngroupActive(true); break;
        case "align": setIsAlignActive(true); break;
        case "distribute": setIsDistributeActive(true); break;
        case "mask": setIsMaskActive(true); break;
        case "handwriting": setIsHandwritingActive(true); break;
        case "laser": setIsLaserActive(true); break;
        case "timeline": setIsTimelineActive(true); break;
        case "emoji": setIsEmojiActive(true); break;
        case "snap": setIsSnapActive(true); break;
        case "curves": setIsCurvesActive(true); break;
        case "chart": setIsChartActive(true); break;
        case "callout": setIsCalloutActive(true); break;
        case "shadow": setIsShadowActive(true); break;
      }

      // Reset any active shape or effect when switching tools
      if (activeShape !== null) {
        setActiveShape(null);
      }
      
      if (activeEffect !== null) {
        setActiveEffect(null);
      }
      
      // Remove any existing event handlers to avoid conflicts
      canvasRef.current.off('mouse:down');

      // Configure fabric.js canvas for the selected tool
      switch (tool) {
        case "select":
          configureSelectTool();
          break;
        case "pencil":
        case "brush":
        case "spray":
        case "marker":
        case "calligraphy":
        case "crayon":
        case "watercolor":
        case "glitter":
        case "eraser":
          // Configure drawing tools
          configureBrushTool(tool);
          canvasRef.current.isDrawingMode = true;
          canvasRef.current.selection = false;
          canvasRef.current.defaultCursor = 'crosshair';
          canvasRef.current.hoverCursor = 'crosshair';
          
          // Update current brush type
          setCurrentBrush(tool);
          break;
        case "text":
          handleTextTool();
          break;
        case "eyedropper":
          handleEyedropper();
          break;
        case "fill":
          handleFill();
          break;
        case "rectangle":
        case "circle":
        case "triangle":
        case "line":
        case "star":
        case "arrow":
        case "polygon":
        case "speech-bubble":
        case "callout":
          // Save shape type
          setActiveShape(tool);
          
          // Configure shape drawing
          canvasRef.current.isDrawingMode = false;
          canvasRef.current.selection = false;
          canvasRef.current.defaultCursor = 'crosshair';
          canvasRef.current.hoverCursor = 'crosshair';
          break;
        case "pen":
        case "bezier":
        case "curves":
          // Configure pen/path tools
          handlePenTool(tool);
          break;
        case "connector":
        case "flowchart":
          // Use connector tool
          setupConnectorTool();
          break;
        case "sticky":
          // Add sticky note
          handleStickyNote();
          break;
        case "template":
          // Use template
          handleTemplateTool();
          break;
        case "gradient":
        case "pattern":
        case "shadow":
          // Configure fill tools
          handleAdvancedFill(tool);
          break;
        case "free-transform":
          handleFreeTransform();
          break;
        case "magnifier":
          handleMagnifier();
          break;
        case "group":
          handleGroupObjects();
          break;
        case "ungroup":
          handleUngroupObjects();
          break;
        case "align":
          handleAlignTool();
          break;
        case "distribute":
          handleDistributeTool();
          break;
        case "mask":
          handleMaskTool();
          break;
        case "handwriting":
          handleHandwritingTool();
          break;
        case "laser":
          handleLaserTool();
          break;
        case "timeline":
          handleTimelineTool();
          break;
        case "emoji":
          handleEmojiTool();
          break;
        case "snap":
          handleSnapTool();
          break;
        case "chart":
          handleChartTool();
          break;
        case 'image':
          handleImageTool();
          break;
        case "blur":
        case "grayscale":
        case "sepia":
        case "pixelate":
        case "noise":
        case "sharpen":
          // Save effect type
          setActiveEffect(tool);
          
          // Configure effect application
          canvasRef.current.isDrawingMode = false;
          canvasRef.current.selection = true;
          canvasRef.current.defaultCursor = 'default';
          canvasRef.current.hoverCursor = 'move';
          
          // Apply effect to selected object if one is active
          applyEffect(tool);
          // Save effect type
          setActiveEffect(tool);
          
          // Configure effect application
          canvasRef.current.isDrawingMode = false;
          canvasRef.current.selection = true;
          canvasRef.current.defaultCursor = 'default';
          canvasRef.current.hoverCursor = 'move';
          
          // Apply effect to selected object if one is active
          applyEffect(tool);
          break;
        default:
          // For any other tools, default to selection mode
          configureSelectTool();
      }

      // If a tool was selected via initial prop or other means,
      // also notify via the callback
      if (onToolSelect) {
        onToolSelect(tool);
      }
    } catch (error) {
      console.error('Error selecting tool:', error);
      toast({ title: "Error", description: `Could not activate ${tool} tool` });
    }
  }, [
    canvasRef,
    configureSelectTool,
    configureBrushTool,
    handleTextTool,
    handleEyedropper,
    handleFill,
    applyEffect,
    activeShape,
    activeEffect,
    onToolSelect,
  
    toast
  ]);

  // Remove standalone zoom control as it's now integrated in the toolbar
  const renderZoomControl = () => null;

  const renderCursorClass = useCallback(() => {
    if (isPanning) return "cursor-grabbing";
    if (spaceKeyPressed) return "cursor-grab";
    
    switch (activeTool) {
      case "text": return "cursor-text";
      case "eyedropper": return "cursor-crosshair";
      case "fill": return "cursor-crosshair";
      case "select": return "cursor-default";
      case "pencil": 
      case "brush":
      case "spray":
      case "marker":
      case "calligraphy":
      case "crayon":
      case "watercolor":
      case "glitter":
      case "eraser": return "cursor-crosshair";
      default: return "cursor-default";
    }
  }, [isPanning, spaceKeyPressed, activeTool]);

  // Handle floating toolbar tool selection
  const handleFloatingToolSelect = useCallback((tool: string) => {
    handleToolSelect(tool as DrawingTool);
  }, []);

  // Add effect to update canvas background based on theme
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Set the canvas background color based on theme
    const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    canvasRef.current.setBackgroundColor(bgColor, () => {
      canvasRef.current?.renderAll();
    });
  }, [canvasRef, theme]);

  // Batch operations helper function
  const batchProcess = useCallback(async (callback: () => Promise<void> | void) => {
    if (!canvasRef.current) return;
    
    // Start batch processing
    batchProcessingRef.current = true;
    
    try {
      // Execute the callback
      await callback();
    } finally {
      // End batch processing and render once
      batchProcessingRef.current = false;
      canvasRef.current.renderAll();
    }
  }, []);
  
  // Modified shape creation to use batch processing
  const createRectangle = useCallback((options?: fabric.IRectOptions) => {
    if (!canvasRef.current) return;
    
    batchProcess(async () => {
      const rect = new fabric.Rect({
        left: canvasRef.current!.width! / 2 - 50,
        top: canvasRef.current!.height! / 2 - 50,
        fill: brushColor,
        width: 100,
        height: 100,
        opacity: brushOpacity,
        ...options,
      });
      
      canvasRef.current!.add(rect);
      canvasRef.current!.setActiveObject(rect);
    });
  }, [canvasRef, brushColor, brushOpacity, batchProcess]);

  // Shape drawing functions 
  const setupShapeDrawing = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Track the starting point of shape
    let startPoint: { x: number, y: number } | null = null;
    let currentShape: fabric.Object | null = null;
    
    // Remove any existing listeners
    canvasRef.current.off('mouse:down');
    canvasRef.current.off('mouse:move');
    canvasRef.current.off('mouse:up');
    
    // Mouse down handler to start drawing shape
    const onMouseDown = (options: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      // Get pointer coordinates
      const pointer = canvasRef.current.getPointer(options.e);
      startPoint = { x: pointer.x, y: pointer.y };
      
      // Create initial shape based on active shape type
      switch (activeShape) {
        case 'rectangle':
          currentShape = new fabric.Rect({
            left: startPoint.x,
            top: startPoint.y,
            width: 0,
            height: 0,
            fill: brushColor,
            opacity: brushOpacity,
            strokeWidth: 2,
            stroke: brushColor
          });
          break;
          
        case 'circle':
          currentShape = new fabric.Circle({
            left: startPoint.x,
            top: startPoint.y,
            radius: 0,
            fill: brushColor,
            opacity: brushOpacity,
            strokeWidth: 2,
            stroke: brushColor
          });
          break;
          
        case 'triangle':
          currentShape = new fabric.Triangle({
            left: startPoint.x,
            top: startPoint.y,
            width: 0,
            height: 0,
            fill: brushColor,
            opacity: brushOpacity,
            strokeWidth: 2,
            stroke: brushColor
          });
          break;
          
        case 'line':
          const points = [startPoint.x, startPoint.y, startPoint.x, startPoint.y];
          currentShape = new fabric.Line(points, {
            stroke: brushColor,
            strokeWidth: brushSize,
            opacity: brushOpacity
          });
          break;
          
        case 'star':
          // Creating a 5-pointed star
          const starPoints = [];
          for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? 50 : 25; // Outer and inner radius
            const angle = Math.PI / 5 * i;
            starPoints.push({
              x: startPoint.x + radius * Math.sin(angle),
              y: startPoint.y + radius * Math.cos(angle)
            });
          }
          currentShape = new fabric.Polygon(starPoints, {
            left: startPoint.x - 50,
            top: startPoint.y - 50,
            fill: brushColor,
            opacity: brushOpacity,
            strokeWidth: 2,
            stroke: brushColor,
            scaleX: 0.01,
            scaleY: 0.01
          });
          break;
          
        case 'arrow':
          // Create an arrow using path
          const path = `M ${startPoint.x},${startPoint.y} L ${startPoint.x},${startPoint.y}`;
          currentShape = new fabric.Path(path, {
            stroke: brushColor,
            strokeWidth: brushSize,
            opacity: brushOpacity,
            fill: brushColor
          });
          break;
          
        case 'connector':
          // Create a line to connect objects
          const connectorPoints = [startPoint.x, startPoint.y, startPoint.x, startPoint.y];
          currentShape = new fabric.Line(connectorPoints, {
            stroke: brushColor,
            strokeWidth: 2,
            opacity: brushOpacity,
            strokeDashArray: [5, 5] // Dashed line for connectors
          });
          break;
      }
      
      if (currentShape) {
        canvasRef.current.add(currentShape);
        canvasRef.current.renderAll();
      }
    };
    
    // Mouse move handler to update shape size
    const onMouseMove = (options: fabric.IEvent) => {
      if (!canvasRef.current || !startPoint || !currentShape) return;
      
      const pointer = canvasRef.current.getPointer(options.e);
      
      // Calculate width and height based on pointer position and start point
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);
      
      // Set the left and top to the smaller of the current and start coordinates
      const left = Math.min(startPoint.x, pointer.x);
      const top = Math.min(startPoint.y, pointer.y);
      
      switch (activeShape) {
        case 'rectangle':
          currentShape.set({
            left: left,
            top: top,
            width: width,
            height: height
          });
          break;
          
        case 'circle':
          // For circle, use the larger of width or height as diameter
          const radius = Math.max(width, height) / 2;
          currentShape.set({
            left: startPoint.x - radius,
            top: startPoint.y - radius,
            radius: radius
          });
          break;
          
        case 'triangle':
          currentShape.set({
            left: left,
            top: top,
            width: width,
            height: height
          });
          break;
          
        case 'line':
          (currentShape as fabric.Line).set({
            x2: pointer.x,
            y2: pointer.y
          });
          break;
          
        case 'star':
          // Scale the star based on distance from start point
          const distance = Math.sqrt(width * width + height * height);
          const scale = distance / 100; // Assuming 100 is the original size
          currentShape.set({
            scaleX: scale,
            scaleY: scale
          });
          break;
          
        case 'arrow':
          // Update arrow path
          const headSize = brushSize * 3;
          // Calculate angle for arrowhead
          const angle = Math.atan2(pointer.y - startPoint.y, pointer.x - startPoint.x);
          // Calculate arrowhead points
          const x1 = pointer.x - headSize * Math.cos(angle - Math.PI/6);
          const y1 = pointer.y - headSize * Math.sin(angle - Math.PI/6);
          const x2 = pointer.x - headSize * Math.cos(angle + Math.PI/6);
          const y2 = pointer.y - headSize * Math.sin(angle + Math.PI/6);
          // Create arrow path with fixed semicolons
          const arrowPath = `M ${startPoint.x},${startPoint.y} L ${pointer.x},${pointer.y} M ${pointer.x},${pointer.y} L ${x1},${y1} M ${pointer.x},${pointer.y} L ${x2},${y2}`;
          (currentShape as fabric.Path).set({ path: arrowPath });
          break;
          
        case 'connector':
          // Update connector end points
          (currentShape as fabric.Line).set({
            x2: pointer.x,
            y2: pointer.y
          });
          break;
      }
      
      canvasRef.current.renderAll();
    };
    
    // Mouse up handler to finalize shape
    const onMouseUp = () => {
      if (!canvasRef.current || !currentShape) return;
      
      // Set the shape as active object
      canvasRef.current.setActiveObject(currentShape);
      
      // Update history to include the new shape
      generateHistoryState();
      
      // Reset start point and current shape
      startPoint = null;
      currentShape = null;
    };
    
    // Add event listeners
    canvasRef.current.on('mouse:down', onMouseDown);
    canvasRef.current.on('mouse:move', onMouseMove);
    canvasRef.current.on('mouse:up', onMouseUp);
    
    // Configure canvas for shape drawing
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    
  }, [activeShape, brushColor, brushOpacity, brushSize, generateHistoryState]);
  
  // Object scaling functionality
  const setupObjectScaling = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Enable object controls
    canvasRef.current.selection = true;
    
    // Set up object events
    const setupSelectedObjectControls = (obj: fabric.Object) => {
      if (!obj) return;
      
      // Enable scaling
      obj.setControlsVisibility({
        mt: true, // middle top
        mb: true, // middle bottom
        ml: true, // middle left
        mr: true, // middle right
        tl: true, // top left
        tr: true, // top right
        bl: true, // bottom left
        br: true  // bottom right
      });
      
      // Enable rotation
      obj.set({
        hasRotatingPoint: true,
        transparentCorners: false,
        cornerColor: 'rgba(255,255,255,0.9)',
        cornerStrokeColor: 'rgba(0,0,0,0.5)',
        borderColor: 'rgba(0,0,0,0.5)',
        cornerSize: 10,
        padding: 5,
        cornerStyle: 'circle'
      });
    };
    
    // Apply controls to any selected object
    canvasRef.current.on('selection:created', (e) => {
      const selection = e.selected;
      if (selection && selection.length > 0) {
        selection.forEach(setupSelectedObjectControls);
      }
    });
    
    canvasRef.current.on('selection:updated', (e) => {
      const selection = e.selected;
      if (selection && selection.length > 0) {
        selection.forEach(setupSelectedObjectControls);
      }
    });
    
    // Save history when object is modified
    canvasRef.current.on('object:modified', () => {
      generateHistoryState();
    });
    
  }, [generateHistoryState]);

  // Tool for adding connectors between objects
  const setupConnectorTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    let startObject: fabric.Object | null = null;
    let connector: fabric.Line | null = null;
    
    // Remove any existing listeners
    canvasRef.current.off('mouse:down');
    canvasRef.current.off('mouse:move');
    canvasRef.current.off('mouse:up');
    
    // Use object as connection point
    const onMouseDown = (options: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      const target = options.target;
      if (target) {
        // Start connector from this object
        startObject = target;
        
        // Get center point of the object
        const startPoint = startObject.getCenterPoint();
        
        // Create connector line
        connector = new fabric.Line(
          [startPoint.x, startPoint.y, startPoint.x, startPoint.y],
          {
            stroke: brushColor,
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: true
          }
        );
        
        canvasRef.current.add(connector);
        canvasRef.current.renderAll();
      }
    };
    
    const onMouseMove = (options: fabric.IEvent) => {
      if (!canvasRef.current || !connector || !startObject) return;
      
      const pointer = canvasRef.current.getPointer(options.e);
      
      // Update the end point of the connector
      connector.set({
        x2: pointer.x,
        y2: pointer.y
      });
      
      canvasRef.current.renderAll();
    };
    
    const onMouseUp = (options: fabric.IEvent) => {
      if (!canvasRef.current || !connector || !startObject) return;
      
      const target = options.target;
      
      if (target && target !== startObject) {
        // Connect to the target object
        const endPoint = target.getCenterPoint();
        
        connector.set({
          x2: endPoint.x,
          y2: endPoint.y
        });
        
        // Create custom connection properties
        (connector as any).startObject = startObject;
        (connector as any).endObject = target;
        
        // Update objects when moved
        const updateConnection = () => {
          if (!connector || !canvasRef.current) return;
          
          const start = (connector as any).startObject?.getCenterPoint();
          const end = (connector as any).endObject?.getCenterPoint();
          
          if (start && end) {
            connector.set({
              x1: start.x,
              y1: start.y,
              x2: end.x,
              y2: end.y
            });
            
            canvasRef.current.renderAll();
          }
        };
        
        // Listen for object movements to update connector
        if (startObject) {
          startObject.on('moving', updateConnection);
          target.on('moving', updateConnection);
        }
      } else if (connector) {
        // If not connected to an object, remove the connector
        canvasRef.current.remove(connector);
      }
      
      generateHistoryState();
      startObject = null;
      connector = null;
      
      canvasRef.current.renderAll();
    };
    
    // Add event listeners
    canvasRef.current.on('mouse:down', onMouseDown);
    canvasRef.current.on('mouse:move', onMouseMove);
    canvasRef.current.on('mouse:up', onMouseUp);
    
    // Configure canvas for connector tool
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'pointer';
    canvasRef.current.selection = false;
    
  }, [brushColor, generateHistoryState]);
  
  // Pen tool for drawing bezier curves and complex paths
  const handlePenTool = useCallback((tool: DrawingTool) => {
    if (!canvasRef.current) return;
    
    let path: fabric.Path | null = null;
    let points: { x: number, y: number }[] = [];
    let isDrawing = false;
    let pathData = '';
    
    // Remove any existing listeners
    canvasRef.current.off('mouse:down');
    canvasRef.current.off('mouse:move');
    canvasRef.current.off('mouse:up');
    
    const onMouseDown = (options: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      isDrawing = true;
      const pointer = canvasRef.current.getPointer(options.e);
      
      // Start a new path
      points = [{ x: pointer.x, y: pointer.y }];
      
      // Create initial path data
      pathData = `M ${pointer.x} ${pointer.y}`;
      
      // Create path object
      path = new fabric.Path(pathData, {
        stroke: brushColor,
        strokeWidth: brushSize,
        fill: 'transparent',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        opacity: brushOpacity
      });
      
      canvasRef.current.add(path);
      canvasRef.current.renderAll();
    };
    
    const onMouseMove = (options: fabric.IEvent) => {
      if (!isDrawing || !canvasRef.current || !path) return;
      
      const pointer = canvasRef.current.getPointer(options.e);
      
      // Add new point
      points.push({ x: pointer.x, y: pointer.y });
      
      // Different path creation based on tool type
      if (tool === 'bezier' || tool === 'curves') {
        // For bezier tool, create smooth curves
        if (points.length > 2) {
          const lastPoint = points[points.length - 1];
          const prevPoint = points[points.length - 2];
          const beforePrevPoint = points[points.length - 3];
          
          // Calculate control points for smooth bezier curve
          const controlX1 = (prevPoint.x + beforePrevPoint.x) / 2;
          const controlY1 = (prevPoint.y + beforePrevPoint.y) / 2;
          const controlX2 = (prevPoint.x + lastPoint.x) / 2;
          const controlY2 = (prevPoint.y + lastPoint.y) / 2;
          
          // Update path with bezier curve
          pathData += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${lastPoint.x} ${lastPoint.y}`;
        } else {
          // If we only have 2 points, use a straight line
          pathData += ` L ${pointer.x} ${pointer.y}`;
        }
      } else {
        // For regular pen, just use lines
        pathData += ` L ${pointer.x} ${pointer.y}`;
      }
      
      // Update path
      path.set({ path: fabric.util.parsePath(pathData) });
      canvasRef.current.renderAll();
    };
    
    const onMouseUp = () => {
      if (!canvasRef.current || !path) return;
      
      isDrawing = false;
      generateHistoryState();
      
      // If the path is too short or has no points, remove it
      if (points.length < 2) {
        canvasRef.current.remove(path);
        canvasRef.current.renderAll();
      }
      
      path = null;
      points = [];
    };
    
    // Add event listeners
    canvasRef.current.on('mouse:down', onMouseDown);
    canvasRef.current.on('mouse:move', onMouseMove);
    canvasRef.current.on('mouse:up', onMouseUp);
    
    // Configure canvas for pen tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    
  }, [brushColor, brushSize, brushOpacity, generateHistoryState]);
  
  // Sticky Note Tool
  const handleStickyNote = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Remove any existing listeners
    canvasRef.current.off('mouse:down');
    
    const onMouseDown = (options: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      const pointer = canvasRef.current.getPointer(options.e);
      
      // Create sticky note rectangle
      const stickyWidth = 150;
      const stickyHeight = 150;
      
      // Generate a pastel color
      const hue = Math.floor(Math.random() * 360);
      const stickyColor = `hsl(${hue}, 80%, 80%)`;
      
      // Create the sticky note as a group of objects
      const background = new fabric.Rect({
        left: 0,
        top: 0,
        width: stickyWidth,
        height: stickyHeight,
        fill: stickyColor,
        rx: 5, // rounded corners
        ry: 5,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.3)',
          offsetX: 3,
          offsetY: 3,
          blur: 5
        })
      });
      
      // Add text to the sticky note
      const text = new fabric.IText('Double-click to edit', {
        left: 10,
        top: 10,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333333',
        width: stickyWidth - 20
      });
      
      // Group the objects
      const stickyGroup = new fabric.Group([background, text], {
        left: pointer.x - stickyWidth/2,
        top: pointer.y - stickyHeight/2,
        originX: 'left',
        originY: 'top',
      });
      
      stickyGroup.setCoords();
      canvasRef.current.add(stickyGroup);
      canvasRef.current.setActiveObject(stickyGroup);
      canvasRef.current.renderAll();
      
      // Save state
      generateHistoryState();
    };
    
    // Add event listener
    canvasRef.current.on('mouse:down', onMouseDown);
    
    // Configure canvas for sticky note tool
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    canvasRef.current.selection = true;
    
  }, [generateHistoryState]);
  
  // Update handleToolSelect to use setupShapeDrawing
  useEffect(() => {
    if (activeShape && canvasRef.current) {
      setupShapeDrawing();
    }
    
    // Initialize object scaling when using select tool
    if (activeTool === 'select' && canvasRef.current) {
      setupObjectScaling();
    }
    
    // Initialize connector tool
    if (activeTool === 'connector' && canvasRef.current) {
      setupConnectorTool();
    }
  }, [activeTool, activeShape, setupShapeDrawing, setupObjectScaling, setupConnectorTool]);

  // Clean up render requests on unmount
  useEffect(() => {
    return () => {
      if (renderRequestRef.current !== null) {
        cancelAnimationFrame(renderRequestRef.current);
      }
      
      // Clean up any other resources
      if (canvasRef.current) {
        try {
          canvasRef.current.dispose();
        } catch (e) {
          console.error("Error disposing canvas:", e);
        }
      }
    };
  }, []);

  // Add handler for sharing drawing
  const shareDrawing = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Generate a data URL for the canvas
    try {
      const dataUrl = canvasRef.current.toDataURL({
        format: 'png',
        quality: 0.8
      });
      
      // Copy the data URL to clipboard
      navigator.clipboard.writeText(dataUrl)
        .then(() => {
          sonnerToast.success("Canvas image URL copied to clipboard!");
        })
        .catch(err => {
          console.error("Failed to copy canvas URL:", err);
          sonnerToast.error("Failed to copy canvas URL");
        });
    } catch (err) {
      console.error("Error generating canvas URL:", err);
      sonnerToast.error("Error generating canvas URL");
    }
  }, [canvasRef]);

  const downloadCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    try {
      // Generate a data URL of the canvas
      const dataUrl = canvasRef.current.toDataURL({
        format: 'png',
        quality: 0.8
      });
      
      // Create a link and trigger a download
      const link = document.createElement('a');
      link.download = `art-canvas-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      sonnerToast.success("Canvas downloaded successfully!");
    } catch (err) {
      console.error("Error downloading canvas:", err);
      sonnerToast.error("Failed to download canvas");
    }
  }, [canvasRef]);

  // Use color picker to sample the canvas
  const useEyedropper = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const pointer = canvas.getPointer({ clientX: e.clientX, clientY: e.clientY, target: e.target as Element });
    
    // Get the color from the canvas at the clicked point
    const context = canvas.getContext();
    const imageData = context.getImageData(
      Math.round(pointer.x), 
      Math.round(pointer.y), 
      1, 
      1
    );
    
    const [r, g, b, a] = imageData.data;
    
    // Convert to hex
    const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    
    // Set the brush color
    handleBrushColorChange(hexColor);
    
    // Notify user
    sonnerToast.success(`Color picked: ${hexColor}`, {
      description: "Color applied to brush",
      duration: 1500
    });
    
    // REMOVED: code that switched back to previous tool
    // The eyedropper will now remain active until explicitly changed
  }, [canvasRef, handleBrushColorChange]);

  // Update the fillArea function with proper tool state management
  const fillArea = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const pointer = canvas.getPointer({ clientX: e.clientX, clientY: e.clientY, target: e.target as Element });
    
    // Create a fill rectangle - this is a simplified fill algorithm
    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvas.width,
      height: canvas.height,
      fill: brushColor,
      opacity: brushOpacity,
      selectable: false,
      hoverCursor: 'default',
    });
    
    // Add to canvas under all other objects
    canvas.add(rect);
    rect.sendToBack();
    canvas.renderAll();
    
    // Save to history
    debounceHistoryUpdate();
    
    // Save the color to localStorage
    localStorage.setItem('artflow-last-fill-color', brushColor);
    
    // Notify user
    sonnerToast.success('Fill applied', {
      description: "Background color changed",
      duration: 1500
    });
    
    // REMOVED: code that switched back to previous tool
    // The fill tool will now remain active until explicitly changed
  }, [canvasRef, brushColor, brushOpacity, debounceHistoryUpdate]);

  // Initialize the canvas with the initialTool
  useEffect(() => {
    if (!canvasRef.current) return;
    
    try {
      // Apply the saved or default tool after canvas has initialized
      const savedTool = localStorage.getItem('artflow-selected-tool') as DrawingTool;
      if (savedTool) {
        handleToolSelect(savedTool);
      }
      
      // Set consistent background color
      canvasRef.current.setBackgroundColor(bgColor, canvasRef.current.renderAll.bind(canvasRef.current));
      
      // Also load saved canvas state if available
      // const savedCanvasState = localStorage.getItem('canvas-state');
      // if (savedCanvasState) {
      //   try {
      //     canvasRef.current.loadFromJSON(JSON.parse(savedCanvasState), () => {
      //       canvasRef.current?.renderAll();
      //       generateHistoryState();
      //       toast({ 
      //         title: "Canvas Restored", 
      //         description: "Previous work has been loaded" 
      //       });
      //     });
      //   } catch (err) {
      //     console.error('Error loading saved canvas state:', err);
      //     toast({ 
      //       title: "Error", 
      //       description: "Could not restore previous canvas" 
      //     });
      //   }
      // }
      
      // Initialize tool state properly
      setActiveTool(savedTool || 'select');
      
      // Set initial tool as current tool too
      setCurrentTool(savedTool || 'select');
      
      // Dispatch event to ensure UI is in sync
      window.dispatchEvent(new CustomEvent('artcanvas-tool-selected', { 
        detail: { tool: savedTool || 'select' } 
      }));
      
    } catch (error) {
      console.error('Error during canvas initialization:', error);
      toast({ 
        title: "Initialization Error", 
        description: "Some features may not work properly" 
      });
    }
  }, [canvasRef, bgColor, generateHistoryState, toast]);

  // Add automatic saving of canvas state periodically
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Save canvas state every 30 seconds
    const autoSaveInterval = setInterval(() => {
      try {
        if (canvasRef.current) {
          const json = JSON.stringify(canvasRef.current.toJSON());
          localStorage.setItem('canvas-state-autosave', json);
        }
      } catch (error) {
        console.error('Error during auto-save:', error);
      }
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [canvasRef]);

  // Add a handler to save state when window is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (canvasRef.current) {
          const json = JSON.stringify(canvasRef.current.toJSON());
          localStorage.setItem('canvas-state', json);
          
          // Also save current tool state
          localStorage.setItem('artflow-selected-tool', activeTool);
          localStorage.setItem('artflow-brush-color', brushColor);
          localStorage.setItem('artflow-brush-size', brushSize.toString());
          localStorage.setItem('artflow-brush-opacity', brushOpacity.toString());
        }
      } catch (error) {
        console.error('Error saving canvas state:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [canvasRef, activeTool, brushColor, brushSize, brushOpacity]);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Skip if modifier keys are pressed (except for undo/redo)
      if (e.altKey || e.shiftKey) {
        return;
      }
      
      // Shortcuts that work with Ctrl key
      if (e.ctrlKey) {
        switch(e.key.toLowerCase()) {
          case 'z': 
            e.preventDefault();
            if (canvasRef.current && historyIndex > 0) {
              // Implement undo logic here
              const currentState = history[historyIndex];
              setRedoStack(prev => [...prev, currentState]);
              const prevState = history[historyIndex - 1];
              canvasRef.current.loadFromJSON(prevState, () => {
                canvasRef.current?.renderAll();
                setHistoryIndex(historyIndex - 1);
              });
            }
            return;
          case 'y':
            e.preventDefault();
            if (canvasRef.current && redoStack.length > 0) {
              // Implement redo logic here
              const lastIndex = redoStack.length - 1;
              const nextState = redoStack[lastIndex];
              canvasRef.current.loadFromJSON(nextState, () => {
                canvasRef.current?.renderAll();
                setHistoryIndex(historyIndex + 1);
                setRedoStack(redoStack.slice(0, -1));
              });
            }
            return;
          case 's':
            e.preventDefault();
            if (canvasRef.current) {
              const json = JSON.stringify(canvasRef.current.toJSON());
              localStorage.setItem('canvas-state', json);
              toast({ title: "Saved", description: "Canvas saved locally" });
            }
            return;
        }
        return;
      }
      
      // Single key shortcuts for tool selection
      switch(e.key.toLowerCase()) {
        case 'v': handleToolSelect('select'); break;
        case 'p': handleToolSelect('pencil'); break;
        case 'b': handleToolSelect('brush'); break;
        case 's': handleToolSelect('spray'); break;
        case 'm': handleToolSelect('marker'); break;
        case 'c': handleToolSelect('calligraphy'); break;
        case 'e': handleToolSelect('eraser'); break;
        case 'r': handleToolSelect('rectangle'); break;
        case 'o': handleToolSelect('circle'); break;
        case 't': handleToolSelect('text'); break;
        case 'l': handleToolSelect('line'); break;
        case 'k': handleToolSelect('eyedropper'); break;
        case 'f': handleToolSelect('fill'); break;
        case 'g': 
          // Toggle grid
          setShowGrid(!showGrid);
          break;
        case 'delete':
          if (canvasRef.current) {
            const activeObject = canvasRef.current.getActiveObject();
            if (activeObject) {
              canvasRef.current.remove(activeObject);
              canvasRef.current.renderAll();
              generateHistoryState();
            }
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    
    showGrid, 
    setShowGrid,
    canvasRef, 
    generateHistoryState, 
    history, 
    historyIndex, 
    setHistoryIndex,
    redoStack, 
    setRedoStack,
    toast
  ]);

  // Template Tool
  const handleTemplateTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Set up canvas for template tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    canvasRef.current.defaultCursor = 'default';
    canvasRef.current.hoverCursor = 'default';
    
    // Show a toast notification about the template tool
    toast({
      title: "Template Tool",
      description: "Select a template to add to your canvas",
      duration: 2000
    });
    
    // This would typically open a template selection UI
    // For now, it's just a placeholder
  }, [canvasRef, toast]);

  // Advanced Fill Tool (Gradient, Pattern, Shadow)
  const handleAdvancedFill = useCallback((tool: DrawingTool) => {
    if (!canvasRef.current) return;
    
    // Configure canvas for fill tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Check if there's an active object
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject) {
      toast({
        title: "Select an object",
        description: `Please select an object to apply ${tool}`,
        duration: 2000
      });
      return;
    }
    
    try {
      switch (tool) {
        case "gradient":
          // Create a gradient fill
          const gradient = new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: activeObject.width, y2: activeObject.height },
            colorStops: [
              { offset: 0, color: brushColor },
              { offset: 1, color: '#ffffff' }
            ]
          });
          activeObject.set('fill', gradient);
          break;
          
        case "pattern":
          // Create a pattern from a predefined set
          const patternOptions = {
            source: function() {
              const squareSize = 10;
              const patternCanvas = document.createElement('canvas');
              patternCanvas.width = squareSize * 2;
              patternCanvas.height = squareSize * 2;
              const ctx = patternCanvas.getContext('2d');
              if (!ctx) return patternCanvas;
              
              // Draw pattern
              ctx.fillStyle = brushColor;
              ctx.fillRect(0, 0, squareSize, squareSize);
              ctx.fillRect(squareSize, squareSize, squareSize, squareSize);
              
              return patternCanvas;
            }
          };
          
          const pattern = new fabric.Pattern(patternOptions);
          activeObject.set('fill', pattern);
          break;
          
        case "shadow":
          // Apply shadow to the object
          activeObject.set('shadow', new fabric.Shadow({
            color: 'rgba(0,0,0,0.5)',
            blur: 10,
            offsetX: 5,
            offsetY: 5
          }));
          break;
      }
      
      canvasRef.current.renderAll();
      generateHistoryState();
      
      toast({
        title: "Effect applied",
        description: `${tool.charAt(0).toUpperCase() + tool.slice(1)} applied to object`,
        duration: 1500
      });
    } catch (error) {
      console.error(`Error applying ${tool}:`, error);
      toast({
        title: "Error",
        description: `Could not apply ${tool} effect`,
        duration: 1500
      });
    }
  }, [canvasRef, brushColor, generateHistoryState, toast]);

  // Free Transform Tool
  const handleFreeTransform = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for transform tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Check if there's an active object
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject) {
      toast({
        title: "Select an object",
        description: "Please select an object to transform",
        duration: 2000
      });
      return;
    }
    
    try {
      // Enable all control points for the object
      activeObject.setControlsVisibility({
        mt: true, // middle top
        mb: true, // middle bottom
        ml: true, // middle left
        mr: true, // middle right
        tl: true, // top left
        tr: true, // top right
        bl: true, // bottom left
        br: true  // bottom right
      });
      
      // Show transform controls panel
      setShowTransformPanel(true);
      
      toast({
        title: "Free Transform",
        description: "Use controls to transform the object",
        duration: 1500
      });
      
      // Enhanced object controls
      activeObject.set({
        borderColor: '#00A0FF',
        cornerColor: '#00A0FF',
        cornerSize: 12,
        transparentCorners: false,
        cornerStyle: 'circle',
        borderScaleFactor: 1.5
      });
      
      canvasRef.current.renderAll();
    } catch (error) {
      console.error("Error in free transform:", error);
      toast({
        title: "Error",
        description: "Could not enable transform controls",
        duration: 1500
      });
    }
  }, [canvasRef, toast, setShowTransformPanel]);

  // Custom rendering function for skew controls (defined outside the callback)
  function renderSkewControl(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    const size = this.cornerSize;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
    ctx.beginPath();
    ctx.moveTo(-size/2, -size/2);
    ctx.lineTo(size/2, -size/2);
    ctx.lineTo(size/2, size/2);
    ctx.lineTo(-size/2, size/2);
    ctx.closePath();
    ctx.fillStyle = '#00ADEF';
    ctx.fill();
    ctx.restore();
  }

  // Add this to your component's return statement
  const renderTransformPanel = () => {
    if (!showTransformPanel || !canvasRef.current) return null;
    
    const activeObj = canvasRef.current.getActiveObject();
    if (!activeObj) return null;
    
    return (
      <div className="absolute right-4 top-20 bg-black/80 backdrop-blur-sm rounded-lg p-2 
                    shadow-xl border border-white/10 z-40 w-[240px]">
        <h3 className="text-white text-sm font-bold mb-2">Transform Controls</h3>
        
        {/* Position controls */}
        <div className="mb-2">
          <div className="text-white/70 text-xs mb-1">Position</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center">
              <span className="text-white/70 text-xs mr-1">X:</span>
              <input 
                type="number" 
                value={Math.round(activeObj.left || 0)} 
                onChange={(e) => {
                  activeObj.set('left', parseInt(e.target.value));
                  canvasRef.current?.renderAll();
                }}
                className="bg-black/50 text-white text-xs rounded p-1 w-full"
              />
            </div>
            <div className="flex items-center">
              <span className="text-white/70 text-xs mr-1">Y:</span>
              <input 
                type="number" 
                value={Math.round(activeObj.top || 0)} 
                onChange={(e) => {
                  activeObj.set('top', parseInt(e.target.value));
                  canvasRef.current?.renderAll();
                }}
                className="bg-black/50 text-white text-xs rounded p-1 w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Size controls */}
        <div className="mb-2">
          <div className="text-white/70 text-xs mb-1">Size</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center">
              <span className="text-white/70 text-xs mr-1">W:</span>
              <input 
                type="number" 
                value={Math.round(activeObj.getScaledWidth())} 
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value);
                  const scaleFactor = newWidth / activeObj.width;
                  activeObj.set('scaleX', activeObj.scaleX * scaleFactor);
                  canvasRef.current?.renderAll();
                }}
                className="bg-black/50 text-white text-xs rounded p-1 w-full"
              />
            </div>
            <div className="flex items-center">
              <span className="text-white/70 text-xs mr-1">H:</span>
              <input 
                type="number" 
                value={Math.round(activeObj.getScaledHeight())} 
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value);
                  const scaleFactor = newHeight / activeObj.height;
                  activeObj.set('scaleY', activeObj.scaleY * scaleFactor);
                  canvasRef.current?.renderAll();
                }}
                className="bg-black/50 text-white text-xs rounded p-1 w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Rotation control */}
        <div className="mb-2">
          <div className="text-white/70 text-xs mb-1">Rotation</div>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={activeObj.angle || 0} 
            onChange={(e) => {
              activeObj.set('angle', parseInt(e.target.value));
              canvasRef.current?.renderAll();
            }}
            className="w-full"
          />
          <div className="text-white text-xs text-center">{Math.round(activeObj.angle || 0)}°</div>
        </div>
        
        {/* Apply button */}
        <button
          onClick={() => {
            generateHistoryState();
            toast({
              title: "Transformation Applied",
              description: "Changes have been saved",
              duration: 1500
            });
          }}
          className="bg-blue-600 text-white text-xs p-1 rounded w-full mt-2"
        >
          Apply Changes
        </button>
      </div>
    );
  };

  // Magnifier Tool
  const handleMagnifier = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for magnifier tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'zoom-in';
    canvasRef.current.hoverCursor = 'zoom-in';
    
    // Set up click handler for zooming
    const magnifierHandler = (event: fabric.IEvent) => {
      const pointer = canvasRef.current?.getPointer(event.e);
      if (!pointer) return;
      
      // Get current zoom
      const zoom = canvasRef.current.getZoom();
      
      // Create zoom point (where we clicked)
      const point = new fabric.Point(pointer.x, pointer.y);
      
      // Zoom in by 20%
      canvasRef.current.zoomToPoint(point, zoom * 1.2);
      
      // Notify user about zoom
      toast({
        title: "Zoomed in",
        description: `Zoom level: ${Math.round(zoom * 120)}%`,
        duration: 1500
      });
    };
    
    // Remove existing handlers
    canvasRef.current.off('mouse:down');
    
    // Add new handler
    canvasRef.current.on('mouse:down', magnifierHandler);
    
  }, [canvasRef, toast]);

  // Group Objects Tool
  const handleGroupObjects = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for group tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Check if there are multiple selected objects
    const activeSelection = canvasRef.current.getActiveObject();
    if (!activeSelection || !activeSelection.type || activeSelection.type !== 'activeSelection') {
      toast({
        title: "Select multiple objects",
        description: "Please select multiple objects to group",
        duration: 2000
      });
      return;
    }
    
    // Group the selected objects
    if (activeSelection.type === 'activeSelection') {
      const group = activeSelection.toGroup();
      canvasRef.current.setActiveObject(group);
      canvasRef.current.renderAll();
      generateHistoryState();
      
      // Notify user
      toast({
        title: "Objects grouped",
        description: "Selected objects have been grouped",
        duration: 1500
      });
    }
    
  }, [canvasRef, toast, generateHistoryState]);

  // Ungroup Objects Tool
  const handleUngroupObjects = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for ungroup tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Check if there's a selected group
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject || activeObject.type !== 'group') {
      toast({
        title: "Select a group",
        description: "Please select a group to ungroup",
        duration: 2000
      });
      return;
    }
    
    // Ungroup the selected group
    if (activeObject.type === 'group') {
      const items = (activeObject as fabric.Group).getObjects();
      (activeObject as fabric.Group).destroy();
      canvasRef.current.remove(activeObject);
      
      // Add the individual objects and select them
      items.forEach(item => {
        canvasRef.current?.add(item);
      });
      
      // Create a new selection of the ungrouped objects
      const selection = new fabric.ActiveSelection(items, { canvas: canvasRef.current });
      canvasRef.current.setActiveObject(selection);
      canvasRef.current.renderAll();
      generateHistoryState();
      
      // Notify user
      toast({
        title: "Group ungrouped",
        description: "Group has been split into individual objects",
        duration: 1500
      });
    }
    
  }, [canvasRef, toast, generateHistoryState]);

  // Align Tool
  const handleAlignTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for align tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Check if there's a selection
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject) {
      toast({
        title: "Select objects",
        description: "Please select objects to align",
        duration: 2000
      });
      return;
    }
    
    // In a full implementation, this would show alignment options (left, center, right, etc.)
    // For now, just center align as a placeholder
    if (activeObject) {
      activeObject.centerH();
      canvasRef.current.renderAll();
      generateHistoryState();
      
      // Notify user
      toast({
        title: "Objects aligned",
        description: "Objects have been center aligned",
        duration: 1500
      });
    }
    
  }, [canvasRef, toast, generateHistoryState]);

  // Distribute Tool
  const handleDistributeTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for distribute tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Check if there's a multi-selection
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject || activeObject.type !== 'activeSelection') {
      toast({
        title: "Select multiple objects",
        description: "Please select multiple objects to distribute",
        duration: 2000
      });
      return;
    }
    
    // In a full implementation, this would distribute the objects evenly
    // For now, just a placeholder notification
    toast({
      title: "Distribution tool",
      description: "Objects would be distributed evenly",
      duration: 1500
    });
    
  }, [canvasRef, toast]);

  // Mask Tool
  const handleMaskTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for mask tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Check if there are at least two objects selected
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject || activeObject.type !== 'activeSelection' || 
        (activeObject.type === 'activeSelection' && (activeObject as fabric.ActiveSelection).size() < 2)) {
      toast({
        title: "Select multiple objects",
        description: "Please select at least 2 objects for masking",
        duration: 2000
      });
      return;
    }
    
    // In a full implementation, this would apply a clipping mask
    // For now, just a placeholder notification
    toast({
      title: "Mask tool",
      description: "Masking would be applied to selected objects",
      duration: 1500
    });
    
  }, [canvasRef, toast]);

  // Handwriting Tool
  const handleHandwritingTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for handwriting
    canvasRef.current.isDrawingMode = true;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    
    // Create a custom brush for handwriting
    const pencilBrush = new fabric.PencilBrush(canvasRef.current);
    canvasRef.current.freeDrawingBrush = pencilBrush;
    
    // Configure brush properties
    pencilBrush.color = brushColor;
    pencilBrush.width = brushSize;
    
    // Add shadow for better appearance
    if (pencilBrush.shadow) {
      pencilBrush.shadow.blur = 1;
      pencilBrush.shadow.offsetX = 0;
      pencilBrush.shadow.offsetY = 1;
      pencilBrush.shadow.color = 'rgba(0,0,0,0.3)';
    }
    
    // Advanced brush settings for natural handwriting
    if (pencilBrush.decimate) {
      pencilBrush.decimate = 8; // Smoothing
    }
    
    // UI feedback for the user
    toast({
      title: "Handwriting Tool",
      description: "Write naturally on the canvas with a calligraphy-style brush",
      duration: 2000
    });
    
  }, [canvasRef, brushColor, brushSize, toast]);

  // Laser Tool (temporary drawing that fades)
  const handleLaserTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    let laserPath: fabric.Path | null = null;
    let points: { x: number, y: number }[] = [];
    let isDrawing = false;
    let pathData = '';
    
    // Remove any existing event handlers
    canvasRef.current.off('mouse:down');
    canvasRef.current.off('mouse:move');
    canvasRef.current.off('mouse:up');
    
    const onMouseDown = (options: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      isDrawing = true;
      const pointer = canvasRef.current.getPointer(options.e);
      
      // Start a new path
      points = [{ x: pointer.x, y: pointer.y }];
      pathData = `M ${pointer.x} ${pointer.y}`;
      
      // Create initial path with laser-like appearance
      laserPath = new fabric.Path(pathData, {
        stroke: '#ff0000', // Red laser color
        strokeWidth: 3,
        fill: 'transparent',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        opacity: 0.8,
        shadow: new fabric.Shadow({
          color: '#ff0000',
          blur: 10
        })
      });
      
      canvasRef.current.add(laserPath);
      canvasRef.current.renderAll();
    };
    
    const onMouseMove = (options: fabric.IEvent) => {
      if (!isDrawing || !canvasRef.current || !laserPath) return;
      
      const pointer = canvasRef.current.getPointer(options.e);
      
      // Add point to path
      points.push({ x: pointer.x, y: pointer.y });
      pathData += ` L ${pointer.x} ${pointer.y}`;
      
      // Update laser path
      laserPath.set({ path: fabric.util.parsePath(pathData) });
      canvasRef.current.renderAll();
    };
    
    const onMouseUp = () => {
      if (!canvasRef.current || !laserPath) return;
      
      isDrawing = false;
      
      // Fade out and remove the laser path
      const fadeDuration = 1000; // 1 second fade
      const fadeSteps = 20;
      const fadeInterval = fadeDuration / fadeSteps;
      const fadeAmount = laserPath.opacity || 1 / fadeSteps;
      
      let currentStep = 0;
      
      const fadeOut = () => {
        if (currentStep >= fadeSteps || !canvasRef.current || !laserPath) {
          if (canvasRef.current && laserPath) {
            canvasRef.current.remove(laserPath);
            canvasRef.current.renderAll();
          }
          return;
        }
        
        currentStep++;
        const newOpacity = (laserPath.opacity || 1) - fadeAmount;
        laserPath.set('opacity', Math.max(0, newOpacity));
        canvasRef.current.renderAll();
        
        setTimeout(fadeOut, fadeInterval);
      };
      
      fadeOut();
      
      // Reset variables
      laserPath = null;
      points = [];
      pathData = '';
    };
    
    // Add event listeners
    canvasRef.current.on('mouse:down', onMouseDown);
    canvasRef.current.on('mouse:move', onMouseMove);
    canvasRef.current.on('mouse:up', onMouseUp);
    
    // Configure canvas for laser tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    
    // Notify user
    toast({
      title: "Laser Tool",
      description: "Draw temporary highlights that fade away",
      duration: 2000
    });
    
  }, [canvasRef, toast]);

  // Timeline Tool
  const handleTimelineTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for timeline tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Show timeline UI
    setShowTimelinePanel(true);
    
    // Capture current canvas state as initial frame if timeline is empty
    if (timelineFrames.length === 0) {
      const currentState = canvasRef.current.toJSON();
      setTimelineFrames([JSON.stringify(currentState)]);
      setCurrentFrame(0);
    }
    
    toast({
      title: "Timeline Tool",
      description: "Create and manage animation frames",
      duration: 2000
    });
    
  }, [canvasRef, toast, timelineFrames.length]);

  // Add this function to create a new frame
  const addTimelineFrame = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Capture current canvas state
    const currentState = canvasRef.current.toJSON();
    
    // Add to frames
    setTimelineFrames(prev => [...prev, JSON.stringify(currentState)]);
    setCurrentFrame(timelineFrames.length); // Set to the new frame
    
    toast({
      title: "Frame Added",
      description: `Created frame #${timelineFrames.length + 1}`,
      duration: 1500
    });
  }, [canvasRef, timelineFrames.length, toast]);

  // Add this function to navigate between frames
  const goToFrame = useCallback((frameIndex: number) => {
    if (!canvasRef.current || !timelineFrames[frameIndex]) return;
    
    // Save current frame if needed
    if (frameIndex !== currentFrame) {
      // Load selected frame
      canvasRef.current.loadFromJSON(timelineFrames[frameIndex], () => {
        canvasRef.current?.renderAll();
        setCurrentFrame(frameIndex);
      });
    }
  }, [canvasRef, timelineFrames, currentFrame]);

  // Add this to your component's return statement
  const renderTimelinePanel = () => {
    if (!showTimelinePanel) return null;
    
    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                     bg-black/80 backdrop-blur-sm rounded-lg p-2 
                     shadow-xl border border-white/10 z-40">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white text-sm font-bold">Timeline</h3>
          <button 
            className="text-white/70 hover:text-white text-xs"
            onClick={() => setShowTimelinePanel(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="flex gap-1 mb-2 overflow-x-auto max-w-[600px] p-1">
          {timelineFrames.map((_, index) => (
            <button
              key={index}
              className={`min-w-[40px] h-10 flex items-center justify-center rounded 
                       ${currentFrame === index ? 'bg-blue-600' : 'bg-black/50'}`}
              onClick={() => goToFrame(index)}
            >
              <span className="text-white text-xs">{index + 1}</span>
            </button>
          ))}
          
          <button
            className="min-w-[40px] h-10 flex items-center justify-center rounded bg-black/30 hover:bg-black/50"
            onClick={addTimelineFrame}
          >
            <span className="text-white text-lg">+</span>
          </button>
        </div>
        
        <div className="flex justify-between">
          <button
            className="bg-blue-600 text-white text-xs p-1 rounded flex-1 mr-1"
            onClick={() => {
              // Placeholder for play animation
              toast({
                title: "Animation",
                description: "Playing animation...",
                duration: 1500
              });
            }}
          >
            Play
          </button>
          <button
            className="bg-black/50 text-white text-xs p-1 rounded flex-1"
            onClick={() => {
              // Export animation functionality would go here
              toast({
                title: "Export",
                description: "Animation export feature coming soon",
                duration: 1500
              });
            }}
          >
            Export
          </button>
        </div>
      </div>
    );
  };

  // Emoji Tool
  const handleEmojiTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for emoji placement
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Show emoji picker UI
    setShowEmojiPicker(true);
    
    // Define emoji handler
    const handleEmojiClick = (emoji: string) => {
      if (!canvasRef.current) return;
      
      // Get canvas center or cursor position
      const center = canvasRef.current.getCenter();
      
      // Create text object with the emoji
      const emojiObj = new fabric.Text(emoji, {
        left: center.left,
        top: center.top,
        fontSize: 40,
        selectable: true,
        hasControls: true,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.2)',
          blur: 5,
          offsetX: 3,
          offsetY: 3
        })
      });
      
      canvasRef.current.add(emojiObj);
      canvasRef.current.setActiveObject(emojiObj);
      canvasRef.current.renderAll();
      generateHistoryState();
      
      // Optionally close the picker after selection
      // setShowEmojiPicker(false);
      
      toast({
        title: "Emoji Added",
        description: "Emoji placed on canvas",
        duration: 1000
      });
    };
    
    // Attach the handler to window for access from the emoji picker UI
    (window as any).handleEmojiClick = handleEmojiClick;
    
    return {
      renderEmojiPicker: () => {
        if (!showEmojiPicker) return null;
        
        const emojiCategories = {
          'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊', '😇'],
          'People': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '👌', '🤏', '👈'],
          'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁'],
          'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑'],
          'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '💡', '🔦', '🕯️', '📞', '📟'],
          'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️']
        };
        
        return (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-black/80 backdrop-blur-sm rounded-lg p-3 max-h-[80vh] overflow-auto
                        shadow-xl border border-white/10 z-50 w-[320px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white text-sm font-bold">Emoji Picker</h3>
              <button 
                className="text-white/70 hover:text-white"
                onClick={() => setShowEmojiPicker(false)}
              >
                ✕
              </button>
            </div>
            
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category} className="mb-3">
                <h4 className="text-white/70 text-xs mb-1">{category}</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="w-8 h-8 flex items-center justify-center 
                              hover:bg-white/20 rounded transition-colors"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      <span className="text-xl">{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }
    };
  }, [canvasRef, showEmojiPicker, setShowEmojiPicker, generateHistoryState, toast]);

  // Snap Tool
  const handleSnapTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Toggle snap to grid
    const isSnapEnabled = !canvasRef.current.snapToGrid;
    canvasRef.current.snapToGrid = isSnapEnabled;
    
    // Configure canvas for snap behavior
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    
    // Notify user of snap status
    toast({
      title: isSnapEnabled ? "Snap Enabled" : "Snap Disabled",
      description: isSnapEnabled ? "Objects will snap to grid" : "Free movement enabled",
      duration: 1500
    });
    
  }, [canvasRef, toast]);

  // Chart Tool
  const handleChartTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Configure canvas for chart tool
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = true;
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    
    // Sample chart handler - creates a basic bar chart
    const chartHandler = (event: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      const pointer = canvasRef.current.getPointer(event.e);
      
      // Create a simple bar chart with rectangles
      const chartWidth = 200;
      const chartHeight = 150;
      const barWidth = 30;
      const bars = 4;
      const spacing = 10;
      
      // Create chart elements
      const chartElements = [];
      
      // Base line (x-axis)
      const xAxis = new fabric.Line(
        [pointer.x, pointer.y + chartHeight, pointer.x + chartWidth, pointer.y + chartHeight],
        { stroke: 'white', strokeWidth: 2, selectable: false }
      );
      chartElements.push(xAxis);
      
      // Y-axis
      const yAxis = new fabric.Line(
        [pointer.x, pointer.y, pointer.x, pointer.y + chartHeight],
        { stroke: 'white', strokeWidth: 2, selectable: false }
      );
      chartElements.push(yAxis);
      
      // Add bars with random heights
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * 120 + 30;
        const barX = pointer.x + (i * (barWidth + spacing)) + 20;
        const barY = pointer.y + chartHeight - barHeight;
        
        const bar = new fabric.Rect({
          left: barX,
          top: barY,
          width: barWidth,
          height: barHeight,
          fill: `hsl(${i * 360/bars}, 70%, 60%)`,
          stroke: 'white',
          strokeWidth: 1,
          selectable: false
        });
        
        chartElements.push(bar);
      }
      
      // Group all chart elements
      const chartGroup = new fabric.Group(chartElements, {
        left: pointer.x,
        top: pointer.y,
        selectable: true
      });
      
      canvasRef.current.add(chartGroup);
      canvasRef.current.setActiveObject(chartGroup);
      canvasRef.current.renderAll();
      generateHistoryState();
    };
    
    // Remove existing handlers
    canvasRef.current.off('mouse:down');
    
    // Add new handler
    canvasRef.current.on('mouse:down', chartHandler);
    
    // Notify user
    toast({
      title: "Chart Tool",
      description: "Click to place a sample chart",
      duration: 2000
    });
    
  }, [canvasRef, toast, generateHistoryState]);

  // Text formatting toolbar renderer
  const renderTextFormatToolbar = () => {
    if (!showTextFormatToolbar) return null;
    
    const activeObject = canvasRef.current?.getActiveObject();
    const isText = activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text');
    
    if (!isText) return null;
    
    return (
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-white/10 z-40">
        <div className="grid grid-cols-2 gap-2">
          {/* Font Family Selector */}
          <select 
            className="bg-black/50 text-white text-sm rounded p-1"
            value={(activeObject as fabric.IText).fontFamily}
            onChange={(e) => applyTextFormatting('fontFamily', e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Impact">Impact</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
          
          {/* Font Size Selector */}
          <select 
            className="bg-black/50 text-white text-sm rounded p-1"
            value={(activeObject as fabric.IText).fontSize}
            onChange={(e) => applyTextFormatting('fontSize', e.target.value)}
          >
            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72].map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>
        
        {/* Formatting Buttons */}
        <div className="flex gap-1 mt-2">
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).fontWeight === 'bold' ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('fontWeight', 'bold')}
          >
            <span className="font-bold">B</span>
          </button>
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).fontStyle === 'italic' ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('fontStyle', 'italic')}
          >
            <span className="italic">I</span>
          </button>
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).underline ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('underline', true)}
          >
            <span className="underline">U</span>
          </button>
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).linethrough ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('linethrough', true)}
          >
            <span className="line-through">S</span>
          </button>
        </div>
        
        {/* Text Alignment */}
        <div className="flex gap-1 mt-2">
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).textAlign === 'left' ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('textAlign', 'left')}
          >
            <AlignLeft size={14} />
          </button>
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).textAlign === 'center' ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('textAlign', 'center')}
          >
            <AlignCenter size={14} />
          </button>
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).textAlign === 'right' ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('textAlign', 'right')}
          >
            <AlignRight size={14} />
          </button>
          <button
            className={`p-1 rounded ${(activeObject as fabric.IText).textAlign === 'justify' ? 'bg-white/30' : 'bg-black/50'}`}
            onClick={() => applyTextFormatting('textAlign', 'justify')}
          >
            <AlignJustify size={14} />
          </button>
        </div>
        
        {/* Color picker */}
        <div className="mt-2">
          <input 
            type="color" 
            value={(activeObject as fabric.IText).fill as string} 
            onChange={(e) => applyTextFormatting('fill', e.target.value)}
            className="w-full h-6 rounded cursor-pointer"
          />
        </div>
      </div>
    );
  };

  // Fix the image import tool implementation
  const handleImageTool = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Handle file selection
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || !files[0]) return;
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const imgData = event.target?.result as string;
        
        fabric.Image.fromURL(imgData, (img) => {
          if (!canvasRef.current) return;
          
          // Scale image to fit canvas
          const canvasWidth = canvasRef.current.getWidth();
          const canvasHeight = canvasRef.current.getHeight();
          const imgWidth = img.width || 0;
          const imgHeight = img.height || 0;
          
          // If image is too large, scale it down
          if (imgWidth > canvasWidth * 0.8 || imgHeight > canvasHeight * 0.8) {
            const scale = Math.min(
              (canvasWidth * 0.8) / imgWidth,
              (canvasHeight * 0.8) / imgHeight
            );
            img.scale(scale);
          }
          
          // Center the image on canvas
          img.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center'
          });
          
          canvasRef.current.add(img);
          canvasRef.current.setActiveObject(img);
          canvasRef.current.renderAll();
          generateHistoryState();
          
          toast({
            title: "Image Added",
            description: "Image placed on canvas",
            duration: 1500
          });
        });
      };
      
      reader.readAsDataURL(files[0]);
      
      // Clean up
      document.body.removeChild(fileInput);
    };
    
    // Trigger file selection
    fileInput.click();
  }, [canvasRef, generateHistoryState, toast]);

  // Performance optimization for canvas rendering
  const setupCanvasOptimizations = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Set global fabric options for better performance
    fabric.Object.prototype.objectCaching = true;
    fabric.Object.prototype.statefullCache = false; // Only cache when necessary
    fabric.Object.prototype.noScaleCache = true;
    
    // Optimize rendering by batching updates
    const originalRenderAll = canvasRef.current.renderAll.bind(canvasRef.current);
    let renderScheduled = false;
    
    canvasRef.current.renderAll = function() {
      if (renderScheduled) return;
      
      renderScheduled = true;
      requestAnimationFrame(() => {
        originalRenderAll();
        renderScheduled = false;
      });
    };
    
    // Optimize object addition
    const originalAdd = canvasRef.current.add.bind(canvasRef.current);
    canvasRef.current.add = function(...objects: fabric.Object[]) {
      // Set reasonable defaults for new objects
      objects.forEach(obj => {
        if (!obj.objectCaching) {
          obj.objectCaching = true;
        }
        
        // Add common shadow only when needed
        if (obj.type !== 'path' && obj.type !== 'line') {
          obj.setShadow({
            color: 'rgba(0,0,0,0.05)',
            blur: 5,
            offsetX: 2,
            offsetY: 2
          });
        }
      });
      
      return originalAdd(...objects);
    };
    
    // Better selection handling
    canvasRef.current.on('selection:created', (e) => {
      if (!e.selected) return;
      
      e.selected.forEach(obj => {
        // Highlight selected objects
        obj.set({
          borderColor: '#00A0FF',
          cornerColor: '#00A0FF',
          cornerSize: 10,
          transparentCorners: false,
          cornerStyle: 'circle'
        });
      });
      
      canvasRef.current?.renderAll();
    });
    
    // Default interactive settings
    canvasRef.current.selection = true;
    canvasRef.current.preserveObjectStacking = true;
    canvasRef.current.stopContextMenu = true;
    
    // Update canvas on window resize for responsiveness
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const canvasEl = canvasRef.current.getElement();
      
      if (canvasEl) {
        const rect = container.getBoundingClientRect();
        canvasRef.current.setWidth(rect.width);
        canvasRef.current.setHeight(rect.height);
        canvasRef.current.renderAll();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef, containerRef]);

  // Add this to useEffect when canvas is created
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Apply performance optimizations
    const cleanup = setupCanvasOptimizations();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [canvasRef, setupCanvasOptimizations]);

  // Fix Emotion Picker rendering
  

  
  // Add these state variables
  
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ x: 0, y: 0 });

  // Create handler for showing emoji picker
 

  // Implement emoji click handler correctly
  const handleEmojiClick = (emoji: string) => {
    if (!canvasRef.current) return;
    
    // Get center position of canvas
    const canvas = canvasRef.current;
    const center = canvas.getCenter();
    const pointer = canvas.getPointer({ clientX: center.left, clientY: center.top });
    
    const text = new fabric.Text(emoji, {
      left: pointer.x,
      top: pointer.y,
      fontSize: 30,
      fontFamily: 'Arial',
      selectable: true,
      hasControls: true,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    if (onChanged) onChanged(true);
    setShowEmojiPicker(false);
  };

  // Update the renderOptimizedEmojiPicker function
  const renderOptimizedEmojiPicker = () => {
    if (!showEmojiPicker) return null;
    
    const popularEmojis = ['😀', '👍', '❤️', '🎉', '🔥', '⭐', '💯', '🤔', '👀', '✅', 
                         '⚠️', '❌', '🚀', '💡', '📝', '🎯', '🏆', '🔄', '💪', '🙏'];
    
    return (
      <div className="emoji-picker-container" 
           style={{ 
             position: 'absolute', 
             left: emojiPickerPosition.x, 
             top: emojiPickerPosition.y,
             background: '#fff',
             padding: '10px',
             borderRadius: '8px',
             boxShadow: '0 0 10px rgba(0,0,0,0.2)',
             zIndex: 1000
           }}>
        <div className="emoji-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
          {popularEmojis.map((emoji, index) => (
            <button 
              key={index}
              className="emoji-button"
              style={{ fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none' }}
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button 
          style={{ width: '100%', marginTop: '5px', padding: '5px' }}
          onClick={() => setShowEmojiPicker(false)}
        >
          Close
        </button>
      </div>
    );
  };

  // Update tool selection to handle emoji tool
  useEffect(() => {
    if (currentTool === 'emoji') {
      // Show emoji picker in the center of the canvas
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setEmojiPickerPosition({
          x: rect.width / 2 - 100,
          y: rect.height / 2 - 100
        });
        setShowEmojiPicker(true);
      }
    } else {
      setShowEmojiPicker(false);
    }
  }, [currentTool]);

  // Improved copy implementation
  const handleCopy = useCallback(() => {
    if (!canvasRef.current) return;
    
    const activeObject = canvasRef.current.getActiveObject();
    if (!activeObject) return;
    
    // Store object data in memory
    clipboardRef.current = activeObject;
    
    toast({ 
      title: "Copied", 
      description: "Object copied to clipboard",
      duration: 1500
    });
  }, [canvasRef, toast]);

  // Improved paste implementation
  const handlePaste = useCallback(() => {
    if (!canvasRef.current || !clipboardRef.current) return;
    
    clipboardRef.current.clone((cloned: fabric.Object) => {
      if (!canvasRef.current) return;
      
      // Calculate offset to make pasted object visible
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      
      // If it's a group, ensure all objects in group are enabled
      if (cloned instanceof fabric.Group) {
        cloned.getObjects().forEach((obj) => {
          obj.set({ 
            evented: true,
            selectable: true 
          });
        });
      }
      
      canvasRef.current.add(cloned);
      canvasRef.current.setActiveObject(cloned);
      canvasRef.current.renderAll();
      generateHistoryState();
      
      toast({ 
        title: "Pasted", 
        description: "Object pasted from clipboard",
        duration: 1500
      });
    });
  }, [canvasRef, generateHistoryState, toast]);

  // Improved shape creation
  const handleShapeTool = useCallback((shapeType: DrawingTool) => {
    if (!canvasRef.current) return;
    
    let shapeObj: fabric.Object | null = null;
    let isDrawing = false;
    let startPoint = { x: 0, y: 0 };
    
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'crosshair';
    
    const onMouseDown = (options: fabric.IEvent) => {
      if (!canvasRef.current) return;
      
      isDrawing = true;
      const pointer = canvasRef.current.getPointer(options.e);
      startPoint = { x: pointer.x, y: pointer.y };
      
      // Create initial shape based on type
      switch (shapeType) {
        case "rectangle":
          shapeObj = new fabric.Rect({
            left: startPoint.x,
            top: startPoint.y,
            width: 1,
            height: 1,
            fill: 'transparent',
            stroke: brushColor,
            strokeWidth: brushSize,
            opacity: brushOpacity
          });
          break;
        
        case "circle":
          shapeObj = new fabric.Circle({
            left: startPoint.x,
            top: startPoint.y,
            radius: 1,
            fill: 'transparent',
            stroke: brushColor,
            strokeWidth: brushSize,
            opacity: brushOpacity
          });
          break;
        
        case "triangle":
          shapeObj = new fabric.Triangle({
            left: startPoint.x,
            top: startPoint.y,
            width: 1,
            height: 1,
            fill: 'transparent',
            stroke: brushColor,
            strokeWidth: brushSize,
            opacity: brushOpacity
          });
          break;
        
        case "line":
          const points = [startPoint.x, startPoint.y, startPoint.x + 1, startPoint.y + 1];
          shapeObj = new fabric.Line(points, {
            stroke: brushColor,
            strokeWidth: brushSize,
            opacity: brushOpacity
          });
          break;
        
        // Add other shapes...
      }
      
      if (shapeObj) {
        canvasRef.current.add(shapeObj);
      }
    };
    
    const onMouseMove = (options: fabric.IEvent) => {
      if (!isDrawing || !canvasRef.current || !shapeObj) return;
      
      const pointer = canvasRef.current.getPointer(options.e);
      
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);
      
      // Update shape dimensions based on mouse position
      switch (shapeType) {
        case "rectangle":
          const rect = shapeObj as fabric.Rect;
          rect.set({
            left: Math.min(startPoint.x, pointer.x),
            top: Math.min(startPoint.y, pointer.y),
            width: width,
            height: height
          });
          break;
        
        case "circle":
          const circle = shapeObj as fabric.Circle;
          const radius = Math.max(width, height) / 2;
          circle.set({
            left: Math.min(startPoint.x, pointer.x),
            top: Math.min(startPoint.y, pointer.y),
            radius: radius
          });
          break;
        
        case "triangle":
          const triangle = shapeObj as fabric.Triangle;
          triangle.set({
            left: Math.min(startPoint.x, pointer.x),
            top: Math.min(startPoint.y, pointer.y),
            width: width,
            height: height
          });
          break;
        
        case "line":
          const line = shapeObj as fabric.Line;
          line.set({
            x2: pointer.x,
            y2: pointer.y
          });
          break;
        
        // Update other shapes...
      }
      
      canvasRef.current.renderAll();
    };
    
    const onMouseUp = () => {
      isDrawing = false;
      if (canvasRef.current && shapeObj) {
        // Finalize shape
        canvasRef.current.setActiveObject(shapeObj);
        generateHistoryState();
        
        // If tool is not persistent, return to select tool
        if (!isToolPersistent) {
          handleToolSelect('select');
        }
      }
    };
    
    // Remove existing listeners
    canvasRef.current.off('mouse:down');
    canvasRef.current.off('mouse:move');
    canvasRef.current.off('mouse:up');
    
    // Add new listeners
    canvasRef.current.on('mouse:down', onMouseDown);
    canvasRef.current.on('mouse:move', onMouseMove);
    canvasRef.current.on('mouse:up', onMouseUp);
  }, [canvasRef, brushColor, brushSize, brushOpacity, isToolPersistent, handleToolSelect, generateHistoryState]);

  return (
    <motion.div 
      className={cn(
        "relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden",
        fullScreen && "h-screen"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      ref={containerRef}
    >
      {renderToolbar()}
      
      {renderZoomControl()}
      
      {showFloatingToolbar && (
        <FloatingToolbar
          position={floatingToolbarPosition}
          onPositionChange={setFloatingToolbarPosition}
          onToolSelect={handleFloatingToolSelect}
          activeTool={activeTool}
          onUndo={() => {
            // Implement undo functionality
            if (canvasRef.current && historyIndex > 0) {
              // Save current state to redo stack
              const currentState = history[historyIndex];
              setRedoStack(prev => [...prev, currentState]);
              
              // Go back to previous state
              const prevState = history[historyIndex - 1];
              canvasRef.current.loadFromJSON(prevState, () => {
                canvasRef.current?.renderAll();
                setHistoryIndex(historyIndex - 1);
              });
              
              toast({ title: "Undo", description: "Action undone" });
            }
          }}
          onRedo={() => {
            // Implement redo functionality
            if (canvasRef.current && redoStack.length > 0) {
              // Get last state from redo stack
              const lastIndex = redoStack.length - 1;
              const nextState = redoStack[lastIndex];
              
              // Apply it to canvas
              canvasRef.current.loadFromJSON(nextState, () => {
                canvasRef.current?.renderAll();
                
                // Update history index and remove from redo stack
                setHistoryIndex(historyIndex + 1);
                setRedoStack(redoStack.slice(0, -1));
              });
              
              toast({ title: "Redo", description: "Action redone" });
            }
          }}
          canUndo={historyIndex > 0}
          canRedo={redoStack.length > 0}
          hasSelection={!!canvasRef.current?.getActiveObject()}
          onDelete={() => {
            if (canvasRef.current) {
              const activeObject = canvasRef.current.getActiveObject();
              if (activeObject) {
                canvasRef.current.remove(activeObject);
                canvasRef.current.renderAll();
                generateHistoryState();
                toast({ title: "Deleted", description: "Object deleted" });
              }
            }
          }}
          onCopy={handleCopy}
          onCut={() => {
            // Implement cut functionality
            if (canvasRef.current) {
              const activeObject = canvasRef.current.getActiveObject();
              if (activeObject) {
                // Store object JSON in localStorage
                localStorage.setItem('canvas-clipboard', JSON.stringify(activeObject.toJSON()));
                // Remove from canvas
                canvasRef.current.remove(activeObject);
                canvasRef.current.renderAll();
                generateHistoryState();
                toast({ title: "Cut", description: "Object cut to clipboard" });
              }
            }
          }}
          onPaste={handlePaste}
        />
      )}
      
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onAction={handleContextMenuAction}
          hasSelection={!!contextMenu.targetObject}
        />
      )}
      
      <motion.div
        className="fixed bottom-0 left-0 z-40 bg-black/70 text-white text-xs p-1.5 rounded-tr-md backdrop-blur-sm border border-slate-700/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
      >
        <div className="flex items-center gap-2">
          <span>Zoom: {zoom}%</span>
          <span>|</span>
          <span>Space+Drag to pan</span>
          <span>|</span>
          <span>Right-click for options</span>
          <span>|</span>
          <span className="text-emerald-400">Tool: {activeTool}</span>
        </div>
      </motion.div>
        
      <div className="w-full h-full" onContextMenu={handleContextMenu}>
        <Canvas
          className={cn(
            "w-full h-full",
            renderCursorClass()
          )}
          width={canvasWidth}
          height={canvasHeight}
          onCanvasCreated={handleCanvasCreated}
          showGrid={showGrid}
          gridSize={gridSize}
          bgColor={bgColor}
          key="main-canvas"
        />
      </div>
      
      {renderOptimizedEmojiPicker()}
      {renderTimelinePanel()}
      
      {/* Add the new UI components */}
      {renderTransformPanel()}
      {renderTextFormatToolbar()}
    </motion.div>
  );
};

export default ArtCanvas;