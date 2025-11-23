"use client";
import Link from "next/link";
import React from "react";
import { useNavigation } from "@/backend/NavigationContext";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  text: string;
  dropdown?: boolean;
  children?: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  text,
  dropdown = false,
  children,
}) => {
  const { setIsNavigating, setNavigationTarget } = useNavigation();
  const pathname = usePathname();

  const baseClasses = dropdown
    ? "text-gray-700 hover:underline underline-offset-4 decoration-red-500 text-lg lg:text-base font-semibold transition-all duration-200 hover:text-red-500 px-6 py-4 rounded-lg group-hover:bg-red-50 border-b border-gray-100 block w-full text-left"
    : "hover:underline underline-offset-4 decoration-red-500 text-base font-medium transition-all duration-200 hover:text-red-500 py-2 px-6 rounded-md hover:bg-red-50 block w-full text-left text-gray-700 hover:text-red-500";

  const handleClick = () => {
    // Don't show loader if navigating to the same page
    if (href === pathname) {
      return;
    }

    // Start loading animation
    setIsNavigating(true);
    setNavigationTarget(text);
  };

  return (
    <div className="group relative text-black">
      <Link href={href} className={baseClasses} onClick={handleClick}>
        {text}
      </Link>

      {dropdown && (
        <div className="z-70 block lg:absolute lg:top-full lg:left-1/2 lg:hidden lg:w-64 lg:-translate-x-1/2 lg:transform lg:pt-2 lg:group-hover:block">
          <div className="flex flex-col items-start border-b border-gray-100 bg-gray-50 px-6 py-4 lg:items-start lg:rounded-lg lg:border lg:border-gray-200 lg:bg-white lg:p-4 lg:shadow-lg">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavLink;
