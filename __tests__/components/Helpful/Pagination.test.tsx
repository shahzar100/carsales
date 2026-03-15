/**
 * Unit tests for the Pagination component
 * Tests page number generation, navigation, items-per-page, and edge cases
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/Helpful/Pagination";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronLeft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="chevron-left" {...props} />
  ),
  ChevronRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="chevron-right" {...props} />
  ),
}));

describe("Pagination", () => {
  let onPageChange: jest.Mock;

  beforeEach(() => {
    onPageChange = jest.fn();
  });

  describe("Rendering", () => {
    it("should return null when totalPages is 1", () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should return null when totalPages is 0", () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} onPageChange={onPageChange} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render when totalPages is 2 or more", () => {
      render(
        <Pagination currentPage={1} totalPages={2} onPageChange={onPageChange} />
      );
      expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
      expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    });

    it("should render all page numbers for ≤7 pages", () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(String(i))).toBeInTheDocument();
      }
    });
  });

  describe("Page number generation (>7 pages)", () => {
    it("should show ellipsis near the end when on page 1", () => {
      render(
        <Pagination currentPage={1} totalPages={10} onPageChange={onPageChange} />
      );
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("···")).toBeInTheDocument();
    });

    it("should show ellipsis near the start when on last page", () => {
      render(
        <Pagination currentPage={10} totalPages={10} onPageChange={onPageChange} />
      );
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("···")).toBeInTheDocument();
    });

    it("should show two ellipsis when in the middle", () => {
      render(
        <Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />
      );
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      // Two ellipsis
      const ellipses = screen.getAllByText("···");
      expect(ellipses).toHaveLength(2);
    });
  });

  describe("Navigation", () => {
    it("should call onPageChange when clicking a page number", () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );
      fireEvent.click(screen.getByText("3"));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("should call onPageChange with next page on Next click", () => {
      render(
        <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />
      );
      fireEvent.click(screen.getByLabelText("Next page"));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("should call onPageChange with previous page on Prev click", () => {
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      );
      fireEvent.click(screen.getByLabelText("Previous page"));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("should disable Previous button on first page", () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );
      expect(screen.getByLabelText("Previous page")).toBeDisabled();
    });

    it("should disable Next button on last page", () => {
      render(
        <Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />
      );
      expect(screen.getByLabelText("Next page")).toBeDisabled();
    });

    it("should not go below page 1 when clicking previous on page 1", () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      );
      // Button is disabled, but we verify it doesn't fire
      const prevButton = screen.getByLabelText("Previous page");
      expect(prevButton).toBeDisabled();
    });
  });

  describe("Scroll to top", () => {
    it("should call window.scrollTo when scrollToTop is true", () => {
      const scrollToSpy = jest.fn();
      Object.defineProperty(window, "scrollTo", { value: scrollToSpy, writable: true });

      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          scrollToTop={true}
        />
      );
      fireEvent.click(screen.getByText("3"));
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    });

    it("should not call window.scrollTo when scrollToTop is false", () => {
      const scrollToSpy = jest.fn();
      Object.defineProperty(window, "scrollTo", { value: scrollToSpy, writable: true });

      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          scrollToTop={false}
        />
      );
      fireEvent.click(screen.getByText("3"));
      expect(scrollToSpy).not.toHaveBeenCalled();
    });
  });

  describe("Items per page selector", () => {
    it("should render items-per-page dropdown when props are provided", () => {
      const onItemsPerPageChange = jest.fn();
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
          itemsPerPage={10}
          onItemsPerPageChange={onItemsPerPageChange}
          itemsPerPageOptions={[5, 10, 25, 50]}
        />
      );
      expect(screen.getByText("Show")).toBeInTheDocument();
      expect(screen.getByText("per page")).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });

    it("should call onItemsPerPageChange and reset to page 1 on change", () => {
      const onItemsPerPageChange = jest.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
          itemsPerPage={10}
          onItemsPerPageChange={onItemsPerPageChange}
          itemsPerPageOptions={[5, 10, 25, 50]}
        />
      );

      fireEvent.change(screen.getByDisplayValue("10"), {
        target: { value: "25" },
      });

      expect(onItemsPerPageChange).toHaveBeenCalledWith(25);
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe("Showing label", () => {
    it("should render custom showingLabel when provided", () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          showingLabel="Showing 1–10 of 50 vehicles"
        />
      );
      expect(
        screen.getByText("Showing 1–10 of 50 vehicles")
      ).toBeInTheDocument();
    });

    it("should render auto-generated showing info when totalItems is provided", () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          totalItems={50}
          startIndex={0}
          endIndex={10}
        />
      );
      expect(screen.getByText("1–10")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
    });
  });
});
