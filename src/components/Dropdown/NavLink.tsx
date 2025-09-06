import Link from "next/link";
import React from "react";

interface NavLinkProps {
  href: string;
  text: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, text }) => {
  return (
    <Link
      href={href}
      className="hover:underline underline-offset-4 decoration-red-500 text-2xl lg:text-base"
    >
      {text}
    </Link>
  );
};

export default NavLink;
