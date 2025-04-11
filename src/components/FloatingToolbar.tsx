import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Pencil, Square, Circle, Eraser, Trash, Copy, Scissors, ClipboardPaste, 
  Undo, Redo, Brush, Droplets, Highlighter, PenTool, Sparkles, Pipette, 
  PaintBucket, Type, Image as ImageIcon, Triangle, Star, LineChart, 
  ArrowLeft, Download, Share2, Layers, Grid, SlidersHorizontal, Crop, 
  Hexagon, MessageSquare, MessageCircle, GitBranch, BarChart, FileText, 
  Smile, Search, FileCode, Move, AlignCenter, Cloud, CheckSquare, Waves, 
  Combine, FolderClosed, FolderOpen, AlignVerticalJustifyCenter, AlignHorizontalSpaceBetween, 
  RotateCcw, RotateCw, Clock, MoveUp, MoveDown, Palette, AlignLeft, AlignRight,
  AlignJustify, FlipVertical, FlipHorizontal
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FloatingToolbarProps = {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onToolSelect: (tool: string) => void;
  activeTool: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
};

type Tool = {
  id: string;
  icon: React.ReactNode;
  label: string;
  action?: () => void;
  disabled?: boolean;
  shortcut?: string;
};

type ToolCategory = {
  id: string;
  label: string;
  tools: Tool[];
}

