import React from "react";
import { LucideIcon } from "lucide-react";

interface PrimaryButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  color?: boolean;
  padding?: string;
  custom?: string;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text,
  onClick,
  disabled = false,
  color = true,
  padding,
  custom,
  icon: Icon,
  variant = "primary",
  size = "md",
}) => {
  const baseClasses =
    "flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const disabledClasses =
    "bg-opacity-50 cursor-not-allowed hover:shadow-none hover:bg-opacity-50";

  const finalPadding = padding || sizeClasses[size];
  const finalWidth = custom || "w-full";
  const colorClasses = color
    ? variantClasses[variant]
    : "bg-gray-300 text-gray-700";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${colorClasses}
        ${finalPadding}
        ${finalWidth}
        ${disabled ? disabledClasses : ""}
      `.trim()}
    >
      {Icon && <Icon size={20} />}
      {text}
    </button>
  );
};

export default PrimaryButton;
