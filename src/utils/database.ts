import { Sequelize, Dialect } from 'sequelize';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

/**
 * Classe Singleton per gestire la connessione al database.
 * Implementa il pattern Singleton per garantire una sola istanza di connessione.
 */
class Database {
  private static instance: Sequelize;

  /**
   * Costruttore privato per impedire l'istanziazione diretta.
   */
  private constructor() {}

  /**
   * Restituisce l'istanza Singleton di Sequelize.
   * @returns {Sequelize} L'istanza di Sequelize configurata
   */
  public static getInstance(): Sequelize {
    if (!Database.instance) {
      const dbName = process.env.NODE_ENV === 'test'
          // In ambiente di test usa il nome DB da env se presente, altrimenti allinea ai test scripts
          ? (process.env.DB_NAME || 'test_progetto_crowdsourcing')
          : (process.env.DB_NAME || 'crowdsourcing_db');
      const dbUser = process.env.DB_USER || 'postgres';
      const dbPassword = process.env.DB_PASSWORD || 'password';
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = parseInt(process.env.DB_PORT || '5432');
      const dbDialect = process.env.DB_DIALECT || 'postgres';

      // Validazione delle variabili d'ambiente critiche
      if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
        console.warn('[WARNING] Alcune variabili d\'ambiente del database non sono definite. Usando valori di default.');
      }

      Database.instance = new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: dbDialect as Dialect,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });

      console.log(`[DATABASE] Connessione al database configurata: ${dbDialect}://${dbHost}:${dbPort}/${dbName}`);
    }

    return Database.instance;
  }
}

export default Database;