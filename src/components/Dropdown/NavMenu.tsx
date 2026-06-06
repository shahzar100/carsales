"use client";
import { ChevronDown, Menu, X } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface NavMenuProps {
  children: React.ReactNode;
  title: string;
}

// Lets a NavLink close the menu when tapped without prop-drilling through the
// children. Defaults to a no-op so NavLink stays usable outside a NavMenu
// (e.g. the per-row Actions dropdown in CarActions).
const NavMenuCloseContext = createContext<() => void>(() => {});
export const useNavMenuClose = () => useContext(NavMenuCloseContext);

const NavMenu: React.FC<NavMenuProps> = ({ children, title }) => {
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);

  // Mirror the customer header: on md+ this opens as an anchored click
  // dropdown, below md it falls back to the full-screen slide-out overlay.
  // matchMedia drives the branch so each variant only mounts when it's the
  // active one (the menu starts closed, so this is resolved before first paint
  // of either panel — no hydration mismatch).
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Body scroll lock is only correct for the full-screen mobile overlay —
  // locking the page behind a small desktop dropdown would be wrong (and the
  // customer dropdowns don't). Shared via useScrollLock so it cooperates with
  // Modal/ConfirmDialog overlays — closing one no longer unlocks the body
  // while another is still open.
  useScrollLock(menu && !isDesktop);

  // Desktop dropdown: close on outside-click. The container wraps the trigger
  // and the panel so clicks on either don't count as "outside".
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu || !isDesktop) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menu, isDesktop]);

  // Escape closes the menu at every breakpoint.
  useEffect(() => {
    if (!menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <div ref={containerRef} className="relative">
      {/* Single entry point at every breakpoint — the nav links live
          inside this dropdown rather than spilling across the header bar. */}
      <motion.button
        onClick={() => setMenu(!menu)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 420, damping: 20 }}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-200 shadow-sm hover:bg-white/10"
        aria-haspopup="menu"
        aria-label="Toggle menu"
        aria-expanded={menu}
      >
        <motion.span
          animate={{ rotate: menu ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 20 }}
        >
          <Menu size={20} />
        </motion.span>
        <span className="hidden sm:inline">{title}</span>
        <ChevronDown
          size={14}
          className={
            "hidden text-gray-400 transition-transform md:block " +
            (menu ? "rotate-180" : "")
          }
        />
      </motion.button>

      <AnimatePresence>
        {menu &&
          (isDesktop ? (
            /* ── Desktop: anchored click dropdown (md+) ── */
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 480,
                damping: 30,
                mass: 0.6,
              }}
              className="absolute top-full right-0 z-50 mt-2 flex max-h-[calc(100vh-6rem)] w-72 origin-top-right flex-col overflow-y-auto overscroll-contain rounded-xl border border-white/[0.08] bg-[#171717] p-1 shadow-2xl shadow-black/60 ring-1 ring-black/20"
            >
              <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">
                {title}
              </div>
              <NavMenuCloseContext.Provider value={closeMenu}>
                {children}
              </NavMenuCloseContext.Provider>
            </motion.div>
          ) : (
            /* ── Mobile: full-screen slide-out overlay (<md) ── */
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
                <NavMenuCloseContext.Provider value={closeMenu}>
                  {children}
                </NavMenuCloseContext.Provider>
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

export default NavMenu;
