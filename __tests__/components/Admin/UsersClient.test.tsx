/**
 * Tests for src/components/Admin/UsersClient.tsx — the access-management
 * client island.
 *
 * Standards coverage:
 * - 📋 Functional: renders the access-level explainer + roster; a role change
 *   PATCHes and toasts on success
 * - 🔒 Security/UX: admin sees role selects + Remove; manager does not (and
 *   gets the "only Admins can…" notice); the current user can't edit/remove
 *   themselves; the last admin is locked
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import type { AdminUserSummary } from "@/lib/interfaces";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const stableToast = {
  success: mockToastSuccess,
  error: mockToastError,
  info: jest.fn(),
  warning: jest.fn(),
  toasts: [] as unknown[],
  addToast: jest.fn(),
  removeToast: jest.fn(),
  clearAllToasts: jest.fn(),
};
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => stableToast,
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import UsersClient from "@/components/Admin/UsersClient";

const admin1: AdminUserSummary = {
  _id: "a1",
  username: "admin1",
  email: "admin1@example.com",
  role: "admin",
  twoFactorEnabled: true,
  pendingSetup: false,
};
const bob: AdminUserSummary = {
  _id: "b1",
  username: "bob",
  email: "bob@example.com",
  role: "manager",
  twoFactorEnabled: false,
  pendingSetup: true,
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("UsersClient — explainer + roster", () => {
  it("📋 always renders the access-level explainer", () => {
    render(
      <UsersClient
        initialUsers={[admin1, bob]}
        currentUsername="admin1"
        currentRole="admin"
      />
    );
    expect(screen.getByText("Access levels explained")).toBeInTheDocument();
    // Each role appears (explainer cards + badges).
    expect(screen.getAllByText("Staff").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Manager").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("🔒 admin sees role selects + Remove buttons; self row is locked", () => {
    render(
      <UsersClient
        initialUsers={[admin1, bob]}
        currentUsername="admin1"
        currentRole="admin"
      />
    );
    // One role select per roster row.
    const selects = screen.getAllByLabelText(/Access level for/);
    expect(selects).toHaveLength(2);

    // The current user's own row is marked and its controls disabled.
    expect(screen.getByText("(you)")).toBeInTheDocument();
    const ownSelect = screen.getByLabelText("Access level for admin1");
    expect(ownSelect).toBeDisabled();
    // admin1 is the only admin → also "last admin" locked note.
    expect(screen.getByText(/Last admin/)).toBeInTheDocument();
  });

  it("🔒 manager sees no role controls and the admin-only notice", () => {
    render(
      <UsersClient
        initialUsers={[admin1, bob]}
        currentUsername="bob"
        currentRole="manager"
      />
    );
    expect(screen.queryAllByLabelText(/Access level for/)).toHaveLength(0);
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    expect(
      screen.getByText(/can change access levels/i)
    ).toBeInTheDocument();
  });

  it("✅ changing a role PATCHes and toasts success", async () => {
    const fetchMock = jest.fn((url: string, opts?: RequestInit) => {
      if (opts?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: "ok" }),
        });
      }
      // GET refetch after the mutation
      return Promise.resolve({
        ok: true,
        json: async () => ({ users: [admin1, { ...bob, role: "staff" }] }),
      });
    });
    // @ts-expect-error partial fetch mock is fine for the test
    global.fetch = fetchMock;

    render(
      <UsersClient
        initialUsers={[admin1, bob]}
        currentUsername="admin1"
        currentRole="admin"
      />
    );

    fireEvent.change(screen.getByLabelText("Access level for bob"), {
      target: { value: "staff" },
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/users/b1",
        expect.objectContaining({ method: "PATCH" })
      )
    );
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
  });
});
