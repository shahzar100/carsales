"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Animated FAQ accordion — replaces the native `<details>` pattern so
 * open/close uses a smooth height + opacity transition. Only one item is
 * open at a time to keep the visual focus tight.
 */
export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={item.question}
            initial={false}
            animate={{
              borderColor: isOpen ? "rgb(254 202 202)" : "rgb(229 231 235)",
              boxShadow: isOpen
                ? "0 4px 12px -4px rgba(0,0,0,0.08)"
                : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-xl border bg-white"
          >
            <motion.button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              whileTap={{ scale: 0.995 }}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-base font-semibold text-gray-900"
            >
              {item.question}
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0, color: isOpen ? "#ef4444" : "#9ca3af" }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}
                className="inline-flex shrink-0"
              >
                <ChevronDown size={18} />
              </motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-600">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
