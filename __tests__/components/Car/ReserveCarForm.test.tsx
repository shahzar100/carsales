/**
 * Tests for src/components/Car/ReserveCarForm.tsx
 *
 * Standards coverage:
 * - 📋 Functional: prefill name + email from session; POST shape contains
 *   carId, customerInfo, notes (optional), turnstileToken; success state
 *   shows reference + expiry; "Reserving..." state during submission
 * - 🔒 Security: email field is `readOnly` (the API forces it to the
 *   account email anyway — visible field is just a confirmation); turnstile
 *   token threads through the POST body
 * - 🎯 Usability: server errors and network errors surface to the UI
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import ReserveCarForm from "@/components/Car/ReserveCarForm";

// The TurnstileWidget under test does real HTTP/script-tag work — stub it
// to a controlled element that calls back with a token so the surrounding
// form behaviour is what we're actually testing.
jest.mock("@/components/Form/TurnstileWidget", () => {
  return function MockTurnstile({
    onToken,
  }: {
    onToken: (token: string) => void;
  }) {
    return (
      <button
        type="button"
        data-testid="turnstile-stub"
        onClick={() => onToken("test-captcha-token")}
      >
        captcha
      </button>
    );
  };
});

const mockedUseSession = useSession as unknown as jest.Mock;

beforeEach(() => {
  mockedUseSession.mockReturnValue({
    data: { user: { name: "Jane Doe", email: "jane@example.com" } },
    status: "authenticated",
  });
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("ReserveCarForm", () => {
  it("prefills name and email from the signed-in session", () => {
    render(<ReserveCarForm carId="car-1" carLabel="Tesla Model 3" />);
    expect(
      (screen.getByLabelText(/your name/i) as HTMLInputElement).value
    ).toBe("Jane Doe");
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe(
      "jane@example.com"
    );
  });

  it("🔒 makes the email field read-only", () => {
    render(<ReserveCarForm carId="car-1" carLabel="Tesla Model 3" />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("readonly");
  });

  it("shows the car label in the intro copy", () => {
    render(<ReserveCarForm carId="car-1" carLabel="BMW 320d" />);
    expect(screen.getByText(/BMW 320d/i)).toBeInTheDocument();
  });

  it("📋 POSTs to /api/bookings/reservation with the structured payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          reservationReference: "RSV-ABC123",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      }),
    });
    const user = userEvent.setup();

    render(<ReserveCarForm carId="car-99" carLabel="Tesla Model 3" />);
    await user.type(screen.getByLabelText(/phone/i), "07700 900000");
    await user.type(
      screen.getByLabelText(/notes/i),
      "Best to call in the afternoon"
    );
    await user.click(screen.getByTestId("turnstile-stub"));
    await user.click(screen.getByRole("button", { name: /reserve this car/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/bookings/reservation");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      carId: "car-99",
      customerInfo: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "07700 900000",
      },
      notes: "Best to call in the afternoon",
      turnstileToken: "test-captcha-token",
    });
  });

  it("📋 omits notes from the payload when left blank", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          reservationReference: "RSV-X",
          expiresAt: new Date().toISOString(),
        },
      }),
    });
    const user = userEvent.setup();
    render(<ReserveCarForm carId="car-1" carLabel="x" />);
    await user.type(screen.getByLabelText(/phone/i), "07700 900000");
    await user.click(screen.getByRole("button", { name: /reserve this car/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );
    expect(body.notes).toBeUndefined();
  });

  it("✅ shows the success state with reference + expiry on 2xx", async () => {
    const expires = new Date(Date.now() + 86400000).toISOString();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { reservationReference: "RSV-ABC123", expiresAt: expires },
      }),
    });
    const user = userEvent.setup();
    render(<ReserveCarForm carId="car-1" carLabel="x" />);
    await user.type(screen.getByLabelText(/phone/i), "07700 900000");
    await user.click(screen.getByRole("button", { name: /reserve this car/i }));

    await waitFor(() =>
      expect(screen.getByText(/Reservation confirmed/i)).toBeInTheDocument()
    );
    expect(screen.getByText("RSV-ABC123")).toBeInTheDocument();
    expect(
      screen.getByText(/Reservation expires/i)
    ).toBeInTheDocument();
  });

  it("🎯 surfaces a server-supplied error message on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: "Car is already reserved",
      }),
    });
    const user = userEvent.setup();
    render(<ReserveCarForm carId="car-1" carLabel="x" />);
    await user.type(screen.getByLabelText(/phone/i), "07700 900000");
    await user.click(screen.getByRole("button", { name: /reserve this car/i }));

    await waitFor(() =>
      expect(screen.getByText(/Car is already reserved/)).toBeInTheDocument()
    );
  });

  it("🎯 surfaces a generic error message on network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(<ReserveCarForm carId="car-1" carLabel="x" />);
    await user.type(screen.getByLabelText(/phone/i), "07700 900000");
    await user.click(screen.getByRole("button", { name: /reserve this car/i }));

    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    );
  });

  it("disables the submit button and shows 'Reserving…' during submission", async () => {
    let resolve: (v: { ok: boolean; json: () => Promise<unknown> }) => void = () => {};
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    render(<ReserveCarForm carId="car-1" carLabel="x" />);
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "07700 900000" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /reserve this car/i }));

    await waitFor(() =>
      expect(screen.getByText(/reserving…/i)).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /reserving…/i })
    ).toBeDisabled();

    // Resolve to clean up the timer
    resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: { reservationReference: "x", expiresAt: new Date().toISOString() },
      }),
    });
  });
});
