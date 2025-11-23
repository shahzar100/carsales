import React, { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";

interface ShopButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  size?: string;
  color?: string;
  iconSize?: number;
}

const ShopButton: React.FC<ShopButtonProps> = ({
  icon: Icon,
  onClick,
  size,
  color = "bg-blue-600 hover:bg-blue-700",
  iconSize = 24,
}) => {
  const [isSwapping, setIsSwapping] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleButtonClick = () => {
    if (isDisabled) return; // Prevent multiple clicks while disabled
    setIsDisabled(true); // Disable the button

    setIsSwapping(true);

    setTimeout(() => {
      setIsSwapping(false);
      setIsDisabled(false); // Re-enable the button after animation completes
    }, 1000); // Swap back to normal state after 1 second

    // Execute the provided onClick function after 500 milliseconds
    setTimeout(() => {
      onClick();
    }, 500);
  };

  return (
    <motion.button
      onClick={handleButtonClick}
      className={`${
        size || "h-20 w-20"
      } ${color} flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none`}
      disabled={isDisabled}
      initial={{ scale: 1 }}
      animate={{ scale: isSwapping ? 1.2 : 1 }}
      transition={{ duration: 0.1 }}
    >
      {isSwapping ? <Check size={iconSize} /> : <Icon size={iconSize} />}
    </motion.button>
  );
};

export default ShopButton;
