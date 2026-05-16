/**
 * Tests for src/components/Car/FinanceCalculator.tsx
 *
 * Standards coverage:
 * - 📋 Functional: amortised monthly = P·(r/12) / (1 - (1+r/12)^-n);
 *   0% APR fallback to even split; deposit slider, term select, APR slider
 *   all drive the computed result reactively
 * - 🎯 Usability: minimum 10% deposit hint shown; disclaimer present;
 *   "Get a finance quote" CTA encodes the inputs into the /Enquiry href
 *   so admins can see what numbers the customer was looking at
 * - 🔒 Security: indicative-only disclaimer prevents the calculator being
 *   read as a credit offer (regulatory hint, asserted here too)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// The result panel renders prices via an internal `AnimatedPrice` helper
// that springs from initial → target via `motion/react`'s `useSpring`.
// jsdom has no `requestAnimationFrame`-driven spring engine, so the
// displayed value stays at the initial value forever. Override the two
// motion hooks here so they pass values through synchronously — the
// numeric calculation itself is what we're testing.
jest.mock("motion/react", () => {
  const actual = jest.requireActual("motion/react");
  return {
    ...actual,
    useMotionValue: (initial: number) => {
      const ref = { current: initial };
      const subs: Array<(v: number) => void> = [];
      return {
        get: () => ref.current,
        set: (v: number) => {
          ref.current = v;
          subs.forEach((cb) => cb(v));
        },
        on: (_e: string, cb: (v: number) => void) => {
          subs.push(cb);
          // Fire once with the current value so initial display matches.
          cb(ref.current);
          return () => {
            const i = subs.indexOf(cb);
            if (i >= 0) subs.splice(i, 1);
          };
        },
      };
    },
    useSpring: (source: { get: () => number; on: (e: string, cb: (v: number) => void) => () => void }) =>
      source,
  };
});

import FinanceCalculator from "@/components/Car/FinanceCalculator";

// `formatPrice` renders the £ symbol via Intl.NumberFormat which can split
// the symbol from the digits across nodes — the result panel also has its
// own structure. Match against the container's flat text content to keep
// the assertions resilient to layout tweaks.
const flatText = (container: HTMLElement) =>
  container.textContent?.replace(/\s+/g, "") ?? "";

describe("FinanceCalculator", () => {
  it("defaults to a 10% deposit, 48-month term, 9.9% APR", () => {
    render(<FinanceCalculator price={20000} />);
    // 10% of 20000 = 2000
    expect(screen.getByLabelText(/deposit: £2,000/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox") as HTMLSelectElement
    ).toHaveValue("48");
    expect(screen.getByLabelText(/apr: 9\.9%/i)).toBeInTheDocument();
  });

  it("computes the standard amortised monthly payment formula", () => {
    // P = price - deposit = 18000; r = 9.9/100/12 ≈ 0.00825; n = 48
    // monthly = 18000 * 0.00825 / (1 - (1.00825)^-48) ≈ 455.79
    const { container } = render(<FinanceCalculator price={20000} />);
    // The displayed monthly is rounded to the nearest pound — accept any
    // value in [£454, £457] for floating-point tolerance.
    expect(flatText(container)).toMatch(/£45[4-7]/);
  });

  it("falls back to an even-split when APR is 0", () => {
    const { container } = render(<FinanceCalculator price={12000} />);
    const aprSlider = screen.getByLabelText(/apr/i);
    fireEvent.change(aprSlider, { target: { value: "0" } });
    // Deposit defaults to 10% (£1,200); principal = 10800; 10800/48 = 225/mo.
    const text = flatText(container);
    expect(text).toMatch(/£225/);
    expect(text).toMatch(/Interest:£0/);
  });

  it("returns 0/mo and total=deposit when principal is zero", () => {
    const { container } = render(<FinanceCalculator price={5000} />);
    const depositSlider = screen.getByLabelText(/deposit/i);
    fireEvent.change(depositSlider, { target: { value: "5000" } });
    const text = flatText(container);
    expect(text).toMatch(/£0\/mo/);
    expect(text).toMatch(/Totalpayable:£5,000/);
    expect(text).toMatch(/Interest:£0/);
  });

  it("recomputes when the term changes (longer term → smaller monthly)", () => {
    const { container } = render(<FinanceCalculator price={20000} />);
    const monthlyAt48 = flatText(container).match(/£(\d+)\/mo/)?.[1];
    expect(monthlyAt48).toBeDefined();

    const termSelect = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(termSelect, { target: { value: "72" } });

    const monthlyAt72 = flatText(container).match(/£(\d+)\/mo/)?.[1];
    expect(monthlyAt72).toBeDefined();
    expect(Number(monthlyAt72)).toBeLessThan(Number(monthlyAt48));
  });

  it("recomputes when the deposit changes", () => {
    render(<FinanceCalculator price={30000} />);
    const depositSlider = screen.getByLabelText(/deposit/i);
    fireEvent.change(depositSlider, { target: { value: "10000" } });
    expect(screen.getByLabelText(/deposit: £10,000/i)).toBeInTheDocument();
  });

  it("clamps principal to 0 when deposit exceeds price (defensive)", () => {
    render(<FinanceCalculator price={1000} />);
    const depositSlider = screen.getByLabelText(/deposit/i);
    // The slider max is the price, but we override the value defensively.
    fireEvent.change(depositSlider, { target: { value: "9999" } });
    // No negative principal, no NaN — monthly should resolve to £0.
    const monthlyText = screen
      .getAllByText(/£\d+/)
      .map((e) => e.textContent)
      .join(" ");
    expect(monthlyText).not.toMatch(/-/);
  });

  it("📋 encodes price/deposit/term/apr into the /Enquiry CTA href", () => {
    render(<FinanceCalculator price={20000} />);
    const cta = screen.getByText(/get a finance quote/i).closest("a");
    expect(cta).toBeTruthy();
    const href = cta!.getAttribute("href") ?? "";
    expect(href).toContain("/Enquiry?");
    expect(href).toContain("price=20000");
    expect(href).toContain("deposit=2000");
    expect(href).toContain("term=48");
    expect(href).toContain("apr=9.9");
    expect(href).toContain("subject=Finance%20quote%20request");
  });

  it("🎯 shows the minimum-10% deposit recommendation", () => {
    render(<FinanceCalculator price={20000} />);
    expect(
      screen.getByText(/Minimum 10% recommended/i)
    ).toBeInTheDocument();
  });

  it("🔒 renders the 'estimates only, not a credit offer' disclaimer", () => {
    render(<FinanceCalculator price={20000} />);
    expect(
      screen.getByText(/don't constitute a credit offer/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Finance is subject to status/i)
    ).toBeInTheDocument();
  });

  it("displays interest as 0 when APR is 0 (no negative interest from rounding)", () => {
    const { container } = render(<FinanceCalculator price={20000} />);
    const aprSlider = screen.getByLabelText(/apr/i);
    fireEvent.change(aprSlider, { target: { value: "0" } });
    expect(flatText(container)).toMatch(/Interest:£0/);
  });
});
