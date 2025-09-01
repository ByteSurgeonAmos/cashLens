"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const GlobalCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    // Add cursor effect to interactive elements
    const addHoverEffects = () => {
      const interactiveElements = document.querySelectorAll(
        'button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])'
      );

      interactiveElements.forEach((el) => {
        el.addEventListener("mouseenter", handleMouseEnter);
        el.addEventListener("mouseleave", handleMouseLeave);
      });

      return () => {
        interactiveElements.forEach((el) => {
          el.removeEventListener("mouseenter", handleMouseEnter);
          el.removeEventListener("mouseleave", handleMouseLeave);
        });
      };
    };

    // Initial setup
    document.addEventListener("mousemove", updateMousePosition);
    const cleanup = addHoverEffects();

    // Re-run hover effects setup when DOM changes
    const observer = new MutationObserver(addHoverEffects);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("mousemove", updateMousePosition);
      cleanup();
      observer.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Main cursor */}
          <motion.div
            className="fixed top-0 left-0 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full pointer-events-none z-[9999] mix-blend-difference"
            style={{
              x: mousePosition.x - 8,
              y: mousePosition.y - 8,
            }}
            animate={{
              scale: isHovering ? 1.5 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
            }}
          />

          {/* Trailing cursor */}
          <motion.div
            className="fixed top-0 left-0 w-8 h-8 border-2 border-purple-400 rounded-full pointer-events-none z-[9998] opacity-50"
            style={{
              x: mousePosition.x - 16,
              y: mousePosition.y - 16,
            }}
            animate={{
              scale: isHovering ? 2 : 1,
              opacity: isHovering ? 0.8 : 0.3,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
            }}
          />

          {/* Glow effect */}
          <motion.div
            className="fixed top-0 left-0 w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full pointer-events-none z-[9997] blur-sm"
            style={{
              x: mousePosition.x - 24,
              y: mousePosition.y - 24,
            }}
            animate={{
              scale: isHovering ? 3 : 1.5,
              opacity: isHovering ? 0.6 : 0.2,
            }}
            transition={{
              type: "spring",
              stiffness: 50,
              damping: 15,
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};
