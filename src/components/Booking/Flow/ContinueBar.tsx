"use client";
import React from "react";
import { motion } from "motion/react";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface ContinueBarProps {
  label: string;
  value: string;
  icon: LucideIcon;
  buttonLabel: string;
  onContinue: () => void;
  disabled?: boolean;
}

export default function ContinueBar({
  label,
  value,
  icon: Icon,
  buttonLabel,
  onContinue,
  disabled = false,
}: ContinueBarProps) {
  return (
    <motion.div
      className="bk-continue-row"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <div className="bk-continue-summary">
        <motion.div
          className="bk-continue-icon"
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 480, damping: 20, delay: 0.08 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div className="min-w-0">
          <div className="lbl">{label}</div>
          <motion.div
            key={value}
            className="val"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {value}
          </motion.div>
        </div>
      </div>
      <motion.button
        type="button"
        className="bk-continue-btn"
        onClick={onContinue}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 460, damping: 22 }}
      >
        {buttonLabel}
        <motion.span
          aria-hidden="true"
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
