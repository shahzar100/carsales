import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

// next/navigation — Header reads the router + pathname.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
}));

// next-auth — drives the Account panel's logged-in/out states.
const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));

// NavigationContext — Header feeds it on link clicks for PageLoader.
jest.mock("@/contexts/NavigationContext", () => ({
  useNavigation: () => ({
    setIsNavigating: jest.fn(),
    setNavigationTarget: jest.fn(),
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
  });

  it("renders the header banner", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the logo link pointing to home", () => {
    render(<Header />);
    const logoLink = screen.getByRole("link", { name: /home/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders the site search input", () => {
    render(<Header />);
    expect(
      screen.getByRole("searchbox", { name: /search make or model/i })
    ).toBeInTheDocument();
  });

  it("renders the primary Browse Cars call to action", () => {
    render(<Header />);
    const cta = screen.getAllByRole("link", { name: /browse cars/i })[0];
    expect(cta).toHaveAttribute("href", "/BrowseFleet");
  });

  it("exposes Account and Menu dropdown triggers", () => {
    render(<Header />);
    expect(
      screen.getByRole("button", { name: /account menu/i })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: /main menu/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the signed-in name when a session is present", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "James Whitfield", email: "j@morley.co.uk" } },
      status: "authenticated",
    });
    render(<Header />);
    expect(
      screen.getByRole("button", { name: /account menu for james whitfield/i })
    ).toBeInTheDocument();
  });
});
