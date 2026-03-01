/**
 * MAINFORM COMPONENT TESTS
 * Tests the top-level form switcher:
 *  - Renders the type dropdown with all 4 options
 *  - Conditionally renders the correct form for each type
 *  - Shows no form when no type is selected
 */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MainForm from "@/components/Admin/Form/MainForm";

// Mock fetch globally for sub-forms that use it
global.fetch = jest.fn();

describe("MainForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(cleanup);

  // ── Initial Render ─────────────────────────────────────────
  describe("Initial Render", () => {
    it("renders the Type dropdown", () => {
      render(<MainForm />);
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Select Type")).toBeInTheDocument();
    });

    it("does not render any form before a type is selected", () => {
      render(<MainForm />);
      // None of the form step titles should be visible
      expect(screen.queryByText("Basic Information")).not.toBeInTheDocument();
      expect(screen.queryByText("Customer Details")).not.toBeInTheDocument();
      expect(screen.queryByText("Account Details")).not.toBeInTheDocument();
      expect(screen.queryByText("Choose Action")).not.toBeInTheDocument();
    });
  });

  // ── Type Selection ─────────────────────────────────────────
  describe("Type Selection", () => {
    it("shows all 4 options in the dropdown", async () => {
      const user = userEvent.setup();
      render(<MainForm />);

      await user.click(screen.getByText("Select Type"));

      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText("Car")).toBeInTheDocument();
      expect(screen.getByText("Appointment")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();
    });

    it("renders CarForm when Car is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);

      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Car"));

      // CarForm step 1 title
      expect(screen.getByText("Basic Information")).toBeInTheDocument();
    });

    it("renders AppointmentForm when Appointment is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);

      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Appointment"));

      // AppointmentForm step 1 title
      expect(screen.getByText("Customer Details")).toBeInTheDocument();
    });

    it("renders UserForm when User is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);

      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("User"));

      // UserForm step 1 title
      expect(screen.getByText("Account Details")).toBeInTheDocument();
    });

    it("renders PasswordForm when Password is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);

      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Password"));

      // PasswordForm step 1 title
      expect(screen.getByText("Choose Action")).toBeInTheDocument();
    });
  });

  // ── Switching Between Types ────────────────────────────────
  describe("Switching Between Types", () => {
    it("replaces the form when a different type is selected", async () => {
      const user = userEvent.setup();
      render(<MainForm />);

      // Select Car
      await user.click(screen.getByText("Select Type"));
      await user.click(screen.getByText("Car"));
      expect(screen.getByText("Basic Information")).toBeInTheDocument();

      // Switch to User
      await user.click(screen.getByText("Car")); // clicking the selected value opens dropdown
      await user.click(screen.getByText("User"));
      expect(screen.getByText("Account Details")).toBeInTheDocument();
      expect(screen.queryByText("Basic Information")).not.toBeInTheDocument();
    });
  });
});
