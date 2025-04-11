import React from 'react';
import { motion } from 'framer-motion';
import { CollaborationUser } from '@/services/collaborationService';

interface RemoteCursorProps {
  user: CollaborationUser;
  position: { x: number; y: number };
}

const RemoteCursor: React.FC<RemoteCursorProps> = ({ user, position }) => {
  if (!position) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* Custom cursor */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'translate(-4px, -4px)' }}
      >
        <path
          d="M5 2L19 16L12 17L10 22L5 2Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* User label */}
      <div
        style={{
          background: user.color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          transform: 'translate(12px, 0)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          maxWidth: '120px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {user.name}
      </div>
    </motion.div>
  );
};

export default RemoteCursor; 