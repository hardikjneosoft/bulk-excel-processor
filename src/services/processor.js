import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startProcessing() {
  return new Promise((resolve, reject) => {
    const workerPath = join(__dirname, "processor-worker.js");
    const worker = new Worker(workerPath);

    worker.on("message", (msg) => {
      if (msg.type === "progress") {
        const p = msg.data;
        console.log(
          `Progress: ${p.processedRows} processed, ${p.failedRows} failed | Batch: ${p.currentBatch} | Row: ${p.lastProcessedRow}`,
        );
      } else if (msg.type === "complete") {
        console.log("\n✓ Processing complete!");
        console.log(
          `Total: ${msg.data.processedRows + msg.data.failedRows} rows`,
        );
        console.log(`Success: ${msg.data.processedRows}`);
        console.log(`Failed: ${msg.data.failedRows}`);
        if (msg.data.skippedRows > 0) {
          console.log(`Skipped (already processed): ${msg.data.skippedRows}`);
        }
        if (msg.data.totalDuration) {
          console.log(`Duration: ${msg.data.totalDuration}s`);
        }
        resolve(msg.data);
      } else if (msg.type === "error") {
        reject(new Error(msg.error));
      }
    });

    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
