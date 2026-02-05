import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startProcessing() {
  return new Promise((resolve, reject) => {
    const workerPath = join(__dirname, 'processor-worker.js');
    const worker = new Worker(workerPath);

    worker.on('message', (msg) => {
      if (msg.type === 'progress') {
        const p = msg.data;
        console.log(`Progress: ${p.processedRows} processed, ${p.failedRows} failed | Batch: ${p.currentBatch}`);
      } else if (msg.type === 'complete') {
        console.log('\n✓ Processing complete!');
        console.log(`Total: ${msg.data.processedRows + msg.data.failedRows} rows`);
        console.log(`Success: ${msg.data.processedRows}`);
        console.log(`Failed: ${msg.data.failedRows}`);
        const duration = ((Date.now() - msg.data.startTime) / 1000).toFixed(2);
        console.log(`Duration: ${duration}s`);
        resolve(msg.data);
      } else if (msg.type === 'error') {
        reject(new Error(msg.error));
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
