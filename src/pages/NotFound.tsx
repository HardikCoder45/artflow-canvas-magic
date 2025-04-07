
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Palette, Home } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-artflow-dark-purple via-[#201f35] to-[#0f0d19] flex flex-col">
      <header className="w-full py-4 px-6 flex items-center bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Palette className="h-8 w-8 text-artflow-purple" />
          <h1 className="text-2xl font-bold text-white">
            <span className="text-artflow-purple">Art</span>Flow
          </h1>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-7xl font-bold text-white mb-4">404</h2>
          <h3 className="text-2xl font-semibold text-artflow-purple mb-6">Page Not Found</h3>
          <p className="text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved to another URL.
          </p>
          <Button asChild className="bg-artflow-purple hover:bg-artflow-deep-purple">
            <Link to="/" className="flex items-center gap-2">
              <Home size={16} />
              Return to Canvas
            </Link>
          </Button>
        </motion.div>
      </div>
      
      <footer className="py-4 px-6 bg-black/30 border-t border-white/10 text-center text-gray-400">
        <p>© 2025 ArtFlow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default NotFound;
