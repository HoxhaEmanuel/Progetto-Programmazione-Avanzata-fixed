const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Inizializza lo schema del database di test usando il file SQL
 * invece di sequelize.sync({ force: true }) che non applica correttamente
 * i default values per i tipi DECIMAL.
 */
const initTestSchema = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'test_progetto_crowdsourcing',
  });

  try {
    await client.connect();
    
    // Leggi il file SQL schema
    const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
    const sqlSchema = fs.readFileSync(sqlPath, 'utf8');
    
    // Pulisci il database esistente
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    
    // Esegui lo schema SQL
    await client.query(sqlSchema);
    
    console.log('[TEST DB] Schema inizializzato correttamente con init.sql');
  } catch (error) {
    console.error('[TEST DB] Errore nell\'inizializzazione dello schema:', error);
    throw error;
  } finally {
    await client.end();
  }
};

module.exports = initTestSchema;