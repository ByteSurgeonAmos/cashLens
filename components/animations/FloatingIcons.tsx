"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const FloatingIcon: React.FC<{
  icon: React.ComponentType<any>;
  delay: number;
  duration: number;
  initialX: number;
  initialY: number;
  size?: string;
}> = ({
  icon: Icon,
  delay,
  duration,
  initialX,
  initialY,
  size = "w-12 h-12",
}) => {
  return (
    <motion.div
      className={`absolute ${size} text-purple-400 opacity-20`}
      style={{ left: `${initialX}%`, top: `${initialY}%` }}
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
        rotate: [0, 5, -5, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Icon className="w-full h-full drop-shadow-lg" />
    </motion.div>
  );
};

export const FloatingIcons: React.FC = () => {
  const icons = [
    {
      icon: CurrencyDollarIcon,
      delay: 0,
      duration: 4,
      x: 10,
      y: 20,
      size: "w-16 h-16",
    },
    {
      icon: ChartBarIcon,
      delay: 1,
      duration: 5,
      x: 85,
      y: 15,
      size: "w-14 h-14",
    },
    {
      icon: BanknotesIcon,
      delay: 2,
      duration: 3.5,
      x: 15,
      y: 70,
      size: "w-12 h-12",
    },
    {
      icon: CreditCardIcon,
      delay: 0.5,
      duration: 4.5,
      x: 80,
      y: 75,
      size: "w-18 h-18",
    },
    // { icon: TrendingUpIcon, delay: 1.5, duration: 3.8, x: 5, y: 45, size: "w-10 h-10" }, // Removed because it does not exist
    {
      icon: ShieldCheckIcon,
      delay: 2.5,
      duration: 4.2,
      x: 90,
      y: 45,
      size: "w-14 h-14",
    },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((iconData, index) => (
        <FloatingIcon
          key={index}
          icon={iconData.icon}
          delay={iconData.delay}
          duration={iconData.duration}
          initialX={iconData.x}
          initialY={iconData.y}
          size={iconData.size}
        />
      ))}
    </div>
  );
};
