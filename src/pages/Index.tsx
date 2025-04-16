import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { 
  ArrowRight, 
  Brush, 
  Users, 
  Sparkles, 
  Image, 
  Share2,
  UserIcon,
  Star, 
  Heart, 
  Zap, 
  Code, 
  Layers, 
  Wand2, 
  Plus, 
  Copy, 
  Mail, 
  Lock, 
  ChevronDown, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCollaborativeCanvas, getActiveCanvasSessions } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";

// 3D Canvas Element with enhanced visuals - optimized for performance
const Canvas3DBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      <div className="absolute top-0 left-0 w-full h-full">
        {/* Reduced from 15 to 6 elements for better performance */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(60px)',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * 50 - 25, 0],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Enhanced particle background with depth perception - optimized for performance
const ParticleBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Reduced from 70 to 30 particles for better performance */}
      {Array.from({ length: 30 }).map((_, i) => {
        const size = Math.random() * 5 + 1;
        const depth = Math.random();
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: size,
              height: size,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.1 + depth * 0.6,
              zIndex: Math.floor(depth * 10),
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              opacity: [0.1 + depth * 0.3, 0.1 + depth * 0.8, 0.1 + depth * 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 30 + (1 - depth) * 20, // Simplified animation duration
              repeat: Infinity,
              ease: "linear",
            }}
          />
        );
      })}
    </div>
  );
};

// Interactive color wave canvas with enhanced effects
const InteractiveCanvas = ({ width, height, points }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw points with connections and enhanced effects
    if (points.length > 1) {
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        
        // Draw line between points with varying opacity based on distance
        const distance = Math.sqrt(
          Math.pow(currentPoint.x - prevPoint.x, 2) + 
          Math.pow(currentPoint.y - prevPoint.y, 2)
        );
        
        // Skip if distance is too large (pen lift simulation)
        if (distance > 50) continue;
        
        // Create gradient for the line
        const gradient = ctx.createLinearGradient(
          prevPoint.x, prevPoint.y, 
          currentPoint.x, currentPoint.y
        );
        gradient.addColorStop(0, prevPoint.color);
        gradient.addColorStop(1, currentPoint.color);
        
        // Draw connecting line
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = currentPoint.size;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw glow effect
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, currentPoint.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = currentPoint.color + '20'; // 12.5% opacity
        ctx.fill();
      }
    }
    
    // Add ambient glow effects at random positions for visual interest
    for (let i = 0; i < 5; i++) {
      if (points.length > 0) {
        const randomIndex = Math.floor(Math.random() * points.length);
        const point = points[randomIndex];
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = point.color + '05'; // Very transparent
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

// Floating creative elements with enhanced animation and physics
const floatingElements = [
  { icon: <Brush className="w-7 h-7" />, color: "text-purple-400" },
  { icon: <Star className="w-7 h-7" />, color: "text-yellow-400" },
  { icon: <Heart className="w-7 h-7" />, color: "text-red-400" },
  { icon: <Zap className="w-7 h-7" />, color: "text-blue-400" },
  { icon: <Code className="w-7 h-7" />, color: "text-green-400" },
  { icon: <Layers className="w-7 h-7" />, color: "text-indigo-400" },
  { icon: <Wand2 className="w-7 h-7" />, color: "text-cyan-400" },
];

// Expanded features with visually appealing design for better user retention
const features = [
  { 
    title: "Collaborative Drawing", 
    icon: <Users className="w-8 h-8" />, 
    description: "Create together in real-time with friends and colleagues from around the world. See each other's cursors and changes instantly.",
    color: "from-blue-500/80 to-indigo-600/80",
    gradientBg: "from-blue-500/5 to-indigo-600/5",
    highlightText: "Real-time collaboration with unlimited participants"
  },
  { 
    title: "Advanced Tools", 
    icon: <Brush className="w-8 h-8" />, 
    description: "Professional-grade drawing tools and effects to bring your creative vision to life with precision and style.",
    color: "from-pink-500/80 to-rose-600/80",
    gradientBg: "from-pink-500/5 to-rose-600/5",
    highlightText: "Premium brush engine with pressure sensitivity"
  },
  { 
    title: "AI Enhancements", 
    icon: <Sparkles className="w-8 h-8" />, 
    description: "Intelligent suggestions and style transfers powered by cutting-edge AI to enhance your artwork effortlessly.",
    color: "from-yellow-400/80 to-orange-600/80",
    gradientBg: "from-yellow-400/5 to-orange-600/5",
    highlightText: "Neural style transfer and smart color suggestions"
  },
  { 
    title: "Layer Management", 
    icon: <Layers className="w-8 h-8" />, 
    description: "Powerful layer controls for complex compositions, allowing for sophisticated artwork with depth and dimension.",
    color: "from-green-500/80 to-emerald-600/80",
    gradientBg: "from-green-500/5 to-emerald-600/5",
    highlightText: "Unlimited layers with blend modes and masks"
  },
  { 
    title: "Export & Share", 
    icon: <Share2 className="w-8 h-8" />, 
    description: "Export your masterpieces in multiple high-quality formats and share them instantly across your favorite platforms.",
    color: "from-purple-500/80 to-violet-600/80",
    gradientBg: "from-purple-500/5 to-violet-600/5",
    highlightText: "One-click export to PNG, SVG, PSD and more"
  },
];

// Testimonials section with social proof to build trust
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Digital Artist",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    content: "ArtFlow transformed how I collaborate with clients. The real-time feedback has streamlined my workflow tremendously.",
    stars: 5
  },
  {
    name: "Michael Chen",
    role: "Art Director",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    content: "Our creative team relies on ArtFlow daily. The collaborative tools make remote work feel seamless and personal.",
    stars: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Illustrator",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    content: "The AI enhancement features have helped me push my creativity beyond what I thought was possible. Simply incredible!",
    stars: 4
  }
];

