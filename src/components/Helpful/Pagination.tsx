"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** e.g. "Showing 1–10 of 50 vehicles" */
  showingLabel?: string;
  /** Whether page changes scroll to top */
  scrollToTop?: boolean;
  /** Items-per-page selector (admin use) */
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
  itemsPerPageOptions?: number[];
  /** Total item count for the "Showing X of Y" info */
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
}

/** Generates smart page number array with ellipsis */
function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }
  }
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showingLabel,
  scrollToTop = false,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 25, 50],
  totalItems,
  startIndex,
  endIndex,
}) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    onPageChange(page);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      {/* Left side — info */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        {itemsPerPage !== undefined && onItemsPerPageChange && (
          <>
            <span className="font-medium">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="font-medium">per page</span>
            <span className="mx-2 text-gray-300">|</span>
          </>
        )}
        {showingLabel ? (
          <span className="text-sm text-gray-500">{showingLabel}</span>
        ) : totalItems !== undefined &&
          startIndex !== undefined &&
          endIndex !== undefined ? (
          <span className="rounded-md bg-gray-100 px-3 py-1 text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {startIndex + 1}–{Math.min(endIndex, totalItems)}
            </span>{" "}
            of <span className="font-semibold text-gray-800">{totalItems}</span>
          </span>
        ) : null}
      </div>

      {/* Right side — controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous */}
        <motion.button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          whileHover={currentPage === 1 ? undefined : { scale: 1.05, x: -2 }}
          whileTap={currentPage === 1 ? undefined : { scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 20 }}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-gray-400">
                ···
              </span>
            ) : (
              <motion.button
                key={page}
                onClick={() => handlePageChange(page as number)}
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 460, damping: 22 }}
                className={`relative min-w-10 rounded-lg px-3 py-2 text-sm font-semibold ${
                  currentPage === page
                    ? "text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
                }`}
              >
                {currentPage === page && (
                  <motion.span
                    layoutId="pagination-active"
                    transition={{ type: "spring", stiffness: 460, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-red-600 shadow-md"
                  />
                )}
                <span className="relative">{page}</span>
              </motion.button>
            )
          )}
        </div>

        {/* Next */}
        <motion.button
          onClick={() =>
            handlePageChange(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage === totalPages}
          whileHover={currentPage === totalPages ? undefined : { scale: 1.05, x: 2 }}
          whileTap={currentPage === totalPages ? undefined : { scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 20 }}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default Pagination;
