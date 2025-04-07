
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Palette, ArrowLeft, Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { motion } from "framer-motion";

// Sample gallery images - in a real app these would come from a database
const artworks = [
  {
    id: 1,
    title: "Ocean Dreams",
    creator: "ArtisticSoul",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=3593&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 248,
  },
  {
    id: 2,
    title: "Neon City",
    creator: "DigitalPainter",
    image: "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 192,
  },
  {
    id: 3,
    title: "Abstract Thoughts",
    creator: "MindfulCreator",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 315,
  },
  {
    id: 4,
    title: "Sunset Valley",
    creator: "NatureLover",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 421,
  },
  {
    id: 5,
    title: "Cosmic Journey",
    creator: "StarGazer",
    image: "https://images.unsplash.com/photo-1607499699372-8e218b0503e6?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 183,
  },
  {
    id: 6,
    title: "Urban Exploration",
    creator: "CityWanderer",
    image: "https://images.unsplash.com/photo-1543857778-c4a1a9e0615f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3",
    likes: 267,
  }
];

const Gallery = () => {
  const [liked, setLiked] = useState<{[key: number]: boolean}>({});
  
  const toggleLike = (id: number) => {
    setLiked(prev => ({...prev, [id]: !prev[id]}));
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-artflow-dark-purple via-[#201f35] to-[#0f0d19]">
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
        
        <Button asChild>
          <Link to="/" className="bg-artflow-purple hover:bg-artflow-deep-purple text-white">
            Create Art
          </Link>
        </Button>
      </header>
      
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Community Gallery</h1>
            <p className="text-gray-400">Explore amazing creations from our artists</p>
          </div>
          
          <Button variant="outline" asChild className="gap-2 border-artflow-purple text-artflow-purple hover:bg-artflow-purple/10">
            <Link to="/">
              <ArrowLeft size={16} />
              Back to Canvas
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork, index) => (
            <motion.div
              key={artwork.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-artflow-purple/20 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src={artwork.image} 
                  alt={artwork.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold text-white">{artwork.title}</h3>
                <p className="text-gray-400">by {artwork.creator}</p>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="p-0 hover:bg-transparent"
                      onClick={() => toggleLike(artwork.id)}
                    >
                      <Heart 
                        size={18} 
                        className={liked[artwork.id] ? "fill-red-500 text-red-500" : "text-gray-400"} 
                      />
                    </Button>
                    <span className="text-gray-400">
                      {liked[artwork.id] ? artwork.likes + 1 : artwork.likes}
                    </span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-400">
                    <Download size={18} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-6 bg-black/30 border-t border-white/10 text-center text-gray-400">
        <div className="flex items-center justify-center gap-4">
          <p>© 2025 ArtFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Gallery;
