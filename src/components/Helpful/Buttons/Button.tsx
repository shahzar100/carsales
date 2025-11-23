import React from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps {
  icon: LucideIcon;
  text?: string;
  onClick: () => void;
  customWidth?: string;
  variant?: "default" | "ghost" | "outline";
  disabled: boolean;
  iconPlacement?: "left" | "right";
  iconSize?: "small" | "medium" | "large";
}

const Button: React.FC<ButtonProps> = ({
  icon: Icon,
  text,
  onClick,
  customWidth,
  variant = "default",
  disabled,
  iconPlacement,
  iconSize,
}) => {
  const baseClasses =
    "group text-base transition-all duration-200 rounded-lg p-2 disabled:hover:bg-gray-100 disabled:shadow-none disabled:cursor-not-allowed disabled:text-gray-300  flex justify-center items-center";
  const variantClasses = {
    default: "text-gray-700 hover:text-blue-500 hover:bg-blue-100",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-transparent",
    outline: "border border-gray-300 hover:border-gray-400 text-gray-700",
  };

  const size = iconSize === "small" ? 16 : iconSize === "medium" ? 30 : 40;

  return (
    <button
      disabled={disabled}
      className={`flex cursor-pointer items-center gap-4 ${baseClasses} ${
        variantClasses[variant]
      } ${customWidth || ""}`}
      onClick={onClick}
    >
      {iconPlacement === "left" || (!iconPlacement && <Icon size={size} />)}
      {text && text.length > 0 && <p>{text}</p>}
      {iconPlacement === "right" && <Icon size={size} />}
    </button>
  );
};

export default Button;
