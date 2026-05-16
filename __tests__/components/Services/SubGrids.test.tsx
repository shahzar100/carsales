/**
 * Tests for the service-specific grid wrappers in src/components/Services/.
 * Each is a thin PackageGrid + per-service-shape adapter — the tests
 * confirm the data threads through to the shared building blocks.
 *
 * Standards coverage:
 * - 📋 Functional: per-package rendering across detailing/tints; repair
 *   service categories; VLT option grid; emergency banner phone tel-link
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { Wrench, Settings } from "lucide-react";
import DetailingPackageGrid from "@/components/Services/Detailing/DetailingPackageGrid";
import RepairServiceGrid from "@/components/Services/Repairs/RepairServiceGrid";
import EmergencyBanner from "@/components/Services/Repairs/EmergencyBanner";
import TintOptionsGrid from "@/components/Services/Tints/TintOptionsGrid";
import VLTGuide from "@/components/Services/Tints/VLTGuide";

describe("DetailingPackageGrid", () => {
  it("📋 renders one PackageCard per detailing package with name/price/feature lists", () => {
    render(
      <DetailingPackageGrid
        packages={[
          {
            id: "mini",
            name: "Mini Valet",
            subtitle: "Quick refresh",
            price: "£59",
            duration: "1h",
            description: "",
            exteriorFeatures: ["Hand wash", "Tyre dressing"],
            interiorFeatures: ["Vacuum"],
            popular: false,
            includesPrevious: null,
          },
          {
            id: "full",
            name: "Full Detail",
            subtitle: "Showroom-grade",
            price: "£199",
            duration: "4h",
            description: "",
            exteriorFeatures: ["Polish"],
            interiorFeatures: ["Leather clean"],
            popular: true,
            includesPrevious: "Mini Valet",
          },
        ]}
      />
    );
    expect(screen.getByText("Choose Your Detailing Package")).toBeInTheDocument();
    expect(screen.getByText("Mini Valet")).toBeInTheDocument();
    expect(screen.getByText("Full Detail")).toBeInTheDocument();
    expect(screen.getByText("£59")).toBeInTheDocument();
    expect(screen.getByText("£199")).toBeInTheDocument();
    // The popular package shows the "Most Popular" badge by default.
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
    // Both feature lists render.
    expect(screen.getByText("Hand wash")).toBeInTheDocument();
    expect(screen.getByText("Polish")).toBeInTheDocument();
  });
});

describe("RepairServiceGrid", () => {
  it("📋 renders one card per category + checkmarked services", () => {
    render(
      <RepairServiceGrid
        repairServices={[
          {
            category: "Brakes",
            icon: Wrench,
            color: "bg-red-500",
            services: ["Pad replacement", "Disc replacement"],
          },
          {
            category: "Engine",
            icon: Settings,
            color: "bg-blue-500",
            services: ["Diagnostics", "Tune-up"],
          },
        ]}
      />
    );
    expect(screen.getByText("Our Repair Services")).toBeInTheDocument();
    expect(screen.getByText("Brakes")).toBeInTheDocument();
    expect(screen.getByText("Engine")).toBeInTheDocument();
    expect(screen.getByText("Pad replacement")).toBeInTheDocument();
    expect(screen.getByText("Diagnostics")).toBeInTheDocument();
  });
});

describe("EmergencyBanner", () => {
  it("📋 strips whitespace from the phone in the tel: link", () => {
    render(
      <EmergencyBanner
        emergencyServices={["Roadside assistance", "Battery jump"]}
        phone="0113 468 9292"
      />
    );
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.getAttribute("href")).toBe("tel:01134689292");
    }
  });

  it("renders the supplied emergency services + the phone number in the banner", () => {
    render(
      <EmergencyBanner
        emergencyServices={["Roadside assistance", "Battery jump"]}
        phone="0113 468 9292"
      />
    );
    expect(screen.getByText("Roadside assistance")).toBeInTheDocument();
    expect(screen.getByText("Battery jump")).toBeInTheDocument();
    expect(screen.getByText(/0113 468 9292/)).toBeInTheDocument();
  });
});

describe("TintOptionsGrid", () => {
  it("📋 renders one PackageCard per tint option with VLT + warranty rows", () => {
    render(
      <TintOptionsGrid
        tintOptions={[
          {
            name: "Standard Film",
            type: "Standard",
            price: "£149",
            vlt: "5% – 50%",
            warranty: "Lifetime",
            description: "",
            features: ["UV block"],
            popular: false,
          },
          {
            name: "Ceramic Film",
            type: "Ceramic",
            price: "£280",
            vlt: "20% – 50%",
            warranty: "5-yr",
            description: "",
            features: ["Heat rejection"],
            popular: true,
          },
        ]}
      />
    );
    expect(screen.getByText("Tint Film Options")).toBeInTheDocument();
    // "Standard Film" appears as both the package name AND the "{type} Film"
    // subtitle — accept >=1 match.
    expect(screen.getAllByText("Standard Film").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ceramic Film").length).toBeGreaterThan(0);
    expect(screen.getByText("£149")).toBeInTheDocument();
    expect(screen.getByText("5% – 50%")).toBeInTheDocument();
    expect(screen.getByText("Lifetime")).toBeInTheDocument();
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
  });
});

describe("VLTGuide", () => {
  it("📋 renders 4 VLT options with names + descriptions + legal notice", () => {
    render(<VLTGuide />);
    expect(screen.getByText(/tint darkness guide/i)).toBeInTheDocument();
    expect(screen.getByText("5% VLT")).toBeInTheDocument();
    expect(screen.getByText("20% VLT")).toBeInTheDocument();
    expect(screen.getByText("35% VLT")).toBeInTheDocument();
    expect(screen.getByText("50% VLT")).toBeInTheDocument();
    // Legal-compliance hint must be present.
    expect(screen.getByText(/check your local laws/i)).toBeInTheDocument();
  });
});
