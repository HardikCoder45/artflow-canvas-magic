import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ArrowRight, Brush, Users, Sparkles, Palette, Image, Share2, Star, Heart, Zap, Code, Layers, Wand2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Interactive particle backgrounds
const ParticleBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white opacity-70"
          style={{
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
            ],
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
            ],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Interactive color wave canvas
const InteractiveCanvas = ({ width, height, points }) => {
  const canvasRef = useRef(null);

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

const floatingElements = [
  { icon: <Brush className="w-6 h-6" />, color: "text-purple-400" },
  { icon: <Palette className="w-6 h-6" />, color: "text-pink-400" },
  { icon: <Star className="w-6 h-6" />, color: "text-yellow-400" },
  { icon: <Heart className="w-6 h-6" />, color: "text-red-400" },
  { icon: <Zap className="w-6 h-6" />, color: "text-blue-400" },
  { icon: <Code className="w-6 h-6" />, color: "text-green-400" },
  { icon: <Layers className="w-6 h-6" />, color: "text-indigo-400" },
  { icon: <Wand2 className="w-6 h-6" />, color: "text-cyan-400" },
];

const features = [
  { title: "Collaborative Drawing", icon: <Users />, description: "Create together in real-time with friends and colleagues" },
  { title: "Advanced Tools", icon: <Brush />, description: "Professional-grade drawing tools and effects" },
  { title: "AI Enhancements", icon: <Sparkles />, description: "Smart suggestions and style transfers" },
  { title: "Layer Management", icon: <Layers />, description: "Powerful layer controls for complex compositions" },
  { title: "Export & Share", icon: <Share2 />, description: "Export in multiple formats and share instantly" },
];

const Index = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  // Auth modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  // Scroll-based transformations
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0.8]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const featuresBgY = useTransform(scrollYProgress, [0.3, 0.6], [0, -100]);
  
  // Interactive drawing state
  const [drawPoints, setDrawPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const handleCreateCanvas = useCallback(() => {
    setIsCreating(true);
    setTimeout(() => {
      const newRoomId = uuidv4();
      navigate(`/canvas/${newRoomId}`);
    }, 800);
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Implement login logic
    toast.success("Login successful!");
    setShowLoginModal(false);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    // Implement signup logic
    toast.success("Account created successfully!");
    setShowSignupModal(false);
  };
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Canvas drawing simulation
  const handleCanvasMouseDown = (e) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setIsDrawing(true);
      setDrawPoints([{ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top,
        color: `hsl(${Math.random() * 60 + 260}, 80%, 70%)`,
        size: Math.random() * 5 + 3
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
          color: `hsl(${Math.random() * 60 + 260}, 80%, 70%)`,
          size: Math.random() * 5 + 3
        }
      ]);
    }
  };
  
  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        />
        
        <ParticleBackground />
        
        {floatingElements.map((element, index) => (
          <motion.div
            key={index}
            className={`absolute ${element.color}`}
            style={{
              x: mousePosition.x * (index % 2 ? 1 : -1),
              y: mousePosition.y * (index % 3 ? 1 : -1)
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0.1,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: Math.random() * 360,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.3 + 0.1,
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            {element.icon}
          </motion.div>
        ))}
      </div>
      
      <div className="relative z-10">
        {/* Sleek Header */}
        <motion.header 
          className="container mx-auto px-4 py-6"
          style={{ opacity: headerOpacity }}
        >
          <nav className="flex justify-between items-center backdrop-blur-md bg-black/20 rounded-xl px-4 py-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <img 
                src="https://i.ibb.co/GGSk8sY/Chat-GPT-Image-Apr-9-2025-03-24-36-PM-removebg-preview.png" 
                alt="ArtFlow Canvas" 
                className="w-10 h-10"
              />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                ArtFlow Canvas
              </h1>
            </motion.div>
            
            <motion.div 
              className="flex gap-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button variant="ghost" className="text-white hover:text-purple-400 hover:bg-white/5">
                About
              </Button>
              <Button variant="ghost" className="text-white hover:text-purple-400 hover:bg-white/5">
                Gallery
              </Button>
              <Button 
                variant="outline" 
                className="hidden sm:flex border-purple-400 text-purple-400 hover:bg-purple-400/10 hover:text-white"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => setShowSignupModal(true)}
              >
                Sign Up
              </Button>
            </motion.div>
          </nav>
        </motion.header>
        
        {/* Hero Section with Enhanced Animations */}
        <section className="container mx-auto px-4 py-16 lg:py-28">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            style={{ scale: heroScale }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge variant="outline" className="mb-4 px-3 py-1 backdrop-blur-sm bg-white/5 border-white/10">
                  <span className="mr-1 text-green-400">●</span> Now in Beta
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-200 to-purple-400"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear"
                }}
              >
                Unleash Your Creativity with ArtFlow Canvas
              </motion.h1>
              
              <motion.p 
                className="text-lg lg:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                A powerful digital canvas built for artists and creators. Draw, paint, sketch, and collaborate in real-time with intuitive tools and AI-powered features.
              </motion.p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button 
                    size="lg" 
                    onClick={handleCreateCanvas}
                    disabled={isCreating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 shadow-lg hover:shadow-purple-500/30"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                        Creating Canvas...
                      </>
                    ) : (
                      <>
                        Start Drawing <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button variant="outline" size="lg" className="backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-purple-300">
                    View Gallery
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Interactive Drawing Canvas */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-16 lg:mt-28 relative"
              whileHover={{ scale: 1.01 }}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30"></div>
              <div 
                ref={canvasRef}
                className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/30 backdrop-blur-sm"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                <div className="h-[400px] sm:h-[500px] relative cursor-crosshair">
                  {/* Interactive Drawing Preview */}
                  <InteractiveCanvas width={800} height={500} points={drawPoints} />
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Brush size={64} className="mx-auto mb-4 text-purple-400" />
                      </motion.div>
                      <p className="text-gray-300">Try drawing here or click "Start Drawing" to create your canvas</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
        
        {/* Features Section */}
        <motion.section 
          className="container mx-auto px-4 py-20 relative"
          style={{ y: featuresBgY }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              Powerful Features for Modern Artists
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              ArtFlow combines intuitive design with cutting-edge technology to provide the ultimate digital art experience.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm hover:from-purple-900/30 hover:to-pink-900/30 transition-all duration-300 group">
                  <CardContent className="p-6 relative">
                    <motion.div 
                      className="mb-4 p-3 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 inline-block group-hover:from-purple-500/20 group-hover:to-pink-500/20"
                      whileHover={{ scale: 1.1 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
        
        {/* Animated CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-800/60 to-pink-800/60 backdrop-blur-md">
              <motion.div 
                className="absolute inset-0 opacity-20"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear"
                }}
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            
            <div className="relative p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Create Your Masterpiece?
              </h2>
              
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                Join thousands of artists who have discovered the power and flexibility of ArtFlow Canvas for their digital art projects.
              </p>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleCreateCanvas}
                  size="lg"
                  className="bg-white text-purple-900 hover:bg-white/90 px-8 py-6 text-lg shadow-lg hover:shadow-white/20"
                >
                  Create Your Canvas Now <ArrowRight size={20} className="ml-2" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </section>
        
        {/* Sleek Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img 
                src="https://i.ibb.co/GGSk8sY/Chat-GPT-Image-Apr-9-2025-03-24-36-PM-removebg-preview.png" 
                alt="ArtFlow Canvas" 
                className="w-6 h-6"
              />
              <span className="font-bold">ArtFlow Canvas</span>
            </div>
            
            <div className="flex gap-6">
              <motion.a 
                href="#" 
                className="text-sm text-gray-400 hover:text-white"
                whileHover={{ y: -2 }}
              >
                Terms
              </motion.a>
              <motion.a 
                href="#" 
                className="text-sm text-gray-400 hover:text-white"
                whileHover={{ y: -2 }}
              >
                Privacy
              </motion.a>
              <motion.a 
                href="#" 
                className="text-sm text-gray-400 hover:text-white"
                whileHover={{ y: -2 }}
              >
                Contact
              </motion.a>
            </div>
            
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              © {new Date().getFullYear()} ArtFlow Canvas. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900 to-purple-900 text-white border-purple-500">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Login to ArtFlow Canvas</DialogTitle>
            <DialogDescription className="text-gray-300 text-center">
              Enter your credentials to access your account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                className="bg-gray-800 border-gray-700 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-gray-800 border-gray-700 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-purple-400 text-purple-400"
                onClick={() => {
                  setShowLoginModal(false);
                  setShowSignupModal(true);
                }}
              >
                Register instead
              </Button>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Login
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900 to-purple-900 text-white border-purple-500">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Create your account</DialogTitle>
            <DialogDescription className="text-gray-300 text-center">
              Join ArtFlow Canvas to start creating
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="artistname"
                className="bg-gray-800 border-gray-700 text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your.email@example.com"
                className="bg-gray-800 border-gray-700 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                className="bg-gray-800 border-gray-700 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-purple-400 text-purple-400"
                onClick={() => {
                  setShowSignupModal(false);
                  setShowLoginModal(true);
                }}
              >
                Login instead
              </Button>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
