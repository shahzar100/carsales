"use client";

import { useState } from "react";
import {
  FlaskConical,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import Button from "@/components/Helpful/Buttons/Button";

// ── Types ────────────────────────────────────────────────────

interface TestInfo {
  name: string;
  status: string;
  duration: number;
}

interface SuiteResult {
  file: string;
  status: string;
  tests: TestInfo[];
}

interface TestSuiteData {
  success: boolean;
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  numPassedSuites: number;
  numFailedSuites: number;
  numTotalSuites: number;
  duration: number;
  suites: SuiteResult[];
}

interface TestResults {
  timestamp: string;
  results: {
    component?: TestSuiteData | { error: string };
    api?: TestSuiteData | { error: string };
  };
}

function isTestSuiteData(
  data: TestSuiteData | { error: string } | undefined
): data is TestSuiteData {
  return !!data && "success" in data;
}

function groupSuites(suites: SuiteResult[]): Map<string, SuiteResult[]> {
  const groups = new Map<string, SuiteResult[]>();
  for (const suite of suites) {
    const parts = suite.file.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "other";
    const list = groups.get(dir) ?? [];
    list.push(suite);
    groups.set(dir, list);
  }
  return groups;
}

function formatGroupName(dir: string): string {
  return dir
    .split("/")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" / ");
}

// ── Component ────────────────────────────────────────────────

export default function TestRunner() {
  const [tests, setTests] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const runTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/health/tests");
      if (!res.ok) throw new Error("Failed to run tests");
      setTests(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSuite = (key: string) =>
    setExpandedSuites((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-gray-500" />
          <h2 className="section-title">Test Suite</h2>
        </div>
        <Button
          onClick={runTests}
          loading={loading}
          size="sm"
          className="shadow-sm"
        >
          {!loading && <FlaskConical className="h-4 w-4" />}
          {loading ? "Running…" : "Run Tests"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          Running test suites — this may take a minute…
        </div>
      )}

      {/* Results */}
      {tests && !loading && (
        <div className="mt-6 space-y-6">
          {(["component", "api"] as const).map((key) => {
            const data = tests.results[key];
            if (!data) return null;
            const label = key === "component" ? "Component Tests" : "API Tests";

            if (!isTestSuiteData(data)) {
              return (
                <div
                  key={key}
                  className="rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <h3 className="heading-4 text-red-700">{label}</h3>
                  <p className="mt-1 text-sm text-red-600">
                    Error: {data.error}
                  </p>
                </div>
              );
            }

            return (
              <div key={key}>
                {/* Suite Summary */}
                <div
                  className={`rounded-lg border p-4 ${
                    data.success
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {data.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <h3 className="heading-4">{label}</h3>
                    </div>
                    {data.duration != null && (
                      <span className="caption">
                        {(data.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span className="text-emerald-600">
                      ✓ {data.numPassedTests} passed
                    </span>
                    <span className="text-red-600">
                      ✗ {data.numFailedTests} failed
                    </span>
                    <span className="text-gray-500">
                      {data.numTotalTests} total
                    </span>
                    <span className="text-gray-400">
                      ({data.numPassedSuites}/{data.numTotalSuites} suites)
                    </span>
                  </div>
                </div>

                {/* Grouped test files */}
                {data.suites && data.suites.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {[...groupSuites(data.suites)].map(([dir, suites]) => {
                      const groupKey = `${key}-${dir}`;
                      const groupExpanded = expandedGroups.has(groupKey);
                      const allPassed = suites.every(
                        (s) => s.status === "passed"
                      );
                      const passedCount = suites.filter(
                        (s) => s.status === "passed"
                      ).length;

                      return (
                        <div
                          key={groupKey}
                          className="rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <button
                            onClick={() => toggleGroup(groupKey)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-100"
                          >
                            <span className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-gray-400" />
                              {formatGroupName(dir)}
                              <span
                                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  allPassed
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {passedCount}/{suites.length}
                              </span>
                            </span>
                            {groupExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </button>

                          {groupExpanded && (
                            <div className="space-y-1 px-3 pb-3">
                              {suites.map((suite) => {
                                const suiteKey = `${key}-${suite.file}`;
                                const expanded = expandedSuites.has(suiteKey);
                                const passed = suite.status === "passed";
                                const fileName =
                                  suite.file.split("/").pop() ?? suite.file;

                                return (
                                  <div
                                    key={suiteKey}
                                    className="rounded-lg border border-gray-200 bg-white"
                                  >
                                    <button
                                      onClick={() => toggleSuite(suiteKey)}
                                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                                    >
                                      <span className="flex items-center gap-2">
                                        {passed ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        {fileName}
                                      </span>
                                      {expanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                      )}
                                    </button>

                                    {expanded && suite.tests && (
                                      <ul className="border-t border-gray-100 px-4 py-2">
                                        {suite.tests.map((test) => (
                                          <li
                                            key={test.name}
                                            className="flex items-center justify-between py-1.5 text-sm"
                                          >
                                            <span className="flex items-center gap-2">
                                              {test.status === "passed" ? (
                                                <span className="text-emerald-500">
                                                  ✓
                                                </span>
                                              ) : (
                                                <span className="text-red-500">
                                                  ✗
                                                </span>
                                              )}
                                              <span className="text-gray-700">
                                                {test.name}
                                              </span>
                                            </span>
                                            {test.duration != null && (
                                              <span className="caption">
                                                {test.duration} ms
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <p className="caption">
            Last run: {new Date(tests.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!tests && !loading && !error && (
        <div className="mt-6 rounded-lg border-2 border-dashed border-gray-200 p-10 text-center">
          <FlaskConical className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">
            Click <strong>Run Tests</strong> to execute the test suites and view
            results
          </p>
        </div>
      )}
    </section>
  );
}
