import { ProgressTracker } from './services/progress.js';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const progress = new ProgressTracker();
const info = progress.get();

console.log('\n' + '='.repeat(60));
console.log('⚠️  Reset Progress');
console.log('='.repeat(60));

if (info.lastProcessedRow > 0) {
  console.log(`\nCurrent progress will be lost:`);
  console.log(`  Last processed row: ${info.lastProcessedRow.toLocaleString()}`);
  console.log(`  Processed rows: ${info.processedRows.toLocaleString()}`);
  console.log(`  Failed rows: ${info.failedRows.toLocaleString()}`);
} else {
  console.log('\nNo progress to reset.');
  console.log('='.repeat(60) + '\n');
  process.exit(0);
}

rl.question('\nAre you sure you want to reset? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    progress.reset();
    console.log('\n✓ Progress has been reset');
    console.log('You can now start fresh with "npm start"');
  } else {
    console.log('\n✗ Reset cancelled');
  }
  console.log('='.repeat(60) + '\n');
  rl.close();
  process.exit(0);
});