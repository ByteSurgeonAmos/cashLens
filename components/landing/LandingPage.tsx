"use client";

import React from "react";
import { motion } from "framer-motion";
import { FloatingIcons } from "../animations/FloatingIcons";
import { ParticleSystem } from "../animations/ParticleSystem";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { CTASection } from "./CTASection";

export const LandingPage: React.FC = () => {
  return (
    <motion.div
      className="relative min-h-screen bg-slate-900 overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Background Effects */}
      <ParticleSystem />
      <FloatingIcons />

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
    </motion.div>
  );
};
