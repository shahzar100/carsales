/**
 * @jest-environment node
 *
 * Tests for the booking-flow pure data module
 * (src/components/Booking/Flow/bookingFlowTypes.ts).
 *
 * Standards coverage:
 * - 📋 Functional: Validation regexes, date helpers, slot/repair catalogs,
 *   and the Mongo→PackageCard mappers produce the exact contract the
 *   BookingFlow UI relies on.
 * - 🛡️ Security: emailRegex/phoneRegex reject malformed input; capLength
 *   bounds free-text so an attacker cannot push unbounded payloads.
 * - 🧭 Usability: Time slots match the canonical bookable list, repair
 *   defaults read sensibly ("Quote" / "1–2 days"), and INITIAL state is
 *   a clean blank form.
 */
import { Award, Droplets, ShieldCheck, Sparkles } from "lucide-react";
import { BOOKING_SLOT_OPTIONS } from "@/lib/utils/bookingSlots";
import type { DetailingPackage, TintOption } from "@/lib/interfaces";
import {
  emailRegex,
  phoneRegex,
  today,
  maxDate,
  capLength,
  TIME_SLOTS,
  REPAIR_PACKAGES,
  SERVICE_LABELS,
  INITIAL,
  mapDetailingPackages,
  mapTintOptions,
  mapRepairs,
} from "@/components/Booking/Flow/bookingFlowTypes";

