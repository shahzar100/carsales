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
    <div className="mb-8 md:mb-12">
      <h2 className="section-title mb-6 text-center md:mb-8">{title}</h2>
      <div
        className={`grid gap-6 ${
          columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PackageGrid;
