import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const PROGRESS_FILE = "./data/progress.json";

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
      lastProcessedRow: 0,
      startTime: Date.now(),
      resumedAt: null,
      completed: false,
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
        return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
      }
    } catch (err) {
      console.warn("Could not load progress file");
    }
    return null;
  }
  reset() {
    this.progress = {
      totalRows: 0,
      processedRows: 0,
      failedRows: 0,
      currentBatch: 0,
      lastProcessedRow: 0,
      startTime: Date.now(),
      resumedAt: null,
      completed: false,
    };
    this.save();
  }

  resume() {
    if (this.progress.completed) {
      console.log("⚠️  Previous run was completed. Starting fresh...");
      this.reset();
      return false;
    }

    if (this.progress.lastProcessedRow > 0) {
      this.progress.resumedAt = Date.now();
      this.save();
      return true;
    }

    return false;
  }

  markComplete() {
    this.progress.completed = true;
    this.save();
  }

  canResume() {
    return this.progress.lastProcessedRow > 0 && !this.progress.completed;
  }

  getResumeInfo() {
    if (!this.canResume()) return null;

    return {
      lastProcessedRow: this.progress.lastProcessedRow,
      processedRows: this.progress.processedRows,
      failedRows: this.progress.failedRows,
      currentBatch: this.progress.currentBatch,
    };
  }
}
