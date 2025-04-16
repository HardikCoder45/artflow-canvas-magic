import React from 'react';
import CollaborativeArtCanvas from '@/components/CollaborativeArtCanvas';

export default function CollaborativeCanvasPage() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <CollaborativeArtCanvas fullScreen={true} />
    </div>
  );
} 