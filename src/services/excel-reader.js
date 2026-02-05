import ExcelJS from 'exceljs';
import { createReadStream } from 'fs';
import { EventEmitter } from 'events';

export class ExcelReader extends EventEmitter {
  constructor() {
    super();
    this.paused = false;
  }

  async readFile(filePath) {
    const stream = createReadStream(filePath);

    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
      entries: 'emit',
      sharedStrings: 'cache',
      styles: 'cache',
    });

    for await (const worksheetReader of workbook) {
      let headers = [];

      for await (const row of worksheetReader) {
        if (row.number === 1) {
          headers = Array.isArray(row.values)
            ? row.values.slice(1).map(h => String(h).trim())
            : [];
          continue;
        }

        while (this.paused) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const values = Array.isArray(row.values)
          ? row.values.slice(1)
          : [];

        const rowData = { _rowNum: row.number };

        headers.forEach((header, index) => {
          rowData[header] = values[index] ?? null;
        });

        this.emit('row', rowData);
      }
    }

    this.emit('end');
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }
}
