/**
 * Logger
 *
 * Beautiful, structured console output for the agent.
 */

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
};

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export function log(message: string): void {
  console.log(`${COLORS.dim}[${timestamp()}]${COLORS.reset} ${message}`);
}

export function logSuccess(message: string): void {
  console.log(
    `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${COLORS.green}✓${COLORS.reset} ${message}`
  );
}

export function logError(message: string): void {
  console.log(
    `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${COLORS.red}✗${COLORS.reset} ${message}`
  );
}

export function logWarning(message: string): void {
  console.log(
    `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${COLORS.yellow}⚠${COLORS.reset} ${message}`
  );
}

export function logInfo(message: string): void {
  console.log(
    `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${COLORS.blue}ℹ${COLORS.reset} ${message}`
  );
}

export function logStep(step: number, total: number, message: string): void {
  console.log(
    `\n${COLORS.bold}${COLORS.cyan}[${step}/${total}]${COLORS.reset} ${COLORS.bold}${message}${COLORS.reset}`
  );
}

export function logHeader(title: string): void {
  const line = "═".repeat(60);
  console.log(`\n${COLORS.bold}${COLORS.magenta}${line}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.magenta}  ${title}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.magenta}${line}${COLORS.reset}\n`);
}

export function logSubHeader(title: string): void {
  console.log(`\n${COLORS.bold}${COLORS.blue}── ${title} ──${COLORS.reset}`);
}

export function logDiff(file: string, removed: number, added: number): void {
  console.log(
    `  ${COLORS.cyan}${file}${COLORS.reset}: ${COLORS.red}-${removed}${COLORS.reset} / ${COLORS.green}+${added}${COLORS.reset} lines`
  );
}

export function logFixSummary(
  iteration: number,
  totalFixed: number,
  totalRemaining: number
): void {
  console.log(
    `\n${COLORS.bold}Iteration ${iteration} summary:${COLORS.reset} ` +
      `${COLORS.green}${totalFixed} fixed${COLORS.reset}, ` +
      `${COLORS.red}${totalRemaining} remaining${COLORS.reset}`
  );
}

export function logFinalReport(
  success: boolean,
  iterations: number,
  totalFixed: number,
  remaining: number,
  duration: number
): void {
  const line = "═".repeat(60);
  console.log(`\n${COLORS.bold}${line}${COLORS.reset}`);
  if (success) {
    console.log(
      `${COLORS.bold}${COLORS.bgGreen}${COLORS.white}  ALL TESTS PASSING  ${COLORS.reset}`
    );
  } else {
    console.log(
      `${COLORS.bold}${COLORS.bgRed}${COLORS.white}  SOME TESTS STILL FAILING  ${COLORS.reset}`
    );
  }
  console.log(`${COLORS.bold}${line}${COLORS.reset}`);
  console.log(`  Iterations:    ${iterations}`);
  console.log(`  Tests fixed:   ${COLORS.green}${totalFixed}${COLORS.reset}`);
  console.log(`  Still failing: ${COLORS.red}${remaining}${COLORS.reset}`);
  console.log(`  Total time:    ${duration.toFixed(1)}s`);
  console.log(`${COLORS.bold}${line}${COLORS.reset}\n`);
}
