import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Palette, ArrowLeft, Heart, Download, Filter, Search, ArrowRight, Brush, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

// Sample gallery images
const artworks = [
  {
    id: 1,
    title: "Ocean Dreams",
    creator: "ArtisticSoul",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=3593&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 248,
    tags: ["landscape", "watercolor"]
  },
  {
    id: 2, 
    title: "Neon City",
    creator: "DigitalPainter",
    image: "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 192,
    tags: ["urban", "digital"]
  },
  {
    id: 3,
    title: "Abstract Thoughts",
    creator: "MindfulCreator",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 315,
    tags: ["abstract", "experimental"]
  },
  {
    id: 4,
    title: "Sunset Valley",
    creator: "NatureLover",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 421,
    tags: ["landscape", "traditional"]
  },
  {
    id: 5,
    title: "Cosmic Journey",
    creator: "StarGazer",
    image: "https://images.unsplash.com/photo-1607499699372-8e218b0503e6?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 183,
    tags: ["space", "digital"]
  },
  {
    id: 6,
    title: "Urban Exploration",
    creator: "CityWanderer",
    image: "https://images.unsplash.com/photo-1543857778-c4a1a9e0615f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 267,
    tags: ["urban", "photography"]
  }
];

// Particle background component
const ParticleBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white opacity-70"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
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
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const Gallery = () => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState<{[key: number]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [hoveredArtwork, setHoveredArtwork] = useState<number | null>(null);
  const [expandedView, setExpandedView] = useState<number | null>(null);
  
  const toggleLike = (id: number) => {
    setLiked(prev => ({...prev, [id]: !prev[id]}));
  };

  const allTags = Array.from(new Set(artworks.flatMap(artwork => artwork.tags)));
  
  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          artwork.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = activeTag ? artwork.tags.includes(activeTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
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
      </div>
      
      {/* Navigation */}
      <header className="relative z-10 w-full py-4 px-6 flex items-center justify-between backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Palette className="h-8 w-8 text-purple-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">ArtFlow Canvas</span>
          </motion.h1>
        </div>
        
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button variant="ghost" className="text-white hover:text-purple-400 hover:bg-white/5" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button variant="ghost" className="text-white hover:text-purple-400 hover:bg-white/5" onClick={() => navigate("/gallery")}>
            Gallery
          </Button>
          <Button variant="ghost" className="text-white hover:text-purple-400 hover:bg-white/5" onClick={() => navigate("/about")}>
            About
          </Button>
          <Button 
            className="hidden md:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => navigate("/")}
          >
            <Brush className="w-4 h-4 mr-2" />
            Start Creating
          </Button>
        </motion.div>
      </header>
      
      <main className="relative z-10 flex-1 container mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-200 to-purple-400">Community Gallery</h1>
            <p className="text-gray-300">Explore amazing creations from artists around the world</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search artworks..." 
                className="pl-10 bg-white/5 border-white/10 text-white w-full sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="gap-2 border-purple-400 text-purple-400 hover:bg-purple-400/10"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={16} />
              Back to Canvas
            </Button>
          </div>
        </motion.div>
        
        {/* Tags filter */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button 
            variant={activeTag === null ? "default" : "outline"} 
            size="sm"
            className={`rounded-full ${activeTag === null ? "bg-gradient-to-r from-purple-600 to-pink-600" : "border-white/20 hover:bg-white/10"}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </Button>
          
          {allTags.map((tag) => (
            <Button 
              key={tag}
              variant={activeTag === tag ? "default" : "outline"} 
              size="sm"
              className={`rounded-full ${activeTag === tag ? "bg-gradient-to-r from-purple-600 to-pink-600" : "border-white/20 hover:bg-white/10"}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredArtworks.map((artwork, index) => (
              <motion.div
                key={artwork.id}
                layoutId={`artwork-${artwork.id}`}
                className={`relative overflow-hidden ${expandedView === artwork.id ? "col-span-3 row-span-2" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => expandedView === artwork.id ? setExpandedView(null) : setExpandedView(artwork.id)}
                onMouseEnter={() => setHoveredArtwork(artwork.id)}
                onMouseLeave={() => setHoveredArtwork(null)}
                whileHover={{ y: -5 }}
              >
                <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm hover:from-purple-900/30 hover:to-pink-900/30 transition-all duration-300">
                  <div className="aspect-square overflow-hidden">
                    <motion.img 
                      src={artwork.image} 
                      alt={artwork.title} 
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                    
                    {/* Overlay when hovered */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredArtwork === artwork.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: hoveredArtwork === artwork.id ? 0 : 20, opacity: hoveredArtwork === artwork.id ? 1 : 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <div className="flex flex-wrap gap-2 mb-2">
                          {artwork.tags.map(tag => (
                            <span key={tag} className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-white">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-xl font-semibold text-white">{artwork.title}</h3>
                        <p className="text-gray-300">by {artwork.creator}</p>
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-white">{artwork.title}</h3>
                    <p className="text-gray-400">by {artwork.creator}</p>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2">
                        <motion.button 
                          whileTap={{ scale: 1.5 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(artwork.id);
                          }}
                          className="focus:outline-none"
                        >
                          <Heart 
                            size={18} 
                            className={liked[artwork.id] ? "fill-red-500 text-red-500" : "text-gray-400"} 
                          />
                        </motion.button>
                        <motion.span 
                          className="text-gray-400"
                          animate={{ scale: liked[artwork.id] && !liked[artwork.id] ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {liked[artwork.id] ? artwork.likes + 1 : artwork.likes}
                        </motion.span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download logic here
                        }}
                      >
                        <Download size={18} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* View details peek indicator */}
                  <motion.div
                    className="absolute bottom-0 right-0 p-2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ y: hoveredArtwork === artwork.id ? 0 : 10 }}
                  >
                    <span>Click to {expandedView === artwork.id ? "close" : "view"}</span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredArtworks.length === 0 && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No artworks found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setActiveTag(null);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Clear filters
            </Button>
          </motion.div>
        )}
        
        {/* Floating action button for mobile */}
        <motion.div
          className="fixed bottom-6 right-6 md:hidden z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button 
            size="lg" 
            className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
            onClick={() => navigate("/")}
          >
            <Brush className="h-6 w-6" />
          </Button>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 bg-black/30 border-t border-white/10 text-center text-gray-400">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Palette className="h-5 w-5 text-purple-400" />
            <p>© {new Date().getFullYear()} ArtFlow Canvas. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-4">
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
        </div>
      </footer>
    </div>
  );
};

export default Gallery;
