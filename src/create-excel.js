import ExcelJS from "exceljs";
import { existsSync, mkdirSync } from "fs";

const TOTAL_ROWS = 500;
const MAX_ROWS_PER_SHEET = 1_048_576; 
const OUTPUT_DIR = "./data";
const OUTPUT_FILE = `${OUTPUT_DIR}/sample_small.xlsx`;

console.log(`\nGenerating ${TOTAL_ROWS.toLocaleString()} rows into Excel...`);

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("Created data directory");
}

const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
  filename: OUTPUT_FILE,
  useStyles: false,
});

const firstNames = [
  "John","Jane","Michael","Sarah","David","Emily","Robert","Lisa",
  "James","Mary","Tom","Anna","Chris","Laura","Steve","Emma","Paul","Sophia",
];

const lastNames = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
  "Rodriguez","Martinez","Wilson","Moore","Taylor","Anderson","Thomas",
];

const cities = [
  "New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia",
  "San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville",
];

const countries = [
  "USA","Canada","UK","Australia","Germany","France","Spain","Italy",
];

const streets = [
  "Main St","Oak Ave","Pine Rd","Maple Dr","Cedar Ln",
  "Elm St","Park Ave","Washington Blvd","Lake Dr","Hill St",
];

let sheetIndex = 1;
let rowsInSheet = 0;
let sheet = createSheet(sheetIndex);

for (let i = 1; i <= TOTAL_ROWS; i++) {
  if (rowsInSheet >= MAX_ROWS_PER_SHEET) {
    sheet.commit();
    sheetIndex++;
    rowsInSheet = 0;
    sheet = createSheet(sheetIndex);
  }

  if (i % 20 === 0) {
    sheet.addRow({
      name: "",
      email: "invalid-email",
      age: 200,
      phone: "",
      address: "",
      city: "",
      country: "",
    }).commit();
  } else {
    const first = firstNames[rand(0, firstNames.length - 1)];
    const last = lastNames[rand(0, lastNames.length - 1)];

    sheet.addRow({
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      age: rand(18, 77),
      phone: `+1-${rand(100,999)}-${rand(100,999)}-${rand(1000,9999)}`,
      address: `${rand(1,9999)} ${streets[rand(0, streets.length - 1)]}`,
      city: cities[rand(0, cities.length - 1)],
      country: countries[rand(0, countries.length - 1)],
    }).commit();
  }

  rowsInSheet++;

  if (i % 1_000_000 === 0) {
    console.log(`  ${i.toLocaleString()} rows generated`);
  }
}

sheet.commit();
await workbook.commit();

console.log("\n" + "=".repeat(60));
console.log("✓ Excel file created successfully");
console.log(`File: ${OUTPUT_FILE}`);
console.log(`Total rows: ${TOTAL_ROWS.toLocaleString()}`);
console.log(`Sheets created: ${sheetIndex}`);
console.log("=".repeat(60));

function createSheet(index) {
  const ws = workbook.addWorksheet(`Data_${index}`);
  ws.columns = [
    { header: "name", key: "name", width: 25 },
    { header: "email", key: "email", width: 35 },
    { header: "age", key: "age", width: 10 },
    { header: "phone", key: "phone", width: 20 },
    { header: "address", key: "address", width: 40 },
    { header: "city", key: "city", width: 20 },
    { header: "country", key: "country", width: 20 },
  ];
  return ws;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
