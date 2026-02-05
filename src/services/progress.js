import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const PROGRESS_FILE = './data/progress.json';

export class ProgressTracker {
  constructor() {
    const dir = dirname(PROGRESS_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.progress = this.load() || {
      totalRows: 0,
      processedRows: 0,
      failedRows: 0,
      currentBatch: 0,
      startTime: Date.now(),
    };
  }

  update(updates) {
    this.progress = { ...this.progress, ...updates };
    this.save();
  }

  get() {
    return { ...this.progress };
  }

  save() {
    writeFileSync(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
  }

  load() {
    try {
      if (existsSync(PROGRESS_FILE)) {
        return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.warn('Could not load progress file');
    }
    return null;
  }

  reset() {
    this.progress = {
      totalRows: 0,
      processedRows: 0,
      failedRows: 0,
      currentBatch: 0,
      startTime: Date.now(),
    };
    this.save();
  }
}
