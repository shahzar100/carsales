/**
 * Test Runner
 *
 * Runs Jest test suites and parses structured JSON output
 * to extract failure details including file paths, test names,
 * error messages, and stack traces.
 */

import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { AgentConfig } from "./config";
import { log, logError, logSuccess, logWarning } from "./logger";

export interface TestFailure {
  /** The test file that failed */
  testFile: string;
  /** Ancestor describe blocks */
  ancestorTitles: string[];
  /** Name of the failing test */
  testName: string;
  /** Full title (ancestors + test name) */
  fullTitle: string;
  /** Error messages */
  errorMessages: string[];
  /** Stack trace lines */
  stackTrace: string;
  /** The source file most likely responsible (mapped from imports/stack) */
  sourceFile: string | null;
}

export interface TestResult {
  /** Whether all tests passed */
  success: boolean;
  /** Total number of tests */
  totalTests: number;
  /** Number of passed tests */
  passed: number;
  /** Number of failed tests */
  failed: number;
  /** Number of skipped tests */
  skipped: number;
  /** Detailed failure information */
  failures: TestFailure[];
  /** Raw output (truncated) */
  rawOutput: string;
  /** Duration in seconds */
  duration: number;
}

/**
 * Run Jest and capture structured JSON output
 */
export function runTests(config: AgentConfig): TestResult {
  const startTime = Date.now();
  const jsonOutputFile = path.join(
    config.projectRoot,
    ".agent-test-results.json"
  );

  // Clean up previous results
  if (fs.existsSync(jsonOutputFile)) {
    fs.unlinkSync(jsonOutputFile);
  }

  const commands: string[] = [];

  if (config.testSuite === "all" || config.testSuite === "api") {
    commands.push(
      `npx jest --config jest.config.api.js --json --outputFile="${jsonOutputFile}.api" --no-coverage --forceExit 2>&1 || true`
    );
  }
  if (config.testSuite === "all" || config.testSuite === "component") {
    commands.push(
      `npx jest --config jest.config.js --json --outputFile="${jsonOutputFile}.component" --no-coverage --forceExit 2>&1 || true`
    );
  }

  const allFailures: TestFailure[] = [];
  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let rawOutput = "";

  for (const cmd of commands) {
    log(`Running: ${cmd.substring(0, 80)}...`);
    try {
      const output = execSync(cmd, {
        cwd: config.projectRoot,
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        timeout: 120_000, // 2 min timeout per suite
        env: { ...process.env, NODE_OPTIONS: "--experimental-vm-modules" },
      });
      rawOutput += output + "\n";
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string };
      rawOutput +=
        (execErr.stdout || "") + "\n" + (execErr.stderr || "") + "\n";
    }
  }

  // Parse each JSON result file
  const resultFiles = [jsonOutputFile + ".api", jsonOutputFile + ".component"];
  for (const resultFile of resultFiles) {
    if (!fs.existsSync(resultFile)) continue;

    try {
      const raw = fs.readFileSync(resultFile, "utf-8");
      const jestResult = JSON.parse(raw);

      totalTests += jestResult.numTotalTests || 0;
      passed += jestResult.numPassedTests || 0;
      failed += jestResult.numFailedTests || 0;
      skipped += jestResult.numPendingTests || 0;

      if (jestResult.testResults) {
        for (const suite of jestResult.testResults) {
          if (suite.status === "failed" || suite.numFailingTests > 0) {
            const testFile = path.relative(config.projectRoot, suite.name);

            for (const testCase of suite.testResults ||
              suite.assertionResults ||
              []) {
              if (testCase.status === "failed") {
                const failure: TestFailure = {
                  testFile,
                  ancestorTitles: testCase.ancestorTitles || [],
                  testName: testCase.title || testCase.fullName || "unknown",
                  fullTitle: testCase.fullName || testCase.title || "unknown",
                  errorMessages: testCase.failureMessages || [],
                  stackTrace: (testCase.failureMessages || []).join("\n"),
                  sourceFile: null,
                };

                // Try to map to a source file
                failure.sourceFile = mapTestToSourceFile(
                  testFile,
                  failure,
                  config
                );
                allFailures.push(failure);
              }
            }
          }
        }
      }
    } catch (parseErr) {
      logWarning(`Failed to parse ${resultFile}: ${parseErr}`);
      // Fallback: parse raw output for failures
      const fallbackFailures = parseRawOutput(rawOutput, config);
      allFailures.push(...fallbackFailures);
    } finally {
      // Clean up result file
      try {
        fs.unlinkSync(resultFile);
      } catch {
        /* ignore */
      }
    }
  }

  const duration = (Date.now() - startTime) / 1000;

  const result: TestResult = {
    success: failed === 0 && allFailures.length === 0,
    totalTests,
    passed,
    failed,
    skipped,
    failures: deduplicateFailures(allFailures),
    rawOutput: rawOutput.substring(0, 5000), // Truncate for context
    duration,
  };

  if (result.success) {
    logSuccess(
      `All ${result.totalTests} tests passed in ${duration.toFixed(1)}s`
    );
  } else {
    logError(
      `${result.failed} of ${result.totalTests} tests failed (${duration.toFixed(1)}s)`
    );
  }

  return result;
}

