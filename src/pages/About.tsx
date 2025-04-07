
import { Link } from "react-router-dom";
import { Palette, Brush, Layers, Sparkles, Wand2, Users, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { motion } from "framer-motion";

const About = () => {
  const features = [
    {
      icon: Brush,
      title: "Dynamic Brush Effects",
      description: "Pressure sensitivity simulation and texture brushes including watercolor and chalk patterns."
    },
    {
      icon: Layers,
      title: "Layer System",
      description: "Create, delete, and toggle visibility of layers for complex compositions."
    },
    {
      icon: Sparkles,
      title: "Special Effects",
      description: "Add filters, gradients, and transformations to enhance your artwork."
    },
    {
      icon: Wand2,
      title: "Smart Tools",
      description: "Intelligent tools that help you create better art with less effort."
    },
    {
      icon: Users,
      title: "Community Sharing",
      description: "Share your creations with the ArtFlow community and get inspired."
    }
  ];

  const teamMembers = [
    {
      name: "Alex Morgan",
      role: "Lead Developer",
      avatar: "https://i.pravatar.cc/150?img=11"
    },
    {
      name: "Jamie Chen",
      role: "UI Designer",
      avatar: "https://i.pravatar.cc/150?img=5"
    },
    {
      name: "Sam Taylor",
      role: "Creative Director",
      avatar: "https://i.pravatar.cc/150?img=8"
    }
  ];

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
        {/* Hero Section */}
        <section className="mb-16">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              About <span className="text-artflow-purple">ArtFlow</span>
            </h1>
            <p className="text-gray-300 text-lg">
              We're building the next generation of digital art tools, making creativity more accessible and enjoyable for everyone.
            </p>
          </motion.div>
        </section>
        
        {/* Mission Section */}
        <section className="mb-20">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-10">
              <motion.div 
                className="md:w-1/2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
                <p className="text-gray-300 mb-6">
                  ArtFlow was created with a simple yet powerful mission: to democratize digital art creation. We believe that everyone has creative potential, and we're committed to building tools that are both powerful and accessible.
                </p>
                <p className="text-gray-300">
                  Our platform combines cutting-edge technology with an intuitive interface, allowing artists of all skill levels to express themselves freely and bring their visions to life.
                </p>
              </motion.div>
              
              <motion.div 
                className="md:w-1/2 aspect-video rounded-lg overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1536411499087-f95557e29f0c?q=80&w=3089&auto=format&fit=crop&ixlib=rb-4.0.3" 
                  alt="Digital artists working together" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Key <span className="text-artflow-purple">Features</span>
            </h2>
            <p className="text-gray-400 mt-2">What makes ArtFlow special</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
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
        
        {/* Team Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Meet the <span className="text-artflow-purple">Team</span>
            </h2>
            <p className="text-gray-400 mt-2">The people behind ArtFlow</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 * index }}
              >
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-artflow-purple">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-white font-semibold mt-4">{member.name}</h3>
                <p className="text-gray-400 text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-6 bg-black/30 border-t border-white/10 text-center text-gray-400">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Palette className="h-5 w-5 text-artflow-purple" />
            <p>© 2025 ArtFlow. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="https://github.com" className="hover:text-artflow-purple transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="hover:text-artflow-purple transition-colors">Terms</a>
            <a href="#" className="hover:text-artflow-purple transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
