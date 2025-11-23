// jest.setup.component.js - Setup for component tests only
require("@testing-library/jest-dom");

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

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
process.env.NEXT_BUSINESS_NAME = "Test Motor Company";
process.env.NEXT_BUSINESS_ADDRESS = "Test Street 123";
process.env.NEXT_BUSINESS_CITY = "Test City";
process.env.NEXT_BUSINESS_STATE = "Test State";
process.env.NEXT_BUSINESS_ZIP = "12345";
process.env.NEXT_BUSINESS_PHONE = "555-123-4567";
process.env.NEXT_BUSINESS_EMAIL = "test@testmotor.com";

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
