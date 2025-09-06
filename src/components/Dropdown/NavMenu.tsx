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

  // // Handle click outside - close menu when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
  //       setMenu(false);
  //     }
  //   };

  //   if (menu) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [menu]);

  return (
    <>
      <div className="lg:flex gap-10 hidden">{children}</div>
      <button
        onClick={() => setMenu(!menu)}
        className="cursor-pointer lg:hidden "
      >
        <Menu size={24} />
      </button>
      {menu && (
        <div
          ref={menuRef}
          className="fixed top-0 right-0 w-screen h-screen lg:w-1/2 overflow-hidden z-40 bg-black"
        >
          <div className="flex justify-between items-center p-4">
            <h2> Title </h2>
            <button onClick={() => setMenu(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-10 justify-center items-center">
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default NavMenu;
