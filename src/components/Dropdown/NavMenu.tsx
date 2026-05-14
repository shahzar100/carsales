"use client";
import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface NavMenuProps {
  children: React.ReactNode;
  title: string;
}

const NavMenu: React.FC<NavMenuProps> = ({ children, title }) => {
  const [menu, setMenu] = useState(false);

  // Body scroll lock is shared via useScrollLock so it cooperates with
  // Modal/ConfirmDialog overlays — closing one no longer unlocks the body
  // while another is still open.
  useScrollLock(menu);

  return (
    <>
      {/* Single entry point at every breakpoint — the nav links live
          inside this dropdown rather than spilling across the header bar. */}
      <button
        onClick={() => setMenu(!menu)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-200 shadow-sm transition-colors duration-200 hover:bg-white/10"
        aria-label="Toggle menu"
        aria-expanded={menu}
      >
        <Menu size={20} />
        <span className="hidden sm:inline">{title}</span>
      </button>
      {menu && (
        <div className="fixed top-0 right-0 z-50 h-screen w-screen overflow-y-auto bg-black shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-6">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {title}
            </h2>
            <button
              onClick={() => setMenu(false)}
              className="rounded-full bg-gray-800 p-3 text-gray-200 shadow-sm transition-colors duration-200 hover:bg-gray-700"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mx-auto flex max-w-4xl flex-col px-4 py-6 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default NavMenu;
