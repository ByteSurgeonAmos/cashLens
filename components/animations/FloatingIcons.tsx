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

const FloatingCurrency: React.FC<{
  symbol: string;
  delay: number;
  duration: number;
  initialX: number;
  initialY: number;
  size?: string;
}> = ({ symbol, delay, duration, initialX, initialY, size = "text-2xl" }) => {
  return (
    <motion.div
      className={`absolute ${size} font-bold text-green-400 opacity-30`}
      style={{ left: `${initialX}%`, top: `${initialY}%` }}
      animate={{
        y: [0, -15, 0],
        x: [0, 8, 0],
        rotate: [0, 3, -3, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {symbol}
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
    {
      icon: ShieldCheckIcon,
      delay: 2.5,
      duration: 4.2,
      x: 90,
      y: 45,
      size: "w-14 h-14",
    },
  ];

  const currencies = [
    { symbol: "€", delay: 0.3, duration: 4.5, x: 25, y: 30, size: "text-3xl" },
    { symbol: "£", delay: 1.2, duration: 3.8, x: 75, y: 25, size: "text-2xl" },
    { symbol: "¥", delay: 2.1, duration: 4.1, x: 20, y: 85, size: "text-3xl" },
    { symbol: "₹", delay: 1.8, duration: 3.5, x: 85, y: 85, size: "text-2xl" },
    { symbol: "₿", delay: 0.8, duration: 4.8, x: 45, y: 15, size: "text-xl" },
    { symbol: "₩", delay: 2.8, duration: 3.9, x: 65, y: 55, size: "text-2xl" },
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
      {currencies.map((currencyData, index) => (
        <FloatingCurrency
          key={`currency-${index}`}
          symbol={currencyData.symbol}
          delay={currencyData.delay}
          duration={currencyData.duration}
          initialX={currencyData.x}
          initialY={currencyData.y}
          size={currencyData.size}
        />
      ))}
    </div>
  );
};
