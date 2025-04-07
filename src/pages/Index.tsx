
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ArtCanvas from "@/components/ArtCanvas";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Brush, 
  Github, 
  Heart, 
  PaintBucket, 
  Palette, 
  Sparkles, 
  ArrowDown, 
  Layers as LayersIcon,
  Download,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import HeroBackground from "@/components/HeroBackground";
import FeatureCard from "@/components/FeatureCard";
import { ParallaxProvider } from "@/components/ParallaxProvider";
import { useMotionValue, useTransform, useScroll, useInView } from "framer-motion";

const Index = () => {
  const [showFullCanvas, setShowFullCanvas] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { toast } = useToast();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  const handleGetStarted = () => {
    setShowFullCanvas(true);
    toast({
      title: "Canvas Activated!",
      description: "You're now in creative mode. Start drawing your masterpiece!",
    });
  };
  
  const features = [
    {
      icon: Brush,
      title: "Dynamic Brushes",
      description: "Express yourself with diverse brush styles from watercolor to chalk, with realistic pressure simulation",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: LayersIcon,
      title: "Advanced Layers",
      description: "Work with multiple layers for complex compositions with blending modes and opacity controls",
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Effects",
      description: "Transform your sketches into stunning artwork with our AI style transfer and enhancement tools",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: PaintBucket,
      title: "Smart Fill",
      description: "Intelligent fill that detects boundaries and applies gradients or patterns with a single click",
      color: "from-emerald-500 to-green-500"
    }
  ];
  
  // Auto-rotate featured items
  useEffect(() => {
    if (showFullCanvas) return;
    
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [showFullCanvas, features.length]);

  return (
    <ParallaxProvider>
      <div className="min-h-screen flex flex-col overflow-x-hidden bg-gradient-to-b from-artflow-dark-purple via-[#201f35] to-[#0f0d19]">
        {/* Navigation */}
        <header className="w-full py-4 px-6 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/10 z-50 fixed top-0 left-0 right-0">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Palette className="h-8 w-8 text-artflow-purple" />
            <h1 className="text-2xl font-bold text-white">
              <span className="text-artflow-purple">Art</span>Flow
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/gallery" className={navigationMenuTriggerStyle()}>
                    Gallery
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/about" className={navigationMenuTriggerStyle()}>
                    About
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button onClick={handleGetStarted} className="bg-artflow-purple hover:bg-artflow-deep-purple text-white">
              Get Started
            </Button>
          </motion.div>
        </header>
        
        <AnimatePresence mode="wait">
          {!showFullCanvas ? (
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 pt-20"
            >
              {/* Hero Section with Dynamic Background */}
              <motion.section 
                className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
                style={{ opacity, scale }}
              >
                <HeroBackground />
                
                <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <motion.div 
                    className="md:w-1/2 space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.7 }}
                  >
                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                      Unleash Your <span className="text-gradient bg-gradient-to-br from-artflow-purple to-blue-400">Creative</span> <span className="text-gradient bg-gradient-to-br from-pink-400 to-red-500">Potential</span>
                    </h1>
                    <p className="text-gray-300 mt-4 text-lg md:text-xl max-w-lg">
                      ArtFlow Canvas provides powerful digital drawing tools with intuitive controls, 
                      dynamic brushes, and AI-powered effects to elevate your artistic vision.
                    </p>
                    
                    <motion.div 
                      className="flex flex-col sm:flex-row gap-4 pt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.7 }}
                    >
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="bg-gradient-to-r from-artflow-purple to-blue-500 hover:from-artflow-deep-purple hover:to-blue-600 text-white border-0 shadow-lg shadow-artflow-purple/20"
                      >
                        <Brush className="mr-2 h-5 w-5" />
                        Start Creating
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="border-artflow-purple text-artflow-purple hover:bg-artflow-purple/10 shadow-lg shadow-artflow-purple/10"
                      >
                        <Link to="/gallery">
                          View Gallery
                        </Link>
                      </Button>
                    </motion.div>
                  </motion.div>
                  
                  <motion.div 
                    className="md:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 mt-10 md:mt-0"
                    initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
                  >
                    <motion.div 
                      className="w-full h-full bg-black/30 p-4 relative"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute -top-2 -left-2 right-2 bottom-2 border border-artflow-purple/30 rounded-2xl" />
                      <div className="w-full h-full rounded-lg overflow-hidden shadow-xl">
                        <img 
                          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3" 
                          alt="Digital Art Example" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
                
                <motion.div 
                  className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <p className="text-white/70 text-sm mb-2">Explore More</p>
                  <ArrowDown className="text-white/70 h-5 w-5" />
                </motion.div>
              </motion.section>
              
              {/* Features Section */}
              <section className="py-28">
                <div className="container mx-auto px-4">
                  <FeatureHeader />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
                    {features.map((feature, index) => (
                      <FeatureCard 
                        key={feature.title}
                        feature={feature}
                        index={index}
                        isActive={activeFeature === index}
                      />
                    ))}
                  </div>
                </div>
              </section>
              
              {/* Canvas Preview Section */}
              <CanvasPreviewSection handleGetStarted={handleGetStarted} />
              
              {/* Testimonials */}
              <TestimonialsSection />
              
              {/* Try It Now Section */}
              <section className="py-20">
                <div className="container mx-auto px-4">
                  <motion.div 
                    className="relative bg-gradient-to-br from-artflow-purple/20 to-transparent border border-artflow-purple/30 rounded-3xl p-10 md:p-16 text-center overflow-hidden"
                    whileInView={{ opacity: [0, 1], y: [50, 0] }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10" />
                    </div>
                    
                    <motion.div className="relative z-10">
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to <span className="text-gradient bg-gradient-to-br from-artflow-purple to-blue-400">Create?</span></h2>
                      <p className="text-gray-300 mb-10 max-w-2xl mx-auto text-lg">
                        Jump into the canvas and start creating your next digital masterpiece with our powerful tools and intuitive interface.
                      </p>
                      <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="bg-gradient-to-r from-artflow-purple to-blue-500 hover:from-artflow-deep-purple hover:to-blue-600 text-white border-0 shadow-lg shadow-artflow-purple/20 text-lg px-8 py-6 h-auto"
                      >
                        Launch Canvas
                      </Button>
                    </motion.div>
                    
                    <motion.div 
                      className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 blur-3xl"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{ duration: 7, repeat: Infinity, delay: 1 }}
                    />
                  </motion.div>
                </div>
              </section>
            </motion.main>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 container mx-auto py-8 px-4 pt-20"
            >
              <div className="flex justify-between items-center mb-6">
                <motion.h2 
                  className="text-2xl font-bold text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-artflow-purple">Art</span>Flow Canvas
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setShowFullCanvas(false)}
                    className="text-white hover:bg-white/10"
                  >
                    Back to Home
                  </Button>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <ArtCanvas fullScreen={true} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Footer */}
        <footer className="py-6 px-6 bg-black/30 border-t border-white/10 text-center text-gray-400">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between gap-4 container mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-artflow-purple" />
              <span className="text-white">
                <span className="text-artflow-purple">Art</span>Flow
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="https://github.com" className="hover:text-artflow-purple transition-colors">
                <Github size={20} />
              </a>
              <span>|</span>
              <p>Made with <Heart className="inline h-4 w-4 text-red-500" /> by ArtFlow</p>
            </div>
            
            <div className="text-sm">
              © 2025 ArtFlow. All rights reserved.
            </div>
          </motion.div>
        </footer>
      </div>
    </ParallaxProvider>
  );
};

// Feature Header Component
const FeatureHeader = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <div ref={ref} className="text-center">
      <motion.h2 
        className="text-3xl md:text-4xl font-bold text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        Powerful <span className="text-gradient bg-gradient-to-br from-artflow-purple to-blue-400">Features</span>
      </motion.h2>
      <motion.p 
        className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        Everything you need to bring your creative vision to life
      </motion.p>
    </div>
  );
};

