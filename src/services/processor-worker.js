import { parentPort } from 'worker_threads';
import { connect, disconnect, insertBatch, logError } from '../database/db.js';
import { ExcelReader } from './excel-reader.js';
import { validateRow } from './validator.js';
import { ProgressTracker } from './progress.js';
import { config } from '../database/db.js';

async function processFile() {
  try {
    await connect();

    const reader = new ExcelReader();
    const progress = new ProgressTracker();
    progress.reset();

    let batch = [];
    const BATCH_SIZE = config.batchSize;

    reader.on('row', async (row) => {
      const validation = validateRow(row);

      if (!validation.valid) {
        progress.update({
          failedRows: progress.get().failedRows + 1,
        });
        await logError(row._rowNum, validation.errors.join('; '), row);
        return;
      }

      batch.push(validation.data);

      if (batch.length >= BATCH_SIZE) {
        reader.pause();
        await processBatch(batch, progress);
        batch = [];
        reader.resume();
      }
    });

    reader.on('end', async () => {
      if (batch.length > 0) {
        await processBatch(batch, progress);
      }

      await disconnect();

      parentPort.postMessage({
        type: 'complete',
        data: progress.get(),
      });
    });

    await reader.readFile(config.excelFile);

  } catch (err) {
    parentPort.postMessage({
      type: 'error',
      error: err.message,
    });
  }
}

async function processBatch(batch, progress) {
  const batchNum = progress.get().currentBatch + 1;
  
  try {
    const result = await insertBatch(batch);

    progress.update({
      processedRows: progress.get().processedRows + result.success,
      failedRows: progress.get().failedRows + result.failed,
      currentBatch: batchNum,
    });

    for (const err of result.errors) {
      await logError(err.rowNum, err.error, err.data);
    }

    parentPort.postMessage({
      type: 'progress',
      data: progress.get(),
    });

  } catch (err) {
    console.error(`Batch ${batchNum} failed:`, err.message);
    progress.update({
      failedRows: progress.get().failedRows + batch.length,
    });
  }
}

processFile();
