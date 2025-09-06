import React, { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  columns?: number;
  gap?: string;
}

const Grid: React.FC<GridProps> = ({
  children,
  columns = 1,
  gap = "gap-6",
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div
      className={`grid ${
        gridCols[columns as keyof typeof gridCols] || "grid-cols-1"
      } ${gap} w-full py-6`}
    >
      {children}
    </div>
  );
};

export default Grid;