// Create a memoized toolbar component to avoid unnecessary re-renders
const FloatingToolbar = memo(({
  position,
  onPositionChange,
  onToolSelect,
  activeTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasSelection,
  onDelete,
  onCopy,
  onCut,
  onPaste,
}: FloatingToolbarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem('artflow-active-category') || 'drawing';
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('artflow-toolbar-collapsed') === 'true';
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const startDragPos = useRef<{ x: number; y: number } | null>(null);

  // Load saved position on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('artflow-toolbar-position');
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        onPositionChange(parsedPosition);
      } catch (e) {
        console.error("Error loading toolbar position:", e);
      }
    }
  }, [onPositionChange]);

  // Organized tool categories
  const toolCategories: ToolCategory[] = [
    {
      id: 'drawing',
      label: 'Draw',
      tools: [
        { id: 'select', icon: <Crop size={18} />, label: 'Select', shortcut: 'V' },
        { id: 'pencil', icon: <Pencil size={18} />, label: 'Pencil', shortcut: 'P' },
        { id: 'brush', icon: <Brush size={18} />, label: 'Brush', shortcut: 'B' },
        { id: 'spray', icon: <Droplets size={18} />, label: 'Spray', shortcut: 'S' },
        { id: 'marker', icon: <Highlighter size={18} />, label: 'Marker', shortcut: 'M' },
        { id: 'calligraphy', icon: <PenTool size={18} />, label: 'Calligraphy', shortcut: 'C' },
        { id: 'glitter', icon: <Sparkles size={18} />, label: 'Glitter' },
        { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser', shortcut: 'E' },
        { id: 'pen', icon: <PenTool size={18} />, label: 'Pen' },
        { id: 'bezier', icon: <PenTool size={18} />, label: 'Bezier' },
        { id: 'handwriting', icon: <PenTool size={18} />, label: 'Handwriting' },
        { id: 'laser', icon: <Pencil size={18} />, label: 'Laser' },
      ]
    },
    {
      id: 'shapes',
      label: 'Shapes',
      tools: [
        { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle', shortcut: 'R' },
        { id: 'circle', icon: <Circle size={18} />, label: 'Circle', shortcut: 'O' },
        { id: 'triangle', icon: <Triangle size={18} />, label: 'Triangle', shortcut: 'T' },
        { id: 'line', icon: <LineChart size={18} />, label: 'Line', shortcut: 'L' },
        { id: 'star', icon: <Star size={18} />, label: 'Star' },
        { id: 'arrow', icon: <ArrowLeft size={18} />, label: 'Arrow' },
        { id: 'connector', icon: <Share2 size={18} />, label: 'Connector', shortcut: 'N' },
        { id: 'polygon', icon: <Hexagon size={18} />, label: 'Polygon' },
        { id: 'speech-bubble', icon: <MessageSquare size={18} />, label: 'Speech Bubble' },
        { id: 'callout', icon: <MessageCircle size={18} />, label: 'Callout' },
        { id: 'flowchart', icon: <GitBranch size={18} />, label: 'Flowchart' },
        { id: 'chart', icon: <BarChart size={18} />, label: 'Chart' },
      ]
    },
    {
      id: 'utility',
      label: 'Tools',
      tools: [
        { id: 'eyedropper', icon: <Pipette size={18} />, label: 'Eyedropper', shortcut: 'K' },
        { id: 'fill', icon: <PaintBucket size={18} />, label: 'Fill', shortcut: 'F' },
        { id: 'text', icon: <Type size={18} />, label: 'Text', shortcut: 'T' },
        { id: 'image', icon: <ImageIcon size={18} />, label: 'Image', shortcut: 'I' },
        { id: 'layers', icon: <Layers size={18} />, label: 'Layers' },
        { id: 'grid', icon: <Grid size={18} />, label: 'Grid', shortcut: 'G' },
        { id: 'sticky', icon: <FileText size={18} />, label: 'Sticky Note' },
        { id: 'emoji', icon: <Smile size={18} />, label: 'Emoji' },
        { id: 'magnifier', icon: <Search size={18} />, label: 'Magnifier' },
        { id: 'template', icon: <FileCode size={18} />, label: 'Template' },
        { id: 'free-transform', icon: <Move size={18} />, label: 'Transform' },
        { id: 'snap', icon: <AlignCenter size={18} />, label: 'Snap' },
      ]
    },
    {
      id: 'effects',
      label: 'Effects',
      tools: [
        { id: 'blur', icon: <SlidersHorizontal size={18} />, label: 'Blur' },
        { id: 'grayscale', icon: <SlidersHorizontal size={18} />, label: 'Grayscale' },
        { id: 'sepia', icon: <SlidersHorizontal size={18} />, label: 'Sepia' },
        { id: 'pixelate', icon: <Grid size={18} />, label: 'Pixelate' },
        { id: 'noise', icon: <SlidersHorizontal size={18} />, label: 'Noise' },
        { id: 'sharpen', icon: <SlidersHorizontal size={18} />, label: 'Sharpen' },
        { id: 'gradient', icon: <Palette size={18} />, label: 'Gradient' },
        { id: 'pattern', icon: <CheckSquare size={18} />, label: 'Pattern' },
        { id: 'shadow', icon: <Cloud size={18} />, label: 'Shadow' },
        { id: 'curves', icon: <Waves size={18} />, label: 'Curves' },
        { id: 'mask', icon: <Combine size={18} />, label: 'Mask' },
      ]
    },
    {
      id: 'arrange',
      label: 'Arrange',
      tools: [
        { id: 'group', icon: <FolderClosed size={18} />, label: 'Group' },
        { id: 'ungroup', icon: <FolderOpen size={18} />, label: 'Ungroup' },
        { id: 'align', icon: <AlignVerticalJustifyCenter size={18} />, label: 'Align' },
        { id: 'distribute', icon: <AlignHorizontalSpaceBetween size={18} />, label: 'Distribute' },
        { id: 'bringToFront', icon: <MoveUp size={18} />, label: 'Bring to Front' },
        { id: 'sendToBack', icon: <MoveDown size={18} />, label: 'Send to Back' },
        { id: 'rotateLeft', icon: <RotateCcw size={18} />, label: 'Rotate Left' },
        { id: 'rotateRight', icon: <RotateCw size={18} />, label: 'Rotate Right' },
        { id: 'duplicate', icon: <Copy size={18} />, label: 'Duplicate' },
        { id: 'delete', icon: <Trash size={18} />, label: 'Delete' },
        { id: 'timeline', icon: <Clock size={18} />, label: 'Timeline' },
      ]
    }
  ];

  // Utility actions
  const utilityTools: Tool[] = [
    { id: 'undo', icon: <Undo size={18} />, label: 'Undo', action: onUndo, disabled: !canUndo, shortcut: 'Ctrl+Z' },
    { id: 'redo', icon: <Redo size={18} />, label: 'Redo', action: onRedo, disabled: !canRedo, shortcut: 'Ctrl+Y' },
    { id: 'delete', icon: <Trash size={18} />, label: 'Delete', action: onDelete, disabled: !hasSelection, shortcut: 'Del' },
    { id: 'copy', icon: <Copy size={18} />, label: 'Copy', action: onCopy, disabled: !hasSelection, shortcut: 'Ctrl+C' },
    { id: 'cut', icon: <Scissors size={18} />, label: 'Cut', action: onCut, disabled: !hasSelection, shortcut: 'Ctrl+X' },
    { id: 'paste', icon: <ClipboardPaste size={18} />, label: 'Paste', action: onPaste, shortcut: 'Ctrl+V' },
  ];

  // Handle drag with useCallback for better performance
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      startDragPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (isDragging && startDragPos.current) {
      const newX = e.clientX - startDragPos.current.x;
      const newY = e.clientY - startDragPos.current.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 200);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 200);
      
      onPositionChange({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDragging, onPositionChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    startDragPos.current = null;
    
    // Save position to localStorage
    localStorage.setItem('artflow-toolbar-position', JSON.stringify(position));
  }, [position]);

  // Handle tool selection with useCallback for better performance
  const handleToolClick = useCallback((tool: Tool) => {
    if (tool.action) {
      tool.action();
    } else {
      onToolSelect(tool.id);
      // We don't change the active category after selecting a tool
      // This ensures tools remain persistent and don't disappear after use
    }
  }, [onToolSelect]);

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Toggle collapsed state
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('artflow-toolbar-collapsed', newState.toString());
  };

  // Update category change handler
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    localStorage.setItem('artflow-active-category', category);
  };

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        className={cn(
          "absolute z-30 bg-black/80 backdrop-blur-sm rounded-lg shadow-xl border border-white/10",
          isCollapsed ? "p-1.5" : "p-1.5"
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        {/* Toolbar header with drag handle */}
        <div 
          className="flex items-center justify-between mb-1 cursor-grab" 
          onMouseDown={handleDragStart}
        >
          <div className="h-1 w-10 bg-white/20 rounded-full mx-auto"></div>
          <button 
            onClick={toggleCollapsed} 
            className="absolute right-2 top-1.5 text-white/50 hover:text-white/80"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tool category tabs */}
              <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="mb-1">
                <TabsList className="bg-black/40 h-7 p-0.5 grid grid-cols-5 w-full">
                  {toolCategories.map(category => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="px-2 text-xs h-6 data-[state=active]:bg-white/20"
                    >
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Current category tools */}
              <div className="grid grid-cols-4 gap-0.5 mb-1">
                {toolCategories
                  .find(category => category.id === activeCategory)?.tools
                  .map(tool => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "w-9 h-9 rounded-md flex items-center justify-center transition-colors",
                            activeTool === tool.id
                              ? "bg-primary text-primary-foreground"
                              : "text-white/70 hover:text-white hover:bg-black/40",
                            tool.disabled && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => !tool.disabled && handleToolClick(tool)}
                          disabled={tool.disabled}
                        >
                          {tool.icon}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="flex flex-col items-center">
                        <p>{tool.label}</p>
                        {tool.shortcut && <span className="text-xs opacity-70">{tool.shortcut}</span>}
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </div>

              {/* Utility tools - always visible */}
              <div className="border-t border-white/10 pt-1 grid grid-cols-6 gap-0.5">
                {utilityTools.map(tool => (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                          "text-white/70 hover:text-white hover:bg-black/40",
                          tool.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !tool.disabled && handleToolClick(tool)}
                        disabled={tool.disabled}
                      >
                        {tool.icon}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="flex flex-col items-center">
                      <p>{tool.label}</p>
                      {tool.shortcut && <span className="text-xs opacity-70">{tool.shortcut}</span>}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
});

FloatingToolbar.displayName = 'FloatingToolbar';

export default FloatingToolbar; 