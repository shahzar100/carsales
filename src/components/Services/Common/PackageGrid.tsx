import React from "react";

interface PackageGridProps {
  title: string;
  children: React.ReactNode;
  columns?: 2 | 3;
}

const PackageGrid: React.FC<PackageGridProps> = ({
  title,
  children,
  columns = 3,
}) => {
  return (
    <div className="relative right-1/2 left-1/2 -mr-[50vw] mb-8 -ml-[50vw] w-screen overflow-hidden bg-black px-4 py-16 md:mb-12 md:px-8 md:py-20">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/[0.04] blur-3xl" />
      </div>

      <div className="relative">
        <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-white md:mb-14 md:text-3xl">
          {title}
        </h2>
        <div
          className={`mx-auto grid max-w-7xl gap-6 lg:gap-8 ${
            columns === 2
              ? "md:max-w-5xl md:grid-cols-2"
              : "md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PackageGrid;
