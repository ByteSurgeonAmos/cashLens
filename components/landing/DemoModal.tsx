"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PlayIcon } from "@heroicons/react/24/outline";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[80vh]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-2xl font-bold text-white">CashLens Demo</h3>
                <p className="text-gray-400 mt-1">
                  See how CashLens transforms your financial management
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Video Content */}
            <div className="relative aspect-video bg-slate-800">
              {/* Placeholder for actual video - replace with your demo video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <PlayIcon className="w-8 h-8 text-white ml-1" />
                  </motion.div>
                  <h4 className="text-xl font-semibold text-white mb-2">
                    Demo Video Coming Soon
                  </h4>
                  <p className="text-gray-400 max-w-md mx-auto">
                    We're creating an amazing demo video to showcase all the
                    powerful features of CashLens. In the meantime, sign up for
                    free to explore the app yourself!
                  </p>
                </div>
              </div>

              {/* You can replace the above with an actual video iframe like: */}
              {/* 
              <iframe
                src="YOUR_DEMO_VIDEO_URL"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              */}
            </div>

            {/* Demo Features Highlight */}
            <div className="p-6 bg-slate-800/50">
              <h4 className="text-lg font-semibold text-white mb-4">
                What you'll see in the demo:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "Smart Dashboard",
                    desc: "Real-time financial overview with beautiful charts",
                  },
                  {
                    title: "Transaction Tracking",
                    desc: "Easy expense and income management",
                  },
                  {
                    title: "Budget Planning",
                    desc: "Set and monitor budgets with smart alerts",
                  },
                  {
                    title: "Analytics & Reports",
                    desc: "Detailed insights into spending patterns",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-white">
                        {feature.title}
                      </h5>
                      <p className="text-gray-400 text-sm">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-t border-slate-700">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    Ready to get started?
                  </p>
                  <p className="text-gray-400 text-sm">
                    Join thousands of users managing their finances with
                    CashLens
                  </p>
                </div>
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    window.location.href = "/auth/signup";
                  }}
                >
                  Start Free Trial
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
