"use client";
import { Menu, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface NavMenuProps {
  children: React.ReactNode;
}

const NavMenu: React.FC<NavMenuProps> = ({ children }) => {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle screen resize - close menu when screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && menu) {
        // lg breakpoint is 1024px
        setMenu(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menu]);

  // Handle body scroll lock when menu is open
  useEffect(() => {
    if (menu) {
      // Lock body scroll
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px"; // Prevent layout shift
    } else {
      // Unlock body scroll
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [menu]);

  return (
    <>
      <div className="hidden lg:flex max-w-5xl items-center justify-center">
        {children}
      </div>
      <button
        onClick={() => setMenu(!menu)}
        className="cursor-pointer lg:hidden p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200 shadow-sm"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>
      {menu && (
        <>
          <div
            ref={menuRef}
            className="fixed top-0 right-0 w-screen h-screen overflow-y-auto z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900"> Title </h2>
              <button
                onClick={() => setMenu(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 bg-white shadow-sm"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col py-6 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavMenu;
