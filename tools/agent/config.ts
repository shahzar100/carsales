/**
 * Agent Configuration
 *
 * Configure the AI provider, model, and agent behavior.
 */

export interface AgentConfig {
  /** AI provider: "anthropic" or "openai" */
  provider: "anthropic" | "openai";

  /** Model to use for code fixes */
  model: string;

  /** API key (reads from environment variables) */
  apiKey: string;

  /** Maximum number of fix iterations before giving up */
  maxIterations: number;

  /** Maximum number of files to fix per iteration */
  maxFilesPerIteration: number;

  /** Which test suite(s) to run: "all" | "api" | "component" */
  testSuite: "all" | "api" | "component";

  /** Whether to run TypeScript checks too */
  checkTypes: boolean;

  /** Whether to auto-apply fixes (false = dry-run, show diff only) */
  autoApply: boolean;

  /** Paths that should NEVER be modified */
  protectedPaths: string[];

  /** Only modify files under these paths */
  allowedPaths: string[];

  /** Project root */
  projectRoot: string;

  /** Verbose logging */
  verbose: boolean;
}

export function loadConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  const provider =
    (process.env.AI_PROVIDER as "anthropic" | "openai") || "anthropic";

  let apiKey = "";
  if (provider === "anthropic") {
    apiKey = process.env.ANTHROPIC_API_KEY || "";
  } else {
    apiKey = process.env.OPENAI_API_KEY || "";
  }

  return {
    provider,
    model: provider === "anthropic" ? "claude-sonnet-4-20250514" : "gpt-4o",
    apiKey,
    maxIterations: 5,
    maxFilesPerIteration: 10,
    testSuite: "all",
    checkTypes: true,
    autoApply: true,
    protectedPaths: [
      "__tests__/",
      "jest.config",
      "jest.setup",
      "node_modules/",
      ".next/",
      "agent/",
    ],
    allowedPaths: ["src/"],
    projectRoot: process.cwd(),
    verbose: process.env.AGENT_VERBOSE === "true",
    ...overrides,
  };
}
