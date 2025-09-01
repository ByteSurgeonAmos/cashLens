"use client";

import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  EyeIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

const FeatureCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}> = ({ icon: Icon, title, description, gradient, delay }) => {
  const [ref, inView] = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      className="group relative p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-purple-400/50 transition-all duration-500"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 25px 50px rgba(168, 85, 247, 0.3)",
      }}
    >
      <motion.div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.6 }}
      >
        <Icon className="w-full h-full text-white" />
      </motion.div>

      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
        {title}
      </h3>

      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
        {description}
      </p>

      {/* Hover effect background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        initial={false}
      />
    </motion.div>
  );
};

export const FeaturesSection: React.FC = () => {
  const [titleRef, titleInView] = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  const features = [
    {
      icon: ChartBarIcon,
      title: "Smart Analytics",
      description:
        "AI-powered insights that analyze your spending patterns and provide personalized recommendations for better financial health.",
      gradient: "from-purple-500 to-blue-500",
      delay: 0.1,
    },
    {
      icon: ShieldCheckIcon,
      title: "Bank-Level Security",
      description:
        "Your financial data is protected with enterprise-grade encryption and multi-factor authentication.",
      gradient: "from-green-500 to-emerald-500",
      delay: 0.2,
    },
    {
      icon: BoltIcon,
      title: "Realtime Sync",
      description:
        "Lightning-fast realtime transaction syncing and instant updates keep you informed about your finances 24/7.",
      gradient: "from-yellow-500 to-orange-500",
      delay: 0.3,
    },
    {
      icon: EyeIcon,
      title: "Visual Insights",
      description:
        "Beautiful charts and graphs that make understanding your financial patterns effortless and engaging.",
      gradient: "from-pink-500 to-red-500",
      delay: 0.4,
    },
    {
      icon: CurrencyDollarIcon,
      title: "Multi-Currency Support",
      description:
        "Track finances in any currency - USD, EUR, GBP, JPY, and 100+ more. Automatic conversion rates and global financial management.",
      gradient: "from-indigo-500 to-purple-500",
      delay: 0.5,
    },
    {
      icon: DevicePhoneMobileIcon,
      title: "Multi-Platform",
      description:
        "Seamlessly access your financial data across all devices with our responsive design and mobile apps.",
      gradient: "from-cyan-500 to-blue-500",
      delay: 0.6,
    },
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          ref={titleRef}
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.h2
            className="text-5xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={titleInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            Powerful Features for
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Modern Finance
            </span>
          </motion.h2>

          <motion.p
            className="text-xl text-gray-400 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Experience the future of personal finance management with
            cutting-edge technology and intuitive design that makes every
            financial decision smarter.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              delay={feature.delay}
            />
          ))}
        </div>

        {/* Animated divider */}
        <motion.div
          className="mt-24 flex justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={titleInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 1 }}
        >
          <motion.div
            className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            animate={{
              scaleX: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
};