// Canvas Preview Section
const CanvasPreviewSection = ({ handleGetStarted }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-[#1a1a2e]/50 to-transparent">
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex flex-col lg:flex-row items-center gap-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="lg:w-1/2 order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Intuitive <span className="text-gradient bg-gradient-to-br from-artflow-purple to-blue-400">Canvas</span> Experience
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Our digital canvas is designed for both beginners and professionals, with intuitive controls and powerful features that adapt to your creative workflow.
            </p>
            
            <div className="space-y-6">
              {[
                { title: "Pressure Sensitivity", description: "Experience realistic drawing with pressure sensitivity simulation" },
                { title: "Layer Management", description: "Create complex artwork with an advanced layer system" },
                { title: "Smart Tools", description: "Access intelligent tools that enhance your creative process" }
              ].map((item, i) => (
                <motion.div 
                  key={item.title} 
                  className="flex gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-artflow-purple/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-artflow-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-10">
              <Button onClick={handleGetStarted} className="bg-artflow-purple hover:bg-artflow-deep-purple text-white">
                Try Canvas Now
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2 order-1 lg:order-2"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div className="bg-black/50 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Download size={16} className="text-white/70" />
                    <Share2 size={16} className="text-white/70" />
                  </div>
                </div>
                
                <div className="aspect-[4/3] rounded-lg overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1536924430914-91f9e2041b83?q=80&w=2866&auto=format&fit=crop" 
                    alt="Canvas Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex justify-between mt-4">
                  <div className="flex gap-2">
                    {['#FF5C8D', '#7A5AF8', '#00C2FF', '#5AE9B3'].map(color => (
                      <div key={color} className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                      <LayersIcon size={14} className="text-white/70" />
                    </div>
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Brush size={14} className="text-white/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Alex Morgan",
      role: "Digital Artist",
      text: "ArtFlow has revolutionized my digital art workflow. The brushes feel incredibly natural and responsive!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3087&auto=format&fit=crop"
    },
    {
      name: "Jamie Chen",
      role: "Illustrator",
      text: "The layer system and effects in ArtFlow have helped me create artwork I never thought possible before.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=2662&auto=format&fit=crop"
    },
    {
      name: "Sam Wilson",
      role: "Animation Student",
      text: "As a student, I appreciate how intuitive ArtFlow is while still offering professional-grade features.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3087&auto=format&fit=crop"
    }
  ];
  
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-[#1a1a2e]/30 to-transparent">
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          What Artists Are <span className="text-gradient bg-gradient-to-br from-artflow-purple to-blue-400">Saying</span>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div 
              key={testimonial.name}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + (i * 0.1) }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{testimonial.name}</h3>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-300">{testimonial.text}</p>
              
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React from "react";

export default Index;
