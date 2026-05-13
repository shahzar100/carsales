"use client";
import React from "react";
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
    <div className="bk-continue-row">
      <div className="bk-continue-summary">
        <div className="bk-continue-icon">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="lbl">{label}</div>
          <div className="val">{value}</div>
        </div>
      </div>
      <button
        type="button"
        className="bk-continue-btn"
        onClick={onContinue}
        disabled={disabled}
      >
        {buttonLabel}
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
