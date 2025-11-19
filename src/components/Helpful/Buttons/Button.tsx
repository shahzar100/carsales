import React from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps {
  icon: LucideIcon;
  text?: string;
  onClick: () => void;
  customWidth?: string;
  variant?: "default" | "ghost" | "outline";
  disabled: boolean;
  iconPlacement: "left" | "right";
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
    "group text-base transition-all duration-200 hover:bg-gray-100 rounded-lg p-2";
  const variantClasses = {
    default: "text-gray-700 hover:text-gray-900",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-transparent",
    outline: "border border-gray-300 hover:border-gray-400 text-gray-700",
  };

  const size = iconSize === "small" ? 16 : iconSize === "medium" ? 30 : 40;

  return (
    <button
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${
        customWidth || ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {iconPlacement === "left" && <Icon size={size} />}
        <p>{text}</p>
        {iconPlacement === "right" && <Icon size={size} />}
      </div>
    </button>
  );
};

export default Button;
