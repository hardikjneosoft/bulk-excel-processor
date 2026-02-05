import { parentPort } from "worker_threads";
import { connect, disconnect, insertBatch, logError } from "../database/db.js";
import { ExcelReader } from "./excel-reader.js";
import { validateRow } from "./validator.js";
import { ProgressTracker } from "./progress.js";
import { config } from "../database/db.js";

async function processFile() {
  try {
    await connect();

    const reader = new ExcelReader();
    const progress = new ProgressTracker();

    const resumeInfo = progress.getResumeInfo();
    const isResuming = progress.resume();

    if (isResuming && resumeInfo) {
      console.log("\n🔄 RESUMING from previous run:");
      console.log(`   Last processed row: ${resumeInfo.lastProcessedRow}`);
      console.log(`   Already processed: ${resumeInfo.processedRows} rows`);
      console.log(`   Already failed: ${resumeInfo.failedRows} rows`);
      console.log(`   Batches completed: ${resumeInfo.currentBatch}`);
      console.log("");
    } else {
      console.log("\n🚀 Starting fresh...\n");
      progress.reset();
    }

    let batch = [];
    const BATCH_SIZE = config.batchSize;
    const skipUntilRow = progress.get().lastProcessedRow;
    let skippedCount = 0;

    reader.on("row", async (row) => {
      if (row._rowNum <= skipUntilRow) {
        skippedCount++;
        if (skippedCount % 10000 === 0) {
          console.log(
            `⏩ Skipping already processed rows... (${skippedCount} skipped)`,
          );
        }
        return;
      }

      const validation = validateRow(row);

      if (!validation.valid) {
        progress.update({
          failedRows: progress.get().failedRows + 1,
          lastProcessedRow: row._rowNum,
        });
        await logError(row._rowNum, validation.errors.join("; "), row);
        return;
      }

      batch.push({ ...validation.data, _rowNum: row._rowNum });

      if (batch.length >= BATCH_SIZE) {
        reader.pause();
        await processBatch(batch, progress);
        batch = [];
        reader.resume();
      }
    });

    reader.on("end", async () => {
      if (batch.length > 0) {
        await processBatch(batch, progress);
      }

      progress.markComplete();
      await disconnect();

      const finalStats = progress.get();
      const totalDuration = (
        (Date.now() - finalStats.startTime) /
        1000
      ).toFixed(2);

      parentPort.postMessage({
        type: "complete",
        data: {
          ...finalStats,
          skippedRows: skippedCount,
          totalDuration,
        },
      });
    });

    await reader.readFile(config.excelFile);
  } catch (err) {
    parentPort.postMessage({
      type: "error",
      error: err.message,
    });
  }
}

async function processBatch(batch, progress) {
  const batchNum = progress.get().currentBatch + 1;
  const lastRowInBatch = batch[batch.length - 1]._rowNum;

  try {
    const cleanBatch = batch.map(({ _rowNum, ...data }) => data);
    const result = await insertBatch(cleanBatch);

    progress.update({
      processedRows: progress.get().processedRows + result.success,
      failedRows: progress.get().failedRows + result.failed,
      currentBatch: batchNum,
      lastProcessedRow: lastRowInBatch,
    });

    for (const err of result.errors) {
      await logError(err.rowNum, err.error, err.data);
    }

    parentPort.postMessage({
      type: "progress",
      data: progress.get(),
    });
  } catch (err) {
    console.error(`Batch ${batchNum} failed:`, err.message);
    progress.update({
      failedRows: progress.get().failedRows + batch.length,
      lastProcessedRow: lastRowInBatch,
    });
  }
}

processFile();
