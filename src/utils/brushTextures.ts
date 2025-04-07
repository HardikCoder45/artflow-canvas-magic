
import { fabric } from "fabric";

// Define different brush textures
export const createBrushTextures = (canvas: fabric.Canvas) => {
  // Standard PencilBrush is already available by default
  
  // Create a spray brush
  const sprayBrush = new fabric.SprayBrush(canvas);
  sprayBrush.width = 35;
  sprayBrush.density = 20;
  sprayBrush.dotWidth = 2;
  sprayBrush.randomOpacity = true;
  
  // Create a pattern brush (for textures like chalk, watercolor)
  const patternBrush = new fabric.PatternBrush(canvas);
  
  return {
    spray: sprayBrush,
    pattern: patternBrush,
  };
};

// Generate pattern for watercolor effect
export const createWatercolorPattern = (canvas: fabric.Canvas, color: string) => {
  const brush = new fabric.PatternBrush(canvas);
  
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 50;
  canvasEl.height = 50;
  
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return brush;
  
  // Create watercolor pattern
  ctx.fillStyle = color;
  
  // Create a splotchy watercolor effect
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 50;
    const y = Math.random() * 50;
    const radius = Math.random() * 15 + 5;
    const opacity = Math.random() * 0.4 + 0.1;
    
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
  }
  
  brush.source = canvasEl;
  return brush;
};

// Generate pattern for chalk effect
export const createChalkPattern = (canvas: fabric.Canvas, color: string) => {
  const brush = new fabric.PatternBrush(canvas);
  
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 40;
  canvasEl.height = 40;
  
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return brush;
  
  // Create chalk texture with stippling effect
  ctx.fillStyle = color;
  
  // Base layer
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 40;
    const y = Math.random() * 40;
    const radius = Math.random() * 1 + 0.5;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
  }
  
  // Add some texture lines
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 40;
    const y = Math.random() * 40;
    const width = Math.random() * 10 + 5;
    const height = Math.random() * 1 + 0.5;
    
    ctx.fillRect(x, y, width, height);
  }
  
  brush.source = canvasEl;
  return brush;
};
