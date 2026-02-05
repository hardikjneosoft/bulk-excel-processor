import pkg from "pg";
const { Pool } = pkg;

import dotenv from "dotenv";
dotenv.config();

export const config = {
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "bulk_upload",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  },
  batchSize: parseInt(process.env.BATCH_SIZE) || 100000,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  excelFile: process.env.EXCEL_FILE || "./data/sample.xlsx",
};

let pool;

export async function connect() {
  pool = new Pool(config.db);
  await pool.query("SELECT NOW()");
  console.log("Connected to PostgreSQL");
}

export async function disconnect() {
  if (pool) {
    await pool.end();
    console.log("Disconnected");
  }
}

export async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bulk_data (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      age INTEGER,
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      country VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS error_logs (
      id SERIAL PRIMARY KEY,
      row_number INTEGER,
      error_message TEXT,
      row_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

  `);
  console.log("Tables created");
}

export async function insertBatch(records) {
  let attempt = 0;
  const result = { success: 0, failed: 0, errors: [] };

  while (attempt < config.maxRetries) {
    const client = await pool.connect();
    attempt++;
    try {
      await client.query("BEGIN");

      const values = [];
      const placeholders = [];

      records.forEach((record, index) => {
        const offset = index * 7;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
        );
        values.push(
          record.name,
          record.email,
          record.age,
          record.phone,
          record.address,
          record.city,
          record.country,
        );
      });

      const query = `
      INSERT INTO bulk_data (name, email, age, phone, address, city, country)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        age = EXCLUDED.age,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        country = EXCLUDED.country
    `;

      await client.query(query, values);

      result.success = records.length;

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");

      if (attempt >= config.maxRetries) {
        result.failed = records.length;
        result.errors.push({
          error: err.message,
          attempts: attempt,
          batch: records,
        });
        return result;
      }
      await new Promise((res) => setTimeout(res, 500 * attempt));
    } finally {
      client.release();
    }
  }
  return result;
}

export async function logError(rowNumber, errorMsg, data) {
  try {
    await pool.query(
      "INSERT INTO error_logs (row_number, error_message, row_data) VALUES ($1, $2, $3)",
      [rowNumber, errorMsg, JSON.stringify(data)],
    );
  } catch (err) {
    console.error("Failed to log error:", err.message);
  }
}
