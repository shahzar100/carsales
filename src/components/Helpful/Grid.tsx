import React, { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
}

const Grid: React.FC<GridProps> = ({ children }) => {
  return (
    <div className={`grid grid-cols-4 py-6 border-4 gap-8`}>{children}</div>
  );
};

export default Grid;
