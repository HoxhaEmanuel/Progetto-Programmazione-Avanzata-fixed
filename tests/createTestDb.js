const { Client } = require('pg');
require('dotenv').config();

const createTestDb = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'test_progetto_crowdsourcing'`);
    if (res.rowCount === 0) {
      console.log('Creating test database...');
      await client.query('CREATE DATABASE test_progetto_crowdsourcing');
      console.log('Test database created.');
    } else {
      console.log('Test database already exists.');
    }
  } catch (error) {
    console.error('Error creating test database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

module.exports = createTestDb;