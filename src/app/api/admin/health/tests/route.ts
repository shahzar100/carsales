import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/utils/auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ── Types ────────────────────────────────────────────────────
interface JestAssertionResult {
  fullName: string;
  status: string;
  duration: number;
}

interface JestTestResult {
  name: string;
  status: string;
  assertionResults: JestAssertionResult[];
}

interface JestOutput {
  success: boolean;
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  numPassedTestSuites: number;
  numFailedTestSuites: number;
  numTotalTestSuites: number;
  startTime: number;
  testResults: JestTestResult[];
}

interface SuiteResult {
  file: string;
  status: string;
  tests: { name: string; status: string; duration: number }[];
}

function mapJestOutput(parsed: JestOutput) {
  return {
    success: parsed.success,
    numPassedTests: parsed.numPassedTests,
    numFailedTests: parsed.numFailedTests,
    numTotalTests: parsed.numTotalTests,
    numPassedSuites: parsed.numPassedTestSuites,
    numFailedSuites: parsed.numFailedTestSuites,
    numTotalSuites: parsed.numTotalTestSuites,
    duration: Date.now() - parsed.startTime,
    suites: parsed.testResults?.map(
      (suite): SuiteResult => ({
        file: suite.name.replace(/.*__tests__\//, ""),
        status: suite.status,
        tests: suite.assertionResults?.map((t) => ({
          name: t.fullName,
          status: t.status,
          duration: t.duration,
        })),
      })
    ),
  };
}

// ── Route handler ────────────────────────────────────────────

export async function GET() {
  // Auth check
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test runner is disabled in production" },
      { status: 403 }
    );
  }

  const results: {
    component?: ReturnType<typeof mapJestOutput> | { error: string };
    api?: ReturnType<typeof mapJestOutput> | { error: string };
  } = {};

  // Run component tests
  try {
    const { stdout } = await execAsync(
      "npx jest --config jest.config.js --json --no-coverage 2>/dev/null",
      { cwd: process.cwd(), timeout: 120_000 }
    );
    results.component = mapJestOutput(JSON.parse(stdout));
  } catch (err: unknown) {
    const error = err as { stdout?: string; message?: string };
    try {
      if (error.stdout) {
        results.component = mapJestOutput(JSON.parse(error.stdout));
      } else {
        results.component = { error: error.message ?? "Unknown error" };
      }
    } catch {
      results.component = { error: error.message ?? "Unknown error" };
    }
  }

  // Run API tests
  try {
    const { stdout } = await execAsync(
      "npx jest --config jest.config.api.js --json --no-coverage 2>/dev/null",
      { cwd: process.cwd(), timeout: 120_000 }
    );
    results.api = mapJestOutput(JSON.parse(stdout));
  } catch (err: unknown) {
    const error = err as { stdout?: string; message?: string };
    try {
      if (error.stdout) {
        results.api = mapJestOutput(JSON.parse(error.stdout));
      } else {
        results.api = { error: error.message ?? "Unknown error" };
      }
    } catch {
      results.api = { error: error.message ?? "Unknown error" };
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
  });
}
