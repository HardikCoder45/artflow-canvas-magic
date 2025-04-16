import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Brush, Image, Menu, X, LogOut, User as UserIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
}

const NavLink = ({ href, label, isActive }: NavLinkProps) => (
  <Link 
    to={href} 
    className={`relative px-3 py-2 transition-colors duration-200 ${
      isActive 
        ? "text-white font-medium" 
        : "text-gray-300 hover:text-white"
    }`}
  >
    {label}
    {isActive && (
      <motion.div 
        layoutId="activeNavIndicator"
        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    )}
  </Link>
);

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/gallery", label: "Gallery" },
    { href: "/about", label: "About" }
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "py-3 bg-black/60 backdrop-blur-lg shadow-lg" 
          : "py-5 bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="https://i.ibb.co/GGSk8sY/Chat-GPT-Image-Apr-9-2025-03-24-36-PM-removebg-preview.png" 
              alt="ArtFlow Logo" 
              className="w-9 h-9 object-contain"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400"
          >
            ArtFlow
          </motion.h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink 
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={location.pathname === link.href}
              />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 group relative overflow-hidden"
              onClick={() => navigate("/canvas/new")}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-700 group-hover:to-pink-700 transition-all duration-300 transform group-hover:scale-105 opacity-0 group-hover:opacity-100"></span>
              <span className="relative flex items-center">
                <Brush className="w-4 h-4 mr-2" />
                Create Canvas
              </span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-purple-400/50">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || user.email} />
                      <AvatarFallback className="bg-purple-800 text-white">
                        {user.user_metadata?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.username || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/gallery")}>
                    <Image className="mr-2 h-4 w-4" />
                    Gallery
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" className="text-white hover:text-purple-300 hover:bg-white/5" onClick={() => navigate("/auth")}>
                Log In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/90 backdrop-blur-lg border-t border-white/10"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col">
              <nav className="flex flex-col gap-4 mb-6">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href}
                    to={link.href}
                    className={`py-2 ${location.pathname === link.href ? "text-white font-medium" : "text-gray-400"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={() => {
                    navigate("/canvas/new");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Brush className="w-4 h-4" />
                  Create Canvas
                </Button>

                {!user && (
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white"
                    onClick={() => {
                      navigate("/auth");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log In
                  </Button>
                )}

                {user && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10 border border-purple-400/50">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || user.email} />
                        <AvatarFallback className="bg-purple-800 text-white">
                          {user.user_metadata?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.user_metadata?.username || "User"}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/20"
                        onClick={() => {
                          navigate("/profile");
                          setMobileMenuOpen(false);
                        }}
                      >
                        Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/20"
                        onClick={() => {
                          navigate("/settings");
                          setMobileMenuOpen(false);
                        }}
                      >
                        Settings
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/20 col-span-2"
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar; 