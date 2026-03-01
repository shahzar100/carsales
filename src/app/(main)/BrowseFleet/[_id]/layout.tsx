import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function CarLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
