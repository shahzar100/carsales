/**
 * AI Fixer
 *
 * Uses an AI model (Anthropic Claude or OpenAI GPT) to analyze
 * test failures and generate targeted source code fixes.
 * Only modifies src/ files — never touches tests.
 */

import * as fs from "fs";
import * as path from "path";
import { AgentConfig } from "./config";
import { TestFailure } from "./testRunner";
import { log, logInfo, logWarning, logError } from "./logger";

export interface FileFix {
  /** The source file to modify */
  filePath: string;
  /** The original content */
  originalContent: string;
  /** The fixed content */
  fixedContent: string;
  /** Explanation of the fix */
  explanation: string;
  /** Which test failures this fix addresses */
  addressedFailures: string[];
}

/**
 * Group failures by source file so we can fix each file once
 */
export function groupFailuresBySourceFile(
  failures: TestFailure[]
): Map<string, TestFailure[]> {
  const groups = new Map<string, TestFailure[]>();

  for (const failure of failures) {
    const key = failure.sourceFile || `unmapped::${failure.testFile}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(failure);
  }

  return groups;
}

/**
 * Build context for the AI: gather source file + test file + related files
 */
function buildFixContext(
  sourceFile: string,
  failures: TestFailure[],
  config: AgentConfig
): string {
  const sections: string[] = [];

  // Source file content
  const sourceFullPath = path.join(config.projectRoot, sourceFile);
  if (fs.existsSync(sourceFullPath)) {
    const content = fs.readFileSync(sourceFullPath, "utf-8");
    sections.push(`=== SOURCE FILE: ${sourceFile} ===\n${content}`);
  } else {
    sections.push(
      `=== SOURCE FILE: ${sourceFile} === (FILE NOT FOUND — may need to be created)`
    );
  }

  // Test file contents (for understanding what's expected)
  const testFiles = new Set(failures.map((f) => f.testFile));
  for (const testFile of testFiles) {
    const testFullPath = path.join(config.projectRoot, testFile);
    if (fs.existsSync(testFullPath)) {
      const content = fs.readFileSync(testFullPath, "utf-8");
      // Truncate very large test files
      const truncated =
        content.length > 8000
          ? content.substring(0, 8000) + "\n...[truncated]"
          : content;
      sections.push(
        `=== TEST FILE: ${testFile} (READ ONLY — DO NOT SUGGEST CHANGES) ===\n${truncated}`
      );
    }
  }

  // Failure messages
  sections.push(`=== FAILING TESTS ===`);
  for (const failure of failures) {
    sections.push(
      `\nTest: ${failure.fullTitle}\nError:\n${failure.errorMessages.join("\n").substring(0, 3000)}`
    );
  }

  // Try to find related files (imports from the source file)
  if (fs.existsSync(sourceFullPath)) {
    const sourceContent = fs.readFileSync(sourceFullPath, "utf-8");
    const importPaths = extractImports(sourceContent);
    for (const imp of importPaths.slice(0, 5)) {
      // limit related files
      const resolvedPath = resolveImport(imp, sourceFile, config);
      if (
        resolvedPath &&
        fs.existsSync(path.join(config.projectRoot, resolvedPath))
      ) {
        const relatedContent = fs.readFileSync(
          path.join(config.projectRoot, resolvedPath),
          "utf-8"
        );
        if (relatedContent.length < 4000) {
          sections.push(
            `=== RELATED FILE: ${resolvedPath} ===\n${relatedContent}`
          );
        }
      }
    }
  }

  return sections.join("\n\n");
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const regex =
    /(?:import|require)\s*(?:\(?\s*['"]|.*from\s+['"])(@\/[^'"]+|\.\/[^'"]+|\.\.\/[^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveImport(
  importPath: string,
  fromFile: string,
  config: AgentConfig
): string | null {
  let resolved: string;
  if (importPath.startsWith("@/")) {
    resolved = importPath.replace("@/", "src/");
  } else {
    resolved = path.join(path.dirname(fromFile), importPath);
  }

  for (const ext of [
    "",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    "/index.ts",
    "/index.tsx",
  ]) {
    const fullPath = path.join(config.projectRoot, resolved + ext);
    if (fs.existsSync(fullPath)) {
      return resolved + ext;
    }
  }
  return null;
}

/**
 * Call Anthropic Claude API to get a fix
 */
async function callAnthropic(
  prompt: string,
  systemPrompt: string,
  config: AgentConfig
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");
}

/**
 * Call OpenAI API to get a fix
 */
async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  config: AgentConfig
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content || "";
}

/**
 * Call the configured AI model
 */
async function callAI(
  prompt: string,
  systemPrompt: string,
  config: AgentConfig
): Promise<string> {
  if (config.provider === "anthropic") {
    return callAnthropic(prompt, systemPrompt, config);
  } else {
    return callOpenAI(prompt, systemPrompt, config);
  }
}

/**
 * Parse the AI response to extract the fixed file content
 */
function parseFixResponse(response: string): {
  content: string;
  explanation: string;
} | null {
  // Look for code block with the fixed content
  const codeBlockRegex =
    /```(?:typescript|tsx|ts|javascript|jsx|js)?\n([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);

  if (!match) {
    logWarning("Could not extract code block from AI response");
    return null;
  }

  // Extract explanation (text before the code block)
  const explanationEnd = response.indexOf("```");
  const explanation = response.substring(0, explanationEnd).trim();

  return {
    content: match[1].trimEnd() + "\n",
    explanation: explanation.substring(0, 500),
  };
}

const SYSTEM_PROMPT = `You are an expert TypeScript/Next.js developer fixing source code to make failing tests pass.

CRITICAL RULES:
1. You MUST ONLY modify the source file — NEVER suggest changes to test files.
2. The tests are the source of truth. Your job is to make the source code satisfy the tests.
3. Return the COMPLETE fixed source file content in a single code block.
4. Preserve existing functionality — only change what's needed to fix the failing tests.
5. Maintain TypeScript strict mode compatibility.
6. Keep the same file structure, exports, and naming conventions.
7. If a function/export is missing, add it. If behavior is wrong, fix it.
8. Use proper Next.js patterns (App Router, route handlers, etc.).
9. Pay close attention to the test expectations: status codes, response shapes, error messages, etc.

RESPONSE FORMAT:
1. Brief explanation of what's wrong and what you're fixing (2-3 sentences)
2. The complete fixed file in a fenced code block with proper language tag

IMPORTANT: Return the ENTIRE file content, not just the changed parts.`;

/**
 * Generate a fix for a source file based on its test failures
 */
export async function generateFix(
  sourceFile: string,
  failures: TestFailure[],
  config: AgentConfig,
  previousAttempt?: string
): Promise<FileFix | null> {
  const context = buildFixContext(sourceFile, failures, config);

  let prompt = `Fix the following source file to make all the failing tests pass.\n\n${context}`;

  if (previousAttempt) {
    prompt += `\n\n=== PREVIOUS FIX ATTEMPT (still failing) ===\n${previousAttempt.substring(0, 3000)}\n\nThe previous fix did not resolve all failures. Please analyze the remaining errors carefully and try a different approach.`;
  }

  try {
    logInfo(`Asking AI to fix: ${sourceFile} (${failures.length} failure(s))`);
    const response = await callAI(prompt, SYSTEM_PROMPT, config);
    const parsed = parseFixResponse(response);

    if (!parsed) {
      logError(`Failed to parse AI response for ${sourceFile}`);
      return null;
    }

    const sourceFullPath = path.join(config.projectRoot, sourceFile);
    const originalContent = fs.existsSync(sourceFullPath)
      ? fs.readFileSync(sourceFullPath, "utf-8")
      : "";

    // Sanity check: don't apply empty or trivially small fixes
    if (parsed.content.trim().length < 10) {
      logWarning(
        `AI returned suspiciously short content for ${sourceFile}, skipping`
      );
      return null;
    }

    return {
      filePath: sourceFile,
      originalContent,
      fixedContent: parsed.content,
      explanation: parsed.explanation,
      addressedFailures: failures.map((f) => f.fullTitle),
    };
  } catch (err) {
    logError(`AI call failed for ${sourceFile}: ${err}`);
    return null;
  }
}

/**
 * Apply a fix to disk
 */
export function applyFix(fix: FileFix, config: AgentConfig): boolean {
  const fullPath = path.join(config.projectRoot, fix.filePath);

  // Safety check: never write to protected paths
  if (config.protectedPaths.some((p) => fix.filePath.startsWith(p))) {
    logError(`BLOCKED: Attempted to modify protected path: ${fix.filePath}`);
    return false;
  }

  if (!config.allowedPaths.some((p) => fix.filePath.startsWith(p))) {
    logError(`BLOCKED: ${fix.filePath} is not in allowed paths`);
    return false;
  }

  try {
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, fix.fixedContent, "utf-8");
    return true;
  } catch (err) {
    logError(`Failed to write ${fix.filePath}: ${err}`);
    return false;
  }
}

/**
 * Revert a fix (restore original content)
 */
export function revertFix(fix: FileFix, config: AgentConfig): void {
  const fullPath = path.join(config.projectRoot, fix.filePath);
  try {
    if (fix.originalContent) {
      fs.writeFileSync(fullPath, fix.originalContent, "utf-8");
    }
  } catch (err) {
    logError(`Failed to revert ${fix.filePath}: ${err}`);
  }
}
