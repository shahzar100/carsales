import Link from "next/link";
import React from "react";

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
  const baseClasses = dropdown
    ? "hover:underline underline-offset-4 decoration-red-500 text-lg lg:text-base font-semibold transition-all duration-200 hover:text-red-500 px-6 py-4 rounded-lg group-hover:bg-red-50 border-b border-gray-100 block w-full text-left"
    : "hover:underline underline-offset-4 decoration-red-500 text-base font-medium transition-all duration-200 hover:text-red-500 py-2 px-6 rounded-md hover:bg-red-50 block w-full text-left text-gray-700";

  return (
    <div className="group relative">
      <Link href={href} className={baseClasses}>
        {text}
      </Link>

      {dropdown && (
        <div className="block lg:group-hover:block lg:hidden lg:absolute lg:top-full lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:w-64 lg:pt-2">
          <div className="bg-gray-50 lg:bg-white lg:shadow-lg lg:rounded-lg lg:border lg:border-gray-200 lg:p-4 flex flex-col items-start lg:items-start px-6 py-4 border-b border-gray-100">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavLink;
