import React, { Children } from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps {
  onClick: () => void;
  customWidth?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  disabled: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  customWidth,
  variant = "primary",
  disabled,
  children,
}) => {
  const baseClasses =
    "group text-base transition-all duration-200 rounded-lg p-2 disabled:hover:bg-gray-100 disabled:shadow-none disabled:cursor-not-allowed disabled:text-gray-300  flex justify-center items-center";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "text-gray-700 hover:text-blue-500 hover:bg-blue-100",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-transparent",
    outline: "border border-gray-300 hover:border-gray-400 text-gray-700",
  };

  return (
    <button
      disabled={disabled}
      className={`flex cursor-pointer items-center gap-4 ${baseClasses} ${
        variantClasses[variant]
      } ${customWidth || ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
