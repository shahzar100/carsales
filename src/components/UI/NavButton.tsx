"use client";

import React from "react";
import { useNavigation } from "@/backend/NavigationContext";
import { usePathname, useRouter } from "next/navigation";

interface NavButtonProps {
  href: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const NavButton: React.FC<NavButtonProps> = ({
  href,
  onClick,
  className = "",
  children,
}) => {
  const { setIsNavigating, setNavigationTarget } = useNavigation();
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Don't show loader if navigating to the same page
    if (href === pathname) {
      return;
    }

    // Execute custom onClick if provided
    if (onClick) {
      onClick();
    }

    // Start loading animation
    setIsNavigating(true);
    setNavigationTarget(href);

    // Navigate after a short delay
    setTimeout(() => {
      router.push(href);
    }, 100);
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

export default NavButton;
