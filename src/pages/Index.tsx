
import { useState } from "react";
import { Link } from "react-router-dom";
import ArtCanvas from "@/components/ArtCanvas";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Brush, Github, Heart, PaintBucket, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

const Index = () => {
  const [showFullCanvas, setShowFullCanvas] = useState(false);
  const { toast } = useToast();
  
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
      description: "From watercolor to chalk, express yourself with diverse brush styles"
    },
    {
      icon: Palette,
      title: "Color Harmonies",
      description: "Access stunning color palettes and gradient options"
    },
    {
      icon: Sparkles,
      title: "Special Effects",
      description: "Add magic to your artwork with filters and transformations"
    },
    {
      icon: PaintBucket,
      title: "Layer System",
      description: "Work with multiple layers for complex compositions"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-gradient-to-b from-artflow-dark-purple via-[#201f35] to-[#0f0d19]">
      {/* Navigation */}
      <header className="w-full py-4 px-6 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <Palette className="h-8 w-8 text-artflow-purple" />
          <h1 className="text-2xl font-bold text-white">
            <span className="text-artflow-purple">Art</span>Flow
          </h1>
        </div>
        
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
        
        <Button onClick={handleGetStarted} className="bg-artflow-purple hover:bg-artflow-deep-purple text-white">
          Get Started
        </Button>
      </header>
      
      <AnimatePresence>
        {!showFullCanvas ? (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 container mx-auto py-8 px-4"
          >
            {/* Hero Section */}
            <section className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                    Unleash Your <span className="text-artflow-purple">Creative</span> Potential
                  </h1>
                  <p className="text-gray-300 mt-4 text-lg md:text-xl">
                    ArtFlow Canvas provides powerful digital drawing tools with intuitive controls and stunning effects.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="bg-artflow-purple hover:bg-artflow-deep-purple text-white"
                  >
                    <Brush className="mr-2 h-5 w-5" />
                    Start Creating
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-artflow-purple text-artflow-purple hover:bg-artflow-purple/10"
                  >
                    View Gallery
                  </Button>
                </motion.div>
              </div>
              
              <motion.div 
                className="md:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="w-full h-full bg-black/30 p-4">
                  <div className="w-full h-full rounded-lg overflow-hidden shadow-xl">
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3" 
                      alt="Digital Art Example" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </section>
            
            {/* Features Section */}
            <section className="py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white">
                  Powerful <span className="text-artflow-purple">Features</span>
                </h2>
                <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                  Everything you need to bring your creative vision to life
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-artflow-purple/20 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <div className="bg-artflow-purple/20 p-3 rounded-full w-fit mb-4">
                      <feature.icon className="h-6 w-6 text-artflow-purple" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-gray-400 mt-2">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </section>
            
            {/* Try It Now Section */}
            <section className="py-16">
              <div className="bg-gradient-to-br from-artflow-purple/20 to-transparent border border-artflow-purple/30 rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-3xl font-bold text-white">Ready to Create?</h2>
                <p className="text-gray-300 mt-4 mb-8 max-w-2xl mx-auto">
                  Jump into the canvas and start creating your next digital masterpiece with our powerful tools.
                </p>
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-artflow-purple hover:bg-artflow-deep-purple text-white"
                >
                  Launch Canvas
                </Button>
              </div>
            </section>
          </motion.main>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 container mx-auto py-8 px-4"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">
                <span className="text-artflow-purple">Art</span>Flow Canvas
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowFullCanvas(false)}
                className="text-white hover:bg-white/10"
              >
                Back to Home
              </Button>
            </div>
            <ArtCanvas />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="py-6 px-6 bg-black/30 border-t border-white/10 text-center text-gray-400">
        <div className="flex items-center justify-center gap-4">
          <a href="https://github.com" className="hover:text-artflow-purple transition-colors">
            <Github size={20} />
          </a>
          <span>|</span>
          <p>Made with <Heart className="inline h-4 w-4 text-red-500" /> by ArtFlow</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
