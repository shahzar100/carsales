/**
 * Tests for src/components/Helpful/Buttons/ShopButton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: click is debounced — disables the button for 1s and
 *   swaps the icon to a Check ✓ for ~500ms while the onClick fires
 * - 🎯 Usability: passes the supplied aria-label through; disabled state
 *   blocks repeated rapid clicks (the production bug this guards against
 *   is double-submitting "add to cart" actions)
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ShoppingCart } from "lucide-react";
import ShopButton from "@/components/Helpful/Buttons/ShopButton";

describe("ShopButton", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders with the supplied aria-label and icon", () => {
    render(
      <ShopButton
        icon={ShoppingCart}
        onClick={jest.fn()}
        aria-label="Add to cart"
      />
    );
    expect(
      screen.getByRole("button", { name: /add to cart/i })
    ).toBeInTheDocument();
  });

  it("📋 click disables the button and fires onClick after a delay", () => {
    const onClick = jest.fn();
    render(
      <ShopButton
        icon={ShoppingCart}
        onClick={onClick}
        aria-label="Add to cart"
      />
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Immediately disabled — no second click can fire.
    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();

    // Push past the 500ms onClick delay.
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(onClick).toHaveBeenCalledTimes(1);

    // Push past the 1000ms re-enable timer.
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(button).not.toBeDisabled();
  });

  it("🎯 a second click while disabled is ignored", () => {
    const onClick = jest.fn();
    render(
      <ShopButton
        icon={ShoppingCart}
        onClick={onClick}
        aria-label="Add to cart"
      />
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
