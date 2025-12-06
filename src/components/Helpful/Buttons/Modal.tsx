import React, { useEffect } from "react";
import Button from "./Button";
import { X } from "lucide-react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const Modal = ({ children, onClose, size = "lg" }: ModalProps) => {
  const sizeClasses = {
    sm: "w-1/3 h-auto max-h-[60vh]",
    md: "w-1/2 h-1/2",
    lg: "w-2/3 h-2/3",
    xl: "w-4/5 h-4/5",
    full: "w-full h-full m-4",
  };
  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflowY = "hidden";

    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflowY = "";
    };
  }, []);
  return (
    <div className="fixed top-0 left-0 z-[1000] flex h-full w-full items-center justify-center bg-black/50">
      <div
        className={`overflow-y-scroll rounded-lg border bg-white p-8 ${sizeClasses[size]}`}
      >
        <Button disabled={false} onClick={onClose}>
          <X />
        </Button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
