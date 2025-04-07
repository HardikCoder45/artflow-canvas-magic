
import { fabric } from "fabric";

export const createBrushTextures = (canvas: fabric.Canvas) => {
  // Create default brushes and patterns
  createWatercolorPattern(canvas, "#000000");
  createChalkPattern(canvas, "#000000");
  createMarkerPattern(canvas, "#000000");
  createSprayPattern(canvas, "#000000");
  createGlitterPattern(canvas, "#000000");
};

export const createWatercolorPattern = (canvas: fabric.Canvas, color: string) => {
  // Create custom watercolor brush
  const watercolorBrush = new fabric.PatternBrush(canvas);
  
  watercolorBrush.getPatternSrc = function() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 20;
    patternCanvas.height = 20;
    const ctx = patternCanvas.getContext('2d');
    
    if (ctx) {
      // Set the fill color
      ctx.fillStyle = color || '#000';
      
      // Create a watercolor-like effect with varying opacity
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * 20;
        const y = Math.random() * 20;
        const radius = Math.random() * 5 + 2;
        
        ctx.globalAlpha = Math.random() * 0.3 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return patternCanvas;
  };
  
  return watercolorBrush;
};

export const createChalkPattern = (canvas: fabric.Canvas, color: string) => {
  // Create custom chalk brush
  const chalkBrush = new fabric.PatternBrush(canvas);
  
  chalkBrush.getPatternSrc = function() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 10;
    patternCanvas.height = 10;
    const ctx = patternCanvas.getContext('2d');
    
    if (ctx) {
      // Set the fill color
      ctx.fillStyle = color || '#000';
      
      // Create a chalk-like texture with dots and noise
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 10;
        const y = Math.random() * 10;
        const size = Math.random() * 1.5 + 0.5;
        
        ctx.globalAlpha = Math.random() * 0.6 + 0.2;
        ctx.fillRect(x, y, size, size);
      }
    }
    
    return patternCanvas;
  };
  
  return chalkBrush;
};

export const createMarkerPattern = (canvas: fabric.Canvas, color: string) => {
  // Create custom marker brush
  const markerBrush = new fabric.PatternBrush(canvas);
  
  markerBrush.getPatternSrc = function() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 10;
    patternCanvas.height = 10;
    const ctx = patternCanvas.getContext('2d');
    
    if (ctx) {
      // Create marker texture with solid color but semi-transparent edges
      ctx.fillStyle = color || '#000';
      
      // Main marker body
      ctx.globalAlpha = 0.7;
      ctx.fillRect(2, 0, 6, 10);
      
      // Marker textured edges
      ctx.globalAlpha = 0.4;
      ctx.fillRect(1, 0, 1, 10);
      ctx.fillRect(8, 0, 1, 10);
      
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, 0, 1, 10);
      ctx.fillRect(9, 0, 1, 10);
    }
    
    return patternCanvas;
  };
  
  return markerBrush;
};

export const createSprayPattern = (canvas: fabric.Canvas, color: string) => {
  // Create custom spray brush with better density control
  const sprayBrush = new fabric.SprayBrush(canvas);
  sprayBrush.color = color;
  sprayBrush.width = 20;
  sprayBrush.density = 20;
  sprayBrush.dotWidth = 2;
  sprayBrush.dotWidthVariance = 2;
  sprayBrush.randomOpacity = true;
  sprayBrush.opacity = 0.5;
  
  return sprayBrush;
};

export const createGlitterPattern = (canvas: fabric.Canvas, color: string) => {
  // Create custom glitter brush
  const glitterBrush = new fabric.PatternBrush(canvas);
  
  glitterBrush.getPatternSrc = function() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 20;
    patternCanvas.height = 20;
    const ctx = patternCanvas.getContext('2d');
    
    if (ctx) {
      // Convert the color to RGB for manipulation
      let r = 0, g = 0, b = 0;
      try {
        if (color.startsWith('#')) {
          r = parseInt(color.slice(1, 3), 16);
          g = parseInt(color.slice(3, 5), 16);
          b = parseInt(color.slice(5, 7), 16);
        }
      } catch (e) {
        // If color parsing fails, use default glitter colors
        r = 220;
        g = 220;
        b = 220;
      }
      
      // Create scattered glitter particles with varying sizes and opacities
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * 20;
        const y = Math.random() * 20;
        const size = Math.random() * 2 + 0.5;
        
        // Add color variations for sparkle effect
        const colorVariation = Math.random() * 55;
        const sparkleR = Math.min(255, r + colorVariation);
        const sparkleG = Math.min(255, g + colorVariation);
        const sparkleB = Math.min(255, b + colorVariation);
        
        ctx.fillStyle = `rgb(${sparkleR}, ${sparkleG}, ${sparkleB})`;
        ctx.globalAlpha = Math.random() * 0.7 + 0.3;
        
        // Draw a small star-like shape
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Sometimes add a brighter center
        if (Math.random() > 0.6) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = Math.random() * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    return patternCanvas;
  };
  
  return glitterBrush;
};