/**
 * Map a test file to the source file it tests
 */
function mapTestToSourceFile(
  testFile: string,
  failure: TestFailure,
  config: AgentConfig
): string | null {
  // Strategy 1: Extract from import statements in the test file
  const testFileFull = path.join(config.projectRoot, testFile);
  if (fs.existsSync(testFileFull)) {
    const testContent = fs.readFileSync(testFileFull, "utf-8");
    const importMatches = testContent.matchAll(
      /(?:import|require)\s*(?:\(?\s*['"]|.*from\s+['"])(@\/[^'"]+)['"]/g
    );
    for (const match of importMatches) {
      const importPath = match[1].replace("@/", "src/");
      // Try with various extensions
      for (const ext of [
        "",
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        "/route.ts",
        "/route.tsx",
        "/page.tsx",
        "/index.ts",
      ]) {
        const fullPath = path.join(config.projectRoot, importPath + ext);
        if (fs.existsSync(fullPath)) {
          const relative = path.relative(config.projectRoot, fullPath);
          if (isAllowedPath(relative, config)) {
            return relative;
          }
        }
      }
    }
  }

  // Strategy 2: Infer from stack trace
  for (const msg of failure.errorMessages) {
    const stackPathMatches = msg.matchAll(/at\s+.*?\((.*?src\/.*?):\d+:\d+\)/g);
    for (const match of stackPathMatches) {
      const filePath = match[1];
      if (
        fs.existsSync(filePath) &&
        isAllowedPath(path.relative(config.projectRoot, filePath), config)
      ) {
        return path.relative(config.projectRoot, filePath);
      }
    }
  }

  // Strategy 3: Convention-based mapping
  // __tests__/api/admin/cars.test.ts → src/app/api/admin/cars/route.ts
  // __tests__/components/Admin/CarForm.test.tsx → src/components/Admin/Form/CarForm.tsx
  // __tests__/utils/filterCars.test.ts → src/lib/utils/filterCars.ts
  const conventionMappings = buildConventionMappings(testFile, config);
  for (const candidate of conventionMappings) {
    const fullPath = path.join(config.projectRoot, candidate);
    if (fs.existsSync(fullPath)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Build a list of candidate source files based on test file naming conventions
 */
function buildConventionMappings(
  testFile: string,
  _config: AgentConfig
): string[] {
  const candidates: string[] = [];
  const basename = path
    .basename(testFile)
    .replace(/\.test\.(ts|tsx|js|jsx)$/, "")
    .replace(/\.(strict|security|accessibility|usability)$/, "");

  // API route tests → src/app/api/.../route.ts
  const apiMatch = testFile.match(/__tests__\/api\/(.+)\.test\./);
  if (apiMatch) {
    const apiPath = apiMatch[1];
    candidates.push(`src/app/api/${apiPath}/route.ts`);
    candidates.push(`src/app/api/${apiPath}/route.tsx`);
  }

  // Component tests → src/components/...
  const compMatch = testFile.match(/__tests__\/components\/(.+)\.test\./);
  if (compMatch) {
    const compPath = compMatch[1];
    candidates.push(`src/components/${compPath}.tsx`);
    candidates.push(`src/components/${compPath}.ts`);
    // Try with 'Form/' subdirectory (common pattern)
    const parts = compPath.split("/");
    if (parts.length >= 2) {
      candidates.push(
        `src/components/${parts[0]}/Form/${parts[parts.length - 1]}.tsx`
      );
      candidates.push(
        `src/components/${parts[0]}/Dashboard/${parts[parts.length - 1]}.tsx`
      );
      candidates.push(
        `src/components/${parts[0]}/Navigation/${parts[parts.length - 1]}.tsx`
      );
      candidates.push(
        `src/components/${parts[0]}/Tabs/${parts[parts.length - 1]}.tsx`
      );
    }
  }

  // Util tests → src/lib/utils/...
  const utilMatch = testFile.match(/__tests__\/utils\/(.+)\.test\./);
  if (utilMatch) {
    candidates.push(`src/lib/utils/${utilMatch[1]}.ts`);
    candidates.push(`src/lib/utils/${utilMatch[1]}.tsx`);
  }

  // Context tests → src/contexts/...
  const ctxMatch = testFile.match(/__tests__\/contexts\/(.+)\.test\./);
  if (ctxMatch) {
    candidates.push(`src/contexts/${ctxMatch[1]}.tsx`);
    candidates.push(`src/contexts/${ctxMatch[1]}.ts`);
  }

  // Generic: search for the basename in src/
  candidates.push(`src/${basename}.ts`);
  candidates.push(`src/${basename}.tsx`);

  return candidates;
}

function isAllowedPath(filePath: string, config: AgentConfig): boolean {
  const isProtected = config.protectedPaths.some((p) => filePath.startsWith(p));
  const isAllowed = config.allowedPaths.some((p) => filePath.startsWith(p));
  return isAllowed && !isProtected;
}

/**
 * Fallback: parse raw Jest output for failure info
 */
function parseRawOutput(output: string, _config: AgentConfig): TestFailure[] {
  const failures: TestFailure[] = [];
  const failRegex = /● (.+)/g;
  let match: RegExpExecArray | null;
  while ((match = failRegex.exec(output)) !== null) {
    const nextChunk = output.substring(match.index, match.index + 2000);
    failures.push({
      testFile: "unknown",
      ancestorTitles: [],
      testName: match[1],
      fullTitle: match[1],
      errorMessages: [nextChunk],
      stackTrace: nextChunk,
      sourceFile: null,
    });
  }
  return failures;
}

function deduplicateFailures(failures: TestFailure[]): TestFailure[] {
  const seen = new Set<string>();
  return failures.filter((f) => {
    const key = `${f.testFile}::${f.fullTitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Run TypeScript type checking
 */
export function runTypeCheck(config: AgentConfig): {
  success: boolean;
  errors: string[];
} {
  try {
    const output = execSync("npx tsc --noEmit --pretty 2>&1", {
      cwd: config.projectRoot,
      encoding: "utf-8",
      timeout: 60_000,
    });
    return { success: true, errors: [] };
  } catch (err: unknown) {
    const execErr = err as { stdout?: string };
    const output = execErr.stdout || "";
    const errors = output
      .split("\n")
      .filter((line: string) => line.includes("error TS"))
      .filter((line: string) => {
        // Only keep errors in allowed source files
        return line.startsWith("src/");
      });
    return { success: false, errors };
  }
}
