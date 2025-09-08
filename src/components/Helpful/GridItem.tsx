import React, { ReactNode } from "react";

interface GridItemProps {
  children: ReactNode;
}

const GridItem: React.FC<GridItemProps> = ({ children }) => {
  return <div className={" grid border-4"}>{children}</div>;
};

export default GridItem;
