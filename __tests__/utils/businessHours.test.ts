import { getOpenStatus } from "@/lib/utils/businessHours";

// Standard seeded hours: weekdays 9–6, Saturday 9–4, Sunday closed.
const HOURS = {
  monday: "9:00 AM - 6:00 PM",
  tuesday: "9:00 AM - 6:00 PM",
  wednesday: "9:00 AM - 6:00 PM",
  thursday: "9:00 AM - 6:00 PM",
  friday: "9:00 AM - 6:00 PM",
  saturday: "9:00 AM - 4:00 PM",
  sunday: "Closed",
};

/**
 * Build a Date that is definitely the given weekday at h:m — found by
 * scanning forward from a fixed start, so the test never depends on
 * hand-computed calendar arithmetic. weekday: 0 = Sun … 6 = Sat.
 */
function dateOnWeekday(weekday: number, h: number, m = 0): Date {
  const d = new Date(2026, 4, 1, h, m);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  return d;
}
const weds = (h: number, m = 0) => dateOnWeekday(3, h, m);
const sats = (h: number, m = 0) => dateOnWeekday(6, h, m);
const suns = (h: number, m = 0) => dateOnWeekday(0, h, m);

describe("getOpenStatus", () => {
  it("reports open during opening hours", () => {
    const s = getOpenStatus(HOURS, weds(12));
    expect(s.isOpen).toBe(true);
    expect(s.opensAt).toBe("9:00 AM");
    expect(s.closesAt).toBe("6:00 PM");
  });

  it("reports open exactly at opening time", () => {
    expect(getOpenStatus(HOURS, weds(9, 0)).isOpen).toBe(true);
  });

  it("reports closed before opening", () => {
    expect(getOpenStatus(HOURS, weds(8, 30)).isOpen).toBe(false);
  });

  it("reports closed at and after closing time", () => {
    expect(getOpenStatus(HOURS, weds(18, 0)).isOpen).toBe(false);
    expect(getOpenStatus(HOURS, weds(19, 30)).isOpen).toBe(false);
  });

  it("treats a 'Closed' day as closed with null times", () => {
    expect(getOpenStatus(HOURS, suns(12))).toEqual({
      isOpen: false,
      closesAt: null,
      opensAt: null,
    });
  });

  it("honours a day's own (earlier) closing time", () => {
    // Saturday closes at 4:00 PM.
    expect(getOpenStatus(HOURS, sats(15)).isOpen).toBe(true);
    expect(getOpenStatus(HOURS, sats(15)).closesAt).toBe("4:00 PM");
    expect(getOpenStatus(HOURS, sats(16, 30)).isOpen).toBe(false);
  });

  it("parses 24-hour clock strings", () => {
    const s = getOpenStatus({ wednesday: "08:00 - 20:00" }, weds(19));
    expect(s.isOpen).toBe(true);
    expect(s.closesAt).toBe("20:00");
  });

  it("returns a safe closed result for missing or garbled input", () => {
    expect(getOpenStatus(undefined).isOpen).toBe(false);
    expect(getOpenStatus(null).isOpen).toBe(false);
    expect(getOpenStatus({}, weds(12)).isOpen).toBe(false);
    expect(getOpenStatus({ wednesday: "garbled" }, weds(12)).isOpen).toBe(
      false
    );
  });
});
