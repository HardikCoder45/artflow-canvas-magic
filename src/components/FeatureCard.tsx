
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
  isActive: boolean;
}

const FeatureCard = ({ feature, index, isActive }: FeatureCardProps) => {
  const Icon = feature.icon;
  
  return (
    <motion.div
      className={cn(
        "bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 transition-all duration-300",
        isActive ? "shadow-xl border-white/20 bg-white/10" : "hover:bg-white/7"
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <motion.div 
        className={cn(
          "bg-gradient-to-br p-3 rounded-full w-fit mb-4",
          feature.color
        )}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <Icon className="h-6 w-6 text-white" />
      </motion.div>
      
      <motion.h3 
        className="text-xl font-semibold text-white mb-2"
        animate={isActive ? { color: ['#fff', '#9b87f5', '#fff'] } : {}}
        transition={{ duration: 1 }}
      >
        {feature.title}
      </motion.h3>
      
      <p className="text-gray-400">
        {feature.description}
      </p>
    </motion.div>
  );
};

export default FeatureCard;
