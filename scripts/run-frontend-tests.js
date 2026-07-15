/**
 * SolarYield Frontend Unit Test Suite
 * Evaluates core mathematics, utility formatters, and boundary state evaluations.
 */

// ANSI Escape Codes for Styling
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}====================================================`);
console.log(`Running SolarYield Frontend Math & Utility Tests...`);
console.log(`====================================================${RESET}\n`);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    testsFailed++;
    console.error(`${RED}✘ FAIL: ${message}${RESET}`);
    throw new Error(message);
  } else {
    testsPassed++;
    console.log(`${GREEN}✔ PASS: ${message}${RESET}`);
  }
}

// Helper utilities to test (cloned from codebase logic)
const formatAddress = (addr) => {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const calculateYield = (principal, apyBps, elapsedSeconds) => {
  const SECONDS_PER_YEAR = 31536000;
  return (principal * apyBps * elapsedSeconds) / (10000 * SECONDS_PER_YEAR);
};

const getLockupProgress = (lastCheckpoint, lockup, now) => {
  if (lastCheckpoint === 0) return { unlocked: true };
  const nextCheckpoint = lastCheckpoint + lockup;
  const diff = nextCheckpoint - now;
  return { unlocked: diff <= 0, diff };
};

// -----------------------------------------------------------
// TEST 1: Compounding Yield Accumulator Math
// -----------------------------------------------------------
try {
  const principal = 1000; // 1000 syUSD
  const apyBps = 800; // 8.00% APY
  const elapsedSeconds = 31536000; // 1 full year
  
  const expectedYield = 80; // 1000 * 0.08 = 80
  const actualYield = calculateYield(principal, apyBps, elapsedSeconds);
  
  assert(
    Math.abs(actualYield - expectedYield) < 0.000001,
    `calculateYield returns mathematically precise returns for 1 year (${actualYield} syUSD)`
  );
} catch (e) {
  console.error(e);
}

// -----------------------------------------------------------
// TEST 2: High Frequency Checkpoint Yield Math
// -----------------------------------------------------------
try {
  const principal = 5000;
  const apyBps = 1200; // 12.00% APY
  const elapsedSeconds = 60; // 1 minute
  
  const expectedYield = (5000 * 0.12 * 60) / 31536000;
  const actualYield = calculateYield(principal, apyBps, elapsedSeconds);
  
  assert(
    Math.abs(actualYield - expectedYield) < 0.000001,
    `calculateYield returns precise microsecond offsets for high-frequency ticks (${actualYield} syUSD)`
  );
} catch (e) {
  console.error(e);
}

// -----------------------------------------------------------
// TEST 3: Address Formatting Utilities
// -----------------------------------------------------------
try {
  const contractAddr = 'CBW5MD5EIJXPNSM2YDNZTS2HB26WSCYJJYPFPEDRLZSI64Q7HHCFV2H2';
  const expectedTruncated = 'CBW5MD...V2H2';
  const actualTruncated = formatAddress(contractAddr);
  
  assert(
    actualTruncated === expectedTruncated,
    `formatAddress correctly truncates long 56-character Soroban addresses (${actualTruncated})`
  );
} catch (e) {
  console.error(e);
}

// -----------------------------------------------------------
// TEST 4: Lockup Expiry Chronological Check
// -----------------------------------------------------------
try {
  const now = 1710000000;
  const lastCheckpoint = now - 100;
  const lockupSeconds = 60; // 60s maturity (expired)
  
  const progress = getLockupProgress(lastCheckpoint, lockupSeconds, now);
  assert(
    progress.unlocked === true,
    `getLockupProgress evaluates matured checkpoint lockup successfully`
  );
} catch (e) {
  console.error(e);
}

// -----------------------------------------------------------
// TEST 5: Lockup Unexpired Chronological Check
// -----------------------------------------------------------
try {
  const now = 1710000000;
  const lastCheckpoint = now - 10;
  const lockupSeconds = 60; // 60s maturity (unexpired)
  
  const progress = getLockupProgress(lastCheckpoint, lockupSeconds, now);
  assert(
    progress.unlocked === false && progress.diff === 50,
    `getLockupProgress blocks checkpoint collection when locks remain active`
  );
} catch (e) {
  console.error(e);
}

// -----------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------
console.log(`\n${BOLD}====================================================`);
console.log(`Test Execution Summary:`);
console.log(`  Passed: ${GREEN}${testsPassed}${RESET}`);
console.log(`  Failed: ${testsFailed > 0 ? RED : RESET}${testsFailed}${RESET}`);
console.log(`====================================================${RESET}\n`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
