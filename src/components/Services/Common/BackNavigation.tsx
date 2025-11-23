import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackNavigationProps {
  href: string;
  text: string;
}

const BackNavigation: React.FC<BackNavigationProps> = ({ href, text }) => {
  return (
    <div className="mb-6">
      <Link
        href={href}
        className="inline-flex items-center font-medium text-red-600 hover:text-red-700"
      >
        <ArrowLeft size={20} className="mr-2" />
        {text}
      </Link>
    </div>
  );
};

export default BackNavigation;
