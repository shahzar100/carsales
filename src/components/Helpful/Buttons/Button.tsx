import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  onClick?: () => void;
  customWidth?: string;
  className?: string;
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  customWidth,
  className,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  type = "button",
  children,
}) => {
  const baseClasses =
    "group transition-all duration-200 rounded-lg disabled:shadow-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300 flex justify-center items-center gap-2 font-medium cursor-pointer";

  const variantClasses = {
    primary: "bg-red-600 text-white hover:bg-red-700",
    secondary: "text-gray-700 hover:text-red-500 hover:bg-red-100",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-transparent",
    outline:
      "border border-gray-300 hover:border-gray-400 text-gray-700 bg-white",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
  };

  const sizeClasses = {
    sm: "p-2 text-base",
    md: "py-2.5 px-5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${customWidth || ""} ${className || ""}`}
      onClick={onClick}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
