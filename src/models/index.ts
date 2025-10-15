import Utente from './Utente';
import Modello from './Modello';
import RichiestaAggiornamento from './RichiestaAggiornamento';
import CellaAggiornamento from './CellaAggiornamento';

// Un Utente può creare molti Modelli
Utente.hasMany(Modello, {
  foreignKey: 'creatore_id',
  as: 'modelliCreati', // Alias per la relazione
});
Modello.belongsTo(Utente, {
  foreignKey: 'creatore_id',
  as: 'creatore',
});

// Un Utente può fare molte Richieste di Aggiornamento
Utente.hasMany(RichiestaAggiornamento, {
  foreignKey: 'richiedente_id',
  as: 'richiesteFatte',
});
RichiestaAggiornamento.belongsTo(Utente, {
  foreignKey: 'richiedente_id',
  as: 'richiedente',
});

// Un Modello può avere molte Richieste di Aggiornamento
Modello.hasMany(RichiestaAggiornamento, {
  foreignKey: 'modello_id',
  as: 'richiesteRicevute',
});
RichiestaAggiornamento.belongsTo(Modello, {
  foreignKey: 'modello_id',
  as: 'modello',
});

// Una Richiesta di Aggiornamento può contenere molte modifiche di Celle
RichiestaAggiornamento.hasMany(CellaAggiornamento, {
  foreignKey: 'richiesta_id',
  as: 'celle',
});
CellaAggiornamento.belongsTo(RichiestaAggiornamento, {
  foreignKey: 'richiesta_id',
  as: 'richiesta',
});

export { Utente, Modello, RichiestaAggiornamento, CellaAggiornamento };

import Database from '../utils/database';

// Export sequelize instance for tests
export const sequelize = Database.getInstance();

/**
 * Funzione per attendere che il database sia disponibile
 */
const waitForDatabase = async (maxRetries = 10, delay = 5000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await Database.getInstance().authenticate();
      console.log('[DATABASE] Connessione al database stabilita con successo.');
      return;
    } catch (error) {
      console.log(`[DATABASE] Tentativo ${i + 1}/${maxRetries} fallito. Riprovo tra ${delay/1000} secondi...`);
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Funzione per sincronizzare i modelli con il database.
 * Crea le tabelle se non esistono o le aggiorna se sono cambiate.
 */
export const initDb = async () => {
  try {
    // Prima attende che il database sia disponibile
    await waitForDatabase();
    
    // Poi sincronizza i modelli
    await Database.getInstance().sync({ alter: true });
    console.log('[DATABASE] Tabelle del database sincronizzate con successo.');
  } catch (error) {
    console.error('[ERROR] Impossibile sincronizzare le tabelle del database:', error);
    process.exit(1);
  }
};