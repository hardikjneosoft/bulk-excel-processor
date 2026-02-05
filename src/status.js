import { ProgressTracker } from "./services/progress.js";

console.log("\n" + "=".repeat(60));
console.log("📊 Processing Status Check");
console.log("=".repeat(60));

const progress = new ProgressTracker();
const info = progress.get();
const resumeInfo = progress.getResumeInfo();

if (info.completed) {
  console.log("\n✅ Status: COMPLETED");
  console.log(`\nFinal Statistics:`);
  console.log(`  Processed rows: ${info.processedRows.toLocaleString()}`);
  console.log(`  Failed rows: ${info.failedRows.toLocaleString()}`);
  console.log(`  Total batches: ${info.currentBatch}`);

  const duration = ((info.resumedAt || Date.now()) - info.startTime) / 1000;
  console.log(`  Duration: ${duration.toFixed(2)}s`);
} else if (resumeInfo) {
  console.log("\n⏸️  Status: INCOMPLETE (Can Resume)");
  console.log(`\nProgress so far:`);
  console.log(
    `  Last processed row: ${resumeInfo.lastProcessedRow.toLocaleString()}`,
  );
  console.log(`  Processed rows: ${resumeInfo.processedRows.toLocaleString()}`);
  console.log(`  Failed rows: ${resumeInfo.failedRows.toLocaleString()}`);
  console.log(`  Batches completed: ${resumeInfo.currentBatch}`);

  const elapsed = (Date.now() - info.startTime) / 1000;
  console.log(`  Time elapsed: ${elapsed.toFixed(2)}s`);

  console.log(
    '\n💡 Run "npm start" to resume from row',
    resumeInfo.lastProcessedRow + 1,
  );
} else {
  console.log("\n🆕 Status: NO PREVIOUS RUN");
  console.log('\n💡 Run "npm start" to begin processing');
}

console.log("\n" + "=".repeat(60) + "\n");
