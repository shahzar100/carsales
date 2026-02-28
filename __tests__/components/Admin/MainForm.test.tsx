/**
 * MAINFORM COMPONENT TESTS
 * Tests the top-level form switcher:
 *  - Initial render shows the type dropdown
 *  - All 4 options (User, Car, Appointment, Password) are accessible
 *  - Selecting each option renders the correct child form
 *  - Switching between types works correctly
 */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MainForm from "@/components/Admin/Form/MainForm";

// Mock scrollIntoView (used by Dropdown, not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

// ── Mock child forms so we don't test them here ──────────────
jest.mock("@/components/Admin/Form/CarForm", () => {
  return function MockCarForm() {
    return <div data-testid="car-form">CarForm</div>;
  };
});
jest.mock("@/components/Admin/Form/AppointmentForm", () => {
  return function MockAppointmentForm() {
    return <div data-testid="appointment-form">AppointmentForm</div>;
  };
});
jest.mock("@/components/Admin/Form/UserForm", () => {
  return function MockUserForm() {
    return <div data-testid="user-form">UserForm</div>;
  };
});
jest.mock("@/components/Admin/Form/PasswordForm", () => {
  return function MockPasswordForm() {
    return <div data-testid="password-form">PasswordForm</div>;
  };
});

describe("MainForm Component", () => {
  afterEach(cleanup);

  // ── Initial Render ─────────────────────────────────────────
  describe("Initial Render", () => {
    it("shows the Type dropdown with placeholder", () => {
      render(<MainForm />);
      expect(screen.getByText("Select Type")).toBeInTheDocument();
    });

    it("does not render any child form initially", () => {
      render(<MainForm />);
      expect(screen.queryByTestId("car-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("appointment-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("user-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("password-form")).not.toBeInTheDocument();
    });
  });

  // ── Dropdown Options ───────────────────────────────────────
  describe("Dropdown Options", () => {
    it("shows all 4 options when dropdown is opened", async () => {
      const user = userEvent.setup();
      render(<MainForm />);
      await user.click(screen.getByText("Select Type"));

      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText("Car")).toBeInTheDocument();
      expect(screen.getByText("Appointment")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();
    });
  });

  // ── Form Selection ─────────────────────────────────────────
  describe("Form Selection", () => {
    it("renders CarForm when Car is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);
      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Car"));
      expect(screen.getByTestId("car-form")).toBeInTheDocument();
    });

    it("renders AppointmentForm when Appointment is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);
      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Appointment"));
      expect(screen.getByTestId("appointment-form")).toBeInTheDocument();
    });

    it("renders UserForm when User is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);
      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("User"));
      expect(screen.getByTestId("user-form")).toBeInTheDocument();
    });

    it("renders PasswordForm when Password is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);
      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Password"));
      expect(screen.getByTestId("password-form")).toBeInTheDocument();
    });
  });

  // ── Switching Forms ────────────────────────────────────────
  describe("Switching Between Forms", () => {
    it("unmounts previous form when switching types", async () => {
      const user = userEvent.setup();
      render(<MainForm />);

      // Select Car
      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Car"));
      expect(screen.getByTestId("car-form")).toBeInTheDocument();

      // Switch to User
      await user.click(screen.getByText("Car")); // opens dropdown (shows current value)
      await user.click(screen.getByText("User"));

      expect(screen.queryByTestId("car-form")).not.toBeInTheDocument();
      expect(screen.getByTestId("user-form")).toBeInTheDocument();
    });
  });
});
