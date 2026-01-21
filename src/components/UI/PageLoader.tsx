"use client";

import { useNavigation } from "@/backend/NavigationContext";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Car } from "lucide-react";
import { motion } from "framer-motion";

const PageLoader = () => {
  const { isNavigating, setIsNavigating, navigationTarget } = useNavigation();
  const pathname = usePathname();

  useEffect(() => {
    // Stop loading when pathname changes (page loaded)
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 800); // Small delay for smooth transition

      return () => clearTimeout(timer);
    }
  }, [pathname, isNavigating, setIsNavigating]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        {/* Car Icon Animation */}
        <div className="relative mb-6">
          {/* Animated Car */}
          <div className="relative mx-auto h-16 w-64 overflow-hidden">
            <motion.div
              className="absolute h-12 w-12"
              animate={{ x: ["-48px", "256px"] }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <Car className="h-full w-full text-blue-600" />
            </motion.div>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-gray-600">
          {navigationTarget
            ? `Loading ${navigationTarget}`
            : "Taking you to your destination"}
        </p>

        {/* Progress Bar */}
        <div className="mx-auto mt-6 h-2 w-64 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            animate={{ width: ["0%", "100%"] }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
