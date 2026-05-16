/**
 * Tests for src/components/Shared/SearchBar.tsx
 *
 * Standards coverage:
 * - 📋 Functional: submit pushes /BrowseFleet?search=<trimmed>; empty
 *   submission pushes to /BrowseFleet (no query); hydrates initial value
 *   from URL `?search=` param so the user can refine without retyping
 * - 🎯 Usability: form has role="search" and the input has a sr-only label
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockPush = jest.fn();
let searchParamsValue: URLSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => searchParamsValue,
  usePathname: () => "/",
}));

import SearchBar from "@/components/Shared/SearchBar";

beforeEach(() => {
  mockPush.mockReset();
  searchParamsValue = new URLSearchParams();
});

describe("SearchBar", () => {
  it("renders a role=search form with an input and the supplied placeholder", () => {
    render(<SearchBar placeholder="Find a car..." />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Find a car...")).toBeInTheDocument();
  });

  it("📋 hydrates value from ?search= when the page already has one", () => {
    searchParamsValue.set("search", "Tesla");
    render(<SearchBar />);
    expect(
      (screen.getByRole("searchbox") as HTMLInputElement).value
    ).toBe("Tesla");
  });

  it("📋 pushes /BrowseFleet?search=<value> on submit", () => {
    render(<SearchBar />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "BMW" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(mockPush).toHaveBeenCalledWith("/BrowseFleet?search=BMW");
  });

  it("📋 trims the value before submitting", () => {
    render(<SearchBar />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "  Audi  " },
    });
    fireEvent.submit(
      screen.getByRole("searchbox").closest("form") as HTMLFormElement
    );
    expect(mockPush).toHaveBeenCalledWith("/BrowseFleet?search=Audi");
  });

  it("pushes /BrowseFleet (no query) when the value is empty or whitespace-only", () => {
    render(<SearchBar />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "   " },
    });
    fireEvent.submit(
      screen.getByRole("searchbox").closest("form") as HTMLFormElement
    );
    expect(mockPush).toHaveBeenCalledWith("/BrowseFleet");
  });

  it("🎯 the input has a screen-reader-only label", () => {
    render(<SearchBar />);
    expect(screen.getByLabelText("Search the fleet")).toBeInTheDocument();
  });
});
