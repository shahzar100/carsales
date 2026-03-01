"use client";
import { Menu, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface NavMenuProps {
  children: React.ReactNode;
  title: string;
}

const NavMenu: React.FC<NavMenuProps> = ({ children, title }) => {
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
      <div className="hidden max-w-5xl items-center justify-center gap-4 xl:flex">
        {children}
      </div>
      <button
        onClick={() => setMenu(!menu)}
        className="cursor-pointer rounded-lg border border-gray-200 p-3 shadow-sm transition-colors duration-200 hover:bg-gray-100 xl:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>
      {menu && (
        <>
          <div
            ref={menuRef}
            className="fixed top-0 right-0 z-50 h-screen w-screen overflow-y-auto bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-6">
              <h2 className="section-title"> {title} </h2>
              <button
                onClick={() => setMenu(false)}
                className="rounded-full bg-white p-3 shadow-sm transition-colors duration-200 hover:bg-gray-200"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mx-auto flex max-w-4xl flex-col px-4 py-6 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavMenu;
