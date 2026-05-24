/**
 * Tests for src/components/Admin/Tabs/BusinessInfo/SocialMediaSection.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders three URL fields (FB/Twitter/IG), each edit
 *   merges into the socialMedia object via update().
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SocialMediaSection from "@/components/Admin/Tabs/BusinessInfo/SocialMediaSection";
import type { ShopInfo } from "@/lib/interfaces";

const baseShop = {
  socialMedia: {
    facebook: "https://facebook.com/mmcleeds",
    twitter: "",
    instagram: "https://instagram.com/mmcleeds",
  },
} as ShopInfo;

describe("SocialMediaSection", () => {
  it("📋 renders three labeled URL inputs populated from socialMedia", () => {
    render(<SocialMediaSection shopInfo={baseShop} update={jest.fn()} />);

    expect(screen.getByText("Facebook URL")).toBeInTheDocument();
    expect(screen.getByText("Twitter URL")).toBeInTheDocument();
    expect(screen.getByText("Instagram URL")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://facebook.com/mmcleeds")
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://instagram.com/mmcleeds")
    ).toBeInTheDocument();
  });

  it("📋 editing Facebook URL preserves the other socialMedia keys", () => {
    const update = jest.fn();
    render(<SocialMediaSection shopInfo={baseShop} update={update} />);

    fireEvent.change(screen.getByDisplayValue("https://facebook.com/mmcleeds"), {
      target: { value: "https://facebook.com/new" },
    });

    expect(update).toHaveBeenCalledWith({
      socialMedia: {
        ...baseShop.socialMedia,
        facebook: "https://facebook.com/new",
      },
    });
  });

  it("📋 editing Twitter URL when initially empty fills it in", () => {
    const update = jest.fn();
    render(<SocialMediaSection shopInfo={baseShop} update={update} />);

    fireEvent.change(screen.getByPlaceholderText(/twitter.com/i), {
      target: { value: "https://twitter.com/mmc" },
    });

    expect(update).toHaveBeenCalledWith({
      socialMedia: {
        ...baseShop.socialMedia,
        twitter: "https://twitter.com/mmc",
      },
    });
  });

  it("📋 falls back to empty string when socialMedia is missing entirely", () => {
    const shop = {} as ShopInfo;
    render(<SocialMediaSection shopInfo={shop} update={jest.fn()} />);

    // Three empty url inputs.
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.every((i) => (i as HTMLInputElement).value === "")).toBe(
      true
    );
  });
});
