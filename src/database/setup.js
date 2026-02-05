import { connect, createTables, disconnect } from './db.js';

async function setup() {
  try {
    console.log('Setting up database...');
    await connect();
    await createTables();
    await disconnect();
    console.log('✓ Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
}

setup();
