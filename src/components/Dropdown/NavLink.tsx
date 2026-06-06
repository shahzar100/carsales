"use client";
import Link from "next/link";
import React from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import { usePathname } from "next/navigation";
import { ChevronDown, LucideIcon } from "lucide-react";
import { useNavMenuClose } from "@/components/Dropdown/NavMenu";

interface NavLinkProps {
  href: string;
  text: string;
  dropdown?: boolean;
  dropdownOnly?: boolean;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  text,
  dropdown = false,
  icon: Icon,
  children,
}) => {
  const { setIsNavigating, setNavigationTarget } = useNavigation();
  const closeMenu = useNavMenuClose();
  const pathname = usePathname();

  const baseClasses = dropdown
    ? "text-gray-200 hover:underline underline-offset-4 decoration-red-500 text-lg lg:text-sm font-semibold transition-all duration-200 hover:text-red-400 px-6 py-4 rounded-lg group-hover:bg-white/10 border-b border-gray-800 block w-full text-left"
    : "hover:underline underline-offset-4 decoration-red-500 text-sm font-medium transition-all duration-200 hover:text-red-400 py-2 px-6 rounded-md hover:bg-white/10 block w-full text-left text-gray-200 hover:text-red-400";

  const handleClick = () => {
    // Collapse the slide-out menu as soon as a link is tapped (no-op when this
    // NavLink isn't rendered inside a NavMenu).
    closeMenu();

    // Don't show loader if navigating to the same page
    if (href === pathname) {
      return;
    }

    // Start loading animation
    setIsNavigating(true);
    setNavigationTarget(text);
  };

  return (
    <div className="group relative">
      <Link
        href={href}
        className={`flex items-center gap-2 ${baseClasses}`}
        onClick={handleClick}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {text}
        {dropdown && (
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
        )}
      </Link>

      {dropdown && (
        <div className="z-70 block lg:absolute lg:top-full lg:left-1/2 lg:hidden lg:w-64 lg:-translate-x-1/2 lg:transform lg:pt-2 lg:group-hover:block">
          <div className="flex flex-col items-start border-b border-gray-800 bg-gray-900 px-6 py-4 lg:items-start lg:rounded-lg lg:border lg:border-gray-700 lg:bg-gray-900 lg:p-4 lg:shadow-lg">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavLink;
