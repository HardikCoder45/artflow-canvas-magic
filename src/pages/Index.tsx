
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ArrowRight, Brush, Users, Sparkles, Palette, Image, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import HeroBackground from "../components/HeroBackground";

const Index = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateCanvas = useCallback(() => {
    setIsCreating(true);
    setTimeout(() => {
      const newRoomId = uuidv4();
      navigate(`/canvas/${newRoomId}`);
    }, 800);
  }, [navigate]);
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <Palette size={28} className="text-purple-400" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                ArtFlow
              </h1>
            </motion.div>
            
            <motion.div 
              className="flex gap-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button variant="ghost" asChild>
                <a href="/about">About</a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/gallery">Gallery</a>
              </Button>
              <Button variant="outline" className="hidden sm:flex">
                Login
              </Button>
              <Button>
                Sign Up
              </Button>
            </motion.div>
          </nav>
        </header>
        
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Badge variant="outline" className="mb-4 px-3 py-1 backdrop-blur-sm bg-white/5 border-white/10">
                <span className="mr-1 text-green-400">●</span> Now in Beta
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-200 to-purple-400">
                Unleash Your Creativity with ArtFlow
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                A powerful digital canvas built for artists and creators. Draw, paint, sketch, and collaborate in real-time with intuitive tools and AI-powered features.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={handleCreateCanvas}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
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
                
                <Button variant="outline" size="lg" className="backdrop-blur-sm bg-white/5 border-white/20">
                  View Gallery
                </Button>
              </div>
            </motion.div>
            
            {/* Feature Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-16 lg:mt-28 relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30"></div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 backdrop-blur-sm">
                <div className="h-[400px] sm:h-[500px] bg-black/30">
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center">
                      <Brush size={64} className="mx-auto mb-4 text-purple-400 opacity-60" />
                      <p className="text-gray-400">Click "Start Drawing" to create your canvas</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 relative">
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
            {[
              {
                icon: <Brush className="h-8 w-8 text-purple-400" />,
                title: "Advanced Brushes",
                description: "Choose from a variety of brushes including watercolor, chalk, marker, and more with pressure sensitivity."
              },
              {
                icon: <Users className="h-8 w-8 text-blue-400" />,
                title: "Real-time Collaboration",
                description: "Create together with friends and colleagues in real-time, perfect for remote teams and artistic partnerships."
              },
              {
                icon: <Sparkles className="h-8 w-8 text-amber-400" />,
                title: "AI-Powered Tools",
                description: "Leverage AI to enhance your artwork with smart color suggestions, style transfers, and automatic improvements."
              },
              {
                icon: <Palette className="h-8 w-8 text-pink-400" />,
                title: "Unlimited Canvas",
                description: "Work with an infinitely expandable canvas that adapts to your creative vision without constraints."
              },
              {
                icon: <Image className="h-8 w-8 text-green-400" />,
                title: "Layer Management",
                description: "Organize your artwork with powerful layer controls for professional-grade digital compositions."
              },
              {
                icon: <Share2 className="h-8 w-8 text-cyan-400" />,
                title: "Easy Sharing",
                description: "Export in multiple formats and share your creations directly to social media or your portfolio."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="mb-4 p-3 rounded-full bg-white/5 inline-block">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-800/60 to-pink-800/60 backdrop-blur-md"></div>
            
            <div className="relative p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Create Your Masterpiece?
              </h2>
              
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                Join thousands of artists who have discovered the power and flexibility of ArtFlow for their digital art projects.
              </p>
              
              <Button 
                onClick={handleCreateCanvas}
                size="lg"
                className="bg-white text-purple-900 hover:bg-white/90 px-8 py-6 text-lg"
              >
                Create Your Canvas Now <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        </section>
        
        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Palette size={20} className="text-purple-400" />
              <span className="font-bold">ArtFlow</span>
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white">Terms</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">Privacy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">Contact</a>
            </div>
            
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              © {new Date().getFullYear()} ArtFlow. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