// Pricing tiers for clear value proposition
const pricingTiers = [
  {
    name: "Free",
    description: "Perfect for beginners and casual artists",
    price: "$0",
    period: "forever",
    color: "from-blue-500 to-purple-500",
    features: [
      "Basic drawing tools",
      "5 layers maximum",
      "720p export resolution",
      "Community gallery access",
      "1 concurrent collaboration"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    description: "For serious artists and professionals",
    price: "$9.99",
    period: "per month",
    color: "from-purple-500 to-pink-500",
    features: [
      "All advanced tools & brushes",
      "Unlimited layers",
      "4K export resolution",
      "AI style transfer",
      "10 concurrent collaborations",
      "Cloud storage (10GB)"
    ],
    cta: "Try Free for 14 Days",
    popular: true
  },
  {
    name: "Team",
    description: "For creative studios and teams",
    price: "$24.99",
    period: "per month",
    color: "from-pink-500 to-orange-500",
    features: [
      "Everything in Pro",
      "Team management dashboard",
      "Advanced permissions",
      "Unlimited collaborations",
      "Custom branding options",
      "Cloud storage (100GB)",
      "Priority support"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

// Enhanced featured artwork examples for gallery
const galleryItems = [
  {
    title: "Cosmic Dreamscape",
    creator: "Elena Bright",
    image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    likes: 423,
    views: 1892,
    tags: ["Abstract", "Digital", "AI-Enhanced"],
    gradient: "from-blue-500 via-purple-500 to-pink-500"
  },
  {
    title: "Neon Cityscape",
    creator: "Alex Zhang",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1854&q=80",
    likes: 387,
    views: 1255,
    tags: ["Cyberpunk", "Urban", "Futuristic"],
    gradient: "from-emerald-500 via-teal-500 to-cyan-500"
  },
  {
    title: "Ethereal Bloom",
    creator: "Maya Johnson",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    likes: 512,
    views: 2103,
    tags: ["Floral", "Surreal", "Vibrant"],
    gradient: "from-amber-500 via-orange-500 to-red-500"
  },
  {
    title: "Digital Renaissance",
    creator: "Julian Martinez",
    image: "https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80",
    likes: 463,
    views: 1876,
    tags: ["Portrait", "Classical", "Fusion"],
    gradient: "from-purple-500 via-violet-500 to-indigo-500"
  },
  {
    title: "Ocean Depths",
    creator: "Sasha Rivers",
    image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80", 
    likes: 356,
    views: 1432,
    tags: ["Underwater", "Fantasy", "Ethereal"],
    gradient: "from-blue-500 via-indigo-500 to-violet-500"
  },
  {
    title: "Sacred Geometry",
    creator: "Ibrahim Khan",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80",
    likes: 289,
    views: 1198,
    tags: ["Geometric", "Minimalist", "Symbolic"],
    gradient: "from-green-500 via-emerald-500 to-teal-500"
  }
];

// Curated collections for enhanced gallery experience
const artCollections = [
  {
    title: "AI-Enhanced Masterpieces",
    description: "Where human creativity meets artificial intelligence",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80",
    pieces: 48,
    gradient: "from-purple-600 to-indigo-600"
  },
  {
    title: "Digital Surrealism",
    description: "Exploring the boundaries of imagination in digital form",
    image: "https://images.unsplash.com/photo-1543857778-c4a1a9e0b043?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    pieces: 32,
    gradient: "from-pink-600 to-rose-600"
  },
  {
    title: "Collaborative Wonders",
    description: "Masterpieces created by multiple artists in real-time",
    image: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
    pieces: 64,
    gradient: "from-amber-600 to-orange-600"
  }
];

// Add a new AI art style effect preview component
const ArtStylePreviewEffect = () => {
  const [currentStyle, setCurrentStyle] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const styleOptions = [
    { name: "Neon Dreams", color: "from-purple-500 to-blue-500" },
    { name: "Cyberpunk", color: "from-pink-500 to-orange-500" },
    { name: "Ethereal", color: "from-blue-500 to-emerald-500" },
    { name: "Abstract", color: "from-amber-500 to-red-500" },
    { name: "Geometric", color: "from-indigo-500 to-purple-500" }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isGenerating) {
        setCurrentStyle((prev) => (prev + 1) % styleOptions.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isGenerating, styleOptions.length]);
  
  const handleGenerateClick = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };
  
  return (
    <motion.div 
      className="relative w-full max-w-md mx-auto mt-8 rounded-xl overflow-hidden bg-black/20 backdrop-blur-lg border border-white/10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="inline-block mr-2"
            >
              <Sparkles className="h-5 w-5 text-purple-300" />
            </motion.span>
            AI Style Preview
          </h3>
          <div className="flex space-x-1">
            {styleOptions.map((_, index) => (
              <motion.div 
                key={index}
                className={`h-1.5 w-1.5 rounded-full ${index === currentStyle ? 'bg-purple-400' : 'bg-gray-500/40'}`}
                animate={index === currentStyle ? { 
                  scale: [1, 1.5, 1],
                  backgroundColor: ["rgb(192, 132, 252)", "rgb(216, 180, 254)", "rgb(192, 132, 252)"]
                } : {}}
                transition={{ duration: 2, repeat: index === currentStyle ? Infinity : 0 }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative h-[200px] rounded-lg overflow-hidden mb-3">
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-br ${styleOptions[currentStyle].color} opacity-20`}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isGenerating ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <motion.div 
                className="absolute inset-0"
                animate={{ 
                  rotate: 360,
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-10 h-10 rounded-full border-2 border-t-purple-500 border-purple-300/30"></div>
              </motion.div>
              <div className="text-white text-sm font-medium">Generating...</div>
            </div>
          </motion.div>
          
          <img
            src={`https://images.unsplash.com/photo-${isGenerating ? '1618005182384-a83a8bd57fbe' : '1633177317976-3f9bc45e1d1d'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1064&q=80`}
            className={`w-full h-full object-cover transition-all duration-1000 ${isGenerating ? 'blur-sm scale-110' : ''}`}
            alt="AI Art Preview"
          />
          
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            animate={{ opacity: [0.7, 0.8, 0.7] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <motion.div 
            className="absolute bottom-3 left-3 bg-black/30 backdrop-blur-md rounded-md py-1 px-2 text-xs text-white border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Style: {styleOptions[currentStyle].name}
          </motion.div>
        </div>
        
        <div className="flex space-x-2">
          <motion.button
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md py-2 text-sm font-medium relative overflow-hidden"
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateClick}
            disabled={isGenerating}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0"
              animate={isGenerating ? { 
                opacity: [0, 0.5, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 1.5, repeat: isGenerating ? Infinity : 0 }}
            />
            <span className="relative z-10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 mr-1.5" />
              {isGenerating ? "Processing..." : "Apply Style"}
            </span>
          </motion.button>
          
          <motion.button
            className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Copy className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Add floating elements animation
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 rounded-full bg-purple-500 opacity-30"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight 
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

 

// Add animated gradient overlay
const AnimatedGradientOverlay = () => {
  return (
    <motion.div 
      className="absolute inset-0 bg-gradient-radial from-purple-900/0 via-indigo-800/10 to-pink-800/20 mix-blend-overlay pointer-events-none"
      animate={{
        background: [
          "radial-gradient(circle, rgba(124,58,237,0) 0%, rgba(79,70,229,0.1) 50%, rgba(219,39,119,0.2) 100%)",
          "radial-gradient(circle, rgba(219,39,119,0) 0%, rgba(124,58,237,0.1) 50%, rgba(79,70,229,0.2) 100%)",
          "radial-gradient(circle, rgba(79,70,229,0) 0%, rgba(219,39,119,0.1) 50%, rgba(124,58,237,0.2) 100%)",
        ]
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const { user, signOut, signIn, signUp } = useAuth();
  
  // Page loading animation
  const [pageLoaded, setPageLoaded] = useState(false);
  
  // Enhanced scroll-driven animations
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0.95]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.97]);
  const featuresBgY = useTransform(scrollYProgress, [0.2, 0.4], [0, -50]);
  const testimonialsBgY = useTransform(scrollYProgress, [0.4, 0.6], [0, -50]);
  const pricingBgY = useTransform(scrollYProgress, [0.6, 0.8], [0, -50]);
  
  // Cursor follow effect
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorEnlarged, setCursorEnlarged] = useState(false);
  const [cursorColor, setCursorColor] = useState("rgba(139, 92, 246, 0.5)");
  
  // Collaboration state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  
  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Interactive drawing state
  const [drawPoints, setDrawPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#8b5cf6");
  const [brushSize, setBrushSize] = useState(5);
  
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorSize = useMotionValue(8);
  
  const springConfig = { damping: 25, stiffness: 700 };
  const smoothCursorX = useSpring(cursorX, springConfig);
  const smoothCursorY = useSpring(cursorY, springConfig);
  const smoothCursorSize = useSpring(cursorSize, springConfig);
  
  // Simulate page loading
  useEffect(() => {
    setTimeout(() => {
      setPageLoaded(true);
    }, 1000);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
      
      // Custom cursor effect
      setCursorPos({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    const handleMouseEnter = () => {
      setCursorVisible(true);
    };
    
    const handleMouseLeave = () => {
      setCursorVisible(false);
    };
    
    // Add event listeners for mouse events
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleLinkEnter = (color = "rgba(236, 72, 153, 0.8)") => {
    setCursorEnlarged(true);
    setCursorColor(color);
    cursorSize.set(40);
  };
  
  const handleLinkLeave = () => {
    setCursorEnlarged(false);
    setCursorColor("rgba(139, 92, 246, 0.5)");
    cursorSize.set(8);
  };

  // Canvas drawing 
  const handleCanvasMouseDown = (e) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setIsDrawing(true);
      setDrawPoints([{ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top,
        color: selectedColor,
        size: brushSize
      }]);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (isDrawing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDrawPoints(prev => [
        ...prev, 
        { 
          x: e.clientX - rect.left, 
          y: e.clientY - rect.top,
          color: selectedColor,
          size: brushSize
        }
      ]);
    }
  };
  
  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Color selection
  const handleColorChange = (color) => {
    setSelectedColor(color);
  };
  
  // Brush size adjustment
  const handleBrushSizeChange = (size) => {
    setBrushSize(size);
  };

  // Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { success, error } = await signIn(email, password);
      if (success) {
        toast.success("Login successful!");
        setShowLoginModal(false);
        setEmail("");
        setPassword("");
      } else {
        toast.error(error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (password !== confirmPassword) {
        toast.error("Passwords don't match");
        setIsLoading(false);
        return;
      }
      
      const { success, error } = await signUp(email, password, username, fullName);
      
      if (success) {
        toast.success("Account created successfully!");
        setShowSignupModal(false);
        setEmail("");
        setPassword("");
        setUsername("");
        setFullName("");
        setConfirmPassword("");
        setShowLoginModal(true);
      } else {
        toast.error(error || "Sign up failed. Please try again.");
      }
    } catch (error) {
      toast.error("Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
  };

  // Collaboration functions
  const fetchActiveSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const result = await getActiveCanvasSessions();
      if (result.success) {
        setActiveSessions(result.sessions || []);
      } else {
        toast.error("Failed to load active sessions");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Error loading collaborative sessions");
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleJoinSession = (sessionId) => {
    navigate(`/canvas/${sessionId}`);
  };

  const handleCreateCollaborativeCanvas = async () => {
    try {
      const name = newSessionName.trim() || "ArtFlow Canvas";
      const userId = localStorage.getItem('artflow-user-id') || 'anonymous-' + Math.random().toString(36).substring(2, 9);
      
      const result = await createCollaborativeCanvas(name, userId);
      
      if (result.success && result.canvasId) {
        setShowCreateDialog(false);
        toast.success("Collaborative canvas created!", {
          description: "Share the link with friends to draw together",
          action: {
            label: "Copy Link",
            onClick: () => {
              navigator.clipboard.writeText(result.shareUrl);
              toast.success("Link copied to clipboard!");
            }
          }
        });
        navigate(`/canvas/${result.canvasId}`);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error creating canvas:", error);
      toast.error("Failed to create collaborative canvas", {
        description: error.message
      });
    }
  };

  const handleViewActiveRooms = () => {
    fetchActiveSessions();
    setShowSessionsDialog(true);
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Custom animated cursor */}
      <motion.div 
        className="fixed rounded-full pointer-events-none z-50 mix-blend-screen"
        style={{ 
          x: smoothCursorX,
          y: smoothCursorY,
          width: smoothCursorSize,
          height: smoothCursorSize,
          backgroundColor: "rgba(236, 72, 153, 0.5)",
          transform: "translate(-50%, -50%)"
        }}
        animate={{
          boxShadow: [
            "0 0 15px 2px rgba(236, 72, 153, 0.3)",
            "0 0 20px 5px rgba(236, 72, 153, 0.5)",
            "0 0 15px 2px rgba(236, 72, 153, 0.3)",
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      <FloatingElements />
      <AnimatedGradientOverlay />
      
      {/* Page loading animation */}
      <AnimatePresence>
        {!pageLoaded && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div 
              className="flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="relative w-20 h-20 mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <motion.div 
                  className="absolute inset-0 rounded-full border-t-4 border-purple-500 border-r-4 border-r-transparent border-l-4 border-l-transparent border-b-4 border-b-transparent"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-2 rounded-full border-t-4 border-pink-500 border-r-4 border-r-transparent border-l-4 border-l-transparent border-b-4 border-b-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <motion.div
                className="text-white text-lg font-medium mb-2"
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ArtFlow
              </motion.div>
              <motion.div 
                className="text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Loading your creative canvas...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 30, // Slowed down from 20 to 30 for better performance
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        />
        
        <Canvas3DBackground />
        <ParticleBackground />
        
        {/* Reduced number of rendered elements by mapping only 5 instead of all 7 */}
        {floatingElements.slice(0, 5).map((element, index) => (
          <motion.div
            key={index}
            className={`absolute ${element.color}`}
            style={{
              x: mousePosition.x * (index % 2 ? 1 : -1) * (index % 3 + 1) * 0.4,
              y: mousePosition.y * (index % 3 ? 1 : -1) * (index % 2 + 1) * 0.4,
              filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.15))"
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.4 + 0.6,
              opacity: 0,
              rotate: Math.random() * 30 - 15
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
                Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
              ],
              y: [
                Math.random() * window.innerHeight * 0.8 + window.innerHeight * 0.1,
                Math.random() * window.innerHeight * 0.8 + window.innerHeight * 0.1,
              ],
              rotate: [0, index % 2 ? 360 : -360],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 30 + 30, // Slowed down animations
              repeat: Infinity,
              ease: "linear",
              opacity: { delay: index * 0.2 }
            }}
          >
            {element.icon}
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 20, 
          delay: pageLoaded ? 0.2 : 1.2 
        }}
      >
      <Navbar />
      </motion.div>
      
      {/* Main Content */}
      <main className="relative pt-24">
        {/* Hero Section - Added more top margin for the heading */}
        <motion.section 
          style={{ scale: heroScale }}
          className="flex flex-col items-center justify-center min-h-screen px-6 pt-28 text-center" // Changed pt-20 to pt-28
        >
          <motion.div 
            className="mt-12 mb-6" // Added margin top
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl max-w-5xl"
            >
              <motion.span 
                className="relative inline-block"
                animate={{ 
                  textShadow: [
                    "0 0 20px rgba(139, 92, 246, 0)",
                    "0 0 30px rgba(139, 92, 246, 0.5)",
                    "0 0 20px rgba(139, 92, 246, 0)"
                  ] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Next-Gen
              </motion.span>
              {" "}ArtFlow 
              <motion.span 
                className="relative block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                animate={{ 
                  backgroundPosition: ['0% center', '100% center', '0% center'],
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity,
                  ease: "linear" 
                }}
              >
                Canvas for Creative Minds
                {/* New decorative highlight element */}
                <motion.div 
                  className="absolute -bottom-1 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                  animate={{ 
                    opacity: [0.3, 0.8, 0.3],
                    width: ["40%", "50%", "40%"],
                    left: ["30%", "25%", "30%"]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
              </motion.span>
            </motion.h1>
            
            {/* Added glowing dots decoration */}
            <div className="relative h-6 mt-4">
              <motion.div
                className="absolute left-1/2 -translate-x-[60px] top-0 h-2 w-2 rounded-full bg-purple-500"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  delay: 0
                }}
              />
              <motion.div
                className="absolute left-1/2 -translate-x-[30px] top-0 h-2 w-2 rounded-full bg-pink-500"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  delay: 0.5
                }}
              />
              <motion.div
                className="absolute left-1/2 top-0 h-2 w-2 rounded-full bg-fuchsia-500"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  delay: 1
                }}
              />
              <motion.div
                className="absolute left-1/2 translate-x-[30px] top-0 h-2 w-2 rounded-full bg-indigo-500"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  delay: 1.5
                }}
              />
              <motion.div
                className="absolute left-1/2 translate-x-[60px] top-0 h-2 w-2 rounded-full bg-blue-500"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  delay: 2
                }}
              />
            </div>
          </motion.div>
          
          <motion.p
            className="max-w-2xl mt-6 text-lg md:text-xl text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Create, collaborate, and share your digital art in real-time.
            Our <span className="text-purple-300 font-medium">AI-powered tools</span> make creative expression effortless and delightful.
          </motion.p>
          
          {/* Added animated stats */}
       
          
          <motion.div
            className="flex flex-wrap justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              size="lg" 
              className="gap-2 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 relative overflow-hidden group"
              onClick={() => navigate("/canvas/new")}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-700 group-hover:to-pink-700 transition-all duration-300 transform group-hover:scale-105 opacity-0 group-hover:opacity-100"></span>
              <span className="relative flex items-center">
                <motion.span
                  animate={{ rotate: [0, 15, 0, -15, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    repeatDelay: 3
                  }}
                >
                  <Brush className="w-5 h-5 mr-2" />
                </motion.span>
                Create Canvas
              </span>
              
              {/* Sparkle effect */}
              <motion.span 
                className="absolute top-0 right-0 -mt-1 -mr-1"
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                  rotate: 15
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 5
                }}
              >
                <Sparkles className="w-4 h-4 text-yellow-200" />
              </motion.span>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2 text-lg border-purple-500/50 text-purple-300 shadow-lg shadow-purple-900/10 backdrop-blur-sm hover:bg-purple-500/10"
              onClick={handleViewActiveRooms}
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Users className="w-5 h-5" />
              </motion.span>
              Join Session
            </Button>
          </motion.div>
          
          {/* Added badge */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
          >
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-500/30 py-1 text-xs">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
              </motion.span>
              Hackathon Award Winner for Most Innovative Collaboration Tool
            </Badge>
          </motion.div>
          
          {/* Add the new AI style preview component */}
          <ArtStylePreviewEffect />
          
          <motion.div
            className="relative w-full max-w-4xl mt-16 overflow-hidden rounded-lg shadow-2xl h-80 bg-black/30 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            ref={canvasRef}
            whileHover={{ boxShadow: "0 20px 40px -15px rgba(124, 58, 237, 0.3)" }}
            whileInView={{ 
              scale: [0.98, 1],
              opacity: [0.8, 1]
            }}
            viewport={{ once: true }}
          >
            {/* Added decorative corner elements */}
            <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
              <motion.div 
                className="absolute top-0 left-0 w-px h-10 bg-gradient-to-b from-transparent via-purple-500 to-transparent" 
                animate={{ height: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="absolute top-0 left-0 h-px w-10 bg-gradient-to-r from-transparent via-purple-500 to-transparent" 
                animate={{ width: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
              <motion.div 
                className="absolute top-0 right-0 w-px h-10 bg-gradient-to-b from-transparent via-pink-500 to-transparent" 
                animate={{ height: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div 
                className="absolute top-0 right-0 h-px w-10 bg-gradient-to-l from-transparent via-pink-500 to-transparent" 
                animate={{ width: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none">
              <motion.div 
                className="absolute bottom-0 left-0 w-px h-10 bg-gradient-to-t from-transparent via-indigo-500 to-transparent" 
                animate={{ height: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 h-px w-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" 
                animate={{ width: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
              <motion.div 
                className="absolute bottom-0 right-0 w-px h-10 bg-gradient-to-t from-transparent via-fuchsia-500 to-transparent" 
                animate={{ height: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 h-px w-10 bg-gradient-to-l from-transparent via-fuchsia-500 to-transparent" 
                animate={{ width: [10, 20, 10], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
            
            <InteractiveCanvas 
              width={canvasRef.current?.clientWidth || 1000} 
              height={canvasRef.current?.clientHeight || 400} 
              points={drawPoints} 
            />
            
            {/* Canvas Controls */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
              <div className="flex items-center space-x-4">
                {['#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6'].map(color => (
                  <motion.button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-white scale-110' : 'ring-1 ring-white/30'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                  />
                ))}
                
                <div className="h-6 w-px bg-gray-500/50 mx-2"></div>
                
                {[3, 5, 8, 12].map(size => (
                  <motion.button
                    key={size}
                    className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/10 transition-transform ${brushSize === size ? 'ring-2 ring-white scale-110' : ''}`}
                    onClick={() => handleBrushSizeChange(size)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div 
                      className="rounded-full bg-white" 
                      style={{ width: size, height: size }}
                    ></div>
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="absolute top-4 right-4">
              <motion.div
                className="px-4 py-2 text-sm rounded-full cursor-pointer bg-white/10 backdrop-blur-sm border border-white/20"
                animate={{ 
                  y: [0, -10, 0],
                  boxShadow: [
                    "0 0 0 rgba(139, 92, 246, 0)",
                    "0 0 8px rgba(139, 92, 246, 0.5)",
                    "0 0 0 rgba(139, 92, 246, 0)"
                  ]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                Try drawing here!
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div
            className="w-full max-w-3xl mx-auto mt-28 mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center justify-center mb-6">
              <motion.h2 
                className="text-2xl font-bold text-white"
                animate={{ 
                  scale: [1, 1.03, 1],
                  color: ["rgb(255, 255, 255)", "rgb(233, 213, 255)", "rgb(255, 255, 255)"]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                What our users say
              </motion.h2>
              <motion.div 
                className="ml-2 flex"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -5, scale: 1.02, boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.3)" }}
                >
                  {/* Added decorative elements */}
                  <motion.div 
                    className="absolute -right-3 -top-3 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10"
                    style={{ filter: "blur(20px)" }}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="w-12 h-12 rounded-full mr-4 border-2 border-purple-400/30"
                    />
                    <div>
                      <h3 className="font-medium text-white">{testimonial.name}</h3>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                      <div className="flex mt-1">
                        {Array(5).fill(0).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300">{testimonial.content}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Features Section with staggered animations */}
        <section className="py-24 relative">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black/50"
            style={{ y: featuresBgY }}
          />
          
          {/* Added animated pattern background */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <svg className="absolute w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" />
                </pattern>
                <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(139, 92, 246, 0.1)" />
                  <stop offset="50%" stopColor="rgba(236, 72, 153, 0.1)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
                </linearGradient>
                <mask id="grid-mask">
                  <rect width="100%" height="100%" fill="url(#grid-gradient)" />
                </mask>
              </defs>
              <motion.rect 
                width="200%" 
                height="200%" 
                fill="url(#grid-pattern)" 
                mask="url(#grid-mask)"
                animate={{ 
                  x: [0, -400],
                  y: [0, -400]
                }}
                transition={{ 
                  duration: 60, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </svg>
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Badge 
                className="mb-4 py-1.5 px-4 bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                <motion.span
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1.5 inline-block" />
                </motion.span>
                Powerful Features
              </Badge>
              <motion.h2 
                className="text-4xl font-bold text-white mb-4"
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(139, 92, 246, 0)", 
                    "0 0 10px rgba(139, 92, 246, 0.5)", 
                    "0 0 0px rgba(139, 92, 246, 0)"
                  ] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Everything You Need to{" "}
                <span className="relative inline-block">
                  Create
                  <motion.div 
                    className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"
                    animate={{ 
                      scaleX: [0.7, 1, 0.7],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </span>
              </motion.h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                From simple sketches to complex compositions, our tools empower your creative journey.
              </p>
              
              {/* Added feature navigation */}
              <div className="flex justify-center mt-8 space-x-2">
                {features.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full ${activeFeature === index ? 'bg-purple-500' : 'bg-gray-500/50'}`}
                    onClick={() => setActiveFeature(index)}
                    whileHover={{ scale: 1.5 }}
                    whileTap={{ scale: 0.9 }}
                    animate={activeFeature === index ? { 
                      scale: [1, 1.3, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(139, 92, 246, 0)",
                        "0 0 0 3px rgba(139, 92, 246, 0.3)",
                        "0 0 0 0 rgba(139, 92, 246, 0)"
                      ]
                    } : {}}
                    transition={{ duration: 1.5, repeat: activeFeature === index ? Infinity : 0 }}
                  />
                ))}
              </div>
            </motion.div>
            
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="relative overflow-hidden group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 60,
                      damping: 20,
                      delay: index * 0.1
                    }
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                    <motion.div 
                    className={`p-8 rounded-xl bg-gradient-to-b ${feature.gradientBg} backdrop-blur-sm border border-white/10 h-full flex flex-col hover:border-white/20 transition-all duration-300 relative overflow-hidden`}
                    animate={activeFeature === index ? { 
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.4)"
                    } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Animated background effect */}
                    <motion.div 
                      className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ 
                        background: `linear-gradient(45deg, ${feature.color.replace('from-', '').replace('to-', '')})`,
                        filter: "blur(50px)",
                        zIndex: -1
                      }}
                      animate={activeFeature === index ? { opacity: 0.3 } : {}}
                    />
                    
                    <motion.div 
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 bg-gradient-to-r ${feature.color} relative`}
                      whileHover={{ 
                        rotate: 5,
                        scale: 1.1,
                        boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)"
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ 
                          background: `linear-gradient(45deg, ${feature.color.replace('from-', '').replace('to-', '')})`,
                          filter: "blur(8px)",
                          zIndex: -1
                        }}
                        animate={activeFeature === index ? { opacity: [0, 0.7, 0] } : {}}
                        transition={{ duration: 2, repeat: activeFeature === index ? Infinity : 0 }}
                      />
                      <motion.div
                        animate={activeFeature === index ? { 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0, -5, 0]
                        } : {}}
                        transition={{ duration: 3, repeat: activeFeature === index ? Infinity : 0 }}
                    >
                      {feature.icon}
                      </motion.div>
                    </motion.div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-300 mb-4 flex-grow">{feature.description}</p>
                    
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg py-2 px-3 text-sm text-purple-300">
                      <motion.span
                        animate={{ 
                          scale: [1, 1.2, 1],
                        }}
                        transition={{ duration: 1, delay: index * 0.5, repeat: Infinity, repeatDelay: 5 }}
                        className="inline-flex items-center"
                      >
                        <Check className="w-4 h-4 inline-block mr-1.5" />
                      </motion.span>
                      {feature.highlightText}
                    </div>
                    
                    {/* Animated corner accent */}
                    <motion.div 
                      className="absolute -bottom-1 -right-1 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={activeFeature === index ? { opacity: 1 } : {}}
                    >
                      <motion.div 
                        className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-transparent via-purple-500 to-transparent" 
                        animate={{ height: [8, 16, 8], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div 
                        className="absolute bottom-0 right-0 h-px w-8 bg-gradient-to-l from-transparent via-purple-500 to-transparent" 
                        animate={{ width: [8, 16, 8], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="absolute -top-1 -left-1 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={activeFeature === index ? { opacity: 1 } : {}}
                    >
                      <motion.div 
                        className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-transparent via-pink-500 to-transparent" 
                        animate={{ height: [8, 16, 8], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div 
                        className="absolute top-0 left-0 h-px w-8 bg-gradient-to-r from-transparent via-pink-500 to-transparent" 
                        animate={{ width: [8, 16, 8], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      animate={{
                        left: ["0%", "100%", "0%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
            
            {/* Added "Explore All Features" button */}
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Button 
                variant="outline" 
                className="gap-2 text-white border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Plus className="h-4 w-4" />
                </motion.span>
                Explore All Features
              </Button>
            </motion.div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-pink-900/80 opacity-30" />
          <motion.div 
            className="absolute inset-0" 
            style={{ 
              backgroundImage: "radial-gradient(circle at center, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
              backgroundSize: '150% 150%',
              backgroundPosition: 'center',
            }}
            animate={{
              backgroundSize: ['120% 120%', '170% 170%', '120% 120%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="container relative z-10 px-6 mx-auto">
            <motion.div 
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Badge 
                className="mb-4 py-1.5 px-4 bg-white/10 text-white/90 border-white/20 hover:bg-white/20 transition-colors"
              >
                Start Your Creative Journey
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Unleash Your Creativity?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the ArtFlow community today and experience the future of collaborative digital art.
              </p>
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                whileInView={{ opacity: [0, 1], y: [20, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                {user ? (
                  <Button 
                    size="lg" 
                    className="gap-2 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 group relative overflow-hidden"
                    onClick={() => navigate("/canvas/new")}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-700 group-hover:to-pink-700 transition-all duration-300 transform group-hover:scale-105 opacity-0 group-hover:opacity-100"></span>
                    <span className="relative flex items-center">
                      <motion.span
                        animate={{ rotate: [0, 15, 0, -15, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Brush className="w-5 h-5 mr-2" />
                      </motion.span>
                      Start Creating Now
                    </span>
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="gap-2 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 group relative overflow-hidden"
                    onClick={() => setShowSignupModal(true)}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-700 group-hover:to-pink-700 transition-all duration-300 transform group-hover:scale-105 opacity-0 group-hover:opacity-100"></span>
                    <span className="relative flex items-center">
                      <motion.span
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 5, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity, repeatDelay: 1 }
                        }}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                      </motion.span>
                      Sign Up Free
                    </span>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2 text-lg border-white/20 text-white hover:bg-white/10 transition-colors duration-300"
                  onClick={() => navigate("/gallery")}
                >
                  <Image className="w-5 h-5 mr-2" />
                  View Gallery
                </Button>
              </motion.div>
              
              <motion.div 
                className="mt-8 p-4 rounded-xl bg-white/5 backdrop-blur-sm inline-block"
                whileInView={{ opacity: [0, 1], y: [20, 0] }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  transition: { duration: 0.2 }
                }}
              >
                <p className="text-sm text-gray-300 flex items-center">
                  <motion.span 
                    className="text-green-400 mr-2"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
                  >✓</motion.span> No credit card required &nbsp;•&nbsp;
                  <motion.span 
                    className="text-green-400 mr-2"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, delay: 0.3, repeat: Infinity, repeatDelay: 5 }}
                  >✓</motion.span> Free tier forever &nbsp;•&nbsp;
                  <motion.span 
                    className="text-green-400 mr-2"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, delay: 0.6, repeat: Infinity, repeatDelay: 5 }}
                  >✓</motion.span> Cancel anytime
                </p>
              </motion.div>
              
              {/* Added counter for psychological trigger - limited time offer */}
              <motion.div 
                className="mt-6 text-sm text-purple-300 inline-flex items-center bg-purple-900/30 px-4 py-2 rounded-full border border-purple-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <motion.div 
                  className="w-2 h-2 rounded-full bg-purple-400 mr-2"
                  animate={{ 
                    opacity: [1, 0.3, 1],
                    scale: [1, 0.8, 1]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                Limited time offer: Free premium features for early adopters
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Enhanced Gallery Section */}
        <section className="py-32 relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-black/80 via-purple-900/30 to-black/80"
            style={{ 
              opacity: 0.9,
              backgroundImage: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.2) 0%, rgba(0, 0, 0, 0) 50%)",
            }}
            animate={{
              background: [
                "radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.2) 0%, rgba(0, 0, 0, 0) 50%)",
                "radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.2) 0%, rgba(0, 0, 0, 0) 50%)",
                "radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.2) 0%, rgba(0, 0, 0, 0) 50%)"
              ]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="container relative z-10 px-6 mx-auto">
            <motion.div 
              className="max-w-4xl mx-auto text-center mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Badge 
                className="mb-4 py-1.5 px-4 bg-white/10 text-white/90 border-white/20 hover:bg-white/20 transition-colors"
              >
                Featured Artworks
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="relative inline-block">
                  Discover 
                  <motion.span 
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400"
                    animate={{ 
                      width: ["0%", "100%"],
                      left: ["50%", "0%"],
                      opacity: [0, 1]
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </span>
                {" "}Extraordinary{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Creations</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Explore mind-bending masterpieces from our global community of digital artists pushing the boundaries of creativity.
              </p>
            </motion.div>
            
            {/* Featured Artworks Carousel */}
            <div className="mb-20">
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                viewport={{ once: true }}
              >
                {galleryItems.map((item, index) => (
                  <motion.div 
                    key={index}
                    className="group relative overflow-hidden rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity group-hover:opacity-90" />
                      
                      {/* Animated glow effect */}
                      <motion.div 
                        className={`absolute inset-0 opacity-0 group-hover:opacity-40 bg-gradient-to-r ${item.gradient}`}
                        style={{ filter: "blur(30px)" }}
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 0.4 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          viewport={{ once: true }}
                        >
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.tags.map((tag, tagIndex) => (
                              <span 
                                key={tagIndex} 
                                className="text-xs px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/90"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{item.title}</h3>
                          <p className="text-sm text-gray-300 mb-3">by {item.creator}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center text-xs text-gray-300">
                                <Heart className="w-3 h-3 mr-1 text-red-400" />
                                {item.likes}
                              </span>
                              <span className="flex items-center text-xs text-gray-300">
                                <svg className="w-3 h-3 mr-1 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12Z" stroke="currentColor" strokeWidth="2" />
                                  <path d="M13 9H15V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 9L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M7 9H9V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M9 9L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {item.views}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Interactive hover elements */}
                    <motion.div 
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Collections Showcase */}
            <motion.div 
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-white mb-8 text-center">Curated <span className="text-purple-400">Collections</span></h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {artCollections.map((collection, index) => (
                  <motion.div
                    key={index}
                    className="relative overflow-hidden rounded-xl group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="aspect-[3/2] overflow-hidden rounded-xl">
                      <img 
                        src={collection.image} 
                        alt={collection.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${collection.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <Badge className="mb-2 self-start bg-white/20 backdrop-blur-md text-white border-0">
                          {collection.pieces} Artworks
                        </Badge>
                        <h3 className="text-xl font-bold text-white mb-1">{collection.title}</h3>
                        <p className="text-sm text-white/80">{collection.description}</p>
                      </div>
                      
                      {/* Interactive elements */}
                      <motion.div 
                        className="absolute inset-0 border-2 border-white/0 rounded-xl group-hover:border-white/20 transition-all duration-300"
                        whileHover={{ borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" }}
                      />
                      
                      <motion.div
                        className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ scale: 1.1 }}
                      >
                        <ArrowRight className="h-4 w-4 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Call to action */}
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Button 
                size="lg" 
                className="gap-2 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 relative overflow-hidden group"
                onClick={() => navigate("/gallery")}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-700 group-hover:to-pink-700 transition-all duration-300 transform group-hover:scale-105 opacity-0 group-hover:opacity-100"></span>
                <span className="relative flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Explore Full Gallery
                </span>
              </Button>
              
              <motion.p 
                className="mt-4 text-gray-400 text-sm"
                animate={{ 
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                New artworks added every day
              </motion.p>
            </motion.div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 bg-black/50 backdrop-blur-sm border-t border-white/10">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <motion.div 
                className="flex items-center mb-6 md:mb-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                onMouseEnter={() => handleLinkEnter("rgba(192, 132, 252, 0.5)")}
                onMouseLeave={handleLinkLeave}
              >
                <img 
                  src="https://i.ibb.co/GGSk8sY/Chat-GPT-Image-Apr-9-2025-03-24-36-PM-removebg-preview.png" 
                  alt="ArtFlow Logo" 
                  className="w-8 h-8 object-contain mr-2"
                />
                <h3 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">ArtFlow</h3>
              </motion.div>
              
              <div className="flex space-x-8">
                <motion.a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => handleLinkEnter()}
                  onMouseLeave={handleLinkLeave}
                >
                  Features
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => handleLinkEnter()}
                  onMouseLeave={handleLinkLeave}
                >
                  Gallery
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => handleLinkEnter()}
                  onMouseLeave={handleLinkLeave}
                >
                  Contact
                </motion.a>
              </div>
              
              <motion.div 
                className="mt-6 md:mt-0"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <p className="text-gray-500">© 2025 ArtFlow. All rights reserved.</p>
              </motion.div>
            </div>
          </div>
        </footer>
      </main>

      {/* Create Collaborative Canvas Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md bg-gray-950/90 backdrop-blur-xl border border-purple-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Create Artflow Canvas</DialogTitle>
            <DialogDescription className="text-center">
              Start a new collaborative drawing session that others can join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid items-center grid-cols-4 gap-4">
              <Label htmlFor="session-name" className="text-right text-white">
                Name
              </Label>
              <Input
                id="session-name"
                placeholder="My Awesome Drawing"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="col-span-3 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateCollaborativeCanvas}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Create & Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Sessions Dialog */}
      <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
        <DialogContent className="sm:max-w-md bg-gray-950/90 backdrop-blur-xl border border-purple-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Active Collaborative Sessions</DialogTitle>
            <DialogDescription className="text-center">
              Join an existing drawing session to collaborate with others.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-t-purple-500 border-purple-200 rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-300">Loading sessions...</span>
              </div>
            ) : activeSessions.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {activeSessions.map((session) => (
                  <motion.div 
                    key={session.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 cursor-pointer border border-purple-500/20 hover:border-purple-500/50 transition-colors"
                    onClick={() => handleJoinSession(session.id)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <div className="font-medium text-white">{session.name || "Untitled Canvas"}</div>
                      <div className="text-xs text-gray-400">
                        Created {new Date(session.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2 gap-1 text-purple-300 hover:bg-purple-500/20 hover:text-white">
                      <ArrowRight className="w-4 h-4" />
                      Join
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-400">No active sessions found.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    setShowSessionsDialog(false);
                    setShowCreateDialog(true);
                  }}
                >
                  Create a New Session
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSessionsDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => fetchActiveSessions()}
              disabled={isLoadingSessions}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Modals */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-black/70 backdrop-blur-xl border border-purple-500/20">
          <DialogHeader>
            <div className="flex justify-center mb-6">
              <img 
                src="https://i.ibb.co/GGSk8sY/Chat-GPT-Image-Apr-9-2025-03-24-36-PM-removebg-preview.png" 
                alt="ArtFlow Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Welcome Back</DialogTitle>
            <DialogDescription className="text-center">
              Sign in to your account to access your artworks and collaborations.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white">Password</Label>
                <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-t-white/30 border-r-white/30 border-white animate-spin mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-background text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="bg-white/5" type="button">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
                </svg>
                GitHub
              </Button>
              <Button variant="outline" className="bg-white/5" type="button">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                Google
              </Button>
            </div>
          </form>
          
          <div className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <button
              className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
              onClick={() => {
                setShowLoginModal(false);
                setShowSignupModal(true);
              }}
            >
              Sign Up
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-md bg-black/70 backdrop-blur-xl border border-purple-500/20">
          <DialogHeader>
            <div className="flex justify-center mb-6">
              <img 
                src="https://i.ibb.co/GGSk8sY/Chat-GPT-Image-Apr-9-2025-03-24-36-PM-removebg-preview.png" 
                alt="ArtFlow Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Join ArtFlow</DialogTitle>
            <DialogDescription className="text-center">
              Create an account to start your creative journey.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSignup} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="coolartist"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-white">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 rounded border-gray-500 text-purple-600 focus:ring-purple-500"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                I agree to the <a href="#" className="text-purple-400 hover:underline">Terms of Service</a> and <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-t-white/30 border-r-white/30 border-white animate-spin mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-background text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="bg-white/5" type="button">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
                </svg>
                GitHub
              </Button>
              <Button variant="outline" className="bg-white/5" type="button">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                Google
              </Button>
            </div>
          </form>
          
          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button
              className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
              onClick={() => {
                setShowSignupModal(false);
                setShowLoginModal(true);
              }}
            >
              Log In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
