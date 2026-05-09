// jest.setup.component.js - Setup for component tests only
require("@testing-library/jest-dom");

// Required for React 19 act() support
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables (extras specific to component tests; the core
// set required by src/lib/env.ts is pre-populated in jest.env.setup.js).
process.env.NEXT_BUSINESS_ADDRESS =
  process.env.NEXT_BUSINESS_ADDRESS || "Test Street 123";
process.env.NEXT_BUSINESS_CITY =
  process.env.NEXT_BUSINESS_CITY || "Test City";
process.env.NEXT_BUSINESS_STATE =
  process.env.NEXT_BUSINESS_STATE || "Test State";
process.env.NEXT_BUSINESS_ZIP = process.env.NEXT_BUSINESS_ZIP || "12345";

// Mock browser APIs only when running in jsdom (not in node environment)
if (typeof window !== "undefined") {
  // Mock window.matchMedia for responsive design tests
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}

// Silence console errors during tests unless debugging
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is deprecated") ||
        args[0].includes("Warning: render is deprecated"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
