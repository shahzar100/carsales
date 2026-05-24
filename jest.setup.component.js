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

// Mock next-auth/react: many client components now call `useSession()`.
// Without this, every render in tests would need an explicit
// `<SessionProvider>` wrapper. Individual tests can still override.
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(async () => null),
  SessionProvider: ({ children }) => children,
}));

// `@sentry/nextjs` does not load cleanly under jsdom — its
// pagesRouterRoutingInstrumentation reads from a Next.js internal that is
// undefined in the test environment. `src/lib/utils/observability.ts`
// imports the SDK eagerly, so anything that pulls in observability (admin
// clients, API route handlers, etc.) needs this flat mock. Per-test
// duplicates of this mock are now redundant and have been removed.
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  withScope: jest.fn((cb) =>
    cb({ setTag: jest.fn(), setContext: jest.fn(), setExtra: jest.fn() })
  ),
  init: jest.fn(),
}));

// Narrow mock for motion/react: keep `motion.*` and `motion.create()` as
// the real implementation (so class-name / style assertions still pass),
// but flatten `AnimatePresence` to a passthrough so exit animations don't
// keep elements in the DOM after `expect(...).not.toBeInTheDocument()`
// checks. This was the root cause of the previously-flaky Dropdown +
// NavMenu + SaveCarButton + WhyChooseHome + Modal tests.
//
// Also fire `onExitComplete` synchronously when the children disappear
// between renders — that's how Toast triggers `onRemove(toast.id)` after
// the user clicks Close.
jest.mock("motion/react", () => {
  const actual = jest.requireActual("motion/react");
  const React = require("react");
  return {
    ...actual,
    AnimatePresence: ({ children, onExitComplete }) => {
      const hadChildrenRef = React.useRef(false);
      const hasChildren = React.Children.toArray(children).some(Boolean);
      // useLayoutEffect (not useEffect) so the callback fires synchronously
      // after the commit — useEffect can be delayed by tests using fake
      // timers (Toast does), which makes onExitComplete miss its window.
      React.useLayoutEffect(() => {
        if (hadChildrenRef.current && !hasChildren && onExitComplete) {
          onExitComplete();
        }
        hadChildrenRef.current = hasChildren;
      });
      return children;
    },
  };
});

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
