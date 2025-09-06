import React, { ReactNode } from "react";

interface GridItemProps {
  children: ReactNode;
  onClick?: () => void;
  link?: string;
  size?: string;
  className?: string;
}

const GridItem: React.FC<GridItemProps> = ({
  children,
  onClick,
  link,
  size,
  className = "",
}) => {
  const baseClasses = `
    w-full 
    bg-white 
    rounded-xl 
    shadow-lg 
    hover:shadow-xl 
    transition-all 
    duration-300 
    gap-4 
    p-6 
    flex 
    flex-col 
    lg:flex-row 
    md:flex-row 
    ${size || "h-auto min-h-[350px]"} 
    flex-1 
    justify-between
    hover:scale-[1.02]
    cursor-pointer
    ${className}
  `
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div onClick={onClick} className={baseClasses}>
      {children}
    </div>
  );
};

export default GridItem;
