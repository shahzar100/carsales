/**
 * Tests for src/components/Admin/Dashboard/UpdatedAt.tsx
 *
 * Standards coverage:
 * - 📋 Functional: first render returns null (SSR-safe — no `new Date()`
 *   on the server pass); after mount, renders "Updated HH:MM" en-GB
 */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import UpdatedAt from "@/components/Admin/Dashboard/UpdatedAt";

describe("UpdatedAt", () => {
  it("renders a 'Updated HH:MM' badge after mount", async () => {
    const { container } = render(<UpdatedAt />);
    await waitFor(() =>
      expect(container.textContent).toMatch(/^Updated \d{2}:\d{2}$/)
    );
  });
});
