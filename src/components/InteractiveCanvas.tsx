import { useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface InteractiveCanvasProps {
  width: number;
  height: number;
  points: Point[];
}

const InteractiveCanvas = ({ width, height, points }: InteractiveCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw points with connections
    if (points.length > 1) {
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        
        // Draw line between points
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.strokeStyle = currentPoint.color;
        ctx.lineWidth = currentPoint.size;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw glow effect
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, currentPoint.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = currentPoint.color + '40'; // 25% opacity
        ctx.fill();
      }
    }
    
    // Add subtle particle effects
    for (let i = 0; i < points.length; i++) {
      if (Math.random() > 0.7) {
        const point = points[i];
        ctx.beginPath();
        ctx.arc(
          point.x + (Math.random() - 0.5) * 20, 
          point.y + (Math.random() - 0.5) * 20, 
          Math.random() * 2 + 1, 
          0, 
          Math.PI * 2
        );
        ctx.fillStyle = point.color + '80'; // 50% opacity
        ctx.fill();
      }
    }
  }, [points, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
    />
  );
};

export default InteractiveCanvas; 