describe("bookingFlowTypes", () => {
  describe("emailRegex", () => {
    it("matches well-formed addresses", () => {
      expect(emailRegex.test("a@b.co")).toBe(true);
      expect(emailRegex.test("first.last@example.com")).toBe(true);
      expect(emailRegex.test("user+tag@sub.domain.org")).toBe(true);
    });

    it("rejects malformed addresses", () => {
      expect(emailRegex.test("")).toBe(false);
      expect(emailRegex.test("no-at-sign")).toBe(false);
      expect(emailRegex.test("missing@domain")).toBe(false); // no dot in domain
      expect(emailRegex.test("@nodomain.com")).toBe(false);
      expect(emailRegex.test("spaces in@email.com")).toBe(false);
      expect(emailRegex.test("two@@example.com")).toBe(false);
    });
  });

  describe("phoneRegex", () => {
    it("matches valid 7–20 char phone strings", () => {
      expect(phoneRegex.test("07123456789")).toBe(true);
      expect(phoneRegex.test("+44 7123 456789")).toBe(true);
      expect(phoneRegex.test("(0113) 123-4567")).toBe(true);
      expect(phoneRegex.test("1234567")).toBe(true); // exactly 7 chars
    });

    it("rejects too-short, too-long, or illegal-character strings", () => {
      expect(phoneRegex.test("123456")).toBe(false); // 6 chars, below min
      expect(phoneRegex.test("1".repeat(21))).toBe(false); // 21 chars, above max
      expect(phoneRegex.test("call-me-maybe")).toBe(false); // letters
      expect(phoneRegex.test("")).toBe(false);
    });
  });

  describe("today / maxDate", () => {
    it("today() returns a YYYY-MM-DD string", () => {
      expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("maxDate() returns a YYYY-MM-DD string", () => {
      expect(maxDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("maxDate() is exactly 60 days after today()", () => {
      const start = new Date(`${today()}T00:00:00Z`);
      const end = new Date(`${maxDate()}T00:00:00Z`);
      const diffDays = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(60);
    });

    it("today() matches the current ISO date", () => {
      expect(today()).toBe(new Date().toISOString().split("T")[0]);
    });
  });

  describe("capLength", () => {
    it("returns short strings unchanged", () => {
      expect(capLength("hello")).toBe("hello");
      expect(capLength("")).toBe("");
    });

    it("returns a string exactly 1000 chars unchanged", () => {
      const s = "x".repeat(1000);
      expect(capLength(s)).toBe(s);
      expect(capLength(s)).toHaveLength(1000);
    });

    it("slices strings longer than 1000 chars down to 1000", () => {
      const s = "x".repeat(1500);
      const result = capLength(s);
      expect(result).toHaveLength(1000);
      expect(result).toBe("x".repeat(1000));
    });
  });

  describe("TIME_SLOTS", () => {
    it("is the canonical BOOKING_SLOT_OPTIONS list", () => {
      expect(TIME_SLOTS).toBe(BOOKING_SLOT_OPTIONS);
    });

    it("exposes on-the-hour value/label pairs, lunch omitted", () => {
      const values = TIME_SLOTS.map((s) => s.value);
      expect(values).toEqual([
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
      ]);
      // 13:00 (lunch) is deliberately not offered.
      expect(values).not.toContain("13:00");
      // value === label for these plain slots.
      TIME_SLOTS.forEach((s) => expect(s.label).toBe(s.value));
    });
  });

  describe("REPAIR_PACKAGES", () => {
    it("is a list of {id,label,description} objects", () => {
      expect(Array.isArray(REPAIR_PACKAGES)).toBe(true);
      expect(REPAIR_PACKAGES.length).toBeGreaterThan(0);
      REPAIR_PACKAGES.forEach((r) => {
        expect(typeof r.id).toBe("string");
        expect(typeof r.label).toBe("string");
        expect(typeof r.description).toBe("string");
        expect(r.id).not.toBe("");
        expect(r.label).not.toBe("");
        expect(r.description).not.toBe("");
      });
    });

    it("has unique ids covering the expected repair sub-services", () => {
      const ids = REPAIR_PACKAGES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual(
        expect.arrayContaining([
          "engine",
          "brakes",
          "electrical",
          "transmission",
          "mot",
        ])
      );
    });
  });

  describe("SERVICE_LABELS", () => {
    it("maps each ServiceKey to a human label", () => {
      expect(SERVICE_LABELS).toEqual({
        detailing: "Detailing",
        tints: "Window Tint",
        repairs: "Repair",
      });
    });
  });

  describe("INITIAL", () => {
    it("is a clean blank booking state", () => {
      expect(INITIAL).toEqual({
        service: null,
        packageId: "",
        serviceDetails: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: "",
        vehicleReg: "",
        date: "",
        time: "",
        name: "",
        email: "",
        phone: "",
        purpose: "book",
      });
    });

    it("defaults purpose to 'book' and service to null", () => {
      expect(INITIAL.purpose).toBe("book");
      expect(INITIAL.service).toBeNull();
    });
  });

  describe("mapDetailingPackages", () => {
    const makePkg = (over: Partial<DetailingPackage> = {}): DetailingPackage => ({
      id: "basic",
      name: "Basic Wash",
      subtitle: "Quick refresh",
      price: "£59",
      duration: "2 hrs",
      description: "full description",
      exteriorFeatures: ["Foam wash", "Wheel clean"],
      interiorFeatures: ["Vacuum", "Wipe down"],
      popular: false,
      includesPrevious: null,
      ...over,
    });

    it("maps a package to the PackageCard shape", () => {
      const [card] = mapDetailingPackages([makePkg({ popular: true })]);
      expect(card.id).toBe("basic");
      expect(card.name).toBe("Basic Wash");
      // description comes from subtitle, NOT the long description field.
      expect(card.description).toBe("Quick refresh");
      expect(card.duration).toBe("2 hrs");
      expect(card.price).toBe("£59");
      expect(card.recommended).toBe(true);
      expect(card.icon).toBeDefined();
    });

    it("sets recommended=false when popular is false", () => {
      const [card] = mapDetailingPackages([makePkg({ popular: false })]);
      expect(card.recommended).toBe(false);
    });

    it("combines exterior+interior features and keeps only the first 4", () => {
      const [card] = mapDetailingPackages([
        makePkg({
          exteriorFeatures: ["E1", "E2", "E3"],
          interiorFeatures: ["I1", "I2", "I3"],
        }),
      ]);
      // [E1,E2,E3,I1,I2,I3] sliced to 4 → exterior listed first.
      expect(card.includes).toEqual(["E1", "E2", "E3", "I1"]);
    });

    it("returns fewer than 4 includes when there aren't enough features", () => {
      const [card] = mapDetailingPackages([
        makePkg({ exteriorFeatures: ["only"], interiorFeatures: [] }),
      ]);
      expect(card.includes).toEqual(["only"]);
    });

    it("assigns the icon palette by index and falls back to Sparkles past the 4th", () => {
      const pkgs = [
        makePkg({ id: "p0" }),
        makePkg({ id: "p1" }),
        makePkg({ id: "p2" }),
        makePkg({ id: "p3" }),
        makePkg({ id: "p4" }),
      ];
      const cards = mapDetailingPackages(pkgs);
      expect(cards[0].icon).toBe(Droplets);
      expect(cards[1].icon).toBe(Sparkles);
      expect(cards[2].icon).toBe(Award);
      expect(cards[3].icon).toBe(ShieldCheck);
      // 5th package has no dedicated icon → Sparkles fallback.
      expect(cards[4].icon).toBe(Sparkles);
    });

    it("returns an empty array for no packages", () => {
      expect(mapDetailingPackages([])).toEqual([]);
    });
  });

  describe("mapTintOptions", () => {
    const makeTint = (over: Partial<TintOption> = {}): TintOption => ({
      name: "Standard Tint",
      type: "carbon",
      price: "£149",
      vlt: "35%",
      warranty: "5 yr",
      description: "Heat-rejecting film",
      features: ["UV block", "Privacy", "Heat rejection"],
      popular: false,
      ...over,
    });

    it("maps a tint option to the PackageCard shape", () => {
      const [card] = mapTintOptions([makeTint({ popular: true })]);
      // id and name both derive from the tint name.
      expect(card.id).toBe("Standard Tint");
      expect(card.name).toBe("Standard Tint");
      expect(card.description).toBe("Heat-rejecting film");
      // duration comes from warranty.
      expect(card.duration).toBe("5 yr");
      expect(card.price).toBe("£149");
      expect(card.recommended).toBe(true);
      expect(card.icon).toBe(ShieldCheck);
    });

    it("keeps only the first 4 features", () => {
      const [card] = mapTintOptions([
        makeTint({ features: ["F1", "F2", "F3", "F4", "F5"] }),
      ]);
      expect(card.includes).toEqual(["F1", "F2", "F3", "F4"]);
    });

    it("sets recommended=false for non-popular tints", () => {
      const [card] = mapTintOptions([makeTint({ popular: false })]);
      expect(card.recommended).toBe(false);
    });

    it("returns an empty array for no tints", () => {
      expect(mapTintOptions([])).toEqual([]);
    });
  });

  describe("mapRepairs", () => {
    it("maps every REPAIR_PACKAGES entry with quote/duration defaults", () => {
      const cards = mapRepairs();
      expect(cards).toHaveLength(REPAIR_PACKAGES.length);
      cards.forEach((card, i) => {
        const source = REPAIR_PACKAGES[i];
        expect(card.id).toBe(source.id);
        expect(card.name).toBe(source.label);
        expect(card.description).toBe(source.description);
        expect(card.duration).toBe("1–2 days");
        expect(card.price).toBe("Quote");
        expect(card.icon).toBe(Award);
      });
    });

    it("does not set recommended on repair cards", () => {
      mapRepairs().forEach((card) => {
        expect(card.recommended).toBeUndefined();
      });
    });
  });
});
