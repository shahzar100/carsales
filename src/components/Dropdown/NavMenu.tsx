"use client";
import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
      <motion.button
        onClick={() => setMenu(!menu)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 420, damping: 20 }}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-200 shadow-sm hover:bg-white/10"
        aria-label="Toggle menu"
        aria-expanded={menu}
      >
        <motion.span animate={{ rotate: menu ? 90 : 0 }} transition={{ type: "spring", stiffness: 360, damping: 20 }}>
          <Menu size={20} />
        </motion.span>
        <span className="hidden sm:inline">{title}</span>
      </motion.button>
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed top-0 right-0 z-50 h-screen w-screen overflow-y-auto bg-black shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="flex items-center justify-between border-b border-gray-800 bg-gray-900 p-6"
            >
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {title}
              </h2>
              <motion.button
                onClick={() => setMenu(false)}
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="rounded-full bg-gray-800 p-3 text-gray-200 shadow-sm hover:bg-gray-700"
                aria-label="Close menu"
              >
                <X size={20} />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.3 }}
              className="mx-auto flex max-w-4xl flex-col px-4 py-6 sm:px-6 md:px-8"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavMenu;
