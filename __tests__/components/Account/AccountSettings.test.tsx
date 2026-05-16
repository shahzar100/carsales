/**
 * Tests for src/components/Account/AccountSettings.tsx
 *
 * Standards coverage:
 * - 📋 Functional: on-mount profile fetch; name save → PATCH +
 *   useSession.update(); password save handles both "set first password"
 *   (no currentPassword field) and "change existing" (current+new);
 *   delete-account confirmation flow with optimistic signOut on success
 * - 🔒 Security: hasPassword=true requires the current password before
 *   change; hasPassword=false form omits the currentPassword field so a
 *   stolen OAuth session can still set one — but the API is the ultimate
 *   gate
 * - 🎯 Usability: distinct success/error banners per card; load-error
 *   shows the global banner; loading state shown while profile resolves
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession, signOut } from "next-auth/react";

const mockedUseSession = useSession as unknown as jest.Mock;
const mockedSignOut = signOut as unknown as jest.Mock;
const mockUpdate = jest.fn();

beforeEach(() => {
  mockedUseSession.mockReturnValue({
    update: mockUpdate,
    data: { user: { name: "Jane", email: "j@example.com" } },
    status: "authenticated",
  });
  mockUpdate.mockReset();
  mockedSignOut.mockReset();
});

import AccountSettings from "@/components/Account/AccountSettings";

let fetchMock: jest.Mock;

function mockProfile(overrides: Record<string, unknown> = {}) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        name: "Jane",
        email: "j@example.com",
        hasPassword: true,
        emailVerified: true,
        ...overrides,
      },
    }),
  });
}

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("AccountSettings", () => {
  it("🎯 shows the loading state until the profile fetch resolves", () => {
    fetchMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AccountSettings />);
    expect(screen.getByText(/loading your settings/i)).toBeInTheDocument();
  });

  it("🎯 shows the global error banner when the profile lookup fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    render(<AccountSettings />);
    await waitFor(() =>
      expect(
        screen.getByText(/couldn't load your settings/i)
      ).toBeInTheDocument()
    );
  });

  it("📋 prefills the name input from the profile", async () => {
    mockProfile({ name: "Jane Original" });
    render(<AccountSettings />);
    await waitFor(() =>
      expect(
        (screen.getByLabelText(/display name/i) as HTMLInputElement).value
      ).toBe("Jane Original")
    );
  });

  it("📋 renders 'Change password' when hasPassword=true (with the current-password field)", async () => {
    mockProfile({ hasPassword: true });
    render(<AccountSettings />);
    await waitFor(() =>
      expect(
        screen.getAllByText(/change password/i).length
      ).toBeGreaterThan(0)
    );
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
  });

  it("📋 renders 'Set a password' when hasPassword=false (no current-password field)", async () => {
    mockProfile({ hasPassword: false });
    render(<AccountSettings />);
    // Wait for the dual heading/button copy to mount, then assert there's
    // no current-password input visible.
    await waitFor(() =>
      expect(
        screen.getAllByText(/set a password/i).length
      ).toBeGreaterThan(0)
    );
    expect(
      screen.queryByLabelText(/current password/i)
    ).not.toBeInTheDocument();
  });

  it("📋 Save name: PATCHes the profile then calls useSession.update", async () => {
    mockProfile({ name: "Old Name" });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { name: "New Name" } }),
    });

    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "New Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save name/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const patchCall = fetchMock.mock.calls[1];
    expect(patchCall[0]).toBe("/api/account/profile");
    expect(patchCall[1].method).toBe("PATCH");
    expect(JSON.parse(patchCall[1].body)).toEqual({ name: "New Name" });

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({ name: "New Name" })
    );
    expect(screen.getByText(/name updated/i)).toBeInTheDocument();
  });

  it("🎯 disables the Save-name button until the name actually changes", async () => {
    mockProfile({ name: "Same" });
    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /save name/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Changed" },
    });
    expect(screen.getByRole("button", { name: /save name/i })).not.toBeDisabled();
  });

  it("📋 Change password (hasPassword=true): POSTs currentPassword + newPassword", async () => {
    mockProfile({ hasPassword: true });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "current123" },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "new-secret-pw" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^change password$/i })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const pwCall = fetchMock.mock.calls[1];
    expect(pwCall[0]).toBe("/api/account/password");
    expect(pwCall[1].method).toBe("POST");
    expect(JSON.parse(pwCall[1].body)).toEqual({
      currentPassword: "current123",
      newPassword: "new-secret-pw",
    });
  });

  it("📋 Set password (hasPassword=false): omits currentPassword from the body", async () => {
    mockProfile({ hasPassword: false });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "first-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^set password$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({ newPassword: "first-password" });
    expect(body).not.toHaveProperty("currentPassword");
  });

  it("🎯 password card surfaces the server error message on success=false", async () => {
    mockProfile({ hasPassword: true });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: "Your current password is incorrect",
      }),
    });

    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "long-enough-pw" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^change password$/i })
    );

    await waitFor(() =>
      expect(
        screen.getByText(/your current password is incorrect/i)
      ).toBeInTheDocument()
    );
  });

  it("📋 Delete account: confirmation step, DELETE call, then signOut", async () => {
    mockProfile();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByText(/delete account/i)).toBeInTheDocument()
    );
    // First click — primer
    fireEvent.click(
      screen.getByRole("button", { name: /delete my account/i })
    );
    expect(
      screen.getByText(/are you sure\? this is permanent/i)
    ).toBeInTheDocument();
    // Second click — confirm
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete permanently/i })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/account",
        expect.objectContaining({ method: "DELETE" })
      )
    );
    await waitFor(() =>
      expect(mockedSignOut).toHaveBeenCalledWith({ callbackUrl: "/" })
    );
  });

  it("🎯 Delete account: surfaces the server error and DOES NOT sign out on failure", async () => {
    mockProfile();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: "Account couldn't be deleted right now.",
      }),
    });

    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByText(/delete account/i)).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getByRole("button", { name: /delete my account/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /yes, delete permanently/i })
    );

    await waitFor(() =>
      expect(
        screen.getByText(/account couldn't be deleted right now/i)
      ).toBeInTheDocument()
    );
    expect(mockedSignOut).not.toHaveBeenCalled();
  });

  it("Cancel button on the delete confirmation reverts to the primer state", async () => {
    mockProfile();
    render(<AccountSettings />);
    await waitFor(() =>
      expect(screen.getByText(/delete account/i)).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getByRole("button", { name: /delete my account/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(
      screen.queryByText(/are you sure\? this is permanent/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete my account/i })
    ).toBeInTheDocument();
  });
});
