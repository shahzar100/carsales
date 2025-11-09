"use client";

import { useNavigation } from "@/backend/NavigationContext";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

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
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Car Icon Animation */}
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg
              className="w-full h-full text-blue-600 animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>

        {/* Loading Text */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h3>
        <p className="text-gray-600">
          {navigationTarget
            ? `Going to ${navigationTarget}`
            : "Taking you to your destination"}
        </p>

        {/* Progress Bar */}
        <div className="w-64 bg-gray-200 rounded-full h-2 mt-6 mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
