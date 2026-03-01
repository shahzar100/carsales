import React from "react";

interface BlackRedSectionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-bleed black section with subtle red ambient glow.
 * Breaks out of parent padding to span edge-to-edge.
 * Use for key "standout" sections — alternate with white sections.
 */
const BlackRedSection: React.FC<BlackRedSectionProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen overflow-hidden bg-black px-4 py-14 md:px-8 md:py-20 ${className}`}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/[0.04] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl">{children}</div>
    </div>
  );
};

export default BlackRedSection;
