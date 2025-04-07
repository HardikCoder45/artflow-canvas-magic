
import { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";

interface ParallaxContextType {
  scrollY: number;
}

const ParallaxContext = createContext<ParallaxContextType>({
  scrollY: 0,
});

interface ParallaxProviderProps {
  children: ReactNode;
}

export const useParallax = () => {
  return useContext(ParallaxContext);
};

export const ParallaxProvider = ({ children }: ParallaxProviderProps) => {
  const [scrollY, setScrollY] = useState(0);
  const isComponentMounted = useRef(true);
  
  useEffect(() => {
    const handleScroll = () => {
      if (isComponentMounted.current) {
        setScrollY(window.scrollY);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    
    // Initial value
    setScrollY(window.scrollY);
    
    return () => {
      isComponentMounted.current = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  const value = {
    scrollY,
  };
  
  return (
    <ParallaxContext.Provider value={value}>
      {children}
    </ParallaxContext.Provider>
  );
};
