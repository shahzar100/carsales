/**
 * Tests for src/components/Account/AccountDashboard.tsx
 *
 * Standards coverage:
 * - 📋 Functional: fetch /api/account/bookings on mount; pre-split data
 *   passes through to the right tab; ?tab=… query param hydrates the
 *   initial tab; tab switch updates the URL via router.replace
 * - 🎯 Usability: bookings-error banner shown when the fetch fails, but
 *   the dashboard still renders the Saved tab; greeting falls back to
 *   "there" when the user has no name
 * - 🔒 Security: signOut callbackUrl points home (no destination smuggling)
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signOut, useSession } from "next-auth/react";

const mockedSignOut = signOut as unknown as jest.Mock;
const mockedUseSession = useSession as unknown as jest.Mock;
const mockReplace = jest.fn();
let searchParamsValue: URLSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => searchParamsValue,
  usePathname: () => "/account",
}));

// SavedCarsList does its own server reconcile — neutralise it.
jest.mock("@/components/Account/SavedCarsList", () => ({
  __esModule: true,
  default: () => <div data-testid="saved-cars-list">saved cars</div>,
}));
// AccountSettings is a large component with its own network calls — neutralise.
jest.mock("@/components/Account/AccountSettings", () => ({
  __esModule: true,
  default: () => <div data-testid="account-settings">settings</div>,
}));
// EmailVerificationBanner makes its own /api/account/profile call —
// neutralise so we don't conflate its fetch with the dashboard's bookings fetch.
jest.mock("@/components/Account/EmailVerificationBanner", () => ({
  __esModule: true,
  default: () => null,
}));

import AccountDashboard from "@/components/Account/AccountDashboard";

let fetchMock: jest.Mock;

beforeEach(() => {
  searchParamsValue = new URLSearchParams();
  mockReplace.mockReset();
  mockedSignOut.mockReset();
  fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: { upcoming: [], history: [] },
    }),
  });
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  mockedUseSession.mockReturnValue({
    data: { user: { name: "Jane Doe", email: "jane@example.com" } },
    status: "authenticated",
  });
});

describe("AccountDashboard", () => {
  it("greets the user by first name", () => {
    render(
      <AccountDashboard
        user={{ name: "Jane Doe", email: "jane@example.com" }}
      />
    );
    expect(screen.getByText(/Hi, Jane/i)).toBeInTheDocument();
  });

  it("🎯 falls back to 'there' when the user has no name", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { email: "j@example.com", name: null } },
      status: "authenticated",
    });
    render(
      <AccountDashboard user={{ email: "j@example.com", name: null }} />
    );
    expect(screen.getByText(/Hi, there/i)).toBeInTheDocument();
  });

  it("prefers the live session name over the server-passed prop", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "Newer Name", email: "n@example.com" } },
      status: "authenticated",
    });
    render(
      <AccountDashboard user={{ name: "Older Name", email: "n@example.com" }} />
    );
    expect(screen.getByText(/Hi, Newer/i)).toBeInTheDocument();
  });

  it("📋 fetches /api/account/bookings on mount", async () => {
    render(
      <AccountDashboard
        user={{ name: "Jane", email: "j@example.com" }}
      />
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/account/bookings",
        expect.objectContaining({ cache: "no-store" })
      )
    );
  });

  it("📋 ?tab=upcoming hydrates the initial tab", async () => {
    searchParamsValue.set("tab", "upcoming");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          upcoming: [
            {
              kind: "service",
              reference: "BK-1",
              status: "pending",
              date: "2030-01-01",
              title: "Detailing",
            },
          ],
          history: [],
        },
      }),
    });
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    await waitFor(() =>
      expect(screen.getByText("Detailing")).toBeInTheDocument()
    );
  });

  it("📋 clicking a tab calls router.replace with the right ?tab= param", async () => {
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    fireEvent.click(screen.getByRole("tab", { name: /history/i }));
    expect(mockReplace).toHaveBeenCalledWith(
      "/account?tab=history",
      expect.objectContaining({ scroll: false })
    );
  });

  it("🎯 shows the bookings-error banner when the fetch returns non-2xx (and only on upcoming/history)", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false }),
    });
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    // Banner doesn't show on the Saved tab.
    expect(
      screen.queryByText(/we couldn't load your bookings/i)
    ).not.toBeInTheDocument();
    // Switch to Upcoming — the banner should appear.
    fireEvent.click(screen.getByRole("tab", { name: /upcoming/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/we couldn't load your bookings/i)
      ).toBeInTheDocument()
    );
  });

  it("🎯 still renders the Saved tab even when bookings fetch fails", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByTestId("saved-cars-list")).toBeInTheDocument();
  });

  it("📋 renders the Settings tab when ?tab=settings", () => {
    searchParamsValue.set("tab", "settings");
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    expect(screen.getByTestId("account-settings")).toBeInTheDocument();
  });

  it("ignores invalid ?tab= values and defaults to 'saved'", () => {
    searchParamsValue.set("tab", "not-a-real-tab");
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    expect(screen.getByTestId("saved-cars-list")).toBeInTheDocument();
  });

  it("📋 follows a ?tab= change that happens after mount (header deep links while already on /account)", async () => {
    // Start on the default Saved tab.
    const { rerender } = render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    expect(screen.getByTestId("saved-cars-list")).toBeInTheDocument();

    // Simulate clicking "Account settings" in the header dropdown while
    // already on /account: the URL gains ?tab=settings but the page never
    // remounts. Regression guard — when the tab was held in useState it
    // stayed stuck on Saved here, so every garage link looked identical.
    searchParamsValue = new URLSearchParams("tab=settings");
    rerender(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    expect(await screen.findByTestId("account-settings")).toBeInTheDocument();
    expect(screen.queryByTestId("saved-cars-list")).not.toBeInTheDocument();
  });

  it("🔒 Sign out calls signOut({ callbackUrl: '/' })", () => {
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("renders the upcoming/history counts in the tab labels", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          upcoming: [
            { kind: "service", reference: "BK-1", status: "p", date: "x", title: "x" },
            { kind: "service", reference: "BK-2", status: "p", date: "x", title: "x" },
          ],
          history: [
            { kind: "service", reference: "BK-3", status: "c", date: "x", title: "x" },
          ],
        },
      }),
    });
    render(
      <AccountDashboard user={{ name: "Jane", email: "j@example.com" }} />
    );
    // Wait for the count badges to attach to the tab labels.
    await waitFor(() => {
      const upcomingTab = screen.getByRole("tab", { name: /upcoming/i });
      const historyTab = screen.getByRole("tab", { name: /history/i });
      expect(upcomingTab.textContent).toContain("2");
      expect(historyTab.textContent).toContain("1");
    });
  });
});
