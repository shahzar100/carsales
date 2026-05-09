/**
 * Local Fixer (No AI Required)
 *
 * Applies common automatic fixes based on pattern matching
 * of error messages, without requiring any AI API call.
 * Handles the most frequent, mechanical TypeScript/Next.js issues.
 */

import * as fs from "fs";
import * as path from "path";
import { AgentConfig } from "./config";
import { TestFailure } from "./testRunner";
import { log, logInfo, logSuccess } from "./logger";

export interface AutoFix {
  filePath: string;
  description: string;
  apply: () => boolean;
}

/**
 * Attempt to auto-fix common issues without AI
 */
export function findAutoFixes(
  failures: TestFailure[],
  config: AgentConfig
): AutoFix[] {
  const fixes: AutoFix[] = [];

  for (const failure of failures) {
    if (!failure.sourceFile) continue;
    const sourceFullPath = path.join(config.projectRoot, failure.sourceFile);
    if (!fs.existsSync(sourceFullPath)) continue;

    const sourceContent = fs.readFileSync(sourceFullPath, "utf-8");
    const errorText = failure.errorMessages.join("\n");

    // Fix 1: Missing named export
    const missingExportMatch = errorText.match(
      /does not provide an export named '(\w+)'/
    );
    if (missingExportMatch) {
      const exportName = missingExportMatch[1];
      if (
        !sourceContent.includes(`export`) ||
        !sourceContent.match(
          new RegExp(
            `export\\s+(?:const|function|class|type|interface|async\\s+function)\\s+${exportName}`
          )
        )
      ) {
        fixes.push({
          filePath: failure.sourceFile,
          description: `Add missing export '${exportName}'`,
          apply: () => {
            // We can't auto-generate the implementation, mark for AI fix
            return false;
          },
        });
      }
    }

    // Fix 2: Missing HTTP method handler (Next.js route)
    const httpMethodMatch = errorText.match(
      /(\w+) is not a function|(\w+) is not exported/
    );
    if (
      httpMethodMatch &&
      failure.sourceFile.includes("route.ts") &&
      ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(
        (httpMethodMatch[1] || httpMethodMatch[2] || "").toUpperCase()
      )
    ) {
      const method = (httpMethodMatch[1] || httpMethodMatch[2]).toUpperCase();
      if (!sourceContent.includes(`export async function ${method}`)) {
        fixes.push({
          filePath: failure.sourceFile,
          description: `Add missing ${method} handler`,
          apply: () => false, // Needs AI for implementation
        });
      }
    }

    // Fix 3: Import path issues (case sensitivity on macOS)
    const cannotFindMatch = errorText.match(/Cannot find module '(@\/[^']+)'/);
    if (cannotFindMatch) {
      const importPath = cannotFindMatch[1];
      logInfo(
        `Missing module: ${importPath} (referenced in ${failure.sourceFile})`
      );
    }

    // Fix 4: "is not defined" or "is not a function" for imported utilities
    const notDefinedMatch = errorText.match(/(\w+) is not defined/);
    if (notDefinedMatch) {
      logInfo(
        `'${notDefinedMatch[1]}' not defined in context of ${failure.sourceFile}`
      );
    }
  }

  return fixes;
}

/**
 * Simple structural fixes that don't need AI
 */
export function applySimpleFixes(
  sourceFile: string,
  content: string,
  errors: string[]
): { content: string; applied: string[] } {
  let fixed = content;
  const applied: string[] = [];

  // Fix: Remove unused imports (common TS error)
  for (const error of errors) {
    const unusedImportMatch = error.match(
      /'(\w+)' is declared but its value is never read/
    );
    if (unusedImportMatch) {
      const varName = unusedImportMatch[1];
      // Simple case: standalone import
      const standaloneRegex = new RegExp(
        `import\\s+${varName}\\s+from\\s+['"][^'"]+['"];?\\n?`
      );
      if (standaloneRegex.test(fixed)) {
        fixed = fixed.replace(standaloneRegex, "");
        applied.push(`Removed unused import: ${varName}`);
      }
    }
  }

  // Fix: Add missing 'use client' directive
  for (const error of errors) {
    if (
      error.includes("useState") ||
      error.includes("useEffect") ||
      error.includes("useContext")
    ) {
      if (
        !fixed.startsWith("'use client'") &&
        !fixed.startsWith('"use client"')
      ) {
        if (
          fixed.includes("useState") ||
          fixed.includes("useEffect") ||
          fixed.includes("useContext")
        ) {
          fixed = `'use client';\n\n${fixed}`;
          applied.push("Added 'use client' directive");
        }
      }
    }
  }

  return { content: fixed, applied };
}
