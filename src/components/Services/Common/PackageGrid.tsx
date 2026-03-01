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
    <div className="mb-12">
      <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
        {title}
      </h2>
      <div
        className={`grid gap-6 ${
          columns === 2 ? "md:grid-cols-2" : "lg:grid-cols-3"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default PackageGrid;
