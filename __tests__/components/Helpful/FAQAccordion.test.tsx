/**
 * Tests for src/components/Helpful/FAQAccordion.tsx
 *
 * Standards coverage:
 * - 📋 Functional: starts fully collapsed (no answers visible); clicking
 *   a question expands only that item and sets aria-expanded=true;
 *   clicking again collapses; clicking a different question switches
 *   which one is open (single-open semantics).
 * - ♿ A11y: aria-expanded reflects state per item.
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FAQAccordion, { type FAQItem } from "@/components/Helpful/FAQAccordion";

const items: FAQItem[] = [
  { question: "What is X?", answer: "X is a thing." },
  { question: "How does Y work?", answer: "Y works like this." },
  { question: "When is Z?", answer: "Z is in March." },
];

describe("FAQAccordion", () => {
  it("📋 renders all question buttons, all initially collapsed", () => {
    render(<FAQAccordion items={items} />);

    items.forEach((item) => {
      expect(
        screen.getByRole("button", { name: item.question })
      ).toBeInTheDocument();
    });

    // All aria-expanded=false.
    const buttons = screen.getAllByRole("button");
    buttons.forEach((b) => expect(b).toHaveAttribute("aria-expanded", "false"));
    // No answer text in the DOM yet.
    expect(screen.queryByText("X is a thing.")).not.toBeInTheDocument();
  });

  it("📋 clicking a question expands it (answer visible + aria-expanded)", () => {
    render(<FAQAccordion items={items} />);
    const btn = screen.getByRole("button", { name: "What is X?" });
    act(() => {
      fireEvent.click(btn);
    });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("X is a thing.")).toBeInTheDocument();
  });

  it("📋 clicking again collapses the open item", () => {
    render(<FAQAccordion items={items} />);
    const btn = screen.getByRole("button", { name: "What is X?" });
    act(() => {
      fireEvent.click(btn);
    });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    act(() => {
      fireEvent.click(btn);
    });
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("📋 opening a different question closes the previous one (single-open)", () => {
    render(<FAQAccordion items={items} />);

    const first = screen.getByRole("button", { name: "What is X?" });
    const second = screen.getByRole("button", { name: "How does Y work?" });

    act(() => {
      fireEvent.click(first);
    });
    expect(first).toHaveAttribute("aria-expanded", "true");

    act(() => {
      fireEvent.click(second);
    });
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Y works like this.")).toBeInTheDocument();
  });

  it("📋 empty items array renders no question buttons", () => {
    render(<FAQAccordion items={[]} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
